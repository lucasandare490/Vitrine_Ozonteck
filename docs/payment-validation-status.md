# Validacao de pagamento - 2026-10-10

## Verificado

- Consulta autenticada e somente leitura a `/users/me` do Mercado Pago: HTTP 200, site MLB, conta sem tag `test_user`. Nenhuma credencial ou dado pessoal foi registrado neste documento.
- O endereco atualmente configurado em `MP_WEBHOOK_URL` falhou na resolucao DNS (`ENOTFOUND`). Nao esta apto a receber notificacoes nesta verificacao.
- `node scripts/test-affiliate-checkout.cjs`: passou. Precos recalculados no servidor, WO3 com preco comum e rejeicao de valores adulterados ou beneficios revogados, com integracoes simuladas.
- `node scripts/test-payment-webhook.cjs`: passou. Usa o validador real de assinatura do SDK instalado; simula Mercado Pago e banco. Cobre assinatura ausente/invalida/expirada, IDs divergentes, indisponibilidade/limite, status e valor vindos do provedor (nao do corpo recebido), falhas de consulta/persistencia, pedido ausente e revisao de estoque.

## Ainda nao homologado

- Pagamento de teste completo passando pelo Mercado Pago, notificacao publica e persistencia no banco.
- Repeticao de notificacoes e ausencia de baixa duplicada de estoque no fluxo integrado com provedor e banco remoto. O teste local SQL abaixo cobre repeticoes sequenciais, nao concorrencia.
- Comportamento real de aprovacao, rejeicao, estorno e pagamento pendente em ambiente de homologacao.

## Para concluir

1. Disponibilizar credenciais/contas de teste do Mercado Pago em ambiente isolado, sem substituir as credenciais atuais nem usar compradores reais.
2. Configurar URL HTTPS publica ativa terminando em `/api/webhook` e o segredo correspondente. Para publicacao, usar dominio estavel; o antigo tunel temporario nao serve como configuracao definitiva.
3. Executar o ciclo integrado com pedidos e estoque de teste, conferindo valor, status, repeticao de notificacoes e estoque antes/depois.

Nao foram criadas cobrancas, alterados pedidos reais ou substituidas credenciais. Esses testes locais nao constituem liberacao para vendas reais.

## Avanco apos acesso ao painel

- A aplicacao Vitrine Ozonteck usa Checkout Transparente / API Pagamentos e possui uma pagina de credenciais de teste.
- `.env.payment-test` foi preparado separadamente e sua exclusao pelo Git foi verificada. O usuario forneceu a chave de teste posteriormente; ela foi salva somente nesse arquivo. A consulta de meios de pagamento retornou HTTP 200. A configuracao de producao foi preservada.
- `scripts/test-payment-stock-sql.mjs` passou usando as funcoes SQL reais da migration em PostgreSQL temporario (PGlite), sem modificar o Supabase. Cobriu reserva repetida, aprovacao repetida, recusa repetida, expiracao repetida, aprovacao apos expiracao, divergencia de valor, outro pagamento para o mesmo pedido, pedido inexistente e falta de estoque.
- Nao cobre concorrencia, estornos ou repeticao apos mudancas de status de entrega; nao substitui homologacao integrada.
- Nenhum tunel publico foi criado; a URL de notificacoes de producao nao foi alterada. O receptor local experimental de credencial foi encerrado e seu script removido.

## Retomada de 2026-10-12

