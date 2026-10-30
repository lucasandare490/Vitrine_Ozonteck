import crypto from 'crypto';
import { requiresSecondFactor } from '@/lib/mfa-policy';
import { createClient } from '@supabase/supabase-js';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { NextResponse } from 'next/server';
import { isRetiredProduct } from '@/lib/catalog-availability';
import { isTestProduct } from '@/lib/products';
import { z } from 'zod';
import {
  createRateLimitGuard,
  getClientIp,
  readJsonBody,
  RequestBodyError,
} from '@/lib/server/http';
import { isValidCpf } from '@/lib/auth';
import { createOrdersPayment, reconcileOrdersPayment, type StoredOrder } from '@/lib/server/orders-provider';

const checkoutSchema = z.object({
  change_id: z.string().uuid().optional(),
  expected_total: z.number().positive().finite(),
  cart_items: z.array(
    z.object({
      code: z.string().trim().min(1, 'Código inválido').max(100),
      quantity: z.number().int().positive().max(100, 'Quantidade excessiva por item'),
    }),
  ).min(1, 'O carrinho não pode estar vazio').max(50, 'Limite excedido'),
  description: z.string().trim().max(500).optional().default('Compra na Vitrine Ozonteck'),
  payment_method_id: z.string().trim().min(1, 'Método de pagamento obrigatório'),
  payment_type_id: z.enum(['credit_card', 'debit_card']).optional(),
  payer: z.object({
    email: z.string().email('E-mail com formato inválido'),
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    identification: z.object({
      type: z.literal('CPF'),
      number: z.string().regex(/^\d{11}$/, 'CPF inválido').refine(isValidCpf, 'CPF inválido'),
    }),
    address: z.object({
      zip_code: z.string().regex(/^\d{8}$/, 'CEP inválido'),
      street_name: z.string().trim().min(1).max(200),
      street_number: z.string().trim().min(1).max(20),
      neighborhood: z.string().trim().min(1).max(100),
      city: z.string().trim().min(1).max(100),
      federal_unit: z.string().trim().regex(/^[A-Za-z]{2}$/),
    }),
  }),
  token: z.string().min(1).optional(),
  installments: z.number().int().min(1).max(24).optional().default(1),
  issuer_id: z.number().int().positive().optional(),
  metadata: z.object({
    phone: z.string().trim().min(10).max(20).refine(value => /^(?:55)?\d{10,11}$/.test(value.replace(/\D/g, '')), 'Telefone inválido'),
    complement: z.string().trim().max(200).optional(),
    delivery_mode: z.enum(['entrega', 'retirada']).optional().default('entrega'),
    user_id: z.string().uuid().optional().nullable(),
  }),
});

type CartItem = z.infer<typeof checkoutSchema>['cart_items'][number];

type OrderItem = {
  code: string;
  nome: string;
  qtd: number;
  preco_unitario: number;
};

const MAX_CHECKOUT_BODY_BYTES = 64 * 1024;
const checkCheckoutRateLimit = createRateLimitGuard({
  limit: 5,
  window: '1 m',
  prefix: 'ratelimit:checkout',
});

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  return value;
}

