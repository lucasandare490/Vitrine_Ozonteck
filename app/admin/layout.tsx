import Link from 'next/link';
import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex font-sans">
      
      {/* Sidebar - Menu Lateral com efeito Glass */}
      <aside className="w-64 bg-zinc-900/50 backdrop-blur-xl border-r border-zinc-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold tracking-tight text-white">Ozonteck<span className="text-zinc-500">Admin</span></h2>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="block px-4 py-3 rounded-lg bg-zinc-800/50 text-white font-medium border border-zinc-700/50 transition-colors hover:bg-zinc-800">
            Painel Geral
          </Link>
          <Link href="/admin/produtos" className="block px-4 py-3 rounded-lg text-zinc-400 font-medium transition-colors hover:bg-zinc-800/50 hover:text-white">
            Gerenciar Produtos
          </Link>
          <Link href="/admin/configuracoes" className="block px-4 py-3 rounded-lg text-zinc-400 font-medium transition-colors hover:bg-zinc-800/50 hover:text-white">
            Configurações
          </Link>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <Link href="/" className="block px-4 py-2 text-sm text-center text-zinc-400 hover:text-white transition-colors">
            ← Voltar para a Loja
          </Link>
        </div>
      </aside>

      {/* Área Principal de Conteúdo */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
      
    </div>
  );
}