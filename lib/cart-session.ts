'use client';

import { needsSecondFactor } from './mfa';
import { supabase } from './supabase';
import { useCartStore } from '../store/useCartStore';
import { createCartSync } from './cart-sync';
import toast from 'react-hot-toast';

const saveMessage = 'Não foi possível sincronizar sua lista. As alterações continuam salvas neste dispositivo. Tente novamente antes de sair.';
let controller: ReturnType<typeof createCartSync> | undefined;
function getController() {
  controller ??= createCartSync(useCartStore, {
    async read(userId) {
      const { data, error } = await supabase.from('profiles').select('carrinho').eq('id', userId).single();
      if (error) throw error;
      return data.carrinho;
    },
    async write(userId, items) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || session?.user.id !== userId) throw new Error(saveMessage);
      const { data, error } = await supabase.from('profiles').update({ carrinho: items }).eq('id', userId).select('id').single();
      if (error || !data) throw error || new Error(saveMessage);
    },
  }, () => toast.error(saveMessage, { id: 'cart-sync' }));
  return controller;
}

export async function syncCartForUser(userId: string) {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || session?.user.id !== userId) throw new Error('Sua sessão mudou. Entre novamente para carregar sua lista.');
  if (await needsSecondFactor()) return;
  await getController().activate(userId);
}

export async function signOutWithCart(scope: 'global' | 'local' = 'global') {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    try { await syncCartForUser(session.user.id); await getController().flush(); }
    catch { throw new Error(saveMessage); }
  }
  const { error } = await supabase.auth.signOut({ scope });
  if (error) throw error;
  await getController().activate(null);
}

export function startCartSync() {
  const sync = getController();
  let eventVersion = 0;
  let stopped = false;
  const apply = (userId: string | null, version: number) => {
    if (stopped || version !== eventVersion) return;
    void (async () => {
      if (userId && await needsSecondFactor()) return;
      if (!stopped && version === eventVersion) await sync.activate(userId);
    })().catch(() => toast.error(saveMessage, { id: 'cart-sync' }));
  };
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    const version = ++eventVersion;
    // Run outside the auth callback's lock; database requests use the session.
    queueMicrotask(() => apply(session?.user.id ?? null, version));
  });
  const initialVersion = eventVersion;
  void supabase.auth.getSession().then(({ data, error }) => {
    if (!error) apply(data.session?.user.id ?? null, initialVersion);
  });
  const retry = () => { void supabase.auth.getSession().then(({ data, error }) => {
    if (!error && !stopped) apply(data.session?.user.id ?? null, eventVersion);
  }); };
  window.addEventListener('online', retry);
  window.addEventListener('focus', retry);
  return () => { stopped = true; subscription.unsubscribe(); window.removeEventListener('online', retry); window.removeEventListener('focus', retry); };
}
