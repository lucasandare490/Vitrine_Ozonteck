# Auditoria final: progresso verificado em 2026-10-03

Estado: parcial. Este registro nao declara o projeto pronto para publicacao.

## Estado mais recente: prevalece sobre os registros cronologicos abaixo

- As quatro RPCs de pagamento/estoque estao restritas ao servidor, conforme verificacao anterior.
- Com autorizacao explicita, foram instaladas em uma unica transacao as atualizacoes `202609270001_product_review_submission.sql` e `202609270002_store_review_journey.sql`.
- A primeira tentativa foi revertida integralmente: a atualizacao de publicacao encontrava avaliacoes legadas sem pedido, permitidas por um CHECK NOT VALID antigo. A migration foi ajustada para suspender e restaurar exatamente os CHECKs nao validados durante o backfill, sob bloqueio exclusivo e dentro da mesma transacao. Nenhuma restricao fica removida apos COMMIT.
- Teste local acrescentado para esse caso: registros legados preservados, CHECK restaurado como NOT VALID e novos registros sem pedido continuam rejeitados. O teste completo de avaliacoes da loja passou.
- Instalacao concluida e verificada: `itens_avaliaveis`, `enviar_avaliacao_produto` e `listar_avaliacoes_loja` existem; as duas primeiras nao permitem anon e permitem authenticated; a ultima permanece publica.
- Comparacao por contagem e hash confirmou preservacao de todos os campos preexistentes de produtos, pedidos e avaliacoes, alem da mesma projecao publica de avaliacoes antes/depois. Apenas campos/objetos previstos nas migrations foram acrescentados. Evidencia externa: `review-updates-result.json`, na pasta de diagnostico citada abaixo.
- Trigger de protecao de produto ligado a pedido instalado. O envio por RPC exige dono do pedido, entrega e produto pertencente ao pedido; restricao unica existente impede duplicacao.
- Consulta real da API publica `listar_avaliacoes_loja`: HTTP 200, estrutura valida e ausencia de user_id/pedido_id na resposta. Nenhuma avaliacao real criada para teste.
- Jornada no navegador com requisicoes Supabase interceptadas passou em 320, 390 e 1440 px: avaliacao individual, experiencia de compra separada, detalhes do pedido, publicacao pelo admin de criticas de produto e loja, sem overflow na pagina de pedidos verificada. Script agora aceita TEST_BASE_URL, padrao localhost:3002.
- Inventario remoto atualizado: 19 funcoes publicas, 31 policies public/storage, 12 triggers nao internos e 23 indices publicos. As oito tabelas publicas continuam com RLS.
- Build mais recente aprovado; lint global sem erros e com nove avisos de navegacao. Cinco alertas de desenvolvimento permanecem na cadeia braces; nao representam cinco falhas independentes demonstradas no site.
- Ainda pendentes: exclusao de conta/retencao, revisao integral de autorizacao/Storage, concorrencia nas categorias, cobertura integral do admin e acessibilidade, performance medida, limpeza consolidada, pagamentos sandbox/webhook e HTTPS externo. Nao considerar o prompt mestre concluido.

Os itens seguintes preservam o historico da auditoria. Referencias a RPCs ausentes, ausencia de escritas remotas e lint global com erros descrevem etapas anteriores, nao o estado atual.

## Acesso e evidencias

- Projeto remoto: `tnqdecfmpkmnihpctumo`.
- Conexao PostgreSQL direta validada com certificado CA oficial do Supabase e verificacao TLS habilitada.
- Credenciais carregadas do `.env`, sem serem copiadas para este relatorio.
- Inspecao inicial executada com `default_transaction_read_only=on`. Posteriormente, com autorizacao explicita do usuario, foram alteradas somente as permissoes das quatro RPCs de pagamento/estoque; detalhes abaixo.
- A autenticacao e descoberta de ferramentas do MCP funcionam; ferramentas nao foram disponibilizadas diretamente nesta conversa. A consulta SQL direta removeu esse bloqueio para a estrutura do banco, nao para todas as configuracoes de conta/painel.
- Inventario remoto salvo fora do repositorio em `C:\Users\lucas\Documents\Codex\supabase-connection-diagnostic\schema-audit.json`. Contem metadados e definicoes; nao contem linhas de clientes, pedidos ou credenciais.
- Inventario e copia anterior do repositorio: `C:\Users\lucas\Documents\Codex\auditoria-ozonteck-2026-10-03`.

## Banco: estado real consultado

8 tabelas publicas, todas com RLS habilitado: avaliacoes, avaliacoes_produtos, categorias, enderecos, favoritos, pedidos, produtos e profiles.

Tambem foram extraidos: 1 view publica, 14 funcoes publicas, 29 policies em public/storage, 10 triggers nao internos em public/auth/storage, 21 indices publicos e 3 buckets. RLS habilitado nao prova que as policies sejam suficientes.

### Bloqueadores e riscos

