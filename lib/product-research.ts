import { applySuppliedContent } from './product-content-reviewed.ts';
import { applySecondReview } from './product-content-second-review.ts';
import { registrationProducts } from './product-registration.ts';
import { applyComplementaryContent } from './product-content-complementary.ts';

export type Research = {
  suppliedOfficialCatalog?: boolean;
  editorialReviewed?: boolean;
  checkedAt: string;
  level: 'official' | 'complementary' | 'label' | 'pending';
  summary?: string;
  sections?: { title: string; items: string[] }[];
  line?: string;
  details: { label: string; value: string }[];
  sources: { label: string; url: string }[];
  missing: string[];
  note?: string;
};

// Editorial data only. Commercial fields always come from the current catalog.
export const productResearch: Record<string, Research> = {};
function official(codes: string, slug: string, summary: string, details: Record<string, string> = {}, line?: string, note?: string) {
  for (const code of codes.split(' ')) productResearch[code] = {
    checkedAt: '2026-09-26', level: summary ? 'official' : 'pending', summary: summary || undefined,
    line, details: Object.entries(details).map(([label, value]) => ({ label, value })),
    sources: [{ label: 'Grupo Ozonteck', url: `https://grupoozonteck.com/produtos/${slug}` }],
    missing: ['Composição integral e instruções da apresentação vendida'], note,
  };
}
function pending(codes: string, url: string | undefined, note: string) {
  for (const code of codes.split(' ')) productResearch[code] = {
    checkedAt: '2026-09-26', level: 'pending', details: [],
    sources: url ? [{ label: 'Referência complementar consultada', url }] : [],
    missing: ['Descrição técnica validada', 'Composição, modo de uso e especificações'], note,
  };
}

official('AC-CAM-P', 'camiseta-preta', 'Camiseta da linha de acessórios Ozonteck, na cor preta. O tamanho G corresponde ao cadastro desta loja.', { Cor: 'Preta', Tamanho: 'G (cadastro da loja)' });
official('AC-CAM-R', 'camiseta-rosa', 'Camiseta da linha de acessórios Ozonteck, na cor rosa. O tamanho GG corresponde ao cadastro desta loja.', { Cor: 'Rosa', Tamanho: 'GG (cadastro da loja)' });
official('AC-SQUEEZE', 'squeeze-turquesa-500ml', 'Garrafa squeeze turquesa para transportar água, com capacidade de 500 ml informada pela marca.', { Capacidade: '500 ml', Cor: 'Turquesa' });
pending('AC-CXMEM', undefined, 'Não foi localizada uma ficha técnica confiável para Caixa Memórias. Materiais e dimensões precisam de confirmação.');
for (const code of ['AC-CAM-P', 'AC-CAM-R']) {
  productResearch[code].details.push({ label: 'Tecido informado pela marca', value: 'Dry Fit; composição em fibras não informada' }, { label: 'Cuidados publicados', value: 'Lavar à mão, não lavar em máquina e secar à sombra. Confira também a etiqueta.' });
  productResearch[code].missing = ['Composição do tecido', 'Tabela de medidas'];
  productResearch[code].note = 'A página da marca descreve tamanho P. Os tamanhos G e GG são do cadastro desta loja; confirme medidas e etiqueta da peça.';
}
productResearch['AC-SQUEEZE'].missing = ['Material', 'Temperatura máxima', 'Cuidados de limpeza'];

official('BE-SOFH', 'oleo-sofh', 'Óleo ozonizado para cuidados da pele. A apresentação oficial destaca sua proposta cosmética de hidratação.', { Finalidade: 'Cuidado cosmético da pele' });
official('BE-OX3', 'sabonete-ox3', 'Sabonete ozonizado para higiene das mãos e do corpo. A marca descreve textura leve e proposta de limpeza suave da pele.', { Aplicação: 'Mãos e corpo', 'Componentes destacados pela marca': 'Extrato de bardana e micropartículas à base de mica natural; não representa a lista completa de ingredientes' });
official('BE-LUSH', 'esfoliante-oxylush', 'Esfoliante facial voltado à remoção de células mortas da superfície da pele e à preparação da rotina de cuidados.', { Aplicação: 'Facial' });
official('BE-SHII', 'life-shii', 'Gel para massagem corporal com sensação refrescante. A descrição da marca menciona mentol e cânfora.', { Textura: 'Gel de massagem', 'Ativos citados pela marca': 'Mentol e cânfora (não é a composição completa)', Cuidados: 'A fonte orienta não usar na gravidez, em menores de 7 anos ou sobre pele irritada ou lesionada. Uso externo; evitar os olhos.' });
official('BE-PURE', 'pure-hot', 'Gel corporal para massagem com proposta de sensação de aquecimento e textura deslizante.', { Base: 'Aquosa', 'Característica sensorial': 'Aquecimento, conforme a marca' });
official('BE-FRESH', 'ozon-fresh', 'Creme dental da linha Ozon Fresh destinado à higiene bucal.', { Tipo: 'Creme dental' });
official('BE-HID-SB', 'hidratante-speed-black', 'Loção corporal perfumada Speed Black. A fonte da marca descreve uma proposta de hidratação com perfil amadeirado fresco.', { 'Ativos citados pela marca': 'Ácido hialurônico e vitamina E' }, 'speed-black', 'A fonte descreve a loção, mas não confirma a equivalência da fórmula com a apresentação de 120 g cadastrada. Confira o rótulo.');
official('BE-HID-VG', 'hidratante-vg-sexy', 'Loção corporal perfumada VG Sexy, descrita pela marca com perfil floral frutado e levemente adocicado.', { 'Ativos citados pela marca': 'Ácido hialurônico e vitamina E' }, 'vg-sexy', 'A fonte descreve a loção, mas não confirma a equivalência da fórmula com a apresentação de 120 g cadastrada. Confira o rótulo.');
pending('BE-HAY', 'https://ozonteckgirua.lojavirtualnuvem.com.br/produtos/haydek/', 'A revenda identifica Haydek como creme para os pés. Composição e advertências aguardam validação no rótulo.');
pending('BE-TRIX', 'https://loja-ozonteck.lojaintegrada.com.br/ozon-trix', 'A revenda identifica Ozon Trix como desodorante para axilas. Não foram adotadas alegações de clareamento ou ação bactericida sem documentação da apresentação.');

