import { createClient } from '@supabase/supabase-js';
import {
  InvalidWebhookSignatureError,
  MercadoPagoConfig,
  Payment,
  WebhookSignatureValidator,
} from 'mercadopago';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createRateLimitGuard,
  readJsonBody,
  RequestBodyError,
} from '@/lib/server/http';

const webhookSchema = z.object({
  action: z.string().optional(),
  type: z.string().optional(),
  data: z.object({ id: z.union([z.string(), z.number()]) }).optional(),
}).passthrough();

const MAX_WEBHOOK_BODY_BYTES = 32 * 1024;
const paymentIdSchema = z.string().regex(/^\d{1,32}$/);
const checkWebhookRateLimit = createRateLimitGuard({
  limit: 20,
  window: '1 m',
  prefix: 'ratelimit:webhook-mercadopago',
});

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function getSupabaseAdmin() {
  return createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function getPaymentClient() {
  return new Payment(new MercadoPagoConfig({ accessToken: requiredEnv('MP_ACCESS_TOKEN') }));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function hasFreshSignatureTimestamp(signatureHeader: string, toleranceSeconds = 600) {
  const timestampPart = signatureHeader
    .split(',')
    .map((part) => part.trim())
    .find((part) => part.startsWith('ts='));
  const rawTimestamp = timestampPart?.slice(3);
  if (!rawTimestamp || !/^\d+$/.test(rawTimestamp)) return false;

  const parsedTimestamp = Number(rawTimestamp);
  if (!Number.isSafeInteger(parsedTimestamp)) return false;
  const timestampMs = parsedTimestamp < 1_000_000_000_000
    ? parsedTimestamp * 1000
    : parsedTimestamp;

  return Math.abs(Date.now() - timestampMs) <= toleranceSeconds * 1000;
}

export async function POST(request: Request) {
  try {
    const secret = requiredEnv('MP_WEBHOOK_SECRET');
    const signatureHeader = request.headers.get('x-signature');
    const requestId = request.headers.get('x-request-id');

    if (!signatureHeader || !requestId) {
      return NextResponse.json({ error: 'Assinatura ausente.' }, { status: 403 });
    }

    const url = new URL(request.url);
    const rawPaymentId = url.searchParams.get('data.id') || url.searchParams.get('id');
    const parsedPaymentId = paymentIdSchema.safeParse(rawPaymentId);
    if (!parsedPaymentId.success) {
      return NextResponse.json({ error: 'Identificador do pagamento ausente.' }, { status: 400 });
    }
    const queryPaymentId = parsedPaymentId.data;

    if (requestId.length > 200) {
      return NextResponse.json({ error: 'Identificador da requisição inválido.' }, { status: 400 });
    }

    WebhookSignatureValidator.validate({
      xSignature: signatureHeader,
      xRequestId: requestId,
      dataId: queryPaymentId,
      secret,
    });
    if (!hasFreshSignatureTimestamp(signatureHeader)) {
      return NextResponse.json({ error: 'Assinatura expirada.' }, { status: 401 });
    }

    const rateLimitDecision = await checkWebhookRateLimit(queryPaymentId);
    if (rateLimitDecision === 'denied') {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }
    if (rateLimitDecision === 'unavailable') {
      return NextResponse.json({ error: 'Webhook temporarily unavailable' }, { status: 503 });
    }

    let rawBody: unknown;
    try {
      rawBody = await readJsonBody(request, MAX_WEBHOOK_BODY_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    const validation = webhookSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: 'Estrutura do payload inválida.' }, { status: 400 });
    }

    if (validation.data.type && validation.data.type !== 'payment') {
      return NextResponse.json({ success: true, ignored: true }, { status: 200 });
    }

    const bodyPaymentId = validation.data.data?.id;
    if (bodyPaymentId && String(bodyPaymentId) !== queryPaymentId) {
      return NextResponse.json({ error: 'Identificadores de pagamento divergentes.' }, { status: 400 });
    }

    const paymentInfo = await getPaymentClient().get({ id: queryPaymentId });
    if (!paymentInfo.status) {
      throw new Error('O Mercado Pago não retornou o status do pagamento.');
    }

    const checkoutId = paymentInfo.external_reference
      || (typeof paymentInfo.metadata?.checkout_id === 'string' ? paymentInfo.metadata.checkout_id : null);

    const supabaseAdmin = getSupabaseAdmin();
    const { data: processingResult, error: processingError } = await supabaseAdmin.rpc(
      'processar_status_pagamento',
      {
        p_payment_id: queryPaymentId,
        p_payment_status: paymentInfo.status,
        p_checkout_id: checkoutId,
        p_amount: paymentInfo.transaction_amount,
      },
    );

    if (processingError) {
      console.error('Falha ao processar pagamento no banco:', {
        paymentId: queryPaymentId,
        status: paymentInfo.status,
        error: processingError,
      });
      return NextResponse.json({ error: 'Falha ao atualizar o pedido.' }, { status: 500 });
    }

    const result = Array.isArray(processingResult) ? processingResult[0] : processingResult;
    if (result && typeof result === 'object' && 'pedido_encontrado' in result && !result.pedido_encontrado) {
      return NextResponse.json({ error: 'Pedido ainda não encontrado.' }, { status: 409 });
    }

    if (result && typeof result === 'object'
      && 'estoque_disponivel' in result && result.estoque_disponivel === false) {
      console.error('Pagamento aprovado exige revisão manual de estoque:', {
        paymentId: queryPaymentId,
        checkoutId,
      });
      return NextResponse.json({ success: true, requires_review: true }, { status: 200 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof InvalidWebhookSignatureError) {
      return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 401 });
    }
    console.error('Erro crítico processando webhook:', getErrorMessage(error));
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
