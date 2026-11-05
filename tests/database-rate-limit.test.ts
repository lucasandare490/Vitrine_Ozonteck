import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
function load(file: string, dependencies: Record<string, unknown>, globals: Record<string, unknown> = {}) {
  const exported: Record<string, (options: unknown) => (identity: string) => Promise<string>> = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
    { exports: exported, require: (name: string) => { if (!(name in dependencies)) throw new Error('Unexpected dependency ' + name); return dependencies[name]; }, ...globals });
  return exported;
}
const options = { prefix: 'ratelimit:order-payment', limit: 30, windowMs: 60000 };
function fixture(result: unknown = true, status = 200, missing = false) {
  const requests: { url: string; init: RequestInit }[] = [];
  const api = load('lib/server/database-rate-limit.ts', { 'server-only': {}, 'node:crypto': require('node:crypto') }, {
    process: { env: missing ? {} : { NEXT_PUBLIC_SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'server-key-fixture' } },
    AbortSignal, JSON, URL,
    fetch: async (url: string, init: RequestInit) => { requests.push({ url, init }); if (result instanceof Error) throw result; return new Response(JSON.stringify(result), { status }); },
  });
  return { guard: api.createDatabaseRateLimitGuard(options), requests };
}

test('database limiter shares deterministic hashed identities without transmitting raw identifiers', async () => {
  const { guard, requests } = fixture();
  assert.equal(await guard('customer-private-id'), 'allowed');
  assert.equal(await guard('customer-private-id'), 'allowed');
  assert.equal(await guard('other-customer'), 'allowed');
  assert.equal(requests[0].url, 'https://fixture.supabase.co/rest/v1/rpc/consume_api_rate_limit');
  const first = JSON.parse(String(requests[0].init.body));
  assert.match(first.p_key, /^[a-f0-9]{64}$/);
  assert.equal(first.p_key, JSON.parse(String(requests[1].init.body)).p_key);
  assert.notEqual(first.p_key, JSON.parse(String(requests[2].init.body)).p_key);
  assert.equal(first.p_limit, 30); assert.equal(first.p_window_ms, 60000);
  assert.equal(first.p_namespace, options.prefix);
  assert.doesNotMatch(String(requests[0].init.body), /customer-private-id/);
  assert.equal(requests[0].init.cache, 'no-store');
  assert.ok(requests[0].init.signal instanceof AbortSignal);
  assert.equal((requests[0].init.headers as Record<string,string>).Authorization, 'Bearer server-key-fixture');
});

test('database limiter denies exhausted windows and fails closed on all storage/configuration errors', async () => {
  assert.equal(await fixture(false).guard('customer'), 'denied');
  for (const result of [null, {}, 'true', new Error('connection failed')]) {
    assert.equal(await fixture(result).guard('customer'), 'unavailable');
  }
  assert.equal(await fixture({ error: 'unavailable' }, 503).guard('customer'), 'unavailable');
  const missing = fixture(true, 200, true);
  assert.equal(await missing.guard('customer'), 'unavailable');
  assert.equal(missing.requests.length, 0);
});

test('production HTTP guard always uses the shared database instead of local memory or unavailable Redis', async () => {
  const calls: unknown[] = [];
  const api = load('lib/server/http.ts', {
    'server-only': {},
    '@upstash/ratelimit': { Ratelimit: class { constructor() { throw new Error('Redis must not initialize in production'); } } },
    '@upstash/redis': { Redis: class { constructor() { throw new Error('Redis must not initialize in production'); } } },
    './database-rate-limit': { createDatabaseRateLimitGuard: (config: unknown) => { calls.push(config); return async () => 'unavailable'; } },
  }, { process: { env: { NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'https://unreachable.invalid', UPSTASH_REDIS_REST_TOKEN: 'fixture' } } });
  const guard = api.createRateLimitGuard({ limit: 5, window: '1 m', prefix: 'ratelimit:checkout' });
  assert.equal(await guard('customer'), 'unavailable');
  assert.equal(await guard('customer'), 'unavailable');
  assert.equal(calls.length, 1);
  assert.equal(JSON.stringify(calls[0]), JSON.stringify({ limit: 5, windowMs: 60000, prefix: 'ratelimit:checkout' }));
});
