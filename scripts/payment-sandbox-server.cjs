const fs = require('node:fs');
const http = require('node:http');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const ts = require('typescript');
const sdk = require('mercadopago');
assert.ok(process.env.MP_ACCESS_TOKEN?.startsWith('TEST-'));
assert.ok(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith('TEST-'));
assert.ok(process.env.MP_WEBHOOK_SECRET && process.env.SANDBOX_ACCESS);
assert.ok(!process.env.DATABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_URL, 'Production database configuration forbidden');
const env = {NODE_ENV:'test',PAYMENT_SANDBOX:'true',MP_ACCESS_TOKEN:process.env.MP_ACCESS_TOKEN,
  NEXT_PUBLIC_MP_PUBLIC_KEY:process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,MP_WEBHOOK_SECRET:process.env.MP_WEBHOOK_SECRET,
  MP_WEBHOOK_URL:process.env.MP_WEBHOOK_URL,NEXT_PUBLIC_SUPABASE_URL:'http://isolated.invalid',SUPABASE_SERVICE_ROLE_KEY:'local-only'};
let db, providerError = null;
const events = [];
const rpcArgs = {liberar_reservas_expiradas:[],resolve_customer_prices:['p_user_id'],
  reserve_priced_order:['p_checkout_id','p_user_id','p_total','p_delivery_address','p_items','p_reservation_minutes'],
  processar_status_pagamento:['p_payment_id','p_payment_status','p_checkout_id','p_amount']};
