import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import sharp from 'sharp';

function worker() {
  const handlers: Record<string, (event: unknown) => void> = {};
  const files = new Map<string, Response>(); const deleted: string[] = []; const added: string[] = [];
  let activation = 0; let claimed = 0; let disconnected = false; let status = 200;
  const calls: Array<{ request: unknown; options: unknown }> = [];
  const self = { location: { origin: 'https://shop.invalid' }, clients: { claim: async () => { claimed++; } }, skipWaiting: () => { activation++; }, addEventListener: (name: string, fn: (event: unknown) => void) => { handlers[name] = fn; } };
  runInNewContext(readFileSync('public/sw.js', 'utf8'), { self, URL, Response,
    caches: { open: async () => ({ addAll: async (paths: string[]) => { paths.forEach(path => { added.push(path); files.set(path, new Response(path === '/offline.html' ? 'Offline screen, no customer data' : 'brand')); }); }, match: async (path: string) => files.get(path)?.clone() }), keys: async () => ['ozonteck-offline-v0', 'ozonteck-offline-v1', 'another-application'], delete: async (name: string) => { deleted.push(name); return true; } },
    fetch: async (request: unknown, options: unknown) => { calls.push({ request, options }); if (disconnected) throw new Error('offline'); return new Response('Fresh network response', { status }); },
  });
  const lifecycle = async (name: string) => { let promise: Promise<unknown> | undefined; handlers[name]({ waitUntil: (value: Promise<unknown>) => { promise = value; } }); await promise; };
  const fetchRequest = (path: string, options: { method?: string; mode?: string; headers?: Record<string, string> } = {}) => {
    let response: Promise<Response> | undefined;
    handlers.fetch({ request: { url: new URL(path, 'https://shop.invalid').href, method: options.method || 'GET', mode: options.mode || 'cors', headers: new Headers(options.headers) }, respondWith: (value: Promise<Response>) => { response = value; } });
    return response;
  };
  return { lifecycle, fetchRequest, handlers, files, added, deleted, calls, disconnect: () => { disconnected = true; }, serverError: () => { status = 500; }, get activation() { return activation; }, get claimed() { return claimed; } };
}

test('PWA: install stores only the explicit offline shell and icons, without forcing an update', async () => {
  const w = worker(); await w.lifecycle('install');
  assert.deepEqual(w.added, ['/offline.html', '/app-icons/icon-192.png', '/app-icons/icon-512.png', '/app-icons/maskable-512.png']);
  assert.equal(w.activation, 0); assert.equal(w.files.size, 4);
});
test('PWA: authentication, APIs, mutations, external origins and Next RSC/prefetch bypass interception', () => {
  const w = worker();
  for (const path of ['/api/checkout', '/api/webhook/orders', '/api/pedidos/QA/pagamento']) {
    assert.equal(w.fetchRequest(path), undefined); assert.equal(w.fetchRequest(path, { mode: 'navigate' }), undefined);
  }
  assert.equal(w.fetchRequest('/lista', { method: 'POST' }), undefined);
  assert.equal(w.fetchRequest('https://identity.invalid/auth/v1/user'), undefined);
  assert.equal(w.fetchRequest('/conta', { mode: 'navigate', headers: { authorization: 'Bearer fixture' } }), undefined);
  assert.equal(w.fetchRequest('/produto/QA?_rsc=fixture', { headers: { rsc: '1' } }), undefined);
  assert.equal(w.fetchRequest('/', { headers: { 'next-router-prefetch': '1' } }), undefined);
  assert.equal(w.calls.length, 0);
});
test('PWA: live navigations including search and account always use fresh network and never persist responses', async () => {
  const w = worker(); await w.lifecycle('install');
  for (const path of ['/', '/?q=óleo', '/lista', '/conta/pedidos', '/admin']) {
    const response = await w.fetchRequest(path, { mode: 'navigate' });
    assert.equal(await response!.text(), 'Fresh network response');
    assert.deepEqual({ ...(w.calls.at(-1)!.options as Record<string, unknown>) }, { cache: 'no-store' });
  }
  assert.equal(w.files.size, 4);
});
test('PWA: disconnected navigation gets a neutral offline screen, never a cached account or false payment confirmation', async () => {
  const w = worker(); await w.lifecycle('install'); w.disconnect();
  for (const path of ['/?q=óleo', '/lista', '/conta/pedidos', '/admin']) {
    assert.equal(await (await w.fetchRequest(path, { mode: 'navigate' }))!.text(), 'Offline screen, no customer data');
  }
  assert.equal(w.files.size, 4);
});
test('PWA: server errors are not disguised as offline success and a missing offline asset fails safely', async () => {
  const w = worker(); w.serverError(); assert.equal((await w.fetchRequest('/', { mode: 'navigate' }))!.status, 500);
  w.disconnect(); assert.equal((await w.fetchRequest('/', { mode: 'navigate' }))!.status, 503);
});
test('PWA: activation only removes this application cache; applying an update requires the explicit message', async () => {
  const w = worker(); w.handlers.message({ data: { type: 'unrelated' } }); assert.equal(w.activation, 0);
  w.handlers.message({ data: { type: 'ACTIVATE_UPDATE' } }); assert.equal(w.activation, 1);
  await w.lifecycle('activate'); assert.deepEqual(w.deleted, ['ozonteck-offline-v0']); assert.equal(w.claimed, 1);
});
test('PWA: manifest has stable identity, standalone mode, icons and same-origin shortcuts', () => {
  const exports: { default?: () => Record<string, unknown> } = {};
  runInNewContext(ts.transpileModule(readFileSync('app/manifest.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
  const manifest = JSON.parse(JSON.stringify(exports.default!()));
  assert.equal(manifest.id, '/'); assert.equal(manifest.scope, '/'); assert.equal(manifest.start_url, '/'); assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.name, 'Ozonteck Recife'); assert.equal(manifest.lang, 'pt-BR');
  assert.ok(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable'));
  for (const shortcut of manifest.shortcuts) assert.ok(shortcut.url.startsWith('/') && !shortcut.url.startsWith('//'));
});
test('PWA: raster icons are correctly sized and maskable artwork stays inside the safe circle', async () => {
  for (const [file, size] of [['icon-192', 192], ['icon-512', 512], ['maskable-512', 512], ['apple-180', 180]] as const) {
    const metadata = await sharp(`public/app-icons/${file}.png`).metadata(); assert.equal(metadata.width, size); assert.equal(metadata.height, size);
  }
  const { data, info } = await sharp('public/app-icons/maskable-512.png').removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    const i = (y * 512 + x) * info.channels;
    if (Math.hypot(x - 256, y - 256) > 204.8) assert.deepEqual([...data.subarray(i, i + 3)], [0, 60, 57]);
  }
});
