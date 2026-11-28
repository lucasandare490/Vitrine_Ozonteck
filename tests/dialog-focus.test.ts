import test from 'node:test';
import assert from 'node:assert/strict';
import { keepDialogFocus } from '../lib/dialog-focus.ts';

function fixture(active: number, shiftKey = false, empty = false) {
  const focused: string[] = [];
  const first = { tabIndex: 0, getClientRects: () => [{}], focus: () => focused.push('first') };
  const middle = { ...first, focus: () => focused.push('middle') };
  const last = { ...first, focus: () => focused.push('last') };
  const hidden = { ...first, getClientRects: () => [], focus: () => focused.push('hidden') };
  const dialog = { ownerDocument: { activeElement: [first, middle, last][active] }, querySelectorAll: () => empty ? [] : [hidden, first, middle, last], focus: () => focused.push('dialog') };
  let prevented = false;
  return { focused, run: (key = 'Tab') => keepDialogFocus({ key, shiftKey, preventDefault: () => { prevented = true; } }, dialog as unknown as HTMLDialogElement), prevented: () => prevented };
}
test('modal focus: Shift+Tab on the first field returns to the last visible field', () => {
  const m = fixture(0, true); m.run(); assert.deepEqual(m.focused, ['last']); assert.equal(m.prevented(), true);
});
test('modal focus: Tab on the last field returns to the first visible field', () => {
  const m = fixture(2); m.run(); assert.deepEqual(m.focused, ['first']); assert.equal(m.prevented(), true);
});
test('modal focus: regular editing and interior Tab keep native behavior', () => {
  const m = fixture(1); m.run(); m.run('ArrowRight'); assert.deepEqual(m.focused, []); assert.equal(m.prevented(), false);
});
test('modal focus: a modal without available controls retains focus safely', () => {
  const m = fixture(0, false, true); m.run(); assert.deepEqual(m.focused, ['dialog']); assert.equal(m.prevented(), true);
});
