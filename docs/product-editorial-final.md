# Revisao editorial do catalogo - 30/09/2026

Comparados 119 blocos fornecidos com 127 registros (117 produtos comerciais ativos, 6 retirados e 4 testes).
O inventario de antes esta em product-editorial-comparison.json. O mapa completo por produto, com material original, cadastro, identidade, fontes, lacunas historicas e conteudo publico final, esta em product-editorial-final.json.

## Resultado e limites

- 117 fichas publicas com descricao. Isso nao significa ficha tecnica integral ou resolucao de todas as lacunas.
- Codigos internos, codigos oficiais, EAN, precos, estoque, nomes e imagens preservados. Nenhum SQL executado e nenhuma escrita no Supabase.
- Publicacao usa a camada editorial local. A coluna description do banco e o painel administrativo nao foram reescritos; novos cadastros sem ficha local continuam usando sua descricao cadastrada.
- Descricao, especificacoes, uso e precaucoes usam os componentes existentes. Pesquisa, fontes e campos ausentes nao aparecem para clientes.
- Toque Luminoso, energetico 269 ml e quatro acessorios continuam retirados. Xbooster em capsulas e um produto diferente e foi preservado.
- A revisao do material cobre todos os produtos. A pesquisa complementar nao confirmou todos os campos: nao ha promessa de completude.

## Divergencias e decisoes

- Perfumes: familias divergentes de DG Red, Seduction, Famma e 303 VIP omitidas. Etapas divergentes de 303 Men, 303 VIP e Sentimento omitidas; nas descricoes permanecem caracteristicas comuns aos trechos. Fundo de 303 Woman, Angelical e Soul nao e apresentado como piramide completa. Citacoes a outras marcas nao identificam criador ou formula Ozonteck.
- Haydek: manteiga de karite mantida; ureia versus hydroxyethyl urea nao foi resolvida por equivalencia presumida.
- Master Curls: o bloco fornecido esta associado ao mesmo codigo oficial 40558 e EAN da ficha. Composicao com argan e proteinas hidrolisadas, pausa de 20 a 30 minutos e precaucoes foram preservadas desse bloco; o nome cadastrado nao foi alterado para PRO. A variacao de nome permanece registrada internamente.
- Correcao apos retorno do usuario: recuperados detalhes, vitaminas, caracteristicas e instrucoes que haviam sido excessivamente resumidos. Descricoes longas usam paragrafos; vitaminas, componentes, uso e precaucoes permanecem em secoes proprias. Nao se usa concisao como motivo para descartar informacao.
- Genolife: fontes de 60 comprimidos nao substituem a apresentacao de 30 do material. Cobalactin: sabor conflitante omitido. Melatozon em capsulas nao substitui gotas.
- Creat Morango: paginas com 8 g nao substituem os 8,5 g do material; peso do sache nao e dose de creatina. Amyno: nao se transferiram formula, preparo e quantidade da caixa para a unidade.
- Virtuous e Luminous: formulas divergentes de revendas nao substituem componentes do material. Sofh D, K2 e outros suplementos: dosagens externas sem correspondencia de rotulo nao incorporadas.
- Dimensoes e peso logistico do material continuam no mapa interno, sem conversao em conteudo liquido. Notas de aroma nao sao lista de ingredientes.

## Pesquisa complementar

Fontes especificas de Aaliyah, Oud Royale, Rhino Royale, Sublime, Supremo, body splashes e Amyno ficam em sources de cada registro no JSON e em lib/product-content-complementary.ts. As fontes sao secundarias; nao foram elevadas a documentacao do fabricante.
Outras consultas relevantes, sem adotar dosagens, formulas conflitantes ou instrucoes sem identificacao suficiente:

- https://grupoozonteck.com/produtos/boryslim - pagina oficial sem texto tecnico suficiente.
- https://grupoozonteck.com/produtos/virtuous-caps - pagina oficial sem texto tecnico suficiente.
- https://ozonteckloja.com.br/virtuous-caps-cabelo-pele-unha-ozonteck/p - apoio aos componentes; nao formula completa.
- https://ozonteckcosmetico.com.br/produto/luminous-vita/ - componentes divergem do material; nao adotados.
- https://ozonteckcosmetico.com.br/produto/genolife-kids/ - formula divergente; nao adotada.
- https://ozonio-shop.lojaintegrada.com.br/genolife-kids - outra quantidade de comprimidos; posologia nao transferida.
- https://ozonteckcuritiba.lojavirtualnuvem.com.br/produtos/ozon-creat-morango-caixa/ - peso divergente; nao adotado.
- https://www.app-ozonteck.com/lumino3-serum-facial/ - nao confirma a identidade por codigo/EAN para transferir protocolo.
- https://www.ozonteckstore.com.br/mascara-para-cabelos-cacheados-master-curls - mistura nome sem PRO com descricao PRO.
- https://ozonteckloja.com.br/mascara-ozon-blond-linha-matizadora-ozonteck/p - confirma proposta cosmetica; sem acrescentar protocolo nao confirmado.
- Buscas por WO3 AMR/CIF/HMS/LPC/Soft Cleanse/Deep Cleanse nao localizaram protocolo suficientemente identificado. Permanecem os dados do material.

## Mapa por produto

### BE-SOFH - Óleo Sofh

Sofh é um óleo de girassol ozonizado para o cuidado externo da pele. Sua textura oleosa ajuda a manter a maciez e a hidratação, especialmente em áreas ressecadas. O frasco conta-gotas permite distribuir o produto durante a aplicação.

O cuidado combina óleo ozonizado e ácidos graxos essenciais para nutrir a pele e ajudar a manter sua barreira de hidratação. A textura favorece o cuidado de áreas secas, com maciez e sensação de pele revitalizada.

- Categoria: Bem Estar
- Tipo de uso: Uso externo
- Ativos destacados: Óleo de girassol ozonizado.
- Código original (Grupo Ozonteck): 40568
- Código EAN: 7898760210028
- Ativos destacados: Óleo de girassol ozonizado.
- Precauções: Uso externo. Não é medicamento. Evite contato com os olhos; em caso de contato, lave com água em abundância. Conserve em local arejado, longe da luz e do calor excessivo. Mantenha fora do alcance de crianças e animais domésticos. Em caso de ingestão acidental, procure assistência médica levando a embalagem.
- Características: Óleo ozonizado para cuidado externo da pele. Hidratação e nutrição de áreas ressecadas. Toque macio e cuidado da barreira cutânea.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-OX3 - Sabonete OX3

OX3 é um sabonete ozonizado para a higiene das mãos e do corpo. Combina limpeza suave com hidratação e uma sensação refrescante durante o banho. A textura leve e o aspecto perolado complementam o cuidado diário da pele.

O extrato de bardana se combina às micropartículas de pérolas à base de mica natural em uma fórmula de textura leve. Vitaminas A, B, C e E e ácidos graxos essenciais complementam o cuidado nutritivo, equilibrando limpeza e hidratação.

Pode integrar tanto a higiene das mãos quanto o banho. Sua proposta desodorizante ajuda a neutralizar odores na pele, deixando sensação de frescor e perfumação após a limpeza.

- Categoria: Bem Estar
- Ativos destacados: Extrato de bardana e micropartículas de mica natural. Vitaminas A, B, C e E e ácidos graxos essenciais.
- Código original (Grupo Ozonteck): 40569
- Código EAN: 7898760210158
- Ativos destacados: Extrato de bardana e micropartículas de mica natural. Vitaminas A, B, C e E e ácidos graxos essenciais.
- Características: Limpeza das mãos e do corpo. Textura leve, acabamento perolado e sensação de frescor.
- Benefícios cosméticos: Limpeza suave dos poros e remoção de impurezas. Hidratação, nutrição e revitalização da pele. Sensação refrescante durante o uso.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-LUSH - Esfoliante Oxylush

Oxylush é um esfoliante facial que remove células mortas e impurezas superficiais. A esfoliação favorece uma textura mais suave e uniforme ao toque, preparando a pele para as próximas etapas da rotina de cuidados.

A remoção das células acumuladas na superfície favorece a renovação da aparência da pele e um toque mais uniforme. O cuidado esfoliante complementa a rotina facial, deixando o rosto com aspecto luminoso e revitalizado.

- Categoria: Bem Estar
- Código original (Grupo Ozonteck): 40567
- Código EAN: 7898760210578
- Aplicação: Esfoliação facial.
- Benefícios cosméticos: Remoção de células mortas e impurezas superficiais. Melhora da textura e da suavidade ao toque. Preparação da pele para as próximas etapas de cuidado.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-SHII - Life Shii

Life Shii é um gel ozonizado de massagem corporal com sensação refrescante. A textura leve facilita o deslizamento das mãos e os movimentos de massagem, combinando conforto, emoliência e cuidado da pele.

A combinação de mentol e cânfora contribui para a sensação de frio durante a aplicação. Os demais ativos completam a proposta sensorial da massagem, com emoliência e hidratação para melhorar o toque e a elasticidade da pele.

- Categoria: Bem Estar
- Tipo de uso: Uso externo
- Ativos destacados: Arnica, pimenta, gengibre, camélia, alecrim, salicilato de metila, cânfora e mentol.
- Código original (Grupo Ozonteck): 40570
- Código EAN: 7898760210103
- Ativos destacados: Arnica, pimenta, gengibre, camélia, alecrim, salicilato de metila, cânfora e mentol.
- Precauções: Uso externo. Não utilizar durante a gravidez, em menores de 7 anos ou sobre pele irritada ou lesionada. Faça um teste de sensibilidade antes do primeiro uso. Evite contato com os olhos; se ocorrer, lave com água em abundância. Suspenda o uso em caso de irritação ou sinais de intoxicação e procure orientação médica. Não ingerir; em caso de ingestão, procure um médico levando a embalagem. Mantenha fechado, fora do alcance de crianças, em local fresco e seco, protegido da luz e do calor.
- Benefícios cosméticos: Sensação de conforto e relaxamento durante a massagem. Refrescância e cuidado de pernas com sensação de cansaço e peso. Hidratação, suavidade e melhora do sensorial da pele.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-PURE - Pure Hot

Pure Hot é um gel de massagem corporal à base de água com sensação de aquecimento. Sua textura suave e deslizante facilita a massagem e combina absorção rápida com hidratação e toque macio, sem acabamento pegajoso.

Indicado para homens e mulheres, Pure Hot combina polímeros condicionantes e base aquosa ozonizada. A consistência facilita a aplicação e o deslizamento, oferecendo uma experiência de massagem aquecida e confortável.

- Categoria: Bem Estar
- Tipo de uso: Uso externo
- Ativos destacados: Polímeros condicionantes.
- Código original (Grupo Ozonteck): 40797
- Código EAN: 7898760210608
- Ativos destacados: Polímeros condicionantes.
- Textura: Gel de base aquosa.
- Precauções: Uso externo. Não ingerir nem aplicar sobre pele irritada ou lesionada. Em caso de irritação ou reação indesejável, suspenda o uso e procure um médico. Evite os olhos; em caso de contato, enxágue abundantemente. Mantenha fora do alcance de crianças e conserve em temperatura ambiente, longe da luz e do calor. Não utilize se a embalagem estiver violada.
- Benefícios cosméticos: Sensação de aquecimento agradável. Hidratação para pele macia e suave. Absorção rápida e acabamento sem resíduos pegajosos.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-FRESH - Ozon Fresh

Ozon Fresh é um creme dental ozonizado para a rotina de higiene bucal. Sua aplicação na escovação auxilia a limpeza dos dentes e gengivas.

- Categoria: Bem Estar
- Código original (Grupo Ozonteck): 369845
- Código EAN: 7898996428211
- Modo de uso: Escove os dentes após as refeições, três vezes ao dia, ou conforme orientação do dentista. Enxágue após a escovação.
- Precauções: Não ingerir. Não utilizar em crianças menores de 6 anos. Mantenha fora do alcance de crianças. Evite contato com os olhos; em caso de contato, enxágue abundantemente. Em caso de reação indesejável, suspenda o uso e procure um dentista.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-HID-SB - Hidratante Speed Black 120g

Hidratante Speed Black ozonizado para o cuidado corporal, na apresentação de 120 g.

A nova fórmula combina hidratação corporal e uma proposta sensorial voltada ao cuidado diário da pele, com a tecnologia de ozonização da linha.

- Categoria: Bem Estar
- Apresentação: 120 g
- Código original (Grupo Ozonteck): 44988
- Código EAN: 7898760211230
- Apresentação: 120 g

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-HID-VG - Hidratante VG Sexy 120g

Hidratante VG Sexy ozonizado para o cuidado corporal, na apresentação de 120 g.

A nova fórmula combina hidratação corporal e uma proposta sensorial voltada ao cuidado diário da pele, com a tecnologia de ozonização da linha.

- Categoria: Bem Estar
- Apresentação: 120 g
- Código original (Grupo Ozonteck): 40564
- Código EAN: 7898760211209
- Apresentação: 120 g

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-HAY - Haydek

Haydek é um creme ozonizado para os pés, com textura leve e rápida absorção. O cuidado combina hidratação, maciez e controle do mau odor, ajudando a reduzir o aspecto ressecado e áspero da pele.

A tecnologia Matrix 3D integra um complexo de extratos vegetais à manteiga de karité. A combinação cuida da hidratação dos pés e ajuda a manter a pele mais macia, com aplicação facilitada pela válvula dosadora.

