import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const customer = '10000000-0000-0000-0000-000000000001';
const other = '10000000-0000-0000-0000-000000000002';
const admin = '10000000-0000-0000-0000-000000000003';
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
    create table profiles(id uuid primary key, role text);
    create table produtos(code text primary key, name text, price numeric(12,2), is_deleted boolean default false);
    create function is_admin() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
    create function account_mfa_allowed() returns boolean language sql stable as $$ select coalesce(current_setting('test.mfa',true),'true')='true' $$;
    create function reservar_pedido_checkout(text,uuid,numeric,jsonb,jsonb,integer) returns jsonb language sql as $$ select jsonb_build_object('total',$3,'items',$5) $$;
    revoke all on function reservar_pedido_checkout(text,uuid,numeric,jsonb,jsonb,integer) from public;
    insert into auth.users values('${customer}'),('${other}'),('${admin}');
    insert into profiles values('${customer}','cliente'),('${other}','cliente'),('${admin}','admin');
    insert into produtos values('NUT-NXCAP','NXCAP',159.92,false),('PERF-AALI','Aaliyah 17ml',48,false),('QA','Sem tabela',55,false),('BE-TRIX','Retirado',79.90,true);
  `);
  for (const file of ['202610090001_affiliate_pricing.sql','202610090002_affiliate_price_source.sql']) {
    const sql = await fs.readFile(`supabase/migrations/${file}`,'utf8');
    await db.exec(sql); await db.exec(sql);
  }
  assert.equal((await db.query('select count(*)::int n from affiliate_prices')).rows[0].n,2);
  const role = async (name, uid='') => { await db.exec(`reset role; set role ${name}`); await db.query("select set_config('test.uid',$1,false)",[uid]); };
  const mine = async () => (await db.query('select my_store_prices() result')).rows[0].result;
  const set = (action, uid=null, code=null, price=null, enabled=null) => db.query('select admin_set_pricing($1,$2,$3,$4,$5)',[action,uid,code,price,enabled]);
  for (const r of ['anon','authenticated']) {
    await role(r, r === 'authenticated' ? customer : '');
    assert.equal((await mine()).prices['NUT-NXCAP'],159.92);
    for (const table of ['affiliate_access','affiliate_prices','customer_prices','pricing_audit']) {
      await assert.rejects(db.query(`select * from ${table}`));
      await assert.rejects(db.query(`delete from ${table}`));
    }
    await assert.rejects(db.query('insert into affiliate_access values($1,true,now())',[customer]));
    await assert.rejects(db.query('select resolve_customer_prices($1)',[other]));
    await assert.rejects(db.query('select admin_pricing($1)',[customer]));
    for (const action of ['access','affiliate','customer']) await assert.rejects(set(action,customer,'NUT-NXCAP',1,true));
    await assert.rejects(db.query("select reserve_priced_order('attempt',$1,1,'{}','[]',30)",[customer]));
  }
  console.log('PASS: anonymous/customer direct reads, writes, self-approval, custom prices, foreign lookup and reservation denied.');
  await role('authenticated',admin);
  await set('access',customer,null,null,true);
  await set('customer',customer,'NUT-NXCAP',70);
  await set('affiliate',null,'PERF-AALI',19);
  for (const price of [0,-1,1.001,1000000]) await assert.rejects(set('affiliate',null,'PERF-AALI',price));
  await assert.rejects(set('customer',other,'MISSING',5));
  await db.exec("select set_config('test.mfa','false',false)");
  await assert.rejects(set('access',other,null,null,true));
  await assert.rejects(db.query('select admin_pricing(null)'));
  await assert.rejects(mine());
  await db.exec("select set_config('test.mfa','true',false)");
  await role('authenticated',customer);
  let result = await mine();
  assert.equal(result.enabled,true); assert.equal(result.prices['NUT-NXCAP'],70); assert.equal(result.prices['PERF-AALI'],19); assert.equal(result.prices.QA,55);
  assert.equal(result.prices['BE-TRIX'],undefined);
  await role('authenticated',other); assert.equal((await mine()).prices['NUT-NXCAP'],159.92);
  await role('authenticated',admin); await set('customer',customer,'NUT-NXCAP',null);
  await role('authenticated',customer); assert.equal((await mine()).prices['NUT-NXCAP'],79.96);
  await role('service_role');
  const reserve = price => db.query("select reserve_priced_order('attempt',$1,$2,'{}',$3,30)",[customer,price,JSON.stringify([{code:'NUT-NXCAP',qtd:1,preco_unitario:price}])]);
  await reserve(79.96); await assert.rejects(reserve(1));
  await role('authenticated',admin); await set('access',customer,null,null,false);
  await role('authenticated',customer); assert.equal((await mine()).prices['NUT-NXCAP'],159.92);
  await role('service_role'); await assert.rejects(reserve(79.96)); await reserve(159.92);
  await db.exec('reset role');
  const audit = await db.query('select * from pricing_audit');
  assert.equal(audit.rows.length,5); assert.ok(audit.rows.every(row => row.actor === admin));
  await db.exec(await fs.readFile('supabase/migrations/202610090002_affiliate_price_source.sql','utf8'));
  assert.equal((await db.query("select price from affiliate_prices where product_code='PERF-AALI'")).rows[0].price,'19.00');
  console.log('PASS: exact seed, disabled/deleted fallback, approval, individual override/removal, isolation, MFA, revocation, changed-price rejection, audit and idempotent seed.');
} finally { await db.close(); }
