import type { Metadata } from 'next';
import BackButton from '@/components/BackButton';
import { Suspense } from 'react';
import type { Product } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, ChevronRight, FileText, MapPin, MessageCircle, Package, ShieldCheck, Star, Truck } from 'lucide-react';
import ProductActions from '@/components/ProductActions';
import ProductGallery from '@/components/ProductGallery';
import ProductFavorite from '@/components/ProductFavorite';
import ProductCard from '@/components/ProductCard';
import { getProduct, getRelatedProducts } from '@/lib/server/products';
import { isTestProduct, productPath, serializeStructuredData } from '@/lib/products';
import { getSiteUrl } from '@/lib/site';
import { getPublicProductContent, getPublicProductDescription, getPublicProductSpecifications } from '@/lib/product-public-content';
import ProductReviews from '@/components/ProductReviews';
import ProductSpecifications from '@/components/ProductSpecifications';
import { getProductReadingSections } from '@/lib/product-specs';
import { isValidEan13, productOfficialCodes } from '@/lib/product-official-codes';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).code);
  if (!product) return { title: 'Produto não encontrado', robots: { index: false } };
  const url = new URL(productPath(product.code), getSiteUrl()).toString();
  const description = (getPublicProductDescription(product.code, product.description) || `${product.name} | Ozonteck Recife`).slice(0, 160);
  return { title: product.name, description, alternates: { canonical: url },
    robots: isTestProduct(product) ? { index: false, follow: false } : undefined,
    openGraph: { title: product.name, description, url, images: product.imagePlaceholder ? [new URL(product.imagePlaceholder, getSiteUrl()).toString()] : [] } };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).code);
  if (!product) notFound();
  const research = getPublicProductContent(product.code);
  const description = getPublicProductDescription(product.code, product.description);
  const specifications = getPublicProductSpecifications(product);
  const sections = getProductReadingSections(research, specifications);
  const highlights = specifications.filter(field => ['Apresentação', 'Linha', 'Tipo de uso'].includes(field.label)).slice(0, 3);
  const introduction = description?.split(/\n\s*\n/)[0];
  const teaser = introduction && introduction.length > 280 ? `${introduction.slice(0, 280).replace(/\s+\S*$/, '')}…` : introduction;
  const ean = productOfficialCodes[product.code]?.ean;
  const url = new URL(productPath(product.code), getSiteUrl()).toString();
  const structured = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Product', name: product.name, sku: product.code, category: product.category,
      ...(ean && isValidEan13(ean) ? { gtin13: ean } : {}),
      ...(description ? { description } : {}),
      ...(product.imagePlaceholder ? { image: new URL(product.imagePlaceholder, getSiteUrl()).toString() } : {}),
      offers: { '@type': 'Offer', url, priceCurrency: 'BRL', price: product.price,
        ...((product.estoque || 0) === 9999 ? {} : { availability: (product.estoque || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' }) } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Vitrine', item: getSiteUrl().toString() },
      { '@type': 'ListItem', position: 2, name: product.name, item: url },
    ] },
  ] };
  return <main className="product-page min-h-screen bg-[#f5f8f8] pb-10 text-slate-900">
    {!isTestProduct(product) && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structured) }} />}
    <div className="mx-auto w-full max-w-[1360px] px-4 py-5 sm:px-6 lg:px-10 lg:py-7">
      <nav aria-label="Caminho de navegação" className="mb-6 text-xs text-slate-500"><ol className="flex flex-wrap items-center gap-x-2 gap-y-1"><li><BackButton className="inline-flex min-h-11 items-center gap-1.5 rounded-md hover:text-teal-800 focus-visible:outline-teal-700"><ArrowLeft size={13} aria-hidden="true" />Voltar</BackButton></li><li aria-hidden="true"><ChevronRight size={12} /></li><li className="break-words" aria-current="page">{product.name}</li></ol></nav>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div className="min-w-0 w-full sm:flex-1">
          <span className="inline-flex rounded-full border border-teal-800/10 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800">{product.category}</span>
          <h1 id="product-title" className="mt-3 break-words text-[1.8rem] font-extrabold leading-tight tracking-tight text-teal-950 sm:text-4xl">{product.name}</h1>
          <p className="mt-2 break-all text-xs text-slate-500">OZONTECK · Código: {product.code}</p>
        </div>
        {!isTestProduct(product) && <a href="#reviews-title" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:border-teal-300 hover:text-teal-800"><Star size={15} aria-hidden="true" />Ver avaliações<ArrowUpRight size={14} aria-hidden="true" /></a>}
        {!isTestProduct(product) && <ProductFavorite code={product.code} name={product.name} />}
      </header>
      <div className="grid min-w-0 items-start gap-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.85fr)] lg:gap-10">
        <div className="min-w-0">
          <ProductGallery src={product.imagePlaceholder} name={product.name} />
        </div>
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-28" aria-label="Comprar este produto">
          <section className="overflow-hidden rounded-[2rem] border border-teal-900/10 bg-white shadow-[0_16px_55px_-30px_rgba(15,76,71,.3)]" aria-labelledby="purchase-title">
            <div className="flex items-center gap-2 bg-teal-950 px-6 py-3 text-white"><ShoppingLabel /><h2 id="purchase-title" className="text-[11px] font-semibold uppercase tracking-[.16em]">Sua escolha, com cuidado</h2></div>
            <div className="p-5 sm:p-7">
              <ProductActions product={product} />
              {teaser && <p className="mt-5 border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-600">{teaser}<a href="#details-title" className="ml-1 inline-flex min-h-6 items-center font-semibold text-teal-800 inline-link">Ler mais</a></p>}
            </div>
          </section>
          <div className="rounded-2xl border border-teal-900/10 bg-[#eaf3f0] p-5">
            <div className="flex items-start gap-3"><MapPin size={19} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" /><div><p className="text-sm font-semibold text-teal-950">Retirada na Boa Vista, Recife</p><p className="mt-1 text-xs leading-relaxed text-slate-600">R. da União, 295. Combine a retirada com a loja.</p></div></div>
            <div className="mt-4 flex items-start gap-3 border-t border-teal-900/10 pt-4"><Truck size={19} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" /><div><p className="text-sm font-semibold text-teal-950">Prefere receber?</p><p className="mt-1 text-xs leading-relaxed text-slate-600">Consulte as condições de entrega para seu endereço.</p><Link href="/suporte" className="mt-1 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-teal-800">Tirar dúvidas<ArrowUpRight size={13} aria-hidden="true" /></Link></div></div>
          </div>
        </aside>
      </div>
      {highlights.length > 0 && <dl className="mt-6 grid gap-3 sm:grid-cols-3">{highlights.map(field => <div key={field.label} className="min-w-0 rounded-2xl border border-white bg-white/70 p-4"><dt className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Package size={13} className="shrink-0 text-teal-600" aria-hidden="true" />{field.label}</dt><dd className="break-words text-sm font-semibold leading-relaxed text-teal-950">{field.value}</dd></div>)}</dl>}
      <nav aria-label="Informações deste produto" className="my-8 flex max-w-full gap-2 overflow-x-auto rounded-2xl border border-slate-200/70 bg-white p-2 sm:my-10">
        {description && <a href="#details-title" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-teal-800 px-4 text-xs font-semibold text-white"><FileText size={15} aria-hidden="true" />Sobre o produto</a>}
        {specifications.length > 0 && <a href="#specifications-title" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-900"><Package size={15} aria-hidden="true" />Ficha técnica</a>}
        {!isTestProduct(product) && <a href="#reviews-title" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-900"><Star size={15} aria-hidden="true" />Avaliações</a>}
        <a href="#questions-title" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-slate-600 hover:bg-teal-50 hover:text-teal-900"><MessageCircle size={15} aria-hidden="true" />Dúvidas</a>
      </nav>
      <div className="space-y-6">
      {description && <section aria-labelledby="details-title" className="scroll-mt-32 rounded-[2rem] border border-slate-200/70 bg-white p-5 sm:p-8">
        <h2 id="details-title" className="scroll-mt-36 mb-4 text-2xl font-bold">Descrição do produto</h2>
          <div className="max-w-3xl space-y-4 whitespace-pre-line break-words leading-relaxed text-slate-700">
            {description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
      </section>}
      <ProductSpecifications fields={specifications} />
      {Boolean(sections?.length) && <section aria-labelledby="product-care-title" className="rounded-[2rem] border border-slate-200/70 bg-white p-5 sm:p-8"><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-teal-700">Conheça sua escolha</p><h2 id="product-care-title" className="mb-6 text-2xl font-bold tracking-tight">Características e cuidados</h2><div className="grid gap-4 md:grid-cols-2">{sections!.map(section => <section key={section.title} className="min-w-0 rounded-2xl bg-slate-50 p-5"><h3 className="mb-3 text-base font-semibold text-teal-900">{section.title}</h3><ul className="space-y-2 text-sm leading-relaxed text-slate-600">{section.items.map(item => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" aria-hidden="true" /><span className="min-w-0 break-words">{item}</span></li>)}</ul></section>)}</div></section>}
      {!isTestProduct(product) && <ProductReviews code={product.code} />}
      <section aria-labelledby="questions-title" className="scroll-mt-32 rounded-[2rem] border border-slate-200/70 bg-white p-5 sm:p-8">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-teal-700">Pode perguntar</p><h2 id="questions-title" className="scroll-mt-36 mb-6 text-2xl font-bold tracking-tight">Dúvidas frequentes</h2>
        <div className="space-y-3">
          <details className="group rounded-2xl border border-slate-100 bg-slate-50 px-5 py-2"><summary className="min-h-11 cursor-pointer content-center py-2 text-sm font-semibold text-teal-950">Como solicitar este produto?</summary><p className="max-w-3xl pb-4 pt-2 text-sm leading-relaxed text-slate-600">Escolha a quantidade, adicione à sua lista e revise os itens. Você pode continuar para entrega e pagamento ou conversar com o consultor antes de finalizar.</p></details>
          <details className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-2"><summary className="min-h-11 cursor-pointer content-center py-2 text-sm font-semibold text-teal-950">Posso retirar na loja?</summary><p className="max-w-3xl pb-4 pt-2 text-sm leading-relaxed text-slate-600">Sim. Nossa unidade fica na R. da União, 295, Boa Vista, Recife. Selecione a retirada na compra e combine o atendimento com a loja.</p></details>
          <details className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-2"><summary className="min-h-11 cursor-pointer content-center py-2 text-sm font-semibold text-teal-950">Quais são as formas de pagamento?</summary><p className="max-w-3xl pb-4 pt-2 text-sm leading-relaxed text-slate-600">O pagamento é processado pelo Mercado Pago. Os meios disponíveis, o tipo do cartão e as condições de parcelamento são apresentados na etapa de pagamento.</p></details>
        </div>
      </section>
      </div>
      {!isTestProduct(product) && <Suspense fallback={null}><RelatedProducts product={product} /></Suspense>}
    </div>
  </main>;
}

async function RelatedProducts({ product }: { product: Product }) {
  const related = await getRelatedProducts(product);
  if (!related.length) return null;
  return <section aria-labelledby="related-title" className="pt-12"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-teal-700">Continue descobrindo</p><h2 id="related-title" className="text-2xl font-bold tracking-tight">Mais em {product.category}</h2></div><Link href="/#catalogo" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-teal-800">Explorar catálogo<ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>;
}

function ShoppingLabel() { return <ShieldCheck size={15} className="shrink-0 text-teal-300" aria-hidden="true" />; }
