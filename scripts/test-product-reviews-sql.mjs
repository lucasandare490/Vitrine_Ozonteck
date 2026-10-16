import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';

// Pass an installed PGlite module path. All data stays in an ephemeral database.
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    alter default privileges in schema public revoke all on tables from public, anon, authenticated, service_role;
    create schema auth; create schema storage;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    grant usage on schema auth to authenticated;
    create table public.produtos (id uuid primary key, code text, name text default 'Produto QA', is_deleted boolean default false);
    create unique index produtos_code_unique_idx on public.produtos(code);
    create table public.profiles(id uuid primary key, nome text);
    create function public.is_admin() returns boolean language sql stable as $$ select coalesce(current_setting('test.admin',true),'false')='true' $$;
    create table public.pedidos (id uuid primary key, user_id uuid, status text, itens jsonb);
    grant select on public.pedidos, public.produtos to authenticated;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  `);
  const sql = await fs.readFile('supabase/migrations/202609260001_product_reviews.sql', 'utf8');
  await db.exec(sql);
  await db.exec(sql);
  // Model the new Supabase default: creating a table alone grants no API access.
  await db.exec('create table public.qa_ungranted(id uuid)');
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const result = await db.query("select has_table_privilege($1, 'public.qa_ungranted', 'SELECT') as allowed", [role]);
    assert.equal(result.rows[0].allowed, false);
  }
  await db.exec('drop table public.qa_ungranted');
  for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
    assert.equal((await db.query("select has_table_privilege('service_role', 'public.avaliacoes_produtos', $1) as allowed", [privilege])).rows[0].allowed, true);
    assert.equal((await db.query("select has_table_privilege('anon', 'public.avaliacoes_produtos', $1) as allowed", [privilege])).rows[0].allowed, false);
  }
  console.log('PASS: no automatic table grants; explicit server grants preserved; anonymous table access denied.');
  const product = '10000000-0000-0000-0000-000000000001';
  const user = '20000000-0000-0000-0000-000000000001';
  await db.query('insert into produtos (id,code) values ($1,$2)', [product,'QA']);
  await db.query('insert into auth.users values ($1)', [user]);
  for (let i = 1; i <= 9; i++) {
    const order = `30000000-0000-0000-0000-${String(i).padStart(12, '0')}`;
    await db.query('insert into pedidos values ($1,$2,$3,$4)', [order,user,'entregue',JSON.stringify([{code:'QA'}])]);
    await db.query('insert into avaliacoes_produtos (produto_id,pedido_id,user_id,nome,nota,imagens,publicado) values ($1,$2,$3,$4,$5,$6,$7)', [product,order,user,'Pessoa de teste',i === 1 ? 1 : 5,i === 2 ? [`${product}/photo.webp`] : [],i !== 9]);
  }
  await db.exec('set role anon');
  const read = async (stars=0, images=false, sort='recent', page=1) => (await db.query('select listar_avaliacoes_produto($1,$2,$3,$4,$5) as value', [product,stars,images,sort,page])).rows[0].value;
  const all = await read();
  assert.equal(all.total, 8); assert.equal(all.items.length, 6);
  assert.deepEqual(all.stars, [1,0,0,0,7]);
  assert.equal((await read(1)).filtered, 1);
  assert.equal((await read(0,true)).filtered, 1);
  assert.equal((await read(0,false,'recent',2)).items.length, 2);
  assert.equal((await read(0,false,'best')).items[0].nota, 5);
  assert.equal('user_id' in all.items[0], false); assert.equal('pedido_id' in all.items[0], false);
  await assert.rejects(db.query('select * from avaliacoes_produtos'));
  await assert.rejects(read(6));
  await db.exec('reset role; set role authenticated');
  await db.query("select set_config('test.uid',$1,false)", [user]);
  const foreignOrder = '30000000-0000-0000-0000-000000000010';
  await assert.rejects(db.query('insert into avaliacoes_produtos (produto_id,pedido_id,user_id,nome,nota,publicado) values ($1,$2,$3,$4,5,true)',[product,foreignOrder,user,'Intruso']));
  await assert.rejects(db.query('insert into avaliacoes_produtos (produto_id,pedido_id,user_id,nome,nota) values ($1,$2,$3,$4,5)',[product,foreignOrder,user,'Intruso']));
  console.log('PASS: migration rerun, pagination, all stars, images, sorting, private fields, anon table denial, filter bounds, publication/ownership denial.');
  await db.exec('reset role');
  const submission = await fs.readFile('supabase/migrations/202609270001_product_review_submission.sql', 'utf8');
  await db.exec(submission); await db.exec(submission);
  await assert.rejects(db.query('update produtos set code=$1 where id=$2',['REUSED',product]));
  await assert.rejects(db.query('delete from produtos where id=$1',[product]));
  await db.query('update produtos set is_deleted=true where id=$1',[product]);
  await db.query('update produtos set is_deleted=false where id=$1',[product]);
  const secondProduct = '10000000-0000-0000-0000-000000000002';
  const thirdProduct = '10000000-0000-0000-0000-000000000003';
  const multiOrder = '30000000-0000-0000-0000-000000000011';
  const pendingOrder = '30000000-0000-0000-0000-000000000012';
  const otherUser = '20000000-0000-0000-0000-000000000002';
  await db.query('insert into produtos(id,code) values($1,$2),($3,$4)',[secondProduct,'QA2',thirdProduct,'QA3']);
  await db.query('insert into profiles values($1,$2)',[user,'Maria Teste']);
  await db.query('insert into pedidos values($1,$2,$3,$4),($5,$2,$6,$4)',[multiOrder,user,'entregue',JSON.stringify([{code:'QA'},{code:'QA2'}]),pendingOrder,'enviado']);
  await db.exec('set role authenticated');
  const submit = (order,product,stars=2) => db.query('select enviar_avaliacao_produto($1,$2,$3,$4)',[order,product,stars,'Experiencia de teste']);
  assert.equal((await db.query('select itens_avaliaveis($1) as items',[multiOrder])).rows[0].items.length,2);
  await submit(multiOrder,product);
  await assert.rejects(db.query('insert into avaliacoes_produtos (produto_id,pedido_id,user_id,nome,nota) values ($1,$2,$3,$4,5)',[thirdProduct,multiOrder,user,'Autor adulterado']));
  let eligible = (await db.query('select itens_avaliaveis($1) as items',[multiOrder])).rows[0].items;
  assert.equal(eligible.filter(i=>i.nota!==null).length,1);
  await assert.rejects(submit(multiOrder,product));
  await submit(multiOrder,secondProduct,1);
  await assert.rejects(submit(multiOrder,thirdProduct));
  await assert.rejects(submit(pendingOrder,secondProduct));
  await assert.rejects(submit(multiOrder,thirdProduct,6));
  assert.equal((await db.query('select * from avaliacoes_produtos')).rows.length,0);
  assert.equal((await db.query('update avaliacoes_produtos set publicado=true returning id')).rows.length,0);
  await db.query("select set_config('test.uid',$1,false)",[otherUser]);
  await assert.rejects(submit(multiOrder,thirdProduct));
  await assert.rejects(db.query('select itens_avaliaveis($1)',[multiOrder]));
  await db.exec("select set_config('test.admin','true',false)");
  assert.equal((await db.query('select nome from avaliacoes_produtos where pedido_id=$1 limit 1',[multiOrder])).rows[0].nome,'Maria');
  await db.query('update avaliacoes_produtos set publicado=true where pedido_id=$1',[multiOrder]);
  await db.exec('reset role; set role anon');
  assert.equal((await read()).total,9);
  const secondReviews = (await db.query('select listar_avaliacoes_produto($1) as value',[secondProduct])).rows[0].value;
  assert.equal(secondReviews.total,1); assert.equal(secondReviews.average,1);
  assert.equal((await db.query('select listar_avaliacoes_produto($1) as value',[thirdProduct])).rows[0].value.total,0);
  await assert.rejects(submit(multiOrder,thirdProduct));
  await db.exec('reset role');
  const singleOrder = '30000000-0000-0000-0000-000000000013';
  await db.query('insert into pedidos values($1,$2,$3,$4)',[singleOrder,user,'entregue',JSON.stringify([{code:'QA3',qtd:4}])]);
  await db.exec("set role authenticated; select set_config('test.admin','false',false)");
  await db.query("select set_config('test.uid',$1,false)",[user]);
  assert.equal((await db.query('select itens_avaliaveis($1) as items',[singleOrder])).rows[0].items.length,1);
  await submit(singleOrder,thirdProduct);
  await assert.rejects(submit(singleOrder,thirdProduct));
  console.log('PASS: submission rerun, partial/multiple items, duplicate denial, foreign product/order denial, delivered-only, author projection, admin-only moderation, low-star publication, product isolation, ordered SKU protection and reversible soft deletion.');
} finally { await db.close(); }
