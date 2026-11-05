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
