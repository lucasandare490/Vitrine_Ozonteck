import type { Order } from 'mercadopago';

// Caller must validate binding/reference/amount against raw and recoveredId.
// Kept independent of production credentials so sandbox can exercise this path.
export async function createOrderResponse(
  client: Pick<Order, 'create' | 'get'>,
  body: Parameters<Order['create']>[0]['body'],
  reference: string,
) {
  try {
    return { raw: await client.create({ body, requestOptions: { idempotencyKey: reference } }), recoveredId: undefined };
  } catch (error) {
    // A 402 may carry a declined order. Never settle from its error-body status.
    const data = error && typeof error === 'object' && 'data' in error ? error.data : null;
    const id = data && typeof data === 'object' && 'id' in data ? data.id : null;
    if (typeof id !== 'string' || !/^ORD[A-Za-z0-9]+$/.test(id)) throw error;
    return { raw: await client.get({ id }), recoveredId: id };
  }
}
