import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { discontinuedProductCodes } from '../lib/catalog-availability.ts';

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const codes = [...discontinuedProductCodes];
const columns = 'id,code,name,is_deleted,price,estoque,image_url,description';
const before = await client.from('produtos').select(columns).in('code', [...codes, 'CAP-CO-MEL']);
if (before.error) throw new Error(before.error.message);
if (codes.some(code => !before.data.some(p => p.code === code))) throw new Error('Missing expected SKU; no write performed');
const retained = before.data.find(p => p.code === 'CAP-CO-MEL');
if (!retained || retained.is_deleted) throw new Error('Retained conditioner must be active; no write performed');
const dependencies = [];
for (const product of before.data.filter(p => codes.includes(p.code))) {
  const reviews = await client.from('avaliacoes_produtos').select('id', { count: 'exact' }).eq('produto_id', product.id).limit(1);
  const favorites = await client.from('favoritos').select('id', { count: 'exact' }).eq('produto_code', product.code).limit(1);
  const orders = await client.from('pedidos').select('id', { count: 'exact' }).contains('itens', JSON.stringify([{ code: product.code }])).limit(1);
  for (const result of [reviews, favorites, orders]) if (result.error) throw new Error(result.error.message);
  dependencies.push({ code: product.code, reviews: reviews.count, favorites: favorites.count, ordersBySku: orders.count });
}
const audit = { checkedAt: new Date().toISOString(), before: before.data, dependencies, strategy: 'Update is_deleted only. No DELETE; order/review/favorite/history rows untouched.' };
writeFileSync('docs/discontinued-products-database.json', JSON.stringify(audit, null, 2));
if (!process.argv.includes('--apply')) { console.log(JSON.stringify({ mode: 'read-only', dependencies })); process.exit(0); }
const update = await client.from('produtos').update({ is_deleted: true }).in('code', codes).select('code,is_deleted');
if (update.error) throw new Error(update.error.message);
const after = await client.from('produtos').select(columns).in('code', [...codes, 'CAP-CO-MEL']);
if (after.error) throw new Error(after.error.message);
for (const previous of before.data) {
  const current = after.data.find(p => p.id === previous.id);
  const expected = codes.includes(previous.code) ? { ...previous, is_deleted: true } : previous;
  if (JSON.stringify(current) !== JSON.stringify(expected)) throw new Error(`Unexpected post-update state: ${previous.code}`);
}
writeFileSync('docs/discontinued-products-database.json', JSON.stringify({ ...audit, after: after.data, applied: true }, null, 2));
console.log(JSON.stringify({ retired: codes.length, newlyRetired: before.data.filter(p => codes.includes(p.code) && !p.is_deleted).length, retained: retained.code, verified: true }));