**Atualizacao verificada:** o item 1 abaixo registra a descoberta original, agora corrigida. Apos autorizacao explicita nesta conversa, as quatro funcoes perderam EXECUTE de PUBLIC, anon e authenticated, mantendo service_role. Aplicacao transacional e leitura apos COMMIT confirmaram anon=false, authenticated=false e service_role=true para todas. Nenhuma funcao foi executada como teste de pagamento; nenhum dado comercial foi alterado. As demais partes da migration (triggers e outras RPCs) NAO foram aplicadas. Evidencia e ACLs anteriores em `C:\Users\lucas\Documents\Codex\supabase-connection-diagnostic\payment-permissions-result.json`.

1. **Critico: RPCs de pagamento/estoque acessiveis a clientes.** `processar_status_pagamento`, `reservar_pedido_checkout`, `cancelar_reserva_checkout` e `liberar_reservas_expiradas` permitem EXECUTE para anon e authenticated. As duas primeiras sao SECURITY DEFINER e nao possuem verificacao interna de papel de servidor. A primeira aceita status/valor informados pelo chamador; a segunda aceita total e dados do pedido. Evidencia: privilegios e definicoes consultados, sem explorar ou executar essas funcoes. Existe correcao local em `supabase/migrations/202609290001_function_execute_permissions.sql`; nao foi aplicada nesta auditoria. Revisar e aplicar com autorizacao especifica, depois conferir privilegios e testar o backend.
2. **Fluxo novo de avaliacoes incompleto no remoto.** Ausentes `itens_avaliaveis(uuid)`, `enviar_avaliacao_produto(uuid,uuid,integer,text)` e `listar_avaliacoes_loja(integer)`. As migrations de 20260927 existem localmente. Nao executar toda a cadeia cegamente: comparar objetos/dependencias antes.
3. **Historico de migrations indisponivel.** `supabase_migrations.schema_migrations` nao existe. Isso nao prova que nenhum SQL foi executado manualmente. O estado deve ser confrontado por objetos, nao apenas por nomes de arquivos.
4. **Exclusao de conta exige decisao de retencao.** `auth.users -> profiles` e `profiles -> pedidos` usam ON DELETE CASCADE. Enderecos e avaliacoes possuem outras referencias sem cascata. Excluir usuario pode bloquear ou apagar historico dependendo das dependencias. Nenhuma exclusao ou teste destrutivo foi realizado.
5. **View legada de avaliacoes.** `public_reviews` seleciona apenas notas >= 4 e abrevia nomes. Nao representa todas as avaliacoes da loja. Nao substituir por security_invoker sem revisar o acesso subjacente.

MFA: confirmada configuracao `pgrst.db_pre_request=public.enforce_account_mfa` no papel authenticator e policy restritiva no Storage. A existencia desses mecanismos nao substitui teste completo de autenticacao.

## Alteracoes locais aplicadas

- Produtos explicitamente marcados como teste sao filtrados da Home (incluindo eventos realtime), favoritos, compra rapida e indice de catalogo.
- Pagina individual trata produtos de teste como nao encontrados; checkout rejeita esses produtos.
- Nenhum registro foi excluido: os cadastros continuam disponiveis no banco/admin e historicos permanecem intactos.
- Foram encontrados 4 produtos de teste nao excluidos e 1 ja excluido logicamente. Cadastros suspeitos sem marcacao explicita nao foram automaticamente removidos.
- Pagina de produto: conteudo limitado a 1200 px; galeria de ate 280 px em celular e 480 px em telas maiores; duas colunas a partir de 640 px; titulo e preco com proporcoes menores. Preservados textos, especificacoes, zoom, lista e WhatsApp.

## Validacao

### Atualizacao posterior autorizada

- Restricao das quatro RPCs aplicada no Supabase e verificada apos COMMIT, conforme registro acima. A afirmacao de nenhuma escrita remota nas etapas anteriores vale apenas para aquelas etapas.
- Checkout e webhook usam `SUPABASE_SERVICE_ROLE_KEY`; o acesso desse papel permanece autorizado. Pagamento ponta a ponta continua nao validado.
- `eslint-config-next` alinhado com Next.js 16.3.6; duas dependencias brace-expansion atualizadas dentro das faixas compativeis. Alertas de desenvolvimento reduzidos de seis para cinco, todos na cadeia braces/micromatch/fast-glob/plugin Next/config Next. A versao publicada de braces consultada continua 3.0.3, afetada pelo alerta; nao foi forcado downgrade para Next 14 nem ocultado o resultado.
- Configuracao de lint reconhece `require` apenas em arquivos `.cjs`, preservando todas as demais verificacoes e os relatorios historicos.
- Acoes que ainda exigem o titular: renovar os segredos do Mercado Pago expostos nas capturas e disponibilizar as novas credenciais de teste no ambiente local, sem envia-las pelo chat. Nao usar cobrancas reais para validar o projeto.

### Continuacao: admin e dependencias

