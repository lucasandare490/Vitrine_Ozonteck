import nextEnv from '@next/env';
import pg from 'pg';
import { readFile } from 'node:fs/promises';
nextEnv.loadEnvConfig(process.cwd());
const connectionString=process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL_MISSING');
const db=new pg.Client({connectionString,connectionTimeoutMillis:15000});
try {
  await db.connect();
  const existing=await db.query("select to_regclass('public.customer_email_outbox') as queue, to_regclass('public.pedido_alteracoes') as changes");
  if (!existing.rows[0].changes) throw new Error('ORDER_CHANGES_MIGRATION_REQUIRED');
  if (!existing.rows[0].queue && process.argv.includes('--apply')) {
    await db.query(await readFile('supabase/migrations/202611010001_customer_email_outbox.sql','utf8'));
  }
  const check=await db.query("select to_regclass('public.customer_email_outbox') is not null as queue_installed, to_regprocedure('public.claim_customer_email()') is not null as worker_installed");
  console.log(JSON.stringify(check.rows[0]));
} catch (error) {
  // No connection strings or personal data in diagnostics.
  console.error('Email migration failed:', typeof error.code==='string' ? error.code : 'CONNECTION_OR_SCHEMA_ERROR');
  process.exitCode=1;
} finally { await db.end(); }
