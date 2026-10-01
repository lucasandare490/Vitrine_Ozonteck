import { ExternalLink } from 'lucide-react';
import { GOOGLE_STORE_REVIEW_URL } from '@/lib/site';

export default function GoogleStoreReviewsLink() {
  return <section aria-labelledby="google-store-reviews" className="relative z-10 w-full border-y border-slate-200 bg-white py-8">
    <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-5 px-5 sm:px-10 md:flex-row md:items-center lg:px-16">
      <div><h2 id="google-store-reviews" className="text-xl font-bold text-slate-900">Nossa loja no Google</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">Confira as avaliações de quem conhece a OZONTECK Recife e compartilhe sua experiência com a loja.</p></div>
      <a href={GOOGLE_STORE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-md border border-teal-700 px-4 py-3 text-sm font-semibold text-teal-800">Ver avaliações e avaliar no Google<ExternalLink size={16} aria-hidden="true" /><span className="sr-only"> (abre em nova aba)</span></a>
    </div>
  </section>;
}
