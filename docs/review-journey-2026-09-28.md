# Jornada de avaliacoes - 28/09/2026

## Cliente

- Nao ha solicitacao de avaliacao antes da entrega.
- Cada produto do pedido entregue tem acao propria. O formulario identifica o produto e informa que a opiniao aparece na pagina dele apos analise.
- Ao final do pedido, "Avaliar experiencia de compra" coleta atendimento, entrega e embalagem. O texto esclarece que a publicacao e neste site, nao nos produtos ou Google.
- O convite duplicado ao Google foi retirado dos pedidos. O link fica no bloco proprio da Home, sem integracao de API paga.
- "Ver detalhes" agora expande referencia, status e endereco do pedido.
- Nao e gerado comentario positivo/negativo automaticamente quando o cliente envia apenas uma nota.

## Administrador

- Modera produtos e experiencias com a loja em secoes distintas da auditoria de pedidos.
- Cada avaliacao identifica seu produto/pedido quando aplicavel.
- Pode publicar ou ocultar, preservando registros. Notas baixas sao publicaveis; moderacao nao deve censurar criticas.
- Tabelas e pagina administrativa de pedidos existentes foram preservadas.

## Publicacao da loja

A migracao `202609270002_store_review_journey.sql` adiciona publicacao controlada a tabela existente, sem criar outra tabela de avaliacoes. Mantem publicados os antigos registros que ja eram publicos (notas 4/5); nao publica automaticamente notas antigas que estavam privadas. Novos envios ficam pendentes independentemente da nota.

O cliente nao consegue definir publicado=true ao enviar. A leitura publica nao expoe IDs de pedido/usuario. "Compra verificada" depende de pedido entregue pertencente ao autor. Registros legados sem essa prova nao recebem o selo.

Media/quantidade sao calculadas no banco usando todas as notas publicadas, sem filtro positivo. A listagem recebe 12 registros por pagina. Antes da instalacao da migracao, a Home preserva a selecao anterior com rotulo de selecao, sem declarar que e media geral e sem selo automatico de verificacao.

## Instalacao

As migracoes NAO foram executadas no Supabase remoto nesta tarefa.

1. Confirmar os resultados do diagnostico existente e os pre-requisitos anteriores.
2. Aplicar `supabase/migrations/202609270001_product_review_submission.sql`, se ainda nao instalada.
3. Aplicar `supabase/migrations/202609270002_store_review_journey.sql`.
4. Validar com conta cliente e administrador em ambiente autorizado. Nao repetir os quatro scripts antigos como substituto desses incrementos.

Backup e revisao antes da execucao remota continuam recomendados. As migracoes foram testadas com reaplicacao no banco temporario, mas isso nao comprova ausencia de divergencias no banco real.

## Testes realizados

- TypeScript sem erros.
- `scripts/test-store-reviews-sql.mjs`: PostgreSQL temporario, reaplicacao, preservacao de privados, verificacao por compra, agregacao com nota baixa, pagina invalida, projecao sem IDs privados e bloqueio de autopublicacao.
- `scripts/test-review-journey-browser.mjs`: Edge isolado em 1440/390/320px, sessao e respostas Supabase simuladas/interceptadas. Envio parcial por produto, avaliacao da loja separada, ausencia do Google no pedido, detalhes, moderacao administrativa das duas categorias e Home com media/publicacao de critica.
- Nenhuma avaliacao ficticia foi gravada no banco real. Testes simulados de navegador nao substituem RLS nem teste integrado apos instalacao; SQL temporario testa controles separadamente.
- Comentarios do Google nao foram importados. Dados completos de produtos continuam fora desta etapa.

## Arquivos desta continuacao

`app/conta/pedidos/page.tsx`, `components/OrderProductReviews.tsx`, `app/admin/pedidos/page.tsx`, `components/StoreReviewModeration.tsx`, `app/page.tsx`, a migracao de loja e os dois scripts de testes acima.
