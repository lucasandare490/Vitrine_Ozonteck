import type { Order } from 'mercadopago';

type SdkOrderRequest = Parameters<Order['create']>[0]['body'];
// The published SDK types lag the documented Orders 3DS configuration.
type OrderRequest = SdkOrderRequest & {
  config?: NonNullable<SdkOrderRequest['config']> & {
    online?: NonNullable<NonNullable<SdkOrderRequest['config']>['online']> & {
      transaction_security?: { validation: 'on_fraud_risk'; liability_shift: 'required' };
    };
  };
};
type OrderResponse = Omit<Awaited<ReturnType<Order['get']>>, 'api_response'>;

export type OrdersCheckoutInput = {
  totalInCents: number;
  reference: string;
  description: string;
  method: 'pix' | 'boleto' | 'credit_card' | 'debit_card';
  card?: { id: string; token: string; installments: number };
  payer: {
    email: string;
    first_name: string;
    last_name: string;
    identification: { type: 'CPF'; number: string };
    address: {
      zip_code: string;
      street_name: string;
      street_number: string;
      neighborhood: string;
      city: string;
      federal_unit: string;
    };
  };
};

export type OrdersIdentity = {
  id?: string;
  reference: string;
  totalInCents: number;
  accountId: string;
  applicationId: string;
};

export type NormalizedOrderStatus = 'pending' | 'authorized' | 'approved' | 'in_process'
  | 'rejected' | 'cancelled' | 'refunded' | 'in_mediation' | 'charged_back';

function positiveCents(value: number) {
  if (!Number.isSafeInteger(value) || value <= 0) throw new Error('INVALID_ORDER_AMOUNT');
  return value;
}

function decimalCents(value: unknown) {
  if (typeof value !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(value)) {
    throw new Error('INVALID_PROVIDER_AMOUNT');
  }
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) throw new Error('INVALID_PROVIDER_AMOUNT');
  return cents;
}

// Pure conversion only. Activation requires persisted account/API binding first.
export function buildOrdersRequest(input: OrdersCheckoutInput): OrderRequest {
  const amount = (positiveCents(input.totalInCents) / 100).toFixed(2);
  if (!/^[A-Za-z0-9_-]{16,120}$/.test(input.reference)) throw new Error('INVALID_ORDER_REFERENCE');
  const { federal_unit, ...address } = input.payer.address;
  if (!/^[A-Za-z]{2}$/.test(federal_unit)) throw new Error('INVALID_PAYER_STATE');
  let paymentMethod: NonNullable<NonNullable<OrderRequest['transactions']>['payments']>[number]['payment_method'];
  if (input.method === 'pix' || input.method === 'boleto') {
    paymentMethod = { id: input.method, type: input.method === 'pix' ? 'bank_transfer' : 'ticket' };
  } else if (input.method === 'credit_card' || input.method === 'debit_card') {
    const card = input.card;
    if (!card?.id || !card.token || !Number.isInteger(card.installments)
      || card.installments < 1 || card.installments > 12
      || (input.method === 'debit_card' && card.installments !== 1)) {
      throw new Error('INVALID_CARD_PAYMENT');
    }
    paymentMethod = { id: card.id, type: input.method, token: card.token, installments: card.installments };
  } else {
    throw new Error('UNSUPPORTED_PAYMENT_METHOD');
  }
  return {
    type: 'online',
    processing_mode: 'automatic',
    external_reference: input.reference,
    total_amount: amount,
    description: input.description,
    ...(input.card ? { config: { online: { transaction_security: { validation: 'on_fraud_risk', liability_shift: 'required' } } } } : {}),
    payer: { ...input.payer, address: { ...address, state: federal_unit.toUpperCase() } },
    transactions: { payments: [{ amount, payment_method: paymentMethod }] },
  };
}

export function normalizeOrdersStatus(status: string | undefined, detail: string | undefined): NormalizedOrderStatus {
  switch (status) {
    case 'created': return 'pending';
    case 'processed': return 'approved';
    case 'processing': return 'in_process';
    case 'action_required': return detail === 'waiting_capture' ? 'authorized' : 'pending';
    case 'failed': return 'rejected';
    case 'canceled': return 'cancelled';
    case 'refunded': return 'refunded';
    case 'charged_back': return detail === 'in_process' ? 'in_mediation' : 'charged_back';
    default: throw new Error('UNSUPPORTED_ORDER_STATUS');
  }
}

function safeTicketUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const roots = ['mercadopago.com', 'mercadopago.com.br', 'mercadolibre.com', 'mercadolivre.com.br'];
    if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) return null;
    return roots.some(root => url.hostname === root || url.hostname.endsWith(`.${root}`)) ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizeOrdersResponse(order: OrderResponse, expected: OrdersIdentity) {
  if (!order.id || !/^ORD[A-Za-z0-9]+$/.test(order.id) || (expected.id && order.id !== expected.id)
    || order.type !== 'online' || order.external_reference !== expected.reference
    || !expected.accountId || order.user_id !== expected.accountId
    || !expected.applicationId || order.integration_data?.application_id !== expected.applicationId
    || order.country_code !== 'BRA' || (order.currency && order.currency !== 'BRL')
    || decimalCents(order.total_amount) !== positiveCents(expected.totalInCents)) {
    throw new Error('ORDER_IDENTITY_MISMATCH');
  }
  const payments = order.transactions?.payments ?? [];
  // The shop creates exactly one transaction, never a split payment.
  if (payments.length > 1) throw new Error('UNSUPPORTED_MULTIPLE_PAYMENTS');
  const transaction = payments[0];
  if (transaction && decimalCents(transaction.amount) !== expected.totalInCents) {
    throw new Error('PAYMENT_AMOUNT_MISMATCH');
  }
  const status = normalizeOrdersStatus(order.status, order.status_detail);
  if (status === 'approved' && (!transaction || decimalCents(order.total_paid_amount) !== expected.totalInCents)) {
    throw new Error('ORDER_NOT_FULLY_PAID');
  }
  const method = transaction?.payment_method;
  const rawExpiry = transaction?.date_of_expiration;
  const expiresAt = rawExpiry && Number.isFinite(Date.parse(rawExpiry)) ? new Date(rawExpiry).toISOString() : null;
  return {
    id: order.id,
    reference: order.external_reference,
    status,
    statusDetail: order.status_detail ?? null,
    amount: expected.totalInCents / 100,
    method: method?.id ?? null,
    type: method?.type ?? null,
    expiresAt,
    pixCode: method?.type === 'bank_transfer' && method.id === 'pix' ? method.qr_code ?? null : null,
    pixImage: method?.type === 'bank_transfer' && method.id === 'pix' ? method.qr_code_base64 ?? null : null,
    boletoCode: method?.type === 'ticket' ? method.digitable_line ?? method.barcode_content ?? null : null,
    boletoUrl: method?.type === 'ticket' ? safeTicketUrl(method.ticket_url) : null,
    // A challenge must be handled by the frontend, never interpreted as approval.
    requiresAuthentication: method?.transaction_security?.status === 'pending',
    authenticationUrl: order.status_detail === 'pending_challenge' ? safeTicketUrl(method?.transaction_security?.url) : null,
    partiallyRefunded: order.status_detail === 'partially_refunded',
  };
}
