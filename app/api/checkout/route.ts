import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// --- 1. SISTEMA DE RATE LIMIT EM MEMÓRIA (ANTI-DOS) ---
// Registra os IPs e a quantidade de acessos
const rateLimit = new Map<string, { count: number, lastReset: number }>();

function checkRateLimit(ip: string) {
  const LIMIT = 5; // Máximo de 5 tentativas de checkout
  const WINDOW_MS = 60 * 1000; // Dentro de 1 minuto (60.000 ms)
  const now = Date.now();
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, lastReset: now });
    return true;
  }
  
  const record = rateLimit.get(ip)!;
  if (now - record.lastReset > WINDOW_MS) {
    // Se já passou 1 minuto, zera a contagem
    record.count = 1;
    record.lastReset = now;
    return true;
  }
  
  if (record.count >= LIMIT) {
    return false; // Bloqueia o acesso
  }
  
  record.count += 1;
  return true;
}

// --- 2. DEFINIÇÃO DO SCHEMA DE SEGURANÇA (ZOD) ---
const checkoutSchema = z.object({
  cart_items: z.array(
    z.object({
      code: z.string().min(1, "Código inválido"),
      quantity: z.number().int().positive().max(100, "Quantidade excessiva por item")
    })
  )
  .min(1, "O carrinho não pode estar vazio")
  .max(50, "Limite de segurança: máximo de 50 itens diferentes excedido"),

  description: z.string().max(500, "Descrição muito longa").optional().default('Compra na Vitrine Ozonteck'),
  payment_method_id: z.string().min(1, "Método de pagamento obrigatório"),

  payer: z.object({
    email: z.string().email("E-mail com formato inválido"),
    first_name: z.string().max(100).optional(),
    last_name: z.string().max(100).optional(),
    identification: z.object({
      type: z.string().optional(),
      number: z.string().max(50).optional()
    }).optional(),
    address: z.object({
      zip_code: z.string().max(20).optional(),
      street_name: z.string().max(200).optional(),
      street_number: z.string().max(20).optional(),
      neighborhood: z.string().max(100).optional(),
      city: z.string().max(100).optional(),
      federal_unit: z.string().max(2).optional(),
    }).optional()
  }),

  token: z.string().optional(),
  installments: z.number().int().min(1).max(24).optional().default(1),
  issuer_id: z.number().optional(), // Garantindo que o TypeScript aceite como número
  metadata: z.object({
    phone: z.string().max(20).optional()
  }).optional()
});

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN as string 
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Sanitização como uma segunda camada de defesa para o banco
const sanitize = (text: string | undefined | null) => {
  if (!text) return '';
  return String(text).replace(/[<>]/g, '');
};

export async function POST(request: Request) {
  try {
    // --- 3. TRAVA DE RATE LIMITING ---
    // Pega o IP do cliente (mesmo se estiver atrás de proxies ou túneis)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'ip-desconhecido';
    
    if (!checkRateLimit(ip)) {
      console.warn(`🚨 Bloqueio de segurança: Muitos acessos do IP ${ip}`);
      return NextResponse.json(
        { error: 'Muitas tentativas em pouco tempo. Por favor, aguarde 1 minuto.' }, 
        { status: 429 } // 429 = Too Many Requests
      );
    }

    // --- 4. TRAVA DE CONTENT-TYPE ---
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Apenas requisições JSON são permitidas.' }, { status: 415 });
    }

    const rawBody = await request.json();
    
    // --- 5. VALIDAÇÃO ZOD ---
    const validation = checkoutSchema.safeParse(rawBody);

    if (!validation.success) {
      console.error("🚨 Ataque interceptado: Dados rejeitados pelo Zod.");
      return NextResponse.json(
        { error: 'Os dados enviados são inválidos, corrompidos ou excedem os limites permitidos.' }, 
        { status: 400 }
      );
    }

    const body = validation.data; 

    const itemCodes = body.cart_items.map((i) => i.code);
    
    // --- 6. FONTE DA VERDADE (BANCO DE DADOS) ---
    const { data: produtosBanco, error } = await supabaseAdmin
      .from('produtos')
      .select('code, price')
      .in('code', itemCodes);

    if (error || !produtosBanco || produtosBanco.length === 0) {
      return NextResponse.json({ error: 'Produtos inválidos ou não encontrados.' }, { status: 400 });
    }

    let custoRealCalculado = 0;
    
    body.cart_items.forEach((itemDaTela) => {
      const produtoOficial = produtosBanco.find((p) => p.code === itemDaTela.code);
      if (produtoOficial) {
        custoRealCalculado += (Number(produtoOficial.price) * Number(itemDaTela.quantity));
      }
    });
    
    custoRealCalculado = Number(custoRealCalculado.toFixed(2));

    if (custoRealCalculado <= 0) {
      console.error(`🔴 TENTATIVA DE FRAUDE: Valor final zerado ou negativo.`);
      return NextResponse.json({ error: 'Transação inválida.' }, { status: 400 });
    }

    const payment = new Payment(client);
    
    const response = await payment.create({
      body: {
        transaction_amount: custoRealCalculado, 
        description: sanitize(body.description),
        payment_method_id: body.payment_method_id,
        payer: body.payer,
        token: body.token,
        installments: body.installments,
        issuer_id: body.issuer_id ? Number(body.issuer_id) : undefined,        notification_url: process.env.MP_WEBHOOK_URL as string,
        metadata: body.metadata 
      }
    });

    const endereco = body.payer.address;
    const enderecoFormatado = endereco ? `${endereco.street_name}, ${endereco.street_number} - ${endereco.neighborhood}, ${endereco.city}/${endereco.federal_unit} - CEP: ${endereco.zip_code}` : 'Endereço não informado';

    // --- 7. SANITIZAÇÃO NO BANCO DE DADOS ---
    const { error: dbError } = await supabaseAdmin.from('pedidos').insert([
      {
        nome_cliente: sanitize(`${body.payer.first_name || ''} ${body.payer.last_name || ''}`.trim()),
        telefone_cliente: sanitize(body.metadata?.phone || 'Não informado'),
        endereco_completo: sanitize(enderecoFormatado),
        produtos_resumo: sanitize(body.description),
        valor_total: custoRealCalculado,
        status_pagamento: response.status,
        id_pagamento_mp: String(response.id)
      }
    ]);

    if (dbError) {
      console.error('Erro ao salvar pedido no Supabase:', dbError);
    }

    return NextResponse.json({
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      point_of_interaction: response.point_of_interaction, 
    });

  } catch (error: any) {
    console.error('Erro Crítico na API Checkout:', error);
    return NextResponse.json(
      { error: 'Falha interna ao processar o pagamento. Tente novamente.' }, 
      { status: 500 }
    );
  }
}