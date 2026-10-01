# Conferencia das imagens do catalogo - 27/09/2026

## Escopo desta etapa

Foram inspecionadas individualmente as fotos dos 22 itens de nutraceuticos em `public/produtos`, incluindo caixas e unidades como produtos distintos. Tambem foram inspecionadas Haydek, Ozon Trix, mascara e shampoo Mel & Ozonio e Caixa Memorias.

26 fichas receberam dados legiveis das embalagens. Caixa Memorias nao recebeu material ou dimensoes inferidos da foto.

Os dados sao complementares a pesquisa na internet registrada em `lib/product-research.ts`. Fotos frontais nao equivalem a rotulos integrais e nao comprovam a correspondencia com o lote atual do estoque.

## Informacoes incorporadas

- Boryslim: cromo, 60 capsulas de 500 mg.
- Cobalactin: metilcobalamina, comprimidos mastigaveis, mousse de limao, 30 unidades de 1.000 mg.
- Dream Bliss: melatonina e Q10, 100 mg de Q10 por capsula declarados na frente, 30 softgels de 700 mg.
- Genolife Kids: vitaminas C/D e selenio, tutti-frutti, 30 mastigaveis de 1.000 mg; idade nao inferida.
- K2/D3: D3 e MK-7, 60 softgels de 700 mg; doses individuais nao inferidas.
- Luminous Vita: vitaminas A/C/E, 60 capsulas de 590 mg.
- Melatozon: melatonina em gotas, tutti-frutti, 20 ml.
- NX Cap: vitamina E, 60 softgels de 700 mg.
- Omega 3: 60 softgels de 1.400 mg; peso nao tratado como teor de EPA/DHA.
- OX: vitamina C, selenio, manganes e zinco, 60 capsulas de 590 mg.
- Creat caixa: creatina e glutamina, 30 sticks de 8 g, 240 g.
- Creat unidade: um stick de 8 g; sem presumir 8 g de creatina.
- Creat Morango caixa/unidade: 30 saches de 8,5 g/um sache de 8,5 g; sabor morango.
- Flex caixa/unidade: colageno II, acido hialuronico, vitaminas C/D/E/K2, pessego; 30 saches de 8 g/um sache de 8 g.
- Lev: abacaxi com hortela, fonte de fibra segundo rotulo, sache de 8 g; tipo de fibra nao identificado.
- Sofh D: vitamina D em gotas, 20 ml; concentracao nao inferida.
- Tri-Magnesio: quelato, dimagnesio malato, taurato e extrato de curcuma, 60 capsulas de 590 mg.
- Virtuous: biotina, silicio e zinco, 60 capsulas, 42 g.
- Vita Ozon Plus: polivitaminico com omega 3, 60 capsulas de 700 mg; nao foi inferida a porcao dos valores de EPA/DHA.
- Xbooster: cafeina, taurina e arginina, 60 capsulas de 590 mg.
- Haydek: creme para pes, karite e hydroxyethyl urea, 120 g.
- Ozon Trix: desodorante para axilas, extrato de alcacuz, spray de 30 ml.
- Mel & Ozonio mascara: identificacao confirmada; composicao e pausa nao legiveis.
- Mel & Ozonio shampoo: proposta de limpeza suave e nutritiva, 300 ml.

## Arquivos alterados nesta etapa

- `lib/product-research.ts`: dados por produto, fontes locais e classificacao explicita de embalagem fotografada.
- `app/produto/[code]/page.tsx`: identificacao da origem dos dados na area de fontes, sem alterar as acoes comerciais.
- `tests/product-reviews.test.ts`: aceita apenas caminhos locais de imagens com formato restrito, mantendo validacao HTTPS das fontes externas.

Precos, imagens originais, estoque, banco, header, footer, autenticacao e pagamentos nao foram alterados nesta etapa.

## Validacao e limites

- Checagem TypeScript passou apos a inclusao dos 22 nutraceuticos.
- Tres testes focados passaram, incluindo cobertura editorial de 112 produtos e ausencia de sobrescrita de preco/imagem.
- Pagina real `/produto/NUT-FLEX-UN` carregou e exibiu componentes, apresentacao, preco do catalogo e acoes de lista.
- A captura visual posterior nao foi concluida porque a aba deixou de estar disponivel na sessao do navegador.
- A verificacao ESLint desta etapa foi interrompida apos permanecer sem resultado; nao foi considerada aprovada.
- Ainda e necessario validar o conjunto completo em producao e conferir rotulos integrais. Nao se declara toda a pesquisa ou todos os fluxos concluidos.

## Pendencia regulatoria da pesquisa anterior

A noticia de 2025 sobre suplementos OZT nao deve ser usada isoladamente como prova de proibicao atual. Foi encontrada transcricao da RE 3.053 de 04/08/2026, publicada em 06/08/2026, revogando o item 2 da RE 4.387/2025. Fonte consultada: https://dailyjournal.news/dou/2026-08-06/2768624 . Confirmacao no DOU e correspondencia de fabricante/lote permanecem necessarias. Essa revogacao nao foi generalizada a outras medidas sobre cosmeticos.
