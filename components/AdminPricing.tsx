'use client';

import { useCallback, useEffect, useState } from 'react';
import { Save, RotateCcw, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/products';
import PaginatedGrid from '@/components/PaginatedGrid';
import ConfirmDialog from '@/components/ConfirmDialog';

type Row = { code: string; name: string; price: number; affiliate_price: number | null; customer_price: number | null };
type Audit = { action: string; product_code: string | null; after_value: { price?: number | null; enabled?: boolean }; created_at: string };
type Data = { enabled: boolean; products: Row[]; audit: Audit[] };
const regularPriceCodes = new Set(['PRO-AMR', 'PRO-CIF', 'PRO-DEEP', 'PRO-HMS', 'PRO-LPC', 'PRO-SOFT']);
const needsPrice = (row: Row) => row.affiliate_price === null && !regularPriceCodes.has(row.code);

function PriceEditor({ row, individual, enabled, busy, save }: { row: Row; individual: boolean; enabled: boolean; busy: boolean; save: (code: string, price: number | null) => Promise<void> }) {
  const current = individual ? row.customer_price : row.affiliate_price;
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
      <p className="text-sm">Afiliado: {row.affiliate_price === null ? regularPriceCodes.has(row.code) ? 'Sem desconto; preço comum' : 'Não definido; usa preço comum' : formatPrice(row.affiliate_price)}</p>
      {individual && <p className="text-sm">Preço deste cliente: {formatPrice(enabled ? row.customer_price ?? row.affiliate_price ?? row.price : row.price)}</p>}
    </div>
    <div className="max-w-full"><label className="block text-sm" htmlFor={`price-${row.code}`}>{individual ? 'Exceção deste cliente (R$)' : 'Preço de afiliado (R$)'}</label>
      <div className="flex items-center gap-2"><input id={`price-${row.code}`} inputMode="decimal" value={value} onChange={e => setValue(e.target.value)} className="min-h-11 w-32 min-w-0 rounded-md border border-slate-300 bg-transparent px-2" />
        <button type="button" disabled={busy} title="Salvar preço" aria-label={`Salvar preço de ${row.name}`} onClick={() => void submit()} className="flex h-11 w-11 items-center justify-center rounded-md bg-teal-700 text-white disabled:opacity-50"><Save size={18} /></button>
        <button type="button" disabled={busy || current === null} title={individual ? 'Remover exceção e usar tabela padrão' : 'Remover preço de afiliado'} aria-label={`Remover preço especial de ${row.name}`} onClick={() => { if (window.confirm(individual ? 'Remover a exceção deste cliente?' : 'Remover este preço de afiliado? Será usado o preço comum onde não houver exceção.')) void save(row.code,null); }} className="flex h-11 w-11 items-center justify-center rounded-md border disabled:opacity-40"><RotateCcw size={18} /></button>
      </div>{error && <p role="alert" className="max-w-64 text-sm text-red-600">{error}</p>}
    </div>
  </div>;
}

export default function AdminPricing({ userId }: { userId?: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [customer, setCustomer] = useState<{ nome: string | null; email: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [missing, setMissing] = useState(false);
  const [pendingAccess, setPendingAccess] = useState<boolean | null>(null);
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_pricing', { p_user_id: userId ?? null });
    if (error) { setData(null); setMessage('Não foi possível consultar os preços. Verifique sua autorização e a instalação da atualização do banco.'); return; }
    if (userId) {
      const { data: profile, error: profileError } = await supabase.from('profiles').select('nome,email').eq('id', userId).maybeSingle();
      if (profileError || !profile) { setData(null); setMessage('Não foi possível identificar este cliente.'); return; }
      setCustomer(profile);
    }
    setData(data);
  }, [userId]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  async function save(action: string, code: string | null, price: number | null, enabled: boolean | null = null) {
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.rpc('admin_set_pricing', { p_action: action, p_user_id: userId ?? null, p_code: code, p_price: price, p_enabled: enabled });
      if (error) { setMessage('Alteração não salva. Confira os dados e sua autorização.'); return; }
      await load(); setMessage('Alteração salva.'); window.dispatchEvent(new Event('store-pricing-changed'));
    } catch { setMessage('Falha de conexão. Confira o resultado antes de tentar novamente.'); }
    finally { setBusy(false); }
  }
  const rows = data?.products.filter(p => `${p.name} ${p.code}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()) && (!missing || needsPrice(p))) ?? [];
  return <section className="min-w-0 space-y-4 pl-12 sm:pl-0">
    <h1 className="text-xl font-bold">{userId ? 'Benefício e preços do cliente' : 'Tabela de afiliados'}</h1>
    {userId && customer && <p className="break-words text-sm"><strong>{customer.nome || 'Cliente'}</strong><br/>{customer.email}</p>}
    <p role="status" className="text-sm">{message || (!data ? 'Carregando…' : '')}</p>
    {data && <>
      {userId && <label className="flex min-h-12 items-center gap-3 border-b pb-4"><input type="checkbox" checked={data.enabled} disabled={busy} onChange={e => setPendingAccess(e.target.checked)} className="h-5 w-5 accent-teal-700" /><span>Desconto de afiliado {data.enabled ? 'ativo' : 'inativo'}</span></label>}
      <div className="flex flex-wrap items-center gap-4"><label className="flex min-h-11 min-w-0 w-full sm:w-auto items-center gap-2"><Search size={18} className="shrink-0"/><input aria-label="Buscar produto na tabela" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto" className="min-h-11 min-w-0 w-full sm:w-auto rounded-md border bg-transparent px-3" /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={missing} onChange={e => setMissing(e.target.checked)}/>Preço pendente ({data.products.filter(needsPrice).length})</label></div>
      {userId && !data.enabled && <p className="text-sm text-amber-700">Benefício inativo. Exceções salvas só serão aplicadas após a aprovação.</p>}
      <PaginatedGrid key={`${search}:${missing}`} className="divide-y-0">{rows.map(row => <PriceEditor key={`${row.code}:${row.affiliate_price}:${row.customer_price}`} row={row} individual={!!userId} enabled={data.enabled} busy={busy} save={(code, price) => save(userId ? 'customer' : 'affiliate',code,price)} />)}</PaginatedGrid>
      {!rows.length && <p>Nenhum produto encontrado.</p>}
      <details className="border-t pt-4"><summary className="cursor-pointer font-semibold">Últimas alterações</summary><ul className="space-y-2 py-3 text-sm">{data.audit.map((a,i) => <li key={i}>{new Date(a.created_at).toLocaleString('pt-BR')} · {a.action === 'access' ? (a.after_value.enabled ? 'Benefício ativado' : 'Benefício desativado') : `${a.product_code}: ${a.after_value.price == null ? 'Preço removido' : formatPrice(a.after_value.price)}`}</li>)}</ul></details>
    </>}
    <ConfirmDialog open={pendingAccess !== null} title={pendingAccess ? 'Ativar preço de afiliado?' : 'Desativar benefício?'} message={pendingAccess ? 'Confirme que verificou o cadastro oficial deste cliente e autoriza o benefício na loja.' : 'As próximas compras deste cliente usarão os preços comuns. Os pedidos anteriores não serão alterados.'} confirmLabel={pendingAccess ? 'Autorizar benefício' : 'Desativar'} busy={busy} onCancel={() => setPendingAccess(null)} onConfirm={() => { if (pendingAccess !== null) void save('access', null, null, pendingAccess).then(() => setPendingAccess(null)); }} />
  </section>;
}
