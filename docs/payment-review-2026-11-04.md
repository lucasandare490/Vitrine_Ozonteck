# Revisão de pagamentos — 04/11/2026

Checkout mantido, com autorização limitada a sandbox e sem cobranças reais. Esta revisão não criou, cancelou, pagou ou reembolsou cobranças, não alterou contas, credenciais ou banco de produção e não publicou alterações. Não houve chamadas à API de pagamentos, nem mesmo em sandbox. As consultas externas limitaram-se à documentação pública oficial.

Foram criados somente este relatório, `scripts/check-orders-production-readiness.mjs` e `tests/payment-ui-policy.test.ts`. `components/OrdersCheckoutPayment.tsx` e `components/CvvHelp.tsx` foram inspecionados e preservados. Os demais arquivos citados foram apenas lidos. Há outras alterações de trabalho no repositório que não pertencem a esta revisão.

## Resultado por modalidade

| Modalidade | Evidência local atual | O que continua sem comprovação |
| --- | --- | --- |
| Crédito | O `CardPayment` inclui `credit_card`; o callback encaminha `extra.paymentTypeId` e rejeita tipo ausente/desconhecido. O conversor Orders exige token e aceita 1–12 parcelas. O teste puro existente exercitou crédito com 12 parcelas, ausência de token/cartão e parcelas fora do limite. | Tokenização no navegador, aprovação, recusa e análise pelo provedor, parcelas realmente disponíveis para a conta e conclusão de 3DS. Nenhuma compra Orders executada. |
| Débito | O mesmo Brick inclui `debit_card` e encaminha o tipo explicitamente. O conversor Orders aceita somente uma parcela; o teste existente exercitou uma parcela válida e rejeitou débito com 12 parcelas. | Reconhecimento de cartão de débito real do SDK, habilitação da bandeira/conta, aprovação/recusa e autenticação bancária. Crédito aprovado não provaria débito. Nenhuma compra Orders executada. |
| Boleto | O botão envia `boleto`; a rota converte para `id: boleto`, `type: ticket`. Os testes puros cobrem montagem do pedido, linha digitável e rejeição de links não confiáveis. O componente de consulta contém código, link e aviso de compensação. | Emissão pelo provedor, vencimento efetivo e recuperação de um boleto Orders no navegador. Compensação/estado final não comprovados. A documentação oficial limita o teste de boleto à criação e consulta em `action_required`, sem demonstrar pagamento final. |

Referências oficiais: [cartões Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/cards), [boleto Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/boleto) e [limite do teste de boleto](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/integration-test/boleto). A transformação de `federal_unit` em `payer.address.state` com duas letras corresponde ao campo documentado para boleto. `config.location.state_id` é opcional; sua ausência não foi classificada como falha.

## Ajuda do CVV: lacuna precisa

O pacote instalado é `@mercadopago/sdk-react` **1.0.7**. O contrato público de `CardPayment` e sua implementação encaminham apenas os callbacks `onReady`, `onError`, `onSubmit` e `onBinChange`. Não expõem evento de foco/saída do campo CVV, nem uma referência pública ao Secure Field interno.

