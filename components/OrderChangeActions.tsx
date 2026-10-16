'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCartStore } from '@/store/useCartStore';
import ConfirmDialog from './ConfirmDialog';

export default function OrderChangeActions({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState<'pagamento' | 'endereco' | 'dados' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function reopen() {
    if (!reason || busy) return;
    if (useCartStore.getState().items.length) { setError('Seu carrinho contém outros produtos. Guarde ou conclua essa compra antes de reabrir esta.'); setReason(null); return; }
    setBusy(true); setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Entre na sua conta.');
      const response = await fetch(`/api/pedidos/${orderId}/alterar`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      // Only the reference is carried in the URL; data is recovered from RLS-protected storage.
      window.location.assign(`/lista?alteracao=${encodeURIComponent(result.change.id)}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível alterar.'); setBusy(false); setReason(null); }
  }
  return <div className="space-y-3 border-t border-slate-200 pt-4">
    <div className="flex flex-wrap gap-2">{([['pagamento', 'Alterar pagamento'], ['endereco', 'Alterar endereço'], ['dados', 'Alterar dados']] as const).map(([value, label]) => <button key={value} type="button" disabled={busy} onClick={() => setReason(value)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-teal-800"><Pencil size={16} />{label}</button>)}</div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <ConfirmDialog open={!!reason} busy={busy} title="Reabrir compra para alteração?" message="A cobrança atual será cancelada antes de reabrir os dados e o pagamento. Não pague o código antigo. Os preços e o estoque serão conferidos novamente, e a loja terá o histórico desta alteração." confirmLabel="Cancelar cobrança e editar" onCancel={() => setReason(null)} onConfirm={() => void reopen()} />
  </div>;
}
