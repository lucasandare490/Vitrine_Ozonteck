import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = ts.createSourceFile('products.tsx', readFileSync('app/admin/produtos/page.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
let actionSource = '';
function find(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(source) === 'confirmDeleteAction') actionSource = node.initializer!.getText(source);
  ts.forEachChild(node, find);
}
find(source);
function fixture(type: 'soft' | 'hard') {
  const writes: Array<{ kind: string; filters: unknown[]; done: (result: unknown) => void }> = [];
  const successes: string[] = [], errors: string[] = [], closed: unknown[] = [];
  const lock = { current: false };
  let reloads = 0;
  const exports: { action?: () => Promise<void> } = {};
  runInNewContext(ts.transpileModule(`exports.action = ${actionSource}`, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, deleteModal: { id: 'verification-product', type }, deleteLock: lock,
    setIsDeleting() {}, setDeleteModal: (value: unknown) => closed.push(value),
    getErrorMessage: () => 'Verification failure', fetchData: async () => { reloads++; },
    toast: { success: (value: string) => successes.push(value), error: (value: string) => errors.push(value) },
    supabase: { from: () => {
      let kind = ''; const filters: unknown[] = [];
      const query = { update: () => { kind = 'soft'; return query; }, delete: () => { kind = 'hard'; return query; }, eq: (...args: unknown[]) => { filters.push(args); return query; }, select: () => new Promise(done => writes.push({ kind, filters, done })) }; return query;
    } },
  });
  return { action: exports.action!, writes, successes, errors, closed, lock, reloads: () => reloads };
}

for (const type of ['soft', 'hard'] as const) test(`admin product ${type}: one confirmation sends exactly one targeted write`, async () => {
  const m = fixture(type); const first = m.action(), duplicate = m.action();
  assert.equal(m.writes.length, 1); assert.equal(m.writes[0].kind, type);
  assert.deepEqual(m.writes[0].filters, [['id', 'verification-product']]);
  assert.equal(m.successes.length, 0);
  m.writes[0].done({ data: [{ id: 'verification-product' }], error: null }); await Promise.all([first, duplicate]);
  assert.equal(m.successes.length, 1); assert.equal(m.closed.length, 1); assert.equal(m.reloads(), 1); assert.equal(m.lock.current, false);
});
test('admin product: zero affected rows never report success and preserve the confirmation for recovery', async () => {
  const m = fixture('soft'); const pending = m.action(); m.writes[0].done({ data: [], error: null }); await pending;
  assert.equal(m.successes.length, 0); assert.equal(m.closed.length, 0); assert.equal(m.errors.length, 1); assert.equal(m.lock.current, false);
});
