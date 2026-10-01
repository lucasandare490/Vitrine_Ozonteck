import { productResearch, type Research } from './product-research.ts';
import { isRetiredProduct } from './catalog-availability.ts';
import { perfumePairs } from './product-content-second-review.ts';
import { getProductSpecifications, type Specification } from './product-specs.ts';
import documentPhysicalSpecs from './product-document-physical-specs.json' with { type: 'json' };

export type PublicProductContent = Pick<Research, 'summary' | 'sections' | 'line'>;
type Section = NonNullable<Research['sections']>[number];
const section = (title: string, ...items: string[]): Section => ({ title, items });
const actives = (...items: string[]) => section('Ativos destacados', ...items);
const usageSection = (...items: string[]) => section('Modo de uso', ...items);
const care = (...items: string[]) => section('Precauções', ...items);
const presentation = (value: string) => section('Apresentação', value);
const hairCare = care('Uso externo. Evite contato com os olhos e mantenha fora do alcance de crianças.', 'Faça um teste de sensibilidade antes do primeiro uso. Conserve em local fresco e seco, protegido da luz solar.');

// Public copy is curated separately; the full research and source text remain intact.
const reviewed: Record<string, PublicProductContent> = {};
function set(code: string, summary: string, ...sections: Section[]) { reviewed[code] = { summary, sections, line: productResearch[code]?.line }; }

set('BE-SOFH', 'Sofh é um óleo de girassol ozonizado para o cuidado externo da pele. Sua textura oleosa ajuda a manter a maciez e a hidratação, especialmente em áreas ressecadas. O frasco conta-gotas permite distribuir o produto durante a aplicação.',
  actives('Óleo de girassol ozonizado.'),
  care('Uso externo. Não é medicamento. Evite contato com os olhos; em caso de contato, lave com água em abundância.', 'Conserve em local arejado, longe da luz e do calor excessivo. Mantenha fora do alcance de crianças e animais domésticos.', 'Em caso de ingestão acidental, procure assistência médica levando a embalagem.'));
set('BE-OX3', 'OX3 é um sabonete ozonizado para a higiene das mãos e do corpo. Combina limpeza suave com hidratação e uma sensação refrescante durante o banho. A textura leve e o aspecto perolado complementam o cuidado diário da pele.',
  actives('Extrato de bardana e micropartículas de mica natural.', 'Vitaminas A, B, C e E e ácidos graxos essenciais.'),
  section('Características', 'Limpeza das mãos e do corpo.', 'Textura leve, acabamento perolado e sensação de frescor.'));
set('BE-LUSH', 'Oxylush é um esfoliante facial ozonizado que remove células mortas e impurezas superficiais. A esfoliação favorece uma textura mais suave e uniforme ao toque, preparando a pele para as próximas etapas da rotina de cuidados.', section('Aplicação', 'Esfoliação facial.'));
set('BE-SHII', 'Life Shii é um gel ozonizado de massagem corporal com sensação refrescante. A textura leve facilita o deslizamento das mãos e os movimentos de massagem, combinando conforto, emoliência e cuidado da pele.',
  actives('Arnica, pimenta, gengibre, camélia, alecrim, salicilato de metila, cânfora e mentol.'),
  care('Uso externo. Não utilizar durante a gravidez, em menores de 7 anos ou sobre pele irritada ou lesionada.', 'Faça um teste de sensibilidade antes do primeiro uso. Evite contato com os olhos; se ocorrer, lave com água em abundância.', 'Suspenda o uso em caso de irritação ou sinais de intoxicação e procure orientação médica. Não ingerir; em caso de ingestão, procure um médico levando a embalagem.', 'Mantenha fechado, fora do alcance de crianças, em local fresco e seco, protegido da luz e do calor.'));
set('BE-PURE', 'Pure Hot é um gel de massagem corporal à base de água com sensação de aquecimento. Sua textura suave e deslizante facilita a massagem e combina absorção rápida com hidratação e toque macio, sem acabamento pegajoso.',
  actives('Polímeros condicionantes.'), section('Textura', 'Gel de base aquosa.'),
  care('Uso externo. Não ingerir nem aplicar sobre pele irritada ou lesionada.', 'Em caso de irritação ou reação indesejável, suspenda o uso e procure um médico.', 'Evite os olhos; em caso de contato, enxágue abundantemente.', 'Mantenha fora do alcance de crianças e conserve em temperatura ambiente, longe da luz e do calor. Não utilize se a embalagem estiver violada.'));
set('BE-FRESH', 'Ozon Fresh é um creme dental ozonizado para a rotina de higiene bucal. Sua aplicação na escovação auxilia a limpeza dos dentes e gengivas.',
  usageSection('Escove os dentes após as refeições, três vezes ao dia, ou conforme orientação do dentista. Enxágue após a escovação.'),
  care('Não ingerir. Não utilizar em crianças menores de 6 anos. Mantenha fora do alcance de crianças.', 'Evite contato com os olhos; em caso de contato, enxágue abundantemente.', 'Em caso de reação indesejável, suspenda o uso e procure um dentista.'));
set('BE-HID-SB', 'Hidratante Speed Black ozonizado para o cuidado corporal, na apresentação de 120 g.', presentation('120 g'));
set('BE-HID-VG', 'Hidratante VG Sexy ozonizado para o cuidado corporal, na apresentação de 120 g.', presentation('120 g'));
set('BE-HAY', 'Haydek é um creme ozonizado para os pés, com textura leve e rápida absorção. O cuidado combina hidratação, maciez e controle do mau odor, ajudando a reduzir o aspecto ressecado e áspero da pele.',
  presentation('120 g, com válvula dosadora'), actives('Manteiga de karité.'), section('Tecnologia', 'Matrix 3D.'));
set('BE-TRIX', 'Ozon Trix é um desodorante ozonizado em spray para o cuidado das axilas. Combina controle do odor e hidratação em uma textura leve, sem alumínio. O acabamento invisible evita resíduos brancos na pele e nos tecidos.',
  presentation('Spray de 30 ml'), actives('Ácido kójico, ácido hialurônico e extrato de alcaçuz.'), section('Tecnologia', 'Matrix 3D.', 'Acabamento invisible.'));
set('BE-SER-LUM', 'Lumino3 é um sérum facial ozonizado com vitamina C e ácido hialurônico. Desenvolvido para todos os tipos de pele, reúne hidratação e cuidado da aparência da pele, favorecendo maciez e um aspecto luminoso.', actives('Vitamina C e ácido hialurônico.'));

set('CAP-AMP-SF', 'Soft Hair é uma ampola de tratamento capilar para fios danificados, ressecados ou opacos. A combinação de nanoaminoácidos e queratina de baixo peso molecular reúne hidratação, nutrição e reconstrução cosmética. O cuidado melhora a maciez, o brilho e a maleabilidade, reduzindo o aspecto de frizz e porosidade.', actives('Nanoaminoácidos e queratina de baixo peso molecular.'), section('Indicação', 'Todos os tipos de cabelo, especialmente os danificados.'));
set('CAP-SH-OK', 'O Shampoo Ozon-Kesen limpa suavemente cabelos submetidos a coloração, alisamento ou relaxamento, além de fios ressecados. Queratina e manteiga de cupuaçu combinam cuidado da fibra, hidratação e maciez na rotina pós-química.',
  actives('Queratina e manteiga de cupuaçu ozonizada.'), usageSection('Aplique nos cabelos molhados, massageie suavemente o couro cabeludo e distribua pelos fios. Enxágue completamente.', 'Continue o cuidado com a Máscara Ozon-Kesen.'), hairCare);
set('CAP-MAS-OK', 'A Máscara Ozon-Kesen é um tratamento pós-química para cabelos ressecados e sensibilizados por coloração, alisamento ou relaxamento. Manteiga de cupuaçu e queratina combinam retenção de umidade e reconstrução cosmética, deixando os fios macios, maleáveis e com brilho.',
  actives('Manteiga de cupuaçu e queratina.'), usageSection('Após lavar, aplique mecha a mecha por todo o comprimento e massageie suavemente.', 'Deixe agir de 20 a 40 minutos e enxágue bem.'), hairCare);
