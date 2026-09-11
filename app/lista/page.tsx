'use client';

import { useCartStore } from '@/store/useCartStore';
import { ArrowLeft, Trash2, Image as ImageIcon, Plus, Minus, MapPin, Truck, CheckCircle2, MessageCircle, Home, Briefcase, User, CreditCard, Phone, Mail, Package, ShieldCheck, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import toast from 'react-hot-toast';
import LoginModal from '@/components/LoginModal';

import { initMercadoPago, Payment, StatusScreen } from '@mercadopago/sdk-react';

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

export default function ListaDeInteresse() {
  const router = useRouter(); 
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null); 
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>('new');

  const [imagesMap, setImagesMap] = useState<Record<string, string>>({}); 
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment'>('cart');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success'>('idle');
  const [generatedPaymentId, setGeneratedPaymentId] = useState<string>('');

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '', email: '', cpf: '', phone: '', zipCode: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: ''
  });
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const decreaseItem = useCartStore((state) => state.decreaseItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotal = useCartStore((state) => state.getTotal);

  const loadUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      setUser(session.user);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      const { data: addrs } = await supabase.from('enderecos').select('*').eq('user_id', session.user.id).order('principal', { ascending: false });
      
      if (addrs && addrs.length > 0) {
        setSavedAddresses(addrs);
        handleSelectAddress(addrs[0], profile, session.user.email);
      } else if (profile && profile.cep) {
        const fallbackAddress = { id: 'fallback', apelido: 'Endereço Principal', cep: profile.cep, rua: profile.endereco_completo?.split(',')[0] || '', numero: 'S/N', bairro: '', cidade: '', estado: '' };
        setSavedAddresses([fallbackAddress]);
        handleSelectAddress(fallbackAddress, profile, session.user.email);
      } else {
        setCustomerData(prev => ({
          ...prev, email: session.user.email || '', name: profile?.nome || '', cpf: profile?.cpf || '', phone: profile?.telefone || ''
        }));
        setSelectedAddressId('new');
      }
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      const { data: prodData } = await supabase.from('produtos').select('code, image_url');
      if (prodData) {
        const map: Record<string, string> = {};
        prodData.forEach(item => { map[item.code] = item.image_url; });
        setImagesMap(map);
      }
      await loadUserData();
      setIsMounted(true);
    }
    loadInitialData();
  }, []);

  const handleSelectAddress = (addr: any, profile?: any, email?: string) => {
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
      complement: ''
    }));
  };

  const handleSelectNewAddress = () => {
    setSelectedAddressId('new');
    setCustomerData(prev => ({
      ...prev,
      zipCode: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: ''
    }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    
    setCustomerData(prev => ({ ...prev, zipCode: value }));

    if (value.replace('-', '').length === 8) {
      setIsFetchingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${value.replace('-', '')}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCustomerData(prev => ({
            ...prev,
            street: data.logradouro || '',
            neighborhood: data.bairro || '',
            city: data.localidade || '',
            state: data.uf || '' 
          }));
        }
      } catch (error) {
        toast.error("Erro ao buscar CEP");
      } finally {
        setIsFetchingCep(false);
      }
    }
  };

  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;
    
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

  if (!isMounted) return null;

  const names = customerData.name.trim().split(' ');
  const firstName = names[0] || '';
  const lastName = names.slice(1).join(' ') || '';

  const initialization = {
    amount: Number(getTotal().toFixed(2)),
    payer: {
      email: customerData.email,
      firstName: firstName,
      lastName: lastName,
      identification: { type: "CPF", number: customerData.cpf.replace(/\D/g, '') },
      address: {
        zipCode: customerData.zipCode.replace(/\D/g, ''),
        streetName: customerData.street,
        streetNumber: customerData.number,
        neighborhood: customerData.neighborhood,
        city: customerData.city,
        federalUnit: customerData.state,
      }
    }
  };
  
  const customization = {
    visual: { style: { theme: "default" }, texts: { formTitle: "Pagamento Protegido" } },
    paymentMethods: { ticket: "all", bankTransfer: "all", creditCard: "all", mercadoPago: "all" },
  } as any;

  const onSubmit = async ({ formData }: any) => {
    return new Promise((resolve, reject) => {
      const enhancedFormData = {
        ...formData,
        cart_items: items,
        description: items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        notification_url: 'https://fruity-cows-listen.loca.lt/api/webhook',
        metadata: { phone: customerData.phone },
        payer: {
          ...formData.payer,
          email: customerData.email,
          first_name: firstName || 'Cliente',
          last_name: lastName || 'Sem Sobrenome',
          identification: { type: "CPF", number: customerData.cpf.replace(/\D/g, '') },
          address: {
            zip_code: customerData.zipCode.replace(/\D/g, ''),
            street_name: customerData.street || 'Não informado',
            street_number: customerData.number || 'S/N',
            neighborhood: customerData.neighborhood || 'Não informado',
            city: customerData.city || 'Não informado',
            federal_unit: customerData.state || 'PE'
          }
        }
      };

      fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enhancedFormData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === 'approved' || data.status === 'in_process' || data.status === 'pending') {
            setGeneratedPaymentId(String(data.id));
            setPaymentStatus('success');
            resolve(data); 
          } else {
            reject(data);
          }
        })
        .catch((error) => reject(error));
    });
  };

  const onReady = async () => { console.log('Brick Carregado'); };
  const onError = async (error: any) => { console.log(error); };

  const whatsappText = `Olá! Acabei de registrar um pedido na Vitrine Ozonteck.\n\n*Resumo do Pedido:*\n${items.map(i => `${i.quantity}x ${i.name}`).join('\n')}\n*Total:* R$ ${getTotal().toFixed(2).replace('.', ',')}\n\n*Entregar para:*\n${customerData.name}\n${customerData.phone}\n${customerData.street}, ${customerData.number} - ${customerData.neighborhood}\n${customerData.city}/${customerData.state} - CEP: ${customerData.zipCode}\n\nAguardando confirmação de pagamento!`;
  const whatsappLink = `https://wa.me/5581900000000?text=${encodeURIComponent(whatsappText)}`;

  const cpfClean = customerData.cpf.replace(/\D/g, '');
  const cepClean = customerData.zipCode.replace(/\D/g, '');
  const isFormValid = customerData.email.length > 3 && customerData.name.length > 2 && cepClean.length === 8 && customerData.number && cpfClean.length === 11;

  return (
    <main className="min-h-screen text-slate-900 bg-[#FAFAFC] relative flex flex-col overflow-hidden">

      <section className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-10 pb-24 relative z-10 flex-1 flex flex-col">
        
        <RevealOnScroll delay={0} className="w-full mb-8">
          
          {paymentStatus !== 'success' && (
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
                {paymentStatus === 'success' ? 'Pedido Registrado!' : 'Checkout Seguro'}
              </h1>
              <p className="text-slate-500 text-sm mt-1.5 font-medium">
                {paymentStatus === 'success' ? 'Acompanhe as instruções abaixo.' : 'Finalize sua compra com total segurança.'}
              </p>
            </div>
            
            {paymentStatus !== 'success' && (
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
            
            {paymentStatus === 'success' && (
              <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 shadow-sm flex flex-col justify-center items-center text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mb-6 border-8 border-teal-500/10">
                  <CheckCircle2 size={40} className="text-teal-500" strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Tudo certo com os seus dados!</h2>
                <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto mb-8">
                  Seu pedido foi registrado no sistema. Verifique as instruções de pagamento no painel ao lado (se via PIX ou Boleto) para que a logística seja iniciada.
                </p>
                <a 
                  href={whatsappLink} target="_blank" rel="noopener noreferrer" onClick={() => clearCart()}
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold py-3.5 px-8 rounded-lg transition-all shadow-sm"
                >
                  <MessageCircle size={18} /> Avisar Consultor no WhatsApp
                </a>
              </div>
            )}

            {paymentStatus !== 'success' && items.length === 0 && (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-16 flex flex-col justify-center items-center text-center animate-in fade-in duration-500">
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

            {paymentStatus !== 'success' && items.length > 0 && checkoutStep === 'cart' && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Package size={18} className="text-teal-600" /> Produtos Selecionados
                  </h2>
                  <button onClick={clearCart} className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1.5 transition-colors uppercase tracking-widest">
                    <Trash2 size={14} /> Esvaziar
                  </button>
                </div>
                
                <div className="divide-y divide-slate-100 px-6">
                  {items.map((item, index) => (
                    <RevealOnScroll key={item.id} delay={index * 50}>
                      <div className="flex flex-col sm:flex-row items-center gap-6 py-6">
                        <div className="flex items-center gap-4 flex-1 w-full">
                          <div className="w-20 h-20 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden shrink-0">
                            {imagesMap[item.code] ? <img src={imagesMap[item.code]} alt={item.name} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={20} />}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ref: {item.code}</p>
                            <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.name}</h3>
                            <div className="text-sm font-bold text-teal-700 mt-1">R$ {item.price.toFixed(2).replace('.', ',')}</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm h-10">
                            <button onClick={() => decreaseItem(item.id)} className="w-10 h-full flex items-center justify-center text-slate-500 hover:bg-slate-50 rounded-l-lg transition-colors"><Minus size={14} /></button>
                            <span className="w-10 text-center text-sm font-bold text-slate-800">{item.quantity}</span>
                            <button onClick={() => addItem(item)} className="w-10 h-full flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded-r-lg transition-colors"><Plus size={14} /></button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-base font-bold text-slate-900 w-24 text-right">R$ {(item.quantity * item.price).toFixed(2).replace('.', ',')}</span>
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        </div>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>
            )}

            {paymentStatus !== 'success' && items.length > 0 && checkoutStep === 'address' && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                
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
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Local de Entrega</h2>
                  </div>

                  <div className="p-6 sm:p-8">
                    {user && savedAddresses.length > 0 && (
                      <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {savedAddresses.map((addr) => (
                          <div 
                            key={addr.id} 
                            onClick={() => handleSelectAddress(addr)}
                            className={cn(
                              "p-5 rounded-xl border cursor-pointer transition-all flex items-start gap-4 shadow-sm",
                              selectedAddressId === addr.id ? 'border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/20' : 'border-slate-200 bg-white hover:border-teal-300'
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", selectedAddressId === addr.id ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-500')}>
                              {addr.apelido.toLowerCase() === 'trabalho' ? <Briefcase size={18} /> : <Home size={18} />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{addr.apelido}</h4>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{addr.rua}, {addr.numero}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">CEP {addr.cep}</p>
                            </div>
                          </div>
                        ))}
                        <div onClick={handleSelectNewAddress} className={cn("p-5 rounded-xl border border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[110px]", selectedAddressId === 'new' ? 'border-teal-500 bg-teal-50/30 text-teal-700' : 'border-slate-300 bg-slate-50/50 text-slate-500 hover:border-teal-400 hover:text-teal-600')}>
                          <Plus size={24} />
                          <span className="text-xs font-bold uppercase tracking-widest">Novo endereço</span>
                        </div>
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
                          <input name="street" value={customerData.street} onChange={handleCustomerDataChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none shadow-sm text-slate-600" readOnly={isFetchingCep || customerData.street !== ''}/>
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
                          <input name="neighborhood" value={customerData.neighborhood} onChange={handleCustomerDataChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none shadow-sm text-slate-600" readOnly={isFetchingCep || customerData.neighborhood !== ''}/>
                        </div>
                        <div className="col-span-12 sm:col-span-3">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Cidade</label>
                          <input name="city" value={customerData.city} onChange={handleCustomerDataChange} className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none shadow-sm text-slate-600" readOnly={isFetchingCep || customerData.city !== ''}/>
                        </div>
                        <div className="col-span-12 sm:col-span-1">
                          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">UF</label>
                          <input name="state" value={customerData.state} onChange={handleCustomerDataChange} className="w-full px-2 py-2.5 text-sm uppercase text-center bg-slate-50 border border-slate-200 rounded-lg outline-none shadow-sm text-slate-600" readOnly={isFetchingCep || customerData.state !== ''}/>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {paymentStatus !== 'success' && items.length > 0 && checkoutStep === 'payment' && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-500 w-full">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <CreditCard size={18} className="text-teal-600"/>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Finalizar Pagamento</h2>
                </div>
                <div className="p-2 sm:p-4">
                  <Payment initialization={initialization} customization={customization} onSubmit={onSubmit} onReady={onReady} onError={onError} />
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
                      <span className="font-medium">Produtos ({items.length})</span>
                      <span className="text-slate-900 font-bold">R$ {getTotal().toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 text-sm">
                      <span className="font-medium">Frete Expresso</span>
                      <span className="text-teal-700 font-bold bg-teal-50 px-2.5 py-0.5 rounded uppercase tracking-widest text-[10px] border border-teal-100">Grátis</span>
                    </div>
                  </div>
                  <div className="pt-5 border-t border-slate-200 flex justify-between items-end">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total a Pagar</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tighter">R$ {getTotal().toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>

                <div className="p-6 bg-white flex flex-col gap-3">
                  
                  {checkoutStep === 'cart' && paymentStatus !== 'success' && (
                    <button onClick={handleProceedToDelivery} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-wider shadow-sm">
                      Continuar para Entrega
                    </button>
                  )}
                  
                  {checkoutStep === 'address' && paymentStatus !== 'success' && (
                    <>
                      <button onClick={() => setCheckoutStep('payment')} disabled={!isFormValid} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-lg transition-colors text-sm uppercase tracking-wider shadow-sm">
                        Ir para Pagamento
                      </button>
                      <button onClick={() => setCheckoutStep('cart')} className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 font-bold py-3 rounded-lg transition-colors text-xs uppercase tracking-widest">
                        Voltar ao Carrinho
                      </button>
                    </>
                  )}

                  {checkoutStep === 'payment' && paymentStatus !== 'success' && (
                    <button onClick={() => setCheckoutStep('address')} className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 font-bold py-3 rounded-lg transition-colors text-xs uppercase tracking-widest">
                      Revisar Endereço
                    </button>
                  )}

                  <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg p-4 flex items-start gap-3">
                    <Lock size={16} className="text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Ambiente 100% Seguro</h4>
                      <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                        Seus dados são protegidos com criptografia de ponta a ponta. A Ozonteck não armazena os dados do seu cartão.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {paymentStatus === 'success' && generatedPaymentId && (
                <div className="w-full mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-500">
                  <StatusScreen initialization={{ paymentId: generatedPaymentId }} onReady={() => console.log('Status Screen Ready')} onError={(error) => console.log('Erro no Status Screen:', error)} />
                </div>
              )}
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