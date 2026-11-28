import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Execute the actual async readers with delayed replies, without account or network access.
const source = ts.createSourceFile('navbar.tsx', readFileSync('components/Navbar.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const readers: Record<string, string> = {};
function visit(node: ts.Node) {
  if (ts.isVariableDeclaration(node) && ['fetchProfile', 'fetchQuickBuy'].includes(node.name.getText(source))) {
    const call = node.initializer as ts.CallExpression;
    readers[node.name.getText(source)] = call.arguments[0].getText(source);
  }
  ts.forEachChild(node, visit);
}
visit(source);
function fixture(name: string) {
  const replies: Array<(result: unknown) => void> = [], updates: unknown[] = [];
  const viewer = { current: 'first' };
  const exports: { read?: (id: string) => Promise<void> } = {};
  const query = { select: () => query, eq: () => query, in: () => query,
    single: () => new Promise(done => replies.push(done)),
    then: (resolve: (value: unknown) => void) => new Promise(done => replies.push(done)).then(resolve) };
  const set = (value: unknown) => updates.push(value);
  runInNewContext(ts.transpileModule(`exports.read = ${readers[name]}`, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports, viewer, supabase: { from: () => query },
    setProfileName: set, setAvatarUrl: set, setUserRole: set, setTotalFavs: set, setQuickBuyProducts: set,
    isRetiredProduct: () => false, isTestProduct: () => false,
  });
  return { viewer, replies, updates, read: exports.read! };
}
for (const name of ['fetchProfile', 'fetchQuickBuy']) test(`navigation: late ${name} reply cannot show a previous account's data`, async () => {
  const m = fixture(name); const pending = m.read('first');
  await new Promise(resolve => setImmediate(resolve));
  m.viewer.current = 'second';
  m.replies[0]({ data: name === 'fetchProfile' ? { nome: 'Private Name', avatar_url: 'private', role: 'admin' } : [{ produto_code: 'private' }] });
  await pending; assert.deepEqual(m.updates, []);
});
test('navigation: account switching during product lookup discards the old favorites preview', async () => {
  const m = fixture('fetchQuickBuy'); const pending = m.read('first');
  await new Promise(resolve => setImmediate(resolve));
  m.replies[0]({ data: [{ produto_code: 'private' }] });
  await new Promise(resolve => setImmediate(resolve));
  const count = m.updates.length;
  m.viewer.current = 'second'; m.replies[1]({ data: [{ code: 'private' }] });
  await pending; assert.equal(m.updates.length, count);
});
