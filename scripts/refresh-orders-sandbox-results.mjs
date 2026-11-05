import { readFile, writeFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createRequire } from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
const env=parseEnv(await readFile('.env.orders-test.local','utf8'));
const get=async path=>{const r=await fetch('https://api.mercadopago.com'+path,{headers:{Authorization:'Bearer '+env.ORDERS_TEST_ACCESS_TOKEN},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error('TEST_READ_FAILED');return r.json();};
const seller=await get('/users/me');
if(!seller.tags?.includes('test_user')||env.ORDERS_TEST_ACCESS_TOKEN.match(/^APP_USR-(\d+)-/)?.[1]!==env.ORDERS_TEST_APPLICATION_ID)throw new Error('REFUSING_NON_TEST_CONFIGURATION');
const api={};vm.runInNewContext(ts.transpileModule(await readFile('lib/server/mercado-pago-orders.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:api,URL,Date});
const report=JSON.parse(await readFile('docs/payment-provider-test-2026-11-05.json','utf8'));
if(report.environment!=='test')throw new Error('REFUSING_NON_TEST_REPORT');
for(const row of report.cases){
  if(row.orderId){
    if(!/^ORDTST[A-Z0-9]+$/.test(row.orderId))throw new Error('REFUSING_NON_TEST_ORDER');
    const raw=await get('/v1/orders/'+row.orderId);
    const normalized=api.normalizeOrdersResponse(raw,{id:row.orderId,reference:row.reference,totalInCents:row.method==='pix'?5000:999,accountId:String(seller.id),applicationId:env.ORDERS_TEST_APPLICATION_ID});
    row.lastVerifiedAt=new Date().toISOString();row.finalStatus=raw.status;row.finalDetail=raw.status_detail;
    row.finalNormalizedStatus=normalized.status;row.authenticationStatus=raw.transactions?.payments?.[0]?.payment_method?.transaction_security?.status||null;
    console.log(JSON.stringify({scenario:row.scenario,status:row.finalStatus,normalized:normalized.status,authentication:row.authenticationStatus}));
  }
  if(row.scenario==='credit-rejected'&&row.httpStatus===402&&row.codes?.includes('failed'))row.expectedRejection=true;
  if(row.scenario==='debit-approved'&&row.codes?.includes('payment_method_not_allowed_for_collector'))row.capability='unavailable_in_test_account';
}
const find=name=>report.cases.find(row=>row.scenario===name);
const management=JSON.parse(await readFile('docs/payment-management-test-2026-11-05.json','utf8'));
report.verifiedAt=new Date().toISOString();
report.summary={pixApproved:find('pix')?.finalNormalizedStatus==='approved',boletoIssued:!!(find('boleto')?.hasBoletoCode&&find('boleto')?.hasBoletoUrl),
  creditApproved:find('credit-approved')?.createdNormalizedStatus==='approved',creditRejected:find('credit-rejected')?.finalNormalizedStatus==='rejected',creditChallengeApproved:find('credit-challenge-approved')?.finalNormalizedStatus==='approved',
  creditChallengeRejected:find('credit-challenge-rejected')?.finalNormalizedStatus==='rejected',debitApproved:find('debit-approved')?.finalNormalizedStatus==='approved',
  testCancellationConfirmed:management.results.some(row=>row.action==='cancel'&&row.confirmed),testRefundConfirmed:management.results.some(row=>row.action==='refund'&&row.confirmed)};
await writeFile('docs/payment-provider-test-2026-11-05.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
