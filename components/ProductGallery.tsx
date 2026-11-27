'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Package, X, ZoomIn } from 'lucide-react';

export default function ProductGallery({ src, name }: { src: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const available = Boolean(src) && !failed;
  return (
    <figure className="min-w-0">
      <div className="rounded-[2rem] bg-gradient-to-br from-teal-100/70 via-white to-slate-100 p-2 sm:p-3">
      <button type="button" disabled={!available} onClick={() => dialog.current?.showModal()}
        aria-label={`Ampliar imagem de ${name}`}
        className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_48px_-24px_rgba(13,71,66,.18)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-700 disabled:cursor-default">
        {available ? <Image src={src} alt={name} fill priority sizes="(max-width: 767px) 92vw, (max-width: 1023px) 70vw, 54vw" className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.035] motion-reduce:transform-none motion-reduce:transition-none sm:p-10" onError={() => setFailed(true)} />
          : <span className="flex flex-col items-center gap-3 text-slate-500"><Package size={48} />Imagem indisponível</span>}
        {available && <span className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full border border-slate-100 bg-white/95 text-teal-800 shadow-sm transition-colors group-hover:bg-teal-50"><ZoomIn aria-hidden="true" size={20} /></span>}
      </button>
      </div>
      {available && <figcaption className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ZoomIn size={14} aria-hidden="true" />Toque na imagem para ver de perto</figcaption>}
      <dialog ref={dialog} aria-label={`Imagem ampliada: ${name}`} className="m-auto max-h-[95dvh] w-[min(95vw,1000px)] max-w-none rounded-3xl bg-white p-3 shadow-2xl backdrop:bg-teal-950/75"
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <div className="flex justify-end"><button type="button" autoFocus aria-label="Fechar imagem ampliada" onClick={() => dialog.current?.close()} className="flex h-11 w-11 items-center justify-center rounded-md text-slate-800 hover:bg-slate-100"><X /></button></div>
        {available && <div className="relative h-[75dvh]"><Image src={src} alt={name} fill sizes="95vw" className="object-contain" /></div>}
      </dialog>
    </figure>
  );
}
