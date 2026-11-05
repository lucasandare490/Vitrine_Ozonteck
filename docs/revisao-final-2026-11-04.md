# Revisão de continuidade — 04/11/2026

Este registro não declara conclusão integral do projeto.

## Evidências desta revisão

- `npm test`: 81 testes passaram, sem falhas. Abrange regras de pedidos, pagamentos Orders, endereços, carrinho, relatórios, conteúdo e notificações. Não comprova operação bancária nem entrega na caixa de entrada.
- Categorias já possuem arquivamento e restauração no código. Ainda é necessária a conferência do fluxo autenticado com persistência no banco.
- O suporte atual encaminha ao WhatsApp. Não existe protocolo interno que possa disparar legitimamente `support_received`; o modelo isolado não significa suporte recebido.
- Retirada pronta não possui estado operacional próprio. Não emitir esse e-mail ao aprovar o pagamento, pois aprovação não prova preparação concluída.
- O CardPayment instalado não oferece callback de foco por campo na interface pública. Não capturar dados de cartão nem depender de acesso ao conteúdo dos campos protegidos para implementar ajuda de CVV.
- A fila de despacho passa a exigir `approved`, em coerência com os totais financeiros. A atualização confirma retorno de uma linha do banco antes de informar sucesso.

## Dependências ainda abertas

- Conferir entrega real dos e-mails e ligar os eventos operacionais de suporte/retirada após implementar os respectivos fluxos.
- Revisão visual autenticada do cartão e validação individual dos meios de pagamento; não gerar cobranças durante inspeção.
- Concluir levantamento das referências e implementar recursos aplicáveis com persistência, permissões e regras definidas.
- Conferir arquivamento/restauração, produtos vinculados, múltiplos endereços e alterações com aviso administrativo na loja publicada.
- Google recebeu nome/descrição/ícone atualizados no site. A nova solicitação de leitura foi recusada por cota diária; a atualização do resultado depende de novo rastreamento.

Fiado e carnê excluídos; PWA futuro. A marcação de suporte e retirada acima identifica trabalho pendente, não uma restrição definitiva desses recursos.

## Continuidade em 04/11/2026 — incremento operacional

O titular confirmou expressamente a manutenção do checkout com Pix, cartão e boleto. A frase sobre não ter checkout no comando de continuidade foi esclarecida; nenhum fluxo de compra foi removido.

### Concluído e validado em testes locais e banco

- Suporte com protocolo por usuário, resposta administrativa e situação aberto/respondido/resolvido; limite de cinco solicitações por dia, MFA e isolamento por RLS. Eventos `support_received` e `support_updated` são enfileirados na mesma transação. O worker confere a conta verificada e o dono do protocolo antes de enviar.
- Retirada pronta com ação explícita no painel: exige pagamento aprovado, pedido em preparação e modalidade retirada. O cliente vê o aviso no próprio pedido. A aprovação financeira isolada não anuncia retirada. Mudanças que tornam a retirada inelegível invalidam o aviso pendente.
- Histórico futuro de categorias com autor, horário, operação e conteúdo antes/depois. Não recupera exclusões anteriores à instalação e não inventa categorias. Não houve reconstrução nem exclusão de registros antigos.
- Captação de interessados na página existente, com login e consentimento de contato; registro único por conta, alterações limitadas e situação administrativa persistente. Não libera benefício comercial nem substitui cadastro oficial.
- Importação de preço/estoque de produtos existentes com CSV separado por ponto e vírgula/tabulação, limite de 100, prévia e confirmação. Banco valida o lote inteiro, permissões e concorrência antes de gravar; preserva imagens, conteúdo, campos omitidos e categorias.
- Lembretes administrativos persistentes, com data, observações e conclusão/reabertura. Não enviam WhatsApp ou e-mail automaticamente.
- Editar endereço reutiliza o formulário existente, confirma retorno do banco e mantém a titularidade. Validação de CEP/UF/campos e proteção contra resposta atrasada de consulta de CEP foram acrescentadas.
- Sino passa a consultar apenas pedidos financeiramente aprovados e oferece acesso aos atendimentos abertos e ao histórico de alterações.
- Favicon inicial da Vercel substituído pelo símbolo já utilizado pela identidade da loja. Nome/descrição e prévias coerentes; sem foto pessoal e sem novas alegações comerciais.