official('CAP-AMP-SF', 'ampola-soft-hair', 'Ampola capilar Soft Hair para o cuidado de fios danificados. A marca destaca hidratação, maciez e brilho como benefícios cosméticos.', { 'Ativos citados pela marca': 'Nanoaminoácidos e queratina de baixo peso molecular', Indicação: 'Todos os tipos de cabelo, especialmente danificados' });
official('CAP-SH-OK', 'shampoo-ozon-kesen', 'Shampoo para limpeza dos cabelos após processos químicos, com proposta de cuidado diário dos fios.', { Indicação: 'Cabelos pós-química' }, 'ozon-kesen');
official('CAP-MAS-OK', 'mascara-ozon-kesen', 'Máscara pós-química para hidratar e condicionar os fios. A marca cita manteiga de cupuaçu e queratina.', { 'Ativos citados pela marca': 'Manteiga de cupuaçu e queratina', 'Modo de uso publicado': 'Após lavar, distribuir pelos fios, massagear e enxaguar. A fonte indica pausa de 20 a 40 minutos; confira a instrução da sua embalagem.', Cuidados: 'Uso externo. Evitar os olhos e manter fora do alcance de crianças.' }, 'ozon-kesen');
official('CAP-SH-MC', 'shampoo-master-curls', 'Shampoo Master Curls Pro para a limpeza suave de cabelos ondulados, cacheados e crespos, preparando os fios para as demais etapas de cuidado.', { Indicação: 'Curvaturas 2A a 4C, conforme a marca' }, 'master-curls');
official('CAP-MAS-MC', 'mascara-master-curls', 'Máscara Master Curls para hidratação e condicionamento de cabelos cacheados, crespos e ondulados.', { 'Ativos citados pela marca': 'Óleo de argan e proteínas hidrolisadas', 'Modo de uso publicado': 'Aplicar após o shampoo, nos fios úmidos, e enxaguar. A fonte indica pausa de 20 a 30 minutos; confirme na embalagem.', Cuidados: 'Uso externo. Evitar contato com os olhos.' }, 'master-curls');
official('CAP-SH-BL', 'shampoo-ozon-blond', 'Shampoo matizador Ozon Blond para a limpeza de cabelos claros. A marca informa ação cosmética de neutralização de tons amarelados e alaranjados.', { Tipo: 'Shampoo matizador' }, 'ozon-blond');
official('CAP-MAS-BL', 'mascara-ozon-blond', 'Máscara matizadora Ozon Blond para cabelos loiros, descoloridos e grisalhos, com proposta de condicionamento e neutralização de tons indesejados.', { Indicação: 'Loiros, descoloridos e grisalhos', 'Ativos citados pela marca': 'Extratos de violeta e camomila' }, 'ozon-blond');
official('CAP-KIDS-SH', 'shampoo-kids', 'Shampoo infantil Kids Ozon Splash para limpeza suave dos fios. A descrição oficial informa fórmula sem parabenos e silicones.', { Linha: 'Kids Ozon Splash' }, 'kids');
official('CAP-KIDS-CO', 'condicionador-kids', 'Condicionador infantil Kids Ozon Splash para maciez e condicionamento dos cabelos. A fonte destaca extratos de frutas vermelhas e banana.', { Linha: 'Kids Ozon Splash', 'Ativos citados pela marca': 'Extratos de frutas vermelhas e banana' }, 'kids');
official('CAP-KIDS-LE', 'leave-in-kids', 'Finalizador infantil Kids Ozon Splash para pentear, desembaraçar e auxiliar na definição dos cachos.', { Linha: 'Kids Ozon Splash', 'Faixa etária publicada': 'A partir de 3 anos; confirmar no rótulo' }, 'kids');
official('CAP-O-ACAI', 'oleo-de-acai', 'Óleo capilar Açaí Fusion, apresentado pela marca para o controle cosmético do frizz, maciez e brilho dos fios.', { Tipo: 'Óleo capilar' });
official('CAP-O-CREAM', 'ozon-cream', 'Fluido multifuncional Ozon Cream 20 em 1. A marca descreve uma proposta de hidratação e alinhamento dos fios.', { Tipo: 'Fluido capilar' });
official('CAP-FOR-MEN', 'ozon-for-men', 'Shampoo 2 em 1 Ozon For Men para limpeza e condicionamento diário, com proposta de sensação refrescante no couro cabeludo.', { Tipo: 'Shampoo 2 em 1' });
official('CAP-TON', 'tonico-capilar', 'Tônico capilar Revita Tonic. A marca informa a presença de blends vegetais e mentol na apresentação do produto.', { 'Ativos citados pela marca': 'Blends vegetais e mentol' });
pending('CAP-MAS-MEL', 'https://www.app-ozonteck.com/mascara-mel-ozonio/', 'Fontes de revenda divergem sobre o tempo de aplicação. Composição e modo de uso precisam ser confirmados na embalagem.');
pending('CAP-SH-MEL', 'https://ozonvidas.com/cabelos-ozonizados/ozon-mel-nutricao/', 'Foi localizada a linha Mel & Ozônio em revendas; falta confirmar a ficha técnica da apresentação vendida.');
pending('PRO-AMR PRO-CIF PRO-HMS PRO-LPC PRO-DEEP PRO-SOFT', 'https://ozonvidas.com/produtos-ozonizados/cabelos/', 'Produto localizado em catálogo de revenda. A ficha técnica e as instruções profissionais ainda precisam de validação do fabricante.');
for (const code of ['PRO-AMR', 'PRO-CIF', 'PRO-HMS', 'PRO-LPC', 'PRO-DEEP', 'PRO-SOFT']) productResearch[code].line = 'wo3';

