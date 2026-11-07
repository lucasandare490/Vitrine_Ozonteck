// Uses only a verified Mercado Pago test seller and a disposable database.
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { parseEnv } from 'node:util';
import vm from 'node:vm';
import { PGlite } from '@electric-sql/pglite';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const sdk = require('mercadopago');
const credentials = parseEnv(readFileSync('.env.orders-test.local', 'utf8'));
const accessToken = credentials.ORDERS_TEST_ACCESS_TOKEN;
const application = credentials.ORDERS_TEST_APPLICATION_ID;
assert.ok(application && accessToken?.match(/^APP_USR-(\d+)-/)?.[1] === application, 'Explicit test application required');
const sellerResponse = await fetch('https://api.mercadopago.com/users/me', {
  headers: { Authorization: 'Bearer ' + accessToken }, signal: AbortSignal.timeout(15000),
});
assert.equal(sellerResponse.status, 200, 'Test credentials unavailable');
const seller = await sellerResponse.json();
assert.ok(seller.tags?.includes('test_user') && seller.site_id === 'MLB', 'Only a Brazilian test seller is allowed');

const client = new sdk.Order(new sdk.MercadoPagoConfig({ accessToken, options: { timeout: 15000 } }));
const assertTestOrder = id => assert.match(id, /^ORDTST[A-Z0-9]+$/, 'Expected a test order');
const checkedResponse = result => { assertTestOrder(result.id); return result; };
const db = new PGlite();
const customer = randomUUID(), admin = randomUUID(), other = randomUUID();
const secret = randomUUID();
const code = 'QA-CHECKOUT';
const env = {
  NODE_ENV: 'test', NEXT_PUBLIC_SUPABASE_URL: 'https://database.example.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'isolated-fixture', NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY: 'isolated-fixture',
  MP_ORDERS_ACCESS_TOKEN: 'isolated-fixture', MP_ORDERS_ACCOUNT_ID: String(seller.id),
  MP_ORDERS_APPLICATION_ID: application, MP_ORDERS_WEBHOOK_SECRET: secret,
  CUSTOMER_EMAIL_ENABLED: 'true', SMTP_USER: 'shop@example.invalid',
  SMTP_APP_PASSWORD: 'isolated-fixture', NEXT_PUBLIC_SITE_URL: 'https://shop.example.invalid',
};
const email = 'customer@example.invalid';
const mailbox = [];
const rpcArgs = {
  liberar_reservas_expiradas: [], resolve_customer_prices: ['p_user_id'],
  reserve_priced_order: ['p_checkout_id','p_user_id','p_total','p_delivery_address','p_items','p_reservation_minutes'],
  bind_order_payment_provider: ['p_order','p_account','p_application'],
  processar_status_pagamento: ['p_payment_id','p_payment_status','p_checkout_id','p_amount'],
  reabrir_compra_cancelada: ['p_order','p_user','p_payment','p_reason'],
  vincular_compra_alterada: ['p_change','p_order','p_user'],
};
const dbValue = value => value !== null && typeof value === 'object' ? JSON.stringify(value) : value;
const adapter = {
  auth: {
    getUser: async token => ({ data: { user: { id: token === 'other-fixture' ? other : customer, factors: [] } } }),
    getClaims: async () => ({ data: { claims: { aal: 'aal1' } } }),
    admin: { getUserById: async id => {
      const { rows: [user] } = await db.query('select email,email_confirmed_at from auth.users where id=$1', [id]);
      return { data: { user } };
    } },
  },
  async rpc(name, args) {
    if (name === 'claim_customer_email') return { data: (await db.query('select * from claim_customer_email()')).rows };
    assert.ok(Object.hasOwn(rpcArgs, name));
    const values = rpcArgs[name].map(key => dbValue(args[key]));
    const placeholders = values.map((_, i) => '$' + (i + 1)).join(',');
    try {
      return { data: (await db.query(`select ${name}(${placeholders}) as result`, values)).rows[0].result };
    } catch (error) {
      console.error('Isolated SQL error', name, error.code);
      return { error: { message: error.message } };
    }
  },
  from(table) {
    assert.ok(['pedidos','produtos','pedido_alteracoes','pedido_payment_provider','customer_email_outbox'].includes(table));
    const filters = [];
    let changes = null;
    const query = {
      select: async () => {
        assert.equal(table, 'customer_email_outbox');
        const fields = Object.keys(changes);
        assert.ok(fields.every(key => ['state','sent_at','error_code','lease','locked_until','available_at'].includes(key)));
        assert.deepEqual(filters.map(([key]) => key), ['id','lease','state']);
        return { data: (await db.query(`update customer_email_outbox
          set ${fields.map((key, i) => `${key}=$${i+1}`).join(',')}
          where id=$${fields.length+1} and lease=$${fields.length+2} and state=$${fields.length+3} returning id`,
        [...fields.map(key => changes[key]), ...filters.map(([, value]) => value)])).rows };
      },
      update(values) { changes = values; return query; },
      eq(column, value) {
        assert.ok(['id','user_id','pedido_id','checkout_id','lease','state'].includes(column));
        filters.push([column, value]); return query;
      },
      async maybeSingle() {
        assert.ok(filters.length);
        return { data: (await db.query(`select * from ${table} where
          ${filters.map(([column], i) => `${column}=$${i+1}`).join(' and ')}`, filters.map(([, value]) => value))).rows[0] ?? null };
      },
      single() { return this.maybeSingle(); },
      async in(column, values) {
        assert.equal(table, 'produtos'); assert.equal(column, 'code');
        return { data: (await db.query('select * from produtos where code=any($1)', [values])).rows };
      },
      async limit(value) {
        assert.equal(table, 'pedido_alteracoes'); assert.equal(value, 0);
        return { data: (await db.query('select id from pedido_alteracoes limit 0')).rows };
      },
    };
    return { ...query, select: () => query };
  },
};

