import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { Product } from '@/lib/data';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductActions from '@/components/ProductActions';
import ProductGallery from '@/components/ProductGallery';
import ProductCard from '@/components/ProductCard';
import { getProduct, getRelatedProducts } from '@/lib/server/products';
import { formatPrice, isTestProduct, productPath, serializeStructuredData } from '@/lib/products';
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
  const ean = productOfficialCodes[product.code]?.ean;
  const url = new URL(productPath(product.code), getSiteUrl()).toString();
  const structured = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Product', name: product.name, sku: product.code, category: product.category,
      ...(ean && isValidEan13(ean) ? { gtin13: ean } : {}),
      ...(description ? { description } : {}),
      ...(product.imagePlaceholder ? { image: new URL(product.imagePlaceholder, getSiteUrl()).toString() } : {}),
      offers: { '@type': 'Offer', url, priceCurrency: 'BRL', price: product.price,
        availability: (product.estoque || 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Vitrine', item: getSiteUrl().toString() },
      { '@type': 'ListItem', position: 2, name: product.name, item: url },
    ] },
  ] };
  return <main className="min-h-screen bg-[#FAFAFC] text-slate-900">
    {!isTestProduct(product) && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeStructuredData(structured) }} />}
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12">
      <nav aria-label="Caminho de navegação" className="mb-6 text-sm text-slate-600"><ol className="flex flex-wrap gap-2"><li><Link href="/" className="underline underline-offset-4">Vitrine</Link></li><li aria-hidden="true">/</li><li className="break-words" aria-current="page">{product.name}</li></ol></nav>
      <div className="grid min-w-0 gap-8 md:grid-cols-2 lg:gap-14">
        <ProductGallery src={product.imagePlaceholder} name={product.name} />
        <section className="min-w-0" aria-labelledby="product-title">
          <p className="mb-2 text-sm font-semibold text-teal-800">{product.category}</p>
          <h1 id="product-title" className="break-words text-3xl font-bold leading-tight lg:text-4xl">{product.name}</h1>
          <p className="mt-3 break-all text-sm text-slate-500">Código: {product.code}</p>
          <p className="my-6 text-3xl font-bold">{formatPrice(product.price)}</p>
          <ProductActions product={product} />
        </section>
      </div>
      <section aria-labelledby={description ? 'details-title' : undefined} className="mt-10 border-t border-slate-200 py-8">
        {description && <><h2 id="details-title" className="mb-4 text-2xl font-bold">Descrição do produto</h2>
          <div className="max-w-3xl space-y-4 whitespace-pre-line break-words leading-relaxed text-slate-700">
            {description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div></>}
        <ProductSpecifications fields={specifications} />
        {Boolean(sections?.length) && <div className="mt-8 grid gap-x-10 gap-y-7 md:grid-cols-2">{sections!.map(section => <section key={section.title} className="min-w-0"><h3 className="mb-3 text-lg font-semibold">{section.title}</h3><ul className="list-disc space-y-2 pl-5 leading-relaxed text-slate-700">{section.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}</div>}
      </section>
      {!isTestProduct(product) && <ProductReviews code={product.code} />}
      <section aria-labelledby="questions-title" className="border-t border-slate-200 py-8">
        <h2 id="questions-title" className="mb-4 text-2xl font-bold">Dúvidas frequentes</h2>
        <details className="border-b border-slate-200 py-3"><summary className="cursor-pointer py-2 font-semibold">Como solicitar este produto?</summary><p className="max-w-3xl py-3 leading-relaxed">Adicione a quantidade à sua lista e revise a seleção. Você também pode falar com o consultor pelo WhatsApp para esclarecer dúvidas.</p></details>
      </section>
      {!isTestProduct(product) && <Suspense fallback={null}><RelatedProducts product={product} /></Suspense>}
    </div>
  </main>;
}

async function RelatedProducts({ product }: { product: Product }) {
  const related = await getRelatedProducts(product);
  if (!related.length) return null;
  return <section aria-labelledby="related-title" className="border-t border-slate-200 py-8"><h2 id="related-title" className="mb-6 text-2xl font-bold">Mais em {product.category}</h2><div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">{related.map((item) => <ProductCard key={item.id} product={item} />)}</div></section>;
}
