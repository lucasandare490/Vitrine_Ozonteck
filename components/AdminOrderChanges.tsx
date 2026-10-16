'use client';
import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { orderAddressText, type OrderContactAddress } from '@/lib/order-contact';
type Change = { id: string; pedido_id: string; novo_pedido_id: string | null; motivo: string; created_at: string; antes: { endereco?: OrderContactAddress }; nova: { endereco_entrega: OrderContactAddress | null } | null };
export default function AdminOrderChanges() {
  const [changes, setChanges] = useState<Change[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase.from('pedido_alteracoes').select('id,pedido_id,novo_pedido_id,motivo,created_at,antes,nova:pedidos!pedido_alteracoes_novo_pedido_id_fkey(endereco_entrega)').order('created_at', { ascending: false }).limit(30);
      if (active) { setError(!!error); if (!error) setChanges((data || []) as unknown as Change[]); }
    }
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = setInterval(refresh, 30000); window.addEventListener('focus', refresh);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const labels: Record<string, string> = { pagamento: 'Forma de pagamento', endereco: 'Endereço', dados: 'Dados do comprador' };
  return <section className="space-y-3 border-y border-slate-200 py-5" aria-label="Compras com alterações">
    <h2 className="flex items-center gap-2 text-lg font-bold"><History size={20} />Compras com alterações ({changes.length})</h2>
    {error ? <p role="alert" className="text-sm text-amber-800">Histórico indisponível. Verifique a instalação no banco e sua autorização.</p> : !changes.length ? <p className="text-sm text-slate-500">Nenhuma alteração registrada.</p> : <ul className="max-h-72 divide-y overflow-y-auto" aria-live="polite">{changes.map(change => <li key={change.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><div><strong>{labels[change.motivo] || 'Alteração'}</strong><p>Compra #{change.pedido_id.slice(0, 8)} · {change.novo_pedido_id ? 'Nova tentativa registrada' : 'Reaberta para edição'}</p><time>{new Date(change.created_at).toLocaleString('pt-BR')}</time><details className="mt-2"><summary className="cursor-pointer font-semibold">Ver dados anteriores e atuais</summary><p className="mt-2">Antes: {change.antes.endereco?.nome} · {change.antes.endereco?.telefone} · {orderAddressText(change.antes.endereco || null)}</p><p className="mt-2">Depois: {change.nova ? `${change.nova.endereco_entrega?.nome || ''} · ${change.nova.endereco_entrega?.telefone || ''} · ${orderAddressText(change.nova.endereco_entrega)}` : 'Aguardando nova tentativa de pagamento'}</p></details></div><a className="font-semibold text-teal-700 underline" href={`/admin/pedidos?pedido=${change.novo_pedido_id || change.pedido_id}`}>Ver compra</a></li>)}</ul>}
  </section>;
}