const modules = new Map();
function load(file) {
  file = resolve(file);
  if (modules.has(file)) return modules.get(file);
  const exported = {};
  const js = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(js, {
    exports: exported, URL, Date, Uint8Array, TextDecoder, process: { env }, console: { error() {} },
    require(name) {
      if (name === '@supabase/supabase-js') return { createClient: () => adapter };
      if (name === 'server-only') return {};
      if (name === 'mercadopago') return {
        WebhookSignatureValidator: sdk.WebhookSignatureValidator, InvalidWebhookSignatureError: sdk.InvalidWebhookSignatureError,
        MercadoPagoConfig: class { constructor({ accessToken: token }) { assert.equal(token, 'isolated-fixture'); } },
        Order: class {
          async create(args) {
            try {
              assert.equal(args.requestOptions?.idempotencyKey, args.body.external_reference);
              return checkedResponse(await client.create(args));
            }
            catch (error) {
              console.error('Test provider create', error.status, error.errors?.map(item => item.code));
              throw error;
            }
          }
          async get(args) { assertTestOrder(args.id); return checkedResponse(await client.get(args)); }
          async cancel(args) { assertTestOrder(args.id); return client.cancel(args); }
        },
      };
      if (name === 'nodemailer') return { createTransport: () => ({
        async sendMail(message) { mailbox.push(message); return { accepted: [message.to] }; }, close() {},
      }) };
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
      if (name.startsWith('.')) return load(resolve(dirname(file), name.endsWith('.ts') ? name : name + '.ts'));
      assert.ok(['zod','crypto','node:crypto','next/server','@upstash/ratelimit','@upstash/redis'].includes(name), name);
      return require(name);
    },
  }, { filename: file });
  if (file.endsWith('orders-provider.ts')) {
    for (const method of ['createOrdersPayment','reconcileOrdersPayment']) {
      const original = exported[method];
      exported[method] = async (...args) => {
        try { return await original(...args); }
        catch (error) {
          console.error(method, /^[A-Z_]+$/.test(error.message) ? error.message : error.name);
          throw error;
        }
      };
    }
  }
  modules.set(file, exported);
  return exported;
}

