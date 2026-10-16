import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Product } from '@/lib/data';
import { getProductResearch } from '@/lib/product-research';
import { isHiddenTestProduct as isTestProduct } from '@/lib/products';
import { isRetiredProduct } from '@/lib/catalog-availability';

export function catalogClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Catálogo não configurado.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

type CatalogRow = {
  id: string; code: string; name: string; category: string;
  description: string | null; price: number; image_url: string | null; estoque: number | null;
};
const columns = 'id, code, name, category, description, price, image_url, estoque';
function mapProduct(row: CatalogRow): Product {
  const price = Number(row.price);
  if (!Number.isFinite(price) || price < 0) throw new Error('Preço indisponível.');
  return { id: row.id, code: row.code, name: row.name, category: row.category,
    description: row.description || '', price, imagePlaceholder: row.image_url || '',
    estoque: Math.max(0, row.estoque || 0) };
}

export const getProduct = cache(async (code: string): Promise<Product | null> => {
  if (!code || code.length > 200) return null;
  const { data, error } = await catalogClient().from('produtos').select(columns)
    .eq('code', code).eq('is_deleted', false).maybeSingle();
  if (error) throw new Error('Não foi possível consultar o catálogo.');
  return data && !isRetiredProduct(data) && !isTestProduct(data) ? mapProduct(data) : null;
});

export async function getRelatedProducts(product: Product) {
  const { data, error } = await catalogClient().from('produtos').select(columns)
    .eq('is_deleted', false).eq('category', product.category).neq('id', product.id)
    .order('code').limit(100);
  if (error) return [];
  const line = getProductResearch(product.code)?.line;
  return (data || []).map(mapProduct).filter((item) => !isTestProduct(item) && !isRetiredProduct(item))
    .sort((a, b) => Number(Boolean(line && getProductResearch(b.code)?.line === line)) - Number(Boolean(line && getProductResearch(a.code)?.line === line)))
    .slice(0, 4);
}

export async function getCatalogIndex() {
  const client = catalogClient();
  const products: { code: string; name: string; category: string }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('produtos').select('code, name, category')
      .eq('is_deleted', false).order('code').range(offset, offset + 499);
    if (error) throw new Error('Não foi possível consultar o catálogo.');
    products.push(...(data || []).filter((item) => !isRetiredProduct(item) && !isTestProduct(item)));
    if (!data || data.length < 500) return products;
  }
}
