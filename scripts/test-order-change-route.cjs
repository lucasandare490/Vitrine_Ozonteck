const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict'), ts=require('typescript');
const code=ts.transpileModule(fs.readFileSync('app/api/pedidos/[id]/alterar/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
async function run(options={}) {
  let cancels=0,writes=0,lookups=0; const filters={};
  const payment={id:123,external_reference:'checkout',currency_id:'BRL',transaction_amount:10,live_mode:true,status:options.paid?'approved':'pending'};
  const order={id_pagamento_mp:'123',checkout_id:'checkout',status:'pending',valor_total:10};
  const mocks={
    '@supabase/supabase-js':{createClient:()=>({auth:{getUser:async()=>({data:{user:options.anonymous?null:{id:'owner'}}}),getClaims:async()=>({data:{claims:{aal:'aal1'}}})},from:()=>({select(){return this},limit:async()=>({error:options.schema?{}:null}),eq(k,v){filters[k]=v;return this},maybeSingle:async()=>({data:options.foreign?null:order})}),rpc:async()=>{writes++;return {data:{id:'change'}}}})},
    mercadopago:{MercadoPagoConfig:class{},Payment:class{async get(){lookups++;return {...payment,status:cancels?(options.race?'approved':'cancelled'):payment.status}} async cancel(){cancels++;return {}}}},
    'next/server':{NextResponse:{json:(body,init)=>Response.json(body,init)}}, zod:require('zod'),
    '@/lib/mfa-policy':{requiresSecondFactor:()=>!!options.mfa},
    '@/lib/server/http':{createRateLimitGuard:()=>async()=>options.rate?'denied':'allowed',readJsonBody:r=>r.json()},
  };
  const exports={};vm.runInNewContext(code,{exports,require:n=>mocks[n],process:{env:{}}});
  const response=await exports.POST(new Request('https://example.invalid',{method:'POST',headers:{authorization:'Bearer fixture'},body:JSON.stringify({reason:'pagamento'})}),{params:Promise.resolve({id:'10000000-0000-4000-8000-000000000001'})});
  return {status:response.status,cancels,writes,lookups,filters};
}
(async()=>{
 for(const [option,status] of [['anonymous',401],['mfa',403],['schema',503],['foreign',404],['rate',429],['paid',409]]){const r=await run({[option]:true});assert.equal(r.status,status);assert.equal(r.cancels,0);assert.equal(r.writes,0);}
 const race=await run({race:true});assert.equal(race.status,409);assert.equal(race.writes,0);
 const ok=await run();assert.equal(ok.status,200);assert.equal(ok.cancels,1);assert.equal(ok.writes,1);assert.equal(ok.filters.user_id,'owner');
 console.log('PASS mocked cancellation: ownership, MFA, approved/race block, schema preflight, rate limit and cancellation confirmed before DB writes. No real cancellations.');
})().catch(e=>{console.error(e);process.exitCode=1});
