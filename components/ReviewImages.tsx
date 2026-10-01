'use client';

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function ReviewImages({ images, name }: { images: string[]; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const move = (step: number) => setIndex((current) => (current + step + images.length) % images.length);
  if (!images.length) return null;
  return <>
    <div className="mt-4 flex flex-wrap gap-3">{images.map((src, i) => <button key={src} type="button" aria-label={`Ampliar foto ${i + 1} da avaliação de ${name}`} className="h-20 w-20 overflow-hidden rounded-md border border-slate-200" onClick={() => { setIndex(i); dialog.current?.showModal(); }}>
      {/* Published review photos use a restricted storage bucket. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`Foto ${i + 1} enviada por ${name}`} loading="lazy" width={80} height={80} className="h-full w-full object-cover" />
    </button>)}</div>
    <dialog ref={dialog} aria-label={`Fotos da avaliação de ${name}`} className="m-auto max-h-[95dvh] w-[min(95vw,1000px)] max-w-none rounded-lg p-4 backdrop:bg-black/70" onClick={(e) => { if (e.target === e.currentTarget) dialog.current?.close(); }} onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); move(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); } }}>
      <div className="flex items-center justify-between"><p aria-live="polite">Foto {index + 1} de {images.length}</p><button type="button" autoFocus title="Fechar" aria-label="Fechar fotos" className="flex h-11 w-11 items-center justify-center" onClick={() => dialog.current?.close()}><X /></button></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt={`Foto ${index + 1} enviada por ${name}`} className="h-[65dvh] w-full object-contain" />
      {images.length > 1 && <div className="flex justify-between"><button type="button" aria-label="Foto anterior" title="Foto anterior" className="flex h-11 w-11 items-center justify-center" onClick={() => move(-1)}><ChevronLeft /></button><button type="button" aria-label="Próxima foto" title="Próxima foto" className="flex h-11 w-11 items-center justify-center" onClick={() => move(1)}><ChevronRight /></button></div>}
    </dialog>
  </>;
}