set('CAP-CO-KES', 'O Condicionador Ozon-Kesen cuida de cabelos pós-química e de fios ressecados pela exposição ao sol ou pelo uso de chapinha. Manteiga de cupuaçu ozonizada e queratina condicionam os fios e ajudam a preservar a umidade, proporcionando sedosidade, maciez e brilho.',
  actives('Manteiga de cupuaçu ozonizada e queratina.'), usageSection('Após o Shampoo e a Máscara Ozon-Kesen, distribua por todo o comprimento dos fios.', 'Deixe agir por alguns minutos e enxágue abundantemente.'), hairCare);
set('CAP-SH-MC', 'O Shampoo Master Curls cuida de cabelos ondulados, cacheados e crespos. A combinação de óleos de argan e macadâmia associa limpeza, hidratação e nutrição, favorecendo maciez e facilidade para modelar os cachos.',
  actives('Óleos de argan e macadâmia.', 'Vitaminas A, C, D, E e F e ômegas 3 e 6.'), usageSection('Aplique nos cabelos úmidos, massageie suavemente até formar espuma e enxágue. Repita se necessário.'), hairCare);
set('CAP-MAS-MC', 'A Máscara Master Curls é um tratamento para hidratação e condicionamento de cabelos ondulados, cacheados e crespos. Sua proposta combina maciez, brilho e controle do frizz para favorecer cachos definidos e maleáveis.');
set('CAP-AT-MC', 'O Ativador Master Curls finaliza os cabelos cacheados, combinando hidratação e definição. A aplicação mecha a mecha valoriza o formato dos cachos e complementa a rotina com o shampoo e a máscara da linha.',
  usageSection('Após lavar com o Shampoo Master Curls, aplique a máscara da linha, respeite sua pausa e enxágue.', 'Distribua uma pequena quantidade do ativador mecha a mecha por toda a extensão dos fios.', 'Finalize como desejar, com secagem natural ou outro método de secagem.'), hairCare);
set('CAP-SH-BL', 'O Shampoo Ozon Blond limpa suavemente cabelos loiros, descoloridos e grisalhos. Os agentes matizadores ajudam a neutralizar tons amarelados e alaranjados, enquanto os extratos de violeta e camomila complementam o cuidado com maciez e brilho.', actives('Extratos de violeta e camomila e agentes matizadores.'), section('Características', 'Limpeza e matização dos fios claros.', 'Fórmula livre de parabenos.'));
set('CAP-MAS-BL', 'A Máscara Ozon Blond combina matização e condicionamento para cabelos loiros, descoloridos e grisalhos. Ajuda a neutralizar tons amarelados e alaranjados e a restaurar a umidade dos fios, melhorando a maciez, a maleabilidade e a facilidade para pentear.', actives('Extratos de violeta e camomila e agentes matizadores.'), section('Características', 'Condicionamento e cuidado de fios descoloridos.', 'Fórmula livre de parabenos.'));
set('CAP-KIDS-SH', 'O Shampoo Kids Ozon Splash oferece limpeza suave para todos os tipos de cabelos infantis. Extratos de frutas vermelhas e banana compõem uma fórmula voltada à hidratação equilibrada, ao brilho e à maciez, tornando os fios mais fáceis de cuidar na rotina diária.', actives('Extratos de frutas vermelhas e banana.'), section('Características', 'Uso diário.'));
set('CAP-KIDS-CO', 'O Condicionador Kids Ozon Splash cuida dos cabelos infantis após a limpeza. Sua textura leve e hidratante ajuda a deixar os fios macios, sedosos e maleáveis, com extratos de frutas vermelhas e banana para complementar a rotina diária.', actives('Extratos de frutas vermelhas e banana.'), section('Características', 'Uso diário.'));
set('CAP-KIDS-LE', 'O Leave-in Kids Ozon Splash é um finalizador infantil de textura leve para pentear, desembaraçar e ativar os cachos. Ajuda a deixar os fios disciplinados, macios, brilhantes e perfumados, com extratos de frutas vermelhas e banana.', actives('Extratos de frutas vermelhas e banana.'), section('Características', 'Uso diário a partir de 3 anos.', 'Creme para pentear e ativador de cachos.'));
set('CAP-O-ACAI', 'Açaí Fusion é um óleo ozonizado finalizador e reparador de pontas para todos os tipos de cabelo. A fórmula com açaí e silicones forma um acabamento leve, sem sensação gordurosa, que reduz o frizz e a aspereza. Proporciona maciez, brilho e alinhamento, com proteção térmica e UV para os fios.',
  actives('Açaí e silicones voláteis de diferentes pesos moleculares.'), usageSection('Uso diário, de duas a três vezes ao dia, de acordo com o tipo de cabelo.', 'Pode ser aplicado antes da escova ou do modelador.'));
set('CAP-O-CREAM', 'Ozon Cream é um fluido capilar ozonizado multifuncional 20 em 1 que combina extrato de baobá, silicones e gel lamelar. Reúne hidratação, nutrição e condicionamento para diferentes tipos de cabelo, especialmente os lisos. Seu acabamento favorece maciez, brilho e alinhamento, sem abrir mão da facilidade para pentear.',
  actives('Extrato de baobá e silicones.'), section('Tecnologia', 'Sistema de gel lamelar.'), section('Benefícios cosméticos', 'Controle do frizz e do volume e proteção contra a umidade.', 'Proteção térmica e UV.'));
set('CAP-FOR-MEN', 'Ozon For Men é um shampoo ozonizado 2 em 1 para limpeza e condicionamento diário. Mentol e óleo de macadâmia combinam sensação refrescante, maciez e brilho. A fórmula cuida da oleosidade e oferece praticidade para cabelos curtos, reunindo duas etapas em um só produto.',
  actives('Mentol, óleo de macadâmia, biotina e ômegas 3, 6, 7 e 9.'), section('Tecnologia', 'Tecnologia europeia Matrix 3D.'), section('Características', 'Uso diário. Em cabelos curtos e saudáveis, pode dispensar o condicionador.'));
set('CAP-TON', 'Revita Tonic é um tônico capilar ozonizado em spray com mentol e blends vegetais. Combina sensação refrescante e cuidado da resistência dos fios, com proposta de redução da quebra. É indicado para diferentes tipos de cabelo, especialmente os fragilizados e ressecados.', actives('Mentol e blends vegetais.'));
set('CAP-SH-MEL', 'O Shampoo Mel & Ozônio limpa suavemente cabelos fragilizados e opacos. Extrato de mel, geleia real, óleo de girassol ozonizado e vitaminas A, D e E combinam nutrição e cuidado dos fios e do couro cabeludo, proporcionando maciez e brilho.', presentation('Frasco de 300 ml'), actives('Extrato de mel, geleia real, óleo de girassol ozonizado e vitaminas A, D e E.'), usageSection('Aplique nos cabelos úmidos, massageie suavemente até formar espuma e enxágue bem. Repita se necessário.'), care('Uso externo. Mantenha em local fresco, arejado e protegido da luz, fora do alcance de crianças.', 'Evite os olhos; em caso de contato, enxágue com água. Interrompa o uso em caso de irritação e procure orientação médica.'));
set('CAP-MAS-MEL', 'A Máscara Mel & Ozônio nutre e condiciona os cabelos, favorecendo maciez, maleabilidade e brilho. A combinação de extrato de mel, geleia real e óleo de girassol ozonizado cuida da fibra capilar e ajuda a reduzir o aspecto áspero dos fios.', actives('Extrato de mel, geleia real e óleo de girassol ozonizado.'), section('Indicação', 'Cabelos oleosos e muito oleosos.'));
set('CAP-CO-MEL', 'O Condicionador Mel & Ozônio cuida de cabelos fragilizados e sem vida, combinando hidratação e nutrição. Óleo de girassol ozonizado, extrato de mel, geleia real e vitaminas A, D e E favorecem maciez, sedosidade e brilho.', actives('Óleo de girassol ozonizado, extrato de mel, geleia real e vitaminas A, D e E.'));
set('CAP-PRO-KES', 'Pro Kesen é uma máscara capilar reestruturadora para redução de volume e controle do frizz. A combinação de ácidos hialurônico e lático, óleos e silicone cuida do alinhamento e da aparência dos fios danificados. O tratamento favorece brilho, maleabilidade e toque sedoso, ajudando a preservar a umidade durante o alinhamento.', actives('Ácidos hialurônico e lático.'),
  care(...productResearch['CAP-PRO-KES'].sections!.find(s => s.title === 'Precauções')!.items));