official('NUT-NXCAP', 'nxcap-ozon', 'Suplemento alimentar apresentado pela marca como uma combinação de óleos e vitamina E.', { 'Componentes citados': 'Mix de óleos e vitamina E' });
official('NUT-OMEGA', 'omega-3', 'Suplemento alimentar em cápsulas à base de óleo de peixe, conforme a descrição oficial.', { Apresentação: 'Cápsulas', 'Componente citado': 'Óleo de peixe' });
official('NUT-XBOOST', 'xbooster', 'Suplemento alimentar Xbooster cuja descrição oficial informa arginina, taurina e cafeína.', { 'Componentes citados': 'Arginina, taurina e cafeína' });
official('NUT-TRIMAG', 'tri-magnesio', 'Suplemento alimentar de magnésio. A fonte oficial não detalha as formas químicas nem suas quantidades.', { 'Componente citado': 'Magnésio' });
official('NUT-CREAT-CX NUT-CREAT-UN', 'ozon-creat', 'Ozon Creat é apresentado pela marca como suplemento voltado à rotina de atividade física. A página oficial consultada não detalha os ingredientes.', {}, 'ozon-creat', 'Caixa e unidade são apresentações separadas no catálogo. A quantidade de sachês e a massa de cada unidade não foram confirmadas.');
official('NUT-CREAT-MO-CX NUT-CREAT-MO-UN', 'ozon-creat-morango', 'Ozon Creat Morango é a versão com sabor morango apresentada pela marca para sua linha de suplementos.', { Sabor: 'Morango' }, 'ozon-creat-morango', 'Não foram confirmadas a quantidade por caixa, a porção ou a equivalência de formulação entre apresentações.');
for (const [code, slug] of Object.entries({ 'NUT-BORYS': 'boryslim', 'NUT-DREAM': 'dreambliss', 'NUT-K2D3': 'k2mk7-e-d3', 'NUT-LUMI': 'luminous-vita', 'NUT-LEV-UN': 'ozon-lev', 'NUT-VIRT': 'virtuous-caps', 'NUT-VITA-OZ': 'vita-ozon-plus' })) {
  official(code, slug, '', {}, undefined, 'A página oficial existe, mas não apresenta ficha técnica suficiente. Não foram inferidos ingredientes ou recomendações de consumo.');
}
official('NUT-FLEX-CX NUT-FLEX-UN', 'ozon-flex', '', {}, 'ozon-flex', 'A página oficial de Ozon Flex contém texto que identifica Amyno Ozon. Por essa divergência, a descrição não foi aproveitada.');
pending('NUT-COBAL', 'https://bemestarcomozonio.com.br/cobalactin-ozonteck-vitamina-b12/', 'As fontes complementares divergem sobre quantidade e apresentação. É necessário confirmar o rótulo de Cobalactin.');
pending('NUT-GENO', 'https://ozonio-shop.lojaintegrada.com.br/genolife-kids', 'As revendas apresentam composições e faixas etárias diferentes. Não foi publicada dosagem infantil sem confirmação do rótulo.');
pending('NUT-MELAT', 'https://ozonio-shop.lojaintegrada.com.br/melatozon', 'Identificado em revenda, sem confirmação da ficha técnica e da apresentação exata.');
pending('NUT-OX', 'https://www.ozonteckstore.com.br/ox-ozonteck', 'Identificado em revenda. Ingredientes, doses e advertências precisam de confirmação do fabricante.');
pending('NUT-SOFH-D', 'https://www.ozonteckloja.com.br/sofh-d-suplemento-de-vitamina-d-em-gotas-20ml/p', 'A fonte complementar identifica suplemento de vitamina D em gotas. Não foi adotada a dosagem sem confirmação no rótulo.');

function perfume(codes: string, slug: string, family: string, notes?: [string, string, string]) {
  official(codes, slug, family ? `A marca apresenta esta fragrância com perfil ${family.toLocaleLowerCase('pt-BR')}.` : 'Fragrância da linha de perfumaria Ozonteck, identificada na página oficial da marca.',
    { ...(family ? { 'Perfil olfativo': family } : {}), ...(notes ? { 'Notas de saída': notes[0], 'Notas de coração': notes[1], 'Notas de fundo': notes[2] } : {}) }, slug,
    'A fonte descreve a fragrância, sem discriminar todos os volumes. As notas olfativas não são a lista de ingredientes. Confirme a apresentação no rótulo.');
  for (const code of codes.split(' ')) productResearch[code].missing = ['Ingredientes completos', 'Concentração e advertências da apresentação', ...(notes ? [] : ['Pirâmide olfativa completa'])];
}
perfume('PERF-303-W', '303-for-woman', 'Floral amadeirado', ['Bergamota, mandarina e flores cítricas', 'Flores, incluindo lírio, jasmim e rosa', 'Sândalo e almíscar']);
perfume('PERF-303-M', '303-men', 'Amadeirado aromático', ['Notas verdes, toranja, bergamota e lavanda', 'Gengibre, violeta, gardênia e sálvia', 'Almíscar, sândalo, vetiver e ládano']);
perfume('PERF-303-VIP', '303-vip-men', 'Âmbar amadeirado', ['Maracujá, lima e pimenta-preta', 'Acordes de bebidas, hortelã e especiarias', 'Âmbar e couro']);
perfume('PERF-ALEM', 'alem', 'Âmbar amadeirado oriental', ['Cítricos e mandarina', 'Jasmim e flores brancas', 'Âmbar branco e cashmeran']);
perfume('PERF-ANGE', 'angelical', 'Âmbar baunilha', ['Acordes doces, frutas e bergamota', 'Mel, frutas, noz-moscada e rosa', 'Patchouli, caramelo, baunilha, tonka e âmbar']);
perfume('PERF-AVEN', 'aventura', 'Cítrico aromático', ['Limão, abacaxi, cardamomo, lavanda e hortelã', 'Jasmim, magnólia, grama verde e junípero', 'Sândalo, cedro, baunilha e musgo']);
perfume('PERF-BLUE', 'blue-sky', 'Floral frutal', ['Limão, maçã e cedro', 'Bambu, jasmim e rosa branca', 'Cedro, almíscar e âmbar']);
perfume('PERF-CAPA', 'capadocia', 'Fougère aromático', ['Lavanda, limão, manjericão, bergamota e sálvia', 'Anis, sândalo, vetiver, cardamomo, zimbro e cedro', 'Musgo, couro, âmbar, almíscar e tonka']);
perfume('PERF-CIND P100-CIND', 'cinderela', 'Âmbar floral', ['Amêndoa, café e cítricos', 'Tuberosa, jasmim, flor de laranjeira, íris e rosa', 'Acordes doces, âmbar, especiarias e madeiras']);
perfume('PERF-DG', 'dg-red', 'Floral frutado', ['Aldeídos, cítricos e ervas', 'Acordes florais e especiados', 'Sândalo, baunilha, almíscar e tonka']);
perfume('PERF-DOCU', 'docurinha', 'Floral frutal', ['Morango, mandarina e laranja', 'Acordes de chiclete e flores', 'Almíscar, baunilha e âmbar']);
perfume('PERF-FAMMA', 'famma', 'Chipre floral frutado', ['Manga e bergamota', 'Jasmim e olíbano', 'Baunilha e sândalo']);
perfume('PERF-FANT', 'fantastica-bry', 'Floral frutal gourmand', ['Kiwi, lichia e marmelo', 'Chocolate branco, cupcake, orquídea e jasmim', 'Almíscar, íris e madeiras']);
perfume('PERF-FERA', 'fera', 'Âmbar amadeirado', ['Lavanda, limão e gálbano', 'Abacaxi, mel e flores', 'Baunilha, sândalo, almíscar e cedro']);
perfume('PERF-GOUF-B', 'gouf-blue', 'Aromático fougère', ['Pepino, melão e mandarina', 'Manjericão, sálvia e gerânio', 'Camurça, madeiras e almíscar']);
perfume('PERF-GOUF-T', 'gouf-tradicional', 'Chipre amadeirado', ['Zimbro, ervas, especiarias e bergamota', 'Pinheiro, couro, camomila, especiarias e flores', 'Tabaco, musgo, patchouli, cedro, vetiver, almíscar e âmbar']);
perfume('PERF-GREC', 'grecia', 'Âmbar floral', ['Jasmim aquático, mandarina e flor de gengibre', 'Baunilha e sal', 'Âmbar cinzento, cashmere e sândalo']);
perfume('PERF-MAD P100-MADAME', 'madame-vi', 'Âmbar floral', ['Laranja, mandarina, bergamota e flor de laranjeira', 'Rosa, jasmim, mimosa e ylang-ylang', 'Patchouli, almíscar branco, baunilha, vetiver e tonka']);
perfume('PERF-MAX-B P100-MAXBOSS', 'max-boss', 'Âmbar amadeirado', ['Maçã e cítricos', 'Canela, açafrão, cravo e ládano', 'Oud, sândalo e cipriol']);
perfume('PERF-MAXIMUM', 'maximum', 'Amadeirado especiado', ['Frutas, cítricos, musgo e gerânio', 'Canela, mogno e cravo', 'Baunilha, sândalo, cedro, vetiver e oliveira']);
perfume('PERF-PRESIDENTE P100-PRES', 'presidente', 'Amadeirado com toques especiados');
perfume('PERF-SCAN P100-SCAN', 'scandaloza', 'Floral');
perfume('PERF-SEDUC', 'seduction', 'Floral frutado');
perfume('PERF-SENTIMENTO P100-SENT', 'sentimento', 'Amadeirado');
perfume('PERF-SOBERANO P100-SOB', 'soberano', 'Amadeirado aquático');
perfume('PERF-SOUL', 'soul', 'Fougère aromático');
perfume('PERF-SPEED P100-SPEED', 'speed-black', '');
perfume('PERF-VENUM', 'venum', 'Amadeirado e cítrico');
perfume('PERF-VG P100-VG', 'vg-sexy', '');
perfume('PERF-VIDA P100-VIDA', 'vida-bella', 'Floral frutado');
perfume('PERF-VIP-GIRL', 'vip-girl-vip', 'Floral frutado');
pending('PERF-AALI P100-AALIYAH PERF-OUD P100-OUD PERF-RHINO P100-RHINO PERF-SUBLI P100-SUBLIME PERF-LABOOM PERF-SUPREMO PERF-FER-VE PERF-LUA-VE', 'https://www.ozonioterapia.online/', 'A apresentação foi localizada em catálogo de revenda. A ficha da fragrância ainda precisa de fonte validada; não foram inferidas notas, concentração ou duração.');
pending('PERF-EASY', 'https://themcompany.com.br/products/easy-line-perfume-ozonteck-17-ml', 'A apresentação de 17 ml foi localizada em revenda. Pirâmide olfativa e ingredientes não foram confirmados.');

