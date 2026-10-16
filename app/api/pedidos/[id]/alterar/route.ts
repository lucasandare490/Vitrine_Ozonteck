import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requiresSecondFactor } from '@/lib/mfa-policy';
import { createRateLimitGuard, readJsonBody } from '@/lib/server/http';

const limit = createRateLimitGuard({ limit: 5, window: '1 m', prefix: 'order-change' });
const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return reply({ error: 'Compra inválida.' }, 400);
    const input = z.object({ reason: z.enum(['pagamento', 'endereco', 'dados']) }).strict().safeParse(await readJsonBody(request, 1024));
    if (!input.success) return reply({ error: 'Alteração inválida.' }, 400);
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return reply({ error: 'Entre na sua conta.' }, 401);
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await db.auth.getUser(token);
    if (authError || !user) return reply({ error: 'Sessão inválida.' }, 401);
    const { data: claims, error: claimsError } = await db.auth.getClaims(token);
    if (claimsError || !claims || requiresSecondFactor(user.factors, claims.claims.aal)) return reply({ error: 'Confirme sua sessão no autenticador.' }, 403);
    if (await limit(user.id) !== 'allowed') return reply({ error: 'Aguarde antes de tentar novamente.' }, 429);
    // Check migration availability before any external cancellation.
    const { error: schemaError } = await db.from('pedido_alteracoes').select('id').limit(0);
    if (schemaError) return reply({ error: 'Alterações ainda não estão habilitadas no banco. Nenhuma cobrança foi cancelada.' }, 503);
    const { data: order, error } = await db.from('pedidos').select('id,user_id,id_pagamento_mp,checkout_id,status,valor_total').eq('id', id).eq('user_id', user.id).maybeSingle();
    if (error || !order) return reply({ error: 'Compra não encontrada.' }, 404);
    if (!order.id_pagamento_mp || !['pending', 'falha_pagamento', 'pagamento_recusado', 'cancelado', 'cancelled'].includes(order.status)) return reply({ error: 'Esta compra não pode mais ser alterada. Consulte a loja.' }, 409);
    const client = new Payment(new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! }));
    let payment = await client.get({ id: order.id_pagamento_mp });
    if (String(payment.id) !== String(order.id_pagamento_mp) || payment.external_reference !== order.checkout_id || payment.currency_id !== 'BRL'
      || Math.round(Number(payment.transaction_amount) * 100) !== Math.round(Number(order.valor_total) * 100)
      || payment.live_mode !== (process.env.PAYMENT_SANDBOX !== 'true')) return reply({ error: 'Não foi possível validar a cobrança.' }, 409);
    if (!['pending', 'in_process', 'authorized', 'cancelled', 'rejected'].includes(payment.status || '')) return reply({ error: 'O pagamento já foi processado. Não criaremos outra cobrança.' }, 409);
    if (!['cancelled', 'rejected'].includes(payment.status!)) {
      await client.cancel({ id: order.id_pagamento_mp });
      payment = await client.get({ id: order.id_pagamento_mp });
    }
    if (!['cancelled', 'rejected'].includes(payment.status || '')) return reply({ error: 'Cancelamento ainda não confirmado. Não pague novamente; atualize a compra.' }, 409);
    const { data, error: saveError } = await db.rpc('reabrir_compra_cancelada', { p_order: id, p_user: user.id, p_payment: String(payment.id), p_reason: input.data.reason });
    if (saveError) return reply({ error: 'Cobrança cancelada, mas a reabertura não foi salva. Tente novamente nesta mesma compra.' }, 503);
    return reply({ change: data });
  } catch {
    return reply({ error: 'Não foi possível concluir a alteração. Consulte o pagamento e tente novamente nesta compra.' }, 503);
  }
}
