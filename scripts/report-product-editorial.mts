import { readFileSync, writeFileSync } from 'node:fs';
import { getPublicProductContent, getPublicProductSpecifications } from '../lib/product-public-content.ts';
import { isRetiredProduct } from '../lib/catalog-availability.ts';

const snapshot = JSON.parse(readFileSync('docs/product-editorial-comparison.json', 'utf8'));
const products = snapshot.products.map((entry: { code: string; current?: { name: string; category: string }; before?: { summary?: string }; [key: string]: unknown }) => {
  const content = getPublicProductContent(entry.code);
  const retired = isRetiredProduct({ code: entry.code, category: entry.current?.category || '' });
  return { ...entry, decision: retired ? 'Preservar retirada; nao publicar.' : content ? 'Reorganizar conteudo publico; preservar cadastro comercial e fontes internamente.' : 'Produto de teste ou cadastro sem ficha editorial; preservar descricao do banco.',
    summaryChanged: content ? content.summary !== entry.before?.summary : false,
    publicFinal: content ? { ...content, specifications: getPublicProductSpecifications({ code: entry.code, category: entry.current?.category || '' }).map(({ label, value, group }) => ({ label, value, group })) } : null,
    reviewLimits: 'Campos missing e observacoes before sao historicos, nao texto publico. Quantidades de ativos, formula integral, dosagem e alegacoes de resultado nao sao deduzidas de nomes ou de produtos semelhantes.' };
});
writeFileSync('docs/product-editorial-final.json', JSON.stringify({ checkedAt: new Date().toISOString(), sourceSha256: snapshot.sha256, sourceBlocks: snapshot.blocks.length, products }, null, 2));
const rows = products.filter((p: { publicFinal: unknown }) => p.publicFinal);
const lines = [
  '# Revisao editorial do catalogo - 30/09/2026', '',
  `Comparados ${snapshot.blocks.length} blocos fornecidos com ${products.length} registros (117 produtos comerciais ativos, 6 retirados e 4 testes).`,
  'O inventario de antes esta em product-editorial-comparison.json. O mapa completo por produto, com material original, cadastro, identidade, fontes, lacunas historicas e conteudo publico final, esta em product-editorial-final.json.', '',
  '## Resultado e limites', '',
  '- 117 fichas publicas com descricao. Isso nao significa ficha tecnica integral ou resolucao de todas as lacunas.',
  '- Codigos internos, codigos oficiais, EAN, precos, estoque, nomes e imagens preservados. Nenhum SQL executado e nenhuma escrita no Supabase.',
  '- Publicacao usa a camada editorial local. A coluna description do banco e o painel administrativo nao foram reescritos; novos cadastros sem ficha local continuam usando sua descricao cadastrada.',
  '- Descricao, especificacoes, uso e precaucoes usam os componentes existentes. Pesquisa, fontes e campos ausentes nao aparecem para clientes.',
  '- Toque Luminoso, energetico 269 ml e quatro acessorios continuam retirados. Xbooster em capsulas e um produto diferente e foi preservado.',
  '- A revisao do material cobre todos os produtos. A pesquisa complementar nao confirmou todos os campos: nao ha promessa de completude.', '',
  '## Divergencias e decisoes', '',
  '- Perfumes: familias divergentes de DG Red, Seduction, Famma e 303 VIP omitidas. Etapas divergentes de 303 Men, 303 VIP e Sentimento omitidas; nas descricoes permanecem caracteristicas comuns aos trechos. Fundo de 303 Woman, Angelical e Soul nao e apresentado como piramide completa. Citacoes a outras marcas nao identificam criador ou formula Ozonteck.',
  '- Haydek: manteiga de karite mantida; ureia versus hydroxyethyl urea nao foi resolvida por equivalencia presumida.',
  '- Master Curls: o bloco fornecido esta associado ao mesmo codigo oficial 40558 e EAN da ficha. Composicao com argan e proteinas hidrolisadas, pausa de 20 a 30 minutos e precaucoes foram preservadas desse bloco; o nome cadastrado nao foi alterado para PRO. A variacao de nome permanece registrada internamente.',
  '- Correcao apos retorno do usuario: recuperados detalhes, vitaminas, caracteristicas e instrucoes que haviam sido excessivamente resumidos. Descricoes longas usam paragrafos; vitaminas, componentes, uso e precaucoes permanecem em secoes proprias. Nao se usa concisao como motivo para descartar informacao.',
  '- Genolife: fontes de 60 comprimidos nao substituem a apresentacao de 30 do material. Cobalactin: sabor conflitante omitido. Melatozon em capsulas nao substitui gotas.',
  '- Creat Morango: paginas com 8 g nao substituem os 8,5 g do material; peso do sache nao e dose de creatina. Amyno: nao se transferiram formula, preparo e quantidade da caixa para a unidade.',
  '- Virtuous e Luminous: formulas divergentes de revendas nao substituem componentes do material. Sofh D, K2 e outros suplementos: dosagens externas sem correspondencia de rotulo nao incorporadas.',
  '- Dimensoes e peso logistico do material continuam no mapa interno, sem conversao em conteudo liquido. Notas de aroma nao sao lista de ingredientes.', '',
  '## Pesquisa complementar', '',
  'Fontes especificas de Aaliyah, Oud Royale, Rhino Royale, Sublime, Supremo, body splashes e Amyno ficam em sources de cada registro no JSON e em lib/product-content-complementary.ts. As fontes sao secundarias; nao foram elevadas a documentacao do fabricante.',
  'Outras consultas relevantes, sem adotar dosagens, formulas conflitantes ou instrucoes sem identificacao suficiente:', '',
  '- https://grupoozonteck.com/produtos/boryslim - pagina oficial sem texto tecnico suficiente.',
  '- https://grupoozonteck.com/produtos/virtuous-caps - pagina oficial sem texto tecnico suficiente.',
  '- https://ozonteckloja.com.br/virtuous-caps-cabelo-pele-unha-ozonteck/p - apoio aos componentes; nao formula completa.',
  '- https://ozonteckcosmetico.com.br/produto/luminous-vita/ - componentes divergem do material; nao adotados.',
  '- https://ozonteckcosmetico.com.br/produto/genolife-kids/ - formula divergente; nao adotada.',
  '- https://ozonio-shop.lojaintegrada.com.br/genolife-kids - outra quantidade de comprimidos; posologia nao transferida.',
  '- https://ozonteckcuritiba.lojavirtualnuvem.com.br/produtos/ozon-creat-morango-caixa/ - peso divergente; nao adotado.',
  '- https://www.app-ozonteck.com/lumino3-serum-facial/ - nao confirma a identidade por codigo/EAN para transferir protocolo.',
  '- https://www.ozonteckstore.com.br/mascara-para-cabelos-cacheados-master-curls - mistura nome sem PRO com descricao PRO.',
  '- https://ozonteckloja.com.br/mascara-ozon-blond-linha-matizadora-ozonteck/p - confirma proposta cosmetica; sem acrescentar protocolo nao confirmado.',
  '- Buscas por WO3 AMR/CIF/HMS/LPC/Soft Cleanse/Deep Cleanse nao localizaram protocolo suficientemente identificado. Permanecem os dados do material.', '',
  '## Mapa por produto', '',
];
for (const p of rows) {
  lines.push(`### ${p.code} - ${p.current?.name || p.code}`, '', p.publicFinal.summary, '',
    ...p.publicFinal.specifications.map((f: { label: string; value: string }) => `- ${f.label}: ${f.value}`),
    ...p.publicFinal.sections.map((s: { title: string; items: string[] }) => `- ${s.title}: ${s.items.join(' ')}`),
    '', 'Fontes, material original, divergencias e pendencias historicas: consultar este codigo no JSON completo.', '');
}
writeFileSync('docs/product-editorial-final.md', lines.join('\n'));
console.log(JSON.stringify({ active: rows.length, changedSummaries: rows.filter((p: { summaryChanged: boolean }) => p.summaryChanged).length, totalEntries: products.length }));
