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

## Confirmação de Lucas e origem dos dados — 26/11/2026

Lucas confirmou: **o link válido é o que já está na nossa loja**. Mantido `JOIN_REGISTRATION_URL` de `lib/join.ts`, sem mudança de código. A diferença com a indicação do Ozonbuilder permanece documentada apenas para histórico; não é mais uma decisão pendente.

As informações anteriores têm fontes distintas, que não devem ser confundidas:

- **Preço comum:** cadastro de produtos existente no banco, preservado nas revisões editoriais. Os registros examinados não demonstram uma única tabela externa vigente como origem de todos os preços comuns; não atribuir essa origem integralmente ao PDF recebido agora.
- **Preço de afiliado/consultor:** transcrição dos valores das 12 imagens enviadas anteriormente por Lucas, documentada em `affiliate-pricing.md` e na migração `202610090002_affiliate_price_source.sql`, de 09/10/2026. Ajustes administrativos posteriores têm sua própria trilha.
- **Descrições e apresentações:** fotos das embalagens fornecidas pela loja, pesquisa por produto nas páginas do Grupo Ozonteck, texto enviado em 28/09 informado como transcrição oficial e documento de produtos conciliado em 30/09. Referências complementares foram identificadas separadamente. Evidências: `product-label-review-2026-09-27.md`, `product-content-2026-09-28.md` e `product-document-review.md`. A apresentação de 30 sticks de 8 g vem da leitura das fotos anteriores; os hidratantes de 120 g foram tratados como nova fórmula distinta das loções antigas.

**Candidato a cadastro adicional:** o PDF atual, p. 8, mostra **WO3 Instant Firm-Up, leave-in de 300 ml**. Esse nome não foi encontrado na consulta do cadastro de 26/11. Sua presença na imagem não comprova que a unidade Recife o venda ou tenha estoque; confirmar ficha, código/EAN, fotos e preços antes de cadastrá-lo. A imagem não atribui um preço legível a esse item. “Novo” aqui significa ausente do nosso cadastro identificado, não lançamento comprovado da marca.

**Mind Chai aparece na tabela de junho**, não foi identificado no PDF nem no cadastro consultado. Também é candidato separado a confirmar. Férias no Caribe, Lua de Mel em Paris e Genolife já estão cadastrados. Lumino3, condicionador Kesen, Pro Kesen e ativador Master Curls já possuem registros excluídos; confirmar eventual retorno à venda, sem criar duplicatas.

## Decisões pendentes do responsável

1. Lucas confirmou posteriormente que os valores são de consultor. Melatozon e árabes já correspondem ao cadastro; falta o preço final ao cliente do Visaris, sem deduzir uma margem automaticamente.
2. A resposta posterior do responsável resolveu as apresentações e indisponibilidades, conforme seção abaixo. O Visaris aguarda preço ao cliente para finalizar seu cadastro.
3. Dizer se a intenção é apenas usar os materiais no site ou também executar um projeto de venda no Mercado Livre com condições e margem aprovadas.

Até essa confirmação, os preços, códigos, categorias, registros excluídos e link de indicação foram preservados. A avaliação está concluída; uma atualização comercial automática com esses materiais ainda não é segura nem inequívoca.

## Resposta do responsável aplicada — 26/11/2026

Lucas encaminhou a confirmação do pai para atualizar o catálogo e, em seguida, autorizou quantidade **9999** para Visaris. Ao ser perguntado se os preços eram de consultor ou de cliente, respondeu **“Preciso confirmar com ele”**. Portanto, o valor informado não foi convertido automaticamente em preço público.

### Aplicado e verificado

- **Shampoo Ozon Mel (`CAP-SH-MEL`) e Condicionador Mel & Ozônio (`CAP-CO-MEL`)**: desativados no Supabase por `is_deleted=true`. Os demais campos foram preservados. A comparação transacional verificou todos os produtos e a tabela de preços de afiliado; nenhuma outra linha comercial foi alterada. A máscara `CAP-MAS-MEL` continua ativa.
- Lumino3, condicionador Kesen, Pro Kesen e ativador Master Curls já estavam desativados e permaneceram assim. Mind Chai não foi encontrado no cadastro; não foi criado.
- **Instant Firm-Up**: o responsável confirmou que ainda não foi lançado. Não cadastrar nem anunciar como disponível.
- **Embalagens resolvidas:** Ozon Flex e Creat com 30 unidades; hidratante VG Sexy de 120 g; ampola Soft Hair de 20 ml. As fichas atuais já usam essas apresentações, portanto não foi necessário alterá-las nem criar duplicatas.
- O link da loja continua o anteriormente confirmado por Lucas.

Evidência de banco: `catalogo-confirmacao-aplicada-2026-11-26.json`. O total de registros permaneceu 128; os ativos passaram de 113 para 111. Evidência pública: `catalogo-publicacao-verificada-2026-11-26.json`. As páginas dos dois itens retirados não publicam dados de produto e receberam `noindex`; o sitemap tem 111 URLs, correspondentes a 107 produtos elegíveis e quatro páginas institucionais. A máscara permanece no sitemap e com dados estruturados de produto.

### Visaris preparado, sem oferta de venda ativa

Imagem original fornecida preservada, sem edição, em `public/produtos/visaris.jpg`. SHA-256: `6F6DEA32E698AA0798A4189C4AEB4E7A132A629C704ADE9C85A1756DBA7287F3`.

O material legível identifica suplemento alimentar, 60 cápsulas de 500 mg e destaque para astaxantina, luteína e zeaxantina. O texto preparado limita-se a essas informações; não define dosagem, teores individuais, tratamento ou promessas de resultado. Código interno proposto `NUT-VISARIS`, sem inventar EAN ou código oficial. A consulta anterior não encontrou produto com esse nome.

Rascunho estruturado: `visaris-cadastro-pendente-2026-11-26.json`, incluindo quantidade 9999 autorizada por Lucas e valor recebido de R$ 89,95, **ainda sem identificação de tipo de preço**. `publicPrice` e `affiliatePrice` continuam nulos e `publish=false`. Não foi criada linha vendável no banco com preço presumido. Se R$ 89,95 for consultor, falta também informar o valor final ao cliente.

### Preços preservados até confirmação

- Melatozon: cliente R$ 159,80; consultor R$ 79,90.
- Árabes 17 ml: cliente R$ 48,00; consultor R$ 18,00.
- Os números confirmados pelo pai coincidem com o preço de consultor atual desses dois grupos, mas essa coincidência não prova que essa era sua intenção. Nenhum preço foi alterado.

O SQL reversível de retirada está em `supabase/manual/20261126_descontinuar_shampoo_condicionador_mel.sql`. Uma eventual restauração futura exige nova decisão comercial, usando os mesmos IDs/códigos do registro antes/depois; não cadastrar cópias. Os controles adicionais de retirada no código aguardam publicação da Netlify; a desativação no banco e o sitemap público já foram comprovados.

### Confirmação posterior do tipo de preço — 26/11/2026

Lucas informou **“Ele respondeu consultor”**, resolvendo a classificação dos três valores: Melatozon R$ 79,90; árabes de 17 ml R$ 18,00; Visaris R$ 89,95. Os dois primeiros já correspondem aos preços de afiliado cadastrados e não exigem alteração. O rascunho do Visaris passou a registrar `reportedPriceType="consultor"` e `affiliatePrice=89.95`, preservando estoque solicitado 9999, `publicPrice=null` e `publish=false`. Falta apenas o preço comercial ao cliente para ativar esse produto; não aplicar automaticamente o dobro nem outra margem. Os trechos anteriores sem classificação ficam preservados como histórico.
