// Explicit provider-only homologation. Never loads .env or accesses the shop DB.
// The test-user tag is verified before any write; production keys are not accepted.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { resolve, relative, dirname } from 'node:path';
import { MercadoPagoConfig, Order } from 'mercadopago';
const require = createRequire(import.meta.url);
const ts = require('typescript');
// A dated output allows a fresh, narrow recheck without rewriting historical evidence.
const outputOption = process.argv.find(arg => arg.startsWith('--output='));
const outputArgument = outputOption?.slice(9);
if (outputOption !== undefined && !outputArgument) throw new Error('OUTPUT_PATH_REQUIRED');
const output = outputArgument || 'docs/payment-provider-test-2026-11-05.json';
if (outputArgument) {
  const path = relative(resolve('docs'), resolve(outputArgument));
  if (!path || path.startsWith('..') || /^[A-Za-z]:|^[/\\]/.test(path) || !path.endsWith('.json')) throw new Error('OUTPUT_MUST_BE_A_JSON_FILE_UNDER_DOCS');
  await mkdir(dirname(resolve(outputArgument)), { recursive: true });
  try { await writeFile(outputArgument, JSON.stringify({ status: 'not_started', productionPaymentsAllowed: false }) + '\n', { flag: 'wx' }); } catch { throw new Error('FRESH_OUTPUT_FILE_REQUIRED'); }
}
const config = parseEnv(await readFile('.env.orders-test.local', 'utf8'));
const exported = {};
vm.runInNewContext(ts.transpileModule(await readFile('lib/server/mercado-pago-orders.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports: exported, URL, Date });
const creation={};
vm.runInNewContext(ts.transpileModule(await readFile('lib/server/orders-creation.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:creation});
const api = async (path, { body, publicKey = false, method = body ? 'POST' : 'GET', idempotencyKey } = {}) => {
  const response = await fetch('https://api.mercadopago.com' + path, {
    method, headers: { 'Content-Type': 'application/json',
      ...(!publicKey ? { Authorization: 'Bearer ' + config.ORDERS_TEST_ACCESS_TOKEN } : {}),
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
    }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error('PROVIDER_REJECTED_REQUEST');
    error.httpStatus = response.status;
    error.codes = Array.isArray(data.errors) ? data.errors.map(item => item.code).filter(x => typeof x === 'string' || typeof x === 'number') : [data.error || data.code].filter(Boolean);
    error.bodyKeys=Object.keys(data);
    const identifiers=[];
    const inspect=(value,path=[])=>{if(typeof value==='string'&&/^ORDTST[A-Z0-9]+$/.test(value))identifiers.push({path:path.join('.'),id:value});else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value))inspect(item,[...path,key]);};
    inspect(data);error.testOrderIdentifiers=identifiers;
    throw error;
  }
  return data;
};
if (!config.ORDERS_TEST_ACCESS_TOKEN || !config.ORDERS_TEST_PUBLIC_KEY || !/^\d+$/.test(config.ORDERS_TEST_APPLICATION_ID || '')) throw new Error('EXPLICIT_TEST_CONFIGURATION_REQUIRED');
const seller = await api('/users/me');
if (!seller.tags?.includes('test_user') || seller.site_id !== 'MLB') throw new Error('REFUSING_NON_TEST_SELLER');
if (config.ORDERS_TEST_ACCESS_TOKEN.match(/^APP_USR-(\d+)-/)?.[1] !== config.ORDERS_TEST_APPLICATION_ID) throw new Error('TEST_APPLICATION_CONFIGURATION_MISMATCH');
const ordersClient=new Order(new MercadoPagoConfig({accessToken:config.ORDERS_TEST_ACCESS_TOKEN,options:{timeout:15000,retries:1}}));
let previous;
if (!outputArgument) try { previous=JSON.parse(await readFile(output,'utf8')); } catch { /* First run. */ }
const report = { date: new Date().toISOString(), environment: 'test', testSellerConfirmed: true,
  scope: 'Real provider sandbox requests using the shop request builder and normalizer. No shop DB, customer messages or real payments.', cases: [] };
report.attempts=previous ? [...(previous.attempts || []),{date:previous.date,cases:previous.cases}] : [];
const scenarios = [
  { name: 'pix', method: 'pix', holder: 'APRO', total: 5000 },
  { name: 'boleto', method: 'boleto', holder: 'APRO', total: 999 },
  { name: 'credit-approved', method: 'credit_card', holder: 'APRO-AUTH', number: '5480832801033311', cardId: 'master', total: 999 },
  { name: 'credit-rejected', method: 'credit_card', holder: 'OTHE-NAUT', number: '5480832801033311', cardId: 'master', total: 999 },
  { name: 'credit-challenge-approved', method: 'credit_card', holder: 'APRO-CHOK', number: '5480832801033311', cardId: 'master', total: 999 },
  { name: 'credit-challenge-rejected', method: 'credit_card', holder: 'OTHE-CHNO', number: '5480832801033311', cardId: 'master', total: 999 },
  { name: 'debit-approved', method: 'debit_card', holder: 'APRO', number: '5067766783888311', cardId: 'debelo', total: 999 },
];
await mkdir('sandbox-runtime', { recursive: true });
const selected=process.argv.find(arg=>arg.startsWith('--case='))?.slice(7);
if(selected && !scenarios.some(scenario=>scenario.name===selected))throw new Error('UNKNOWN_TEST_SCENARIO');
const existingCase=name=>previous?.cases?.find(item=>item.scenario===name)
  || [...(previous?.attempts || [])].reverse().flatMap(attempt=>attempt.cases).find(item=>item.scenario===name);
for (const scenario of scenarios) {
  if (selected && scenario.name!==selected) { const existing=existingCase(scenario.name);if(existing)report.cases.push(existing);continue; }
  const reference = randomUUID();
  const record = { scenario: scenario.name, method: scenario.method, amount:scenario.total/100,reference, result: 'not_started' };
  try {
    let card;
    if (scenario.number) {
      // Only official, hard-coded fictitious test cards. No real card inputs accepted.
      const token = await api('/v1/card_tokens?public_key=' + encodeURIComponent(config.ORDERS_TEST_PUBLIC_KEY), {
        publicKey: true, body: { card_number: scenario.number, expiration_month: 11, expiration_year: 2030,
          security_code: '123', cardholder: { name: scenario.holder, identification: { type: 'CPF', number: '12345678909' } } },
      });
      // Token creation itself may report live_mode:true even with the panel's
      // test public key. Settlement uses exclusively the verified test seller.
      if (!token.id || token.public_key !== config.ORDERS_TEST_PUBLIC_KEY) throw new Error('CARD_TOKEN_PUBLIC_KEY_MISMATCH');
      card = { id: scenario.cardId, token: token.id, installments: 1 };
    }
    const body = exported.buildOrdersRequest({ totalInCents: scenario.total, reference,
      description: 'Homologacao isolada Ozonteck', method: scenario.method, card,
      payer: { email: 'test_payer@example.com', first_name: scenario.holder, last_name: 'Teste',
        identification: { type: 'CPF', number: '12345678909' },
        address: { zip_code: '06233030', street_name: 'Rua de Teste', street_number: '123', neighborhood: 'Centro', city: 'Osasco', federal_unit: 'SP' } },
    });
    const {raw:created,recoveredId}=await creation.createOrderResponse(ordersClient,body,reference);
    record.recoveredFromError=!!recoveredId;
    record.orderId = created.id;
    record.createdStatus = created.status;
    record.createdDetail=created.status_detail;
    const expected = { reference, totalInCents: scenario.total, accountId: String(seller.id), applicationId: config.ORDERS_TEST_APPLICATION_ID };
    const normalized = exported.normalizeOrdersResponse(created, {...expected,...(recoveredId?{id:recoveredId}:{})});
    record.createdNormalizedStatus = normalized.status;
    record.hasPixCode = Boolean(normalized.pixCode);
    record.hasBoletoCode = Boolean(normalized.boletoCode);
    record.hasBoletoUrl = Boolean(normalized.boletoUrl);
    if(normalized.authenticationUrl) await writeFile('sandbox-runtime/'+scenario.name+'.json',JSON.stringify({url:normalized.authenticationUrl,orderId:created.id,reference}));
    const read = await api('/v1/orders/' + encodeURIComponent(created.id));
    record.readStatus = read.status;
    record.readDetail=read.status_detail;
    record.normalizedStatus = exported.normalizeOrdersResponse(read, { ...expected, id: created.id }).status;
    record.result = 'created_and_read';
  } catch (error) {
    record.result = 'failed'; record.error = typeof error?.message === 'string' && /^[A-Z_]+$/.test(error.message) ? error.message : 'CHECK_FAILED';
    const detail = error && typeof error === 'object' ? error : {};
    const nested = detail.data && typeof detail.data === 'object' ? detail.data : {};
    const status = detail.httpStatus || detail.status || nested.status;
    if (Number.isInteger(status) && status >= 100 && status <= 599) record.httpStatus = status;
    const errors = [detail, nested, ...(Array.isArray(detail.errors) ? detail.errors : []), ...(Array.isArray(nested.errors) ? nested.errors : []), ...(Array.isArray(detail.cause) ? detail.cause : [])];
    const codes = [...(Array.isArray(detail.codes) ? detail.codes : []), ...errors.flatMap(item => [item?.code, item?.error])]
      .filter(code => (typeof code === 'number' && Number.isSafeInteger(code) && code >= 0 && code <= 99999)
        || (typeof code === 'string' && /^[a-z][a-z0-9_]{0,79}$/i.test(code) && !/^(?:APP_USR|Bearer|eyJ)/i.test(code) && !/^[a-f0-9]{24,}$/i.test(code)));
    if (codes.length) record.codes = [...new Set(codes)];
    if (detail.bodyKeys) record.bodyKeys=detail.bodyKeys;
    if (detail.testOrderIdentifiers) record.testOrderIdentifiers=detail.testOrderIdentifiers;
  }
  report.cases.push(record);
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(record));
}
await writeFile(output, JSON.stringify(report, null, 2) + '\n');
if (report.cases.some(record => record.result === 'failed')) process.exitCode = 1;
