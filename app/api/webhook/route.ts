import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Recebemos a notificação secreta do Mercado Pago
    const body = await request.json();
    
    // Vamos imprimir no terminal do VS Code para você ver a mágica a acontecer!
    console.log("📦 ALERTA DO MERCADO PAGO RECEBIDO:", body);

    if (body.type === 'payment' || body.action === 'payment.created') {
      console.log("💰 ID do Pagamento:", body.data.id);
      // É aqui que, na última etapa, vamos dar a baixa no estoque do Supabase!
    }

    // 2. É OBRIGATÓRIO responder com "200 OK" rápido, senão o Mercado Pago acha que o seu site caiu
    return NextResponse.json({ recebido: true }, { status: 200 });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ error: 'Falha no webhook' }, { status: 500 });
  }
}