// Local, ephemeral PostgreSQL only. No environment file or remote connection.
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite();
const admin = '10000000-0000-0000-0000-000000000001';
const customer = '10000000-0000-0000-0000-000000000002';
const existing = '20000000-0000-0000-0000-000000000001';
const archived = '20000000-0000-0000-0000-000000000002';
const added = '20000000-0000-0000-0000-000000000003';
const migrationUrl = new URL('../supabase/migrations/202611040002_category_audit.sql', import.meta.url);
const readMigration = (name) => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
const role = async (name, uid = '') => {
  assert.ok(['authenticated', 'anon', 'service_role'].includes(name));
  await db.exec(`reset role; set role ${name}`);
  await db.query("select set_config('test.uid', $1, false), set_config('test.role', $2, false)", [uid, name]);
};
const audit = async () => (await db.query('select * from public.category_audit order by id')).rows;
const snapshot = async (table) => (await db.query(`select to_jsonb(t) as row from public.${table} t order by id`)).rows;

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    set timezone='UTC';
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('test.uid', true), '')::uuid
    $$;
    create function auth.role() returns text language sql stable as $$
      select nullif(current_setting('test.role', true), '')
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    create table public.profiles(id uuid primary key references auth.users(id) on delete cascade, role text);
    create table public.categorias(id uuid primary key default gen_random_uuid(), name text not null unique,
      created_at timestamptz not null default now());
    create table public.produtos(id uuid primary key default gen_random_uuid(), name text,
      category text, price numeric, estoque integer, is_deleted boolean default false);
    insert into auth.users values ('${admin}'), ('${customer}');
    insert into public.profiles values ('${admin}', 'admin'), ('${customer}', 'cliente');
    insert into public.categorias(id, name) values ('${existing}', 'Ativa'), ('${archived}', 'Arquivada');
    insert into public.produtos(name, category, price, estoque, is_deleted) values
      ('Produto ativo', 'Ativa', 25, 3, false), ('Produto retirado', 'Arquivada', 10, 7, true);
    alter table public.categorias enable row level security;
    grant select on public.categorias to anon, authenticated;
    grant insert, update, delete on public.categorias to authenticated;
    grant all on public.categorias to service_role;
  `);
  // Use the real administrator authorization and category policies, not a boolean stub.
  const setup = await readMigration('202609240001_ozonteck_complete_setup.sql');
  await db.exec(setup.slice(setup.indexOf('create or replace function public.is_admin()'),
    setup.indexOf('-- Impede que um cliente')));
  await db.exec(setup.slice(setup.indexOf('create policy categories_public_read'),
    setup.indexOf('-- Dados privados do cliente.')));
  await db.exec(await readMigration('202610130001_category_archive.sql'));
  await db.query('update public.categorias set archived_at=$1 where id=$2', ['2026-01-01T00:00:00Z', archived]);

  const categoriesBefore = await snapshot('categorias');
  const productsBefore = await snapshot('produtos');
  // Supabase installations may grant new objects broadly through default ACLs.
  await db.exec(`
    alter default privileges in schema public grant all on tables to public, anon, authenticated, service_role;
    alter default privileges in schema public grant all on sequences to public, anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `);
  const migration = await readFile(migrationUrl, 'utf8');
  await db.exec(migration);
  await db.exec(migration);
  assert.deepEqual(await snapshot('categorias'), categoriesBefore, 'Migration must preserve every category');
  assert.deepEqual(await snapshot('produtos'), productsBefore, 'Migration must preserve every product');
  assert.equal((await audit()).length, 0, 'Do not fabricate historical events');
  console.log('PASS: migration/reapplication preserve active/archived categories and products; no backfill.');

  // Fail on missing events, wrong snapshots/actor, duplicate triggers or client timestamps.
  await role('authenticated', admin);
  const start = Date.now();
  await db.query('insert into public.categorias(id, name, created_at) values ($1, $2, $3)',
    [added, 'Nova', '2000-01-01T00:00:00Z']);
  await db.query('update public.categorias set archived_at=$1 where id=$2', ['2001-01-01T00:00:00Z', added]);
  await db.query('update public.categorias set archived_at=null where id=$1', [added]);
  await db.query('update public.categorias set name=$1 where id=$2', ['Renomeada', added]);
  const events = await audit();
  assert.deepEqual(events.map(({ action }) => action), ['INSERT', 'UPDATE', 'UPDATE', 'UPDATE']);
  assert.ok(events.every((row) => row.actor === admin && row.actor_role === 'authenticated' && row.category_id === added));
  assert.ok(events.every((row) => new Date(row.created_at).getTime() >= start && new Date(row.created_at).getTime() <= Date.now()));
  assert.equal(events[0].old_data, null);
  assert.deepEqual(events[0].new_data, {
    id: added, name: 'Nova', created_at: '2000-01-01T00:00:00+00:00', archived_at: null,
  });
  assert.deepEqual(events[1].old_data, events[0].new_data);
  assert.deepEqual(events[1].new_data, { ...events[0].new_data, archived_at: '2001-01-01T00:00:00+00:00' });
  assert.deepEqual(events[2].old_data, events[1].new_data);
  assert.deepEqual(events[2].new_data, events[0].new_data);
  assert.deepEqual(events[3].old_data, events[2].new_data);
  assert.deepEqual(events[3].new_data, { ...events[2].new_data, name: 'Renomeada' });
  await db.exec('begin');
  await db.query("update public.categorias set name='Rollback' where id=$1", [added]);
  assert.equal((await audit()).length, 5);
  await db.exec('rollback');
  assert.deepEqual(await audit(), events, 'Rolled back mutations must not leave audit events');
  console.log('PASS: admin insert/archive/restore/rename record exact full snapshots, actor and server time; rollback is atomic.');

  // Privileges must reject direct writes, even for administrators and service_role.
  for (const [name, uid] of [['anon', ''], ['authenticated', customer], ['authenticated', admin], ['service_role', '']]) {
    await role(name, uid);
    if (name === 'anon') {
      await assert.rejects(audit(), /permission denied/);
    } else {
      assert.equal((await audit()).length, uid === customer ? 0 : 4);
    }
    for (const sql of [
      `insert into public.category_audit(category_id, action) values ('forged', 'INSERT')`,
      `update public.category_audit set actor=null`,
      `delete from public.category_audit`,
      `truncate public.category_audit`,
      `select nextval('public.category_audit_id_seq')`,
      `select public.audit_category_change()`,
    ]) {
      await assert.rejects(db.exec(sql), /permission denied/, `${name}/${uid}: ${sql}`);
    }
    if (name === 'anon' || uid === customer) {
      await assert.rejects(db.query("insert into public.categorias(name) values ('Unauthorized')"), /permission denied|row-level security/);
      const update = () => db.query("update public.categorias set name='Unauthorized' where id=$1 returning id", [existing]);
      if (name === 'anon') await assert.rejects(update(), /permission denied/);
      else assert.equal((await update()).rows.length, 0);
    }
    if (name === 'authenticated') {
      await assert.rejects(db.query('delete from public.categorias where id=$1', [added]), /permission denied/);
    }
  }
  await role('authenticated', customer);
  assert.deepEqual((await db.query('select name from public.categorias order by name')).rows,
    [{ name: 'Ativa' }, { name: 'Renomeada' }], 'Archived categories remain hidden from customers');
  // Even if SELECT is accidentally granted to anon, RLS must still hide all events.
  await db.exec('reset role; grant select on public.category_audit to anon');
  await role('anon');
  assert.equal((await audit()).length, 0);
  await db.exec('reset role; revoke select on public.category_audit from anon');
  console.log('PASS: admin-only client reads, anon/customer isolation and immutable audit ACLs (including truncate/sequence/RPC).');

  // Untrusted search paths/temp objects cannot spoof the actor or absorb audit writes.
  await db.exec(`reset role;
    create schema attacker;
    create function attacker.uid() returns uuid language sql as $$ select '${customer}'::uuid $$;
    create function attacker.role() returns text language sql as $$ select 'forged'::text $$;
    grant usage on schema attacker to authenticated;
    create temp table category_audit(marker text);
    set search_path=attacker, pg_temp, public;
  `);
  await role('authenticated', admin);
  await db.query("update public.categorias set name='Nome seguro' where id=$1", [added]);
  const secureEvent = (await audit()).at(-1);
  assert.equal(secureEvent.actor, admin);
  assert.equal(secureEvent.actor_role, 'authenticated');
  assert.equal(secureEvent.new_data.name, 'Nome seguro');
  await db.exec('reset role; reset search_path');
  assert.equal((await db.query('select * from pg_temp.category_audit')).rows.length, 0);

  await role('service_role');
  await db.query('delete from public.categorias where id=$1', [added]);
  const deletion = (await audit()).at(-1);
  assert.equal(deletion.action, 'DELETE');
  assert.equal(deletion.actor, null, 'No end-user identity may be invented for server mutations');
  assert.equal(deletion.actor_role, 'service_role');
  assert.equal(deletion.category_id, added);
  assert.deepEqual(deletion.old_data, secureEvent.new_data);
  assert.equal(deletion.new_data, null);
  await db.exec('reset role');
  await db.query('delete from auth.users where id=$1', [admin]);
  const savedEvents = await audit();
  assert.ok(savedEvents.some((row) => row.actor === admin), 'Deleting the actor must not erase history');
  await db.exec(migration);
  assert.deepEqual(await audit(), savedEvents, 'Reapplication must preserve all history');
  assert.deepEqual(await snapshot('categorias'), categoriesBefore);
  assert.deepEqual(await snapshot('produtos'), productsBefore);
  // The reapplied trigger must still fire exactly once.
  await role('service_role');
  await db.query("update public.categorias set name='Após reaplicação' where id=$1", [existing]);
  assert.equal((await audit()).length, savedEvents.length + 1);
  console.log('PASS: hostile search path, service deletion without uid, deleted-actor retention and history-preserving reapplication.');

  // Full-row snapshots must include future columns and every row in bulk writes.
  await db.exec('reset role; alter table public.categorias add column details jsonb');
  await role('service_role');
  const beforeBulk = (await audit()).length;
  await db.exec(`update public.categorias set details='{"note":"Batch metadata"}'::jsonb`);
  const bulk = (await audit()).slice(beforeBulk);
  assert.equal(bulk.length, 2);
  assert.deepEqual(bulk.map((row) => row.category_id).sort(), [existing, archived]);
  assert.ok(bulk.every((row) => row.action === 'UPDATE' && row.old_data.details === null));
  for (const row of bulk) assert.deepEqual(row.new_data.details, { note: 'Batch metadata' });
  await db.exec('reset role');
  assert.deepEqual(await snapshot('produtos'), productsBefore);
  console.log('PASS: bulk changes create one event per row, including columns added later; products remain unchanged.');
} finally {
  await db.close();
}
