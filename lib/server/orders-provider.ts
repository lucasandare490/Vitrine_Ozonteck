import { MercadoPagoConfig, Order } from 'mercadopago';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildOrdersRequest, normalizeOrdersResponse, type OrdersCheckoutInput } from './mercado-pago-orders';

export type StoredOrder = {
  id: string; checkout_id: string; valor_total: number | string;
  id_pagamento_mp?: string | null;
};

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing configuration: ${name}`);
  return value;
}

export function ordersConfig() {
  if (process.env.PAYMENT_SANDBOX === 'true') throw new Error('ORDERS_REQUIRES_PRODUCTION_CONFIGURATION');
  return {
    accountId: required('MP_ORDERS_ACCOUNT_ID'),
    applicationId: required('MP_ORDERS_APPLICATION_ID'),
    accessToken: required('MP_ORDERS_ACCESS_TOKEN'),
  };
}

export function ordersClient() {
  return new Order(new MercadoPagoConfig({ accessToken: ordersConfig().accessToken, options: { timeout: 15000 } }));
}

export async function validateOrdersBinding(db: SupabaseClient, order: StoredOrder) {
  const config = ordersConfig();
  const { data, error } = await db.from('pedido_payment_provider').select('api,profile,account_id,application_id,environment').eq('pedido_id', order.id).single();
  if (error || data.api !== 'orders' || data.profile !== 'ozonlife' || data.environment !== 'production'
    || data.account_id !== config.accountId || data.application_id !== config.applicationId) {
    throw new Error('PAYMENT_PROVIDER_BINDING_MISMATCH');
  }
  return { accountId: config.accountId, applicationId: config.applicationId,
    reference: order.checkout_id, totalInCents: Math.round(Number(order.valor_total) * 100) };
}

export async function readOrdersPayment(db: SupabaseClient, order: StoredOrder) {
  const identity = await validateOrdersBinding(db, order);
  if (!order.id_pagamento_mp || !/^ORD[A-Za-z0-9]+$/.test(order.id_pagamento_mp)) throw new Error('INVALID_ORDER_PAYMENT_ID');
  const raw = await ordersClient().get({ id: order.id_pagamento_mp });
  return normalizeOrdersResponse(raw, { ...identity, id: order.id_pagamento_mp });
}

export async function createOrdersPayment(db: SupabaseClient, order: StoredOrder, input: OrdersCheckoutInput) {
  // Validate the request before storing a binding or making an external call.
  const body = buildOrdersRequest(input);
  const config = ordersConfig();
  const { error } = await db.rpc('bind_order_payment_provider', {
    p_order: order.id, p_account: config.accountId, p_application: config.applicationId,
  });
  if (error) throw new Error('PAYMENT_BINDING_UNAVAILABLE');
  const identity = await validateOrdersBinding(db, order);
  if (order.id_pagamento_mp) return readOrdersPayment(db, order);
  const raw = await ordersClient().create({ body, requestOptions: { idempotencyKey: order.checkout_id } });
  return normalizeOrdersResponse(raw, identity);
}

export async function reconcileOrdersPayment(db: SupabaseClient, order: StoredOrder, payment: Awaited<ReturnType<typeof readOrdersPayment>>) {
  if (payment.partiallyRefunded) throw new Error('PARTIAL_REFUND_REQUIRES_REVIEW');
  const { data, error } = await db.rpc('processar_status_pagamento', {
    p_payment_id: payment.id, p_payment_status: payment.status,
    p_checkout_id: order.checkout_id, p_amount: payment.amount,
  });
  const result = Array.isArray(data) ? data[0] : data;
  if (error || !result?.pedido_encontrado || result.valor_valido === false) throw new Error('PAYMENT_RECONCILIATION_FAILED');
  return result;
}

export async function cancelOrdersPayment(db: SupabaseClient, order: StoredOrder) {
  let payment = await readOrdersPayment(db, order);
  if (!['pending', 'in_process', 'authorized', 'cancelled', 'rejected'].includes(payment.status)) {
    throw new Error('PAYMENT_ALREADY_PROCESSED');
  }
  if (!['cancelled', 'rejected'].includes(payment.status)) {
    await ordersClient().cancel({ id: payment.id, requestOptions: { idempotencyKey: `cancel-${order.id}` } });
    payment = await readOrdersPayment(db, order);
  }
  if (!['cancelled', 'rejected'].includes(payment.status)) throw new Error('CANCELLATION_NOT_CONFIRMED');
  return payment;
}