export function getProductResearch(code: string): Research | undefined {
  return productResearch[code];
}

export function getProductDescription(code: string, storedDescription: string) {
  const research = getProductResearch(code);
  return (research?.editorialReviewed ? research.summary : storedDescription) || research?.summary || '';
}

// Concise product-specific reading blocks, not a universal marketing template.
function sections(code: string, content: NonNullable<Research['sections']>) {
  productResearch[code].sections = content;
  productResearch[code].checkedAt = '2026-09-27';
}

productResearch['BE-SOFH'].summary = 'Sofh é um óleo de girassol ozonizado para cuidado externo da pele, apresentado em frasco conta-gotas. Sua proposta cosmética é hidratar e ajudar a manter a pele macia, especialmente nas áreas ressecadas.';
productResearch['BE-SOFH'].sources.push({ label: 'Informação complementar: revenda Produtos Ozonteck', url: 'https://produtosozonteck.com/produto/oleo-sofh-oleo-de-girassol-ozonizado-ozonteck/' });
sections('BE-SOFH', [
  { title: 'Base e processo', items: ['Óleo vegetal de girassol submetido à ozonização. A identificação da base é corroborada pela revenda; a página da marca descreve o processo.', 'Segundo a Ozonteck, a ozonização forma compostos como ozonídeos e peróxidos. Essa descrição não comprova eficácia para tratar doenças.'] },
  { title: 'Características', items: ['Textura oleosa para cuidado da pele e proposta de hidratação informada pela marca.', 'Frasco de 20 ml na apresentação ilustrada pelo fabricante. Confirme o volume da unidade adquirida.'] },
  { title: 'Uso e cuidados', items: ['Uso externo. Siga as instruções do rótulo; a página consultada não confirma quantidade nem frequência para a apresentação vendida.', 'Não substitui medicamento ou avaliação profissional. Não foram incorporadas promessas de cicatrização, tratamento de feridas ou combate a infecções.'] },
]);
sections('BE-LUSH', [
  { title: 'O que faz', items: ['Esfoliação facial para remover células mortas e impurezas da superfície da pele.', 'A marca destaca melhora da suavidade e da uniformidade da textura, além de preparar a rotina de cuidados seguinte.'] },
  { title: 'Fórmula e utilização', items: ['A fonte consultada não identifica o material das partículas esfoliantes nem apresenta a lista integral de ingredientes.', 'A frequência e o tempo de aplicação precisam ser confirmados no rótulo.'] },
]);
sections('BE-SHII', [
  { title: 'Ativos destacados', items: ['A marca cita arnica, pimenta, gengibre, camélia, alecrim, salicilato de metila, cânfora e mentol. Não é a lista completa de ingredientes.'] },
  { title: 'Experiência de uso', items: ['Gel de textura leve e deslizante para massagem corporal.', 'Mentol e cânfora integram a proposta de sensação refrescante. A finalidade cosmética não deve ser interpretada como tratamento de dor ou inflamação.'] },
  { title: 'Cuidados importantes', items: ['A fonte contraindica uso durante a gravidez, em menores de 7 anos e sobre pele irritada ou lesionada.', 'Uso externo; não ingerir e evitar os olhos. Suspender em caso de irritação e procurar orientação profissional.', 'Manter fechado, fora do alcance de crianças e protegido de luz, calor e umidade.'] },
]);
sections('BE-PURE', [
  { title: 'Fórmula e textura', items: ['Gel à base de água com polímeros condicionantes, conforme a marca.', 'A textura suave e deslizante foi desenvolvida para facilitar os movimentos da massagem corporal.'] },
  { title: 'Característica sensorial', items: ['Proposta de sensação de aquecimento durante a massagem, descrita pela Ozonteck.', 'A fonte não informa temperatura, duração do efeito nem composição integral. Não foi inferida indicação de uso íntimo.'] },
]);
for (const code of ['BE-HID-SB', 'BE-HID-VG']) sections(code, [
  { title: 'Ativos e hidratação', items: ['Ácido hialurônico de alto peso molecular e vitamina E são os ativos destacados pela marca.', 'A proposta da loção é auxiliar a retenção de umidade e proporcionar maciez e suavidade à pele. Não é uma lista integral de ingredientes.'] },
  { title: 'Fragrância', items: code === 'BE-HID-SB' ? ['Perfil amadeirado fresco, com referências a maçã, bergamota, ameixa, âmbar, cedro e musk.'] : ['Perfil floral frutado levemente adocicado, com referências a champanhe rosé, pimenta rosa, flor de pêssego, rosas, musk branco e madeiras.'] },
  { title: 'Indicação e apresentação', items: ['A página oficial indica a loção para adultos e diferentes tipos de pele.', 'O catálogo desta loja informa 120 g. A equivalência da formulação com a loção descrita na fonte deve ser confirmada na embalagem.'] },
]);
sections('BE-OX3', [
  { title: 'Componentes destacados', items: ['Extrato de bardana e micropartículas à base de mica natural são citados pela Ozonteck.', 'A fonte descreve uma fórmula ozonizada, mas não disponibiliza a lista completa de ingredientes.'] },
  { title: 'Aplicação e textura', items: ['Higiene das mãos e higiene corporal durante o banho, conforme a descrição oficial.', 'Textura leve e proposta de limpeza suave, associada à hidratação da pele.'] },
]);
sections('CAP-AMP-SF', [
  { title: 'Ativos', items: ['Nanoaminoácidos e queratina de baixo peso molecular são os componentes destacados pela marca.', 'A fórmula é apresentada como reconstrutora, emoliente e hidratante; não foi disponibilizada composição integral.'] },
  { title: 'Para quais cabelos', items: ['Todos os tipos, com destaque para fios muito danificados, ressecados ou opacos.'] },
  { title: 'Benefícios cosméticos descritos', items: ['Maciez, brilho e melhora da resistência dos fios.', 'Redução do aspecto de frizz e porosidade. Resultados variam conforme o estado do cabelo.'] },
]);
sections('CAP-MAS-MC', [
  { title: 'Ativos e indicação', items: ['Óleo de argan e proteínas hidrolisadas, destacados pela marca para nutrir e condicionar.', 'Indicada para cabelos ondulados, cacheados e crespos.'] },
  { title: 'Benefícios cosméticos', items: ['Hidratação, maciez e brilho, com proposta de definição dos cachos e controle do frizz.'] },
  { title: 'Como usar', items: ['Após o shampoo, distribuir nos cabelos úmidos, mecha a mecha.', 'A página oficial indica pausa de 20 a 30 minutos e enxágue completo. Priorize as instruções da sua embalagem.'] },
  { title: 'Cuidados', items: ['Uso externo. Evitar os olhos; em caso de contato, enxaguar com água.', 'Manter fora do alcance de crianças e guardar em local fresco, seco e protegido da luz solar.'] },
]);
sections('CAP-MAS-OK', [
  { title: 'Ativos e indicação', items: ['Manteiga de cupuaçu e queratina são os componentes destacados.', 'Voltada aos fios após coloração, alisamento ou relaxamento, e também aos cabelos ressecados.'] },
  { title: 'Benefícios cosméticos', items: ['A manteiga de cupuaçu integra a proposta de retenção de umidade; a queratina, a de reconstrução da fibra.', 'A marca destaca maciez, maleabilidade e brilho.'] },
  { title: 'Como usar', items: ['Depois de lavar, aplicar mecha a mecha por todo o comprimento e massagear.', 'A fonte indica pausa de 20 a 40 minutos, enxágue e aplicação de condicionador. Confira o tempo no rótulo adquirido.'] },
  { title: 'Cuidados', items: ['Uso externo. Evitar os olhos e manter fora do alcance de crianças.', 'Armazenar em local fresco e seco, protegido da luz solar.'] },
]);
sections('CAP-MAS-BL', [
  { title: 'Ativos e indicação', items: ['Extratos de violeta e camomila e agentes matizadores, conforme a marca.', 'Indicada para cabelos loiros, descoloridos e grisalhos.'] },
  { title: 'Matização e condicionamento', items: ['Proposta de neutralização dos tons amarelados e alaranjados.', 'Auxilia no condicionamento dos fios descoloridos, com maciez, maleabilidade e facilidade para pentear.', 'A marca declara fórmula livre de parabenos.'] },
  { title: 'Antes de aplicar', items: ['O tempo de pausa não foi informado na página consultada. Confira a embalagem, sem adotar o tempo de outra máscara.'] },
]);
sections('CAP-KIDS-CO', [
  { title: 'Ativos e fórmula', items: ['Extratos de frutas vermelhas e banana são destacados pela marca.', 'A página informa fórmula sem parabenos e silicones, de textura leve e hidratante.'] },
  { title: 'Cuidado dos fios', items: ['Condicionamento após a limpeza, para maciez, sedosidade e maleabilidade dos cabelos infantis.', 'A marca descreve uso diário. A idade e a aplicação da apresentação adquirida devem ser conferidas no rótulo.'] },
]);
sections('CAP-KIDS-LE', [
  { title: 'Ativos e textura', items: ['A linha destaca extratos de frutas vermelhas e banana.', 'Creme finalizador de textura leve; a marca declara ausência de parabenos.'] },
  { title: 'Finalização', items: ['Pode ser utilizado como creme para pentear e ativador de cachos, conforme a marca.', 'Propõe facilitar o desembaraço e deixar os fios disciplinados, macios, brilhantes e perfumados.'] },
  { title: 'Faixa etária', items: ['A fonte informa uso diário a partir de 3 anos. Confirme as instruções da embalagem.'] },
]);
sections('CAP-KIDS-SH', [
  { title: 'Fórmula', items: ['Surfactantes descritos pela marca como de baixa irritabilidade.', 'A página informa ausência de parabenos, silicones e sal. A composição integral não foi publicada.'] },
  { title: 'Limpeza infantil', items: ['Limpeza suave dos fios, com proposta de brilho e perfume.', 'A marca descreve uso diário para cabelos infantis. Confira a faixa etária e as instruções do rótulo.'] },
]);
sections('CAP-SH-MC', [{ title: 'Curvaturas e função', items: ['Desenvolvido para curvaturas de 2A a 4C: cabelos ondulados, cacheados e crespos.', 'Limpeza suave com proposta hidratante, preparando os fios para as demais etapas da linha Master Curls Pro.'] }]);
sections('CAP-SH-OK', [{ title: 'Indicação e limpeza', items: ['Shampoo pós-química para limpeza suave de fios que passaram por procedimentos químicos.', 'A marca descreve sensação refrescante e de conforto no cuidado diário, preservando a leveza dos cabelos.'] }]);
sections('CAP-SH-BL', [{ title: 'Limpeza e matização', items: ['A marca descreve remoção de resíduos e impurezas, com limpeza gentil da fibra.', 'Neutralização de tons amarelados e alaranjados para um loiro de aparência mais fria e luminosa.', 'A página não informa tempo de aplicação nem composição integral. Siga o rótulo específico do shampoo.'] }]);
sections('CAP-O-ACAI', [{ title: 'Textura e acabamento', items: ['Óleo capilar Açaí Fusion descrito pela marca como leve e de sensação não oleosa.', 'Proposta de controle do frizz, nutrição, maciez e brilho.', 'A fonte menciona proteção frente a calor e poluição, mas não informa temperatura máxima de proteção térmica; não foi atribuída uma.'] }]);
sections('CAP-O-CREAM', [{ title: 'Cuidado multifuncional', items: ['Fluido capilar apresentado como 20 em 1.', 'A marca destaca hidratação, nutrição, alinhamento dos fios, maciez e brilho.', 'A página não enumera os 20 benefícios nem informa ativos, porção de aplicação ou temperatura de proteção. Esses dados não foram presumidos.'] }]);
sections('CAP-FOR-MEN', [{ title: 'Funções e sensação', items: ['Shampoo 2 em 1 que reúne limpeza e condicionamento diário.', 'A marca descreve sensação refrescante no couro cabeludo e cuidado da oleosidade.', 'Não foi publicado um ativo anticaspa específico na fonte; o produto não é apresentado aqui como tratamento dermatológico.'] }]);
sections('CAP-TON', [{ title: 'Componentes destacados', items: ['Blends vegetais e mentol, segundo a Ozonteck. A página não identifica as plantas nem suas concentrações.'] }, { title: 'Proposta cosmética', items: ['Cuidado capilar com sensação refrescante e proposta de fortalecimento e redução da quebra.', 'Não foram adotadas promessas de crescimento capilar ou tratamento de queda sem comprovação específica.'] }]);

