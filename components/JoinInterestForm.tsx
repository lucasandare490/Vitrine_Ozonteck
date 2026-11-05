'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Contact = { name: string; phone: string; email: string; interest: string };
const emptyContact: Contact = { name: '', phone: '', email: '', interest: 'distribuicao' };
const input = 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-teal-700';

export default function JoinInterestForm() {
  const [contact, setContact] = useState<Contact>(emptyContact);
  const [userId, setUserId] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const locked = useRef(false);

  useEffect(() => {
    let active = true;
    let currentUser: string | null | undefined;
    const reset = () => {
      generation.current++;
      setContact(emptyContact); setUserId(null); setRegistered(false);
      setConsent(false); setNotice(''); setError(''); setLoading(true);
    };
    const load = async () => {
      const run = ++generation.current;
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!active || run !== generation.current) return;
        if (authError) throw authError;
        currentUser = user?.id ?? null;
        if (!user) { setLoading(false); return; }
        const [profile, interest] = await Promise.all([
          supabase.from('profiles').select('nome,telefone,email').eq('id', user.id).maybeSingle(),
          supabase.from('join_interests').select('name,phone,email,interest').eq('user_id', user.id).maybeSingle(),
        ]);
        if (!active || run !== generation.current) return;
        if (profile.error || interest.error) throw profile.error || interest.error;
        setContact(interest.data || {
          name: profile.data?.nome || '', phone: profile.data?.telefone || '',
          email: user.email || profile.data?.email || '', interest: 'distribuicao',
        });
        setRegistered(!!interest.data); setUserId(user.id); setLoading(false);
      } catch {
        if (active && run === generation.current) {
          setError('Não foi possível carregar o formulário. Confira sua conexão e sua sessão.'); setLoading(false);
        }
      }
    };
    const initial = window.setTimeout(() => { reset(); void load(); }, 0);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user.id ?? null;
      if (currentUser === nextUser) return;
      currentUser = nextUser;
      reset();
      // Avoid awaiting auth/database work inside Supabase's auth callback.
      window.setTimeout(() => { if (active) void load(); }, 0);
    });
    return () => { active = false; window.clearTimeout(initial); subscription.unsubscribe(); };
  }, [retry]);

  const submit = async () => {
    if (locked.current || !userId) return;
    if (!consent) { setError('Autorize o contato para registrar seu interesse.'); return; }
    if (!/^[0-9+(). -]+$/.test(contact.phone) || !/^[1-9][0-9]{9,14}$/.test(contact.phone.replace(/\D/g, ''))) {
      setError('Informe um telefone com DDD, com 10 a 15 dígitos.'); return;
    }
    const run = generation.current;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const { data, error: failure } = await supabase.rpc('submit_join_interest', {
        p_name: contact.name.trim(), p_phone: contact.phone.trim(), p_email: contact.email.trim(),
        p_interest: contact.interest, p_consent: consent,
      });
      if (run !== generation.current) return;
      if (failure || !data) {
        setError(failure?.message.includes('JOIN_RATE_LIMIT')
          ? 'Aguarde um minuto desde o último envio para alterar seus dados.'
          : 'Não foi possível registrar. Confira nome, telefone, e-mail e sua sessão e tente novamente.');
        return;
      }
      setRegistered(true); setConsent(false);
      setNotice('Interesse salvo. Rogério André poderá entrar em contato pelos dados informados.');
    } catch {
      if (run === generation.current) setError('Falha de conexão. Tente novamente; o mesmo envio não cria outro registro.');
    } finally { locked.current = false; setBusy(false); }
  };

  return <section aria-labelledby="join-interest-title" className="my-8 rounded-xl border border-teal-100 bg-teal-50/60 p-6 sm:p-8">
    <h2 id="join-interest-title" className="text-xl font-bold text-slate-900">Quer saber mais? Registre seu interesse</h2>
    <p className="mt-2 text-sm leading-relaxed text-slate-600">Peça um contato de Rogério André sobre consumo ou distribuição. Este registro é separado do cadastro oficial e não libera o preço de afiliado.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="mt-3 text-sm font-semibold text-teal-800">{notice}</p>}
    {loading ? <p role="status" className="mt-4 text-sm text-slate-600">Carregando formulário…</p>
      : error && !userId ? <button type="button" className="mt-3 min-h-11 font-semibold text-teal-800 underline" onClick={() => setRetry(value => value + 1)}>Tentar carregar novamente</button>
      : !userId ? <p className="mt-4 text-sm text-slate-700"><Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-teal-800 underline">Entre na sua conta ou cadastre-se</Link> e volte a esta página para registrar seu interesse.</p>
      : <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={event => { event.preventDefault(); void submit(); }}>
        {registered && <p className="text-sm text-slate-600 sm:col-span-2">Seu interesse já está registrado. Você pode atualizar os dados, com intervalo de um minuto entre alterações.</p>}
        <label className="text-sm font-semibold text-slate-800">Nome<input name="name" autoComplete="name" required minLength={3} maxLength={120} disabled={busy} value={contact.name} onChange={event => setContact(value => ({ ...value, name: event.target.value }))} className={input} /></label>
        <label className="text-sm font-semibold text-slate-800">Telefone / WhatsApp com DDD<input name="phone" type="tel" autoComplete="tel" required maxLength={32} disabled={busy} value={contact.phone} onChange={event => setContact(value => ({ ...value, phone: event.target.value }))} className={input} /></label>
        <label className="text-sm font-semibold text-slate-800">E-mail para contato<input name="email" type="email" autoComplete="email" required maxLength={254} disabled={busy} value={contact.email} onChange={event => setContact(value => ({ ...value, email: event.target.value }))} className={input} /></label>
        <label className="text-sm font-semibold text-slate-800">Meu interesse<select name="interest" disabled={busy} value={contact.interest} onChange={event => setContact(value => ({ ...value, interest: event.target.value }))} className={input}>
          <option value="distribuicao">Distribuição independente</option><option value="consumo">Compra para consumo</option><option value="ambos">Consumo e distribuição</option>
        </select></label>
        <label className="flex items-start gap-3 text-sm leading-relaxed text-slate-700 sm:col-span-2"><input type="checkbox" required checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} className="mt-1 size-5 shrink-0 accent-teal-800" />Autorizo Rogério André a entrar em contato comigo por telefone, WhatsApp ou e-mail sobre o interesse informado.</label>
        <div className="sm:col-span-2"><button disabled={busy || !consent} className="min-h-12 rounded-lg bg-teal-800 px-5 py-3 text-sm font-bold text-white hover:bg-teal-900 focus-visible:outline-teal-700 disabled:opacity-50">{busy ? 'Salvando…' : registered ? 'Atualizar interesse' : 'Registrar interesse'}</button></div>
      </form>}
  </section>;
}
