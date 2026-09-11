'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, TrendingUp, Package, Truck, Clock, AlertCircle, Eye, X, MapPin, User, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function VisaoGeralAdmin() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para o Modal de Gestão
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);
  const [isAtualizando, setIsAtualizando] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(`Erro ao carregar pedidos: ${error.message}`);
    } else {
      setPedidos(data || []);
    }
    setLoading(false);
  }

  // Função para mudar o status do pedido (Preparando -> Enviado)
  const handleAtualizarStatus = async (id: string, novoStatus: string) => {
    setIsAtualizando(true);
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Pedido marcado como ${novoStatus.toUpperCase()}!`);
      setPedidoSelecionado(null);
      fetchDashboardData(); // Recarrega a tabela
    } catch (error: any) {
      toast.error(`Erro ao atualizar: ${error.message}`);
    } finally {
      setIsAtualizando(false);
    }
  };

  const faturamentoTotal = pedidos.reduce((acc, curr) => acc + Number(curr.valor_total), 0);
  const pedidosPendentes = pedidos.filter(p => p.status === 'preparando' || p.status === 'pending').length;
  const pedidosEnviados = pedidos.filter(p => p.status === 'enviado').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0f0f11] p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard className="text-teal-600 dark:text-teal-500" /> Visão Geral
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1 text-xs font-medium">
            Resumo de vendas e acompanhamento da fila de despacho.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#0f0f11] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 rounded-full flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-500/20">
            <TrendingUp size={20} className="text-teal-600 dark:text-teal-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Faturamento Total</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoTotal)}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f0f11] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
            <Package size={20} className="text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Fila de Despacho</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {pedidosPendentes} <span className="text-sm font-medium text-slate-500">pendentes</span>
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f0f11] p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
            <Truck size={20} className="text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">Em Trânsito / Entregue</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {pedidosEnviados} <span className="text-sm font-medium text-slate-500">pedidos</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f0f11] border border-slate-200 dark:border-zinc-800/60 rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-zinc-800/60 bg-slate-50/50 dark:bg-transparent">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Clock size={16} className="text-amber-500" /> Fila de Despacho (Recentes)
          </h2>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-600">
              <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-bold uppercase tracking-widest">Carregando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-zinc-800">
                <AlertCircle size={32} className="text-slate-300 dark:text-zinc-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">Nenhum pedido recebido ainda</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 max-w-sm">
                Quando os clientes finalizarem compras na vitrine, elas aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Data / ID</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Cliente</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Valor</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {pedidos.slice(0, 10).map((pedido) => {
                  const nomeCliente = pedido.endereco_entrega?.nome || 'Cliente não identificado';
                  const telefoneCliente = pedido.endereco_entrega?.telefone || 'Sem telefone';
                  
                  return (
                    <tr key={pedido.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">
                          {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          #{pedido.id.split('-')[0]}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-700 dark:text-zinc-300">{nomeCliente}</p>
                        <p className="text-[10px] text-slate-500">{telefoneCliente}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-teal-600 dark:text-teal-400 text-xs">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                      </td>
                      <td className="px-6 py-4">
                        {pedido.status === 'preparando' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
                            Preparando
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Truck size={10} /> {pedido.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setPedidoSelecionado(pedido)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-zinc-300 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                        >
                          <Eye size={12} /> Gerenciar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL DE GESTÃO DO PEDIDO */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f0f11] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tighter">
                  Pedido #{pedidoSelecionado.id.split('-')[0]}
                </h3>
                <p className="text-[10px] font-medium text-slate-500">Realizado em {new Date(pedidoSelecionado.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setPedidoSelecionado(null)} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-xl cursor-pointer p-2">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin space-y-6">
              
              {/* Box Cliente e Endereço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><User size={14}/> Cliente</h4>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{pedidoSelecionado.endereco_entrega?.nome || 'Não informado'}</p>
                    <p className="text-xs text-slate-500 mt-1">Tel: {pedidoSelecionado.endereco_entrega?.telefone || 'Não informado'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2"><MapPin size={14}/> Entrega</h4>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{pedidoSelecionado.endereco_entrega?.rua || 'Endereço não preenchido'}</p>
                    <p className="text-xs text-slate-500 mt-1">{pedidoSelecionado.endereco_entrega?.cidade || ''} {pedidoSelecionado.endereco_entrega?.estado || ''}</p>
                  </div>
                </div>
              </div>

              {/* Box Itens do Pedido */}
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Package size={14}/> Itens Comprados</h4>
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  {pedidoSelecionado.itens && Array.isArray(pedidoSelecionado.itens) ? (
                    pedidoSelecionado.itens.map((item: any, idx: number) => (
                      <li key={idx} className="p-3 bg-white dark:bg-[#0f0f11] flex justify-between items-center hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{item.nome || 'Produto Indefinido'}</span>
                        <span className="text-xs font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-slate-600 dark:text-zinc-400">Qtd: {item.qtd || 1}</span>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-sm text-slate-500 text-center">Nenhum item listado.</li>
                  )}
                </ul>
                <div className="mt-4 flex justify-between items-center p-4 bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-100 dark:border-teal-500/20">
                  <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Total Pago</span>
                  <span className="text-lg font-bold text-teal-700 dark:text-teal-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedidoSelecionado.valor_total)}
                  </span>
                </div>
              </div>

            </div>

            {/* Ações (Despachar) */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex justify-end gap-3 shrink-0">
              <button onClick={() => setPedidoSelecionado(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                Fechar
              </button>
              
              {pedidoSelecionado.status === 'preparando' ? (
                <button 
                  disabled={isAtualizando}
                  onClick={() => handleAtualizarStatus(pedidoSelecionado.id, 'enviado')} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {isAtualizando ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                  Marcar como Enviado
                </button>
              ) : (
                <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold cursor-not-allowed">
                  <CheckCircle2 size={16} /> Pedido já despachado
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}