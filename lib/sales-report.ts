export type ReportOrder = {
  id: string; user_id: string | null; status: string; valor_total: number;
  created_at: string;
  endereco_entrega: { nome?: string } | null;
  itens: { code?: string; nome: string; qtd: number; preco_unitario?: number }[] | null;
};

export function saleDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function buildSalesReport(orders: ReportOrder[], from: string, to: string) {
  const paid = orders.filter(order => ['preparando', 'enviado', 'entregue'].includes(order.status)
    && Number.isFinite(Number(order.valor_total)) && Number(order.valor_total) >= 0
    && saleDate(order.created_at) >= from && saleDate(order.created_at) <= to);
  const totalCents = paid.reduce((sum, order) => sum + Math.round(Number(order.valor_total) * 100), 0);
  const products = new Map<string, { name: string; quantity: number }>();
  const customers = new Map<string, { id: string; name: string; orders: number; total: number }>();
  for (const order of paid) {
    for (const item of Array.isArray(order.itens) ? order.itens : []) {
      if (!Number.isInteger(item.qtd) || item.qtd <= 0) continue;
      const key = item.code || item.nome;
      const product = products.get(key) || { name: item.nome, quantity: 0 };
      product.quantity += item.qtd;
      products.set(key, product);
    }
    // Never merge unrelated customers by their display name.
    const key = order.user_id || order.id;
    const customer = customers.get(key) || { id: key, name: order.endereco_entrega?.nome || 'Cliente não identificado', orders: 0, total: 0 };
    customer.orders++;
    customer.total += Math.round(Number(order.valor_total) * 100);
    customers.set(key, customer);
  }
  return {
    orders: paid, total: totalCents / 100,
    average: paid.length ? totalCents / paid.length / 100 : 0,
    returning: [...customers.values()].filter(customer => customer.orders > 1).length,
    products: [...products.entries()].map(([id, product]) => ({ id, ...product })).sort((a, b) => b.quantity - a.quantity),
    customers: [...customers.values()].map(customer => ({ ...customer, total: customer.total / 100 })).sort((a, b) => b.total - a.total),
  };
}

export function reportCsv(orders: ReportOrder[]) {
  const cell = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return '\uFEFF' + [['Pedido', 'Data (Recife)', 'Cliente', 'Situação', 'Total (R$)'],
    ...orders.map(order => [order.id, saleDate(order.created_at), order.endereco_entrega?.nome || '', order.status, Number(order.valor_total).toFixed(2).replace('.', ',')])]
    .map(row => row.map(cell).join(';')).join('\r\n');
}
