import test from 'node:test';
import assert from 'node:assert/strict';
import { customerEmailEvents, renderCustomerEmail } from '../lib/customer-email.ts';
const base = { siteUrl: 'https://loja.example', actionUrl: '/conta', event: 'welcome' as const };
test('email templates escape customer-controlled HTML and include a text alternative', () => {
  const result = renderCustomerEmail({ ...base, name: '<img onerror=alert(1)>', reference: 'A&B' });
  assert.ok(!result.html.includes('<img'));
  assert.match(result.html, /&lt;img/);
  assert.match(result.html, /A&amp;B/);
  assert.match(result.text, /https:\/\/loja.example\/conta/);
});
test('email action links cannot leave the store or use unsafe protocols', () => {
  for (const actionUrl of ['javascript:alert(1)', 'https://evil.example', '//evil.example', 'http://loja.example', 'https://user:pass@loja.example']) {
    assert.throws(() => renderCustomerEmail({ ...base, actionUrl }));
  }
});
test('every transactional event has a subject and both body formats', () => {
  for (const event of Object.keys(customerEmailEvents) as (keyof typeof customerEmailEvents)[]) {
    const result = renderCustomerEmail({ ...base, event });
    assert.ok(result.subject && result.html && result.text);
  }
  assert.match(renderCustomerEmail({ ...base, event: 'payment_pending' }).text, /ainda não foi confirmada/);
});
