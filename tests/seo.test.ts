import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';
import { getSiteUrl } from '../lib/site.ts';

const root = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root));
const layout = ts.createSourceFile('layout.tsx', read('app/layout.tsx').toString(), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
// Evaluate the actual metadata expressions without loading fonts or UI components.
const declarations = layout.statements.filter(statement => ts.isVariableStatement(statement)
  && !statement.declarationList.declarations.some(declaration => declaration.name.getText(layout) === 'inter'))
  .map(statement => statement.getText(layout).replace(/^export\s+/, '')).join('\n');
function evaluate(expression: string) {
  const code = ts.transpileModule(`${declarations}\n;(${expression});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  return JSON.parse(JSON.stringify(runInNewContext(code, { getSiteUrl })));
}
const metadata = evaluate('metadata');
let websiteExpression: string | undefined;
function findWebsite(node: ts.Node) {
  if (ts.isCallExpression(node) && node.expression.getText(layout) === 'JSON.stringify') {
    websiteExpression = node.arguments[0].getText(layout);
  }
  ts.forEachChild(node, findWebsite);
}
findWebsite(layout);

test('SEO: the site name, page title and social previews use one identity', () => {
  assert.equal(metadata.applicationName, 'Ozonteck Recife');
  assert.equal(metadata.openGraph.siteName, metadata.applicationName);
  assert.equal(metadata.title.template, `%s | ${metadata.applicationName}`);
  assert.equal(metadata.openGraph.title, metadata.title.default);
  assert.equal(metadata.twitter.title, metadata.title.default);
  assert.equal(metadata.openGraph.description, metadata.description);
  assert.equal(metadata.twitter.description, metadata.description);
  assert.match(metadata.title.default, /Rogério André/);
});

test('SEO: WebSite JSON-LD matches the name and configured home URL', () => {
  assert.ok(websiteExpression, 'Server-rendered JSON-LD must exist');
  const website = evaluate(websiteExpression);
  assert.equal(website['@context'], 'https://schema.org');
  assert.equal(website['@type'], 'WebSite');
  assert.equal(website.name, metadata.applicationName);
  assert.equal(website.url, getSiteUrl().toString());
  assert.equal(website.inLanguage, 'pt-BR');
  assert.equal(website.alternateName, 'Ozonteck Recife — Rogério André');
});

test('SEO: every ICO frame represents the existing brand rather than the starter favicon', async () => {
  const ico = read('app/favicon.ico');
  assert.equal(ico.readUInt16LE(0), 0);
  assert.equal(ico.readUInt16LE(2), 1);
  const count = ico.readUInt16LE(4);
  const sizes: number[] = [];
  for (let index = 0; index < count; index++) {
    const entry = 6 + index * 16;
    const width = ico[entry] || 256;
    const height = ico[entry + 1] || 256;
    assert.equal(width, height);
    sizes.push(width);
    const offset = ico.readUInt32LE(entry + 12);
    const length = ico.readUInt32LE(entry + 8);
    assert.ok(offset >= 6 + count * 16 && offset + length <= ico.length);
    const frame = ico.subarray(offset, offset + length);
    assert.deepEqual([...frame.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10], 'ICO frames must be decodable PNGs');
    const actual = await sharp(frame).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const expected = await sharp(read('public/brand-icon.png')).resize(width, height).ensureAlpha().raw().toBuffer();
    assert.equal(actual.info.width, width);
    assert.equal(actual.info.height, height);
    assert.deepEqual(actual.data, expected, `Conflicting brand in ${width}px frame`);
  }
  assert.ok(sizes.includes(16) && sizes.includes(32), 'Browser tab sizes');
  assert.ok(sizes.some(size => size > 48), 'High-resolution search icon');
});

test('SEO: linked raster assets exist and their declared dimensions are accurate', async () => {
  const icon = await sharp(read('public/brand-icon.png')).metadata();
  assert.equal(icon.width, 192);
  assert.equal(icon.height, 192);
  assert.deepEqual(metadata.icons.icon, [{ url: '/brand-icon.png', type: 'image/png', sizes: '192x192' }]);
  assert.equal(metadata.icons.apple, '/brand-icon.png');
  const share = await sharp(read('public/brand-share.png')).metadata();
  const image = metadata.openGraph.images[0];
  assert.equal(image.url, '/brand-share.png');
  assert.equal(image.width, share.width);
  assert.equal(image.height, share.height);
  assert.deepEqual(metadata.twitter.images, [image.url]);
});

test('SEO: metadata and share artwork avoid unverified authorization or technical claims', () => {
  assert.doesNotMatch(JSON.stringify(metadata), /autorizad|oficial|nanotecnologia/i);
  assert.doesNotMatch(read('public/brand-share.svg').toString(), /autorizad|oficial|nanotecnologia|<image\b/i);
});

test('SEO: raster share preview retains every visible line of brand text', async () => {
  // Left-hand text regions exclude the decorative circles. Catch font renderers
  // silently producing an image with the right dimensions but missing words.
  const lines = [
    { top: 140, height: 75, color: [255, 255, 255] },
    { top: 240, height: 50, color: [94, 234, 212] },
    { top: 350, height: 50, color: [255, 255, 255] },
    { top: 415, height: 45, color: [185, 216, 212] },
    { top: 520, height: 40, color: [94, 234, 212] },
  ];
  for (const { top, height, color } of lines) {
    const pixels = await sharp(read('public/brand-share.png'))
      .extract({ left: 70, top, width: 850, height }).removeAlpha().raw().toBuffer();
    let textPixels = 0;
    for (let index = 0; index < pixels.length; index += 3) {
      if (color.every((channel, offset) => pixels[index + offset] === channel)) textPixels++;
    }
    assert.ok(textPixels > 100, `Missing text near y=${top}`);
  }
});

const baseUrl = process.env.SEO_TEST_BASE_URL;
test('SEO: HTTP home exposes coherent metadata and crawlable brand assets', { skip: !baseUrl }, async () => {
  const response = await fetch(baseUrl!);
  assert.equal(response.status, 200);
  assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /noindex|nofollow/i);
  const html = await response.text();
  const attributes = (tag: string) => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
  const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map(match => attributes(match[0]));
  const value = (name: string) => metas.find(meta => meta.property === name || meta.name === name)?.content;
  assert.equal(value('application-name'), metadata.applicationName);
  assert.equal(value('og:site_name'), metadata.applicationName);
  assert.equal(value('twitter:title'), value('og:title'));
  assert.doesNotMatch(value('robots') || '', /noindex|nofollow/i);
  const structuredData = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const websites = structuredData.filter(data => data['@type'] === 'WebSite');
  assert.equal(websites.length, 1);
  assert.deepEqual(websites[0], evaluate(websiteExpression!));
  const icons = [...html.matchAll(/<link\b[^>]*>/g)].map(match => attributes(match[0]))
    .filter(link => link.rel === 'icon' || link.rel === 'apple-touch-icon');
  assert.ok(icons.some(link => new URL(link.href, baseUrl).pathname === '/favicon.ico'), 'Next file-based favicon');
  assert.ok(icons.some(link => link.href === '/brand-icon.png'), 'Brand PNG icon');
  const assets = new Set([...icons.map(link => new URL(link.href, baseUrl)), new URL('/brand-share.png', baseUrl)]);
  for (const url of assets) {
    const asset = await fetch(url);
    assert.equal(asset.status, 200, url.toString());
    assert.match(asset.headers.get('content-type') || '', /^image\//);
    assert.doesNotMatch(asset.headers.get('x-robots-tag') || '', /noindex|nofollow/i);
    assert.deepEqual(Buffer.from(await asset.arrayBuffer()), read(url.pathname.replace(/^\//, url.pathname === '/favicon.ico' ? 'app/' : 'public/')));
  }
  const robots = await fetch(new URL('/robots.txt', baseUrl));
  assert.equal(robots.status, 200);
  const rules = await robots.text();
  assert.match(rules, /Allow: \/(?:\r?\n|$)/i);
  assert.doesNotMatch(rules, /Disallow: \/(?:\r?\n|$)|Disallow: \/(?:favicon|brand)/i);
});