- Em 2026-10-10 foram criados tres pagamentos sandbox com `live_mode=false`: aprovado, recusado e em processamento. Evidencia historica: `payment-sandbox-results.json`.
- O novo `scripts/test-payment-routes-sandbox.cjs` carrega os handlers reais de checkout e webhook, o SDK real e as funcoes SQL em PostgreSQL temporario. A autenticacao e o transporte PostgREST sao adaptados localmente; o limite de requisicoes usa o modo local do codigo real.
- Na tentativa de criar novos pagamentos, o Mercado Pago retornou HTTP 500 `internal_error`. O mesmo ocorreu no script minimo que havia passado em 2026-10-10. Retirar a URL ficticia de notificacao e usar dados minimos do pagador nao eliminou o erro; essas alteracoes foram apenas diagnosticas no teste e removidas. Nao se atribui causa definitiva nem se declara indisponibilidade geral do provedor.
- O modo `--existing-payments` passou com os tres pagamentos sandbox existentes: consulta real ao Mercado Pago, validacao de assinatura pelo SDK, processamento pelo handler real e persistencia nas funcoes SQL locais. Duas notificacoes por pagamento nao duplicaram a baixa; dados de status enviados no corpo foram ignorados em favor da consulta ao provedor. Resultado: `payment-routes-sandbox-results.json`.
- As assinaturas foram geradas pelo teste, nao entregues pelo Mercado Pago. A entrega publica HTTPS, o checkout pelo navegador, o Supabase remoto e novas compras pelo checkout integrado continuam sem homologacao completa.
- O navegador conectado nao tinha abas abertas nesta retomada. Nenhuma configuracao do painel foi modificada.
- Como a chave TEST foi compartilhada no chat, recomenda-se sua renovacao ao encerrar a homologacao. Nao foi renovada automaticamente.

## Simulador publico do Mercado Pago validado

Em 12/10/2026, apos nova autenticacao do usuario, foi usado um receptor HTTPS temporario exclusivo para tres IDs sandbox conhecidos. Ele executou o handler real de webhook com o segredo ja configurado localmente, SDK real com token TEST e banco PGlite temporario. Nenhuma chave de producao de pagamento ou conexao ao Supabase remoto foi usada.

- A URL foi alterada apenas na aba Modo de teste; o evento Pagamentos (legacy) ja estava selecionado.
- O simulador do proprio painel enviou o evento do pagamento sandbox aprovado `1328413292` duas vezes e mostrou `200 - OK` nas duas tentativas.
- A assinatura enviada pelo Mercado Pago foi aceita pelo validador real. O pagamento foi consultado na API sandbox e processado pelas funcoes SQL locais.
- O estoque ficou em 7 antes/depois do reenvio (tres reservas iniciais a partir de 10), sem nova baixa duplicada.
- Evidencia: `payment-public-webhook-results.json`.
- Ao terminar, a URL de teste anterior foi restaurada e salva; receptor e tunel foram encerrados. A URL de producao nao foi alterada. Nenhuma URL temporaria deve ser tratada como endpoint permanente.

Isso valida a entrega pelo simulador publico, nao uma notificacao espontanea apos nova compra nem o ciclo completo pelo navegador/Supabase remoto. A criacao de novos pagamentos sandbox ainda tem o erro descrito no diagnostico de suporte. A publicacao continua exigindo URL HTTPS estavel e validacao integrada final.

## Ultima verificacao de 12/10/2026

- Usuario confirmou que hospedagem e endereco definitivo ainda nao foram definidos. Essa etapa nao pode ser declarada concluida e nenhuma hospedagem foi contratada ou publicada automaticamente.
- Tentativa com pagador ficticio novo: HTTP 400, causa 2006 `Card Token not found`, request ID `64fccdd7-a977-4dcb-a214-7435239cbe59`.
- Tokenizacao com Public Key TEST, seguida de criacao de pagamento: HTTP 500 `internal_error`, request ID `f1a7e4f7-fe05-4f44-8e4d-b1596bd42253`. Tokenizacao concluida; erro ocorreu em `/v1/payments`. Nao ha causa definitiva comprovada.
- Testes locais `test-payment-webhook.cjs` e `test-affiliate-checkout.cjs` passaram novamente.
- Criado `scripts/check-payment-readiness.mjs`: verifica configuracao sem rede, sem pagamentos e sem exibir segredos. Execucao atual apontou endereco publico, URL estavel do webhook e caminho explicito `/api/webhook` pendentes. As demais verificacoes confirmam somente presenca/prefixo, nao operacao externa.
- Proximo passo externo: suporte Mercado Pago investigar os request IDs, e definicao da hospedagem antes de configurar notificacoes permanentes. Nao substituir credenciais por producao para contornar falhas sandbox.