### Instalação no banco remoto

Aplicadas em 04/11/2026, em transações separadas com registro e checksum em `continuity_migrations`:

1. `202611040002_category_audit.sql`
2. `202611040003_pickup_ready.sql`
3. `202611040004_support_tickets.sql`
4. `202611040005_join_interests.sql`
5. `202611040006_product_import.sql`
6. `202611040007_admin_reminders.sql`

Executor: `scripts/apply-continuity-migrations.mjs`; exige nomes permitidos explícitos, possui modo somente leitura, trava de instalação e falha se um arquivo já instalado mudar de checksum. Não repetir o setup antigo. Reversão operacional: voltar o código ao commit anterior; preservar tabelas e histórico novos. Remoção física dessas estruturas exige revisão e backup separados.

Testes SQL reproduzíveis: `check-support-tickets.mjs`, `check-pickup-ready.mjs` (71 verificações), `check-category-audit.mjs`, `check-join-interests.mjs`, `check-product-import.mjs` (88 verificações), `check-admin-reminders.mjs`. Todos passaram em PostgreSQL temporário; não criaram compras ou clientes no banco real.

### Implementado, mas ainda sem comprovação de ponta a ponta

- Telas novas, ações autenticadas e envio dos novos eventos precisam da conferência na versão publicada. Compilação não substitui essa etapa.
- Modelos e worker não comprovam recebimento na caixa de entrada. A sessão atual não tem `SMTP_USER`/`SMTP_APP_PASSWORD` locais; permanecem no serviço configurado. Não copiar senhas para o Git.
- Crédito, débito e boleto Orders ainda não têm prova individual de operação pelo provedor. Consulte `payment-review-2026-11-04.md`. O modo de homologação Orders ainda precisa ser integrado separadamente, sem alterar o ambiente real. Os testes legados não comprovam esse novo fluxo.
- Ajuda CVV fica restrita à opção cartão; SDK instalado não oferece callback público de foco nesse campo. Não acessar o conteúdo protegido nem capturar CVV para contornar essa limitação. Uma troca de formulário seguro precisa de implementação e validação próprias.

### Dependências externas observadas

- Controle do Chrome interrompido pela ferramenta por não conseguir confirmar a URL da janela. Tentativas de conexão às abas também expiraram. A revisão visual autenticada, Search Console e caixa de entrada não foram declaradas verificadas nesta continuação.
- Consulta pública HTTP: `/`, `/robots.txt`, `/sitemap.xml` e `/favicon.ico` responderam 200; sitemap continha 113 URLs. Essa consulta anterior à nova publicação não comprova o favicon novo.
- Google: nome do site não é o hostname. A identidade desejada é Ozonteck Recife; o endereço gratuito continua `ozonteck-recife.netlify.app`. A cota diária já recusou reindexação em 04/11; nenhuma nova solicitação foi repetida nesta continuação. A apresentação final depende de novo rastreamento e seleção automática do Google.
- Os dois sites de referência não puderam ser reabertos pela ferramenta de pesquisa nesta retomada; foram utilizados os levantamentos anteriores do repositório. Não se declara equivalência integral nem acesso renovado a todas as páginas.

### Manutenção

Suporte: `/suporte` e `/admin/suporte`. Interessados: `/junte-se-a-nos` e `/admin/interessados`. Lembretes: `/admin/lembretes`. Importação: expansão em `/admin/produtos`. Retirada: gerenciar um pedido elegível na visão geral. O remetente e as credenciais continuam exclusivamente em variáveis do serviço.

