import type { Research } from './product-research';

// Additive reconciliation of the complete official catalog supplied by the owner.
// Commercial promises, logistics weights and unresolved formula conflicts are not imported.
export const secondReviewAdditions: Record<string, { description?: string; sections: NonNullable<Research['sections']> }> = {
  'BE-OX3': { sections: [{ title: 'Outros componentes citados', items: ['O catálogo também menciona vitaminas A, B, C e E e ácidos graxos essenciais, sem informar concentrações ou a lista integral de ingredientes.'] }] },
  'CAP-O-ACAI': { sections: [{ title: 'Modo de uso publicado', items: ['A marca menciona uso diário, de duas a três vezes ao dia conforme o tipo de cabelo, sem fornecer quantidade por aplicação. Confira as instruções do lote.', 'O catálogo também menciona aplicação antes da escova ou do modelador e adição a máscaras para a proposta de nutrição. Não foi inferida proporção de mistura.'] }] },
  'CAP-MAS-OK': { sections: [{ title: 'Precaução adicional da marca', items: ['O catálogo recomenda teste de sensibilidade antes do primeiro uso, além dos cuidados já informados nesta ficha.'] }] },
  'CAP-MAS-MC': { sections: [{ title: 'Precaução adicional da marca', items: ['O catálogo recomenda teste de sensibilidade antes do primeiro uso. O texto usa a denominação Master Curls PRO, enquanto a foto e o cadastro dizem Master Curls; confira a correspondência das instruções com seu rótulo.'] }] },
  'PERF-EASY': {
    description: 'Easy Line é uma fragrância masculina amadeirada que combina frescor frutado, nuances herbáceas e um fundo quente. Maçã, gengibre e bergamota abrem a composição; sálvia, zimbro e gerânio formam o coração. Madeira de âmbar, fava tonka, cedro, vetiver e olíbano completam o perfil, apresentado pela marca para ocasiões casuais e formais.',
    sections: [
      { title: 'Família olfativa', items: ['Amadeirado'] },
      { title: 'Notas de saída', items: ['Maçã, gengibre e bergamota'] },
      { title: 'Notas de coração', items: ['Sálvia, bagas de zimbro (junípero) e gerânio'] },
      { title: 'Notas de fundo', items: ['Madeira de âmbar, fava tonka, cedro, vetiver e olíbano'] },
    ],
  },
  'PERF-LABOOM': {
    description: 'Laboom é uma fragrância feminina de abertura frutada, coração floral e acabamento quente de baunilha. O material da marca descreve frutas exóticas e flores delicadas, sem nomear espécies ou publicar uma pirâmide completa. O contraste entre frescor, flores e cremosidade compõe uma proposta versátil, para o dia e ocasiões à noite.',
    sections: [{ title: 'Perfil olfativo', items: ['Abertura frutada; coração floral; fundo com baunilha. A fonte não identifica as frutas e flores nem declara uma família olfativa formal.'] }],
  },
  'BE-TRIX': {
    description: 'Ozon Trix é um desodorante ozonizado em spray de 30 ml para o cuidado das axilas. O catálogo destaca ácido kójico, ácido hialurônico e extrato de alcaçuz, associados à tecnologia comercial Matrix 3D. A marca apresenta uma fórmula leve, sem alumínio e com acabamento que não deixa resíduo branco, voltada ao controle do odor e à hidratação da pele.',
    sections: [
      { title: 'Ativos destacados', items: ['Ácido kójico, ácido hialurônico e extrato de alcaçuz. Matrix 3D é uma tecnologia comercial citada, não a composição integral.'] },
      { title: 'Características da fórmula', items: ['A marca declara ausência de alumínio e tecnologia invisible, destinada a evitar resíduo branco na pele e nos tecidos.', 'O texto apresenta uma proposta cosmética de uniformização gradual do tom das axilas, sem fornecer prazo ou resultado garantido.'] },
    ],
  },
  'BE-HAY': {
    sections: [{ title: 'Textura e acabamento', items: ['O catálogo descreve textura leve, rápida absorção e um complexo de extratos vegetais, sem identificar cada planta.', 'A menção a ureia no catálogo difere de hydroxyethyl urea no rótulo fotografado. Não foram tratadas como o mesmo ingrediente; confirme a fórmula do lote.'] }],
  },
  'CAP-SH-MEL': {
    description: 'Shampoo Mel & Ozônio é um shampoo de 300 ml para a limpeza suave de cabelos fragilizados e opacos. O catálogo destaca extrato de mel, geleia real, óleo de girassol ozonizado e vitaminas A, D e E. A proposta cosmética combina limpeza dos fios e do couro cabeludo com maciez, nutrição e brilho, sem divulgar a lista completa de ingredientes.',
    sections: [
      { title: 'Ativos destacados', items: ['Extrato de mel, geleia real, óleo de girassol ozonizado e vitaminas A, D e E. Lista de destaques, não composição integral.'] },
      { title: 'Modo de uso', items: ['Aplicar nos cabelos úmidos, massagear suavemente até formar espuma e enxaguar bem. Repetir se necessário, conforme a orientação do catálogo.'] },
      { title: 'Precauções', items: ['Uso externo. Manter em local fresco, arejado e protegido da luz, fora do alcance de crianças.', 'Evitar os olhos; em caso de contato, enxaguar com água. Interromper em caso de irritação e procurar orientação médica.'] },
    ],
  },
  'CAP-MAS-MEL': {
    description: 'Máscara Mel & Ozônio é um tratamento capilar que reúne extrato de mel, geleia real e óleo de girassol ozonizado, segundo o catálogo. A proposta é nutrir e condicionar os fios, favorecendo maciez, maleabilidade e brilho. O material identifica a máscara para cabelos oleosos e muito oleosos; não informa quantidade por aplicação ou tempo de pausa.',
    sections: [
      { title: 'Ativos destacados', items: ['Extrato de mel, geleia real e óleo de girassol ozonizado. As concentrações e a lista integral de ingredientes não foram fornecidas.'] },
      { title: 'Indicação publicada', items: ['Cabelos oleosos e muito oleosos, conforme o texto do catálogo desta apresentação.'] },
    ],
  },
  'NUT-NXCAP': {
    sections: [{ title: 'Componentes conhecidos', items: ['Mix de óleos e vitamina E. O catálogo não identifica todos os óleos nem suas quantidades.'] }],
  },
  'NUT-OMEGA': {
    sections: [{ title: 'Componentes conhecidos', items: ['Óleo de peixe, fonte de ômega 3. O catálogo cita EPA e DHA, sem discriminar os teores por cápsula ou porção.'] }],
  },
  'NUT-LEV-UN': {
    sections: [
      { title: 'Componentes conhecidos', items: ['Polidextrose, couve em pó, espinafre, espirulina, cúrcuma e gengibre, conforme o catálogo. Vitaminas, minerais e antioxidantes são mencionados sem quantidades; não é a lista integral de ingredientes.'] },
      { title: 'Modo de preparo publicado', items: ['O catálogo menciona preparo com água fria ou quente, como chá. Não informa volume de água nem dose diária: siga as instruções da embalagem.'] },
    ],
  },
  'NUT-COBAL': {
    sections: [{ title: 'Informação confirmada no catálogo', items: ['Vitamina B12 na forma de metilcobalamina, em frasco com 30 comprimidos mastigáveis.', 'O catálogo descreve sabor natural de limão; a embalagem já fotografada informa mousse de limão. A descrição anterior foi preservada, sem presumir equivalência de formulação.'] }],
  },
  'CAP-KIDS-SH': { sections: [{ title: 'Público informado pela marca', items: ['O catálogo indica shampoo para crianças de todas as idades e uso diário. Confira as instruções e a faixa etária no rótulo do lote; baixa irritabilidade não significa ausência de alergias.'] }] },
  'CAP-KIDS-CO': { sections: [{ title: 'Público informado pela marca', items: ['O catálogo indica condicionador para crianças de todas as idades e uso diário. Confira a aplicação e a faixa etária na embalagem.'] }] },
  'CAP-FOR-MEN': { sections: [{ title: 'Outros destaques do catálogo', items: ['A descrição também cita biotina e ômegas 3, 6, 7 e 9, sem informar concentrações. A relação não substitui a composição integral do rótulo.'] }] },
};