set('PRO-AMR', 'AMR (Amino Matrix Reset) é uma máscara de cuidado intensivo da linha Ozone Hair System. Desenvolvida para fios sensibilizados por química, descoloração e processos de transformação, combina aminoácidos e WO3 Quantic Complex para melhorar o corpo, a disciplina e a aparência de resistência dos cabelos.', actives('Blend de aminoácidos.'), section('Tecnologia', 'WO3 Quantic Complex.'));
set('PRO-CIF', 'CIF (Carbon Ion Forge) é uma máscara da linha Ozone Hair System para cabelos fragilizados, afinados e danificados por química. Proteínas, peptídeos e WO3 Quantic Complex contribuem para o condicionamento e o alinhamento, favorecendo a aparência de força e resistência da fibra.', actives('Complexo de proteínas e peptídeos.'), section('Tecnologia', 'WO3 Quantic Complex.'));
set('PRO-HMS', 'HMS (Hydro Mesh Sync) é a máscara de hidratação da linha Ozone Hair System. Agentes umectantes e WO3 Quantic Complex combinam hidratação e condicionamento para cabelos secos, opacos, cacheados e crespos, com resultado de toque sedoso, maciez e brilho.', actives('Agentes umectantes.'), section('Tecnologia', 'WO3 Quantic Complex.'));
set('PRO-LPC', 'LPC (Lipid Phase Control) é uma máscara de nutrição da linha Ozone Hair System para cabelos com frizz, pontas secas e aspecto áspero. O blend de lipídios e o WO3 Quantic Complex ajudam a condicionar, alinhar e melhorar a disciplina, oferecendo nutrição com acabamento leve.', actives('Blend de lipídios nutritivos.'), section('Tecnologia', 'WO3 Quantic Complex.'));
set('PRO-DEEP', 'Deep Cleanse é um shampoo técnico da linha Ozone Hair System para a preparação dos cabelos antes dos tratamentos. Sua limpeza intensa remove resíduos e impurezas acumuladas, preparando a fibra para as próximas etapas de cuidado com a tecnologia WO3 Quantic Complex.', section('Tecnologia', 'WO3 Quantic Complex.'));
set('PRO-SOFT', 'Soft Cleanse é um shampoo da linha Ozone Hair System para limpeza suave e frequente de cabelos quimicamente tratados, cacheados e crespos. Remove a sujeira cotidiana e o excesso de oleosidade da raiz, respeitando a camada lipídica dos fios e favorecendo a manutenção da cor, do brilho e da maciez.', section('Tecnologia', 'WO3 Quantic Complex.'));

const supplements: [string, string, string, string][] = [
  ['NUT-NXCAP', 'NX Cap Ozon reúne um mix de óleos e vitamina E em cápsulas softgel.', 'Mix de óleos e vitamina E.', '60 cápsulas softgel de 700 mg.'],
  ['NUT-OMEGA', 'Ômega 3 é um suplemento alimentar à base de óleo de peixe, fonte dos ácidos graxos EPA e DHA. A apresentação em cápsulas softgel reúne o conteúdo em unidades individuais.', 'Óleo de peixe, com EPA e DHA.', '60 cápsulas softgel de 1.400 mg.'],
  ['NUT-XBOOST', 'Xbooster é um suplemento alimentar que combina cafeína, taurina e arginina em cápsulas.', 'Cafeína, taurina e arginina.', '60 cápsulas de 590 mg.'],
  ['NUT-TRIMAG', 'Power Tri-Magnésio reúne três formas de magnésio e extrato de cúrcuma em um suplemento alimentar em cápsulas.', 'Magnésio quelato, dimagnésio malato, taurato de magnésio e extrato de cúrcuma.', '60 cápsulas de 590 mg.'],
  ['NUT-CREAT-CX', 'Ozon Creat é um suplemento alimentar em pó com creatina e glutamina, acondicionado em sticks individuais. A caixa reúne 30 unidades para organizar o preparo de cada porção.', 'Creatina e glutamina.', 'Caixa com 30 sticks de 8 g; peso líquido de 240 g.'],
  ['NUT-CREAT-UN', 'Ozon Creat é um suplemento alimentar em pó com creatina na apresentação individual. O stick contém 8 g de produto.', 'Creatina.', 'Um stick de 8 g de produto.'],
  ['NUT-CREAT-MO-CX', 'Ozon Creat Morango é um suplemento alimentar em pó com creatina e sabor morango. A caixa reúne 30 sachês individuais, com 8,5 g de produto em cada unidade.', 'Creatina. Contém aromatizante sintético idêntico ao natural.', 'Caixa com 30 sachês de 8,5 g; peso líquido de 255 g.'],
  ['NUT-CREAT-MO-UN', 'Ozon Creat Morango é a apresentação individual do suplemento alimentar em pó sabor morango. Cada sachê contém 8,5 g de produto.', 'Aromatizante sintético idêntico ao natural.', 'Um sachê de 8,5 g de produto.'],
  ['NUT-BORYS', 'Boryslim é um suplemento alimentar com cromo em cápsulas. A apresentação reúne 60 cápsulas de 500 mg.', 'Cromo.', '60 cápsulas de 500 mg.'],
  ['NUT-DREAM', 'Dream Bliss combina melatonina e coenzima Q10 em cápsulas softgel. Cada frasco reúne 30 cápsulas, com 100 mg de coenzima Q10 por cápsula.', 'Melatonina e coenzima Q10.', '30 cápsulas softgel de 700 mg.'],
  ['NUT-K2D3', 'K2MK7 e D3 é um suplemento alimentar que associa vitamina K2 na forma MK-7 e vitamina D3 em cápsulas softgel.', 'Vitamina K2 (MK-7) e vitamina D3.', '60 cápsulas softgel de 700 mg.'],
  ['NUT-LUMI', 'Luminous Vita é um suplemento alimentar que combina vitaminas A, C e E em cápsulas. O frasco reúne 60 unidades.', 'Vitaminas A, C e E.', '60 cápsulas de 590 mg.'],
  ['NUT-LEV-UN', 'Ozon Lev é um suplemento alimentar em pó com sabor de abacaxi e hortelã. A combinação reúne polidextrose, vegetais em pó, cúrcuma e gengibre na apresentação em sachê individual.', 'Polidextrose, couve em pó, espinafre, espirulina, cúrcuma e gengibre. Contém aromatizante sintético idêntico ao natural.', 'Um sachê de 8 g.'],
  ['NUT-VIRT', 'Virtuous Caps é um suplemento alimentar com biotina, silício e zinco. A apresentação contém 60 cápsulas, com conteúdo líquido de 42 g.', 'Biotina, silício e zinco. Colorido artificialmente.', '60 cápsulas; conteúdo líquido de 42 g.'],
  ['NUT-VITA-OZ', 'Vita Ozon Plus é um suplemento polivitamínico com ômega 3 em cápsulas. Sua apresentação reúne 60 unidades.', 'Ômega 3, com EPA e DHA.', '60 cápsulas de 700 mg.'],
  ['NUT-FLEX-CX', 'Ozon Flex é um suplemento alimentar em pó sabor pêssego. Combina colágeno tipo II não desnaturado, ácido hialurônico e vitaminas em sachês individuais. A caixa reúne 30 sachês.', 'Colágeno tipo II não desnaturado, ácido hialurônico e vitaminas C, D, E e K2.', 'Caixa com 30 sachês de 8 g; peso líquido de 240 g.'],
  ['NUT-FLEX-UN', 'Ozon Flex é um suplemento alimentar em pó sabor pêssego, na apresentação individual. Reúne colágeno tipo II, ácido hialurônico e vitaminas em um sachê de 8 g.', 'Colágeno tipo II, ácido hialurônico e vitaminas C, D, E e K2.', 'Um sachê de 8 g.'],
  ['NUT-COBAL', 'Cobalactin é um suplemento alimentar de vitamina B12 na forma de metilcobalamina. A apresentação em comprimidos mastigáveis oferece praticidade e reúne 30 unidades por frasco.', 'Metilcobalamina (vitamina B12).', '30 comprimidos mastigáveis de 1.000 mg.'],
  ['NUT-GENO', 'Genolife Kids é um suplemento alimentar em comprimidos mastigáveis com sabor tutti-frutti. Reúne vitaminas C e D e selênio.', 'Vitaminas C e D e selênio.', '30 comprimidos mastigáveis de 1.000 mg.'],
  ['NUT-MELAT', 'Melatozon é um suplemento de melatonina em gotas com sabor tutti-frutti. O frasco conta-gotas contém 20 ml.', 'Melatonina.', 'Frasco conta-gotas de 20 ml.'],
  ['NUT-OX', 'OX é um suplemento alimentar que associa vitamina C a selênio, manganês e zinco em cápsulas. O frasco reúne 60 unidades.', 'Vitamina C, selênio, manganês e zinco.', '60 cápsulas de 590 mg.'],
  ['NUT-SOFH-D', 'Sofh D é um suplemento alimentar de vitamina D em gotas. A apresentação em frasco conta-gotas contém 20 ml.', 'Vitamina D.', 'Frasco conta-gotas de 20 ml.'],
  ['NUT-AMYNO-CX', 'Amyno Ozon é um suplemento alimentar em pó na apresentação em caixa. A caixa reúne unidades individuais do produto.', '', 'Caixa.'],
  ['NUT-AMYNO-UN', 'Amyno Ozon é um suplemento alimentar em pó na apresentação individual.', '', 'Unidade.'],
  ['NUT-POWER-UN', 'Ozon Power é um suplemento alimentar para adultos que combina vitaminas, minerais, aminoácidos e compostos bioativos. Na apresentação individual, reúne vitaminas do complexo B e C, coenzima Q10, cafeína e outros componentes.', 'Vitaminas B1, B2, B5, B6, B12 e C; coenzima Q10; taurina; tirosina; arginina; cafeína; trans-resveratrol.', 'Unidade.'],
  ['NUT-MUNITY-UN', 'Ozon Munity é um suplemento alimentar na apresentação individual. Combina carboidratos, vitaminas, minerais e fibras solúveis, com maltodextrina entre seus componentes.', 'Maltodextrina, mix de vitaminas e minerais e fibras solúveis.', 'Unidade.'],
];
for (const [code, summary, components, pack] of supplements) set(code, summary,
  ...(components ? [section('Componentes conhecidos', components)] : []), presentation(pack));

