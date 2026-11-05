'use client';
import Pagination from './Pagination';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
type Review = { id: string; pedido_id: string; produto_id: string; nome: string; nota: number; comentario: string; publicado: boolean; produto?: string };

export default function ProductReviewModeration() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Review[]>([]);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function load(next = 0) {
    setOpen(true); setBusy(true); setError('');
    try {
      const { data, error } = await supabase.from('avaliacoes_produtos').select('id, pedido_id, produto_id, nome, nota, comentario, publicado, produtos(name, code)').order('created_at', { ascending: false }).order('id').range(next * 20, next * 20 + 19);
      if (error) throw error;
      setItems((data || []).map(item => {
        const product = Array.isArray(item.produtos) ? item.produtos[0] : item.produtos;
        return { ...item, produto: `${product ? `${product.name} (${product.code})` : item.produto_id} · Pedido #${item.pedido_id.split('-')[0]}` };
      })); setPage(next);
    } catch { setError('Não foi possível consultar as avaliações de produtos.'); }
    finally { setBusy(false); }
  }
  async function moderate(review: Review) {
    setBusy(true); setError('');
    try {
      const { data, error } = await supabase.from('avaliacoes_produtos').update({ publicado: !review.publicado, updated_at: new Date().toISOString() }).eq('id', review.id).select('id');
      if (error || !data?.length) throw error || new Error('Sem permissão');
      setItems(current => current.map(item => item.id === review.id ? { ...item, publicado: !item.publicado } : item));
    } catch { setError('Não foi possível alterar a publicação.'); }
    finally { setBusy(false); }
  }
  return <section className="border-y border-slate-200 py-4">
    <button type="button" aria-expanded={open} onClick={() => open ? setOpen(false) : void load()} className="min-h-11 font-semibold text-teal-700">Avaliações dos produtos</button>
    {open && <div className="space-y-4">
      <p className="text-sm text-slate-600">Modere conteúdo abusivo e dados pessoais, não opiniões negativas. Ocultar preserva o registro.</p>
      {busy && <p role="status">Processando…</p>}{error && <p role="alert">{error}</p>}
      {!busy && !error && !items.length && <p>Nenhuma avaliação nesta página.</p>}
      {items.map(item => <div key={item.id} className="border-t border-slate-200 py-3"><p className="font-semibold">{item.nome} · {item.nota}/5 · {item.publicado ? 'Publicada' : 'Não publicada'}</p><p className="break-words text-xs text-slate-500">Produto: {item.produto}</p><p className="my-2 whitespace-pre-wrap break-words">{item.comentario}</p><button type="button" disabled={busy} onClick={() => void moderate(item)} className="min-h-11 text-sm font-semibold text-teal-700 disabled:opacity-50">{item.publicado ? 'Ocultar avaliação' : 'Publicar avaliação'}</button></div>)}
      <Pagination label="Páginas de moderação de produtos" page={page + 1} hasNext={items.length === 20} busy={busy} onChange={next => void load(next - 1)} />
      <button type="button" disabled={busy} onClick={() => void load(page)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold disabled:opacity-50">Atualizar</button>
    </div>}
  </section>;
}
