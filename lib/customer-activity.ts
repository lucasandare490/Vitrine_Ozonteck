import { isConfirmedSale } from './confirmed-sale.ts';
export type CustomerPurchase = { user_id: string | null; created_at: string; status: string; status_pagamento?: string | null; valor_total: number | string };
export type CustomerActivity = { orders: number; total: number; lastPurchase: string; daysSincePurchase: number };

export function customerActivity(purchases: CustomerPurchase[], now = new Date()) {
  const result = new Map<string, CustomerActivity>();
  for (const purchase of purchases) {
    const time = Date.parse(purchase.created_at);
    const amount = Number(purchase.valor_total);
    if (!purchase.user_id || !isConfirmedSale(purchase)
      || !Number.isFinite(time) || !Number.isFinite(amount) || amount < 0 || time > now.getTime()) continue;
    const current = result.get(purchase.user_id) || { orders: 0, total: 0, lastPurchase: purchase.created_at, daysSincePurchase: 0 };
    current.orders++;
    current.total = Math.round((current.total + amount) * 100) / 100;
    if (time > Date.parse(current.lastPurchase)) current.lastPurchase = purchase.created_at;
    current.daysSincePurchase = Math.floor((now.getTime() - Date.parse(current.lastPurchase)) / 86400000);
    result.set(purchase.user_id, current);
  }
  return result;
}

export function customerContactMessage(name: string | null) {
  const firstName = name?.trim().split(/\s+/)[0];
  return `Olá${firstName ? `, ${firstName}` : ''}! Aqui é da Ozonteck Recife. Como você está? Se precisar de ajuda para escolher um produto ou fazer uma nova compra, estamos à disposição. Você pode ver a loja em https://ozonteck-recife.netlify.app/. Se preferir não receber esse tipo de contato, é só nos avisar.`;
}