// Preserve the supplied product detail independently from the short introduction.
function enrich(code: string, paragraphs: string[], ...sections: Section[]) {
  const item = reviewed[code];
  item.summary = [item.summary, ...paragraphs].join('\n\n');
  for (const addition of sections) {
    const existing = item.sections!.find(s => s.title === addition.title);
    if (existing) existing.items = [...new Set([...existing.items, ...addition.items])];
    else item.sections!.push(addition);
  }
}

enrich('BE-SOFH', [
  'O cuidado combina óleo ozonizado e ácidos graxos essenciais para nutrir a pele e ajudar a manter sua barreira de hidratação. A textura favorece o cuidado de áreas secas, com maciez e sensação de pele revitalizada.',
], section('Características', 'Óleo ozonizado para cuidado externo da pele.', 'Hidratação e nutrição de áreas ressecadas.', 'Toque macio e cuidado da barreira cutânea.'), section('Tecnologia', 'Ozonização do óleo, processo que forma compostos como ozonídeos e peróxidos.'));
enrich('BE-OX3', [
  'O extrato de bardana se combina às micropartículas de pérolas à base de mica natural, com baixo teor de metais pesados, em uma fórmula de textura leve. Vitaminas A, B, C e E e ácidos graxos essenciais complementam o cuidado nutritivo, equilibrando limpeza e hidratação.',
  'Pode integrar tanto a higiene das mãos quanto o banho. Sua proposta desodorizante ajuda a neutralizar odores na pele, deixando sensação de frescor e perfumação após a limpeza.',
], section('Benefícios cosméticos', 'Limpeza suave dos poros e remoção de impurezas.', 'Hidratação, nutrição e revitalização da pele.', 'Sensação refrescante durante o uso.'));
enrich('BE-LUSH', [
  'A remoção das células acumuladas na superfície favorece a renovação da aparência da pele e um toque mais uniforme. O cuidado esfoliante complementa a rotina facial, deixando o rosto com aspecto luminoso e revitalizado.',
], section('Benefícios cosméticos', 'Remoção de células mortas e impurezas superficiais.', 'Melhora da textura e da suavidade ao toque.', 'Preparação da pele para as próximas etapas de cuidado.'));
enrich('BE-SHII', [
  'A combinação de mentol e cânfora contribui para a sensação de frio durante a aplicação. Os demais ativos completam a proposta sensorial da massagem, com emoliência e hidratação para melhorar o toque e a elasticidade da pele.',
], section('Benefícios cosméticos', 'Sensação de conforto e relaxamento durante a massagem.', 'Refrescância e cuidado de pernas com sensação de cansaço e peso.', 'Hidratação, suavidade e melhora do sensorial da pele.'));
enrich('BE-PURE', [
  'Indicado para homens e mulheres, Pure Hot combina polímeros condicionantes e base aquosa ozonizada. A consistência facilita a aplicação e o deslizamento, oferecendo uma experiência de massagem aquecida e confortável.',
], section('Benefícios cosméticos', 'Sensação de aquecimento agradável.', 'Hidratação para pele macia e suave.', 'Absorção rápida e acabamento sem resíduos pegajosos.'));
for (const code of ['BE-HID-SB', 'BE-HID-VG']) enrich(code, [
  'A nova fórmula combina hidratação corporal e uma proposta sensorial voltada ao cuidado diário da pele, com a tecnologia de ozonização da linha.',
]);
enrich('BE-HAY', [
  'A tecnologia Matrix 3D integra um complexo de extratos vegetais à manteiga de karité. A combinação cuida da hidratação dos pés e ajuda a manter a pele mais macia, com aplicação facilitada pela válvula dosadora.',
], actives('Complexo de extratos vegetais.'), section('Benefícios cosméticos', 'Cuidado do mau odor dos pés.', 'Hidratação de áreas ressecadas e ásperas.', 'Textura leve e rápida absorção.'));
enrich('BE-TRIX', [
  'A proposta multifuncional reúne desodorização, hidratação e cuidado da aparência das axilas. Ácido kójico, ácido hialurônico e extrato de alcaçuz se associam à tecnologia Matrix 3D para uma rotina de cuidado que inclui a uniformização gradual do tom da pele.',
], section('Benefícios cosméticos', 'Controle do mau odor.', 'Hidratação e revitalização da pele das axilas.', 'Uniformização gradual do tom da pele.', 'Fórmula livre de alumínio e sem resíduo branco.'));
enrich('BE-SER-LUM', [
  'A vitamina C e o ácido hialurônico combinam cuidado antioxidante e hidratação em uma fórmula ozonizada. A proposta cosmética inclui melhorar a aparência das linhas finas e da elasticidade, deixando a pele com aspecto mais firme, luminoso e revitalizado.',
], section('Indicação', 'Todos os tipos de pele.'), section('Benefícios cosméticos', 'Hidratação e luminosidade.', 'Cuidado da aparência de linhas finas.', 'Melhora do aspecto de firmeza e elasticidade.'));

