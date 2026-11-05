import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { buildOrdersRequest, normalizeOrdersResponse } from '../lib/server/mercado-pago-orders.ts';
import { createOrderResponse } from '../lib/server/orders-creation.ts';
const require=createRequire(import.meta.url),ts=require('typescript');
async function fixture(error: unknown, patch: object={}) {
  const reads: string[]=[], configs: unknown[]=[];
  const order={id:'store-order-fixture',checkout_id:'checkout-reference-fixture',valor_total:9.99};
  const raw={id:'ORDREJECTFIXTURE',type:'online',external_reference:order.checkout_id,total_amount:'9.99',total_paid_amount:'0.00',country_code:'BRA',currency:'BRL',user_id:'account-fixture',integration_data:{application_id:'app-fixture'},status:'failed',status_detail:'failed',transactions:{payments:[{amount:'9.99',payment_method:{id:'master',type:'credit_card'}}]},...patch};
  const sdk={MercadoPagoConfig:class{constructor(config:unknown){configs.push(config);}},Order:class{async create(){throw error;}async get({id}:{id:string}){reads.push(id);return raw;}}};
  const output: {createOrdersPayment?: (...args: unknown[])=>Promise<{status:string}>}={};
  const dependencies: Record<string,unknown>={mercadopago:sdk,'./mercado-pago-orders':{buildOrdersRequest,normalizeOrdersResponse},'./orders-creation':{createOrderResponse}};
  vm.runInNewContext(ts.transpileModule(readFileSync('lib/server/orders-provider.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,
    {exports:output,require:(name:string)=>{if(!(name in dependencies))throw new Error('Unexpected dependency '+name);return dependencies[name];},process:{env:{MP_ORDERS_ACCOUNT_ID:'account-fixture',MP_ORDERS_APPLICATION_ID:'app-fixture',MP_ORDERS_ACCESS_TOKEN:'token-fixture'}}});
  const db={rpc:async()=>({error:null}),from:()=>({select:()=>({eq:()=>({single:async()=>({error:null,data:{api:'orders',profile:'ozonlife',environment:'production',account_id:'account-fixture',application_id:'app-fixture'}})})})})};
  const input={totalInCents:999,reference:order.checkout_id,description:'Fixture',method:'credit_card',card:{id:'master',token:'card-token-fixture',installments:1},payer:{email:'fixture@example.test',first_name:'Fixture',last_name:'Test',identification:{type:'CPF',number:'12345678909'},address:{zip_code:'06233030',street_name:'Fixture',street_number:'1',neighborhood:'Fixture',city:'Fixture',federal_unit:'SP'}}};
  return {read:()=>reads,configs,run:()=>output.createOrdersPayment!(db,order,input)};
}

test('SDK 402 response is recovered by authenticated GET and full identity validation',async()=>{
  const f=await fixture({errors:[{code:'failed'}],data:{id:'ORDREJECTFIXTURE',status:'processed'}});
  assert.equal((await f.run()).status,'rejected','Never trust the error-body status');
  assert.deepEqual(f.read(),['ORDREJECTFIXTURE']);
});
test('unknown outcome and malformed identifiers cannot be fabricated into a rejection',async()=>{
  for(const error of [new Error('timeout'),{data:{id:'https://invalid.example'}},{data:{id:123}},{id:'ORDREJECTFIXTURE'}]){
    const f=await fixture(error);await assert.rejects(f.run);assert.equal(f.read().length,0);
  }
});
test('recovery rejects another account, reference, amount or returned order ID',async()=>{
  for(const patch of [{user_id:'other'},{external_reference:'other'},{total_amount:'10.00'},{id:'ORDOTHERFIXTURE'}]){
    const f=await fixture({errors:[{code:'failed'}],data:{id:'ORDREJECTFIXTURE'}},patch);
    await assert.rejects(f.run);assert.equal(f.read().length,1);
  }
});
