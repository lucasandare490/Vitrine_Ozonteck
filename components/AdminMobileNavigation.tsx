'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { House, Package, ShoppingBag, Menu, ChevronRight } from 'lucide-react';
import BottomSheet from './BottomSheet';

export const adminDestinations = [
  ['/admin', 'Visão geral'], ['/admin/pedidos', 'Pedidos e entregas'], ['/admin/produtos', 'Produtos'],
  ['/admin/clientes', 'Clientes e benefícios'], ['/admin/precos', 'Tabela de preços de consultor'],
  ['/admin/categorias', 'Categorias'], ['/admin/relatorios', 'Relatórios de vendas'],
  ['/admin/suporte', 'Atendimentos'], ['/admin/interessados', 'Pessoas interessadas'], ['/admin/lembretes', 'Meus lembretes'],
] as const;
export default function AdminMobileNavigation() {
  const pathname = usePathname(); const [open, setOpen] = useState(false);
  const primary = [['/admin', 'Início', House], ['/admin/pedidos', 'Pedidos', ShoppingBag], ['/admin/produtos', 'Produtos', Package]] as const;
  return <>
    <nav aria-label="Atalhos do administrador no celular" className="mobile-bottom-nav admin-bottom-nav">
      {primary.map(([href, label, Icon]) => <Link key={href} href={href} className={pathname === href ? 'is-active' : undefined} aria-current={pathname === href ? 'page' : undefined}><span className="mobile-tab-icon"><Icon size={23} aria-hidden="true" /></span><span>{label}</span></Link>)}
      <button type="button" aria-expanded={open} onClick={() => setOpen(true)}><span className="mobile-tab-icon"><Menu size={23} aria-hidden="true" /></span><span>Mais opções</span></button>
    </nav>
    <BottomSheet open={open} onClose={() => setOpen(false)} title="O que você quer fazer?">
      <div className="space-y-2">{adminDestinations.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={pathname === href ? 'page' : undefined} className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border px-4 text-base font-semibold ${pathname === href ? 'border-teal-400 bg-teal-50 text-teal-900' : 'border-slate-200'}`}>{label}<ChevronRight size={18} aria-hidden="true" /></Link>)}</div>
    </BottomSheet>
  </>;
}
