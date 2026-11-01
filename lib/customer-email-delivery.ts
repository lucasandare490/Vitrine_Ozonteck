import type { CustomerEmailEvent } from './customer-email.ts';

export type EmailOrder = { status: string; status_pagamento: string; user_id: string };

/** Suppress obsolete messages when settlement or fulfilment overtakes the queue. */
export function shouldDeliverOrderEmail(event: CustomerEmailEvent, order: EmailOrder) {
  const paid = order.status_pagamento === 'approved';
  switch (event) {
    case 'payment_pending': return order.status === 'pending' && ['pending','in_process','authorized'].includes(order.status_pagamento);
    case 'payment_approved': return paid && ['preparando','enviado','entregue'].includes(order.status);
    case 'payment_rejected': return order.status_pagamento === 'rejected' && order.status === 'pagamento_recusado';
    case 'order_shipped': return paid && order.status === 'enviado';
    case 'order_delivered': return paid && order.status === 'entregue';
    case 'order_cancelled': return ['cancelado','cancelled'].includes(order.status);
    case 'refund_confirmed': return order.status_pagamento === 'refunded' && order.status === 'reembolsado';
    case 'order_changed': return !['cancelado','cancelled'].includes(order.status);
    default: return false;
  }
}

export function emailRetry(attempt: number, now = Date.now()) {
  return {
    state: attempt >= 5 ? 'failed' : 'pending',
    available_at: new Date(now + Math.min(1440, 5 * 2 ** Math.max(0, attempt - 1)) * 60_000).toISOString(),
    lease: null,
    locked_until: null,
  };
}
