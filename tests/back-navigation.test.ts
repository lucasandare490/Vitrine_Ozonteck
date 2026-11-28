import assert from 'node:assert/strict';
import test from 'node:test';
import { backNavigationEvent, installBackHistory, navigateBack, previousScreenDelta } from '../lib/back-navigation.ts';

function browserFixture(modern = false, initial = '/?categoria=capilares#catalogo') {
  let url = new URL(initial, 'https://loja.example');
  let index = 0;
  const records = [{ url: url.href, state: { router: 'preserve' } as unknown }];
  const events = new EventTarget();
  const moves: number[] = [], replacements: string[] = [];
  const history = {
    get state() { return records[index].state; },
    pushState(state: unknown, _title: string, href?: string | URL | null) {
      url = new URL(href || url.href, url); records.splice(index + 1);
      records.push({ url: url.href, state }); index++;
    },
    replaceState(state: unknown, _title: string, href?: string | URL | null) {
      url = new URL(href || url.href, url); records[index] = { url: url.href, state };
    },
    go(delta: number) {
      moves.push(delta); index += delta; url = new URL(records[index].url);
      events.dispatchEvent(new Event('popstate'));
    },
  };
  const browser = {
    history, get location() { return url; },
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    ...(modern ? { navigation: {
      get currentEntry() { return { index, url: url.href }; },
      entries: () => records.map((record, index) => ({ index, url: record.url })),
    } } : {}),
  } as unknown as Window;
  const cleanup = installBackHistory(browser);
  return { browser, history, moves, replacements, cleanup, records,
    back: (fallback?: string) => navigateBack(browser, href => replacements.push(href), fallback),
    hash: (hash: string) => { history.pushState(history.state, '', hash); events.dispatchEvent(new Event('hashchange')); },
    nativeHash: (hash: string) => {
      url = new URL(hash, url); records.splice(index + 1); records.push({ url: url.href, state: history.state }); index++;
      events.dispatchEvent(new Event('popstate')); events.dispatchEvent(new Event('hashchange'));
    },
  };
}

for (const modern of [false, true]) {
  test(`back (${modern ? 'Navigation API' : 'legacy'}): cart returns to the exact product; product returns to filtered catalog`, () => {
    const b = browserFixture(modern);
    b.history.pushState({ router: 'product' }, '', '/produto/VISARIS');
    b.history.pushState({ router: 'cart' }, '', '/lista');
    b.back(); assert.equal(b.browser.location.pathname, '/produto/VISARIS');
    b.back(); assert.equal(b.browser.location.href, 'https://loja.example/?categoria=capilares#catalogo');
    assert.equal(b.replacements.length, 0); b.cleanup();
  });
  test(`back (${modern ? 'Navigation API' : 'legacy'}): ignores product anchors, filter edits and intermediate login`, () => {
    const b = browserFixture(modern);
    b.history.pushState({}, '', '/produto/VISARIS'); b.nativeHash('#details-title');
    b.history.pushState({}, '', '?view=details#reviews-title');
    b.history.pushState({}, '', '/login?redirect=private');
    b.history.pushState({}, '', '/produto/VISARIS');
    b.back(); assert.equal(b.browser.location.pathname, '/'); assert.deepEqual(b.moves, [-5]); b.cleanup();
  });
  test(`back (${modern ? 'Navigation API' : 'legacy'}): direct entry uses local fallback without leaving the store`, () => {
    const b = browserFixture(modern, '/lista'); b.back();
    assert.deepEqual(b.moves, []); assert.deepEqual(b.replacements, ['/#catalogo']); b.cleanup();
  });
  test(`back (${modern ? 'Navigation API' : 'legacy'}): replace, remount/reload, forward and branching preserve navigation`, () => {
    const b = browserFixture(modern); b.history.pushState({}, '', '/produto/A');
    b.history.replaceState({ router: 'updated' }, '', '/produto/B'); b.cleanup();
    const cleanup = installBackHistory(b.browser);
    b.history.pushState({}, '', '/lista'); b.back(); assert.equal(b.browser.location.pathname, '/produto/B');
    b.history.go(1); b.back(); b.history.pushState({}, '', '/suporte'); b.back();
    assert.equal(b.browser.location.pathname, '/produto/B'); cleanup();
  });
}

test('back: never traverses across an external entry to an older store visit', () => {
  const b = browserFixture(true); b.history.pushState({}, '', 'https://outside.example');
  b.history.pushState({}, '', 'https://loja.example/lista'); b.back();
  assert.deepEqual(b.moves, []); assert.deepEqual(b.replacements, ['/#catalogo']); b.cleanup();
});
test('back: checkout can consume return to move one step without navigating away', () => {
  const b = browserFixture(); b.history.pushState({}, '', '/lista');
  const consume = (event: Event) => event.preventDefault();
  b.browser.addEventListener(backNavigationEvent, consume); b.back();
  assert.deepEqual(b.moves, []); assert.deepEqual(b.replacements, []);
  b.browser.removeEventListener(backNavigationEvent, consume); b.back(); assert.equal(b.browser.location.pathname, '/'); b.cleanup();
});
test('back: fallback rejects external URLs and avoids returning to the same page', () => {
  const b = browserFixture(false, '/conta'); b.back('//outside.example'); b.back('/conta');
  assert.deepEqual(b.replacements, ['/', '/']); b.cleanup();
});
test('history tracking preserves router fields, omits URL queries, and cleans up without undoing newer wrappers', () => {
  const b = browserFixture(); b.history.pushState({ router: 'keep' }, '', '/produto/A?token=secret');
  assert.equal((b.history.state as { router: string }).router, 'keep');
  assert.doesNotMatch(JSON.stringify(b.history.state), /secret|token|categoria/);
  const newer = b.history.pushState.bind(b.history); b.history.pushState = newer; b.cleanup();
  assert.equal(b.history.pushState, newer);
  b.history.pushState({ untouched: true }, '', '/conta'); assert.deepEqual(b.history.state, { untouched: true });
});
test('previous screen falls back for unknown/only current screens and skips authentication paths', () => {
  assert.equal(previousScreenDelta([], '/lista'), null);
  assert.equal(previousScreenDelta(['/lista', '/login', '/auth/callback'], '/lista'), null);
  assert.equal(previousScreenDelta(['/conta', '/conta/dados'], '/lista'), -1);
});
