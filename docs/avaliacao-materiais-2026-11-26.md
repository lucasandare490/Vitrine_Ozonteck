# Materiais recebidos e comparação com a loja — 26/11/2026

## Escopo e fontes

Solicitação de Lucas: avaliar os materiais enviados pelo pai, retomar as pendências e centralizar/melhorar a paginação. A mensagem encaminhada sobre publicar no Mercado Livre é uma referência comercial recebida, não uma ordem de execução dada por Lucas.

- `CATALOGO DE PRODUTOS  2026 V.3.0.0.pdf`: 41 páginas, edição visual MAR/2026; metadados de criação em 17/03/2026. Todas as páginas foram renderizadas e examinadas. A maior parte das letras é desenho vetorial, portanto extração de texto isolada não permite revisar o catálogo inteiro.
- `Nova Tabela JUN26.jpg.jpeg`: tabela com colunas **Consultor** e **Cliente**. O nome do arquivo indica junho, mas não prova que cada preço continue vigente em novembro.
- Capturas do WhatsApp: oferta Starter de R$ 97,90 por ano e pedido do pai para anúncios Premium, frete grátis e preços de consultor no Mercado Livre.
- Página aberta no Chrome: https://ozonbuilder.com/captura?u=mg46l4dlqjaru5w . Consulta sem enviar formulário ou adquirir plano.
- Supabase: consulta somente de leitura em 26/11 encontrou 128 produtos, sendo 113 ativos e 15 excluídos. A vitrine exibe 109 produtos elegíveis; os quatro registros técnicos ativos não entram no catálogo comercial. Foram comparados nome, código, preço comum, preço de afiliado e exclusão, sem consultar contatos de clientes.

## Ozonbuilder e Starter

A página contém apresentação em vídeo, oportunidade de distribuição, categorias de produtos, projeções comerciais, foto identificada como Rogério André, botão de WhatsApp e vários botões de cadastro oficial. Na página examinada não foi encontrado formulário próprio de captação; os botões encaminham ao cadastro externo. Isso não comprova quais recursos existem em outros planos do Ozonbuilder.

O WhatsApp é o mesmo contato público usado na nossa loja. O destino do cadastro **é diferente**:

| Origem | Destino de cadastro |
| --- | --- |
| Loja atual, `lib/join.ts` | `https://office.grupoozonteck.com/register?sponsor=643bf95c3a5758bbf990802e&combos` |
| Ozonbuilder enviado | `https://office.grupoozonteck.com/register?sponsor=64434251580208c72d4577b7` |

O parâmetro de indicação define o encaminhamento cadastral. A identidade do titular de cada identificador não foi comprovada. A troca exige confirmar qual indicação deve receber os novos cadastros; a foto e o telefone iguais não resolvem essa diferença.

A oferta Starter da imagem inclui página APN personalizada, link de cadastro, WhatsApp, foto pessoal e atualizações por pagamento anual. Nossa página de equipe já possui apresentação, encaminhamento cadastral e contato, além da captação consentida com painel de interessados e lembretes. Não foi encontrada necessidade funcional de comprar o Starter para manter essas funções. A oferta não comprova indexação, aumento de vendas ou resultado financeiro.

As projeções da página tratam a diferença entre compra e revenda como lucro. Essa diferença ainda não desconta frete, tarifas, impostos, devoluções e outros custos. Exemplo aritmético: comprar por R$ 15 e vender por R$ 45 produz R$ 30 de diferença bruta; 200% sobre o custo e 66,67% sobre a venda são medidas distintas, sem representar lucro líquido garantido. Não foram incorporadas promessas de renda ao site.

## Tabela de junho versus produtos atuais

Valores abaixo são em reais. “Loja” corresponde ao preço cadastrado em 26/11, não a uma proposta de alteração. Preço de consultor e preço ao cliente são campos distintos no projeto. A decisão anterior de liberar preço de afiliado por aprovação manual permanece vigente.

### Diferenças monetárias em cadastros ativos comparáveis

