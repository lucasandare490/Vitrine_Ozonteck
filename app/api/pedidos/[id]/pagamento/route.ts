import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';
import { requiresSecondFactor } from '@/lib/mfa-policy';
import { createRateLimitGuard } from '@/lib/server/http';

const limit = createRateLimitGuard({ limit: 30, window: '1 m', prefix: 'ratelimit:order-payment' });
const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization' };
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers });
function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error('Missing payment configuration');
  return value;
}

function safePaymentUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && ['mercadopago.com', 'mercadopago.com.br', 'mercadolibre.com', 'mercadolivre.com.br'].some(host => url.hostname === host || url.hostname.endsWith(`.${host}`)) ? url.toString() : null;
  } catch { return null; }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id)) return reply({ error: 'Pedido inválido.' }, 400);
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return reply({ error: 'Entre na sua conta para consultar o pagamento.' }, 401);
    const db = createClient(required('NEXT_PUBLIC_SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: userData, error: userError } = await db.auth.getUser(token);
    if (userError || !userData.user) return reply({ error: 'Sessão expirada.' }, 401);
    const { data: claims, error: claimsError } = await db.auth.getClaims(token);
    if (claimsError || !claims) return reply({ error: 'Sessão inválida.' }, 401);
    if (requiresSecondFactor(userData.user.factors, claims.claims.aal)) return reply({ error: 'Confirme o autenticador para continuar.' }, 403);
    const decision = await limit(userData.user.id);
    if (decision !== 'allowed') return reply({ error: 'Aguarde um momento para consultar novamente.' }, decision === 'denied' ? 429 : 503);
    // Ownership is checked before contacting the provider, including for administrators.
    const { data: order, error } = await db.from('pedidos')
      .select('id,user_id,id_pagamento_mp,checkout_id,status,status_pagamento,valor_total')
      .eq('id', id).eq('user_id', userData.user.id).maybeSingle();
    if (error) return reply({ error: 'Não foi possível consultar o pedido.' }, 503);
    if (!order) return reply({ error: 'Pedido não encontrado.' }, 404);
    if (!order.id_pagamento_mp) return reply({ error: 'O pagamento ainda não está disponível. Tente novamente em instantes.' }, 409);
    const payment = await new Payment(new MercadoPagoConfig({ accessToken: required('MP_ACCESS_TOKEN') })).get({ id: order.id_pagamento_mp });
    const reference = payment.external_reference || payment.metadata?.checkout_id;
    if (String(payment.id) !== String(order.id_pagamento_mp) || !order.checkout_id || reference !== order.checkout_id
      || payment.currency_id !== 'BRL' || !Number.isFinite(payment.transaction_amount)
      || Math.round(Number(payment.transaction_amount) * 100) !== Math.round(Number(order.valor_total) * 100)
      || (process.env.PAYMENT_SANDBOX === 'true' ? payment.live_mode !== false : payment.live_mode !== true)) {
      return reply({ error: 'Não foi possível validar este pagamento. Entre em contato com a loja.' }, 409);
    }
    const expiresAt = payment.date_of_expiration || null;
    const expired = !!expiresAt && Date.parse(expiresAt) <= Date.now();
    const pending = ['pending', 'in_process', 'authorized'].includes(payment.status || '');
    const payable = pending && !expired && !['cancelado', 'cancelled', 'reembolsado'].includes(order.status);
    const transaction = payment.point_of_interaction?.transaction_data;
    const barcode = 'barcode' in payment ? payment.barcode : null;
    const boletoCode = barcode && typeof barcode === 'object' && 'content' in barcode && typeof barcode.content === 'string' ? barcode.content : null;
    return reply({
      orderId: order.id, orderStatus: order.status, status: payment.status,
      amount: Number(order.valor_total), method: payment.payment_method_id, type: payment.payment_type_id,
      expiresAt, expired, payable,
      pixCode: payable && payment.payment_method_id === 'pix' ? transaction?.qr_code || null : null,
      pixImage: payable && payment.payment_method_id === 'pix' ? transaction?.qr_code_base64 || null : null,
      boletoCode: payable && payment.payment_type_id === 'ticket' ? boletoCode : null,
      boletoUrl: payable && payment.payment_type_id === 'ticket' ? safePaymentUrl(payment.transaction_details?.external_resource_url) : null,
    });
  } catch {
    return reply({ error: 'Não foi possível atualizar o pagamento. Tente novamente; não faça outro pedido para pagar este.' }, 503);
  }
}
