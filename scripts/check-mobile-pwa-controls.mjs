// Real TSX state tests in memory; no browser, account, service-worker registration or network.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createComponentHarness, elements, flushAsync } from './component-test-harness.mjs';

function runtime(path = '/') {
  const events = new Map(), messages = [], reloads = [], capturedInstall = [];
  const worker = { postMessage: message => messages.push(message) };
  const registration = { waiting: worker, addEventListener() {}, removeEventListener() {}, update: async () => undefined };
  const navigator = { onLine: true, serviceWorker: {
    controller: {}, register: async (url, options) => { assert.equal(url, '/sw.js'); assert.equal(options.updateViaCache, 'none'); return registration; },
    addEventListener: (name, callback) => events.set(name, callback), removeEventListener: name => events.delete(name),
  } };
  let currentPath = path, confirm = false;
  const harness = createComponentHarness('components/AppRuntime.tsx', {
    navigator, env: { NODE_ENV: 'production' },
    document: { addEventListener() {}, removeEventListener() {} },
    window: { location: { reload: () => reloads.push(true) }, confirm: () => confirm },
    imports: { 'next/navigation': { usePathname: () => currentPath }, 'lucide-react': { WifiOff: 'svg', RefreshCw: 'svg' }, '@/lib/pwa-install': { setInstallPrompt: value => capturedInstall.push(value) } },
  });
  harness.render(); harness.flushTimeouts();
  return { harness, navigator, messages, reloads, capturedInstall, events, render: () => harness.render(), path: value => { currentPath = value; }, accept: () => { confirm = true; } };
}

test('PWA controls: an available update never reloads automatically and is hidden throughout checkout', async () => {
  const m = runtime(); await flushAsync();
  m.events.get('controllerchange')(); assert.equal(m.reloads.length, 0);
  assert.equal(elements(m.render(), 'button').length, 1);
  m.path('/lista'); assert.equal(elements(m.render(), 'button').length, 0);
  assert.equal(m.messages.length, 0); m.harness.unmount();
});
test('PWA controls: cancelling update preserves the page; explicit acceptance posts the activation message', async () => {
  const m = runtime(); await flushAsync();
  elements(m.render(), 'button')[0].props.onClick(); assert.equal(m.messages.length, 0);
  m.accept(); elements(m.render(), 'button')[0].props.onClick();
  assert.deepEqual({ ...m.messages[0] }, { type: 'ACTIVATE_UPDATE' });
  m.events.get('controllerchange')(); assert.equal(m.reloads.length, 1); m.harness.unmount();
});
test('PWA controls: network transitions produce a truthful offline notice without sending a mutation', async () => {
  const m = runtime(); await flushAsync(); m.navigator.onLine = false;
  m.harness.dispatchWindowEvent('offline');
  assert.ok(elements(m.render()).some(node => node.props?.role === 'status'));
  assert.equal(elements(m.render(), 'button').length, 0); assert.equal(m.messages.length, 0);
  m.navigator.onLine = true; m.harness.dispatchWindowEvent('online');
  assert.equal(elements(m.render(), 'button').length, 1); m.harness.unmount();
});
test('PWA controls: navigation cleanup removes pending registration callbacks', async () => {
  const m = runtime(); m.harness.unmount(); await flushAsync();
  assert.equal(m.harness.updatesAfterUnmount, 0); assert.equal(m.events.size, 0);
});