function getSupabaseAdmin() {
  return createClient(
    requiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function getPaymentClient() {
  return new Payment(new MercadoPagoConfig({ accessToken: requiredEnv('MP_ACCESS_TOKEN') }));
}

function getWebhookUrl() {
  const url = new URL(requiredEnv('MP_WEBHOOK_URL'));
  if (url.pathname === '/') url.pathname = '/api/webhook';
  return url.toString();
}

function consolidateCart(items: CartItem[]) {
  const quantities = new Map<string, number>();

  for (const item of items) {
    const quantity = (quantities.get(item.code) ?? 0) + item.quantity;
    if (quantity > 100) throw new Error(`Quantidade inválida para o produto ${item.code}`);
    quantities.set(item.code, quantity);
  }

  return Array.from(quantities, ([code, quantity]) => ({ code, quantity }));
}

function getItemsSignature(items: unknown) {
  if (!Array.isArray(items)) return '';

  const normalized = items.map((item) => {
    if (!item || typeof item !== 'object') return null;
    const record = item as Record<string, unknown>;
    const code = typeof record.code === 'string' ? record.code : '';
    const quantity = Number(record.qtd ?? record.quantity);
    if (!code || !Number.isInteger(quantity) || quantity <= 0) return null;
    return { code, quantity };
  });

  if (normalized.some((item) => item === null)) return '';
  return JSON.stringify(normalized.sort((a, b) => a!.code.localeCompare(b!.code)));
}

function sanitize(text: string | undefined | null) {
  return text ? String(text).replace(/[<>]/g, '') : '';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const sandbox = process.env.PAYMENT_SANDBOX === 'true';
    if (sandbox && (!process.env.MP_ACCESS_TOKEN?.startsWith('TEST-') || !process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.startsWith('TEST-'))) {
      return NextResponse.json({ error: 'Credenciais de teste não configuradas.' }, { status: 503 });
    }
    const ip = getClientIp(request);
    const rateLimitDecision = await checkCheckoutRateLimit(ip);
    if (rateLimitDecision === 'denied') {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde 1 minuto.' }, { status: 429 });
    }
    if (rateLimitDecision === 'unavailable') {
      return NextResponse.json({ error: 'Checkout temporariamente indisponível.' }, { status: 503 });
    }

    if (!request.headers.get('content-type')?.includes('application/json')) {
      return NextResponse.json({ error: 'Apenas requisições JSON são permitidas.' }, { status: 415 });
    }

    let rawBody: unknown;
    try {
      rawBody = await readJsonBody(request, MAX_CHECKOUT_BODY_BYTES);
    } catch (error) {
      if (error instanceof RequestBodyError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      throw error;
    }

    const validation = checkoutSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: 'Os dados enviados são inválidos.' }, { status: 400 });
    }

    const body = validation.data;
    if (sandbox && (body.cart_items.some(item => item.code !== 'TESTE-001') || !body.token || !['master', 'visa', 'amex', 'elo', 'hipercard'].includes(body.payment_method_id))) {
      return NextResponse.json({ error: 'Ambiente de teste: use somente o produto TESTE-001 e cartão de teste.' }, { status: 400 });
    }
    let cartItems: CartItem[];

    try {
      cartItems = consolidateCart(body.cart_items);
    } catch {
      return NextResponse.json({ error: 'A quantidade solicitada é inválida.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const authorization = request.headers.get('authorization');
    const claimedUserId = body.metadata?.user_id ?? null;
    let verifiedUserId: string | null = null;

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7).trim();
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
      }
      const { data: claimsData, error: claimsError } = await supabaseAdmin.auth.getClaims(token);
      if (claimsError || !claimsData) {
        return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
      }
      if (requiresSecondFactor(data.user.factors, claimsData.claims.aal)) {
        return NextResponse.json({ error: 'Confirme o código do autenticador antes de concluir o pedido.' }, { status: 403 });
      }
      verifiedUserId = data.user.id;
    }

    if (claimedUserId && !verifiedUserId) {
      return NextResponse.json({ error: 'Autenticação obrigatória para vincular o pedido.' }, { status: 401 });
    }

    if (claimedUserId && claimedUserId !== verifiedUserId) {
      return NextResponse.json({ error: 'O pedido não pode ser vinculado a outro usuário.' }, { status: 403 });
    }

    const itemCodes = cartItems.map((item) => item.code);
    const { error: releaseExpiredError } = sandbox ? { error: null } : await supabaseAdmin.rpc('liberar_reservas_expiradas');
    if (releaseExpiredError) {
      console.error('Erro ao liberar reservas vencidas:', releaseExpiredError);
      return NextResponse.json({ error: 'Não foi possível validar o estoque.' }, { status: 500 });
    }

    const { data: products, error: productsError } = await supabaseAdmin
      .from('produtos')
      .select('code, name, category, price, estoque, is_deleted')
      .in('code', itemCodes);

    if (productsError) {
      console.error('Erro ao consultar produtos no checkout:', productsError);
      return NextResponse.json({ error: 'Não foi possível validar os produtos.' }, { status: 500 });
    }

    const productsByCode = new Map((products ?? []).map((product) => [String(product.code), product]));
    const { data: priceSnapshot, error: priceError } = await supabaseAdmin.rpc('resolve_customer_prices', { p_user_id: verifiedUserId });
    if (priceError || !priceSnapshot?.prices) {
      return NextResponse.json({ error: 'Não foi possível confirmar os preços. Nenhum pagamento foi iniciado.' }, { status: 503 });
    }
    const orderItems: OrderItem[] = [];
    let totalInCents = 0;

    for (const cartItem of cartItems) {
      const product = productsByCode.get(cartItem.code);
      const stock = Number(product?.estoque);
      const unitPriceInCents = Math.round(Number(priceSnapshot.prices[cartItem.code]) * 100);

      if (!product || product.is_deleted === true || isRetiredProduct(product) || (isTestProduct(product) && !((sandbox || process.env.LIVE_TEST_PRODUCT === 'TESTE-001') && product.code === 'TESTE-001')) || !Number.isFinite(unitPriceInCents) || unitPriceInCents <= 0) {
        return NextResponse.json({ error: `O produto ${cartItem.code} não está disponível.` }, { status: 400 });
      }

      if (!Number.isInteger(stock) || stock < cartItem.quantity) {
        return NextResponse.json({ error: `Estoque insuficiente para ${product.name}.` }, { status: 409 });
      }

      totalInCents += unitPriceInCents * cartItem.quantity;
      orderItems.push({
        code: cartItem.code,
        nome: String(product.name),
        qtd: cartItem.quantity,
        preco_unitario: unitPriceInCents / 100,
      });
    }

    if (orderItems.length !== cartItems.length || totalInCents <= 0) {
      return NextResponse.json({ error: 'Transação inválida.' }, { status: 400 });
    }

    const idempotencyHeader = request.headers.get('x-idempotency-key')?.trim();
    const attemptKey = idempotencyHeader && /^[A-Za-z0-9_-]{16,120}$/.test(idempotencyHeader)
      ? idempotencyHeader
      : crypto.randomUUID();
    const idempotencyKey = sandbox ? `sandbox-${attemptKey}` : attemptKey;
    const total = totalInCents / 100;
    if (Math.round(body.expected_total * 100) !== totalInCents) {
      return NextResponse.json({ error: 'Os preços ou o benefício mudaram. Revise o total antes de pagar.' }, { status: 409 });
    }
    const address = body.payer.address;
    const deliveryAddress = {
      modalidade: body.metadata.delivery_mode,
      nome: sanitize(`${body.payer.first_name || ''} ${body.payer.last_name || ''}`.trim()),
      telefone: sanitize(body.metadata?.phone || 'Não informado'),
      rua: sanitize(address?.street_name),
      numero: sanitize(address?.street_number),
      complemento: sanitize(body.metadata.complement),
      bairro: sanitize(address?.neighborhood),
      cidade: sanitize(address?.city),
      estado: sanitize(address?.federal_unit),
      cep: sanitize(address?.zip_code),
    };

    const { data: reservationData, error: reservationError } = await supabaseAdmin.rpc(
      'reserve_priced_order',
      {
        p_checkout_id: idempotencyKey,
        p_user_id: verifiedUserId,
        p_total: total,
        p_delivery_address: deliveryAddress,
        p_items: orderItems,
        p_reservation_minutes: 30,
      },
    );

    const reservationValue = Array.isArray(reservationData) ? reservationData[0] : reservationData;
    const order = asRecord(reservationValue);

    if (reservationError || !order || typeof order.id !== 'string') {
      if (reservationError?.message?.includes('PRICE_CHANGED')) {
        return NextResponse.json({ error: 'Os preços mudaram. Revise o total antes de pagar.' }, { status: 409 });
      }
      console.error('O pedido não pôde ser reservado no Supabase:', {
        checkoutId: idempotencyKey,
        error: reservationError,
      });
      const isStockConflict = reservationError?.message?.includes('Estoque insuficiente');
      return NextResponse.json(
        { error: isStockConflict ? 'Um dos produtos ficou sem estoque durante o checkout.' : 'Não foi possível reservar o pedido. O pagamento não foi iniciado.' },
        { status: isStockConflict ? 409 : 500 },
      );
    }

    if ((order.user_id ?? null) !== verifiedUserId) {
      return NextResponse.json({ error: 'Identificador de checkout já utilizado.' }, { status: 409 });
    }

    if (Math.round(Number(order.valor_total) * 100) !== totalInCents
      || getItemsSignature(order.itens) !== getItemsSignature(orderItems)) {
      return NextResponse.json(
        { error: 'Este identificador de checkout pertence a outro carrinho.' },
        { status: 409 },
      );
    }

    if (body.change_id) {
      const { error: changeError } = await supabaseAdmin.rpc('vincular_compra_alterada', { p_change: body.change_id, p_order: order.id, p_user: verifiedUserId });
      if (changeError) return NextResponse.json({ error: 'Esta alteração já foi utilizada ou não pertence à sua conta. Consulte Meus pedidos.' }, { status: 409 });
    }
    if (process.env.NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY && !sandbox) {
      const { data: binding, error: bindingError } = await supabaseAdmin.from('pedido_payment_provider')
        .select('api').eq('pedido_id', order.id).maybeSingle();
      if (bindingError) return NextResponse.json({ error: 'Não foi possível confirmar a configuração do pagamento.' }, { status: 503 });
      if (!binding && !idempotencyKey.startsWith('orders-')) {
        return NextResponse.json({ error: 'Esta tentativa pertence à integração anterior. Consulte Meus pedidos antes de continuar.' }, { status: 409 });
      }
      if (!binding || binding.api === 'orders') {
        const method = body.payment_method_id === 'pix' ? 'pix'
          : ['boleto', 'bolbradesco'].includes(body.payment_method_id) ? 'boleto' : body.payment_type_id;
        if (!method || (method.includes('card') && !body.token)) {
          return NextResponse.json({ error: 'Selecione uma forma de pagamento válida.' }, { status: 400 });
        }
        try {
          const stored = order as StoredOrder;
          const payment = await createOrdersPayment(supabaseAdmin, stored, {
            totalInCents, reference: idempotencyKey, description: sanitize(body.description), method,
            payer: body.payer,
            card: body.token ? { id: body.payment_method_id, token: body.token, installments: body.installments } : undefined,
          });
          const reconciled = await reconcileOrdersPayment(supabaseAdmin, stored, payment);
          if (reconciled.estoque_disponivel === false) {
            return NextResponse.json({ id: payment.id, order_id: order.id,
              error: 'Pagamento recebido, mas a loja precisa revisar o estoque. Consulte Meus pedidos; não pague novamente.' }, { status: 409 });
          }
          return NextResponse.json({ id: payment.id, order_id: order.id, total,
            status: payment.status, status_detail: payment.statusDetail });
        } catch {
          // Preserve the attempt: a timeout does not prove the charge was not created.
          return NextResponse.json({ error: 'Não foi possível confirmar o pagamento agora. Aguarde e tente novamente nesta compra.',
            order_id: order.id, retry_same_attempt: true }, { status: 503 });
        }
      }
      // Never submit a token generated by the new application to the legacy account.
      return NextResponse.json({ error: 'Esta compra começou na integração anterior. Abra Meus pedidos para consultar ou alterar o pagamento.' }, { status: 409 });
    }
    const paymentClient = getPaymentClient();
    let response: Awaited<ReturnType<Payment['get']>>;

    try {
      response = typeof order.id_pagamento_mp === 'string' && order.id_pagamento_mp
        ? await paymentClient.get({ id: order.id_pagamento_mp })
        : await paymentClient.create({
            body: {
              transaction_amount: total,
              description: sanitize(body.description),
              payment_method_id: body.payment_method_id,
              payer: body.payer,
              token: body.token,
              installments: body.installments,
              issuer_id: body.issuer_id,
              notification_url: getWebhookUrl(),
              external_reference: idempotencyKey,
              metadata: {
                checkout_id: idempotencyKey,
                user_id: verifiedUserId,
                phone: sanitize(body.metadata?.phone),
              },
            },
            requestOptions: { idempotencyKey },
          });
    } catch (paymentError) {
      // Uma falha de rede pode acontecer depois de o Mercado Pago criar a
      // cobranca. A reserva expira sozinha e permanece disponivel ao webhook.
      console.error('Falha ao criar ou consultar pagamento; reserva mantida para reconciliacao:', {
        checkoutId: idempotencyKey,
        error: getErrorMessage(paymentError),
      });
      throw paymentError;
    }

    if (!response.id || !response.status) {
      throw new Error('O Mercado Pago não retornou os dados completos do pagamento.');
    }

    if (sandbox && response.live_mode !== false) {
      throw new Error('Resposta incompatível com ambiente de teste.');
    }

    const { data: processingResult, error: processingError } = await supabaseAdmin.rpc(
      'processar_status_pagamento',
      {
        p_payment_id: String(response.id),
        p_payment_status: response.status,
        p_checkout_id: idempotencyKey,
        p_amount: response.transaction_amount ?? total,
      },
    );

    if (processingError) {
      console.error('Pagamento criado, mas o pedido não pôde ser confirmado:', {
        paymentId: response.id,
        checkoutId: idempotencyKey,
        error: processingError,
      });
      return NextResponse.json(
        { error: 'Pagamento processado, mas houve uma falha ao confirmar o pedido. Contate o suporte.', id: response.id },
        { status: 500 },
      );
    }

    const processedOrder = Array.isArray(processingResult) ? processingResult[0] : processingResult;
    if (processedOrder && typeof processedOrder === 'object'
      && 'pedido_encontrado' in processedOrder && !processedOrder.pedido_encontrado) {
      return NextResponse.json(
        { error: 'Pagamento processado, mas o pedido não foi localizado. Contate o suporte.', id: response.id },
        { status: 500 },
      );
    }

    if (processedOrder && typeof processedOrder === 'object'
      && 'estoque_disponivel' in processedOrder && processedOrder.estoque_disponivel === false) {
      return NextResponse.json(
        { error: 'Pagamento aprovado, mas o pedido precisa de revisão de estoque. Contate o suporte.', id: response.id },
        { status: 409 },
      );
    }

    return NextResponse.json({
      id: response.id,
      order_id: order.id,
      total,
      status: response.status,
      status_detail: response.status_detail,
      point_of_interaction: response.point_of_interaction,
    });
  } catch (error: unknown) {
    console.error('Erro crítico na API de checkout:', getErrorMessage(error));
    return NextResponse.json({ error: 'Falha interna ao processar o pagamento.' }, { status: 500 });
  }
}
