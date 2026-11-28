'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Heart, LayoutGrid, Search, ShoppingBag, UserRound, HelpCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { catalogReturn, isMobileDestinationActive, mobileDestinations, mobileSection, mobileTitles } from '@/lib/mobile-navigation';

const icons = { catalog: LayoutGrid, search: Search, heart: Heart, cart: ShoppingBag, account: UserRound };
const subscribe = () => () => undefined;
export default function MobileNavigation() {
  const pathname = usePathname();
  const [returnToCatalog, setReturnToCatalog] = useState('/#catalogo');
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const count = useCartStore(state => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const section = mobileSection(pathname);
  useEffect(() => {
    document.documentElement.dataset.screen = section;
    const updateKeyboard = () => {
      const element = document.activeElement;
      const editing = element instanceof HTMLElement && (element.matches('textarea, [contenteditable="true"]')
        || (element instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'file'].includes(element.type)));
      document.documentElement.dataset.keyboard = editing ? 'open' : 'closed';
    };
    const afterFocus = () => requestAnimationFrame(updateKeyboard);
    document.addEventListener('focusin', updateKeyboard);
    document.addEventListener('focusout', afterFocus);
    window.visualViewport?.addEventListener('resize', updateKeyboard);
    const timer = window.setTimeout(() => {
      try { setReturnToCatalog(catalogReturn(sessionStorage.getItem('ozonteck-catalog-context'))); } catch { /* Storage is optional. */ }
      updateKeyboard();
    }, 0);
    return () => {
      window.clearTimeout(timer); document.removeEventListener('focusin', updateKeyboard);
      document.removeEventListener('focusout', afterFocus); window.visualViewport?.removeEventListener('resize', updateKeyboard);
      delete document.documentElement.dataset.keyboard;
    };
  }, [pathname, section]);
  if (section === 'admin') return null;
  const parent = pathname.startsWith('/conta/') ? '/conta' : returnToCatalog;
  return <>
    <header className="mobile-app-header" aria-label="Cabeçalho da loja">
      <div className="mobile-app-header-row">
        {pathname === '/' ? <Link href="/" className="mobile-wordmark" aria-label="Ozonteck Recife, início"><Image src="/brand-icon.svg" width={28} height={28} alt="" /><span>OZONTECK<span className="text-teal-300">.</span><small>RECIFE</small></span></Link>
          : <><Link href={parent} className="mobile-icon-button" aria-label={pathname.startsWith('/conta/') ? 'Voltar à minha conta' : 'Voltar ao catálogo'}><ArrowLeft size={22} /></Link><p className="min-w-0 flex-1 truncate font-bold">{mobileTitles[pathname] || (section === 'product' ? 'Detalhes do produto' : 'Ozonteck Recife')}</p></>}
        <Link href="/suporte" className="mobile-icon-button" aria-label="Ajuda e atendimento"><HelpCircle size={23} /></Link>
      </div>
      {pathname === '/' && <Link href="/busca" className="mobile-search-entry"><Search size={20} aria-hidden="true" /><span>O que você está procurando?</span></Link>}
    </header>
    <nav className="mobile-bottom-nav" aria-label="Navegação principal no celular">
      {mobileDestinations.map(destination => {
        const Icon = icons[destination.icon]; const active = isMobileDestinationActive(pathname, destination.href);
        return <Link key={destination.href} href={destination.href === '/#catalogo' ? returnToCatalog : destination.href} aria-current={active ? 'page' : undefined} className={active ? 'is-active' : undefined}>
          <span className="mobile-tab-icon"><Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden="true" />{destination.icon === 'cart' && mounted && count > 0 && <span className="mobile-tab-badge" aria-label={`${count} itens`}>{count > 99 ? '99+' : count}</span>}</span>
          <span>{destination.label}</span>
        </Link>;
      })}
    </nav>
  </>;
}
