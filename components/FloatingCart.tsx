'use client';

import { useCartStore } from '@/store/useCartStore';
import { ShoppingBag } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; 

export default function FloatingCart() {
  const [isMounted, setIsMounted] = useState(false);
  const items = useCartStore((state) => state.items);
  const pathname = usePathname(); 

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Esconde o botão flutuante se o usuário já estiver na tela de revisar o carrinho
  if (pathname === '/lista') return null;

  if (!isMounted) return null;

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50 animate-[bounce_3s_ease-in-out_infinite]">
      <Link
        href="/lista"
        className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgb(13,148,136,0.15)] text-teal-900 p-2.5 lg:p-3.5 rounded-xl lg:rounded-2xl flex items-center gap-2.5 lg:gap-3 transition-all hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100 group"
        aria-label="Ver minha seleção"
      >
        <div className="relative">
          <ShoppingBag size={20} strokeWidth={2.5} className="text-teal-700 group-hover:text-teal-500 transition-colors" />
          <span className="absolute -top-1.5 -right-1.5 bg-teal-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
            {totalItems}
          </span>
        </div>
        <div className="text-left hidden sm:block pr-2">
          <p className="text-[8px] font-black text-teal-500 uppercase tracking-widest leading-none mb-1">Sua Seleção</p>
          <p className="text-xs font-bold text-slate-800 leading-none">Revisar Orçamento</p>
        </div>
      </Link>
    </div>
  );
}