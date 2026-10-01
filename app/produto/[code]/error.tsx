'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="min-h-[60dvh] px-4 py-16 text-center"><h1 className="text-2xl font-bold">Não foi possível carregar o produto</h1><p className="my-4">Tente novamente em instantes.</p><button type="button" onClick={reset} className="m-2 min-h-11 rounded-md bg-teal-700 px-5 text-white">Tentar novamente</button><Link href="/" className="m-2 inline-flex min-h-11 items-center underline">Voltar à vitrine</Link></main>;
}