export const perfumePairs: [string, string][] = [
  ['PERF-OUD', 'P100-OUD'], ['PERF-AALI', 'P100-AALIYAH'],
  ['PERF-RHINO', 'P100-RHINO'], ['PERF-SUBLI', 'P100-SUBLIME'],
  ['PERF-SCAN', 'P100-SCAN'], ['PERF-VIDA', 'P100-VIDA'],
  ['PERF-SOBERANO', 'P100-SOB'], ['PERF-SENTIMENTO', 'P100-SENT'],
  ['PERF-PRESIDENTE', 'P100-PRES'], ['PERF-MAX-B', 'P100-MAXBOSS'],
  ['PERF-VG', 'P100-VG'], ['PERF-CIND', 'P100-CIND'],
  ['PERF-MAD', 'P100-MADAME'], ['PERF-SPEED', 'P100-SPEED'],
];

export function applySecondReview(records: Record<string, Research>) {
  for (const [code, update] of Object.entries(secondReviewAdditions)) {
    const item = records[code];
    if (update.description) item.summary = update.description;
    item.sections = [...(item.sections || []), ...update.sections];
    if (update.description) item.editorialReviewed = true;
    item.checkedAt = '2026-09-28';
  }
  // Only obsolete absence-of-information notices are removed; the source snapshot is retained in docs.
  for (const code of ['CAP-SH-MEL', 'CAP-MAS-MEL']) {
    records[code].sections = records[code].sections?.filter(section => !['Identificação da linha', 'Limpeza dos fios'].includes(section.title));
  }
  records['BE-TRIX'].sections = records['BE-TRIX'].sections?.filter(section => section.title !== 'Componente destacado');
  for (const code of ['PERF-EASY', 'PERF-LABOOM', 'BE-TRIX', 'CAP-SH-MEL', 'CAP-MAS-MEL', 'PRO-AMR', 'PRO-CIF', 'PRO-HMS', 'PRO-LPC', 'PRO-DEEP', 'PRO-SOFT']) {
    records[code].level = 'official';
    records[code].suppliedOfficialCatalog = true;
    records[code].checkedAt = '2026-09-28';
    records[code].note = 'Conteúdo do catálogo oficial fornecido pelo responsável pela loja em 28/09/2026, conciliado com as referências anteriores, mantidas abaixo. Dados logísticos não foram tratados como conteúdo líquido.';
  }
  for (const code of ['PERF-EASY', 'PERF-LABOOM']) records[code].missing = ['Ingredientes, concentração e instruções completas do rótulo'];
  records['CAP-SH-MEL'].missing = ['Composição integral e correspondência com o rótulo do lote adquirido'];
  records['NUT-LEV-UN'].note += ' O catálogo menciona sabor abacaxi, gengibre e hortelã; a foto anterior informa abacaxi com hortelã. Não foi alterado o sabor da ficha sem confirmação.';

  // The new 120 g products have different official identities from the former lotions.
  // Keep the previous wording in the audit snapshot, not as claims about the new formula.
  for (const [code, name, formerCode, formerEan] of [
    ['BE-HID-SB', 'Speed Black', '40565', '7898760210134'],
    ['BE-HID-VG', 'VG Sexy', '405640', '7898760210127'],
  ]) {
    const item = records[code];
    item.summary = `Hidratante ${name} ozonizado na apresentação de 120 g. O catálogo identifica esta versão como nova fórmula. A composição, o perfil da fragrância e as instruções de uso desta apresentação ainda precisam ser confirmados no rótulo.`;
    item.sections = [{ title: 'Sobre esta apresentação', items: [
      `A loção anterior, de código original ${formerCode} e EAN ${formerEan}, é uma apresentação distinta. Seus ingredientes, notas e indicação não foram atribuídos ao hidratante de 120 g.`,
      'Consulte o rótulo da nova fórmula para confirmar ingredientes, público, modo de uso e precauções.',
    ] }];
    item.details = [];
    item.editorialReviewed = true;
    item.suppliedOfficialCatalog = true;
    item.level = 'official';
    item.checkedAt = '2026-09-29';
    item.missing = ['Composição, perfil da fragrância, público, modo de uso e precauções da nova fórmula de 120 g'];
    item.note = 'Identidade e apresentação conferidas na lista e nas imagens reenviadas em 29/09/2026. As referências anteriores abaixo descrevem a loção antiga e não comprovam a fórmula de 120 g. O texto histórico permanece no registro da revisão, sem aplicação à nova apresentação.';
  }
}
