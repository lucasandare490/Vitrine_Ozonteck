// Explicit, additive migrations only. Run without --apply for a read-only plan.
import nextEnv from '@next/env';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
nextEnv.loadEnvConfig(process.cwd());
const allowed = [
  '202611040002_category_audit.sql', '202611040003_pickup_ready.sql',
  '202611040004_support_tickets.sql', '202611040005_join_interests.sql',
  '202611040006_product_import.sql',
  '202611040007_admin_reminders.sql',
];
const requested = process.argv.slice(2).filter(x => !x.startsWith('--'));
if (!requested.length || requested.some(x => !allowed.includes(x))) throw new Error('EXPLICIT_ALLOWED_MIGRATIONS_REQUIRED');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000 });
try {
  await client.connect();
  await client.query('select pg_advisory_lock(20261104)');
  const ledger = (await client.query("select to_regclass('public.continuity_migrations') as name")).rows[0].name;
  if (process.argv.includes('--apply')) await client.query(`
    create table if not exists public.continuity_migrations(name text primary key,sha256 text not null,applied_at timestamptz not null default now());
    alter table public.continuity_migrations enable row level security;
    revoke all on public.continuity_migrations from public,anon,authenticated;
  `);
  for (const name of requested) {
    const sql = await readFile(`supabase/migrations/${name}`, 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const previous = ledger || process.argv.includes('--apply') ? (await client.query('select sha256 from public.continuity_migrations where name=$1', [name])).rows[0] : null;
    if (previous) {
      if (previous.sha256 !== checksum) throw new Error('MIGRATION_CHECKSUM_CHANGED');
      console.log(name, 'already_applied'); continue;
    }
    if (!process.argv.includes('--apply')) { console.log(name, 'pending'); continue; }
    await client.query('begin');
    try {
      await client.query("set local lock_timeout='5s'; set local statement_timeout='30s'");
      await client.query(sql.replace(/^\s*begin;\s*/i, '').replace(/\s*commit;\s*$/i, ''));
      await client.query('insert into public.continuity_migrations(name,sha256) values($1,$2)', [name, checksum]);
      await client.query('commit'); console.log(name, 'applied');
    } catch (error) { await client.query('rollback'); throw error; }
  }
} catch (error) {
  console.error('MIGRATION_FAILED', /^[A-Z0-9_]+$/.test(error.code || '') ? error.code : 'CHECK_CONNECTION_OR_PRECONDITIONS');
  process.exitCode = 1;
} finally { await client.end(); }
