// node --test scripts/check-admin-list-races.mjs
// Deferred database doubles exercise the actual pages; nothing contacts Supabase.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createComponentHarness, elements, flushAsync } from './component-test-harness.mjs';

function database() {
  const reads = [], writes = [];
  const client = {
    rpc() { return request('write'); },
    from() { return request('read'); },
  };
  function request(initial) {
    let operation = initial;
    const details = { filters: [], range: null };
    const query = {
      select() { return query; }, order() { return query; },
      range(from, to) { details.range = [from, to]; return query; },
      eq(...args) { details.filters.push(['eq', ...args]); return query; },
      is(...args) { details.filters.push(['is', ...args]); return query; },
      not(...args) { details.filters.push(['not', ...args]); return query; },
      insert() { operation = 'write'; return query; },
      update() { operation = 'write'; return query; },
      then(resolve, reject) {
        return new Promise(done => (operation === 'read' ? reads : writes).push({ ...details, done }))
          .then(resolve, reject);
      },
    };
    return query;
  }
  return { client, reads, writes };
}
const configurations = [
  {
    name: 'leads', path: 'app/admin/interessados/page.tsx',
    row: { id: 'lead-1', name: 'Current lead', phone: '81999999999', email: 'lead@example.test', interest: 'consumo', status: 'new', created_at: '2026-11-04T12:00:00Z' },
    changeFilter(tree) { elements(tree, 'select')[0].props.onChange({ target: { value: 'contacted' } }); },
    currentFilter: ['eq', 'status', 'contacted'],
    mutate(tree) { elements(tree, 'article').flatMap(node => elements(node, 'button'))[0].props.onClick(); },
    saved: { data: 'lead-1', error: null },
  },
  {
    name: 'reminders', path: 'app/admin/lembretes/page.tsx',
    row: { id: 'reminder-1', title: 'Current reminder', note: 'Contact customer', due_at: '2026-11-04T12:00:00Z', completed_at: null },
    changeFilter(tree) { elements(tree, 'input').find(node => node.props.type === 'checkbox').props.onChange({ target: { checked: true } }); },
    currentFilter: ['not', 'completed_at', 'is', null],
    mutate(tree) { elements(tree, 'article').flatMap(node => elements(node, 'button'))[0].props.onClick(); },
    saved: { data: [{ id: 'reminder-1' }], error: null },
  },
];
async function mount(config) {
  const db = database(), harness = createComponentHarness(config.path, { supabase: db.client });
  harness.render(); harness.flushTimeouts(); await flushAsync();
  return { db, harness };
}
function articleTitles(harness) {
  return elements(harness.render(), 'article').flatMap(node => elements(node, 'h2')).map(node => node.props.children);
}

