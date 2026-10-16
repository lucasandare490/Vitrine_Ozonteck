import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const env = await fs.readFile('.env', 'utf8');
const base = new URL(env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const site = process.env.TEST_BASE_URL || 'http://localhost:3002';
const user = { id: '20000000-0000-0000-0000-000000000001', email: 'qa@example.invalid', factors: [], aud: 'authenticated', role: 'authenticated', user_metadata: {} };
const exp = Math.floor(Date.now()/1000)+3600;
const token = [{alg:'HS256',typ:'JWT'},{sub:user.id,exp,role:'authenticated',aal:'aal1',amr:[]}].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.fixture';
const products = Array.from({length:25}, (_,i)=>({id:`p${i}`,code:`QA-${i}`,name:`Produto ${String(i).padStart(2,'0')}`,category:'Perfumaria',price:45,estoque:10,image_url:'/produtos/303men17ml.webp',is_deleted:false}));
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
  for (const width of [390,1440]) {
    const context = await browser.newContext({viewport:{width,height:900}});
    await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${base.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}});
    await context.route(`${base.origin}/**`, async route => {
      const url = new URL(route.request().url()); let data=[];
      if(url.pathname.startsWith('/auth/')) data=user;
      else if(url.pathname.endsWith('/profiles')) data=url.searchParams.has('role') ? products.map(p=>({id:p.id,nome:p.name,email:'qa@example.invalid',created_at:'2026-01-01'})) : {nome:'QA',role:'admin',carrinho:[]};
      else if(url.pathname.endsWith('/produtos')) data=products;
      else if(url.pathname.endsWith('/favoritos')) data=products.map(p=>({produto_code:p.code}));
      else if(url.pathname.endsWith('/rpc/listar_avaliacoes_loja')) data={total:0,average:0,items:[]};
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
    });
    const page=await context.newPage();
    for(const path of ['/', '/conta/favoritos','/admin/clientes']) {
      await page.goto(site+path);
      const nav=page.getByRole('navigation',{name:'Paginação',exact:true});
      await nav.getByRole('button',{name:'Página 2',exact:true}).click();
      await page.getByText('Página 2 de 3 · 25 resultados',{exact:true}).waitFor();
      await nav.getByRole('button',{name:'Próxima página',exact:true}).click();
      assert.equal(await nav.getByRole('button',{name:'Próxima página',exact:true}).isDisabled(),true);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
      await page.waitForTimeout(700);
      await page.screenshot({path:`${process.env.TEMP}/pagination-${path.replaceAll('/','-') || 'home'}-${width}.png`});
    }
    await page.goto(site);
    {
      if(width===390) await page.getByRole('button',{name:'Abrir Menu',exact:true}).click();
      const input=page.getByRole('textbox',{name:'Buscar produtos',exact:true}).filter({visible:true});
      await input.fill('Produto 01');
      const suggestion=page.getByRole('list',{name:'Sugestões de produtos'}).getByRole('link');
      await suggestion.waitFor();
      assert.equal(await suggestion.getAttribute('href'),'/produto/QA-1');
      await input.press('Enter');
      await page.waitForURL('**/?q=Produto%2001');
      await page.getByText('Página 1 de 3 · 25 resultados',{exact:true}).waitFor({state:'hidden'});
      if(width===390) await page.getByRole('button',{name:'Abrir Menu',exact:true}).click();
      await page.getByRole('textbox',{name:'Buscar produtos',exact:true}).filter({visible:true}).fill('Produto 02');
      await page.route('**/produto/QA-2',route=>route.fulfill({contentType:'text/html',body:'<h1>Destino de teste</h1>'}));
      await page.getByRole('list',{name:'Sugestões de produtos'}).getByRole('link').click();
      await page.waitForURL('**/produto/QA-2');
    }
    console.log(`PASS ${width}: catalog, favorites, admin pagination, boundaries and overflow; desktop suggestions and Enter checked.`);
    await context.close();
  }
} finally { await browser.close(); }
