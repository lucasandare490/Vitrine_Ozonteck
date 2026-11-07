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

## Conferência publicada e recuperação de consultas — 05/11/2026

### Concluído e validado

- `4ba273d5b2a534ab1412288905942110c231d08c` confirmado **Published** na Netlify, deploy `6aec00a3b2273641552b4875`, às 01:05 de Recife. Publicação automática da main permanece habilitada.
- Auditoria publicada: Pedidos confirmados contém somente a compra aprovada de R$ 9,99; Conferência financeira mantém oito legados fora do total. Relatórios com Todo o histórico apresentam o mesmo total, uma compra confirmada e oito divergências. Evidência: `evidencias/relatorio-publicado-2026-11-05.png`.
- Interessados e lembretes abriram autenticados com consulta sem erro e listas vazias; filtros foram trocados sem gravação fictícia. Sino abriu e mostrou pedido aprovado, acesso a atendimentos e histórico de alterações.
- Catálogo: editor de TESTE-001 abriu com dados existentes e foi cancelado. Prévia CSV mostrou preço R$ 9,99 e estoque 9998 → 9998; nenhuma confirmação de importação foi acionada. Nenhum produto foi alterado nessa conferência.
- Endereços: endereço salvo apareceu; Editar trouxe todos os campos preenchidos e Cancelar fechou sem gravar. Não se declara que essa inspeção somente leitura comprove uma nova gravação remota.
- Categoria `testeeeeee`, previamente conferida sem produtos ativos ou na lixeira, foi arquivada e restaurada **após autorização específica do titular**. Contagem voltou a oito ativas/zero arquivadas. Consulta somente leitura confirmou um registro ativo e duas entradas UPDATE no histórico: 01:24:08 e 01:26:49 de Recife, com responsável registrado e transições ativo → arquivado → ativo. Evidências: `evidencias/categoria-arquivada-2026-11-05.png` e `evidencias/categoria-restaurada-2026-11-05.png`. Nenhuma exclusão definitiva.

### Defeitos adicionais encontrados e corrigidos

- A área do cliente ainda incluía reserva expirada na aba Pedidos confirmados. Agora utiliza a mesma aprovação financeira dos relatórios; Preparando/Em rota/Finalizados também exigem aprovação. A nova opção Todo o histórico mantém cancelamentos, expirações e registros antigos. Pagamentos em aberto continua separado e acessível. Dois testes cobrem a classificação; sete testes relacionados de cliente/auditoria/relatório passaram.
- A consulta publicada de uma cobrança antiga foi bloqueada antes de acessar o provedor. O endereço Upstash configurado no serviço não resolvia DNS (`ENOTFOUND`), confirmado sem expor token. Em produção, o limite compartilhado agora usa o PostgreSQL existente: janela móvel, trava por rota/identidade, hash SHA-256 em lugar de identificador bruto, limpeza limitada e falha fechada. Não há liberação ilimitada nem contador por instância em produção.
- Incremento aditivo `202611050001_database_rate_limit.sql` instalado pelo executor com checksum. Tabela com RLS e sem acesso direto, inclusive para service_role; somente a função permite consumo pelo servidor. Anon/authenticated não podem ler/gravar ou executar essa função. Não altera tabelas financeiras.
- Testes SQL locais verificaram janela móvel, isolamento, expiração, parâmetros e permissões. No banco remoto, 12 chamadas concorrentes por oito conexões aceitaram exatamente três e negaram nove. A chamada autenticada pela Data API negou a seguinte com HTTP 200/false, comprovando o caminho usado pelo servidor. Contador técnico isolado; nenhum pedido/cobrança foi criado. Registro: `database-rate-limit-verification-2026-11-05.json`.
- Checkers locais e README atualizados para o backend de limite no banco. Presença de configuração continua sem equivaler a homologação de pagamentos.

### Verificações desta correção

`npm test`: 132 aprovados, zero falhas e um HTTP condicional ignorado. `npm run test:components`: 24/24. ESLint dirigido sem erros. A primeira compilação gerou JavaScript e passou TypeScript, mas falhou ao criar diretório gerado com EPERM no Windows; não foi declarada build aprovada. Repetição e publicação devem ser registradas abaixo após seu resultado.

