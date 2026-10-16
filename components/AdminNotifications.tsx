'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Order = { id: string; status: string; created_at: string };
const labels: Record<string, string> = { approved: 'Pagamento aprovado', pending: 'Pagamento pendente', in_process: 'Em análise', rejected: 'Pagamento recusado', entregue: 'Entregue', cancelado: 'Cancelado' };

export default function AdminNotifications() {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from('pedidos').select('id,status,created_at').in('status', ['preparando', 'enviado', 'entregue']).order('created_at', { ascending: false }).limit(5);
      if (!active) return;
      setError(!!error); setLoading(false);
      setCheckedAt(Date.now());
      if (!error) setOrders(data || []);
    };
    void load();
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refresh]);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  const recent = !error && orders.some(order => checkedAt - new Date(order.created_at).getTime() < 86400000);
  return <div ref={root} className="relative" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus(); } }}>
    <button type="button" title="Pedidos recentes" aria-label="Notificações de pedidos" aria-expanded={open} aria-controls="recent-orders" onClick={() => { setOpen(!open); setRefresh(value => value + 1); }} className="relative flex h-11 w-11 items-center justify-center rounded-lg hover:bg-teal-50 dark:hover:bg-neutral-800">
      <Bell size={20} />{recent && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-600" />}
    </button>
    {open && <section id="recent-orders" aria-label="Pedidos recentes" className="fixed inset-x-4 top-28 z-50 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-lg dark:bg-neutral-900 dark:text-white sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80">
      <div className="flex items-center justify-between"><h2 className="font-bold">Pedidos recentes</h2><button type="button" title="Atualizar pedidos" aria-label="Atualizar pedidos" onClick={() => setRefresh(value => value + 1)} className="flex h-10 w-10 items-center justify-center"><RefreshCw size={16} /></button></div>
      {loading ? <p role="status">Carregando...</p> : error ? <p role="alert" className="text-sm">Não foi possível consultar os pedidos. Verifique sua conexão e autorização.</p> : orders.length ? <ul className="divide-y divide-slate-200">{orders.map(order => <li key={order.id}><Link href={`/admin/pedidos?pedido=${encodeURIComponent(order.id)}`} onClick={() => setOpen(false)} className="block py-3 text-sm"><strong>Pedido #{order.id.slice(0, 8)}</strong><span className="block">{labels[order.status] || order.status}</span><time className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('pt-BR')}</time></Link></li>)}</ul> : <p className="py-3 text-sm">Nenhum pedido recebido.</p>}
      <Link href="/admin/pedidos" onClick={() => setOpen(false)} className="mt-3 block font-semibold text-teal-700">Ver todos os pedidos</Link>
    </section>}
  </div>;
}
