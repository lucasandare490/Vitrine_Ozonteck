'use client';

import { Children, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PaginatedGrid({ children, className }: { children: ReactNode; className: string }) {
  const items = Children.toArray(children);
  const [requestedPage, setPage] = useState(1);
  const top = useRef<HTMLDivElement>(null);
  const pages = Math.max(1, Math.ceil(items.length / 12));
  const page = Math.min(requestedPage, pages);
  const numbers = Array.from({ length: pages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const mobileStart = Math.max(1, Math.min(page - 1, pages - 2));
  const mobileNumbers = Array.from({ length: Math.min(3, pages) }, (_, i) => mobileStart + i);
  const changePage = (next: number) => {
    setPage(next);
    top.current?.scrollIntoView({ block: 'start' });
    top.current?.focus({ preventScroll: true });
  };
  const button = 'h-11 min-w-11 rounded-md border border-slate-300 px-2 text-sm focus-visible:outline-2 focus-visible:outline-teal-600 disabled:opacity-40';
  return <div ref={top} tabIndex={-1} className="scroll-mt-32 outline-none">
    <div className={className}>{items.slice((page - 1) * 12, page * 12)}</div>
    {pages > 1 && <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-center gap-1">
      <button type="button" className={button} aria-label="Página anterior" disabled={page === 1} onClick={() => changePage(page - 1)}><ChevronLeft size={18} /></button>
      {mobileNumbers.map(n => <button key={`mobile-${n}`} type="button" aria-label={`Página ${n}`} aria-current={n === page ? 'page' : undefined} className={`${button} sm:hidden ${n === page ? 'bg-teal-700 text-white' : 'bg-white text-slate-800'}`} onClick={() => changePage(n)}>{n}</button>)}
      {numbers.map((n, i) => <span key={n} className="hidden sm:inline-flex items-center gap-1">
        {i > 0 && n - numbers[i - 1] > 1 && <span aria-hidden="true">…</span>}
        <button type="button" aria-label={`Página ${n}`} aria-current={n === page ? 'page' : undefined} className={`${button} ${n === page ? 'bg-teal-700 text-white' : 'bg-white text-slate-800'}`} onClick={() => changePage(n)}>{n}</button>
      </span>)}
      <button type="button" className={button} aria-label="Próxima página" disabled={page === pages} onClick={() => changePage(page + 1)}><ChevronRight size={18} /></button>
      <p role="status" className="w-full text-center text-xs mt-2">Página {page} de {pages} · {items.length} resultados</p>
    </nav>}
  </div>;
}
