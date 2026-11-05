type SaleState = { status: string; status_pagamento?: string | null };

export function isConfirmedSale(order: SaleState) {
  return order.status_pagamento === 'approved'
    && ['preparando', 'enviado', 'entregue'].includes(order.status);
}

export function needsPaymentReview(order: SaleState) {
  return ['preparando', 'enviado', 'entregue'].includes(order.status)
    && order.status_pagamento !== 'approved';
}

export function matchesAuditFilter(order: SaleState, filter: string) {
  if (filter === 'Todos') return isConfirmedSale(order);
  if (filter === 'historico') return true;
  if (filter === 'revisao') return needsPaymentReview(order) || ['revisao_pagamento', 'revisao_estoque'].includes(order.status);
  if (filter === 'abertos') return ['pending', 'aguardando_pagamento', 'in_process', 'authorized', 'falha_pagamento', 'pagamento_recusado'].includes(order.status);
  return order.status === filter.toLowerCase();
}

export function matchesAccountOrderFilter(order: SaleState, filter: string) {
  if (filter === 'historico') return true;
  if (filter === 'pagamentos') return matchesAuditFilter(order, 'abertos');
  return isConfirmedSale(order) && (filter === 'Todos' || order.status === filter);
}