Monitorar estados `failed`/`skipped` da fila, falhas de instalação e divergências financeiras. Não reenviar automaticamente um e-mail com `ACCEPTED_ACK_UNCERTAIN`: pode ter sido aceito pelo SMTP apesar da falha de confirmação no banco. A confirmação de pagamento continua vindo do provedor, nunca de atualização manual para simular uma aprovação.

### Reconexão e publicação anterior conferidas

Após a reconexão solicitada pelo titular, a Netlify foi acessada na conta `lucasolucas2004@gmail.com`. O painel confirmou `5f404a9` publicado no deploy `6aeb10f9528eb95a76d91062`, com publicação automática da branch main habilitada. Esta evidência encerra a pendência de publicação daquele commit; não comprova publicação dos incrementos ainda locais desta continuação.

Conferência remota agregada salva em `production-increments-2026-11-04.json`: seis incrementos instalados, quatro tabelas novas com RLS, acesso de leitura do worker ao suporte e fila vazia. Pedidos preservados: oito entregue/pending, um preparando/approved, um pending/pending e uma reserva expirada. Nenhum legado foi aprovado manualmente.

SEO adicional: página inicial mantém a interface no componente `Storefront` e recebe canonical próprio por componente servidor. Páginas institucionais têm canonical específico; áreas privadas recebem `X-Robots-Tag: noindex, nofollow, noarchive`, sem canonizar todas as páginas como a inicial.

Verificação final antes da publicação deste conjunto: suíte com 105 aprovados, zero falhas e um teste HTTP condicional ignorado; executado separadamente com o servidor acessível, o conjunto SEO passou 7/7, incluindo esse teste HTTP. Build webpack e TypeScript passaram. Canonicals de início, suporte, distribuição e sobre responderam corretamente no servidor local; admin/login responderam com cabeçalho noindex. ESLint dirigido sem erros após correções. Primeiras tentativas HTTP locais falharam por isolamento de rede; o teste passou após servidor e teste usarem o mesmo contexto, sem alterar as expectativas.

### Publicação e entrega comprovadas após reconexão

- Commit `6d40ab9` enviado e confirmado publicado pela Netlify, deploy `6aebd6b106c15eb0590fbe81`. Os sete testes de SEO, incluindo HTML e imagens via HTTP, passaram contra a URL pública.
- `/admin/suporte` abriu autenticado, com as novas opções da navegação e consulta sem erro ao banco; nenhuma solicitação fictícia foi criada.
- Mensagem única de verificação, sem pedido ou cobrança, enviada exclusivamente para `ozonteckrecife2@gmail.com`. Recebida e aberta na caixa de entrada em 04/11 às 22:10 (Recife); remetente, conteúdo em português e link de suporte conferidos. Evidência: `evidencias/email-recebido-2026-11-04.png`. O envio usou o renderizador real e SMTP Gmail; não passou pelo worker agendado nem cria prova dos demais eventos individualmente.
- Filtro da auditoria corrigido após inspeção publicada: “Pedidos confirmados” exige a mesma regra dos relatórios. Legados ficam em Conferência financeira e Todo o histórico; pesquisa por referência preservada. Teste de regressão falhou antes da implementação e passou depois. Suíte seguinte: 106 aprovados, zero falhas e um HTTP condicional ignorado; build passou.
- Decisão após o titular delegar a escolha do formulário: preservar CardPayment enquanto não houver homologação segura de substituto. Textos do próprio campo CVV e cores usam a customização pública documentada, sem ler número/CVV. Abertura automática da ilustração no foco continua sem implementação no componente atual; não é declarada concluída.
- As duas referências foram reabertas no Chrome após a reconexão. A primeira mostrou vídeo, catálogo, oportunidades, contato e formulário de interessados. A segunda já estava autenticada como aquariano02d22: painel, estoque, clientes, histórico, relatórios, importação, textos de WhatsApp, metas e conta; a própria referência diz que notificações móveis dependem de publicação futura. Não copiar promessas de renda/saúde sem comprovação, cobrança premium, fiado/carnê nem tratar a prévia demonstrativa de comprovante como função real.

