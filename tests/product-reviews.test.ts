import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewFilters, reviewImageUrl } from '../lib/product-reviews.ts';
import { productResearch } from '../lib/product-research.ts';

test('review filters accept only bounded supported options', () => {
  assert.deepEqual(reviewFilters(new URLSearchParams()), { stars: 0, page: 1, sort: 'recent', images: false });
  for (const query of ['stars=6', 'stars=-1', 'page=0', 'page=10000', 'page=1.5', 'sort=sql', 'images=yes']) assert.equal(reviewFilters(new URLSearchParams(query)), null);
  assert.deepEqual(reviewFilters(new URLSearchParams('stars=5&page=2&sort=best&images=true')), { stars: 5, page: 2, sort: 'best', images: true });
});
test('review photos cannot point to arbitrary hosts, scripts or traversals', () => {
  for (const path of ['https://evil.test/photo.jpg', '../photo.jpg', 'javascript:alert(1)', 'id/file.svg', '']) assert.equal(reviewImageUrl(path, 'https://example.supabase.co'), null);
  assert.equal(reviewImageUrl('00000000-0000-0000-0000-000000000000/photo.webp', 'https://example.supabase.co'), 'https://example.supabase.co/storage/v1/object/public/avaliacoes-produtos/00000000-0000-0000-0000-000000000000/photo.webp');
});
test('editorial catalog covers 123 separate products without commercial overrides', () => {
  assert.equal(Object.keys(productResearch).length, 123);
  for (const [code, item] of Object.entries(productResearch)) {
    assert.ok(!code.includes('TEST'));
    assert.equal('price' in item, false);
    assert.equal('image_url' in item, false);
    if (item.level === 'official') assert.ok(item.summary && (item.suppliedOfficialCatalog || item.sources.some((source) => source.url.startsWith('https://') && new URL(source.url).hostname === 'grupoozonteck.com')));
    for (const source of item.sources) {
      if (source.url.startsWith('/produtos/')) assert.match(source.url, /^\/produtos\/[a-zA-Z0-9]+\.webp$/);
      else assert.equal(new URL(source.url).protocol, 'https:');
    }
  }
});
