'use client';

import { useState, useEffect, useRef, ReactNode, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { MapPin, Phone, Heart, ArrowUp, Search, MessageCircle, X, Bot } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setSearchQuery(q);
      setTimeout(() => {
        document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      setSearchQuery('');
    }

    async function loadProducts() {
      // Modificado para carregar APENAS os produtos que não estão na lixeira na hora que o site abre
      const { data, error } = await supabase.from('produtos').select('*').neq('is_deleted', true);
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchFavorites(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchFavorites(session.user.id);
      else setFavorites([]);
    });

    // SISTEMA DE TEMPO REAL QUE AGORA ENTENDE A LIXEIRA
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, (payload) => {
          
          if (payload.eventType === 'INSERT') {
            if (payload.new.is_deleted === true) return; // Se nasceu na lixeira, ignora
            
            setProducts((prev) => {
              const newProduct = {
                id: payload.new.id,
                code: payload.new.code,
                name: payload.new.name,
                category: payload.new.category,
                price: Number(payload.new.price),
                imagePlaceholder: payload.new.image_url,
                estoque: payload.new.estoque
              };
              const updatedList = [...prev, newProduct];
              return updatedList.sort((a, b) => {
                if (a.category < b.category) return -1;
                if (a.category > b.category) return 1;
                return a.name.localeCompare(b.name);
              });
            });
          } 
          else if (payload.eventType === 'UPDATE') {
            setProducts((currentProducts) => {
              // Se foi jogado na lixeira, remove da tela instantaneamente
              if (payload.new.is_deleted === true) {
                return currentProducts.filter(p => p.id !== payload.new.id);
              }

              // Se não está na lixeira, verifica se ele já existe na tela
              const exists = currentProducts.find(p => p.id === payload.new.id);
              
              if (exists) {
                // Atualiza o produto que já estava na tela
                return currentProducts.map((product) => {
                  if (product.id === payload.new.id) {
                    return { 
                      ...product, 
                      code: payload.new.code,
                      name: payload.new.name,
                      category: payload.new.category,
                      price: Number(payload.new.price),
                      imagePlaceholder: payload.new.image_url,
                      estoque: payload.new.estoque 
                    };
                  }
                  return product;
                });
              } else {
                // O produto foi Restaurado da lixeira! Precisamos adicioná-lo na tela.
                const restoredProduct = {
                  id: payload.new.id,
                  code: payload.new.code,
                  name: payload.new.name,
                  category: payload.new.category,
                  price: Number(payload.new.price),
                  imagePlaceholder: payload.new.image_url,
                  estoque: payload.new.estoque
                };
                const updatedList = [...currentProducts, restoredProduct];
                return updatedList.sort((a, b) => {
                  if (a.category < b.category) return -1;
                  if (a.category > b.category) return 1;
                  return a.name.localeCompare(b.name);
                });
              }
            });
          }
          else if (payload.eventType === 'DELETE') {
            setProducts((prev) => prev.filter((p) => p.id !== payload.old.id));
          }
        }
      ).subscribe();

    return () => {
      supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, [searchParams]);

  const fetchFavorites = async (userId: string) => {
    const { data } = await supabase.from('favoritos').select('produto_code').eq('user_id', userId);
    if (data) setFavorites(data.map(f => f.produto_code));
  };

  const toggleFavorite = async (produtoCode: string) => {
    if (!user) {
      toast.error('Faça login para salvar seus favoritos!');
      setTimeout(() => router.push('/login'), 1500); 
      return;
    }
    const isFav = favorites.includes(produtoCode);
    if (isFav) {
      setFavorites(prev => prev.filter(code => code !== produtoCode));
      await supabase.from('favoritos').delete().match({ user_id: user.id, produto_code: produtoCode });
    } else {
      setFavorites(prev => [...prev, produtoCode]);
      await supabase.from('favoritos').insert({ user_id: user.id, produto_code: produtoCode });
      toast.success('Produto salvo nos favoritos!'); 
    }
  };

  const categories = ['Todas', ...Array.from(new Set(products.map((p) => p.category)))];
  
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Todas' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const scrollToObject = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <section className="max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 pt-10 pb-16 sm:pt-16 sm:pb-20 flex flex-col items-center text-center relative z-10">
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
          <p className="text-sm sm:text-base text-slate-600 max-w-xl font-medium sm:font-light leading-relaxed mb-8 px-2 sm:px-0">
            Alta performance aplicada a cosméticos, saúde capilar e suplementação. 
            Bem-vindo à loja virtual oficial da nossa unidade na Boa Vista. A mesma excelência do nosso espaço físico, agora com a comodidade de comprar online.
          </p>
        </FadeInOnLoad>

        <FadeInOnLoad delay={500}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-5 sm:px-0">
            <button 
              onClick={() => scrollToObject('loja-fisica')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3 px-8 rounded-lg transition-all shadow-[0_8px_25px_rgb(13,148,136,0.3)] hover:-translate-y-0.5"
            >
              <MapPin size={18} className="text-white" />
              Visitar Loja Física
            </button>
          </div>
        </FadeInOnLoad>
      </section>

      <section id="catalogo" className="max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 pb-20 relative z-10 w-full min-h-[400px] scroll-mt-28">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-50">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">A carregar loja...</p>
          </div>
        ) : (
          <>
            <RevealOnScroll delay={50}>
              
              {searchQuery && (
                <div className="mb-8 bg-teal-50 border border-teal-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm max-w-4xl mx-auto">
                  <div className="flex items-center gap-2">
                    <Search size={18} className="text-teal-600" />
                    <p className="text-sm font-bold text-teal-800">Resultados para: <span className="text-teal-600">"{searchQuery}"</span></p>
                  </div>
                  <button onClick={() => {setSearchQuery(''); router.push('/');}} className="text-xs font-bold text-teal-600 hover:text-teal-800 underline uppercase tracking-widest">
                    Limpar Filtro
                  </button>
                </div>
              )}

              <div className="relative mb-8 sm:mb-12 flex justify-center max-w-4xl mx-auto">
                <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#FAFAFC] to-transparent z-10 pointer-events-none lg:hidden"></div>
                <div className="flex overflow-x-auto no-scrollbar gap-5 sm:gap-8 pb-3 snap-x snap-mandatory px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-slate-200 w-full justify-start lg:justify-center">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        if(searchQuery) { setSearchQuery(''); router.push('/'); }
                      }}
                      className={`text-xs sm:text-[13px] font-bold transition-all relative pb-3 -mb-[13px] whitespace-nowrap snap-start shrink-0 ${
                        selectedCategory === category && !searchQuery
                          ? 'text-teal-700 border-b-2 border-teal-600'
                          : 'text-slate-400 hover:text-slate-800'
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
                <p className="text-sm text-slate-500">Não conseguimos encontrar "{searchQuery}". Tente navegar pelas categorias.</p>
                <button 
                  onClick={() => {setSearchQuery(''); setSelectedCategory('Todas'); router.push('/');}}
                  className="mt-4 text-teal-600 font-bold text-xs hover:underline uppercase tracking-widest"
                >
                  Ver todo o catálogo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-4 gap-y-10 sm:gap-y-12">
                {filteredProducts.map((product, index) => (
                  <RevealOnScroll key={product.id} delay={index < 4 ? index * 100 : 0}>
                    <div className="relative group">
                      <button
                        onClick={(e) => {
                          e.preventDefault(); 
                          e.stopPropagation();
                          toggleFavorite(product.code);
                        }}
                        className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 hover:scale-110 hover:bg-white transition-all cursor-pointer opacity-90 hover:opacity-100"
                        title={favorites.includes(product.code) ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                      >
                        <Heart 
                          size={18} 
                          className={`transition-colors duration-300 ${favorites.includes(product.code) ? 'fill-red-500 text-red-500' : 'text-slate-300 hover:text-red-400'}`} 
                        />
                      </button>
                      
                      <ProductCard product={product} />
                    </div>
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

      <div className={`fixed bottom-24 right-5 sm:right-6 z-50 w-[300px] sm:w-[340px] bg-white rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden transition-all duration-300 origin-bottom-right ${isChatOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-slate-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-none">Assistente Virtual</p>
              <p className="text-teal-400 text-[10px] mt-1 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <button onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 bg-slate-50">
          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100 mb-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Olá! Sou a inteligência artificial da loja. Quer tirar uma dúvida rápida comigo ou prefere falar direto com o Rogério no WhatsApp?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <a 
              href="https://wa.me/5581900000000" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-bold py-3 rounded-xl transition-colors shadow-sm"
            >
              <Phone size={14} /> Falar no WhatsApp
            </a>
            <button 
              onClick={() => toast.success('A IA será conectada ao catálogo na Fase 2!', { icon: '🤖' })} 
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-teal-700 border border-teal-200 text-xs font-bold py-3 rounded-xl transition-colors"
            >
              <Bot size={14} /> Tirar Dúvida com a IA
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-5 sm:right-6 z-50 flex items-center justify-center w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-[0_10px_35px_rgba(13,148,136,0.3)] transition-transform hover:scale-110"
        title="Ajuda ou Dúvidas?"
      >
        {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isChatOpen && <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-[#FAFAFC] rounded-full animate-pulse"></span>}
      </button>
    </>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen text-slate-900 selection:bg-teal-600 selection:text-white relative overflow-hidden flex flex-col">
      <Suspense fallback={<div className="min-h-screen bg-[#FAFAFC]"></div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}