# Revisão das fichas de produtos - 28/09/2026

## Resultado e escopo

Consulta somente de leitura ao catálogo: 112 produtos reais e 4 testes.
Retirados da venda no aplicativo os 4 acessórios; permanecem 108 produtos reais.
A lista recebida corresponde a **68 referências comerciais**: 41 apresentações
de perfumaria (31 fragrâncias), 8 de bem-estar, 14 capilares e 5 suplementos.
As duas apresentações de Ozon Flex foram reconciliadas, não preenchidas com o
texto incorreto de Amyno Ozon. Restam **40 referências não incluídas na lista**.
Seus dados anteriores foram preservados; ausência na lista não significa ausência
total de informações no site.

Fonte principal: arquivo “Texto colado.txt” recebido em 28/09/2026, informado pelo
usuário como transcrição do Grupo Ozonteck. Mantidas as referências por produto
e as informações previamente extraídas das fotos em public/produtos.
Não houve atualização de preços, estoque, imagens, pedidos ou avaliações.

## Organização editorial

- Descrição própria de cada produto, sem modelo genérico de benefícios.
- Perfumaria: família, perfil, saída, coração e fundo; versões com páginas próprias.
- Cosméticos e capilares: ativos destacados, finalidade, indicação, aplicação e cuidados disponíveis.
- Suplementos: componentes conhecidos, apresentação do rótulo e limites das informações disponíveis.
- “Ativos destacados” não é tratado como composição completa. Notas olfativas não são ingredientes.
- Informações anteriores válidas foram mantidas. Duplicações e frases desatualizadas foram reconciliadas.
- As 68 fichas revisadas usam o resumo editorial também no SEO/JSON-LD e na descrição principal.
  A descrição antiga permanece intacta no banco. Para esses códigos, editar somente description no
  painel não substitui o resumo editorial: a manutenção da ficha está em lib/product-content-reviewed.ts.
  Os demais códigos conservam a precedência anterior do cadastro.
- O texto recebido não foi colocado indiscriminadamente na Home: os cards continuam sem descrição.

## Divergências e decisões

1. **Ozon Flex:** a página oficial ainda descreve Amyno Ozon. Mantidos os componentes legíveis
   nas embalagens de Ozon Flex (caixa e unidade), sem transferir aminoácidos de outro suplemento.
   Conferência: https://grupoozonteck.com/produtos/ozon-flex
2. **Sentimento, 303 Men e 303 VIP Men:** as listas e os parágrafos divergem na própria fonte.
   Foi priorizada a lista explícita, com aviso de divergência nas fontes da ficha. Os trechos
   incompletos de 303 Men/303 VIP não foram completados por suposição.
   https://grupoozonteck.com/produtos/sentimento
   https://grupoozonteck.com/produtos/303-men
   https://grupoozonteck.com/produtos/303-vip-men
3. Capadócia, 303 For Woman, Angelical e Soul também têm diferenças entre lista e narrativa
   no material recebido. Não foram unidas automaticamente. Referências a outras marcas,
   perfumistas e suposta origem de perfumes terceiros não foram atribuídas à Ozonteck.
4. **VG Sexy:** o hidratante e o perfume têm perfis diferentes no material. Foram mantidos separados.
5. **Xbooster:** cápsulas e energético de 269 ml não são a mesma apresentação.
6. **Master Curls:** preservada a distinção entre o texto recebido e a pesquisa anterior de
   Master Curls Pro. A equivalência de fórmula não foi presumida.
7. **Life Shii:** o bloco estava junto de Mind Chai, sem título separado. Foi identificado pelo
   nome dentro do texto e associado somente a Life Shii.
8. Ozon Cream e NX Cap estavam repetidos. Conteúdo consolidado sem duplicar seções.
9. Promessas terapêuticas, de cura, circulação, emagrecimento, ação sobre doenças e números
   de desempenho sem comprovação da apresentação não foram convertidos em promessas comerciais.
   Não foi reproduzida como atual a menção regulatória antiga de dispensa de registro.
   Referência de segurança editorial: https://www.gov.br/anvisa/pt-br/assuntos/alimentos/suplementos-alimentares/perguntas-frequentes/

## Produtos ausentes da lista recebida