Evidências: `node_modules/@mercadopago/sdk-react/esm/bricks/cardPayment/type.d.ts` e `index.js`; [contrato React oficial](https://github.com/mercadopago/sdk-react/blob/main/src/bricks/cardPayment/type.ts) e [callbacks oficiais do Card Payment Brick](https://github.com/mercadopago/sdk-js/blob/main/docs/bricks/card-payment.md).

A API separada de [Secure Fields](https://github.com/mercadopago/sdk-js/blob/main/docs/fields.md) documenta eventos `focus`/`blur` para campos criados diretamente, incluindo `securityCode`. Isso não fornece acesso público ao campo interno do Brick existente. Trocar o formulário por Secure Fields mudaria a integração e a UI, fora desta revisão.

Em `components/OrdersCheckoutPayment.tsx:66`, a ajuda continua após o Brick. Em `components/CvvHelp.tsx:2`, o conteúdo permanece recolhido em `<details>`, aberto pelo próprio comprador. **Abertura automática exatamente ao focar o CVV não implementada**, por falta de callback público no componente mantido. Não foram adicionados listeners de mensagens internas, inspeção de iframe, seletores de campos internos ou estimativas de foco pelo documento.

## Configuração local, sem valores de segredos

O novo verificador pode ser executado com:

```powershell
node scripts/check-orders-production-readiness.mjs
node scripts/check-orders-production-readiness.mjs .env.payment-test
```

Ele lê somente o arquivo indicado (padrão `.env`), informa presença e verificações de formato, não importa SDK/Next/Supabase, não usa rede e não modifica configuração. Não carrega outros arquivos, não combina `process.env` e não expande referências entre variáveis. Portanto não representa o ambiente efetivo do Next.js, o bundle já publicado ou o painel do provedor.

Código de saída `0`: verificações estáticas passaram. Código `1`: configuração incompleta/incompatível ou arquivo indisponível. **Nenhum dos resultados certifica produção ou sandbox.** Os campos `productionReady`, `providerVerified` e `sandboxOrdersSupported` permanecem `false` como limites explícitos da revisão. Um erro de leitura usa mensagem fixa, sem revelar caminhos ou conteúdo.

Resultado nesta execução:

- `.env`: presentes as cinco variáveis Orders (`NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY`, `MP_ORDERS_ACCESS_TOKEN`, `MP_ORDERS_ACCOUNT_ID`, `MP_ORDERS_APPLICATION_ID`, `MP_ORDERS_WEBHOOK_SECRET`), configuração Supabase e limite distribuído. Origem HTTPS passou na verificação de formato; flags de sandbox não estavam definidas. O verificador terminou com código `0`.
- `.env.payment-test`: presentes somente as credenciais legadas relevantes, com prefixo `TEST-`; faltam as cinco variáveis Orders e as dependências de configuração examinadas. Esse arquivo não habilita um teste Orders atual.
- `.env.local`, `.env.production` e `.env.production.local`: não encontrados nesta inspeção. Valores de credenciais, IDs de conta/aplicação, URLs configuradas e dados pessoais não foram registrados.

A documentação atual também descreve Access Token de teste Orders com prefixo `APP_USR`. **Prefixo não identifica com segurança teste versus produção.** Não se reutilizou a configuração local para realizar operações externas. [Referência oficial](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-integration/websites/cards).

## Lacunas e arquivos exatos

| Área | Arquivo/ponto | Lacuna e consequência |
| --- | --- | --- |
| backend — sandbox Orders | `lib/server/orders-provider.ts:16`, `:29` | `ordersConfig()` rejeita `PAYMENT_SANDBOX=true`; o vínculo exige `environment: production`. Não existe isolamento Orders de teste demonstrado nesse provedor. |
| frontend/backend — seleção divergente | `app/lista/page.tsx:25`, `:733`; `app/api/checkout/route.ts:334` | A chave pública Orders seleciona o formulário e sua chave no frontend, enquanto a rota só escolhe Orders quando sandbox está desligado. Ativar a flag isoladamente não constitui uma homologação Orders segura. |
| backend — notificações de teste | `app/api/webhook/orders/route.ts:10` | O schema exige `live_mode: true`. Eventos Orders sandbox não são aceitos por esse contrato. A rota consulta o provedor e concilia no banco; não foi chamada. |
| backend — persistência | `lib/server/orders-provider.ts:47`, `:61`; `app/api/checkout/route.ts:289` | Criar cobrança associa o provedor e concilia por RPC; o checkout reserva pedido antes da chamada ao provedor. Nenhuma dessas rotas deve ser usada como teste somente leitura sobre configuração de produção. Aplicação remota das migrações/vínculos não verificada. |
| backend — consulta com efeitos | `app/api/pedidos/[id]/pagamento/route.ts:46` | A consulta de um ID Orders chama `reconcileOrdersPayment`; embora seja GET, pode escrever no banco. Não foi executada contra pedidos reais. |
| frontend/backend — 3DS | `lib/server/mercado-pago-orders.ts:88`, `:158`; `components/OrderPayment.tsx:70` | Há pedido de 3DS e apresentação da URL normalizada em iframe. Não foi demonstrado um challenge completo nem compatibilidade de uma URL efetivamente retornada para esta conta brasileira com a lista de hosts permitidos. O teste puro atual verifica sinalização de autenticação, mas não a URL/challenge completo. |
| backend — webhook publicado | `app/api/webhook/orders/route.ts`; `scripts/check-payment-readiness.mjs` | O checker antigo usa chaves e caminho legados `/api/webhook`; não atesta Orders. Presença de `MP_ORDERS_WEBHOOK_SECRET` não demonstra cadastro/entrega para `/api/webhook/orders`. Painel e entrega remota não verificados. |
| testes — cobertura antiga | `scripts/test-affiliate-checkout.cjs:41` | Execução isolada falhou em `Unexpected import @/lib/server/orders-provider`. O adaptador de teste não acompanha a importação atual; não oferece evidência de checkout aprovado. Não alterado por estar fora dos arquivos autorizados. |
| testes — scripts de sandbox legados | `scripts/test-mercadopago-sandbox.mjs`, `scripts/test-payment-routes-sandbox.cjs`, `scripts/start-payment-sandbox.cjs` | Usam Payments API, credenciais legadas e/ou servidor/túnel de sandbox. Não comprovam crédito, débito ou boleto via Orders. Não executados nesta revisão. |

O iframe de challenge 3DS é um fluxo documentado pelo provedor e é distinto de tentar ler o iframe do CVV. A [referência oficial de 3DS](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-management/integrate-3ds) exige observar o resultado após a autenticação; exibir o iframe não comprova aprovação.

## Verificações executadas

| Verificação | Resultado e alcance |
| --- | --- |
| `node --test --experimental-strip-types tests/payment-ui-policy.test.ts` | 7/7 passaram. Exercitam o checker real por subprocesso: ausência de credencial, seleção divergente, flags incompatíveis, origem inválida/temporária, redaction, arquivo ausente e preservação do arquivo. Não simulam UI nem tokenização. |
| `npm test` com `SEO_TEST_BASE_URL` ausente | 95 passaram, 0 falharam, 1 teste HTTP de SEO ignorado. Inclui os 10 testes puros Orders e os 7 novos. Avisos existentes do Node sobre remoção experimental de tipos e detecção de módulos. |
| `node scripts/test-order-payment.cjs` | Passou com provedor e banco substituídos por adaptadores locais. Verifica consulta legada, autenticação, proprietário, ambiente, valor e recuperação Pix/boleto. Não executa o ramo Orders. |
| `node scripts/test-payment-webhook.cjs` | Passou com validação de assinatura do SDK e provedor/banco simulados. Refere-se a `/api/webhook` legado; não à rota Orders. |
| `node scripts/test-payment-stock-sql.mjs node_modules/@electric-sql/pglite/dist/index.js` | Passou em PostgreSQL temporário em memória: reserva, repetição de eventos, vencimento, reembolso, valor divergente e falta de estoque. Não verifica banco remoto, concorrência remota ou migração do vínculo Orders. |
| `node scripts/test-affiliate-checkout.cjs` | Falhou antes de exercitar checkout, pela importação não reconhecida descrita acima. |
| `npx tsc --noEmit --incremental false` | Falhou com `TS6053`: arquivos gerados sob `.next/types/` não estavam disponíveis durante a leitura (incluindo checkout, webhook Orders e páginas). Verificação global de tipos inconclusiva; não foi regenerada a saída do Next nem alterada a configuração compartilhada. |

Nenhum build, navegador, celular, deploy, painel do Mercado Pago, entrega pública de webhook ou transação externa foi usado como evidência nesta revisão. Os testes locais não permitem declarar crédito, débito ou boleto homologados de ponta a ponta.

## Continuação de 05/11/2026

O titular delegou a escolha do formulário seguro. A implementação Orders agora usa campos individuais oficiais (`fields.create`, `createCardToken`) do SDK Mercado Pago, em lugar do Brick de cartão. Número, validade e CVV permanecem em iframes do provedor, sem acesso a seus valores pelo código da loja. Nome/CPF do titular e apenas o token são usados na confirmação. `@mercadopago/sdk-js` 0.0.3 tornou-se dependência direta, na mesma versão já instalada pelo SDK React.

A ilustração aparece ao receber o evento público `focus` do campo `securityCode` e desaparece no `blur`; não depende de inspeção do conteúdo de iframe. Testado no Chrome contra os campos reais, sem digitar cartão, gerar token ou criar cobrança. Evidência: `evidencias/cvv-foco-2026-11-05.png`. A prévia local, com envio deliberadamente desabilitado, foi removida após a inspeção e não integra o site publicado.

Condições e tipos são obtidos do SDK para o BIN informado; a loja filtra crédito/débito ativos, 1–12 parcelas de crédito e uma no débito. Não há parcelas inventadas quando a resposta está vazia. Respostas antigas de BIN/condições e eventos após desmontagem são descartados. Testes executam os componentes reais com o SDK substituído em memória; verificam foco/saída, montagem estável, token, bloqueio de clique duplo e descarte de resultados antigos. Isso não comprova aprovação bancária.

Acrescentados testes da rota Orders com o verificador real de assinatura HMAC do SDK e provedor/banco locais: rejeição de assinatura/horário/ID/ambiente, limite de chamadas, leitura autenticada antes de conciliar e quatro modalidades. A assinatura de teste respeita o ID recebido, conforme o contrato atual do SDK; uma primeira fixture incorreta foi corrigida após conferir implementação e documentação oficial. O adaptador legado `test-affiliate-checkout.cjs` passou após receber uma dependência Orders que falha se chamada fora do ramo esperado; as regras de preço/identidade não foram relaxadas.

O Mercado Pago voltou a exigir validação por telefone. O titular informou em 05/11 que não dispõe do celular do responsável e pediu deixar essa etapa para depois. Homologação individual no provedor, captura/recusa/3DS, compensação e callbacks externos continuam como dependência externa adiada. Não foram realizadas cobranças reais nem alteradas as credenciais produtivas para simular sandbox.

Fontes oficiais consultadas: [Secure Fields](https://github.com/mercadopago/sdk-js/blob/main/docs/fields.md), [notificações Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/notifications). Não equiparar testes locais ao ciclo bancário real.
