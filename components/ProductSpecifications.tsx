import type { Specification } from '@/lib/product-specs';

function Rows({ fields }: { fields: Specification[] }) {
  return <dl className="divide-y divide-slate-200">{fields.map(field => <div key={field.label} className="grid min-w-0 gap-2 py-4 sm:grid-cols-[minmax(160px,1fr)_3fr] sm:gap-6">
    <dt className="min-w-0 break-words font-semibold">{field.label}</dt>
    <dd className="min-w-0 break-words leading-relaxed text-slate-700">{field.value}</dd>
  </div>)}</dl>;
}

export default function ProductSpecifications({ fields }: { fields: Specification[] }) {
  if (!fields.length) return null;
  const ordinary = fields.filter(field => !field.group);
  const olfactory = fields.filter(field => field.group === 'olfactory');
  const identity = fields.filter(field => field.group === 'identity');
  return <section aria-labelledby="specifications-title" className="mt-8 border-t border-slate-200 pt-8">
    <h2 id="specifications-title" className="mb-4 text-2xl font-bold">Especificações</h2>
    <Rows fields={ordinary} />
    {olfactory.length > 0 && <div className="mt-6"><h3 className="text-lg font-semibold">Notas olfativas</h3><Rows fields={olfactory} /></div>}
    {identity.length > 0 && <div className="mt-6" data-official-identification><h3 className="text-lg font-semibold">Identificação oficial</h3><Rows fields={identity} /></div>}
  </section>;
}
