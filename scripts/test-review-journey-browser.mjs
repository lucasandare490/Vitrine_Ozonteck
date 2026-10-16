import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.argv[2]).href);
const site = process.env.TEST_BASE_URL || 'http://localhost:3002';
const env=await fs.readFile('.env.local','utf8').catch(()=>fs.readFile('.env','utf8'));
const base=new URL(env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const user={id:'20000000-0000-0000-0000-000000000001',email:'qa@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{nome:'Cliente QA'}};
const exp=Math.floor(Date.now()/1000)+3600;
const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp,role:'authenticated'}].map(value=>Buffer.from(JSON.stringify(value)).toString('base64url')).join('.')+'.test';
const order={id:'30000000-0000-0000-0000-000000000001',status:'entregue',valor_total:30,itens:[{code:'QA-A',nome:'Produto A',qtd:1,price:10},{code:'QA-B',nome:'Produto B',qtd:2,price:10}],created_at:'2026-09-20T12:00:00Z',endereco_entrega:{nome:'Cliente QA',rua:'Rua de teste'}};
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
  for(const width of [1440,390,320]) {
    const context=await browser.newContext({viewport:{width,height:900}});
    await context.addInitScript(({key,session})=>localStorage.setItem(key,JSON.stringify(session)),{key:`sb-${base.hostname.split('.')[0]}-auth-token`,session:{access_token:token,refresh_token:'test',token_type:'bearer',expires_at:exp,expires_in:3600,user}});
    const submissions=[];const storeSubmissions=[];const publications=[];
    let admin=false;
    // Every browser request to Supabase is intercepted: no fixture reaches the real database.
    await context.route(`${base.origin}/**`,async route=>{
      const req=route.request();const path=new URL(req.url()).pathname;let value=[];
      if(path.startsWith('/auth/'))value=user;
      else if(path.endsWith('/profiles'))value={nome:'Cliente QA',role:admin?'admin':'cliente',avatar_url:null};
      else if(path.endsWith('/pedidos'))value=[order];
      else if(path.endsWith('/rpc/listar_avaliacoes_loja'))value={total:3,average:3.33,items:[{id:'qa-public',nome_cliente:'Cliente QA',nota:1,comentario:'Critica publicada de teste',created_at:order.created_at,verificado:true}]};
      else if(path.endsWith('/rpc/itens_avaliaveis'))value=order.itens.map((item,i)=>({produto_id:`10000000-0000-0000-0000-00000000000${i+1}`,code:item.code,nome:item.nome,nota:null,comentario:null,publicado:false}));
      else if(path.endsWith('/rpc/enviar_avaliacao_produto')) {submissions.push(req.postDataJSON());value=null;}
      else if(path.endsWith('/avaliacoes_produtos')) {
        if(req.method()==='PATCH'){publications.push('produto');value=[{id:'review-produto'}];}
        else value=[{id:'review-produto',pedido_id:order.id,produto_id:'product',nome:'Cliente',nota:1,comentario:'Critica de teste',publicado:false,produtos:{name:'Produto A',code:'QA-A'}}];
      } else if(path.endsWith('/avaliacoes')) {
        if(req.method()==='POST'){storeSubmissions.push(req.postDataJSON());value=null;}
        else if(req.method()==='PATCH'){publications.push('loja');value=[{id:'review-loja'}];}
        else value=admin?[{id:'review-loja',pedido_id:order.id,nome_cliente:'Cliente',nota:2,comentario:'Entrega de teste',publicado:false,created_at:order.created_at}]:[];
      }
      await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
    });
    const page=await context.newPage();
    await page.goto(`${site}/conta/pedidos`);
    await page.getByRole('button',{name:'Avaliar produto: Produto A',exact:true}).click();
    await page.getByRole('combobox',{name:/Nota do produto/}).selectOption('1');
    await page.getByRole('button',{name:'Enviar avaliação deste produto',exact:true}).click();
    await page.getByText('Avaliação recebida para análise.',{exact:true}).waitFor();
    assert.equal(submissions.length,1);assert.equal(submissions[0].p_produto,'10000000-0000-0000-0000-000000000001');
    await page.getByRole('button',{name:'Avaliar produto: Produto B',exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Enviar avaliação deste produto',exact:true}).count(),1);
    await page.getByRole('button',{name:'Fechar avaliação de Produto B',exact:true}).click();
    await page.getByRole('button',{name:'Avaliar experiência de compra',exact:true}).click();
    await page.getByRole('button',{name:'2 estrelas para a experiência de compra',exact:true}).click();
    await page.getByPlaceholder('Escreva um comentário (opcional)...').fill('Experiencia de entrega');
    await page.getByRole('button',{name:'Enviar Avaliação',exact:true}).click();
    await page.getByText('Avaliação da loja enviada',{exact:true}).waitFor();
    assert.equal(storeSubmissions.length,1);assert.equal('produto_id' in storeSubmissions[0],false);
    assert.equal(await page.locator('a[href*="g.page"]').count(),0);
    await page.getByRole('button',{name:'Ver detalhes',exact:true}).click();
    await page.getByText('Entrega: Rua de teste',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.getByRole('list',{name:'Produtos deste pedido'}).screenshot({path:`${process.env.TEMP}/journey-client-${width}.png`});
    admin=true;
    await page.goto(`${site}/admin/pedidos`);
    await page.getByRole('button',{name:'Avaliações dos produtos',exact:true}).click();
    await page.getByRole('button',{name:'Publicar avaliação',exact:true}).click();
    await page.getByRole('button',{name:'Ocultar avaliação',exact:true}).waitFor();
    await page.getByRole('button',{name:'Experiências de compra: moderação da loja',exact:true}).click();
    await page.getByRole('button',{name:'Publicar',exact:true}).click();
    await page.getByRole('button',{name:'Ocultar',exact:true}).waitFor();
    assert.deepEqual(publications,['produto','loja']);
    await page.goto(`${site}/`);
    await page.getByRole('heading',{name:'Experiências de compra no site',exact:true}).waitFor();
    await page.getByText('Média das avaliações publicadas · 3 avaliações',{exact:true}).waitFor();
    await page.getByText('Critica publicada de teste',{exact:false}).waitFor();
    assert.equal(await page.getByRole('link',{name:/Ver avaliações e avaliar no Google/}).count(),1);
    console.log(`PASS ${width}px: controlled UI fixture, partial product review, store review separate, no Google in order, details, admin publication of both negative reviews`);
    await context.close();
  }
}finally{await browser.close();}
