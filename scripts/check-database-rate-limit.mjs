import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const db = new PGlite();
const key = 'a'.repeat(64), other = 'b'.repeat(64);
const consume = async (namespace = 'checkout', identity = key, limit = 2, window = 60000) =>
  (await db.query('select public.consume_api_rate_limit($1,$2,$3,$4) as allowed', [namespace, identity, limit, window])).rows[0].allowed;
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    alter default privileges in schema public grant all on tables to public,anon,authenticated,service_role;
    alter default privileges in schema public grant execute on functions to public,anon,authenticated,service_role;`);
  const sql = await readFile(new URL('../supabase/migrations/202611050001_database_rate_limit.sql', import.meta.url), 'utf8');
  await db.exec(sql); await db.exec(sql);
  await db.exec('set role service_role');
  const decisions = await Promise.all(Array.from({ length: 8 }, () => consume()));
  assert.equal(decisions.filter(Boolean).length, 2, 'Only two callers may consume this shared window');
  assert.equal(await consume('checkout', other), true, 'Other identities are independent');
  assert.equal(await consume('payment'), true, 'Other routes are independent');
  await db.exec('reset role');
  await db.query("update public.api_rate_limits set requests=array[clock_timestamp()-interval '65 seconds',clock_timestamp()-interval '5 seconds'] where namespace='checkout' and identity_hash=$1", [key]);
  await db.exec('set role service_role');
  assert.equal(await consume(), true, 'Prune old requests, preserve recent ones');
  assert.equal(await consume(), false, 'A recent request still occupies its slot');
  await assert.rejects(() => consume('checkout', 'not-a-hash'));
  await assert.rejects(() => consume('checkout', key, 0));
  await assert.rejects(() => consume('checkout', key, 10001));
  await assert.rejects(() => consume('checkout', key, 2, 0));
  await assert.rejects(() => consume('checkout', key, 2, 86400001));
  await assert.rejects(() => consume('a'.repeat(101)));
  await assert.rejects(() => consume('checkout', null));
  await assert.rejects(() => db.query('select * from public.api_rate_limits'));
  for (const role of ['anon', 'authenticated']) {
    await db.exec('reset role; set role ' + role);
    await assert.rejects(() => consume());
    await assert.rejects(() => db.query('select * from public.api_rate_limits'));
    await assert.rejects(() => db.query('delete from public.api_rate_limits'));
  }
  await db.exec('reset role');
  assert.equal((await db.query("select relrowsecurity from pg_class where oid='public.api_rate_limits'::regclass")).rows[0].relrowsecurity, true);
  await db.query("insert into public.api_rate_limits values ('expired',$1,array[clock_timestamp()-interval '3 days'],clock_timestamp()-interval '2 days')", [other]);
  await db.exec('set role service_role'); await consume('cleanup'); await db.exec('reset role');
  assert.equal((await db.query("select count(*)::int as n from public.api_rate_limits where namespace='expired'")).rows[0].n, 0);
  assert.equal((await db.query('select max(cardinality(requests)) as n from public.api_rate_limits')).rows[0].n, 2);
  console.log('PASS: shared rolling window, route/identity isolation, expiry, bounded cleanup, input validation, RLS and server-only permissions.');
} finally { await db.close(); }
