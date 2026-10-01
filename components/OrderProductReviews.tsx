'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star } from 'lucide-react';
import Link from 'next/link';
import { productPath, formatPrice } from '@/lib/products';
import { isRetiredProduct } from '@/lib/catalog-availability';

type Item = { produto_id: string; nome: string; code: string; nota: number | null; comentario: string | null; publicado: boolean | null; submitted?: boolean };

type PurchasedItem = { code?: string; nome: string; qtd: number; price?: number };

export default function OrderProductReviews({ orderId, purchasedItems, delivered }: { orderId: string; purchasedItems: PurchasedItem[]; delivered: boolean }) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function load(code: string) {
    setSelectedCode(code);
    if (items) return;
    setLoading(true); setError('');
    try {
      const { data, error } = await supabase.rpc('itens_avaliaveis', { p_pedido: orderId });
      if (error) throw error;
      setItems(data || []);
    } catch { setError('Não foi possível carregar os produtos para avaliação. Tente novamente.'); }
    finally { setLoading(false); }
  }
  return <ul className="divide-y divide-slate-200" aria-label="Produtos deste pedido">
    {purchasedItems.map((purchased, index) => {
      const item = items?.find(item => item.code === purchased.code);
      const open = Boolean(purchased.code && selectedCode === purchased.code);
      return <li key={`${purchased.code || 'legado'}-${index}`} className="py-4 first:pt-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="break-words text-sm font-semibold">{purchased.code && !isRetiredProduct({ code: purchased.code }) ? <Link href={productPath(purchased.code)} className="text-teal-800 hover:underline">{purchased.nome}</Link> : purchased.nome}</p>
            <p className="mt-1 text-xs text-slate-600">Quantidade: {purchased.qtd}{typeof purchased.price === 'number' && Number.isFinite(purchased.price) ? ` · Valor unitário: ${formatPrice(purchased.price)}` : ''}</p>
          </div>
          {delivered && purchased.code && <button type="button" disabled={loading} aria-expanded={open} aria-label={`${open ? 'Fechar avaliação de' : 'Avaliar produto:'} ${purchased.nome}`} onClick={() => open ? setSelectedCode(null) : void load(purchased.code!)} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-700 disabled:opacity-50"><Star size={16} aria-hidden="true" />{open ? 'Fechar' : 'Avaliar produto'}</button>}
        </div>
        {delivered && !purchased.code && <p className="mt-2 text-xs text-slate-500">Avaliação indisponível: item antigo sem código de identificação.</p>}
        {open && <div className="mt-3">
          {loading && <p role="status">Carregando avaliação…</p>}
          {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => void load(purchased.code!)} className="min-h-11 underline">Tentar novamente</button></div>}
          {!loading && !error && (item ? <ItemReview key={item.produto_id} item={item} orderId={orderId} onSent={() => setItems(current => current?.map(review => review.produto_id === item.produto_id ? { ...review, submitted: true } : review) || [])} /> : <p className="text-sm">Não foi possível confirmar este produto no pedido para avaliação.</p>)}
        </div>}
      </li>;
    })}
  </ul>;
}

function ItemReview({ item, orderId, onSent }: { item: Item; orderId: string; onSent: () => void }) {
  const [sent, setSent] = useState(item.nota !== null || Boolean(item.submitted));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || sent) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    try {
      const { error } = await supabase.rpc('enviar_avaliacao_produto', { p_pedido: orderId, p_produto: item.produto_id, p_nota: Number(data.get('nota')), p_comentario: String(data.get('comentario') || '') });
      if (error) {
        if (error.code === '23505') { setSent(true); onSent(); return; }
        throw error;
      }
      setSent(true);
      onSent();
    } catch { setMessage('Não foi possível enviar. Confira sua sessão e tente novamente.'); }
    finally { setBusy(false); }
  }
  return <div className="border-t border-slate-200 pt-4">
    <h4 className="font-semibold">{item.nome}</h4>
    {sent ? <p role="status" className="mt-2 text-sm text-teal-800">{item.publicado ? 'Avaliação publicada.' : 'Avaliação recebida para análise.'}</p> : <form onSubmit={submit} className="mt-3 space-y-3">
      <p className="text-sm text-slate-600">Avalie somente este produto. Após análise, sua opinião será exibida na página dele.</p>
      <label className="block text-sm">Nota do produto<select name="nota" required defaultValue="" className="ml-3 min-h-11 rounded border border-slate-300 p-2"><option value="" disabled>Selecione</option>{[5,4,3,2,1].map(n => <option key={n} value={n}>{n} {n === 1 ? 'estrela' : 'estrelas'}</option>)}</select></label>
      <label className="block text-sm">Sua experiência com este produto<textarea name="comentario" maxLength={2000} rows={3} className="mt-2 block w-full rounded border border-slate-300 p-3" /></label>
      {message && <p role="alert">{message}</p>}
      <button disabled={busy} className="min-h-11 rounded bg-teal-700 px-4 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Enviando…' : 'Enviar avaliação deste produto'}</button>
    </form>}
  </div>;
}
