const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { parseEnv } = require('node:util');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');
const sdk = require('mercadopago');

const credentials = parseEnv(fs.readFileSync('.env.payment-test','utf8'));
assert.ok(credentials.MP_ACCESS_TOKEN?.startsWith('TEST-'), 'Sandbox token required');
const userId = '20000000-0000-4000-8000-000000000001';
const serving = process.argv.includes('--serve-webhook');
const secret = serving ? parseEnv(fs.readFileSync('.env','utf8')).MP_WEBHOOK_SECRET : crypto.randomBytes(32).toString('hex');
assert.ok(secret, 'Webhook secret required');
const env = { NODE_ENV:'test', MP_ACCESS_TOKEN:credentials.MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET:secret,
  MP_WEBHOOK_URL:'https://example.invalid/api/webhook', NEXT_PUBLIC_SUPABASE_URL:'https://example.invalid',
  SUPABASE_SERVICE_ROLE_KEY:'local-adapter-only' };
const report = { checkedAt:new Date().toISOString(), scope:'Actual route handlers, real Mercado Pago sandbox and local SQL. Auth/PostgREST adapted; no browser, public webhook or distributed limiter.', results:[] };
report.mode = process.argv.includes('--existing-payments') ? 'existing-payment-webhook-only' : 'new-checkout-payments';
let db;
const rpcArgs = {
  liberar_reservas_expiradas:[], resolve_customer_prices:['p_user_id'],
  reserve_priced_order:['p_checkout_id','p_user_id','p_total','p_delivery_address','p_items','p_reservation_minutes'],
  processar_status_pagamento:['p_payment_id','p_payment_status','p_checkout_id','p_amount'],
};
const adapter = {
  auth:{getUser:async()=>({data:{user:{id:userId,factors:[]}}}),getClaims:async()=>({data:{claims:{aal:'aal1'}}})},
  from(table) {
    assert.equal(table,'produtos');
    return {select:()=>({in:async(column,codes)=>{assert.equal(column,'code');return {data:(await db.query('select * from produtos where code = any($1)',[codes])).rows};}})};
  },
  async rpc(name,args={}) {
    assert.ok(Object.hasOwn(rpcArgs,name));
    const values = rpcArgs[name].map(key=>typeof args[key]==='object'&&args[key]!==null?JSON.stringify(args[key]):args[key]);
    try { return {data:(await db.query(`select ${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) result`,values)).rows[0].result}; }
    catch(error) { return {error:{message:error.message}}; }
  },
};
const cache = {};
function load(file) {
  if(cache[file]) return cache[file];
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports,require(name){
    if(name==='@supabase/supabase-js')return {createClient:()=>adapter};
    if(name==='server-only')return {};
    if(name==='mercadopago')return {...sdk,Payment:class extends sdk.Payment {
      async create(args) {
        try {return await super.create(args);} catch(error) {
          console.error(JSON.stringify({providerStatus:error.status,providerMessage:error.message,
            causes:error.cause?.map(c=>({code:c.code,description:c.description}))}));
          throw error;
        }
      }
    }};
    if(name.startsWith('@/'))return load(name.replace('@/','')+'.ts');
    if(['crypto','mercadopago','next/server','zod','@upstash/ratelimit','@upstash/redis'].includes(name))return require(name);
    throw new Error('Unexpected import '+name);
  },process:{env},console:{error(message){console.error(String(message));}},URL,Request,Response,Headers,TextDecoder,Uint8Array,Map,Date},{filename:file});
  return cache[file]=exports;
}
async function cardToken(name) {
  const response = await fetch('https://api.mercadopago.com/v1/card_tokens',{
    method:'POST',headers:{Authorization:'Bearer '+credentials.MP_ACCESS_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify({card_number:'5480832801033311',security_code:'123',expiration_month:11,expiration_year:2030,
      cardholder:{name,identification:{type:'CPF',number:'12345678909'}}}),signal:AbortSignal.timeout(30000),
  });
  assert.equal(response.status,201,'Test card token generation failed');
  return (await response.json()).id;
}
(async()=>{
  const {PGlite} = await import(pathToFileURL(process.argv[2]).href);
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
    create table profiles(id uuid primary key,role text);
    create function is_admin() returns boolean language sql as $$ select false $$;
    create function account_mfa_allowed() returns boolean language sql as $$ select true $$;
    create table produtos(code text primary key,name text,category text,price numeric,estoque integer,is_deleted boolean default false);
    create table pedidos(id uuid primary key default gen_random_uuid(),user_id uuid,checkout_id text unique,
      id_pagamento_mp text unique,valor_total numeric,status text,status_pagamento text,endereco_entrega jsonb,
      itens jsonb,estoque_baixado boolean default false,reserva_expira_em timestamptz);
    insert into auth.users values('${userId}'); insert into profiles values('${userId}','cliente');
    insert into produtos values('NUT-NXCAP','NXCAP','Suplementos',159.92,10,false);`);
  const sql=fs.readFileSync('supabase/migrations/202609240002_security_hardening.sql','utf8');
  const start=sql.indexOf('create or replace function public.liberar_reservas_expiradas()');
  const end=sql.indexOf('\ncommit;',start); assert.ok(start>=0&&end>start);
  await db.exec(sql.slice(start,end));
  await db.exec(fs.readFileSync('supabase/migrations/202610090001_affiliate_pricing.sql','utf8'));
  await db.exec(`insert into affiliate_access(user_id,enabled) values('${userId}',true);
    insert into affiliate_prices values('NUT-NXCAP',79.96);`);
  const checkout=load('app/api/checkout/route.ts');
  const webhook=load('app/api/webhook/route.ts');
  const payments=new sdk.Payment(new sdk.MercadoPagoConfig({accessToken:credentials.MP_ACCESS_TOKEN}));
  if(serving) {
    const previous=JSON.parse(fs.readFileSync('docs/payment-sandbox-results.json','utf8'));
    const allowed=new Set(previous.results.map(row=>String(row.paymentId)));
    for(const saved of previous.results) {
      const payment=await payments.get({id:saved.paymentId});
      assert.equal(payment.live_mode,false);
      await db.query('select reserve_priced_order($1,$2,79.96,$3,$4,30)',[payment.external_reference,userId,'{}',
        JSON.stringify([{code:'NUT-NXCAP',qtd:1,preco_unitario:79.96}])]);
    }
    report.mode='public-sandbox-webhook-receiver';
    report.scope='Mercado Pago panel simulator over public HTTPS, actual webhook handler and SDK, temporary SQL database. No production data or storefront checkout.';
    const http=require('node:http');
    const server=http.createServer(async(req,res)=>{
      try {
        const url=new URL(req.url,'http://127.0.0.1:43872');
        if(req.method!=='POST'||url.pathname!=='/api/webhook') {res.writeHead(404);res.end();return;}
        if(!allowed.has(url.searchParams.get('data.id')||url.searchParams.get('id'))) {res.writeHead(400);res.end('Sandbox payment required');return;}
        const chunks=[];let bytes=0;
        for await(const chunk of req) {bytes+=chunk.length;if(bytes>32768){res.writeHead(413);res.end();return;}chunks.push(chunk);}
        const response=await webhook.POST(new Request(url,{method:'POST',headers:req.headers,body:Buffer.concat(chunks)}));
        const responseBody=await response.text();
        res.writeHead(response.status,{'Content-Type':'application/json'});res.end(responseBody);
        const stocks=(await db.query('select estoque from produtos')).rows;
        report.results.push({receivedAt:new Date().toISOString(),httpStatus:response.status,paymentId:url.searchParams.get('data.id')||url.searchParams.get('id'),stocks});
        fs.writeFileSync('docs/payment-public-webhook-results.json',JSON.stringify(report,null,2)+'\n');
        console.log('Sandbox callback HTTP '+response.status);
      } catch {res.writeHead(500);res.end('Test receiver failure');}
    });
    await new Promise((resolve,reject)=>{
      server.once('error',reject);
      server.listen(43872,'127.0.0.1',()=>console.log('Sandbox-only receiver ready: 127.0.0.1:43872'));
      const timer=setTimeout(()=>server.close(resolve),600000);
      process.once('SIGINT',()=>{clearTimeout(timer);server.close(resolve);});
    });
    return;
  }
  if(process.argv.includes('--existing-payments')) {
    const previous=JSON.parse(fs.readFileSync('docs/payment-sandbox-results.json','utf8'));
    for(const saved of previous.results) {
      const payment=await payments.get({id:saved.paymentId});
      assert.equal(payment.live_mode,false); assert.equal(payment.transaction_amount,79.96);
      const before=(await db.query('select estoque from produtos')).rows[0].estoque;
      await db.query('select reserve_priced_order($1,$2,79.96,$3,$4,30)',[payment.external_reference,userId,'{}',
        JSON.stringify([{code:'NUT-NXCAP',qtd:1,preco_unitario:79.96}])]);
      for(let repeat=0;repeat<2;repeat++) {
        const timestamp=String(Date.now()),requestId=crypto.randomUUID();
        const signature=crypto.createHmac('sha256',secret).update(`id:${payment.id};request-id:${requestId};ts:${timestamp};`).digest('hex');
        const response=await webhook.POST(new Request(`http://localhost/api/webhook?data.id=${payment.id}`,{method:'POST',
          headers:{'Content-Type':'application/json','x-request-id':requestId,'x-signature':`ts=${timestamp},v1=${signature}`},
          body:JSON.stringify({type:'payment',data:{id:payment.id},status:'forged-status-ignored'})}));
        assert.equal(response.status,200);
      }
      const after=(await db.query('select estoque from produtos')).rows[0].estoque;
      assert.equal(after,['rejected','cancelled'].includes(payment.status)?before:before-1);
      const order=(await db.query('select status_pagamento from pedidos where checkout_id=$1',[payment.external_reference])).rows[0];
      assert.equal(order.status_pagamento,payment.status);
      report.results.push({paymentId:payment.id,status:payment.status,liveMode:false,signedWebhookReplays:2,stockBefore:before,stockAfter:after});
      console.log(JSON.stringify(report.results.at(-1)));
    }
    console.log('PASS: actual webhook route, actual sandbox payment lookups and local SQL. Signature generated by harness; not provider delivery. Checkout NOT exercised in this mode.');
    return;
  }
  for(const [scenario,expected] of [['APRO','approved'],['OTHE','rejected'],['CONT','in_process']]) {
    const token=await cardToken(scenario), key=crypto.randomUUID();
    const stockBefore=(await db.query('select estoque from produtos')).rows[0].estoque;
    const body={expected_total:79.96,cart_items:[{code:'NUT-NXCAP',quantity:1}],payment_method_id:'master',token,installments:1,
      payer:{email:'qa.sandbox.ozonteck@example.com',first_name:scenario,last_name:'Teste',identification:{type:'CPF',number:'12345678909'},
        address:{zip_code:'50050015',street_name:'Rua de teste',street_number:'1',neighborhood:'Centro',city:'Recife',federal_unit:'PE'}},
      metadata:{phone:'81999999999',delivery_mode:'retirada',user_id:userId}};
    const makeRequest=()=>new Request('http://localhost/api/checkout',{method:'POST',headers:{'Content-Type':'application/json',
      Authorization:'Bearer local-fixture','x-idempotency-key':key,'x-forwarded-for':`fixture-${scenario}`},body:JSON.stringify(body)});
    const response=await checkout.POST(makeRequest()); const result=await response.json();
    assert.equal(response.status,200,JSON.stringify(result)); assert.equal(result.status,expected); assert.equal(result.total,79.96);
    const payment=await payments.get({id:result.id}); assert.equal(payment.live_mode,false);
    assert.equal(payment.transaction_amount,79.96);
    const replay=await checkout.POST(makeRequest()); const replayResult=await replay.json();
    assert.equal(replay.status,200); assert.equal(replayResult.id,result.id);
    for(let i=0;i<2;i++) {
      const ts=String(Date.now()),requestId=crypto.randomUUID();
      const hmac=crypto.createHmac('sha256',secret).update(`id:${result.id};request-id:${requestId};ts:${ts};`).digest('hex');
      const callback=await webhook.POST(new Request(`http://localhost/api/webhook?data.id=${result.id}`,{method:'POST',
        headers:{'Content-Type':'application/json','x-request-id':requestId,'x-signature':`ts=${ts},v1=${hmac}`},
        body:JSON.stringify({type:'payment',data:{id:result.id},status:'forged-status-ignored'})}));
      assert.equal(callback.status,200);
    }
    const stockAfter=(await db.query('select estoque from produtos')).rows[0].estoque;
    assert.equal(stockAfter,expected==='rejected'?stockBefore:stockBefore-1);
    const order=(await db.query('select status_pagamento from pedidos where checkout_id=$1',[key])).rows[0];
    assert.equal(order.status_pagamento,expected);
    report.results.push({scenario,status:expected,liveMode:false,paymentId:result.id,checkoutReplaySamePayment:true,
      signedWebhookReplays:2,stockBefore,stockAfter});
    console.log(JSON.stringify(report.results.at(-1)));
  }
  console.log('PASS: checkout and webhook source handlers with actual sandbox SDK and local SQL. Public webhook delivery, browser and remote Supabase not tested.');
})().catch(error=>{report.failure=error.message;console.error(error.message);process.exitCode=1;}).finally(async()=>{
  fs.writeFileSync('docs/payment-routes-sandbox-results.json',JSON.stringify(report,null,2)+'\n');
  if(db)await db.close();
});
