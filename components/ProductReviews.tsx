'use client';

import { useEffect, useRef, useState } from 'react';
import { Star } from 'lucide-react';
import { reviewImageUrl, type ReviewPage } from '@/lib/product-reviews';
import ReviewImages from './ReviewImages';

export default function ProductReviews({ code }: { code: string }) {
  const section = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [stars, setStars] = useState('0');
  const [sort, setSort] = useState('recent');
  const [images, setImages] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReviewPage | null>(null);
  const [resolvedKey, setResolvedKey] = useState('');
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const requestKey = `${code}:${stars}:${sort}:${images}:${page}:${retry}`;
  const loading = visible && resolvedKey !== requestKey;
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '300px' });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ stars, sort, images: String(images), page: String(page) });
    fetch(`/api/produtos/${encodeURIComponent(code)}/avaliacoes?${params}`, { signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error(); return response.json() as Promise<ReviewPage>; })
      .then((result) => { if (!controller.signal.aborted) { setData(result); setError(false); } })
      .catch(() => { if (!controller.signal.aborted) { setError(true); setData(null); } })
      .finally(() => { if (!controller.signal.aborted) setResolvedKey(requestKey); });
    return () => controller.abort();
  }, [code, visible, stars, sort, images, page, retry, requestKey]);
  return <section ref={section} aria-labelledby="reviews-title" className="border-t border-slate-200 py-8">
    <h2 id="reviews-title" className="mb-6 text-2xl font-bold">Avaliações do produto</h2>
    {data && data.total > 0 && <div className="mb-6 grid gap-6 sm:grid-cols-[180px_1fr]">
      <div><p className="text-4xl font-bold">{data.average?.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}<span className="text-base font-normal"> / 5</span></p><p className="mt-2 text-sm">{data.total} avaliações</p></div>
      <div className="max-w-lg space-y-2">{[5, 4, 3, 2, 1].map((rating) => <div key={rating} className="flex items-center gap-3 text-sm"><span className="w-20 shrink-0">{rating} estrelas</span><meter aria-label={`${rating} estrelas`} min={0} max={data.total} value={data.stars[rating - 1]} className="h-4 w-full" /><span className="w-8 text-right">{data.stars[rating - 1]}</span></div>)}</div>
    </div>}
    <div className="mb-6 flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-2 text-sm font-semibold">Nota<select value={stars} onChange={(e) => { setStars(e.target.value); setPage(1); }} className="min-h-11 rounded-md border border-slate-300 bg-white px-3"><option value="0">Todas as notas</option>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} estrelas</option>)}</select></label>
      <label className="flex flex-col gap-2 text-sm font-semibold">Ordenar<select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="min-h-11 rounded-md border border-slate-300 bg-white px-3"><option value="recent">Mais recentes</option><option value="best">Melhor avaliadas</option></select></label>
      <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={images} onChange={(e) => { setImages(e.target.checked); setPage(1); }} className="h-5 w-5 accent-teal-700" />Com imagens</label>
    </div>
    <div aria-live="polite" aria-busy={loading}>
      {loading ? <p className="py-6 text-slate-600">Carregando avaliações...</p> : error ? <div className="py-6"><p>Avaliações temporariamente indisponíveis.</p><button type="button" className="mt-3 min-h-11 text-teal-800 underline" onClick={() => setRetry((n) => n + 1)}>Tentar novamente</button></div> : data && <>
        {data.items.length === 0 && <p className="py-6 text-slate-600">{data.total === 0 ? 'Este produto ainda não tem avaliações publicadas.' : 'Nenhuma avaliação corresponde aos filtros selecionados.'}</p>}
        <div className="divide-y divide-slate-200">{data.items.map((review) => <article key={review.id} className="py-6">
          <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="break-words font-semibold">{review.nome}</h3><time className="text-sm text-slate-500" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</time></div>
          <p aria-label={`${review.nota} de 5 estrelas`} className="my-3 flex gap-1 text-amber-700">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={18} aria-hidden="true" fill={n <= review.nota ? 'currentColor' : 'none'} />)}</p>
          <p className="whitespace-pre-line break-words leading-relaxed text-slate-700">{review.comentario}</p>
          <ReviewImages name={review.nome} images={review.imagens.map((path) => reviewImageUrl(path, process.env.NEXT_PUBLIC_SUPABASE_URL || '')).filter((url): url is string => Boolean(url))} />
        </article>)}</div>
        {data.filtered > 6 && <nav aria-label="Páginas de avaliações" className="mt-6 flex flex-wrap items-center gap-4"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="min-h-11 text-teal-800 disabled:opacity-40">Anterior</button><span>Página {page} de {Math.ceil(data.filtered / 6)}</span><button type="button" disabled={page * 6 >= data.filtered} onClick={() => setPage(page + 1)} className="min-h-11 text-teal-800 disabled:opacity-40">Próxima</button></nav>}
      </>}
    </div>
  </section>;
}
