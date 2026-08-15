import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { z } from 'zod';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// --- 1. RATE LIMIT DO WEBHOOK (Evita DDoS contra a rota de pagamentos) ---
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Limite maior aqui: 20 requisições por minuto, porque o MP pode mandar várias atualizações rápidas
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true, 
});

// --- 2. ZOD SCHEMA PARA O WEBHOOK ---
// O Mercado Pago manda estruturas diferentes dependendo do evento, então validamos o básico
const webhookSchema = z.object({
  action: z.string().optional(),
  type: z.string().optional(),
  data: z.object({
    id: z.string().or(z.number())
  }).optional(),
}).passthrough(); // passthrough permite que outros campos não mapeados passem sem dar erro

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN as string 
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

export async function POST(request: Request) {
  try {
    // --- 3. TRAVA ANTI-DDOS ---
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'ip-webhook-mp';
    const { success } = await ratelimit.limit(ip);
    
    if (!success) {
      console.warn(`🚨 Rate Limit ativado no Webhook: IP ${ip}`);
      // Respondemos 429 para o MP saber que estamos sobrecarregados e ele tentar de novo mais tarde
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 }); 
    }

    // --- 4. BLINDAGEM HMAC (Segurança de Assinatura) ---
    const xSignature = request.headers.get('x-signature');
    const xRequestId = request.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      console.error("🚨 Tentativa de acesso bloqueada: Assinatura ausente.");
      return NextResponse.json({ error: "Acesso Negado" }, { status: 403 });
    }

    const url = new URL(request.url);
    const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');

    if (!dataId) {
      console.error("🚨 Webhook inválido: ID ausente.");
      return NextResponse.json({ error: "Payload Inválido" }, { status: 400 });
    }

    const parts = xSignature.split(',');
    let ts = '';
    let v1 = '';

    parts.forEach(part => {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    });

    const secret = process.env.MP_WEBHOOK_SECRET as string;
    
    if (secret) {
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const computedSignature = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
        
        if (computedSignature !== v1) {
          console.error("🚨 ALERTA: Assinatura HMAC não confere. Possível ataque detectado.");
          return NextResponse.json({ error: "Assinatura Inválida" }, { status: 403 });
        }
    } else {
        console.warn("⚠️ MP_WEBHOOK_SECRET não está configurado na .env! A assinatura não foi validada.");
    }

    // --- 5. VALIDAÇÃO ZOD DO CORPO (BODY) ---
    const rawBody = await request.json();
    const validation = webhookSchema.safeParse(rawBody);

    if (!validation.success) {
      console.error("🚨 Webhook rejeitado pelo Zod: Estrutura inválida.");
      return NextResponse.json({ error: "Estrutura do payload corrompida" }, { status: 400 });
    }

    const body = validation.data;
    console.log("📦 Notificação confirmada e segura do Mercado Pago:", body.action || body.type);

    const paymentId = body?.data?.id || dataId; // Pega do body ou do param de segurança

    if (paymentId) {
      console.log(`🔍 Verificando o pagamento ID: ${paymentId} na central...`);
      
      // TRAVA DE SEGURANÇA 2: Sempre checar o status real
      const paymentInfo = await new Payment(client).get({ id: paymentId });
      const statusReal = paymentInfo.status; 
      
      console.log(`✅ Status verdadeiro confirmado: ${statusReal}`);

      const { error: dbError } = await supabaseAdmin
        .from('pedidos')
        .update({ status_pagamento: statusReal })
        .eq('id_pagamento_mp', String(paymentId));

      if (dbError) {
        console.error("❌ Erro ao atualizar o pedido no banco de dados:", dbError);
      } else {
        console.log("💾 Sucesso! Status do pedido atualizado no Supabase.");
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Erro crítico processando Webhook:', error.message);
    // Para o Mercado Pago, sempre retornamos 200 ou 4xx/5xx dependendo se queremos que ele reenvie a msg.
    // Retornar 500 faz o MP tentar enviar a notificação de novo depois.
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}