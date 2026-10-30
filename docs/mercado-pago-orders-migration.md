# Mercado Pago Orders em produção

Atualizado em 29/10/2026.

A aplicação Ozonteck Recife na conta Ozonlife usa Checkout Transparente via Orders.
A integração Sicove não foi alterada. A loja pública é https://ozonteck-recife.netlify.app.

## Configuração

- `NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY`: chave pública da nova aplicação; habilita o formulário Orders.
- `MP_ORDERS_ACCESS_TOKEN`: segredo da conta Ozonlife, somente no servidor.
- `MP_ORDERS_ACCOUNT_ID` e `MP_ORDERS_APPLICATION_ID`: identidade esperada do recebedor.
- `MP_ORDERS_WEBHOOK_SECRET`: assinatura da notificação de produção.
- `MP_ACCESS_TOKEN` e `MP_WEBHOOK_SECRET`: preservados para pagamentos legados.
- `NEXT_PUBLIC_SITE_URL`: endereço HTTPS da loja.

Segredos ficam no arquivo de ambiente ignorado pelo Git e nas variáveis protegidas da Netlify.
Não inserir segredos em documentação, commits ou variáveis NEXT_PUBLIC.

## Banco e notificações

Aplicar `supabase/migrations/202610220001_payment_provider_binding.sql` antes da publicação.
Essa migração aditiva foi aplicada no banco existente em 29/10/2026.
Ela associa os pedidos anteriores à integração legada. Novas tentativas Orders usam
prefixo `orders-` e gravam a identidade do provedor antes de enviar uma cobrança.

Webhook de produção: `https://ozonteck-recife.netlify.app/api/webhook/orders`.
Evento: `Order (Mercado Pago)`. A rota valida assinatura, consulta a cobrança
no Mercado Pago e confere identidade, referência e valor antes da conciliação.

## Comportamento

Pix e boleto permanecem disponíveis na compra e em Meus pedidos.
Cartões usam o Card Payment Brick; dados de cartão são tokenizados pelo Mercado Pago.
A confirmação adicional do banco, quando exigida, aparece na própria página.
A consulta de pagamentos pendentes atualiza a tela a cada 15 segundos.
Aprovação exige confirmação do provedor; gerar um código ou boleto não confirma uma venda.

Tentativas ficam persistidas no navegador antes do envio para reutilizar a chave
após falhas de rede ou recarregamentos. Compras legadas não recebem tokens da nova conta.

## Verificação e limites

Verificações locais de código não efetuam cobranças e não comprovam aprovação de um banco.
A aceitação de cada meio depende da conta e do Mercado Pago. Não foi realizada
compra real nesta migração. A publicação e o recebimento remoto de notificações
devem ser conferidos no deploy final; ativar credenciais por si só não comprova esses passos.

## Referências

- https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/cards
- https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications
- https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-management/integrate-3ds
