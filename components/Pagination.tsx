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
  const button = 'inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-sm font-semibold tabular-nums transition-[color,background-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 enabled:active:scale-95 motion-reduce:transition-none motion-reduce:transform-none dark:focus-visible:ring-offset-neutral-900';
  const neutral = `${button} text-slate-600 enabled:hover:bg-teal-50 enabled:hover:text-teal-900 dark:text-neutral-300 dark:enabled:hover:bg-teal-950 dark:enabled:hover:text-teal-100`;
  const selected = `${button} bg-teal-800 text-white shadow-[0_3px_10px_rgba(15,118,110,0.22)] ring-1 ring-teal-900/10 dark:bg-teal-400 dark:text-teal-950 dark:shadow-none`;
  const change = (next: number) => {
    if (busy || next < 1 || (pages !== undefined && next > pages) || next === page) return;
    onChange(next);
  };
  return <nav aria-label={label} aria-busy={busy} className="mt-8 flex w-full flex-col items-center justify-center gap-3 py-2">
    <div className="flex max-w-full items-center justify-center gap-1 rounded-full border border-teal-900/10 bg-white p-1.5 shadow-[0_4px_24px_rgba(15,76,71,0.07)] dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-none">
      <button type="button" aria-label="Página anterior" title="Página anterior" disabled={busy || page <= 1} onClick={() => change(page - 1)} className={neutral}><ChevronLeft size={18} aria-hidden="true" /><span className="hidden lg:inline">Anterior</span></button>
      <span aria-hidden="true" className={`${selected} min-w-20 gap-1.5 sm:hidden`}>{page}{pages !== undefined && <><span className="font-normal opacity-50">/</span><span className="font-medium opacity-80">{pages}</span></>}</span>
      {numbers.length ? <div className="hidden items-center gap-1 sm:flex">
        {numbers.map((number, index) => <span key={number} className="inline-flex items-center gap-1">
          {index > 0 && number - numbers[index - 1] > 1 && <span aria-hidden="true" className="flex w-4 justify-center text-slate-400">…</span>}
          <button type="button" aria-label={`Página ${number}`} aria-current={number === page ? 'page' : undefined} disabled={busy} onClick={() => change(number)} className={number === page ? selected : neutral}>{number}</button>
        </span>)}
      </div> : <span className="hidden min-w-24 text-center text-sm font-semibold text-slate-700 sm:inline dark:text-neutral-200">Página {page}</span>}
      <button type="button" aria-label="Próxima página" title="Próxima página" disabled={nextDisabled} onClick={() => change(page + 1)} className={neutral}><span className="hidden lg:inline">Próxima</span><ChevronRight size={18} aria-hidden="true" /></button>
    </div>
    <p role="status" aria-live="polite" className="text-center text-xs leading-5 text-slate-500 dark:text-neutral-400">
      Página <span className="font-semibold text-slate-700 dark:text-neutral-200">{page}</span>{pages !== undefined ? ` de ${pages}` : ''}
      {totalItems !== undefined && pageSize && totalItems > 0 && <><span aria-hidden="true" className="px-2 text-slate-300 dark:text-neutral-600">·</span><span className="sr-only">, </span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} de {totalItems} resultados</>}
    </p>
  </nav>;
}
