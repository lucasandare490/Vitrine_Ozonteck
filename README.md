# Vitrine OZONTECK Recife

Loja virtual com catálogo, carrinho, conta do cliente, pagamentos pelo Mercado Pago e painel administrativo. Inclui apresentação da equipe do distribuidor e benefícios de preço mediante aprovação manual.

> Código implementado e testes locais não comprovam que o banco remoto ou a hospedagem estão prontos para vendas reais. Consulte o [checklist de publicação](docs/publicacao-pagamentos-checklist.md).

## Funcionalidades

### Loja e conta

- Catálogo com pesquisa, categorias, paginação, detalhes dos produtos e favoritos.
- Carrinho com quantidades e sincronização para o usuário autenticado.
- Checkout em etapas, entrega ou retirada na loja, endereços salvos e consulta de CEP.
- Conta com dados pessoais, endereços, pedidos e autenticação em dois fatores.
- Preço comum, benefício de afiliado aprovado pelo administrador e exceções por cliente. O servidor recalcula os valores; criar uma conta não libera descontos automaticamente.
- Apresentação da equipe e acesso ao cadastro oficial, separado da conta da loja.

### Pagamentos e pedidos

- Checkout transparente do Mercado Pago com crédito, débito, Pix e boleto conforme suporte da conta e do provedor. A implementação não equivale à homologação individual de cada modalidade; consulte a revisão de pagamentos de 04/11/2026.
- Recuperação das instruções de Pix e boleto em compras pendentes, sem gerar outra cobrança apenas para consultá-las.
- Separação entre pagamentos em aberto e pedidos confirmados após aprovação.
- Atualização por consulta ao servidor e notificações do Mercado Pago, com validação de assinatura no webhook.
- Confirmação na própria página do checkout. A prévia de desenvolvimento é demonstrativa e não altera pedidos ou pagamentos.
- Alteração de pagamento, endereço ou dados de compras elegíveis, com verificação/cancelamento da cobrança anterior e histórico da substituição.

### Administração

- Gestão de produtos, categorias arquivadas/restauradas, clientes e preços.
- Acompanhamento de pedidos, pagamentos em aberto e fila de despacho.
- Histórico específico de alterações de compras e comparação de dados.
- Sino de pedidos recentes, atualizado a cada 30 segundos enquanto a página está visível.
- Contato com o cliente pelo WhatsApp, sem depender de ele enviar o pedido manualmente.
- Protocolos de suporte e respostas administrativas, avisos transacionais em fila e ação explícita de pedido pronto para retirada.
- Captação consentida de interessados, importação de preço/estoque com prévia e lembretes administrativos persistentes.
- Histórico futuro das alterações em categorias, preservado após exclusão.

O sino não é uma notificação push: com o painel fechado, esse recurso não envia avisos automáticos por WhatsApp ou pelo navegador.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Aplicação | Next.js 16.4.3, React 19, TypeScript |
| Interface | Tailwind CSS 4, Lucide React, React Hot Toast |
| Estado | Zustand |
| Dados e autenticação | Supabase / PostgreSQL, Auth e políticas RLS |
| Pagamentos | SDKs do Mercado Pago para servidor e React |
| Validação e limites | Zod; limite compartilhado no PostgreSQL/Supabase em produção; Redis opcional no desenvolvimento |
| Testes | Node Test Runner; Playwright e PGlite em verificações adicionais |

## Executar localmente

Use Node.js 22.18 ou superior e npm para executar também os testes TypeScript e scripts auxiliares. O mínimo do framework instalado é Node.js 20.9, mas não cobre necessariamente esses scripts.

```bash
git clone https://github.com/lucasandare490/Vitrine_Ozonteck.git
cd Vitrine_Ozonteck
npm ci
```

Crie a configuração local a partir do modelo. No PowerShell:

```powershell
Copy-Item .env.example .env
```

Preencha as variáveis do ambiente apropriado e execute:

```bash
npm run dev
```

Abra o endereço informado no terminal, normalmente `http://localhost:3000`. Se a porta estiver ocupada, o servidor poderá selecionar outra. Não mantenha duas instâncias de desenvolvimento na mesma pasta.

### Variáveis de ambiente

