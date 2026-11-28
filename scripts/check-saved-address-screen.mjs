import assert from 'node:assert/strict';
import test from 'node:test';
import { createComponentHarness, elements, flushAsync } from './component-test-harness.mjs';

const rows = [
  { id: 'address-a', user_id: 'owner', apelido: 'Casa', rua: 'Rua A', numero: '1', principal: true },
  { id: 'address-b', user_id: 'owner', apelido: 'Trabalho', rua: 'Rua B', numero: '2', principal: false },
];
const text = tree => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join(' ') : tree && typeof tree === 'object' ? text(tree.props?.children) : '';
function mount() {
  const reads = [], writes = [], notifications = [];
  const client = {
    auth: { getSession: async () => ({ data: { session: { user: { id: 'owner' } } } }) },
    rpc(name, args) { return new Promise((done, reject) => writes.push({ name, args, done, reject })); },
    from() {
      let write = false; const filters = [];
      const query = {
        select() { return query; }, eq(...args) { filters.push(args); return query; }, order() { return query; },
        delete() { write = true; return query; },
        then(resolve, reject) { return new Promise((done, fail) => (write ? writes : reads).push({ done, reject: fail, filters })).then(resolve, reject); },
      }; return query;
    },
  };
  const router = { push() {} };
  const harness = createComponentHarness('app/conta/enderecos/page.tsx', {
    supabase: client,
    imports: {
      'next/navigation': { useRouter: () => router },
      'lucide-react': Object.fromEntries('ArrowLeft Plus Trash2 MapPin Loader2 Home Briefcase Map Building AlertTriangle Truck CheckCircle2'.split(' ').map(name => [name, 'svg'])),
      'react-hot-toast': { __esModule: true, default: { error: message => notifications.push(['error', message]), success: message => notifications.push(['success', message]) } },
      '@/components/BackButton': { __esModule: true, default: 'back-button' },
      '@/components/PickupPoint': { __esModule: true, default: 'pickup-point' },
      '@/components/AppDialog': { __esModule: true, default: 'app-dialog' },
      '@/lib/saved-address': { validateSavedAddress: () => null },
    },
  });
  const render = () => harness.render();
  const respond = async (addresses = rows) => { await flushAsync(); reads.at(-1).done({ data: addresses, error: null }); await flushAsync(); };
  const primary = () => elements(render(), 'button').find(node => text(node).includes('Tornar Principal'));
  render(); harness.flushTimeouts();
  return { harness, render, reads, writes, notifications, respond, primary };
}

test('addresses: a failed list is recoverable and is not presented as no saved addresses', async () => {
  const m = mount(); await flushAsync(); m.reads[0].reject(new Error('offline')); await flushAsync();
  assert.ok(elements(m.render()).some(node => node.props?.role === 'alert'));
  assert.doesNotMatch(text(m.render()), /Nenhum endereço salvo/);
  elements(m.render(), 'button').find(node => text(node).includes('Conferir novamente')).props.onClick();
  await m.respond(); assert.match(text(m.render()), /Rua A/); assert.match(text(m.render()), /Rua B/); m.harness.unmount();
});

test('addresses: repeated primary clicks send one owner action and a network failure releases controls after a fresh read', async () => {
  const m = mount(); await m.respond(); const click = m.primary().props.onClick;
  click(); click(); await flushAsync();
  assert.equal(m.writes.length, 1); assert.equal(m.writes[0].name, 'set_primary_address');
  assert.equal(m.writes[0].args.p_address_id, 'address-b');
  m.writes[0].reject(new Error('offline')); await flushAsync();
  assert.equal(m.primary().props.disabled, true);
  await m.respond();
  assert.equal(m.primary().props.disabled, false);
  assert.equal(m.notifications.filter(([type]) => type === 'success').length, 0);
  assert.equal(m.notifications.filter(([type]) => type === 'error').length, 1); m.harness.unmount();
});

test('addresses: delete targets both the selected address and the authenticated owner, then refreshes', async () => {
  const m = mount(); await m.respond();
  elements(m.render(), 'button').filter(node => node.props.title === 'Excluir Endereço')[1].props.onClick();
  const confirm = elements(m.render(), 'button').find(node => text(node).includes('Sim, remover'));
  confirm.props.onClick(); confirm.props.onClick(); await flushAsync();
  assert.equal(m.writes.length, 1);
  assert.deepEqual(m.writes[0].filters, [['id', 'address-b'], ['user_id', 'owner']]);
  m.writes[0].done({ data: [{ id: 'address-b' }], error: null }); await flushAsync();
  await m.respond([rows[0]]);
  assert.doesNotMatch(text(m.render()), /Rua B/); m.harness.unmount();
});

for (const writing of [false, true]) test(`addresses: ${writing ? 'write' : 'read'} finishing after navigation does not change state`, async () => {
  const m = mount(); await flushAsync();
  if (writing) { await m.respond(); m.primary().props.onClick(); await flushAsync(); }
  m.harness.unmount();
  if (writing) m.writes[0].done({ error: null });
  else m.reads[0].done({ data: rows, error: null });
  await flushAsync();
  assert.equal(m.harness.updatesAfterUnmount, 0); assert.equal(m.reads.length, 1);
});
