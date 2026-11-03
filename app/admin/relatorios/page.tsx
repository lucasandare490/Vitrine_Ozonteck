'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BarChart3, CalendarDays, Download, RefreshCw, TrendingUp, ShoppingBag, Users, ReceiptText, Package, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { buildSalesReport, reportCsv, saleDate, type ReportOrder } from '@/lib/sales-report';

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const panel = 'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-700 dark:bg-neutral-900';
const action = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200';
const dateInput = 'mt-2 block min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white';

export default function SalesReports() {
  const [orders, setOrders] = useState<ReportOrder[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    let running = false;
    async function load(background = false) {
      if (running) return;
      running = true;
      if (!background) setLoading(true);
      setError('');
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
            .select('id,user_id,status,status_pagamento,valor_total,created_at,endereco_entrega,itens')
            .in('status', ['preparando', 'enviado', 'entregue'])
            .order('created_at', { ascending: false }).order('id').range(offset, offset + 499);
          if (queryError) throw new Error('Não foi possível carregar as vendas. Tente novamente.');
          rows.push(...(data || []) as ReportOrder[]);
          if (!active) return;
          if (!data || data.length < 500) break;
        }
        if (active) setOrders(rows);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar vendas.'); }
      finally { running = false; if (active) setLoading(false); }
    }
    void load();
    const refresh = () => { if (document.visibilityState === 'visible') void load(true); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [reload]);
  const invalidRange = !from || !to || from > to;
  const report = useMemo(() => buildSalesReport(orders, from, to), [orders, from, to]);
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([reportCsv(report.orders)], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `vendas-${from}-${to}.csv`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="space-y-6">
    <header className={`${panel} flex items-start gap-4`}><span className="rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><BarChart3 size={25} aria-hidden="true" /></span><div><p className="text-[10px] font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">Gestão de vendas</p><h1 className="mt-1 text-2xl font-black tracking-tight">Relatórios de vendas</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">Acompanhe as vendas pagas, os produtos mais vendidos e os clientes que voltam à loja.</p><p className="mt-2 text-xs text-slate-500">Mesmos pedidos da auditoria · Atualização automática a cada 30 segundos</p></div>
    </header>
    <section className={`${panel} flex flex-wrap items-end gap-3`} aria-label="Período do relatório">
      <label className="min-w-40 flex-1 text-xs font-semibold text-slate-500 sm:flex-none">De<input className={dateInput} type="date" value={from} onChange={event => setFrom(event.target.value)} /></label>
      <label className="min-w-40 flex-1 text-xs font-semibold text-slate-500 sm:flex-none">Até<input className={dateInput} type="date" value={to} onChange={event => setTo(event.target.value)} /></label>
      <button className={action} onClick={() => { setFrom('2000-01-01'); setTo(saleDate(new Date().toISOString())); }}><CalendarDays size={16} aria-hidden="true" />Todo o histórico</button>
      <button className={action} disabled={loading} onClick={() => setReload(value => value + 1)}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />Atualizar</button>
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 text-sm font-bold text-white transition hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 sm:ml-auto" disabled={loading || !!error || invalidRange || !report.orders.length} onClick={exportCsv}><Download size={16} aria-hidden="true" />Exportar CSV</button>
    </section>
    {loading ? <p role="status">Carregando vendas…</p> : error ? <p role="alert" className={panel}>{error}</p> : invalidRange ? <p role="alert">Escolha um período válido.</p> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: 'Total vendido', value: money(report.total), icon: TrendingUp, hint: 'Pagamentos aprovados' },
        { label: 'Pedidos confirmados', value: report.orders.length, icon: ShoppingBag, hint: 'Compras no período selecionado' },
        { label: 'Ticket médio', value: money(report.average), icon: ReceiptText, hint: 'Valor médio por pedido pago' },
        { label: 'Clientes recorrentes', value: report.returning, icon: Users, hint: 'Mais de uma compra no período' },
      ].map(({ label, value, icon: Icon, hint }) => <section className={panel} key={label}><div className="flex items-center justify-between gap-3"><h2 className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</h2><Icon size={19} className="shrink-0 text-teal-600" aria-hidden="true" /></div><p className="mt-4 text-3xl font-black tracking-tight tabular-nums">{value}</p><p className="mt-2 text-xs text-slate-500">{hint}</p></section>)}</div>
      {!report.orders.length && <div className={`${panel} flex flex-col items-center py-10 text-center`}><ShoppingBag className="mb-3 text-teal-600" size={30} aria-hidden="true" /><h2 className="font-bold">Nenhuma venda paga neste período</h2><p className="mt-2 max-w-lg text-sm text-slate-500">Escolha outras datas ou consulte todo o histórico. Compras pendentes continuam disponíveis na auditoria.</p><Link href="/admin/pedidos" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-teal-700">Consultar pedidos <ArrowUpRight size={16} aria-hidden="true" /></Link></div>}
      {report.needsReview.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100" aria-label="Pedidos com divergência de pagamento">
        <h2 className="font-bold">{report.needsReview.length} pedido(s) precisam de conferência financeira</h2>
        <p className="mt-2 text-sm">Constam como preparação, envio ou entrega, mas o banco não registra pagamento aprovado. Permanecem na auditoria e estão fora do total vendido.</p>
        <div className="mt-3 flex flex-wrap gap-3">{report.needsReview.map(order => <Link className="rounded-lg border border-amber-400 px-3 py-2 text-sm underline" key={order.id} href={`/admin/pedidos?pedido=${encodeURIComponent(order.id)}`}>Conferir #{order.id.slice(0, 8)}</Link>)}</div>
      </section>}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className={panel}><h2 className="mb-4 flex items-center gap-2 font-bold"><Package size={18} className="text-teal-600" aria-hidden="true" />Produtos mais vendidos</h2>{!report.products.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-neutral-800">Os produtos aparecerão aqui após uma venda paga.</p>}<ol className="divide-y divide-slate-100 dark:divide-neutral-800">{report.products.slice(0, 20).map((product, index) => <li className="flex items-center justify-between gap-4 py-3 text-sm" key={product.id}><span className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">{index + 1}</span>{product.name}</span><strong className="shrink-0 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-neutral-800">{product.quantity} un.</strong></li>)}</ol></section>
        <section className={panel}><h2 className="mb-4 flex items-center gap-2 font-bold"><Users size={18} className="text-teal-600" aria-hidden="true" />Clientes por valor comprado</h2>{!report.customers.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-neutral-800">Nenhum cliente com compra paga no período.</p>}<ol className="divide-y divide-slate-100 dark:divide-neutral-800">{report.customers.slice(0, 20).map(customer => <li className="flex items-center justify-between gap-4 py-3 text-sm" key={customer.id}><span className="font-semibold">{customer.name}<small className="mt-1 block font-normal text-slate-500">{customer.orders} pedido(s)</small></span><strong className="shrink-0 text-teal-700 dark:text-teal-300">{money(customer.total)}</strong></li>)}</ol></section>
      </div>
      <section className={panel}><h2 className="mb-4 text-lg font-bold">Pedidos do período</h2><div className="max-h-96 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Pedido</th><th className="p-2">Data</th><th className="p-2">Total</th></tr></thead><tbody>{report.orders.map(order => <tr className="border-t" key={order.id}><td className="p-2"><Link className="text-teal-700 underline" href={`/admin/pedidos?pedido=${encodeURIComponent(order.id)}`}>#{order.id.slice(0, 8)}</Link></td><td className="p-2">{saleDate(order.created_at).split('-').reverse().join('/')}</td><td className="p-2">{money(Number(order.valor_total))}</td></tr>)}</tbody></table></div></section>
      <p className="text-xs leading-relaxed text-slate-500">Datas de criação da compra no horário de Recife. Somente pagamentos aprovados; cancelamentos e reembolsos não entram no total. Total vendido não representa lucro líquido: custos, taxas e pontuação não estão incluídos.</p>
    </>}
  </div>;
}
