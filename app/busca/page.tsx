'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowUpRight } from 'lucide-react';
import SearchSuggestions from '@/components/SearchSuggestions';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState(''); const [open, setOpen] = useState(true); const router = useRouter();
  return <main className="app-search-page mx-auto min-h-[65dvh] max-w-3xl px-4 py-6 text-slate-900 sm:py-12">
    <h1 className="mb-2 text-2xl font-bold text-teal-950">Encontre seu próximo cuidado</h1>
    <p className="mb-6 text-sm leading-relaxed text-slate-600">Busque pelo nome, categoria ou código do produto.</p>
    <form role="search" className="relative" onSubmit={event => { event.preventDefault(); router.push(`/?q=${encodeURIComponent(query.trim())}#catalogo`); }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
      <label className="sr-only" htmlFor="app-product-search">Buscar produtos</label>
      <div className="flex items-center gap-2 rounded-2xl border-2 border-teal-700 bg-white p-2"><Search size={22} className="ml-2 shrink-0 text-teal-700" aria-hidden="true" /><input id="app-product-search" autoFocus type="search" enterKeyHint="search" autoComplete="off" value={query} onFocus={() => setOpen(true)} onChange={event => { setQuery(event.target.value); setOpen(true); }} placeholder="Nome ou código" className="min-h-12 min-w-0 flex-1 bg-transparent px-1 text-base outline-none" /><button className="min-h-12 rounded-xl bg-teal-800 px-4 font-bold text-white" type="submit">Buscar</button></div>
      {open && query.trim() && <SearchSuggestions query={query} onSelect={() => setOpen(false)} />}
    </form>
    <section className="mt-8"><h2 className="mb-3 text-sm font-bold text-slate-600">Explore por categoria</h2><div className="grid grid-cols-2 gap-3">{['Bem Estar', 'Cuidados Capilares', 'Nutracêuticos', 'Perfumaria'].map(category => <Link key={category} href={`/?categoria=${encodeURIComponent(category)}#catalogo`} className="flex min-h-20 items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-white p-4 text-sm font-bold text-teal-900">{category}<ArrowUpRight size={18} className="shrink-0" aria-hidden="true" /></Link>)}</div></section>
  </main>;
}