A repetição da compilação webpack terminou com código 0, TypeScript e 29 páginas geradas. O servidor local antigo iniciado pela revisão foi encerrado; a repetição recebeu acesso ao diretório gerado bloqueado. Nenhuma mudança de código foi feita para contornar o erro de permissão.

### Limites mantidos

- Mercado Pago: acesso por telefone adiado pelo titular. Homologação individual, 3DS e emissão/compensação no provedor não estão comprovadas. Não houve cobrança real nesta revisão.
- E-mails: entrega SMTP à caixa da loja comprovada; eventos, fila e tentativas testados. Não foi feito pedido fictício nem enviado teste a clientes reais para declarar todos os eventos comprovados em produção.
- Google: URL indexada/HTTPS e identidade publicada; nova solicitação em 05/11 recusada por cota. Não registrar como pedido de indexação aceito.
- Histórico: não existe evidência para reconstruir categorias apagadas antes da trilha ou determinar a origem dos oito pedidos legados. Nenhum dado foi inventado/aprovado manualmente. Depoimentos preexistentes não foram classificados como falsos nem apagados sem evidências.
- Referências: recursos aplicáveis receberam implementação e testes; não se declara reprodução integral de sistemas externos. Fiado/carnê excluídos e aplicativo/PWA futuro. Valores de custo/lucro, pontuação e aniversário exigem dados/regras comerciais reais antes de inventar indicadores ou disparos.

## Retomada com Mercado Pago autenticado — 05/11/2026

### Concluído e validado

- `62733dbe6df21ee06cafc2678e447b3072f81b7e` publicado, deploy `6aec0abaf651cdf48285cc33`, Published em 05/11 às 01:50:12 de Recife. A consulta autenticada de pagamento antigo passou a mostrar expiração e opções de alteração. Nenhuma confirmação de alteração foi executada. Sete testes públicos de SEO passaram após essa publicação.
- Pedidos do cliente: Confirmados contém somente a compra paga de R$ 9,99; Todo o histórico contém as três compras da conta, preservando pendência e expiração. Captura `evidencias/pedidos-confirmados-2026-11-05.png`.
- Carrinho publicado: entrega/retirada alternaram os títulos e explicações; Novo endereço vazio bloqueou avanço; selecionar o endereço existente permitiu continuar. Etapa de pagamento com escolhas estilizadas e campos oficiais de cartão, ajuda CVV no foco/saída, sem remontagem nos cliques comuns. Uma carga inicial dos campos expirou; alternar Pix → Cartão recuperou. Carrinho original de um LifeShii, R$ 159,90, entrega/endereço original e Pix restaurados, sem gravação de endereço, tokenização ou cobrança produtiva. Captura segura `evidencias/checkout-publicado-2026-11-05.png`.
- Banco: consulta somente leitura às 05:50 de Recife confirmou sete incrementos instalados, RLS nas cinco tabelas novas, categoria de ensaio ativa e mesmos 11 pedidos: oito legados entregue/pending, um preparando/approved, um pending/pending e uma reserva expirada. Arquivo agregado `production-final-check-2026-11-05.json`, sem dados pessoais ou credenciais.
- Após o titular liberar o painel Mercado Pago, foram realizadas operações reais **no provedor de homologação**, isoladas do banco da loja. Pix aprovado, boleto emitido e depois cancelado, crédito aprovado e depois reembolsado, crédito recusado, desafio 3DS aprovado e recusado. GETs autenticados confirmaram os estados. Nenhuma transferência ou cobrança real. Evidências e fontes em `payment-review-2026-11-04.md`, `payment-provider-test-2026-11-05.json`, `payment-management-test-2026-11-05.json` e capturas 3DS.
- Painel produtivo: chave pública correspondente e webhook `https://ozonteck-recife.netlify.app/api/webhook/orders`, tópico Order. Nada foi substituído por teste, nenhuma credencial foi resetada e nenhum segredo integra o Git. O progresso visual do assistente de integração não é prova de aprovação bancária.

### Correções e recursos adicionais desta publicação

