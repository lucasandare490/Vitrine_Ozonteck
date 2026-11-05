'use client';
import Pagination from './Pagination';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Ticket = { id: string; subject: string; message: string; status: string; response: string | null; created_at: string };
export default function SupportTickets({ admin = false }: { admin?: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const requestId = useRef<string | null>(null);
  const locked = useRef(false);
  const generation = useRef(0);
  const currentUser = useRef<string | null | undefined>(undefined);
  const accountVersion = useRef(0);
  const mounted = useRef(false);
  const load = useCallback(async () => {
    if (!mounted.current) return;
    const run = ++generation.current;
    const { data: { user } } = await supabase.auth.getUser();
    if (run !== generation.current) return;
    currentUser.current = user?.id ?? null;
    setSignedIn(!!user);
    if (!user) { setTickets([]); setLoading(false); return; }
    let query = supabase.from('support_tickets').select('id,subject,message,status,response,created_at').order('created_at', { ascending: false }).range(page * 20, page * 20 + 19);
    if (!admin) query = query.eq('user_id', user.id);
    const result = await query;
    if (run !== generation.current) return;
    if (result.error) setError('Não foi possível carregar os atendimentos. Tente atualizar a página.');
    else { setTickets(result.data || []); setError(''); }
    setLoading(false);
  }, [admin, page]);
  useEffect(() => {
    mounted.current = true;
    const requestGeneration = generation;
    let authTimer: number | undefined;
    const initial = window.setTimeout(() => { void load(); }, 0);
    const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 30000);
    const focus = () => { void load(); };
    window.addEventListener('focus', focus);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) return;
      const nextUser = session?.user.id ?? null;
      if (currentUser.current === nextUser) return;
      currentUser.current = nextUser;
      generation.current++; accountVersion.current++;
      setTickets([]); setSignedIn(false); setSubject(''); setMessage(''); setResponses({});
      setNotice(''); setError(''); setPage(0); setLoading(true); setBusy(false);
      requestId.current = null; locked.current = false;
      window.clearTimeout(authTimer);
      // Do not await auth/database work inside the Supabase auth callback.
      authTimer = window.setTimeout(() => { if (mounted.current) void load(); }, 0);
    });
    return () => {
      mounted.current = false; requestGeneration.current++;
      subscription.unsubscribe(); window.clearTimeout(initial); window.clearTimeout(authTimer);
      window.clearInterval(timer); window.removeEventListener('focus', focus);
    };
  }, [load]);
  const submit = async () => {
    if (locked.current) return;
    const version = accountVersion.current;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    requestId.current ||= crypto.randomUUID();
    try {
      const { data, error: failure } = await supabase.rpc('open_support_ticket', { p_id: requestId.current, p_subject: subject.trim(), p_message: message.trim() });
      if (!mounted.current || version !== accountVersion.current) return;
      if (failure || !data) { setError(failure?.message.includes('SUPPORT_LIMIT') ? 'Você atingiu o limite de cinco solicitações em 24 horas.' : 'Não foi possível registrar. Confira sua sessão e tente novamente.'); return; }
      setNotice(`Solicitação registrada. Protocolo: ${data}`); setSubject(''); setMessage(''); requestId.current = null;
      await load();
    } catch { if (mounted.current && version === accountVersion.current) setError('A conexão foi interrompida. Tente novamente para confirmar o registro.'); }
    finally { if (mounted.current && version === accountVersion.current) { locked.current = false; setBusy(false); } }
  };
  const respond = async (ticket: Ticket, status: string) => {
    if (locked.current) return;
    const version = accountVersion.current;
    locked.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const { data, error: failure } = await supabase.rpc('respond_support_ticket', { p_id: ticket.id, p_response: responses[ticket.id] ?? ticket.response ?? '', p_status: status });
      if (!mounted.current || version !== accountVersion.current) return;
      if (failure || !data) { setError('Não foi possível salvar a resposta. Confira o texto e sua autorização.'); return; }
      setNotice('Resposta salva. O aviso ao cliente foi registrado para envio.'); await load();
    } catch { if (mounted.current && version === accountVersion.current) setError('A conexão foi interrompida. Atualize antes de responder novamente.'); }
    finally { if (mounted.current && version === accountVersion.current) { locked.current = false; setBusy(false); } }
  };
  const input = 'w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:bg-neutral-900 dark:text-white';
  const button = 'min-h-11 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50';
  return <section className="mt-8 space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:bg-neutral-900" aria-labelledby="support-tickets-title">
    <h2 id="support-tickets-title" className="text-xl font-bold">{admin ? 'Atendimentos dos clientes' : 'Meus atendimentos'}</h2>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="break-words text-sm text-teal-800">{notice}</p>}
    {loading ? <p role="status">Carregando atendimentos...</p> : !signedIn ? <Link href="/login?redirect=/suporte" className="text-teal-700 underline">Entre na sua conta para registrar e acompanhar uma solicitação.</Link> : <>
      {!admin && <form className="space-y-3" onSubmit={event => { event.preventDefault(); void submit(); }}><fieldset disabled={busy} className="space-y-3">
        <p className="text-sm text-slate-600">Registre sua dúvida e acompanhe a resposta aqui. Não informe senhas nem dados do cartão.</p>
        <label className="block text-sm font-semibold">Assunto<input required minLength={4} maxLength={120} value={subject} onChange={event => { setSubject(event.target.value); requestId.current = null; }} className={input} /></label>
        <label className="block text-sm font-semibold">Mensagem<textarea required minLength={10} maxLength={4000} rows={4} value={message} onChange={event => { setMessage(event.target.value); requestId.current = null; }} className={input} /></label>
        <button disabled={busy} className={button}>{busy ? 'Registrando...' : 'Registrar solicitação'}</button>
      </fieldset></form>}
      {tickets.length === 0 && <p className="text-sm text-slate-500">Nenhum atendimento nesta página.</p>}
      {tickets.map(ticket => <article key={ticket.id} className="space-y-2 rounded-lg border border-slate-200 p-4">
        <h3 className="font-bold">{ticket.subject}</h3>
        <p className="break-words text-xs text-slate-500">Protocolo {ticket.id} · {new Date(ticket.created_at).toLocaleString('pt-BR')} · {ticket.status}</p>
        <p className="whitespace-pre-wrap break-words text-sm">{ticket.message}</p>
        {ticket.response && <div className="rounded-lg bg-teal-50 p-3 text-sm text-slate-900"><strong>Resposta da loja</strong><p className="whitespace-pre-wrap break-words">{ticket.response}</p></div>}
        {admin && <form className="space-y-2" onSubmit={event => { event.preventDefault(); void respond(ticket, 'respondido'); }}>
          <label className="block text-sm">Resposta<textarea required minLength={2} maxLength={4000} rows={3} value={responses[ticket.id] ?? ticket.response ?? ''} onChange={event => setResponses(previous => ({ ...previous, [ticket.id]: event.target.value }))} className={input} /></label>
          <div className="flex flex-wrap gap-2"><button disabled={busy} className={button}>Enviar resposta</button><button type="button" disabled={busy || (responses[ticket.id] ?? ticket.response ?? '').trim().length < 2} onClick={() => void respond(ticket, 'resolvido')} className={button}>Responder e resolver</button></div>
        </form>}
      </article>)}
      <Pagination label="Páginas de atendimentos" page={page + 1} hasNext={tickets.length === 20} busy={busy} onChange={next => setPage(next - 1)} />
    </>}
  </section>;
}
