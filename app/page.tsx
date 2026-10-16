'use client';

import GoogleStoreReviewsLink from '@/components/GoogleStoreReviewsLink';
import { isRetiredProduct } from '@/lib/catalog-availability';
import { isHiddenTestProduct as isTestProduct } from '@/lib/products';
import { matchesPerfumeryVolume, type PerfumeryVolume } from '@/lib/perfumery-filter';

import { useState, useEffect, useRef, ReactNode, Suspense, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import PaginatedGrid from '@/components/PaginatedGrid';
import { MapPin, Phone, Heart, Search, MessageCircle, CheckCircle2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import LoginModal from '@/components/LoginModal';
import type { User } from '@supabase/supabase-js';
import type { Product } from '@/lib/data';

type PublicReview = {
  verificado?: boolean;
  id: string;
  nome_cliente: string;
  nota: number;
  comentario: string;
  created_at: string;
};

type DatabaseProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  price: number | string;
  image_url: string | null;
  estoque: number | null;
  is_deleted?: boolean | null;
};

function toProduct(item: DatabaseProduct): Product {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description || '',
    category: item.category,
    price: Number(item.price),
    imagePlaceholder: item.image_url || '',
    estoque: item.estoque ?? 0,
  };
}

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
  <div className="fixed inset-0 z-0 bg-[#FAFAFC] pointer-events-none flex justify-center overflow-hidden">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes float1 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        33% { transform: translate(120px, -80px) scale(1.05); }
        66% { transform: translate(-80px, 100px) scale(0.95); }
      }
      @keyframes float2 {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(-120px, 120px) scale(1.05); }
      }
    `}} />

    <div className="absolute top-[5%] left-[-10%] sm:left-[5%] opacity-60" style={{ animation: 'float1 25s ease-in-out infinite' }}>
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-80 h-80 bg-teal-300/50 rounded-full blur-[90px] absolute -left-20 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="w-72 h-72 bg-cyan-300/50 rounded-full blur-[90px] absolute top-20 animate-[pulse_10s_ease-in-out_infinite_alternate]"></div>
      </div>
    </div>

    <div className="absolute top-[55%] right-[-10%] sm:right-[10%] opacity-50" style={{ animation: 'float2 30s ease-in-out infinite' }}>
      <div className="relative flex items-center justify-center scale-100 sm:scale-110">
        <div className="w-[22rem] h-[22rem] bg-cyan-300/40 rounded-full blur-[100px] absolute -left-10 animate-[pulse_12s_ease-in-out_infinite_alternate]"></div>
        <div className="w-[26rem] h-[26rem] bg-teal-400/40 rounded-full blur-[110px] absolute -right-20 animate-[pulse_9s_ease-in-out_infinite]"></div>
      </div>
    </div>
  </div>
);

const AvaliacoesDaLoja = () => {
  const [page, setPage] = useState(1);
  const [legacy, setLegacy] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState<PublicReview[]>([]);
  const [estatisticas, setEstatisticas] = useState({ media: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function buscarAvaliacoes() {
      const { data: summary, error } = await supabase.rpc('listar_avaliacoes_loja', { p_pagina: page });
      if (!error && summary) {
        setAvaliacoes(summary.items);
        setEstatisticas({ total: summary.total, media: Number(Number(summary.average || 0).toFixed(1)) });
        setLegacy(false);
        setLoading(false);
        return;
      }
      // Keep the previous public selection available until the incremental SQL is installed.
      setLegacy(true);
      const { data } = await supabase
        .from('public_reviews')
        .select('id, nome_cliente, nota, comentario, created_at')
        .gte('nota', 4) 
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setAvaliacoes(data);
        const total = data.length;
        const soma = data.reduce((acc, curr) => acc + curr.nota, 0);
        const media = (soma / total).toFixed(1);
        setEstatisticas({ media: Number(media), total }); 
      }
      setLoading(false);
    }
    void buscarAvaliacoes();
  }, [page]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 340; 
      current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading || estatisticas.total === 0) return null; 

  return (
    <section className="w-full py-16 sm:py-24 relative z-10">
      <RevealOnScroll>
        <div className="max-w-[1600px] mx-auto px-5 sm:px-10 lg:px-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Experiências de compra no site</h2>
              <p className="text-slate-500 text-sm mt-1">{legacy ? 'Seleção de depoimentos com notas 4 e 5 sobre a experiência de compra.' : 'Opiniões sobre atendimento, entrega e embalagem, publicadas neste site.'}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
              <div className="text-3xl font-black text-slate-900 leading-none">{estatisticas.media}</div>
              <div>
                <div className="flex text-[#F59E0B] mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < Math.round(estatisticas.media) ? "#F59E0B" : "transparent"} strokeWidth={i < Math.round(estatisticas.media) ? 0 : 2} />
                  ))}
                </div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{legacy ? 'Média desta seleção' : 'Média das avaliações publicadas'} · {estatisticas.total} avaliações</div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <button 
              onClick={() => scroll('left')} 
              className="absolute -left-3 sm:-left-5 md:-left-6 lg:-left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-slate-600 hover:text-teal-600 hover:border-teal-300 transition-all hover:scale-110 hidden md:flex"
              title="Anterior"
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>

            <div ref={scrollRef} className="flex overflow-x-auto gap-4 sm:gap-6 py-4 px-1 -mx-1 pb-8 snap-x no-scrollbar scroll-smooth">
              {avaliacoes.map((av) => (
                <div key={av.id} className="w-[280px] md:w-[320px] shrink-0 bg-white border border-slate-200 rounded-2xl p-5 md:p-6 flex flex-col snap-start shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm border border-teal-100 shrink-0">
                        {av.nome_cliente.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{av.nome_cliente}</p>
                        <p className="text-[10px] text-teal-600 font-bold flex items-center gap-1 uppercase tracking-widest mt-0.5">
                          {av.verificado && <><CheckCircle2 size={10} strokeWidth={3} /> Compra verificada</>}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 text-[#F59E0B] mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < av.nota ? "#F59E0B" : "transparent"} strokeWidth={i < av.nota ? 0 : 2} />
                    ))}
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    &quot;{av.comentario}&quot;
                  </p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => scroll('right')} 
              className="absolute -right-3 sm:-right-5 md:-right-6 lg:-right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-slate-600 hover:text-teal-600 hover:border-teal-300 transition-all hover:scale-110 hidden md:flex"
              title="Próximo"
            >
              <ChevronRight size={24} strokeWidth={2.5} />
            </button>
          </div>
          {!legacy && estatisticas.total > 12 && <nav aria-label="Páginas de experiências de compra" className="mt-5 flex flex-wrap items-center gap-5"><button type="button" disabled={page===1} onClick={() => setPage(page-1)} className="min-h-11 text-teal-800 disabled:opacity-40">Anteriores</button><span>{page} de {Math.ceil(estatisticas.total/12)}</span><button type="button" disabled={page*12>=estatisticas.total} onClick={() => setPage(page+1)} className="min-h-11 text-teal-800 disabled:opacity-40">Próximas</button></nav>}
        </div>
      </RevealOnScroll>
    </section>
  );
};

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [perfumeryVolume, setPerfumeryVolume] = useState<PerfumeryVolume>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState('');

  async function fetchFavorites(userId: string) {
    const { data } = await supabase.from('favoritos').select('produto_code').eq('user_id', userId);
    if (data) setFavorites(data.map((favorite) => favorite.produto_code));
  }

  useEffect(() => {
    const q = searchParams.get('q');
    const timer = window.setTimeout(() => {
      setSearchQuery(q ?? '');
      if (q) document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from('produtos')
        .select('id, code, name, description, category, price, image_url, estoque')
        .neq('is_deleted', true);
      if (error) {
        toast.error('Não foi possível carregar o catálogo.');
        setIsLoading(false);
        return;
      }
      if (data) {
        const sortedData = data.sort((a, b) => {
           if (a.category < b.category) return -1;
           if (a.category > b.category) return 1;
           return a.name.localeCompare(b.name);
        });
        const formattedProducts = sortedData.filter((item) => !isRetiredProduct(item) && !isTestProduct(item)).map(toProduct);
        setProducts(formattedProducts);
      }
      setIsLoading(false);
    }

    void loadProducts();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) void fetchFavorites(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) void fetchFavorites(session.user.id);
      else setFavorites([]);
    });

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            if (payload.new.is_deleted === true || isRetiredProduct(payload.new as DatabaseProduct) || isTestProduct(payload.new as DatabaseProduct)) return;
            setProducts((prev) => {
              const newProduct = toProduct(payload.new as DatabaseProduct);
              return [...prev, newProduct].sort((a, b) => {
                if (a.category < b.category) return -1; if (a.category > b.category) return 1; return a.name.localeCompare(b.name);
              });
            });
          } 
          else if (payload.eventType === 'UPDATE') {
            setProducts((currentProducts) => {
              if (payload.new.is_deleted === true || isRetiredProduct(payload.new as DatabaseProduct) || isTestProduct(payload.new as DatabaseProduct)) return currentProducts.filter(p => p.id !== payload.new.id);
              const exists = currentProducts.find(p => p.id === payload.new.id);
              if (exists) {
                return currentProducts.map((product) => {
                  if (product.id === payload.new.id) {
                    return toProduct(payload.new as DatabaseProduct);
                  }
                  return product;
                });
              } else {
                const restoredProduct = toProduct(payload.new as DatabaseProduct);
                return [...currentProducts, restoredProduct].sort((a, b) => {
                  if (a.category < b.category) return -1; if (a.category > b.category) return 1; return a.name.localeCompare(b.name);
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
  }, []);

  const toggleFavorite = async (produtoCode: string) => {
    if (!user) {
      setLoginModalMessage('Faça login ou crie sua conta rapidamente para favoritar produtos e facilitar suas compras.');
      setIsLoginModalOpen(true);
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
    window.dispatchEvent(new Event('atualizarFavoritos'));
  };

  const categories = useMemo(() => ['Todas', ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = Boolean(searchQuery.trim()) || selectedCategory === 'Todas' || product.category === selectedCategory;
      const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const matchesSearch = normalize(`${product.name} ${product.category} ${product.code}`).includes(normalize(searchQuery));
      const matchesVolume = Boolean(searchQuery.trim()) || selectedCategory !== 'Perfumaria' || matchesPerfumeryVolume(product.code, perfumeryVolume);
      return matchesCategory && matchesSearch && matchesVolume;
    });
  }, [products, selectedCategory, searchQuery, perfumeryVolume]);

  const scrollToObject = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <OzoneBackground />

      <section className="relative w-full pt-6 pb-8 sm:pt-16 sm:pb-20 z-10">
        <div className="max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 flex flex-col items-center text-center">

          <FadeInOnLoad delay={100}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-[10px] sm:text-xs font-bold tracking-widest uppercase shadow-sm">
              <CheckCircle2 size={14} className="text-teal-500" /> Distribuidor Autorizado • Rogério André
            </div>
          </FadeInOnLoad>

          <FadeInOnLoad delay={200}>
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black tracking-tight text-slate-900 mb-4 sm:mb-6 leading-[1.05]">
              A ciência do ozônio.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-400">
                O seu bem-estar.
              </span>
            </h1>
          </FadeInOnLoad>

          <FadeInOnLoad delay={300}>
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl font-medium leading-relaxed mb-5 sm:mb-10 px-2 sm:px-0">
              Alta performance aplicada a cosméticos, saúde capilar e suplementação. A mesma excelência do nosso espaço físico, agora com a comodidade de comprar online.
            </p>
          </FadeInOnLoad>

          <FadeInOnLoad delay={400}>
            <div className="grid grid-cols-2 sm:flex items-center justify-center gap-2 sm:gap-4 w-full sm:w-auto">
              <button 
                onClick={() => scrollToObject('catalogo')}
                className="min-h-11 w-full sm:w-auto flex items-center justify-center gap-2 bg-teal-600 text-white font-bold text-sm py-3 px-3 sm:py-4 sm:px-10 rounded-lg sm:rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
              >
                <Search size={18} className="shrink-0" /> <span><span className="hidden sm:inline">Explorar </span>Catálogo</span>
              </button>
              <button 
                onClick={() => scrollToObject('loja-fisica')}
                className="min-h-11 w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-teal-700 border border-slate-200 font-bold text-sm py-3 px-3 sm:py-3.5 sm:px-10 rounded-lg sm:rounded-full transition-all shadow-sm hover:bg-slate-50"
              >
                <MapPin size={18} className="text-teal-600 shrink-0" /> <span><span className="hidden sm:inline">Visitar </span>Loja Física</span>
              </button>
            </div>
          </FadeInOnLoad>
        </div>
      </section>

      <section id="catalogo" className="max-w-[1800px] mx-auto px-5 sm:px-10 lg:px-16 pb-20 relative z-10 w-full min-h-[400px] scroll-mt-20">
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
                    <p className="text-sm font-bold text-teal-800">Resultados para: <span className="text-teal-600">&quot;{searchQuery}&quot;</span></p>
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
                        setPerfumeryVolume('all');
                        if(searchQuery) { setSearchQuery(''); router.push('/'); }
                      }}
                      className={`min-h-11 text-xs sm:text-[13px] font-bold transition-all relative pb-3 -mb-[13px] whitespace-nowrap snap-start shrink-0 ${
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

              {selectedCategory === 'Perfumaria' && (
                <fieldset className="mx-auto mb-8 w-fit max-w-full text-center">
                  <legend className="mb-2 text-sm font-semibold text-slate-700">Volume</legend>
                  <div className="inline-flex max-w-full rounded-lg border border-slate-200 bg-white p-1">
                    {(['all', '17', '100'] as const).map(volume => (
                      <label key={volume} className="relative cursor-pointer">
                        <input type="radio" name="perfumery-volume" value={volume}
                          checked={perfumeryVolume === volume}
                          onChange={() => setPerfumeryVolume(volume)}
                          className="peer sr-only" />
                        <span className="flex min-h-11 items-center justify-center rounded-md px-4 text-sm font-semibold text-slate-600 peer-checked:bg-teal-700 peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal-700">
                          {volume === 'all' ? 'Todos' : `${volume} ml`}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p role="status" className="mt-2 text-xs text-slate-500">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
                  </p>
                </fieldset>
              )}
            </RevealOnScroll>

            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Search size={20} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhum produto encontrado</h3>
                <p className="text-sm text-slate-500">Não conseguimos encontrar &quot;{searchQuery}&quot;. Tente navegar pelas categorias.</p>
                <button 
                  onClick={() => {setSearchQuery(''); setSelectedCategory('Todas'); router.push('/');}}
                  className="mt-4 text-teal-600 font-bold text-xs hover:underline uppercase tracking-widest"
                >
                  Ver todo o catálogo
                </button>
              </div>
            ) : (
              <PaginatedGrid key={`${selectedCategory}:${perfumeryVolume}:${searchQuery}`} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-3 sm:gap-x-4 gap-y-6 sm:gap-y-12">
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
              </PaginatedGrid>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="team-invitation-title" className="relative z-10 w-full border-t border-slate-200 bg-white px-5 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h2 id="team-invitation-title" className="text-xl font-bold text-slate-900">Conheça a equipe de Rogério André</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">Compre para consumo ou conheça a atuação como distribuidor independente. O preço de afiliado depende da aprovação de Rogério; criar uma conta não libera o benefício automaticamente.</p>
          </div>
          <Link href="/junte-se-a-nos" className="inline-flex min-h-11 shrink-0 items-center gap-2 font-bold text-teal-800 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700">Conhecer a equipe <ChevronRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>

      <section id="loja-fisica" className="w-full bg-white border-y border-slate-200 py-16 sm:py-24 relative z-10 scroll-mt-20">
        <RevealOnScroll>
          <div className="max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            
            <div className="w-full lg:w-5/12 flex flex-col justify-center text-left">
              <span className="inline-flex items-center justify-center w-max px-3 py-1.5 rounded-md bg-teal-50 border border-teal-100 text-teal-700 font-bold tracking-widest text-[10px] uppercase mb-5">
                Consultoria Especializada
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-5 leading-[1.1] tracking-tight">
                Mais do que produtos,<br/>
                <span className="text-teal-600">acompanhamento.</span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mb-10 leading-relaxed">
                Visite a nossa unidade na Boa Vista e converse com <strong className="text-slate-900">Rogério André</strong>. Nós te ajudamos a entender exatamente qual o protocolo Ozonteck ideal para o seu objetivo.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                    <MapPin className="text-teal-600" size={20} />
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-slate-900 text-sm">Onde estamos</p>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                      R. da União, 295 - Boa Vista<br />
                      Recife - PE, 50050-015
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                    <Phone className="text-teal-600" size={20} />
                  </div>
                  <div className="pt-1">
                    <p className="font-bold text-slate-900 text-sm">Atendimento Rápido</p>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed mb-4">
                      Dúvidas sobre o estoque? Fale direto conosco.
                    </p>
                    <a 
                      href="https://wa.me/5581981472684" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-bold py-3 px-6 rounded-md transition-colors shadow-sm"
                    >
                      <MessageCircle size={18} /> Enviar Mensagem
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-7/12 h-[350px] sm:h-[450px] relative bg-slate-200 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
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

      <AvaliacoesDaLoja />
      <GoogleStoreReviewsLink />
      <LoginModal 
        isOpen={isLoginModalOpen} 
        message={loginModalMessage}
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={() => {
          setIsLoginModalOpen(false);
          supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchFavorites(session.user.id);
          });
          window.dispatchEvent(new Event('atualizarFavoritos'));
        }} 
      />
    </>
  );
}

export default function Home() {
  return (
    // ATENÇÃO AQUI: Removemos o overflow-hidden maldito que estava estragando o botão!
    <main className="min-h-screen bg-[#FAFAFC] text-slate-900 selection:bg-teal-600 selection:text-white flex flex-col relative">
      <Suspense fallback={<div className="min-h-screen bg-[#FAFAFC]"></div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
