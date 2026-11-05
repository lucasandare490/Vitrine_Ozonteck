export const PRODUCT_IMPORT_MAX_ROWS = 100;
export const PRODUCT_IMPORT_MAX_BYTES = 131072;

export type ProductImportRow = { code: string; price?: number; estoque?: number };
export type ImportCatalogProduct = {
  code: string; name: string; category: string | null; price: number; estoque: number; is_deleted?: boolean | null;
};
export type ImportCategory = { name: string; archived_at: string | null };
export type ProductImportPreview = {
  rows: { code: string; name: string; category: string | null; before: { price: number; estoque: number }; after: { price: number; estoque: number } }[];
  payload: ProductImportRow[];
  expected: ProductImportRow[];
};

const aliases: Record<string, keyof ProductImportRow> = {
  code: 'code', codigo: 'code', sku: 'code', 'codigo sku': 'code',
  price: 'price', preco: 'price', valor: 'price', 'preco de venda': 'price',
  estoque: 'estoque', stock: 'estoque', quantidade: 'estoque', qtd: 'estoque',
};
const normalizeHeader = (value: string) => value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function records(text: string) {
  // Pick the delimiter from the first logical record, ignoring quoted separators.
  let quoted = false, semicolons = 0, tabs = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') {
      if (quoted && text[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted) {
      if (text[i] === '\r' || text[i] === '\n') break;
      if (text[i] === ';') semicolons++;
      if (text[i] === '\t') tabs++;
    }
  }
  if ((!semicolons && !tabs) || (semicolons && tabs)) throw new Error('Use um arquivo separado por ponto e vírgula ou tabulação.');
  const delimiter = semicolons ? ';' : '\t';
  const rows: string[][] = [];
  let cells: string[] = [], cell = '', inQuotes = false, closedQuote = false;
  const endCell = () => { cells.push(cell); cell = ''; closedQuote = false; };
  const endRow = () => {
    endCell();
    if (cells.some(value => value.trim() !== '')) rows.push(cells);
    cells = [];
    if (rows.length > PRODUCT_IMPORT_MAX_ROWS + 1) throw new Error('O limite é de 100 produtos por importação.');
  };
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else { inQuotes = false; closedQuote = true; }
      } else cell += char;
    } else if (char === delimiter) endCell();
    else if (char === '\r' || char === '\n') {
      endRow();
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else if (closedQuote) {
      if (char !== ' ') throw new Error('CSV inválido: texto após o fechamento de aspas.');
    } else if (char === '"') {
      if (cell.trim() !== '') throw new Error('CSV inválido: aspas no meio de um campo.');
      cell = ''; inQuotes = true;
    } else cell += char;
  }
  if (inQuotes) throw new Error('CSV inválido: aspas não fechadas.');
  endRow();
  return rows;
}

function priceValue(value: string, line: number) {
  // Accept decimal dot/comma and unambiguous Brazilian thousands groups.
  const valid = /^(?:\d+(?:[.,]\d{1,2})?|\d{1,3}(?:\.\d{3})+,\d{2})$/.test(value);
  const parsed = Number(value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value);
  if (!valid || !Number.isFinite(parsed) || parsed <= 0 || parsed >= 1000000) {
    throw new Error(`Linha ${line}: preço inválido. Use um valor positivo, menor que 1.000.000 e com até duas casas decimais.`);
  }
  return parsed;
}

export function parseProductImport(input: string): ProductImportRow[] {
  if (new TextEncoder().encode(input).length > PRODUCT_IMPORT_MAX_BYTES) throw new Error('O arquivo excede 128 KB.');
  const rows = records(input.replace(/^\uFEFF/, ''));
  if (rows.length < 2) throw new Error('Inclua o cabeçalho e pelo menos um produto.');
  const headers = rows[0].map(value => aliases[normalizeHeader(value)]);
  if (headers.some(value => !value) || new Set(headers).size !== headers.length
    || !headers.includes('code') || !headers.some(value => value === 'price' || value === 'estoque')) {
    throw new Error('Cabeçalho inválido. Use Código e Preço e/ou Estoque, sem colunas repetidas ou adicionais.');
  }
  const seen = new Set<string>();
  return rows.slice(1).map((cells, index) => {
    const line = index + 2;
    if (cells.length !== headers.length) throw new Error(`Linha ${line}: quantidade de colunas diferente do cabeçalho.`);
    const values = Object.fromEntries(headers.map((header, i) => [header, cells[i].trim()]));
    const code = values.code;
    if (!code || code.length > 100 || /[\u0000-\u001f\u007f]/.test(code)) throw new Error(`Linha ${line}: código inválido (1 a 100 caracteres, sem quebras de linha).`);
    if (seen.has(code)) throw new Error(`Linha ${line}: código duplicado ${code}.`);
    seen.add(code);
    const row: ProductImportRow = { code };
    if (values.price) row.price = priceValue(values.price, line);
    if (values.estoque) {
      if (!/^\d+$/.test(values.estoque) || Number(values.estoque) > 2147483647) throw new Error(`Linha ${line}: estoque deve ser um inteiro entre 0 e 2147483647.`);
      row.estoque = Number(values.estoque);
    }
    if (row.price === undefined && row.estoque === undefined) throw new Error(`Linha ${line}: informe preço ou estoque.`);
    return row;
  });
}

export function previewProductImport(rows: ProductImportRow[], products: ImportCatalogProduct[], categories: ImportCategory[]): ProductImportPreview {
  if (!rows.length || rows.length > PRODUCT_IMPORT_MAX_ROWS) throw new Error('Selecione de 1 a 100 produtos.');
  const catalog = new Map(products.map(product => [product.code, product]));
  const activeCategories = new Set(categories.filter(category => category.archived_at === null).map(category => category.name));
  const preview: ProductImportPreview = { rows: [], payload: [], expected: [] };
  for (const row of rows) {
    const product = catalog.get(row.code);
    if (!product || product.is_deleted) throw new Error(`Código ${row.code}: produto existente e ativo não encontrado.`);
    if (!product.name?.trim()) throw new Error(`Código ${row.code}: corrija o nome no cadastro antes de importar.`);
    if (product.category?.trim() && !activeCategories.has(product.category)) throw new Error(`Código ${row.code}: a categoria do cadastro precisa existir e estar ativa.`);
    const patch: ProductImportRow = { code: row.code }, expected: ProductImportRow = { code: row.code };
    if (row.price !== undefined) { patch.price = row.price; expected.price = Number(product.price); }
    if (row.estoque !== undefined) { patch.estoque = row.estoque; expected.estoque = product.estoque; }
    preview.payload.push(patch); preview.expected.push(expected);
    preview.rows.push({ code: row.code, name: product.name, category: product.category,
      before: { price: Number(product.price), estoque: product.estoque },
      after: { price: row.price ?? Number(product.price), estoque: row.estoque ?? product.estoque } });
  }
  return preview;
}