- Orders pode omitir `transaction_security.status` ao devolver `pending_challenge`. O normalizador agora reconhece o desafio pelo status_detail; ainda exige URL segura e validação integral da cobrança.
- Recusa SDK 402 com `data.id` recupera a cobrança por GET autenticado e valida ID, conta, aplicação, referência e valor. Nunca confia no status do corpo de erro. Timeout sem ID preserva resultado desconhecido/idempotência. O checkout mostra recusa compreensível em português e permite nova tentativa somente após resultado terminal conhecido.
- Carteira de clientes: seletor de modelos copiáveis Atendimento/Recompra/Retomar contato, personalizado pelo nome, link da loja e opção de não receber contato. Nenhum envio automático, promessa, dívida, desconto ou aniversário inventado. Completa o recurso aplicável de mensagens prontas das referências sem criar custos.
- TypeScript exclui o diretório gerado e já ignorado `out`. Arquivos de outra prévia local nesse diretório estavam entrando no glob global; foram preservados. Um literal da nova fixture foi tipado corretamente. Nenhum teste nem código de aplicação foi excluído para mascarar erro.
- Verificação: **137 testes aprovados, zero falhas, um HTTP condicional ignorado; 24/24 testes de componentes; ESLint dirigido sem erros; build webpack/TypeScript e 29 páginas aprovados**. O HTTP condicional é executado separadamente contra produção. Regressões novas observadas falhar antes e passar após correção. Revisão independente focada não encontrou defeito crítico/importante nos cinco arquivos de pagamento examinados.

### Implementado, mas não validado em todo o ciclo externo

- Fila de e-mails, eventos de suporte/retirada e demais notificações possuem testes SQL e worker. Entrega SMTP real na caixa da loja está comprovada em 04/11; cada evento ainda não foi exercitado individualmente por pedido remoto até a caixa de entrada. Não fabricar pedidos ou alterar retirada de venda real para obter essa prova.
- Persistência e autorização de endereços, CSV e novos cadastros cobertas por testes; a inspeção publicada acima foi deliberadamente sem novas gravações de ensaio. Categoria vazia foi a exceção especificamente autorizada e restaurada.
- Homologação acima não é um checkout completo de ponta a ponta com sessão, banco e recebimento público de webhook. Rotas/assinatura/persistência têm testes locais; produção não recebeu cobranças para esse fim. Boleto emitido não comprova compensação.

### Dependências externas e limites

- **Débito:** o cartão Elo de teste oficial retornou `payment_method_not_allowed_for_collector` (HTTP 400). Não declarar débito aprovado nem desativar a conta produtiva por inferência. A elegibilidade/liberação precisa ser conferida com o Mercado Pago. Não houve cobrança em cartão real.
- **Google:** identidade, título, descrição, favicon, canonical, sitemap e robots publicados; Search Console confirmou URL indexada/HTTPS. Nova solicitação em 05/11 recusada por cota diária, sem aceite. Nome/snippet/imagem dependem de nova leitura e seleção do Google; sem garantia de aparência ou prazo.
- **Histórico:** categorias excluídas antes da trilha não foram reconstruídas sem backup; oito legados financeiros preservados em conferência, sem origem inventada.
- **Escopo:** fiado/carnê excluídos; PWA futuro. Custos, pontos e aniversários não inventados. Não declarar 100% de sistemas externos ou hospedagem gratuita eterna; limites dos provedores podem pausar serviços.

Este registro substitui o adiamento de acesso ao Mercado Pago descrito anteriormente, sem apagar o histórico. A confirmação do próximo deploy deve ser registrada após a Netlify efetivamente publicá-lo.

## Publicação final conferida — 05/11/2026, 10h38 de Recife

**Concluído e validado:** Netlify exibiu Published para `5db3391c5a84718affc2d9fda589390b9efdb13d`, deploy `6aec539c7a698311a8bd32d7`. Build remoto começou às 06:59:57 e terminou às 07:01:12 (1m15s), com duas funções publicadas. A consulta HTTP posterior confirmou que `/lista` e `/admin/clientes` usam os mesmos arquivos JavaScript do permalink desse deploy, contendo a mensagem nova de recusa e os modelos de contato. `robots.txt` e `sitemap.xml` responderam 200. Evidência: `public-deploy-verification-2026-11-05.json`. Os sete testes SEO, incluindo HTTP público, passaram novamente nesta retomada.

