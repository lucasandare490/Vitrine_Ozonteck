// Approved registration batch, 2026-09-30. Commercial values are seed data only.
// Runtime prices and stock always come from Supabase, never from this file.
export type RegistrationProduct = {
  code: string; name: string; category: string; codigoOriginal: string; ean: string;
  price: number; image: string; sourcePosition?: number; line?: string;
  description: string; presentation?: string; actives?: string; components?: string;
  usage?: string[]; precautions?: string[]; missing: string[];
};

export const registrationProducts: RegistrationProduct[] = [
  {
    code: 'NUT-AMYNO-CX', name: 'Amyno Ozon Caixa', category: 'Nutracêuticos',
    codigoOriginal: 'IMP-189', ean: '', price: 299.90, image: 'amynoozoncaixa.webp', sourcePosition: 52,
    description: '', presentation: 'Caixa',
    missing: ['O material apresenta apenas um ponto no lugar da descrição.', 'Quantidade de unidades por caixa, composição, modo de uso e advertências não confirmados.'],
  },
  {
    code: 'NUT-AMYNO-UN', name: 'Amyno Ozon Unidade', category: 'Nutracêuticos',
    codigoOriginal: 'IMP-197', ean: '', price: 10, image: 'amynoozonunidade.webp', sourcePosition: 56,
    description: '', presentation: 'Unidade',
    missing: ['O material apresenta apenas um ponto no lugar da descrição.', 'Composição, quantidade líquida, modo de uso e advertências não confirmados.'],
  },
  {
    code: 'NUT-POWER-UN', name: 'Ozon Power Unidade', category: 'Nutracêuticos',
    codigoOriginal: 'IMP-49', ean: '', price: 10, image: 'ozonpowerunidade.webp', sourcePosition: 59,
    description: 'Ozon Power é um suplemento da Ozonteck apresentado em unidade individual, destinado ao público adulto. O material fornecido descreve uma combinação de vitaminas, minerais, aminoácidos e compostos bioativos, incluindo cafeína. As quantidades por porção e a composição integral não foram informadas.',
    presentation: 'Unidade',
    components: 'Vitaminas B1, B2, B5, B6, B12 e C; coenzima Q10; taurina; tirosina; arginina; cafeína; trans-resveratrol. Relação parcial informada no catálogo, sem quantidades por porção.',
    missing: ['Composição integral, minerais específicos, dosagem, modo de uso e advertências do rótulo.'],
  },
  {
    code: 'NUT-MUNITY-UN', name: 'Ozon Munity Unidade', category: 'Nutracêuticos',
    codigoOriginal: 'IMP-48', ean: '', price: 10, image: 'ozonmunityunidade.webp', sourcePosition: 61,
    description: 'Ozon Munity é um suplemento da Ozonteck na apresentação individual. O catálogo descreve uma combinação de carboidratos, vitaminas, minerais e fibras solúveis, com maltodextrina entre os componentes citados. Não foram informadas as quantidades por porção nem a composição integral.',
    presentation: 'Unidade', components: 'Maltodextrina; mix de vitaminas e minerais; fibras solúveis. O catálogo não discrimina as vitaminas, minerais e fibras nem suas quantidades.',
    missing: ['Composição integral, dosagem, modo de uso e advertências do rótulo.'],
  },
  {
    code: 'BE-SER-LUM', name: 'Sérum Facial Lumino3', category: 'Bem Estar',
    codigoOriginal: '40566', ean: '7898760210585', price: 175.90, image: 'serumfaciallumino3.webp', sourcePosition: 73,
    description: 'O Sérum Facial Ozonizado Lumino3 da Ozonteck é destinado aos cuidados da pele do rosto. O catálogo apresenta uma proposta de hidratação e cuidado da aparência da pele, com vitamina C e ácido hialurônico entre os ativos destacados, e o indica para todos os tipos de pele.',
    actives: 'Vitamina C e ácido hialurônico; o catálogo também descreve tecnologia ozonizada, sem especificar a composição integral.',
    missing: ['Modo de uso, precauções, concentrações e lista integral de ingredientes.'],
  },
  {
    code: 'CAP-CO-KES', name: 'Condicionador Ozon-Kesen', category: 'Cuidados Capilares',
    codigoOriginal: '40548', ean: '7898996428235', price: 109.90, image: 'condicionadorozonkesen.webp', sourcePosition: 83, line: 'ozon-kesen',
    description: 'O Condicionador Ozon-Kesen Pós-Química é destinado a cabelos submetidos a coloração, alisamento ou relaxamento e a fios ressecados por fatores como uso de chapinha e exposição ao sol. A fórmula descrita no catálogo combina manteiga de cupuaçu ozonizada e queratina para condicionar os fios, proporcionar maciez e brilho e ajudar a preservar a umidade.',
    actives: 'Manteiga de cupuaçu ozonizada e queratina.',
    usage: ['Após lavar os cabelos com o Shampoo Ozon-Kesen e aplicar a Máscara Ozon-Kesen, distribua o condicionador por todo o comprimento.', 'Deixe agir por alguns minutos e enxágue abundantemente. O catálogo não informa um tempo exato.'],
    precautions: ['Uso externo. Evite contato com os olhos; em caso de contato, enxágue abundantemente com água.', 'Mantenha fora do alcance de crianças. Faça um teste de alergia antes do primeiro uso.', 'Armazene em local fresco e seco, longe da luz solar direta. Siga as instruções do rótulo.'],
    missing: ['Composição integral e tempo exato de pausa.'],
  },
  {
    code: 'CAP-PRO-KES', name: 'Pro Kesen', category: 'Cuidados Capilares',
    codigoOriginal: '40544', ean: '7898760210097', price: 499.90, image: 'prokesen.webp', sourcePosition: 90,
    description: 'O Reestruturador Ozonizado Pro Kesen é uma máscara capilar da Ozonteck voltada à redução e ao controle do volume e do frizz. O catálogo descreve a combinação da tecnologia ozonizada com ácidos hialurônico e lático, óleos e silicone, com proposta de alinhamento, maciez, brilho e melhora do aspecto dos fios danificados. A marca menciona diferentes formas de aplicação para alinhar os fios ou soltar os cachos, mas o material não apresenta o protocolo de cada procedimento.',
    actives: 'Ácidos hialurônico e lático; óleos e silicone não discriminados. Não corresponde à composição integral.',
    precautions: ['Realize teste de mecha antes da aplicação em todo o cabelo e teste de sensibilidade antes do uso.', 'Use luvas na aplicação. Uso externo. Não aplique sobre pele irritada ou lesionada.', 'Em caso de irritação, suspenda imediatamente o uso. Evite contato com os olhos.', 'Mantenha fora do alcance de crianças. Conserve em temperatura ambiente, longe do calor e da luz.', 'Para uso durante a gravidez, consulte um médico.'],
    missing: ['Protocolo de aplicação, tempo de pausa, eventual uso de calor e composição integral. O peso logístico de 1963 g não comprova volume líquido.'],
  },
  {
    code: 'CAP-AT-MC', name: 'Ativador Master Curls', category: 'Cuidados Capilares',
    codigoOriginal: '40559', ean: '7898996428228', price: 119.90, image: 'ativadormastercurls.webp', sourcePosition: 93, line: 'master-curls',
    description: 'O Ativador de Cachos Ozonizado da linha Master Curls da Ozonteck é destinado à finalização dos cabelos cacheados. O catálogo apresenta uma proposta de hidratação e definição dos cachos, para aplicação mecha a mecha após o uso do shampoo e da máscara da linha.',
    usage: ['Após lavar com o Shampoo Master Curls e aplicar a Máscara Master Curls, respeite a pausa da máscara e enxágue.', 'Distribua uma pequena quantidade do ativador mecha a mecha por toda a extensão dos fios.', 'Finalize como desejar, deixando secar naturalmente ou utilizando um método de secagem.'],
    precautions: ['Uso externo. Evite contato com os olhos e mantenha fora do alcance das crianças.', 'Em caso de dúvida, faça um teste de alergia antes do primeiro uso.', 'Armazene em local fresco e seco, longe da luz solar direta. Siga as instruções do rótulo.'],
    missing: ['Composição integral. O catálogo não especifica proteção térmica nem protocolo de secagem.'],
  },
  {
    code: 'CAP-CO-MEL', name: 'Condicionador Mel & Ozônio', category: 'Cuidados Capilares',
    codigoOriginal: '40551', ean: '7898996428266', price: 109.90, image: 'condicionadormelozonio.webp', sourcePosition: 95, line: 'mel-ozonio',
    description: 'O Condicionador Mel & Ozônio da Ozonteck é destinado ao cuidado de cabelos fragilizados e sem vida. O catálogo descreve uma proposta de hidratação, maciez, sedosidade e brilho, com óleo de girassol ozonizado, extrato de mel, geleia real e vitaminas A, D e E entre os componentes destacados.',
    actives: 'Óleo de girassol ozonizado; extrato de mel; geleia real; vitaminas A, D e E.',
    missing: ['Composição integral, modo de uso e precauções específicos deste condicionador.'],
  },
  {
    code: 'BE-TOQUE-LUM', name: 'Toque Luminoso', category: 'Bem Estar',
    codigoOriginal: 'IMP-206', ean: '', price: 565.60, image: 'toqueluminoso.webp',
    description: '', presentation: 'Kit', missing: ['Somente imagem fornecida; descrição, composição do kit e EAN não confirmados.'],
  },
  {
    code: 'BE-XBOOST-269', name: 'Energético Xbooster 269 ml', category: 'Bem Estar',
    codigoOriginal: 'IMP-99', ean: '', price: 27.80, image: 'energeticoxbooster269ml.webp',
    description: '', presentation: 'Lata de 269 ml', missing: ['Somente imagem fornecida; ingredientes, informação nutricional, advertências e EAN não confirmados. Não confundir com Xbooster em cápsulas.'],
  },
];
