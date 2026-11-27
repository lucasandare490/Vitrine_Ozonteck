// Isolated PostgreSQL + actual queue triggers and worker. No production database,
// provider request, customer record or real order is read or written.
// Default: local MIME only. --send requires explicit owner-inbox confirmation.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import nodemailer from 'nodemailer';
import { PGlite } from '@electric-sql/pglite';

const send = process.argv.includes('--send');
const recipient = send ? process.env.EMAIL_VERIFICATION_RECIPIENT : 'owner@example.invalid';
const smtpUser = send ? process.env.SMTP_USER : 'verification@example.invalid';
const smtpPassword = send ? process.env.SMTP_APP_PASSWORD : 'local-only';
assert.ok(recipient && /^[^\s<>,;]+@[^\s<>,;]+\.[^\s<>,;]+$/.test(recipient), 'Single verification inbox required');
if (send) {
  assert.equal(process.env.EMAIL_VERIFICATION_OWN_INBOX_CONFIRMED, 'true', 'Owner inbox authorization required');
  assert.ok(smtpUser && smtpPassword, 'SMTP credentials required in private process environment');
}
const runId = 'V20261127-' + randomUUID().slice(0, 8);
const userId = randomUUID();
const db = new PGlite();
const evidence = { runId, mode: send ? 'isolated-database-real-smtp' : 'isolated-database-local-mime',
  startedAt: new Date().toISOString(), recipientScope: 'Single explicitly authorized owner inbox; address omitted',
  boundary: 'Real source SQL triggers and source worker; fictional order states in disposable PostgreSQL. Not a Mercado Pago approval, live checkout, production database write or Netlify scheduled-run verification.',
  events: [] };
const output = process.env.EMAIL_VERIFICATION_OUTPUT || 'tmp/order-email-verification.json';
await mkdir(dirname(resolve(output)), { recursive: true });
if (send) {
  assert.ok(process.env.EMAIL_VERIFICATION_OUTPUT, 'A new evidence output path is required for real delivery');
  // Refuse a repeated run against an existing evidence file before sending anything.
  await writeFile(output, JSON.stringify(evidence, null, 2) + '\n', { flag: 'wx' });
}
let delivered = 0;
const cases = [
  { event: 'payment_pending', status: 'pending', payment: 'pending', paymentId: 'LOCAL-VERIFICATION-NOT-A-PAYMENT' },
  { event: 'payment_approved', status: 'preparando', payment: 'approved' },
  { event: 'payment_rejected', status: 'pagamento_recusado', payment: 'rejected' },
  { event: 'order_changed', status: 'preparando', payment: 'approved', changed: true },
  { event: 'order_shipped', status: 'enviado', payment: 'approved' },
  { event: 'pickup_ready', status: 'preparando', payment: 'approved', ready: true },
  { event: 'order_delivered', status: 'entregue', payment: 'approved' },
  { event: 'order_cancelled', status: 'cancelado', payment: 'cancelled' },
  { event: 'refund_confirmed', status: 'reembolsado', payment: 'refunded' },
];

