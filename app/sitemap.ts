import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';
import { getCatalogIndex } from '@/lib/server/products';
import { isTestProduct, productPath } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const routes = [
    { path: '/', priority: 1, changeFrequency: 'daily' as const },
    { path: '/sobre_cliente', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/suporte', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/junte-se-a-nos', priority: 0.6, changeFrequency: 'monthly' as const },
  ];

  const products = await getCatalogIndex();
  return [...routes.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency,
    priority,
  })), ...products.filter((product) => !isTestProduct(product)).map((product) => ({
    url: new URL(productPath(product.code), siteUrl).toString(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))];
}