- Categoria: Bem Estar
- Apresentação: 120 g, com válvula dosadora
- Ativos destacados: Manteiga de karité. Complexo de extratos vegetais.
- Código original (Grupo Ozonteck): IMP-199
- Código EAN: 7898760210615
- Apresentação: 120 g, com válvula dosadora
- Ativos destacados: Manteiga de karité. Complexo de extratos vegetais.
- Tecnologia: Matrix 3D.
- Benefícios cosméticos: Cuidado do mau odor dos pés. Hidratação de áreas ressecadas e ásperas. Textura leve e rápida absorção.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-TRIX - Ozon Trix

Ozon Trix é um desodorante ozonizado em spray para o cuidado das axilas. Combina controle do odor e hidratação em uma textura leve, sem alumínio. O acabamento invisible evita resíduos brancos na pele e nos tecidos.

A proposta multifuncional reúne desodorização, hidratação e cuidado da aparência das axilas. Ácido kójico, ácido hialurônico e extrato de alcaçuz se associam à tecnologia Matrix 3D para uma rotina de cuidado que inclui a uniformização gradual do tom da pele.

- Categoria: Bem Estar
- Apresentação: Spray de 30 ml
- Ativos destacados: Ácido kójico, ácido hialurônico e extrato de alcaçuz.
- Código original (Grupo Ozonteck): IMP-198
- Código EAN: 7898760210622
- Apresentação: Spray de 30 ml
- Ativos destacados: Ácido kójico, ácido hialurônico e extrato de alcaçuz.
- Tecnologia: Matrix 3D. Acabamento invisible.
- Benefícios cosméticos: Controle do mau odor. Hidratação e revitalização da pele das axilas. Uniformização gradual do tom da pele. Fórmula livre de alumínio e sem resíduo branco.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-AMP-SF - Ampola Soft Hair

Soft Hair é uma ampola de tratamento capilar para fios danificados, ressecados ou opacos. A combinação de nanoaminoácidos e queratina de baixo peso molecular reúne hidratação, nutrição e reconstrução cosmética. O cuidado melhora a maciez, o brilho e a maleabilidade, reduzindo o aspecto de frizz e porosidade.

A fórmula ozonizada atua no cuidado das cutículas e da fibra capilar, combinando emoliência e nutrição. É especialmente voltada a cabelos muito danificados, com aspecto emborrachado, ressecamento ou perda de brilho, para recuperar a aparência de resistência e sedosidade.

- Categoria: Cuidados Capilares
- Ativos destacados: Nanoaminoácidos e queratina de baixo peso molecular.
- Código original (Grupo Ozonteck): 40561
- Código EAN: 7898996428204
- Ativos destacados: Nanoaminoácidos e queratina de baixo peso molecular.
- Indicação: Todos os tipos de cabelo, especialmente os danificados.
- Benefícios cosméticos: Hidratação e nutrição intensivas. Cuidado do aspecto emborrachado dos fios. Melhora do brilho, da resistência e da maciez. Redução do frizz e da porosidade.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-SH-OK - Shampoo Ozon-Kesen

O Shampoo Ozon-Kesen limpa suavemente cabelos submetidos a coloração, alisamento ou relaxamento, além de fios ressecados. Queratina e manteiga de cupuaçu combinam cuidado da fibra, hidratação e maciez na rotina pós-química.

O cuidado pós-química reúne limpeza e reconstrução cosmética, ajudando a preservar a vivacidade dos cabelos tingidos. A fórmula com pH balanceado complementa a rotina de fios sensibilizados, enquanto a queratina e a manteiga de cupuaçu cuidam da estrutura e da retenção de umidade.

- Categoria: Cuidados Capilares
- Linha: Ozon-Kesen
- Tipo de uso: Uso externo
- Ativos destacados: Queratina e manteiga de cupuaçu ozonizada.
- Código original (Grupo Ozonteck): 40546
- Código EAN: 7898996428242
- Ativos destacados: Queratina e manteiga de cupuaçu ozonizada.
- Modo de uso: Aplique nos cabelos molhados, massageie suavemente o couro cabeludo e distribua pelos fios. Enxágue completamente. Continue o cuidado com a Máscara Ozon-Kesen.
- Precauções: Uso externo. Evite contato com os olhos e mantenha fora do alcance de crianças. Faça um teste de sensibilidade antes do primeiro uso. Conserve em local fresco e seco, protegido da luz solar. Em caso de contato com os olhos, lave imediatamente com água corrente.
- Características: Fórmula com pH balanceado. Cuidado da cor de cabelos tingidos. Reconstrução cosmética e proteção dos fios pós-química.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-MAS-OK - Máscara Ozon-Kesen

A Máscara Ozon-Kesen é um tratamento pós-química para cabelos ressecados e sensibilizados por coloração, alisamento ou relaxamento. Manteiga de cupuaçu e queratina combinam retenção de umidade e reconstrução cosmética, deixando os fios macios, maleáveis e com brilho.

A manteiga de cupuaçu ajuda a reter a umidade, enquanto a queratina cuida das áreas danificadas da fibra e da resistência à quebra. A aplicação mecha a mecha distribui o tratamento pelo comprimento, preparando os cabelos para a etapa de condicionamento.

- Categoria: Cuidados Capilares
- Linha: Ozon-Kesen
- Tipo de uso: Uso externo
- Ativos destacados: Manteiga de cupuaçu e queratina.
- Código original (Grupo Ozonteck): 40547
- Código EAN: 7898996428259
- Ativos destacados: Manteiga de cupuaçu e queratina.
- Modo de uso: Após lavar, aplique mecha a mecha por todo o comprimento e massageie suavemente. Deixe agir de 20 a 40 minutos, enxágue bem e aplique o Condicionador Ozon-Kesen.
- Precauções: Uso externo. Evite contato com os olhos e mantenha fora do alcance de crianças. Faça um teste de sensibilidade antes do primeiro uso. Conserve em local fresco e seco, protegido da luz solar. Em caso de contato com os olhos, lave imediatamente com água corrente.
- Benefícios cosméticos: Hidratação e retenção de umidade. Reconstrução cosmética de fios sensibilizados. Cuidado da resistência à quebra. Maciez, maleabilidade e brilho.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-SH-MC - Shampoo Master Curls

O Shampoo Master Curls cuida de cabelos ondulados, cacheados e crespos. A combinação de óleos de argan e macadâmia associa limpeza, hidratação e nutrição, favorecendo maciez e facilidade para modelar os cachos.

Além da limpeza, a fórmula oferece emoliência e cuidado da fibra sensibilizada por química ou agressões externas. O equilíbrio entre hidratação e nutrição favorece a modelagem diária de cabelos ondulados, cacheados e crespos, mantendo os fios suaves e sedosos.

- Categoria: Cuidados Capilares
- Linha: Master Curls
- Tipo de uso: Uso externo
- Ativos destacados: Óleos de argan e macadâmia. Vitaminas A, C, D, E e F e ômegas 3 e 6.
- Código original (Grupo Ozonteck): 40557
- Código EAN: 7898996428297
- Ativos destacados: Óleos de argan e macadâmia. Vitaminas A, C, D, E e F e ômegas 3 e 6.
- Modo de uso: Aplique nos cabelos úmidos, massageie suavemente até formar espuma e enxágue. Repita se necessário.
- Precauções: Uso externo. Evite contato com os olhos e mantenha fora do alcance de crianças. Faça um teste de sensibilidade antes do primeiro uso. Conserve em local fresco e seco, protegido da luz solar. Em caso de contato com os olhos, lave imediatamente com água corrente.
- Vitaminas e nutrientes: Vitaminas A, C, D, E e F. Ômegas 3 e 6.
- Benefícios cosméticos: Hidratação intensa e emoliência. Cuidado da resistência da fibra capilar. Maciez e facilidade para modelar os cachos.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-MAS-MC - Máscara Master Curls

A Máscara Master Curls é um tratamento para hidratação e condicionamento de cabelos ondulados, cacheados e crespos. Sua proposta combina maciez, brilho e controle do frizz para favorecer cachos definidos e maleáveis.

A fórmula ozonizada reúne óleo de argan e proteínas hidrolisadas para nutrir e condicionar os fios. O tratamento é voltado à recuperação da maciez, do brilho e da definição, com cuidado do frizz e das agressões ambientais.

- Categoria: Cuidados Capilares
- Linha: Master Curls
- Tipo de uso: Uso externo
- Ativos destacados: Óleo de argan e proteínas hidrolisadas.
- Código original (Grupo Ozonteck): 40558
- Código EAN: 7898760210592
- Ativos destacados: Óleo de argan e proteínas hidrolisadas.
- Modo de uso: Após lavar com o Shampoo Master Curls, aplique a máscara nos cabelos úmidos, distribuindo uniformemente mecha a mecha. Deixe agir de 20 a 30 minutos e enxágue completamente.
- Precauções: Uso externo. Evite contato com os olhos e mantenha fora do alcance de crianças. Faça um teste de sensibilidade antes do primeiro uso. Conserve em local fresco e seco, protegido da luz solar. Em caso de contato com os olhos, lave imediatamente com água corrente.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-SH-BL - Shampoo Ozon-Blond

O Shampoo Ozon Blond limpa suavemente cabelos loiros, descoloridos e grisalhos. Os agentes matizadores ajudam a neutralizar tons amarelados e alaranjados, enquanto os extratos de violeta e camomila complementam o cuidado com maciez e brilho.

A linha Ozon Blond combina extratos de violeta e camomila, vitaminas A e C e agentes matizadores. O cuidado dos fios claros reúne neutralização dos reflexos indesejados, reposição de queratina e recuperação da aparência da fibra sensibilizada pela descoloração.

A hidratação ajuda a restaurar a umidade, favorecendo penteabilidade, maleabilidade e sedosidade. A fórmula livre de parabenos cuida da textura dos fios para um resultado mais leve, macio e luminoso.

- Categoria: Cuidados Capilares
- Linha: Ozon Blond
- Ativos destacados: Extratos de violeta e camomila e agentes matizadores.
- Código original (Grupo Ozonteck): 40555
- Código EAN: 7898760210004
- Ativos destacados: Extratos de violeta e camomila e agentes matizadores.
- Características: Limpeza e matização dos fios claros. Fórmula livre de parabenos.
- Vitaminas: Vitaminas A e C.
- Benefícios cosméticos: Neutralização dos tons amarelados e alaranjados. Reposição de queratina e cuidado da fibra descolorida. Hidratação, penteabilidade e maleabilidade. Maciez, sedosidade, brilho e leveza.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-MAS-BL - Máscara Ozon-Blond

A Máscara Ozon Blond combina matização e condicionamento para cabelos loiros, descoloridos e grisalhos. Ajuda a neutralizar tons amarelados e alaranjados e a restaurar a umidade dos fios, melhorando a maciez, a maleabilidade e a facilidade para pentear.

A linha Ozon Blond combina extratos de violeta e camomila, vitaminas A e C e agentes matizadores. O cuidado dos fios claros reúne neutralização dos reflexos indesejados, reposição de queratina e recuperação da aparência da fibra sensibilizada pela descoloração.

A hidratação ajuda a restaurar a umidade, favorecendo penteabilidade, maleabilidade e sedosidade. A fórmula livre de parabenos cuida da textura dos fios para um resultado mais leve, macio e luminoso.

- Categoria: Cuidados Capilares
- Linha: Ozon Blond
- Ativos destacados: Extratos de violeta e camomila e agentes matizadores.
- Código original (Grupo Ozonteck): 40556
- Código EAN: 7898760210080
- Ativos destacados: Extratos de violeta e camomila e agentes matizadores.
- Características: Condicionamento e cuidado de fios descoloridos. Fórmula livre de parabenos.
- Vitaminas: Vitaminas A e C.
- Benefícios cosméticos: Neutralização dos tons amarelados e alaranjados. Reposição de queratina e cuidado da fibra descolorida. Hidratação, penteabilidade e maleabilidade. Maciez, sedosidade, brilho e leveza.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-KIDS-SH - Shampoo Kids

O Shampoo Kids Ozon Splash oferece limpeza suave para todos os tipos de cabelos infantis. Extratos de frutas vermelhas e banana compõem uma fórmula voltada à hidratação equilibrada, ao brilho e à maciez, tornando os fios mais fáceis de cuidar na rotina diária.

Os extratos de frutas vermelhas e banana são ricos em vitaminas A, B e C. A combinação ozonizada oferece cuidado hidratante, suavizante e remineralizante para os cabelos infantis, favorecendo brilho, maciez e maleabilidade na rotina diária.

A limpeza utiliza surfactantes de baixa irritabilidade, com uma fórmula suave e balanceada que limpa sem pesar, deixando os fios perfumados.

- Categoria: Cuidados Capilares
- Linha: Kids Ozon Splash
- Público: Infantil.
- Ativos destacados: Extratos de frutas vermelhas e banana.
- Código original (Grupo Ozonteck): 40552
- Código EAN: 7898760210035
- Ativos destacados: Extratos de frutas vermelhas e banana.
- Características: Uso diário. Fórmula livre de parabenos, silicones e sal.
- Vitaminas e nutrientes: Vitaminas A, B e C presentes nos extratos de frutas vermelhas e banana. Reposição de vitaminas e minerais na fibra capilar.
- Características da fórmula: Livre de parabenos, silicones e sal. Hipoalergênica. Dermatologicamente e oftalmologicamente testada. Não testada em animais.
- Público: Crianças de todas as idades.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-KIDS-CO - Condicionador Kids

O Condicionador Kids Ozon Splash cuida dos cabelos infantis após a limpeza. Sua textura leve e hidratante ajuda a deixar os fios macios, sedosos e maleáveis, com extratos de frutas vermelhas e banana para complementar a rotina diária.

