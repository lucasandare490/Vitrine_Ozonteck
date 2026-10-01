import type { Research } from './product-research';

// Editorial reconciliation of the official-site transcription supplied on 2026-09-28.
// Notes describe fragrance accords, not ingredients; no commercial fields are changed.
type Fragrance = [codes: string, name: string, family: string, description: string, top: string, heart: string, base: string];
const fragrances: Fragrance[] = [
  ['PERF-CAPA', 'Capadócia', 'Fougère aromático', 'Lavanda e cítricos abrem uma composição aromática, com especiarias e madeiras no coração. Couro, âmbar e fava tonka dão profundidade ao perfil clássico.', 'Lavanda, limão, manjericão, bergamota e sálvia-esclareia', 'Anis-estrelado, sândalo, vetiver, cardamomo, zimbro e cedro', 'Musgo de carvalho, couro, âmbar, almíscar e fava tonka'],
  ['PERF-CIND P100-CIND', 'Cinderela', 'Âmbar floral', 'Café e amêndoa encontram flores brancas e uma base doce, especiada e amadeirada. É uma composição de contrastes, para quem aprecia perfumes florais com presença gourmand.', 'Amêndoa, café, bergamota e limão', 'Tuberosa, jasmim sambac, flor de laranjeira, raiz de orris e rosa búlgara', 'Fava tonka, cacau, baunilha, pralinê, sândalo, almíscar, âmbar, madeira de cashmere, canela, patchouli e cedro'],
  ['PERF-DG', 'DG Red', 'Floral frutado, conforme a marca', 'Uma abertura cítrica, verde e aldeídica conduz a um coração floral com especiarias. Sândalo, baunilha e almíscar equilibram o acabamento com calor e suavidade.', 'Aldeídos, manjericão, cítricos, hera, mandarina, frésia e bergamota', 'Cravo, cravo-de-defunto, coentro, flor de laranjeira, lírio, jasmim, rosa búlgara e lírio-do-vale', 'Sândalo, baunilha, almíscar e fava tonka'],
  ['PERF-GREC', 'Grécia', 'Âmbar floral', 'Jasmim aquático e mandarina verde trazem frescor à abertura. O contraste entre baunilha e sal dá personalidade ao coração, apoiado por um fundo ambarado e amadeirado.', 'Jasmim aquático, mandarina verde e flor de gengibre', 'Baunilha e sal', 'Âmbar cinzento, madeira de cashmere e sândalo'],
  ['PERF-FERA', 'Fera', 'Âmbar amadeirado', 'Lavanda e limão abrem um perfume que combina abacaxi, mel e flores. A base de baunilha e madeiras acentua seu lado quente e envolvente.', 'Lavanda, limão e gálbano', 'Abacaxi, mel, lírio-do-vale, rosa, ylang-ylang e jasmim', 'Baunilha, sândalo, almíscar e cedro'],
  ['PERF-MAXIMUM', 'Maximum', 'Amadeirado especiado', 'Frutas e cítricos se encontram com canela, mogno e cravo. A base combina baunilha, madeiras e vetiver, formando um perfil clássico que equilibra frescor e calor.', 'Maçã, ameixa, limão, bergamota, musgo de carvalho e gerânio', 'Canela, mogno e cravo', 'Baunilha, sândalo, cedro, vetiver e oliveira'],
  ['PERF-PRESIDENTE P100-PRES', 'Presidente', 'Amadeirado especiado', 'Toranja, hortelã e tangerina sanguínea trazem uma abertura fresca. Rosa e canela acrescentam contraste, enquanto couro, âmbar e patchouli definem o fundo quente e amadeirado.', 'Toranja, hortelã e tangerina sanguínea', 'Rosa, canela e notas especiadas', 'Couro, notas amadeiradas, âmbar e patchouli indiano'],
  ['PERF-SENTIMENTO P100-SENT', 'Sentimento', 'Âmbar amadeirado', 'Cítricos e flor de laranjeira antecedem um coração aromático de lavanda, ervas e especiarias. Fava tonka e madeiras dão profundidade à proposta marcante da fragrância.', 'Flor de laranjeira africana, laranja amarga e limão de Amalfi', 'Lavanda, gerânio, cardamomo, noz-moscada, alecrim e coentro', 'Fava tonka, agarwood (oud), madeira de teca, musgo de carvalho e vetiver'],
  ['PERF-VIP-GIRL', 'VIP Girl VIP', 'Floral frutado', 'O acorde de champanhe rosé e a pimenta rosa dão um início vibrante. Flor de pêssego e rosa trazem delicadeza, sobre uma base de almíscar branco e madeiras.', 'Champanhe rosé e pimenta rosa', 'Flor de pêssego e rosa', 'Almíscar branco e notas amadeiradas'],
  ['PERF-SOBERANO P100-SOB', 'Soberano', 'Amadeirado aquático', 'Notas oceânicas e cítricas criam uma abertura fresca. Louro e jasmim compõem o coração, enquanto âmbar cinzento, madeira guaiac e patchouli dão corpo ao fundo.', 'Notas oceânicas, toranja e mandarina', 'Folha de louro e jasmim', 'Âmbar cinzento, madeira guaiac, musgo de carvalho e patchouli'],
  ['PERF-VG P100-VG', 'VG Sexy', 'Âmbar floral', 'Pimenta rosa e cítricos se combinam a flores e algodão-doce. Baunilha, caramelo e madeiras reforçam o perfil adocicado e envolvente, diferente da descrição publicada para o hidratante homônimo.', 'Pimenta rosa, mandarina e bergamota', 'Algodão-doce, gardênia, flores, sardinheira e rosa', 'Baunilha, almíscar, sândalo, caramelo, patchouli e violeta'],
  ['PERF-SPEED P100-SPEED', 'Speed Black', 'Aromático fougère', 'Maçã, ameixa e cítricos abrem uma composição de flores e especiarias. O fundo de baunilha, âmbar e cedro equilibra frescor e calor em uma proposta versátil.', 'Maçã vermelha, ameixa, lima e bergamota', 'Canela, jasmim, cardamomo e rosa', 'Baunilha, âmbar, almíscar e cedro'],
  ['PERF-303-VIP', '303 VIP Men', 'Âmbar amadeirado', 'Maracujá, lima e pimenta-preta dão um início frutado e picante. Acordes de vodca e gim, hortelã e especiarias formam o coração, com âmbar e couro no fundo.', 'Maracujá, lima e pimenta-preta', 'Acordes de vodca e gim, hortelã e especiarias', 'Âmbar e couro; a lista publicada pela marca está incompleta'],
  ['PERF-MAX-B P100-MAXBOSS', 'Max Boss', 'Âmbar amadeirado', 'Maçã e cítricos antecedem um coração quente de canela, açafrão e cravo. Oud, sândalo e cipriol constroem a base amadeirada, para quem aprecia especiarias e perfumes encorpados.', 'Maçã e cítricos', 'Canela, açafrão, cravo-da-índia e ládano', 'Agarwood (oud), sândalo e nagarmota (óleo de cipriol)'],
  ['PERF-303-M', '303 Men', 'Amadeirado aromático', 'Notas verdes, cítricos e lavanda criam uma abertura fresca. Gengibre e flores dão contraste ao coração, com um fundo de almíscar, sândalo e vetiver de perfil clássico.', 'Notas verdes, toranja, bergamota e lavanda; a lista publicada está incompleta', 'Gengibre, violeta, gardênia e sálvia', 'Almíscar, sândalo, vetiver e ládano'],
  ['PERF-ALEM', 'Alem', 'Âmbar amadeirado', 'Cítricos e mandarina iluminam um coração de jasmim marroquino e flores brancas. Âmbar branco e cashmeran completam a composição com um fundo quente e amadeirado.', 'Cítricos e mandarina', 'Jasmim marroquino e flores brancas', 'Âmbar branco e cashmeran'],
  ['PERF-FANT', 'Fantástica Bry', 'Floral frutado gourmand', 'Kiwi, lichia e marmelo introduzem uma fragrância doce e frutada. Chocolate branco e cupcake se misturam às flores, apoiados por almíscar, orris e madeiras.', 'Kiwi, lichia vermelha e marmelo', 'Chocolate branco, cupcake, orquídea e jasmim', 'Almíscar, raiz de orris e notas amadeiradas'],
  ['PERF-VENUM', 'Venum', 'Amadeirado aromático', 'Lavanda e limão marcam a abertura. Maçã, nuances terrosas e esfumaçadas e patchouli dão contraste ao coração; baunilha e vetiver fecham a proposta aromática.', 'Lavanda, raspas de limão e limão de Amalfi', 'Lavanda, notas terrosas, fumaça, maçã e patchouli', 'Baunilha, lavanda e vetiver'],
  ['PERF-VIDA P100-VIDA', 'Vida Bella', 'Floral frutado gourmand', 'Groselha-negra e pera dão frescor ao início, seguidas por íris, jasmim e flor de laranjeira. Pralinê, baunilha e fava tonka formam um fundo doce com a profundidade do patchouli.', 'Groselha-negra e pera', 'Íris, jasmim e flor de laranjeira', 'Pralinê, baunilha, patchouli e fava tonka'],
  ['PERF-SEDUC', 'Seduction', 'Floral frutado', 'Framboesa, néroli e limão abrem uma composição de flores brancas. Mel branco, patchouli e âmbar acrescentam doçura e calor à base.', 'Framboesa, néroli e limão de Amalfi', 'Jasmim, flor de laranjeira africana e gardênia', 'Mel branco, patchouli e âmbar'],
  ['PERF-GOUF-B', 'Gouf Blue', 'Aromático fougère', 'Pepino, melão e mandarina definem a abertura fresca. Ervas aromáticas e gerânio conduzem a um fundo de camurça, madeiras e almíscar.', 'Pepino, melão e mandarina', 'Manjericão, sálvia e gerânio', 'Camurça, notas amadeiradas e almíscar'],
  ['PERF-303-W', '303 For Woman', 'Floral amadeirado', 'Cítricos, flor de laranjeira e flor de cactos abrem um buquê floral variado. Sândalo e almíscar dão suavidade e uma base amadeirada à composição.', 'Flor de laranjeira, flor de cactos, bergamota e mandarina', 'Lírio, frésia, gardênia, jasmim, lírio-do-vale, camélia branca, rosa e peônia', 'Sândalo e almíscar'],
  ['PERF-ANGE', 'Angelical', 'Âmbar baunilha', 'Algodão-doce, frutas e bergamota apresentam o lado gourmand da fragrância. Mel e especiarias aparecem no coração, com caramelo, baunilha e patchouli no fundo.', 'Algodão-doce, cassis, melão, jasmim, bergamota e abacaxi', 'Mel, amora, ameixa, damasco, noz-moscada e rosa', 'Patchouli, caramelo, baunilha, fava tonka e âmbar'],
  ['PERF-BLUE', 'Blue Sky', 'Floral frutado', 'Limão siciliano e maçã trazem um frescor frutado à abertura. Bambu e flores dão leveza ao coração, com cedro, almíscar e âmbar no acabamento.', 'Limão siciliano, maçã e cedro', 'Bambu, jasmim e rosa branca', 'Cedro, almíscar e âmbar'],
  ['PERF-FAMMA', 'Famma', 'Chipre floral frutado', 'Manga e bergamota criam um início frutado e luminoso. Jasmim e olíbano se encontram no coração, sobre uma base cremosa de baunilha e sândalo.', 'Manga e bergamota', 'Jasmim e olíbano', 'Baunilha e sândalo'],
  ['PERF-GOUF-T', 'Gouf Tradicional', 'Chipre amadeirado', 'Zimbro, ervas e bergamota abrem uma composição aromática complexa. Couro, pinheiro e especiarias formam o coração, seguido por tabaco, musgo e madeiras.', 'Bagas de zimbro, manjericão, artemísia, alcarávia, coentro e bergamota', 'Agulhas de pinheiro, couro, camomila, pimenta, cravo, gerânio, jasmim e rosa', 'Tabaco, musgo de carvalho, patchouli, cedro, vetiver, almíscar e âmbar'],
  ['PERF-MAD P100-MADAME', 'Madame VI', 'Âmbar floral', 'Cítricos e flor de laranjeira abrem um coração de rosa turca, jasmim, mimosa e ylang-ylang. Patchouli e vetiver equilibram a doçura da baunilha e da fava tonka.', 'Laranja, mandarina, bergamota e flor de laranjeira', 'Rosa turca, jasmim, mimosa e ylang-ylang', 'Patchouli, almíscar branco, baunilha, vetiver e fava tonka'],
  ['PERF-SCAN P100-SCAN', 'Scandaloza', 'Oriental floral', 'Laranja sanguínea e mandarina dão um início cítrico ao perfume. Mel e flores compõem o coração, com um fundo doce de cera de abelha, caramelo e alcaçuz, contrastado pelo patchouli.', 'Laranja sanguínea e mandarina', 'Mel, gardênia, flor de laranjeira, jasmim e pêssego', 'Cera de abelha, caramelo, patchouli e alcaçuz'],
  ['PERF-DOCU', 'Doçurinha', 'Floral frutado', 'Sorbet de morango e cítricos criam uma abertura doce e vibrante. O coração combina um acorde de chiclete e flores, com baunilha, almíscar e âmbar na base.', 'Sorbet de morango, mandarina e laranja', 'Acorde de chiclete Bubbaloo, notas sparkling e buquê de flores', 'Almíscar, baunilha e âmbar'],
  ['PERF-AVEN', 'Aventura', 'Cítrico aromático', 'Limão e abacaxi encontram lavanda, hortelã e cardamomo na abertura. Flores e notas verdes conduzem a uma base de sândalo, cedro, baunilha e musgo.', 'Limão, abacaxi, cardamomo, lavanda e hortelã', 'Jasmim, magnólia, grama verde e junípero', 'Sândalo, cedro, baunilha e musgo de carvalho'],
  ['PERF-SOUL', 'Soul', 'Aromático fougère', 'Bergamota e pimenta-preta abrem uma composição fresca e especiada. Lavanda, gerânio e resinas se encontram com vetiver e patchouli, sobre ambroxan, cedro e ládano.', 'Bergamota da Calábria e pimenta-preta', 'Lavanda, pimenta rosa, vetiver, patchouli, gerânio e elemi', 'Ambroxan, cedro e ládano'],
];

