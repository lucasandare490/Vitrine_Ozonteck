import InstallApp from '@/components/InstallApp';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Aplicativo Ozonteck' };
export default function InstallPage() {
  return <main className="mx-auto min-h-[65dvh] max-w-2xl px-4 py-8 sm:py-16"><p className="mb-2 text-sm font-bold text-teal-700">OZONTECK RECIFE</p><h1 className="mb-3 text-3xl font-extrabold text-teal-950">Sua loja, sempre por perto</h1><p className="mb-6 leading-relaxed text-slate-600">Adicione a Ozonteck à tela inicial do seu celular.</p><InstallApp /></main>;
}
