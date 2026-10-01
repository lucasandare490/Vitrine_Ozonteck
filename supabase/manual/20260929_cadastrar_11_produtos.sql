-- CADASTRO DOS 11 PRODUTOS AUSENTES. Execucao manual pelo responsavel.
-- Gerado de lib/product-registration.ts; substitui a versao resumida deste arquivo.
-- Nao executa migrations de seguranca. Nenhum VG, locao antiga ou acessorio.
-- Precos das capturas autorizados; estoque inicial 9999 apenas nos novos registros.
-- Codigo original/EAN permanecem no mapeamento editorial do projeto (nao no SKU).
-- Imagens: salvar os arquivos correspondentes em public/produtos e publicar o projeto.
begin;
set local lock_timeout='5s';
create temporary table novos_produtos_revisados (
 code text primary key, name text not null, category text not null,
 codigo_original text not null, ean text, preco numeric,
 image_url text not null, description text, incluir boolean not null default true
) on commit drop;
insert into novos_produtos_revisados(code,name,category,codigo_original,ean,preco,image_url,description) values
('NUT-AMYNO-CX','Amyno Ozon Caixa','Nutracêuticos','IMP-189',null,299.90,'/produtos/amynoozoncaixa.webp','Apresentação: Caixa'),
('NUT-AMYNO-UN','Amyno Ozon Unidade','Nutracêuticos','IMP-197',null,10.00,'/produtos/amynoozonunidade.webp','Apresentação: Unidade'),
('NUT-POWER-UN','Ozon Power Unidade','Nutracêuticos','IMP-49',null,10.00,'/produtos/ozonpowerunidade.webp','Ozon Power é um suplemento da Ozonteck apresentado em unidade individual, destinado ao público adulto. O material fornecido descreve uma combinação de vitaminas, minerais, aminoácidos e compostos bioativos, incluindo cafeína. As quantidades por porção e a composição integral não foram informadas.

Apresentação: Unidade

Componentes conhecidos: Vitaminas B1, B2, B5, B6, B12 e C; coenzima Q10; taurina; tirosina; arginina; cafeína; trans-resveratrol. Relação parcial informada no catálogo, sem quantidades por porção.'),
('NUT-MUNITY-UN','Ozon Munity Unidade','Nutracêuticos','IMP-48',null,10.00,'/produtos/ozonmunityunidade.webp','Ozon Munity é um suplemento da Ozonteck na apresentação individual. O catálogo descreve uma combinação de carboidratos, vitaminas, minerais e fibras solúveis, com maltodextrina entre os componentes citados. Não foram informadas as quantidades por porção nem a composição integral.

Apresentação: Unidade

Componentes conhecidos: Maltodextrina; mix de vitaminas e minerais; fibras solúveis. O catálogo não discrimina as vitaminas, minerais e fibras nem suas quantidades.'),
('BE-SER-LUM','Sérum Facial Lumino3','Bem Estar','40566','7898760210585',175.90,'/produtos/serumfaciallumino3.webp','O Sérum Facial Ozonizado Lumino3 da Ozonteck é destinado aos cuidados da pele do rosto. O catálogo apresenta uma proposta de hidratação e cuidado da aparência da pele, com vitamina C e ácido hialurônico entre os ativos destacados, e o indica para todos os tipos de pele.

Ativos destacados: Vitamina C e ácido hialurônico; o catálogo também descreve tecnologia ozonizada, sem especificar a composição integral.'),
('CAP-CO-KES','Condicionador Ozon-Kesen','Cuidados Capilares','40548','7898996428235',109.90,'/produtos/condicionadorozonkesen.webp','O Condicionador Ozon-Kesen Pós-Química é destinado a cabelos submetidos a coloração, alisamento ou relaxamento e a fios ressecados por fatores como uso de chapinha e exposição ao sol. A fórmula descrita no catálogo combina manteiga de cupuaçu ozonizada e queratina para condicionar os fios, proporcionar maciez e brilho e ajudar a preservar a umidade.

Ativos destacados: Manteiga de cupuaçu ozonizada e queratina.

Modo de uso:
Após lavar os cabelos com o Shampoo Ozon-Kesen e aplicar a Máscara Ozon-Kesen, distribua o condicionador por todo o comprimento.
Deixe agir por alguns minutos e enxágue abundantemente. O catálogo não informa um tempo exato.

Precauções:
Uso externo. Evite contato com os olhos; em caso de contato, enxágue abundantemente com água.
Mantenha fora do alcance de crianças. Faça um teste de alergia antes do primeiro uso.
Armazene em local fresco e seco, longe da luz solar direta. Siga as instruções do rótulo.'),
('CAP-PRO-KES','Pro Kesen','Cuidados Capilares','40544','7898760210097',499.90,'/produtos/prokesen.webp','O Reestruturador Ozonizado Pro Kesen é uma máscara capilar da Ozonteck voltada à redução e ao controle do volume e do frizz. O catálogo descreve a combinação da tecnologia ozonizada com ácidos hialurônico e lático, óleos e silicone, com proposta de alinhamento, maciez, brilho e melhora do aspecto dos fios danificados. A marca menciona diferentes formas de aplicação para alinhar os fios ou soltar os cachos, mas o material não apresenta o protocolo de cada procedimento.

Ativos destacados: Ácidos hialurônico e lático; óleos e silicone não discriminados. Não corresponde à composição integral.

Precauções:
Realize teste de mecha antes da aplicação em todo o cabelo e teste de sensibilidade antes do uso.
Use luvas na aplicação. Uso externo. Não aplique sobre pele irritada ou lesionada.
Em caso de irritação, suspenda imediatamente o uso. Evite contato com os olhos.
Mantenha fora do alcance de crianças. Conserve em temperatura ambiente, longe do calor e da luz.
Para uso durante a gravidez, consulte um médico.'),
('CAP-AT-MC','Ativador Master Curls','Cuidados Capilares','40559','7898996428228',119.90,'/produtos/ativadormastercurls.webp','O Ativador de Cachos Ozonizado da linha Master Curls da Ozonteck é destinado à finalização dos cabelos cacheados. O catálogo apresenta uma proposta de hidratação e definição dos cachos, para aplicação mecha a mecha após o uso do shampoo e da máscara da linha.

Modo de uso:
Após lavar com o Shampoo Master Curls e aplicar a Máscara Master Curls, respeite a pausa da máscara e enxágue.
Distribua uma pequena quantidade do ativador mecha a mecha por toda a extensão dos fios.
Finalize como desejar, deixando secar naturalmente ou utilizando um método de secagem.

Precauções:
Uso externo. Evite contato com os olhos e mantenha fora do alcance das crianças.
Em caso de dúvida, faça um teste de alergia antes do primeiro uso.
Armazene em local fresco e seco, longe da luz solar direta. Siga as instruções do rótulo.'),
('CAP-CO-MEL','Condicionador Mel & Ozônio','Cuidados Capilares','40551','7898996428266',109.90,'/produtos/condicionadormelozonio.webp','O Condicionador Mel & Ozônio da Ozonteck é destinado ao cuidado de cabelos fragilizados e sem vida. O catálogo descreve uma proposta de hidratação, maciez, sedosidade e brilho, com óleo de girassol ozonizado, extrato de mel, geleia real e vitaminas A, D e E entre os componentes destacados.

Ativos destacados: Óleo de girassol ozonizado; extrato de mel; geleia real; vitaminas A, D e E.'),
('BE-TOQUE-LUM','Toque Luminoso','Bem Estar','IMP-206',null,565.60,'/produtos/toqueluminoso.webp','Apresentação: Kit'),
('BE-XBOOST-269','Energético Xbooster 269 ml','Bem Estar','IMP-99',null,27.80,'/produtos/energeticoxbooster269ml.webp','Apresentação: Lata de 269 ml');

-- Serializa a verificacao com alteracoes concorrentes do catalogo.
lock table public.produtos in share row exclusive mode;
do $$
begin
 if not exists(select 1 from novos_produtos_revisados where incluir) then
   raise exception 'Cadastro bloqueado: nenhum item foi aprovado.';
 end if;
 if exists(select 1 from novos_produtos_revisados where incluir and
   (preco is null or preco<=0 or preco::text in ('NaN','Infinity','-Infinity') or preco<>round(preco,2))) then
   raise exception 'Cadastro bloqueado: preco ausente ou invalido.';
 end if;
 if exists(select 1 from novos_produtos_revisados n join public.produtos p on p.code=n.code
   where n.incluir and (p.name is distinct from n.name or p.category is distinct from n.category)) then
   raise exception 'Codigo interno ja ocupado por outro nome/categoria. Nao substituir.';
 end if;
 if exists(select 1 from novos_produtos_revisados n join public.produtos p
   on lower(btrim(p.name))=lower(btrim(n.name)) where n.incluir and p.code<>n.code) then
   raise exception 'Nome ja cadastrado com outro codigo, inclusive retirados. Revisao manual obrigatoria.';
 end if;
 if exists(select 1 from novos_produtos_revisados n where n.incluir
   and not exists(select 1 from public.categorias c where c.name=n.category)) then
   raise exception 'Categoria ausente: confirme categoria existente antes de cadastrar.';
 end if;
end;
$$;
insert into public.produtos(code,name,category,price,estoque,image_url,description,is_deleted)
select code,name,category,preco,9999,image_url,description,false
from novos_produtos_revisados where incluir
on conflict(code) do nothing
returning code,name,category,price,estoque,image_url;
-- Nunca atualiza registros existentes: nenhuma reativacao ou troca de preco/foto.
commit;
