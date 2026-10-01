import fs from 'node:fs/promises';
import { registrationProducts as products } from '../lib/product-registration.ts';

const quote = value => value == null || value === '' ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const source = JSON.parse(await fs.readFile('docs/product-revision-2-source.json', 'utf8'));
const rows = products.map(p => {
  const body = [p.description,
    p.presentation && `Apresentação: ${p.presentation}`,
    p.actives && `Ativos destacados: ${p.actives}`,
    p.components && `Componentes conhecidos: ${p.components}`,
    p.usage && `Modo de uso:\n${p.usage.join('\n')}`,
    p.precautions && `Precauções:\n${p.precautions.join('\n')}`,
  ].filter(Boolean).join('\n\n');
  return `(${[p.code,p.name,p.category,p.codigoOriginal,p.ean].map(quote).join(',')},${p.price.toFixed(2)},${quote(`/produtos/${p.image}`)},${quote(body)})`;
});
const sql = `-- CADASTRO DOS 11 PRODUTOS AUSENTES. Execucao manual pelo responsavel.
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
${rows.join(',\n')};

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
`;
await fs.writeFile('supabase/manual/20260929_cadastrar_11_produtos.sql', sql);
// Preserve all source fields, including suspect logistical measurements, for audit.
await fs.writeFile('docs/product-registration-evidence.json', JSON.stringify(products.map(p => ({
  ...p, source: source.blocks.find(b => b.position === p.sourcePosition) ?? null,
  logisticsNote: 'Dimensoes e peso sao transcricoes do catalogo, nao volume/conteudo liquido confirmado. Nao usados para calculo de frete.',
})), null, 2) + '\n');
console.log('Generated registration SQL and source evidence for 11 products. No database connection.');
