const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('app/api/checkout/route.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
async function run({ approved = false, authenticated = true, expected = 159.92, claimed = 'customer', changed = false, priceFailure = false, status = 'approved', productCode = 'NUT-NXCAP', sandbox = false, liveCredentials = false, liveResponse = false } = {}) {
  let paymentCalls = 0, reservationCalls = 0, charged;
  const price = productCode === 'PRO-AMR' ? 200 : approved ? 79.96 : 159.92;
  const db = {
    auth: { getUser: async () => ({data:{user:{id:'customer',factors:[]}}}), getClaims: async () => ({data:{claims:{aal:'aal1'}}}) },
    from: () => ({ select: () => ({ in: async () => ({data:[{code:productCode,name:'Produto',category:'Suplementos',price:159.92,estoque:10,is_deleted:false}]}) }) }),
    rpc: async (name, args) => {
      if (name === 'liberar_reservas_expiradas') return {};
      if (name === 'resolve_customer_prices') {
        assert.equal(args.p_user_id,authenticated?'customer':null);
        return priceFailure ? {error:{message:'offline'}} : {data:{prices:{[productCode]:price}}};
      }
      if (name === 'reserve_priced_order') {
        if (sandbox) assert.ok(args.p_checkout_id.startsWith('sandbox-'));
        reservationCalls++;
        assert.equal(args.p_total,price); assert.equal(args.p_items[0].preco_unitario,price);
        return changed ? {error:{message:'PRICE_CHANGED'}} : {data:{id:'order',user_id:authenticated?'customer':null,valor_total:price,itens:args.p_items}};
      }
      if (name === 'processar_status_pagamento') return {data:{pedido_encontrado:true,estoque_disponivel:true}};
      throw new Error(name);
    },
  };
  const mocks = {
    crypto: require('node:crypto'),
    '@/lib/mfa-policy': {requiresSecondFactor:()=>false},
    '@supabase/supabase-js': {createClient:()=>db},
    mercadopago: {MercadoPagoConfig:class {},Payment:class {async create({body}) {paymentCalls++; charged=body.transaction_amount; return {id:'payment',status,transaction_amount:charged,live_mode:liveResponse};}}},
    'next/server': {NextResponse:{json:(body,opts)=>Response.json(body,opts)}},
    '@/lib/catalog-availability':{isRetiredProduct:()=>false},
    '@/lib/products':{isTestProduct:()=>productCode.startsWith('TESTE-')},
    zod:require('zod'),
    '@/lib/server/http':{createRateLimitGuard:()=>async()=> 'allowed',getClientIp:()=> '127.0.0.1',readJsonBody:r=>r.json(),RequestBodyError:class extends Error{}},
    '@/lib/auth':{isValidCpf:()=>true},
  };
  const exports = {};
  vm.runInNewContext(code,{exports,require:name=>{if(!(name in mocks))throw new Error(`Unexpected import ${name}`);return mocks[name];},process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',SUPABASE_SERVICE_ROLE_KEY:'fixture',MP_ACCESS_TOKEN:liveCredentials?'APP_USR-fixture':'TEST-fixture',NEXT_PUBLIC_MP_PUBLIC_KEY:'TEST-fixture',PAYMENT_SANDBOX:String(sandbox),MP_WEBHOOK_URL:'https://example.invalid/api/webhook'}},console:{error(){}},URL,Request,Response,Headers});
  const body={expected_total:expected,cart_items:[{code:productCode,quantity:1,price:0.01}],payment_method_id:'pix',payer:{email:'qa@example.invalid',first_name:'QA',last_name:'Teste',identification:{type:'CPF',number:'52998224725'},address:{zip_code:'50050015',street_name:'Rua',street_number:'1',neighborhood:'Centro',city:'Recife',federal_unit:'PE'}},metadata:{phone:'81999999999',delivery_mode:'retirada'}};
  if (sandbox) { body.payment_method_id='master'; body.token='fixture-card-token'; }
  // Schema expects UUID; translate fixture identity without weakening validation.
  const id='20000000-0000-4000-8000-000000000001';
  if(claimed !== null) body.metadata.user_id=claimed==='customer'?id:'20000000-0000-4000-8000-000000000002';
  db.auth.getUser=async()=>({data:{user:{id,factors:[]}}});
  const originalRpc=db.rpc;
  db.rpc=async(name,args)=>{const result=await originalRpc(name,{...args,p_user_id:args?.p_user_id===id?'customer':args?.p_user_id});if(name==='reserve_priced_order'&&result.data)result.data.user_id=authenticated?id:null;return result;};
  const response=await exports.POST(new Request('http://localhost/api/checkout',{method:'POST',headers:{'Content-Type':'application/json',...(authenticated?{Authorization:'Bearer fixture'}:{})},body:JSON.stringify(body)}));
  return {status:response.status,body:await response.json(),paymentCalls,reservationCalls,charged};
}
(async()=>{
  for(const status of ['approved','pending','in_process']) {
    const r=await run({approved:true,expected:79.96,status});assert.equal(r.status,200);assert.equal(r.charged,79.96);assert.equal(r.body.total,79.96);assert.equal(r.body.order_id,'order');
  }
  assert.equal((await run()).charged,159.92);
  assert.equal((await run({authenticated:false,claimed:null})).charged,159.92);
  assert.equal((await run({approved:true,productCode:'PRO-AMR',expected:200})).charged,200);
  assert.equal((await run({sandbox:true,productCode:'TESTE-001'})).status,200);
  for (const options of [{sandbox:true},{sandbox:true,productCode:'TESTE-002'},{sandbox:true,productCode:'TESTE-001',liveCredentials:true},{productCode:'TESTE-001'}]) {
    const r=await run(options);assert.ok(r.status>=400);assert.equal(r.paymentCalls,0);assert.equal(r.reservationCalls,0);
  }
  assert.equal((await run({sandbox:true,productCode:'TESTE-001',liveResponse:true})).status,500);
  for(const options of [{expected:79.96},{approved:true,expected:0.01},{approved:true,expected:79.96,changed:true},{priceFailure:true},{claimed:'other'},{authenticated:false}]) {
    const r=await run(options);assert.ok(r.status>=400);assert.equal(r.paymentCalls,0);
  }
  console.log('PASS: checkout authenticates ownership, charges server price, rejects forged/stale totals and revoked benefits before payment, fails closed on lookup failure, preserves WO3 common price, returns recorded order for approved/pending/in_process. All integrations mocked; no network or charges.');
})().catch(e=>{console.error(e);process.exitCode=1;});
