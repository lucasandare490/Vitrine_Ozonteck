'use client';
import Pagination from '@/components/Pagination';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
type Reminder = { id: string; title: string; note: string; due_at: string; completed_at: string | null };
export default function RemindersPage() {
  const [rows, setRows] = useState<Reminder[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [due, setDue] = useState('');
  const [done, setDone] = useState(false);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const locked = useRef(false);
  const id = useRef<string | null>(null);
  const refresh = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    let active = true, generation = 0;
    const load = async () => {
      if (!active) return;
      const run = ++generation;
      let query = supabase.from('admin_reminders').select('id,title,note,due_at,completed_at').order('due_at').range(page * 30, page * 30 + 29);
      query = done ? query.not('completed_at', 'is', null) : query.is('completed_at', null);
      const result = await query;
      if (!active || run !== generation) return;
      if (result.error) setError('Não foi possível consultar os lembretes. Confira sua sessão e autorização.');
      else { setRows(result.data || []); setError(''); }
    };
    // Mutations use the loader for the currently committed filter/page.
    refresh.current = load;
    const first = setTimeout(() => void load(), 0);
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => {
      active = false; refresh.current = null;
      clearTimeout(first); clearInterval(timer);
    };
  }, [done, page]);
  async function save() {
    if (locked.current) return;
    if (!due || !Number.isFinite(Date.parse(due))) { setError('Informe uma data válida.'); return; }
    locked.current = true; setBusy(true); setError(''); setNotice(''); id.current ||= crypto.randomUUID();
    try {
      const result = await supabase.from('admin_reminders').insert({ id: id.current, title: title.trim(), note: note.trim(), due_at: new Date(due).toISOString() }).select('id');
      if (!refresh.current) return;
      if (result.error?.code === '23505') { setNotice('Este lembrete já foi registrado. Atualize a lista.'); await refresh.current(); return; }
      if (result.error || result.data?.length !== 1) throw new Error();
      setTitle(''); setNote(''); setDue(''); id.current = null; setNotice('Lembrete registrado.'); await refresh.current();
    } catch { if (refresh.current) setError('Não foi possível confirmar o registro. Tente novamente.'); }
    finally { locked.current = false; if (refresh.current) setBusy(false); }
  }
  async function toggle(row: Reminder) {
    if (locked.current) return; locked.current = true; setBusy(true); setError('');
    try {
      let query = supabase.from('admin_reminders').update({ completed_at: row.completed_at ? null : new Date().toISOString() }).eq('id', row.id);
      query = row.completed_at ? query.eq('completed_at', row.completed_at) : query.is('completed_at', null);
      const result = await query.select('id');
      if (!refresh.current) return;
      if (result.error || result.data?.length !== 1) throw new Error(); await refresh.current();
    } catch { if (refresh.current) setError('O lembrete pode ter sido alterado. Atualize a lista antes de repetir.'); }
    finally { locked.current = false; if (refresh.current) setBusy(false); }
  }
  const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-900';
  const button = 'min-h-11 rounded-lg bg-teal-700 px-4 py-2 font-semibold text-white disabled:opacity-50';
  return <section className="space-y-5"><h1 className="text-2xl font-bold">Lembretes da loja</h1><p className="text-sm text-slate-600">Organize retornos de contato e tarefas. Os lembretes ficam neste painel; nenhuma mensagem é enviada automaticamente.</p>
    <form onSubmit={event => { event.preventDefault(); void save(); }} className="rounded-xl border bg-white p-5"><fieldset disabled={busy} className="space-y-3">
      <label className="block text-sm">Título<input required minLength={3} maxLength={160} value={title} onChange={event => { setTitle(event.target.value); id.current = null; }} className={field} /></label>
      <label className="block text-sm">Data e horário local<input required type="datetime-local" value={due} onChange={event => { setDue(event.target.value); id.current = null; }} className={field} /></label>
      <label className="block text-sm">Observações<textarea maxLength={2000} rows={3} value={note} onChange={event => { setNote(event.target.value); id.current = null; }} className={field} /></label><button className={button}>Salvar lembrete</button>
    </fieldset></form>
    {error && <p role="alert" className="text-red-700">{error}</p>}{notice && <p role="status" className="text-teal-800">{notice}</p>}
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={done} onChange={event => { setDone(event.target.checked); setPage(0); }} />Mostrar concluídos</label>
    {!rows.length && <p>Nenhum lembrete nesta página.</p>}{rows.map(row => <article key={row.id} className="space-y-2 rounded-xl border bg-white p-5 text-slate-900"><h2 className="font-bold">{row.title}</h2><time>{new Date(row.due_at).toLocaleString('pt-BR')}</time><p className="whitespace-pre-wrap break-words text-sm">{row.note}</p><button type="button" disabled={busy} onClick={() => void toggle(row)} className={button}>{row.completed_at ? 'Reabrir' : 'Marcar concluído'}</button></article>)}
    <Pagination label="Páginas de lembretes" page={page + 1} hasNext={rows.length === 30} busy={busy} onChange={next => setPage(next - 1)} />
  </section>;
}
