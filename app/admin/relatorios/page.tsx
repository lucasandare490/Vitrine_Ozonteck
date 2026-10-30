'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { buildSalesReport, reportCsv, saleDate, type ReportOrder } from '@/lib/sales-report';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const panel = 'rounded-2xl border border-slate-200 bg-white p-5 dark:border-neutral-700 dark:bg-neutral-900';

export default function SalesReports() {
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Entre novamente para acessar os relatórios.');
        const { data: profile, error: authError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (authError || profile?.role !== 'admin') throw new Error('Acesso restrito ao administrador.');
        if (!active) return;
        const now = saleDate(new Date().toISOString());
        setFrom(value => value || now.slice(0, 7) + '-01');
        setTo(value => value || now);
        const rows: ReportOrder[] = [];
        for (let offset = 0; ; offset += 500) {
          const { data, error: queryError } = await supabase.from('pedidos')
            .select('id,user_id,status,valor_total,created_at,endereco_entrega,itens')
            .in('status', ['preparando', 'enviado', 'entregue'])
            .order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
          if (queryError) throw new Error('Não foi possível carregar as vendas. Tente novamente.');
          rows.push(...(data || []) as ReportOrder[]);
          if (!active) return;
          if (!data || data.length < 500) break;
        }
        if (active) setOrders(rows);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar vendas.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [reload]);
  const invalidRange = !from || !to || from > to;
  const report = useMemo(() => buildSalesReport(orders, from, to), [orders, from, to]);
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([reportCsv(report.orders)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `vendas-${from}-${to}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-6">
    <header className={panel}><h1 className="text-2xl font-bold">Relatórios de vendas</h1>
      <p className="mt-2 text-sm text-slate-500">Pedidos confirmados, por data de criação da compra no horário de Recife. Pagamentos pendentes e pedidos cancelados não entram nos totais.</p>
    </header>
    <section className={`${panel} flex flex-wrap items-end gap-4`} aria-label="Período do relatório">
      <label className="text-sm">De<input className="mt-1 block min-h-11 rounded border p-2 dark:bg-neutral-800" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label className="text-sm">Até<input className="mt-1 block min-h-11 rounded border p-2 dark:bg-neutral-800" type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
      <button className="min-h-11 rounded border px-4" onClick={() => { setFrom('2000-01-01'); setTo(saleDate(new Date().toISOString())); }}>Todo o histórico</button>
      <button className="min-h-11 rounded border px-4 disabled:opacity-50" disabled={loading} onClick={() => setReload(value => value + 1)}>Atualizar</button>
      <button className="min-h-11 rounded bg-teal-700 px-4 font-semibold text-white disabled:opacity-50" disabled={loading || !!error || invalidRange || !report.orders.length} onClick={exportCsv}>Exportar CSV</button>
    </section>
    {loading ? <p role="status">Carregando vendas…</p> : error ? <p role="alert" className={panel}>{error}</p> : invalidRange ? <p role="alert">Escolha um período válido.</p> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        ['Total vendido', money(report.total)], ['Pedidos confirmados', report.orders.length],
        ['Ticket médio', money(report.average)], ['Clientes com mais de uma compra no período', report.returning],
      ].map(([label, value]) => <section className={panel} key={label}><h2 className="text-sm text-slate-500">{label}</h2><p className="mt-2 text-2xl font-bold">{value}</p></section>)}</div>
      {!report.orders.length && <p className={panel}>Nenhuma venda confirmada neste período.</p>}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={panel}><h2 className="mb-4 text-lg font-bold">Produtos mais vendidos</h2><ol className="divide-y">{report.products.slice(0, 20).map(product => <li className="flex justify-between gap-4 py-3 text-sm" key={product.id}><span>{product.name}</span><strong className="shrink-0">{product.quantity} un.</strong></li>)}</ol></section>
        <section className={panel}><h2 className="mb-4 text-lg font-bold">Clientes por valor comprado</h2><ol className="divide-y">{report.customers.slice(0, 20).map(customer => <li className="flex justify-between gap-4 py-3 text-sm" key={customer.id}><span>{customer.name}<small className="block text-slate-500">{customer.orders} pedido(s)</small></span><strong className="shrink-0">{money(customer.total)}</strong></li>)}</ol></section>
      </div>
      <section className={panel}><h2 className="mb-4 text-lg font-bold">Pedidos do período</h2><div className="max-h-96 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Pedido</th><th className="p-2">Data</th><th className="p-2">Total</th></tr></thead><tbody>{report.orders.map(order => <tr className="border-t" key={order.id}><td className="p-2"><Link className="text-teal-700 underline" href={`/admin/pedidos?pedido=${encodeURIComponent(order.id)}`}>#{order.id.slice(0, 8)}</Link></td><td className="p-2">{saleDate(order.created_at).split('-').reverse().join('/')}</td><td className="p-2">{money(Number(order.valor_total))}</td></tr>)}</tbody></table></div></section>
      <p className="text-sm text-slate-500">Total vendido não representa lucro líquido. Custos, taxas e pontuação não estão incluídos neste relatório.</p>
    </>}
  </div>;
}
