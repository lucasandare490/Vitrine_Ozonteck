'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Package, Settings, ArrowLeft, ShieldAlert, LogOut, 
  Users, ShoppingCart, Tags, Star, Database, Bell, Sun, Moon, Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { useThemeStore } from '@/store/useThemeStore';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminAvatar, setAdminAvatar] = useState('');
  
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Aplica a classe dark direto na raiz (HTML) para o Tailwind ler
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');
      
      const { data: profile, error } = await supabase.from('profiles').select('nome, avatar_url, role').eq('id', session.user.id).single();

      if (error || profile?.role !== 'admin') {
        toast.error('Acesso restrito à Diretoria.');
        router.push('/');
      } else {
        setAdminName(profile.nome || 'Administrador');
        setAdminAvatar(profile.avatar_url || '');
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router, theme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Função inteligente que descobre se o botão deve ficar verde ou cinza
  // Atualizada para ter um contraste mais forte no modo claro (bg-teal-100 e text-teal-800)
  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-xs ${
      isActive 
        ? 'bg-teal-100 dark:bg-teal-500/10 text-teal-800 dark:text-teal-400' 
        : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 hover:text-slate-900 dark:hover:text-zinc-200'
    }`;
  };

  if (isAuthorized === null || !mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#09090b] flex flex-col items-center justify-center text-slate-500 dark:text-zinc-500">
        <ShieldAlert size={40} className="mb-4 animate-pulse text-teal-600 dark:text-teal-500" />
        <p className="text-[10px] font-bold tracking-widest uppercase">Estabelecendo Conexão Segura...</p>
      </div>
    );
  }

  return (
    // Removido o "font-sans" daqui para permitir que a nova fonte seja carregada
    <div className={`${theme} flex min-h-screen bg-[#FAFAFC] dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 transition-colors duration-300`}>
      
      {/* MENU LATERAL */}
      <aside className="w-64 bg-white dark:bg-[#0f0f11] border-r border-slate-200 dark:border-zinc-800/60 flex flex-col hidden md:flex z-20">
        <div className="h-[72px] px-6 border-b border-slate-200 dark:border-zinc-800/60 flex items-center shrink-0">
          <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
            Ozonteck<span className="text-teal-600 dark:text-teal-500">PRO</span>
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-thin">
          <div className="space-y-1">
            <div className="px-2 mb-2 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Painel Central</div>
            <Link href="/admin" className={getLinkClass('/admin')}>
              <LayoutDashboard size={16} /> Visão Geral
            </Link>
          </div>

          <div className="space-y-1">
            <div className="px-2 mb-2 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Gestão de Vendas</div>
            <Link href="/admin/pedidos" className={getLinkClass('/admin/pedidos')}>
              <ShoppingCart size={16} /> Auditoria de Pedidos
            </Link>
            <Link href="/admin/clientes" className={getLinkClass('/admin/clientes')}>
              <Users size={16} /> Carteira de Clientes
            </Link>
          </div>

          <div className="space-y-1">
            <div className="px-2 mb-2 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Catálogo & Estoque</div>
            <Link href="/admin/produtos" className={getLinkClass('/admin/produtos')}>
              <Package size={16} /> Todos os Produtos
            </Link>
            <Link href="/admin/categorias" className={getLinkClass('/admin/categorias')}>
              <Tags size={16} /> Categorias
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR */}
        <header className="h-[72px] bg-white dark:bg-[#0f0f11] border-b border-slate-200 dark:border-zinc-800/60 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-zinc-500 dark:hover:text-white transition-colors uppercase tracking-widest bg-slate-100 dark:bg-zinc-800/50 px-3 py-1.5 rounded-full">
              <ArrowLeft size={14} /> Retornar à Vitrine
            </Link>
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-500">
              <Activity size={14} className="animate-pulse" /> Sistema Online
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            
            <button 
              onClick={toggleTheme} 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-zinc-800/50 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700/50 shadow-sm dark:shadow-none"
            >
              {theme === 'dark' ? <Moon size={14} className="text-teal-500" /> : <Sun size={14} className="text-amber-500" />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                {theme === 'dark' ? 'Escuro' : 'Claro'}
              </span>
            </button>

            <button className="text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white relative cursor-pointer">
              <Bell size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#0f0f11] rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-slate-200 dark:border-zinc-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{adminName}</p>
                <p className="text-[10px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-widest mt-1">Diretor(a)</p>
              </div>
              <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 border-2 border-slate-300 dark:border-zinc-700 flex items-center justify-center overflow-hidden hover:border-red-500 transition-colors cursor-pointer" title="Sair do Painel">
                {adminAvatar ? <img src={adminAvatar} alt="Admin" className="w-full h-full object-cover" /> : <LogOut size={16} className="text-slate-500 dark:text-zinc-400" />}
              </button>
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}