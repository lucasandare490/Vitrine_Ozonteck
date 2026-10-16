'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/products';

type Pricing = { prices: Record<string, number>; enabled: boolean; ready: boolean; error: boolean };
const PricingContext = createContext<Pricing>({ prices: {}, enabled: false, ready: false, error: false });

export function StorePricing({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Pricing>({ prices: {}, enabled: false, ready: false, error: false });
  useEffect(() => {
    let active = true;
    let generation = 0;
    let currentUserId: string | null | undefined;
    async function refresh(reset = false) {
      const run = ++generation;
      if (reset) setState({ prices: {}, enabled: false, ready: false, error: false });
      const { data, error } = await supabase.rpc('my_store_prices');
      if (!active || run !== generation) return;
      if (error || !data?.prices) {
        setState({ prices: {}, enabled: false, ready: false, error: true });
        return;
      }
      setState({ prices: data.prices, enabled: data.enabled === true, ready: true, error: false });
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Do not perform asynchronous auth work inside the Supabase auth callback.
      generation++;
      const nextUserId = session?.user.id ?? null;
      if (nextUserId !== currentUserId) {
        currentUserId = nextUserId;
        setState({ prices: {}, enabled: false, ready: false, error: false });
      }
      window.setTimeout(() => { if (active) void refresh(); }, 0);
    });
    void refresh();
    const focus = () => { if (document.visibilityState === 'visible') void refresh(); };
    const interval = window.setInterval(focus, 30000);
    window.addEventListener('focus', focus);
    window.addEventListener('store-pricing-changed', focus);
    return () => { active = false; generation++; subscription.unsubscribe(); window.clearInterval(interval); window.removeEventListener('focus', focus); window.removeEventListener('store-pricing-changed', focus); };
  }, []);
  return <PricingContext.Provider value={state}>{children}</PricingContext.Provider>;
}

export function useStorePricing() { return useContext(PricingContext); }
export function useProductPrice(code: string, fallback: number) {
  const state = useStorePricing();
  return { ...state, price: state.ready ? Number(state.prices[code] ?? fallback) : fallback };
}
export function StorePrice({ code, price }: { code: string; price: number }) {
  const current = useProductPrice(code, price);
  return <span>{current.ready ? formatPrice(current.price) : current.error ? 'Preço indisponível' : 'Consultando preço…'}</span>;
}
