'use client';

import { CheckCircle2, Package } from 'lucide-react';

export default function OrderConfirmationPreview() {
  return <section aria-label="Demonstração de pedido confirmado" className="space-y-5">
    <p className="border-b border-amber-200 pb-4 text-sm font-semibold text-amber-800">Demonstração · nenhum pagamento ou pedido foi alterado</p>
    <CheckCircle2 aria-hidden="true" size={40} className="text-teal-700" />
    <h2 className="text-xl font-bold">Pagamento aprovado</h2>
    <p className="text-sm leading-relaxed text-slate-600">O Mercado Pago confirmou o pagamento. Acompanhe a preparação e o recebimento em Meus pedidos.</p>
    <div className="flex items-center gap-3 border-y border-slate-200 py-5"><Package size={24} className="text-teal-700" /><div><p className="font-semibold">Em preparação</p><p className="mt-1 text-sm text-slate-600">A loja já pode preparar seu pedido.</p></div></div>
  </section>;
}
