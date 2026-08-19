'use client';

import { useCartStore } from '@/store/useCartStore';
import { ArrowLeft, Trash2, Image as ImageIcon, Plus, Minus, FileText, MapPin, Truck, CheckCircle2, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
      className={cn(`transition-all duration-700 ease-out`, isVisible ? 'opacity-100' : 'opacity-0', className)}
    >
      {children}
    </div>
  );
};

const OzoneBackground = () => (
  <div className="fixed inset-0 z-0 overflow-hidden bg-[#FAFAFC] pointer-events-none">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes float1 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(150px, -100px) scale(1.05); }
        66% { transform: translate(-100px, 120px) scale(0.95); }
      }
      @keyframes float2 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(-150px, 150px) scale(1.05); }
      }
    `}} />
    <div className="absolute top-[5%] left-[-10%] sm:left-[5%] opacity-70" style={{ animation: 'float1 25s ease-in-out infinite' }}>
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-64 h-64 bg-teal-300/60 rounded-full blur-[80px] absolute -left-20 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="w-56 h-56 bg-cyan-300/60 rounded-full blur-[80px] absolute top-20 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
      </div>
    </div>
    <div className="absolute top-[60%] right-[-10%] sm:right-[10%] opacity-60" style={{ animation: 'float2 30s ease-in-out infinite' }}>
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-72 h-72 bg-cyan-300/50 rounded-full blur-[90px] absolute -left-10 animate-[pulse_12s_ease-in-out_infinite_alternate]"></div>
        <div className="w-80 h-80 bg-teal-300/60 rounded-full blur-[100px] absolute -right-20 animate-[pulse_9s_ease-in-out_infinite]"></div>
      </div>
    </div>
  </div>
);

type CustomerData = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

export default function ListaDeInteresse() {
  const router = useRouter(); 
  const [isMounted, setIsMounted] = useState(false);
  const [user, setUser] = useState<any>(null); // NOVO: Estado do Usuário Logado
  
  const [imagesMap, setImagesMap] = useState<Record<string, string>>({}); 
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment'>('cart');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success'>('idle');
  
  const [generatedPaymentId, setGeneratedPaymentId] = useState<string>('');

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

  useEffect(() => {
    async function loadImages() {
      const { data } = await supabase.from('produtos').select('code, image_url');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(item => {
          map[item.code] = item.image_url;
        });
        setImagesMap(map);
      }
    }
    loadImages();
    setIsMounted(true);

    // NOVO: Verifica se o utilizador tem sessão ativa para liberar o checkout
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setCustomerData(prev => ({ ...prev, email: session.user.email || '' }));
      }
    });

  }, []);

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
        console.error("Erro ao buscar CEP", error);
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
    }
    if (name === 'phone') {
      value = value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0,11);
      value = value.replace(/(\d{2})(\d)/, '($1) $2');
      value = value.replace(/(\d{4,5})(\d{4})$/, '$1-$2');
    }

    setCustomerData(prev => ({ ...prev, [name]: value }));
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
      identification: {
        type: "CPF",
        number: customerData.cpf.replace(/\D/g, ''),
      },
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
    visual: {
      style: { theme: "default" },
      texts: { formTitle: "Pague com Crédito, Débito, Pix ou Boleto" }
    },
    paymentMethods: {
      ticket: "all",
      bankTransfer: "all",
      creditCard: "all",
      mercadoPago: "all",
    },
  } as any;

  const onSubmit = async ({ selectedPaymentMethod, formData }: any) => {
    return new Promise((resolve, reject) => {
      
      const enhancedFormData = {
        ...formData,
        cart_items: items,
        description: items.map(i => `${i.quantity}x ${i.name}`).join(', '),
        notification_url: 'https://headlines-broadcast-vital-disciplines.trycloudflare.com/api/webhook',
        metadata: { phone: customerData.phone },
        payer: {
          ...formData.payer,
          email: customerData.email,
          first_name: firstName || 'Cliente',
          last_name: lastName || 'Sem Sobrenome',
          identification: {
            type: "CPF",
            number: customerData.cpf.replace(/\D/g, '')
          },
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
        .catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  };

  const onError = async (error: any) => { console.log(error); };
  const onReady = async () => { console.log("Brick Carregado com sucesso!"); };

  const whatsappText = `Olá! Acabei de registrar um pedido na Vitrine Ozonteck.\n\n*Resumo do Pedido:*\n${items.map(i => `${i.quantity}x ${i.name}`).join('\n')}\n*Total:* R$ ${getTotal().toFixed(2).replace('.', ',')}\n\n*Entregar para:*\n${customerData.name}\n${customerData.phone}\n${customerData.street}, ${customerData.number} - ${customerData.neighborhood}\n${customerData.city}/${customerData.state} - CEP: ${customerData.zipCode}\n\nAguardando confirmação de pagamento!`;
  const whatsappLink = `https://wa.me/5581900000000?text=${encodeURIComponent(whatsappText)}`;

  const isFormValid = customerData.email.length > 3 && customerData.name.length > 2 && customerData.zipCode && customerData.number && customerData.cpf.length >= 14;

  return (
    <main className="min-h-screen text-slate-900 selection:bg-teal-600 selection:text-white relative flex flex-col">
      <OzoneBackground />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 pt-4 sm:pt-6 pb-10 relative z-10 flex-1 flex flex-col">
        
        <RevealOnScroll delay={100} className="w-full text-left mb-6">
          {paymentStatus !== 'success' && (
            <button 
              onClick={() => checkoutStep === 'address' ? setCheckoutStep('cart') : checkoutStep === 'payment' ? setCheckoutStep('address') : router.push('/')}
              className="inline-flex items-center text-xs lg:text-[13px] font-bold text-teal-700 bg-white hover:bg-teal-600 hover:text-white border border-teal-200/60 rounded-full px-5 py-2 mb-5 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer relative z-50"
            >
              <ArrowLeft className="mr-2 w-4 h-4" /> VOLTAR
            </button>
          )}

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 tracking-tight uppercase leading-none">
              {paymentStatus === 'success' ? 'Pedido Registrado!' : 'Finalizar Pedido'}
            </h1>
            {paymentStatus !== 'success' && (
              <div className="flex gap-4 mt-3">
                <div className={cn("text-xs font-bold uppercase transition-colors duration-500", checkoutStep === 'cart' ? 'text-teal-600' : 'text-slate-400')}>1. Carrinho</div>
                <div className="text-slate-300">/</div>
                <div className={cn("text-xs font-bold uppercase transition-colors duration-500", checkoutStep === 'address' ? 'text-teal-600' : 'text-slate-400')}>2. Endereço</div>
                <div className="text-slate-300">/</div>
                <div className={cn("text-xs font-bold uppercase transition-colors duration-500", checkoutStep === 'payment' ? 'text-teal-600' : 'text-slate-400')}>3. Pagamento</div>
              </div>
            )}
          </div>
        </RevealOnScroll>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start w-full relative z-20">
          
          <div className={cn(
            "w-full bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-[1.5rem] p-5 sm:p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] relative transition-all duration-500",
            paymentStatus === 'success' ? 'bg-teal-50/50 border-teal-100' : 'lg:flex-1'
          )}>
            
            {paymentStatus === 'success' && (
              <div className="p-5 sm:p-8 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in-[0.98] duration-700 bg-transparent">
                <CheckCircle2 size={64} className="text-teal-500 mb-5" />
                <h2 className="text-2xl font-black text-slate-800 mb-3">Tudo certo com os seus dados!</h2>
                
                <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-md mx-auto mb-6">
                  Seu pedido foi registrado em nosso sistema. Verifique as instruções de pagamento no painel ao lado. Se escolheu Pix ou Boleto, você pode concluí-lo por lá!
                </p>
                
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-8 w-full max-w-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Comprovante enviado para</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{customerData.email}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
                  <a 
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => clearCart()}
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-sm font-bold py-3.5 px-6 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto cursor-pointer relative z-50"
                  >
                    <MessageCircle size={18} />
                    Avisar no WhatsApp
                  </a>
                  <button 
                    onClick={() => {
                      clearCart();
                      router.push('/');
                    }}
                    className="inline-flex justify-center items-center bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 font-bold py-3.5 px-6 rounded-full transition-all shadow-sm w-full sm:w-auto cursor-pointer relative z-50"
                  >
                    Voltar ao Catálogo
                  </button>
                </div>
              </div>
            )}

            {paymentStatus !== 'success' && items.length === 0 && (
              <div className="p-5 flex flex-col justify-center animate-in fade-in duration-500 bg-transparent text-center relative z-50">
                <FileText className="text-slate-300 mx-auto mb-5" size={40} />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum produto selecionado</h3>
                <p className="text-slate-500 text-sm mb-6 font-medium">Sua lista de interesse está vazia no momento.</p>
                <button 
                  onClick={() => router.push('/')}
                  className="inline-flex justify-center items-center bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold py-2.5 px-6 rounded-full transition-all shadow-sm mx-auto cursor-pointer relative z-50"
                >
                  Navegar pelos produtos
                </button>
              </div>
            )}

            {paymentStatus !== 'success' && items.length > 0 && checkoutStep === 'cart' && (
              <div className="animate-in fade-in zoom-in-[0.98] duration-300 ease-out">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-2 relative z-50">
                  <h2 className="text-xs lg:text-sm font-black text-slate-800 uppercase tracking-wider">Revisão dos Itens</h2>
                  <button onClick={clearCart} className="flex items-center gap-1.5 text-[11px] lg:text-xs font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50/50 hover:bg-red-50 px-3 py-1.5 rounded-full border border-red-100 cursor-pointer">
                    <Trash2 size={14} /> Esvaziar
                  </button>
                </div>
                <div className="divide-y divide-slate-100/80">
                  {items.map((item, index) => (
                    <RevealOnScroll key={item.id} delay={100 + (index * 50)}>
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center py-4 relative group z-40">
                        <div className="col-span-6 flex items-center gap-3 lg:gap-4">
                          <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border border-slate-200/50 overflow-hidden relative">
                            {imagesMap[item.code] ? <img src={imagesMap[item.code]} alt={item.name} className="w-full h-full object-cover object-center" /> : <ImageIcon className="text-slate-300" size={16} />}
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-teal-600 uppercase mb-0.5">Ref: {item.code}</p>
                            <h3 className="text-xs lg:text-sm font-bold text-slate-900 leading-tight pr-2">{item.name}</h3>
                          </div>
                        </div>
                        <div className="hidden md:block col-span-2 text-center text-xs lg:text-sm font-semibold text-slate-600">R$ {item.price.toFixed(2).replace('.', ',')}</div>
                        <div className="col-span-12 md:col-span-2 flex justify-start md:justify-center mt-2 md:mt-0 relative z-50">
                          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                            <button onClick={() => decreaseItem(item.id)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"><Minus size={12} strokeWidth={2.5} /></button>
                            <span className="w-8 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                            <button onClick={() => addItem({ id: item.id, code: item.code, name: item.name, price: item.price, estoque: item.estoque })} className="w-6 h-6 flex items-center justify-center text-teal-600 hover:bg-teal-50 rounded-md transition-colors cursor-pointer"><Plus size={12} strokeWidth={2.5} /></button>
                          </div>
                        </div>
                        <div className="col-span-12 md:col-span-2 flex justify-between md:justify-end items-center mt-1 md:mt-0 relative z-50">
                          <div className="md:hidden text-[10px] font-bold text-slate-400 uppercase">Subtotal:</div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-teal-700">R$ {(item.quantity * item.price).toFixed(2).replace('.', ',')}</span>
                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer" title="Remover produto"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </RevealOnScroll>
                  ))}
                </div>
                <div className="mt-6 flex justify-end pb-2 relative z-50">
                  <button 
                    onClick={() => {
                      if (user) {
                        setCheckoutStep('address'); // Se estiver logado, avança para a entrega
                      } else {
                        router.push('/login'); // NOVO: Manda para o Login se não estiver autenticado
                      }
                    }} 
                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-md cursor-pointer"
                  >
                    Continuar para Entrega
                  </button>
                </div>
              </div>
            )}

            {paymentStatus !== 'success' && items.length > 0 && checkoutStep === 'address' && (
              <div className="animate-in fade-in zoom-in-[0.98] duration-300 ease-out bg-white/40">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-200 mb-6">
                  <Truck size={18} className="text-teal-600"/>
                  <h2 className="text-xs lg:text-sm font-black text-slate-800 uppercase tracking-wider">Dados de Entrega</h2>
                </div>
                
                <div className="space-y-4 relative z-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Nome Completo</label>
                      <input name="name" value={customerData.name} onChange={handleCustomerDataChange} onBlur={(e) => setCustomerData(prev => ({...prev, name: e.target.value}))} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ex: João da Silva"/>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">WhatsApp</label>
                      <input name="phone" value={customerData.phone} onChange={handleCustomerDataChange} maxLength={15} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="(81) 90000-0000"/>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">E-mail</label>
                      <input type="email" name="email" value={customerData.email} onChange={handleCustomerDataChange} onBlur={(e) => setCustomerData(prev => ({...prev, email: e.target.value}))} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="seu@email.com"/>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">CPF</label>
                      <input name="cpf" value={customerData.cpf} onChange={handleCustomerDataChange} maxLength={14} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="000.000.000-00"/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex justify-between">
                        CEP {isFetchingCep && <span className="text-teal-500 text-[9px]">Buscando...</span>}
                      </label>
                      <input name="zipCode" value={customerData.zipCode} onChange={handleCepChange} maxLength={9} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="00000-000"/>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Rua / Logradouro</label>
                      <input name="street" value={customerData.street} onChange={handleCustomerDataChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" readOnly/>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Número</label>
                      <input name="number" value={customerData.number} onChange={handleCustomerDataChange} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Complemento</label>
                      <input name="complement" value={customerData.complement} onChange={handleCustomerDataChange} className="w-full p-3 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Apto, Bloco, Casa..."/>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Bairro</label>
                      <input name="neighborhood" value={customerData.neighborhood} onChange={handleCustomerDataChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" readOnly/>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Cidade</label>
                      <input name="city" value={customerData.city} onChange={handleCustomerDataChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" readOnly/>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1.5">Estado</label>
                      <input name="state" value={customerData.state} onChange={handleCustomerDataChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none" readOnly/>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end pb-2 relative z-50">
                  <button 
                    onClick={() => setCheckoutStep('payment')} 
                    disabled={!isFormValid}
                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-full transition-all shadow-md cursor-pointer"
                  >
                    Ir para Pagamento
                  </button>
                </div>
              </div>
            )}

            {paymentStatus !== 'success' && items.length > 0 && checkoutStep === 'payment' && (
              <div className="animate-in fade-in duration-500 flex flex-col items-center justify-center bg-transparent py-10 relative z-50">
                <MapPin size={48} className="text-teal-300 mb-4"/>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Tudo pronto!</h3>
                <p className="text-sm text-slate-500 mb-8 text-center max-w-sm leading-relaxed">Seus dados de entrega já foram registrados em nosso sistema. Utilize o painel seguro ao lado para finalizar o pagamento.</p>
                <button onClick={() => setCheckoutStep('address')} className="text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline border border-teal-100 bg-teal-50 px-4 py-2 rounded-full transition-colors cursor-pointer">Revisar meus dados de entrega</button>
              </div>
            )}
          </div>

          <div className={cn(
            "w-full lg:w-[420px] xl:w-[480px] shrink-0 transition-all duration-500 relative z-50", 
            checkoutStep === 'payment' || paymentStatus === 'success' ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none'
          )}>
            <RevealOnScroll delay={400}>
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-lg shadow-slate-200/40 relative min-h-[400px]">
                
                {checkoutStep !== 'payment' && paymentStatus !== 'success' && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl">
                    <p className="text-sm font-bold text-slate-600 px-4 text-center bg-white py-2 rounded-lg shadow-sm border border-slate-100">
                      Preencha o endereço ao lado<br/>para liberar o pagamento.
                    </p>
                  </div>
                )}
                
                {paymentStatus !== 'success' && (
                  <>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 pb-3 border-b border-slate-100">Resumo</h3>
                    <div className="space-y-2 mb-4 text-xs font-medium">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Subtotal produtos</span>
                        <span>R$ {getTotal().toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-end mb-4 gap-2">
                      <p className="text-xs font-bold text-slate-800">Total a Pagar</p>
                      <p className="text-xl font-black text-teal-700">R$ {getTotal().toFixed(2).replace('.', ',')}</p>
                    </div>
                    
                    <div className="bg-teal-50 border border-teal-100 rounded-lg p-3 mb-4 flex items-center justify-center text-center animate-in fade-in duration-500">
                      <span className="text-xs font-bold text-teal-800">
                        💳 Na opção "Cartão de Crédito", você também pode usar o seu Débito!
                      </span>
                    </div>

                    <div className="w-full">
                      <Payment
                        initialization={initialization}
                        customization={customization}
                        onSubmit={onSubmit}
                        onReady={onReady}
                        onError={onError}
                      />
                    </div>
                  </>
                )}
                
                {paymentStatus === 'success' && generatedPaymentId && (
                  <div className="w-full animate-in fade-in duration-500">
                    <StatusScreen
                      initialization={{ paymentId: generatedPaymentId }}
                      onReady={() => console.log('Status Screen Ready')}
                      onError={(error) => console.log('Erro no Status Screen:', error)}
                    />
                  </div>
                )}
                
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </div>
    </main>
  );
}