Os extratos de frutas vermelhas e banana são ricos em vitaminas A, B e C. A combinação ozonizada oferece cuidado hidratante, suavizante e remineralizante para os cabelos infantis, favorecendo brilho, maciez e maleabilidade na rotina diária.

O condicionamento após a lavagem cuida do comprimento e ajuda a repor a maciez depois das atividades do dia. A fórmula oferece hidratação equilibrada e toque sedoso, sem pesar nos fios.

- Categoria: Cuidados Capilares
- Linha: Kids Ozon Splash
- Público: Infantil.
- Ativos destacados: Extratos de frutas vermelhas e banana.
- Código original (Grupo Ozonteck): 40553
- Código EAN: 7898760210011
- Ativos destacados: Extratos de frutas vermelhas e banana.
- Características: Uso diário. Fórmula livre de parabenos, silicones e sal.
- Vitaminas e nutrientes: Vitaminas A, B e C presentes nos extratos de frutas vermelhas e banana. Reposição de vitaminas e minerais na fibra capilar.
- Características da fórmula: Livre de parabenos, silicones e sal. Hipoalergênica. Dermatologicamente e oftalmologicamente testada. Não testada em animais.
- Público: Crianças de todas as idades.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-KIDS-LE - Leave in Kids

O Leave-in Kids Ozon Splash é um finalizador infantil de textura leve para pentear, desembaraçar e ativar os cachos. Ajuda a deixar os fios disciplinados, macios, brilhantes e perfumados, com extratos de frutas vermelhas e banana.

Os extratos de frutas vermelhas e banana são ricos em vitaminas A, B e C. A combinação ozonizada oferece cuidado hidratante, suavizante e remineralizante para os cabelos infantis, favorecendo brilho, maciez e maleabilidade na rotina diária.

Como creme para pentear ou ativador de cachos, o leave-in facilita o desembaraço e a finalização. A textura leve ajuda a disciplinar os fios e mantém a sensação de cabelos macios, brilhantes e perfumados.

- Categoria: Cuidados Capilares
- Linha: Kids Ozon Splash
- Público: Infantil, a partir de 3 anos.
- Ativos destacados: Extratos de frutas vermelhas e banana.
- Código original (Grupo Ozonteck): 40554
- Código EAN: 7898760210042
- Ativos destacados: Extratos de frutas vermelhas e banana.
- Características: Uso diário a partir de 3 anos. Creme para pentear e ativador de cachos. Fórmula livre de parabenos.
- Vitaminas e nutrientes: Vitaminas A, B e C presentes nos extratos de frutas vermelhas e banana. Reposição de vitaminas e minerais na fibra capilar.
- Características da fórmula: Livre de parabenos, silicones e sal. Hipoalergênica. Dermatologicamente e oftalmologicamente testada. Não testada em animais.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-O-ACAI - Óleo de Açaí

Açaí Fusion é um óleo finalizador e reparador de pontas para todos os tipos de cabelo. A fórmula com açaí e silicones forma um acabamento leve, sem sensação gordurosa, que reduz o frizz e a aspereza. Proporciona maciez, brilho e alinhamento, com proteção térmica e UV para os fios.

Os silicones voláteis de baixo e alto peso molecular formam um filme leve sobre a fibra. O cuidado ajuda a reduzir porosidade e aspereza, sem pesar, inclusive em cabelos oleosos. A fórmula também acompanha rotinas com atividade física e exposição solar, protegendo o acabamento dos fios.

- Categoria: Cuidados Capilares
- Ativos destacados: Açaí e silicones voláteis de diferentes pesos moleculares.
- Código original (Grupo Ozonteck): 40562
- Código EAN: 7898760210141
- Ativos destacados: Açaí e silicones voláteis de diferentes pesos moleculares.
- Modo de uso: Uso diário, de duas a três vezes ao dia, de acordo com o tipo de cabelo. Pode ser aplicado antes da escova ou do modelador. Pode ser adicionado a máscaras para complementar a nutrição.
- Benefícios cosméticos: Cuidado das pontas duplas e da aparência de danos. Redução de frizz, porosidade e aspereza. Proteção térmica e UV. Alinhamento pré-escova e auxílio à modelagem.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-O-CREAM - Ozon Cream

Ozon Cream é um fluido capilar multifuncional 20 em 1 que combina extrato de baobá, silicones e gel lamelar. Reúne hidratação, nutrição e condicionamento para diferentes tipos de cabelo, especialmente os lisos. Seu acabamento favorece maciez, brilho e alinhamento, sem abrir mão da facilidade para pentear.

A fórmula 20 em 1 organiza diferentes cuidados em uma única aplicação: hidratação, nutrição, reconstrução cosmética e proteção. O sistema de gel lamelar se combina ao baobá e aos silicones para cuidar das cutículas e da fibra, melhorando resistência, elasticidade e penteabilidade.

- Categoria: Cuidados Capilares
- Ativos destacados: Extrato de baobá e silicones.
- Código original (Grupo Ozonteck): 40563
- Código EAN: 7898760210059
- Ativos destacados: Extrato de baobá e silicones.
- Tecnologia: Sistema de gel lamelar.
- Benefícios cosméticos: Controle do frizz e do volume e proteção contra a umidade. Proteção térmica e UV. Cuidado da elasticidade, resistência e aparência das pontas; suavidade e condicionamento. Hidratação, nutrição e reconstrução cosmética da fibra. Selagem das cutículas e redução da aparência de pontas duplas. Melhora da elasticidade e da resistência dos fios. Facilidade para pentear, alinhamento e condicionamento. Suavidade, maciez e brilho.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-FOR-MEN - Ozon-For Men

Ozon For Men é um shampoo 2 em 1 para limpeza e condicionamento diário. Mentol e óleo de macadâmia combinam sensação refrescante, maciez e brilho. A fórmula cuida da oleosidade e oferece praticidade para cabelos curtos, reunindo duas etapas em um só produto.

Sua proposta anticaspa combina limpeza do couro cabeludo, controle de oleosidade e condicionamento. Mentol oferece refrescância, enquanto óleo de macadâmia, biotina e ômegas complementam o cuidado nutritivo dos fios.

- Categoria: Cuidados Capilares
- Ativos destacados: Mentol, óleo de macadâmia, biotina e ômegas 3, 6, 7 e 9.
- Código original (Grupo Ozonteck): 40560
- Código EAN: 7898760210073
- Ativos destacados: Mentol, óleo de macadâmia, biotina e ômegas 3, 6, 7 e 9.
- Tecnologia: Matrix 3D.
- Características: Limpeza e condicionamento. Uso diário. Em cabelos curtos e saudáveis, pode dispensar o condicionador. Shampoo anticaspa e condicionante 2 em 1. Controle da oleosidade e limpeza equilibrada do couro cabeludo.
- Vitaminas e nutrientes: Biotina (vitamina B7). Ômegas 3, 6, 7 e 9.
- Precauções: Em condições de inflamação ou irritação da pele, mantenha acompanhamento médico e dermatológico.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-TON - Tônico Capilar

Revita Tonic é um tônico capilar em spray com mentol e blends vegetais. Combina sensação refrescante e cuidado da resistência dos fios, com proposta de redução da quebra. É indicado para diferentes tipos de cabelo, especialmente os fragilizados e ressecados.

A combinação de blends vegetais, vitaminas e nutrientes complementa o cuidado do couro cabeludo e de fios fragilizados. O formato em spray facilita a aplicação no dia a dia, com sensação de frescor e cuidado da oleosidade, do corpo e da resistência à quebra.

- Categoria: Cuidados Capilares
- Ativos destacados: Mentol e blends vegetais.
- Código original (Grupo Ozonteck): 40545
- Código EAN: 7898760210066
- Ativos destacados: Mentol e blends vegetais.
- Componentes destacados: Blends vegetais, mentol, vitaminas e nutrientes.
- Benefícios cosméticos: Cuidado da oleosidade do couro cabeludo. Refrescância e sensação de limpeza. Redução da quebra e melhora do aspecto encorpado dos fios.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-MAS-MEL - Máscara Mel & Ozônio

A Máscara Mel & Ozônio nutre e condiciona os cabelos, favorecendo maciez, maleabilidade e brilho. A combinação de extrato de mel, geleia real e óleo de girassol ozonizado cuida da fibra capilar e ajuda a reduzir o aspecto áspero dos fios.

O extrato de mel oferece cuidado suavizante e nutritivo. A geleia real complementa o tratamento da fibra, favorecendo resistência e maleabilidade, enquanto o óleo de girassol ozonizado integra a proposta de revitalização da raiz às pontas.

- Categoria: Cuidados Capilares
- Linha: Mel & Ozônio
- Ativos destacados: Extrato de mel, geleia real e óleo de girassol ozonizado.
- Código original (Grupo Ozonteck): 40550
- Código EAN: 7898996428280
- Ativos destacados: Extrato de mel, geleia real e óleo de girassol ozonizado.
- Indicação: Cabelos oleosos e muito oleosos.
- Benefícios cosméticos: Nutrição e hidratação. Cuidado da resistência e da aparência de danos. Maciez, maleabilidade e brilho.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-SH-MEL - Shampoo Ozon Mel

O Shampoo Mel & Ozônio limpa suavemente cabelos fragilizados e opacos. Extrato de mel, geleia real, óleo de girassol ozonizado e vitaminas A, D e E combinam nutrição e cuidado dos fios e do couro cabeludo, proporcionando maciez e brilho.

O extrato de mel e a geleia real complementam a nutrição e a hidratação. As vitaminas A, D e E integram o cuidado antioxidante e umectante, enquanto o óleo de girassol ozonizado contribui para a proposta revitalizante da linha Mel & Ozônio.

- Categoria: Cuidados Capilares
- Linha: Mel & Ozônio
- Apresentação: Frasco de 300 ml
- Tipo de uso: Uso externo
- Ativos destacados: Extrato de mel, geleia real, óleo de girassol ozonizado e vitaminas A, D e E.
- Código original (Grupo Ozonteck): 40549
- Código EAN: 7898996428273
- Apresentação: Frasco de 300 ml
- Ativos destacados: Extrato de mel, geleia real, óleo de girassol ozonizado e vitaminas A, D e E.
- Modo de uso: Aplique nos cabelos úmidos, massageie suavemente até formar espuma e enxágue bem. Repita se necessário.
- Precauções: Uso externo. Mantenha em local fresco, arejado e protegido da luz, fora do alcance de crianças. Evite os olhos; em caso de contato, enxágue com água. Interrompa o uso em caso de irritação e procure orientação médica.
- Vitaminas: Vitaminas A, D e E.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PRO-AMR - WO3 Máscara AMR

AMR (Amino Matrix Reset) é uma máscara de cuidado intensivo da linha Ozone Hair System. Desenvolvida para fios sensibilizados por química, descoloração e processos de transformação, combina aminoácidos e WO3 Quantic Complex para melhorar o corpo, a disciplina e a aparência de resistência dos cabelos.

A máscara integra o cronograma capilar Ozone Hair System. A tecnologia direciona o cuidado com aminoácidos aos fios que passaram por descoloração e múltiplas transformações, favorecendo corpo, disciplina e aparência de vitalidade.

- Categoria: Cuidados Capilares
- Linha: WO3 / Ozone Hair System
- Ativos destacados: Blend de aminoácidos.
- Código original (Grupo Ozonteck): 40903
- Código EAN: 7898760211292
- Ativos destacados: Blend de aminoácidos.
- Tecnologia: WO3 Quantic Complex.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PRO-CIF - WO3 Máscara CIF

CIF (Carbon Ion Forge) é uma máscara da linha Ozone Hair System para cabelos fragilizados, afinados e danificados por química. Proteínas, peptídeos e WO3 Quantic Complex contribuem para o condicionamento e o alinhamento, favorecendo a aparência de força e resistência da fibra.

A combinação de proteínas e peptídeos integra o cuidado avançado da fibra sensibilizada. A tecnologia WO3 Quantic Complex auxilia o condicionamento, para um cabelo com aspecto mais alinhado e sensação de maior resistência.

- Categoria: Cuidados Capilares
- Linha: WO3 / Ozone Hair System
- Ativos destacados: Complexo de proteínas e peptídeos.
- Código original (Grupo Ozonteck): 40905
- Código EAN: 7898760211308
- Ativos destacados: Complexo de proteínas e peptídeos.
- Tecnologia: WO3 Quantic Complex.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PRO-HMS - WO3 Máscara HMS

HMS (Hydro Mesh Sync) é a máscara de hidratação da linha Ozone Hair System. Agentes umectantes e WO3 Quantic Complex combinam hidratação e condicionamento para cabelos secos, opacos, cacheados e crespos, com resultado de toque sedoso, maciez e brilho.

A fórmula concentrada utiliza agentes umectantes e uma tecnologia que cria uma malha de cuidado da hidratação e do condicionamento. O tratamento favorece toque sedoso e brilho intenso em fios que perderam maciez e luminosidade.

- Categoria: Cuidados Capilares
- Linha: WO3 / Ozone Hair System
- Ativos destacados: Agentes umectantes.
- Código original (Grupo Ozonteck): 40906
- Código EAN: 7898760211315
- Ativos destacados: Agentes umectantes.
- Tecnologia: WO3 Quantic Complex.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PRO-LPC - WO3 Máscara LPC

LPC (Lipid Phase Control) é uma máscara de nutrição da linha Ozone Hair System para cabelos com frizz, pontas secas e aspecto áspero. O blend de lipídios e o WO3 Quantic Complex ajudam a condicionar, alinhar e melhorar a disciplina, oferecendo nutrição com acabamento leve.

