'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Search, Filter, Loader2, AlertCircle, Eye, Package, Truck, CheckCircle, MapPin, User, Star, MessageCircle, AlertTriangle, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ProductReviewModeration from '@/components/ProductReviewModeration';
import StoreReviewModeration from '@/components/StoreReviewModeration';
import AdminOrderContact from '@/components/AdminOrderContact';
import AdminOrderSummary from '@/components/AdminOrderSummary';
import AdminOrderChanges from '@/components/AdminOrderChanges';
import { orderAddressText } from '@/lib/order-contact';
import { isOpenPayment } from '@/lib/order-status';

type Review = {
  id: string;
  pedido_id: string;
  nome_cliente: string;
  nota: number;
  comentario: string;
  created_at: string;
};
type AuditOrderItem = { nome: string; qtd: number };
type AuditDeliveryAddress = {
  nome?: string;
  telefone?: string;
  rua?: string;
  cidade?: string;
  estado?: string;
};
type AuditOrder = {
  id: string;
  status: string;
  valor_total: number;
  itens: AuditOrderItem[];
  endereco_entrega: AuditDeliveryAddress | null;
  created_at: string;
};
type SelectedAuditOrder = AuditOrder & { avaliacao?: Review };

export default function AuditoriaPedidos() {
  const [pedidos, setPedidos] = useState<AuditOrder[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [sortBy, setSortBy] = useState('data_desc');
  
  const [pedidoSelecionado, setPedidoSelecionado] = useState<SelectedAuditOrder | null>(null);
  const selectedReview = pedidoSelecionado?.avaliacao;

  const fetchData = async () => {
    
    const { data: pedidosData, error: pedidosError } = await supabase
      .from('pedidos')
      .select('id, status, valor_total, itens, endereco_entrega, created_at');
    const { data: avaliacoesData, error: avaliacoesError } = await supabase
      .from('avaliacoes')
      .select('id, pedido_id, nome_cliente, nota, comentario, created_at');

    if (pedidosError || avaliacoesError) {
      toast.error(`Erro ao carregar dados.`);
    } else {
      setPedidos(pedidosData || []);
      setAvaliacoes(avaliacoesData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('pedido');
    const timer = window.setTimeout(() => { if (orderId) setSearchTerm(orderId); void fetchData(); }, 0);
    const refresh = () => { if (document.visibilityState === 'visible') void fetchData(); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, []);

  // OTIMIZAÇÃO: Filtro pesado envelopado em useMemo para não travar a UI enquanto o usuário digita na barra de busca
  const pedidosFiltrados = useMemo(() => {
    const filtrados = pedidos.filter((pedido) => {
      const nomeCliente = pedido.endereco_entrega?.nome?.toLowerCase() || '';
      const idPedido = pedido.id.toLowerCase();
      
      const matchBusca = nomeCliente.includes(searchTerm.toLowerCase()) || idPedido.includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'Todos' ? !isOpenPayment(pedido.status) : statusFilter === 'abertos' ? isOpenPayment(pedido.status) : pedido.status === statusFilter.toLowerCase();
      
      return matchBusca && (matchStatus || searchTerm === pedido.id);
    });

    return filtrados.sort((a, b) => {
      switch (sortBy) {
        case 'data_asc': 
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'data_desc': 
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'valor_desc': 
          return b.valor_total - a.valor_total;
        case 'valor_asc': 
          return a.valor_total - b.valor_total;
        case 'nome_asc': 
          const nomeA = a.endereco_entrega?.nome || '';
          const nomeB = b.endereco_entrega?.nome || '';
          return nomeA.localeCompare(nomeB);
        case 'nome_desc': 
          const nomeC = a.endereco_entrega?.nome || '';
          const nomeD = b.endereco_entrega?.nome || '';
          return nomeD.localeCompare(nomeC);
        default:
          return 0;
      }
    });
  }, [pedidos, searchTerm, statusFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'aguardando_pagamento':
        return <span className="text-sm text-amber-700">Aguardando pagamento</span>;
      case 'preparando':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Package size={10} /> Preparando
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
            <CheckCircle size={10} /> Entregue
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <AdminOrderSummary orders={pedidos} ready={!loading} />
      <AdminOrderChanges />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#171717] p-6 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] shadow-sm dark:shadow-none transition-colors">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-[#F0F0F0] flex items-center gap-2">
            <ShoppingBag className="text-teal-600 dark:text-teal-500" /> Auditoria de Pedidos
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 text-xs font-medium">Histórico completo de vendas e avaliações dos clientes.</p>
        </div>
      </div>

      <ProductReviewModeration />
      <StoreReviewModeration />

      <div className="bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2D2D2D] rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden transition-colors">
        
        <div className="p-4 border-b border-slate-200 dark:border-[#2D2D2D] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#171717]">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#A1A1AA]" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome do cliente ou ID..." 
              className="pl-10 pr-4 py-2 text-sm font-medium border border-slate-200 dark:border-[#2D2D2D] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white dark:bg-[#202020] text-slate-900 dark:text-[#F0F0F0] w-full transition-all placeholder:text-slate-400 dark:placeholder:text-[#A1A1AA]" 
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown size={16} className="text-slate-400 dark:text-[#A1A1AA] hidden sm:block" />
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#2D2D2D] rounded-xl text-sm font-medium text-slate-700 dark:text-[#F0F0F0] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 cursor-pointer transition-colors"
              >
                <option value="data_desc">Mais Recentes</option>
                <option value="data_asc">Mais Antigos</option>
                <option value="valor_desc">Maior Valor</option>
                <option value="valor_asc">Menor Valor</option>
                <option value="nome_asc">Nome (A-Z)</option>
                <option value="nome_desc">Nome (Z-A)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-slate-400 dark:text-[#A1A1AA] hidden sm:block" />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#2D2D2D] rounded-xl text-sm font-medium text-slate-700 dark:text-[#F0F0F0] focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 cursor-pointer transition-colors"
              >
                <option value="Todos">Pedidos confirmados</option>
                <option value="abertos">Compras em aberto</option>
                <option value="preparando">Preparando</option>
                <option value="enviado">Enviado</option>
                <option value="entregue">Entregue</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-[#A1A1AA]">
              <Loader2 size={32} className="animate-spin mb-4 text-teal-500" />
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <AlertCircle size={32} className="text-slate-300 dark:text-[#2D2D2D] mb-4" />
              <p className="text-sm font-bold text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest">Nenhum registo encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-[#202020] border-b border-slate-200 dark:border-[#2D2D2D] text-slate-500 dark:text-[#A1A1AA]">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Data / ID</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Cliente</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Valor Total</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Estado</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Avaliação da loja</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2D2D2D]">
                {pedidosFiltrados.map((pedido) => {
                  const nomeCliente = pedido.endereco_entrega?.nome || 'Cliente não identificado';
                  const telefoneCliente = pedido.endereco_entrega?.telefone || 'Sem contacto';
                  const avaliacaoDoPedido = avaliacoes.find((avaliacao) => avaliacao.pedido_id === pedido.id);
                  
                  return (
                    <tr key={pedido.id} className="hover:bg-slate-50 dark:hover:bg-[#262626] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900 dark:text-[#F0F0F0]">
                          {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-[#A1A1AA] mt-0.5">
                          #{pedido.id.split('-')[0]}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-700 dark:text-[#E5E5E5]">{nomeCliente}</p>
                        <p className="text-[10px] text-slate-500 dark:text-[#A1A1AA]">{telefoneCliente}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-teal-600 dark:text-teal-400 text-xs">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(pedido.status)}
                      </td>
                      <td className="px-6 py-4">
                        {avaliacaoDoPedido ? (
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} size={12} 
                                fill={i < avaliacaoDoPedido.nota ? (avaliacaoDoPedido.nota <= 3 ? "#EF4444" : "#F59E0B") : "transparent"} 
                                strokeWidth={i < avaliacaoDoPedido.nota ? 0 : 2}
                                className={i < avaliacaoDoPedido.nota ? (avaliacaoDoPedido.nota <= 3 ? "text-red-500" : "text-[#F59E0B]") : "text-slate-300 dark:text-[#A1A1AA]"}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 dark:text-[#A1A1AA] italic">Pendente</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => setPedidoSelecionado({ ...pedido, avaliacao: avaliacaoDoPedido })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#333333] hover:bg-teal-600 dark:hover:bg-teal-500 hover:text-white dark:hover:text-white text-slate-700 dark:text-[#F0F0F0] transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer">
                          <Eye size={12} /> Ver Resumo
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

      {pedidoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#171717] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-[#2D2D2D] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-[#2D2D2D] bg-slate-50 dark:bg-[#202020] flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-[#F0F0F0] uppercase tracking-tighter flex items-center gap-2">
                  Pedido #{pedidoSelecionado.id.split('-')[0]} {getStatusBadge(pedidoSelecionado.status)}
                </h3>
              </div>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2D2D2D] bg-slate-50/50 dark:bg-[#202020] space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#A1A1AA] flex items-center gap-2"><User size={14}/> Cliente</h4>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-[#F0F0F0]">{pedidoSelecionado.endereco_entrega?.nome || 'Não informado'}</p>
                    <p className="text-xs text-slate-500 dark:text-[#A1A1AA] mt-1">Tel: {pedidoSelecionado.endereco_entrega?.telefone}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2D2D2D] bg-slate-50/50 dark:bg-[#202020] space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#A1A1AA] flex items-center gap-2"><MapPin size={14}/> Local de Entrega</h4>
                  <div>
                    <p className="text-sm break-words font-bold text-slate-900 dark:text-[#F0F0F0]">{orderAddressText(pedidoSelecionado.endereco_entrega)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#A1A1AA] mb-3 flex items-center gap-2"><Package size={14}/> Lista de Artigos</h4>
                <ul className="divide-y divide-slate-100 dark:divide-[#2D2D2D] border border-slate-200 dark:border-[#2D2D2D] rounded-xl overflow-hidden">
                  {pedidoSelecionado.itens && Array.isArray(pedidoSelecionado.itens) ? (
                    pedidoSelecionado.itens.map((item, idx) => (
                      <li key={idx} className="p-3 bg-white dark:bg-[#171717] flex justify-between items-center hover:bg-slate-50 dark:hover:bg-[#262626] transition-colors">
                        <span className="text-sm font-medium text-slate-700 dark:text-[#E5E5E5]">{item.nome || 'Produto Indefinido'}</span>
                        <span className="text-xs font-black bg-slate-100 dark:bg-[#262626] px-2 py-1 rounded text-slate-600 dark:text-[#A1A1AA]">Qtd: {item.qtd || 1}</span>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-sm text-slate-500 dark:text-[#A1A1AA] text-center">Nenhum artigo listado.</li>
                  )}
                </ul>
                <div className="mt-4 flex justify-between items-center p-4 bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-100 dark:border-teal-500/20">
                  <span className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">Total do pedido</span>
                  <span className="text-lg font-black text-teal-700 dark:text-teal-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedidoSelecionado.valor_total)}
                  </span>
                </div>
              </div>

              <AdminOrderContact id={pedidoSelecionado.id} address={pedidoSelecionado.endereco_entrega} />
              {selectedReview && (
                <div className={`p-5 rounded-xl border ${selectedReview.nota <= 3 ? 'bg-red-50/50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30' : 'bg-slate-50 dark:bg-[#202020] border-slate-200 dark:border-[#2D2D2D]'}`}>
                  <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-3 text-slate-400 dark:text-[#A1A1AA]">
                    <Star size={14}/> Avaliação da loja neste site
                    {selectedReview.nota <= 3 && <span className="bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 px-2 py-0.5 rounded ml-2 flex items-center gap-1 border border-red-200 dark:border-red-500/30"><AlertTriangle size={10} /> Atenção</span>}
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={16} fill={i < selectedReview.nota ? (selectedReview.nota <= 3 ? "#EF4444" : "#F59E0B") : "transparent"} strokeWidth={i < selectedReview.nota ? 0 : 2} className={i < selectedReview.nota ? (selectedReview.nota <= 3 ? "text-red-500" : "text-[#F59E0B]") : "text-slate-300 dark:text-[#A1A1AA]"} />
                        ))}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-[#E5E5E5] italic">&quot;{selectedReview.comentario}&quot;</p>
                    </div>
                    {selectedReview.nota <= 3 && (
                      <a href={`https://wa.me/55${pedidoSelecionado.endereco_entrega?.telefone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1da851] text-white text-xs font-bold rounded-lg transition-all"><MessageCircle size={14} /> WhatsApp</a>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-[#2D2D2D] bg-slate-50 dark:bg-[#202020] flex justify-end shrink-0">
              <button onClick={() => setPedidoSelecionado(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-[#A1A1AA] hover:bg-slate-200 dark:hover:bg-[#333333] transition-colors cursor-pointer">Fechar Resumo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
