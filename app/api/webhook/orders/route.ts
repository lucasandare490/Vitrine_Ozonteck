import { createClient } from '@supabase/supabase-js';
import { InvalidWebhookSignatureError, WebhookSignatureValidator } from 'mercadopago';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createRateLimitGuard, readJsonBody, RequestBodyError } from '@/lib/server/http';
import { normalizeOrdersResponse } from '@/lib/server/mercado-pago-orders';
import { ordersClient, reconcileOrdersPayment, validateOrdersBinding } from '@/lib/server/orders-provider';

const limit = createRateLimitGuard({ limit: 30, window: '1 m', prefix: 'orders-webhook' });
const schema = z.object({ type: z.literal('order'), live_mode: z.literal(true), data: z.object({ id: z.string() }) });
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  try {
    const secret = process.env.MP_ORDERS_WEBHOOK_SECRET;
    if (!secret) return reply({ error: 'Notificacoes indisponiveis.' }, 503);
    const signature = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');
    const id = new URL(request.url).searchParams.get('data.id');
    if (!signature || !requestId || requestId.length > 200 || !id || !/^ORD[A-Za-z0-9]+$/i.test(id)) return reply({ error: 'Notificacao invalida.' }, 400);
    WebhookSignatureValidator.validate({ xSignature: signature, xRequestId: requestId, dataId: id, secret });
    const timestamp = signature.split(',').map(part => part.trim()).find(part => part.startsWith('ts='))?.slice(3);
    const parsed = Number(timestamp);
    const millis = parsed < 1e12 ? parsed * 1000 : parsed;
    if (!timestamp || !/^\d+$/.test(timestamp) || !Number.isSafeInteger(parsed) || Math.abs(Date.now() - millis) > 600000) return reply({ error: 'Assinatura expirada.' }, 401);
    const decision = await limit(id);
    if (decision !== 'allowed') return reply({ error: 'Tente novamente.' }, decision === 'denied' ? 429 : 503);
    const body = schema.safeParse(await readJsonBody(request, 32768));
    if (!body.success || body.data.data.id.toLowerCase() !== id.toLowerCase()) return reply({ error: 'Evento invalido.' }, 400);
    // Only an authenticated GET from Mercado Pago is allowed to settle an order.
    const raw = await ordersClient().get({ id: body.data.data.id });
    if (!raw.external_reference) return reply({ error: 'Referencia ausente.' }, 409);
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: order, error } = await db.from('pedidos').select('id,checkout_id,valor_total,id_pagamento_mp').eq('checkout_id', raw.external_reference).maybeSingle();
    if (error || !order) return reply({ error: 'Compra nao localizada.' }, 409);
    if (order.id_pagamento_mp && order.id_pagamento_mp !== raw.id) return reply({ error: 'Cobranca divergente.' }, 409);
    const identity = await validateOrdersBinding(db, order);
    const payment = normalizeOrdersResponse(raw, { ...identity, id: body.data.data.id });
    const result = await reconcileOrdersPayment(db, order, payment);
    return reply({ success: true, requires_review: result.estoque_disponivel === false });
  } catch (error) {
    if (error instanceof InvalidWebhookSignatureError) return reply({ error: 'Assinatura invalida.' }, 401);
    if (error instanceof RequestBodyError) return reply({ error: error.message }, error.status);
    // Never log provider response bodies, which may contain payer information.
    return reply({ error: 'Nao foi possivel reconciliar a notificacao.' }, 503);
  }
}
