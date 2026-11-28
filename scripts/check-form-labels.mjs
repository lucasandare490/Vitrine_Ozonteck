// Source association check only. Not a browser/screen-reader or WCAG certification.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) walk(file); else if (file.endsWith('.tsx')) files.push(file);
  }
}
walk('app'); walk('components');
const missing = [], routes = [];
let controls = 0;
for (const file of files) {
  const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const labels = new Set();
  function labelScan(node) {
    if (ts.isJsxAttribute(node) && node.name.getText(source) === 'htmlFor' && node.initializer) labels.add(node.initializer.getText(source));
    ts.forEachChild(node, labelScan);
  }
  labelScan(source);
  function scan(node) {
    if ((ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) && ['input', 'select', 'textarea'].includes(node.tagName.getText(source))) {
      controls++;
      const attr = name => node.attributes.properties.find(attribute => attribute.name?.getText(source) === name);
      let ancestor = node.parent, wrapped = false;
      while (ancestor) { if (ts.isJsxElement(ancestor) && ancestor.openingElement.tagName.getText(source) === 'label') { wrapped = true; break; } ancestor = ancestor.parent; }
      const hidden = attr('type')?.initializer?.getText(source) === '"hidden"';
      const id = attr('id')?.initializer?.getText(source);
      if (!hidden && !wrapped && !attr('aria-label') && !attr('aria-labelledby') && !(id && labels.has(id))) {
        missing.push({ file, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1 });
      }
    }
    ts.forEachChild(node, scan);
  }
  scan(source);
  if (file.endsWith('page.tsx')) {
    const route = '/' + relative('app', file).replaceAll('\\', '/').replace(/\/?page\.tsx$/, '');
    routes.push({ route, file, inspection: 'Source structure and shared shell; browser validation separate', mobileNavigation: route.startsWith('/admin') ? 'Administrative shortcuts and menu' : 'Store header and primary destinations' });
  }
}
const report = { checkedAt: new Date().toISOString(), scope: 'Static JSX label association across app/components; excludes provider-owned iframe inputs; no browser or participant evidence', controls, missing, routes };
if (process.argv[2]) {
  const output = resolve(process.argv[2]);
  if (!output.startsWith(resolve('docs') + '/') && !output.startsWith(resolve('docs') + '\\') && !output.startsWith(resolve('tmp') + '/') && !output.startsWith(resolve('tmp') + '\\')) throw new Error('Output must be under docs or tmp');
  writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
}
console.log(`Static form check: ${controls} declarations, ${missing.length} missing associations, ${routes.length} page routes. Browser and assistive technology validation remain separate.`);
if (missing.length) { console.error(JSON.stringify(missing)); process.exitCode = 1; }