O modelo está em [`.env.example`](.env.example). Nunca publique segredos no Git, em documentação ou capturas de tela.

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | URL pública canônica |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Conexão pública ao Supabase, protegida por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Operações privilegiadas exclusivamente no servidor |
| `DATABASE_URL` | Conexão PostgreSQL para scripts administrativos |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Chave pública do Mercado Pago |
| `MP_ACCESS_TOKEN` | Credencial secreta do servidor para pagamentos |
| `MP_WEBHOOK_SECRET` | Validação da assinatura das notificações |
| `MP_WEBHOOK_URL` | URL pública HTTPS terminada em `/api/webhook` |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Opcional no desenvolvimento; produção usa limite distribuído no Supabase com a migração `202611050001_database_rate_limit.sql` |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED`, `NEXT_PUBLIC_AUTH_FACEBOOK_ENABLED`, `NEXT_PUBLIC_AUTH_AZURE_ENABLED` | Visibilidade dos provedores de login |

Os provedores de login também precisam estar configurados no Supabase e nos respectivos serviços. Variáveis `NEXT_PUBLIC_*` são expostas ao navegador e incorporadas ao frontend: nunca use esse prefixo para segredos. Alterações exigem reinício/recompilação.

## Banco de dados

Leia o [guia do banco](supabase/README.md) antes de aplicar arquivos de [migração](supabase/migrations).

**A cadeia atual pressupõe tabelas preexistentes e não inicializa um banco vazio de forma completa.** Não execute um reset no banco da loja para instalar o projeto. Revise a estrutura, as políticas RLS e as dependências.

Scripts `install-*.cjs` são ferramentas administrativas e podem alterar o banco quando executados com opções de aplicação. Não fazem parte da inicialização normal. Um arquivo versionado não é prova de instalação remota.

## Testar pagamentos e túnel

A interface pode ser executada localmente, mas notificações externas do Mercado Pago exigem HTTPS acessível.

- `scripts/start-payment-sandbox.cjs`: ambiente isolado de teste; não equivale ao carrinho completo.
- `scripts/start-store-test.cjs`: inicia a loja na porta 3013 e cria um túnel Cloudflare. Usa o **banco existente** e, por padrão, credenciais de `.env.payment-test`; não isola os dados da loja.

O iniciador da loja foi preparado para Windows e espera o executável em `C:\Program Files (x86)\cloudflared\cloudflared.exe`. Define as URLs do site e do webhook no processo iniciado e registra o endereço em `sandbox-runtime/store-status.json`. As URLs autorizadas no Supabase Auth e as configurações externas precisam ser conferidas separadamente.

**A opção `--live` usa credenciais reais e pode gerar cobranças reais**, mesmo para produtos chamados “teste”. As flags `PAYMENT_SANDBOX` e `NEXT_PUBLIC_PAYMENT_SANDBOX` devem corresponder às credenciais e ao ambiente.

O túnel depende do computador e dos processos ativos. Ao desligá-los, o acesso é interrompido; um novo túnel pode receber outro endereço. Produção exige hospedagem permanente e domínio estável.

## Verificações

```bash
npm run lint
npm test
npm run test:components
npx tsc --noEmit
npm run build
```

Após um build bem-sucedido, `npm start` executa em modo de produção. Os serviços externos e as credenciais ainda precisam estar configurados.

Testes específicos com integrações simuladas:

```bash
node scripts/test-affiliate-checkout.cjs
node scripts/test-payment-webhook.cjs
node scripts/test-order-payment.cjs
node scripts/test-order-change-route.cjs
```

Scripts de navegador e SQL podem exigir instalações externas de Playwright/PGlite ou caminhos locais: confira o próprio script antes de executar. Eles não estão todos incluídos em `npm test`. Testes simulados não comprovam a operação real do provedor.

Para conferir a configuração destinada à publicação, sem criar pagamentos:

```bash
node scripts/check-payment-readiness.mjs
```

Essa checagem lê `.env`, não verifica serviços remotos e rejeita URLs locais ou de túnel temporário por não serem endereços definitivos.

## Antes da publicação

- Confirmar migrações e permissões no ambiente de destino, especialmente ciclo de pagamentos e histórico de alterações.
- Homologar cada meio oferecido, incluindo webhook, interface, persistência e estoque. Pix aprovado não comprova cartão ou boleto.
- Validar o cancelamento de cobranças no fluxo de alteração com o Mercado Pago; testes simulados não substituem essa verificação.
- Configurar a conta beneficiária correta. Trocar credenciais não transfere cobranças antigas; planeje o tratamento das pendências.
- Informar estoque físico e ocultar produtos de teste, preservando o histórico.
- Definir frete: atualmente ele é combinado com a loja e não está incluído no valor cobrado.
- Conferir login, retorno de autenticação, acesso administrativo e limites no domínio definitivo.

Documentação complementar:

- [Notificações por e-mail: configuração e estado de validação](docs/email-delivery.md)
- [Publicação e troca de conta](docs/publicacao-pagamentos-checklist.md)
- [Histórico de validação de pagamentos](docs/payment-validation-status.md)
- [Integração Orders: histórico da migração e limites de validação](docs/mercado-pago-orders-migration.md)
- [Revisão de continuidade e evidências datadas](docs/revisao-final-2026-11-04.md)
- [Revisão individual dos meios de pagamento e campos seguros](docs/payment-review-2026-11-04.md)
- [Preços de afiliados](docs/affiliate-pricing.md)

Os registros de validação são datados, não uma verificação contínua do ambiente.

### Conferência de 05/11/2026

Versão operacional `5db3391` confirmada publicada na Netlify (deploy `6aec539c7a698311a8bd32d7`). Suíte local: 137 aprovados, um HTTP condicional ignorado; componentes: 24/24; SEO público separado: 7/7; compilação de produção aprovada. Homologação isolada confirmou Pix, emissão de boleto, aprovação/recusa e 3DS de crédito, cancelamento e reembolso. Débito encontrou restrição da conta de teste. Não houve cobrança real nessa revisão. Todos os eventos remotos de e-mail e o ciclo completo sandbox com banco/webhook ainda não possuem comprovação individual. O Google ainda exibiu o resultado antigo; não há garantia de prazo para nova leitura. Consulte a revisão final para distinguir implementação, publicação, validação e dependências externas.

## Estrutura

```text
app/                    Páginas, conta, administração e rotas de API
components/             Interface e fluxos de compra
lib/                    Regras, integrações e utilitários
public/                 Arquivos públicos e imagens
scripts/                Verificações e ferramentas administrativas
supabase/migrations/    Alterações incrementais do banco
tests/                  Testes do Node Test Runner
docs/                   Regras, evidências e orientações
```

Para contribuir, siga [`AGENTS.md`](AGENTS.md). Antes de mudar APIs ou convenções do Next.js, consulte a documentação instalada em `node_modules/next/dist/docs/`.

### Acabamento de 05/11/2026

Paginação compartilhada e responsiva, artes oficiais nítidas no rodapé/Pix, condições dos meios sem promessa de débito liberado, campos de endereço acessíveis e título sem marca duplicada. Foram comprovadas gravações publicadas de segundo endereço/edição, interessado com contato concluído, lembrete concluído/reaberto e CSV no produto TESTE-001 com restauração dos valores originais. Registro sem dados pessoais em `docs/published-write-verification-2026-11-05.json`.

No plano atual, o painel Netlify exige upgrade pago para ocultar o selo; ele permanece visível, respeitando custo zero. Débito, compensação de boleto, prova integral de webhook/estoque/telas e todos os eventos de e-mail têm limites externos documentados. O controle do Chrome foi desativado durante a conferência. Consulte a atualização final para publicação e evidências, sem presumir que código no Git já esteja publicado.


### Indicador informativo no cadastro — 05/11/2026

As duas entradas de cadastro mostram força estimada enquanto a pessoa digita, sem exigir classificação mínima ou novas regras de composição. A avaliação é local; o mínimo de oito caracteres já existente permanece. Suporte recebido e respondido/resolvido foi comprovado em produção até o Gmail do titular autorizado; o primeiro aviso foi inicialmente para spam e a resposta chegou à entrada após marcar o primeiro como legítimo. Detalhes e limites estão em `docs/email-delivery.md` e na revisão final.
