# Aplicacao do documento e retirada dos descontinuados

Atualizacao de 30/09/2026. Este registro substitui o status dos relatorios anteriores.

## Banco e historico

Os dez SKUs solicitados estao com `is_deleted = true` no Supabase: oito foram alterados nesta etapa e dois ja estavam retirados. Foi verificado, depois da escrita, que IDs, nomes, codigos, precos, estoque, imagens e descricoes permaneceram iguais. O Condicionador Mel & Ozonio (`CAP-CO-MEL`) continua ativo e inalterado no banco.

Nao houve exclusao fisica nem alteracao de pedidos, avaliacoes ou favoritos. A tabela de avaliacoes referencia o ID do produto; pedidos usam snapshots JSON. Esses vinculos permanecem intactos, inclusive quando a consulta de pedidos por SKU nao cobre formatos legados.

Evidencia antes/depois e contagens: `discontinued-products-database.json`. O SQL equivalente esta em `supabase/manual/20260930_descontinuar_dez_produtos.sql`, mas a operacao ja foi aplicada; nao e necessario executa-lo novamente.

## Documento principal

Os 119 registros do DOCX foram extraidos com o texto-fonte integral e os paragrafos estruturados. O arquivo original nao foi modificado. A extracao esta em `product-document-source.json` e a conciliacao por produto em `product-document-review.json`.

Todos os 109 produtos comerciais ativos possuem correspondencia exata de codigo oficial e EAN com o documento. O documento inclui oito dos SKUs descontinuados; os dois ja retirados possuem codigos atuais distintos e continuam bloqueados conforme a lista expressa do usuario. Os dois registros das locoes antigas (40565 e 405640) nao substituem os hidratantes novos nem geram produtos duplicados.

O texto-fonte dos ativos corresponde ao material anteriormente fornecido, com mudancas de organizacao e retirada de cabecalhos de categoria. Descricoes detalhadas, componentes, vitaminas, caracteristicas, uso e precaucoes ja conciliados foram preservados. Notas de pesquisa e campos ausentes continuam fora da interface. Nenhum produto foi retirado apenas por falta de descricao.

## Condicionador Mel e Ozonio

Mantidos oleo de girassol ozonizado, extrato de mel, geleia real e vitaminas A, D e E, alem da descricao de hidratacao, nutricao, maciez, sedosidade e brilho. Pesquisa complementar acrescentou aplicacao no comprimento apos shampoo e mascara, pausa de 3 minutos, enxague e cuidados de conservacao e uso externo.

Fontes complementares, separadas do fabricante:
- https://grupoozonteck.lojavirtualnuvem.com.br/produtos/1-condicionador-mel-ozonio/
- https://ozonvidas.com/produtos/condicionador-mel-ozonio-ozonteck/

O conteudo editorial e aplicado nas paginas, metadados e dados estruturados do site local. A coluna de descricao do banco nao foi sobrescrita nesta etapa.

## Cobertura da retirada

O bloqueio central atende Home, categorias e filtros derivados do catalogo, pesquisa, favoritos, reposicao da lista persistida, checkout, pagina individual, relacionados e sitemap. O carregamento de imagens da lista agora consulta apenas produtos ativos. Historicos de pedidos continuam exibindo o item comprado, mas sem link para a pagina retirada.

Nao houve deploy. A retirada logica ja afeta consultas existentes ao banco que filtram `is_deleted`; as protecoes adicionais do codigo e a revisao editorial precisam da publicacao normal do projeto para chegar a um site hospedado.

## Limites

As pesquisas anteriores de produtos ativos continuam registradas nas fontes individuais. Nao foram feitas novas pesquisas nem melhorias editoriais dos produtos retirados. Dados de suplementos sem correspondencia segura de formula ou apresentacao nao foram transferidos: por exemplo, a fonte complementar de OX diverge da composicao fotografada, e a pagina de Ozon Flex de 10 g nao comprova a posologia do sache de 8 g. Nao foram inventadas instrucoes, dosagens ou ingredientes para preencher lacunas.

## Validacao

- 41 testes passaram; TypeScript e lint dos arquivos verificados passaram.
- Navegador: dez URLs sem ficha de produto e com noindex; produtos ausentes da Home e do sitemap; lista persistida descarta os dez e mantem CAP-CO-MEL.
- O Next.js entrega essas telas de nao encontrado em streaming com HTTP 200; nao foi alegado retorno HTTP 404. A ficha e os dados estruturados do produto nao sao publicados.
- Condicionador inspecionado em 390 e 1440 pixels, com vitaminas, ativos, modo de uso e precaucoes visiveis, sem rolagem horizontal.
- Nao foi executado build de producao nem deploy. Favoritos e checkout foram inspecionados no codigo; nao houve compra nem alteracao de conta real durante os testes.
