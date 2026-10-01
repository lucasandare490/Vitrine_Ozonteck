'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';

export type AccountOrder = {
  id: string; status: string; valor_total: number; created_at: string;
  itens: { code?: string; price?: number; nome: string; qtd: number }[];
  endereco_entrega: { nome?: string; telefone?: string; rua?: string; numero?: string; bairro?: string; cidade?: string; estado?: string; cep?: string } | null;
};

export function useAccountOrders(latestOnly = false) {
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++generation.current;
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!session) {
        if (version === generation.current) { setOrders([]); setError('Entre na sua conta para acompanhar os pedidos.'); }
        return;
      }
      let query = supabase.from('pedidos')
        .select('id, status, valor_total, itens, endereco_entrega, created_at')
        .eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (latestOnly) query = query.limit(1);
      const { data, error: queryError } = await query;
      if (version !== generation.current) return;
      if (queryError) throw queryError;
      setOrders(data ?? []);
      setError('');
    } catch {
      if (version === generation.current) setError('Não foi possível atualizar seus pedidos. Tente novamente.');
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [latestOnly]);

  useEffect(() => {
    let stopped = false;
    const requestVersion = generation;
    const update = () => { if (document.visibilityState === 'visible') void refresh(); };
    const initial = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(update, 30000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
        ++generation.current;
        setOrders([]);
        queueMicrotask(() => { if (!stopped) void refresh(); });
      }
    });
    return () => {
      stopped = true;
      ++requestVersion.current;
      clearTimeout(initial); clearInterval(timer); subscription.unsubscribe();
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [refresh]);
  return { orders, loading, error, refresh };
}
