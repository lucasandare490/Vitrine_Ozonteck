// Load the real, stateless pagination for parent-component interaction tests.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function compile(path, dependencies = {}) {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText, { exports, require: name => dependencies[name] ?? require(name) });
  return exports;
}
export const paginationModule = compile('components/Pagination.tsx', {
  '@/lib/pagination': compile('lib/pagination.ts'),
});
