import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { productResearch } from '../lib/product-research.ts';
import { productOfficialCodes } from '../lib/product-official-codes.ts';
import { isRetiredProduct } from '../lib/catalog-availability.ts';

const sourcePath = 'C:/Users/lucas/.codex/attachments/f392e68c-2d91-44ae-94f8-1cbd301bda1e/Texto colado.txt';
const source = readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');
const blocks = [...source.matchAll(/([\s\S]*?)\nCódigo\n([^\n]+)\n(?:Código EAN\n([^\n]+)\n)?Largura \(cm\) × Altura \(cm\) × Comprimento \(cm\)\n([^\n]+)\nPeso \(em gramas\)\n([^\n]+)/g)].map((m, i) => ({ position: i + 1, body: m[1].trim(), codigoOriginal: m[2], ean: m[3] || '', dimensions: m[4], weight: m[5] }));
if (blocks.length !== 119) throw new Error('Unexpected source inventory');
// Public SELECT only; no RPC, migration or write credentials.
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const { data, error } = await client.from('produtos').select('code,name,category,price,estoque,image_url,description,is_deleted').order('code');
if (error || !data) throw error || new Error('Catalog unavailable');
const codes = [...new Set([...Object.keys(productResearch), ...data.map(p => p.code)])];
const products = codes.map(code => {
  const current = data.find(p => p.code === code);
  const identity = productOfficialCodes[code];
  const material = identity && blocks.find(b => b.codigoOriginal === identity.codigoOriginal);
  return {
    code, current, identity, material,
    status: isRetiredProduct({ code, category: current?.category || '' }) ? 'retirado; preservar' : current ? 'visivel na leitura publica' : 'somente ficha local',
    identityMatches: material ? material.ean === identity?.ean : null,
    before: productResearch[code],
    preserve: ['codigo interno', 'identidade', 'preco', 'estoque', 'imagem', 'categoria', 'relacionamentos'],
    reorganize: 'Separar descricao, especificacoes, uso e precaucoes; retirar observacoes editoriais da interface.',
    missing: productResearch[code]?.missing || [],
    sources: productResearch[code]?.sources || [],
    internalObservations: productResearch[code]?.note || '',
  };
});
writeFileSync('docs/product-editorial-comparison.json', JSON.stringify({ checkedAt: new Date().toISOString(), sourcePath, sha256: createHash('sha256').update(source).digest('hex'), blocks, products }, null, 2));
console.log(JSON.stringify({ sourceBlocks: blocks.length, publicRows: data.length, reviewedEntries: codes.length, mismatches: products.filter(p => p.identityMatches === false).map(p => p.code) }));
