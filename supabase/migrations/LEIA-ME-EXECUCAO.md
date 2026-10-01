# Ordem de execucao: auditoria de 29/09/2026

ATUALIZACAO 30/09: a parte de cadastro descrita abaixo e historica. O SQL manual
foi ampliado com descricoes e caminhos de fotos, e os 11 mapeamentos editoriais
foram implementados no projeto. Para cadastrar, seguir agora
`../../docs/cadastro-11-produtos-instrucoes.md`. As orientacoes de seguranca
e a proibicao de executar a pasta inteira continuam validas.

Nao execute a pasta inteira, nao use db reset e nao use db push para resolver esta pendencia.
Nenhuma alteracao foi executada pelo assistente no Supabase nesta auditoria.

## Primeiro arquivo a executar

`../diagnostics/20260929_installation_audit.sql`

Executar integralmente no SQL Editor do projeto correto. Retorna uma coluna JSON
`diagnostico`, somente leitura. Enviar o resultado para fechar a lista de pendencias.
Nao retorna dados pessoais de clientes/pedidos. Contem metadados de seguranca e
catalogo comercial: nao publicar o resultado abertamente.

Ter arquivos locais nao significa que foram instalados. Objetos visiveis nos prints
nao comprovam todas as definicoes, restricoes e permissoes de uma migration.
O historico CLI tambem nao registra necessariamente SQL colado no Editor.

## Arquivos existentes

| Arquivo | Evidencia em 29/09 | Decisao |
| --- | --- | --- |
| 202609240001_ozonteck_complete_setup.sql | Colunas de pagamento, policies, is_admin e triggers visiveis | Base aparentemente instalada. NAO repetir: remove/recria policies, inclusive TODAS as de storage.objects; pode reintroduzir fluxo antigo de pagamento |
| 202609240002_security_hardening.sql | Reserva de estoque, complemento, view public_reviews e RPC de pagamento com quatro parametros visiveis | Base aparentemente instalada. NAO repetir: redefine a view para nota >=4 e recria funcoes; conferir indices, limites de upload e grants no diagnostico |
| 202609260001_product_reviews.sql | Tabela avaliacoes_produtos, policy INSERT e RPC de listagem visiveis | Aparentemente instalada. NAO repetir depois da migration de envio: revoga grants de moderacao e volta a conceder INSERT direto |
| 202609270001_product_review_submission.sql | itens_avaliaveis/enviar_avaliacao_produto, updated_at e policies de moderacao nao aparecem nos prints | Provavel pendencia. Executar somente se diagnostico confirmar base/indice unico e ausencia ou instalacao parcial; preserva reviews e protege SKU vinculado a pedido |
| 202609270002_store_review_journey.sql | Coluna publicado em avaliacoes e listar_avaliacoes_loja nao aparecem | Provavel pendencia. Apos confirmar base, executar depois da anterior; preserva depoimentos antes publicos e mantem criticas antigas privadas ate moderacao |
| 202609280001_retire_accessories.sql | Prints nao mostram estado dos quatro produtos | Conferir is_deleted no diagnostico. Manter retirados conforme ultima decisao; se ja retirados, nao repetir. A query tambem atinge outros itens classificados como acessorios, nao apenas os quatro codigos |
| 202609290001_function_execute_permissions.sql | NOVO, preparado nesta auditoria | Aplicacao manual apos diagnostico. Prioridade: impedir acesso de clientes a RPCs de pagamento/reserva. Idealmente depois das migrations 27; se aplicado antes, repetir depois para abranger novos triggers |

`../product-descriptions-reviewed.sql`: revisao editorial anterior, fora de migrations;
preenche descricoes vazias. Nao instala funcoes nem representa a segunda revisao
editorial completa. Nao ha motivo para repetir indiscriminadamente.

`../review-installation-check.sql`: consulta antiga somente leitura, nao instala nada.
A nova consulta de diagnostico amplia essa verificacao.

## Sequencia condicional

1. Fazer backup/restauracao verificavel e executar o diagnostico somente leitura.
2. Se confirmadas as bases 24/26, executar as migrations 270001 e 270002 que estiverem pendentes, uma por vez.
3. Executar a nova 290001 para restringir permissao de EXECUTE. Se RPC de pagamento estiver acessivel a anon/authenticated, tratar como prioridade; ela pode ser aplicada antes da etapa 2 e repetida depois.
4. Conferir catalogo completo, inclusive retirados e nomes alternativos, antes de executar `../manual/20260929_cadastrar_11_produtos.sql`.
5. Rodar novamente o diagnostico; testar login, endereco, checkout em ambiente de teste, avaliacoes e moderacao. Nao testar pagamento com RPC administrativa diretamente em producao.

Se ocorrer erro, nao continue nos proximos arquivos. Os arquivos novos usam transacao;
se a sessao ficar abortada, executar ROLLBACK antes de nova tentativa. Enviar erro exato.
Nao marcar migrations como aplicadas artificialmente sem verificar os efeitos.

## Produtos: SQL separado

Precos das capturas autorizados pelo usuario em 29/09. Estoque inicial 9999 apenas
para novos registros; imagem vazia, sem substituicao das existentes. Descricoes
iniciais conservadoras, sem copiar alegacoes terapeuticas. Categorias precisam
existir. Codigos novos abaixo seguem o padrao interno; nao sao codigos oficiais.

