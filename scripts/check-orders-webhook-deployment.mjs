// Safe production smoke check. The fixture is rejected before a provider lookup or an order write.
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const production = 'https://ozonteck-recife.netlify.app';
const localProbe = process.argv.includes('--local');
const target = localProbe ? 'http://127.0.0.1:3108' : production;
const lowercaseQuery = process.argv.includes('--lowercase-query');
const fictitiousId = lowercaseQuery ? 'ord00000000000000000000000000' : 'ORD00000000000000000000000000';

async function probe(secret, valid) {
  const requestId = randomUUID();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const manifest = `id:${fictitiousId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const signature = valid ? createHmac('sha256', secret).update(manifest).digest('hex') : '0'.repeat(64);
  const url = new URL('/api/webhook/orders', target);
  url.searchParams.set('data.id', fictitiousId);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      'x-signature': `ts=${timestamp},v1=${signature}`,
    },
    // Even with a valid signature, the event type is deliberately outside the accepted schema.
    body: JSON.stringify({ type: 'deployment_probe', live_mode: true, data: { id: fictitiousId } }),
    signal: AbortSignal.timeout(12000),
    redirect: 'error',
  });
  const body = await response.json().catch(() => ({}));
  const knownErrors = ['Evento invalido.', 'Assinatura invalida.', 'Assinatura expirada.', 'Notificacao invalida.', 'Notificacoes indisponiveis.'];
  return {
    status: response.status,
    error: knownErrors.includes(body.error) ? body.error : null,
    expectedResponse: valid
      ? response.status === 400 && body.error === 'Evento invalido.'
      : response.status === 401 && body.error === 'Assinatura invalida.',
  };
}

try {
  const env = parseEnv(readFileSync(process.argv.slice(2).find(arg => !arg.startsWith('--')) || '.env', 'utf8'));
  if (new URL(env.NEXT_PUBLIC_SITE_URL).origin !== production || !env.MP_ORDERS_WEBHOOK_SECRET) {
    throw new Error('PRODUCTION_PROBE_CONFIGURATION_REQUIRED');
  }
  const invalidSignature = await probe(env.MP_ORDERS_WEBHOOK_SECRET, false);
  const canonicalSignature = await probe(env.MP_ORDERS_WEBHOOK_SECRET, true);
  const passed = invalidSignature.expectedResponse && canonicalSignature.expectedResponse;
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), environment: localProbe ? 'local-production-build' : 'published', idCase: lowercaseQuery ? 'lowercase' : 'uppercase', scope: 'Fictitious event rejected before provider lookup or order writes; does not prove a provider webhook delivery.', invalidSignature, canonicalSignature, passed }));
  if (!passed) process.exitCode = 1;
} catch {
  // Never print environment values, request headers, or response bodies.
  console.error('WEBHOOK_PROBE_UNAVAILABLE');
  process.exitCode = 1;
}