enrich('CAP-AMP-SF', [
  'A fórmula ozonizada atua no cuidado das cutículas e da fibra capilar, combinando emoliência e nutrição. É especialmente voltada a cabelos muito danificados, com aspecto emborrachado, ressecamento ou perda de brilho, para recuperar a aparência de resistência e sedosidade.',
], section('Benefícios cosméticos', 'Hidratação e nutrição intensivas.', 'Cuidado do aspecto emborrachado dos fios.', 'Melhora do brilho, da resistência e da maciez.', 'Redução do frizz e da porosidade.'));
enrich('CAP-SH-OK', [
  'O cuidado pós-química reúne limpeza e reconstrução cosmética, ajudando a preservar a vivacidade dos cabelos tingidos. A fórmula com pH balanceado complementa a rotina de fios sensibilizados, enquanto a queratina e a manteiga de cupuaçu cuidam da estrutura e da retenção de umidade.',
], section('Características', 'Fórmula com pH balanceado.', 'Cuidado da cor de cabelos tingidos.', 'Reconstrução cosmética e proteção dos fios pós-química.'));
enrich('CAP-MAS-OK', [
  'A manteiga de cupuaçu ajuda a reter a umidade, enquanto a queratina cuida das áreas danificadas da fibra e da resistência à quebra. A aplicação mecha a mecha distribui o tratamento pelo comprimento, preparando os cabelos para a etapa de condicionamento.',
], section('Benefícios cosméticos', 'Hidratação e retenção de umidade.', 'Reconstrução cosmética de fios sensibilizados.', 'Cuidado da resistência à quebra.', 'Maciez, maleabilidade e brilho.'));
enrich('CAP-CO-KES', [
  'O condicionamento forma uma película protetora nos fios que ajuda a reter a umidade e a protegê-los contra novas agressões. A combinação de cupuaçu ozonizado e queratina complementa a sequência de shampoo e máscara, deixando o comprimento sedoso e brilhante.',
], section('Benefícios cosméticos', 'Película protetora e retenção de umidade.', 'Sedosidade, maciez e brilho.'));
enrich('CAP-SH-MC', [
  'Além da limpeza, a fórmula oferece emoliência e cuidado da fibra sensibilizada por química ou agressões externas. O equilíbrio entre hidratação e nutrição favorece a modelagem diária de cabelos ondulados, cacheados e crespos, mantendo os fios suaves e sedosos.',
], section('Vitaminas e nutrientes', 'Vitaminas A, C, D, E e F.', 'Ômegas 3 e 6.'), section('Benefícios cosméticos', 'Hidratação intensa e emoliência.', 'Cuidado da resistência da fibra capilar.', 'Maciez e facilidade para modelar os cachos.'));
enrich('CAP-MAS-MC', [
  'A fórmula ozonizada reúne óleo de argan e proteínas hidrolisadas para nutrir e condicionar os fios. O tratamento é voltado à recuperação da maciez, do brilho e da definição, com cuidado do frizz e das agressões ambientais.',
], actives('Óleo de argan e proteínas hidrolisadas.'),
  usageSection('Após lavar com o Shampoo Master Curls, aplique a máscara nos cabelos úmidos, distribuindo uniformemente mecha a mecha.', 'Deixe agir de 20 a 30 minutos e enxágue completamente.'),
  hairCare, care('Em caso de contato com os olhos, lave imediatamente com água corrente.'));
enrich('CAP-AT-MC', [
  'O finalizador valoriza a forma natural dos cachos e complementa a hidratação da linha Master Curls. Sua proposta de proteção cosmética inclui o cuidado dos fios expostos aos raios UV e à poluição, mantendo a aparência definida e luminosa.',
], section('Benefícios cosméticos', 'Hidratação e definição dos cachos.', 'Proteção cosmética contra danos ambientais.'));
for (const code of ['CAP-SH-BL', 'CAP-MAS-BL']) enrich(code, [
  'A linha Ozon Blond combina extratos de violeta e camomila, vitaminas A e C e agentes matizadores. O cuidado dos fios claros reúne neutralização dos reflexos indesejados, reposição de queratina e recuperação da aparência da fibra sensibilizada pela descoloração.',
  'A hidratação ajuda a restaurar a umidade, favorecendo penteabilidade, maleabilidade e sedosidade. A fórmula livre de parabenos cuida da textura dos fios para um resultado mais leve, macio e luminoso.',
], section('Vitaminas', 'Vitaminas A e C.'), section('Benefícios cosméticos', 'Neutralização dos tons amarelados e alaranjados.', 'Reposição de queratina e cuidado da fibra descolorida.', 'Hidratação, penteabilidade e maleabilidade.', 'Maciez, sedosidade, brilho e leveza.'));
for (const code of ['CAP-KIDS-SH', 'CAP-KIDS-CO', 'CAP-KIDS-LE']) enrich(code, [
  'Os extratos de frutas vermelhas e banana são ricos em vitaminas A, B e C. A combinação ozonizada oferece cuidado hidratante, suavizante e remineralizante para os cabelos infantis, favorecendo brilho, maciez e maleabilidade na rotina diária.',
], section('Vitaminas e nutrientes', 'Vitaminas A, B e C presentes nos extratos de frutas vermelhas e banana.', 'Reposição de vitaminas e minerais na fibra capilar.'),
  section('Características da fórmula', 'Livre de parabenos, silicones e sal.', 'Hipoalergênica.', 'Dermatologicamente e oftalmologicamente testada.', 'Não testada em animais.'));
enrich('CAP-KIDS-SH', ['A limpeza utiliza surfactantes de baixa irritabilidade, com uma fórmula suave e balanceada que limpa sem pesar, deixando os fios perfumados.'], section('Público', 'Crianças de todas as idades.'));
enrich('CAP-KIDS-CO', ['O condicionamento após a lavagem cuida do comprimento e ajuda a repor a maciez depois das atividades do dia. A fórmula oferece hidratação equilibrada e toque sedoso, sem pesar nos fios.'], section('Público', 'Crianças de todas as idades.'));
enrich('CAP-KIDS-LE', ['Como creme para pentear ou ativador de cachos, o leave-in facilita o desembaraço e a finalização. A textura leve ajuda a disciplinar os fios e mantém a sensação de cabelos macios, brilhantes e perfumados.']);
enrich('CAP-O-ACAI', [
  'Os silicones voláteis de baixo e alto peso molecular formam um filme leve sobre a fibra. O cuidado ajuda a reduzir porosidade e aspereza, sem pesar, inclusive em cabelos oleosos. A fórmula também acompanha rotinas com atividade física e exposição solar, protegendo o acabamento dos fios.',
], usageSection('Pode ser adicionado a máscaras para complementar a nutrição.'), section('Benefícios cosméticos', 'Cuidado das pontas duplas e da aparência de danos.', 'Redução de frizz, porosidade e aspereza.', 'Proteção térmica e UV.', 'Alinhamento pré-escova e auxílio à modelagem.'));
enrich('CAP-O-CREAM', [
  'A fórmula 20 em 1 organiza diferentes cuidados em uma única aplicação: hidratação, nutrição, reconstrução cosmética e proteção. O sistema de gel lamelar se combina ao baobá e aos silicones para cuidar das cutículas e da fibra, melhorando resistência, elasticidade e penteabilidade.',
], section('Benefícios cosméticos', 'Hidratação, nutrição e reconstrução cosmética da fibra.', 'Selagem das cutículas e redução da aparência de pontas duplas.', 'Melhora da elasticidade e da resistência dos fios.', 'Facilidade para pentear, alinhamento e condicionamento.', 'Suavidade, maciez e brilho.'));
enrich('CAP-FOR-MEN', [
  'Sua proposta anticaspa combina limpeza do couro cabeludo, controle de oleosidade e condicionamento. Mentol oferece refrescância, enquanto óleo de macadâmia, biotina e ômegas complementam o cuidado nutritivo dos fios.',
], section('Vitaminas e nutrientes', 'Biotina (vitamina B7).', 'Ômegas 3, 6, 7 e 9.'), section('Características', 'Shampoo anticaspa e condicionante 2 em 1.', 'Controle da oleosidade e limpeza equilibrada do couro cabeludo.'), care('Em condições de inflamação ou irritação da pele, mantenha acompanhamento médico e dermatológico.'));
enrich('CAP-TON', [
  'A combinação de blends vegetais, vitaminas e nutrientes complementa o cuidado do couro cabeludo e de fios fragilizados. O formato em spray facilita a aplicação no dia a dia, com sensação de frescor e cuidado da oleosidade, do corpo e da resistência à quebra.',
], section('Vitaminas e nutrientes', 'Vitaminas e nutrientes associados aos blends vegetais.'), section('Benefícios cosméticos', 'Cuidado da oleosidade do couro cabeludo.', 'Refrescância e sensação de limpeza.', 'Redução da quebra e melhora do aspecto encorpado dos fios.'));
for (const code of ['CAP-SH-MEL', 'CAP-CO-MEL']) enrich(code, [
  'O extrato de mel e a geleia real complementam a nutrição e a hidratação. As vitaminas A, D e E integram o cuidado antioxidante e umectante, enquanto o óleo de girassol ozonizado contribui para a proposta revitalizante da linha Mel & Ozônio.',
], section('Vitaminas', 'Vitaminas A, D e E.'));
enrich('CAP-CO-MEL', [],
  usageSection('Após o Shampoo Mel & Ozônio e a Máscara Mel & Ozônio, espalhe o condicionador por todo o comprimento dos fios.', 'Aguarde 3 minutos e enxágue com bastante água.'),
  care('Uso externo. Guarde em local fresco, ventilado e protegido da luz, fora do alcance de crianças.', 'Evite os olhos. Se houver contato, enxágue com água em abundância. Suspenda a aplicação se ocorrer irritação e procure orientação médica.'));