Na sessão administrativa, o seletor Atendimento/Recompra/Retomar contato apareceu. Recompra e Retomar contato foram copiados e conferidos: texto correspondente, link da loja e preferência de contato. Nenhuma mensagem foi enviada; o clipboard anterior foi restaurado. Busca e modelo padrão foram restaurados após a conferência. Captura `evidencias/clientes-modelos-publicados-2026-11-05.png` usa busca sem resultado para não publicar nomes, telefones ou endereços de clientes. A captura do painel Netlify falhou por tempo de resposta; não há arquivo dessa captura e não é usada como evidência.

**Google observado, ainda sem atualização visual:** pesquisa `ozonteck recife netlify` às 10h38 mostrou a loja com o nome de origem “Netlify”, o título antigo “Ozonteck | Loja Virtual Recife” e a descrição anterior. Arquivo `evidencias/google-resultado-2026-11-05.png`. Isso é evidência do resultado atual dessa pesquisa/sessão, não posição universal nem resultado garantido para outras pessoas. O HTML publicado contém a identidade nova validada; não registrar a aparência do Google como corrigida. A cota diária já havia impedido nova solicitação, sem novo aceite nesta data.

**Implementado, mas sem validação integral externa:** todos os eventos de e-mail passando individualmente por gatilho remoto → fila → worker → caixa de entrada; checkout sandbox completo com sessão/banco/webhook externo; novas gravações publicadas de endereço/importação/interessados/lembretes além dos testes SQL e de interface sem confirmação. SMTP recebido e campos CVV conferidos não substituem essas provas. As rotas, políticas e persistência possuem os testes descritos acima; não há autorização para criar cobranças reais ou alterar pedidos de clientes só para completar evidência.

**Dependências externas:** elegibilidade de débito na conta de homologação, compensação real de boleto e escolha/rastreamento do Google. Recuperação histórica de categorias exige backup/log anterior, não encontrado. Não declarar conclusão integral ou equivalência de 100% com os sites de referência.

**Manutenção:** antes de atualizar produção, executar `npm test`, `npm run test:components`, lint dos arquivos alterados e `npx next build --webpack`. Não editar migrações instaladas; usar incremento novo e executor com checksum. Credenciais ficam somente nas variáveis da hospedagem e arquivos locais ignorados. Para verificar resultados sandbox já criados, `node scripts/refresh-orders-sandbox-results.mjs` apenas consulta, exigindo `.env.orders-test.local` e vendedor test_user. O script de criação de ensaios é explícito e não deve ser executado com credenciais produtivas. Falha SMTP aceita com confirmação incerta requer revisão, sem reenvio automático. Consultar este registro e `email-delivery.md` antes de intervir na fila. Nenhum custo, domínio pago ou plano contratado nesta revisão.

## Acabamento e gravações controladas — 05/11/2026, 12h27 de Recife

### Concluído e validado antes da publicação deste incremento

