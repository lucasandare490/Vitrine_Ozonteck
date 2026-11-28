'use client';
import { useState } from 'react';
import { SlidersHorizontal, Check } from 'lucide-react';
import BottomSheet from './BottomSheet';

export default function MobileCatalogFilters({ categories, category, sort, count, onChange }: { categories: string[]; category: string; sort: string; count: number; onChange: (category: string, sort: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draftCategory, setDraftCategory] = useState(category); const [draftSort, setDraftSort] = useState(sort);
  return <div className="mobile-catalog-controls">
    <div><h2>Explore o catálogo</h2><p role="status">{count} produtos{category !== 'Todas' ? ` · ${category}` : ''}</p></div>
    <button type="button" className="mobile-filter-trigger" onClick={() => { setDraftCategory(category); setDraftSort(sort); setOpen(true); }}><SlidersHorizontal size={18} aria-hidden="true" />Filtrar</button>
    <BottomSheet open={open} onClose={() => setOpen(false)} title="Encontre o seu produto">
      <fieldset><legend className="mb-3 font-bold">Categoria</legend><div className="grid grid-cols-2 gap-2">{categories.map(item => <label key={item} className="relative flex min-h-14 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm"><input type="radio" name="mobile-category" checked={draftCategory === item} onChange={() => setDraftCategory(item)} className="accent-teal-700" /><span>{item}</span></label>)}</div></fieldset>
      <label className="mb-2 mt-6 block font-bold" htmlFor="mobile-catalog-sort">Ordenar por</label><select id="mobile-catalog-sort" value={draftSort} onChange={event => setDraftSort(event.target.value)} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900"><option value="name">Nome do produto</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option></select>
      <div className="mt-6 flex gap-3"><button className="action-link" type="button" onClick={() => { setDraftCategory('Todas'); setDraftSort('name'); }}>Limpar</button><button className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-800 px-4 font-bold text-white" type="button" onClick={() => { onChange(draftCategory, draftSort); setOpen(false); }}><Check size={18} aria-hidden="true" />Ver produtos</button></div>
    </BottomSheet>
  </div>;
}
