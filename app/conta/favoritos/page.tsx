'use client';

import { isRetiredProduct } from '@/lib/catalog-availability';
import { isHiddenTestProduct as isTestProduct } from '@/lib/products';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import PaginatedGrid from '@/components/PaginatedGrid';
import { Heart, ShoppingBag, ArrowLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import type { Product } from '@/lib/data';

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

export default function FavoritosPage() {
  const [user, setUser] = useState<User | null>(null);
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const loadFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);

      const { data: favs } = await supabase
        .from('favoritos')
        .select('produto_code')
        .eq('user_id', session.user.id);

      if (favs && favs.length > 0) {
        const codes = favs.map(f => f.produto_code);
        
        const { data: prods } = await supabase
          .from('produtos')
          .select('id, code, name, description, category, price, image_url, estoque')
          .in('code', codes).eq('is_deleted', false);

        if (prods) {
          const formattedProducts = prods.filter((item) => !isRetiredProduct(item) && !isTestProduct(item)).map((item) => ({
            id: item.id,
            code: item.code,
            name: item.name,
            description: item.description || '',
            category: item.category,
            price: Number(item.price),
            imagePlaceholder: item.image_url,
            estoque: item.estoque
          }));
          setFavoriteProducts(formattedProducts);
        }
      }
      setIsLoading(false);
    };

    loadFavorites();
  }, [router]);

  const removeFavorite = async (produtoCode: string) => {
    if (!user) return;
    setFavoriteProducts(prev => prev.filter(p => p.code !== produtoCode));
    toast.success('Removido dos favoritos');
    await supabase.from('favoritos').delete().match({ user_id: user.id, produto_code: produtoCode });
    
    window.dispatchEvent(new Event('atualizarFavoritos'));
  };

  // OTIMIZAÇÃO SÊNIOR: Memoização do filtro. Impede o React de recalcular o array em qualquer outra re-renderização da página.
  const filteredFavorites = useMemo(() => {
    return favoriteProducts.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [favoriteProducts, searchQuery]);

  return (
    <main className="min-h-screen bg-[#FAFAFC] text-slate-900 relative overflow-hidden flex flex-col">
      <OzoneBackground />
      
      <section className="max-w-[1800px] w-full mx-auto px-5 sm:px-10 lg:px-16 pt-8 sm:pt-12 pb-24 relative z-10">
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-teal-600 mb-6 transition-colors uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-full backdrop-blur-md border border-slate-200/50"
        >
          <ArrowLeft size={12} /> Voltar para a loja
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12 pb-5 border-b border-slate-200/60">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-1.5">
              <Heart className="text-teal-600 w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
              Meus Favoritos
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Sua seleção exclusiva. Guardados para quando você decidir levar.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {!isLoading && favoriteProducts.length > 0 && (
              <div className="relative w-full sm:w-64 lg:w-80">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar nos favoritos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white/80 backdrop-blur-md border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-full text-sm font-semibold text-slate-700 outline-none transition-all shadow-sm placeholder:text-slate-400"
                />
              </div>
            )}

            {!isLoading && favoriteProducts.length > 0 && (
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-200/60 shadow-sm whitespace-nowrap hidden md:block">
                {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item salvo' : 'itens salvos'}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">A carregar...</p>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-white/80 backdrop-blur-md rounded-full border border-slate-100 shadow-sm flex items-center justify-center mb-6">
              <Heart size={32} className="text-slate-200" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Sua lista está vazia</h3>
            <p className="text-base text-slate-500 max-w-md mb-8 leading-relaxed">
              Você ainda não salvou nenhum produto. Navegue pelo nosso catálogo e clique no coração para separar os seus favoritos.
            </p>
            <Link 
              href="/"
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-4 px-10 rounded-full transition-all shadow-[0_8px_25px_rgb(13,148,136,0.3)] hover:shadow-[0_8px_35px_rgb(13,148,136,0.5)] hover:-translate-y-1 flex items-center gap-2"
            >
              <ShoppingBag size={18} />
              Explorar Catálogo
            </Link>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white/80 backdrop-blur-md rounded-full border border-slate-100 shadow-sm flex items-center justify-center mb-4">
              <Search size={24} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Nenhum favorito encontrado</h3>
            <p className="text-sm text-slate-500">Não achamos nada com o termo &quot;{searchQuery}&quot;.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-teal-600 font-bold text-xs uppercase tracking-widest hover:underline"
            >
              Limpar busca
            </button>
          </div>
        ) : (
          <PaginatedGrid key={searchQuery} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-x-3 sm:gap-x-4 gap-y-6 sm:gap-y-12">
            {filteredFavorites.map((product) => (
              <div key={product.id} className="relative group animate-in fade-in slide-in-from-bottom-4 duration-500">
                <button
                  onClick={(e) => {
                    e.preventDefault(); 
                    e.stopPropagation();
                    removeFavorite(product.code);
                  }}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20 p-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-slate-100 hover:scale-110 hover:bg-white transition-all cursor-pointer opacity-90 hover:opacity-100"
                  title="Remover dos Favoritos"
                >
                  <Heart size={18} className="text-red-500 fill-red-500" />
                </button>
                <ProductCard product={product} />
              </div>
            ))}
          </PaginatedGrid>
        )}
      </section>
    </main>
  );
}
