// Safe production smoke check. The fixture is rejected before a provider lookup or an order write.
import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const production = 'https://ozonteck-recife.netlify.app';
const fictitiousId = 'ORD00000000000000000000000000';

async function probe(secret, valid) {
  const requestId = randomUUID();
  const timestamp = String(Math.floor(Date.now() / 1000));
  const manifest = `id:${fictitiousId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const signature = valid ? createHmac('sha256', secret).update(manifest).digest('hex') : '0'.repeat(64);
  const url = new URL('/api/webhook/orders', production);
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
  return {
    status: response.status,
    expectedResponse: valid
      ? response.status === 400 && body.error === 'Evento invalido.'
      : response.status === 401 && body.error === 'Assinatura invalida.',
  };
}

try {
  const env = parseEnv(readFileSync(process.argv[2] || '.env', 'utf8'));
  if (new URL(env.NEXT_PUBLIC_SITE_URL).origin !== production || !env.MP_ORDERS_WEBHOOK_SECRET) {
    throw new Error('PRODUCTION_PROBE_CONFIGURATION_REQUIRED');
  }
  const invalidSignature = await probe(env.MP_ORDERS_WEBHOOK_SECRET, false);
  const canonicalSignature = await probe(env.MP_ORDERS_WEBHOOK_SECRET, true);
  const passed = invalidSignature.expectedResponse && canonicalSignature.expectedResponse;
  console.log(JSON.stringify({ invalidSignature, canonicalSignature, passed }));
  if (!passed) process.exitCode = 1;
} catch {
  // Never print environment values, request headers, or response bodies.
  console.error('WEBHOOK_PROBE_UNAVAILABLE');
  process.exitCode = 1;
}
