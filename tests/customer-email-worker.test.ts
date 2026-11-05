import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { renderCustomerEmail } from '../lib/customer-email.ts';
import { emailRetry, shouldDeliverOrderEmail } from '../lib/customer-email-delivery.ts';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const code = ts.transpileModule(readFileSync('netlify/functions/customer-emails.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText;

function worker(options: { event?: string; supportOwner?: string; order?: object; confirmed?: boolean; smtpFailure?: boolean; ackFailure?: boolean; attempts?: number; enabled?: boolean } = {}) {
  const job = { id: 'job-1', lease: 'lease-1', user_id: 'owner', pedido_id: options.order ? 'order-1' : null, support_id: options.order ? null : 'support-1', event: options.event || 'support_received', attempts: options.attempts || 1 };
  let state = 'pending';
  let claims = 0;
  const messages: Array<Record<string, unknown>> = [];
  const updates: Array<Record<string, unknown>> = [];
  const db = {
    auth: { admin: { getUserById: async (id: string) => {
      assert.equal(id, 'owner');
      return { data: { user: { email: 'owner@example.invalid', email_confirmed_at: options.confirmed === false ? null : '2026-11-04' } } };
    } } },
    rpc: async (name: string) => {
      assert.equal(name, 'claim_customer_email'); claims++;
      if (state !== 'pending') return { data: [] };
      state = 'sending'; return { data: [job] };
    },
    from: (table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === 'pedidos' ? { user_id: 'owner', ...options.order } : { user_id: options.supportOwner || 'owner' } }) }) }),
      update: (values: Record<string, unknown>) => {
        const filters: Record<string, unknown> = {};
        const query = {
          eq: (key: string, value: unknown) => { filters[key] = value; return query; },
          select: async () => {
            assert.equal(table, 'customer_email_outbox');
            assert.deepEqual(filters, { id: job.id, lease: job.lease, state: 'sending' });
            updates.push(values);
            if (options.ackFailure && values.state === 'sent') return { error: { message: 'fixture' }, data: [] };
            state = String(values.state); return { data: [{ id: job.id }] };
          },
        };
        return query;
      },
    }),
  };
  const mocks = {
    '@supabase/supabase-js': { createClient: () => db },
    nodemailer: { createTransport: () => ({ sendMail: async (message: Record<string, unknown>) => {
      messages.push(message); if (options.smtpFailure) throw new Error('private fixture');
      return { accepted: ['owner@example.invalid'] };
    }, close() {} }) },
    '../../lib/customer-email': { renderCustomerEmail },
    '../../lib/customer-email-delivery': { emailRetry, shouldDeliverOrderEmail },
  };
  const exported: { default?: () => Promise<void> } = {};
  vm.runInNewContext(code, { exports: exported, URL, Date, process: { env: {
    CUSTOMER_EMAIL_ENABLED: options.enabled === false ? 'false' : 'true', NEXT_PUBLIC_SUPABASE_URL: 'https://db.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'fixture', SMTP_USER: 'store@example.invalid', SMTP_APP_PASSWORD: 'fixture', NEXT_PUBLIC_SITE_URL: 'https://store.example.invalid',
  } }, require: (name: keyof typeof mocks) => { assert.ok(name in mocks); return mocks[name]; } });
  return { run: () => exported.default!(), messages, updates, claims: () => claims };
}

test('support worker sends to confirmed owner, acknowledges lease and does not resend sent job', async () => {
  const fixture = worker(); await fixture.run(); await fixture.run();
  assert.equal(fixture.messages.length, 1);
  assert.equal(fixture.messages[0].to, 'owner@example.invalid');
  assert.equal(fixture.messages[0].messageId, '<job-1@store.example.invalid>');
  assert.match(String(fixture.messages[0].html), /https:\/\/store.example.invalid\/suporte/);
  assert.equal(fixture.updates[0].state, 'sent');
});

test('worker suppresses unverified recipients and foreign support protocols', async () => {
  for (const options of [{ confirmed: false }, { supportOwner: 'someone-else' }]) {
    const fixture = worker(options); await fixture.run();
    assert.equal(fixture.messages.length, 0); assert.equal(fixture.updates[0].state, 'skipped');
  }
});

test('pickup worker requires current paid pickup readiness', async () => {
  for (const ready of [false, true]) {
    const fixture = worker({ event: 'pickup_ready', order: { status: 'preparando', status_pagamento: 'approved', retirada_pronta_em: ready ? '2026-11-04' : null, endereco_entrega: { modalidade: 'retirada' } } });
    await fixture.run(); assert.equal(fixture.messages.length, ready ? 1 : 0);
    assert.equal(fixture.updates[0].state, ready ? 'sent' : 'skipped');
  }
});

test('SMTP failures retry without exposing response and stop after fifth attempt', async () => {
  for (const attempts of [1, 5]) {
    const fixture = worker({ smtpFailure: true, attempts }); await fixture.run();
    assert.equal(fixture.updates[0].state, attempts === 5 ? 'failed' : 'pending');
    assert.equal(fixture.updates[0].error_code, 'DELIVERY_FAILED');
    assert.ok(!JSON.stringify(fixture.updates).includes('private fixture'));
  }
});

test('SMTP accepted with failed acknowledgement is held for review instead of retry', async () => {
  const fixture = worker({ ackFailure: true }); await fixture.run(); await fixture.run();
  assert.equal(fixture.messages.length, 1);
  assert.equal(fixture.updates[1].state, 'failed');
  assert.equal(fixture.updates[1].error_code, 'ACCEPTED_ACK_UNCERTAIN');
});

test('disabled worker neither claims nor sends', async () => {
  const fixture = worker({ enabled: false }); await fixture.run();
  assert.equal(fixture.claims(), 0); assert.equal(fixture.messages.length, 0);
});
