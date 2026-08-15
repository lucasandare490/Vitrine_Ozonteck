'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, LogIn, LogOut, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter(); 
  const pathname = usePathname(); // Pegando a rota atual

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="w-full bg-[#FAFAFC]/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-50">
      <nav className="w-full flex items-center justify-between px-5 sm:px-10 lg:px-16 py-3 sm:py-4 max-w-[1800px] mx-auto h-20">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 lg:gap-5">
          <button 
            onClick={() => router.push('/')} 
            className="text-lg sm:text-xl lg:text-2xl font-black tracking-tighter text-teal-900 flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
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
        
        <div className="flex items-center gap-4 lg:gap-6">
          <button 
            onClick={() => router.push('/sobre_cliente')}
            className="text-xs lg:text-[13px] font-bold bg-white border border-teal-200 text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 px-5 py-2 lg:px-6 lg:py-2 rounded-full transition-all shadow-sm hidden md:block cursor-pointer"
          >
            Nossa História
          </button>
          
          <div className="text-[10px] sm:text-xs lg:text-[13px] font-bold text-slate-500 hidden xl:flex items-center gap-2 border-l border-slate-200 pl-4 lg:pl-6">
            <CheckCircle2 className="text-teal-500 w-3.5 h-3.5 lg:w-4 lg:h-4"/>
            Distribuidor Autorizado
          </div>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-4 lg:pl-6">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Bem-vindo(a)</span>
                  <span className="text-xs font-bold text-slate-800">{user.user_metadata?.nome?.split(' ')[0] || 'Cliente'}</span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-100 hover:bg-red-50 rounded-full cursor-pointer" 
                  title="Sair da conta"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : pathname === '/login' ? (
              /* SE JÁ ESTIVER NA TELA DE LOGIN, MOSTRA SELO DE SEGURANÇA */
              <div className="flex items-center gap-2 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-100 px-5 py-2 rounded-full">
                <ShieldCheck size={14} className="text-teal-600" />
                Acesso Seguro
              </div>
            ) : (
              /* SE ESTIVER EM OUTRAS TELAS, MOSTRA BOTÃO DE ENTRAR NORMAL */
              <button 
                onClick={() => router.push('/login')} 
                className="flex items-center gap-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors px-5 py-2 rounded-full shadow-sm cursor-pointer"
              >
                <LogIn size={14} />
                Entrar
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}