- Paginação compartilhada em catálogo, listas da conta/administração que usam PaginatedGrid, avaliações, moderação, suporte, interessados e lembretes. Alvos de toque de 44px, foco visível, página atual acessível, estados desabilitados e indicador compacto no celular. Listas sem total continuam com `hasNext`, sem inventar última página. Os carregadores e suas proteções contra respostas antigas foram preservados. Prévia real em 390×844 e 1280×900: `evidencias/paginacao-mobile-2026-11-05.png` e `evidencias/paginacao-desktop-2026-11-05.png`.
- Formas de pagamento: Pix e Elo originais em resolução adequada, Mastercard vetorial oficial, proporções preservadas, nomes legíveis e boleto com ícone vetorial genérico. Rodapé informa que opções/parcelas dependem da consulta no pagamento e da aprovação. O cartão não promete débito liberado. Fontes em `public/payments/SOURCES.md`; capturas `evidencias/pagamentos-mobile-2026-11-05.png` e `evidencias/pagamentos-desktop-2026-11-05.png`. Lógica de criação/cobrança permaneceu intacta.
- Corrigidos nomes acessíveis dos campos de endereço e duplicação do sufixo de marca no título de Junte-se a nós.
- Endereços publicados: adicionado o endereço público da unidade como segundo local, editado o apelido para “Loja Recife (verificação concluída)” e recarregada a página. O endereço residencial original permaneceu principal. Consulta posterior confirmou dois endereços e exatamente um principal. Não há confirmação de seleção do novo local no checkout nesta rodada: o navegador foi desativado antes dessa etapa.
- Interessados: formulário público gravou um único registro `[VERIFICAÇÃO AUTORIZADA] Unidade Recife`, usando contato da própria loja. Registro apareceu na administração e foi marcado como Contato realizado. Nenhuma mensagem foi enviada.
- Lembretes: um registro técnico identificado foi criado, persistiu após recarga, foi concluído, reaberto e concluído novamente. Foi deixado concluído para não gerar tarefa comercial pendente.
- CSV: primeira confirmação com valores iguais retornou corretamente zero atualizações. Depois TESTE-001 teve estoque 9998 → 9999 pela prévia/confirmar da interface e foi restaurado para 9998 pelo mesmo fluxo. Ambas as gravações retornaram uma atualização. Preço permaneceu R$ 9,99. Captura `evidencias/csv-confirmado-2026-11-05.png`; leitura final do banco comprova preço e estoque originais. Nenhum produto comercial ou venda foi alterado.
- Evidência somente leitura, sem nomes/endereço pessoal/credenciais: `published-write-verification-2026-11-05.json`. Confirma as quatro gravações, oito legados sem ID de pagamento/checkout e fila de e-mail vazia.
- Revisão independente do incremento não encontrou defeito importante; 27 testes dirigidos da paginação/componentes passaram na revisão. Suíte do projeto: 140 aprovados, zero falhas, um HTTP condicional ignorado. Componentes: 24/24. Lint dirigido sem erros; compilação webpack/TypeScript aprovada. Não foi executada alteração de estrutura do banco.

### Dependências externas e verificações ainda não concluídas

- **Selo Netlify:** a conta autenticada mostrou “This feature is available on paid plans” / “Upgrade your team’s plan to hide the badge on this project”, sem chave para desligar no plano atual. Isso contradiz a interpretação anterior da documentação. Não foi contratado plano, não foi usado CSS para contornar o bloqueio de plano e o selo continua visível. Custo zero foi preservado. Captura `evidencias/netlify-selo-plano-2026-11-05.png` é parcial; não substitui o texto observado no painel.
- **Pagamentos:** consulta autenticada apenas de leitura aos ensaios existentes confirmou novamente Pix aprovado, crédito com aprovação/recusa e 3DS, boleto cancelado e crédito estornado. Não criou cobranças. Débito continua com `payment_method_not_allowed_for_collector`; precisa de elegibilidade do provedor. Compensação de boleto e ciclo completo checkout público → provedor → webhook externo → banco/estoque → duas telas continuam sem prova integral. Não enfraquecer a separação de produção para forçar testes.
- **E-mails:** o endereço da loja tem caixa de entrada, mas não havia conta Auth correspondente. As duas sessões da vitrine estavam com a conta administrativa do responsável. A revisão automática bloqueou a tentativa de entrar com a conta pessoal de Lucas para a prova de suporte, por considerar destino diferente do controlado da loja. O login não foi concluído. Não criar conta/impersonar destinatário nem substituir e-mail verificado para contornar a restrição. O controle local do Chrome foi desativado em seguida. A fila remota continuava vazia; entrega SMTP anterior não comprova os eventos ponta a ponta. Falta uma sessão cliente autorizada com caixa acessível para cada prova remota; não enviar a clientes comerciais.
- **Alteração de compra/notificação e seleção de múltiplos endereços no checkout:** testes locais existentes não substituem gravação integrada publicada. Sem sessão/provedor de homologação completa e com Chrome desativado, não foram feitas novas cobranças nem alterações em compras reais.
- **Histórico:** os oito legados entregues sem aprovação são de 15/09/2026, não possuem ID de pagamento nem checkout. Isso não prova origem demonstrativa e não autoriza aprovação/remoção. Categorias antigas continuam dependendo de backup/log anterior não localizado. Trilha nova de arquivar/restaurar continua instalada e foi validada anteriormente.
- **Google:** ainda depende da nova leitura e seleção do buscador; cota diária já recusou solicitação nesta data. Não foi repetida nem houve novo aceite. Não prometer nome, ícone, posição ou prazo.
- **Navegador:** interrupção por configuração de acesso impediu captura final pública e restauração das sobreposições temporárias de viewport. Repor tamanho normal das janelas ao recuperar o acesso. Sessão do Chrome 4 continuou administrativa; o Chrome 3 foi desconectado da vitrine ao preparar a conta cliente e ficou no seletor Google. Nenhuma credencial foi alterada.