function favorite(owner = 'owner') {
  const reads = [], writes = [], destinations = [];
  let user = owner, changed;
  const request = (queue, details) => new Promise((done, reject) => queue.push({ ...details, done, reject }));
  const supabase = {
    auth: { getSession: async () => ({ data: { session: user ? { user: { id: user } } : null } }), onAuthStateChange(callback) { changed = callback; return { data: { subscription: { unsubscribe() {} } } }; } },
    from() {
      let deleting = false; const filters = [];
      const query = { select() { return query; }, eq(...args) { filters.push(args); return query; },
        maybeSingle() { return request(reads, { filters }); },
        delete() { deleting = true; return query; },
        insert(values) { return request(writes, { values }); },
        then(resolve, reject) { assert.equal(deleting, true); return request(writes, { filters }).then(resolve, reject); },
      }; return query;
    },
  };
  const harness = createComponentHarness('components/ProductFavorite.tsx', {
    supabase, window: { dispatchEvent() {} }, imports: { 'next/navigation': { useRouter: () => ({ push: href => destinations.push(href) }) }, 'lucide-react': { Heart: 'svg', Loader2: 'svg' }, '@/lib/products': { productPath: code => `/produto/${code}` } },
  });
  const render = () => harness.render({ code: 'QA', name: 'Produto de verificação' });
  const button = () => elements(render(), 'button')[0];
  render();
  const read = async exists => { await flushAsync(); reads.at(-1).done({ data: exists ? { produto_code: 'QA' } : null, error: null }); await flushAsync(); };
  return { harness, render, button, read, reads, writes, destinations, switchUser: value => { user = value; changed(); } };
}
test('product favorites: visitors return to this product after signing in', async () => {
  const m = favorite(null); await flushAsync(); m.button().props.onClick();
  assert.equal(m.destinations[0], '/login?redirect=%2Fproduto%2FQA'); assert.equal(m.writes.length, 0); m.harness.unmount();
});
for (const existing of [false, true]) test(`product favorites: ${existing ? 'removal' : 'addition'} is owner-scoped, deduplicated and confirmed by a fresh read`, async () => {
  const m = favorite(); await m.read(existing); const click = m.button().props.onClick;
  click(); click(); await flushAsync(); assert.equal(m.writes.length, 1);
  if (existing) assert.deepEqual(m.writes[0].filters, [['user_id', 'owner'], ['produto_code', 'QA']]);
  else assert.deepEqual({ ...m.writes[0].values }, { user_id: 'owner', produto_code: 'QA' });
  m.writes[0].done({ error: null }); await flushAsync(); await m.read(!existing);
  assert.equal(m.button().props['aria-pressed'], !existing); m.harness.unmount();
});
test('product favorites: an unknown write result blocks further writes until state is re-read', async () => {
  const m = favorite(); await m.read(false); m.button().props.onClick(); await flushAsync();
  m.writes[0].reject(new Error('offline')); await flushAsync();
  assert.equal(m.button().props.disabled, true); assert.ok(elements(m.render()).some(node => node.props?.role === 'alert'));
  elements(m.render(), 'button')[1].props.onClick(); m.render(); await m.read(true);
  assert.equal(m.button().props['aria-pressed'], true); m.harness.unmount();
});
test('product favorites: a late write for the previous account cannot replace the current account state', async () => {
  const m = favorite(); await m.read(false); m.button().props.onClick(); await flushAsync();
  m.switchUser('another-owner'); await m.read(false);
  m.writes[0].done({ error: null }); await flushAsync();
  assert.equal(m.button().props['aria-pressed'], false); assert.equal(m.reads.length, 2); m.harness.unmount();
});
test('product favorites: completion after unmount does not update the page or start another query', async () => {
  const m = favorite(); await m.read(false); m.button().props.onClick(); await flushAsync();
  m.harness.unmount(); m.writes[0].done({ error: null }); await flushAsync();
  assert.equal(m.harness.updatesAfterUnmount, 0); assert.equal(m.reads.length, 1);
});

test('bottom sheet: native dialog lifecycle locks scrolling, ignores inner clicks and restores focus', () => {
  let opened = 0, closed = 0, restored = 0, cancelled = 0;
  const dialog = { showModal() { opened++; }, close() { closed++; } };
  const body = { style: { overflow: 'auto' } };
  const focus = { isConnected: true, focus() { restored++; } };
  const h = createComponentHarness('components/BottomSheet.tsx', {
    document: { body, activeElement: focus }, imports: { 'lucide-react': { X: 'svg' } },
    beforeEffects: tree => { elements(tree, 'dialog')[0].props.ref.current = dialog; },
  });
  const props = { open: true, onClose: () => { cancelled++; }, title: 'Filtros', children: null };
  let tree = h.render(props); assert.equal(opened, 1); assert.equal(body.style.overflow, 'hidden');
  elements(tree, 'dialog')[0].props.onClick({ target: {}, currentTarget: dialog }); assert.equal(cancelled, 0);
  elements(tree, 'dialog')[0].props.onCancel({ preventDefault() {} }); assert.equal(cancelled, 1);
  tree = h.render({ ...props, open: false }); assert.equal(closed, 1); assert.equal(body.style.overflow, 'auto'); assert.equal(restored, 1);
  h.unmount();
});
test('application dialog: a pending save prevents escape dismissal without changing security or form data', () => {
  let closed = 0;
  const h = createComponentHarness('components/AppDialog.tsx', {
    document: { body: { style: { overflow: '' } } },
    beforeEffects: tree => { elements(tree, 'dialog')[0].props.ref.current = { showModal() {}, close() {} }; },
  });
  const props = { title: 'Editar', onClose: () => { closed++; }, busy: true, children: null };
  elements(h.render(props), 'dialog')[0].props.onCancel({ preventDefault() {} }); assert.equal(closed, 0);
  elements(h.render({ ...props, busy: false }), 'dialog')[0].props.onCancel({ preventDefault() {} }); assert.equal(closed, 1); h.unmount();
});
test('product purchase: desktop and mobile use the same action and the provisional stock never bypasses the 100-unit cart limit', () => {
  const items = [];
  const store = { items, addItem(item) { const previous = items.find(row => row.id === item.id); if (previous) previous.quantity++; else items.push({ ...item, quantity: 1 }); } };
  const useCartStore = selector => selector(store); useCartStore.getState = () => store;
  const h = createComponentHarness('components/ProductActions.tsx', {
    imports: { 'lucide-react': Object.fromEntries('ArrowRight Check Minus Plus ShoppingBag MessageCircle ShieldCheck'.split(' ').map(name => [name, 'svg'])), '@/lib/products': { formatPrice: value => `R$ ${value}` }, '@/store/useCartStore': { useCartStore }, '@/components/StorePricing': { useProductPrice: () => ({ price: 25, ready: true }) } },
  });
  const product = { id: 'QA', code: 'QA', name: 'Produto de verificação', price: 50, estoque: 9999 };
  const tree = h.render({ product });
  const actions = elements(tree, 'button').filter(node => node.props.onClick?.name === 'add');
  assert.equal(actions.length, 2); assert.equal(actions[0].props.onClick, actions[1].props.onClick);
  actions[1].props.onClick(); assert.equal(items[0].quantity, 1); assert.equal(items[0].price, 25);
  items[0].quantity = 100;
  assert.ok(elements(h.render({ product }), 'button').filter(node => node.props.onClick?.name === 'add').every(node => node.props.disabled));
  h.unmount();
});

