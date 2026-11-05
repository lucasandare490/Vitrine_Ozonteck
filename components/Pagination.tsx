'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { pageWindow } from '@/lib/pagination';

type Props = {
  page: number;
  totalPages?: number;
  totalItems?: number;
  pageSize?: number;
  hasNext?: boolean;
  busy?: boolean;
  label?: string;
  onChange: (page: number) => void;
};

export default function Pagination({ page: requested, totalPages, totalItems, pageSize, hasNext = false, busy = false, label = 'Paginação', onChange }: Props) {
  const pages = totalPages === undefined ? undefined : Math.max(1, Math.floor(totalPages));
  const page = Math.max(1, Math.min(pages ?? Infinity, requested));
  const numbers = pages === undefined ? [] : pageWindow(page, pages);
  const nextDisabled = busy || (pages === undefined ? !hasNext : page >= pages);
  const button = 'inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none';
  const neutral = `${button} border border-slate-200 bg-white text-slate-600 enabled:hover:border-teal-300 enabled:hover:bg-teal-50 enabled:hover:text-teal-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:enabled:hover:bg-teal-950`;
  const change = (next: number) => {
    if (busy || next < 1 || (pages !== undefined && next > pages) || next === page) return;
    onChange(next);
  };
  return <nav aria-label={label} aria-busy={busy} className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 sm:flex-row sm:justify-between sm:p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
    <p role="status" aria-live="polite" className="text-center text-xs leading-5 text-slate-500 sm:text-left dark:text-neutral-400">
      {totalItems !== undefined && pageSize && totalItems > 0 ? <><span className="font-semibold text-slate-700 dark:text-neutral-200">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)}</span> de {totalItems} resultados</> : <>Página <span className="font-semibold text-slate-700 dark:text-neutral-200">{page}</span>{pages !== undefined ? ` de ${pages}` : ''}</>}
    </p>
    <div className="flex max-w-full items-center gap-1.5 sm:gap-2">
      <button type="button" aria-label="Página anterior" title="Página anterior" disabled={busy || page <= 1} onClick={() => change(page - 1)} className={neutral}><ChevronLeft size={18} aria-hidden="true" /><span className="hidden lg:inline">Anterior</span></button>
      <span className="flex h-11 min-w-24 items-center justify-center rounded-xl bg-teal-700 px-3 text-sm font-semibold text-white sm:hidden">{page}{pages !== undefined ? ` / ${pages}` : ''}</span>
      {numbers.length ? <div className="hidden items-center gap-1.5 sm:flex">
        {numbers.map((number, index) => <span key={number} className="inline-flex items-center gap-1.5">
          {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-slate-400">…</span>}
          <button type="button" aria-label={`Página ${number}`} aria-current={number === page ? 'page' : undefined} disabled={busy} onClick={() => change(number)} className={number === page ? `${button} bg-teal-700 text-white shadow-sm shadow-teal-900/10` : neutral}>{number}</button>
        </span>)}
      </div> : <span className="hidden min-w-24 text-center text-sm font-semibold text-slate-700 sm:inline dark:text-neutral-200">Página {page}</span>}
      <button type="button" aria-label="Próxima página" title="Próxima página" disabled={nextDisabled} onClick={() => change(page + 1)} className={neutral}><span className="hidden lg:inline">Próxima</span><ChevronRight size={18} aria-hidden="true" /></button>
    </div>
  </nav>;
}
