import type { Research } from './product-research';
import { matchesPerfumeryVolume } from './perfumery-filter.ts';
import { productOfficialCodes } from './product-official-codes.ts';

export type Specification = { label: string; value: string; origin: string; group?: 'olfactory' | 'identity' };
const lines: Record<string, string> = {
  'ozon-kesen': 'Ozon-Kesen', 'ozon-blond': 'Ozon Blond', 'master-curls': 'Master Curls',
  kids: 'Kids Ozon Splash', wo3: 'WO3 / Ozone Hair System', 'ozon-creat': 'Ozon Creat',
  'ozon-creat-morango': 'Ozon Creat', 'ozon-flex': 'Ozon Flex',
  'mel-ozonio': 'Mel & Ozônio',
};
const activeHighlights: Record<string, string> = {
  'BE-SOFH': 'Óleo de girassol ozonizado; não é a composição integral.',
  'BE-OX3': 'Extrato de bardana e micropartículas de mica natural.',
  'BE-SHII': 'Arnica, pimenta, gengibre, camélia, alecrim, salicilato de metila, cânfora e mentol.',
  'BE-PURE': 'Polímeros condicionantes em base aquosa ozonizada.',
  'BE-TRIX': 'Ácido kójico, ácido hialurônico e extrato de alcaçuz. Tecnologia comercial Matrix 3D.',
  'CAP-AMP-SF': 'Nanoaminoácidos e queratina de baixo peso molecular.',
  'CAP-SH-OK': 'Queratina e manteiga de cupuaçu.',
  'CAP-MAS-OK': 'Manteiga de cupuaçu e queratina.',
  'CAP-SH-MC': 'Óleos de argan e macadâmia.',
  'CAP-MAS-MC': 'Óleo de argan e proteínas hidrolisadas.',
  'CAP-O-ACAI': 'Açaí e silicones voláteis de diferentes pesos moleculares.',
  'CAP-O-CREAM': 'Extrato de baobá, silicones e sistema de gel lamelar.',
  'CAP-FOR-MEN': 'Mentol, óleo de macadâmia e biotina; a marca também cita ômegas 3, 6, 7 e 9 e Matrix 3D.',
  'CAP-TON': 'Blends vegetais e mentol; as plantas não são discriminadas.',
  'CAP-SH-BL': 'Extratos de violeta e camomila; agentes matizadores.',
  'CAP-MAS-BL': 'Extratos de violeta e camomila; agentes matizadores.',
  'CAP-SH-MEL': 'Extrato de mel, geleia real, óleo de girassol ozonizado e vitaminas A, D e E.',
  'CAP-MAS-MEL': 'Extrato de mel, geleia real e óleo de girassol ozonizado.',
  'CAP-KIDS-SH': 'Extratos de frutas vermelhas e banana.',
  'CAP-KIDS-CO': 'Extratos de frutas vermelhas e banana.',
  'CAP-KIDS-LE': 'Extratos de frutas vermelhas e banana.',
  'PRO-AMR': 'Blend de aminoácidos e tecnologia comercial WO3 Quantic Complex.',
  'PRO-CIF': 'Complexo de proteínas, peptídeos e tecnologia comercial WO3 Quantic Complex.',
  'PRO-HMS': 'Agentes umectantes e tecnologia comercial WO3 Quantic Complex.',
  'PRO-LPC': 'Blend de lipídios nutritivos e tecnologia comercial WO3 Quantic Complex.',
  'PRO-SOFT': 'Tecnologia comercial WO3 Quantic Complex; ingredientes não discriminados.',
  'PRO-DEEP': 'Tecnologia comercial WO3 Quantic Complex; ingredientes não discriminados.',
};
const masculine = new Set(['PERF-CAPA', 'PERF-FERA', 'PERF-MAXIMUM', 'PERF-PRESIDENTE', 'P100-PRES', 'PERF-SENTIMENTO', 'P100-SENT', 'PERF-SOBERANO', 'P100-SOB', 'PERF-SPEED', 'P100-SPEED', 'PERF-303-VIP', 'PERF-MAX-B', 'P100-MAXBOSS', 'PERF-303-M', 'PERF-GOUF-B', 'PERF-EASY', 'PERF-GOUF-T']);
const feminine = new Set(['PERF-CIND', 'P100-CIND', 'PERF-DG', 'PERF-GREC', 'PERF-VIP-GIRL', 'PERF-VG', 'P100-VG', 'PERF-FANT', 'PERF-VIDA', 'P100-VIDA', 'PERF-SEDUC', 'PERF-303-W', 'PERF-ANGE', 'PERF-FAMMA', 'PERF-MAD', 'P100-MADAME', 'PERF-SCAN', 'P100-SCAN', 'PERF-LABOOM']);