O tratamento combina nutrição intensa com acabamento leve. A ação condicionante do blend de lipídios suaviza a aspereza e ajuda a disciplinar os fios, especialmente nas pontas secas e em cabelos com frizz elevado.

- Categoria: Cuidados Capilares
- Linha: WO3 / Ozone Hair System
- Ativos destacados: Blend de lipídios nutritivos.
- Código original (Grupo Ozonteck): 40907
- Código EAN: 7898760211322
- Ativos destacados: Blend de lipídios nutritivos.
- Tecnologia: WO3 Quantic Complex.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PRO-DEEP - WO3 Shampoo Deep Cleanse

Deep Cleanse é um shampoo técnico da linha Ozone Hair System para a preparação dos cabelos antes dos tratamentos. Sua limpeza intensa remove resíduos e impurezas acumuladas, preparando a fibra para as próximas etapas de cuidado com a tecnologia WO3 Quantic Complex.

Como etapa de preparação, o shampoo auxilia a fibra a receber os ativos dos tratamentos seguintes. A limpeza técnica remove o acúmulo de resíduos para complementar os procedimentos de beleza do sistema Ozone Hair System.

- Categoria: Cuidados Capilares
- Linha: WO3 / Ozone Hair System
- Código original (Grupo Ozonteck): 40902
- Código EAN: 7898760211285
- Tecnologia: WO3 Quantic Complex.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PRO-SOFT - WO3 Shampoo Soft Cleanse

Soft Cleanse é um shampoo da linha Ozone Hair System para limpeza suave e frequente de cabelos quimicamente tratados, cacheados e crespos. Remove a sujeira cotidiana e o excesso de oleosidade da raiz, respeitando a camada lipídica dos fios e favorecendo a manutenção da cor, do brilho e da maciez.

É o primeiro passo de uma rotina de tratamento que preserva a leveza dos cabelos. A remoção da sujeira cotidiana e do excesso de oleosidade prepara os fios para as próximas fases, mantendo a aparência de cor, brilho e maciez.

- Categoria: Cuidados Capilares
- Linha: WO3 / Ozone Hair System
- Código original (Grupo Ozonteck): 40901
- Código EAN: 7898760211278
- Tecnologia: WO3 Quantic Complex.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-NXCAP - NX Cap Ozon

NX Cap Ozon reúne um mix de óleos e vitamina E em cápsulas softgel.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas softgel de 700 mg.
- Componentes conhecidos: Mix de óleos e vitamina E.
- Código original (Grupo Ozonteck): IMP-88
- Código EAN: 7898760210356
- Componentes conhecidos: Mix de óleos e vitamina E.
- Apresentação: 60 cápsulas softgel de 700 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-OMEGA - Ômega 3

Ômega 3 é um suplemento alimentar à base de óleo de peixe, fonte dos ácidos graxos EPA e DHA. A apresentação em cápsulas softgel reúne o conteúdo em unidades individuais.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas softgel de 1.400 mg.
- Componentes conhecidos: Óleo de peixe, com EPA e DHA.
- Código original (Grupo Ozonteck): IMP-90
- Código EAN: 7898760210363
- Componentes conhecidos: Óleo de peixe, com EPA e DHA.
- Apresentação: 60 cápsulas softgel de 1.400 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-XBOOST - Xbooster

Xbooster é um suplemento alimentar que combina cafeína, taurina e arginina em cápsulas.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas de 590 mg.
- Componentes conhecidos: Cafeína, taurina e arginina.
- Código original (Grupo Ozonteck): IMP-33
- Código EAN: 7898760210400
- Componentes conhecidos: Cafeína, taurina e arginina.
- Apresentação: 60 cápsulas de 590 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-TRIMAG - Tri Magnésio

Power Tri-Magnésio reúne três formas de magnésio e extrato de cúrcuma em um suplemento alimentar em cápsulas.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas de 590 mg.
- Componentes conhecidos: Magnésio quelato, dimagnésio malato, taurato de magnésio e extrato de cúrcuma.
- Código original (Grupo Ozonteck): IMP-98
- Código EAN: 7898760210387
- Componentes conhecidos: Magnésio quelato, dimagnésio malato, taurato de magnésio e extrato de cúrcuma.
- Apresentação: 60 cápsulas de 590 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-CREAT-CX - Ozon Creat Caixa

Ozon Creat é um suplemento alimentar em pó com creatina e glutamina, acondicionado em sticks individuais. A caixa reúne 30 unidades para organizar o preparo de cada porção.

- Categoria: Nutracêuticos
- Linha: Ozon Creat
- Apresentação: Caixa com 30 sticks de 8 g; peso líquido de 240 g.
- Componentes conhecidos: Creatina e glutamina.
- Código original (Grupo Ozonteck): IMP-184
- Código EAN: 7898760211131
- Componentes conhecidos: Creatina e glutamina.
- Apresentação: Caixa com 30 sticks de 8 g; peso líquido de 240 g.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-CREAT-UN - Ozon Creat Unidade

Ozon Creat é um suplemento alimentar em pó com creatina na apresentação individual. O stick contém 8 g de produto.

- Categoria: Nutracêuticos
- Linha: Ozon Creat
- Apresentação: Um stick de 8 g de produto.
- Componentes conhecidos: Creatina.
- Código original (Grupo Ozonteck): IMP-45
- Código EAN: 7898760211100
- Componentes conhecidos: Creatina.
- Apresentação: Um stick de 8 g de produto.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-CREAT-MO-CX - Ozon Creat Morango Caixa

Ozon Creat Morango é um suplemento alimentar em pó com creatina e sabor morango. A caixa reúne 30 sachês individuais, com 8,5 g de produto em cada unidade.

- Categoria: Nutracêuticos
- Linha: Ozon Creat
- Apresentação: Caixa com 30 sachês de 8,5 g; peso líquido de 255 g.
- Componentes conhecidos: Creatina. Contém aromatizante sintético idêntico ao natural.
- Código original (Grupo Ozonteck): IMP-187
- Código EAN: 7898760211155
- Componentes conhecidos: Creatina. Contém aromatizante sintético idêntico ao natural.
- Apresentação: Caixa com 30 sachês de 8,5 g; peso líquido de 255 g.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-CREAT-MO-UN - Ozon Creat Morango Unidade

Ozon Creat Morango é a apresentação individual do suplemento alimentar em pó sabor morango. Cada sachê contém 8,5 g de produto.

- Categoria: Nutracêuticos
- Linha: Ozon Creat
- Apresentação: Um sachê de 8,5 g de produto.
- Componentes conhecidos: Aromatizante sintético idêntico ao natural.
- Código original (Grupo Ozonteck): IMP-44
- Código EAN: 7898760211124
- Componentes conhecidos: Aromatizante sintético idêntico ao natural.
- Apresentação: Um sachê de 8,5 g de produto.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-BORYS - Boryslim

Boryslim é um suplemento alimentar com cromo em cápsulas. A apresentação reúne 60 cápsulas de 500 mg.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas de 500 mg.
- Componentes conhecidos: Cromo.
- Código original (Grupo Ozonteck): IMP-34
- Código EAN: 7898760210325
- Componentes conhecidos: Cromo.
- Apresentação: 60 cápsulas de 500 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-DREAM - Dream Bliss

Dream Bliss combina melatonina e coenzima Q10 em cápsulas softgel. Cada frasco reúne 30 cápsulas, com 100 mg de coenzima Q10 por cápsula.

- Categoria: Nutracêuticos
- Apresentação: 30 cápsulas softgel de 700 mg.
- Componentes conhecidos: Melatonina e coenzima Q10.
- Código original (Grupo Ozonteck): IMP-91
- Código EAN: 7898760210332
- Componentes conhecidos: Melatonina e coenzima Q10.
- Apresentação: 30 cápsulas softgel de 700 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-K2D3 - K2MK7 e D3

K2MK7 e D3 é um suplemento alimentar que associa vitamina K2 na forma MK-7 e vitamina D3 em cápsulas softgel.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas softgel de 700 mg.
- Componentes conhecidos: Vitamina K2 (MK-7) e vitamina D3.
- Código original (Grupo Ozonteck): IMP-35
- Código EAN: 7898760210349
- Componentes conhecidos: Vitamina K2 (MK-7) e vitamina D3.
- Apresentação: 60 cápsulas softgel de 700 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-LUMI - Luminous Vita

Luminous Vita é um suplemento alimentar que combina vitaminas A, C e E em cápsulas. O frasco reúne 60 unidades.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas de 590 mg.
- Componentes conhecidos: Vitaminas A, C e E.
- Código original (Grupo Ozonteck): IMP-201
- Código EAN: 7898760211018
- Componentes conhecidos: Vitaminas A, C e E.
- Apresentação: 60 cápsulas de 590 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-LEV-UN - Ozon Lev Unidade

Ozon Lev é um suplemento alimentar em pó com sabor de abacaxi e hortelã. A combinação reúne polidextrose, vegetais em pó, cúrcuma e gengibre na apresentação em sachê individual.

A fórmula reúne vegetais em pó, fibras, vitaminas e minerais em uma apresentação prática para a rotina. Polidextrose, couve, espinafre, espirulina, cúrcuma e gengibre compõem a combinação de ingredientes.

- Categoria: Nutracêuticos
- Apresentação: Um sachê de 8 g.
- Componentes conhecidos: Polidextrose, couve em pó, espinafre, espirulina, cúrcuma e gengibre. Contém aromatizante sintético idêntico ao natural.
- Código original (Grupo Ozonteck): IMP-47
- Código EAN: 7898760211162
- Componentes conhecidos: Polidextrose, couve em pó, espinafre, espirulina, cúrcuma e gengibre. Contém aromatizante sintético idêntico ao natural.
- Apresentação: Um sachê de 8 g.
- Modo de preparo: Pode ser preparado com água gelada ou quente, em formato de chá.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-VIRT - Virtuous Caps

Virtuous Caps é um suplemento alimentar com biotina, silício e zinco. A apresentação contém 60 cápsulas, com conteúdo líquido de 42 g.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas; conteúdo líquido de 42 g.
- Componentes conhecidos: Biotina, silício e zinco. Colorido artificialmente.
- Código original (Grupo Ozonteck): IMP-125
- Código EAN: 7898760210394
- Componentes conhecidos: Biotina, silício e zinco. Colorido artificialmente.
- Apresentação: 60 cápsulas; conteúdo líquido de 42 g.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-VITA-OZ - Vita Ozon Plus

Vita Ozon Plus é um suplemento polivitamínico com ômega 3 em cápsulas. Sua apresentação reúne 60 unidades.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas de 700 mg.
- Componentes conhecidos: Ômega 3, com EPA e DHA.
- Código original (Grupo Ozonteck): IMP-124
- Código EAN: 7898760210370
- Componentes conhecidos: Ômega 3, com EPA e DHA.
- Apresentação: 60 cápsulas de 700 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-FLEX-CX - Ozon Flex Caixa

Ozon Flex é um suplemento alimentar em pó sabor pêssego. Combina colágeno tipo II não desnaturado, ácido hialurônico e vitaminas em sachês individuais. A caixa reúne 30 sachês.

- Categoria: Nutracêuticos
- Linha: Ozon Flex
- Apresentação: Caixa com 30 sachês de 8 g; peso líquido de 240 g.
- Componentes conhecidos: Colágeno tipo II não desnaturado, ácido hialurônico e vitaminas C, D, E e K2.
- Código original (Grupo Ozonteck): IMP-190
- Código EAN: 7898760211148
- Componentes conhecidos: Colágeno tipo II não desnaturado, ácido hialurônico e vitaminas C, D, E e K2.
- Apresentação: Caixa com 30 sachês de 8 g; peso líquido de 240 g.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-FLEX-UN - Ozon Flex Unidade

Ozon Flex é um suplemento alimentar em pó sabor pêssego, na apresentação individual. Reúne colágeno tipo II, ácido hialurônico e vitaminas em um sachê de 8 g.

- Categoria: Nutracêuticos
- Linha: Ozon Flex
- Apresentação: Um sachê de 8 g.
- Componentes conhecidos: Colágeno tipo II, ácido hialurônico e vitaminas C, D, E e K2.
- Código original (Grupo Ozonteck): IMP-46
- Código EAN: 7898760211117
- Componentes conhecidos: Colágeno tipo II, ácido hialurônico e vitaminas C, D, E e K2.
- Apresentação: Um sachê de 8 g.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-COBAL - Cobalactin

Cobalactin é um suplemento alimentar de vitamina B12 na forma de metilcobalamina. A apresentação em comprimidos mastigáveis oferece praticidade e reúne 30 unidades por frasco.

- Categoria: Nutracêuticos
- Apresentação: 30 comprimidos mastigáveis de 1.000 mg.
- Componentes conhecidos: Metilcobalamina (vitamina B12).
- Código original (Grupo Ozonteck): IMP-204
- Código EAN: 7898760211247
- Componentes conhecidos: Metilcobalamina (vitamina B12).
- Apresentação: 30 comprimidos mastigáveis de 1.000 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-GENO - Genolife Kids

Genolife Kids é um suplemento alimentar em comprimidos mastigáveis com sabor tutti-frutti. Reúne vitaminas C e D e selênio.

- Categoria: Nutracêuticos
- Apresentação: 30 comprimidos mastigáveis de 1.000 mg.
- Componentes conhecidos: Vitaminas C e D e selênio.
- Código original (Grupo Ozonteck): IMP-207
- Código EAN: 7898760211223
- Componentes conhecidos: Vitaminas C e D e selênio.
- Apresentação: 30 comprimidos mastigáveis de 1.000 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-MELAT - Melatozon

