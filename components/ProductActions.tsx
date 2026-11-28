'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Minus, Plus, ShoppingBag, MessageCircle, ShieldCheck } from 'lucide-react';
import type { Product } from '@/lib/data';
import { formatPrice } from '@/lib/products';
import { useCartStore } from '@/store/useCartStore';
import { useProductPrice } from '@/components/StorePricing';

export default function ProductActions({ product: original }: { product: Product }) {
  const pricing = useProductPrice(original.code, original.price);
  const product = { ...original, price: pricing.price };
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const count = useCartStore((state) => state.items.find((item) => item.id === product.id)?.quantity || 0);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const stock = product.estoque || 0;
  const limit = Math.max(0, Math.min(stock, 100) - (mounted ? count : 0));
  const selected = Math.min(quantity, Math.max(1, limit));
  const contact = `Olá! Tenho interesse em ${product.name} (código ${product.code}). Quantidade: ${selected}. Preço unitário no catálogo: ${formatPrice(product.price)}.${note.trim() ? ` Observação: ${note.trim()}` : ''}`;
  function add() {
    if (!mounted || limit === 0 || !pricing.ready) return;
    const store = useCartStore.getState();
    if (store.items.length >= 50 && !store.items.some((item) => item.id === product.id)) {
      setMessage('Seu carrinho atingiu 50 produtos. Revise a seleção antes de adicionar outro.');
      return;
    }
    for (let index = 0; index < selected; index++) store.addItem({
      id: product.id, code: product.code, name: product.name, price: product.price, estoque: stock,
    });
    setMessage(`${selected} unidade(s) adicionada(s) ao carrinho.`);
  }
  return <div className="product-actions space-y-5">
    <div>
      <p className="text-xs font-medium text-slate-500">{pricing.enabled ? 'Preço para sua conta' : 'Preço do produto'}</p>
      <p className="mt-1 break-words text-3xl font-extrabold tracking-tight text-teal-950 sm:text-[2.5rem]" aria-live="polite">{pricing.ready ? formatPrice(product.price) : pricing.error ? 'Preço indisponível' : 'Consultando preço…'}</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">Pix, boleto e cartões. Confira as opções e as parcelas ao pagar.</p>
    </div>
    <p className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${stock > 0 ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>{stock > 0 && <Check size={14} aria-hidden="true" />}{stock > 0 ? 'Disponível para solicitar' : 'Indisponível no momento'}</p>
    <div className="flex flex-wrap items-end justify-between gap-4 border-t border-slate-100 pt-5">
      <div><label htmlFor="product-quantity" className="mb-2 block text-xs font-semibold text-slate-600">Quantidade</label>
        <div className="flex w-36 items-center rounded-full border border-slate-200 bg-slate-50/80 p-1">
          <button type="button" aria-label="Diminuir quantidade" disabled={selected <= 1 || limit === 0} onClick={() => setQuantity(selected - 1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-teal-900 hover:bg-white focus-visible:outline-teal-700 disabled:opacity-35"><Minus size={17} /></button>
          <input id="product-quantity" type="number" min={1} max={Math.max(1, limit)} value={selected} disabled={limit === 0} onChange={(event) => setQuantity(Math.max(1, Math.min(limit, Math.floor(Number(event.target.value) || 1))))} className="h-11 w-full min-w-0 bg-transparent text-center text-sm font-semibold text-slate-900 focus-visible:outline-teal-700" />
          <button type="button" aria-label="Aumentar quantidade" disabled={selected >= limit} onClick={() => setQuantity(selected + 1)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-teal-900 hover:bg-white focus-visible:outline-teal-700 disabled:opacity-35"><Plus size={17} /></button>
        </div>
      </div>
      <p className="text-sm text-slate-600">Subtotal <strong className="block text-lg text-slate-900">{pricing.ready ? formatPrice(product.price * selected) : 'Consultando preço…'}</strong></p>
    </div>
    <div className="space-y-2.5">
      <button type="button" disabled={!mounted || limit === 0 || !pricing.ready} onClick={add} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal-800 px-4 py-3.5 font-bold text-white shadow-[0_6px_20px_-8px_rgba(15,118,110,.65)] transition-colors hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 disabled:opacity-50"><ShoppingBag size={20} />{limit === 0 && stock > 0 ? 'Limite do carrinho atingido' : 'Adicionar ao carrinho'}</button>
      <Link href="/lista" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-teal-800/15 bg-teal-50/40 px-3 text-sm font-semibold text-teal-900 transition-colors hover:bg-teal-50 focus-visible:outline-teal-700">Revisar carrinho<ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    <p role="status" className="empty:hidden rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-900">{message}</p>
    <div className="product-mobile-action" aria-label="Adicionar este produto ao carrinho">
      <div><span className="text-xs text-slate-600">{selected} {selected === 1 ? 'unidade' : 'unidades'}</span><strong className="block text-lg text-teal-950">{pricing.ready ? formatPrice(product.price * selected) : 'Consultando…'}</strong></div>
      <button type="button" disabled={!mounted || limit === 0 || !pricing.ready} onClick={add}><ShoppingBag size={20} aria-hidden="true" />{limit === 0 ? 'Indisponível' : 'Adicionar'}</button>
    </div>
    <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />Pagamento processado pelo Mercado Pago. Os dados completos do cartão não ficam armazenados na loja.</p>
    <details className="border-t border-slate-100 pt-4"><summary className="cursor-pointer py-2 text-sm font-semibold text-teal-900">Falar com o consultor</summary>
      <label htmlFor="product-note" className="mb-2 mt-3 block text-sm">Mensagem adicional (opcional)</label>
      <textarea id="product-note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 focus-visible:outline-teal-700" />
      <a href={`https://wa.me/5581981472684?text=${encodeURIComponent(contact)}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-700 px-4 py-3 text-sm font-bold text-teal-800 hover:bg-teal-50"><MessageCircle size={20} />Consultar pelo WhatsApp<span className="sr-only"> (abre em nova aba)</span></a>
    </details>
  </div>;
}
