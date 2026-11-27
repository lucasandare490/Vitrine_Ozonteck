import assert from 'node:assert/strict';
import test from 'node:test';
import { createComponentHarness, elements, flushAsync } from './component-test-harness.mjs';

const table = price => ({ enabled: false, products: [{ code: 'QA', name: 'Produto de verificação', price: 100, affiliate_price: price }], audit: [] });
function mount() {
  const reads = [], writes = [], events = [];
  const harness = createComponentHarness('components/AdminPricing.tsx', {
    supabase: { rpc(name, args) { return new Promise((done, reject) => (name === 'admin_pricing' ? reads : writes).push({ name, args, done, reject })); } },
    window: { dispatchEvent(event) { events.push(event.type); } },
    imports: {
      'lucide-react': { Save: 'svg', RotateCcw: 'svg', Search: 'svg', RefreshCw: 'svg' },
      '@/lib/products': { formatPrice: price => `R$ ${price}` },
      '@/components/PaginatedGrid': { __esModule: true, default: 'paginated-grid' },
    },
  });
  const render = () => harness.render();
  const editor = () => elements(render()).find(node => node.type?.name === 'PriceEditor');
  const text = tree => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join(' ') : tree && typeof tree === 'object' ? text(tree.props?.children) : '';
  const respond = async (value = table(50)) => { reads.at(-1).done({ data: value, error: null }); await flushAsync(); };
  render(); harness.flushTimeouts();
  return { harness, reads, writes, events, render, editor, text, respond };
}

test('pricing: a disconnected read offers recovery instead of an endless loading state', async () => {
  const m = mount();
  m.reads[0].reject(new Error('offline'));
  await flushAsync();
  assert.ok(elements(m.render()).some(node => node.props?.role === 'alert'));
  const retry = elements(m.render(), 'button').find(node => m.text(node).includes('Conferir novamente'));
  assert.ok(retry); retry.props.onClick(); await flushAsync();
  await m.respond(); assert.ok(m.editor()); m.harness.unmount();
});

test('pricing: saving twice before React renders sends one global write and waits for the refreshed table', async () => {
  const m = mount(); await m.respond();
  const save = m.editor().props.save;
  const first = save('QA', 40), second = save('QA', 30);
  assert.equal(m.writes.length, 1);
  assert.deepEqual({ ...m.writes[0].args }, { p_action: 'affiliate', p_user_id: null, p_code: 'QA', p_price: 40, p_enabled: null });
  m.writes[0].done({ error: null }); await flushAsync();
  assert.equal(m.editor().props.busy, true);
  await m.respond(table(40)); await Promise.all([first, second]);
  assert.equal(m.editor().props.row.affiliate_price, 40);
  assert.deepEqual(m.events, ['store-pricing-changed']); m.harness.unmount();
});

test('pricing: a saved value followed by a failed read is explicitly unconfirmed and cannot be edited from stale data', async () => {
  const m = mount(); await m.respond();
  const pending = m.editor().props.save('QA', 40);
  m.writes[0].done({ error: null }); await flushAsync();
  m.reads.at(-1).done({ data: null, error: { message: 'network' } });
  await pending;
  assert.equal(m.editor(), undefined);
  assert.match(m.text(m.render()), /salvo.*confer|confirmar.*atualiz/i);
  assert.ok(elements(m.render()).some(node => node.props?.role === 'alert')); m.harness.unmount();
});

test('pricing: a failed write is re-read without reporting success or emitting a price change', async () => {
  const m = mount(); await m.respond();
  const pending = m.editor().props.save('QA', 40);
  m.writes[0].reject(new Error('connection lost')); await flushAsync();
  assert.equal(m.reads.length, 2);
  await m.respond(table(50)); await pending;
  assert.equal(m.editor().props.row.affiliate_price, 50);
  assert.match(m.text(m.render()), /conexão|confirmada/i);
  assert.deepEqual(m.events, []); m.harness.unmount();
});

for (const saving of [false, true]) test(`pricing: ${saving ? 'write' : 'read'} completing after navigation does not update an unmounted screen`, async () => {
  const m = mount(); let pending;
  if (saving) { await m.respond(); pending = m.editor().props.save('QA', 40); }
  m.harness.unmount();
  if (saving) m.writes[0].done({ error: null });
  else m.reads[0].done({ data: table(50), error: null });
  await pending; await flushAsync();
  assert.equal(m.reads.length, 1); assert.equal(m.harness.updatesAfterUnmount, 0);
});