for (const iconOnly of [false, true]) test(`back control: ${iconOnly ? 'mobile icon' : 'text button'} uses the shared history action, with a safe direct-entry fallback`, () => {
  const calls = [], replaced = [], browser = { marker: 'browser' };
  const harness = createComponentHarness('components/BackButton.tsx', {
    window: browser,
    imports: {
      'next/navigation': { useRouter: () => ({ replace: href => replaced.push(href) }) },
      'lucide-react': { ArrowLeft: 'svg' },
      '@/lib/back-navigation': { navigateBack: (target, replace, fallback) => { calls.push([target.marker, fallback]); replace(fallback); } },
    },
  });
  const tree = harness.render({ iconOnly, fallback: '/conta', className: 'mobile-icon-button' });
  const button = elements(tree, 'button')[0];
  assert.equal(button.props.type, 'button'); assert.match(button.props.className, /min-h-11/);
  if (iconOnly) assert.equal(button.props['aria-label'], 'Voltar');
  button.props.onClick(); assert.deepEqual(calls, [['browser', '/conta']]); assert.deepEqual(replaced, ['/conta']); harness.unmount();
});

for (const [step, complete, expected] of [['payment', false, 'address'], ['address', false, 'cart'], ['cart', false, null], ['payment', true, null]]) {
  test(`checkout return: ${step}, completed=${complete} respects the step or lets page navigation continue`, () => {
    const calls = [];
    const harness = createComponentHarness('components/CheckoutBackNavigation.tsx', {
      imports: { '@/lib/back-navigation': { backNavigationEvent: 'ozonteck:back' } },
    });
    harness.render({ step, complete, onStep: value => calls.push(value) });
    const event = new Event('ozonteck:back', { cancelable: true }); harness.dispatchWindowEvent('ozonteck:back', event);
    assert.deepEqual(calls, expected ? [expected] : []); assert.equal(event.defaultPrevented, expected !== null);
    harness.unmount(); harness.dispatchWindowEvent('ozonteck:back', new Event('ozonteck:back', { cancelable: true }));
    assert.equal(calls.length, expected ? 1 : 0);
  });
}
test('checkout return: changing screens removes the previous step handler and confirmation no longer traps the user', () => {
  const calls = [], onStep = value => calls.push(value);
  const harness = createComponentHarness('components/CheckoutBackNavigation.tsx', {
    imports: { '@/lib/back-navigation': { backNavigationEvent: 'ozonteck:back' } },
  });
  harness.render({ step: 'payment', complete: false, onStep });
  harness.dispatchWindowEvent('ozonteck:back', new Event('ozonteck:back', { cancelable: true }));
  harness.render({ step: 'address', complete: false, onStep });
  harness.dispatchWindowEvent('ozonteck:back', new Event('ozonteck:back', { cancelable: true }));
  harness.render({ step: 'payment', complete: true, onStep });
  const confirmedBack = new Event('ozonteck:back', { cancelable: true }); harness.dispatchWindowEvent('ozonteck:back', confirmedBack);
  assert.deepEqual(calls, ['address', 'cart']); assert.equal(confirmedBack.defaultPrevented, false); harness.unmount();
});
