export function isOpenPayment(status: string) {
  return ['pending', 'aguardando_pagamento', 'in_process', 'authorized', 'falha_pagamento', 'pagamento_recusado'].includes(status);
}

export function getOrderStatus(status: string) {
  const labels: Record<string, string> = {
    pending: 'Aguardando pagamento', preparando: 'Preparando', enviado: 'Em rota',
    entregue: 'Entregue', pagamento_recusado: 'Pagamento recusado',
    revisao_pagamento: 'Pagamento em revisão', revisao_estoque: 'Estoque em revisão',
    cancelado: 'Cancelado', cancelled: 'Cancelado', reembolsado: 'Reembolsado',
  };
  return {
    label: labels[status] ?? 'Em acompanhamento',
    paid: ['preparando', 'enviado', 'entregue'].includes(status),
    stage: status === 'entregue' ? 3 : status === 'enviado' ? 2 : status === 'preparando' ? 1 : 0,
  };
}
