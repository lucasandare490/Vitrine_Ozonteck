'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, LogIn, LogOut, ShieldCheck, User, Package, ChevronDown, Heart, Plus, MapPin, ShoppingCart, Settings, Search, Info } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userRole, setUserRole] = useState('cliente'); // NOVA VARIÁVEL: Guarda a permissão
  const [navSearch, setNavSearch] = useState('');
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [favsOpen, setFavsOpen] = useState(false);
  
  const [quickBuyProducts, setQuickBuyProducts] = useState<any[]>([]); 
  const [totalFavs, setTotalFavs] = useState(0); 
  
  const router = useRouter(); 
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const cartItemsCount = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setNavSearch(q);
    else setNavSearch('');
  }, [searchParams]);

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
  }, [pathname]);

  const clearUserData = () => {
    setProfileName('');
    setAvatarUrl('');
    setUserRole('cliente');
    setQuickBuyProducts([]);
    setTotalFavs(0);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('nome, avatar_url, role').eq('id', userId).single();
    if (data) {
      if (data.nome && data.nome !== 'Cliente Ozonteck') setProfileName(data.nome.split(' ')[0]);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
      if (data.role) setUserRole(data.role); // Salva se ele é admin
    }
  };

  const fetchQuickBuy = async (userId: string) => {
    const { data: allFavs } = await supabase.from('favoritos').select('produto_code').eq('user_id', userId);
    if (allFavs && allFavs.length > 0) {
      setTotalFavs(allFavs.length);
      const codes = allFavs.slice(0, 3).map(f => f.produto_code);
      const { data: prods } = await supabase.from('produtos').select('code, name, price, image_url, estoque').in('code', codes);
      if (prods) setQuickBuyProducts(prods);
    } else {
      setQuickBuyProducts([]);
      setTotalFavs(0);
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await supabase.auth.signOut();
    toast.success('Você saiu da conta.');
    router.push('/');
  };

  const handleQuickAdd = (product: any) => {
    addItem({
      id: product.code, code: product.code, name: product.name, price: Number(product.price), estoque: Number(product.estoque) || 99 
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  // OCULTA A NAVBAR DA LOJA SE ESTIVER NO PAINEL ADMIN
  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="w-full bg-[#FAFAFC]/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50 transition-all">
      <nav className="w-full flex items-center justify-between px-5 sm:px-10 lg:px-16 py-3 sm:py-4 max-w-[1800px] mx-auto h-[72px] sm:h-20 gap-4 lg:gap-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 shrink-0">
          <button onClick={() => router.push('/')} className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-teal-900 flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-500 w-5 h-5 lg:w-6 lg:h-6">
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="7" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="17" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
            <span className="hidden sm:inline">OZONTECK<span className="text-teal-500">.</span></span>
            <span className="sm:hidden text-lg">OZK<span className="text-teal-500">.</span></span>
          </button>
          <span className="text-[9px] lg:text-[11px] font-bold text-teal-600 sm:border-l sm:border-slate-300 sm:pl-4 uppercase tracking-widest mt-0.5 sm:mt-0 hidden md:block">
            Unidade Recife
          </span>
        </div>

        <div className="hidden md:block flex-1 max-w-2xl">
          <form onSubmit={handleSearchSubmit} className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400 group-focus-within:text-teal-600 transition-colors" />
            </div>
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder="Buscar óleos, séruns, kits..."
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-full text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 shadow-sm"
            />
            <button type="submit" className="absolute inset-y-0 right-1.5 my-1.5 px-4 bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 text-xs font-bold rounded-full transition-colors cursor-pointer">
              Buscar
            </button>
          </form>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          
          <Link href="/sobre_cliente" className="text-[10px] sm:text-xs lg:text-[12px] font-bold text-slate-500 hover:text-teal-600 transition-colors hidden xl:flex items-center gap-1.5 border-r border-slate-200 pr-4 lg:pr-6">
            <Info size={14} /> Nossa História
          </Link>

          <div className="text-[10px] sm:text-xs lg:text-[12px] font-bold text-slate-500 hidden xl:flex items-center gap-1.5 border-r border-slate-200 pr-4 lg:pr-6">
            <CheckCircle2 className="text-teal-500 w-3.5 h-3.5 lg:w-4 lg:h-4"/>
            Distribuidor Autorizado
          </div>

          <div className="flex items-center gap-1 sm:gap-4">
            
            {user ? (
              <>
                <div 
                  className="relative hidden sm:block"
                  onMouseEnter={() => { setFavsOpen(true); setProfileOpen(false); }}
                  onMouseLeave={() => setFavsOpen(false)}
                >
                  <Link href="/conta/favoritos" className="flex items-center gap-1.5 p-2 rounded-lg text-slate-600 hover:text-teal-600 hover:bg-slate-100 transition-colors">
                    <Heart size={20} strokeWidth={2} />
                    <span className="text-sm font-bold">Favoritos</span>
                    {totalFavs > 0 && (
                      <span className="bg-teal-100 text-teal-700 text-[10px] font-black px-1.5 py-0.5 rounded-full ml-1">
                        {totalFavs}
                      </span>
                    )}
                  </Link>

                  {favsOpen && (
                    <div className="absolute top-[100%] right-0 pt-2 z-50">
                      <div className="w-[320px] bg-white rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
                        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Adicionados Recentes</h3>
                          <Heart size={14} className="text-teal-600" />
                        </div>
                        
                        {quickBuyProducts.length > 0 ? (
                          <div className="flex flex-col">
                            {quickBuyProducts.map(prod => (
                              <div key={prod.code} className="flex items-center gap-3 p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group">
                                <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                                  {prod.image_url ? <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" /> : <Package size={14} className="text-slate-300" />}
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

                <div 
                  className="relative" 
                  onMouseEnter={() => { setProfileOpen(true); setFavsOpen(false); }}
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 sm:gap-3 hover:bg-slate-100 p-1.5 sm:pr-3 rounded-full transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  >
                    <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center border border-teal-200 overflow-hidden shrink-0 shadow-sm">
                      {avatarUrl ? <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" /> : profileName ? <span className="text-teal-700 font-black text-xs">{getInitials(profileName)}</span> : <User size={16} className="text-teal-700" />}
                    </div>
                    <div className="hidden sm:flex flex-col items-start text-left">
                      <span className="text-[10px] text-slate-500 font-medium leading-none">Olá, {profileName || 'Cliente'}</span>
                      <span className="text-sm font-bold text-slate-800 leading-tight flex items-center gap-1 mt-0.5">
                        Sua Conta <ChevronDown size={14} className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                      </span>
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="absolute top-[100%] right-0 pt-2 z-50">
                      <div className="w-[240px] bg-white rounded-2xl shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-sm font-bold text-slate-900">Minha Conta</p>
                        </div>
                        <div className="p-2 flex flex-col gap-1">
                          
                          {userRole === 'admin' && (
                            <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 transition-colors text-sm font-black border border-teal-200 mb-1">
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
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-5 py-2 rounded-full">
                <ShieldCheck size={14} className="text-teal-600" /> Acesso Seguro
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="flex items-center gap-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors px-5 py-2.5 rounded-full shadow-sm cursor-pointer">
                <LogIn size={14} /> Entrar
              </button>
            )}

            <Link href="/lista" className="relative p-2 ml-1 sm:ml-2 text-slate-600 hover:text-teal-600 transition-colors group flex items-center gap-2">
              <ShoppingCart size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform text-slate-800 group-hover:text-teal-600" />
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-0 sm:-top-1 sm:-right-1 flex items-center justify-center w-5 h-5 bg-teal-600 text-white text-[10px] font-black rounded-full border-2 border-[#FAFAFC] shadow-sm animate-in zoom-in">
                  {cartItemsCount}
                </span>
              )}
            </Link>

          </div>
        </div>
      </nav>
    </header>
  );
}