import assert from 'node:assert/strict';
import test from 'node:test';
import { createComponentHarness, elements, flushAsync } from '../scripts/component-test-harness.mjs';
import { cardMethods, cardInstallments } from '../lib/secure-card-options.ts';
import { mountCardFields } from '../lib/secure-card-fields.ts';
import { isValidCpf } from '../lib/auth.ts';

async function fixture() {
  const callbacks: Record<string, Record<string, (data: object) => void>> = {};
  const methodQueries: Array<{ bin: string; resolve(data: unknown): void }> = [];
  let creates = 0, removed = 0, tokens = 0;
  const submissions: unknown[] = [];
  const client = {
    fields: { create(name: string) {
      creates++; callbacks[name] = {};
      return { mount() {}, unmount() { removed++; }, update() {}, on(event: string, callback: (data: object) => void) { callbacks[name][event] = callback; } };
    }, async createCardToken(data: object) { tokens++; assert.deepEqual(Object.keys(data).sort(), ['cardholderName', 'identificationNumber', 'identificationType']); return { id: 'token-fixture' }; } },
    getPaymentMethods: ({ bin }: { bin: string }) => new Promise(resolve => methodQueries.push({ bin, resolve })),
    getInstallments: async ({ paymentMethodId, paymentTypeId }: { paymentMethodId: string; paymentTypeId: string }) => [{ payment_method_id: paymentMethodId, payment_type_id: paymentTypeId, issuer: { id: 1 }, payer_costs: [{ installments: 1, recommended_message: '1x de R$ 9,99', total_amount: 9.99 }] }],
  };
  const harness = createComponentHarness('components/SecureCardPayment.tsx', {
    supabase: {}, env: { NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY: 'fixture-public' }, window: { MercadoPago: function () { return client; } },
    imports: {
      '@mercadopago/sdk-js': { loadMercadoPago: async () => undefined },
      '@/lib/secure-card-options': { cardMethods, cardInstallments }, '@/lib/secure-card-fields': { mountCardFields },
      '@/lib/auth': { isValidCpf }, './CvvHelp': { __esModule: true, default: 'CVV-help' },
    },
  });
  const props = { amount: 9.99, payer: { firstName: 'Titular', lastName: 'Fixture', identification: { number: '52998224725' }, email: 'fixture@example.invalid' }, onSubmit: async (data: unknown) => { submissions.push(data); } };
  const render = () => harness.render(props);
  render(); await flushAsync(); render();
  const identify = async (bin: string) => { callbacks.cardNumber.binChange({ bin }); render(); await flushAsync(); };
  const settle = async (index: number, id = 'visa') => {
    methodQueries[index].resolve({ results: [{ id, name: id, status: 'active', payment_type_id: 'credit_card' }] });
    await flushAsync(); render(); harness.flushTimeouts(); await flushAsync(); render();
  };
  return { harness, render, identify, settle, callbacks, methodQueries, submissions, creates: () => creates, removed: () => removed, tokens: () => tokens };
}

test('secure fields stay mounted across normal rerenders and CVV focus changes', async () => {
  const f = await fixture();
  assert.equal(elements(f.render(), 'CVV-help').length, 0);
  f.callbacks.securityCode.focus({});
  assert.equal(elements(f.render(), 'CVV-help')[0].props.expanded, true);
  f.callbacks.securityCode.blur({});
  assert.equal(elements(f.render(), 'CVV-help').length, 0);
  assert.equal(f.creates(), 3);
  f.harness.unmount(); assert.equal(f.removed(), 3);
});

test('late BIN lookup cannot replace the current card method', async () => {
  const f = await fixture();
  await f.identify('123456'); await f.identify('654321');
  await f.settle(1, 'master'); await f.settle(0, 'visa');
  assert.equal(elements(f.render(), 'select')[0].props.value, 'master:credit_card');
  f.harness.unmount();
});

test('only token and selected provider terms are submitted, duplicate clicks blocked', async () => {
  const f = await fixture(); await f.identify('123456'); await f.settle(0);
  for (const name of ['cardNumber', 'expirationDate', 'securityCode']) {
    f.callbacks[name].ready({}); f.callbacks[name].validityChange({ errorMessages: [] });
  }
  const form = elements(f.render(), 'form')[0];
  form.props.onSubmit({ preventDefault() {} }); form.props.onSubmit({ preventDefault() {} }); await flushAsync();
  assert.equal(f.tokens(), 1); assert.equal(f.submissions.length, 1);
  const body = f.submissions[0] as Record<string, unknown>;
  assert.equal(body.token, 'token-fixture'); assert.equal(body.payment_type_id, 'credit_card'); assert.equal(body.installments, 1);
  for (const key of ['cardNumber', 'securityCode', 'cvv', 'expirationDate']) assert.equal(key in body, false);
  f.harness.unmount();
});

test('unmount invalidates delayed provider metadata and field events', async () => {
  const f = await fixture(); await f.identify('123456');
  f.harness.unmount(); f.methodQueries[0].resolve({ results: [] }); f.callbacks.securityCode.focus({}); await flushAsync();
  assert.equal(f.harness.updatesAfterUnmount, 0);
});
