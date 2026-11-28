'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Save, RotateCcw, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/products';
import PaginatedGrid from '@/components/PaginatedGrid';
import Link from 'next/link';

type Row = { code: string; name: string; price: number; affiliate_price: number | null };
type Audit = { action: string; product_code: string | null; after_value: { price?: number | null; enabled?: boolean }; created_at: string };
type Data = { enabled: boolean; products: Row[]; audit: Audit[] };
const regularPriceCodes = new Set(['PRO-AMR', 'PRO-CIF', 'PRO-DEEP', 'PRO-HMS', 'PRO-LPC', 'PRO-SOFT']);
const needsPrice = (row: Row) => row.affiliate_price === null && !regularPriceCodes.has(row.code);

function PriceEditor({ row, busy, save }: { row: Row; busy: boolean; save: (code: string, price: number | null) => Promise<void> }) {
  const current = row.affiliate_price;
  const [value, setValue] = useState(current === null ? '' : String(current));
  const [error, setError] = useState('');
  async function submit() {
    const parsed = Number(value.replace(',', '.'));
    if (!value.trim() || !/^\d+(?:[.,]\d{1,2})?$/.test(value) || parsed <= 0 || parsed >= 1000000) { setError('Informe um valor positivo com até duas casas decimais.'); return; }
    setError('');
    await save(row.code, parsed);
  }
  return <div className="grid gap-3 border-b border-slate-200 py-4 sm:grid-cols-[minmax(0,1fr)_auto]">
    <div className="min-w-0"><h3 className="font-semibold break-words">{row.name}</h3><p className="text-sm text-slate-500">{row.code} · Comum: {formatPrice(row.price)}</p>
      <p className="text-sm">Consultor: {row.affiliate_price === null ? regularPriceCodes.has(row.code) ? 'Sem desconto; preço comum' : 'Não definido; usa preço comum' : formatPrice(row.affiliate_price)}</p>
    </div>
    <div className="max-w-full"><label className="block text-sm" htmlFor={`price-${row.code}`}>Preço de consultor (R$)</label>
      <div className="flex flex-wrap items-center gap-2"><input id={`price-${row.code}`} inputMode="decimal" disabled={busy} value={value} onChange={e => setValue(e.target.value)} className="min-h-11 w-full sm:w-32 min-w-0 rounded-md border border-slate-300 bg-transparent px-2 disabled:opacity-50" />
        <button type="button" disabled={busy} title="Salvar preço" aria-label={`Salvar preço de ${row.name}`} onClick={() => void submit()} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white disabled:opacity-50"><Save size={18} />Salvar</button>
        <button type="button" disabled={busy || current === null} title="Usar preço comum" aria-label={`Remover preço de consultor de ${row.name}`} onClick={() => { if (window.confirm('Remover este preço de consultor? Será usado o preço comum.')) void save(row.code,null); }} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold disabled:opacity-40"><RotateCcw size={18} />Usar preço comum</button>
      </div>{error && <p role="alert" className="max-w-64 text-sm text-red-600">{error}</p>}
    </div>
  </div>;
}

export default function AdminPricing() {
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [missing, setMissing] = useState(false);
  const session = useRef({ mounted: false, request: 0, writing: false });
  const load = useCallback(async () => {
    const state = session.current;
    if (!state.mounted) return false;
    const ticket = ++state.request;
    setLoading(true); setLoadError('');
    try {
      const { data, error } = await supabase.rpc('admin_pricing', { p_user_id: null });
      if (!state.mounted || state.request !== ticket) return false;
      if (error || !data || !Array.isArray(data.products) || !Array.isArray(data.audit)) {
        setData(null); setLoadError('Não foi possível conferir a tabela atual. Confira a conexão e sua autorização.');
        return false;
      }
      setData(data); return true;
    } catch {
      if (state.mounted && state.request === ticket) {
        setData(null); setLoadError('Sem conexão para conferir os preços. Tente novamente.');
      }
      return false;
    } finally {
      if (state.mounted && state.request === ticket) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const state = session.current;
    state.mounted = true;
    const timer = setTimeout(() => void load(), 0);
    return () => { state.mounted = false; state.request++; clearTimeout(timer); };
  }, [load]);
  async function save(code: string, price: number | null) {
    const state = session.current;
    if (!state.mounted || state.writing || loading || loadError || !data) return;
    state.writing = true; state.request++;
    let saved = false;
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.rpc('admin_set_pricing', { p_action: 'affiliate', p_user_id: null, p_code: code, p_price: price, p_enabled: null });
      if (!state.mounted) return;
      if (error) { setMessage('A alteração não foi confirmada. Confira os dados e sua autorização.'); return; }
      saved = true;
      window.dispatchEvent(new Event('store-pricing-changed'));
    } catch {
      if (state.mounted) setMessage('Falha de conexão. Confira o resultado antes de tentar novamente.');
    } finally {
      // The write may have reached the server even when its response was lost.
      // Keep the synchronous lock until the authoritative read has completed.
      if (state.mounted) {
        const refreshed = await load();
        if (state.mounted) {
          if (saved) setMessage(refreshed ? 'Preço salvo e tabela atualizada.' : 'Preço salvo, mas falta conferir a tabela atualizada. Use “Conferir novamente”.');
          setBusy(false);
        }
      }
      state.writing = false;
    }
  }
  const rows = data?.products.filter(p => `${p.name} ${p.code}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (!missing || needsPrice(p))) ?? [];
  return <section className="min-w-0 space-y-4 pl-12 sm:pl-0">
    <header className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-900"><h1 className="text-2xl font-bold">Tabela geral de preços de consultor</h1><p className="mt-2 max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">Os valores desta tabela valem para todos os clientes com o benefício ativo. Para autorizar uma pessoa, use a carteira de clientes.</p><Link href="/admin/clientes" className="action-link mt-4">Ir à carteira de clientes</Link></header>
    <p role="status" className="text-sm">{message || (loading ? 'Conferindo tabela…' : '')}</p>
    {loadError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950"><p role="alert" className="text-sm">{loadError}</p><button type="button" disabled={busy || loading} onClick={() => void load()} className="action-link mt-3">Conferir novamente</button></div>}
    {data && <>
      <div className="flex flex-wrap items-center gap-4"><label className="flex min-h-11 min-w-0 w-full sm:w-auto items-center gap-2"><Search size={18} className="shrink-0"/><input aria-label="Buscar produto na tabela" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto" className="min-h-11 min-w-0 w-full sm:w-auto rounded-md border bg-transparent px-3" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={missing} onChange={e => setMissing(e.target.checked)}/>Preço pendente ({data.products.filter(needsPrice).length})</label></div>
      <PaginatedGrid key={`${search}:${missing}`} className="divide-y-0">{rows.map(row => <PriceEditor key={`${row.code}:${row.affiliate_price}`} row={row} busy={busy || loading || Boolean(loadError)} save={save} />)}</PaginatedGrid>
      {!rows.length && <p>Nenhum produto encontrado.</p>}
      <details className="border-t pt-4"><summary className="cursor-pointer font-semibold">Últimas alterações</summary><ul className="space-y-2 py-3 text-sm">{data.audit.map((a,i) => <li key={i}>{new Date(a.created_at).toLocaleString('pt-BR')} · {a.action === 'access' ? (a.after_value.enabled ? 'Benefício ativado' : 'Benefício desativado') : `${a.product_code}: ${a.after_value.price == null ? 'Preço removido' : formatPrice(a.after_value.price)}`}</li>)}</ul></details>
    </>}
  </section>;
}
