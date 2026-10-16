'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingBag, MessageCircle } from 'lucide-react';
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
      setMessage('Sua lista atingiu 50 produtos. Revise a seleção antes de adicionar outro.');
      return;
    }
    for (let index = 0; index < selected; index++) store.addItem({
      id: product.id, code: product.code, name: product.name, price: product.price, estoque: stock,
    });
    setMessage(`${selected} unidade(s) adicionada(s) à sua lista.`);
  }
  return <div className="space-y-4">
    <p className="text-sm font-semibold text-slate-600">{stock > 0 ? 'Disponível para solicitar' : 'Indisponível no momento'}</p>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><label htmlFor="product-quantity" className="mb-2 block text-sm font-semibold">Quantidade</label>
        <div className="flex w-40 items-center rounded-md border border-slate-300">
          <button type="button" aria-label="Diminuir quantidade" disabled={selected <= 1 || limit === 0} onClick={() => setQuantity(selected - 1)} className="flex h-11 w-11 shrink-0 items-center justify-center disabled:opacity-40"><Minus size={18} /></button>
          <input id="product-quantity" type="number" min={1} max={Math.max(1, limit)} value={selected} disabled={limit === 0} onChange={(event) => setQuantity(Math.max(1, Math.min(limit, Math.floor(Number(event.target.value) || 1))))} className="h-11 w-full min-w-0 text-center" />
          <button type="button" aria-label="Aumentar quantidade" disabled={selected >= limit} onClick={() => setQuantity(selected + 1)} className="flex h-11 w-11 shrink-0 items-center justify-center disabled:opacity-40"><Plus size={18} /></button>
        </div>
      </div>
      <p className="text-sm text-slate-600">Subtotal <strong className="block text-lg text-slate-900">{pricing.ready ? formatPrice(product.price * selected) : 'Consultando preço…'}</strong></p>
    </div>
    <button type="button" disabled={!mounted || limit === 0 || !pricing.ready} onClick={add} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 font-bold text-white hover:bg-teal-800 disabled:opacity-50"><ShoppingBag size={20} />{limit === 0 && stock > 0 ? 'Limite da lista atingido' : 'Adicionar à lista'}</button>
    <p role="status" className="text-sm text-teal-800">{message}</p>
    <Link href="/lista" className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline underline-offset-4">Revisar minha lista</Link>
    <details className="border-t border-slate-200 pt-4"><summary className="cursor-pointer py-2 font-semibold">Falar com o consultor</summary>
      <label htmlFor="product-note" className="mb-2 mt-3 block text-sm">Mensagem adicional (opcional)</label>
      <textarea id="product-note" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="w-full rounded-md border border-slate-300 p-3" />
      <a href={`https://wa.me/5581981472684?text=${encodeURIComponent(contact)}`} target="_blank" rel="noopener noreferrer" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-md border border-teal-700 px-4 py-3 font-bold text-teal-800"><MessageCircle size={20} />Consultar pelo WhatsApp<span className="sr-only"> (abre em nova aba)</span></a>
    </details>
  </div>;
}
