import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('../scripts/check-orders-production-readiness.mjs', import.meta.url));
const fixture = {
  NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY: 'APP_USR-public-fixture',
  MP_ORDERS_ACCESS_TOKEN: 'APP_USR-secret-fixture',
  MP_ORDERS_ACCOUNT_ID: 'account-fixture',
  MP_ORDERS_APPLICATION_ID: 'application-fixture',
  MP_ORDERS_WEBHOOK_SECRET: 'signature-fixture',
  NEXT_PUBLIC_SITE_URL: 'https://shop.example.org',
  NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.org',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-fixture',
  SUPABASE_SERVICE_ROLE_KEY: 'service-secret-fixture',
  UPSTASH_REDIS_REST_URL: 'https://redis.example.org',
  UPSTASH_REDIS_REST_TOKEN: 'redis-secret-fixture',
};

function run(patch: Record<string, string> = {}, missing = false) {
  const dir = mkdtempSync(join(tmpdir(), 'orders-policy-'));
  const file = join(dir, 'review.env');
  const source = Object.entries({ ...fixture, ...patch }).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('\n');
  try {
    if (!missing) writeFileSync(file, source);
    const result = spawnSync(process.execPath, [checker, file], {
      cwd: dir, encoding: 'utf8',
      // A selected file must not silently inherit application credentials or flags.
      env: { ...process.env, PAYMENT_SANDBOX: 'true', MP_ORDERS_ACCESS_TOKEN: 'ambient-secret-fixture' },
      timeout: 10000,
    });
    assert.ifError(result.error);
    assert.equal(result.stderr, '');
    if (!missing) assert.equal(readFileSync(file, 'utf8'), source, 'review must not modify configuration');
    return { status: result.status, output: result.stdout, report: JSON.parse(result.stdout) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('Orders configuration review redacts values and never certifies production or sandbox', () => {
  const { report, status, output } = run();
  assert.equal(status, 0);
  assert.equal(report.configurationChecksPassed, true);
  assert.equal(report.productionReady, false);
  assert.equal(report.sandboxOrdersSupported, false);
  assert.equal(report.providerVerified, false);
  assert.equal(report.ordersWebhookPath, '/api/webhook/orders');
  for (const value of Object.values(fixture)) assert.equal(output.includes(value), false);
  assert.equal(output.includes('ambient-secret-fixture'), false);
});

test('Orders public key alone cannot pass configuration checks', () => {
  const { report, status } = run({ MP_ORDERS_ACCESS_TOKEN: '' });
  assert.equal(status, 1);
  assert.equal(report.configurationChecksPassed, false);
  assert.equal(report.presence.MP_ORDERS_ACCESS_TOKEN, false);
});

test('production rate-limit configuration uses the database and does not require Redis', () => {
  const { report, status } = run({ UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '' });
  assert.equal(status, 0);
  assert.equal(report.checks.find((check: { name: string }) => check.name === 'rate_limit_configuration_present').ok, true);
  assert.equal(run({ SUPABASE_SERVICE_ROLE_KEY: '' }).status, 1);
});

test('sandbox flag exposes frontend and backend Orders selection mismatch', () => {
  const { report, status } = run({ PAYMENT_SANDBOX: 'true', NEXT_PUBLIC_PAYMENT_SANDBOX: 'true' });
  assert.equal(status, 1);
  assert.equal(report.frontendOrdersSelected, true);
  assert.equal(report.backendOrdersSelected, false);
  assert.equal(report.sandboxOrdersSupported, false);
});

test('mismatched sandbox flags cannot pass configuration checks', () => {
  assert.equal(run({ NEXT_PUBLIC_PAYMENT_SANDBOX: 'true' }).status, 1);
});

test('temporary, private and non-HTTPS site URLs cannot pass configuration checks', () => {
  for (const url of ['http://shop.example.org', 'https://localhost', 'https://localhost.', 'https://127.0.0.1',
    'https://[::1]', 'https://192.168.1.1', 'https://review.trycloudflare.com',
    'https://shop.local', 'https://shop.example.org/?key=secret', 'https://user:secret@shop.example.org']) {
    assert.equal(run({ NEXT_PUBLIC_SITE_URL: url }).status, 1, url);
  }
});

test('test-prefixed Orders credentials do not pass current production configuration checks', () => {
  const { status, report } = run({ MP_ORDERS_ACCESS_TOKEN: 'TEST-secret-fixture' });
  assert.equal(status, 1);
  assert.equal(report.providerVerified, false);
});

test('missing file produces a fixed diagnostic without exposing its path', () => {
  const { report, status, output } = run({}, true);
  assert.equal(status, 1);
  assert.equal(report.error, 'ENV_FILE_UNREADABLE');
  assert.equal(report.productionReady, false);
  assert.equal(output.includes('review.env'), false);
});
