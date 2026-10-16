# Diagnostico do sandbox - 12/10/2026

Aplicacao: Vitrine Ozonteck, 6055395552853627, Checkout Transparente via API Pagamentos (Brasil).

## Sintoma reproduzido

Criacao de pagamento com credencial TEST e cartoes oficiais de teste retorna HTTP 500 `internal_error`, sem causas detalhadas. A tokenizacao funciona. Nao foram usadas credenciais de producao, cartoes reais ou alteracoes no Supabase da loja.

- Endpoint: `POST https://api.mercadopago.com/v1/payments`.
- Valor ficticio: BRL 79,96, uma parcela.
- Bandeiras reproduzidas: Mastercard e Visa.
- Ultimo identificador de requisicao Visa: `6e6bb0f3-73c7-46fd-9be1-e37fdb484c95`.
- Codigo: HTTP 500, mensagem `internal_error`, lista `cause` vazia.
- Teste sem URL de notificacao e com dados minimos do pagador tambem falhou.
- Comparacao com email ficticio no dominio `testuser.com`: HTTP 403, causa 4390, `Payer email forbidden`. Nao demonstra uma solucao; uma conta de teste cadastrada pode exigir outro procedimento.
- Em 10/10/2026 o mesmo teste minimo havia criado pagamentos sandbox aprovado, recusado e em processamento. Eles permanecem consultaveis e retornam `live_mode=false`.

## Pedido ao suporte

Comparacoes adicionais em 12/10/2026:
- Pagador ficticio novo: HTTP 400, causa 2006 `Card Token not found`, request ID `64fccdd7-a977-4dcb-a214-7435239cbe59`.
- Tokenizacao usando Public Key TEST em vez de Access Token: token criado, mas `/v1/payments` retorna HTTP 500 `internal_error`, request ID `f1a7e4f7-fe05-4f44-8e4d-b1596bd42253`.
- O simulador publico de webhook do painel entregou notificacoes assinadas com HTTP 200. Isso separa o erro de criacao de pagamentos da entrega do simulador.

Investigar o identificador acima e informar se ha restricao na aplicacao, exigencia adicional para o pagador de teste ou falha interna do sandbox. Nenhum token, numero de cartao ou dado pessoal precisa acompanhar este diagnostico.

## Limites da conclusao

O painel publico de status consultado em 12/10/2026 mostrava Checkout API operacional. Isso nao exclui uma falha especifica desta requisicao/aplicacao. Nao foi identificada causa definitiva e nao foi enviado chamado automaticamente.

Fontes oficiais:
- https://www.mercadopago.com.br/developers/en/docs/checkout-api-payments/integration-test/make-test-purchase
- https://status.mercadopago.com/