enrich('CAP-MAS-MEL', [
  'O extrato de mel oferece cuidado suavizante e nutritivo. A geleia real complementa o tratamento da fibra, favorecendo resistência e maleabilidade, enquanto o óleo de girassol ozonizado integra a proposta de revitalização da raiz às pontas.',
], section('Benefícios cosméticos', 'Nutrição e hidratação.', 'Cuidado da resistência e da aparência de danos.', 'Maciez, maleabilidade e brilho.'));
enrich('CAP-PRO-KES', [
  'Os ácidos hialurônico e lático se combinam a óleos e silicone de estrutura molecular diferenciada. A fórmula envolve os fios em um filme protetor para melhorar a aparência das cutículas, reduzir a porosidade e manter a umidade durante o alinhamento.',
  'A proposta inclui tanto alinhamento com efeito liso quanto abertura dos cachos, com redução de frizz e volume. O cuidado se adapta a diferentes espessuras de cabelo, dos finos aos grossos, sempre precedido pelo teste de mecha.',
], actives('Óleos e silicone de estrutura molecular diferenciada.'), section('Benefícios cosméticos', 'Controle de volume e frizz.', 'Alinhamento e facilidade para pentear.', 'Cuidado da porosidade e das cutículas.', 'Hidratação, brilho, maleabilidade e toque aveludado.'));

enrich('PRO-AMR', ['A máscara integra o cronograma capilar Ozone Hair System. A tecnologia direciona o cuidado com aminoácidos aos fios que passaram por descoloração e múltiplas transformações, favorecendo corpo, disciplina e aparência de vitalidade.']);
enrich('PRO-CIF', ['A combinação de proteínas e peptídeos integra o cuidado avançado da fibra sensibilizada. A tecnologia WO3 Quantic Complex auxilia o condicionamento, para um cabelo com aspecto mais alinhado e sensação de maior resistência.']);
enrich('PRO-HMS', ['A fórmula concentrada utiliza agentes umectantes e uma tecnologia que cria uma malha de cuidado da hidratação e do condicionamento. O tratamento favorece toque sedoso e brilho intenso em fios que perderam maciez e luminosidade.']);
enrich('PRO-LPC', ['O tratamento combina nutrição intensa com acabamento leve. A ação condicionante do blend de lipídios suaviza a aspereza e ajuda a disciplinar os fios, especialmente nas pontas secas e em cabelos com frizz elevado.']);
enrich('PRO-DEEP', ['Como etapa de preparação, o shampoo auxilia a fibra a receber os ativos dos tratamentos seguintes. A limpeza técnica remove o acúmulo de resíduos para complementar os procedimentos de beleza do sistema Ozone Hair System.']);
enrich('PRO-SOFT', ['É o primeiro passo de uma rotina de tratamento que preserva a leveza dos cabelos. A remoção da sujeira cotidiana e do excesso de oleosidade prepara os fios para as próximas fases, mantendo a aparência de cor, brilho e maciez.']);

enrich('NUT-LEV-UN', ['A fórmula reúne vegetais em pó, fibras, vitaminas e minerais em uma apresentação prática para a rotina. Polidextrose, couve, espinafre, espirulina, cúrcuma e gengibre compõem a combinação de ingredientes.'], section('Modo de preparo', 'Pode ser preparado com água gelada ou quente, em formato de chá.'));
enrich('NUT-POWER-UN', ['A fórmula reúne vitaminas do complexo B e vitamina C, coenzima Q10, aminoácidos e outros compostos bioativos em uma apresentação individual voltada ao público adulto. Os grupos de componentes estão organizados abaixo.'],
  section('Vitaminas', 'B1, B2, B5, B6, B12 e C.'), section('Aminoácidos e outros compostos', 'Taurina, tirosina e arginina.', 'Coenzima Q10, cafeína e trans-resveratrol.'), section('Público', 'Adulto.'));
enrich('NUT-MUNITY-UN', ['A maltodextrina compõe a parte de carboidratos da fórmula, acompanhada por um mix de vitaminas e minerais e fibras solúveis. A apresentação individual reúne esses grupos de nutrientes em uma unidade do suplemento.'], section('Grupos de componentes', 'Carboidratos: maltodextrina.', 'Mix de vitaminas e minerais.', 'Fibras solúveis.'));