## Continuidade em 05/11/2026 — correções após revisão independente

- Suporte mantém assunto, mensagem, rascunho de resposta e identificador de repetição ao retornar à aba com a mesma conta. Trocar de conta limpa dados privados e invalida respostas antigas. Temporizadores são cancelados ao sair da tela. O login recebe somente destinos locais permitidos e retorna ao suporte; URLs externas, atalhos de administração e ciclos de login são rejeitados. A regra vale também no retorno OAuth e no cadastro com sessão imediata.
- Interessados/lembretes ignoram resultados antigos após mudança de filtro/página e após desmontagem. A conclusão de uma gravação recarrega o filtro atual. Os componentes reais foram executados em memória: 22 regressões falharam antes da correção, 24 testes passaram depois (dois eram controles). Comando de manutenção: `npm run test:components`.
- Formulário Orders substituído por Secure Fields oficiais, após o titular delegar essa decisão. Campos montados uma vez por entrada na opção cartão, sem coleta de número, validade ou CVV pelo site. Tipos e parcelas vêm do provedor, limitados às regras da loja; consulta vazia não inventa opções. Tokenização e clique duplo têm bloqueio, respostas antigas são descartadas e há limite visual de espera pelo carregamento. A ilustração CVV abriu no foco do campo real e sumiu no blur no Chrome. Captura: `evidencias/cvv-foco-2026-11-05.png`. A prévia local com envio desabilitado foi removida. Essa evidência comprova interação dos campos, não uma autorização bancária.
- Novos testes do trabalhador de e-mail verificam destinatário confirmado, titularidade, supressão de retirada obsoleta, tentativas e aceite com confirmação incerta. O trabalhador agendado foi observado na Netlify com execuções a cada cinco minutos até 00:40, sem erro nos registros exibidos. A mensagem de 04/11 continua sendo prova de SMTP/caixa de entrada, não ciclo completo da fila em produção.
- Testes Orders acrescentados para assinatura real HMAC, ID/horário/ambiente, conta divergente, leitura do provedor e conciliação nas quatro modalidades, com adaptadores de banco/provedor locais. O teste de preços no checkout legado voltou a passar sem relaxar regras; a dependência Orders não utilizada é explicitamente bloqueada no adaptador.
- Search Console confirmou URL indexada e HTTPS. A solicitação de nova leitura em 05/11 foi recusada por cota diária, com aviso adicional de conexão do reCAPTCHA. Não houve nova solicitação aceita e nenhuma repetição foi feita. Captura: `evidencias/google-cota-2026-11-05.png`.
- Mercado Pago exigiu nova validação por telefone; o titular informou não ter acesso ao celular do responsável e pediu deixar a etapa para depois. Nenhuma cobrança foi executada. A homologação individual com o provedor continua adiada por dependência externa.

### Limites que permanecem explícitos

Não há prova individual de emissão/liquidação Orders de todos os meios, nem de todo evento remoto de e-mail atravessando fila e caixa de entrada. Categorias antigas sem histórico não foram reconstruídas. Lucro, pontos e regras comerciais de outro sistema não são inferidos sem dados; fiado/carnê excluídos, PWA futuro. Nenhum serviço gratuito oferece promessa de disponibilidade para sempre; esgotar limites pode pausar a hospedagem. A aparência escolhida pelo Google não é controlada diretamente pela loja.

Verificação antes do envio desta continuação: `npm test` passou 126 testes, zero falhas e um HTTP condicional ignorado; `npm run test:components` passou 24/24. Build webpack completo e TypeScript passaram, sem a rota temporária de prévia. ESLint dirigido das correções passou sem erros. Os avisos anteriores de navegação por `window.location.assign` no login foram preservados nos ramos existentes; os novos retornos usam o roteador recomendado. O teste de checkout legado passou com adaptadores locais. As referências temporárias de tipos da prévia foram removidas somente do diretório gerado `.next-sandbox/dev/types`, após conferir o caminho absoluto; nenhum dado do projeto foi apagado.
