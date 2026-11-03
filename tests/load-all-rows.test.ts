import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAllRows } from '../lib/load-all-rows.ts';

test('reads beyond API page limits without losing historical orders', async () => {
  const source = Array.from({ length: 1103 }, (_, id) => ({ id }));
  const result = await loadAllRows(async (from, to) => ({ data: source.slice(from, to + 1), error: null }));
  assert.deepEqual(result.data, source);
  assert.equal(result.error, null);
});

test('does not expose a partial report when a later page fails', async () => {
  const result = await loadAllRows(async from => from === 0
    ? { data: Array.from({ length: 500 }, (_, id) => ({ id })), error: null }
    : { data: null, error: { message: 'unavailable' } });
  assert.equal(result.data, null);
  assert.equal(result.error?.message, 'unavailable');
});
