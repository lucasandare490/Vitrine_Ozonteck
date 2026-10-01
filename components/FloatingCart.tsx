'use client';

import { useCartStore } from '@/store/useCartStore';
import { ShoppingBag } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 

export default function FloatingCart() {
  const isMounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const pathname = usePathname(); 
  
  // OTIMIZAÇÃO SÊNIOR: Calcula o total diretamente no seletor do Zustand.
  // Evita carregar o array de itens na memória deste componente apenas para saber se está vazio.
  const totalItems = useCartStore((state) => 
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  if (pathname === '/lista') return null;
  if (!isMounted) return null;
  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-50 md:hidden">
      <Link
        href="/lista"
        className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgb(13,148,136,0.15)] text-teal-900 p-3 rounded-xl flex items-center gap-2.5 transition-all hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 group"
        aria-label="Ver minha seleção"
      >
        <div className="relative">
          <ShoppingBag size={20} strokeWidth={2.5} className="text-teal-700 group-hover:text-teal-500 transition-colors" />
          <span className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
            {totalItems}
          </span>
        </div>
        <div className="text-left pr-2">
          <p className="text-[8px] font-black text-teal-500 uppercase tracking-widest leading-none mb-1">Sua Seleção</p>
          <p className="text-xs font-bold text-slate-800 leading-none">Revisar Orçamento</p>
        </div>
      </Link>
    </div>
  );
}
