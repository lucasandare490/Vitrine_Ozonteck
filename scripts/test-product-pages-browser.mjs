import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';

// Isolated browser context; no login, order creation or production writes.
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const output = process.argv[3];
await mkdir(output, { recursive: true });
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    const product = page.locator('a[aria-label^="Ver detalhes de"]').first();
    await product.waitFor({ timeout: 30000 });
    await product.scrollIntoViewIfNeeded();
    await product.evaluate(element => element.scrollIntoView({ block: 'start' }));
    const card = product.locator('..');
    const paragraphs = await card.locator('p').allTextContents();
    assert.ok(paragraphs.every(text => text.trim().startsWith('R$')), 'Card exposes description');
    await page.screenshot({ path: `${output}/home-${width}.png` });
    const google = page.getByRole('link', { name: /^Ver avaliações e avaliar no Google/ });
    assert.equal(await google.getAttribute('href'), 'https://g.page/r/CVsulQKezR0QEBM/review');
    await google.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('section[aria-labelledby="google-store-reviews"]').screenshot({ path: `${output}/google-${width}.png` });
    await product.click();
    await page.locator('#product-title').waitFor();
    assert.ok(await page.locator('#product-title').textContent());
    await page.waitForFunction(() => {
      const image = document.querySelector('main img');
      return image?.complete && image.naturalWidth > 0;
    });
    await page.screenshot({ path: `${output}/product-${width}.png` });
    await page.getByRole('button', { name: /^Ampliar imagem de/ }).click();
    await page.getByRole('dialog').waitFor();
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Adicionar à lista', exact: true }).click();
    await page.getByText('1 unidade(s) adicionada(s) à sua lista.', { exact: true }).waitFor();
    const whatsapp = await page.getByRole('link', { name: /^Consultar pelo WhatsApp/, includeHidden: true }).getAttribute('href');
    assert.ok(whatsapp?.startsWith('https://wa.me/'));
    assert.ok(decodeURIComponent(whatsapp).includes((await page.locator('#product-title').textContent()).trim()));
    await page.locator('#reviews-title').scrollIntoViewIfNeeded();
    await page.getByText('Este produto ainda não tem avaliações publicadas.').waitFor({ timeout: 30000 });
    await page.getByRole('combobox', { name: /^Nota/ }).selectOption('1');
    await page.getByLabel('Com imagens', { exact: true }).check();
    await page.getByText('Este produto ainda não tem avaliações publicadas.').waitFor();
    await page.screenshot({ path: `${output}/reviews-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Horizontal overflow');
    assert.deepEqual(errors, []);
    console.log(`PASS: ${width}px, Home card, product navigation/image/zoom, interest list, WhatsApp URL, empty reviews, filters, no overflow/page errors`);
    await page.close();
  }
} finally { await browser.close(); }
