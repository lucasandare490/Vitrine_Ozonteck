/** Page-level return navigation. Checkout steps may consume the cancelable event. */
export const backNavigationEvent = 'ozonteck:back';
const stateKey = 'ozonteckNavigation';
type Entry = { key: string; previous: string[] };
type NavigationEntry = { index: number; url: string | null };
type Browser = Window & { navigation?: { currentEntry: NavigationEntry | null; entries(): NavigationEntry[] } };

function entry(state: unknown): Entry | null {
  const value = (state as Record<string, unknown> | null)?.[stateKey] as Entry | undefined;
  return value && typeof value.key === 'string' && Array.isArray(value.previous)
    && value.previous.length <= 100 && value.previous.every(path => typeof path === 'string' && path.startsWith('/') && !path.startsWith('//')) ? value : null;
}
function transient(path: string) { return /^\/(?:login|auth)(?:\/|$)/.test(path); }

/** Negative history delta to the previous screen, skipping anchors/filter edits and login redirects. */
export function previousScreenDelta(paths: string[], currentPath: string): number | null {
  for (let index = paths.length - 1; index >= 0; index--) {
    if (paths[index] !== currentPath && !transient(paths[index])) return index - paths.length;
  }
  return null;
}

export function backDelta(browser: Browser): number | null {
  const navigation = browser.navigation;
  if (navigation?.currentEntry) {
    const current = navigation.currentEntry.index;
    const entries = new Map(navigation.entries().map(item => [item.index, item]));
    for (let index = current - 1; index >= 0; index--) {
      const url = entries.get(index)?.url;
      // Never cross an unknown or external history entry to reach an older store visit.
      if (!url) return null;
      const destination = new URL(url, browser.location.href);
      if (destination.origin !== browser.location.origin) return null;
      if (destination.pathname !== browser.location.pathname && !transient(destination.pathname)) return index - current;
    }
    return null;
  }
  return previousScreenDelta(entry(browser.history.state)?.previous || [], browser.location.pathname);
}

/** Fallback for older browsers. Uses only public History APIs and preserves all router state.
 * Stores pathnames only in each history entry; no query strings, credentials or commercial data.
 */
export function installBackHistory(browser: Window): () => void {
  const history = browser.history;
  const push = history.pushState, replace = history.replaceState;
  let active = true, serial = 0;
  let lastHref = browser.location.href;
  const makeEntry = (previous: string[]): Entry => ({ key: `${Date.now()}-${++serial}`, previous: previous.slice(-100) });
  const merge = (state: unknown, value: Entry) => ({ ...(state && typeof state === 'object' ? state : {}), [stateKey]: value });
  if (!entry(history.state)) replace.call(history, merge(history.state, makeEntry([])), '');
  let lastKey = entry(history.state)?.key;
  const update = () => { lastHref = browser.location.href; lastKey = entry(history.state)?.key; };
  const wrappedPush: History['pushState'] = function (this: History, state, title, url) {
    if (!active) return push.call(this, state, title, url);
    const previous = [...(entry(history.state)?.previous || []), browser.location.pathname];
    push.call(this, merge(state, makeEntry(previous)), title, url); update();
  };
  const wrappedReplace: History['replaceState'] = function (this: History, state, title, url) {
    if (!active) return replace.call(this, state, title, url);
    replace.call(this, merge(state, entry(history.state) || makeEntry([])), title, url); update();
  };
  history.pushState = wrappedPush; history.replaceState = wrappedReplace;
  const onTraverse = () => {
    // Native fragment links copy the current state into a new entry. Give it its own identity.
    if (lastHref !== browser.location.href && entry(history.state)?.key === lastKey) {
      const previous = [...(entry(history.state)?.previous || []), new URL(lastHref).pathname];
      replace.call(history, merge(history.state, makeEntry(previous)), '');
    }
    update();
  };
  browser.addEventListener('popstate', onTraverse);
  browser.addEventListener('hashchange', onTraverse);
  return () => {
    active = false;
    if (history.pushState === wrappedPush) history.pushState = push;
    if (history.replaceState === wrappedReplace) history.replaceState = replace;
    browser.removeEventListener('popstate', onTraverse); browser.removeEventListener('hashchange', onTraverse);
  };
}

export function navigateBack(browser: Browser, replace: (href: string) => void, fallback = '/#catalogo'): void {
  if (!browser.dispatchEvent(new Event(backNavigationEvent, { cancelable: true }))) return;
  const delta = backDelta(browser);
  if (delta !== null) { browser.history.go(delta); return; }
  // Fallbacks are local paths supplied by the screen, never arbitrary redirect URLs.
  const destination = new URL(fallback, browser.location.href);
  replace(destination.origin === browser.location.origin && destination.pathname !== browser.location.pathname
    ? `${destination.pathname}${destination.search}${destination.hash}` : '/');
}
