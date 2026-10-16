'use client';

import { useEffect, useId, useRef } from 'react';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', busy = false, onCancel, onConfirm }: {
  open: boolean; title: string; message: string; confirmLabel?: string; busy?: boolean;
  onCancel: () => void; onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (open && !element?.open) element?.showModal();
    if (!open && element?.open) element.close();
  }, [open]);
  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={messageId}
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}
    className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-black/40 dark:bg-[#171717] dark:text-white">
    <h2 id={titleId} className="text-lg font-bold">{title}</h2>
    <p id={messageId} className="mt-3 text-sm leading-relaxed">{message}</p>
    <div className="mt-6 flex flex-wrap justify-end gap-3">
      <button autoFocus type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-md border px-4 disabled:opacity-50">Cancelar</button>
      <button type="button" disabled={busy} onClick={onConfirm} className="min-h-11 rounded-md bg-teal-700 px-4 font-semibold text-white disabled:opacity-50">{busy ? 'Salvando...' : confirmLabel}</button>
    </div>
  </dialog>;
}
