import Link from 'next/link';
export default function NotFound() {
  return <main className="mx-auto flex min-h-[65dvh] max-w-xl flex-col items-start justify-center gap-4 px-5 py-10"><p className="text-sm font-bold text-teal-700">OZONTECK RECIFE</p><h1 className="text-3xl font-extrabold text-teal-950">Vamos encontrar outro caminho?</h1><p className="leading-relaxed text-slate-600">Este endereço não está disponível. Você pode procurar um produto ou voltar ao catálogo.</p><Link href="/busca" className="action-link">Buscar produtos</Link><Link href="/#catalogo" className="action-link">Explorar catálogo</Link></main>;
}