Melatozon é um suplemento de melatonina em gotas com sabor tutti-frutti. O frasco conta-gotas contém 20 ml.

- Categoria: Nutracêuticos
- Apresentação: Frasco conta-gotas de 20 ml.
- Componentes conhecidos: Melatonina.
- Código original (Grupo Ozonteck): IMP-203
- Código EAN: 7898760211094
- Componentes conhecidos: Melatonina.
- Apresentação: Frasco conta-gotas de 20 ml.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-OX - Ox

OX é um suplemento alimentar que associa vitamina C a selênio, manganês e zinco em cápsulas. O frasco reúne 60 unidades.

- Categoria: Nutracêuticos
- Apresentação: 60 cápsulas de 590 mg.
- Componentes conhecidos: Vitamina C, selênio, manganês e zinco.
- Código original (Grupo Ozonteck): IMP-209
- Código EAN: 7898760211193
- Componentes conhecidos: Vitamina C, selênio, manganês e zinco.
- Apresentação: 60 cápsulas de 590 mg.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-SOFH-D - Sofh D

Sofh D é um suplemento alimentar de vitamina D em gotas. A apresentação em frasco conta-gotas contém 20 ml.

- Categoria: Nutracêuticos
- Apresentação: Frasco conta-gotas de 20 ml.
- Componentes conhecidos: Vitamina D.
- Código original (Grupo Ozonteck): IMP-202
- Código EAN: 7898760210653
- Componentes conhecidos: Vitamina D.
- Apresentação: Frasco conta-gotas de 20 ml.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-303-W - 303 For Woman 17 ml

303 For Woman é uma fragrância Ozonteck da família floral amadeirado. Cítricos, flor de laranjeira e flor de cactos abrem um buquê floral variado. Sândalo e almíscar dão suavidade e uma base amadeirada à composição.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Floral amadeirado
- Notas de saída: Flor de laranjeira, flor de cactos, bergamota e mandarina
- Notas de corpo: Lírio, frésia, gardênia, jasmim, lírio-do-vale, camélia branca, rosa e peônia
- Código original (Grupo Ozonteck): 40709
- Código EAN: 7898760210257
- Família olfativa: Floral amadeirado
- Notas de saída: Flor de laranjeira, flor de cactos, bergamota e mandarina
- Notas de coração: Lírio, frésia, gardênia, jasmim, lírio-do-vale, camélia branca, rosa e peônia

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-303-M - 303 Men 17 ml

303 Men é uma fragrância masculina amadeirada aromática, de proposta clássica e versátil para o dia a dia. Cítricos, gengibre e gardênia se encontram com sândalo e almíscar, combinando frescor e um perfil amadeirado.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Amadeirado aromático
- Código original (Grupo Ozonteck): 40704
- Código EAN: 7898760210196
- Família olfativa: Amadeirado aromático

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-303-VIP - 303 VIP Men 17 ml

303 VIP Men é uma fragrância masculina de proposta festiva e urbana. Maracujá, acordes de vodca e gim, especiarias, âmbar e couro combinam frescor frutado e intensidade.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Código original (Grupo Ozonteck): 40702
- Código EAN: 7898760210189

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-ALEM - Alem 17 ml

Alem é uma fragrância Ozonteck da família âmbar amadeirado. Cítricos e mandarina iluminam um coração de jasmim marroquino e flores brancas. Âmbar branco e cashmeran completam a composição com um fundo quente e amadeirado.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Família olfativa: Âmbar amadeirado
- Notas de saída: Cítricos e mandarina
- Notas de corpo: Jasmim marroquino e flores brancas
- Notas de fundo: Âmbar branco e cashmeran
- Código original (Grupo Ozonteck): 40726
- Código EAN: 7898760210424
- Família olfativa: Âmbar amadeirado
- Notas de saída: Cítricos e mandarina
- Notas de coração: Jasmim marroquino e flores brancas
- Notas de fundo: Âmbar branco e cashmeran

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-ANGE - Angelical 17 ml

Angelical é uma fragrância Ozonteck da família âmbar baunilha. Algodão-doce, frutas e bergamota apresentam o lado gourmand da fragrância. Mel e especiarias aparecem no coração, com caramelo, baunilha e patchouli no fundo.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Âmbar baunilha
- Notas de saída: Algodão-doce, cassis, melão, jasmim, bergamota e abacaxi
- Notas de corpo: Mel, amora, ameixa, damasco, noz-moscada e rosa
- Código original (Grupo Ozonteck): 40710
- Código EAN: 7898760210288
- Família olfativa: Âmbar baunilha
- Notas de saída: Algodão-doce, cassis, melão, jasmim, bergamota e abacaxi
- Notas de coração: Mel, amora, ameixa, damasco, noz-moscada e rosa

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-AVEN - Aventura 17 ml

Aventura é uma fragrância Ozonteck da família cítrico aromático. Limão e abacaxi encontram lavanda, hortelã e cardamomo na abertura. Flores e notas verdes conduzem a uma base de sândalo, cedro, baunilha e musgo.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Família olfativa: Cítrico aromático
- Notas de saída: Limão, abacaxi, cardamomo, lavanda e hortelã
- Notas de corpo: Jasmim, magnólia, grama verde e junípero
- Notas de fundo: Sândalo, cedro, baunilha e musgo de carvalho
- Código original (Grupo Ozonteck): 40798
- Código EAN: 7898760210448
- Família olfativa: Cítrico aromático
- Notas de saída: Limão, abacaxi, cardamomo, lavanda e hortelã
- Notas de coração: Jasmim, magnólia, grama verde e junípero
- Notas de fundo: Sândalo, cedro, baunilha e musgo de carvalho

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-BLUE - Blue Sky 17 ml

Blue Sky é uma fragrância Ozonteck da família floral frutado. Limão siciliano e maçã trazem um frescor frutado à abertura. Bambu e flores dão leveza ao coração, com cedro, almíscar e âmbar no acabamento.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Família olfativa: Floral frutado
- Notas de saída: Limão siciliano, maçã e cedro
- Notas de corpo: Bambu, jasmim e rosa branca
- Notas de fundo: Cedro, almíscar e âmbar
- Código original (Grupo Ozonteck): 40715
- Código EAN: 7898760210226
- Família olfativa: Floral frutado
- Notas de saída: Limão siciliano, maçã e cedro
- Notas de coração: Bambu, jasmim e rosa branca
- Notas de fundo: Cedro, almíscar e âmbar

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-CAPA - Capadócia 17 ml

Capadócia é uma fragrância Ozonteck da família fougère aromático. Lavanda e cítricos abrem uma composição aromática, com especiarias e madeiras no coração. Couro, âmbar e fava tonka dão profundidade ao perfil clássico.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Fougère aromático
- Notas de saída: Lavanda, limão, manjericão, bergamota e sálvia-esclareia
- Notas de corpo: Anis-estrelado, sândalo, vetiver, cardamomo, zimbro e cedro
- Notas de fundo: Musgo de carvalho, couro, âmbar, almíscar e fava tonka
- Código original (Grupo Ozonteck): 40716
- Código EAN: 7898760210455
- Família olfativa: Fougère aromático
- Notas de saída: Lavanda, limão, manjericão, bergamota e sálvia-esclareia
- Notas de coração: Anis-estrelado, sândalo, vetiver, cardamomo, zimbro e cedro
- Notas de fundo: Musgo de carvalho, couro, âmbar, almíscar e fava tonka

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-CIND - Cinderela 17 ml

Cinderela é uma fragrância Ozonteck da família âmbar floral. Café e amêndoa encontram flores brancas e uma base doce, especiada e amadeirada. É uma composição de contrastes, para quem aprecia perfumes florais com presença gourmand.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Âmbar floral
- Notas de saída: Amêndoa, café, bergamota e limão
- Notas de corpo: Tuberosa, jasmim sambac, flor de laranjeira, raiz de orris e rosa búlgara
- Notas de fundo: Fava tonka, cacau, baunilha, pralinê, sândalo, almíscar, âmbar, madeira de cashmere, canela, patchouli e cedro
- Código original (Grupo Ozonteck): 40724
- Código EAN: 7898760210462
- Família olfativa: Âmbar floral
- Notas de saída: Amêndoa, café, bergamota e limão
- Notas de coração: Tuberosa, jasmim sambac, flor de laranjeira, raiz de orris e rosa búlgara
- Notas de fundo: Fava tonka, cacau, baunilha, pralinê, sândalo, almíscar, âmbar, madeira de cashmere, canela, patchouli e cedro

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-CIND - Cinderela 100 ml

Cinderela é uma fragrância Ozonteck da família âmbar floral. Café e amêndoa encontram flores brancas e uma base doce, especiada e amadeirada. É uma composição de contrastes, para quem aprecia perfumes florais com presença gourmand.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Feminino
- Família olfativa: Âmbar floral
- Notas de saída: Amêndoa, café, bergamota e limão
- Notas de corpo: Tuberosa, jasmim sambac, flor de laranjeira, raiz de orris e rosa búlgara
- Notas de fundo: Fava tonka, cacau, baunilha, pralinê, sândalo, almíscar, âmbar, madeira de cashmere, canela, patchouli e cedro
- Código original (Grupo Ozonteck): 40724 - B
- Código EAN: 7898760210936
- Família olfativa: Âmbar floral
- Notas de saída: Amêndoa, café, bergamota e limão
- Notas de coração: Tuberosa, jasmim sambac, flor de laranjeira, raiz de orris e rosa búlgara
- Notas de fundo: Fava tonka, cacau, baunilha, pralinê, sândalo, almíscar, âmbar, madeira de cashmere, canela, patchouli e cedro

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-DG - DG Red 17 ml

DG Red combina uma abertura cítrica, verde e aldeídica com um coração floral e especiado. Sândalo, baunilha e almíscar equilibram o acabamento com calor e suavidade, em uma proposta clássica e elegante.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Notas de saída: Aldeídos, manjericão, cítricos, hera, mandarina, frésia e bergamota
- Notas de corpo: Cravo, cravo-de-defunto, coentro, flor de laranjeira, lírio, jasmim, rosa búlgara e lírio-do-vale
- Notas de fundo: Sândalo, baunilha, almíscar e fava tonka
- Código original (Grupo Ozonteck): 40723
- Código EAN: 7898760210486
- Notas de saída: Aldeídos, manjericão, cítricos, hera, mandarina, frésia e bergamota
- Notas de coração: Cravo, cravo-de-defunto, coentro, flor de laranjeira, lírio, jasmim, rosa búlgara e lírio-do-vale
- Notas de fundo: Sândalo, baunilha, almíscar e fava tonka

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-DOCU - Doçurinha 17 ml

Doçurinha é uma fragrância Ozonteck da família floral frutado. Sorbet de morango e cítricos criam uma abertura doce e vibrante. O coração combina um acorde de chiclete e flores, com baunilha, almíscar e âmbar na base.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Família olfativa: Floral frutado
- Notas de saída: Sorbet de morango, mandarina e laranja
- Notas de corpo: Acorde de chiclete Bubbaloo, notas sparkling e buquê de flores
- Notas de fundo: Almíscar, baunilha e âmbar
- Código original (Grupo Ozonteck): 40799
- Código EAN: 7898760210431
- Família olfativa: Floral frutado
- Notas de saída: Sorbet de morango, mandarina e laranja
- Notas de coração: Acorde de chiclete Bubbaloo, notas sparkling e buquê de flores
- Notas de fundo: Almíscar, baunilha e âmbar

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-FAMMA - Famma 17 ml

Famma combina manga e bergamota com jasmim e olíbano. Baunilha e sândalo acrescentam cremosidade à fragrância feminina, equilibrando o frescor frutado com um acabamento quente.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Notas de saída: Manga e bergamota
- Notas de corpo: Jasmim e olíbano
- Notas de fundo: Baunilha e sândalo
- Código original (Grupo Ozonteck): 40725
- Código EAN: 7898760210264
- Notas de saída: Manga e bergamota
- Notas de coração: Jasmim e olíbano
- Notas de fundo: Baunilha e sândalo

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-FANT - Fantastica Bry 17 ml

Fantástica Bry é uma fragrância Ozonteck da família floral frutado gourmand. Kiwi, lichia e marmelo introduzem uma fragrância doce e frutada. Chocolate branco e cupcake se misturam às flores, apoiados por almíscar, orris e madeiras.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Floral frutado gourmand
- Notas de saída: Kiwi, lichia vermelha e marmelo
- Notas de corpo: Chocolate branco, cupcake, orquídea e jasmim
- Notas de fundo: Almíscar, raiz de orris e notas amadeiradas
- Código original (Grupo Ozonteck): 40705
- Código EAN: 7898760210301
- Família olfativa: Floral frutado gourmand
- Notas de saída: Kiwi, lichia vermelha e marmelo
- Notas de coração: Chocolate branco, cupcake, orquídea e jasmim
- Notas de fundo: Almíscar, raiz de orris e notas amadeiradas

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-FERA - Fera 17 ml

Fera é uma fragrância Ozonteck da família âmbar amadeirado. Lavanda e limão abrem um perfume que combina abacaxi, mel e flores. A base de baunilha e madeiras acentua seu lado quente e envolvente.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Âmbar amadeirado
- Notas de saída: Lavanda, limão e gálbano
- Notas de corpo: Abacaxi, mel, lírio-do-vale, rosa, ylang-ylang e jasmim
- Notas de fundo: Baunilha, sândalo, almíscar e cedro
- Código original (Grupo Ozonteck): 40721
- Código EAN: 7898760210479
- Família olfativa: Âmbar amadeirado
- Notas de saída: Lavanda, limão e gálbano
- Notas de coração: Abacaxi, mel, lírio-do-vale, rosa, ylang-ylang e jasmim
- Notas de fundo: Baunilha, sândalo, almíscar e cedro

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-GOUF-B - Gouf Blue 17 ml

