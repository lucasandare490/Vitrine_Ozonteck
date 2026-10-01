import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesPerfumeryVolume } from '../lib/perfumery-filter.ts';

test('keeps confirmed perfume presentations separate', () => {
  assert.equal(matchesPerfumeryVolume('PERF-CIND', '17'), true);
  assert.equal(matchesPerfumeryVolume('PERF-CIND', '100'), false);
  assert.equal(matchesPerfumeryVolume('P100-CIND', '100'), true);
  assert.equal(matchesPerfumeryVolume('P100-CIND', '17'), false);
});

test('Virginia products and unknown presentations remain only in all', () => {
  for (const code of ['PERF-FER-VE', 'PERF-LUA-VE', 'PERF-UNKNOWN']) {
    assert.equal(matchesPerfumeryVolume(code, 'all'), true);
    assert.equal(matchesPerfumeryVolume(code, '17'), false);
    assert.equal(matchesPerfumeryVolume(code, '100'), false);
  }
});
