# Avanço nas pendências — 28/11/2026

Continuação após `43f1437`. Esta etapa alterou ferramentas de diagnóstico e documentação; não modificou regras comerciais, estrutura de banco, credenciais ou interface da loja.

## Débito: nova tentativa real, somente na homologação

O script verificou `/users/me`, exigindo conta brasileira com tag `test_user` e aplicação correspondente antes de qualquer escrita. Foi utilizado somente o cartão fictício oficial Elo. A conta de produção e o banco da loja não foram usados para a tentativa.

O provedor voltou a retornar **`payment_method_not_allowed_for_collector`**. Portanto o funcionamento do débito permanece **não comprovado**; não se alterou o meio para contornar a elegibilidade. A primeira tentativa produziu apenas `CHECK_FAILED`, pois o SDK devolve erro como objeto e o diagnóstico antigo não capturava o campo de códigos. O diagnóstico foi corrigido e uma segunda tentativa isolada confirmou o motivo específico. Isso não autoriza declarar indisponibilidade de todo o Mercado Pago nem recusa universal de débito em produção.

Evidências: `payment-debit-recheck-2026-11-28.json` preserva o primeiro resultado; `payment-debit-diagnostic-2026-11-28.json` registra a nova tentativa sanitizada. O histórico de 05/11 foi preservado. Nenhum e-mail foi enviado e nenhum pedido da loja foi criado. A documentação de cartões e o escopo de teste foram conferidos em [Mercado Pago — testes Orders](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/integration-test/cards).

## Webhook: divergência isolada e correção local comprovada

O código publicado em `8558a5e` passa o ID recebido diretamente ao validador de assinatura. O código atual já contém a correção de normalizar o identificador alfanumérico para minúsculas. O comparativo foi feito com `git diff 8558a5e -- app/api/webhook/orders/route.ts`.

Foram usados eventos **fictícios de tipo não aceito**: com assinatura válida, o processamento para no erro de esquema e não consulta pagamentos nem grava pedidos. O limitador de requisições pode registrar suas contagens normais; isso não foi descrito como ausência de qualquer acesso ao banco.

| Alvo e ID | Assinatura inválida | Assinatura canônica | Resultado |
| --- | --- | --- | --- |
| Publicado, ID em maiúsculas | 401, assinatura inválida | 401, assinatura inválida | Não passou; correção de normalização não está publicada |
| Publicado, ID em minúsculas | 401, assinatura inválida | 400, evento inválido | Passou no recorte compatível com a versão antiga |
| Build local corrigido, ID em maiúsculas | 401, assinatura inválida | 400, evento inválido | Passou: assinatura aceita e evento fictício recusado |

O horário do servidor e o local diferiam em aproximadamente dois segundos na conferência, sem evidência de expiração por relógio. O teste em minúsculas aceito também demonstra que **não é necessário concluir troca ou divergência de segredo a partir da primeira falha**. Não foram trocadas credenciais nem enfraquecida a validação.

Os três registros estão em `webhook-configuration-recheck-2026-11-28.json`, `webhook-lowercase-recheck-2026-11-28.json` e `webhook-local-recheck-2026-11-28.json`. Eles não comprovam entrega espontânea de webhook pelo provedor, baixa de estoque ou entrega de e-mail.

**Antes do lançamento:** publicar a revisão corrigida quando a Netlify permitir e repetir o teste padrão, sem `--lowercase-query`. Não usar somente a compatibilidade em minúsculas para aprovar a versão antiga.

## Ferramentas e testes

- `check-orders-sandbox-provider.mjs`: opção `--output=docs/arquivo-novo.json`, recusa sobrescrever arquivo existente nesse modo, conserva o relatório antigo e registra somente os casos realmente executados na nova saída. Registra recusa do SDK por códigos, sem despejar mensagens, tokens ou informações do pagador.
- `check-orders-webhook-deployment.mjs`: resposta sanitizada e modos fixos `--lowercase-query` e `--local`; não aceita URL arbitrária como destino. O ambiente local usa somente `127.0.0.1:3108`.
- `provider-diagnostics.test.ts`: quatro testes, cobrindo o erro estruturado do SDK, exceção nula, descarte de dados inesperados/sensíveis e recusa da opção de saída vazia antes de acessar credenciais/rede, preservando o histórico. O teste nulo expôs uma desreferência antiga e ela foi corrigida; a asserção não foi removida.
- Suíte principal repetida após os ajustes: **175 aprovados, zero falhas e um HTTP condicional ignorado**. Testes de diagnóstico: **4/4**. Lint dirigido e validação de sintaxe executados; os logs desta etapa ficam em `test-pendencias-2026-11-28.log`, `provider-diagnostic-tests-2026-11-28.log` e `lint-pendencias-2026-11-28.log`.
- Não foi necessária nova compilação da aplicação para essas alterações exclusivas de scripts/testes/documentação. O build local de interface conferido anteriormente continua sendo servido; código salvo no Git não foi confundido com publicação.

## Limites encontrados e preservados

A tentativa de abrir o diagnóstico visual do Chrome foi interrompida pela ferramenta por não conseguir confirmar a URL com segurança. Não houve automação alternativa para contornar essa proteção, medição Lighthouse concluída, instalação nova ou teste real de iOS/Android. A nota de desempenho continua **não medida**, sem pontuação inventada.

Não foi repetida a solicitação de indexação que já havia sido recusada pela cota nesta data, nem contratado plano Netlify. Os preços globais/sete apresentações adicionais e o verso/fabricante do Visaris continuam dependendo das confirmações descritas nos documentos anteriores. Uma pesquisa por fonte oficial nesta retomada não forneceu o verso ausente; informação comercial ou regulatória não foi presumida.

O histórico registra oito pedidos sem ID de pagamento nem checkout. Sem referência verificável, não foi feita busca por associação de nome/valor para aprovar automaticamente pedidos. Uma busca pelos nomes de arquivos de backup/snapshot de categorias no projeto não revelou nova cópia; isso não certifica inexistência de backup fora do repositório. Nenhum registro histórico foi reconstruído ou excluído.

Quantidade provisória 9999 e pesquisa formal futura com usuários seguem como decisões, não bloqueios. Permanecem externos: publicação e prova da cadeia publicada, elegibilidade de débito, compensação do boleto sem cobrança real autorizada, confirmações comerciais/documentais, processamento Google e documentos históricos.

## Texto técnico pronto para suporte, sem envio

> Na integração Orders/Checkout Transparente de teste da Ozonteck Recife, confirmamos via `/users/me` que o vendedor tem `test_user` e site MLB. A tokenização do cartão Elo oficial de homologação conclui, mas a criação da order para débito retorna `payment_method_not_allowed_for_collector`. A tentativa de 28/11/2026 está documentada, sem uso de cartão real ou banco da loja. Favor verificar a elegibilidade do coletor de teste para débito e informar o procedimento oficial para habilitar ou testar essa modalidade. Podemos fornecer a identificação da aplicação pelo atendimento autenticado; não enviaremos tokens ou segredos.

Não foi aberto chamado nem enviada mensagem a terceiros nesta etapa.