Gouf Blue é uma fragrância Ozonteck da família aromático fougère. Pepino, melão e mandarina definem a abertura fresca. Ervas aromáticas e gerânio conduzem a um fundo de camurça, madeiras e almíscar.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Aromático fougère
- Notas de saída: Pepino, melão e mandarina
- Notas de corpo: Manjericão, sálvia e gerânio
- Notas de fundo: Camurça, notas amadeiradas e almíscar
- Código original (Grupo Ozonteck): 40708
- Código EAN: 7898760210417
- Família olfativa: Aromático fougère
- Notas de saída: Pepino, melão e mandarina
- Notas de coração: Manjericão, sálvia e gerânio
- Notas de fundo: Camurça, notas amadeiradas e almíscar

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-GOUF-T - Gouf Tradicional 17 ml

Gouf Tradicional é uma fragrância Ozonteck da família chipre amadeirado. Zimbro, ervas e bergamota abrem uma composição aromática complexa. Couro, pinheiro e especiarias formam o coração, seguido por tabaco, musgo e madeiras.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Chipre amadeirado
- Notas de saída: Bagas de zimbro, manjericão, artemísia, alcarávia, coentro e bergamota
- Notas de corpo: Agulhas de pinheiro, couro, camomila, pimenta, cravo, gerânio, jasmim e rosa
- Notas de fundo: Tabaco, musgo de carvalho, patchouli, cedro, vetiver, almíscar e âmbar
- Código original (Grupo Ozonteck): 40712
- Código EAN: 7898760210295
- Família olfativa: Chipre amadeirado
- Notas de saída: Bagas de zimbro, manjericão, artemísia, alcarávia, coentro e bergamota
- Notas de coração: Agulhas de pinheiro, couro, camomila, pimenta, cravo, gerânio, jasmim e rosa
- Notas de fundo: Tabaco, musgo de carvalho, patchouli, cedro, vetiver, almíscar e âmbar

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-GREC - Grécia 17 ml

Grécia é uma fragrância Ozonteck da família âmbar floral. Jasmim aquático e mandarina verde trazem frescor à abertura. O contraste entre baunilha e sal dá personalidade ao coração, apoiado por um fundo ambarado e amadeirado.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Âmbar floral
- Notas de saída: Jasmim aquático, mandarina verde e flor de gengibre
- Notas de corpo: Baunilha e sal
- Notas de fundo: Âmbar cinzento, madeira de cashmere e sândalo
- Código original (Grupo Ozonteck): 40722
- Código EAN: 7898760210493
- Família olfativa: Âmbar floral
- Notas de saída: Jasmim aquático, mandarina verde e flor de gengibre
- Notas de coração: Baunilha e sal
- Notas de fundo: Âmbar cinzento, madeira de cashmere e sândalo

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-MAD - Madame VI 17 ml

Madame VI é uma fragrância Ozonteck da família âmbar floral. Cítricos e flor de laranjeira abrem um coração de rosa turca, jasmim, mimosa e ylang-ylang. Patchouli e vetiver equilibram a doçura da baunilha e da fava tonka.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Âmbar floral
- Notas de saída: Laranja, mandarina, bergamota e flor de laranjeira
- Notas de corpo: Rosa turca, jasmim, mimosa e ylang-ylang
- Notas de fundo: Patchouli, almíscar branco, baunilha, vetiver e fava tonka
- Código original (Grupo Ozonteck): 40714
- Código EAN: 7898760210202
- Família olfativa: Âmbar floral
- Notas de saída: Laranja, mandarina, bergamota e flor de laranjeira
- Notas de coração: Rosa turca, jasmim, mimosa e ylang-ylang
- Notas de fundo: Patchouli, almíscar branco, baunilha, vetiver e fava tonka

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-MADAME - Madame VI 100 ml

Madame VI é uma fragrância Ozonteck da família âmbar floral. Cítricos e flor de laranjeira abrem um coração de rosa turca, jasmim, mimosa e ylang-ylang. Patchouli e vetiver equilibram a doçura da baunilha e da fava tonka.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Feminino
- Família olfativa: Âmbar floral
- Notas de saída: Laranja, mandarina, bergamota e flor de laranjeira
- Notas de corpo: Rosa turca, jasmim, mimosa e ylang-ylang
- Notas de fundo: Patchouli, almíscar branco, baunilha, vetiver e fava tonka
- Código original (Grupo Ozonteck): 40714 - B
- Código EAN: 7898760210752
- Família olfativa: Âmbar floral
- Notas de saída: Laranja, mandarina, bergamota e flor de laranjeira
- Notas de coração: Rosa turca, jasmim, mimosa e ylang-ylang
- Notas de fundo: Patchouli, almíscar branco, baunilha, vetiver e fava tonka

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-MAX-B - Max Boss 17 ml

Max Boss é uma fragrância Ozonteck da família âmbar amadeirado. Maçã e cítricos antecedem um coração quente de canela, açafrão e cravo. Oud, sândalo e cipriol constroem a base amadeirada, para quem aprecia especiarias e perfumes encorpados.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Âmbar amadeirado
- Notas de saída: Maçã e cítricos
- Notas de corpo: Canela, açafrão, cravo-da-índia e ládano
- Notas de fundo: Agarwood (oud), sândalo e nagarmota (óleo de cipriol)
- Código original (Grupo Ozonteck): 40703
- Código EAN: 7898760210233
- Família olfativa: Âmbar amadeirado
- Notas de saída: Maçã e cítricos
- Notas de coração: Canela, açafrão, cravo-da-índia e ládano
- Notas de fundo: Agarwood (oud), sândalo e nagarmota (óleo de cipriol)

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-MAXBOSS - Max Boss 100 ml

Max Boss é uma fragrância Ozonteck da família âmbar amadeirado. Maçã e cítricos antecedem um coração quente de canela, açafrão e cravo. Oud, sândalo e cipriol constroem a base amadeirada, para quem aprecia especiarias e perfumes encorpados.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Masculino
- Família olfativa: Âmbar amadeirado
- Notas de saída: Maçã e cítricos
- Notas de corpo: Canela, açafrão, cravo-da-índia e ládano
- Notas de fundo: Agarwood (oud), sândalo e nagarmota (óleo de cipriol)
- Código original (Grupo Ozonteck): 40703 - B
- Código EAN: 7898760210882
- Família olfativa: Âmbar amadeirado
- Notas de saída: Maçã e cítricos
- Notas de coração: Canela, açafrão, cravo-da-índia e ládano
- Notas de fundo: Agarwood (oud), sândalo e nagarmota (óleo de cipriol)

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-MAXIMUM - Maximum 17 ml

Maximum é uma fragrância Ozonteck da família amadeirado especiado. Frutas e cítricos se encontram com canela, mogno e cravo. A base combina baunilha, madeiras e vetiver, formando um perfil clássico que equilibra frescor e calor.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Amadeirado especiado
- Notas de saída: Maçã, ameixa, limão, bergamota, musgo de carvalho e gerânio
- Notas de corpo: Canela, mogno e cravo
- Notas de fundo: Baunilha, sândalo, cedro, vetiver e oliveira
- Código original (Grupo Ozonteck): 40701
- Código EAN: 7898760210509
- Família olfativa: Amadeirado especiado
- Notas de saída: Maçã, ameixa, limão, bergamota, musgo de carvalho e gerânio
- Notas de coração: Canela, mogno e cravo
- Notas de fundo: Baunilha, sândalo, cedro, vetiver e oliveira

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-PRESIDENTE - Presidente 17 ml

Presidente é uma fragrância Ozonteck da família amadeirado especiado. Toranja, hortelã e tangerina sanguínea trazem uma abertura fresca. Rosa e canela acrescentam contraste, enquanto couro, âmbar e patchouli definem o fundo quente e amadeirado.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Amadeirado especiado
- Notas de saída: Toranja, hortelã e tangerina sanguínea
- Notas de corpo: Rosa, canela e notas especiadas
- Notas de fundo: Couro, notas amadeiradas, âmbar e patchouli indiano
- Código original (Grupo Ozonteck): 40720
- Código EAN: 7898760210516
- Família olfativa: Amadeirado especiado
- Notas de saída: Toranja, hortelã e tangerina sanguínea
- Notas de coração: Rosa, canela e notas especiadas
- Notas de fundo: Couro, notas amadeiradas, âmbar e patchouli indiano

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-PRES - Presidente 100 ml

Presidente é uma fragrância Ozonteck da família amadeirado especiado. Toranja, hortelã e tangerina sanguínea trazem uma abertura fresca. Rosa e canela acrescentam contraste, enquanto couro, âmbar e patchouli definem o fundo quente e amadeirado.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Masculino
- Família olfativa: Amadeirado especiado
- Notas de saída: Toranja, hortelã e tangerina sanguínea
- Notas de corpo: Rosa, canela e notas especiadas
- Notas de fundo: Couro, notas amadeiradas, âmbar e patchouli indiano
- Código original (Grupo Ozonteck): 40720 -B
- Código EAN: 7898760210769
- Família olfativa: Amadeirado especiado
- Notas de saída: Toranja, hortelã e tangerina sanguínea
- Notas de coração: Rosa, canela e notas especiadas
- Notas de fundo: Couro, notas amadeiradas, âmbar e patchouli indiano

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-SCAN - Scandaloza 17 ml

Scandaloza é uma fragrância Ozonteck da família oriental floral. Laranja sanguínea e mandarina dão um início cítrico ao perfume. Mel e flores compõem o coração, com um fundo doce de cera de abelha, caramelo e alcaçuz, contrastado pelo patchouli.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Oriental floral
- Notas de saída: Laranja sanguínea e mandarina
- Notas de corpo: Mel, gardênia, flor de laranjeira, jasmim e pêssego
- Notas de fundo: Cera de abelha, caramelo, patchouli e alcaçuz
- Código original (Grupo Ozonteck): 40730
- Código EAN: 7898760210165
- Família olfativa: Oriental floral
- Notas de saída: Laranja sanguínea e mandarina
- Notas de coração: Mel, gardênia, flor de laranjeira, jasmim e pêssego
- Notas de fundo: Cera de abelha, caramelo, patchouli e alcaçuz

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-SCAN - Scandaloza 100 ml

Scandaloza é uma fragrância Ozonteck da família oriental floral. Laranja sanguínea e mandarina dão um início cítrico ao perfume. Mel e flores compõem o coração, com um fundo doce de cera de abelha, caramelo e alcaçuz, contrastado pelo patchouli.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Feminino
- Família olfativa: Oriental floral
- Notas de saída: Laranja sanguínea e mandarina
- Notas de corpo: Mel, gardênia, flor de laranjeira, jasmim e pêssego
- Notas de fundo: Cera de abelha, caramelo, patchouli e alcaçuz
- Código original (Grupo Ozonteck): 40730-B
- Código EAN: 7898760210684
- Família olfativa: Oriental floral
- Notas de saída: Laranja sanguínea e mandarina
- Notas de coração: Mel, gardênia, flor de laranjeira, jasmim e pêssego
- Notas de fundo: Cera de abelha, caramelo, patchouli e alcaçuz

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-SEDUC - Seduction 17 ml

Seduction combina framboesa e néroli com um coração de flores brancas. Jasmim e flor de laranjeira se encontram com mel e patchouli, em uma fragrância feminina de perfil floral, doce e envolvente.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Notas de saída: Framboesa, néroli e limão de Amalfi
- Notas de corpo: Jasmim, flor de laranjeira africana e gardênia
- Notas de fundo: Mel branco, patchouli e âmbar
- Código original (Grupo Ozonteck): 40707
- Código EAN: 7898760210318
- Notas de saída: Framboesa, néroli e limão de Amalfi
- Notas de coração: Jasmim, flor de laranjeira africana e gardênia
- Notas de fundo: Mel branco, patchouli e âmbar

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-SENTIMENTO - Sentimento 17 ml

Sentimento é uma fragrância masculina âmbar amadeirada de proposta intensa e envolvente. Flor de laranjeira, lavanda, noz-moscada, fava tonka e madeiras compõem seu perfil marcante.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Âmbar amadeirado
- Código original (Grupo Ozonteck): 40728
- Código EAN: 7898760210523
- Família olfativa: Âmbar amadeirado

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-SENT - Sentimento 100 ml

Sentimento é uma fragrância masculina âmbar amadeirada de proposta intensa e envolvente. Flor de laranjeira, lavanda, noz-moscada, fava tonka e madeiras compõem seu perfil marcante.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Masculino
- Família olfativa: Âmbar amadeirado
- Código original (Grupo Ozonteck): 40728-B
- Código EAN: 7898760210738
- Família olfativa: Âmbar amadeirado

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-SOBERANO - Soberano 17 ml

Soberano é uma fragrância Ozonteck da família amadeirado aquático. Notas oceânicas e cítricas criam uma abertura fresca. Louro e jasmim compõem o coração, enquanto âmbar cinzento, madeira guaiac e patchouli dão corpo ao fundo.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Amadeirado aquático
- Notas de saída: Notas oceânicas, toranja e mandarina
- Notas de corpo: Folha de louro e jasmim
- Notas de fundo: Âmbar cinzento, madeira guaiac, musgo de carvalho e patchouli
- Código original (Grupo Ozonteck): 40718
- Código EAN: 7898760210530
- Família olfativa: Amadeirado aquático
- Notas de saída: Notas oceânicas, toranja e mandarina
- Notas de coração: Folha de louro e jasmim
- Notas de fundo: Âmbar cinzento, madeira guaiac, musgo de carvalho e patchouli

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-SOB - Soberano 100 ml