### Manutenção deste incremento

O componente `components/Pagination.tsx` é a fonte única dos controles; `lib/pagination.ts` limita a janela de números sem criar arrays proporcionais ao total. Teste `tests/pagination.test.ts` exercita o componente real com o renderizador isolado de `scripts/pagination-test-renderer.mjs`. Manter `npm run test:components` para detectar regressões nas listas assíncronas. Assets de marca foram obtidos de fontes oficiais, sem redesenhar logotipos. Usar o histórico de evidências para diferenciar prévia local, escrita publicada e versão efetivamente implantada. A confirmação do deploy deste incremento será acrescentada depois da leitura pública.

## Retomada autorizada e indicador de senha — 05/11/2026, 13h13 de Recife

- O titular reativou o Chrome e autorizou especificamente usar sua conta pessoal na loja e receber os avisos de verificação. A sessão já estava autenticada como Lucas, com e-mail verificado; a senha fornecida não precisou ser usada, alterada, registrada em arquivo ou salva no navegador. A limitação de login descrita acima deixou de bloquear o protocolo de suporte.
- **Suporte validado ponta a ponta:** protocolo técnico criado pela interface publicada; apareceu no admin, foi respondido/resolvido pela interface e a resposta apareceu na conta cliente após recarga. Fila → worker agendado → SMTP → Gmail comprovados nos dois eventos, uma tentativa e nenhum erro em cada envio. Primeiro aviso inicialmente em spam, marcado legítimo nessa caixa; segundo chegou à entrada. Não extrapolar isso para os outros eventos nem prometer entrega fora de spam. Evidência datada: `support-delivery-verification-2026-11-05.json` e `email-delivery.md`.
- **Endereços no checkout:** após recarregar a aba antiga, apareceram os dois locais persistidos. O local secundário foi selecionado (`aria-pressed=true`), depois foi restaurado Casa. Retirada mudou a seção para Endereço de cobrança e explicou que não seria entrega; o resumo indicou Retirada na loja. Restaurados entrega, endereço original e etapa Carrinho, preservando Life Shii ×1/R$ 159,90. Não houve geração de cobrança.
- **Publicação do acabamento anterior:** a leitura pública de 05/11 às 12:35 confirmou os assets oficiais, paginação compartilhada, texto novo do cartão e título sem duplicação. Os três assets responderam 200 com tipos corretos, e os sete testes SEO públicos passaram. `public-acabamento-verification-2026-11-05.json` registra os arquivos JavaScript efetivamente servidos. Essa prova não afirma um ID privado de deploy.
- **Indicador solicitado:** componente informativo em cadastro completo e modal; quatro segmentos e Fraca/Razoável/Boa/Forte, atualizado localmente enquanto se digita. Não exige pontuação mínima, símbolos ou maiúsculas, não altera o mínimo de oito caracteres já existente no cadastro e não participa dos handlers de validação/envio. Não mostra resultado vazio nem aparece no login/recuperação. Não transmite, registra ou armazena a senha; texto explicita estimativa e orientação, sem garantir segurança absoluta.
- A revisão independente encontrou um caso real de blocos longos repetidos avaliados como fortes. O teste reproduziu a falha antes da correção; após detectar repetição de blocos de qualquer tamanho dentro da amostra limitada, passou. Os cinco testes da estimativa/componente real passaram; suíte atualizada: 145 aprovados, zero falhas, um HTTP condicional ignorado. Componentes existentes: 24/24; lint dirigido zero erros, mantendo seis avisos anteriores de navegação no login. Build/TypeScript aprovados após a correção. Prévia real do cadastro passou em desktop e 390×844, com exemplos fictícios limpos sem submeter cadastro ou alterar credencial.

