'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Search, Loader2, AlertCircle, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import PaginatedGrid from '@/components/PaginatedGrid';
import Link from 'next/link';
import { customerActivity, customerContactMessage, type CustomerPurchase } from '@/lib/customer-activity';

type Cliente = {
  id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  endereco_completo: string | null;
  created_at: string;
};

export default function CarteiraClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);
  const [activityFilter, setActivityFilter] = useState('all');
  const [loadError, setLoadError] = useState('');
  const activity = useMemo(() => customerActivity(purchases), [purchases]);
  const fetching = useRef(false);

  const fetchClientes = async (background = false) => {
    if (fetching.current) return;
    fetching.current = true;
    if (!background) setLoading(true);
    setLoadError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Entre novamente para acessar os clientes.');
      const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profileError || profile?.role !== 'admin') throw new Error('Acesso restrito ao administrador.');
      const allClients: Cliente[] = [];
      const allPurchases: CustomerPurchase[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from('profiles')
          .select('id, nome, email, telefone, endereco_completo, created_at').eq('role', 'cliente')
          .order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
        if (error) throw new Error('Não foi possível carregar os clientes.');
        allClients.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from('pedidos').select('user_id,created_at,status,status_pagamento,valor_total')
          .in('status', ['preparando', 'enviado', 'entregue'])
          .order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
        if (error) throw new Error('Não foi possível carregar o histórico de compras.');
        allPurchases.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      setClientes(allClients);
      setPurchases(allPurchases);
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : 'Não foi possível carregar os clientes.');
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchClientes(), 0);
    const refresh = () => { if (document.visibilityState === 'visible') void fetchClientes(true); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, []);

  // OTIMIZAÇÃO: Memoriza a lista de clientes para evitar lags no input
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((cliente) => {
      const busca = searchTerm.toLowerCase();
      const nomeMatch = cliente.nome?.toLowerCase().includes(busca);
      const emailMatch = cliente.email?.toLowerCase().includes(busca);
      const telefoneMatch = cliente.telefone?.includes(busca);

      const history = activity.get(cliente.id);
      const matchesActivity = activityFilter === 'all'
        || (activityFilter === 'never' && !history)
        || (activityFilter === 'recent' && history && history.daysSincePurchase < 30)
        || (activityFilter === '30' && history && history.daysSincePurchase >= 30)
        || (activityFilter === '60' && history && history.daysSincePurchase >= 60);
      return (nomeMatch || emailMatch || telefoneMatch) && matchesActivity;
    });
  }, [clientes, searchTerm, activity, activityFilter]);

  async function copyContact(name: string | null) {
    try {
      await navigator.clipboard.writeText(customerContactMessage(name));
      toast.success('Mensagem copiada. Revise antes de enviar e respeite a preferência do cliente.');
    } catch { toast.error('Não foi possível copiar a mensagem. Verifique a permissão do navegador.'); }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#171717] p-6 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] shadow-sm dark:shadow-none transition-colors">
        <div>
          <h1 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-[#F0F0F0] flex items-center gap-2">
            <Users className="text-teal-600 dark:text-teal-500" /> Carteira de Clientes
          </h1>
          <p className="text-slate-500 dark:text-[#A1A1AA] mt-1 text-xs font-medium">Faça a gestão dos clientes registados na sua loja.</p>
          <Link href="/admin/precos" className="inline-flex min-h-11 items-center text-sm font-semibold text-teal-700 underline">Tabela de preços de afiliados</Link>
        </div>
      </div>

      <div className="bg-white dark:bg-[#171717] border border-slate-200 dark:border-[#2D2D2D] rounded-2xl flex flex-col shadow-sm dark:shadow-none overflow-hidden transition-colors">

        <div className="p-4 border-b border-slate-200 dark:border-[#2D2D2D] bg-slate-50/50 dark:bg-transparent">
          <div className="relative w-full md:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#A1A1AA]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar por nome, email ou telemóvel..."
              className="pl-10 pr-4 py-2 text-sm font-medium border border-slate-200 dark:border-[#2D2D2D] rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white dark:bg-[#202020] text-slate-900 dark:text-[#F0F0F0] w-full transition-all placeholder:text-slate-400 dark:placeholder:text-[#A1A1AA]"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium">Histórico de compras
              <select value={activityFilter} onChange={event => setActivityFilter(event.target.value)} className="ml-3 min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:border-neutral-700 dark:bg-neutral-900">
                <option value="all">Todos os clientes</option>
                <option value="recent">Compraram nos últimos 30 dias</option>
                <option value="30">Há 30 dias ou mais sem comprar</option>
                <option value="60">Há 60 dias ou mais sem comprar</option>
                <option value="never">Sem compra confirmada</option>
              </select>
            </label>
            <button onClick={() => void fetchClientes()} disabled={loading} className="min-h-11 rounded-xl border px-4 disabled:opacity-50">Atualizar</button>
          </div>
          <p className="mt-2 text-xs text-slate-500">Considera somente compras confirmadas. Mensagens são copiadas para revisão; nenhum contato é enviado automaticamente.</p>
        </div>

        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-[#A1A1AA]">
              <Loader2 size={32} className="animate-spin mb-4 text-teal-500" />
              <p className="text-xs font-bold uppercase tracking-widest">A carregar a base de dados...</p>
            </div>
          ) : loadError ? <p role="alert" className="text-red-700">{loadError} Use Atualizar para tentar novamente.</p> : clientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center px-4">
              <AlertCircle size={32} className="text-slate-300 dark:text-[#2D2D2D] mb-4" />
              <p className="text-sm font-bold text-slate-400 dark:text-[#A1A1AA] uppercase tracking-widest">Nenhum cliente encontrado.</p>
            </div>
          ) : (
            <PaginatedGrid key={`${searchTerm}-${activityFilter}`} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {clientesFiltrados.map((cliente) => (
                <div key={cliente.id} className="p-5 rounded-2xl border border-slate-200 dark:border-[#2D2D2D] bg-slate-50 dark:bg-[#202020] hover:border-teal-500/30 transition-colors group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 flex items-center justify-center font-black text-lg shrink-0">
                      {cliente.nome ? cliente.nome.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-slate-900 dark:text-[#F0F0F0] truncate">{cliente.nome || 'Nome não definido'}</h3>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#A1A1AA] mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> Registado a {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <Link href={`/admin/clientes/${cliente.id}/precos`} className="mb-3 inline-flex min-h-11 items-center font-semibold text-teal-700 underline">Benefício e preços</Link>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-[#A1A1AA]">
                      <Mail size={14} className="text-slate-400 dark:text-[#A1A1AA]" />
                      <span className="truncate">{cliente.email || 'Sem email'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-[#A1A1AA]">
                      <Phone size={14} className="text-slate-400 dark:text-[#A1A1AA]" />
                      <span>{cliente.telefone || 'Sem telemóvel'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-[#A1A1AA]">
                      <MapPin size={14} className="text-slate-400 dark:text-[#A1A1AA] shrink-0" />
                      <span className="truncate">{cliente.endereco_completo || 'Sem morada registada'}</span>
                    </div>
                  </div>
                  <div className="mt-4 border-t border-slate-200 pt-3 text-xs dark:border-neutral-700">
                    {activity.has(cliente.id) ? <>
                      <p>Última compra: {new Date(activity.get(cliente.id)!.lastPurchase).toLocaleDateString('pt-BR', { timeZone: 'America/Fortaleza' })}</p>
                      <p className="mt-1">{activity.get(cliente.id)!.orders} compra(s) · {activity.get(cliente.id)!.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </> : <p>Sem compra confirmada</p>}
                    <button type="button" onClick={() => void copyContact(cliente.nome)} className="mt-3 min-h-11 rounded-lg border border-teal-600 px-3 font-semibold text-teal-700 dark:text-teal-300">Copiar mensagem de contato</button>
                  </div>
                </div>
              ))}
            </PaginatedGrid>
          )}
        </div>
      </div>

    </div>
  );
}
