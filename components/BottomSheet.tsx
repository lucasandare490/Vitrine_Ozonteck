'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null); const heading = useId();
  useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    node.showModal(); document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = overflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [open]);
  return <dialog ref={dialog} aria-labelledby={heading} className="app-bottom-sheet" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="sheet-handle" aria-hidden="true" />
    <header><h2 id={heading}>{title}</h2><button type="button" onClick={onClose} aria-label={`Fechar ${title}`}><X size={22} /></button></header>
    <div className="sheet-content">{children}</div>
  </dialog>;
}
