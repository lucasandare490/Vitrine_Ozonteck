import test from 'node:test';
import assert from 'node:assert/strict';
import { mountCardFields } from '../lib/secure-card-fields.ts';

test('CVV illustration follows only the documented securityCode focus and blur events', () => {
  const callbacks: Record<string, Record<string, (event: object) => void>> = {};
  const removed: string[] = [], focus: boolean[] = [];
  const session = mountCardFields({ create(name) {
    callbacks[name] = {};
    return { on: (event, callback) => { callbacks[name][event] = callback; }, mount() {}, unmount() { removed.push(name); }, update() {} };
  } }, 'card', { ready() {}, valid() {}, bin() {}, error() {}, cvvFocus: value => focus.push(value) });
  assert.equal(callbacks.cardNumber.focus, undefined);
  callbacks.securityCode.focus({}); callbacks.securityCode.blur({});
  assert.deepEqual(focus, [true, false]);
  session.unmount(); callbacks.securityCode.focus({});
  assert.deepEqual(focus, [true, false]);
  assert.equal(removed.length, 3);
});

test('mount failure cleans all created fields', () => {
  let cleanups = 0;
  assert.throws(() => mountCardFields({ create() { return { mount() { throw new Error('fixture'); }, unmount() { cleanups++; }, on() {}, update() {} }; } }, 'card', { ready() {}, valid() {}, bin() {}, error() {}, cvvFocus() {} }));
  assert.equal(cleanups, 1);
});

test('only documented BIN metadata and validity flags leave protected fields', () => {
  const callbacks: Record<string, Record<string, (event: object) => void>> = {};
  const bins: string[] = [], validity: boolean[] = [];
  const session = mountCardFields({ create(name) {
    callbacks[name] = {};
    return { mount() {}, unmount() {}, update() {}, on: (event, callback) => { callbacks[name][event] = callback; } };
  } }, 'card', { ready() {}, error() {}, cvvFocus() {}, bin: value => bins.push(value), valid: (_field, value) => validity.push(value) });
  callbacks.cardNumber.binChange({ bin: '123456' });
  callbacks.cardNumber.binChange({ bin: '1234567890123456' });
  callbacks.securityCode.validityChange({ errorMessages: [] });
  callbacks.securityCode.validityChange({ errorMessages: [{ cause: 'invalid_length' }] });
  assert.deepEqual(bins, ['123456', '']); assert.deepEqual(validity, [true, false]);
  session.unmount();
});
