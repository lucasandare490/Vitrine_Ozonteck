'use client';
import Link from 'next/link';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto flex min-h-[65dvh] max-w-xl flex-col items-start justify-center gap-4 px-5 py-10"><p className="text-sm font-bold text-teal-700">OZONTECK RECIFE</p><h1 className="text-2xl font-extrabold text-teal-950">Não foi possível abrir esta página</h1><p role="alert" className="leading-relaxed text-slate-600">Confira sua conexão e tente novamente. Se você estava pagando, consulte Meus pedidos antes de iniciar outra compra.</p><button type="button" onClick={reset} className="action-link">Tentar novamente</button><Link href="/conta/pedidos" className="action-link">Consultar meus pedidos</Link><Link href="/suporte" className="inline-link">Preciso de ajuda</Link></main>;
}
