'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, LogIn, LogOut, ShieldCheck, User, Package, ChevronDown, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const router = useRouter(); 
  const pathname = usePathname();

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    // Escuta mudanças (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfileName('');
      }
    });

    // Fechar dropdown ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('nome').eq('id', userId).single();
    if (data && data.nome) {
      setProfileName(data.nome.split(' ')[0]); // Pega só o primeiro nome
    }
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="w-full bg-[#FAFAFC]/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50">
      <nav className="w-full flex items-center justify-between px-5 sm:px-10 lg:px-16 py-3 sm:py-4 max-w-[1800px] mx-auto h-20">
        
        {/* LOGO */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 lg:gap-5">
          <button onClick={() => router.push('/')} className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-teal-900 flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-teal-500 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6">
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="7" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="17" cy="15" r="4" stroke="currentColor" strokeWidth="2.5"/>
            </svg>
            OZONTECK<span className="text-teal-500">.</span>
          </button>
          <span className="text-[9px] lg:text-[11px] font-bold text-teal-600 sm:border-l sm:border-slate-300 sm:pl-4 lg:pl-5 uppercase tracking-widest mt-0.5 sm:mt-0">
            Unidade Recife
          </span>
        </div>
        
        {/* LADO DIREITO */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button onClick={() => router.push('/sobre_cliente')} className="text-xs lg:text-[13px] font-bold bg-white border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 px-5 py-2 lg:px-6 lg:py-2 rounded-full transition-all shadow-sm hidden md:block cursor-pointer">
            Nossa História
          </button>
          
          <div className="text-[10px] sm:text-xs lg:text-[13px] font-bold text-slate-500 hidden xl:flex items-center gap-2 border-l border-slate-200 pl-4 lg:pl-6">
            <CheckCircle2 className="text-teal-500 w-3.5 h-3.5 lg:w-4 lg:h-4"/>
            Distribuidor Autorizado
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-4 lg:pl-6 relative" ref={dropdownRef}>
            {user ? (
              <>
                {/* BOTÃO DO USUÁRIO LOGADO */}
                <button 
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 sm:gap-3 hover:bg-slate-100 p-1.5 sm:pr-3 rounded-full transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center border border-teal-200">
                    <User size={16} className="text-teal-700" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider leading-none">Olá,</span>
                    <span className="text-xs font-bold text-slate-800 leading-tight">{profileName || 'Cliente'}</span>
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* MENU DROPDOWN ESTILO MERCADO LIVRE/AMAZON */}
                {menuOpen && (
                  <div className="absolute top-[120%] right-0 w-64 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-[0_10px_40px_rgb(0,0,0,0.08)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">Conta Cliente</p>
                    </div>
                    
                    <div className="p-2 flex flex-col gap-1">
                      <Link href="/conta" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-colors text-sm font-semibold">
                        <LayoutDashboard size={16} /> Meu Painel
                      </Link>
                      <Link href="/conta" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-teal-50 text-slate-600 hover:text-teal-700 transition-colors text-sm font-semibold">
                        <Package size={16} /> Meus Pedidos
                      </Link>
                    </div>

                    <div className="p-2 border-t border-slate-100">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors text-sm font-semibold cursor-pointer">
                        <LogOut size={16} /> Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : pathname === '/login' ? (
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-5 py-2 rounded-full">
                <ShieldCheck size={14} className="text-teal-600" />
                Acesso Seguro
              </div>
            ) : (
              <button onClick={() => router.push('/login')} className="flex items-center gap-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors px-5 py-2 rounded-full shadow-sm cursor-pointer">
                <LogIn size={14} /> Entrar
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}