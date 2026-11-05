import test from 'node:test';
import assert from 'node:assert/strict';
import { estimatePasswordStrength } from '../lib/password-strength.ts';
import { getPasswordValidationError } from '../lib/auth.ts';

test('password guidance is absent before typing and never changes existing validity', () => {
  assert.equal(estimatePasswordStrength(''), null);
  for (const value of ['a', '12345678', 'senha123', 'exemplo-longo-de-frase']) {
    const before = getPasswordValidationError(value);
    estimatePasswordStrength(value);
    assert.equal(getPasswordValidationError(value), before);
  }
  assert.equal(getPasswordValidationError('12345678'), null);
});

test('common passwords, repeated text and predictable sequences remain weak', () => {
  for (const value of ['12345678', 'senha123!', 'Password123!', 'qwertyuiop', 'aaaaaaaaAAAA1111!!!!', 'abcdabcdabcdabcdabcd', 'Abcdefghijklmnopqrstuvwxyz', 'passwordpasswordpassword', 'abcdeabcdeabcdeabcdeabcde', 'qwertyuiopqwertyuiopqwertyuiop']) {
    assert.equal(estimatePasswordStrength(value)?.level, 1, value);
  }
});

test('long passphrases can score highly without mandatory symbols or uppercase', () => {
  assert.equal(estimatePasswordStrength('nuvem bosque farol caminho sereno')?.level, 4);
  assert.equal(estimatePasswordStrength('café floresta janela azul')?.level, 4);
  assert.equal(estimatePasswordStrength('vermelho73')?.level, 2);
  assert.equal(estimatePasswordStrength('Jardim!73Nuvem')?.level, 3);
});

test('estimates are bounded and deterministic for long unicode or whitespace input', () => {
  for (const value of ['     ', '🌳'.repeat(2000), 'z'.repeat(10000), 'さくら 山 風 青い 空']) {
    const result=estimatePasswordStrength(value);
    assert.ok(result && result.level>=1 && result.level<=4);
    assert.deepEqual(estimatePasswordStrength(value), result);
  }
});

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const strengthExports: { default?: (props: {password:string;id:string}) => unknown } = {};
vm.runInNewContext(ts.transpileModule(readFileSync('components/PasswordStrength.tsx','utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX},
}).outputText, { exports:strengthExports,require:(name:string)=>name==='@/lib/password-strength'?{estimatePasswordStrength}:require(name) });

test('meter renders live guidance only, never exposes the password or adds a required control', () => {
  const React = require('react'),{renderToStaticMarkup}=require('react-dom/server');
  const render=(password:string)=>renderToStaticMarkup(React.createElement(strengthExports.default,{password,id:'guidance'}));
  assert.equal(render(''),'');
  const weak=render('senha123!');
  assert.match(weak,/Fraca/); assert.match(weak,/aria-live="polite"/);
  assert.match(weak,/Não é preciso atingir um nível/);
  assert.doesNotMatch(weak,/senha123!|<input|<button|aria-invalid|required=/);
  assert.match(render('nuvem bosque farol caminho sereno'),/Forte/);
});
