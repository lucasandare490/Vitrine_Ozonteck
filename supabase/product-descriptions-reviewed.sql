-- Revisao editorial parcial em 2026-09-25. Execute somente apos revisar os textos.
-- Preenche apenas descricoes vazias. Nao altera precos, estoque, imagens, RLS ou pedidos.
-- A manutencao posterior continua no campo Descricao do painel de produtos.
begin;
with reviewed(code, description) as (values
('BE-SOFH', $text$Óleo ozonizado para cuidados externos da pele. A marca apresenta o Sofh como um produto de hidratação para a rotina corporal.

Uso externo: não ingerir e evitar contato com os olhos. Confirme no rótulo o modo de aplicação e as precauções da apresentação adquirida. Não é medicamento.

Fonte: https://grupoozonteck.com/produtos/oleo-sofh$text$),
('BE-OX3', $text$Sabonete para a limpeza das mãos e do corpo. A descrição do fabricante destaca extrato de bardana e partículas de mica perolada na formulação.

Consulte o rótulo para a composição completa e o modo de uso. Não substitui orientação dermatológica.

Fonte: https://grupoozonteck.com/produtos/sabonete-ox3$text$),
('BE-SHII', $text$Gel de massagem corporal com proposta de sensação refrescante. A marca informa a presença de mentol e cânfora na descrição da fórmula.

Uso externo. A página do fabricante orienta não utilizar durante a gravidez nem em crianças menores de 7 anos, e evitar os olhos e a pele irritada. Confira também as advertências do rótulo.

Fonte: https://grupoozonteck.com/produtos/life-shii$text$),
('BE-LUSH', $text$Esfoliante facial voltado à remoção de células mortas da superfície da pele, conforme a apresentação do fabricante.

Antes de usar, consulte no rótulo a frequência indicada, a composição completa e as precauções. A página consultada não permite confirmar todos esses detalhes para a apresentação disponível na loja.

Fonte: https://grupoozonteck.com/produtos/esfoliante-oxylush$text$),
('BE-FRESH', $text$Creme dental da linha Ozon Fresh, destinado à higiene bucal.

Não ingerir. A página do fabricante informa restrição para menores de 6 anos. Siga o rótulo da apresentação adquirida e a orientação do dentista; interrompa o uso em caso de reação.

Fonte: https://grupoozonteck.com/produtos/ozon-fresh$text$),
('CAP-AMP-SF', $text$Ampola de cuidado capilar Soft Hair. A marca destaca nanoaminoácidos e queratina de baixo peso molecular na descrição do produto, com proposta de hidratação e cuidado dos fios danificados.

Confirme no rótulo a quantidade por aplicação, o tempo de pausa e a necessidade de enxágue. Esses detalhes não foram confirmados para a apresentação cadastrada.

Fonte: https://grupoozonteck.com/produtos/ampola-soft-hair$text$),
('CAP-SH-OK', $text$Shampoo da linha Ozon-Kesen para a rotina de cuidado de cabelos após processos químicos. A descrição oficial destaca queratina e manteiga de cupuaçu na formulação.

Segundo a marca, deve ser aplicado nos cabelos molhados, massageado e enxaguado completamente. Uso externo; evite contato com os olhos e confira as instruções da embalagem.

Fonte: https://grupoozonteck.com/produtos/shampoo-ozon-kesen$text$),
('CAP-MAS-OK', $text$Máscara capilar da linha Ozon-Kesen, apresentada pelo fabricante para o cuidado pós-química. Sua descrição destaca manteiga de cupuaçu e queratina, com proposta de hidratação e maciez.

Aplicar após a lavagem e enxaguar conforme as instruções do rótulo. Confirme o tempo de pausa da apresentação adquirida. Uso externo; evite contato com os olhos.

Fonte: https://grupoozonteck.com/produtos/mascara-ozon-kesen$text$),
('CAP-O-ACAI', $text$Óleo capilar Açaí Fusion, apresentado pela marca como reparador de pontas e finalizador. A proposta cosmética inclui brilho, maciez e redução do frizz.

Confira no rótulo a quantidade adequada ao seu cabelo e as orientações de aplicação. A composição integral e o volume desta apresentação devem ser confirmados na embalagem.

Fonte: https://grupoozonteck.com/produtos/oleo-de-acai$text$),
('CAP-O-CREAM', $text$Fluido capilar multifuncional Ozon Cream. A descrição da marca destaca extrato de baobá e silicones, com proposta de condicionamento, maciez e controle do frizz.

Consulte a embalagem para confirmar o modo de aplicação e a composição completa. Benefícios cosméticos podem variar conforme o cabelo e a rotina de uso.

Fonte: https://grupoozonteck.com/produtos/ozon-cream$text$),
('CAP-FOR-MEN', $text$Shampoo 2 em 1 Ozon For Men, destinado à limpeza e ao condicionamento capilar. O fabricante destaca mentol e óleo de macadâmia na descrição da fórmula.

Consulte as instruções e advertências da embalagem. Em caso de irritação persistente ou condições do couro cabeludo, procure orientação profissional; este texto não atribui ao produto tratamento de doenças.

Fonte: https://grupoozonteck.com/produtos/ozon-for-men$text$),
('CAP-SH-MC', $text$Shampoo Master Curls para cabelos cacheados, ondulados e crespos. A página oficial destaca óleos de argan e macadâmia na proposta de limpeza e cuidado dos fios.

Aplicar nos cabelos úmidos, massagear e enxaguar, conforme a orientação publicada pela marca. Verifique também o rótulo da apresentação adquirida. Uso externo.

Fonte: https://grupoozonteck.com/produtos/shampoo-master-curls$text$),
('CAP-MAS-MC', $text$Máscara Master Curls para a rotina de cabelos cacheados, crespos e ondulados. A marca destaca óleo de argan e proteínas hidrolisadas, com proposta de hidratação, brilho e controle do frizz.

Utilizar após a lavagem, distribuindo pelos fios e enxaguando conforme o rótulo. Confirme na embalagem o tempo de pausa. Uso externo.

Fonte: https://grupoozonteck.com/produtos/mascara-master-curls$text$),
('CAP-KIDS-SH', $text$Shampoo infantil da linha Kids Ozon Splash. A descrição oficial destaca extratos de frutas vermelhas e banana e uma proposta de limpeza suave dos cabelos infantis.

Confira a faixa etária, o modo de uso e as advertências no rótulo da apresentação adquirida. A descrição não substitui a avaliação de sensibilidade individual.

Fonte: https://grupoozonteck.com/produtos/shampoo-kids$text$),
('CAP-KIDS-CO', $text$Condicionador infantil Kids Ozon Splash, destinado ao condicionamento e à maciez dos cabelos. A marca destaca extratos de frutas vermelhas e banana na descrição da linha.

Confirme na embalagem a faixa etária, o modo de aplicação e o enxágue. Use de acordo com as instruções do fabricante.

Fonte: https://grupoozonteck.com/produtos/condicionador-kids$text$),
('CAP-KIDS-LE', $text$Leave-in infantil Kids Ozon Splash para finalizar e facilitar o desembaraço dos cabelos. A marca também o apresenta como creme para pentear e ativador de cachos.

A página oficial informa uso a partir de 3 anos. Confira a faixa etária e as instruções no rótulo antes da aplicação.

Fonte: https://grupoozonteck.com/produtos/leave-in-kids$text$),
('NUT-XBOOST', $text$Suplemento alimentar Xbooster. A descrição do fabricante informa arginina, taurina e cafeína na composição.

Confira no rótulo as quantidades, a porção recomendada, os ingredientes completos e as restrições de consumo. Não é medicamento e não deve ser utilizado como promessa de tratamento ou resultado garantido.

Fonte: https://grupoozonteck.com/produtos/xbooster$text$),
('NUT-OMEGA', $text$Suplemento alimentar em cápsulas à base de óleo de peixe, segundo a página oficial da marca.

Verifique na embalagem os teores de EPA e DHA, os ingredientes, os alergênicos e as orientações de consumo da apresentação adquirida. Não foram confirmadas as quantidades por cápsula nesta pesquisa.

Fonte: https://grupoozonteck.com/produtos/omega-3$text$),
('NUT-TRIMAG', $text$Suplemento alimentar Tri Magnésio. A descrição oficial informa uma combinação de três tipos de magnésio e cúrcuma.

As formas específicas, suas quantidades e a porção recomendada devem ser confirmadas no rótulo. Este texto não atribui ao suplemento prevenção ou tratamento de doenças.

Fonte: https://grupoozonteck.com/produtos/tri-magnesio$text$),
('PERF-CAPA', $text$Capadócia é apresentado pela marca como uma fragrância da família fougère aromática. A descrição oficial menciona lavanda, limão e bergamota entre as notas de abertura.

A apresentação e o preço exibidos nesta loja são os do cadastro local. Consulte a embalagem para composição, advertências e conteúdo líquido.

Fonte: https://grupoozonteck.com/produtos/capadocia$text$),
('AC-SQUEEZE', $text$Squeeze na cor turquesa, com capacidade de 500 ml, conforme o catálogo oficial da marca.

O material, os cuidados de limpeza e a compatibilidade com bebidas quentes não foram confirmados na fonte consultada. Confirme essas informações com o atendimento antes de escolher.

Fonte: https://grupoozonteck.com/produtos/squeeze-turquesa-500ml$text$)
)
update public.produtos as p set description = reviewed.description
from reviewed
where p.code = reviewed.code and p.is_deleted = false
  and nullif(btrim(p.description), '') is null
returning p.code, p.name;
commit;
