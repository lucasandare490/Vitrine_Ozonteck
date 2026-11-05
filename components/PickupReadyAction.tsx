'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

type PickupOrder = {
  id: string;
  status: string;
  status_pagamento?: string | null;
  retirada_pronta_em: string | null;
  endereco_entrega: { modalidade?: string } | null;
};

export function isPickupReady(order: PickupOrder) {
  return Boolean(order.retirada_pronta_em) && order.status === 'preparando'
    && order.status_pagamento === 'approved' && order.endereco_entrega?.modalidade === 'retirada';
}

export default function PickupReadyAction({ order, disabled, onUpdated }: {
  order: PickupOrder;
  disabled?: boolean;
  onUpdated: (readyAt: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  if (order.endereco_entrega?.modalidade !== 'retirada') return null;
  const ready = isPickupReady(order);
  const eligible = order.status === 'preparando' && order.status_pagamento === 'approved';

  async function markReady() {
    if (saving || disabled || !eligible || ready) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('pedidos')
        .update({ retirada_pronta_em: new Date().toISOString() })
        .eq('id', order.id).eq('status', 'preparando').eq('status_pagamento', 'approved')
        .eq('endereco_entrega->>modalidade', 'retirada').is('retirada_pronta_em', null)
        .select('id, retirada_pronta_em');
      if (error) throw error;
      if (data?.length !== 1 || !data[0].retirada_pronta_em) {
        throw new Error('O pedido foi alterado. Atualize a página e confira o status.');
      }
      onUpdated(data[0].retirada_pronta_em);
      toast.success('Pedido marcado como pronto para retirada.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível marcar a retirada pronta.');
    } finally {
      setSaving(false);
    }
  }

  return <section className="space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-500/20 dark:bg-teal-500/10">
    <h4 className="flex items-center gap-2 text-sm font-bold text-teal-800 dark:text-teal-300">
      {ready ? <CheckCircle2 size={18} /> : <Package size={18} />}
      {ready ? 'Pronto para retirada' : 'Retirada na loja'}
    </h4>
    {ready ? <p role="status" className="text-xs text-teal-800 dark:text-teal-200">
      Marcado em {new Date(order.retirada_pronta_em!).toLocaleString('pt-BR')}. A retirada já aparece na conta do cliente.
    </p> : <>
      <p className="text-xs text-teal-800 dark:text-teal-200">Marque somente após separar e conferir os itens. Esta ação avisa ao cliente que ele já pode retirar o pedido.</p>
      <button type="button" onClick={() => void markReady()} disabled={saving || disabled || !eligible}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        {saving ? 'Salvando…' : 'Marcar pronto para retirada'}
      </button>
      {!eligible && <p className="text-xs text-amber-800 dark:text-amber-300">Disponível apenas em preparo, com pagamento aprovado.</p>}
    </>}
  </section>;
}
