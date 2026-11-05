import assert from 'node:assert/strict';
import test from 'node:test';
import { pageWindow } from '../lib/pagination.ts';
import { paginationModule } from '../scripts/pagination-test-renderer.mjs';
import { elements } from '../scripts/component-test-harness.mjs';

test('pagination keeps first, last and nearby pages without allocating every page', () => {
  assert.deepEqual(pageWindow(1, 10), [1, 2, 10]);
  assert.deepEqual(pageWindow(5, 10), [1, 4, 5, 6, 10]);
  assert.deepEqual(pageWindow(10, 10), [1, 9, 10]);
  assert.deepEqual(pageWindow(1000000, 1000000), [1, 999999, 1000000]);
});

test('shared control blocks unavailable pages and preserves server pagination without invented totals', () => {
  const render = (paginationModule as { default: (props: { page: number; totalPages?: number; hasNext?: boolean; busy?: boolean; onChange: (next: number) => void }) => unknown }).default;
  const calls: number[] = [];
  type ButtonNode = { props: { 'aria-label': string; disabled: boolean; onClick: () => void } };
  let buttons = elements(render({ page: 1, hasNext: false, onChange: next => calls.push(next) }), 'button') as ButtonNode[];
  assert.equal(buttons.find(button => button.props['aria-label'] === 'Página anterior')!.props.disabled, true);
  assert.equal(buttons.find(button => button.props['aria-label'] === 'Próxima página')!.props.disabled, true);
  buttons = elements(render({ page: 2, hasNext: true, onChange: next => calls.push(next) }), 'button');
  buttons.find(button => button.props['aria-label'] === 'Próxima página')!.props.onClick();
  buttons.find(button => button.props['aria-label'] === 'Página anterior')!.props.onClick();
  assert.deepEqual(calls, [3, 1]);
  const busy = elements(render({ page: 2, totalPages: 10, busy: true, onChange: next => calls.push(next) }), 'button');
  for (const button of busy) { assert.equal(button.props.disabled, true); button.props.onClick(); }
  assert.deepEqual(calls, [3, 1]);
});

test('pagination clamps invalid input and never creates duplicate or unreachable buttons', () => {
  assert.deepEqual(pageWindow(-10, 3), [1, 2, 3]);
  assert.deepEqual(pageWindow(30, 3), [1, 2, 3]);
  assert.deepEqual(pageWindow(NaN, 0), [1]);
  for (let total = 1; total < 50; total++) for (let page = 1; page <= total; page++) {
    const values = pageWindow(page, total);
    assert.equal(new Set(values).size, values.length);
    assert.ok(values.includes(page));
    assert.ok(values.length <= 5);
    assert.ok(values.every(value => value >= 1 && value <= total));
  }
});