const perfumeSummaries: Record<string, string> = {
  'PERF-SEDUC': 'Seduction combina framboesa e néroli com um coração de flores brancas. Jasmim e flor de laranjeira se encontram com mel e patchouli, em uma fragrância feminina de perfil floral, doce e envolvente.',
  'PERF-FAMMA': 'Famma combina manga e bergamota com jasmim e olíbano. Baunilha e sândalo acrescentam cremosidade à fragrância feminina, equilibrando o frescor frutado com um acabamento quente.',
  'PERF-303-M': '303 Men é uma fragrância masculina amadeirada aromática, de proposta clássica e versátil para o dia a dia. Cítricos, gengibre e gardênia se encontram com sândalo e almíscar, combinando frescor e um perfil amadeirado.',
  'PERF-303-VIP': '303 VIP Men é uma fragrância masculina de proposta festiva e urbana. Maracujá, acordes de vodca e gim, especiarias, âmbar e couro combinam frescor frutado e intensidade.',
  'PERF-SENTIMENTO': 'Sentimento é uma fragrância masculina âmbar amadeirada de proposta intensa e envolvente. Flor de laranjeira, lavanda, noz-moscada, fava tonka e madeiras compõem seu perfil marcante.',
  'PERF-DG': 'DG Red combina uma abertura cítrica, verde e aldeídica com um coração floral e especiado. Sândalo, baunilha e almíscar equilibram o acabamento com calor e suavidade, em uma proposta clássica e elegante.',
  'PERF-VG': 'VG Sexy é uma fragrância âmbar floral que combina pimenta rosa e cítricos com flores e algodão-doce. Baunilha, caramelo e madeiras reforçam o perfil adocicado e envolvente, para quem aprecia perfumes de presença marcante.',
  'PERF-AALI': 'Aaliyah combina frescor, frutas e doçura em uma fragrância feminina. Bergamota e notas verdes abrem a composição; melão, abacaxi e âmbar formam o coração. O fundo de almíscar, madeiras e baunilha acrescenta suavidade e aconchego.',
  'PERF-OUD': 'Oud Royale é uma fragrância masculina de perfil intenso e quente. Pimenta preta, tabaco e abacaxi introduzem um coração de café, íris e patchouli. Baunilha, âmbar, madeira seca, benjoim e ládano compõem um fundo encorpado, voltado a quem aprecia perfumes marcantes.',
  'PERF-RHINO': 'Rhino Royale combina uma abertura aromática de limão, hortelã, manjericão e tomilho com um coração de groselha preta, lavanda, alecrim e jasmim. Almíscar e verbena completam esta fragrância masculina de proposta fresca e equilibrada.',
  'PERF-SUBLI': 'Sublime combina flores, especiarias e madeiras em uma fragrância de contrastes. Lavanda, maçã, canela e jacarandá abrem a composição; rosa, lírio-do-vale e cedro formam o coração. Oud, sândalo, âmbar, baunilha e almíscar conferem um acabamento quente.',
  'PERF-LABOOM': 'Laboom é uma fragrância feminina que combina uma abertura de frutas exóticas com um coração floral delicado. A baunilha acrescenta cremosidade e calor ao fundo, equilibrando frescor e doçura em uma proposta versátil para o dia e ocasiões à noite.',
  'PERF-SUPREMO': 'Supremo Elixir é um perfume masculino de proposta intensa e marcante. O frasco de 17 ml oferece uma apresentação compacta para levar na bolsa ou na nécessaire.',
  'PERF-FER-VE': 'Férias no Caribe by Virgínia Esquivel é um body splash da Ozonteck para perfumação corporal, uma opção para complementar a rotina de cuidados pessoais.',
  'PERF-LUA-VE': 'Lua de Mel em Paris by Virgínia Esquivel é um body splash da Ozonteck para perfumação corporal, parte da linha de fragrâncias by Virgínia Esquivel.',
  'PERF-EASY': 'Easy Line combina frescor frutado, nuances herbáceas e um fundo quente. Maçã, gengibre e bergamota abrem a composição; sálvia, zimbro e gerânio formam o coração. Madeira de âmbar, fava tonka, cedro, vetiver e olíbano completam a fragrância masculina amadeirada, versátil para ocasiões casuais ou formais.\n\nSua proposta é transmitir confiança e estilo com uma presença elegante, sem ser excessivamente dominadora.',
};
const pyramids: Record<string, [string, string, string]> = {
  'PERF-AALI': ['Bergamota e notas verdes', 'Melão, abacaxi e âmbar', 'Almíscar, notas amadeiradas e baunilha'],
  'PERF-OUD': ['Pimenta preta, tabaco e abacaxi', 'Patchouli, café e íris', 'Baunilha, âmbar, madeira seca, benjoim e ládano'],
  'PERF-RHINO': ['Hortelã, limão, manjericão e tomilho', 'Groselha preta, lavanda, alecrim e jasmim', 'Almíscar e verbena'],
  'PERF-SUBLI': ['Lavanda, canela, maçã e jacarandá', 'Rosa, lírio-do-vale e cedro', 'Oud, sândalo, âmbar, baunilha e almíscar'],
};
const perfumeSections = new Set(['Família olfativa', 'Notas de saída', 'Notas de coração', 'Notas de fundo']);
for (const [code, research] of Object.entries(productResearch)) {
  if (!/^(PERF|P100)-/.test(code)) continue;
  const canonical = perfumePairs.find(([, large]) => large === code)?.[0] || code;
  const notes = pyramids[canonical];
  const sections = notes ? notes.map((value, index) => section(['Notas de saída', 'Notas de coração', 'Notas de fundo'][index], value))
    : (research.sections || []).filter(s => perfumeSections.has(s.title));
  // Conflicting families are not resolved by selecting one of the competing labels.
  const conflictFamily = ['PERF-DG', 'PERF-SEDUC', 'PERF-FAMMA', 'PERF-303-VIP'];
  const conflictingStages: Record<string, string[]> = {
    'PERF-303-M': ['Notas de saída', 'Notas de coração', 'Notas de fundo'],
    'PERF-303-VIP': ['Notas de saída', 'Notas de coração', 'Notas de fundo'],
    'PERF-SENTIMENTO': ['Notas de saída', 'Notas de coração', 'Notas de fundo'],
    'PERF-303-W': ['Notas de fundo'],
    'PERF-ANGE': ['Notas de fundo'],
    'PERF-SOUL': ['Notas de fundo'],
  };
  reviewed[code] = { summary: perfumeSummaries[canonical] || research.summary,
    line: research.line, sections: sections.filter(s => !(conflictFamily.includes(canonical) && s.title === 'Família olfativa') && !conflictingStages[canonical]?.includes(s.title)) };
}

// Additional commercial detail from the already reconciled document, without
// replacing the descriptions or transferring a variant's identification.
const documentPerfumeDetails: Record<string, string> = {
  'PERF-303-W': 'Sua proposta é urbana, dinâmica e criativa, inspirada na energia de Nova York. A abertura vibrante dá lugar à delicadeza do buquê floral e a um acabamento quente e envolvente, para quem busca sofisticação sem perder a personalidade.',
  'PERF-303-M': 'Inspirado no ritmo cosmopolita de Manhattan, une elegância e dinamismo. A proposta clássica acompanha tanto a rotina quanto diferentes ocasiões, equilibrando a vivacidade cítrica com nuances florais, especiadas e a profundidade das madeiras.',
  'PERF-303-VIP': 'A inspiração está nas festas e na vida noturna de Nova York. A abertura frutada e doce contrasta com acordes de bebidas e especiarias, criando uma presença ousada para quem aprecia um perfume de espírito criativo e festivo.',
  'PERF-ALEM': 'Radiante e envolvente, Alem tem como inspiração a descoberta da beleza interior. O contraste entre a luminosidade cítrica, a delicadeza das flores brancas e o calor do fundo expressa uma proposta de harmonia e personalidade.',
  'PERF-ANGE': 'A proposta combina delicadeza e ousadia: a vivacidade da bergamota encontra a doçura gourmand e a profundidade do patchouli. Seu perfil feminino e sensual foi pensado para quem gosta de uma assinatura confiante, ao mesmo tempo terna e marcante.',
  'PERF-AVEN': 'O frescor da abertura traz uma sensação animada e vibrante. Flores, grama verde e junípero evocam liberdade e natureza, enquanto as madeiras e a baunilha tornam o acabamento acolhedor.',
  'PERF-BLUE': 'Leve e descontraído, evoca a brisa do Mediterrâneo e um dia ensolarado à beira-mar. É uma opção de perfumação diurna para os meses mais quentes, com o contraste entre frutas frescas, delicadeza floral e um acabamento suave.',
  'PERF-CAPA': 'A proposta combina elegância clássica, vitalidade e um toque de modernidade. Versátil, acompanha tanto um dia movimentado no escritório quanto um jantar elegante, com um perfil aromático de presença e estilo.',
  'PERF-CIND': 'O contraste entre suavidade e intensidade expressa uma proposta feminina ousada e sofisticada. Elementos gourmand, florais e amadeirados acompanham encontros românticos e eventos especiais, com versatilidade para o dia ou a noite.',
  'PERF-DG': 'De proposta atemporal, valoriza uma feminilidade elegante e confiante. A combinação de vivacidade cítrica, flores e especiarias acompanha diferentes ocasiões, equilibrando presença e suavidade.',
  'PERF-FANT': 'Divertida, cativante e sonhadora, sua proposta valoriza uma personalidade jovial e vibrante. Frutas exóticas e acordes de confeitaria criam uma experiência doce e envolvente para quem aprecia perfumes gourmand.',
  'PERF-FAMMA': 'Sua proposta evoca o glamour da noite parisiense e uma feminilidade moderna e confiante. A manga traz um caráter tropical, suculento e alegre, que se desenvolve em um coração floral de jasmim com a nuance cremosa do incenso.',
  'PERF-FERA': 'O contraste entre frutas refrescantes e um fundo quente traduz uma proposta exótica, ousada e misteriosa. Combina com encontros românticos, ocasiões especiais e momentos em que se deseja uma presença intensa e sofisticada.',
  'PERF-GOUF-B': 'A proposta evoca liberdade e vitalidade, com frescor revigorante sem abrir mão da elegância. O contraste entre a abertura aquosa e frutada e o fundo de camurça acrescenta profundidade ao perfil aromático.',
  'PERF-GOUF-T': 'Seu perfil complexo combina a vivacidade das ervas com a profundidade do couro e das madeiras. A inspiração em liberdade e vitalidade se traduz em uma fragrância de personalidade clássica e sofisticada.',
  'PERF-GREC': 'Pensada para uma presença feminina confiante e elegante, acompanha desde encontros românticos até momentos de cuidado pessoal. O contraste entre frescor, doçura e sal dá um caráter distinto e envolvente à fragrância.',
  'PERF-MAD': 'A inspiração é a liberdade de viver as próprias escolhas. A abertura fresca e vibrante evolui para a suavidade das flores e uma base rica, compondo uma experiência sofisticada e envolvente.',
  'PERF-MAX-B': 'Seu perfil encorpado valoriza ocasiões especiais e momentos de elegância. O frescor inicial abre espaço para o calor das especiarias e a profundidade do oud, criando uma presença distinta para quem aprecia fragrâncias luxuosas e amadeiradas.',
  'PERF-MAXIMUM': 'Clássico e versátil, acompanha o uso diário e ocasiões especiais. No desenvolvimento da fragrância, a baunilha acrescenta uma doçura sutil, enquanto a oliveira traz uma nuance verde e fresca que equilibra as madeiras.',
  'PERF-PRESIDENTE': 'Couro e âmbar formam sua assinatura marcante. O contraste entre frescor cítrico, hortelã e especiarias expressa uma proposta de elegância e atitude, terminando em um acorde quente e envolvente.',
  'PERF-SCAN': 'Inspirada na atmosfera vibrante de Paris, sua proposta celebra paixão, liberdade e feminilidade. O frescor cítrico evolui para um coração caloroso e um fundo doce e marcante, em uma experiência ousada e envolvente.',
  'PERF-SEDUC': 'De proposta glamorosa, é voltada a quem gosta de expressar atitude e confiança. O frescor luminoso da abertura contrasta com a delicadeza das flores, a doçura do mel e a profundidade do patchouli.',
  'PERF-SENTIMENTO': 'Sua proposta é intensa e profunda, para quem procura uma assinatura masculina marcante. O contraste entre flores, especiarias e madeiras cria uma experiência envolvente e sofisticada.',
  'PERF-SOBERANO': 'Inspirado no espírito atlético e competitivo, apresenta uma proposta de confiança e determinação. O equilíbrio entre frescor aquático e madeiras permite acompanhar situações formais e informais.',
  'PERF-SOUL': 'A inspiração está nos grandes espaços abertos e em um frescor de caráter intenso. A vivacidade da bergamota ganha contraste com as pimentas, formando uma assinatura aromática de presença.',
  'PERF-SPEED': 'Sua versatilidade acompanha o trabalho, encontros casuais e eventos formais. A combinação de flores, especiarias e madeiras equilibra elegância e uma presença masculina marcante no dia a dia.',
  'PERF-VENUM': 'A proposta tem inspiração futurista e expressa energia e personalidade. O contraste entre a luminosidade do limão, a lavanda e as nuances terrosas e esfumaçadas cria uma experiência aromática distinta.',
  'PERF-VG': 'Sua proposta celebra uma feminilidade confiante, refinada e ousada. A pimenta rosa ganha destaque sobre o frescor dos cítricos, enquanto flores e acordes doces constroem uma presença profunda e envolvente.',
  'PERF-VIDA': 'A inspiração celebra felicidade, autenticidade e liberdade para construir a própria história. A delicadeza da íris encontra uma base rica e reconfortante, para quem aprecia a combinação de suavidade floral e doçura gourmand.',
  'PERF-VIP-GIRL': 'De espírito festivo e audacioso, evoca noites glamorosas em Nova York. O acorde de champanhe rosé traz um frescor frutado e efervescente; a flor de pêssego acrescenta delicadeza, enquanto o acorde amadeirado de angico dá um acabamento elegante e sutil.',
  'PERF-LABOOM': 'Moderna e luminosa, sua proposta celebra intensidade, confiança e autenticidade. A vivacidade das frutas e a elegância das flores evoluem para um acabamento cremoso, acompanhando a rotina e ocasiões especiais à noite.',
};
for (const [code, detail] of Object.entries(documentPerfumeDetails)) enrich(code, [detail]);
// These variants have their own matching commercial narrative in the document.
for (const [small, large] of perfumePairs) {
  if (['P100-CIND', 'P100-VG', 'P100-MAXBOSS', 'P100-PRES', 'P100-SPEED', 'P100-MADAME'].includes(large) && documentPerfumeDetails[small]) {
    enrich(large, [documentPerfumeDetails[small]]);
  }
}

