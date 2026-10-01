# Paginas de produtos e avaliacoes: implementacao e limites

## Atualizacao: referencias de pedidos e link do Google

- Cliente: cada item do pedido apresenta nome, quantidade, preco unitario historico quando disponivel e acao individual de avaliacao quando entregue. Consulta de elegibilidade apenas na primeira abertura do pedido; envios continuam individuais.
- Administrador: moderacao identifica produto e pedido; avaliacao geral foi rotulada como avaliacao da loja para nao confundir com nota de produto.
- Convite ao Google na Home e em pedidos entregues, independentemente de nota ou de envio de outra avaliacao. URL fornecida pelo titular: https://g.page/r/CVsulQKezR0QEBM/review.
- O bloco nao importa comentarios e nao faz requisicoes a Places. Nao ha custo de API para esses links. Cinco comentarios nao garantem gratuidade da futura integracao; custos dependem de consultas e franquia.
- Nao foi fixado "mais de 70" nem nota 5,0: screenshot nao constitui sincronizacao e contagem pode mudar.
- Mudancas adicionais: `lib/site.ts` centraliza URL; `components/GoogleStoreReviewsLink.tsx` adiciona bloco; teste de navegador verifica endereco e largura. Nenhuma alteracao SQL adicional nesta atualizacao.
- TypeScript aprovado. Fluxo autenticado real de envio/moderacao permanece condicionado a confirmacao da migracao no Supabase.

## Escopo

Somente carregamento da pagina individual, descricao nos cards, quatro scripts informados e avaliacoes. Nenhum conteudo editorial de produto foi criado nesta etapa. Precos, imagens, checkout, WhatsApp e lista de interesse nao foram reescritos.

## Diagnostico integrado

- A pagina aguardava o produto e depois a consulta de relacionados antes de entregar o conteudo principal. Agora os relacionados usam Suspense separado. O resultado final da secao foi preservado.
- `getProduct` usa React.cache para compartilhar a leitura entre metadata e pagina na mesma renderizacao; nao foi introduzido cache persistente de preco/estoque.
- Avaliacoes ja eram carregadas perto da entrada da secao na tela. Essa estrategia foi preservada: nao bloqueiam a abertura, paginam seis registros e cancelam requisicoes antigas ao mudar filtros.
- A consulta de relacionados continua limitada a 100 candidatos da mesma categoria para selecionar quatro, priorizando a linha. Reduzir arbitrariamente esse limite poderia mudar a selecao.
- A API de avaliacoes resolve o codigo para UUID e consulta a funcao publica existente. Nao consulta avaliacoes gerais de pedidos.
- A descricao apareceu porque o quarto script preencheu campos vazios e o card ja renderizava esse campo. Foi removida somente a renderizacao no card, sem apagar dados.

## Efeito dos quatro scripts

1. `202609240001_ozonteck_complete_setup.sql`: cria controles de checkout/pagamento, relacionamento de avaliacoes da loja com pedidos, unicidade por pedido, indices e politicas. Tambem recria politicas de varias tabelas e Storage: nao deve ser reaplicado como uma simples atualizacao de avaliacoes.
2. `202609240002_security_hardening.sql`: acrescenta reservas, constraints, limites de uploads, codigo unico de produto e a projecao publica `public_reviews`. Essa view seleciona somente notas 4 e 5. Nao altera descricoes.
3. `202609260001_product_reviews.sql`: ja separa produto de loja em `avaliacoes_produtos`, com UUID do produto, pedido e usuario, unicidade pedido/produto, verificacao de pedido entregue, publicacao controlada e consulta paginada. Nao e necessario recriar essa tabela.
4. `product-descriptions-reviewed.sql`: preenche descricoes vazias de 21 referencias, sem alterar precos, imagens, pedidos ou RLS. Explica a mudanca visual da Home em conjunto com o card.

O texto colado do segundo script contem uma letra A isolada antes de um UPDATE. Ela nao existe no arquivo local. Se estava na execucao real, a transacao falhou. A declaracao do usuario de que executou o arquivo nao comprova que todas as instrucoes foram instaladas. `supabase/review-installation-check.sql` verifica estruturas sem modificar dados; nao comprova historico de execucao nem toda a configuracao de pagamentos.

## Modelo final

### Loja

`avaliacoes` continua representando experiencia com atendimento, entrega e compra. Uma por pedido. Nenhuma e copiada para produtos. A Home preserva a selecao positiva existente, agora identificada como selecao de notas 4 e 5. Sua media e explicitamente a media dessa selecao, nao de todas as compras nem do Google.

