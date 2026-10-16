import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const origin = process.env.TEST_BASE_URL || 'http://localhost:3002';
const env = await fs.readFile('.env', 'utf8');
const base = new URL(env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const user = { id: '20000000-0000-0000-0000-000000000001', email: 'qa@example.invalid', aud: 'authenticated', role: 'authenticated', factors: [], user_metadata: {} };
const exp = Math.floor(Date.now()/1000)+3600;
const token = [{alg:'HS256',typ:'JWT'},{sub:user.id,exp,role:'authenticated',aal:'aal1',amr:[]}].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.fixture';
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
  const context = await browser.newContext();
  await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${base.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}});
  let count=1, countError=false, deletes=0, restores=0, emptyMutation=false;
  const products=[{id:'retired',code:'BE-TOQUE-LUM',name:'Retired fixture',category:'Bem Estar',is_deleted:true,price:10,estoque:1},{id:'active',code:'CAP-CO-MEL',name:'Active fixture',category:'Cuidados Capilares',is_deleted:true,price:10,estoque:1}];
  // Intercept all Supabase browser requests: no fixture or mutation reaches the remote database.
  await context.route(`${base.origin}/**`,async route=>{
    const req=route.request(), url=new URL(req.url()); let value=[],status=200,headers={};
    if(url.pathname.startsWith('/auth/')) value=user;
    else if(url.pathname.endsWith('/profiles')) value={nome:'QA',role:'admin',avatar_url:null,carrinho:[]};
    else if(url.pathname.endsWith('/categorias')) {
      if(req.method()==='DELETE'){deletes++;value=emptyMutation?[]:[{id:'category'}];}
      else value=[{id:'category',name:'Fixture category',created_at:'2026-01-01'}];
    } else if(url.pathname.endsWith('/produtos')) {
      if(req.method()==='HEAD') {status=countError?500:200;headers={'content-range':`*/${count}`,'access-control-expose-headers':'content-range'};}
      else if(req.method()==='PATCH'){restores++;value=emptyMutation?[]:[{id:'active'}];}
      else value=products;
    }
    await route.fulfill({status,headers,contentType:'application/json',body:req.method()==='HEAD'?'':JSON.stringify(value)});
  });
  const page=await context.newPage();
  page.on('dialog',dialog=>dialog.accept());
  await page.goto(origin+'/admin/categorias');
  await page.getByLabel('Nome da Categoria').waitFor();
  await page.getByRole('button',{name:'Excluir',exact:true}).click();
  await page.getByText(/Esta categoria possui produtos/).waitFor();
  assert.equal(deletes,0);
  countError=true;
  await page.getByRole('button',{name:'Excluir',exact:true}).click();
  await page.getByText(/Erro ao excluir/).waitFor();
  assert.equal(deletes,0);
  countError=false;count=0;emptyMutation=true;
  await page.getByRole('button',{name:'Excluir',exact:true}).click();
  await page.getByText(/Categoria não excluída/).waitFor();
  assert.equal(deletes,1);
  emptyMutation=false;
  await page.getByRole('button',{name:'Excluir',exact:true}).click();
  await page.getByText('Categoria excluída!',{exact:true}).waitFor();
  assert.equal(deletes,2);
  await page.goto(origin+'/admin/produtos');
  await page.getByRole('button',{name:/Lixeira/}).click();
  await page.getByRole('row').filter({hasText:'Retired fixture'}).getByRole('button',{name:/Restaurar/}).click();
  await page.getByText(/Este produto não pode ser restaurado/).waitFor();
  assert.equal(restores,0);
  emptyMutation=true;
  await page.getByRole('row').filter({hasText:'Active fixture'}).getByRole('button',{name:/Restaurar/}).click();
  await page.getByText(/Produto não restaurado/).waitFor();
  assert.equal(restores,1);
  emptyMutation=false;
  await page.getByRole('row').filter({hasText:'Active fixture'}).getByRole('button',{name:/Restaurar/}).click();
  await page.getByText(/foi restaurado para a vitrine/).waitFor();
  assert.equal(restores,2);
  console.log('PASS: category dependencies, lookup errors and zero-row mutations fail closed; retired restoration blocked; eligible restoration preserved. Mocked browser, no remote writes.');
} finally { await browser.close(); }