Soberano é uma fragrância Ozonteck da família amadeirado aquático. Notas oceânicas e cítricas criam uma abertura fresca. Louro e jasmim compõem o coração, enquanto âmbar cinzento, madeira guaiac e patchouli dão corpo ao fundo.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Masculino
- Família olfativa: Amadeirado aquático
- Notas de saída: Notas oceânicas, toranja e mandarina
- Notas de corpo: Folha de louro e jasmim
- Notas de fundo: Âmbar cinzento, madeira guaiac, musgo de carvalho e patchouli
- Código original (Grupo Ozonteck): 40718 - B
- Código EAN: 7898760210714
- Família olfativa: Amadeirado aquático
- Notas de saída: Notas oceânicas, toranja e mandarina
- Notas de coração: Folha de louro e jasmim
- Notas de fundo: Âmbar cinzento, madeira guaiac, musgo de carvalho e patchouli

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-SOUL - Soul 17 ml

Soul é uma fragrância Ozonteck da família aromático fougère. Bergamota e pimenta-preta abrem uma composição fresca e especiada. Lavanda, gerânio e resinas se encontram com vetiver e patchouli, sobre ambroxan, cedro e ládano.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Família olfativa: Aromático fougère
- Notas de saída: Bergamota da Calábria e pimenta-preta
- Notas de corpo: Lavanda, pimenta rosa, vetiver, patchouli, gerânio e elemi
- Código original (Grupo Ozonteck): 40713
- Código EAN: 7898760210219
- Família olfativa: Aromático fougère
- Notas de saída: Bergamota da Calábria e pimenta-preta
- Notas de coração: Lavanda, pimenta rosa, vetiver, patchouli, gerânio e elemi

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-SPEED - Speed Black 17 ml

Speed Black é uma fragrância Ozonteck da família aromático fougère. Maçã, ameixa e cítricos abrem uma composição de flores e especiarias. O fundo de baunilha, âmbar e cedro equilibra frescor e calor em uma proposta versátil.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Aromático fougère
- Notas de saída: Maçã vermelha, ameixa, lima e bergamota
- Notas de corpo: Canela, jasmim, cardamomo e rosa
- Notas de fundo: Baunilha, âmbar, almíscar e cedro
- Código original (Grupo Ozonteck): 40727
- Código EAN: 7898760210547
- Família olfativa: Aromático fougère
- Notas de saída: Maçã vermelha, ameixa, lima e bergamota
- Notas de coração: Canela, jasmim, cardamomo e rosa
- Notas de fundo: Baunilha, âmbar, almíscar e cedro

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-SPEED - Speed Black 100 ml

Speed Black é uma fragrância Ozonteck da família aromático fougère. Maçã, ameixa e cítricos abrem uma composição de flores e especiarias. O fundo de baunilha, âmbar e cedro equilibra frescor e calor em uma proposta versátil.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Masculino
- Família olfativa: Aromático fougère
- Notas de saída: Maçã vermelha, ameixa, lima e bergamota
- Notas de corpo: Canela, jasmim, cardamomo e rosa
- Notas de fundo: Baunilha, âmbar, almíscar e cedro
- Código original (Grupo Ozonteck): 40727 -B
- Código EAN: 7898760211087
- Família olfativa: Aromático fougère
- Notas de saída: Maçã vermelha, ameixa, lima e bergamota
- Notas de coração: Canela, jasmim, cardamomo e rosa
- Notas de fundo: Baunilha, âmbar, almíscar e cedro

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-VENUM - Venum 17 ml

Venum é uma fragrância Ozonteck da família amadeirado aromático. Lavanda e limão marcam a abertura. Maçã, nuances terrosas e esfumaçadas e patchouli dão contraste ao coração; baunilha e vetiver fecham a proposta aromática.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Família olfativa: Amadeirado aromático
- Notas de saída: Lavanda, raspas de limão e limão de Amalfi
- Notas de corpo: Lavanda, notas terrosas, fumaça, maçã e patchouli
- Notas de fundo: Baunilha, lavanda e vetiver
- Código original (Grupo Ozonteck): 40729
- Código EAN: 7898760210271
- Família olfativa: Amadeirado aromático
- Notas de saída: Lavanda, raspas de limão e limão de Amalfi
- Notas de coração: Lavanda, notas terrosas, fumaça, maçã e patchouli
- Notas de fundo: Baunilha, lavanda e vetiver

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-VG - VG Sexy 17 ml

VG Sexy é uma fragrância âmbar floral que combina pimenta rosa e cítricos com flores e algodão-doce. Baunilha, caramelo e madeiras reforçam o perfil adocicado e envolvente, para quem aprecia perfumes de presença marcante.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Âmbar floral
- Notas de saída: Pimenta rosa, mandarina e bergamota
- Notas de corpo: Algodão-doce, gardênia, flores, sardinheira e rosa
- Notas de fundo: Baunilha, almíscar, sândalo, caramelo, patchouli e violeta
- Código original (Grupo Ozonteck): 40717
- Código EAN: 7898760210554
- Família olfativa: Âmbar floral
- Notas de saída: Pimenta rosa, mandarina e bergamota
- Notas de coração: Algodão-doce, gardênia, flores, sardinheira e rosa
- Notas de fundo: Baunilha, almíscar, sândalo, caramelo, patchouli e violeta

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-VG - VG Sexy 100 ml

VG Sexy é uma fragrância âmbar floral que combina pimenta rosa e cítricos com flores e algodão-doce. Baunilha, caramelo e madeiras reforçam o perfil adocicado e envolvente, para quem aprecia perfumes de presença marcante.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Feminino
- Família olfativa: Âmbar floral
- Notas de saída: Pimenta rosa, mandarina e bergamota
- Notas de corpo: Algodão-doce, gardênia, flores, sardinheira e rosa
- Notas de fundo: Baunilha, almíscar, sândalo, caramelo, patchouli e violeta
- Código original (Grupo Ozonteck): 40717 - B
- Código EAN: 7898760210707
- Família olfativa: Âmbar floral
- Notas de saída: Pimenta rosa, mandarina e bergamota
- Notas de coração: Algodão-doce, gardênia, flores, sardinheira e rosa
- Notas de fundo: Baunilha, almíscar, sândalo, caramelo, patchouli e violeta

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-VIDA - Vida Bella 17 ml

Vida Bella é uma fragrância Ozonteck da família floral frutado gourmand. Groselha-negra e pera dão frescor ao início, seguidas por íris, jasmim e flor de laranjeira. Pralinê, baunilha e fava tonka formam um fundo doce com a profundidade do patchouli.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Floral frutado gourmand
- Notas de saída: Groselha-negra e pera
- Notas de corpo: Íris, jasmim e flor de laranjeira
- Notas de fundo: Pralinê, baunilha, patchouli e fava tonka
- Código original (Grupo Ozonteck): 40706
- Código EAN: 7898760210172
- Família olfativa: Floral frutado gourmand
- Notas de saída: Groselha-negra e pera
- Notas de coração: Íris, jasmim e flor de laranjeira
- Notas de fundo: Pralinê, baunilha, patchouli e fava tonka

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-VIDA - Vida Bella 100 ml

Vida Bella é uma fragrância Ozonteck da família floral frutado gourmand. Groselha-negra e pera dão frescor ao início, seguidas por íris, jasmim e flor de laranjeira. Pralinê, baunilha e fava tonka formam um fundo doce com a profundidade do patchouli.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Público: Feminino
- Família olfativa: Floral frutado gourmand
- Notas de saída: Groselha-negra e pera
- Notas de corpo: Íris, jasmim e flor de laranjeira
- Notas de fundo: Pralinê, baunilha, patchouli e fava tonka
- Código original (Grupo Ozonteck): 40706 - B
- Código EAN: 7898760210691
- Família olfativa: Floral frutado gourmand
- Notas de saída: Groselha-negra e pera
- Notas de coração: Íris, jasmim e flor de laranjeira
- Notas de fundo: Pralinê, baunilha, patchouli e fava tonka

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-VIP-GIRL - VIP Girl VIP 17 ml

VIP Girl VIP é uma fragrância Ozonteck da família floral frutado. O acorde de champanhe rosé e a pimenta rosa dão um início vibrante. Flor de pêssego e rosa trazem delicadeza, sobre uma base de almíscar branco e madeiras.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Família olfativa: Floral frutado
- Notas de saída: Champanhe rosé e pimenta rosa
- Notas de corpo: Flor de pêssego e rosa
- Notas de fundo: Almíscar branco e notas amadeiradas
- Código original (Grupo Ozonteck): 40719
- Código EAN: 7898760210561
- Família olfativa: Floral frutado
- Notas de saída: Champanhe rosé e pimenta rosa
- Notas de coração: Flor de pêssego e rosa
- Notas de fundo: Almíscar branco e notas amadeiradas

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-AALI - Aaliyah 17 ml

Aaliyah combina frescor, frutas e doçura em uma fragrância feminina. Bergamota e notas verdes abrem a composição; melão, abacaxi e âmbar formam o coração. O fundo de almíscar, madeiras e baunilha acrescenta suavidade e aconchego.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Notas de saída: Bergamota e notas verdes
- Notas de corpo: Melão, abacaxi e âmbar
- Notas de fundo: Almíscar, notas amadeiradas e baunilha
- Código original (Grupo Ozonteck): 41727
- Código EAN: 7898760210998
- Notas de saída: Bergamota e notas verdes
- Notas de coração: Melão, abacaxi e âmbar
- Notas de fundo: Almíscar, notas amadeiradas e baunilha

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-AALIYAH - Aaliyah 100 ml

Aaliyah combina frescor, frutas e doçura em uma fragrância feminina. Bergamota e notas verdes abrem a composição; melão, abacaxi e âmbar formam o coração. O fundo de almíscar, madeiras e baunilha acrescenta suavidade e aconchego.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Notas de saída: Bergamota e notas verdes
- Notas de corpo: Melão, abacaxi e âmbar
- Notas de fundo: Almíscar, notas amadeiradas e baunilha
- Código original (Grupo Ozonteck): 41732
- Código EAN: 7898760211049
- Notas de saída: Bergamota e notas verdes
- Notas de coração: Melão, abacaxi e âmbar
- Notas de fundo: Almíscar, notas amadeiradas e baunilha

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-OUD - Oud Royale 17 ml

Oud Royale é uma fragrância masculina de perfil intenso e quente. Pimenta preta, tabaco e abacaxi introduzem um coração de café, íris e patchouli. Baunilha, âmbar, madeira seca, benjoim e ládano compõem um fundo encorpado, voltado a quem aprecia perfumes marcantes.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Notas de saída: Pimenta preta, tabaco e abacaxi
- Notas de corpo: Patchouli, café e íris
- Notas de fundo: Baunilha, âmbar, madeira seca, benjoim e ládano
- Código original (Grupo Ozonteck): 41730
- Código EAN: 7898760210981
- Notas de saída: Pimenta preta, tabaco e abacaxi
- Notas de coração: Patchouli, café e íris
- Notas de fundo: Baunilha, âmbar, madeira seca, benjoim e ládano

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-OUD - Oud Royale 100 ml

Oud Royale é uma fragrância masculina de perfil intenso e quente. Pimenta preta, tabaco e abacaxi introduzem um coração de café, íris e patchouli. Baunilha, âmbar, madeira seca, benjoim e ládano compõem um fundo encorpado, voltado a quem aprecia perfumes marcantes.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Notas de saída: Pimenta preta, tabaco e abacaxi
- Notas de corpo: Patchouli, café e íris
- Notas de fundo: Baunilha, âmbar, madeira seca, benjoim e ládano
- Código original (Grupo Ozonteck): 41731
- Código EAN: 7898760211025
- Notas de saída: Pimenta preta, tabaco e abacaxi
- Notas de coração: Patchouli, café e íris
- Notas de fundo: Baunilha, âmbar, madeira seca, benjoim e ládano

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-RHINO - Rhino Royale 17 ml

Rhino Royale combina uma abertura aromática de limão, hortelã, manjericão e tomilho com um coração de groselha preta, lavanda, alecrim e jasmim. Almíscar e verbena completam esta fragrância masculina de proposta fresca e equilibrada.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Notas de saída: Hortelã, limão, manjericão e tomilho
- Notas de corpo: Groselha preta, lavanda, alecrim e jasmim
- Notas de fundo: Almíscar e verbena
- Código original (Grupo Ozonteck): 41729
- Código EAN: 7898760210974
- Notas de saída: Hortelã, limão, manjericão e tomilho
- Notas de coração: Groselha preta, lavanda, alecrim e jasmim
- Notas de fundo: Almíscar e verbena

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-RHINO - Rhino Royale 100 ml

Rhino Royale combina uma abertura aromática de limão, hortelã, manjericão e tomilho com um coração de groselha preta, lavanda, alecrim e jasmim. Almíscar e verbena completam esta fragrância masculina de proposta fresca e equilibrada.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Notas de saída: Hortelã, limão, manjericão e tomilho
- Notas de corpo: Groselha preta, lavanda, alecrim e jasmim
- Notas de fundo: Almíscar e verbena
- Código original (Grupo Ozonteck): 41733
- Código EAN: 7898760211032
- Notas de saída: Hortelã, limão, manjericão e tomilho
- Notas de coração: Groselha preta, lavanda, alecrim e jasmim
- Notas de fundo: Almíscar e verbena

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-SUBLI - Sublime 17 ml

