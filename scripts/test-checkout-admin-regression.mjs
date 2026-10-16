import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const env = await fs.readFile('.env', 'utf8');
const base = new URL(env.match(/^NEXT_PUBLIC_SUPABASE_URL\s*=\s*["']?([^\s"']+)/m)[1]);
const site = process.env.TEST_BASE_URL || 'http://localhost:3013';
const user = { id: '20000000-0000-0000-0000-000000000001', email: 'qa@example.invalid', factors: [], aud: 'authenticated', role: 'authenticated', user_metadata: {} };
const exp = Math.floor(Date.now() / 1000) + 3600;
const token = [{ alg: 'HS256', typ: 'JWT' }, { sub: user.id, exp, role: 'authenticated', aal: 'aal1', amr: [] }].map(v => Buffer.from(JSON.stringify(v)).toString('base64url')).join('.') + '.fixture';
const item = { id: 'qa-product', code: 'TESTE-001', name: 'Produto QA', price: 9.99, quantity: 1, estoque: 10, category: 'Antiga', is_deleted: false };
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const width of (process.argv.includes('--real-ui') ? [1440] : [390, 1440])) {
    let failAddress = false;
    let affiliateEnabled = false;
    let addresses = [{ id: 'addr1', apelido: 'Casa', cep: '50050015', rua: 'Rua QA', numero: '20', complemento: 'Apto 2', bairro: 'Boa Vista', cidade: 'Recife', estado: 'PE', principal: true }, { id: 'addr2', apelido: 'Trabalho', cep: '50050015', rua: 'Rua B', numero: '30', bairro: 'Boa Vista', cidade: 'Recife', estado: 'PE', principal: false }];
    let categories = [{ id: 'cat1', name: 'Antiga', archived_at: null, created_at: new Date().toISOString() }];
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(({ key, session }) => localStorage.setItem(key, JSON.stringify(session)), { key: `sb-${base.hostname.split('.')[0]}-auth-token`, session: { access_token: token, refresh_token: 'fixture', expires_at: exp, expires_in: 3600, token_type: 'bearer', user } });
    if (!process.argv.includes('--real-ui')) await context.addInitScript(() => {
      window.qaMounts = 0;
      window.MercadoPago = class {
        bricks() { return { create: async (_name, id, settings) => {
          window.qaMounts++;
          const host = document.getElementById(id);
          const form = document.createElement('div'); form.className = 'qa-brick';
          form.innerHTML = '<button type="button">Cartão de crédito QA</button><button type="button">Pix QA</button><div class="fields"></div>';
          form.children[0].onclick = () => { form.querySelector('.fields').innerHTML = '<input name="securityCode" aria-label="CVV QA">'; };
          form.children[1].onclick = () => { form.querySelector('.fields').replaceChildren(); };
          host.appendChild(form); settings.callbacks.onReady();
          return { unmount: () => form.remove() };
        } }; }
      };
    });
    if (!process.argv.includes('--real-ui')) await context.route('https://sdk.mercadopago.com/**', route => route.fulfill({ contentType: 'application/javascript', body: '' }));
    await context.route('**/api/checkout', route => { throw new Error('Unexpected payment request'); });
    await context.route('https://viacep.com.br/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ logradouro: 'Rua Nova', bairro: 'Centro', localidade: 'Recife', uf: 'PE' }) }));
    await context.route(`${base.origin}/**`, async route => {
      const request = route.request(), url = new URL(request.url()); let data = [];
      if (url.pathname.startsWith('/auth/')) data = user;
      else if (url.pathname.endsWith('/rpc/my_store_prices')) data = { enabled: false, prices: { 'TESTE-001': 9.99 } };
      else if (url.pathname.endsWith('/rpc/admin_pricing')) data = { enabled: affiliateEnabled, products: [{ ...item, affiliate_price: 8, customer_price: null }], audit: [] };
      else if (url.pathname.endsWith('/rpc/admin_set_pricing')) { affiliateEnabled = request.postDataJSON().p_enabled; data = null; }
      else if (url.pathname.endsWith('/profiles')) data = { nome: 'Cliente QA', email: user.email, cpf: '52998224725', telefone: '81999999999', role: 'admin', carrinho: [item] };
      else if (url.pathname.endsWith('/produtos')) data = [item];
      else if (url.pathname.endsWith('/enderecos')) {
        if (request.method() === 'POST') {
          if (failAddress) return route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ message: 'Fixture denied' }) });
          const address = { ...request.postDataJSON(), id: 'addr3' }; addresses.push(address); data = address;
        } else data = addresses;
      } else if (url.pathname.endsWith('/categorias')) {
        if (request.method() === 'PATCH') { categories[0] = { ...categories[0], ...request.postDataJSON() }; data = [{ id: 'cat1' }]; }
        else data = categories;
      } else if (url.pathname.endsWith('/pedidos')) data = [{ id: 'order-qa', status: 'approved', valor_total: 9.99, itens: [], created_at: new Date().toISOString() }];
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    const page = await context.newPage(); page.setDefaultTimeout(20000); page.setDefaultNavigationTimeout(120000);
    await page.goto(`${site}/lista`);
    await page.getByRole('button', { name: 'Continuar para Entrega' }).click();
    await page.getByRole('radio', { name: 'Retirar na loja' }).check();
    await page.getByRole('heading', { name: 'Endereço de cobrança' }).waitFor();
    assert.equal(await page.getByRole('button', { name: /Casa Rua QA/ }).count(), 1);
    assert.equal(await page.getByRole('button', { name: /Trabalho Rua B/ }).count(), 1);
    await page.getByRole('button', { name: 'Ir para Pagamento' }).click();
    if (process.argv.includes('--real-ui')) {
      await page.getByText('Cartão de crédito', { exact: true }).click();
      await page.waitForTimeout(2500);
      await page.locator('#paymentBrick_container iframe[name="securityCode"]').click();
      await page.getByText('Onde encontro o código de segurança (CVV)?').waitFor();
      await page.evaluate(() => window.dispatchEvent(new Event('store-pricing-changed')));
      await page.waitForTimeout(1500);
      assert.equal(await page.locator('#paymentBrick_container iframe[name="securityCode"]').count(), 1);
      await page.getByText('Pix', { exact: true }).click();
      await page.waitForTimeout(500);
      await page.getByText('Onde encontro o código de segurança (CVV)?').waitFor({ state: 'detached' });
      console.log('PASS real Mercado Pago UI: card/CVV focus, no duplicate after refresh, CVV hidden for Pix. No payment submitted.');
      await page.screenshot({ path: 'sandbox-runtime/real-payment-ui.png', fullPage: true });
      await context.close();
      continue;
    }
    await page.getByRole('button', { name: 'Cartão de crédito QA' }).waitFor();
    assert.equal(await page.locator('.qa-brick').count(), 1);
    assert.equal(await page.getByText('Onde encontro o código de segurança (CVV)?').count(), 0);
    await page.getByRole('button', { name: 'Cartão de crédito QA' }).click();
    await page.getByRole('textbox', { name: 'CVV QA' }).focus();
    await page.getByText('Onde encontro o código de segurança (CVV)?').waitFor();
    await page.evaluate(() => { window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('store-pricing-changed')); });
    await page.waitForTimeout(1000);
    assert.equal(await page.evaluate(() => window.qaMounts), 1, 'No Brick recreation on pricing refresh');
    await page.getByRole('button', { name: 'Pix QA' }).click();
    await page.getByText('Onde encontro o código de segurança (CVV)?').waitFor({ state: 'detached' });
    await page.getByRole('button', { name: 'Revisar dados e retirada' }).click();
    await page.getByRole('button', { name: 'Novo endereço' }).click();
    await page.locator('input[name=zipCode]').fill('50050015');
    await page.locator('input[name=street]').waitFor();
    await page.waitForFunction(() => document.querySelector('input[name=street]')?.value === 'Rua Nova');
    await page.locator('input[name=number]').fill('44');
    await page.locator('input[name=complement]').fill('Bloco B');
    failAddress = true;
    await page.getByRole('button', { name: 'Ir para Pagamento' }).click();
    await page.getByText('Não foi possível salvar seus dados.', { exact: false }).waitFor();
    assert.equal(await page.locator('.qa-brick').count(), 0);
    failAddress = false;
    await page.getByRole('button', { name: 'Ir para Pagamento' }).click();
    await page.locator('.qa-brick').waitFor();
    assert.equal(addresses[2].complemento, 'Bloco B');
    await page.reload(); await page.getByRole('button', { name: 'Continuar para Entrega' }).click();
    await page.getByRole('button', { name: /Meu Endereço Rua Nova/ }).waitFor();
    await page.screenshot({ path: `sandbox-runtime/checkout-address-${width}.png`, fullPage: true });
    await page.goto(`${site}/admin/categorias`);
    await page.getByRole('button', { name: 'Arquivar', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Arquivar', exact: true }).click();
    await page.getByRole('button', { name: 'Arquivadas (1)' }).click();
    await page.getByRole('button', { name: 'Restaurar', exact: true }).click();
    await page.getByRole('button', { name: 'Ativas (1)' }).click();
    await page.getByRole('link', { name: 'Gerenciar produtos' }).waitFor();
    await page.getByRole('button', { name: 'Notificações de pedidos' }).click();
    await page.getByText('Pedido #order-qa').waitFor();
    await page.screenshot({ path: `sandbox-runtime/admin-categories-${width}.png`, fullPage: true });
    const notificationBounds = await page.locator('#recent-orders').boundingBox();
    assert.ok(notificationBounds.x >= 0 && notificationBounds.x + notificationBounds.width <= width);
    await page.goto(`${site}/admin/clientes/${user.id}/precos`);
    await page.getByRole('checkbox', { name: /Desconto de afiliado/ }).click();
    await page.getByRole('dialog').waitFor();
    assert.equal(affiliateEnabled, false);
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    assert.equal(affiliateEnabled, false);
    await page.getByRole('checkbox', { name: /Desconto de afiliado/ }).click();
    await page.getByRole('button', { name: 'Autorizar benefício', exact: true }).click();
    await page.getByText('Alteração salva.', { exact: true }).waitFor();
    assert.equal(affiliateEnabled, true);
    console.log(`PASS ${width}: stable payment mount, CVV visibility, pickup billing, multiple addresses, save failure, persistence reload, archive/restore, notifications. All integrations mocked; no charges or remote writes.`);
    await context.close();
  }
} finally { await browser.close(); }
