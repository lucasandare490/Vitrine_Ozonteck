export default function Loading() {
  return <main className="mx-auto min-h-[65dvh] w-full max-w-6xl p-4 sm:p-8" aria-busy="true"><p role="status" className="sr-only">Carregando a loja…</p><div aria-hidden="true" className="space-y-5 animate-pulse motion-reduce:animate-none"><div className="h-9 w-2/3 rounded-xl bg-teal-100" /><div className="h-24 rounded-3xl bg-slate-100" /><div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[1, 2, 3, 4].map(item => <div key={item} className="aspect-[3/4] rounded-3xl bg-slate-100" />)}</div></div></main>;
}
