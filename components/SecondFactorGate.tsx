'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { needsSecondFactor } from '@/lib/mfa';
import { usePathname } from 'next/navigation';

export default function SecondFactorGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<'loading' | 'allowed' | 'challenge' | 'error'>('loading');
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([]);
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const check = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session || !await needsSecondFactor()) { setState('allowed'); return; }
      const { data, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) throw factorError;
      setFactors(data.totp);
      setFactorId(previous => data.totp.some(f => f.id === previous) ? previous : data.totp[0]?.id ?? '');
      setState('challenge');
    } catch { setState('error'); }
  }, []);

  useEffect(() => {
    let stopped = false;
    const timer = setTimeout(() => void check(), 0);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => { if (!stopped) void check(); }, 0);
    });
    return () => { stopped = true; clearTimeout(timer); subscription.unsubscribe(); };
  }, [check]);

  const accountRoute = /^\/(conta|admin|login|lista)(\/|$)/.test(pathname);
  // Preserve the server-rendered storefront while the browser checks its session.
  if (state === 'allowed' || (state === 'loading' && !accountRoute)) return children;
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-slate-900">
    <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      {state === 'loading' ? <p role="status">Verificando sua sessão…</p> : state === 'error' ? <>
        <p role="alert">Não foi possível verificar sua sessão.</p>
        <button onClick={() => void check()} className="mt-4 min-h-11 rounded-lg bg-teal-700 px-4 text-white">Tentar novamente</button>
      </> : <>
        <h1 className="text-2xl font-bold">Confirme seu acesso</h1>
        <p className="my-4 text-sm text-slate-600">Digite o código de seis dígitos do seu aplicativo autenticador para continuar.</p>
        <form onSubmit={async (event) => {
          event.preventDefault(); if (busy) return; setBusy(true); setError('');
          try {
            const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
            if (verifyError) throw verifyError;
            window.location.reload();
          } catch { setError('Código inválido ou expirado. Use o código atual do aplicativo e tente novamente.'); }
          finally { setBusy(false); }
        }} className="space-y-4">
          {factors.length > 1 && <label className="block text-sm">Autenticador<select className="mt-2 w-full rounded-lg border p-3" value={factorId} onChange={e => setFactorId(e.target.value)}>{factors.map(f => <option key={f.id} value={f.id}>{f.friendly_name || 'Aplicativo autenticador'}</option>)}</select></label>}
          <label className="block text-sm font-semibold">Código de verificação<input className="mt-2 w-full rounded-lg border border-slate-300 p-3 focus-visible:outline-teal-700" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {!factors.length && <p role="alert" className="text-sm text-red-700">Nenhum aplicativo autenticador disponível. Entre em contato com o atendimento para recuperar o acesso.</p>}
          <button disabled={busy || !factorId} className="min-h-11 w-full rounded-lg bg-teal-700 px-4 font-bold text-white disabled:opacity-50">{busy ? 'Verificando…' : 'Confirmar código'}</button>
        </form>
      </>}
      {state !== 'loading' && <button className="mt-4 min-h-11 text-sm font-semibold text-slate-600" onClick={async () => {
        // AAL1 cannot access the account cart. Do not overwrite its saved state on cancellation.
        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
        if (signOutError) { setError('Não foi possível sair. Tente novamente.'); return; }
        window.location.assign('/login');
      }}>Voltar para o login</button>}
    </section>
  </main>;
}
