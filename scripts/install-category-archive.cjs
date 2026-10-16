const fs = require('node:fs');
process.loadEnvFile('.env');
const { Client } = require('C:/Users/lucas/Documents/Codex/supabase-connection-diagnostic/node_modules/pg');
const client = new Client({ connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true, ca: fs.readFileSync('C:/Users/lucas/Documents/Codex/supabase-connection-diagnostic/supabase-ca.crt', 'utf8') },
  connectionTimeoutMillis: 12000, options: '-c statement_timeout=30000 -c lock_timeout=5000' });
async function fingerprint() {
  return (await client.query("select count(*)::int n, md5(coalesce(string_agg((to_jsonb(c)-'archived_at')::text,'' order by id),'')) hash from public.categorias c")).rows[0];
}
(async () => {
  try {
    await client.connect();
    if (!process.argv.includes('--apply')) throw new Error('Use --apply for the reviewed additive migration.');
    await client.query('begin');
    await client.query('lock table public.categorias in access exclusive mode');
    const before = await fingerprint();
    const sql = fs.readFileSync('supabase/migrations/202610130001_category_archive.sql', 'utf8').replace(/^begin;\s*/,'').replace(/commit;\s*$/,'');
    await client.query(sql);
    if (JSON.stringify(before) !== JSON.stringify(await fingerprint())) throw new Error('Category data changed unexpectedly');
    await client.query('commit');
    const result = (await client.query("select exists(select 1 from information_schema.columns where table_schema='public' and table_name='categorias' and column_name='archived_at') installed, not has_table_privilege('authenticated','public.categorias','delete') delete_blocked")).rows[0];
    if (!result.installed || !result.delete_blocked) throw new Error('Post-install verification failed');
    console.log(JSON.stringify({ ...result, existingCategoriesPreserved: true }));
  } catch (error) { await client.query('rollback').catch(() => {}); console.error(error.code || error.message); process.exitCode = 1; }
  finally { await client.end(); }
})();
