import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const base = process.env.REVIEW_TEST_URL || 'http://localhost:3000';
const output = 'docs/product-revision-2-screenshots';
mkdirSync(output, { recursive: true });
const audit = JSON.parse(readFileSync('docs/product-revision-2-audit.json', 'utf8'));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = { widths: [], pages: [], browserErrors: [], screenshots: [], writesBlocked: [] };
try {
  const context = await browser.newContext();
  // Public browsing only; fail safely if any application code attempts a remote write.
  await context.route('**/*.supabase.co/**', route => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
      results.writesBlocked.push(route.request().url().replace(/\?.*/, ''));
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => results.browserErrors.push(error.message));
  page.setDefaultTimeout(60000);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    // Every matched product is checked on desktop, with representative long/short sheets on mobile.
    const codes = width === 1440 ? audit.products.map(product => product.code) : ['PERF-CIND', 'P100-CIND', 'PERF-EASY', 'PERF-LABOOM', 'PERF-OUD', 'PERF-FER-VE', 'CAP-SH-MEL', 'CAP-MAS-MEL', 'BE-HID-SB', 'BE-HAY', 'BE-TRIX', 'NUT-FLEX-CX', 'NUT-LEV-UN', 'NUT-COBAL', 'PRO-AMR'];
    for (const code of codes) {
      const expected = audit.products.find(product => product.code === code);
      const response = await page.goto(`${base}/produto/${code}`, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200, code);
      await page.locator('#specifications-title').waitFor();
      assert.equal(await page.locator('#product-title').innerText(), expected.name);
      const identity = page.locator('[data-official-identification]');
      const values = await identity.locator('dd').allTextContents();
      assert.deepEqual(values, [expected.official.codigoOriginal, expected.official.ean], code);
      const ld = JSON.parse(await page.locator('script[type="application/ld+json"]').first().textContent());
      const product = ld['@graph'].find(item => item['@type'] === 'Product');
      assert.equal(product.sku, code);
      assert.equal(product.gtin13, expected.official.ean);
      assert.equal(Number(product.offers.price), Number(expected.price));
      if (expected.image_url) assert.equal(product.image, new URL(expected.image_url, base).href);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${code}/${width}: overflow`);
      for (const field of expected.specs) assert.ok((await page.locator('section[aria-labelledby=specifications-title]').innerText()).includes(field.value), `${code}: ${field.label}`);
      if (['PERF-CIND', 'CAP-SH-MEL', 'NUT-FLEX-CX'].includes(code)) {
        await page.locator('#specifications-title').scrollIntoViewIfNeeded();
        const path = `${output}/${code}-${width}.png`;
        await page.screenshot({ path, fullPage: true });
        results.screenshots.push(path);
      }
      results.pages.push({ code, width, passed: true });
      if (width === 1440 && results.pages.length % 20 === 0) console.log(`Checked ${results.pages.length} product pages`);
    }
    await page.goto(base);
    await page.getByRole('button', { name: 'Perfumaria', exact: true }).click();
    assert.equal(await page.locator('[data-official-identification]').count(), 0);
    for (const [label, count] of [['17 ml', 38], ['100 ml', 14], ['Todos', 54]]) {
      await page.locator('fieldset label').filter({ hasText: label }).click();
      assert.equal(await page.locator('fieldset [role=status]').innerText(), `${count} produtos`);
    }
    assert.equal(await page.locator('a[href^="/produto/AC-"]').count(), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    results.widths.push({ width, homeFilter: true, accessoriesHidden: true, noOverflow: true });
    console.log(`PASS viewport ${width}`);
  }
  for (const code of ['AC-CXMEM', 'AC-CAM-P', 'AC-CAM-R', 'AC-SQUEEZE']) {
    await page.goto(`${base}/produto/${code}`);
    await page.getByRole('heading', { name: 'Produto não encontrado', exact: true }).waitFor();
    assert.equal(await page.locator('[data-official-identification]').count(), 0);
  }
  assert.deepEqual(results.browserErrors, []);
  assert.ok(results.writesBlocked.every(url => url.endsWith('/rpc/listar_avaliacoes_loja')));
  results.limitations = ['A leitura POST de avaliações da loja foi bloqueada preventivamente; este teste não valida seu conteúdo. Nenhuma chamada bloqueada foi executada.'];
  results.passed = true;
} finally {
  writeFileSync('docs/product-revision-2-tests.json', JSON.stringify(results, null, 2));
  await browser.close();
}
