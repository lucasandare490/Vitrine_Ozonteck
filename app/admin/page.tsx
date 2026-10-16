'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, TrendingUp, Package, Truck, Clock, AlertCircle, Eye, MapPin, User, CheckCircle2, Loader2, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminOrderContact from '@/components/AdminOrderContact';
import AdminOrderSummary from '@/components/AdminOrderSummary';
import { orderAddressText } from '@/lib/order-contact';

type AdminOrderItem = { nome: string; qtd: number };
type AdminDeliveryAddress = {
  nome?: string;
  telefone?: string;
  rua?: string;
  cidade?: string;
  estado?: string;
};
type AdminOrder = {
  id: string;
  status: string;
  valor_total: number;
  itens: AdminOrderItem[];
  endereco_entrega: AdminDeliveryAddress | null;
  created_at: string;
};

export default function VisaoGeralAdmin() {
  const [pedidos, setPedidos] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [pedidoSelecionado, setPedidoSelecionado] = useState<AdminOrder | null>(null);
  const [isAtualizando, setIsAtualizando] = useState(false);
  
  const [ordemFila, setOrdemFila] = useState<'antigos' | 'recentes'>('antigos');

  async function fetchDashboardData() {
    const { data, error } = await supabase
      .from('pedidos')
      .select('id, status, valor_total, itens, endereco_entrega, created_at');

    if (error) {
      toast.error(`Erro ao carregar pedidos: ${error.message}`);
    } else {
      setPedidos(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchDashboardData(), 0);
    const refresh = () => { if (document.visibilityState === 'visible') void fetchDashboardData(); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, []);

  const handleAtualizarStatus = async (id: string, novoStatus: string) => {
    setIsAtualizando(true);
    try {
      const { error } = await supabase.from('pedidos').update({ status: novoStatus }).eq('id', id);
      if (error) throw error;
      
      toast.success(`Status alterado para: ${novoStatus.toUpperCase()}!`);
      setPedidoSelecionado((current) => current ? { ...current, status: novoStatus } : current);
      fetchDashboardData(); 
    } catch (error: unknown) {
      toast.error(`Erro ao atualizar: ${error instanceof Error ? error.message : 'erro desconhecido'}`);
    } finally {
      setIsAtualizando(false);
    }
  };

  // OTIMIZAÇÃO: Cálculos pesados memorizados para evitar re-renderizações desnecessárias
  const faturamentoTotal = useMemo(() => pedidos.filter(p => ['preparando', 'enviado', 'entregue'].includes(p.status)).reduce((acc, curr) => acc + Number(curr.valor_total), 0), [pedidos]);
  const pedidosPendentes = useMemo(() => pedidos.filter(p => p.status === 'preparando').length, [pedidos]);
  const pedidosEnviados = useMemo(() => pedidos.filter(p => p.status === 'enviado').length, [pedidos]);

  const filaDespacho = useMemo(() => {
    const fila = pedidos.filter(p => ['preparando', 'enviado'].includes(p.status));
    return fila.sort((a, b) => {
      if (ordemFila === 'antigos') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
  }, [pedidos, ordemFila]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'preparando':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Preparando
          </span>
        );
      case 'enviado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Truck size={10} /> Enviado
          </span>
        );
      case 'entregue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <CheckCircle2 size={10} /> Entregue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-[#202020] text-slate-700 dark:text-[#A1A1AA] border border-slate-200 dark:border-[#2D2D2D]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <AdminOrderSummary orders={pedidos} ready={!loading} />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#171717] p-6 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] shadow-sm dark:shadow-none transition-colors">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-[#F0F0F0] flex items-center gap-2">
            <LayoutDashboard className="text-teal-600 dark:text-teal-500" /> Visão Geral
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 text-xs font-medium">
            Resumo de vendas e acompanhamento da fila de despacho.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#171717] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-teal-50 dark:bg-teal-500/10 rounded-full flex items-center justify-center shrink-0 border border-teal-100 dark:border-teal-500/20">
            <TrendingUp size={20} className="text-teal-600 dark:text-teal-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest mb-0.5">Faturamento Total</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoTotal)}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#171717] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/20">
            <Package size={20} className="text-amber-600 dark:text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest mb-0.5">Fila de Despacho</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {pedidosPendentes} <span className="text-sm font-medium text-slate-500 dark:text-[#A1A1AA]">pendentes</span>
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#171717] p-5 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/20">
            <Truck size={20} className="text-blue-600 dark:text-blue-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest mb-0.5">Em Trânsito</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {pedidosEnviados} <span className="text-sm font-medium text-slate-500 dark:text-[#A1A1AA]">pedidos</span>
            </h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2D2D2D] rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden transition-colors">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#2D2D2D] bg-slate-50/50 dark:bg-[#171717]">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-[#F0F0F0] flex items-center gap-2 mb-4 sm:mb-0">
            <Clock size={16} className="text-amber-500" /> Fila de Despacho Ativa
          </h2>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown size={14} className="text-slate-400 dark:text-[#A1A1AA]" />
            <select 
              value={ordemFila} 
              onChange={(e) => setOrdemFila(e.target.value as 'antigos' | 'recentes')}
              className="w-full sm:w-auto px-3 py-1.5 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#2D2D2D] rounded-lg text-xs font-bold text-slate-700 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="antigos">Mais Antigos (Prioridade)</option>
              <option value="recentes">Mais Recentes Adicionados</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-[#A1A1AA]">
              <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4"></div>
              <p className="text-xs font-bold uppercase tracking-widest">Carregando fila...</p>
            </div>
          ) : filaDespacho.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-[#202020] rounded-full flex items-center justify-center mb-4 border border-slate-100 dark:border-[#2D2D2D]">
                <AlertCircle size={32} className="text-slate-300 dark:text-[#A1A1AA]" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">A fila de despacho está limpa!</h3>
              <p className="text-sm font-medium text-slate-500 dark:text-[#A1A1AA] max-w-sm">
                Todos os pedidos já foram entregues. Assim que houver novas vendas, elas aparecerão aqui.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-[#202020] border-b border-slate-200 dark:border-[#2D2D2D] text-slate-500 dark:text-[#A1A1AA]">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Data / Hora</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Cliente</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Valor</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2D2D2D]">
                {filaDespacho.map((pedido) => {
                  const nomeCliente = pedido.endereco_entrega?.nome || 'Cliente não identificado';
                  const telefoneCliente = pedido.endereco_entrega?.telefone || 'Sem telefone';
                  
                  return (
                    <tr key={pedido.id} className="hover:bg-slate-50 dark:hover:bg-[#262626] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900 dark:text-[#F0F0F0]">
                          {new Date(pedido.created_at).toLocaleDateString('pt-BR')} às {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-[#A1A1AA] mt-0.5">
                          #{pedido.id.split('-')[0]}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-700 dark:text-[#E5E5E5]">{nomeCliente}</p>
                        <p className="text-[10px] text-slate-500 dark:text-[#A1A1AA]">{telefoneCliente}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-teal-600 dark:text-teal-400 text-xs">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(pedido.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setPedidoSelecionado(pedido)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#333333] hover:bg-teal-600 dark:hover:bg-teal-500 hover:text-white dark:hover:text-white text-slate-700 dark:text-[#F0F0F0] transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#171717] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D2D2D] overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#2D2D2D] bg-slate-50 dark:bg-[#202020] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-[#F0F0F0] uppercase tracking-tighter flex items-center gap-2">
                  Pedido #{pedidoSelecionado.id.split('-')[0]}
                  {getStatusBadge(pedidoSelecionado.status)}
                </h3>
                <p className="text-[10px] font-medium text-slate-500 dark:text-[#A1A1AA] mt-1">Realizado em {new Date(pedidoSelecionado.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setPedidoSelecionado(null)} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-xl cursor-pointer p-2">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2D2D2D] bg-slate-50/50 dark:bg-[#202020] space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#A1A1AA] flex items-center gap-2"><User size={14}/> Cliente</h4>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-[#F0F0F0]">{pedidoSelecionado.endereco_entrega?.nome || 'Não informado'}</p>
                    <p className="text-xs text-slate-500 dark:text-[#A1A1AA] mt-1">Tel: {pedidoSelecionado.endereco_entrega?.telefone || 'Não informado'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2D2D2D] bg-slate-50/50 dark:bg-[#202020] space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#A1A1AA] flex items-center gap-2"><MapPin size={14}/> Entrega</h4>
                  <div>
                    <p className="text-sm break-words font-bold text-slate-900 dark:text-[#F0F0F0]">{orderAddressText(pedidoSelecionado.endereco_entrega) || 'Endereço não preenchido'}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-[#A1A1AA] mb-3 flex items-center gap-2"><Package size={14}/> Itens Comprados</h4>
                <ul className="divide-y divide-slate-100 dark:divide-[#2D2D2D] border border-slate-200 dark:border-[#2D2D2D] rounded-xl overflow-hidden">
                  {pedidoSelecionado.itens && Array.isArray(pedidoSelecionado.itens) ? (
                    pedidoSelecionado.itens.map((item, idx) => (
                      <li key={idx} className="p-3 bg-white dark:bg-[#171717] flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#262626] transition-colors">
                        <span className="text-sm font-medium text-slate-700 dark:text-[#E5E5E5]">{item.nome || 'Produto Indefinido'}</span>
                        <span className="text-xs font-bold bg-slate-100 dark:bg-[#262626] px-2 py-1 rounded text-slate-600 dark:text-[#A1A1AA]">Qtd: {item.qtd || 1}</span>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-sm text-slate-500 dark:text-[#A1A1AA] text-center">Nenhum item listado.</li>
                  )}
                </ul>
                <div className="mt-4 flex justify-between items-center p-4 bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-100 dark:border-teal-500/20">
                  <span className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-400">Total do pedido</span>
                  <span className="text-lg font-bold text-teal-700 dark:text-teal-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedidoSelecionado.valor_total)}
                  </span>
                </div>
              </div>
              <AdminOrderContact id={pedidoSelecionado.id} address={pedidoSelecionado.endereco_entrega} />
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-[#2D2D2D] bg-slate-50 dark:bg-[#202020] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-widest hidden sm:block">Alterar Status:</span>
                <select 
                  value={pedidoSelecionado.status} 
                  onChange={(e) => handleAtualizarStatus(pedidoSelecionado.id, e.target.value)}
                  disabled={isAtualizando}
                  className="px-3 py-2 bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2D2D2D] rounded-lg text-xs font-bold text-slate-700 dark:text-[#F0F0F0] focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="preparando">📦 Preparando</option>
                  <option value="enviado">🚚 Enviado</option>
                  <option value="entregue">✅ Entregue</option>
                </select>
                {isAtualizando && <Loader2 size={14} className="animate-spin text-teal-500" />}
              </div>

              <button onClick={() => setPedidoSelecionado(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-[#A1A1AA] hover:bg-slate-200 dark:hover:bg-[#333333] transition-colors cursor-pointer">
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
