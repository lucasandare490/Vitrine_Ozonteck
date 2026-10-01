# Complemento das descricoes - 30/09/2026

## Escopo

Foram preenchidos 13 resumos anteriormente ausentes: Aaliyah, Oud Royale,
Rhino Royale e Sublime (17 e 100 ml), Supremo Elixir, Ferias no Caribe,
Lua de Mel em Paris e Amyno Ozon (caixa e unidade).

Os textos e os links consultados estao em `lib/product-content-complementary.ts`.
As fontes sao revendas, nao fichas tecnicas oficiais do fabricante.
Esta etapa foi sucedida pela revisao em `product-editorial-final.md`.
Procedencia, conflitos e pendencias agora ficam apenas no relatorio interno.
As fontes anteriores foram preservadas. O preenchimento nao substitui resumos existentes.

## Limites da pesquisa

- Perfumes: perfis publicados pela revenda Ozonteck Loja, consultados nas duas
  apresentacoes. Nao foram importadas promessas de fixacao, concentracao ou
  equivalencia a perfumes de outras marcas. Notas de aroma nao sao ingredientes.
- Supremo: identificacao e proposta geral da revenda Produtos Ozonteck;
  piramide olfativa ainda nao confirmada.
- Body splashes: identificacao nas paginas individuais da revenda de Londrina;
  sem inferir notas, volume ou concentracao a partir do nome.
- Amyno caixa: resumo atribuido a ficha complementar que informa 30 unidades,
  aminoacidos e maltodextrina. Sem dosagem ou promessas de resultado.
- Amyno unidade: identificacao conservadora baseada no cadastro fornecido;
  nao recebe automaticamente composicao, peso ou preparo da caixa.

Ter resumo nao significa ter ficha tecnica integral: ingredientes, alergenicos,
tabela nutricional e instrucoes especificas ainda precisam do rotulo quando
nao constam das fontes. Essas pendencias continuam identificadas em cada ficha.

## Integracao

As paginas de produto, metadados e dados estruturados usam o resumo editorial
por `getPublicProductDescription`. Nenhum SQL precisa ser executado para esta atualizacao
do site. O campo `description` no Supabase nao foi alterado.

Nao houve mudanca de nomes, codigos, EAN, valores, estoque, imagens ou disponibilidade.
Toque Luminoso, energetico e acessorios permanecem fora desta revisao.
