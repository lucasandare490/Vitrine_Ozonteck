'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Monitor, ShieldCheck } from 'lucide-react';
import { encodeAuthenticatorQr } from '@/lib/authenticator-qr';
import { signOutWithCart } from '@/lib/cart-session';

const button = 'min-h-11 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50';
type Factor = { id: string; friendly_name?: string };
type Enrollment = { id: string; qr: string; secret: string };

export default function AccountSecurity() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [device, setDevice] = useState('Este navegador');
  const [confirmSessions, setConfirmSessions] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.assign('/login'); return; }
      const { data, error: factorError } = await supabase.auth.mfa.listFactors();
      if (factorError) throw factorError;
      setFactors(data.totp);
      const readiness = await supabase.rpc('account_mfa_ready');
      setReady(!readiness.error && readiness.data === true);
      setLoaded(true);
    } catch { setError('Não foi possível carregar a segurança da conta. Tente novamente.'); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const ua = navigator.userAgent;
      const platform = /Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iPhone/iPad' : /Windows/i.test(ua) ? 'Windows' : /Macintosh/i.test(ua) ? 'macOS' : 'este dispositivo';
      const browser = /Edg\//.test(ua) ? 'Microsoft Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome ou navegador compatível' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
      setDevice(`${browser} • ${platform}`);
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await action(); }
    catch { setError('Não foi possível concluir. Confira o código, se solicitado, e tente novamente.'); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold"><ShieldCheck className="shrink-0 text-teal-700" size={22} />Autenticação em duas etapas</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">Use um aplicativo autenticador para gerar o código de seis dígitos solicitado após o login. O código não é enviado por e-mail.</p>
      <div className="mt-4 rounded-lg border border-teal-100 bg-teal-50/50 p-4 text-sm leading-relaxed text-slate-700">
        <h3 className="font-bold text-slate-900">Para que serve?</h3>
        <p className="mt-1">Esta proteção opcional ajuda a impedir que alguém entre na sua conta usando apenas sua senha. Depois de ativá-la, você também precisará do código do aplicativo ao fazer um novo login.</p>
        <h3 className="mt-4 font-bold text-slate-900">Como configurar</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>Abra o Google Authenticator ou o Microsoft Authenticator no celular.</li>
          <li>Clique em Configurar autenticador abaixo e adicione uma conta no aplicativo, lendo o QR Code. No mesmo celular, use a chave manual.</li>
          <li>Digite aqui o código de seis dígitos do aplicativo para concluir a ativação.</li>
        </ol>
        <p className="mt-3">Código incorreto ou expirado não libera o acesso. Aguarde o próximo código e tente novamente, mantendo a data e a hora do celular automáticas.</p>
        <p className="mt-3">Antes de trocar ou apagar o celular, preserve o acesso ao seu aplicativo. Não compartilhe o QR Code, a chave manual nem os códigos. Esta proteção reduz riscos, mas não elimina todos eles.</p>
      </div>
      {loaded && <p className="mt-3 text-sm font-semibold">{factors.length ? 'Proteção ativada' : 'Proteção ainda não ativada'}</p>}
      {!loaded && <button className={`${button} mt-4`} disabled={busy} onClick={() => void load()}>Carregar configurações</button>}
      {loaded && !ready && !factors.length && <p className="mt-4 text-sm text-slate-600">A ativação depende da configuração de proteção do serviço. Ela será liberada assim que essa configuração estiver concluída.</p>}
      {loaded && ready && !enrollment && !removing && !factors.length && <button className={`${button} mt-4`} disabled={busy} onClick={() => void run(async () => {
        // Remove only abandoned enrollments created by this interface, never verified factors.
        const existing = await supabase.auth.mfa.listFactors();
        if (existing.error) throw existing.error;
        for (const factor of existing.data.all.filter(f => f.status === 'unverified' && f.friendly_name === 'Ozonteck autenticador')) {
          const result = await supabase.auth.mfa.unenroll({ factorId: factor.id });
          if (result.error) throw result.error;
        }
        const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Ozonteck autenticador', issuer: 'Ozonteck Recife' });
        if (enrollError) throw enrollError;
        setEnrollment({ id: data.id, qr: encodeAuthenticatorQr(data.totp.qr_code), secret: data.totp.secret }); setCode('');
      })}>Configurar autenticador</button>}
      {enrollment && <div className="mt-5 space-y-4">
        <p className="text-sm">No seu aplicativo autenticador, adicione uma conta lendo o QR Code ou inserindo a chave abaixo. Guarde o acesso ao aplicativo: ele será necessário nos próximos logins.</p>
        <Image unoptimized src={enrollment.qr} width={200} height={200} className="h-auto max-w-full rounded-lg bg-white" alt="QR Code para adicionar sua conta ao aplicativo autenticador" />
        <details className="text-sm"><summary className="min-h-11 cursor-pointer font-semibold text-teal-800">Usar chave manual no mesmo celular</summary><p className="break-all rounded-lg bg-slate-50 p-3 font-mono">{enrollment.secret}</p><p className="mt-2 text-xs text-slate-500">Não compartilhe esta chave.</p></details>
      </div>}
      {!enrollment && factors.map(factor => <div key={factor.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
        <p className="text-sm">{factor.friendly_name || 'Aplicativo autenticador'}</p>
        {!removing && <button className="min-h-11 px-3 text-sm font-bold text-red-700" disabled={busy} onClick={() => { setRemoving(factor.id); setCode(''); setMessage(''); setError(''); }}>Remover autenticador</button>}
      </div>)}
      {(enrollment || removing) && <form className="mt-4 space-y-4" onSubmit={event => {
        event.preventDefault(); void run(async () => {
          const factorId = enrollment?.id ?? removing!;
          const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
          if (verifyError) { setError('Não foi possível validar o código. Confira o código atual do aplicativo e tente novamente. Nenhuma alteração foi feita.'); return; }
          if (removing) {
            const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
            if (removeError) throw removeError;
            const refreshed = await supabase.auth.refreshSession();
            if (refreshed.error) throw refreshed.error;
          }
          const wasRemoving = Boolean(removing);
          setEnrollment(null); setRemoving(null); setCode(''); await load();
          setMessage(wasRemoving ? 'Autenticador desativado.' : 'Autenticador ativado. Nos próximos logins, confirme seu acesso com o código do aplicativo.');
        });
      }}>
        {removing && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Ao remover este autenticador, ele deixa de ser aceito nesta conta. Se for o único cadastrado, a verificação em duas etapas será desativada. Isso não desinstala o aplicativo nem encerra sessões em outros aparelhos.</p>}
        <label className="block text-sm font-semibold">{removing ? 'Confirme o código para desativar a proteção' : 'Código do aplicativo'}<input className="mt-2 block w-full max-w-xs rounded-lg border border-slate-300 p-3 focus-visible:outline-teal-700" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} /></label>
        <div className="flex flex-wrap gap-3"><button className={button} disabled={busy}>{busy ? 'Confirmando…' : removing ? 'Confirmar desativação' : 'Confirmar ativação'}</button><button type="button" className="min-h-11 px-4 text-sm font-semibold" disabled={busy} onClick={() => void run(async () => {
          if (enrollment) { const result = await supabase.auth.mfa.unenroll({ factorId: enrollment.id }); if (result.error) throw result.error; }
          setEnrollment(null); setRemoving(null); setCode('');
        })}>Cancelar</button></div>
      </form>}
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold"><Monitor size={22} className="shrink-0 text-teal-700" />Acessos à conta</h2>
      <p className="mt-4 text-sm font-semibold">Sessão atual</p><p className="mt-1 break-words text-sm text-slate-600">{device}</p>
      <button className="mt-3 min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-teal-700 disabled:opacity-50" disabled={!loaded || busy} onClick={() => void run(async () => {
        await signOutWithCart('local');
        window.location.assign('/login');
      })}>Sair deste dispositivo</button>
      <p className="mt-4 text-sm leading-relaxed text-slate-600">Encerre as outras sessões da sua conta e continue conectado neste navegador. Uma sessão já aberta pode permanecer válida até o vencimento do acesso atual.</p>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">Cada navegador tem sua própria sessão. Aqui você pode sair deste navegador ou encerrar os demais em conjunto; não é uma lista individual de aparelhos.</p>
      {!confirmSessions ? <button className={`${button} mt-4`} disabled={!loaded || busy} onClick={() => setConfirmSessions(true)}>Encerrar outras sessões</button> : <div className="mt-4 rounded-lg bg-slate-50 p-4">
        <p className="text-sm">Os outros navegadores precisarão entrar novamente. Deseja continuar?</p>
        <div className="mt-3 flex flex-wrap gap-3"><button className={button} disabled={busy} onClick={() => void run(async () => {
          const result = await supabase.auth.signOut({ scope: 'others' });
          if (result.error) throw result.error;
          setConfirmSessions(false); setMessage('As outras sessões foram encerradas. Este navegador continua conectado.');
        })}>Confirmar encerramento</button><button className="min-h-11 px-3 text-sm font-semibold" disabled={busy} onClick={() => setConfirmSessions(false)}>Cancelar</button></div>
      </div>}
    </section>
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">{message}</p>}
  </div>;
}
