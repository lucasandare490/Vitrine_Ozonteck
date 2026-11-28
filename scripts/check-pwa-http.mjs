// Read-only HTTP verification of the built local server. This is not browser/device proof.
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const base = new URL(process.argv[2] || 'http://localhost:3108');
if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) throw new Error('Use a local built server only');
const checks = [];
async function get(path) {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 200, path); return response;
}
const manifest = await (await get('/manifest.webmanifest')).json();
assert.equal(manifest.name, 'Ozonteck Recife'); assert.equal(manifest.display, 'standalone');
assert.equal(manifest.scope, '/'); assert.equal(manifest.start_url, '/'); checks.push('manifest-standalone');
const worker = await get('/sw.js');
assert.match(worker.headers.get('cache-control') || '', /no-store/);
assert.equal(worker.headers.get('service-worker-allowed'), '/');
assert.match(await worker.text(), /ozonteck-offline-v1/); checks.push('worker-update-headers');
const offline = await get('/offline.html');
assert.match(offline.headers.get('x-robots-tag') || '', /noindex/);
assert.match(await offline.text(), /Sem conexão/i); checks.push('offline-fallback-noindex');
for (const path of ['/app-icons/icon-192.png', '/app-icons/icon-512.png', '/app-icons/maskable-512.png', '/app-icons/apple-180.png']) {
  const icon = await get(path); assert.match(icon.headers.get('content-type') || '', /image\/png/);
  assert.ok((await icon.arrayBuffer()).byteLength > 500); checks.push(path);
}
const home = await (await get('/')).text();
assert.match(home, /rel="manifest"[^>]*href="\/manifest.webmanifest"/);
assert.match(home, /viewport-fit=cover/); checks.push('home-manifest-and-safe-area');
for (const path of ['/busca', '/instalar']) {
  const response = await get(path); const html = await response.text();
  assert.match(html, /<h1\b/); if (path === '/busca') assert.match(response.headers.get('x-robots-tag') || '', /noindex/);
  checks.push(path);
}
const report = { date: new Date().toISOString(), boundary: 'HTTP of local production build only; no browser, installation, payment, account or external service validation.', checks, passed: true };
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
