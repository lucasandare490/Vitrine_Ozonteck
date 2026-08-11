'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import FloatingCart from '@/components/FloatingCart';
import ProductCard from '@/components/ProductCard';
import { MapPin, Phone, Heart, ArrowDown, ArrowUp, Search, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const FadeInOnLoad = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50); 
    return () => clearTimeout(timer);
  }, []);
  return (
    <div style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 sm:translate-y-12'}`}>
      {children}
    </div>
  );
};

const RevealOnScroll = ({ children, delay = 0 }: { children: ReactNode; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.05 }); 
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 sm:translate-y-12'}`}>
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

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 1. CARREGAMENTO INICIAL
    async function loadProducts() {
      const { data, error } = await supabase.from('produtos').select('*');
      
      if (data) {
        const sortedData = data.sort((a, b) => {
           if (a.category < b.category) return -1;
           if (a.category > b.category) return 1;
           return a.name.localeCompare(b.name);
        });

        const formattedProducts = sortedData.map((item) => ({
          id: item.id,
          code: item.code,
          name: item.name,
          category: item.category,
          price: Number(item.price),
          imagePlaceholder: item.image_url,
          estoque: item.estoque
        }));
        setProducts(formattedProducts);
      }
      setIsLoading(false);
    }
    
    loadProducts();

    // 2. OUVINTE EM TEMPO REAL (REALTIME)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'produtos' },
        (payload) => {
          setProducts((currentProducts) => 
            currentProducts.map((product) => {
              if (product.id === payload.new.id) {
                return { ...product, estoque: payload.new.estoque };
              }
              return product;
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = ['Todas', ...Array.from(new Set(products.map((p) => p.category)))];
  
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const scrollToStore = () => {
    document.getElementById('loja-fisica')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen text-slate-900 selection:bg-teal-600 selection:text-white relative overflow-hidden flex flex-col">
      <OzoneBackground />

      <header className="w-full bg-[#FAFAFC]/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50">
        <nav className="w-full flex items-center justify-between px-5 sm:px-10 lg:px-16 py-3 sm:py-4 max-w-[1800px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 lg:gap-5">
            <div className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-teal-900 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-500 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2.5"/>
                <circle cx="7" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
                <circle cx="17" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
              </svg>
              OZONTECK<span className="text-teal-500">.</span>
            </div>
            <span className="text-[9px] lg:text-[11px] font-bold text-teal-600 sm:border-l sm:border-slate-300 sm:pl-4 lg:pl-5 uppercase tracking-widest mt-0.5 sm:mt-0">
              Unidade Recife
            </span>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-6">
            <Link 
              href="/sobre_cliente" 
              className="text-xs lg:text-[13px] font-bold bg-white border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 px-5 py-2 lg:px-6 lg:py-2 rounded-full transition-all shadow-sm hidden sm:block"
            >
              Nossa História
            </Link>
            
            <div className="text-[10px] sm:text-xs lg:text-[13px] font-bold text-slate-500 hidden sm:flex items-center gap-2 border-l border-slate-200 pl-4 lg:pl-6">
              <CheckCircle2 className="text-teal-500 w-3.5 h-3.5 lg:w-4 lg:h-4"/>
              Distribuidor Autorizado
            </div>
          </div>
        </nav>
      </header>

      <section className="max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 pt-10 pb-12 sm:pt-16 sm:pb-16 flex flex-col items-center text-center relative z-10">
        <FadeInOnLoad delay={200}>
          <div className="inline-block px-3 py-1 mb-5 rounded-full border border-teal-200/60 bg-teal-50/50 text-teal-700 text-[9px] sm:text-[10px] font-black tracking-widest uppercase backdrop-blur-md shadow-sm">
            Distribuidor Autorizado • Rogério André
          </div>
        </FadeInOnLoad>
        
        <FadeInOnLoad delay={300}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-4 sm:mb-6 leading-[1.05]">
            A ciência do ozônio.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-400">
              O seu bem-estar.
            </span>
          </h1>
        </FadeInOnLoad>

        <FadeInOnLoad delay={400}>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl font-medium sm:font-light leading-relaxed mb-6 px-2 sm:px-0">
            Alta performance aplicada a cosméticos, saúde capilar e suplementação. 
            Bem-vindo à vitrine oficial da nossa unidade na Boa Vista. Monte a sua seleção e fale diretamente connosco.
          </p>
        </FadeInOnLoad>

        <FadeInOnLoad delay={500}>
          <button 
            onClick={scrollToStore}
            className="group flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm py-2.5 sm:py-3 px-6 sm:px-8 rounded-full transition-all duration-300 shadow-[0_8px_25px_rgb(13,148,136,0.3)] hover:shadow-[0_8px_35px_rgb(13,148,136,0.5)] hover:-translate-y-1"
          >
            <MapPin size={16} className="text-teal-100" />
            <span>Ver Localização da Loja</span>
            <ArrowDown size={14} className="text-teal-200 group-hover:translate-y-1.5 transition-transform duration-300" />
          </button>
        </FadeInOnLoad>
      </section>

      <section className="max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 pb-20 relative z-10 w-full min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-50">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">A carregar catálogo...</p>
          </div>
        ) : (
          <>
            <RevealOnScroll delay={50}>
              <div className="max-w-2xl mx-auto mb-6 sm:mb-8 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={16} className="text-teal-600/50" />
                </div>
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou categoria..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-full text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="relative mb-8 sm:mb-12">
                <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#FAFAFC] to-transparent z-10 pointer-events-none lg:hidden"></div>
                <div className="flex overflow-x-auto no-scrollbar gap-3 sm:gap-5 pb-3 snap-x snap-mandatory pr-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-slate-200">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setSearchQuery('');
                      }}
                      className={`text-xs sm:text-[13px] font-bold transition-all relative pb-3 -mb-[13px] whitespace-nowrap snap-start shrink-0 ${
                        selectedCategory === category
                          ? 'text-teal-700 border-b-2 border-teal-600'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </RevealOnScroll>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Search size={20} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhum produto encontrado</h3>
                <p className="text-sm text-slate-500">Não conseguimos encontrar "{searchQuery}". Tente outro nome ou categoria.</p>
                <button 
                  onClick={() => {setSearchQuery(''); setSelectedCategory('Todas');}}
                  className="mt-4 text-teal-600 font-bold text-xs hover:underline"
                >
                  Ver todos os produtos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-10 sm:gap-y-12">
                {filteredProducts.map((product, index) => (
                  <RevealOnScroll key={product.id} delay={index < 4 ? index * 100 : 0}>
                    <ProductCard product={product} />
                  </RevealOnScroll>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <section id="loja-fisica" className="max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 pb-24 relative z-10 w-full scroll-mt-32">
        <RevealOnScroll>
          <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem] overflow-hidden flex flex-col md:flex-row">
            
            <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center bg-gradient-to-br from-white/80 to-teal-50/50 relative z-10">
              <span className="text-teal-600 font-black tracking-widest text-[9px] sm:text-[10px] uppercase mb-3 block">
                Visite Nossa Unidade
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 leading-tight">
                O seu ponto <span className="text-teal-600">Ozonteck</span> em Recife.
              </h2>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed font-medium">
                Mais do que produtos, oferecemos acompanhamento. Visite o nosso espaço na Boa Vista e receba um atendimento consultivo presencial com <strong className="text-slate-900">Rogério André</strong>, para entender exatamente quais os produtos ideais para os seus objetivos.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <MapPin className="text-teal-600" size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Endereço</p>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      R. da União, 295 - Boa Vista<br />
                      Recife - PE, 50050-015
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <Phone className="text-teal-600" size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-xs">Atendimento Direto</p>
                    <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                      Dúvidas? Adicione os produtos à lista e fale diretamente conosco via WhatsApp.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 min-h-[300px] md:min-h-full relative bg-slate-200">
              <iframe 
                src="https://maps.google.com/maps?q=R.%20da%20Uni%C3%A3o,%20295%20-%20Boa%20Vista,%20Recife%20-%20PE,%2050050-015&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0, position: 'absolute', top: 0, left: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Localização Ozonteck Unidade Recife"
              ></iframe>
            </div>

          </div>
        </RevealOnScroll>
      </section>

      <footer className="w-full border-t border-slate-200/60 bg-white/40 backdrop-blur-md pt-8 pb-6 mt-auto relative z-10 flex flex-col items-center">
        <div className="flex justify-center mb-8">
          <button 
            onClick={scrollToTop}
            className="group flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-teal-50 text-slate-500 hover:text-teal-700 border border-slate-200 hover:border-teal-200 font-bold text-[11px] sm:text-xs py-2 px-5 rounded-full transition-all duration-300"
          >
            <ArrowUp size={14} className="group-hover:-translate-y-1 transition-transform duration-300" />
            <span>Voltar ao Topo</span>
          </button>
        </div>

        <div className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-slate-900 font-bold text-xs">Ozonteck Unidade Recife</p>
            <p className="text-slate-500 text-[10px] mt-0.5">Distribuidor Autorizado: Rogério André © {new Date().getFullYear()}</p>
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-white/60 px-3 py-1.5 rounded-full border border-slate-100">
            <span>Desenvolvido com</span>
            <Heart size={10} className="text-teal-500 fill-teal-500 animate-pulse" />
            <span>por</span>
            <span className="font-bold text-slate-700 tracking-wide ml-0.5">Lucas André</span>
          </div>
        </div>
      </footer>

      <FloatingCart />
    </main>
  );
}