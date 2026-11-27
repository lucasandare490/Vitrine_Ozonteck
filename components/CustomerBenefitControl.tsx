'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, Info, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/ConfirmDialog';

type Benefit = { id: string; name: string | null; enabled: boolean; updated_at: string | null };

export default function CustomerBenefitControl({ userId, customerName, refreshKey = 0, detailed = false }: {
  userId: string; customerName?: string | null; refreshKey?: number; detailed?: boolean;
}) {
  const [benefit, setBenefit] = useState<Benefit | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState<boolean | null>(null);
  const session = useRef({ request: 0, writing: false, mounted: false, userId });

  const load = useCallback(async () => {
    const state = session.current;
    if (state.writing) return;
    const ticket = ++state.request;
    setLoading(true);
    setError('');
    try {
      const { data, error: readError } = await supabase.rpc('admin_pricing', { p_user_id: userId });
      if (!state.mounted || ticket !== state.request) return;
      if (readError || !data || typeof data.enabled !== 'boolean') {
        setError('Não foi possível conferir o benefício. Tente novamente.');
        return;
      }
      let name = customerName || null;
      if (!customerName) {
        const { data: profile, error: profileError } = await supabase.from('profiles').select('nome').eq('id', userId).maybeSingle();
        if (!state.mounted || ticket !== state.request) return;
        if (profileError || !profile) { setError('Não foi possível identificar o cliente.'); return; }
        name = profile.nome;
      }
      setBenefit({ id: userId, name, enabled: data.enabled, updated_at: null });
    } catch {
      if (state.mounted && ticket === state.request) setError('Sem conexão para conferir o benefício. Tente novamente.');
    } finally {
      if (state.mounted && ticket === state.request) setLoading(false);
    }
  }, [userId, customerName]);

  useEffect(() => {
    const state = session.current;
    state.mounted = true;
    state.userId = userId;
    const timer = window.setTimeout(() => void load(), 0);
    return () => { state.mounted = false; state.request++; window.clearTimeout(timer); };
  }, [load, refreshKey, userId]);

  async function save() {
    const state = session.current;
    if (pending === null || state.writing || !benefit || benefit.id !== userId) return;
    const target = userId;
    const enabled = pending;
    state.writing = true;
    state.request++;
    setBusy(true); setSaveError(''); setMessage('');
    try {
      const { error: writeError } = await supabase.rpc('admin_set_pricing', {
        p_action: 'access', p_user_id: target, p_code: null, p_price: null, p_enabled: enabled,
      });
      if (!state.mounted || state.userId !== target) return;
      if (writeError) {
        setSaveError('A alteração não foi confirmada. Confira o estado antes de tentar novamente.');
        return;
      }
      setPending(null);
      setMessage(enabled ? 'Preço de consultor ativado.' : 'Preço comum ativado.');
      window.dispatchEvent(new Event('store-pricing-changed'));
    } catch {
      if (state.mounted && state.userId === target) setSaveError('A conexão caiu. Confira o estado antes de tentar novamente.');
    } finally {
      state.writing = false;
      if (state.mounted && state.userId === target) {
        setBusy(false);
        setPending(null);
        // Re-read even after a network failure: the server may have saved it.
        await load();
      }
    }
  }

  const known = benefit?.id === userId && !loading && !error;
  const name = customerName || (benefit?.id === userId ? benefit.name : null) || 'este cliente';
  return <section aria-label={`Benefício de ${name}`} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm dark:border-neutral-700 dark:bg-neutral-900">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="flex items-center gap-2 font-bold text-slate-900 dark:text-white"><BadgeCheck size={19} aria-hidden="true" />Preço de consultor</p>
        <p className="mt-1 text-slate-600 dark:text-slate-300" role="status">
          {loading ? 'Conferindo benefício…' : !known ? 'Estado não confirmado' : benefit.enabled ? 'Ativo · usa a tabela de consultor' : 'Inativo · usa o preço comum'}
        </p>
      </div>
      <button type="button" disabled={!known || busy} aria-label={`${benefit?.enabled ? 'Desativar' : 'Ativar'} preço de consultor para ${name}`}
        onClick={() => { setMessage(''); setSaveError(''); setPending(!benefit!.enabled); }}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-700 bg-teal-700 px-4 font-bold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-400">
        {busy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
        {busy ? 'Salvando…' : known ? benefit.enabled ? 'Desativar benefício' : 'Ativar benefício' : 'Aguarde'}
      </button>
    </div>
    {error && <div className="mt-3"><p role="alert" className="text-red-700 dark:text-red-300">{error}</p><button type="button" disabled={busy || loading} onClick={() => { setPending(null); void load(); }} className="action-link mt-2">Conferir novamente</button></div>}
    {saveError && <p role="alert" className="mt-3 text-red-700 dark:text-red-300">{saveError}</p>}
    {message && <p role="status" className="mt-3 font-semibold text-teal-800 dark:text-teal-200">{message}</p>}
    <details open={detailed || undefined} className="mt-3 border-t border-slate-200 pt-3 dark:border-neutral-700">
      <summary className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-2 font-semibold text-teal-800 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-teal-200 dark:hover:bg-teal-950"><Info size={18} aria-hidden="true" />Como funciona o benefício?</summary>
      <div className="space-y-2 px-2 pb-2 pt-3 leading-relaxed text-slate-600 dark:text-slate-300">
        <p>Ative somente para clientes que você autorizou a comprar pela tabela de consultor. O benefício vale para esta conta na nossa loja.</p>
        <p>O valor de cada produto vem da tabela geral. Aqui você apenas ativa ou desativa o benefício; não precisa editar os produtos deste cliente.</p>
        <p>Quando não existe preço de consultor cadastrado para um produto, vale o preço comum. Pedidos anteriores mantêm os valores da compra.</p>
        <p>O cadastro e a autorização no escritório da Ozonteck não são sincronizados automaticamente.</p>
      </div>
    </details>
    <ConfirmDialog open={pending !== null} title={pending ? 'Ativar preço de consultor?' : 'Desativar o benefício?'}
      message={pending ? `Confirme que você autoriza ${name} a usar a tabela de consultor nas próximas compras da nossa loja.` : `${name} passará a usar os preços comuns nas próximas compras. Os pedidos anteriores não serão alterados.`}
      confirmLabel={pending ? 'Sim, ativar benefício' : 'Sim, desativar benefício'} busy={busy}
      onCancel={() => setPending(null)} onConfirm={() => void save()} />
  </section>;
}
