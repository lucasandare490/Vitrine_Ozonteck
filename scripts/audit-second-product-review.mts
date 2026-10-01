import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { productOfficialCodes, isValidEan13 } from '../lib/product-official-codes.ts';
import { productResearch } from '../lib/product-research.ts';
import { getProductSpecifications } from '../lib/product-specs.ts';
import { perfumePairs, secondReviewAdditions } from '../lib/product-content-second-review.ts';

// SELECT only. This script has no mutations, RPCs, migrations or service-role credentials.
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const { data: products, error } = await client.from('produtos').select('code,name,category,price,estoque,image_url,description,is_deleted').order('code');
if (error || !products) throw error || new Error('Catalog unavailable');
const sourcePath = process.argv[2] || 'C:/Users/lucas/.codex/attachments/ab1a0d0f-4873-4268-a343-320431bfef4f/Texto colado.txt';
const source = readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
const expression = /([\s\S]*?)\nCódigo\n([^\n]+)\n(?:Código EAN\n([^\n]+)\n)?Largura \(cm\) × Altura \(cm\) × Comprimento \(cm\)\n([^\n]+)\nPeso \(em gramas\)\n([^\n]+)/g;
const blocks = [...source.matchAll(expression)].map((match, index) => ({
  position: index + 1, body: match[1].trim(), codigoOriginal: match[2], ean: match[3] || '', dimensions: match[4], weight: match[5],
}));
if (blocks.length !== 119) throw new Error(`Expected 119 source blocks, got ${blocks.length}`);
const byOriginal = new Map(blocks.map(block => [block.codigoOriginal, block]));
for (const [code, ids] of Object.entries(productOfficialCodes)) {
  const block = byOriginal.get(ids.codigoOriginal);
  if (!block || block.ean !== ids.ean || !products.some(product => product.code === code)) throw new Error(`Unsafe association: ${code}`);
}
const prior = JSON.parse(readFileSync('docs/product-revision-2-before.json', 'utf8'));
const unmatched: Record<string, [string, string]> = {
  'IMP-189': ['Amyno Ozon Caixa', 'Nutracêuticos'], 'IMP-197': ['Amyno Ozon Unidade', 'Nutracêuticos'],
  'IMP-49': ['Ozon Power Unidade', 'Nutracêuticos'], 'IMP-48': ['Ozon Munity Unidade', 'Nutracêuticos'],
  '40565': ['Loção Speed Black (apresentação anterior)', 'Bem Estar'],
  '405640': ['Loção VG Sexy (apresentação anterior)', 'Bem Estar'],
  '40566': ['Sérum Facial Lumino3', 'Bem Estar'], '40548': ['Condicionador Ozon-Kesen', 'Cuidados Capilares'],
  '40544': ['Pro Kesen', 'Cuidados Capilares'], '40559': ['Ativador Master Curls', 'Cuidados Capilares'],
  '40551': ['Condicionador Mel & Ozônio', 'Cuidados Capilares'],
};
const empty = (body: string) => body.length < 130 && /(?:sem descrição|novidade|\.)\s*$/i.test(body);
const escape = (value: unknown) => String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const table = (headers: string[], rows: unknown[][]) => [headers, headers.map(() => '---'), ...rows].map(row => `| ${row.map(escape).join(' | ')} |`).join('\n');
const key = (code: string) => [code, productOfficialCodes[code]?.codigoOriginal || '', productOfficialCodes[code]?.ean || '', products.find(product => product.code === code)?.name || ''];
const real = products.filter(product => productOfficialCodes[product.code]);
const changed = real.filter(product => JSON.stringify(prior[product.code]) !== JSON.stringify(productResearch[product.code]));
const heading = ['Código do banco', 'Código original', 'Código EAN', 'Nome final'];
const report: string[] = [
  '# Segunda revisão das fichas de produtos — 28/09/2026',
  '## Escopo e fontes',
  'Lista integral de 119 blocos oficiais, do primeiro perfume ao último de 100 ml, cruzada com as 12 capturas fornecidas e as fichas anteriores. Texto original completo, dimensões e peso foram preservados em product-revision-2-source.json para rastreabilidade. A cópia anterior do arquivo anexado foi comparada pelos identificadores e conteúdo com o material reenviado no chat. Não foi acessado o painel privado do Grupo Ozonteck.',
  `Catálogo público consultado por SELECT: ${real.length} produtos comerciais e ${products.length - real.length} cadastros de teste. Os quatro acessórios retirados não aparecem na leitura pública; sua existência histórica permanece nas fichas locais. Todos os 108 produtos ativos têm correspondência de identidade. ${changed.length} fichas tiveram complementação editorial ou atualização de proveniência; todas as 108 receberam identificação e especificações.`,
  '## Decisões e preservação',
  'Preços, estoque, imagens, pedidos, avaliações e códigos internos não foram alterados. Nenhum SQL, RPC ou migration foi executado no Supabase real nesta revisão. A consulta anônima não comprova o estado de linhas ocultas por RLS. Não foi criado produto novo. Acessórios mantidos retirados por confirmação expressa do usuário nesta etapa; nenhuma restauração ou nova migration foi gerada.',
  '## Lista completa do catálogo',
  table([...heading, 'Categoria', 'Situação editorial', 'Origem do conteúdo'], real.map(product => [...key(product.code), product.category, changed.includes(product) ? 'Complementada / proveniência atualizada' : 'Conteúdo preservado; identificação e especificações adicionadas', empty(byOriginal.get(productOfficialCodes[product.code].codigoOriginal)!.body) ? 'Outra fonte já existente; identificação do catálogo oficial' : 'Catálogo oficial + outra fonte já existente'])),
  '## Cadastros de teste',
  table(heading, products.filter(product => !productOfficialCodes[product.code]).map(product => [product.code, '', '', product.name])),
  'Não receberam códigos oficiais nem dados de produtos reais.',
  '## Referências históricas retiradas',
  table([...heading, 'Situação'], [['AC-CXMEM', '', '', 'Caixa Memórias', 'Retirado; sem restauração'], ['AC-CAM-P', '', '', 'Camiseta G Preta', 'Retirado; sem restauração'], ['AC-CAM-R', '', '', 'Camiseta GG Rosa', 'Retirado; sem restauração'], ['AC-SQUEEZE', '', '', 'Squeeze Turquesa 500ml', 'Retirado; sem restauração']]),
  'Nomes históricos do projeto e do material anterior; linhas retiradas não são visíveis na consulta pública atual. Nenhum código oficial foi atribuído por suposição.',
  '## Nomes e SQL',
  'Nenhum nome comercial precisou de alteração comprovada. Foram preservadas grafia, volume e apresentação do cadastro, corroborados pelas legendas das fotos. Variações como Fantastica/Fantástica, Ozon-For Men/Ozon For Men e nomes descritivos não justificam renomeação arbitrária. Master Curls PRO permanece uma divergência, não uma renomeação autorizada. Zero UPDATEs e nenhuma migration de nomes: não há SQL a executar nesta entrega. Rotas continuam baseadas no código do banco; nenhum slug foi alterado.',
  '## Tabela de casamento integral',
  table(['Posição', 'Trecho do material', 'Código original', 'Código EAN', 'Código do banco', 'Nome no catálogo', 'Casamento'], blocks.map(block => {
    const entry = Object.entries(productOfficialCodes).find(([, ids]) => ids.codigoOriginal === block.codigoOriginal);
    const product = products.find(product => product.code === entry?.[0]);
    return [block.position, block.body.slice(0, 160), block.codigoOriginal, block.ean, product?.code || '', product?.name || unmatched[block.codigoOriginal]?.[0] || '', product ? 'Confirmado por descrição/nome + código na foto + apresentação; EAN transcrito do bloco correspondente' : 'Sem cadastro correspondente'];
  })),
  'EAN não estava previamente cadastrado: ele não foi utilizado como prova circular de identidade. A associação depende do produto/apresentação e do código legível na foto; depois recebe o EAN do mesmo bloco. Nenhum casamento de identidade ficou incerto após o cruzamento; as incertezas abaixo são de campos e fórmulas.',
  '## Validação dos códigos',
  `Blocos: ${blocks.length}; EANs presentes: ${blocks.filter(block => block.ean).length}; ausentes: ${blocks.filter(block => !block.ean).length}; inválidos: ${blocks.filter(block => block.ean && !isValidEan13(block.ean)).length}. Códigos oficiais duplicados: ${blocks.length - new Set(blocks.map(block => block.codigoOriginal)).size}. EANs duplicados: ${blocks.filter(block => block.ean).length - new Set(blocks.filter(block => block.ean).map(block => block.ean)).size}.`,
  '108 EANs associados a produtos existentes são válidos e entram como gtin13. EANs de produtos não cadastrados não geram páginas ou JSON-LD. Strings preservadas, inclusive 40720 -B, 40714 - B e 405640. Não foi adicionado campo no Supabase. O código interno continua em sku e no topo da página; identificação oficial aparece apenas na página individual. Não foi incluído additionalProperty.',
  '## Especificações por produto e origem de cada campo',
  table([...heading, 'Campos / origem'], real.map(product => [...key(product.code), getProductSpecifications(product, productResearch[product.code]).map(field => `${field.label}: ${field.value} [${field.origin}]`).join(' / ')])),
  'Ordem: categoria, linha quando confirmada, apresentação, público explícito, tipo de uso explícito, notas olfativas, ativos/componentes conhecidos, identificação oficial. Nas telas estreitas, rótulo e valor ficam empilhados. Notas e apresentação estruturadas foram movidas integralmente, sem cortar frases ou ressalvas. Destaques de ativos podem continuar no texto explicativo para preservar o contexto; não são ingredientes completos. Modo de uso e precauções permanecem em seções próprias.',
  '## Campos não aplicados e divergências',
  table([...heading, 'Divergência / decisão'], [
    ...['BE-HID-SB', 'BE-HID-VG'].map(code => [...key(code), 'Catálogo distingue nova fórmula 120 g das loções anteriores 40565/405640. Identidade nova confirmada por foto; ativos, público e notas da loção antiga NÃO foram transferidos. Conteúdo antigo preservado no arquivo histórico, não como afirmação da nova fórmula. Requer rótulo para resolver composição.']),
    [...key('BE-HAY'), 'Rótulo anterior: hydroxyethyl urea. Catálogo: ureia. Não são tratados como sinônimos; rótulo anterior preservado com ressalva. 99,9% e hidratação 24 h não aplicados sem comprovação.'],
    [...key('NUT-LEV-UN'), 'Rótulo: abacaxi com hortelã. Catálogo: abacaxi, gengibre e hortelã. Sabor anterior preservado; componentes confirmados no novo texto adicionados separadamente. Sem dose, detox, queima de gordura ou tratamento glicêmico.'],
    [...key('NUT-COBAL'), 'Rótulo: mousse de limão. Catálogo: sabor natural de limão. Preservado sabor anterior e registrada a diferença; 30 mastigáveis e B12 corroborados.'],
    [...key('CAP-MAS-MC'), 'Texto chama MASTER CURLS PRO; foto/cadastro dizem Master Curls. Nome não alterado; equivalência de formulação PRO não presumida.'],
    [...key('CAP-SH-MC'), 'Pesquisa anterior mencionava PRO; texto/foto atual confirmam Master Curls pelo código 40557. Mantido nome cadastrado.'],
    ...['PERF-CAPA', 'PERF-SENTIMENTO', 'P100-SENT', 'PERF-303-M', 'PERF-303-VIP', 'PERF-303-W', 'PERF-ANGE', 'PERF-SOUL'].map(code => [...key(code), 'O parágrafo narrativo difere da lista explícita de notas. Preservada a ficha anterior, sem acrescentar notas divergentes. Confirmação do fabricante permanece pendente.']),
    [...key('PERF-VIP-GIRL'), 'Texto destaca acorde de angico, enquanto pirâmide cita notas amadeiradas sem nomear angico. Não acrescentado como ingrediente ou nova nota da pirâmide.'],
    [...key('PERF-DG'), 'Família floral frutado e descrição floral aldeídica coexistem no material; família já publicada preservada e atribuída à marca.'],
    [...key('PERF-FAMMA'), 'Família Chypre Floral Frutado e referência a chipre amadeirada intensa / outra marca no texto. Mantida família explícita anterior; sem atribuir criador ou marca estrangeira à Ozonteck.'],
    ...['NUT-FLEX-CX', 'NUT-FLEX-UN'].map(code => [...key(code), 'Novo texto é apenas placeholder. Mantido conteúdo do próprio rótulo Ozon Flex, sem importar Amyno Ozon. Peso logístico 343/9 g não substitui 240/8 g líquido.']),
  ]),
  'Dimensões e pesos de todos os 119 blocos foram lidos e arquivados, mas não exibidos como dimensões do frasco ou conteúdo líquido: a fonte não distingue embalagem logística e recipiente, há valores como 1 g e 10 × 10 × 10 cm e discrepâncias com rótulos. Não se converte grama em mililitro. Nenhuma tabela nutricional, dose, concentração, certificação ou duração foi deduzida.',
  'Critérios editoriais: não foram publicadas alegações de cura/cicatrização de doenças, tratamento de psoríase/dermatite, controle de arritmias/ansiedade/depressão, emagrecimento/desintoxicação, regeneração celular terapêutica ou antiga dispensa de registro RDC 240/18. No material, essas alegações aparecem especialmente nos blocos Sofh (40568), Life Shii (40570), Tri Magnésio (IMP-98), Lev (IMP-47), For Men (40560), Haydek (IMP-199), hidratantes novos (44988/40564) e itens não cadastrados Power/Munity. O texto original permanece somente no arquivo de evidências, não publicado como promessa comercial. Afirmações de eficácia numérica (3x brilho, 99,9%, 24h, 30 dias) também não foram transformadas em garantia. Referências a Azzaro/Mugler/Rabanne/marca italiana não foram atribuídas à Ozonteck.',
  '## Descrições sem título inicial',
  'A tabela integral acima registra o início de TODOS os blocos, inclusive os que começam por uma descrição em vez de título. Exemplos: o shampoo de cachos foi associado a CAP-SH-MC pelo código 40557 e foto 071403; o suplemento iniciado por arginina/taurina/cafeína a NUT-XBOOST por IMP-33/foto 071452; o creme dental a BE-FRESH por 369845/foto 071443. As descrições de novas fórmulas dos hidratantes foram distinguidas pelas fotos 071452 e pelos códigos. Nenhuma descrição sem nome ficou sem candidato identificado; os 11 produtos não cadastrados não foram forçados para produtos semelhantes.',
  '## Pares de perfumaria',
  table(['Código banco 17 ml', 'Código original 17 ml', 'EAN 17 ml', 'Nome 17 ml', 'Código banco 100 ml', 'Código original 100 ml', 'EAN 100 ml', 'Nome 100 ml', 'Descrição e campos comuns iguais'], perfumePairs.map(([small, large]) => [...key(small), ...key(large), JSON.stringify(productResearch[small].summary) === JSON.stringify(productResearch[large].summary) && JSON.stringify(getProductSpecifications({code:small,category:'Perfumaria'},productResearch[small]).filter(field => field.group !== 'identity' && field.label !== 'Apresentação')) === JSON.stringify(getProductSpecifications({code:large,category:'Perfumaria'},productResearch[large]).filter(field => field.group !== 'identity' && field.label !== 'Apresentação')) ? 'Sim' : 'REVISAR'])),
  'Os quatro pares sem descrição oficial continuam sem notas inventadas. Dois produtos by Virgínia Esquivel continuam somente no filtro Todos, fora de 17/100 ml. Filtros preservados: 54 no geral, 38 de 17 ml, 14 de 100 ml.',
  '## Produtos não cadastrados',
  table(['Código do banco', 'Código original', 'Código EAN', 'Nome oficial', 'Categoria provável', 'Material', 'Falta para cadastrar'], blocks.filter(block => unmatched[block.codigoOriginal]).map(block => ['', block.codigoOriginal, block.ean, ...unmatched[block.codigoOriginal], empty(block.body) ? 'Placeholder' : 'Descrição real', 'Autorização, código interno, preço informado pelo responsável e confirmação da apresentação; nenhum cadastro agora'])),
  table(['Código do banco', 'Código original', 'Código EAN', 'Nome na imagem', 'Situação'], [['', 'IMP-206', '', 'Toque Luminoso', 'Somente foto 071443; sem descrição/EAN no material textual'], ['', 'IMP-99', '', 'Energético Xbooster 269 ml', 'Somente foto 071443; distinto das cápsulas NUT-XBOOST']]),
  'Preços nas capturas não foram copiados, nem autorizam novos cadastros.',
  '## Produtos sem informação descritiva nova',
  table([...heading, 'Tipo de ausência', 'Conteúdo anterior'], real.filter(product => empty(byOriginal.get(productOfficialCodes[product.code].codigoOriginal)!.body)).map(product => [...key(product.code), byOriginal.get(productOfficialCodes[product.code].codigoOriginal)!.body, productResearch[product.code]?.summary ? 'Mantido integralmente; origem anterior nas fontes da ficha' : 'Sem descrição técnica confirmada; não preenchido por suposição'])),
  'Nenhum dos 108 produtos comerciais ativos está ausente do material de identidade. Os quatro acessórios permanecem fora desta revisão por ordem confirmada; não receberam códigos oficiais. Os quatro testes não pertencem ao catálogo oficial. Os quatro EANs ausentes são de produtos sem cadastro (Amyno caixa/unidade, Power e Munity).',
  '## Imagens: análise individual',
  table(['Arquivo (Captura de tela 2026-09-28)', 'Evidência analisada', 'Limitações'], [
    ['071418.png', 'WO3: 40901/40902/40903/40905/40906/40907; Sofh 40568, OX3 40569, Life Shii 40570, loção Speed 40565', 'Topo dos frascos da primeira linha cortado; legendas/códigos legíveis.'],
    ['071443.png', 'Loções anteriores 40565/405640; sérum 40566; Oxy Lush 40567; Fresh 369845; Pure 40797; Trix IMP-198; Toque Luminoso IMP-206; energético IMP-99', 'Sem verso do rótulo ou EAN; montagem antiga/nova embalagem não comprova fórmula dos hidratantes 120 g.'],
    ['071502.png', 'Caixas e unidades Creat/Morango/Amyno; Flex unidade; Lumi; Sofh D; Power e Lev unidades', 'Rótulos pequenos, sem composição integral legível. Não confundir massa logística com sachê.'],
    ['071452.png', 'Haydek IMP-199; hidratantes 120 g 44988/40564; Xbooster, Boryslim, NX, Omega, K2D3, Dream, Tri Magnésio, Vita', 'Parte inferior cortada; nomes/códigos visíveis.'],
    ['071509.png', 'Munity unidade IMP-48; Melat IMP-203; Cobal IMP-204; Geno IMP-207; Ox IMP-209; Flex caixa IMP-190', 'Cabeçalho de acessórios sem produtos: ignorado.'],
    ['071524.png', '12 perfumes 100 ml: Oud, Aaliyah, Rhino, Sublime, Scandaloza, Vida, Soberano, Sentimento, Presidente, Max Boss, VG, Cinderela', 'Preços inferiores cortados e não usados.'],
    ['071403.png', 'Blond 40556/40555; Pro Kesen 40544; Master Curls 40557/40558/40559; Mel 40549/40551/40550; Kids 40552/40553/40554', 'Master Curls não traz PRO na legenda; não resolve divergência de fórmula.'],
    ['071355.png', 'Oud 41730 e Laboom 46496 de 17 ml; by Virgínia 45171/45170; capilares 40561/40546/40547/40548/40562/40563/40560/40545', 'Parte superior cortada; by Virgínia não classificados como 17/100 ml.'],
    ['071316.png', '12 perfumes 17 ml: 303 VIP, Max Boss, 303 Men, Alem, Fantastica, Venum, Vida, Seduction, Gouf Blue, 303 Woman, Angelical, Blue Sky', 'Rótulos completos/EAN não visíveis.'],
    ['071324.png', '12 perfumes 17 ml: Famma, Easy, Gouf Tradicional, Madame, Scandaloza, Doçurinha, Aventura, Soul, Supremo, Aaliyah, Sublime, Rhino', 'EAN não visível.'],
    ['071255.png', '12 perfumes 17 ml: Capadócia, Cinderela, DG, Grécia, Fera, Maximum, Presidente, Sentimento, VIP Girl, Soberano, VG, Speed', 'Parte inferior cortada, mas nome/volume/código legíveis.'],
    ['071530.png', 'Madame VI 100 ml 40714 - B e Speed Black 100 ml 40727 -B', 'Trecho de outra categoria ignorado.'],
  ]),
  'As 12 imagens foram examinadas individualmente no chat. Nenhuma foi utilizada para substituir imagens comerciais. Nenhum EAN foi lido dessas capturas: os EANs vêm dos blocos textuais. Pequenas diferenças de espaçamento do código no print não substituem a string fornecida no texto.',
  '## Fichas complementadas',
  table([...heading, 'Alteração'], changed.map(product => [...key(product.code), secondReviewAdditions[product.code] ? 'Conteúdo adicional confirmado; ver comparação no JSON de auditoria' : 'Proveniência oficial corroborada; texto anterior preservado'])),
  '## Arquivos e responsabilidade',
  '- lib/product-official-codes.ts: mapa exato de 108 identificações e validação EAN-13.\n- lib/product-content-second-review.ts: complementos editoriais e pares.\n- lib/product-research.ts: aplicação incremental depois da revisão anterior.\n- lib/product-specs.ts: projeção estruturada com origem por campo.\n- components/ProductSpecifications.tsx: apresentação acessível e responsiva.\n- app/produto/[code]/page.tsx: descrição, especificações, uso/precauções e gtin13.\n- tests/second-product-review.test.ts: integridade, variantes e preservação.\n- scripts/audit-second-product-review.mts: auditoria reproduzível, somente SELECT.\n- scripts/test-second-product-review-browser.mjs: validação visual e funcional.\n- docs/product-revision-2-before.json: fotografia editorial anterior.\n- docs/product-revision-2-source.json: todos os 119 blocos integrais, inclusive logística não publicada.\n- docs/product-revision-2-audit.json: correspondências e especificações por produto.\n- docs/product-revision-2-report.md: este relatório.\n- docs/product-revision-2-tests.json: resultados dos testes de navegador.',
  '## Testes',
  'Os resultados atuais de TypeScript, testes automatizados e navegador são registrados no fechamento desta revisão e em product-revision-2-tests.json. Não se declara aprovação só pela geração deste relatório.',
];
writeFileSync('docs/product-revision-2-source.json', JSON.stringify({ sourcePath, sha256: createHash('sha256').update(source).digest('hex'), blocks }, null, 2));
writeFileSync('docs/product-revision-2-audit.json', JSON.stringify({ products: real.map(product => ({ ...product, official: productOfficialCodes[product.code], research: productResearch[product.code], specs: getProductSpecifications(product, productResearch[product.code]) })), unmatched, changedCodes: changed.map(product => product.code) }, null, 2));
writeFileSync('docs/product-revision-2-report.md', report.join('\n\n') + '\n');
console.log(JSON.stringify({ sourceBlocks: blocks.length, matched: real.length, changed: changed.length, unmatched: Object.keys(unmatched).length, validEans: blocks.filter(block => isValidEan13(block.ean)).length }));
