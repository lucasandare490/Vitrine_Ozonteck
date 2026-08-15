import { createClient } from '@supabase/supabase-js';

// Usamos a SERVICE_ROLE aqui porque o Admin precisa burlar o RLS para ver todos os pedidos
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Força a página a não usar cache, buscando sempre os pedidos mais recentes
export const revalidate = 0;

export default async function AdminDashboard() {
  const { data: pedidos, error } = await supabaseAdmin
    .from('pedidos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div className="p-4 text-red-400 bg-red-950/30 rounded-lg">Erro ao carregar o banco de dados.</div>;
  }

  // Cálculos automáticos para os cards de resumo
  const totalPedidos = pedidos?.length || 0;
  const faturamentoTotal = pedidos?.reduce((acc, curr) => {
    return curr.status_pagamento === 'approved' ? acc + Number(curr.valor_total) : acc;
  }, 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Cabeçalho da Página */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Visão Geral</h1>
        <p className="text-zinc-400 mt-1">Acompanhe as vendas e gerencie os pedidos da loja.</p>
      </header>

      {/* Cards de Resumo (Métricas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Faturamento Confirmado</h3>
          <p className="text-3xl font-bold text-emerald-400 mt-2">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoTotal)}
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Total de Pedidos</h3>
          <p className="text-3xl font-bold text-white mt-2">{totalPedidos}</p>
        </div>
        <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-md">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Conversão de Sucesso</h3>
          <p className="text-3xl font-bold text-blue-400 mt-2">
             {totalPedidos > 0 
                ? Math.round((pedidos.filter(p => p.status_pagamento === 'approved').length / totalPedidos) * 100) 
                : 0}%
          </p>
        </div>
      </div>

      {/* Tabela Profissional de Pedidos */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/80 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">Cliente</th>
                <th className="px-6 py-4 font-medium">Contato</th>
                <th className="px-6 py-4 font-medium">Data</th>
                <th className="px-6 py-4 font-medium">Valor</th>
                <th className="px-6 py-4 font-medium">Status MP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {pedidos?.map((pedido) => (
                <tr key={pedido.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{pedido.nome_cliente}</td>
                  <td className="px-6 py-4 text-zinc-400">{pedido.telefone_cliente}</td>
                  <td className="px-6 py-4 text-zinc-400">
                    {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-300">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                      ${pedido.status_pagamento === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : pedido.status_pagamento === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                      {pedido.status_pagamento === 'approved' ? 'Aprovado' : pedido.status_pagamento === 'pending' ? 'Pendente' : pedido.status_pagamento}
                    </span>
                  </td>
                </tr>
              ))}
              
              {(!pedidos || pedidos.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Nenhum pedido registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}