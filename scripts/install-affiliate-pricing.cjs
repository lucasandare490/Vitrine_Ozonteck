const fs = require('node:fs');
const path = require('node:path');
process.loadEnvFile('.env');
const { Client } = require(process.argv[2]);
const url = new URL(process.env.DATABASE_URL);
if (url.hostname !== 'db.tnqdecfmpkmnihpctumo.supabase.co') throw new Error('Unexpected database host');
const client = new Client({ connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: true, ca: fs.readFileSync(process.argv[3], 'utf8') },
  connectionTimeoutMillis: 12000, options: '-c statement_timeout=30000 -c lock_timeout=5000' });
const files = ['202610090001_affiliate_pricing.sql','202610090002_affiliate_price_source.sql'];
async function fingerprints() {
  const result = {};
  for (const table of ['produtos','profiles','pedidos']) {
    result[table] = (await client.query(`select count(*)::int n, md5(coalesce(string_agg(to_jsonb(t)::text, '' order by id),'')) hash from public.${table} t`)).rows[0];
  }
  return result;
}
(async () => {
  try {
    await client.connect();
    const prerequisites = (await client.query(`select
      to_regprocedure('public.account_mfa_allowed()') is not null mfa,
      to_regprocedure('public.is_admin()') is not null admin,
      to_regprocedure('public.reservar_pedido_checkout(text,uuid,numeric,jsonb,jsonb,integer)') is not null reserve,
      exists(select 1 from pg_trigger where tgrelid='public.profiles'::regclass and tgname='protect_profile_role_trigger' and tgenabled <> 'D') role_protected,
      not has_function_privilege('authenticated','public.reservar_pedido_checkout(text,uuid,numeric,jsonb,jsonb,integer)','EXECUTE') reserve_private`)).rows[0];
    console.log(JSON.stringify({ prerequisites }));
    if (Object.values(prerequisites).some(value => value !== true)) throw new Error('Missing security prerequisite');
    if (!process.argv.includes('--apply')) return;
    await client.query('begin');
    await client.query('lock table public.produtos, public.profiles, public.pedidos in share row exclusive mode');
    const before = await fingerprints();
    for (const file of files) {
      let sql = fs.readFileSync(path.join('supabase/migrations',file),'utf8');
      sql = sql.replace(/^begin;\s*$/m,'').replace(/^commit;\s*$/m,'');
      await client.query(sql);
    }
    const after = await fingerprints();
    if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Existing records changed');
    for (const role of ['anon','authenticated']) {
      for (const table of ['affiliate_access','affiliate_prices','customer_prices','pricing_audit']) {
        for (const privilege of ['SELECT','INSERT','UPDATE','DELETE']) {
          const { rows } = await client.query('select has_table_privilege($1,$2,$3) allowed',[role,`public.${table}`,privilege]);
          if (rows[0].allowed) throw new Error('Unexpected table privilege');
        }
      }
    }
    const summary = (await client.query(`select
      (select count(*) from public.affiliate_prices)::int prices,
      (select count(*) from public.affiliate_access where enabled)::int approvals,
      (select count(*) from public.produtos p where not coalesce(is_deleted,false) and not exists(select 1 from public.affiliate_prices a where a.product_code=p.code))::int unpriced`)).rows[0];
    const missing = (await client.query(`select p.code,p.name from public.produtos p where not coalesce(is_deleted,false) and not exists(select 1 from public.affiliate_prices a where a.product_code=p.code) order by p.code`)).rows;
    await client.query('commit');
    const installed = (await client.query("select to_regprocedure('public.my_store_prices()') is not null ready")).rows[0].ready;
    fs.writeFileSync('docs/affiliate-pricing-installation.json',JSON.stringify({checkedAt:new Date().toISOString(),installed,recordsPreserved:JSON.stringify(before)===JSON.stringify(after),summary,missing},null,2));
    console.log(JSON.stringify({ installed, recordsPreserved:true, summary, missing }));
  } catch(error) {
    await client.query('rollback').catch(()=>{});
    console.error(error.code || error.name, error.message.replace(/postgres(?:ql)?:\/\/[^\s]+/g,'[redacted]'));
    process.exitCode=1;
  } finally { await client.end(); }
})();
