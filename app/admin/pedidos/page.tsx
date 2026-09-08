'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingBag, Search, Filter, Loader2, AlertCircle, Eye, Package, Truck, CheckCircle, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuditoriaPedidos() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  
  const [pedidoSelecionado, setPedidoSelecionado] = useState<any | null>(null);

  const fetchPedidos = async () => {
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
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const nomeCliente = pedido.endereco_entrega?.nome?.toLowerCase() || '';
    const idPedido = pedido.id.toLowerCase();
    
    const matchBusca = nomeCliente.includes(searchTerm.toLowerCase()) || idPedido.includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Todos' || pedido.status === statusFilter.toLowerCase();
    
    return matchBusca && matchStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'preparando':
      case 'pending':
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0f0f11] p-6 rounded-2xl border border-slate-200 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="text-teal-600 dark:text-teal-500" /> Auditoria de Pedidos
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 mt-1 text-xs font-medium">Histórico completo e pesquisa de todas as vendas realizadas.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f0f11] border border-slate-200 dark:border-zinc-800/60 rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden">
        
        {/* Barra de Pesquisa e Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800/60 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-transparent">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome do cliente ou ID..." 
              className="pl-10 pr-4 py-2 text-sm font-medium border border-slate-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white w-full transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-600" 
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={16} className="text-slate-400 dark:text-zinc-500 hidden sm:block" />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-xl text-sm font-medium text-slate-700 dark:text-zinc-300 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 cursor-pointer"
            >
              <option value="Todos">Todos os Estados</option>
              <option value="preparando">Preparando</option>
              <option value="enviado">Enviado</option>
              <option value="entregue">Entregue</option>
            </select>
          </div>
        </div>

        {/* Tabela de Histórico */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-zinc-600">
              <Loader2 size={32} className="animate-spin mb-4 text-teal-500" />
              <p className="text-xs font-bold uppercase tracking-widest">A sincronizar dados...</p>
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <AlertCircle size={32} className="text-slate-300 dark:text-zinc-700 mb-4" />
              <p className="text-sm font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Nenhum registo encontrado.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800/60 text-slate-500 dark:text-zinc-400">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Data / ID</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Cliente</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Valor Total</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Estado</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                {pedidosFiltrados.map((pedido) => {
                  const nomeCliente = pedido.endereco_entrega?.nome || 'Cliente não identificado';
                  const telefoneCliente = pedido.endereco_entrega?.telefone || 'Sem contacto';
                  
                  return (
                    <tr key={pedido.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-900 dark:text-white">
                          {new Date(pedido.created_at).toLocaleDateString('pt-BR')} às {new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          #{pedido.id.split('-')[0]}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-xs text-slate-700 dark:text-zinc-300">{nomeCliente}</p>
                        <p className="text-[10px] text-slate-500">{telefoneCliente}</p>
                      </td>
                      <td className="px-6 py-4 font-black text-teal-600 dark:text-teal-400 text-xs">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(pedido.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setPedidoSelecionado(pedido)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-zinc-300 transition-colors text-[10px] font-bold uppercase tracking-widest cursor-pointer"
                        >
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

      {/* MODAL DE RESUMO DO PEDIDO */}
      {pedidoSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f0f11] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                  Pedido #{pedidoSelecionado.id.split('-')[0]}
                  {getStatusBadge(pedidoSelecionado.status)}
                </h3>
                <p className="text-[10px] font-medium text-slate-500 mt-1">Realizado a {new Date(pedidoSelecionado.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setPedidoSelecionado(null)} className="text-slate-400 hover:text-red-500 transition-colors font-bold text-xl cursor-pointer p-2">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><User size={14}/> Cliente</h4>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{pedidoSelecionado.endereco_entrega?.nome || 'Não informado'}</p>
                    <p className="text-xs text-slate-500 mt-1">Tel: {pedidoSelecionado.endereco_entrega?.telefone || 'Não informado'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><MapPin size={14}/> Local de Entrega</h4>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{pedidoSelecionado.endereco_entrega?.rua || 'Endereço não preenchido'}</p>
                    <p className="text-xs text-slate-500 mt-1">{pedidoSelecionado.endereco_entrega?.cidade || ''} {pedidoSelecionado.endereco_entrega?.estado || ''}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Package size={14}/> Lista de Artigos</h4>
                <ul className="divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                  {pedidoSelecionado.itens && Array.isArray(pedidoSelecionado.itens) ? (
                    pedidoSelecionado.itens.map((item: any, idx: number) => (
                      <li key={idx} className="p-3 bg-white dark:bg-[#0f0f11] flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-700 dark:text-zinc-300">{item.nome || 'Produto Indefinido'}</span>
                        <span className="text-xs font-black bg-slate-100 dark:bg-zinc-800 px-2 py-1 rounded text-slate-600 dark:text-zinc-400">Qtd: {item.qtd || 1}</span>
                      </li>
                    ))
                  ) : (
                    <li className="p-4 text-sm text-slate-500 text-center">Nenhum artigo listado.</li>
                  )}
                </ul>
                <div className="mt-4 flex justify-between items-center p-4 bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-100 dark:border-teal-500/20">
                  <span className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">Total Pago</span>
                  <span className="text-lg font-black text-teal-700 dark:text-teal-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedidoSelecionado.valor_total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/30 flex justify-end shrink-0">
              <button onClick={() => setPedidoSelecionado(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                Fechar Resumo
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}