import { readFileSync } from 'node:fs';
import { isIP } from 'node:net';
import { parseEnv } from 'node:util';

// Single-file, read-only inspection. No SDK, Next runtime, network or DB imports.
// Deliberately does not merge process.env, expand variables or load other .env files.
const scope = 'Configuracao de um arquivo local; sem rede, banco, alteracoes ou pagamentos. Nao certifica producao nem sandbox.';
const limits = {
  productionReady: false,
  providerVerified: false,
  sandboxOrdersSupported: false,
  ordersWebhookPath: '/api/webhook/orders',
};

function stableHttpsOrigin(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
    return url.protocol === 'https:' && !url.username && !url.password
      && !url.search && !url.hash && url.pathname === '/' && (!url.port || url.port === '443')
      && host.includes('.') && !isIP(host)
      && !/(^|\.)(localhost|local|invalid|test|example)$/.test(host)
      && !/(^|\.)(trycloudflare\.com|ngrok-free\.app|ngrok\.io)$/.test(host);
  } catch {
    return false;
  }
}

function inspect(env) {
  const keys = [
    'NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY', 'MP_ORDERS_ACCESS_TOKEN',
    'MP_ORDERS_ACCOUNT_ID', 'MP_ORDERS_APPLICATION_ID', 'MP_ORDERS_WEBHOOK_SECRET',
    'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN',
  ];
  const presence = Object.fromEntries(keys.map(key => [key, Boolean(env[key]?.trim())]));
  const sandbox = env.PAYMENT_SANDBOX === 'true';
  const publicSandbox = env.NEXT_PUBLIC_PAYMENT_SANDBOX === 'true';
  // Match current app/lista/page.tsx and app/api/checkout/route.ts selection.
  const frontendOrdersSelected = Boolean(env.NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY);
  const backendOrdersSelected = frontendOrdersSelected && !sandbox;
  const checks = [];
  const add = (name, ok, detail) => checks.push({ name, ok, detail });
  add('orders_credentials_present', keys.slice(0, 5).every(key => presence[key]),
    'Presenca apenas; identidade, conta de teste/producao e permissoes nao verificadas.');
  add('orders_credentials_format', ['NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY', 'MP_ORDERS_ACCESS_TOKEN']
    .every(key => env[key]?.trim().startsWith('APP_USR-')),
    'Prefixo APP_USR apenas. A documentacao Orders tambem o usa em teste; nao comprova ambiente.');
  add('current_orders_runtime', backendOrdersSelected && !publicSandbox,
    'O provedor atual rejeita PAYMENT_SANDBOX=true. Este checker nunca executa o provedor.');
  add('sandbox_flags_consistent', sandbox === publicSandbox
    && ['PAYMENT_SANDBOX', 'NEXT_PUBLIC_PAYMENT_SANDBOX'].every(key =>
      env[key] === undefined || ['true', 'false'].includes(env[key])),
    'Com chave Orders e sandbox, a UI seleciona Orders mas o checkout segue a integracao legada.');
  add('site_origin', stableHttpsOrigin(env.NEXT_PUBLIC_SITE_URL),
    'Somente formato de origem HTTPS; propriedade, DNS e disponibilidade nao consultados.');
  add('database_configuration_present', ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
    .every(key => presence[key]), 'Sem conectar ao banco ou verificar migracoes, permissoes e dados.');
  add('rate_limit_configuration_present', ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']
    .every(key => presence[key]), 'Presenca apenas; servico nao consultado.');
  add('literal_values', keys.every(key => !env[key]?.includes('$')),
    'Referencias entre variaveis nao sao expandidas; revisar o ambiente efetivo separadamente.');
  return {
    scope, ...limits, presence, frontendOrdersSelected, backendOrdersSelected,
    configurationChecksPassed: checks.every(check => check.ok), checks,
    gaps: [
      'Sandbox Orders nao implementado no provedor e na rota de notificacoes atuais.',
      'Entrega de webhook, vinculo da conta/aplicacao, 3DS e cada modalidade exigem evidencias separadas.',
      'MP_WEBHOOK_URL pertence ao fluxo legado; nao comprova configuracao de /api/webhook/orders no painel.',
      'Arquivo inspecionado isoladamente; nao representa o ambiente efetivo do Next.js ou do deploy.',
    ],
  };
}

let report;
try {
  const source = readFileSync(process.argv[2] || '.env', 'utf8');
  report = inspect(parseEnv(source));
} catch {
  // Never echo exception messages, file paths, source lines or credential values.
  report = { scope, ...limits, configurationChecksPassed: false, error: 'ENV_FILE_UNREADABLE' };
}
console.log(JSON.stringify(report, null, 2));
if (!report.configurationChecksPassed) process.exitCode = 1;
