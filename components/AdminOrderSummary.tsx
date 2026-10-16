'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { isOpenPayment } from '@/lib/order-status';

type Order = { id: string; status: string; created_at: string };
export default function AdminOrderSummary({ orders, ready }: { orders: Order[]; ready: boolean }) {
  const known = useRef<Set<string> | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!ready) return;
    const confirmed = orders.filter(order => ['preparando', 'enviado', 'entregue'].includes(order.status));
    const added = known.current ? confirmed.filter(order => !known.current!.has(order.id)).length : 0;
    known.current = new Set(confirmed.map(order => order.id));
    if (added) {
      const timer = setTimeout(() => setNotice(`${added} novo(s) pedido(s) recebido(s).`), 0);
      return () => clearTimeout(timer);
    }
  }, [orders, ready]);
  const day = (date: Date) => date.toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
  const today = day(new Date());
  const entries = [
    ['Pedidos confirmados de hoje', orders.filter(order => ['preparando', 'enviado', 'entregue'].includes(order.status) && day(new Date(order.created_at)) === today).length],
    ['Compras em aberto', orders.filter(order => isOpenPayment(order.status)).length],
    ['Em preparação', orders.filter(order => order.status === 'preparando').length],
  ];
  return <section aria-label="Resumo dos pedidos" className="space-y-3">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{entries.map(([label, value]) => <Link key={label} href="/admin/pedidos" className="border-b border-slate-200 p-3"><span className="block text-sm">{label}</span><strong className="text-2xl">{value}</strong></Link>)}</div>
    <p role="status" className="text-sm text-teal-700">{notice}</p>
  </section>;
}
