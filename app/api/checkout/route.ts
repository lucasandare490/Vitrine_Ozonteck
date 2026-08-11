import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN as string 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const payment = new Payment(client);
    
    const response = await payment.create({
      body: {
        transaction_amount: body.transaction_amount,
        description: body.description || 'Compra na Vitrine Ozonteck',
        payment_method_id: body.payment_method_id,
        payer: body.payer,
        token: body.token,
        installments: body.installments,
        issuer_id: body.issuer_id,
        // O back-end agora usa a URL enviada pelo front-end (ou um fallback)
        notification_url: body.notification_url || 'https://signatures-commentary-surely-soccer.trycloudflare.com/api/webhook',
      }
    });

    return NextResponse.json({
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      point_of_interaction: response.point_of_interaction, 
    });

  } catch (error: any) {
    console.error('Erro ao processar pagamento com Brick:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao processar pagamento' }, 
      { status: 500 }
    );
  }
}