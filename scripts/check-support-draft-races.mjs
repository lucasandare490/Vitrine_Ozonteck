// node --test scripts/check-support-draft-races.mjs
// Uses the actual component, with auth/database events controlled in memory.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createComponentHarness, elements, flushAsync } from './component-test-harness.mjs';

async function mount(admin = false) {
  let userId = 'account-a', authReads = 0;
  const subscribers = new Set(), requests = [];
  const ticket = { id: 'ticket-1', subject: 'Pedido anterior', message: 'Preciso de ajuda com meu pedido.', status: 'respondido', response: 'Resposta salva', created_at: '2026-11-04T12:00:00Z' };
  const client = {
    auth: {
      async getUser() { authReads++; return { data: { user: { id: userId } }, error: null }; },
      onAuthStateChange(callback) {
        subscribers.add(callback);
        return { data: { subscription: { unsubscribe() { subscribers.delete(callback); } } } };
      },
    },
    from() {
      const query = {
        select() { return query; }, order() { return query; }, range() { return query; }, eq() { return query; },
        then(resolve, reject) { return Promise.resolve({ data: admin ? [ticket] : [], error: null }).then(resolve, reject); },
      };
      return query;
    },
    rpc(name, args) { return new Promise(done => requests.push({ name, args, done })); },
  };
  const harness = createComponentHarness('components/SupportTickets.tsx', { supabase: client });
  const render = () => harness.render({ admin });
  render(); harness.flushTimeouts(); await flushAsync();
  return {
    harness, render, requests,
    emit(nextId) {
      userId = nextId;
      for (const callback of subscribers) callback(nextId ? 'SIGNED_IN' : 'SIGNED_OUT', nextId ? { user: { id: nextId } } : null);
    },
    get authReads() { return authReads; },
  };
}
function writeDraft(render, subject, message) {
  const tree = render();
  elements(tree, 'input')[0].props.onChange({ target: { value: subject } });
  elements(tree, 'textarea')[0].props.onChange({ target: { value: message } });
}
function submit(render) { elements(render(), 'form')[0].props.onSubmit({ preventDefault() {} }); }

test('same-user SIGNED_IN retains the customer subject and message', async () => {
  const { harness, render, emit } = await mount();
  writeDraft(render, 'Ajuda com pedido', 'Mensagem que ainda estou escrevendo.');
  emit('account-a'); harness.flushTimeouts(); await flushAsync();
  const tree = render();
  assert.equal(elements(tree, 'input')[0].props.value, 'Ajuda com pedido');
  assert.equal(elements(tree, 'textarea')[0].props.value, 'Mensagem que ainda estou escrevendo.');
  harness.unmount();
});

test('same-user SIGNED_IN preserves the idempotency ID after an uncertain submission', async () => {
  const { harness, render, emit, requests } = await mount();
  writeDraft(render, 'Ajuda com pedido', 'Mensagem que ainda estou escrevendo.');
  submit(render); requests[0].done({ data: null, error: { message: 'connection interrupted' } }); await flushAsync();
  emit('account-a'); harness.flushTimeouts(); await flushAsync();
  submit(render);
  assert.equal(requests[1].args.p_id, requests[0].args.p_id);
  requests[1].done({ data: null, error: { message: 'connection interrupted' } }); await flushAsync();
  harness.unmount();
});

for (const sameAccount of [true, false]) {
  test(`admin response drafts ${sameAccount ? 'survive same-user SIGNED_IN' : 'are cleared on account change'}`, async () => {
    const { harness, render, emit } = await mount(true);
    elements(render(), 'textarea')[0].props.onChange({ target: { value: 'Resposta privada ainda não enviada' } });
    emit(sameAccount ? 'account-a' : 'account-b'); harness.flushTimeouts(); await flushAsync();
    assert.equal(elements(render(), 'textarea')[0].props.value, sameAccount ? 'Resposta privada ainda não enviada' : 'Resposta salva');
    harness.unmount();
  });
}

test('changing accounts clears customer drafts', async () => {
  const { harness, render, emit } = await mount();
  writeDraft(render, 'Assunto privado', 'Mensagem privada da conta anterior.');
  emit('account-b'); harness.flushTimeouts(); await flushAsync();
  assert.equal(elements(render(), 'input')[0].props.value, '');
  assert.equal(elements(render(), 'textarea')[0].props.value, '');
  harness.unmount();
});

test('unmount cancels a queued auth reload and its state updates', async () => {
  const fixture = await mount();
  fixture.emit('account-b'); fixture.harness.unmount(); fixture.harness.flushTimeouts(); await flushAsync();
  assert.equal(fixture.authReads, 1);
  assert.equal(fixture.harness.updatesAfterUnmount, 0);
});

test('a previous account submission cannot clear the new account draft or expose its protocol', async () => {
  const { harness, render, emit, requests } = await mount();
  writeDraft(render, 'Pedido da conta A', 'Mensagem enviada pela conta anterior.'); submit(render);
  emit('account-b'); harness.flushTimeouts(); await flushAsync();
  writeDraft(render, 'Pedido da conta B', 'Mensagem privada da conta atual.');
  requests[0].done({ data: 'protocol-for-account-a', error: null }); await flushAsync();
  const tree = render();
  assert.equal(elements(tree, 'input')[0].props.value, 'Pedido da conta B');
  assert.equal(elements(tree, 'textarea')[0].props.value, 'Mensagem privada da conta atual.');
  assert.equal(elements(tree).some(node => node.props?.role === 'status' && String(node.props.children).includes('protocol-for-account-a')), false);
  harness.unmount();
});

test('a submission finishing after unmount cannot reload or update state', async () => {
  const fixture = await mount();
  writeDraft(fixture.render, 'Ajuda com pedido', 'Mensagem que ainda estou escrevendo.'); submit(fixture.render);
  fixture.harness.unmount(); fixture.requests[0].done({ data: 'old-protocol', error: null }); await flushAsync();
  assert.equal(fixture.authReads, 1);
  assert.equal(fixture.harness.updatesAfterUnmount, 0);
});
