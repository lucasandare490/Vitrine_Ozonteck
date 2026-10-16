'use client';

import { Product } from '@/lib/data';
import { useCartStore } from '@/store/useCartStore';
import { Plus, Check, Package } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { productPath } from '@/lib/products';
import { useProductPrice, StorePrice } from '@/components/StorePricing';

export default function ProductCard({ product }: { product: Product }) {
  const pricing = useProductPrice(product.code, product.price);
  const addItem = useCartStore((state) => state.addItem);
  
  // OTIMIZAÇÃO SÊNIOR: Selecionando apenas a quantidade deste produto específico.
  // Isso impede que este Card seja re-renderizado inutilmente quando outros produtos forem adicionados ao carrinho.
  const currentQuantity = useCartStore((state) => 
    state.items.find((i) => i.id === product.id)?.quantity || 0
  );

  const [isAdded, setIsAdded] = useState(false);
  const [failedImage, setFailedImage] = useState<string | null>(null);

  const estoqueAtual = product.estoque || 0;
  const isOutOfStock = estoqueAtual === 0;
  const isLimitReached = currentQuantity >= estoqueAtual && !isOutOfStock;

  const handleAdd = () => {
    if (isOutOfStock || isLimitReached || !pricing.ready) return;

    addItem({
      id: product.id,
      code: product.code,
      name: product.name,
      price: pricing.price,
      estoque: estoqueAtual, 
    });
    
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 400);
  };

  return (
    <div className={`group flex flex-col h-full w-full ${isOutOfStock ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <Link href={productPath(product.code)} aria-label={`Ver detalhes de ${product.name}`} className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgb(0,0,0,0.03)] aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 transition-transform duration-500 lg:group-hover:-translate-y-1.5 lg:group-hover:shadow-[0_15px_30px_rgb(13,148,136,0.1)] relative overflow-hidden">
        {product.imagePlaceholder && failedImage !== product.imagePlaceholder ? (
          <Image
            src={product.imagePlaceholder}
            alt={product.name}
            onError={() => setFailedImage(product.imagePlaceholder)}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 15vw"
            className={`object-cover object-center transition-transform duration-700 group-hover:scale-105 ${isOutOfStock ? 'grayscale-[60%] opacity-70' : ''}`}
          />
        ) : (
          <Package aria-hidden="true" className="w-10 h-10 text-slate-300" />
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-[1px]">
            <span className="bg-red-500 text-white text-[10px] sm:text-[11px] font-black px-3 sm:px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg transform -rotate-12 border-2 border-white">
              Esgotado
            </span>
          </div>
        )}
      </Link>
      
      <div className={`flex flex-col flex-grow px-1 sm:px-2 ${isOutOfStock ? 'opacity-70' : ''}`}>
        <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-teal-600 uppercase mb-1 line-clamp-1">
          {product.category}
        </span>
        
        <h3 className="text-xs sm:text-[14px] font-bold text-slate-900 mb-1 leading-tight line-clamp-2">
          <Link href={productPath(product.code)} className="hover:underline">{product.name}</Link>
        </h3>
        
        <div className="mt-auto pt-1.5 border-t border-slate-100 sm:border-none flex flex-wrap items-center justify-between gap-1">
          <p className="text-sm sm:text-[15px] font-black text-slate-900 tracking-tight">
            <StorePrice code={product.code} price={product.price} />
          </p>
          
          <button 
            onClick={handleAdd}
            disabled={isOutOfStock || isLimitReached || !pricing.ready}
            aria-label={isOutOfStock ? `${product.name} esgotado` : isLimitReached ? `Limite de estoque de ${product.name} atingido` : isAdded ? `${product.name} adicionado` : `Adicionar ${product.name} à lista`}
            title={isOutOfStock ? 'Esgotado' : isLimitReached ? 'Você adicionou todas as unidades disponíveis deste produto.' : 'Adicionar à lista'}
            className={`flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 text-xs font-bold px-2 py-2 rounded-lg transition-all duration-300 ${
              isOutOfStock 
                ? 'bg-slate-100 text-slate-400 lg:opacity-100 lg:translate-x-0'
                : isLimitReached
                  ? 'bg-amber-100 text-amber-700 lg:opacity-100 lg:translate-x-0'
                  : isAdded 
                    ? 'bg-teal-500 text-white shadow-md lg:opacity-100 lg:translate-x-0' 
                    : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
            }`}
          >
            {isOutOfStock ? (
              <Package size={18} aria-hidden="true" />
            ) : isLimitReached ? (
              <Check size={18} aria-hidden="true" />
            ) : isAdded ? (
              <>
                <Check size={18} strokeWidth={2.5} aria-hidden="true" />
              </>
            ) : (
              <>
                <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
