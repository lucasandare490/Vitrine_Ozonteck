import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const read = (path) => fs.readFile(path, 'utf8');
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema storage;
    create table storage.buckets(id text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table categorias(name text);
    insert into categorias values ('Nutracêuticos'),('Bem Estar'),('Cuidados Capilares');
    create table produtos(id uuid default gen_random_uuid() primary key,code text unique,
      name text,category text,price numeric check(price>0),estoque integer,image_url text,
      description text,is_deleted boolean default false);
    create function cancelar_reserva_checkout(text) returns boolean language sql as $$select true$$;
    create function liberar_reservas_expiradas() returns integer language sql as $$select 0$$;
    create function reservar_pedido_checkout(text,uuid,numeric,jsonb,jsonb,integer) returns jsonb language sql as $$select '{}'::jsonb$$;
    create function processar_status_pagamento(text,text,text,numeric) returns jsonb language sql as $$select '{}'::jsonb$$;
    create function set_primary_address(uuid) returns void language sql as $$select$$;
    create function is_admin() returns boolean language sql as $$select false$$;
    create function handle_new_auth_user() returns trigger language plpgsql as $$begin return new; end$$;
    create table auth.users(id uuid);
    create trigger qa_auth after insert on auth.users for each row execute function handle_new_auth_user();
    grant execute on all functions in schema public to anon,authenticated,service_role;
    insert into produtos(code,name,category,price,estoque) values('EXISTING','Existente','Bem Estar',10,5);`);
  const patch = await read('supabase/migrations/202609290001_function_execute_permissions.sql');
  await db.exec(patch);
  await db.exec(patch);
  const privileges = (await db.query(`select proname,
    has_function_privilege('anon',oid,'EXECUTE') as anon,
    has_function_privilege('authenticated',oid,'EXECUTE') as authenticated,
    has_function_privilege('service_role',oid,'EXECUTE') as server
    from pg_proc where pronamespace='public'::regnamespace`)).rows;
  for (const name of ['cancelar_reserva_checkout','liberar_reservas_expiradas','reservar_pedido_checkout','processar_status_pagamento']) {
    assert.deepEqual(privileges.find(p=>p.proname===name),{proname:name,anon:false,authenticated:false,server:true});
  }
  assert.equal(privileges.find(p=>p.proname==='is_admin').anon,true);
  assert.equal(privileges.find(p=>p.proname==='set_primary_address').anon,false);
  assert.equal(privileges.find(p=>p.proname==='set_primary_address').authenticated,true);
  assert.equal(privileges.find(p=>p.proname==='handle_new_auth_user').authenticated,false);
  await db.exec('grant usage on schema auth to authenticated; grant insert on auth.users to authenticated; set role authenticated; insert into auth.users values(gen_random_uuid()); reset role;');

  const diagnostic = await read('supabase/diagnostics/20260929_installation_audit.sql');
  const output = await db.exec(diagnostic);
  const row = output.flatMap(r=>r.rows ?? []).find(r=>r.diagnostico);
  assert.equal(JSON.parse(row.diagnostico).catalogo_incluindo_retirados.length,1);

  const template = await read('supabase/manual/20260929_cadastrar_11_produtos.sql');
  assert.doesNotMatch(template,/BE-LOC-|VG Sexy|Loção Speed/);
  const inject = (sql) => template.replace('-- Serializa a verificacao',`${sql}\n-- Serializa a verificacao`);
  await assert.rejects(db.exec(inject('update novos_produtos_revisados set incluir=false;')),/nenhum item foi aprovado/);
  await db.exec('rollback');
  await assert.rejects(db.exec(inject("update novos_produtos_revisados set preco=null where code='NUT-AMYNO-CX';")),/preco ausente/);
  await db.exec('rollback');
  const approved = template;
  await db.exec(approved);
  await db.exec(approved);
  assert.equal((await db.query('select count(*)::int as n from produtos')).rows[0].n,12);
  assert.equal((await db.query("select price from produtos where code='NUT-AMYNO-CX'")).rows[0].price,'299.90');
  assert.deepEqual((await db.query("select price,estoque from produtos where code='EXISTING'")).rows[0],{price:'10',estoque:5});
  await db.exec("update produtos set is_deleted=true,price=222 where code='NUT-AMYNO-CX'");
  await db.exec(approved);
  assert.deepEqual((await db.query("select price,is_deleted from produtos where code='NUT-AMYNO-CX'")).rows[0],{price:'222',is_deleted:true});
  await db.exec("update produtos set code='OTHER' where code='NUT-AMYNO-CX'");
  await assert.rejects(db.exec(approved),/Nome ja cadastrado/);
  await db.exec('rollback');
  await db.exec("update produtos set code='NUT-AMYNO-CX',name='Outro produto' where code='OTHER'");
  await assert.rejects(db.exec(approved),/Codigo interno ja ocupado/);
  await db.exec('rollback');
  await db.exec('drop function cancelar_reserva_checkout(text)');
  await assert.rejects(db.exec(patch),/Pre-requisito ausente/);
  await db.exec('rollback');
  console.log('PASS: diagnostic read-only; ACL rerun, explicit client grants removed, server/public/auth flows preserved, auth trigger works; registration blocked without approval/price, approved insertion, rerun without duplication, existing price/stock/retirement preserved, duplicate-name rejected.');
} finally { await db.close(); }
