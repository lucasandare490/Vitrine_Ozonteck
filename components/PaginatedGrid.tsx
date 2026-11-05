'use client';

import { Children, useRef, useState, type ReactNode } from 'react';
import Pagination from './Pagination';

export default function PaginatedGrid({ children, className }: { children: ReactNode; className: string }) {
  const items = Children.toArray(children);
  const [requestedPage, setPage] = useState(1);
  const top = useRef<HTMLDivElement>(null);
  const pages = Math.max(1, Math.ceil(items.length / 12));
  const page = Math.min(requestedPage, pages);
  const changePage = (next: number) => {
    setPage(next);
    top.current?.scrollIntoView({ block: 'start' });
    top.current?.focus({ preventScroll: true });
  };
  return <div ref={top} tabIndex={-1} className="scroll-mt-32 outline-none">
    <div className={className}>{items.slice((page - 1) * 12, page * 12)}</div>
    {pages > 1 && <Pagination page={page} totalPages={pages} totalItems={items.length} pageSize={12} onChange={changePage} />}
  </div>;
}