Continuam sem comprovação integral os outros eventos remotos de e-mail, o ciclo completo de pagamento com webhook externo e as limitações do provedor/Google/histórico/plano já registradas. Não declarar conclusão integral. A confirmação da publicação do indicador será registrada após o envio e a conferência remota.

A segunda entrada de cadastro (modal no carrinho) também foi aberta em prévia local e conferida com exemplo fictício; mostrou Fraca e manteve o botão de cadastro independente do nível. O valor foi limpo e o único item acrescentado ao carrinho local foi removido. Capturas `evidencias/senha-indicador-fraca-2026-11-05.png`, `evidencias/senha-indicador-forte-2026-11-05.png`, `evidencias/senha-indicador-mobile-2026-11-05.png` e `evidencias/senha-indicador-modal-2026-11-05.png`. As capturas dos três avisos do Gmail ficam apenas no computador do titular; a revisão automática bloqueou a divulgação em repositório público. Nenhuma captura de caixa pessoal é incluída neste incremento.

### Publicação do indicador comprovada — 05/11/2026, 13h24 de Recife

Netlify exibiu **Published** para `d7fd28b3d93f6df6aa828edb09c08b6742142534`, deploy `6aecad29bc0dcbbea8d5b199`. Consultas HTTP confirmaram que `/login` e `/lista` servem os mesmos chunks do permalink exato desse deploy e contêm o componente informativo. Evidência sanitizada: `password-strength-deploy-verification-2026-11-05.json`. Não confundir esse incremento com conclusão dos outros eventos financeiros/e-mails ainda pendentes. As duas janelas tiveram o tamanho normal restaurado; a prévia local desta rodada foi fechada e seu servidor encerrado. Documentação complementar será enviada com `[skip ci]`, sem novo build pago/consumo de publicação desnecessário.

## Retomada de 07/11/2026

