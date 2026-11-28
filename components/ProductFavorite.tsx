'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { productPath } from '@/lib/products';

export default function ProductFavorite({ code, name }: { code: string; name: string }) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(false); const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const state = useRef({ mounted: false, generation: 0, owner: null as string | null, writing: false });
  useEffect(() => {
    const current = state.current; current.mounted = true;
    const load = async () => {
      const generation = ++current.generation;
      setReady(false); setError('');
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!current.mounted || generation !== current.generation) return;
        current.owner = session?.user.id || null;
        if (!current.owner) { setFavorite(false); setReady(true); return; }
        const { data, error } = await supabase.from('favoritos').select('produto_code').eq('user_id', current.owner).eq('produto_code', code).maybeSingle();
        if (!current.mounted || generation !== current.generation) return;
        if (error) throw error;
        setFavorite(Boolean(data)); setReady(true);
      } catch { if (current.mounted && generation === current.generation) setError('Não foi possível conferir os favoritos. Recarregue a página para tentar novamente.'); }
    };
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void load(); });
    return () => { current.mounted = false; current.generation++; subscription.unsubscribe(); };
  }, [code, reload]);
  async function toggle() {
    const current = state.current;
    if (!ready || current.writing) return;
    if (!current.owner) { router.push(`/login?redirect=${encodeURIComponent(productPath(code))}`); return; }
    const owner = current.owner, generation = current.generation;
    current.writing = true; setBusy(true); setError('');
    try {
      const result = favorite
        ? await supabase.from('favoritos').delete().eq('user_id', owner).eq('produto_code', code)
        : await supabase.from('favoritos').insert({ user_id: owner, produto_code: code });
      if (!current.mounted || generation !== current.generation) return;
      if (result.error && result.error.code !== '23505') throw result.error;
      const confirmed = await supabase.from('favoritos').select('produto_code').eq('user_id', owner).eq('produto_code', code).maybeSingle();
      if (!current.mounted || generation !== current.generation) return;
      if (confirmed.error) throw confirmed.error;
      setFavorite(Boolean(confirmed.data)); window.dispatchEvent(new Event('atualizarFavoritos'));
    } catch { if (current.mounted && generation === current.generation) { setReady(false); setError('Não foi possível confirmar. Confira sua conexão e confira novamente antes de tentar salvar.'); } }
    finally { current.writing = false; if (current.mounted) setBusy(false); }
  }
  return <div className="min-w-0"><button type="button" disabled={!ready || busy} aria-pressed={favorite} aria-label={`${favorite ? 'Remover' : 'Salvar'} ${name} ${favorite ? 'dos' : 'nos'} favoritos`} onClick={() => void toggle()} className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-teal-900 disabled:opacity-50">{busy ? <Loader2 className="animate-spin" size={18} /> : <Heart size={18} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />}{favorite ? 'Salvo' : 'Salvar'}</button>{error && <div className="mt-2 max-w-sm"><p role="alert" className="text-xs text-red-700">{error}</p><button type="button" disabled={busy} onClick={() => setReload(value => value + 1)} className="action-link mt-2 text-xs">Conferir favoritos novamente</button></div>}</div>;
}
