import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

// Execute the real diagnostic catch without imports, credentials, API or database access.
const source = ts.createSourceFile('provider.mjs', readFileSync('scripts/check-orders-sandbox-provider.mjs', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
let block = '';
function visit(node: ts.Node) {
  if (ts.isCatchClause(node) && node.block.getText(source).includes("record.result = 'failed'")) block = node.block.getText(source);
  ts.forEachChild(node, visit);
}
visit(source);
function diagnose(error: unknown) {
  const record: Record<string, unknown> = {};
  runInNewContext(`(function(error, record) ${block})(error, record)`, { error, record });
  return JSON.parse(JSON.stringify(record));
}
test('provider diagnostics: SDK object errors retain documented refusal codes', () => {
  const result = diagnose({ status: 400, errors: [{ code: 'payment_method_not_allowed_for_collector' }], message: 'Full response should not be logged' });
  assert.equal(result.httpStatus, 400); assert.equal(result.result, 'failed');
  assert.deepEqual(result.codes, ['payment_method_not_allowed_for_collector']);
});
test('provider diagnostics: unknown/null errors stay safe without leaking message or nested payer information', () => {
  assert.equal(diagnose(null).error, 'CHECK_FAILED');
  const result = diagnose({ status: 400, message: 'owner@example.invalid secret', data: { payer: { email: 'owner@example.invalid' }, errors: [{ code: 'bad_request' }] } });
  assert.doesNotMatch(JSON.stringify(result), /owner@|payer|secret/); assert.deepEqual(result.codes, ['bad_request']);
});
test('provider diagnostics: unexpected token, identity and response values are excluded', () => {
  const result = diagnose({ status: 400, codes: ['APP_USR_private_secret', 'TEST-private-secret', 'eyJabcdef', 'owner@example.invalid', 12345678909, 'abcdefabcdefabcdefabcdefabcdef', 'valid_provider_code'] });
  assert.deepEqual(result.codes, ['valid_provider_code']);
});
test('provider diagnostics: an empty output option refuses execution and preserves historical evidence', () => {
  const path = 'docs/payment-provider-test-2026-11-05.json';
  const before = readFileSync(path);
  const result = spawnSync(process.execPath, ['scripts/check-orders-sandbox-provider.mjs', '--output='], { encoding: 'utf8', timeout: 15000, windowsHide: true });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /OUTPUT_PATH_REQUIRED/);
  assert.deepEqual(readFileSync(path), before);
});
