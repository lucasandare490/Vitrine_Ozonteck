'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Package, X, ZoomIn } from 'lucide-react';

export default function ProductGallery({ src, name }: { src: string; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);
  const available = Boolean(src) && !failed;
  return (
    <div className="mx-auto w-full min-w-0 max-w-[280px] sm:max-w-[480px]">
      <button type="button" disabled={!available} onClick={() => dialog.current?.showModal()}
        aria-label={`Ampliar imagem de ${name}`}
        className="relative flex w-full aspect-square items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white focus-visible:outline-2 focus-visible:outline-teal-700">
        {available ? <Image src={src} alt={name} fill priority sizes="(max-width: 639px) 280px, (max-width: 1199px) 42vw, 480px" className="object-contain p-5" onError={() => setFailed(true)} />
          : <span className="flex flex-col items-center gap-3 text-slate-500"><Package size={48} />Imagem indisponível</span>}
        {available && <span className="absolute bottom-3 right-3 rounded-md bg-white p-3 text-teal-800 shadow"><ZoomIn aria-hidden="true" size={22} /></span>}
      </button>
      <dialog ref={dialog} aria-label={`Imagem ampliada: ${name}`} className="m-auto max-h-[95dvh] w-[min(95vw,1000px)] max-w-none rounded-lg bg-white p-3 backdrop:bg-black/70"
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <div className="flex justify-end"><button type="button" autoFocus aria-label="Fechar imagem ampliada" onClick={() => dialog.current?.close()} className="flex h-11 w-11 items-center justify-center rounded-md text-slate-800 hover:bg-slate-100"><X /></button></div>
        {available && <div className="relative h-[75dvh]"><Image src={src} alt={name} fill sizes="95vw" className="object-contain" /></div>}
      </dialog>
    </div>
  );
}
