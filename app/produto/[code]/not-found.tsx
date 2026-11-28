import BackButton from '@/components/BackButton';
export default function NotFound() {
  return <main className="min-h-[60dvh] px-4 py-16 text-center"><h1 className="text-2xl font-bold">Produto não encontrado</h1><p className="my-4">Esta referência não está disponível no catálogo.</p><BackButton fallback="/#catalogo" className="inline-flex min-h-11 items-center text-teal-800 action-link">Voltar</BackButton></main>;
}
