import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href);
const db=new PGlite();
try {
  await db.exec(`create role anon; create role authenticated;
    create function public.is_admin() returns boolean language sql stable as $$select coalesce(current_setting('test.admin',true),'false')='true'$$;
    create table pedidos(id uuid primary key,user_id uuid,status text);
    create table avaliacoes(id uuid primary key default gen_random_uuid(),pedido_id uuid,user_id uuid,nome_cliente text,nota integer,comentario text,created_at timestamptz default now());
    grant insert,update,select on avaliacoes to authenticated;
    insert into pedidos values('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','entregue');
    insert into avaliacoes(pedido_id,user_id,nome_cliente,nota,comentario) values
      ('10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Maria Teste',5,'Bom'),
      (null,null,'Legado',4,'Antigo'),(null,null,'Critica antiga',1,'Privado');`);
  await db.exec('alter table avaliacoes add constraint legacy_order_required check(pedido_id is not null) not valid');
  const sql=await fs.readFile('supabase/migrations/202609270002_store_review_journey.sql','utf8');
  await db.exec(sql);await db.exec(sql);
  assert.equal((await db.query("select convalidated from pg_constraint where conname='legacy_order_required'")).rows[0].convalidated,false);
  await assert.rejects(db.exec("insert into avaliacoes(nome_cliente,nota) values('Sem pedido',5)"));
  await db.exec('set role anon');
  const read=async(page=1)=>(await db.query('select listar_avaliacoes_loja($1) as value',[page])).rows[0].value;
  let data=await read();
  assert.equal(data.total,2);assert.equal(data.average,4.5);
  assert.equal(data.items.filter(i=>i.verificado).length,1);
  assert.equal('user_id' in data.items[0],false);assert.equal('pedido_id' in data.items[0],false);
  await assert.rejects(read(0));
  await db.exec('reset role;set role authenticated');
  await db.exec("insert into avaliacoes(nome_cliente,nota,pedido_id,publicado) values('Nova',5,'10000000-0000-0000-0000-000000000001',true)");
  assert.equal((await db.query("select publicado from avaliacoes where nome_cliente='Nova'")).rows[0].publicado,false);
  await assert.rejects(db.exec("update avaliacoes set publicado=true where nome_cliente='Critica antiga'"));
  await db.exec("select set_config('test.admin','true',false);update avaliacoes set publicado=true,pedido_id='10000000-0000-0000-0000-000000000001' where nome_cliente='Critica antiga';set role anon");
  data=await read();assert.equal(data.total,3);assert.equal(data.average,3.33);
  await db.exec('reset role');await db.exec(sql);
  assert.equal((await db.query("select publicado from avaliacoes where nome_cliente='Nova'")).rows[0].publicado,false);
  console.log('PASS: rerun preserves publication, legacy privacy, verified purchase projection, all published scores in average, private IDs absent, page bounds, client cannot self-publish, admin can publish criticism.');
}finally{await db.close();}
