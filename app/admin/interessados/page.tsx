'use client';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Interest = { id: string; name: string; phone: string; email: string; interest: string; status: string; created_at: string };
export default function InterestedPeople() {
  const [rows, setRows] = useState<Interest[]>([]);
  const [page, setPage] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('new');
  const refresh = useRef<(() => Promise<void>) | null>(null);
  useEffect(() => {
    let active = true, generation = 0;
    const load = async () => {
      if (!active) return;
      const run = ++generation;
      const result = await supabase.from('join_interests').select('id,name,phone,email,interest,status,created_at').eq('status', filter).order('created_at', { ascending: false }).range(page * 30, page * 30 + 29);
      if (!active || run !== generation) return;
      if (result.error) setError('Não foi possível consultar os interessados. Confira sua autorização.');
      else { setRows(result.data || []); setError(''); }
    };
    // Mutations use the loader for the currently committed filter/page.
    refresh.current = load;
    const start = setTimeout(() => void load(), 0);
    const timer = setInterval(() => { if (!document.hidden) void load(); }, 30000);
    return () => {
      active = false; refresh.current = null;
      clearTimeout(start); clearInterval(timer);
    };
  }, [filter, page]);
  async function update(row: Interest) {
    if (busy) return; setBusy(true); setError('');
    try {
      const result = await supabase.rpc('admin_set_join_interest_status', { p_id: row.id, p_status: row.status === 'new' ? 'contacted' : 'new' });
      if (!refresh.current) return;
      if (result.error || !result.data) throw new Error(); await refresh.current();
    } catch { if (refresh.current) setError('Não foi possível salvar o contato. Tente novamente.'); }
    finally { if (refresh.current) setBusy(false); }
  }
  return <section className="space-y-5"><h1 className="text-2xl font-bold">Interessados em consumo e distribuição</h1><p className="text-sm text-slate-600">Solicitações de contato autorizadas. O envio de mensagens e o cadastro oficial continuam sob acompanhamento da loja.</p>
    <label className="block text-sm">Situação<select value={filter} onChange={event => { setFilter(event.target.value); setPage(0); }} className="ml-3 rounded-lg border bg-white p-3 text-slate-900"><option value="new">Novos</option><option value="contacted">Contato realizado</option></select></label>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!rows.length && <p>Nenhuma solicitação nesta página.</p>}
    {rows.map(row => <article key={row.id} className="space-y-2 rounded-xl border bg-white p-5 text-slate-900"><h2 className="font-bold">{row.name}</h2><p className="break-words text-sm">{row.phone} · {row.email}</p><p className="text-sm">Interesse: {({ consumo: 'Consumo', distribuicao: 'Distribuição', ambos: 'Consumo e distribuição' } as Record<string,string>)[row.interest]} · {new Date(row.created_at).toLocaleString('pt-BR')}</p><button type="button" disabled={busy} onClick={() => void update(row)} className="min-h-11 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-50">{row.status === 'new' ? 'Marcar contato realizado' : 'Reabrir para contato'}</button></article>)}
    <nav className="flex gap-4" aria-label="Páginas de interessados"><button disabled={!page || busy} onClick={() => setPage(value => value - 1)} className="min-h-11 underline disabled:opacity-50">Anterior</button><span className="py-3">Página {page + 1}</span><button disabled={rows.length < 30 || busy} onClick={() => setPage(value => value + 1)} className="min-h-11 underline disabled:opacity-50">Próxima</button></nav>
  </section>;
}
