import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { registrationProducts } from '../lib/product-registration.ts';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const rows = registrationProducts.map((p,i) => ({id:`90000000-0000-0000-0000-${String(i).padStart(12,'0')}`,
  code:p.code,name:p.name,category:p.category,description:p.description,price:p.price,
  image_url:`/produtos/${p.image}`,estoque:9999,is_deleted:false}));
const browser = await chromium.launch({channel:'msedge',headless:true});
const results = [];
try {
  const context = await browser.newContext();
  await context.route('**/*.supabase.co/**',route => {
    const url = new URL(route.request().url());
    // Entire remote data service mocked; no production reads or writes from this context.
    if (url.pathname.endsWith('/produtos')) return route.fulfill({json:rows});
    if (url.pathname.includes('/rpc/listar_avaliacoes_loja')) return route.fulfill({json:{total:0,average:0,items:[]}});
    return route.fulfill({json:[]});
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror',e=>errors.push(e.message));
  for (const width of [1440,390,320]) {
    await page.setViewportSize({width,height:900});
    await page.goto('http://localhost:3000',{waitUntil:'domcontentloaded',timeout:90000});
    await page.locator('a[href="/produto/NUT-AMYNO-CX"]').first().waitFor({timeout:60000});
    for (const p of registrationProducts) assert.ok(await page.locator(`a[href="/produto/${p.code}"]`).count(),p.code);
    await page.locator('a[href="/produto/NUT-AMYNO-CX"]').first().scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await fs.mkdir('docs/product-registration-screenshots',{recursive:true});
    await page.screenshot({path:`docs/product-registration-screenshots/home-${width}.png`,fullPage:true});
    results.push({width,elevenCards:true,noHorizontalOverflow:true});
  }
  assert.deepEqual(errors,[]);
  await fs.writeFile('docs/product-registration-browser.json',JSON.stringify({mockedCatalog:true,results,errors},null,2));
  console.log('PASS: eleven new cards from mocked Supabase response, desktop/mobile widths, no overflow or browser exceptions. Product-detail routes await actual registration.');
} finally {await browser.close();}
