'use client';

import { Product } from '@/lib/data';
import { useCartStore } from '@/store/useCartStore';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const items = useCartStore((state) => state.items); 
  const [isAdded, setIsAdded] = useState(false);

  const estoqueAtual = product.estoque || 0;
  const isOutOfStock = estoqueAtual === 0;

  const currentCartItem = items.find((i) => i.id === product.id);
  const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;
  
  const isLimitReached = currentQuantity >= estoqueAtual && !isOutOfStock;

  const handleAdd = () => {
    if (isOutOfStock || isLimitReached) return;

    addItem({
      id: product.id,
      code: product.code,
      name: product.name,
      price: product.price,
      estoque: estoqueAtual, 
    });
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 400);
  };

  return (
    <div className={`group flex flex-col h-full w-full ${isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgb(0,0,0,0.03)] aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 transition-transform duration-500 lg:group-hover:-translate-y-1.5 lg:group-hover:shadow-[0_15px_30px_rgb(13,148,136,0.1)] relative overflow-hidden">
        <img 
          src={product.imagePlaceholder} 
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? 'grayscale-[60%] opacity-70' : ''}`}
          loading="lazy"
        />
        
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
            <span className="bg-red-500 text-white text-[10px] sm:text-[11px] font-black px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg transform -rotate-12 border-2 border-white">
              Esgotado
            </span>
          </div>
        )}
      </div>
      
      <div className={`flex flex-col flex-grow px-1 sm:px-2 ${isOutOfStock ? 'opacity-70' : ''}`}>
        <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-teal-600 uppercase mb-1 line-clamp-1">
          {product.category}
        </span>
        
        <h3 className="text-xs sm:text-[14px] font-bold text-slate-900 mb-1 leading-tight line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-slate-500 text-[9px] sm:text-[11px] leading-relaxed mb-2 flex-grow line-clamp-2">
          {product.description}
        </p>
        
        <div className="mt-auto pt-1.5 border-t border-slate-100 sm:border-none flex flex-col xl:flex-row items-start xl:items-center justify-between gap-2 xl:gap-0">
          <p className="text-sm sm:text-[15px] font-black text-slate-900 tracking-tight">
            R$ {product.price.toFixed(2).replace('.', ',')}
          </p>
          
          <button 
            onClick={handleAdd}
            disabled={isOutOfStock || isLimitReached}
            /* AQUI ESTÁ A MENSAGEM EXPLICATIVA AO PASSAR O RATO */
            title={isLimitReached ? "Você adicionou todas as unidades disponíveis deste produto." : ""}
            className={`flex items-center justify-center gap-1.5 text-[9px] sm:text-[11px] font-bold w-full xl:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 ${
              isOutOfStock 
                ? 'bg-slate-100 text-slate-400 lg:opacity-100 lg:translate-x-0'
                : isLimitReached
                  ? 'bg-amber-100 text-amber-700 lg:opacity-100 lg:translate-x-0'
                  : isAdded 
                    ? 'bg-teal-500 text-white shadow-md lg:opacity-100 lg:translate-x-0' 
                    : 'text-teal-700 bg-teal-50 hover:bg-teal-100 lg:opacity-0 lg:-translate-x-3 lg:group-hover:opacity-100 lg:group-hover:translate-x-0 opacity-100'
            }`}
          >
            {isOutOfStock ? (
              <span>Esgotado</span>
            ) : isLimitReached ? (
              /* NOVO TEXTO MAIS CLARO AQUI */
              <span>Máx. do Estoque</span>
            ) : isAdded ? (
              <>
                <Check size={12} strokeWidth={2.5} />
                <span>Adicionado</span>
              </>
            ) : (
              <>
                <Plus size={12} strokeWidth={2.5} />
                <span>Adicionar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}