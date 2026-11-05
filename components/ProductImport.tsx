'use client';
import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { parseProductImport, previewProductImport, type ProductImportPreview } from '@/lib/product-import';

export default function ProductImport({ onImported }: { onImported: () => void }) {
  const [source, setSource] = useState('');
  const [preview, setPreview] = useState<ProductImportPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const locked = useRef(false);
  const button = 'min-h-11 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50';
  async function prepare() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setNotice(''); setPreview(null);
    try {
      const rows = parseProductImport(source);
      const [products, categories] = await Promise.all([
        supabase.from('produtos').select('code,name,category,price,estoque,is_deleted').in('code', rows.map(row => row.code)),
        supabase.from('categorias').select('name,archived_at').is('archived_at', null),
      ]);
      if (products.error || categories.error) throw new Error('Não foi possível conferir o catálogo.');
      setPreview(previewProductImport(rows, products.data || [], categories.data || []));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível preparar a importação.'); }
    finally { locked.current = false; setBusy(false); }
  }
  async function confirm() {
    if (locked.current || !preview) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const result = await supabase.rpc('import_product_updates', { p_rows: preview.payload, p_expected: preview.expected });
      if (result.error) throw new Error('A importação não foi concluída. Gere outra prévia para conferir alterações no catálogo e sua autorização.');
      setNotice(`${result.data.updated} produto(s) atualizado(s).`); setPreview(null); setSource(''); onImported();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha de conexão. Confira o catálogo antes de repetir.'); }
    finally { locked.current = false; setBusy(false); }
  }
  return <details className="my-5 rounded-xl border border-slate-200 bg-white p-5 dark:bg-neutral-900"><summary className="cursor-pointer font-bold">Importar preços e estoque</summary>
    <p className="my-3 text-sm text-slate-600">Cole até 100 produtos existentes, separados por ponto e vírgula ou tabulação. Cabeçalho: Código;Preço;Estoque. Deixe um valor vazio para preservá-lo. Confira a prévia antes de confirmar.</p>
    <label className="block text-sm font-semibold">Dados CSV<textarea disabled={busy} rows={5} maxLength={131072} value={source} onChange={event => { setSource(event.target.value); setPreview(null); setNotice(''); }} className="my-2 w-full rounded-lg border border-slate-300 bg-transparent p-3 font-mono text-sm" placeholder={'Código;Preço;Estoque\nCODIGO-EXISTENTE;19,90;10'} /></label>
    <button type="button" disabled={busy || !source.trim()} onClick={() => void prepare()} className={button}>Conferir prévia</button>
    {error && <p role="alert" className="my-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="my-3 text-sm text-teal-800">{notice}</p>}
    {preview && <div className="mt-4 space-y-3"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Produto</th><th>Preço anterior → novo</th><th>Estoque anterior → novo</th></tr></thead><tbody>{preview.rows.map(row => <tr key={row.code} className="border-t"><td className="p-2">{row.name} ({row.code})</td><td>{row.before.price.toFixed(2)} → {row.after.price.toFixed(2)}</td><td>{row.before.estoque} → {row.after.estoque}</td></tr>)}</tbody></table></div><button type="button" disabled={busy} onClick={() => void confirm()} className={button}>{busy ? 'Salvando...' : `Confirmar atualização de ${preview.rows.length} produto(s)`}</button></div>}
  </details>;
}
