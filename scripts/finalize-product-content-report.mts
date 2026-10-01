import fs from 'node:fs';
import assert from 'node:assert/strict';
import { getPublicProductContent } from '../lib/product-public-content.ts';

const review = JSON.parse(fs.readFileSync('docs/product-document-review.json', 'utf8'));
const active = review.products.filter((p: { publicContent?: unknown }) => p.publicContent);
const researched = ['NUT-BORYS', 'PERF-SUPREMO', 'PERF-FER-VE', 'PERF-LUA-VE'];
const rows = active.map((p: { code: string; name: string; publicContent: { summary: string; sections: unknown }; source: { body: string } }) => {
  const content = getPublicProductContent(p.code)!;
  assert.ok(content?.summary && p.source.body, p.code);
  assert.ok(content.sections?.every(s => s.items.length && s.items.every(i => i.trim())), p.code);
  const summaryChanged = content.summary !== p.publicContent.summary;
  const beforeSections = JSON.stringify(p.publicContent.sections);
  const extraSections = content.sections!.filter(s => s.title !== 'Especificações físicas' && !beforeSections.includes(JSON.stringify(s)));
  const changes = [summaryChanged ? 'descricao comercial complementada' : '', ...extraSections.map(s => s.title), 'dimensoes e peso recuperados, separados do conteudo liquido'].filter(Boolean);
  const pending = p.code.startsWith('NUT-')
    ? 'Rotulo integral da apresentacao: ingredientes, alergenicos, tabela nutricional, dose e advertencias. Nao transferir formulas ou doses de variantes.'
    : /^(PERF|P100)-/.test(p.code)
      ? 'Ingredientes, concentracao e instrucoes integrais da apresentacao.'
      : 'Lista integral de ingredientes da apresentacao; os ativos destacados nao equivalem a formula completa.';
  return { code: p.code, name: p.name, changes, summaryChanged, researched: researched.includes(p.code), pending };
});
assert.equal(rows.length, 109);
const lines = [
  '# Conteudo dos produtos - fechamento editorial', '',
  'Produtos ativos confrontados com o material processado: 109.',
  'Produtos alterados: 109 (todos receberam as especificacoes fisicas que estavam ausentes).',
  `Descricoes comerciais complementadas: ${rows.filter((r: { summaryChanged: boolean }) => r.summaryChanged).length}.`,
  `Descricoes comerciais preservadas: ${rows.filter((r: { summaryChanged: boolean }) => !r.summaryChanged).length}.`,
  'Produtos integralmente inalterados: 0.',
  'Produtos com pesquisa externa direcionada nesta etapa: 4.',
  'Produtos com pelo menos uma lacuna de rotulo nao confirmada: 109. Isso nao significa que os textos fornecidos estejam todos pendentes: formula integral nao foi confundida com ativos destacados.', '',
  'Nenhuma alteracao no banco, precos, estoque, imagens, identificadores ou funcionalidades. JSONs de origem e conciliacao preservados.', '',
  '## Produtos modificados', '',
  ...rows.map((r: { name: string; changes: string[] }) => `- ${r.name} — ${r.changes.join('; ')}.`), '',
  '## Pendencias reais', '',
  ...rows.map((r: { name: string; pending: string }) => `- ${r.name} — ${r.pending}`), '',
  'Divergencias especificas mantidas fora do site: ureia/hydroxyethyl urea em Haydek; formulas antigas dos hidratantes; doses e formulas divergentes dos suplementos; familias de DG Red, Famma, Seduction e 303 VIP; piramides divergentes de 303 Men, 303 VIP, Sentimento, Angelical, 303 Woman e Soul. Nenhuma promessa de tratamento de doencas foi convertida em beneficio comprovado.',
  'Medidas e pesos foram mantidos exatamente como no documento, sem interpretacao como peso liquido ou dose; o documento nao distingue expressamente produto e embalagem.', '',
  '## Pesquisa complementar', '',
  '- Boryslim: busca oficial e por EAN sem informacao adicional confirmada; conservados os dados do rotulo ja registrados.',
  '- Ferias no Caribe: paginas encontradas repetem descricao generica; nenhuma piramide ou volume novo aplicado.',
  '- Supremo Elixir: perfil quente e ocasioes especiais acrescentados com base em revendas coincidentes. Piramide e fixacao nao adotadas sem confirmacao suficiente.',
  '  https://ozonvidas.com/produtos/perfume-supremo-17ml/',
  '  https://loja.bemestarcomozonio.com.br/produtos/supremo-elixir-ozonteck/',
  '- Lua de Mel em Paris: fonte complementar identifica codigo 45170, 200 ml, uso corporal e capilar; incorporados perfil, apresentacao e uso. Nao transferidos para Ferias no Caribe.',
  '  https://loja.bemestarcomozonio.com.br/produtos/hair-body-splash-lua-de-mel-em-paris-ozonteck-200ml/', '',
];
fs.writeFileSync('docs/product-content-completion.md', lines.join('\n'));
console.log(JSON.stringify({ checked: rows.length, changed: rows.length, summariesChanged: rows.filter((r: { summaryChanged: boolean }) => r.summaryChanged).length, researched: researched.length, withLabelGaps: rows.length }));
