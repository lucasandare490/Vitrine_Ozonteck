process.loadEnvFile('.env');
const fs = require('node:fs');
const { Client } = require('C:/Users/lucas/Documents/Codex/supabase-connection-diagnostic/node_modules/pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: {
  rejectUnauthorized: true, ca: fs.readFileSync('C:/Users/lucas/Documents/Codex/supabase-connection-diagnostic/supabase-ca.crt', 'utf8'),
}, connectionTimeoutMillis: 10000 });
(async () => {
  try {
    await client.connect();
    console.log(JSON.stringify((await client.query("select column_name,data_type from information_schema.columns where table_schema='public' and table_name='categorias'")).rows));
    console.log(JSON.stringify((await client.query("select tablename,policyname,cmd,qual,with_check from pg_policies where schemaname='public' and tablename in ('categorias','enderecos')")).rows));
  } finally { await client.end(); }
})().catch(error => { console.error(error.code || error.name); process.exitCode = 1; });
