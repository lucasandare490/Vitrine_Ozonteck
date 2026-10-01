-- EXECUTAR PRIMEIRO. Somente leitura; nao instala nem corrige nada.
-- Retorna um JSON, sem dados pessoais de clientes ou pedidos.
begin transaction read only;
select jsonb_pretty(jsonb_build_object(
  'capturado_em', current_timestamp,
  'banco', current_database(),
  'historico_cli_existe', to_regclass('supabase_migrations.schema_migrations') is not null,
  'colunas', (select jsonb_agg(to_jsonb(c)) from (
    select table_name,column_name,data_type,is_nullable,column_default
    from information_schema.columns where table_schema='public'
      and table_name in ('produtos','pedidos','avaliacoes','avaliacoes_produtos','enderecos')
    order by table_name,ordinal_position) c),
  'funcoes', (select jsonb_agg(to_jsonb(f)) from (
    select p.oid::regprocedure::text as assinatura, pg_get_userbyid(p.proowner) as dono,
      p.prosecdef as security_definer, p.proconfig as configuracao,
      p.proacl::text as acl, md5(pg_get_functiondef(p.oid)) as definicao_md5,
      has_function_privilege('anon',p.oid,'EXECUTE') as anon_executa,
      has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_executa,
      has_function_privilege('service_role',p.oid,'EXECUTE') as service_role_executa
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prokind='f'
    order by p.proname,p.oid) f),
  'privilegios_padrao', (select jsonb_agg(to_jsonb(d)) from (
    select pg_get_userbyid(defaclrole) as dono, n.nspname as esquema,
      defaclobjtype as tipo,defaclacl::text as acl
    from pg_default_acl a left join pg_namespace n on n.oid=a.defaclnamespace) d),
  'relacoes', (select jsonb_agg(to_jsonb(r)) from (
    select c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.reloptions,
      c.relacl::text as acl,
      case when c.relkind='v' then pg_get_viewdef(c.oid,true) end as definicao_view
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind in ('r','v') order by c.relname) r),
  'politicas', (select jsonb_agg(to_jsonb(p)) from (
    select schemaname,tablename,policyname,roles,cmd,qual,with_check
    from pg_policies where schemaname in ('public','storage')
    order by schemaname,tablename,policyname) p),
  'indices', (select jsonb_agg(to_jsonb(i)) from (
    select tablename,indexname,indexdef from pg_indexes where schemaname='public'
    order by tablename,indexname) i),
  'restricoes', (select jsonb_agg(to_jsonb(c)) from (
    select conrelid::regclass::text as tabela,conname,convalidated,
      pg_get_constraintdef(oid) as definicao from pg_constraint
    where connamespace='public'::regnamespace order by conrelid,conname) c),
  'gatilhos', (select jsonb_agg(to_jsonb(t)) from (
    select n.nspname as esquema,c.relname as tabela,t.tgname,t.tgenabled,
      pg_get_triggerdef(t.oid) as definicao
    from pg_trigger t join pg_class c on c.oid=t.tgrelid
      join pg_namespace n on n.oid=c.relnamespace
    where not t.tgisinternal and n.nspname in ('public','auth')
    order by n.nspname,c.relname,t.tgname) t),
  'buckets', (select jsonb_agg(to_jsonb(b)) from (
    select id,public,file_size_limit,allowed_mime_types from storage.buckets
    where id in ('avatars','produtos','avaliacoes-produtos') order by id) b),
  'categorias', (select jsonb_agg(name order by name) from public.categorias),
  'catalogo_incluindo_retirados', (select jsonb_agg(to_jsonb(p)) from (
    select code,name,category,price,estoque,is_deleted from public.produtos order by code) p)
)) as diagnostico;
commit;

-- Opcional: apenas se historico_cli_existe=true, executar separadamente:
-- select version,name from supabase_migrations.schema_migrations order by version;
-- SQL colado no Editor pode nao constar nesse historico. Ausencia nao prova pendencia.
