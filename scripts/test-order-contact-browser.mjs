import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const env = await fs.readFile('.env', 'utf8');
const base = new URL(env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const user = { id: '20000000-0000-0000-0000-000000000001', email: 'qa@example.invalid', factors: [], aud: 'authenticated', role: 'authenticated', user_metadata: {} };
const exp = Math.floor(Date.now()/1000)+3600;
const token = [{alg:'HS256',typ:'JWT'},{sub:user.id,exp,role:'authenticated',aal:'aal1',amr:[]}].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url')).join('.')+'.fixture';
const orders = ['pending', 'preparando'].map((status,i)=>({id:`order-${i}`,status,valor_total:45,created_at:new Date().toISOString(),itens:[{nome:'Produto',qtd:1}],endereco_entrega:{nome:'Cliente QA',telefone:'81999999999',rua:'Rua A',numero:'10',complemento:'Apto 3'}}));
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
  for (const width of [390,1440]) {
    const context = await browser.newContext({viewport:{width,height:900}});
    await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${base.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'fixture',expires_at:exp,expires_in:3600,token_type:'bearer',user}});
    await context.route(`${base.origin}/**`, async route => {
      const url = new URL(route.request().url());
      let data=[];
      if(url.pathname.startsWith('/auth/')) data=user;
      else if(url.pathname.endsWith('/profiles')) data={nome:'QA',role:'admin',carrinho:[]};
      else if(url.pathname.endsWith('/pedidos')) data=orders;
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
    });
    const page=await context.newPage();
    for (const path of ['/admin','/admin/pedidos']) {
      await page.goto(`http://localhost:3002${path}`);
      await page.getByRole('button',{name:path==='/admin'?'Gerenciar':'Ver Resumo',exact:true}).first().click();
      const link = page.getByRole('link',{name:/Conversar no WhatsApp/});
      await link.waitFor();
      assert.match(await link.getAttribute('href'),/^https:\/\/wa.me\/5581999999999\?text=/);
      await page.getByText('Rua A, 10, Apto 3',{exact:true}).waitFor();
      assert.equal(await page.getByText('Total Pago',{exact:true}).count(),0);
      await page.screenshot({path:`${process.env.TEMP}/order-contact-${path.replaceAll('/','-')}-${width}.png`});
    }
    await context.close();
    console.log(`PASS: admin contact and address at ${width}px; requests mocked.`);
  }
} finally { await browser.close(); }