const adapter = {
  auth:{getUser:async()=>({data:{user:null},error:{message:'No accounts in test environment'}})},
  from(table) {
    if(table==='produtos') return {select:()=>({in:async(column,codes)=>{
      assert.equal(column,'code');return {data:(await db.query('select * from produtos where code=any($1)',[codes])).rows};
    }})};
    assert.equal(table,'pedidos');
    return {select:()=>({eq:(column,value)=>({maybeSingle:async()=>{
      assert.equal(column,'checkout_id');return {data:(await db.query('select itens from pedidos where checkout_id=$1',[value])).rows[0]||null};
    }})})};
  },
  async rpc(name,args={}) {
    assert.ok(Object.hasOwn(rpcArgs,name));
    const values=rpcArgs[name].map(k=>args[k]&&typeof args[k]==='object'?JSON.stringify(args[k]):args[k]);
    try {return {data:(await db.query(`select ${name}(${values.map((_,i)=>'$'+(i+1)).join(',')}) result`,values)).rows[0].result};}
    catch(e){return {error:{message:e.message}};}
  }
};
const cache={};
function load(file) {
  if(cache[file])return cache[file];
  const exports={};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports,require(name){
    if(name==='@supabase/supabase-js')return {createClient:()=>adapter};
    if(name==='server-only')return {};
    if(name==='mercadopago')return {...sdk,Payment:class extends sdk.Payment {
      async create(args){try{return await super.create(args);}catch(e){providerError={status:e.status||null,message:e.message||'Provider failure',causes:e.cause?.map(c=>({code:c.code,description:c.description}))};throw e;}}
    }};
    if(name.startsWith('@/'))return load(name.replace('@/','')+'.ts');
    if(['crypto','next/server','zod','@upstash/ratelimit','@upstash/redis'].includes(name))return require(name);
    throw Error('Unexpected module');
  },process:{env},console:{error(message){console.error(String(message));}},URL,Request,Response,Headers,TextDecoder,Uint8Array,Map,Date},{filename:file});
  return cache[file]=exports;
}
async function main(){
  const {PGlite}=await import(pathToFileURL('C:/Users/lucas/Documents/Codex/supabase-connection-diagnostic/node_modules/@electric-sql/pglite/dist/index.js').href);
  db=new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$select null::uuid$$;
    create table profiles(id uuid primary key,role text);
    create function is_admin() returns boolean language sql as $$select false$$;
    create function account_mfa_allowed() returns boolean language sql as $$select true$$;
    create table produtos(code text primary key,name text,category text,price numeric,estoque integer,is_deleted boolean default false);
    create table pedidos(id uuid primary key default gen_random_uuid(),user_id uuid,checkout_id text unique,id_pagamento_mp text unique,
      valor_total numeric,status text,status_pagamento text,endereco_entrega jsonb,itens jsonb,estoque_baixado boolean default false,reserva_expira_em timestamptz);
    insert into produtos values('TESTE-001','[TESTE] Produto ficticio','Teste',9.99,100,false);`);
  const sql=fs.readFileSync('supabase/migrations/202609240002_security_hardening.sql','utf8');
  const start=sql.indexOf('create or replace function public.liberar_reservas_expiradas()'),end=sql.indexOf('\ncommit;',start);
  assert.ok(start>=0&&end>start);await db.exec(sql.slice(start,end));
  await db.exec(fs.readFileSync('supabase/migrations/202610090001_affiliate_pricing.sql','utf8'));
  const checkout=load('app/api/checkout/route.ts'),webhook=load('app/api/webhook/route.ts');
  let busy=false,attempts=0,lastAttempt=0;
  const server=http.createServer(async(req,res)=>{
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
    const send=(status,body,extra={})=>{res.writeHead(status,{...headers,...extra});res.end(Buffer.isBuffer(body)||typeof body==='string'?body:JSON.stringify(body));};
    try {
      const url=new URL(req.url,process.env.SANDBOX_URL);
      const authorized=(req.headers.cookie||'').split(';').some(v=>v.trim()==='sandbox_access='+process.env.SANDBOX_ACCESS);
      if(req.method==='GET'&&url.pathname==='/'&&url.searchParams.get('access')===process.env.SANDBOX_ACCESS){
        return send(303,'',{'Location':'/','Set-Cookie':`sandbox_access=${process.env.SANDBOX_ACCESS}; HttpOnly; SameSite=Strict; Path=/; Max-Age=21600${url.protocol==='https:'?'; Secure':''}`});
      }
      if(url.pathname!=='/api/webhook'&&!authorized)return send(403,{error:'Use o link privado de teste.'});
      if(req.method==='GET'&&url.pathname==='/')return send(200,fs.readFileSync('scripts/payment-sandbox.html','utf8'),{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"});
      if(req.method==='GET'&&url.pathname==='/product.webp')return send(200,fs.readFileSync('public/produtos/ozoncream.webp'),{'Content-Type':'image/webp'});
      if(req.method==='GET'&&url.pathname==='/api/state')return send(200,{stock:(await db.query('select estoque from produtos')).rows[0].estoque,
        orders:(await db.query('select id,valor_total,status,status_pagamento,id_pagamento_mp from pedidos order by id')).rows,events,providerError,attempts});
      if(req.method!=='POST'||!['/api/test','/api/webhook'].includes(url.pathname))return send(404,{error:'Not found'});
      if(url.pathname==='/api/test'&&req.headers.origin!==process.env.SANDBOX_URL)return send(403,{error:'Origin rejected'});
      let bytes=0;const chunks=[];for await(const c of req){bytes+=c.length;if(bytes>32768)return send(413,{error:'Too large'});chunks.push(c);}
      if(url.pathname==='/api/webhook'){
        const result=await webhook.POST(new Request(url,{method:'POST',headers:req.headers,body:Buffer.concat(chunks)}));
        events.push({at:new Date().toISOString(),status:result.status});if(events.length>30)events.shift();
        return send(result.status,await result.text());
      }
      const {scenario}=JSON.parse(Buffer.concat(chunks).toString());
      if(!['APRO','OTHE','CONT'].includes(scenario))return send(400,{error:'Invalid scenario'});
      if(busy||attempts>=12||Date.now()-lastAttempt<15000)return send(429,{error:'Aguarde 15 segundos. Limite de 12 tentativas nesta sessão.'});
      busy=true;attempts++;lastAttempt=Date.now();providerError=null;
      try {
        const tokenResponse=await fetch('https://api.mercadopago.com/v1/card_tokens',{
          method:'POST',headers:{Authorization:'Bearer '+env.MP_ACCESS_TOKEN,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000),
          body:JSON.stringify({card_number:'5480832801033311',security_code:'123',expiration_month:11,expiration_year:2030,cardholder:{name:scenario,identification:{type:'CPF',number:'12345678909'}}})});
        if(tokenResponse.status!==201){providerError={status:tokenResponse.status,message:'Falha na tokenização de teste',requestId:tokenResponse.headers.get('x-request-id')};return send(502,{error:'Mercado Pago não gerou o token de teste.'});}
        const token=(await tokenResponse.json()).id;
        const body={expected_total:9.99,cart_items:[{code:'TESTE-001',quantity:1}],payment_method_id:'master',token,installments:1,
          payer:{email:'qa.sandbox.ozonteck@example.com',first_name:scenario,last_name:'Teste',identification:{type:'CPF',number:'12345678909'},
          address:{zip_code:'50050015',street_name:'Rua ficticia',street_number:'1',neighborhood:'Centro',city:'Recife',federal_unit:'PE'}},
          metadata:{phone:'81999999999',delivery_mode:'retirada'}};
        const result=await checkout.POST(new Request(new URL('/api/checkout',process.env.SANDBOX_URL),{method:'POST',headers:{'Content-Type':'application/json','x-idempotency-key':crypto.randomUUID()},body:JSON.stringify(body)}));
        return send(result.status,await result.text());
      } finally {busy=false;}
    }catch {return send(500,{error:'Falha no ambiente de teste.'});}
  });
  server.requestTimeout=45000;server.headersTimeout=10000;
  server.listen(Number(process.env.SANDBOX_PORT),'127.0.0.1',()=>console.log('READY: isolated SQL, TEST credentials, no production database'));
  const stop=()=>server.close(()=>db.close().then(()=>process.exit(0)));
  process.once('SIGTERM',stop);process.once('SIGINT',stop);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