const sql = name => readFileSync('supabase/migrations/' + name + '.sql', 'utf8');
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    create table profiles(id uuid primary key,role text);
    create function account_mfa_allowed() returns boolean language sql as $$ select true $$;
    create table produtos(code text primary key,name text,category text,price numeric,estoque integer,is_deleted boolean default false);
    create table pedidos(id uuid primary key default gen_random_uuid(),user_id uuid,checkout_id text unique,
      id_pagamento_mp text unique,valor_total numeric,status text,status_pagamento text,endereco_entrega jsonb,
      itens jsonb,estoque_baixado boolean default false,reserva_expira_em timestamptz,created_at timestamptz default now());`);
  const setup = sql('202609240001_ozonteck_complete_setup');
  await db.exec(setup.match(/create or replace function public\.is_admin\(\)[\s\S]*?grant execute on function public\.is_admin\(\) to anon, authenticated, service_role;/)[0]);
  const hardening = sql('202609240002_security_hardening');
  await db.exec(hardening.slice(hardening.indexOf('create or replace function public.liberar_reservas_expiradas()'), hardening.lastIndexOf('commit;')));
  for (const name of ['202610090001_affiliate_pricing','202610140001_order_changes','202610220001_payment_provider_binding',
    '202611010001_customer_email_outbox','202611040003_pickup_ready','202611070001_payment_cancellation_status']) await db.exec(sql(name));
  await db.query('insert into auth.users values($1,$2,now())', [customer,email]);
  await db.query("insert into profiles values($1,'admin')", [admin]);
  await db.query('insert into produtos values($1,$2,$3,50,1,false)', [code,'Produto QA','Cuidados']);

  const checkout = load('app/api/checkout/route.ts').POST;
  const webhook = load('app/api/webhook/orders/route.ts').POST;
  const payment = load('app/api/pedidos/[id]/pagamento/route.ts').GET;
  const change = load('app/api/pedidos/[id]/alterar/route.ts').POST;
  const deliver = load('netlify/functions/customer-emails.ts').default;
  const { matchesAccountOrderFilter, matchesAuditFilter } = load('lib/confirmed-sale.ts');
  const stock = async () => (await db.query('select estoque from produtos')).rows[0].estoque;
  const context = id => ({ params: Promise.resolve({ id }) });
  const request = (path, body, headers = {}) => new Request('https://shop.example.invalid' + path, {
    method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer customer-fixture', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  const start = (method, key, changeId) => checkout(request('/api/checkout', {
    expected_total: 50, cart_items: [{code,quantity:1}], payment_method_id: method, change_id: changeId,
    payer: { email: 'test_user_br@testuser.com', first_name: 'APRO', last_name: 'Teste',
      identification: { type: 'CPF', number: '52998224725' },
      address: { zip_code: '50050015', street_name: 'Rua de teste', street_number: '1', neighborhood: 'Centro', city: 'Recife', federal_unit: 'PE' } },
    metadata: { phone: '81999999999', delivery_mode: 'retirada', user_id: customer },
  }, { 'x-idempotency-key': key }));
  async function json(response, expected = 200) {
    assert.equal(response.status, expected);
    return response.json();
  }
  const lookup = (id, headers) => payment(request('/api/pedidos/' + id + '/pagamento', null, headers), context(id));
  async function signedCallback(id) {
    const requestId = randomUUID(), timestamp = String(Date.now());
    const signature = createHmac('sha256', secret).update(`id:${id};request-id:${requestId};ts:${timestamp};`).digest('hex');
    // Envelope generated here; the handler independently fetches the actual test order.
    return webhook(request('/api/webhook/orders?data.id=' + id, {type:'order',live_mode:true,data:{id}}, {
      'x-request-id':requestId, 'x-signature':`ts=${timestamp},v1=${signature}`,
    }));
  }

  const boletoKey = 'orders-' + randomUUID();
  const boleto = await json(await start('boleto', boletoKey));
  assertTestOrder(boleto.id);
  assert.equal((await json(await start('boleto', boletoKey))).id, boleto.id);
  assert.equal(await stock(), 0);
  const ticket = await json(await lookup(boleto.order_id));
  assert.ok(ticket.payable && ticket.boletoCode && ticket.boletoUrl);
  await json(await lookup(boleto.order_id, { Authorization: 'Bearer other-fixture' }), 404);
  await json(await start('boleto', 'orders-' + randomUUID()), 409);
  await deliver(); // welcome
  await deliver(); // pending boleto
  console.log('PASS boleto issued, displayed only to owner, and checkout replay reused the order and reservation.');

  const changeRequest = () => change(request('/api/pedidos/' + boleto.order_id + '/alterar', {reason:'pagamento'}), context(boleto.order_id));
  const { change: event } = await json(await changeRequest());
  assert.equal((await json(await changeRequest())).change.id, event.id);
  await json(await signedCallback(boleto.id));
  const cancelled = await json(await lookup(boleto.order_id));
  assert.equal(cancelled.orderStatus, 'cancelado');
  assert.equal(cancelled.payable, false);
  assert.equal(cancelled.boletoCode, null);
  assert.equal(await stock(), 1);
  await deliver(); // cancellation

  const pix = await json(await start('pix', 'orders-' + randomUUID(), event.id));
  assertTestOrder(pix.id);
  // Ensure the administrative history used by both the bell and the changes panel is readable.
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
  await db.exec('set role authenticated');
  const { rows: [notice] } = await db.query('select pedido_id,novo_pedido_id from pedido_alteracoes where id=$1', [event.id]);
  assert.deepEqual(notice, {pedido_id:boleto.order_id, novo_pedido_id:pix.order_id});
  await db.exec('reset role');
  await deliver(); // replacement linked
  await deliver(); // pending Pix, unless already settled
  console.log('PASS boleto cancellation, stock release, replacement purchase and admin order-change history.');

  for (let attempt = 0; attempt < 10; attempt++) {
    const state = checkedResponse(await client.get({ id: pix.id }));
    if (state.status === 'processed') break;
    await setTimeout(3000);
  }
  await json(await signedCallback(pix.id));
  await json(await signedCallback(pix.id));
  const settled = await json(await lookup(pix.order_id));
  assert.equal(settled.status, 'approved');
  assert.equal(settled.orderStatus, 'preparando');
  assert.equal(await stock(), 0);
  const { rows: [row] } = await db.query('select * from pedidos where id=$1', [pix.order_id]);
  assert.equal(matchesAccountOrderFilter(row,'Todos'), true);
  assert.equal(matchesAuditFilter(row,'Todos'), true);
  assert.equal(row.retirada_pronta_em, null);
  await deliver(); // approval
  await db.query('update pedidos set retirada_pronta_em=now() where id=$1', [pix.order_id]);
  await deliver(); // pickup
  await db.query("update pedidos set status='entregue' where id=$1", [pix.order_id]);
  await deliver(); // delivery
  await deliver(); // queue drained
  const { rows: sent } = await db.query("select event,id,attempts from customer_email_outbox where state='sent'");
  for (const event of ['welcome','payment_pending','order_cancelled','order_changed','payment_approved','pickup_ready','order_delivered']) {
    assert.ok(sent.some(row => row.event === event), event);
  }
  assert.equal(mailbox.length, sent.length);
  assert.equal(new Set(mailbox.map(message => message.messageId)).size, sent.length);
  for (const job of sent) {
    assert.equal(job.attempts, 1);
    const message = mailbox.find(message => message.messageId === '<' + job.id + '@shop.example.invalid>');
    assert.equal(message?.to, email);
    assert.ok(message?.html.includes('https://shop.example.invalid/conta'));
  }
  console.log('PASS Pix settlement, signed local webhook replay, shared account/audit filters and transactional mail in the local inbox.');
} finally {
  await db.close();
}