function complementary(code: string, url: string, summary: string, content: NonNullable<Research['sections']>) {
  const item = productResearch[code];
  item.level = 'complementary'; item.summary = summary;
  item.sources.push({ label: 'Ficha complementar de revenda Ozonteck', url });
  item.note = 'Resumo da ficha individual de revenda. A composição integral, a apresentação e as instruções devem ser conferidas no rótulo atual.';
  item.missing = ['Lista integral de ingredientes', 'Instruções e apresentação do rótulo atual'];
  sections(code, content);
}
complementary('PRO-AMR', 'https://grupoozonteckloja.lojavirtualnuvem.com.br/produtos/wo3-mascara-amr/', 'AMR (Amino Matrix Reset) é uma máscara da linha profissional Ozone Hair System, voltada ao cuidado intensivo de fios sensibilizados por química e descoloração.', [
  { title: 'Componentes destacados', items: ['Blend de aminoácidos associado ao complexo comercial WO3 Quantic Complex. A ficha não identifica cada aminoácido ou sua concentração.'] },
  { title: 'Função no tratamento', items: ['Proposta de dar corpo, disciplina e aparência de resistência aos cabelos sensibilizados.', 'Os tempos e as etapas de aplicação precisam do protocolo profissional da apresentação adquirida.'] },
]);
complementary('PRO-CIF', 'https://grupoozonteckloja.lojavirtualnuvem.com.br/produtos/wo3-mascara-cif/', 'CIF (Carbon Ion Forge) é uma máscara profissional para fios fragilizados, afinados ou danificados por procedimentos químicos.', [
  { title: 'Componentes destacados', items: ['Complexo de proteínas e peptídeos, associado ao WO3 Quantic Complex. A ficha não apresenta os ingredientes completos.'] },
  { title: 'Condicionamento', items: ['Proposta de melhorar o alinhamento e a aparência de força e resistência da fibra capilar.', 'Consulte o protocolo profissional para frequência, tempo de pausa e sequência de aplicação.'] },
]);
complementary('PRO-HMS', 'https://grupoozonteck.lojavirtualnuvem.com.br/produtos/wo3-mascara-hms/', 'HMS (Hydro Mesh Sync) é a máscara de hidratação da linha Ozone Hair System, direcionada a cabelos secos, opacos, cacheados ou crespos.', [
  { title: 'Fórmula e proposta', items: ['A ficha cita agentes umectantes e WO3 Quantic Complex, sem detalhar a composição integral.', 'A proposta é favorecer a hidratação e o condicionamento, com toque sedoso, maciez e brilho.'] },
  { title: 'Aplicação profissional', items: ['Não foi confirmado o tempo de pausa. Utilize o protocolo e o rótulo da máscara HMS, sem transferir instruções das outras máscaras.'] },
]);
complementary('PRO-LPC', 'https://grupoozonteckloja.lojavirtualnuvem.com.br/produtos/wo3-mascara-lpc/', 'LPC (Lipid Phase Control) é uma máscara de nutrição profissional para cabelos com frizz, pontas secas e aspecto áspero.', [
  { title: 'Componentes destacados', items: ['Blend de lipídios nutritivos e WO3 Quantic Complex; a ficha não identifica todos os lipídios.'] },
  { title: 'Acabamento', items: ['Proposta de condicionamento, alinhamento e controle do frizz com acabamento leve.', 'Consulte o protocolo profissional para a quantidade e o tempo de pausa.'] },
]);
complementary('PRO-DEEP', 'https://grupoozonteckloja.lojavirtualnuvem.com.br/produtos/wo3-shampoo-deep-cleanse/', 'Deep Cleanse é um shampoo técnico da linha Ozone Hair System para limpeza intensa antes das etapas de tratamento.', [
  { title: 'Limpeza preparatória', items: ['A ficha descreve remoção de resíduos e impurezas acumuladas na fibra capilar.', 'O WO3 Quantic Complex é citado na fórmula, mas seus ingredientes não são detalhados.'] },
  { title: 'Uso no protocolo', items: ['Voltado à preparação dos cabelos para os próximos produtos da linha. Não foi inferido uso diário nem tempo de pausa.'] },
]);
complementary('PRO-SOFT', 'https://grupoozonteckloja.lojavirtualnuvem.com.br/produtos/wo3-shampoo-soft-cleanse/', 'Soft Cleanse é um shampoo da linha Ozone Hair System para limpeza suave e frequente, especialmente em fios quimicamente tratados, cacheados ou crespos.', [
  { title: 'Limpeza e acabamento', items: ['Proposta de remover a sujeira cotidiana e o excesso de oleosidade da raiz, mantendo a leveza dos fios.', 'A ficha descreve cuidado da camada lipídica e manutenção da aparência da cor e do brilho.'] },
  { title: 'Fórmula', items: ['A fonte cita WO3 Quantic Complex, sem publicar a composição integral ou o pH. Esses dados precisam do rótulo.'] },
]);

