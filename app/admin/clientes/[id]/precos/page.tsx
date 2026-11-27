import CustomerBenefitControl from '@/components/CustomerBenefitControl';
import Link from 'next/link';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="mx-auto max-w-2xl space-y-6"><Link href="/admin/clientes" className="action-link">Voltar à carteira de clientes</Link><div><h1 className="text-2xl font-bold">Benefício de consultor</h1><p className="mt-2 text-base text-slate-600 dark:text-slate-300">Autorize o benefício e confira como ele funciona. Os valores são definidos na tabela geral da loja.</p></div><CustomerBenefitControl key={id} userId={id} detailed /></div>;
}