| Codigo interno novo | Produto | Codigo original | EAN | Preco R$ |
| --- | --- | --- | --- | ---: |
| NUT-AMYNO-CX | Amyno Ozon Caixa | IMP-189 | Nao informado | 299,90 |
| NUT-AMYNO-UN | Amyno Ozon Unidade | IMP-197 | Nao informado | 10,00 |
| NUT-POWER-UN | Ozon Power Unidade | IMP-49 | Nao informado | 10,00 |
| NUT-MUNITY-UN | Ozon Munity Unidade | IMP-48 | Nao informado | 10,00 |
| BE-SER-LUM | Serum Facial Lumino3 | 40566 | 7898760210585 | 175,90 |
| CAP-CO-KES | Condicionador Ozon-Kesen | 40548 | 7898996428235 | 109,90 |
| CAP-PRO-KES | Pro Kesen | 40544 | 7898760210097 | 499,90 |
| CAP-AT-MC | Ativador Master Curls | 40559 | 7898996428228 | 119,90 |
| CAP-CO-MEL | Condicionador Mel & Ozonio | 40551 | 7898996428266 | 109,90 |
| BE-TOQUE-LUM | Toque Luminoso | IMP-206 | Nao informado | 565,60 |
| BE-XBOOST-269 | Energetico Xbooster 269 ml | IMP-99 | Nao informado | 27,80 |

VG Sexy perfume 17/100 ml e hidratante ja existentes: NENHUM cadastro ou alteracao.
Speed Black perfume/hidratante existentes: NENHUM cadastro ou alteracao.
As duas locoes antigas 40565/405640 foram excluidas do SQL: nao foi demonstrado
que devam coexistir comercialmente com os hidratantes atuais. Diferenca de EAN
pode representar substituicao de embalagem/formula, nao autoriza duplicacao.

Os 11 nao foram encontrados no snapshot da segunda revisao. Isso NAO comprova
ausencia no banco atual. O SQL impede colisoes de codigo com nome/categoria distintos
e nomes iguais com outro codigo, inclusive retirados. Nomes alternativos exigem
conferencia humana: nao existe equivalencia infalivel por texto.
Reexecucao nao altera preco, estoque, descricao, imagem nem is_deleted de existentes.

O schema atual nao tem colunas de codigo oficial/EAN. Eles ficam documentados no
arquivo de cadastro, separados do SKU. Esta etapa prepara cadastro no banco;
nao adiciona automaticamente os 11 mapeamentos/especificacoes editoriais nos
arquivos TypeScript. Essa associacao deve acompanhar a confirmacao final dos SKUs,
antes de considerar as novas fichas editorialmente completas.

## Alertas de seguranca

- Pagamentos/reservas: os arquivos antigos revogam PUBLIC, mas grants explicitos
  para anon/authenticated podem permanecer. Os prints apontam exatamente esses
  acessos. As RPCs nao validam por si mesmas que o chamador e o servidor. A nova
  migration revoga os tres e preserva service_role, sem chamar as funcoes.
- is_admin e listagens publicas de avaliacoes precisam continuar acessiveis.
  SECURITY DEFINER intencional nao significa que todos os avisos possam ser ignorados.
- public_reviews: e uma view com projecao limitada, deliberadamente fora do RLS
  do cliente. A migration 270002 NAO remove esse aviso. Trocar apenas para
  security_invoker pode quebrar os depoimentos porque anon nao pode ler avaliacoes.
  Nao foi aplicada uma correcao cosmetica que exponha a tabela privada ou quebre a Home.
- Buckets publicos: SELECT amplo pode permitir listar objetos; a URL publica de
  uma imagem nao equivale a permissao de listar o bucket. Revisar policies com
  os fluxos de upload/administracao antes de restringir; esta migration nao altera Storage.
- Senhas vazadas: configuracao do Auth, nao SQL de produtos. Conferir disponibilidade
  e habilitar no painel; documentacao informa recurso em planos Pro ou superiores.
- handle_new_user e handle_new_auth_user coexistem. Funcao antiga nao prova
  trigger duplicado. O diagnostico inclui triggers de auth; nao excluir por nome.
- Badge API DISABLED/custom permissions nao demonstra ausencia de grants nem
  autoriza conceder ALL nas tabelas. Conferir privilegios efetivos e RLS.

Fontes oficiais consultadas:
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/views
- https://supabase.com/docs/guides/storage/buckets/fundamentals
- https://supabase.com/docs/guides/auth/password-security

## Evidencias visuais

Todas as 13 capturas de 29/09 foram consideradas: 101210/101250 mostram os avisos;
101148 a view; 101110/101055/101046 as policies; 100924 as funcoes;
100856/100852/100844/100826 o schema; 100747 uma amostra do catalogo;
100936 os triggers do schema public. Capturas parciais nao mostram definicoes,
historico de execucao ou o catalogo completo. A ultima nao mostra triggers de auth.

## Validacao local

PGlite em memoria, sem conectar ao Supabase real:
- Novo diagnostico executado em transacao read-only.
- Correcao de ACL repetida: clientes sem acesso as quatro RPCs administrativas;
  service_role mantido, is_admin publico e endereco autenticado preservados.
- Trigger de cadastro continua funcionando apos revogar EXECUTE direto dos clientes.
- Cadastro: 11 insercoes, reexecucao sem duplicar, rejeicao de preco ausente e nome
  ocupado, preservacao de preco/estoque/retirada de produtos existentes; nenhum VG.
- Testes existentes de avaliacoes de produtos e loja aprovados, incluindo moderacao,
  privacidade, pedido entregue, estrelas baixas publicadas e protecao de SKU.

Os testes usam schema/roles simulados: nao certificam permissoes herdadas, extensoes,
Storage, estado de producao, checkout real ou toda a instalacao das bases 24.
Nao houve mudanca de interface nem execucao de teste de pagamento em producao.
