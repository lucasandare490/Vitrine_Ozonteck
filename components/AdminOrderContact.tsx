import { MessageCircle } from 'lucide-react';
import { orderContactLink, type OrderContactAddress } from '@/lib/order-contact';

export default function AdminOrderContact({ id, address }: { id: string; address: OrderContactAddress | null }) {
  const href = orderContactLink(id, address);
  return <section className="space-y-3 border-t border-slate-200 pt-4">
    {href ? <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"><MessageCircle size={18} />Conversar no WhatsApp<span className="sr-only"> (abre em nova aba)</span></a>
      : <p className="text-sm text-amber-700">Pedido sem telefone válido para WhatsApp.</p>}
  </section>;
}