export const suppliedProductCodes = [
  ...fragrances.flatMap(([codes]) => codes.split(' ')),
  'BE-SOFH', 'BE-OX3', 'BE-SHII', 'BE-HID-SB', 'BE-HID-VG', 'BE-LUSH', 'BE-FRESH', 'BE-PURE',
  'CAP-AMP-SF', 'CAP-SH-OK', 'CAP-MAS-OK', 'CAP-O-ACAI', 'CAP-O-CREAM', 'CAP-FOR-MEN', 'CAP-TON', 'CAP-SH-BL', 'CAP-MAS-BL',
  'CAP-SH-MC', 'CAP-MAS-MC', 'CAP-KIDS-SH', 'CAP-KIDS-CO', 'CAP-KIDS-LE',
  'NUT-XBOOST', 'NUT-NXCAP', 'NUT-TRIMAG', 'NUT-FLEX-CX', 'NUT-FLEX-UN',
];

export function applySuppliedContent(records: Record<string, Research>) {
  for (const [codes, name, family, description, top, heart, base] of fragrances) {
    for (const code of codes.split(' ')) {
      const item = records[code];
      item.summary = `${name} é uma fragrância Ozonteck da família ${family.toLocaleLowerCase('pt-BR')}. ${description}`;
      item.details = [{ label: 'Família olfativa', value: family }];
      item.sections = [
        { title: 'Família olfativa', items: [family] },
        { title: 'Notas de saída', items: [top] },
        { title: 'Notas de coração', items: [heart] },
        { title: 'Notas de fundo', items: [base] },
        { title: 'Sobre a apresentação', items: ['Consulte o nome e a imagem desta página para identificar o volume cadastrado. As versões permanecem separadas no catálogo.', 'Notas olfativas descrevem o aroma; não correspondem à composição de ingredientes nem indicam concentração ou tempo de fixação.'] },
      ];
      item.missing = ['Lista de ingredientes, concentração e instruções do rótulo da apresentação'];
      item.note = 'Pirâmide transcrita da lista de notas fornecida pela marca. Não foram acrescentadas notas de perfumes de outras marcas, promessas de duração ou equivalência de fórmulas entre volumes.';
    }
  }

  // Reconcile contradictory prose against the explicit pyramid without inventing a resolution.
  for (const code of ['PERF-CAPA', 'PERF-SENTIMENTO', 'P100-SENT', 'PERF-303-M', 'PERF-303-VIP', 'PERF-303-W', 'PERF-ANGE', 'PERF-SOUL']) {
    records[code].note += ' A lista de notas e o parágrafo descritivo da fonte divergem. Foi mantida a lista explícita, sem unir as versões; a divergência ainda depende de confirmação do fabricante.';
  }

  function merge(code: string, summary: string | undefined, additions: NonNullable<Research['sections']>, replaceTitles: string[] = []) {
    const item = records[code];
    if (summary) item.summary = summary;
    item.sections = [...(item.sections || []).filter((section) => !replaceTitles.includes(section.title) && !additions.some((added) => added.title === section.title)), ...additions];
  }
  merge('BE-SOFH', undefined, [
    { title: 'O que é a ozonização', items: ['A marca descreve um processo de ozonização do óleo que forma compostos como ozonídeos e peróxidos. Essa descrição do processo não comprova eficácia no tratamento de doenças.', 'Sua aplicação aqui é o cuidado cosmético externo: hidratação, maciez e conforto da pele ressecada.'] },
    { title: 'Cuidados', items: ['Uso externo. Não ingerir e evitar contato com os olhos; se ocorrer, enxaguar com água.', 'Conservar em local arejado, longe de calor excessivo e luz solar, fora do alcance de crianças e animais domésticos.', 'Em caso de ingestão acidental, procurar assistência médica e levar a embalagem. Não é medicamento.'] },
  ]);
  merge('BE-OX3', undefined, [{ title: 'Limpeza e acabamento', items: ['Sabonete para mãos e corpo, com textura leve e proposta de limpeza suave associada à hidratação.', 'O extrato de bardana integra a formulação descrita; as micropartículas de mica natural conferem o aspecto perolado. Esses destaques não substituem a lista completa de ingredientes.'] }], ['Aplicação e textura']);
  merge('BE-SHII', 'Life Shii é um gel ozonizado de massagem corporal, de textura leve e deslizante, com sensação refrescante. Combina componentes vegetais, mentol e cânfora em uma proposta de cuidado e conforto durante a massagem.', [
    { title: 'Componentes destacados', items: ['Arnica, pimenta, gengibre, camélia, alecrim, salicilato de metila, cânfora e mentol, conforme o texto da marca. A composição integral e as concentrações não foram fornecidas.'] },
    { title: 'Massagem corporal', items: ['A textura favorece o deslizamento sobre a pele e uma sensação de frescor, com proposta emoliente.', 'Não substitui avaliação ou tratamento de dor, inflamações ou problemas circulatórios.'] },
    { title: 'Cuidados', items: ['Uso externo. Não utilizar durante a gravidez, em menores de 7 anos ou sobre pele irritada ou lesionada.', 'Evitar os olhos e interromper o uso em caso de reação. Manter fechado, em local fresco e seco, protegido do calor e da luz, fora do alcance de crianças.', 'Em caso de ingestão acidental, procurar assistência médica com a embalagem.'] },
  ], ['Ativos', 'Ativos e indicação', 'Ativos destacados', 'Experiência de uso', 'Cuidados importantes']);
  merge('BE-LUSH', 'Oxylush é um esfoliante facial voltado à remoção de células mortas e impurezas superficiais. A proposta é deixar a textura da pele mais uniforme ao toque e preparar a rotina de cuidados, sem substituir a limpeza e a hidratação adequadas.', [
    { title: 'Finalidade', items: ['Esfoliação da superfície da pele e cuidado da textura, conforme a apresentação da marca.', 'Os agentes esfoliantes, a frequência e a quantidade de aplicação não constam no material fornecido; confirme essas informações no rótulo antes de usar.'] },
  ]);
  merge('BE-FRESH', 'Ozon Fresh é um creme dental ozonizado para a rotina de higiene bucal. Deve ser utilizado na escovação conforme as orientações da embalagem e do dentista; a descrição recebida não informa o teor de flúor nem a composição integral.', [
    { title: 'Como usar', items: ['O fabricante orienta escovar os dentes após as refeições, três vezes ao dia, ou conforme orientação do dentista, e enxaguar.'] },
    { title: 'Cuidados', items: ['Não ingerir. A fonte informa que não deve ser utilizado por menores de 6 anos.', 'Manter fora do alcance de crianças, evitar os olhos e enxaguar com água em caso de contato.', 'Interromper o uso em caso de reação e procurar orientação do dentista.'] },
  ]);
  merge('BE-PURE', 'Pure Hot é um gel corporal de massagem à base de água, com proposta de sensação de aquecimento. A marca descreve polímeros condicionantes, fácil deslizamento e absorção rápida, associados à hidratação e ao toque macio da pele.', [
    { title: 'Textura e componentes', items: ['Base aquosa, polímeros condicionantes e formulação apresentada como ozonizada. O material não identifica todos os ingredientes.', 'A sensação de aquecimento é uma característica sensorial; não representa indicação de tratamento.'] },
    { title: 'Cuidados', items: ['Uso externo. Não ingerir, não aplicar sobre pele lesionada e interromper o uso se houver reação.', 'Evitar os olhos; em caso de contato, enxaguar. Conservar à temperatura ambiente, protegido da luz e do calor, fora do alcance de crianças.', 'Não utilizar se a embalagem estiver violada.'] },
  ]);
  merge('CAP-SH-OK', 'Shampoo Ozon-Kesen é um shampoo pós-química para cabelos que passaram por coloração, alisamento ou relaxamento, e para fios ressecados. A fórmula descrita pela marca reúne queratina e manteiga de cupuaçu em uma proposta de limpeza suave e cuidado da fibra.', [
    { title: 'Ativos destacados', items: ['Queratina e manteiga de cupuaçu, em uma formulação apresentada como ozonizada. Não é a composição integral.'] },
    { title: 'Como usar', items: ['Aplicar nos cabelos molhados, massagear suavemente o couro cabeludo e distribuir pelos fios. Enxaguar completamente.', 'A marca propõe continuar o cuidado com a máscara da linha. Confira as instruções da apresentação adquirida.'] },
    { title: 'Cuidados', items: ['Uso externo. Evitar os olhos, manter fora do alcance de crianças e conservar em local fresco e seco, protegido da luz solar.', 'O fabricante recomenda teste de sensibilidade antes do uso.'] },
  ], ['Indicação e limpeza']);
  merge('CAP-SH-MC', 'Shampoo Master Curls é indicado para cabelos ondulados, cacheados e crespos. A descrição fornecida destaca óleos de argan e macadâmia, combinando limpeza com uma proposta de hidratação, maciez e facilidade para pentear.', [
    { title: 'Ativos destacados', items: ['Óleos de argan e macadâmia, segundo o material da marca. A composição completa deve ser conferida no rótulo.'] },
    { title: 'Como usar', items: ['Aplicar nos cabelos úmidos, massagear até formar espuma e enxaguar. Repetir se necessário, conforme a orientação publicada.'] },
    { title: 'Cuidados', items: ['Uso externo. Evitar contato com os olhos, manter fora do alcance de crianças e conservar em local fresco, seco e protegido da luz.', 'Confira a versão do rótulo: a pesquisa anterior descrevia Master Curls Pro, enquanto o texto fornecido identifica Master Curls. Não foi presumida igualdade de formulação.'] },
  ], ['Curvaturas e função']);
  merge('CAP-SH-BL', undefined, [
    { title: 'Ativos e indicação', items: ['Extratos de violeta e camomila e agentes matizadores, conforme o material fornecido.', 'Para cabelos loiros, descoloridos e grisalhos: limpeza e neutralização cosmética de tons amarelados e alaranjados.'] },
    { title: 'Limpeza e matização', items: ['Proposta de remover resíduos com suavidade, favorecer a maciez e facilitar o desembaraço.', 'A fonte não informa o tempo de contato: utilize as instruções do shampoo adquirido, não as de uma máscara matizadora.'] },
  ]);
  merge('CAP-O-ACAI', 'Açaí Fusion é um óleo finalizador capilar com açaí e silicones, apresentado pela marca para dar brilho, maciez e controlar o frizz. Forma um acabamento de sensação leve, voltado também à aparência das pontas e à facilidade para pentear.', [
    { title: 'Ativos e acabamento', items: ['Açaí e silicones voláteis de diferentes pesos moleculares são citados no texto da marca; não constituem a lista integral de ingredientes.', 'A proposta inclui alinhamento dos fios e redução do aspecto de pontas duplas. Não repara permanentemente uma ponta já dividida.'] },
    { title: 'Aplicação e proteção', items: ['A marca indica diferentes tipos de cabelo e menciona uso antes da escova ou do modelador. Ajuste a quantidade e a frequência às instruções da embalagem.', 'A fonte declara proteção térmica e frente à radiação UV, sem informar temperatura-limite ou fator de proteção. Não foram atribuídos valores.'] },
  ], ['Textura e acabamento']);
  merge('CAP-O-CREAM', 'Ozon Cream é um fluido capilar multifuncional 20 em 1 com extrato de baobá, silicones e estrutura de gel lamelar descritos pela marca. Reúne condicionamento, maciez e alinhamento em uma proposta de cuidado para diferentes tipos de cabelo, especialmente os lisos.', [
    { title: 'Ativos e textura', items: ['Extrato de baobá, silicones e gel lamelar são os destaques do material. A lista INCI completa e as concentrações não foram disponibilizadas.'] },
    { title: 'Benefícios cosméticos', items: ['Hidratação, nutrição e condicionamento; maciez, brilho e facilidade para pentear.', 'Controle do frizz e do volume, alinhamento, melhora do aspecto das pontas e cuidado da elasticidade e resistência dos fios.', 'A marca cita proteção térmica, UV e frente à umidade, sem informar temperatura máxima ou fator de proteção.'] },
    { title: 'Antes de aplicar', items: ['Consulte no rótulo a quantidade e a forma de aplicação da sua versão. O nome 20 em 1 não permite deduzir ingredientes ou instruções ausentes.'] },
  ], ['Cuidado multifuncional']);
  merge('CAP-FOR-MEN', undefined, [
    { title: 'Ativos destacados', items: ['Mentol e óleo de macadâmia, conforme a descrição recebida. Matrix 3D é o nome comercial de uma tecnologia citada pela marca, não uma lista de ingredientes.'] },
    { title: 'Rotina de cuidado', items: ['Limpeza e condicionamento em um só produto, com proposta de frescor, brilho e maciez.', 'A marca descreve uso diário e informa que cabelos curtos e saudáveis podem dispensar condicionador. Confira as necessidades dos fios e as instruções da embalagem.', 'Não foi adotada promessa de tratar dermatite, psoríase ou outras condições do couro cabeludo.'] },
  ]);
  merge('CAP-TON', undefined, [{ title: 'Apresentação e indicação', items: ['Aplicação em spray, conforme o material da marca, para cuidado de diferentes tipos de cabelo, especialmente fios fragilizados e ressecados.', 'A proposta cosmética combina frescor e cuidado da resistência à quebra. Frequência, quantidade e lista integral de componentes não foram informadas.'] }]);
  merge('CAP-KIDS-SH', undefined, [{ title: 'Extratos destacados', items: ['Frutas vermelhas e banana são os extratos apresentados para a linha Kids Ozon Splash.', 'A descrição de baixa irritabilidade não garante ausência de alergias. Confira a faixa etária e as instruções específicas da embalagem.'] }]);
  merge('NUT-NXCAP', undefined, [{ title: 'Informações da marca', items: ['O texto oficial complementa a frente do frasco ao descrever um mix de óleos associado à vitamina E. Não identifica todos os óleos nem suas quantidades.', 'A vitamina E integra a proposta antioxidante do suplemento. Isso não representa prevenção ou tratamento de doenças.'] }]);
  merge('NUT-XBOOST', undefined, [{ title: 'Qual apresentação é esta?', items: ['Esta ficha é do suplemento em cápsulas cadastrado na loja. O energético pronto para beber de 269 ml citado no material é outro produto e não foi combinado com esta fórmula.', 'A descrição cita cafeína, taurina e arginina. A quantidade diária e o teor de cafeína devem ser conferidos no rótulo; não foi inferida dose pré-treino.'] }]);
  merge('NUT-TRIMAG', undefined, [{ title: 'Proposta nutricional', items: ['O material apresenta o magnésio para suporte às funções musculares e ao metabolismo energético. O rótulo fotografado detalha as três formas de magnésio e o extrato de cúrcuma.', 'Não foram adotadas alegações de tratamento de ansiedade, depressão, arritmias ou doenças articulares. A composição não substitui orientação individual nem permite deduzir a dose.'] }]);
  for (const code of ['NUT-FLEX-CX', 'NUT-FLEX-UN']) {
    records[code].note += ' O material recebido e a página oficial de Ozon Flex descrevem Amyno Ozon. Essa descrição não foi transferida: foram preservadas as informações legíveis da embalagem de Ozon Flex.';
  }
  for (const code of suppliedProductCodes) {
    records[code].editorialReviewed = true;
    records[code].checkedAt = '2026-09-28';
  }
  records['BE-SOFH'].sections = records['BE-SOFH'].sections?.filter(section => section.title !== 'Base e processo');
  records['BE-LUSH'].sections = records['BE-LUSH'].sections?.filter(section => section.title !== 'Finalidade');
  records['BE-PURE'].sections = records['BE-PURE'].sections?.filter(section => section.title !== 'Fórmula e textura');
  for (const code of ['BE-FRESH', 'CAP-SH-OK', 'CAP-MAS-OK', 'CAP-SH-MC', 'CAP-MAS-MC']) {
    records[code].missing = ['Composição integral e correspondência das instruções com o rótulo do lote adquirido'];
  }
}
