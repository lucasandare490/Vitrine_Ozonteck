// Repeatable LOCAL checks only. Never deploys, migrates a remote DB, sends mail or charges.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const integrationsOnly = args.includes('--integration-only');
const outputIndex = args.indexOf('--output');
if (args.some((arg, index) => arg !== '--integration-only' && arg !== '--output' && !(outputIndex >= 0 && index === outputIndex + 1))
  || (outputIndex >= 0 && (!args[outputIndex + 1] || args[outputIndex + 1].startsWith('--')))) throw new Error('Unknown verification argument');
const startedAt = new Date().toISOString();
const directory = resolve(root, outputIndex >= 0 ? args[outputIndex + 1] : `tmp/release-check-${startedAt.replace(/[:.]/g, '-')}`);
const outputRelative = relative(root, directory);
if (!outputRelative || outputRelative.startsWith('..') || isAbsolute(outputRelative)) throw new Error('Evidence directory must be inside the project');
mkdirSync(directory, { recursive: true });
const pglite = fileURLToPath(import.meta.resolve('@electric-sql/pglite'));
const sql = [
  ['address-database', 'check-saved-addresses.mjs'],
  ['category-audit', 'check-category-audit.mjs'],
  ['product-import', 'check-product-import.mjs'],
  ['interested-customers', 'check-join-interests.mjs'],
  ['admin-reminders', 'check-admin-reminders.mjs'],
  ['support', 'check-support-tickets.mjs'],
  ['pickup-ready', 'check-pickup-ready.mjs'],
  ['email-queue', 'check-email-outbox.mjs'],
  ['rate-limit', 'check-database-rate-limit.mjs'],
  ['benefit-pricing', 'test-affiliate-pricing-sql.mjs', pglite],
  ['purchase-changes', 'test-order-changes-sql.mjs', pglite],
  ['payment-stock', 'test-payment-stock-sql.mjs', pglite],
].map(([id, script, ...params]) => ({ id, argv: [`scripts/${script}`, ...params] }));
const steps = integrationsOnly ? sql : [
  { id: 'unit', argv: ['--test', '--experimental-strip-types', ...readdirSync(join(root, 'tests')).filter(file => file.endsWith('.test.ts')).map(file => `tests/${file}`)] },
  { id: 'components', argv: ['--test', ...['check-admin-list-races', 'check-support-draft-races', 'check-customer-benefit-control', 'check-admin-pricing', 'check-saved-address-screen', 'check-mobile-pwa-controls'].map(file => `scripts/${file}.mjs`)] },
  { id: 'form-labels', argv: ['scripts/check-form-labels.mjs'] },
  ...sql,
  { id: 'changed-code-lint', argv: ['node_modules/eslint/bin/eslint.js', 'app', 'components', 'lib/mobile-navigation.ts', 'lib/back-navigation.ts', 'lib/dialog-focus.ts', 'lib/pwa-install.ts', 'public/sw.js', 'next.config.ts', 'scripts/check-admin-pricing.mjs', 'scripts/check-saved-address-screen.mjs', 'scripts/check-saved-addresses.mjs', 'scripts/check-release.mjs', 'scripts/apply-continuity-migrations.mjs', 'scripts/check-mobile-pwa-controls.mjs', 'scripts/generate-app-icons.mjs'] },
  { id: 'production-build', argv: ['node_modules/next/dist/bin/next', 'build', '--webpack'] },
];
const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
const report = {
  startedAt, mode: integrationsOnly ? 'local-sql-only' : 'local-release-check',
  revision: git.status === 0 ? git.stdout.trim() : null,
  trackedChanges: spawnSync('git', ['diff', '--quiet', 'HEAD'], { cwd: root }).status !== 0,
  localChecksPassed: false, productionReady: false,
  boundary: 'No UI/browser proof, external provider validation, live database migration, deployment or delivery is certified by this local run.',
  checksRequiringSeparateEvidence: ['Visual and keyboard review in the browser', 'Verify migrations in the target database (this runner does not inspect it)', 'Deploy and verify the exact published revision', 'Public checkout/provider/webhook/stock/scheduled-email journey', 'Debit restriction and boleto settlement', 'Commercial approvals and Visaris label/manufacturer documentation', 'Google processing and historical supporting records'],
  sourceHashes: {}, steps: [],
};
for (const file of ['components/AdminPricing.tsx', 'app/conta/enderecos/page.tsx', 'supabase/migrations/202611270001_primary_address_switch.sql', 'scripts/check-release.mjs', 'package.json', 'components/MobileNavigation.tsx', 'components/BackButton.tsx', 'components/BackNavigation.tsx', 'components/CheckoutBackNavigation.tsx', 'lib/mobile-navigation.ts', 'lib/dialog-focus.ts', 'components/AppDialog.tsx', 'components/BottomSheet.tsx', 'components/AppRuntime.tsx', 'components/ProductActions.tsx', 'app/manifest.ts', 'public/sw.js', 'app/globals.css']) {
  report.sourceHashes[file] = createHash('sha256').update(readFileSync(join(root, file))).digest('hex');
}
const environment = { ...process.env };
delete environment.SEO_TEST_BASE_URL; // Local unit run must not silently become a public HTTP probe.
for (const step of steps) {
  const begin = Date.now();
  const result = spawnSync(process.execPath, step.argv, { cwd: root, env: environment, encoding: 'utf8', timeout: 240000, maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  const log = `${step.id}.log`;
  const content = `${result.stdout || ''}${result.stderr || ''}`.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd();
  writeFileSync(join(directory, log), content ? content + '\n' : '');
  report.steps.push({ id: step.id, passed: result.status === 0 && !result.error, exitCode: result.status, durationMs: Date.now() - begin, log, executionError: result.error?.code || null });
  writeFileSync(join(directory, 'result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(`${step.id}: ${result.status === 0 && !result.error ? 'PASS' : 'FAIL'} (${Date.now() - begin}ms)`);
}
report.completedAt = new Date().toISOString();
report.localChecksPassed = report.steps.every(step => step.passed);
writeFileSync(join(directory, 'result.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`Local result: ${report.localChecksPassed ? 'PASS' : 'FAIL'}. Production ready: NOT CERTIFIED. Evidence: ${outputRelative}`);
if (!report.localChecksPassed) process.exitCode = 1;