| Produto/código | Loja: cliente / afiliado | Tabela JUN26: cliente / consultor | Observação |
| --- | --- | --- | --- |
| Árabes 17 ml: `PERF-AALI`, `PERF-OUD`, `PERF-RHINO`, `PERF-SUBLI` | 48,00 / 18,00 | 54,00 / 18,00 | A tabela altera o preço ao cliente, não o custo de consultor. |
| NX Cap `NUT-NXCAP` | 159,92 / 79,96 | 159,90 / 79,95 | O PDF, p. 20, também mostra 159,92. |
| Luminous Vita `NUT-LUMI` | 159,90 / 79,95 | 158,90 / 79,45 | O PDF, p. 26, também mostra 159,90. |
| Melatozon `NUT-MELAT` | 159,80 / 79,90 | 119,80 / 59,90 | O PDF, p. 27, também mostra 159,80. |
| Cobalactin `NUT-COBAL` | 179,70 / 89,85 | 179,90 / 89,95 | O PDF, p. 19, mostra 179,70. |
| OX `NUT-OX` | 179,70 / 89,85 | 179,90 / 89,95 | O PDF, p. 26, mostra 179,70. |
| Óleo de Açaí `CAP-O-ACAI` | 105,00 / 52,50 | 105,90 / 52,95 | O PDF, p. 7, mostra 105,00. |
| Shampoo Mel & Ozônio `CAP-SH-MEL` | 109,90 / 54,95 | 119,90 / 59,95 | Confirmar apresentação e tabela vigente. |
| Condicionador Mel & Ozônio `CAP-CO-MEL` | 109,90 / 54,95 | 79,90 / 39,95 | Confirmar apresentação e tabela vigente. |
| Máscara Mel & Ozônio `CAP-MAS-MEL` | 119,90 / 59,95 | 105,90 / 52,95 | Confirmar apresentação e tabela vigente. |

### Apresentações e regras que impedem importação direta

| Material | Cadastro/decisão existente | Conferência necessária |
| --- | --- | --- |
| Nano Blend: tabela especifica 20 unidades por caixa, cliente 199,80 / consultor 99,90 | Creat sem sabor, Creat Morango e Flex: caixas descritas como 30 unidades, cliente 299,90 / afiliado 99,90 | Confirmar embalagem física e quantidade antes de associar preços. O PDF pp. 21–23 mostra 199,80, mas não resolve a quantidade da caixa fotografada no estoque. |
| Creat do PDF p. 21 mostra stick com 8,5 g | Fichas atuais de Creat: sticks de 8 g | Verificar rótulo/lote real. Alterar peso também afeta ficha e logística. |
| Ampola: tabela 18 ml e 79,90 / 39,95; PDF p. 6 mostra 20 ml e **97,90** | Loja: 79,90 / 39,95; descrição de 20 ml | O próprio material diverge em volume e preço. |
| Hidratantes: tabela VG Sexy e MB Espeed Black 250 g, ambos 79,90 / 39,95 | VG Sexy e Speed Black cadastrados como 120 g | Não equiparar 120 g a 250 g pelo nome ou pelo preço. PDF pp. 16–17 traz 79,90; confirmar embalagem. |
| WO3: tabela apresenta preços de consultor para seis produtos | Regra anterior da loja mantém WO3 no preço comum, sem benefício de afiliado | A nova tabela conflita com essa decisão comercial. Os seis preços comuns coincidem com PDF p. 8 e tabela: Deep 375,40; Soft 335,40; LPC 555,40; HMS 515,40; CIF 495,40; AMR 595,40. |
| Melatozon: PDF p. 27 diz framboesa | Ficha atual diz tutti-frutti | Confirmar formulação/lote; não trocar sabor por inferência. |
| Body and Hair Splash: PDF pp. 10–11, 200 ml, 180,90 | Férias no Caribe e Lua de Mel em Paris: cliente 179,90 / afiliado 59,95 | A tabela não inclui esses lançamentos; o PDF difere do preço comum atual em 1,00. |

