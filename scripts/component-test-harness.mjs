// Executes real TSX in memory: no DOM, browser, network, or application imports.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { setImmediate } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
export const flushAsync = () => setImmediate();
export function elements(tree, type) {
  if (!tree || typeof tree !== 'object') return [];
  if (Array.isArray(tree)) return tree.flatMap(node => elements(node, type));
  if (typeof tree.type === 'function' && tree.type.name === 'Pagination') return elements(tree.type(tree.props), type);
  return [...(!type || tree.type === type ? [tree] : []), ...elements(tree.props?.children, type)];
}

export function createComponentHarness(path, { supabase, imports = {}, window: windowOverrides = {}, env = {} }) {
  const slots = [], timeouts = new Map(), intervals = new Map(), listeners = new Map();
  let cursor = 0, pendingEffects = [], timerId = 0, mounted = true, updatesAfterUnmount = 0;
  const sameDeps = (before, after) => before && after && before.length === after.length
    && before.every((value, index) => Object.is(value, after[index]));
  const hooks = {
    useId() { const index = cursor++; slots[index] ||= { value: `:test-${index}:` }; return slots[index].value; },
    useState(initial) {
      const index = cursor++;
      slots[index] ||= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, value => {
        if (!mounted) { updatesAfterUnmount++; return; }
        slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
      }];
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ||= { value: { current: initial } };
      return slots[index].value;
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value;
    },
    useEffect(create, deps) {
      const index = cursor++;
      if (!sameDeps(slots[index]?.deps, deps)) pendingEffects.push({ index, create, deps });
    },
  };
  const timers = {
    setTimeout(callback) { const id = ++timerId; timeouts.set(id, callback); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    setInterval(callback) { const id = ++timerId; intervals.set(id, callback); return id; },
    clearInterval(id) { intervals.delete(id); },
  };
  const window = {
    ...timers,
    ...windowOverrides,
    addEventListener(event, callback) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(callback);
    },
    removeEventListener(event, callback) { listeners.get(event)?.delete(callback); },
  };
  const exports = {};
  const source = readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } });
  runInNewContext(outputText, {
    exports, module: { exports }, ...timers, window, document: { hidden: false },
    crypto: { randomUUID }, console, process: { env },
    require(name) {
      if (Object.hasOwn(imports, name)) return imports[name];
      if (name === 'react') return hooks;
      if (name === 'react/jsx-runtime') return require(name);
      if (name === '@/lib/supabase') return { supabase };
      if (name === 'next/link') return { __esModule: true, default: 'a' };
      throw new Error(`Provide an explicit test double for ${name}`);
    },
  }, { filename: path });
  return {
    render(props = {}) {
      if (!mounted) throw new Error('Cannot render an unmounted component');
      cursor = 0; pendingEffects = [];
      const tree = exports.default(props);
      // Commit dependency changes: clean up old effects before creating new ones.
      for (const effect of pendingEffects) slots[effect.index]?.cleanup?.();
      for (const effect of pendingEffects) {
        slots[effect.index] = { deps: effect.deps, cleanup: effect.create() };
      }
      return tree;
    },
    flushTimeouts() {
      const callbacks = [...timeouts.values()]; timeouts.clear();
      callbacks.forEach(callback => callback());
    },
    poll() { [...intervals.values()].forEach(callback => callback()); },
    dispatchWindowEvent(event) { listeners.get(event)?.forEach(callback => callback()); },
    unmount() {
      for (const slot of slots) slot?.cleanup?.();
      mounted = false;
    },
    get updatesAfterUnmount() { return updatesAfterUnmount; },
  };
}
