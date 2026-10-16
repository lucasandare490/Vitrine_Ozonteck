import AdminPricing from '@/components/AdminPricing';
import Link from 'next/link';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-4"><Link href="/admin/clientes" className="inline-flex min-h-11 items-center underline">Voltar aos clientes</Link><AdminPricing key={id} userId={id} /></div>;
}
