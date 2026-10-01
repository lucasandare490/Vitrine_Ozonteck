'use client';

import { isRetiredProduct } from '@/lib/catalog-availability';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { CheckCircle2, LogIn, LogOut, ShieldCheck, User, Users, Package, ChevronDown, ChevronRight, Heart, Plus, MapPin, ShoppingCart, Settings, Search, Info, HelpCircle, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import { signOutWithCart } from '@/lib/cart-session';

type QuickBuyProduct = {
  id: string;
  code: string;
  name: string;
  price: number | string;
  image_url?: string | null;
  estoque: number | string;
};

function subscribeToHydration() {
  return () => undefined;
}

function NavbarView({ initialSearch }: { initialSearch: string }) {
  const isMounted = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userRole, setUserRole] = useState('cliente'); 
  const [navSearch, setNavSearch] = useState(initialSearch);
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  
  // ESTADO: Controla o Menu Hambúrguer no Celular/Tablet
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = menuRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])') || []).filter((element) => element.getClientRects().length > 0);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, [isMobileMenuOpen]);
  
  const [quickBuyProducts, setQuickBuyProducts] = useState<QuickBuyProduct[]>([]); 
  const [totalFavs, setTotalFavs] = useState(0); 
  
  const router = useRouter(); 
  const pathname = usePathname();

  const addItem = useCartStore((state) => state.addItem);
  const cartItemsCount = useCartStore((state) => 
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  const clearUserData = useCallback(() => {
    setProfileName('');
    setAvatarUrl('');
    setUserRole('cliente');
    setQuickBuyProducts([]);
    setTotalFavs(0);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('nome, avatar_url, role').eq('id', userId).single();
    if (data) {
      if (data.nome && data.nome !== 'Cliente Ozonteck') setProfileName(data.nome.split(' ')[0]);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
      if (data.role) setUserRole(data.role); 
      

    }
  }, []);

  const fetchQuickBuy = useCallback(async (userId: string) => {
    const { data: allFavs } = await supabase.from('favoritos').select('produto_code').eq('user_id', userId);
    if (allFavs && allFavs.length > 0) {
      setTotalFavs(allFavs.length);
      const codes = allFavs.slice(0, 3).map(f => f.produto_code);
      const { data: prods } = await supabase.from('produtos').select('id, code, name, category, price, image_url, estoque').in('code', codes).eq('is_deleted', false);
      if (prods) setQuickBuyProducts(prods.filter((product) => !isRetiredProduct(product)));
    } else {
      setQuickBuyProducts([]);
      setTotalFavs(0);
    }
  }, []);

  useEffect(() => {
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchQuickBuy(session.user.id); 
      } else {
        clearUserData();
      }
    };
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchQuickBuy(session.user.id);
      } else {
        clearUserData();
      }
    });

    return () => subscription.unsubscribe();
  }, [clearUserData, fetchProfile, fetchQuickBuy, pathname]);

  useEffect(() => {
    const handleFavoritesChange = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        fetchQuickBuy(session.user.id);
      }
    };

    window.addEventListener('atualizarFavoritos', handleFavoritesChange);
    return () => window.removeEventListener('atualizarFavoritos', handleFavoritesChange);
  }, [fetchQuickBuy]);

  const handleLogout = async () => {
    setProfileOpen(false);
    setIsMobileMenuOpen(false);

    try { await signOutWithCart(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível sair. Tente novamente.'); return; }
    toast.success('Você saiu da conta.');
    router.push('/');
  };

  const handleQuickAdd = (product: QuickBuyProduct) => {
    if (Number(product.estoque) <= 0) { toast.error('Produto indisponível no momento.'); return; }
    addItem({
      id: product.id, code: product.code, name: product.name, price: Number(product.price), estoque: Number(product.estoque)
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (navSearch.trim()) {
      router.push(`/?q=${encodeURIComponent(navSearch)}`);
    } else {
      router.push(`/`);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'US';
    return name.substring(0, 2).toUpperCase();
  };

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <header className="w-full bg-gradient-to-r from-teal-950 to-teal-900 border-b border-teal-800 sticky top-0 z-50 transition-all shadow-md">
        <nav className="w-full flex items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 h-[72px] sm:h-20 gap-3 lg:gap-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 shrink-0">
            <button onClick={() => router.push('/')} className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-white flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-400 w-5 h-5 lg:w-6 lg:h-6">
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2.5"/>
                <circle cx="7" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
                <circle cx="17" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
              </svg>
              <span className="hidden sm:inline">OZONTECK<span className="text-teal-400">.</span></span>
              <span className="sm:hidden text-lg">OZK<span className="text-teal-400">.</span></span>
            </button>
            <span className="text-[9px] lg:text-[11px] font-bold text-teal-300 sm:border-l sm:border-teal-700 sm:pl-4 uppercase tracking-widest mt-0.5 sm:mt-0 hidden lg:block">
              Unidade Recife
            </span>
          </div>

          <div className="hidden md:block min-w-0 flex-1 max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative w-full group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search size={18} className="text-slate-400 group-focus-within:text-teal-600 transition-colors" />
              </div>
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Buscar óleos, séruns, kits..."
                className="w-full pl-11 pr-20 py-2.5 bg-white border-2 border-transparent focus:border-teal-400 rounded-full text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-inner"
              />
              <button type="submit" className="absolute inset-y-0 right-1.5 my-1.5 px-4 bg-teal-600 hover:bg-teal-50 text-white text-xs font-bold rounded-full transition-colors cursor-pointer shadow-sm">
                Buscar
              </button>
            </form>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            
            <Link href="/sobre_cliente" className="text-[10px] sm:text-xs lg:text-[12px] font-bold text-teal-100 hover:text-white transition-colors hidden xl:flex items-center gap-1.5 border-r border-teal-800 pr-4 lg:pr-6">
              <Info size={14} /> Nossa História
            </Link>

            <Link href="/suporte" className="text-[10px] sm:text-xs lg:text-[12px] font-bold text-teal-100 hover:text-white transition-colors hidden xl:flex items-center gap-1.5 border-r border-teal-800 pr-4 lg:pr-6">
              <HelpCircle size={14} /> Central de Ajuda
            </Link>

            <Link href="/junte-se-a-nos" className="text-[10px] sm:text-xs lg:text-[12px] font-bold text-teal-100 hover:text-white transition-colors hidden xl:flex items-center gap-1.5 border-r border-teal-800 pr-4 lg:pr-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><Users size={14} aria-hidden="true" /> Junte-se a nós</Link>

            <div className="text-[10px] sm:text-xs lg:text-[12px] font-bold text-teal-100 hidden 2xl:flex items-center gap-1.5 border-r border-teal-800 pr-4 lg:pr-6">
              <CheckCircle2 className="text-teal-400 w-3.5 h-3.5 lg:w-4 lg:h-4"/>
              Distribuidor Autorizado
            </div>

            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="xl:hidden flex items-center justify-center text-teal-100 hover:text-white transition-colors focus:outline-none"
              aria-label="Abrir Menu"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-1 sm:gap-4">
              
              {user ? (
                <>
                  <div className="relative hidden sm:block" onMouseEnter={() => { setFavsOpen(true); setProfileOpen(false); }} onMouseLeave={() => setFavsOpen(false)}>
                    <Link href="/conta/favoritos" className="flex items-center gap-1.5 p-2 rounded-lg text-teal-100 hover:text-white hover:bg-teal-800/50 transition-colors">
                      <Heart size={20} strokeWidth={2} />
                      <span className="text-sm font-bold">Favoritos</span>
                      {totalFavs > 0 && (
                        <span className="bg-teal-400 text-teal-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1 transition-all">
                          {totalFavs}
                        </span>
                      )}
                    </Link>

                    {favsOpen && (
                      <div className="absolute top-[100%] right-0 pt-2 z-50">
                        <div className="w-[320px] bg-white rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Adicionados Recentes</h3>
                            <Heart size={14} className="text-teal-600" />
                          </div>
                          
                          {quickBuyProducts.length > 0 ? (
                            <div className="flex flex-col">
                              {quickBuyProducts.map(prod => (
                                <div key={prod.code} className="flex items-center gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                  <div className="relative w-12 h-12 bg-white rounded-lg border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                    {prod.image_url ? <Image src={prod.image_url} alt={prod.name} fill sizes="48px" className="object-cover" /> : <Package size={14} className="text-slate-300" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                                    <p className="text-[11px] text-teal-600 font-bold">R$ {Number(prod.price).toFixed(2).replace('.', ',')}</p>
                                  </div>
                                  <button onClick={() => { handleQuickAdd(prod); setFavsOpen(false); }} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-teal-600 text-slate-500 hover:text-white flex items-center justify-center transition-colors shrink-0" title="Comprar">
                                    <Plus size={14} />
                                  </button>
                                </div>
                              ))}
                              <Link href="/conta/favoritos" onClick={() => setFavsOpen(false)} className="py-3 text-center text-xs font-bold text-teal-600 hover:bg-teal-50 transition-colors">
                                Ver todos os {totalFavs} favoritos
                              </Link>
                            </div>
                          ) : (
                            <div className="p-6 text-center">
                              <p className="text-xs text-slate-500">Você ainda não possui favoritos.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative" onMouseEnter={() => { setProfileOpen(true); setFavsOpen(false); }} onMouseLeave={() => setProfileOpen(false)}>
                    <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 sm:gap-3 hover:bg-teal-800/50 p-1.5 sm:pr-3 rounded-full transition-colors cursor-pointer border border-transparent hover:border-teal-700">
                      <div className="relative w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center border border-teal-200 overflow-hidden shrink-0 shadow-sm">
                        {avatarUrl ? <Image src={avatarUrl} alt="Perfil" fill sizes="36px" className="object-cover" /> : profileName ? <span className="text-teal-700 font-bold text-xs">{getInitials(profileName)}</span> : <User size={16} className="text-teal-700" />}
                      </div>
                      <div className="hidden sm:flex flex-col items-start text-left">
                        <span className="text-[10px] text-teal-200 font-medium leading-none">Olá, {profileName || 'Cliente'}</span>
                        <span className="text-sm font-bold text-white leading-tight flex items-center gap-1 mt-0.5">
                          Sua Conta <ChevronDown size={14} className={`text-teal-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </span>
                      </div>
                    </button>

                    {profileOpen && (
                      <div className="absolute top-[100%] right-0 pt-2 z-50">
                        <div className="w-[240px] bg-white rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.15)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <p className="text-sm font-bold text-slate-900">Minha Conta</p>
                          </div>
                          <div className="p-2 flex flex-col gap-1">
                            
                            {userRole === 'admin' && (
                              <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors text-sm font-bold border border-teal-200 mb-1">
                                <ShieldCheck size={16} className="text-teal-600" /> Painel Admin
                              </Link>
                            )}

                            <Link href="/conta" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-sm font-medium">
                              <Settings size={16} className="text-slate-400" /> Painel de Controle
                            </Link>
                            <Link href="/conta/pedidos" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-sm font-medium">
                              <Package size={16} className="text-slate-400" /> Meus Pedidos
                            </Link>
                            <Link href="/conta/enderecos" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-sm font-medium">
                              <MapPin size={16} className="text-slate-400" /> Endereços
                            </Link>
                            <Link href="/conta/dados" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors text-sm font-medium">
                              <User size={16} className="text-slate-400" /> Dados Pessoais
                            </Link>
                          </div>
                          <div className="p-2 border-t border-slate-100">
                            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-sm font-medium cursor-pointer">
                              <LogOut size={16} className="text-red-400" /> Sair da conta
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : pathname === '/login' ? (
                <div className="flex min-h-11 items-center gap-2 text-xs font-bold text-teal-200 bg-teal-800/50 border border-teal-700/50 px-3 sm:px-5 py-2 rounded-full">
                  <ShieldCheck size={14} className="text-teal-400" /><span className="sr-only sm:not-sr-only">Acesso Seguro</span>
                </div>
              ) : (
                <button aria-label="Entrar na minha conta" onClick={() => router.push('/login')} className="flex min-h-11 items-center gap-2 text-xs font-bold text-white bg-teal-500 hover:bg-teal-400 transition-colors px-4 sm:px-5 py-2 sm:py-2.5 rounded-full shadow-md cursor-pointer">
                  <LogIn size={14} /> <span className="hidden sm:inline">Entrar</span>
                </button>
              )}

              <Link href="/lista" aria-label="Ver minha lista" className="relative min-h-11 min-w-11 p-2 ml-1 sm:ml-2 text-teal-100 hover:text-white transition-colors group flex items-center gap-2">
                <ShoppingCart size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
                {isMounted && cartItemsCount > 0 && (
                  <span className="absolute top-0 right-0 sm:-top-1 sm:-right-1 flex items-center justify-center w-5 h-5 bg-teal-400 text-teal-950 text-[10px] font-bold rounded-full border-2 border-teal-900 shadow-sm animate-in zoom-in">
                    {cartItemsCount}
                  </span>
                )}
              </Link>

            </div>
          </div>
        </nav>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[999999] flex xl:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsMobileMenuOpen(false)} 
          />
          
          <div ref={menuRef} role="dialog" aria-modal="true" aria-label="Menu principal" className="relative w-[85%] max-w-sm bg-white h-[100dvh] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            
            <div className="bg-teal-900 p-5 flex items-center justify-between">
              <span className="text-white font-black tracking-tight text-xl flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-400 w-6 h-6">
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2.5"/>
                  <circle cx="7" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
                  <circle cx="17" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
                </svg>
                OZONTECK<span className="text-teal-400">.</span>
              </span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                aria-label="Fechar menu"
                className="text-teal-200 hover:text-white min-h-11 min-w-11 p-2 rounded-md hover:bg-teal-800 transition-colors"
              >
                <X size={24}/>
              </button>
            </div>

            <div className="p-5 border-b border-slate-100 bg-slate-50 md:hidden">
              <form onSubmit={handleSearchSubmit} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  value={navSearch}
                  onChange={(e) => setNavSearch(e.target.value)}
                  placeholder="Buscar produtos..."
                  aria-label="Buscar produtos"
                  className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-sm font-medium outline-none focus:border-teal-500 shadow-sm transition-colors"
                />
              </form>
            </div>

            <div className="flex-1 overflow-y-auto py-2">
              <Link 
                href="/sobre_cliente" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="px-6 py-4 flex items-center gap-4 text-slate-700 font-bold hover:bg-teal-50 hover:text-teal-700 transition-colors border-b border-slate-50"
              >
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                  <Info size={18} className="text-teal-600"/> 
                </div>
                Nossa História
              </Link>
              
              <Link 
                href="/suporte" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="px-6 py-4 flex items-center gap-4 text-slate-700 font-bold hover:bg-teal-50 hover:text-teal-700 transition-colors border-b border-slate-50"
              >
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center">
                  <HelpCircle size={18} className="text-teal-600"/> 
                </div>
                Central de Ajuda
              </Link>
              
              <Link href="/junte-se-a-nos" onClick={() => setIsMobileMenuOpen(false)} className="px-6 py-4 flex items-center gap-4 text-slate-700 font-bold hover:bg-teal-50 hover:text-teal-700 transition-colors border-b border-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-teal-700">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center"><Users size={18} className="text-teal-600" aria-hidden="true" /></div> Junte-se a nós
              </Link>
              <div className="px-6 py-4 flex items-center gap-4 text-slate-700 font-bold border-b border-slate-50">
                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-600"/> 
                </div>
                Distribuidor Autorizado
              </div>

              {user && (
                <Link 
                  href="/conta/favoritos" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="px-6 py-4 flex items-center gap-4 text-slate-700 font-bold hover:bg-teal-50 hover:text-teal-700 transition-colors sm:hidden"
                >
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                    <Heart size={18} className="text-red-500"/> 
                  </div>
                  Meus Favoritos
                </Link>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50">
              {!user ? (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); router.push('/login'); }} 
                  className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white font-bold py-3.5 rounded-xl shadow-md active:scale-[0.98] transition-all"
                >
                  <LogIn size={18} /> Entrar na conta
                </button>
              ) : (
                <Link 
                  href="/conta" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="w-full flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-teal-500 transition-colors"
                >
                  <div className="relative w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center border border-teal-200 overflow-hidden shrink-0">
                    {avatarUrl ? <Image src={avatarUrl} alt="Perfil" fill sizes="40px" className="object-cover" /> : <span className="text-teal-700 font-bold text-sm">{getInitials(profileName)}</span>}
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Logado como</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{profileName || 'Cliente'}</p>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </Link>
              )}
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}

function NavbarContent() {
  const searchParams = useSearchParams();
  const search = searchParams.get('q') ?? '';
  return <NavbarView key={searchParams.toString()} initialSearch={search} />;
}

export default function Navbar() {
  return (
    <Suspense fallback={null}>
      <NavbarContent />
    </Suspense>
  );
}
