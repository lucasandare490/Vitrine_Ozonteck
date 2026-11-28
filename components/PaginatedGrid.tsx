'use client';

import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import Pagination from './Pagination';

export default function PaginatedGrid({ children, className, contextKey }: { children: ReactNode; className: string; contextKey?: string }) {
  const items = Children.toArray(children);
  const [requestedPage, setPage] = useState(1);
  const top = useRef<HTMLDivElement>(null);
  const pages = Math.max(1, Math.ceil(items.length / 12));
  const page = Math.min(requestedPage, pages);
  useEffect(() => {
    if (!contextKey) return;
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(sessionStorage.getItem('ozonteck-catalog-page') || 'null');
        if (saved?.context === contextKey && Number.isInteger(saved.page)) setPage(Math.max(1, Math.min(pages, saved.page)));
      } catch { /* Pagination remains functional when session storage is unavailable. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [contextKey, pages]);
  const changePage = (next: number) => {
    setPage(next);
    if (contextKey) { try { sessionStorage.setItem('ozonteck-catalog-page', JSON.stringify({ context: contextKey, page: next })); } catch { /* Optional context only. */ } }
    top.current?.scrollIntoView({ block: 'start' });
    top.current?.focus({ preventScroll: true });
  };
  return <div ref={top} tabIndex={-1} className="scroll-mt-32 outline-none">
    <div className={className}>{items.slice((page - 1) * 12, page * 12)}</div>
    {pages > 1 && <Pagination page={page} totalPages={pages} totalItems={items.length} pageSize={12} onChange={changePage} />}
  </div>;
}
