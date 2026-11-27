import type { Specification } from '@/lib/product-specs';

function Rows({ fields }: { fields: Specification[] }) {
  return <dl className="overflow-hidden rounded-2xl border border-slate-100">{fields.map((field, index) => <div key={field.label} className={`grid min-w-0 gap-1.5 px-4 py-4 text-sm sm:grid-cols-[minmax(150px,1fr)_3fr] sm:gap-6 sm:px-5 ${index % 2 === 0 ? 'bg-slate-50/80' : 'bg-white'}`}>
    <dt className="min-w-0 break-words font-semibold text-slate-600">{field.label}</dt>
    <dd className="min-w-0 break-words leading-relaxed text-slate-800">{field.value}</dd>
  </div>)}</dl>;
}

export default function ProductSpecifications({ fields }: { fields: Specification[] }) {
  if (!fields.length) return null;
  const ordinary = fields.filter(field => !field.group);
  const olfactory = fields.filter(field => field.group === 'olfactory');
  const identity = fields.filter(field => field.group === 'identity');
  return <section aria-labelledby="specifications-title" className="scroll-mt-32 rounded-[2rem] border border-slate-200/70 bg-white p-5 sm:p-8">
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-teal-700">Cada detalhe importa</p>
    <h2 id="specifications-title" className="scroll-mt-36 mb-6 text-2xl font-bold tracking-tight text-slate-900">Especificações</h2>
    <Rows fields={ordinary} />
    {olfactory.length > 0 && <div className="mt-6"><h3 className="mb-3 text-base font-semibold text-teal-900">Notas olfativas</h3><Rows fields={olfactory} /></div>}
    {identity.length > 0 && <div className="mt-6" data-official-identification><h3 className="mb-3 text-base font-semibold text-teal-900">Identificação oficial</h3><Rows fields={identity} /></div>}
  </section>;
}
