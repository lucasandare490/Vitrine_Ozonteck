'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { isRetiredProduct } from '@/lib/catalog-availability';
import { isHiddenTestProduct as isTestProduct, productPath } from '@/lib/products';
import { StorePrice } from '@/components/StorePricing';

type Item = { code: string; name: string; category: string; price: number };
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export default function SearchSuggestions({ query, onSelect }: { query: string; onSelect: () => void }) {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState('Carregando sugestões…');
  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase.from('produtos').select('code,name,category,price').eq('is_deleted', false).order('name');
      if (!active) return;
      if (error) { setStatus('Sugestões indisponíveis. Use Enter para pesquisar.'); return; }
      setItems((data || []).filter(p => !isRetiredProduct(p) && !isTestProduct(p)));
      setStatus('');
    }
    void load();
    return () => { active = false; };
  }, []);
  const matches = items.filter(p => normalize(`${p.name} ${p.category} ${p.code}`).includes(normalize(query))).slice(0, 6);
  return <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white text-slate-900 shadow-lg">
    {status ? <p role="status" className="p-3 text-sm">{status}</p> : matches.length ? <ul aria-label="Sugestões de produtos">
      {matches.map(p => <li key={p.code}><Link href={productPath(p.code)} onClick={onSelect} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-teal-50 focus:bg-teal-50"><span>{p.name}</span><span className="shrink-0 font-semibold"><StorePrice code={p.code} price={Number(p.price)} /></span></Link></li>)}
    </ul> : <p role="status" className="p-3 text-sm">Nenhum produto encontrado.</p>}
  </div>;
}
