/** Shared transactional copy. Rendering does not send mail or change an order. */
export const customerEmailEvents = {
  welcome: ['Boas-vindas à Ozonteck Recife', 'Sua conta está pronta', 'Acesse sua conta para acompanhar compras, endereços e atualizações.'],
  payment_pending: ['Conclua o pagamento da sua compra', 'Falta concluir o pagamento', 'Sua compra ainda não foi confirmada. Consulte o Pix ou boleto e o prazo de validade na sua conta.'],
  payment_approved: ['Pagamento confirmado — Ozonteck Recife', 'Pagamento confirmado', 'Recebemos a confirmação do pagamento. Acompanhe as próximas etapas do pedido na sua conta.'],
  payment_rejected: ['Pagamento não aprovado — Ozonteck Recife', 'O pagamento não foi aprovado', 'Acesse sua compra para consultar as opções disponíveis e escolher outra forma de pagamento.'],
  order_changed: ['Atualização da sua compra — Ozonteck Recife', 'Os dados da compra foram atualizados', 'Confira os dados atuais e o andamento da sua compra na sua conta.'],
  order_shipped: ['Seu pedido foi enviado — Ozonteck Recife', 'Seu pedido está a caminho', 'Consulte os detalhes da entrega e o rastreamento disponível na sua conta.'],
  pickup_ready: ['Pedido disponível para retirada', 'Seu pedido está pronto para retirada', 'Confira o local e as orientações de retirada nos detalhes do pedido.'],
  order_delivered: ['Pedido entregue — Ozonteck Recife', 'Entrega concluída', 'Obrigado pela compra. Você pode consultar o pedido e as opções de avaliação na sua conta.'],
  order_cancelled: ['Pedido cancelado — Ozonteck Recife', 'Seu pedido foi cancelado', 'Consulte os detalhes na sua conta. Se houve pagamento, acompanhe separadamente a situação do reembolso.'],
  refund_confirmed: ['Reembolso confirmado — Ozonteck Recife', 'O reembolso foi confirmado', 'O prazo para o valor aparecer depende da instituição e da forma de pagamento utilizada.'],
  support_received: ['Recebemos sua solicitação — Ozonteck Recife', 'Sua solicitação foi recebida', 'Nossa equipe recebeu sua mensagem. Acompanhe o atendimento pelo canal informado na solicitação.'],
} as const;

export type CustomerEmailEvent = keyof typeof customerEmailEvents;
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export function renderCustomerEmail(input: {
  event: CustomerEmailEvent;
  name?: string;
  reference?: string;
  actionUrl: string;
  siteUrl: string;
}) {
  const site = new URL(input.siteUrl);
  const action = new URL(input.actionUrl, site);
  if (site.protocol !== 'https:' || action.protocol !== 'https:' || action.origin !== site.origin || action.username || action.password) {
    throw new Error('O link do e-mail deve usar HTTPS no domínio da loja.');
  }
  const [subject, title, message] = customerEmailEvents[input.event];
  const greeting = input.name?.trim() ? `Olá, ${input.name.trim()}!` : 'Olá!';
  const reference = input.reference ? `Referência: ${input.reference}` : '';
  const text = [title, greeting, message, reference, `Acessar minha conta: ${action.href}`, 'Ozonteck Recife', 'Precisa de ajuda? Acesse a Central de Ajuda da loja.'].filter(Boolean).join('\n\n');
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="600" style="width:100%;max-width:600px;background:#fff;border:1px solid #e2e8f0;border-radius:16px" cellspacing="0" cellpadding="0"><tr><td style="padding:28px;background:#064e49;color:#fff;border-radius:16px 16px 0 0;font-size:23px;font-weight:bold">OZONTECK <span style="font-size:12px;color:#99f6e4">RECIFE</span></td></tr><tr><td style="padding:28px"><h1 style="font-size:24px;line-height:1.3;margin:0 0 24px">${escapeHtml(title)}</h1><p>${escapeHtml(greeting)}</p><p style="line-height:1.7">${escapeHtml(message)}</p>${reference ? `<p style="font-size:13px;color:#475569;overflow-wrap:anywhere">${escapeHtml(reference)}</p>` : ''}<p style="margin:28px 0"><a href="${escapeHtml(action.href)}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:15px 24px;border-radius:8px;font-weight:bold">Acessar minha conta</a></p><p style="font-size:12px;line-height:1.6;color:#64748b">Se o botão não abrir, copie este endereço no navegador:<br><a href="${escapeHtml(action.href)}" style="color:#0f766e;overflow-wrap:anywhere">${escapeHtml(action.href)}</a></p></td></tr><tr><td style="padding:20px 28px;border-top:1px solid #e2e8f0;font-size:12px;line-height:1.7;color:#64748b">Ozonteck Recife · Mensagem sobre sua conta ou compra.<br>Precisa de ajuda? Acesse a Central de Ajuda da loja.</td></tr></table></td></tr></table></body></html>`;
  return { subject, html, text };
}