### Produto

`avaliacoes_produtos` continua sendo a fonte. O cliente abre um pedido entregue e escolhe quais produtos avaliar. Uma linha do pedido pode conter varias unidades; quantidade nao multiplica avaliacoes. Variantes com cadastro proprio possuem UUID proprio. Nova compra pode gerar nova avaliacao do mesmo produto, pois a regra preservada e uma por pedido/produto, nao uma por usuario para sempre.

O UUID do produto e a identidade persistida na avaliacao. O JSON dos pedidos atuais identifica itens pelo codigo e nao tem UUID de linha. O checkout consolida codigos repetidos; portanto, para esse modelo, pedido + produto representa o item avaliavel sem criar outra tabela de itens. Nao se usa nome para inferir vinculos ausentes.

Foi acrescentada protecao contra renomear o codigo ou excluir fisicamente produto referenciado em pedido. Exclusao logica, restauracao, preco e estoque permanecem permitidos. Limite: isso nao reconstroi codigos alterados/reutilizados antes da instalacao; pedidos historicos ambiguos precisam de conferência administrativa. Uma futura necessidade de linhas distintas do mesmo SKU exigira identidade propria de item e migracao planejada.

### Envio e seguranca

- RPC identifica usuario pela sessao, verifica propriedade e status entregue, confirma produto no JSON do pedido e deriva primeiro nome do perfil.
- Cliente nao define autor, publicacao, imagens nem usuario de outra conta.
- Insercao direta anteriormente concedida ao cliente foi revogada; envio passa pela RPC.
- Pedido e produto sao bloqueados durante validacao/envio. Constraint existente impede duplicidade mesmo em tentativas simultaneas.
- A leitura publica retorna somente projecao existente, sem IDs de cliente/pedido. Filtros possuem limites e ordenacao deterministica.
- Publicacao depende de administrador com RLS; uma nota baixa pode ser publicada. Moderacao deve tratar abuso/dados pessoais, nao eliminar criticas.
- Sem edicao/exclusao autonoma nesta versao, preservando o comportamento anterior. Solicitacoes de correcao/exclusao devem ser tratadas pelo atendimento. Ocultar preserva o registro. `updated_at` registra alteracao, mas nao e um historico completo de auditoria; nao se alega que exista versionamento de comentarios.
- Fotos continuam no mecanismo existente de imagens aprovadas. Nao foi liberado upload publico ou importacao de imagens arbitrarias.

### Exibicao e calculo

A pagina busca apenas o UUID daquele produto. Media aritmetica e quantidade usam todas as avaliacoes publicadas do produto, incluindo notas 1 a 5. Cada registro tem peso um. Filtros mudam a lista/contagem filtrada, nao a media geral. Sem avaliacoes, retorna total zero e media nula. Publicacao pode levar ate a janela de cache da API (30 segundos + ate 60 segundos de revalidacao) para aparecer.

## Google: pesquisado, nao integrado

Para prova social publica, a opcao mais direta e Places API: ate cinco avaliacoes, ordenadas por relevancia, com atribuicao ao Google/autores e links. Nao e exportacao de todas as avaliacoes. Nao armazenar como avaliacoes nativas nem misturar medias. A API utiliza faturamento por campos solicitados; reviews aciona Place Details Enterprise + Atmosphere. Na tabela global consultada, franquia 1.000 e primeiro nivel pago US$25 por 1.000 eventos, sujeito a alteracoes e contrato/regiao.

Business Profile permite listar avaliacoes de local verificado administrado pela conta, com OAuth e ate 50 por pagina. Requer aprovacao de acesso/projeto; a API nao cobra taxa de uso para usuarios registrados, mas infraestrutura tem custos. Suas politicas limitam uso e armazenamento; a permissao de consultar nao autoriza uma importacao permanente para qualquer finalidade. Conteudo limitado em cache deve respeitar condicoes, seguranca e prazo maximo de 30 dias, sem manipulacao/agregacao.

Recomendacao: inicialmente link para o perfil real; se houver decisao de exibir no site, avaliar Places para bloco claramente atribuido, consultar sob demanda no servidor, restringir chave/quota, respeitar as regras de armazenamento e manter falha isolada do catalogo. Business Profile e alternativa condicionada a autorizacao do titular e confirmacao da adequacao da finalidade. Nenhuma chave, custo ou integracao foi ativado. Falta identificar o perfil/place ID real e escolher a opcao.

