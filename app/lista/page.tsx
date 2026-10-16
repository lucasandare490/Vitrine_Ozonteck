'use client';

import { useCartStore } from '@/store/useCartStore';
import { ArrowLeft, Trash2, Image as ImageIcon, Plus, Minus, Truck, Home, Briefcase, User, CreditCard, Phone, Mail, Package, ShieldCheck, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useRef, ReactNode, useMemo, type ComponentProps } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import LoginModal from '@/components/LoginModal';
import { isValidCpf } from '@/lib/auth';
import CheckoutPayment from '@/components/CheckoutPayment';
import OrderPayment from '@/components/OrderPayment';
import OrderConfirmationPreview from '@/components/OrderConfirmationPreview';
import { useStorePricing } from '@/components/StorePricing';
import { syncCartForUser } from '@/lib/cart-session';

import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY as string, { locale: 'pt-BR' });

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RevealOnScroll = ({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(`transition-all duration-700 ease-out`, isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4', className)}
    >
      {children}
    </div>
  );
};

type CustomerData = {
  name: string; email: string; cpf: string; phone: string; zipCode: string; street: string; number: string; complement: string; neighborhood: string; city: string; state: string;
}

type SavedAddress = {
  id: string;
  apelido?: string | null;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  principal?: boolean | null;
};

type CustomerProfile = {
  nome?: string | null;
  cpf?: string | null;
  telefone?: string | null;
  cep?: string | null;
  endereco_completo?: string | null;
};

type PaymentProps = ComponentProps<typeof Payment>;

export default function ListaDeInteresse() {
  const router = useRouter(); 
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null); 
  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>('new');

  const [imagesMap, setImagesMap] = useState<Record<string, string>>({}); 
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment'>('cart');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success'>('idle');
  const [previewRequested, setPreviewRequested] = useState(false);
  const preview = process.env.NODE_ENV === 'development' && previewRequested;
  const showConfirmation = paymentStatus === 'success' || preview;
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; status: string; total: number; count: number } | null>(null);
  
  // Estado para o salvamento "fantasma" no banco
  const [isSavingData, setIsSavingData] = useState(false);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '', email: '', cpf: '', phone: '', zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
  });
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'entrega' | 'retirada'>('entrega');
  const checkoutAttemptKey = useRef<string | null>(null);
  const changeId = useRef<string | null>(null);
  const cepRequest = useRef(0);

  const storedItems = useCartStore((state) => state.items);
  const pricing = useStorePricing();
  const items = useMemo(() => storedItems.map(item => ({ ...item, price: Number(pricing.prices[item.code] ?? item.price) })), [storedItems, pricing.prices]);
  const pricesReady = pricing.ready && items.every(item => pricing.prices[item.code] !== undefined);
  const currentTotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0) / 100;
  const addItem = useCartStore((state) => state.addItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCallback(() => currentTotal, [currentTotal]);
  const cartSignature = useMemo(
    () => items.map((item) => `${item.code}:${item.quantity}:${item.price}`).sort().join('|'),
    [items],
  );

  useEffect(() => {
    checkoutAttemptKey.current = null;
  }, [cartSignature]);

  const handleSelectAddress = useCallback((addr: SavedAddress, profile?: CustomerProfile | null, email?: string) => {
    cepRequest.current++;
    setIsFetchingCep(false);
    setSelectedAddressId(addr.id);
    setCustomerData(prev => ({
      ...prev,
      email: email || prev.email,
      name: profile?.nome || prev.name,
      cpf: profile?.cpf || prev.cpf,
      phone: profile?.telefone || prev.phone,
      zipCode: addr.cep || '',
      street: addr.rua || '',
      number: addr.numero || '',
      neighborhood: addr.bairro || '',
      city: addr.cidade || '',
      state: addr.estado || '',
      complement: addr.complemento || '',
    }));
  }, []);

  const loadUserData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cpf, telefone, cep, endereco_completo')
        .eq('id', session.user.id)
        .single();
      const { data: addrs, error: addressError } = await supabase
        .from('enderecos')
        .select('id, apelido, cep, rua, numero, complemento, bairro, cidade, estado, principal')
        .eq('user_id', session.user.id)
        .order('principal', { ascending: false });
      
      if (addressError) { toast.error('Não foi possível carregar seus endereços. Tente novamente antes de continuar.'); return; }
      if (addrs && addrs.length > 0) {
        setSavedAddresses(addrs);
        handleSelectAddress(addrs[0], profile, session.user.email);
      } else {
        setSavedAddresses([]);
        setCustomerData(prev => ({
          ...prev, email: session.user.email || '', name: profile?.nome || '', cpf: profile?.cpf || '', phone: profile?.telefone || ''
        }));
        setSelectedAddressId('new');
      }
    }
      const requestedChange = new URLSearchParams(window.location.search).get('alteracao');
      if (requestedChange && !changeId.current && session?.user) {
        const { data: change, error: changeError } = await supabase.from('pedido_alteracoes').select('id,antes,novo_pedido_id').eq('id', requestedChange).eq('user_id', session.user.id).single();
        if (changeError || !change) { toast.error('Esta alteração não está disponível. Consulte Meus pedidos.'); return; }
        changeId.current = change.id;
        checkoutAttemptKey.current = `change-${change.id}`;
        if (change.novo_pedido_id) {
          const { data: existing } = await supabase.from('pedidos').select('id,status,valor_total,itens,id_pagamento_mp').eq('id', change.novo_pedido_id).eq('user_id', session.user.id).single();
          if (existing?.id_pagamento_mp) { setConfirmedOrder({ id: existing.id, status: existing.status, total: Number(existing.valor_total), count: existing.itens.length }); setPaymentStatus('success'); return; }
        }
        const previous = change.antes as { itens: { code: string; nome: string; qtd: number; preco_unitario: number }[]; endereco: Record<string, string> };
        await syncCartForUser(session.user.id);
        const cart = useCartStore.getState();
        const sameCart = cart.items.length === previous.itens.length && previous.itens.every(item => cart.items.some(current => current.code === item.code && current.quantity === item.qtd));
        if (cart.items.length && !sameCart) { changeId.current = null; toast.error('Seu carrinho contém outros produtos. Esvazie-o antes de retomar esta alteração.'); return; }
        cart.selectOwner(session.user.id);
        cart.replaceItems(previous.itens.map(item => ({ id: item.code, code: item.code, name: item.nome, quantity: item.qtd, price: Number(item.preco_unitario), estoque: item.qtd })));
        const a = previous.endereco || {};
        setCustomerData(prev => ({ ...prev, name: a.nome || '', phone: a.telefone || '', street: a.rua || '', number: a.numero || '', complement: a.complemento || '', neighborhood: a.bairro || '', city: a.cidade || '', state: a.estado || '', zipCode: a.cep || '' }));
        setDeliveryMode(a.modalidade === 'retirada' ? 'retirada' : 'entrega');
        setSelectedAddressId('new');
        setCheckoutStep('address');
      }
  }, [handleSelectAddress]);

  useEffect(() => {
    async function loadInitialData() {
      const { data: prodData } = await supabase.from('produtos').select('code, image_url').eq('is_deleted', false);
      if (prodData) {
        const map: Record<string, string> = {};
        prodData.forEach(item => { map[item.code] = item.image_url; });
        setImagesMap(map);
      }
      await loadUserData();
      setIsMounted(true);
    }
    loadInitialData();
  }, [loadUserData]);

  const handleSelectNewAddress = () => {
    cepRequest.current++;
    setIsFetchingCep(false);
    setSelectedAddressId('new');
    setCustomerData(prev => ({
      ...prev,
      zipCode: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: ''
    }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const request = ++cepRequest.current;
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    
    setCustomerData(prev => ({ ...prev, zipCode: value }));
    setIsFetchingCep(false);

    if (value.replace('-', '').length === 8) {
      setIsFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${value.replace('-', '')}/json/`);
        const data = await res.json();
        if (request !== cepRequest.current) return;
        if (!data.erro) {
          setCustomerData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '' 
          }));
        }
      } catch {
        toast.error("Erro ao buscar CEP");
      } finally {
        if (request === cepRequest.current) setIsFetchingCep(false);
      }
    }
  };

  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    
    if (name === 'cpf') {
      value = value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0,11);
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else if (name === 'phone') {
      value = value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0,11);
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    } else if (name === 'number') {
      value = value.replace(/\D/g, '');
    }

    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  const handleProceedToDelivery = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      setCheckoutStep('address');
    }
  };

  const handleProceedToPayment = async () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (isSavingData || !isFormValid) return;

    setIsSavingData(true);
    try {
      // 1. Vincula o CPF e o WhatsApp definitivamente ao perfil do usuário no Banco
      const { error: profileError } = await supabase.from('profiles').update({
        cpf: customerData.cpf,
        telefone: customerData.phone,
      }).eq('id', user.id).select('id').single();
      if (profileError) throw profileError;

      // 2. Se for um endereço novo, salva ele na agenda de endereços do usuário
      if (selectedAddressId === 'new') {
        const { data: newAddr, error } = await supabase.from('enderecos').insert({
          user_id: user.id,
          apelido: 'Meu Endereço',
          cep: customerData.zipCode,
          rua: customerData.street,
          numero: customerData.number,
          complemento: customerData.complement,
          bairro: customerData.neighborhood,
          cidade: customerData.city,
          estado: customerData.state,
          principal: savedAddresses.length === 0 // Se for o primeiro, vira principal
        }).select('id, apelido, cep, rua, numero, complemento, bairro, cidade, estado, principal').single();
        if (error || !newAddr) throw error || new Error('Endereço não salvo.');

        if (!error && newAddr) {
          setSavedAddresses(prev => [newAddr, ...prev]);
          setSelectedAddressId(newAddr.id);
        }
      }

      // Tudo salvo no banco! Libera para o Mercado Pago
      setCheckoutStep('payment');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Não foi possível salvar seus dados. Confira a conexão e tente novamente antes de pagar.');
    } finally {
      setIsSavingData(false);
    }
  };

  const cpfClean = customerData.cpf.replace(/\D/g, '');
  const cepClean = customerData.zipCode.replace(/\D/g, '');
  
  const isFormValid =
    customerData.email.length > 3
      && customerData.name.length > 2
      && /^\d{10,11}$/.test(customerData.phone.replace(/\D/g, ''))
      && cepClean.length === 8
      && Boolean(customerData.number)
      && Boolean(customerData.street.trim() && customerData.neighborhood.trim() && customerData.city.trim())
      && /^[A-Za-z]{2}$/.test(customerData.state)
      && isValidCpf(cpfClean);

  const names = customerData.name.trim().split(' ');
  const firstName = names[0] || '';
  const lastName = names.slice(1).join(' ') || '';

  const initialization = useMemo(() => ({
    amount: Number(getTotal().toFixed(2)),
    payer: {
      email: customerData.email,
      firstName: firstName,
      lastName: lastName,
      identification: { type: "CPF", number: cpfClean },
      address: {
        zipCode: cepClean,
        streetName: customerData.street,
        streetNumber: customerData.number,
        neighborhood: customerData.neighborhood,
        city: customerData.city,
        federalUnit: customerData.state,
      }
    }
  }), [getTotal, customerData, firstName, lastName, cpfClean, cepClean]);

  if (!isMounted) return null;

  const onSubmit: PaymentProps['onSubmit'] = async ({ formData }) => {
    if (!pricesReady) throw new Error('Aguarde a confirmação dos preços.');
    const { data: { session } } = await supabase.auth.getSession();
    const idempotencyKey = changeId.current ? `change-${changeId.current}` : checkoutAttemptKey.current ?? crypto.randomUUID();
    checkoutAttemptKey.current = idempotencyKey;
    const enhancedFormData = {
      ...formData,
      expected_total: currentTotal,
      cart_items: items.map(i => ({ code: i.code, quantity: i.quantity })),
      description: items.map(i => `${i.quantity}x ${i.name}`).join(', '),
      metadata: {
        phone: customerData.phone,
        complement: customerData.complement,
        delivery_mode: deliveryMode,
        user_id: session?.user.id || null,
      },
      payer: {
        ...formData.payer,
        email: customerData.email,
        first_name: firstName || 'Cliente',
        last_name: lastName || 'Sem Sobrenome',
        identification: { type: 'CPF', number: cpfClean },
        address: {
          zip_code: cepClean,
          street_name: customerData.street || 'Não informado',
          street_number: customerData.number || 'S/N',
          neighborhood: customerData.neighborhood || 'Não informado',
          city: customerData.city || 'Não informado',
          federal_unit: customerData.state || 'PE',
        },
      },
    };

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': idempotencyKey,
    };

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...enhancedFormData, ...(changeId.current ? { change_id: changeId.current } : {}) }),
    });
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) window.dispatchEvent(new Event('store-pricing-changed'));
      if (!data.id) checkoutAttemptKey.current = null;
      throw new Error(data.error || 'Não foi possível processar o pagamento.');
    }

    if (data.status === 'approved' || data.status === 'in_process' || data.status === 'pending') {
      if (!data.order_id) throw new Error('Não foi possível obter o número do pedido. Consulte seus pedidos antes de tentar novamente.');
      setConfirmedOrder({ id: data.order_id, status: data.status, total: data.total, count: items.length });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setPaymentStatus('success');
      clearCart();
      return data;
    }

    checkoutAttemptKey.current = null;
    throw new Error(data.status_detail || 'Pagamento não aprovado.');
  };

  return (
    <main className="min-h-screen text-slate-900 bg-[#FAFAFC] relative flex flex-col overflow-hidden">

      <section className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-24 relative z-10 flex-1 flex flex-col">
        
        <RevealOnScroll delay={0} className="w-full mb-8">
          
          {!showConfirmation && (
            <button 
              onClick={() => checkoutStep === 'address' ? setCheckoutStep('cart') : checkoutStep === 'payment' ? setCheckoutStep('address') : router.push('/')}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-teal-600 mb-5 transition-colors uppercase tracking-widest"
            >
              <ArrowLeft size={12} /> {checkoutStep === 'cart' ? 'Voltar para a Loja' : 'Voltar à etapa anterior'}
            </button>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-5 border-b border-slate-200/60">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <Lock className="text-teal-600 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
                {preview || confirmedOrder?.status === 'approved' ? 'Pedido confirmado' : paymentStatus === 'success' ? 'Pagamento da compra' : 'Checkout Seguro'}
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">
                {preview ? 'Prévia da confirmação de pagamento.' : confirmedOrder?.status === 'approved' ? 'Pagamento aprovado. Acompanhe a preparação em Meus pedidos.' : paymentStatus === 'success' ? 'Seu pedido será confirmado após a aprovação do pagamento.' : 'Finalize sua compra com total segurança.'}
              </p>
              {process.env.NODE_ENV === 'development' && <button type="button" onClick={() => setPreviewRequested(value => !value)} className="mt-4 min-h-11 rounded-md border border-teal-200 px-4 text-sm font-semibold text-teal-800 hover:bg-teal-50">{preview ? 'Voltar à compra real' : 'Prévia do pedido confirmado'}</button>}
            </div>
            
            {!showConfirmation && (
              <div className="relative flex items-center bg-slate-100 p-1 rounded-full w-full md:w-[360px] shadow-inner border border-slate-200">
                <div
                  className="absolute top-1 bottom-1 bg-teal-600 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{
                    width: 'calc(33.333% - 2.66px)',
                    left: checkoutStep === 'cart' ? '4px' : checkoutStep === 'address' ? 'calc(33.333% + 1.33px)' : 'calc(66.666% - 1.33px)'
                  }}
                ></div>
                <div className={cn("relative z-10 flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 cursor-default", checkoutStep === 'cart' ? 'text-white' : 'text-slate-500')}>
                  1. Carrinho
                </div>
                <div className={cn("relative z-10 flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 cursor-default", checkoutStep === 'address' ? 'text-white' : 'text-slate-500')}>
                  2. Entrega
                </div>
                <div className={cn("relative z-10 flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 cursor-default", checkoutStep === 'payment' ? 'text-white' : 'text-slate-500')}>
                  3. Pagamento
                </div>
              </div>
            )}
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full relative z-20">
          
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            
            {showConfirmation && (
              <div className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 shadow-sm space-y-5">
                {!preview && <p className="mb-3 text-sm break-all">Referência da compra: {confirmedOrder?.id}</p>}
                {preview ? <OrderConfirmationPreview /> : confirmedOrder && <OrderPayment orderId={confirmedOrder.id} onStatusChange={status => setConfirmedOrder(previous => previous && previous.status !== status ? { ...previous, status } : previous)} />}
                <Link
                  href="/conta/pedidos"
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold py-3.5 px-8 rounded-lg transition-all shadow-sm"
                >
                  <Package size={18} /> Minhas compras e pagamentos
                </Link>
              </div>
            )}

            {!showConfirmation && items.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl px-5 py-10 sm:p-16 flex flex-col justify-center items-center text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-5">
                  <Package className="text-slate-300" size={28} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Carrinho Vazio</h3>
                <p className="text-slate-500 text-sm mb-8">Você ainda não selecionou nenhum produto para finalizar a compra.</p>
                <button onClick={() => router.push('/')} className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-3 px-8 rounded-lg shadow-sm transition-colors">
                  Explorar Vitrine
                </button>
              </div>
            )}

            {!showConfirmation && items.length > 0 && checkoutStep === 'cart' && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="flex flex-wrap gap-3 justify-between items-center p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Package size={18} className="text-teal-600" /> Produtos Selecionados
                  </h2>
                  <button onClick={clearCart} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition-colors uppercase tracking-widest">
                    <Trash2 size={14} /> Esvaziar
                  </button>
                </div>
                
                <div className="divide-y divide-slate-100 px-3 sm:px-6">
                  {items.map((item, index) => (
                    <RevealOnScroll key={item.id} delay={index * 50}>
                      <div className="flex flex-col sm:flex-row items-center gap-6 py-6">
                        <div className="flex items-center gap-4 flex-1 w-full">
                          <div className="relative w-20 h-20 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                            {imagesMap[item.code] ? <Image src={imagesMap[item.code]} alt={item.name} fill sizes="80px" className="object-cover" /> : <ImageIcon className="text-slate-300" size={20} />}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ref: {item.code}</p>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.name}</h3>
                            <div className="text-sm font-bold text-teal-700 mt-1">{pricesReady ? `R$ ${item.price.toFixed(2).replace('.', ',')}` : 'Preço a confirmar'}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between w-full sm:w-auto gap-2 sm:gap-8">
                          <div className="flex shrink-0 items-center bg-white border border-slate-200 rounded-lg shadow-sm h-11">
                            <button aria-label={`Diminuir quantidade de ${item.name}`} onClick={() => decreaseItem(item.id)} className="w-11 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-l-lg transition-colors"><Minus size={14} /></button>
                            <span className="w-6 sm:w-10 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                            <button aria-label={`Aumentar quantidade de ${item.name}`} onClick={() => addItem(item)} className="w-11 h-full flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded-r-lg transition-colors"><Plus size={14} /></button>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-4">
                            <span className="text-sm sm:text-base font-bold text-slate-900 sm:w-24 text-right">{pricesReady ? `R$ ${(item.quantity * item.price).toFixed(2).replace('.', ',')}` : '—'}</span>
                            <button aria-label={`Remover ${item.name} da lista`} onClick={() => removeItem(item.id)} className="min-h-11 min-w-11 text-slate-500 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>
            )}

            {!showConfirmation && items.length > 0 && checkoutStep === 'address' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                <fieldset className="rounded-lg border border-slate-200 bg-white p-5">
                  <legend className="px-2 font-semibold">Como deseja receber?</legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {([{ value: 'entrega', label: 'Receber no endereço', Icon: Truck }, { value: 'retirada', label: 'Retirar na loja', Icon: Home }] as const).map(({ value, label, Icon }) => <label key={value} className={cn('flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-4 py-3', deliveryMode === value ? 'border-teal-600 bg-teal-50 text-teal-900' : 'border-slate-300 text-slate-700')}><input className="accent-teal-700" type="radio" name="delivery-mode" checked={deliveryMode === value} onChange={() => setDeliveryMode(value)} /><Icon size={20} /><span className="font-semibold text-sm">{label}</span></label>)}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{deliveryMode === 'retirada' ? 'Retirada na R. da União, 295, Boa Vista, Recife. Aguarde o contato da loja para combinar a retirada. O endereço abaixo será usado para o pagamento.' : 'Disponibilidade, prazo e valor da entrega sujeitos à confirmação com a loja. O valor dos produtos não inclui frete.'}</p>
                </fieldset>
                
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <User size={18} className="text-teal-600"/>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Dados do Comprador</h2>
                  </div>
                  
                  <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><User size={16} className="text-slate-400" /></div>
                        <input name="name" value={customerData.name} onChange={handleCustomerDataChange} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800" placeholder="Ex: João da Silva"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">WhatsApp</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Phone size={16} className="text-slate-400" /></div>
                        <input name="phone" value={customerData.phone} onChange={handleCustomerDataChange} maxLength={15} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800" placeholder="(81) 90000-0000"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">E-mail</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><Mail size={16} className="text-slate-400" /></div>
                        <input type="email" name="email" value={customerData.email} onChange={handleCustomerDataChange} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800" placeholder="seu@email.com"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">CPF</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"><CreditCard size={16} className="text-slate-400" /></div>
                        <input name="cpf" value={customerData.cpf} onChange={handleCustomerDataChange} maxLength={14} className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800" placeholder="000.000.000-00"/>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <Truck size={18} className="text-teal-600"/>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{deliveryMode === 'retirada' ? 'Endereço de cobrança' : 'Local de Entrega'}</h2>
                  </div>

                  <div className="p-6 sm:p-8">
                    {deliveryMode === 'retirada' && <p className="mb-4 text-sm text-slate-600">Este endereço é usado no pagamento, não para entrega. Seu pedido será retirado na loja.</p>}
                    {user && savedAddresses.length > 0 && (
                      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedAddresses.map((addr) => (
                          <button type="button" aria-pressed={selectedAddressId === addr.id}
                            key={addr.id} 
                            onClick={() => handleSelectAddress(addr)}
                            className={cn(
                              "p-5 rounded-lg border cursor-pointer transition-all flex items-start gap-4 shadow-sm text-left",
                              selectedAddressId === addr.id ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300'
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", selectedAddressId === addr.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500')}>
                              {addr.apelido?.toLowerCase() === 'trabalho' ? <Briefcase size={18} /> : <Home size={18} />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{addr.apelido || 'Endereço'}</h4>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{addr.rua}, {addr.numero}</p>
                              <p className="text-xs text-slate-600">{[addr.complemento, addr.bairro, addr.cidade, addr.estado].filter(Boolean).join(' · ')}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">CEP {addr.cep}</p>
                            </div>
                          </button>
                        ))}
                        <button type="button" onClick={handleSelectNewAddress} className={cn("p-5 rounded-lg border border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[110px]", selectedAddressId === 'new' ? 'border-teal-500 bg-teal-50/30 text-teal-700' : 'border-slate-300 bg-slate-50/50 text-slate-500 hover:border-teal-400 hover:text-teal-600')}>
                          <Plus size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest">Novo endereço</span>
                        </button>
                      </div>
                    )}

                    {selectedAddressId === 'new' && (
                      <div className="grid grid-cols-12 gap-5">
                        <div className="col-span-12 sm:col-span-4">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                            <span>CEP</span> {isFetchingCep && <span className="text-teal-500 lowercase font-normal">(buscando)</span>}
                          </label>
                          <input name="zipCode" value={customerData.zipCode} onChange={handleCepChange} maxLength={9} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800" placeholder="00000-000"/>
                        </div>
                        <div className="col-span-12 sm:col-span-6">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Rua / Logradouro</label>
                          <input name="street" value={customerData.street} onChange={handleCustomerDataChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none shadow-sm text-slate-600" readOnly={isFetchingCep}/>
                        </div>
                        <div className="col-span-12 sm:col-span-2">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nº</label>
                          <input name="number" value={customerData.number} onChange={handleCustomerDataChange} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800" placeholder="123"/>
                        </div>

                        <div className="col-span-12 sm:col-span-4">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between"><span>Complemento</span><span className="text-[9px] text-slate-400 font-normal">(Opcional)</span></label>
                          <input name="complement" value={customerData.complement} onChange={handleCustomerDataChange} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all shadow-sm placeholder:text-slate-400 text-slate-800" placeholder="Apto, Casa..."/>
                        </div>
                        <div className="col-span-12 sm:col-span-4">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Bairro</label>
                          <input name="neighborhood" value={customerData.neighborhood} onChange={handleCustomerDataChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none shadow-sm text-slate-600" readOnly={isFetchingCep}/>
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cidade</label>
                          <input name="city" value={customerData.city} onChange={handleCustomerDataChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none shadow-sm text-slate-600" readOnly={isFetchingCep}/>
                        </div>
                        <div className="col-span-12 sm:col-span-1">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">UF</label>
                          <input name="state" value={customerData.state} onChange={handleCustomerDataChange} maxLength={2} className="w-full px-2 py-2.5 text-sm uppercase text-center bg-slate-50 border border-slate-200 rounded-lg outline-none shadow-sm text-slate-600" readOnly={isFetchingCep}/>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!showConfirmation && items.length > 0 && checkoutStep === 'payment' && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500 w-full">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <CreditCard size={18} className="text-teal-600"/>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Finalizar Pagamento</h2>
                </div>
                <div className="p-2 sm:p-4">
                  {pricesReady ? <CheckoutPayment key={currentTotal} initialization={initialization} onSubmit={onSubmit} /> : <p role="status">Não foi possível confirmar os preços. Atualize a página antes de pagar.</p>}
                </div>
              </div>
            )}
            
          </div>

          <div className="lg:col-span-5 xl:col-span-4 shrink-0 lg:sticky lg:top-8 transition-all duration-700 w-full">
            <RevealOnScroll delay={100}>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                
                <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-teal-600" /> Resumo do Pedido
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-slate-600 text-sm">
                      <span className="font-medium">Produtos ({confirmedOrder?.count ?? items.length})</span>
                      <span className="text-slate-900 font-bold">{confirmedOrder || pricesReady ? `R$ ${(confirmedOrder?.total ?? getTotal()).toFixed(2).replace('.', ',')}` : 'A confirmar'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 text-sm">
                      <span className="font-medium">{deliveryMode === 'retirada' ? 'Recebimento' : 'Frete'}</span>
                      <span className="text-teal-700 font-bold text-sm">{deliveryMode === 'retirada' ? 'Retirada na loja' : 'A confirmar com a loja'}</span>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-slate-200 flex justify-between items-end">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total a Pagar</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tighter">{confirmedOrder || pricesReady ? `R$ ${(confirmedOrder?.total ?? getTotal()).toFixed(2).replace('.', ',')}` : 'A confirmar'}</p>
                  </div>
                </div>

                <div className="p-6 bg-white flex flex-col gap-3">
                  {!pricesReady && !confirmedOrder && <p role="status" className="text-sm text-amber-800">{pricing.error ? 'Não foi possível consultar os preços. Atualize a página para tentar novamente.' : pricing.ready ? 'Há um produto indisponível na lista. Remova-o para continuar.' : 'Consultando os preços da sua conta…'}</p>}
                  
                  {checkoutStep === 'cart' && !showConfirmation && (
                    <button disabled={!pricesReady} onClick={handleProceedToDelivery} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-wider shadow-sm disabled:opacity-40">
                      Continuar para Entrega
                    </button>
                  )}
                  
                  {checkoutStep === 'address' && !showConfirmation && (
                    <>
                      {/* O BOTÃO MÁGICO QUE SALVA OS DADOS NO BANCO EM SEGUNDO PLANO */}
                      <button 
                        onClick={handleProceedToPayment} 
                        disabled={!isFormValid || isSavingData || !pricesReady}
                        className="w-full flex items-center justify-center bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-wider shadow-sm"
                      >
                        {isSavingData ? <Loader2 className="animate-spin text-teal-600" size={18} /> : 'Ir para Pagamento'}
                      </button>
                      <button onClick={() => setCheckoutStep('cart')} className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 font-bold py-3 rounded-lg transition-colors text-xs uppercase tracking-widest">
                        Voltar ao Carrinho
                      </button>
                    </>
                  )}

                  {checkoutStep === 'payment' && !showConfirmation && (
                    <button onClick={() => setCheckoutStep('address')} className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 font-bold py-3 rounded-lg transition-colors text-xs uppercase tracking-widest">
                      {deliveryMode === 'retirada' ? 'Revisar dados e retirada' : 'Revisar entrega'}
                    </button>
                  )}

                  <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-start gap-3">
                    <Lock size={16} className="text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Pagamento Protegido</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Os dados do cartão são enviados ao Mercado Pago e não são armazenados pela Ozonteck.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </RevealOnScroll>
          </div>

        </div>
      </section>

      <LoginModal 
        isOpen={isLoginModalOpen} 
        message="Para continuar e finalizar seu pedido de forma segura, acesse sua conta ou cadastre-se rapidamente."
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={async () => {
          setIsLoginModalOpen(false);
          await loadUserData();
          setCheckoutStep('address');
        }} 
      />

    </main>
  );
}