const adapter = {
  auth: { admin: { async getUserById(id) {
    assert.equal(id, userId);
    const { rows } = await db.query('select email,email_confirmed_at from auth.users where id=$1', [id]);
    return { data: { user: rows[0] }, error: null };
  } } },
  async rpc(name) {
    assert.equal(name, 'claim_customer_email');
    return { data: (await db.query('select * from claim_customer_email()')).rows, error: null };
  },
  from(table) {
    assert.ok(['pedidos', 'customer_email_outbox'].includes(table));
    const filters = [];
    let update = null;
    const query = {
      eq(key, value) { filters.push([key, value]); return query; },
      select() {
        if (update) {
          assert.equal(table, 'customer_email_outbox');
          assert.deepEqual(filters.map(([key]) => key), ['id', 'lease', 'state']);
          const fields = Object.keys(update);
          assert.ok(fields.every(key => ['state','sent_at','error_code','lease','locked_until','available_at'].includes(key)));
          return db.query(`update customer_email_outbox set ${fields.map((field, i) => `${field}=$${i+1}`).join(',')}
            where id=$${fields.length+1} and lease=$${fields.length+2} and state=$${fields.length+3} returning id`,
          [...fields.map(key => update[key]), ...filters.map(([, value]) => value)]).then(result => ({ data: result.rows, error: null }));
        }
        return query;
      },
      async maybeSingle() {
        assert.equal(table, 'pedidos'); assert.equal(filters[0][0], 'id');
        return { data: (await db.query('select * from pedidos where id=$1', [filters[0][1]])).rows[0] || null, error: null };
      },
      update(values) { update = values; return query; },
    };
    return query;
  },
};
const cache = new Map();
async function load(file) {
  if (cache.has(file)) return cache.get(file);
  const source = await readFile(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  const exported = {};
  const modules = {
    '@supabase/supabase-js': { createClient: () => adapter },
    '../../lib/customer-email': cache.get('lib/customer-email.ts'),
    '../../lib/customer-email-delivery': cache.get('lib/customer-email-delivery.ts'),
    nodemailer: { createTransport(options) {
      const transport = nodemailer.createTransport(send ? options : { streamTransport: true, buffer: true, newline: 'unix' });
      return {
        async sendMail(message) {
          assert.equal(message.to, recipient); assert.ok(delivered < 9, 'Verification message cap exceeded');
          const notice = 'VERIFICAÇÃO AUTORIZADA: dados fictícios. Não existe compra, cobrança, retirada ou reembolso real.\n\n';
          const result = await transport.sendMail({ ...message,
            subject: `[VERIFICACAO ${runId}] ${message.subject}`,
            text: notice + message.text,
            html: message.html.replace(/(<body[^>]*>)/, '$1<p style="padding:20px;background:#fff3cd;font-family:Arial,sans-serif">' + notice + '</p>'),
            headers: { 'X-Ozonteck-Verification': runId },
          });
          if (send) assert.deepEqual(result.accepted, [recipient]);
          delivered++;
          return { accepted: [recipient] };
        },
        close() { transport.close(); },
      };
    } },
  };
  vm.runInNewContext(code, { exports: exported, URL, Date,
    process: { env: { CUSTOMER_EMAIL_ENABLED: 'true',
      NEXT_PUBLIC_SUPABASE_URL: 'https://verification.example.invalid', SUPABASE_SERVICE_ROLE_KEY: 'ISOLATED_DATABASE_ONLY',
      SMTP_USER: smtpUser, SMTP_APP_PASSWORD: smtpPassword, NEXT_PUBLIC_SITE_URL: 'https://ozonteck-recife.netlify.app' } },
    require(name) { assert.ok(name in modules && modules[name], `Unsupported source dependency: ${name}`); return modules[name]; },
  });
  cache.set(file, exported); return exported;
}

try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create table public.pedidos(id uuid primary key,user_id uuid,status text,status_pagamento text,id_pagamento_mp text,endereco_entrega jsonb);
    create table public.pedido_alteracoes(id uuid primary key,user_id uuid,novo_pedido_id uuid);
    create function public.is_admin() returns boolean language sql as $$select true$$;
  `);
  for (const file of ['202611010001_customer_email_outbox.sql', '202611040003_pickup_ready.sql']) {
    await db.exec(await readFile('supabase/migrations/' + file, 'utf8'));
  }
  await db.query('insert into auth.users values($1,$2,now())', [userId, recipient]);
  await db.query("update customer_email_outbox set state='skipped',error_code='WELCOME_ALREADY_VERIFIED' where event='welcome'");
  await load('lib/customer-email.ts'); await load('lib/customer-email-delivery.ts');
  const worker = (await load('netlify/functions/customer-emails.ts')).default;
  for (const scenario of cases) {
    const orderId = randomUUID();
    await db.query('insert into pedidos(id,user_id,status,status_pagamento,id_pagamento_mp,endereco_entrega,retirada_pronta_em) values($1,$2,$3,$4,$5,$6,$7)',
      [orderId, userId, scenario.status, scenario.payment, scenario.paymentId || null,
        { modalidade: scenario.ready ? 'retirada' : 'entrega' }, scenario.ready ? new Date().toISOString() : null]);
    if (scenario.changed) {
      const changeId = randomUUID();
      await db.query('insert into pedido_alteracoes values($1,$2,null)', [changeId, userId]);
      await db.query('update pedido_alteracoes set novo_pedido_id=$1 where id=$2', [orderId, changeId]);
    }
    await db.query("update customer_email_outbox set state='skipped',error_code='OTHER_SCENARIO' where state='pending' and event<>$1", [scenario.event]);
    const { rows: [job] } = await db.query("select * from customer_email_outbox where pedido_id=$1 and event=$2 and state='pending'", [orderId, scenario.event]);
    assert.ok(job, 'Actual trigger did not create ' + scenario.event);
    await worker();
    const { rows: [result] } = await db.query('select state,attempts,sent_at,error_code from customer_email_outbox where id=$1', [job.id]);
    evidence.events.push({ event: scenario.event, jobId: job.id, messageId: `<${job.id}@ozonteck-recife.netlify.app>`, ...result, inboxConfirmed: false });
    await writeFile(output, JSON.stringify(evidence, null, 2) + '\n');
    assert.equal(result.state, 'sent', 'Delivery not acknowledged: ' + scenario.event);
    assert.equal(result.attempts, 1);
    await worker(); // Sent jobs cannot be claimed again.
    console.log(scenario.event + ': trigger -> queue -> worker -> ' + (send ? 'SMTP accepted' : 'local MIME') + ' -> sent; repeat produced no new message.');
  }
  assert.equal(delivered, 9);
  evidence.completedAt = new Date().toISOString();
  await writeFile(output, JSON.stringify(evidence, null, 2) + '\n');
  console.log('Verification completed: ' + runId + '. Inbox receipt must be checked separately.');
} catch {
  evidence.failed = true;
  await writeFile(output, JSON.stringify(evidence, null, 2) + '\n');
  console.error('EMAIL_VERIFICATION_INCOMPLETE: inspect sanitized event states; no credentials logged.');
  process.exitCode = 1;
} finally { await db.close(); }
