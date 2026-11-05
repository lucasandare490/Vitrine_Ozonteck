import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// In-memory PostgreSQL only. Never reads credentials or contacts a remote database.
const db = new PGlite();
const admin = '00000000-0000-0000-0000-000000000001';
const customer = '00000000-0000-0000-0000-000000000002';
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const actor = async (id = '', aal = 'aal1', role = 'authenticated') => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: id, aal })]);
  await db.exec(`set role ${role}`);
};
const rpc = async (rows, expected = rows.map(row => ({ code: row.code, ...('price' in row ? { price: 10 } : {}), ...('estoque' in row ? { estoque: 5 } : {}) }))) =>
  (await db.query('select public.import_product_updates($1::jsonb,$2::jsonb) as result', [JSON.stringify(rows), JSON.stringify(expected)])).rows[0].result;
const snapshot = async () => {
  await db.exec('reset role');
  return (await db.query('select * from produtos order by code')).rows;
};
const rejected = async (fn, message) => { await assert.rejects(fn, undefined, message); checks++; };

try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
    create table auth.mfa_factors(user_id uuid,status text);
    create table profiles(id uuid primary key,role text);
    create table categorias(name text primary key,archived_at timestamptz);
    create table produtos(id uuid primary key default gen_random_uuid(),code text unique,
      name text,price numeric(12,2) check(price>0),estoque integer check(estoque>=0),category text,
      image_url text,description text,is_deleted boolean default false,created_at timestamptz default now());
    insert into categorias values('Ativa',null),('Arquivada',now());
    insert into produtos(code,name,price,estoque,category,image_url,description) values
      ('A','Produto A',10,5,'Ativa','/original.webp','Conteúdo original'),
      ('B','Produto B',10,5,null,'/b.webp','Descrição B');
    insert into produtos(code,name,price,estoque,category,is_deleted) values
      ('OLD','Antigo',10,5,'Ativa',true),('CAT','Categoria antiga',10,5,'Arquivada',false),
      ('MISSING-CAT','Categoria ausente',10,5,'Inexistente',false),('NO-NAME',' ',10,5,'Ativa',false);
    grant usage on schema auth to authenticated;
  `);
  const setup = await readFile('supabase/migrations/202609240001_ozonteck_complete_setup.sql', 'utf8');
  await db.exec(setup.match(/create or replace function public\.is_admin\(\)[\s\S]*?grant execute on function public\.is_admin\(\) to anon, authenticated, service_role;/)[0]);
  const mfa = await readFile('supabase/migrations/202610010001_account_mfa.sql', 'utf8');
  await db.exec(mfa.match(/create or replace function public\.account_mfa_allowed\(\)[\s\S]*?grant execute on function public\.account_mfa_allowed\(\) to anon, authenticated, service_role;/)[0]);
  await db.query("insert into profiles values($1,'admin'),($2,'cliente')", [admin, customer]);
  await db.query("insert into auth.mfa_factors values($1,'verified')", [admin]);
  const sql = await readFile('supabase/migrations/202611040006_product_import.sql', 'utf8').catch(error => {
    if (error.code === 'ENOENT') return '';
    throw error;
  });
  if (sql) await db.exec(sql);
  check((await db.query("select to_regprocedure('public.import_product_updates(jsonb,jsonb)') as f")).rows[0].f !== null,
    'Product import RPC must exist');
  const original = await snapshot();

  for (const [id, aal, role] of [[customer, 'aal2', 'authenticated'], [admin, 'aal1', 'authenticated'], ['', 'aal2', 'authenticated'], ['', 'aal2', 'anon'], ['', 'aal2', 'service_role']]) {
    await actor(id, aal, role);
    await rejected(() => rpc([{ code: 'A', price: 20 }]), 'Only an admin with satisfied account MFA can import');
  }
  assert.deepEqual(await snapshot(), original); checks++;

  for (const rows of [null, {}, [], Array.from({ length: 101 }, (_, i) => ({ code: `P${i}`, price: 1 })),
    [null], [{ code: 'A' }], [{ code: 'A', price: null }], [{ code: 'A', price: '20' }],
    [{ code: 'A', price: 0 }], [{ code: 'A', price: -1 }], [{ code: 'A', price: 1.001 }],
    [{ code: 'A', price: 1000000 }], [{ code: 'A', estoque: -1 }], [{ code: 'A', estoque: 1.5 }],
    [{ code: 'A', estoque: 2147483648 }], [{ code: 'A', estoque: '2' }],
    [{ code: 'A', name: 'Inventado', price: 20 }], [{ code: 'A', image_url: 'changed', price: 20 }],
    [{ code: 'A', category: 'Nova', price: 20 }], [{ code: '', price: 20 }], [{ code: ' A', price: 20 }],
    [{ code: 'A', price: 20 }, { code: 'A', price: 30 }],
    [{ code: 'A', price: 20 }, { code: 'Z-UNKNOWN', price: 30 }],
    [{ code: 'A', price: 20 }, { code: 'OLD', price: 30 }],
    [{ code: 'A', price: 20 }, { code: 'CAT', price: 30 }],
    [{ code: 'A', price: 20 }, { code: 'MISSING-CAT', price: 30 }],
    [{ code: 'A', price: 20 }, { code: 'NO-NAME', price: 30 }]]) {
    await actor(admin, 'aal2');
    await rejected(() => rpc(rows, [{ code: 'A', price: 10 }]), 'Invalid batch must fail atomically');
    assert.deepEqual(await snapshot(), original); checks++;
  }
  // Correctly shaped expectations ensure catalog validations, not just shape, are tested.
  for (const code of ['Z-UNKNOWN', 'OLD', 'CAT', 'MISSING-CAT', 'NO-NAME']) {
    await actor(admin, 'aal2');
    await rejected(() => rpc([{ code: 'A', price: 20 }, { code, price: 30 }]), `Catalog validation: ${code}`);
    assert.deepEqual(await snapshot(), original); checks++;
  }
  await actor(admin, 'aal2');
  check((await rpc([{ code: 'A', price: 20 }, { code: 'B', estoque: 0 }])).updated === 2, 'Explicit fields update in one batch');
  let current = await snapshot();
  const a = current.find(row => row.code === 'A'), b = current.find(row => row.code === 'B');
  check(Number(a.price) === 20 && a.estoque === 5 && Number(b.price) === 10 && b.estoque === 0, 'Omitted fields are preserved and zero stock is valid');
  for (const field of ['name', 'category', 'image_url', 'description', 'is_deleted', 'id', 'created_at']) {
    assert.deepEqual(a[field], original.find(row => row.code === 'A')[field]); checks++;
  }
  await actor(admin, 'aal2');
  check((await rpc([{ code: 'A', price: 20 }, { code: 'B', estoque: 0 }])).updated === 0, 'An exact replay is a no-op');
  const afterImport = await snapshot();
  await actor(admin, 'aal2');
  await rejected(() => rpc([{ code: 'A', price: 30 }, { code: 'B', estoque: 1 }]), 'Stale preview aborts the entire batch');
  assert.deepEqual(await snapshot(), afterImport); checks++;
  await actor(admin, 'aal2');
  await rejected(() => rpc([{ code: 'A', price: 25 }], []), 'Missing concurrency snapshot rejected');
  await rejected(() => rpc([{ code: 'A', price: 25 }], [{ code: 'A', price: 20, estoque: 5 }]), 'Unexpected snapshot fields rejected');
  await rejected(() => rpc([{ code: 'A', price: 25 }], [{ code: 'B', price: 20 }]), 'Snapshot must match product codes');

  await db.exec('reset role');
  await db.exec("update produtos set estoque=4,description='Conteúdo mais recente' where code='A'");
  await actor(admin, 'aal2');
  await rpc([{ code: 'A', price: 25 }], [{ code: 'A', price: 20 }]);
  current = await snapshot();
  check(current.find(row => row.code === 'A').estoque === 4 && current.find(row => row.code === 'A').description === 'Conteúdo mais recente', 'Price-only import preserves concurrent stock and content changes');

  // The 100-row boundary is accepted by PostgreSQL too.
  await db.exec("insert into produtos(code,name,price,estoque) select 'BOUND-'||n,'Produto '||n,10,5 from generate_series(1,100) n");
  await actor(admin, 'aal2');
  check((await rpc(Array.from({ length: 100 }, (_, i) => ({ code: `BOUND-${i + 1}`, estoque: 0 })))).updated === 100, 'Exactly 100 rows are accepted');
  console.log(`Product import: ${checks} PGlite checks passed (admin/MFA, strict payloads, atomicity, known products/categories, narrow updates, replay and stale preview).`);
} finally { await db.close(); }
