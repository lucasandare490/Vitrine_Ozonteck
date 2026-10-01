import { readFileSync, writeFileSync } from 'node:fs';
import { productOfficialCodes } from '../lib/product-official-codes.ts';
import { productResearch } from '../lib/product-research.ts';
import { getPublicProductContent, getPublicProductSpecifications } from '../lib/product-public-content.ts';
import { isRetiredProduct, discontinuedProductCodes } from '../lib/catalog-availability.ts';

type Source = { title: string; code: string; ean: string; body: string; paragraphs: string[] };
const document = JSON.parse(readFileSync('docs/product-document-source.json', 'utf8')) as { source: string; sha256: string; records: Source[] };
const baseline = JSON.parse(readFileSync('docs/product-editorial-comparison.json', 'utf8'));
const products = Object.entries(productResearch).map(([code, research]) => {
  const identity = productOfficialCodes[code];
  const source = document.records.find(p => p.code === identity?.codigoOriginal);
  const retired = isRetiredProduct({ code });
  const prior = baseline.products.find((p: { code: string }) => p.code === code);
  if (!retired && (!source || source.ean !== identity?.ean)) throw new Error(`Document identity mismatch: ${code}`);
  const content = retired ? undefined : getPublicProductContent(code);
  return { code, name: prior?.current?.name, identity, source,
    status: retired ? 'RETIRADO: nao pesquisar nem atualizar conteudo' : 'MANTIDO',
    preservedCommercialFields: prior?.current,
    publicContent: content ? { ...content, specifications: getPublicProductSpecifications({ code, category: prior?.current?.category || '' }).map(({ label, value }) => ({ label, value })) } : null,
    sources: retired ? [] : research.sources,
    historicalResearchNotes: retired ? undefined : research.note,
    remainingLabelChecks: retired ? [] : research.missing,
  };
});
const legacy = document.records.filter(source => !Object.values(productOfficialCodes).some(p => p.codigoOriginal === source.code));
const db = JSON.parse(readFileSync('docs/discontinued-products-database.json', 'utf8'));
const result = { source: document.source, sha256: document.sha256, checkedAt: new Date().toISOString(), activeCount: products.filter(p => p.status === 'MANTIDO').length,
  discontinued: discontinuedProductCodes, retainedException: 'CAP-CO-MEL', databaseApplied: db.applied,
  legacyPresentationsNotMerged: legacy,
  supplementalResearch: [
    { code: 'CAP-CO-MEL', urls: ['https://grupoozonteck.lojavirtualnuvem.com.br/produtos/1-condicionador-mel-ozonio/', 'https://ozonvidas.com/produtos/condicionador-mel-ozonio-ozonteck/'], decision: 'Mesma linha e componentes do material; duas revendas concordam no uso no comprimento, pausa de 3 minutos e enxague. Incorporados uso e cuidados. Nao tratadas como fabricante.' },
    { code: 'NUT-OX', url: 'https://grupoozonteck.lojavirtualnuvem.com.br/produtos/suplemento-alimentar-ox/', decision: 'Formula secundaria inclui vitamina E e botanicos divergentes do rotulo anterior; nao incorporados formula nem posologia.' },
    { code: 'NUT-FLEX-CX / NUT-FLEX-UN', url: 'https://www.ozonteckloja.com.br/suplemento-alimentar-ozon-flex-colageno/p', decision: 'Apresentacao de 10 g divergente de 8 g; nao transferir posologia, formula ou novos minerais.' },
  ], products };
writeFileSync('docs/product-document-review.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ documentRecords: document.records.length, active: result.activeCount, retiredInDocument: products.filter(p => p.source && p.status.startsWith('RETIRADO')).length, legacy: legacy.map(p => p.code), databaseApplied: db.applied }));
