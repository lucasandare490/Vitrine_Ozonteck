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
