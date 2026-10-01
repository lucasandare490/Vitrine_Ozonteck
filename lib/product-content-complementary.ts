import type { Research } from './product-research';

type Addition = { codes: string[]; summary: string; urls: string[]; missing: string[] };
const perfumeMissing = ['Composição integral e alergênicos', 'Concentração e instruções do fabricante'];
const shop = 'https://ozonteckloja.com.br/';
const reseller = 'https://grupoozonteck.lojavirtualnuvem.com.br/produtos/';

// Retailer descriptions are attributed, not promoted to manufacturer specifications.
export const complementaryAdditions: Addition[] = [
  {
    codes: ['PERF-AALI', 'P100-AALIYAH'],
    summary: 'Aaliyah é uma fragrância feminina da Ozonteck. A descrição da revenda combina uma abertura de bergamota e notas verdes com melão, abacaxi e âmbar no coração. O fundo reúne nuances de madeira, almíscar e baunilha, compondo um perfil frutado e adocicado.',
    urls: [shop + 'perfume-aaliyah-17ml/p', shop + 'perfume-aaliyah-100ml/p'], missing: perfumeMissing,
  },
  {
    codes: ['PERF-OUD', 'P100-OUD'],
    summary: 'Oud Royale é um perfume masculino da Ozonteck com perfil descrito pela revenda como intenso e quente. Pimenta preta, tabaco e abacaxi aparecem na abertura; café, íris e patchouli no coração. Baunilha, âmbar, madeira seca, benjoim e ládano compõem as notas de fundo informadas.',
    urls: [shop + 'perfume-oud-royale-masculino-intenso/p', shop + 'perfume-oud-royale-masculino-intenso-100ml/p'], missing: perfumeMissing,
  },
  {
    codes: ['PERF-RHINO', 'P100-RHINO'],
    summary: 'Rhino Royale é uma fragrância masculina da Ozonteck. A revenda descreve uma abertura aromática de limão, hortelã, manjericão e tomilho, seguida por groselha preta, lavanda, alecrim e jasmim. Almíscar e verbena completam o perfil olfativo publicado.',
    urls: [shop + 'perfume-rhino-royale-exclusivo-masculino/p', shop + 'perfume-rhino-royale-exclusivo-masculino-100ml/p'], missing: perfumeMissing,
  },
  {
    codes: ['PERF-SUBLI', 'P100-SUBLIME'],
    summary: 'Sublime é uma fragrância da Ozonteck que a revenda apresenta com contraste entre flores, especiarias e madeiras. A abertura reúne lavanda, maçã, canela e jacarandá; o coração combina rosa, lírio-do-vale e cedro. No fundo, são citados oud, sândalo, âmbar, baunilha e almíscar.',
    urls: [shop + 'sublime-essencia-marcante/p', shop + 'perfume-sublime-essencia-marcante-100ml/p'], missing: perfumeMissing,
  },
  {
    codes: ['PERF-SUPREMO'],
    summary: 'Supremo Elixir é um perfume masculino da Ozonteck em frasco de 17 ml. A revenda o apresenta como uma fragrância de proposta intensa e marcante, em uma apresentação compacta para levar na bolsa ou na nécessaire.',
    urls: ['https://produtosozonteck.com/categoria-produto/perfumes/perfume-masculino/'],
    missing: [...perfumeMissing, 'Pirâmide olfativa confirmada pelo fabricante'],
  },
  {
    codes: ['PERF-FER-VE'],
    summary: 'Férias no Caribe by Virgínia Esquivel integra a linha de fragrâncias da Ozonteck. Apresentado pela revenda como body splash, é destinado à perfumação corporal e oferece uma opção para incluir a fragrância na rotina de cuidados pessoais.',
    urls: [reseller + 'ferias-no-caribe-by-virginia-esquivel/'],
    missing: [...perfumeMissing, 'Volume e notas olfativas da apresentação vendida'],
  },
  {
    codes: ['PERF-LUA-VE'],
    summary: 'Lua de Mel em Paris by Virgínia Esquivel faz parte da linha de fragrâncias da Ozonteck. A revenda identifica o produto como body splash para perfumação corporal, uma opção para complementar a rotina de cuidados pessoais.',
    urls: [reseller + 'lua-de-mel-em-paris-by-virginia-esquivel/'],
    missing: [...perfumeMissing, 'Volume e notas olfativas da apresentação vendida'],
  },
  {
    codes: ['NUT-AMYNO-CX'],
    summary: 'Amyno Ozon Caixa é a apresentação em caixa do suplemento alimentar em pó da Ozonteck. A ficha complementar da revenda informa 30 unidades e menciona aminoácidos e maltodextrina. Confira no rótulo os ingredientes, as quantidades por porção e as orientações de preparo.',
    urls: [reseller + 'amyno-ozon-caixa-com-30-unidades/'],
    missing: ['Correspondência da caixa com o lote vendido', 'Ingredientes, alergênicos e tabela nutricional completos', 'Peso líquido, porção, preparo e advertências do rótulo'],
  },
  {
    codes: ['NUT-AMYNO-UN'],
    summary: 'Amyno Ozon Unidade é a apresentação individual do suplemento alimentar em pó Amyno Ozon da Ozonteck, cadastrada separadamente da caixa. Para preparar e consumir, confira as instruções da embalagem individual e a quantidade indicada no rótulo.',
    urls: [reseller + 'amyno-ozon-caixa-com-30-unidades/'],
    missing: ['Composição e tabela nutricional da unidade vendida', 'Peso líquido, porção, preparo e advertências do rótulo'],
  },
];

export const complementaryCodes = complementaryAdditions.flatMap(item => item.codes);

export function applyComplementaryContent(records: Record<string, Research>) {
  for (const addition of complementaryAdditions) {
    for (const code of addition.codes) {
      const item = records[code];
      if (!item || item.summary?.trim()) continue;
      item.summary = addition.summary;
      item.editorialReviewed = true;
      item.level = 'complementary';
      item.checkedAt = '2026-09-30';
      item.missing = [...addition.missing];
      item.note = code === 'NUT-AMYNO-UN'
        ? 'Identificação da unidade baseada no catálogo fornecido pela loja. A fonte complementar descreve a caixa da linha; sua fórmula e quantidade não foram transferidas para a unidade.'
        : 'Resumo editorial de fonte complementar de revenda. Não substitui a ficha do fabricante ou o rótulo. Notas olfativas descrevem o aroma, não a lista de ingredientes; não foi atribuída duração de fixação.';
      for (const url of addition.urls) {
        if (!item.sources.some(source => source.url === url)) item.sources.push({ label: 'Ficha de revenda (fonte complementar)', url });
      }
    }
  }
}