enrich('CAP-AMP-SF', [], section('Características', 'Tratamento capilar de ação instantânea.', 'Brilho tridimensional e cuidado intensivo dos fios danificados.'));
enrich('CAP-SH-OK', [], section('Tecnologia', 'Nanotecnologia ozonizada.'));
enrich('CAP-MAS-OK', [], section('Tecnologia', 'Nanotecnologia ozonizada.'));
enrich('CAP-SH-MC', [], section('Tecnologia', 'Nanotecnologia ozonizada.'));
enrich('CAP-SH-MEL', [], section('Tecnologia', 'Nanotecnologia ozonizada.'), section('Características', 'Perfumação dos fios e brilho tridimensional.'));
enrich('BE-TRIX', [], section('Características', 'Cuidado multifuncional 3 em 1.', 'Proposta prebiótica para manutenção do equilíbrio natural da pele.'));
enrich('NUT-NXCAP', ['A vitamina E é um antioxidante que auxilia na proteção contra os danos causados pelos radicais livres.']);
enrich('NUT-XBOOST', ['Sua proposta é complementar a rotina de adultos que praticam exercícios físicos de resistência. A fórmula associa os aminoácidos arginina e taurina à cafeína.']);
enrich('NUT-TRIMAG', ['A combinação é voltada ao público adulto e reúne magnésio quelato, dimagnésio malato e taurato de magnésio com extrato de cúrcuma. O magnésio participa do metabolismo de proteínas, carboidratos e gorduras e contribui para o funcionamento muscular e neuromuscular e para a manutenção de ossos e dentes.'], section('Público', 'Adulto.'));
enrich('PERF-SUPREMO', ['De caráter quente e envolvente, sua proposta valoriza encontros e ocasiões especiais, com uma presença masculina intensa e sofisticada.']);
enrich('PERF-LUA-VE', ['De perfil doce e elegante, combina perfumação com sensação de frescor. Inspirado no romantismo de Paris, pode ser usado na pele e nos cabelos para renovar a fragrância durante o dia.'], presentation('200 ml'), usageSection('Aplique no corpo ou nos cabelos e reaplique ao longo do dia quando desejar renovar a perfumação.'));
enrich('PERF-LABOOM', [], section('Notas de saída', 'Frutas exóticas.'), section('Notas de coração', 'Flores delicadas.'), section('Notas de fundo', 'Baunilha.'));

enrich('BE-SOFH', [], section('Benefícios cosméticos', 'Cuidado antioxidante e sensação de pele acalmada.', 'Hidratação prolongada para áreas ressecadas.'));
enrich('CAP-SH-BL', [], section('Características', 'Remoção de resíduos e partículas de poluição dos fios e do couro cabeludo.'));
enrich('CAP-O-ACAI', [], section('Benefícios cosméticos', 'Cuidado antioxidante do açaí associado ao filme protetor dos fios.'));

// Keep the source's physical weight separate from net contents and dosage.
for (const [code, specs] of Object.entries(documentPhysicalSpecs)) {
  enrich(code, [], section('Especificações físicas',
    `Dimensões (largura × altura × comprimento): ${specs.dimensions}.`,
    `Peso: ${specs.weight}.`));
}

export function getPublicProductContent(code: string): PublicProductContent | undefined {
  if (isRetiredProduct({ code, category: '' })) return undefined;
  return reviewed[code];
}

export function getPublicProductDescription(code: string, storedDescription?: string): string | undefined {
  if (isRetiredProduct({ code, category: '' })) return undefined;
  return getPublicProductContent(code)?.summary || storedDescription?.trim() || undefined;
}

export function getPublicProductSpecifications(product: { code: string; category: string }): Specification[] {
  const content = getPublicProductContent(product.code);
  if (!content) return [];
  return getProductSpecifications(product, content, { legacyHighlights: false }).map(field => {
    if (field.label === 'Público' && ['CAP-KIDS-SH', 'CAP-KIDS-CO'].includes(product.code)) return { ...field, value: 'Infantil.' };
    if (field.label === 'Público' && product.code === 'CAP-KIDS-LE') return { ...field, value: 'Infantil, a partir de 3 anos.' };
    return field;
  });
}
