// Runs only against local, ephemeral PostgreSQL. No credentials or remote writes.
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite();
const owner = '10000000-0000-0000-0000-000000000001';
const other = '10000000-0000-0000-0000-000000000002';
const admin = '10000000-0000-0000-0000-000000000003';
const readMigration = name => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
const role = async (name, uid = '', aal = 'aal1') => {
  assert.ok(['anon', 'authenticated', 'service_role'].includes(name));
  await db.exec(`reset role; set role ${name}`);
  await db.query("select set_config('test.uid',$1,false), set_config('test.aal',$2,false)", [uid, aal]);
};
const submit = (values = {}) => db.query('select public.submit_join_interest($1,$2,$3,$4,$5) as id', [
  values.name ?? null, values.phone ?? null, values.email ?? null, values.interest ?? 'distribuicao',
  Object.hasOwn(values, 'consent') ? values.consent : true,
]);
const mark = (id, status) => db.query('select public.admin_set_join_interest_status($1,$2) as id', [id, status]);
const all = async () => (await db.query('select * from public.join_interests order by user_id')).rows;

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text, phone text);
    create table auth.mfa_factors(user_id uuid, status text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('test.uid',true),'')::uuid
    $$;
    create function auth.jwt() returns jsonb language sql stable as $$
      select jsonb_build_object('aal',coalesce(nullif(current_setting('test.aal',true),''),'aal1'),'role','admin')
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    create table public.profiles(id uuid primary key, role text, nome text, telefone text, email text);
    insert into auth.users values
      ('${owner}','account@example.test',null), ('${other}',null,null), ('${admin}','admin@example.test',null);
    insert into public.profiles values
      ('${owner}','cliente','Maria Silva','(81) 98147-2684','profile@example.test'),
      ('${other}','cliente',null,null,null), ('${admin}','admin','Admin',null,null);
    insert into auth.mfa_factors values ('${admin}','verified');
  `);
  // Exercise the existing database authorization and optional-account MFA rules.
  const setup = await readMigration('202609240001_ozonteck_complete_setup.sql');
  await db.exec(setup.slice(setup.indexOf('create or replace function public.is_admin()'), setup.indexOf('-- Impede que um cliente')));
  const mfa = await readMigration('202610010001_account_mfa.sql');
  await db.exec(mfa.slice(mfa.indexOf('create or replace function public.account_mfa_allowed()'),
    mfa.indexOf('create or replace function public.enforce_account_mfa()')));
  // Prove explicit revokes work even with broad Supabase installation defaults.
  await db.exec(`
    alter default privileges in schema public grant all on tables to public, anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
  `);
  const migration = await readMigration('202611040005_join_interests.sql');
  await db.exec(migration);
  await db.exec(migration);

  await role('anon');
  await assert.rejects(all(), /permission denied/);
  await assert.rejects(submit(), /permission denied/);
  await assert.rejects(mark(owner, 'contacted'), /permission denied/);
  await role('authenticated');
  await assert.rejects(submit(), /AUTH_REQUIRED/);
  await role('authenticated', owner);
  for (const consent of [false, null]) await assert.rejects(submit({ consent }), /CONSENT_REQUIRED/);
  assert.equal((await all()).length, 0, 'No row without explicit consent');
  const start = Date.now();
  const id = (await submit()).rows[0].id;
  const first = (await all())[0];
  assert.equal(first.user_id, owner);
  assert.equal(first.name, 'Maria Silva');
  assert.equal(first.phone, '81981472684');
  assert.equal(first.email, 'account@example.test');
  assert.equal(first.interest, 'distribuicao');
  assert.equal(first.status, 'new');
  assert.equal(first.contact_consent, true);
  assert.equal(first.consent_version, 'join-contact-v1');
  assert.ok(new Date(first.consented_at).getTime() >= start);
  assert.equal((await submit()).rows[0].id, id);
  assert.deepEqual((await all())[0], first, 'Identical retries must not mutate consent, times or status');
  await assert.rejects(submit({ interest: 'consumo' }), /JOIN_RATE_LIMIT/);
  console.log('PASS: authenticated explicit consent, profile/account fallback, canonical contact data and idempotent deduplication.');

  // A JWT role claim alone must not grant administrative powers.
  await assert.rejects(mark(id, 'contacted'), /ADMIN_REQUIRED/);
  for (const sql of [
    "insert into public.join_interests(user_id,name,phone,email,interest,contact_consent) values ('10000000-0000-0000-0000-000000000002','Forged','81981472684','forged@example.test','consumo',true)",
    "update public.join_interests set status='contacted'", 'delete from public.join_interests', 'truncate public.join_interests',
  ]) await assert.rejects(db.exec(sql), /permission denied/);
  await role('authenticated', other);
  assert.equal((await all()).length, 0);
  await assert.rejects(submit(), /INVALID_CONTACT/);
  const valid = { name: 'João Souza', phone: '+55 (81) 99876-5432', email: ' Joao@example.test ', interest: 'ambos' };
  const otherId = (await submit(valid)).rows[0].id;
  assert.notEqual(otherId, id);
  const own = (await all())[0];
  assert.equal(own.phone, '5581998765432');
  assert.equal(own.email, 'joao@example.test');
  await assert.rejects(mark(id, 'new'), /ADMIN_REQUIRED/);
  console.log('PASS: own-row isolation, validated provided contacts, forged claims and all direct client writes denied.');

  // Validation precedes quota, so invalid requests cannot be mistaken for throttling.
  for (const invalid of [
    { name: 'A' }, { name: 'a'.repeat(121) }, { name: 'Name\nInjected' },
    { phone: '123' }, { phone: '0'.repeat(11) }, { phone: '81981472684<script>' }, { phone: '9'.repeat(33) },
    { email: 'no-at-sign' }, { email: 'a@b' }, { email: 'a@example.test\nInjected' },
    { email: `${'a'.repeat(250)}@example.test` }, { interest: 'unexpected' }, { interest: '' },
  ]) await assert.rejects(submit({ ...valid, ...invalid }), /INVALID_CONTACT|INVALID_INTEREST/);
  assert.deepEqual((await all())[0], own, 'Invalid data must leave the saved lead unchanged');

  await role('authenticated', admin, 'aal1');
  assert.equal((await all()).length, 0, 'Verified-factor admins need AAL2 to read leads');
  await assert.rejects(mark(id, 'contacted'), /ADMIN_REQUIRED/);
  await role('authenticated', admin, 'aal2');
  assert.equal((await all()).length, 2);
  for (const invalid of [null, '', 'closed']) await assert.rejects(mark(id, invalid), /INVALID_STATUS/);
  await assert.rejects(mark('90000000-0000-0000-0000-000000000001', 'new'), /INTEREST_NOT_FOUND/);
  assert.equal((await mark(id, 'contacted')).rows[0].id, id);
  const contacted = (await all()).find(row => row.id === id);
  assert.equal(contacted.status, 'contacted');
  assert.equal(contacted.contacted_by, admin);
  assert.ok(contacted.contacted_at);
  await mark(id, 'contacted');
  assert.deepEqual((await all()).find(row => row.id === id), contacted);
  await role('authenticated', owner);
  await assert.rejects(submit({ interest: 'consumo' }), /JOIN_RATE_LIMIT/, 'Admin changes cannot bypass submission quota');
  await db.exec('reset role');
  await db.query("update public.join_interests set last_submitted_at=clock_timestamp()-interval '61 seconds' where id=$1", [id]);
  await role('authenticated', owner);
  assert.equal((await submit({ interest: 'consumo' })).rows[0].id, id);
  const changed = (await all())[0];
  assert.equal(changed.interest, 'consumo');
  assert.equal(changed.status, 'contacted', 'User edits must preserve the administrative contact status');
  assert.equal(changed.contacted_by, admin);
  assert.ok(new Date(changed.consented_at).getTime() >= new Date(first.consented_at).getTime());
  await role('authenticated', admin, 'aal2');
  await mark(id, 'new');
  const reopened = (await all()).find(row => row.id === id);
  assert.equal(reopened.status, 'new');
  assert.equal(reopened.contacted_at, null);
  assert.equal(reopened.contacted_by, null);
  console.log('PASS: contact limits, rate-bounded edits, admin MFA, durable/idempotent status changes and missing-row failures.');

  await db.exec('reset role');
  await db.query("insert into auth.mfa_factors values ($1,'verified')", [owner]);
  await role('authenticated', owner, 'aal1');
  assert.equal((await all()).length, 0);
  await assert.rejects(submit(), /AUTH_REQUIRED/);
  await role('authenticated', owner, 'aal2');
  assert.equal((await all()).length, 1);
  await db.exec('reset role');
  const saved = await all();
  await db.exec(migration);
  assert.deepEqual(await all(), saved, 'Reapplication must not overwrite leads or consent');
  assert.equal((await db.query('select count(*)::int n from public.join_interests')).rows[0].n, 2);
  await role('service_role');
  await assert.rejects(submit(), /permission denied/);
  console.log('PASS: customer MFA, one row per account, history-preserving reapplication and no server-role submission bypass.');
} finally {
  await db.close();
}
