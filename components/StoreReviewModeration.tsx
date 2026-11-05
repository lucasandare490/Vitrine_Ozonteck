'use client';
import Pagination from './Pagination';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type Review = { id: string; pedido_id: string | null; nome_cliente: string; nota: number; comentario: string | null; publicado: boolean };

export default function StoreReviewModeration() {
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState<Review[]>([]);
  const [page,setPage]=useState(0);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  async function load(next=0) {
    setOpen(true);setBusy(true);setError('');
    try {
      const {data,error}=await supabase.from('avaliacoes').select('id,pedido_id,nome_cliente,nota,comentario,publicado').order('created_at',{ascending:false}).order('id').range(next*20,next*20+19);
      if(error) throw error;
      setItems(data || []);setPage(next);
    } catch { setError('Não foi possível carregar a moderação da loja. Confirme a instalação da atualização de avaliações no banco.'); }
    finally {setBusy(false);}
  }
  async function moderate(item:Review) {
    setBusy(true);setError('');
    try {
      const {data,error}=await supabase.from('avaliacoes').update({publicado:!item.publicado}).eq('id',item.id).select('id');
      if(error || !data?.length) throw error || new Error('Sem permissão');
      setItems(current=>current.map(review=>review.id===item.id?{...review,publicado:!item.publicado}:review));
    } catch {setError('Não foi possível alterar a publicação.');}
    finally {setBusy(false);}
  }
  return <section className="border-y border-slate-200 py-4">
    <button type="button" aria-expanded={open} onClick={()=>open?setOpen(false):void load()} className="min-h-11 font-semibold text-teal-700">Experiências de compra: moderação da loja</button>
    {open && <div className="space-y-4"><p className="text-sm text-slate-600">Todas as notas são aceitas. Modere abuso e dados pessoais, não críticas. Ocultar não apaga o registro.</p>
      {busy && <p role="status">Processando…</p>}{error && <p role="alert">{error}</p>}
      {!busy && !error && !items.length && <p>Nenhuma avaliação nesta página.</p>}
      {items.map(item=><article key={item.id} className="border-t border-slate-200 py-3"><h3 className="font-semibold">{item.nome_cliente} · {item.nota}/5</h3><p className="text-sm">{item.pedido_id?`Pedido #${item.pedido_id.split('-')[0]}`:'Registro antigo sem pedido vinculado'} · {item.publicado?'Publicada':'Não publicada'}</p><p className="my-2 whitespace-pre-wrap break-words">{item.comentario || 'Sem comentário.'}</p><button type="button" disabled={busy} onClick={()=>void moderate(item)} className="min-h-11 font-semibold text-teal-700 disabled:opacity-50">{item.publicado?'Ocultar':'Publicar'}</button></article>)}
      <Pagination label="Páginas de moderação da loja" page={page + 1} hasNext={items.length === 20} busy={busy} onChange={next => void load(next - 1)} />
      <button type="button" disabled={busy} onClick={()=>void load(page)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-semibold disabled:opacity-50">Atualizar</button>
    </div>}
  </section>;
}
