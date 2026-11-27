// Actual address policies/index/RPC in disposable PostgreSQL. No credentials or remote writes.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const owner = '10000000-0000-0000-0000-000000000001';
const other = '10000000-0000-0000-0000-000000000002';
const first = '20000000-0000-0000-0000-000000000001';
const second = '20000000-0000-0000-0000-000000000002';
const foreign = '20000000-0000-0000-0000-000000000003';
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const role = async (name, user = '') => {
  assert.ok(['postgres', 'authenticated', 'anon'].includes(name));
  await db.exec(`reset role; set role ${name}`);
  await db.query("select set_config('test.uid',$1,false)", [user]);
};
const choose = id => db.query('select public.set_primary_address($1)', [id]);
const snapshot = async () => {
  await role('postgres');
  return (await db.query('select * from enderecos order by id')).rows;
};
const rejected = async (fn, pattern) => { await assert.rejects(fn, pattern); checks++; };

try {
  await db.exec(`create role authenticated; create role anon; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
    create table enderecos(id uuid primary key,user_id uuid not null,apelido text,rua text,numero text,cep text,cidade text,estado text,principal boolean,created_at timestamptz default now());
    alter table enderecos enable row level security;
    grant usage on schema public,auth to authenticated,anon;
    grant select,insert,update,delete on enderecos to authenticated;
  `);
  const setup = await readFile('supabase/migrations/202609240001_ozonteck_complete_setup.sql', 'utf8');
  await db.exec(setup.slice(setup.indexOf('create policy addresses_owner_all'), setup.indexOf('create policy addresses_admin_read')));
  const hardening = await readFile('supabase/migrations/202609240002_security_hardening.sql', 'utf8');
  const indexStart = hardening.indexOf('create unique index if not exists enderecos_um_principal_por_usuario_idx');
  await db.exec(hardening.slice(indexStart, hardening.indexOf(';', indexStart) + 1));
  await db.exec(hardening.slice(hardening.indexOf('create or replace function public.set_primary_address('), hardening.indexOf('-- Libera reservas abandonadas.')));
  const acl = async () => (await db.query("select proacl::text,proowner from pg_proc where oid='public.set_primary_address(uuid)'::regprocedure")).rows[0];
  const beforeAcl = await acl();
  // Deliberately insert the inactive row before the active row: this reproduces the old failure.
  await db.query(`insert into enderecos(id,user_id,apelido,rua,numero,cep,cidade,estado,principal) values
    ($1,$4,'Casa','Rua de verificação','1','50000-000','Recife','PE',false),
    ($2,$4,'Trabalho','Rua de verificação','2','50000-000','Recife','PE',true),
    ($3,$5,'Outro titular','Outra rua','3','50000-000','Recife','PE',true)`, [first, second, foreign, owner, other]);
  await role('authenticated', owner);
  await rejected(() => choose(first), error => error.code === '23505');
  const unchanged = await snapshot();
  const migration = await readFile('supabase/migrations/202611270001_primary_address_switch.sql', 'utf8');
  await db.exec(migration); await db.exec(migration);
  assert.deepEqual(await acl(), beforeAcl); checks++;
  assert.deepEqual(await snapshot(), unchanged); checks++;
  await role('authenticated', owner);
  check((await db.query('select * from enderecos')).rows.length === 2, 'Owner sees exactly their two addresses');
  for (const id of [first, second, first, second, second, first]) {
    await choose(id);
    const selected = (await db.query('select id from enderecos where principal=true')).rows;
    check(selected.length === 1 && selected[0].id === id, 'Exactly the requested address remains primary');
  }
  await db.query("update enderecos set rua='Rua editada',numero='42' where id=$1", [first]);
  check((await db.query('select rua,numero from enderecos where id=$1', [first])).rows[0].numero === '42', 'Edited address persisted');
  const beforeDenied = await snapshot();
  await role('authenticated', owner);
  await rejected(() => choose(foreign), /Endereco nao encontrado/);
  await rejected(() => choose('20000000-0000-0000-0000-000000000099'), /Endereco nao encontrado/);
  await rejected(() => choose(null), /Endereco nao encontrado/);
  check((await db.query("update enderecos set numero='forjado' where id=$1 returning id", [foreign])).rows.length === 0, 'RLS blocks foreign edits');
  check((await db.query('delete from enderecos where id=$1 returning id', [foreign])).rows.length === 0, 'RLS blocks foreign deletes');
  await role('authenticated'); await rejected(() => choose(first), /Autenticacao obrigatoria/);
  await role('anon'); await rejected(() => choose(first), /permission denied/);
  assert.deepEqual(await snapshot(), beforeDenied); checks++;
  await role('authenticated', owner);
  await rejected(() => db.query('update enderecos set principal=true where id=$1', [second]), error => error.code === '23505');
  check((await db.query('delete from enderecos where id=$1 returning id', [second])).rows.length === 1, 'Owner can remove their inactive address');
  await choose(first);
  check((await db.query('select id from enderecos where principal=true')).rows[0].id === first, 'Remaining primary address is usable');
  console.log(`PASS ${checks} saved-address PostgreSQL checks: reproduced old index conflict; multiple addresses, repeated switching, edits, removal, ownership, rollback, grants and idempotent migration. No production writes or browser proof.`);
} finally { await db.close(); }
