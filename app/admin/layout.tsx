'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Package, ArrowLeft, ShieldAlert, LogOut, 
  Users, ShoppingCart, Tags, Sun, Moon, Activity
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import { signOutWithCart } from '@/lib/cart-session';
import { useThemeStore } from '@/store/useThemeStore';
import Image from 'next/image';
import AdminNotifications from '@/components/AdminNotifications';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminAvatar, setAdminAvatar] = useState('');
  
const { theme, toggleTheme } = useThemeStore();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

  }, [theme]);

  useEffect(() => {
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
    void checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try { await signOutWithCart(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível sair. Tente novamente.'); return; }
    router.push('/');
  };

  const getLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all text-xs ${
      isActive 
        ? 'bg-teal-100 dark:bg-teal-500/10 text-teal-800 dark:text-teal-400' 
        : 'text-slate-600 dark:text-[#A1A1AA] hover:bg-slate-100 dark:hover:bg-[#262626] hover:text-slate-900 dark:hover:text-[#F0F0F0]'
    }`;
  };

  if (isAuthorized === null || !mounted) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] dark:bg-[#121212] flex flex-col items-center justify-center text-slate-500 dark:text-[#A1A1AA]">
        <ShieldAlert size={40} className="mb-4 animate-pulse text-teal-600 dark:text-teal-500" />
        <p className="text-[10px] font-bold tracking-widest uppercase">Estabelecendo Conexão Segura...</p>
      </div>
    );
  }

  return (
    <div className={`${theme} flex min-h-screen bg-[#FAFAFC] dark:bg-[#121212] text-slate-900 dark:text-[#F0F0F0] transition-colors duration-300`}>
      
      {/* MENU LATERAL */}
      <aside className="w-64 shrink-0 bg-white dark:bg-[#171717] border-r border-slate-200 dark:border-[#2D2D2D] flex flex-col hidden lg:flex z-20 transition-colors">
        <div className="h-[72px] px-6 border-b border-slate-200 dark:border-[#2D2D2D] flex items-center shrink-0">
          <h2 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
            Ozonteck<span className="text-teal-600 dark:text-teal-500">PRO</span>
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6 scrollbar-thin">
          <div className="space-y-1">
            <div className="px-2 mb-2 text-[10px] font-black text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest">Painel Central</div>
            <Link href="/admin" className={getLinkClass('/admin')}>
              <LayoutDashboard size={16} /> Visão Geral
            </Link>
          </div>

          <div className="space-y-1">
            <div className="px-2 mb-2 text-[10px] font-black text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest">Gestão de Vendas</div>
            <Link href="/admin/pedidos" className={getLinkClass('/admin/pedidos')}>
              <ShoppingCart size={16} /> Auditoria de Pedidos
            </Link>
            <Link href="/admin/clientes" className={getLinkClass('/admin/clientes')}>
              <Users size={16} /> Carteira de Clientes
            </Link>
          </div>

          <div className="space-y-1">
            <div className="px-2 mb-2 text-[10px] font-black text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest">Catálogo & Estoque</div>
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
        <header className="min-h-[72px] bg-white dark:bg-[#171717] border-b border-slate-200 dark:border-[#2D2D2D] flex flex-wrap gap-3 py-3 items-center justify-between px-4 sm:px-6 lg:px-10 shrink-0 transition-colors">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-900 dark:text-[#A1A1AA] dark:hover:text-white transition-colors uppercase tracking-widest bg-slate-100 dark:bg-[#202020] px-3 py-1.5 rounded-full border border-transparent dark:border-[#2D2D2D]">
              <ArrowLeft size={14} /> Retornar à Vitrine
            </Link>
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-[#A1A1AA]">
              <Activity size={14} /> Painel Administrativo
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            
            <button 
              onClick={toggleTheme} 
              aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#202020] hover:bg-slate-200 dark:hover:bg-[#262626] text-slate-500 dark:text-[#A1A1AA] hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer border border-slate-200 dark:border-[#2D2D2D] shadow-sm dark:shadow-none"
            >
              {theme === 'dark' ? <Moon size={14} className="text-teal-400" /> : <Sun size={14} className="text-amber-500" />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                {theme === 'dark' ? 'Escuro' : 'Claro'}
              </span>
            </button>

            <AdminNotifications />
            
            <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-slate-200 dark:border-[#2D2D2D]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{adminName}</p>
                <p className="text-[10px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-widest mt-1">Diretor(a)</p>
              </div>
              <button onClick={handleLogout} className="relative w-10 h-10 rounded-full bg-slate-200 dark:bg-[#202020] border-2 border-slate-300 dark:border-[#2D2D2D] flex items-center justify-center overflow-hidden hover:border-red-500 dark:hover:border-red-500 transition-colors cursor-pointer" title="Sair do Painel">
                {adminAvatar ? <Image src={adminAvatar} alt="Admin" fill sizes="40px" className="object-cover" /> : <LogOut size={16} className="text-slate-500 dark:text-[#A1A1AA]" />}
              </button>
            </div>

          </div>
        </header>

        <nav aria-label="Navegação administrativa" className="flex overflow-x-auto gap-1 border-b border-slate-200 bg-white p-3 dark:bg-[#171717] lg:hidden [&>a]:shrink-0">
          {[
            ['/admin', 'Visão geral'], ['/admin/pedidos', 'Pedidos'],
            ['/admin/clientes', 'Clientes'], ['/admin/produtos', 'Produtos'],
            ['/admin/categorias', 'Categorias'],
          ].map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={`${getLinkClass(href)} min-h-11`}>{label}</Link>)}
        </nav>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