| Código | Produto |
| --- | --- |
| BE-HAY | Haydek |
| BE-TRIX | Ozon Trix |
| CAP-MAS-MEL | Máscara Mel & Ozônio |
| CAP-SH-MEL | Shampoo Ozon Mel |
| PRO-AMR | WO3 Máscara AMR |
| PRO-CIF | WO3 Máscara CIF |
| PRO-HMS | WO3 Máscara HMS |
| PRO-LPC | WO3 Máscara LPC |
| PRO-DEEP | WO3 Shampoo Deep Cleanse |
| PRO-SOFT | WO3 Shampoo Soft Cleanse |
| NUT-BORYS | Boryslim |
| NUT-COBAL | Cobalactin |
| NUT-DREAM | Dream Bliss |
| NUT-GENO | Genolife Kids |
| NUT-K2D3 | K2MK7 e D3 |
| NUT-LUMI | Luminous Vita |
| NUT-MELAT | Melatozon |
| NUT-OMEGA | Ômega 3 |
| NUT-OX | Ox |
| NUT-CREAT-CX | Ozon Creat Caixa |
| NUT-CREAT-UN | Ozon Creat Unidade |
| NUT-CREAT-MO-CX | Ozon Creat Morango Caixa |
| NUT-CREAT-MO-UN | Ozon Creat Morango Unidade |
| NUT-LEV-UN | Ozon Lev Unidade |
| NUT-SOFH-D | Sofh D |
| NUT-VIRT | Virtuous Caps |
| NUT-VITA-OZ | Vita Ozon Plus |
| PERF-AALI | Aaliyah 17 ml |
| P100-AALIYAH | Aaliyah 100 ml |
| PERF-OUD | Oud Royale 17 ml |
| P100-OUD | Oud Royale 100 ml |
| PERF-RHINO | Rhino Royale 17 ml |
| P100-RHINO | Rhino Royale 100 ml |
| PERF-SUBLI | Sublime 17 ml |
| P100-SUBLIME | Sublime 100 ml |
| PERF-EASY | Easy Line 17 ml |
| PERF-LABOOM | Laboom 17 ml |
| PERF-SUPREMO | Supremo Elixir 17 ml |
| PERF-FER-VE | Férias no Caribe by Virgínia Esquivel |
| PERF-LUA-VE | Lua de Mel em Paris by Virgínia Esquivel |

## Presentes no texto, mas sem produto correspondente no catálogo ativo

Mind Chai; Sérum Facial Lumino3; condicionador Ozon-Kesen; Prokesen;
Ativador Master Curls; Ozon Power; Ozon Munity; Energético Xbooster 269 ml.
Não foram criados produtos sem código, preço e apresentação confirmados.
O bloco “Ozon Kesen” foi identificado como condicionador pelo modo de uso;
não foi confundido com o shampoo nem com a máscara.

## Retirada dos acessórios

AC-CXMEM, AC-CAM-P, AC-CAM-R e AC-SQUEEZE não aparecem mais na Home, favoritos,
compra rápida, relacionados ou sitemap; as páginas retornam não encontrado.
O carrinho restaurado exclui essas referências e o servidor recusa novas compras.
Pedidos antigos e seus itens permanecem intactos.

**Pendente no Supabase:** executar somente a nova migration
supabase/migrations/202609280001_retire_accessories.sql para marcar os acessórios
como is_deleted no cadastro. Não foi executada remotamente nesta entrega.
O aplicativo já bloqueia a venda, independentemente dessa marcação.
O script não apaga registros; não é necessário reexecutar os quatro scripts antigos.

## Arquivos desta alteração

- lib/product-content-reviewed.ts: reconciliação e conteúdo específico recebido.
- lib/product-research.ts: integra a revisão sem apagar as pesquisas e os rótulos anteriores.
- app/produto/[code]/page.tsx: mesma descrição editorial na página, metadados e JSON-LD.
- lib/catalog-availability.ts: regra central dos acessórios retirados.
- lib/server/products.ts: bloqueio em páginas, relacionados e índice público.
- app/page.tsx: filtro na carga inicial e atualizações da Home.
- components/Navbar.tsx: remove acessórios da compra rápida.
- app/conta/favoritos/page.tsx: não oferece itens retirados/excluídos.
- store/useCartStore.ts: impede restaurar/adicionar acessórios à lista.
- app/api/checkout/route.ts: verifica retirada no servidor antes de aceitar a compra.
- supabase/migrations/202609280001_retire_accessories.sql: retirada não destrutiva do cadastro.
- tests/product-content.test.ts: cobertura editorial, versões, divergências e carrinho.
- scripts/test-product-pages-browser.mjs: teste não depende mais da antiga Caixa Memórias.
- scripts/test-product-content-browser.mjs: valida fichas, SEO e retirada em três larguras.
- scripts/test-retire-accessories-sql.mjs: valida retirada em banco local isolado, sem dados reais.
- docs/product-content-2026-09-28.md: cobertura, ausências, decisões e instrução do banco.

## Verificação

- TypeScript: sem erros.
- 18 testes automatizados: aprovados, incluindo cobertura editorial e preservação do carrinho válido.
- Teste de navegação pública: Home sem descrição nos cards; produto, galeria, ampliação,
  lista de interesse, WhatsApp e filtros de avaliações em 1440, 390 e 320 px.
- Seis fichas representativas nas três larguras: conteúdo específico, JSON-LD e ausência
  de transbordamento horizontal. Conferência visual das capturas de perfume e Ozon Cream.
- Acessórios ausentes da Home; acesso direto apresenta “Produto não encontrado” e noindex.
  Em respostas transmitidas progressivamente pelo Next.js, o status HTTP pode já ser 200;
  o teste verifica a tela indisponível, ausência de compra e noindex, não apenas o status.
- SQL em PGlite local: pode ser repetido, mantém todos os registros e referências históricas,
  sem alterar preço ou estoque. Não foi aplicado ao Supabase real.
- Não foram feitos pagamentos reais nem alterados pedidos de clientes. Não foi executado
  build de produção nesta rodada; a validação visual foi no servidor de desenvolvimento.