for (const config of configurations) {
  test(`${config.name}: late results cannot overwrite a changed filter`, async () => {
    const { db, harness } = await mount(config);
    config.changeFilter(harness.render()); harness.render(); harness.flushTimeouts(); await flushAsync();
    db.reads[1].done({ data: [], error: null }); await flushAsync();
    db.reads[0].done({ data: [config.row], error: null }); await flushAsync();
    assert.deepEqual(articleTitles(harness), []);
    harness.unmount();
  });

  test(`${config.name}: dependency cleanup invalidates results before the next request starts`, async () => {
    const { db, harness } = await mount(config);
    config.changeFilter(harness.render()); harness.render();
    db.reads[0].done({ data: [config.row], error: null }); await flushAsync();
    assert.deepEqual(articleTitles(harness), []);
    harness.unmount();
  });

  test(`${config.name}: older poll failures cannot replace the latest successful result`, async () => {
    const { db, harness } = await mount(config);
    harness.poll(); await flushAsync();
    db.reads[1].done({ data: [config.row], error: null }); await flushAsync();
    db.reads[0].done({ data: null, error: { message: 'old request failed' } }); await flushAsync();
    assert.deepEqual(articleTitles(harness), [config.row.name || config.row.title]);
    assert.equal(elements(harness.render()).some(node => node.props?.role === 'alert'), false);
    harness.unmount();
  });

  test(`${config.name}: late page results cannot overwrite the next page`, async () => {
    const { db, harness } = await mount(config);
    db.reads[0].done({ data: Array.from({ length: 30 }, (_, i) => ({ ...config.row, id: `row-${i}` })), error: null }); await flushAsync();
    // Start another request for page 1, then navigate to page 2 while it is pending.
    harness.poll(); await flushAsync();
    elements(harness.render(), 'nav').flatMap(node => elements(node, 'button'))[1].props.onClick();
    harness.render(); harness.flushTimeouts(); await flushAsync();
    assert.deepEqual(db.reads[2].range, [30, 59]);
    db.reads[2].done({ data: [], error: null }); await flushAsync();
    db.reads[1].done({ data: [config.row], error: null }); await flushAsync();
    assert.deepEqual(articleTitles(harness), []);
    harness.unmount();
  });

  test(`${config.name}: a mutation started on an old filter refreshes the current filter`, async () => {
    const { db, harness } = await mount(config);
    db.reads[0].done({ data: [config.row], error: null }); await flushAsync();
    config.mutate(harness.render()); await flushAsync();
    config.changeFilter(harness.render()); harness.render(); harness.flushTimeouts(); await flushAsync();
    db.reads[1].done({ data: [], error: null }); await flushAsync();
    db.writes[0].done(config.saved); await flushAsync();
    assert.ok(db.reads[2].filters.some(filter => JSON.stringify(filter) === JSON.stringify(config.currentFilter)), 'mutation must not query its captured old filter');
    db.reads[2].done({ data: [], error: null }); await flushAsync();
    assert.deepEqual(articleTitles(harness), []);
    harness.unmount();
  });

  test(`${config.name}: unmount invalidates an outstanding list request`, async () => {
    const { db, harness } = await mount(config);
    harness.unmount(); db.reads[0].done({ data: [config.row], error: null }); await flushAsync();
    assert.equal(harness.updatesAfterUnmount, 0);
  });

  test(`${config.name}: a mutation completing after unmount cannot reload or update state`, async () => {
    const { db, harness } = await mount(config);
    db.reads[0].done({ data: [config.row], error: null }); await flushAsync();
    config.mutate(harness.render()); await flushAsync();
    harness.unmount(); db.writes[0].done(config.saved); await flushAsync();
    assert.equal(db.reads.length, 1);
    assert.equal(harness.updatesAfterUnmount, 0);
  });
}

for (const duplicate of [false, true]) {
  test(`reminder creation${duplicate ? ' retry' : ''} refreshes the current filter`, async () => {
    const config = configurations[1], { db, harness } = await mount(config);
    db.reads[0].done({ data: [], error: null }); await flushAsync();
    let tree = harness.render();
    elements(tree, 'input').find(node => node.props.type !== 'checkbox' && node.props.type !== 'datetime-local').props.onChange({ target: { value: 'New reminder' } });
    elements(tree, 'input').find(node => node.props.type === 'datetime-local').props.onChange({ target: { value: '2026-11-04T12:00' } });
    tree = harness.render(); elements(tree, 'form')[0].props.onSubmit({ preventDefault() {} }); await flushAsync();
    config.changeFilter(harness.render()); harness.render(); harness.flushTimeouts(); await flushAsync();
    db.reads[1].done({ data: [], error: null }); await flushAsync();
    db.writes[0].done(duplicate ? { data: null, error: { code: '23505' } } : config.saved); await flushAsync();
    assert.ok(db.reads[2].filters.some(filter => JSON.stringify(filter) === JSON.stringify(config.currentFilter)), 'creation must refresh the visible filter, including duplicate retries');
    db.reads[2].done({ data: [], error: null }); await flushAsync();
    assert.deepEqual(articleTitles(harness), []);
    harness.unmount();
  });
}