// Sections moved in full, never split by punctuation or discarded during projection.
export const structuredSectionTitles = new Set(['Família olfativa', 'Notas de saída', 'Notas de coração', 'Notas de corpo', 'Notas de fundo', 'Apresentação']);

export function getProductSpecifications(product: { code: string; category: string }, research?: Pick<Research, 'line' | 'sections'>, options: { legacyHighlights?: boolean } = {}): Specification[] {
  if (!research) return [];
  const { code, category } = product;
  const result: Specification[] = [];
  const add = (label: string, value: string | undefined, origin: string, group?: Specification['group']) => {
    if (value?.trim() && value.trim() !== '.') result.push({ label, value, origin, ...(group ? { group } : {}) });
  };
  add('Categoria', category, 'cadastro existente');
  add('Linha', lines[research.line || ''] || (['CAP-MAS-MEL', 'CAP-SH-MEL'].includes(code) ? 'Mel & Ozônio' : undefined), 'ficha atual + catálogo oficial');
  const presentation = research.sections?.find(section => section.title === 'Apresentação')?.items.join(' ');
  const perfumeVolume = category === 'Perfumaria' ? matchesPerfumeryVolume(code, '17') ? '17 ml' : matchesPerfumeryVolume(code, '100') ? '100 ml' : undefined : undefined;
  add('Apresentação', perfumeVolume || presentation || (['BE-HID-SB', 'BE-HID-VG'].includes(code) ? '120 g' : code === 'BE-HAY' ? '120 g, com válvula dosadora' : code === 'BE-TRIX' ? 'Spray de 30 ml' : undefined), perfumeVolume || ['BE-HID-SB', 'BE-HID-VG'].includes(code) ? 'catálogo oficial + imagens fornecidas' : 'ficha atual / rótulo fotografado');
  add('Público', masculine.has(code) ? 'Masculino' : feminine.has(code) ? 'Feminino' : ['CAP-KIDS-SH', 'CAP-KIDS-CO'].includes(code) ? 'Infantil; a marca informa todas as idades. Confira o rótulo.' : code === 'CAP-KIDS-LE' ? 'Infantil, a partir de 3 anos; confirmar no rótulo.' : undefined, 'catálogo oficial');
  const content = (research.sections || []).flatMap(section => section.items).join(' ');
  if (/uso externo/i.test(content)) add('Tipo de uso', 'Uso externo', 'ficha atual + catálogo oficial');
  for (const [label, title] of [['Família olfativa', 'Família olfativa'], ['Notas de saída', 'Notas de saída'], ['Notas de corpo', 'Notas de coração'], ['Notas de fundo', 'Notas de fundo']]) {
    add(label, research.sections?.find(section => section.title === title)?.items.join(' '), 'catálogo oficial; ficha anterior preservada nas divergências', 'olfactory');
  }
  const exactActives = research.sections?.find(section => section.title === 'Ativos destacados');
  add('Ativos destacados', exactActives?.items.join(' ') || (options.legacyHighlights !== false ? activeHighlights[code] : undefined), code === 'BE-SOFH' ? 'ficha atual / fonte complementar' : 'catálogo oficial');
  if (code === 'BE-HAY' && options.legacyHighlights !== false) add('Ativos destacados', 'Manteiga de karité; hydroxyethyl urea no rótulo fotografado. O catálogo cita ureia, sem equivalência confirmada.', 'ficha atual; divergência registrada');
  if (category === 'Nutracêuticos') {
    const components = research.sections?.find(section => section.title === 'Componentes conhecidos') || research.sections?.find(section => section.title === 'Componentes destacados');
    add('Componentes conhecidos', components?.items.join(' '), components?.title === 'Componentes conhecidos' ? 'catálogo oficial' : 'ficha atual / rótulo fotografado');
  }
  const identity = productOfficialCodes[code];
  add('Código original (Grupo Ozonteck)', identity?.codigoOriginal, 'catálogo oficial', 'identity');
  add('Código EAN', identity?.ean, 'catálogo oficial', 'identity');
  return result;
}

export function getProductReadingSections(research: Pick<Research, 'sections'> | undefined, specifications: Specification[]) {
  return research?.sections?.filter(section => !structuredSectionTitles.has(section.title)
    && !specifications.some(field => field.value === section.items.join(' ')));
}