### Valores coincidentes e lacunas

- Perfumes comuns de 17 ml: tabela cliente 45,00 / consultor 15,00, coincidentes com os cadastros dessa família. Perfumes comuns de 100 ml: 179,90 / 89,95; árabes de 100 ml: 199,90 / 99,95, também coincidentes. O PDF não é uma lista completa de todos os SKUs/tamanhos existentes no site.
- Coincidem nos cadastros ativos identificados: Sofh, Sofh D, Life Shii, Oxylush, OX3, Fresh, Pure Hot, Haydek, Trix, Ozon Cream, tônico, shampoos Kesen/Blond/Master Curls/For Men, máscaras Kesen/Blond/Master Curls, shampoo/condicionador/leave-in Kids, Xbooster, Boryslim, Vita Ozon Plus, Virtuous, Tri Magnésio, Ômega 3, K2/D3 e Dream Bliss. A coincidência de preço não elimina as divergências de embalagem descritas acima.
- Genolife aparece no PDF p. 25 por 179,70, coincidente com o cadastro atual, mas não foi identificado na tabela de junho. A tabela não é substituta integral do catálogo nem da loja.
- Lumino3, energético Xbooster 269 ml, condicionador Kesen, ativador Master Curls e Pro Kesen estão na tabela, mas seus registros locais estão excluídos. Power/Munity/Amyno também possuem registros excluídos em apresentações que não devem ser confundidas com as caixas da tabela. A existência de um produto no material não comprova disponibilidade de estoque nem autoriza reativação.
- Mind Chai, citado na tabela, não foi identificado por nome no cadastro consultado. Caixas de Ozon Lev/Power/Munity não têm correspondência ativa comprovada; uma unidade de Ozon Lev não equivale a uma caixa. Não criar SKUs, estoque, EAN, dimensões ou ingredientes a partir de nome e preço.
- A foto WO3 do PDF inclui Instant Firm-Up, sem preço legível atribuído a ele e sem correspondência ativa identificada. Exige ficha e condição de venda próprias.
- O PDF oferece imagens institucionais e descrições para revisar o conteúdo; algumas alegações promocionais não substituem rótulo, composição ou comprovação. Preservar o texto revisado já existente e validar cada nova característica antes de publicá-la.

## Mercado Livre: pedido encaminhado pelo pai

Publicar todos os itens como Premium, com frete grátis e pelo preço de consultor exige uma decisão comercial independente. Se o custo de aquisição for o preço de consultor, vendê-lo pelo mesmo preço deixa diferença bruta zero antes das tarifas e do frete.

A documentação oficial confirma que os custos dependem de categoria, tipo de anúncio, logística e outros parâmetros. Conferir por produto no [simulador oficial](https://www.mercadolivre.com.br/simulador-de-custos) e na [documentação de custos](https://developers.mercadolivre.com.br/pt_br/comissao-por-vender). Não assumir uma tarifa única nem custo zero de envio. A regra vigente e a elegibilidade precisam ser consultadas na conta vendedora para cada anúncio.

Antes de uma publicação futura: confirmar conta vendedora autorizada, preços de venda aprovados, custo/estoque real, embalagem, peso, dimensões, códigos de barras e correspondência de apresentação. O catálogo não contém sozinho todos esses dados para todos os produtos. Nenhum anúncio ou assinatura foi criado nesta avaliação.

## Decisões pendentes do responsável

1. Confirmar qual dos dois links de indicação deve ser usado na loja.
2. Confirmar a tabela vigente e a embalagem/lote dos produtos divergentes; decidir se a regra WO3 muda.
3. Dizer se a intenção é apenas usar os materiais no site ou também executar um projeto de venda no Mercado Livre com condições e margem aprovadas.

Até essa confirmação, os preços, códigos, categorias, registros excluídos e link de indicação foram preservados. A avaliação está concluída; uma atualização comercial automática com esses materiais ainda não é segura nem inequívoca.