// Transcribed only from legible front labels in the supplied catalog images.
const labelRecords: [string, string, string, string, string][] = [
  ['NUT-BORYS', 'boryslim', 'Boryslim é um suplemento alimentar em cápsulas cujo rótulo destaca cromo.', 'Cromo; a frente da embalagem não discrimina os demais ingredientes.', '60 cápsulas de 500 mg.'],
  ['NUT-COBAL', 'cobalactin', 'Cobalactin é um suplemento de metilcobalamina em comprimidos mastigáveis, sabor mousse de limão.', 'Metilcobalamina, destacada na embalagem.', '30 comprimidos mastigáveis de 1.000 mg.'],
  ['NUT-DREAM', 'dreamblis', 'Dream Bliss combina melatonina e coenzima Q10 em cápsulas softgel.', 'Melatonina e coenzima Q10. A frente informa 100 mg de coenzima Q10 por cápsula, sem informar a quantidade de melatonina.', '30 cápsulas softgel de 700 mg.'],
  ['NUT-GENO', 'genolifekids', 'Genolife Kids é um suplemento em comprimidos mastigáveis com sabor tutti-frutti.', 'Vitaminas C e D e selênio são os componentes destacados na frente do frasco.', '30 comprimidos mastigáveis de 1.000 mg. A faixa etária não está legível nesta foto.'],
  ['NUT-K2D3', 'k2mk7ed3', 'Suplemento que associa vitamina K2 na forma MK-7 e vitamina D3 em cápsulas softgel.', 'Vitamina D3 e MK-7, conforme a frente do frasco. As quantidades individuais não estão visíveis.', '60 cápsulas softgel de 700 mg.'],
  ['NUT-LUMI', 'luminousvita', 'Luminous Vita é um suplemento alimentar em cápsulas com vitaminas A, C e E.', 'Vitaminas A, C e E, identificadas na embalagem fotografada.', '60 cápsulas de 590 mg.'],
  ['NUT-MELAT', 'melatozon', 'Melatozon é um suplemento de melatonina em gotas, sabor tutti-frutti, com frasco conta-gotas.', 'Melatonina. A concentração por gota não está legível na imagem.', 'Frasco de 20 ml.'],
  ['NUT-NXCAP', 'nxcapozon', 'NX Cap Ozon é um suplemento alimentar em cápsulas softgel; o frasco destaca vitamina E.', 'Vitamina E. A frente não permite confirmar a lista completa de óleos e outros ingredientes.', '60 cápsulas softgel de 700 mg.'],
  ['NUT-OMEGA', 'omega3', 'Ômega 3 é um suplemento alimentar em cápsulas softgel.', 'Ômega 3; as quantidades de EPA e DHA não aparecem na frente fotografada.', '60 cápsulas softgel de 1.400 mg. Esse peso não corresponde necessariamente ao conteúdo de ômega 3.'],
  ['NUT-OX', 'ox', 'OX é um suplemento alimentar em cápsulas com vitamina C e minerais.', 'Vitamina C, selênio, manganês e zinco, conforme o rótulo fotografado.', '60 cápsulas de 590 mg.'],
  ['NUT-CREAT-CX', 'ozoncreatcaixa', 'Ozon Creat é um suplemento alimentar em pó com creatina e glutamina, acondicionado em sticks individuais.', 'Creatina e glutamina são destacadas na caixa. As quantidades de cada uma não estão visíveis.', 'Caixa com 30 sticks de 8 g; peso líquido de 240 g.'],
  ['NUT-CREAT-UN', 'ozoncreatunidade', 'Ozon Creat é um suplemento alimentar em pó na apresentação individual.', 'A embalagem individual destaca creatina; não informa sua quantidade na face fotografada.', 'Um stick de 8 g. Não equivale a 8 g de creatina.'],
  ['NUT-CREAT-MO-CX', 'ozoncreatmorangocaixa', 'Ozon Creat Morango é um suplemento alimentar em pó, sabor morango, em sachês individuais.', 'A embalagem destaca creatina e informa aromatizante sintético idêntico ao natural.', 'Caixa com 30 sachês de 8,5 g; peso líquido de 255 g.'],
  ['NUT-CREAT-MO-UN', 'ozoncreatmorangounidade', 'Ozon Creat Morango é a apresentação individual do suplemento alimentar em pó com sabor morango.', 'A foto informa aromatizante sintético idêntico ao natural; não permite ler a lista completa de ingredientes.', 'Um sachê de 8,5 g. Esse peso é do produto, não uma dose de creatina.'],
  ['NUT-FLEX-CX', 'ozonflexcaixa', 'Ozon Flex é um suplemento alimentar em pó, sabor pêssego, com colágeno tipo II e outros componentes destacados na caixa.', 'Colágeno tipo II, ácido hialurônico e vitaminas C, D, E e K2. A caixa identifica o colágeno como não desnaturado.', 'Caixa com 30 sachês de 8 g; peso líquido de 240 g.'],
  ['NUT-FLEX-UN', 'ozonflexunidade', 'Ozon Flex é um suplemento alimentar em pó, sabor pêssego, na apresentação individual.', 'Colágeno tipo II, ácido hialurônico e vitaminas C, D, E e K2, conforme a embalagem.', 'Um sachê de 8 g.'],
  ['NUT-LEV-UN', 'ozonlevunidade', 'Ozon Lev é um suplemento alimentar em pó, sabor abacaxi com hortelã, apresentado como fonte de fibra.', 'A embalagem destaca hortelã e fibra, sem identificar o tipo ou a quantidade de fibra na face visível.', 'Um sachê de 8 g; contém aromatizante sintético idêntico ao natural.'],
  ['NUT-SOFH-D', 'sofhD', 'Sofh D é um suplemento de vitamina D em gotas, em frasco conta-gotas.', 'Vitamina D. A concentração por gota não está legível na foto.', 'Frasco de 20 ml.'],
  ['NUT-TRIMAG', 'trimagnesio', 'Power Tri-Magnésio é um suplemento em cápsulas que reúne três formas de magnésio e extrato de cúrcuma.', 'Magnésio quelato, dimagnésio malato, taurato de magnésio e extrato de cúrcuma, conforme a frente do frasco.', '60 cápsulas de 590 mg. Esse peso não corresponde ao teor de magnésio elementar.'],
  ['NUT-VIRT', 'virtuouscaps', 'Virtuous Caps é um suplemento alimentar em cápsulas com biotina, silício e zinco.', 'Biotina, silício e zinco. A embalagem também informa que o produto é colorido artificialmente.', '60 cápsulas; conteúdo líquido de 42 g.'],
  ['NUT-VITA-OZ', 'vitaozonplus', 'Vita Ozon Plus é um suplemento em cápsulas apresentado como polivitamínico com ômega 3.', 'A frente destaca ômega 3, EPA e DHA. Sem a tabela nutricional, não foi atribuída porção aos valores impressos.', '60 cápsulas de 700 mg.'],
  ['NUT-XBOOST', 'xbooster', 'Xbooster é um suplemento alimentar em cápsulas com cafeína, taurina e arginina.', 'Cafeína, taurina e arginina, destacadas na embalagem. As quantidades individuais não estão visíveis.', '60 cápsulas de 590 mg.'],
];
for (const [code, file, summary, components, presentation] of labelRecords) {
  const item = productResearch[code];
  if (item.level === 'pending') item.level = 'label';
  item.summary = summary;
  item.sources.push({ label: 'Embalagem fotografada no catálogo desta loja', url: `/produtos/${file}.webp` });
  item.note = 'Dados lidos na imagem fornecida pela loja. Confira a correspondência com a embalagem do lote adquirido; a foto frontal não substitui o rótulo completo.';
  item.missing = ['Lista integral de ingredientes e alergênicos', 'Tabela nutricional, modo de uso e advertências completos'];
  sections(code, [
    { title: 'Componentes destacados', items: [components] },
    { title: 'Apresentação', items: [presentation] },
    { title: 'Antes de consumir', items: ['Consulte o modo de uso e as advertências da embalagem. A foto não permite definir quantidade diária, duração de uso ou adequação individual.'] },
  ]);
}

