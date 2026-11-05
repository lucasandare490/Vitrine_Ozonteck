export type CardMethod = { key: string; id: string; type: 'credit_card' | 'debit_card'; name: string; settings?: { card_number?: { length?: number; validation?: string }; security_code?: { length?: number; mode?: string } }[] };
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' ? value as Record<string, unknown> : {};

export function cardMethods(value: unknown): CardMethod[] {
  const results = record(value).results;
  if (!Array.isArray(results)) return [];
  const seen = new Set<string>();
  return results.flatMap(value => {
    const item = record(value);
    if (typeof item.id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || item.status !== 'active'
      || !['credit_card', 'debit_card'].includes(String(item.payment_type_id))) return [];
    const type = item.payment_type_id as CardMethod['type'];
    const key = `${item.id}:${type}`;
    if (seen.has(key)) return []; seen.add(key);
    return [{ key, id: item.id, type, name: typeof item.name === 'string' ? item.name : item.id,
      settings: Array.isArray(item.settings) ? item.settings as CardMethod['settings'] : undefined }];
  });
}

export type CardInstallment = { installments: number; label: string; issuer: string };
export function cardInstallments(value: unknown, method: Pick<CardMethod, 'id' | 'type'>): CardInstallment[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(value => {
    const item = record(value);
    if (item.payment_method_id !== method.id || item.payment_type_id !== method.type || !Array.isArray(item.payer_costs)) return [];
    const issuer = String(record(item.issuer).id ?? '');
    return item.payer_costs.flatMap(value => {
      const cost = record(value);
      if (!Number.isInteger(cost.installments) || Number(cost.installments) < 1 || Number(cost.installments) > (method.type === 'debit_card' ? 1 : 12)
        || typeof cost.recommended_message !== 'string' || !cost.recommended_message.trim()
        || !Number.isFinite(cost.total_amount) || Number(cost.total_amount) <= 0) return [];
      return [{ installments: Number(cost.installments), label: cost.recommended_message, issuer }];
    });
  });
}