- **Produção verificada por HTTPS.** A página inicial respondeu 200. `/login` e `/lista` serviram os mesmos arquivos JavaScript do deploy `6aecad29bc0dcbbea8d5b199` e os dois continham o indicador de força da senha. A branch `main` remota apontava para `ff5d0e1`, que contém apenas a atualização documental posterior ao deploy.
- **Google.** Passaram as sete verificações de SEO com a URL de produção, incluindo identidade, indexabilidade e arquivos de marca. O sitemap publicado contém 113 URLs da loja e está anunciado no `robots.txt`. O controle do Chrome estava desativado em Uso do computador. Nesta data não foi possível reabrir o Search Console, consultar a cota, solicitar novo rastreamento ou confirmar a aparência do resultado.
- **Verificação local.** `npm test` teve 145 aprovações e uma verificação HTTP condicional, executada à parte com `NEXT_PUBLIC_SITE_URL` e `SEO_TEST_BASE_URL` iguais ao endereço de produção. Passaram 24 testes de componentes, 71 verificações SQL de retirada pronta e os scripts locais de suporte, fila de e-mail, ciclo de estoque e alteração de compra. Esses resultados cobrem permissões, deduplicação, tentativas e proteção contra alterações após aprovação, dentro do ambiente de teste.
- **Ainda a validar.** Checkout Orders com sessão, webhook entregue pelo provedor, estoque e telas em um único fluxo de homologação. Alteração de compra com aviso administrativo na versão publicada. Entrega individual dos e-mails de boas-vindas, pedido, pagamento, status e retirada pronta. O suporte já tem [evidência de entrega](support-delivery-verification-2026-11-05.json). As demais gravações controladas do plano de acabamento já têm evidência publicada.
- **Dependências externas.** O coletor de homologação recusou o débito. O [teste oficial de boleto Orders](https://www.mercadopago.com.br/developers/en/docs/checkout-api-orders/integration-test/boleto) cobre a emissão e exige pagamento real para atingir o estado final. O selo continua dependente de plano pago segundo a última consulta ao painel Netlify. Os oito pedidos antigos aguardam comprovante de pagamento e a recuperação de categorias antigas exige backup ou log anterior. Custo, margem, pontos e aniversários exigem dados e regras comerciais. Fiado e carnê foram retirados do escopo e PWA ficou para uma etapa futura.

### Conciliação de pagamentos corrigida em produção

- A comparação em modo somente leitura mostrou que `processar_status_pagamento` ainda correspondia à definição de `202609240002_security_hardening.sql`. Faltavam as proteções posteriores contra notificações atrasadas e repetidas e o tratamento de reembolso. Cancelar um pagamento com reserva liberava o estoque, mas registrava `pagamento_recusado`, deixava o retorno da função divergente do estoque e impedia o gatilho `order_cancelled`.
- A migração `202611070001_payment_cancellation_status.sql` incorpora as proteções testadas de `202610130002_payment_lifecycle.sql` e corrige a transição de cancelamento. Foi aplicada ao Supabase em transação pelo executor autorizado. A consulta posterior confirmou o checksum, o corpo da função e a execução restrita a `service_role` entre as funções de acesso da aplicação. A migração altera a definição da função. Nenhuma compra, cobrança ou mensagem de verificação foi criada durante a aplicação.
- A regressão foi reproduzida antes da correção e passou em PostgreSQL isolado com a definição anterior e a fila real. O teste confirma cancelamento, devolução única do estoque, evento de e-mail único e preservação de status em notificações repetidas ou atrasadas. Também passaram 145 testes da suíte, as 71 verificações de retirada e os testes SQL de alteração e fila. O ambiente local simula a conciliação sem comunicação com o provedor ou uma caixa de entrada.
- A consulta agregada da fila em produção encontrou um `welcome` e os dois eventos de suporte com estado `sent`. O e-mail de boas-vindas não pertence às caixas autorizadas para verificação. O registro comprova envio pelo worker, enquanto a chegada à caixa de entrada continua sem evidência para esse evento.
- Reversão, se necessária: restaurar em transação apenas a definição da função a partir de `202609240002_security_hardening.sql`, preservando assinatura, proprietário e ACL. Usar uma nova migração revisada e manter o histórico do executor. Executar o arquivo completo de configuração histórica pode alterar estruturas e dados fora do escopo.

### Checkout Orders integrado com homologação — 07/11/2026

- A rota real de checkout falhou com `ORDER_IDENTITY_MISMATCH` ao criar boleto pelo vendedor de teste. A função de reserva devolve um resumo sem `checkout_id`, o que foi confirmado também no Supabase publicado. A referência usada pela rota agora é a mesma chave enviada à reserva, à cobrança e ao cabeçalho de idempotência. O total é o já validado pelo servidor e o pagamento gravado continua sendo reutilizado.
- A consulta somente leitura ao provedor encontrou quatro cobranças correspondentes às três reservas Orders sem vínculo. As quatro constavam como canceladas, com conta, aplicação, referência e valor coincidentes. Nenhum vínculo foi preenchido manualmente.
- `node scripts/check-orders-checkout.mjs` usa exclusivamente um vendedor de teste identificado pelo Mercado Pago, banco local descartável e uma caixa local capturada em memória. Passaram emissão do boleto, consulta limitada ao titular, repetição da tentativa, cancelamento, devolução única do estoque, compra substituta, leitura do histórico administrativo, aprovação do Pix, repetição do callback assinado e exibição pelos filtros compartilhados. Os eventos de boas-vindas, pagamento pendente, cancelamento, alteração, pagamento aprovado, retirada pronta e entrega saíram da fila real e chegaram à caixa local. A assinatura do callback foi gerada pelo teste. A entrega pública do webhook e a chegada ao Gmail permanecem separadas.
- A retentativa isolada de débito não aprovou uma cobrança de teste. A consulta da conta listou Elo débito como ativo, mas essa listagem não certifica aprovação pela Orders. A negativa anterior da homologação e a falta de compensação de boleto continuam registradas na revisão de pagamento.
- Suíte: 145 aprovações e um teste HTTP condicional. ESLint e TypeScript dirigidos passaram. A compilação webpack gerou as 29 páginas e as rotas dinâmicas previstas.
