'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { keepDialogFocus } from '@/lib/dialog-focus';

export default function AppDialog({ title, onClose, busy = false, children }: { title: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const focus = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = overflow; if (focus?.isConnected) focus.focus(); };
  }, []);
  return <dialog ref={dialog} className="app-dialog" aria-label={title} aria-busy={busy} onKeyDown={event => keepDialogFocus(event, event.currentTarget)} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => { if (!busy && event.target === event.currentTarget) onClose(); }}>{children}</dialog>;
}
