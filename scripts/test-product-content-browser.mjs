import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const output = process.argv[3];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [code, expected] of [
      ['PERF-CIND', 'Notas de corpo'], ['P100-SENT', 'madeira de teca'],
      ['CAP-O-CREAM', 'baobá'], ['BE-SHII', 'salicilato de metila'],
      ['NUT-FLEX-CX', 'colágeno tipo II'], ['NUT-XBOOST', 'cápsulas'],
    ]) {
      const response = await page.goto(`http://localhost:3000/produto/${code}`, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200, code);
      await page.locator('#details-title').waitFor();
      assert.ok((await page.locator('main').innerText()).includes(expected), code);
      const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
      const product = JSON.parse(ld)['@graph'].find(item => item['@type'] === 'Product');
      assert.equal(product.sku, code);
      assert.ok(product.description.length > 70);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, code);
      if (code === 'PERF-CIND' || code === 'CAP-O-CREAM') {
        await page.locator('#details-title').scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/${code}-${width}.png`, fullPage: true });
      }
    }
    await page.goto('http://localhost:3000/');
    await page.locator('a[aria-label^="Ver detalhes de"]').first().waitFor();
    assert.equal(await page.locator('a[href^="/produto/AC-"]').count(), 0);
    const retired = await page.goto('http://localhost:3000/produto/AC-CXMEM');
    // A streamed Next.js notFound response may already have sent HTTP 200.
    assert.ok([200, 404].includes(retired.status()));
    await page.getByRole('heading', { name: 'Produto não encontrado', exact: true }).waitFor();
    assert.equal(await page.locator('#product-title').count(), 0);
    assert.ok(await page.locator('meta[name="robots"][content*="noindex"]').count());
    assert.deepEqual(errors, []);
    console.log(`PASS: ${width}px, six product sheets, JSON-LD, no overflow, accessories hidden/notFound/noindex`);
    await page.close();
  }
} finally { await browser.close(); }