Fontes oficiais consultadas:
- https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places
- https://developers.google.com/maps/documentation/places/web-service/policies
- https://developers.google.com/maps/billing-and-pricing/pricing
- https://developers.google.com/maps/billing-and-pricing/sku-details
- https://developers.google.com/my-business/reference/rest/v4/accounts.locations.reviews/list
- https://developers.google.com/my-business/content/basic-setup
- https://developers.google.com/my-business/content/pricing
- https://developers.google.com/my-business/content/policies

## Arquivos desta etapa

- `app/produto/[code]/page.tsx`: relacionados em streaming separado.
- `components/ProductCard.tsx`: remove apenas texto de descricao no card.
- `app/page.tsx`: identifica corretamente a selecao de depoimentos da loja.
- `components/OrderProductReviews.tsx`: envio individual sob demanda.
- `app/conta/pedidos/page.tsx`: integra avaliacao de produtos em pedidos entregues.
- `components/ProductReviewModeration.tsx`: leitura paginada e publicacao/ocultacao administrativa.
- `app/admin/pedidos/page.tsx`: integra moderacao sem alterar fluxo dos pedidos.
- `supabase/migrations/202609270001_product_review_submission.sql`: incremento sobre tabela existente, permissoes, RPCs e protecao do vinculo por codigo.
- `supabase/review-installation-check.sql`: diagnostico somente leitura.
- `scripts/test-product-reviews-sql.mjs`: testes em PostgreSQL temporario PGlite.
- `scripts/test-product-pages-browser.mjs`: teste em Edge isolado, sem login ou gravacao no banco.
- Este relatorio.

## Verificacao

- TypeScript sem erros.
- 13 testes Node aprovados.
- Duas migracoes de avaliacoes aplicadas duas vezes no banco temporario: aprovadas, sem dados reais.
- SQL: filtros, paginacao, imagens, ordenacao, projecao publica, permissao anonima, propriedade, pedido entregue, compra com varios produtos, envio parcial, duplicidade, produto fora do pedido, nota baixa publicada, isolamento, codigo protegido e exclusao logica testados.
- HTTP local: Home e produto 200; avaliacoes vazias 200; nota invalida 400; produto inexistente 404. Relacionados presentes no HTML final.
- Medicao do recebimento do titulo no stream HTTP, nao LCP: antes 1.560/549/251 ms; depois 2.839/238/186 ms. Nova rodada 1.143/210/185 ms. Primeira execucao pode incluir compilacao. Sao amostras locais, nao benchmark de producao; a correcao comprovada remove a dependencia sequencial dos relacionados.
- ESLint direcionado nao concluiu e foi interrompido; nao foi declarado aprovado.
- A ferramenta inicial de navegador retornou Transport closed. Foi utilizada verificacao alternativa com Playwright/Edge isolado: Home sem descricao, navegacao para produto, imagem carregada, zoom e fechamento por Esc, adicao a lista local, endereco do WhatsApp, filtros e estado vazio passaram em 1440, 390 e 320 pixels, sem overflow horizontal ou erros de pagina. Nao foi enviada mensagem no WhatsApp. Fluxo autenticado real ainda depende da instalacao remota.
- Inspecao visual: os botoes flutuantes globais de acessibilidade ja existentes podem cobrir parte de titulos ao rolar em telas estreitas. Nao foram reposicionados nesta alteracao restrita; isso continua como limitacao visual, apesar de nao haver overflow horizontal.
- Migracao nova NAO executada no Supabase remoto. Ativacao e testes autenticados reais dependem dessa instalacao e de contas/pedidos de teste autorizados. Nao foram criadas avaliacoes ficticias na loja.

## Instalacao pendente

1. Executar primeiro `supabase/review-installation-check.sql` e conferir que as estruturas das migracoes anteriores existem. Os dois novos fluxos podem estar false antes da instalacao.
2. Resolver divergencias do hardening antes de prosseguir; nao reaplicar os quatro scripts indiscriminadamente.
3. Com pre-requisitos confirmados e backup, executar somente `supabase/migrations/202609270001_product_review_submission.sql`.
4. Validar com pedido de teste entregue de varios itens: enviar apenas um, publicar como administrador, conferir que aparece somente naquele produto; depois avaliar o segundo. Verificar teclado/mobile e erros de sessao.

Conclusao: implementacao local e verificacoes automatizadas realizadas. Instalacao remota e validacao autenticada permanecem pendentes, explicitamente. Conteudo completo dos produtos aguardara a lista do usuario.
