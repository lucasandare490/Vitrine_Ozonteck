type SaleState = { status: string; status_pagamento?: string | null };

export function isConfirmedSale(order: SaleState) {
  return order.status_pagamento === 'approved'
    && ['preparando', 'enviado', 'entregue'].includes(order.status);
}

export function needsPaymentReview(order: SaleState) {
  return ['preparando', 'enviado', 'entregue'].includes(order.status)
    && order.status_pagamento !== 'approved';
}