- Admin de categorias: consulta dependencias antes de excluir, incluindo produtos na lixeira; falha da consulta ou contagem indisponivel bloqueia a operacao. Exclusao sem linha retornada nao gera sucesso falso. Label do campo de nome associado ao input.
- Admin de produtos: restauracao de produto descontinuado bloqueada; restauracao sem linha retornada nao gera sucesso falso. Condicionador Mel & Ozonio continua elegivel.
- Limite desta protecao: a consulta de dependencias no navegador nao e uma restricao transacional do banco; concorrencia e chamadas diretas ainda exigem protecao no banco. Exclusao fisica de produtos e retencao historica nao foram resolvidas por esta mudanca.
- Novo verificador: `scripts/test-admin-guards-browser.mjs`. Passou com requisicoes Supabase interceptadas: categoria utilizada, erro na consulta, exclusao sem linhas, exclusao permitida, restauracao proibida, restauracao sem linhas e restauracao permitida. Nenhuma escrita remota.
- Next.js atualizado de 16.3.4 para 16.3.6, com lockfile atualizado, para corrigir GHSA-vcvr-r3jv-pc5j. Nao foram encontradas referencias a next/og ou ImageResponse no codigo da aplicacao; nao foi demonstrada exploracao neste projeto. Referencia: https://github.com/advisories/GHSA-vcvr-r3jv-pc5j .
- Build de producao aprovado com Next.js 16.3.6. Auditoria de dependencias de producao retornou zero vulnerabilidades conhecidas nesta verificacao. Isso nao equivale a ausencia de vulnerabilidades no projeto.
- Auditoria completa ainda indicou seis alertas altos na cadeia de ferramentas de desenvolvimento. Nao foi executada correcao forcada com downgrade de eslint-config-next.
- Suite de 52 testes e verificacao TypeScript novamente aprovadas apos as alteracoes. Lint dos arquivos do admin e do novo verificador aprovado.
- Teste SQL local de permissoes aprovado: reaplicacao da migration, revogacao de acesso de clientes, preservacao dos acessos previstos e funcionamento de trigger.
- Testes SQL locais de avaliacoes de produtos aprovados: reaplicacao, paginacao, filtros, ordenacao, privacidade, propriedade do pedido, entrega obrigatoria, duplicacao, moderacao, notas baixas, isolamento por produto e protecao de SKU/historico.
- Testes SQL locais de avaliacoes da loja aprovados: publicacao preservada ao reaplicar, privacidade de registros legados, compra verificada, media incluindo criticas publicadas, limites de pagina e bloqueio de autopublicacao.
- Os testes SQL usam PGlite efemero fora do banco remoto. Nenhuma migration foi aplicada ao Supabase nesta etapa; os bloqueadores remotos acima permanecem.

- 52 testes existentes aprovados apos o filtro de catalogo.
- TypeScript sem erros apos as alteracoes de catalogo e layout.
- ESLint dos arquivos de catalogo alterados sem erros.
- Navegador Edge automatizado: quatro URLs de produtos de teste exibem tela nao encontrada; produto real PERF-303-W preservado; Home possui catalogo real e nao possui links para os quatro testes.
- HTTP de paginas transmitidas pelo Next pode ser 200 mesmo com tela nao encontrada; a verificacao usou o DOM final, nao apenas o status.
- Pagina PERF-303-W validada em 320, 390, 640, 768, 1024 e 1440 px, sem overflow horizontal, com imagem principal carregada e zoom/Escape funcionando.
- Capturas e verificadores locais em `C:\Users\lucas\Documents\Codex\supabase-connection-diagnostic`.
- Isto nao equivale a teste integral de todos os produtos, admin ou checkout.

## Proximas etapas do prompt mestre

- Concluir classificacao de arquivos e verificacao de referencias antes de qualquer limpeza; manter fontes editoriais, fixtures e migrations uteis.
- Corrigir o lint global: verificacao anterior encontrou erros de require em script de um relatorio historico nao rastreado, nao no runtime. Preservar o relatorio antes de decidir arquivamento.
- Revisar migrations pendentes com a evidencia remota e preparar aplicacao controlada. Nenhuma permissao ou estrutura remota foi modificada.
- Concluir auditoria do admin, exclusao de conta/retencao, sessao/Storage, acessibilidade, estados de avaliacoes e seguranca dos fluxos.
- Concluir redesign e revisao visual da pagina de produto; outras paginas nao devem receber redesign significativo sem aprovacao.
- Medir performance antes de declarar ganho. Diminuir arquivos do repositorio nao prova melhoria de runtime.
- Confirmar credenciais sandbox antes de pagamentos; nao usar credenciais de producao mostradas anteriormente. Segredos expostos devem ser renovados pelo titular.
- Testes de pagamentos, webhook e exclusao de conta ainda nao executados; nenhum usuario/pedido de teste criado no banco real.
- HTTPS temporario e testes externos ainda pendentes. Servidor local em `http://localhost:3002` nao e publicacao.

## Referencia de conexao

TLS conforme https://supabase.com/docs/guides/database/connecting-to-postgres . CA obtida do endereco publicado no codigo oficial do painel Supabase; verificacao de certificado nao foi desativada.