const cosmeticLabels: [string, string, string, { title: string; items: string[] }[]][] = [
  ['BE-HAY', 'haydek', 'Haydek é um creme ozonizado para os pés, em embalagem com válvula dosadora de 120 g.', [
    { title: 'Componentes destacados', items: ['Manteiga de karité e hydroxyethyl urea são legíveis na frente do rótulo. A marca também cita a tecnologia comercial Matrix 3D.'] },
    { title: 'Cuidado dos pés', items: ['A embalagem apresenta uma proposta de hidratação, prevenção do ressecamento e controle do mau odor.', 'A foto não informa frequência de aplicação nem permite confirmar a composição integral.'] },
  ]],
  ['BE-TRIX', 'ozontrix', 'Ozon Trix é um desodorante ozonizado para as axilas, apresentado em spray de 30 ml.', [
    { title: 'Componente destacado', items: ['Extrato de alcaçuz é legível na frente da embalagem, que também cita a tecnologia comercial Matrix 3D.'] },
    { title: 'Finalidade', items: ['Controle do odor das axilas. Não foi atribuída duração de proteção nem ação antitranspirante sem confirmação.', 'Confira no rótulo completo as orientações de aplicação e os cuidados após depilação.'] },
  ]],
  ['CAP-MAS-MEL', 'mascaramelozonio', 'Máscara capilar da linha Mel & Ozônio da Ozonteck.', [
    { title: 'Identificação da linha', items: ['A embalagem fotografada identifica o produto como máscara Mel & Ozônio.', 'O nome da linha não permite determinar a concentração de mel, a lista de ingredientes ou o processo de formulação.'] },
    { title: 'Aplicação', items: ['O tempo de pausa e a quantidade não estão legíveis na foto. Não utilize automaticamente as instruções de outras máscaras da marca.'] },
  ]],
  ['CAP-SH-MEL', 'shampooozonmel', 'Shampoo da linha Mel & Ozônio, em frasco de 300 ml, com proposta de limpeza suave e nutritiva indicada na embalagem.', [
    { title: 'Limpeza dos fios', items: ['O rótulo frontal destaca limpeza suave e nutritiva.', 'Não foram confirmados tipo de cabelo, composição integral ou ausência de sulfatos e parabenos.'] },
    { title: 'Apresentação', items: ['Frasco de 300 ml. Consulte o verso da embalagem para modo de uso e cuidados.'] },
  ]],
];
for (const [code, file, summary, content] of cosmeticLabels) {
  const item = productResearch[code];
  item.level = 'label';
  item.summary = summary;
  item.sources.push({ label: 'Embalagem fotografada no catálogo desta loja', url: `/produtos/${file}.webp` });
  item.note = 'Informações da face legível da embalagem fotografada. A composição completa e as instruções do lote adquirido precisam do rótulo integral.';
  item.missing = ['Lista integral de ingredientes', 'Modo de uso e advertências completos'];
  sections(code, content);
}

applySuppliedContent(productResearch);
applySecondReview(productResearch);

for (const item of registrationProducts) {
  const content: NonNullable<Research['sections']> = [];
  if (item.presentation) content.push({ title: 'Apresentação', items: [item.presentation] });
  if (item.actives) content.push({ title: 'Ativos destacados', items: [item.actives] });
  if (item.components) content.push({ title: 'Componentes conhecidos', items: [item.components] });
  if (item.usage) content.push({ title: 'Modo de uso', items: item.usage });
  if (item.precautions) content.push({ title: 'Precauções', items: item.precautions });
  productResearch[item.code] = {
    checkedAt: '2026-09-30', level: item.description ? 'official' : 'pending',
    suppliedOfficialCatalog: true, editorialReviewed: Boolean(item.description),
    summary: item.description || undefined, line: item.line, sections: content,
    details: [], sources: [], missing: item.missing,
    note: 'Fonte: lista e capturas fornecidas pelo responsável pela loja. Identificação e apresentação mantidas separadas de produtos semelhantes. Composição integral não confirmada.',
  };
}

applyComplementaryContent(productResearch);
