import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
try {
  await db.exec(`
    create table produtos(code text primary key, name text, category text, price numeric, estoque int, is_deleted boolean);
    create table historic_order_items(id int primary key, produto_code text references produtos(code));
    insert into produtos values
      ('AC-CXMEM','Caixa','Acessórios',30,5,false),
      ('AC-CAM-P','Preta','Acessórios',50,2,false),
      ('AC-CAM-R','Rosa','Acessórios',50,2,false),
      ('AC-SQUEEZE','Squeeze','Acessórios',20,1,false),
      ('BE-SOFH','Sofh','Bem Estar',99,4,false);
    insert into historic_order_items values (1,'AC-CXMEM');
  `);
  const sql = await readFile(new URL('../supabase/migrations/202609280001_retire_accessories.sql', import.meta.url), 'utf8');
  await db.exec(sql);
  await db.exec(sql);
  const result = await db.query('select code,price,estoque,is_deleted from produtos order by code');
  assert.equal(result.rows.length, 5);
  assert.equal(result.rows.filter(row => row.is_deleted).length, 4);
  const sof = result.rows.find(row => row.code === 'BE-SOFH');
  assert.equal(sof.is_deleted, false);
  assert.equal(Number(sof.price), 99);
  assert.equal(sof.estoque, 4);
  assert.equal((await db.query('select * from historic_order_items')).rows.length, 1);
  assert.equal(Number(result.rows.find(row => row.code === 'AC-CXMEM').price), 30);
  console.log('PASS: accessory soft retirement is idempotent and preserves products, prices, stock and order references');
} finally { await db.close(); }