Sublime combina flores, especiarias e madeiras em uma fragrância de contrastes. Lavanda, maçã, canela e jacarandá abrem a composição; rosa, lírio-do-vale e cedro formam o coração. Oud, sândalo, âmbar, baunilha e almíscar conferem um acabamento quente.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Notas de saída: Lavanda, canela, maçã e jacarandá
- Notas de corpo: Rosa, lírio-do-vale e cedro
- Notas de fundo: Oud, sândalo, âmbar, baunilha e almíscar
- Código original (Grupo Ozonteck): 41728
- Código EAN: 7898760211001
- Notas de saída: Lavanda, canela, maçã e jacarandá
- Notas de coração: Rosa, lírio-do-vale e cedro
- Notas de fundo: Oud, sândalo, âmbar, baunilha e almíscar

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### P100-SUBLIME - Sublime 100 ml

Sublime combina flores, especiarias e madeiras em uma fragrância de contrastes. Lavanda, maçã, canela e jacarandá abrem a composição; rosa, lírio-do-vale e cedro formam o coração. Oud, sândalo, âmbar, baunilha e almíscar conferem um acabamento quente.

- Categoria: Perfumaria
- Apresentação: 100 ml
- Notas de saída: Lavanda, canela, maçã e jacarandá
- Notas de corpo: Rosa, lírio-do-vale e cedro
- Notas de fundo: Oud, sândalo, âmbar, baunilha e almíscar
- Código original (Grupo Ozonteck): 41734
- Código EAN: 7898760211056
- Notas de saída: Lavanda, canela, maçã e jacarandá
- Notas de coração: Rosa, lírio-do-vale e cedro
- Notas de fundo: Oud, sândalo, âmbar, baunilha e almíscar

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-LABOOM - Laboom 17 ml

Laboom é uma fragrância feminina que combina uma abertura de frutas exóticas com um coração floral delicado. A baunilha acrescenta cremosidade e calor ao fundo, equilibrando frescor e doçura em uma proposta versátil para o dia e ocasiões à noite.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Feminino
- Código original (Grupo Ozonteck): 46496
- Código EAN: 7898760211377

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-SUPREMO - Supremo Elixir 17 ml

Supremo Elixir é um perfume masculino de proposta intensa e marcante. O frasco de 17 ml oferece uma apresentação compacta para levar na bolsa ou na nécessaire.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Código original (Grupo Ozonteck): 41726
- Código EAN: 7898760210646

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-FER-VE - Férias no Caribe by Virgínia Esquivel

Férias no Caribe by Virgínia Esquivel é um body splash da Ozonteck para perfumação corporal, uma opção para complementar a rotina de cuidados pessoais.

- Categoria: Perfumaria
- Código original (Grupo Ozonteck): 45171
- Código EAN: 7898760211346

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-LUA-VE - Lua de Mel em Paris by Virgínia Esquivel

Lua de Mel em Paris by Virgínia Esquivel é um body splash da Ozonteck para perfumação corporal, parte da linha de fragrâncias by Virgínia Esquivel.

- Categoria: Perfumaria
- Código original (Grupo Ozonteck): 45170
- Código EAN: 7898760211339

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### PERF-EASY - Easy Line 17 ml

Easy Line combina frescor frutado, nuances herbáceas e um fundo quente. Maçã, gengibre e bergamota abrem a composição; sálvia, zimbro e gerânio formam o coração. Madeira de âmbar, fava tonka, cedro, vetiver e olíbano completam a fragrância masculina amadeirada, versátil para ocasiões casuais ou formais.

- Categoria: Perfumaria
- Apresentação: 17 ml
- Público: Masculino
- Família olfativa: Amadeirado
- Notas de saída: Maçã, gengibre e bergamota
- Notas de corpo: Sálvia, bagas de zimbro (junípero) e gerânio
- Notas de fundo: Madeira de âmbar, fava tonka, cedro, vetiver e olíbano
- Código original (Grupo Ozonteck): 40711
- Código EAN: 7898760210240
- Família olfativa: Amadeirado
- Notas de saída: Maçã, gengibre e bergamota
- Notas de coração: Sálvia, bagas de zimbro (junípero) e gerânio
- Notas de fundo: Madeira de âmbar, fava tonka, cedro, vetiver e olíbano

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-AMYNO-CX - Amyno Ozon Caixa

Amyno Ozon é um suplemento alimentar em pó na apresentação em caixa. A caixa reúne unidades individuais do produto.

- Categoria: Nutracêuticos
- Apresentação: Caixa.
- Código original (Grupo Ozonteck): IMP-189
- Apresentação: Caixa.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-AMYNO-UN - Amyno Ozon Unidade

Amyno Ozon é um suplemento alimentar em pó na apresentação individual.

- Categoria: Nutracêuticos
- Apresentação: Unidade.
- Código original (Grupo Ozonteck): IMP-197
- Apresentação: Unidade.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-POWER-UN - Ozon Power Unidade

Ozon Power é um suplemento alimentar para adultos que combina vitaminas, minerais, aminoácidos e compostos bioativos. Na apresentação individual, reúne vitaminas do complexo B e C, coenzima Q10, cafeína e outros componentes.

A fórmula reúne vitaminas do complexo B e vitamina C, coenzima Q10, aminoácidos e outros compostos bioativos em uma apresentação individual voltada ao público adulto. Os grupos de componentes estão organizados abaixo.

- Categoria: Nutracêuticos
- Apresentação: Unidade.
- Componentes conhecidos: Vitaminas B1, B2, B5, B6, B12 e C; coenzima Q10; taurina; tirosina; arginina; cafeína; trans-resveratrol.
- Código original (Grupo Ozonteck): IMP-49
- Componentes conhecidos: Vitaminas B1, B2, B5, B6, B12 e C; coenzima Q10; taurina; tirosina; arginina; cafeína; trans-resveratrol.
- Apresentação: Unidade.
- Vitaminas: B1, B2, B5, B6, B12 e C.
- Aminoácidos e outros compostos: Taurina, tirosina e arginina. Coenzima Q10, cafeína e trans-resveratrol.
- Público: Adulto.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### NUT-MUNITY-UN - Ozon Munity Unidade

Ozon Munity é um suplemento alimentar na apresentação individual. Combina carboidratos, vitaminas, minerais e fibras solúveis, com maltodextrina entre seus componentes.

A maltodextrina compõe a parte de carboidratos da fórmula, acompanhada por um mix de vitaminas e minerais e fibras solúveis. A apresentação individual reúne esses grupos de nutrientes em uma unidade do suplemento.

- Categoria: Nutracêuticos
- Apresentação: Unidade.
- Componentes conhecidos: Maltodextrina, mix de vitaminas e minerais e fibras solúveis.
- Código original (Grupo Ozonteck): IMP-48
- Componentes conhecidos: Maltodextrina, mix de vitaminas e minerais e fibras solúveis.
- Apresentação: Unidade.
- Grupos de componentes: Carboidratos: maltodextrina. Mix de vitaminas e minerais. Fibras solúveis.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### BE-SER-LUM - Sérum Facial Lumino3

Lumino3 é um sérum facial ozonizado com vitamina C e ácido hialurônico. Desenvolvido para todos os tipos de pele, reúne hidratação e cuidado da aparência da pele, favorecendo maciez e um aspecto luminoso.

A vitamina C e o ácido hialurônico combinam cuidado antioxidante e hidratação em uma fórmula ozonizada. A proposta cosmética inclui melhorar a aparência das linhas finas e da elasticidade, deixando a pele com aspecto mais firme, luminoso e revitalizado.

- Categoria: Bem Estar
- Ativos destacados: Vitamina C e ácido hialurônico.
- Código original (Grupo Ozonteck): 40566
- Código EAN: 7898760210585
- Ativos destacados: Vitamina C e ácido hialurônico.
- Indicação: Todos os tipos de pele.
- Benefícios cosméticos: Hidratação e luminosidade. Cuidado da aparência de linhas finas. Melhora do aspecto de firmeza e elasticidade.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-CO-KES - Condicionador Ozon-Kesen

O Condicionador Ozon-Kesen cuida de cabelos pós-química e de fios ressecados pela exposição ao sol ou pelo uso de chapinha. Manteiga de cupuaçu ozonizada e queratina condicionam os fios e ajudam a preservar a umidade, proporcionando sedosidade, maciez e brilho.

O condicionamento forma uma película protetora nos fios que ajuda a reter a umidade e a protegê-los contra novas agressões. A combinação de cupuaçu ozonizado e queratina complementa a sequência de shampoo e máscara, deixando o comprimento sedoso e brilhante.

- Categoria: Cuidados Capilares
- Linha: Ozon-Kesen
- Tipo de uso: Uso externo
- Ativos destacados: Manteiga de cupuaçu ozonizada e queratina.
- Código original (Grupo Ozonteck): 40548
- Código EAN: 7898996428235
- Ativos destacados: Manteiga de cupuaçu ozonizada e queratina.
- Modo de uso: Após o Shampoo e a Máscara Ozon-Kesen, distribua por todo o comprimento dos fios. Deixe agir por alguns minutos e enxágue abundantemente.
- Precauções: Uso externo. Evite contato com os olhos e mantenha fora do alcance de crianças. Faça um teste de sensibilidade antes do primeiro uso. Conserve em local fresco e seco, protegido da luz solar. Em caso de contato com os olhos, lave imediatamente com água corrente.
- Benefícios cosméticos: Película protetora e retenção de umidade. Sedosidade, maciez e brilho.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-PRO-KES - Pro Kesen

Pro Kesen é uma máscara capilar reestruturadora para redução de volume e controle do frizz. A combinação de ácidos hialurônico e lático, óleos e silicone cuida do alinhamento e da aparência dos fios danificados. O tratamento favorece brilho, maleabilidade e toque sedoso, ajudando a preservar a umidade durante o alinhamento.

Os ácidos hialurônico e lático se combinam a óleos e silicone de estrutura molecular diferenciada. A fórmula envolve os fios em um filme protetor para melhorar a aparência das cutículas, reduzir a porosidade e manter a umidade durante o alinhamento.

A proposta inclui tanto alinhamento com efeito liso quanto abertura dos cachos, com redução de frizz e volume. O cuidado se adapta a diferentes espessuras de cabelo, dos finos aos grossos, sempre precedido pelo teste de mecha.

- Categoria: Cuidados Capilares
- Tipo de uso: Uso externo
- Ativos destacados: Ácidos hialurônico e lático. Óleos e silicone de estrutura molecular diferenciada.
- Código original (Grupo Ozonteck): 40544
- Código EAN: 7898760210097
- Ativos destacados: Ácidos hialurônico e lático. Óleos e silicone de estrutura molecular diferenciada.
- Precauções: Realize teste de mecha antes da aplicação em todo o cabelo e teste de sensibilidade antes do uso. Use luvas na aplicação. Uso externo. Não aplique sobre pele irritada ou lesionada. Em caso de irritação, suspenda imediatamente o uso. Evite contato com os olhos. Mantenha fora do alcance de crianças. Conserve em temperatura ambiente, longe do calor e da luz. Para uso durante a gravidez, consulte um médico.
- Benefícios cosméticos: Controle de volume e frizz. Alinhamento e facilidade para pentear. Cuidado da porosidade e das cutículas. Hidratação, brilho, maleabilidade e toque aveludado.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-AT-MC - Ativador Master Curls

O Ativador Master Curls finaliza os cabelos cacheados, combinando hidratação e definição. A aplicação mecha a mecha valoriza o formato dos cachos e complementa a rotina com o shampoo e a máscara da linha.

O finalizador valoriza a forma natural dos cachos e complementa a hidratação da linha Master Curls. Sua proposta de proteção cosmética inclui o cuidado dos fios expostos aos raios UV e à poluição, mantendo a aparência definida e luminosa.

- Categoria: Cuidados Capilares
- Linha: Master Curls
- Tipo de uso: Uso externo
- Código original (Grupo Ozonteck): 40559
- Código EAN: 7898996428228
- Modo de uso: Após lavar com o Shampoo Master Curls, aplique a máscara da linha, respeite sua pausa e enxágue. Distribua uma pequena quantidade do ativador mecha a mecha por toda a extensão dos fios. Finalize como desejar, com secagem natural ou outro método de secagem.
- Precauções: Uso externo. Evite contato com os olhos e mantenha fora do alcance de crianças. Faça um teste de sensibilidade antes do primeiro uso. Conserve em local fresco e seco, protegido da luz solar. Em caso de contato com os olhos, lave imediatamente com água corrente.
- Benefícios cosméticos: Hidratação e definição dos cachos. Proteção cosmética contra danos ambientais.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.

### CAP-CO-MEL - Condicionador Mel & Ozônio

O Condicionador Mel & Ozônio cuida de cabelos fragilizados e sem vida, combinando hidratação e nutrição. Óleo de girassol ozonizado, extrato de mel, geleia real e vitaminas A, D e E favorecem maciez, sedosidade e brilho.

O extrato de mel e a geleia real complementam a nutrição e a hidratação. As vitaminas A, D e E integram o cuidado antioxidante e umectante, enquanto o óleo de girassol ozonizado contribui para a proposta revitalizante da linha Mel & Ozônio.

- Categoria: Cuidados Capilares
- Linha: Mel & Ozônio
- Ativos destacados: Óleo de girassol ozonizado, extrato de mel, geleia real e vitaminas A, D e E.
- Código original (Grupo Ozonteck): 40551
- Código EAN: 7898996428266
- Ativos destacados: Óleo de girassol ozonizado, extrato de mel, geleia real e vitaminas A, D e E.
- Vitaminas: Vitaminas A, D e E.

Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.
