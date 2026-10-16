const fs = require('node:fs');
process.loadEnvFile('.env');
const { Client } = require('C:/Users/lucas/Documents/Codex/supabase-connection-diagnostic/node_modules/pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: true, ca: fs.readFileSync('C:/Users/lucas/Documents/Codex/supabase-connection-diagnostic/supabase-ca.crt', 'utf8') }, connectionTimeoutMillis: 12000, options: '-c statement_timeout=30000 -c lock_timeout=5000' });
(async () => {
  try {
    await client.connect();
    const existing = (await client.query("select to_regclass('public.pedido_alteracoes') as existing, to_regprocedure('public.account_mfa_allowed()') as mfa")).rows[0];
    if (existing.existing) throw new Error('Already installed; inspect before changing');
    if (!existing.mfa) throw new Error('MFA dependency missing');
    if (!process.argv.includes('--apply')) { console.log('Ready for additive migration; not applied.'); return; }
    await client.query('begin');
    await client.query('lock table public.pedidos, public.produtos in share mode');
    const fingerprint = async () => (await client.query("select (select md5(coalesce(string_agg(to_jsonb(p)::text,'' order by id),'')) from public.pedidos p) orders, (select md5(coalesce(string_agg(to_jsonb(p)::text,'' order by code),'')) from public.produtos p) products")).rows[0];
    const before = await fingerprint();
    await client.query(fs.readFileSync('supabase/migrations/202610140001_order_changes.sql','utf8').replace(/^begin;\s*/, '').replace(/commit;\s*$/, ''));
    if (JSON.stringify(before)!==JSON.stringify(await fingerprint())) throw new Error('Unexpected data change');
    await client.query('commit');
    const check = (await client.query("select relrowsecurity as rls from pg_class where oid='public.pedido_alteracoes'::regclass")).rows[0];
    const grants = (await client.query("select has_function_privilege('authenticated','public.reabrir_compra_cancelada(uuid,uuid,text,text)','EXECUTE') as client_execute, has_table_privilege('authenticated','public.pedido_alteracoes','INSERT') as client_insert")).rows[0];
    if (!check.rls || grants.client_execute || grants.client_insert) throw new Error('Post-install permission mismatch');
    await client.query("notify pgrst, 'reload schema'");
    console.log('Installed and verified: RLS enabled, no authenticated writes/RPC, existing orders/products unchanged.');
  } catch (e) { await client.query('rollback').catch(()=>{}); console.error(e.code || e.message); process.exitCode=1; }
  finally { await client.end(); }
})();
