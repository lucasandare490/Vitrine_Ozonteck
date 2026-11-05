import SupportTickets from '@/components/SupportTickets';

export default function AdminSupportPage() {
  return <main className="mx-auto w-full max-w-6xl p-6"><h1 className="text-2xl font-bold">Suporte</h1><p className="mt-2 text-sm text-slate-600">Consulte os protocolos e responda às solicitações dos clientes.</p><SupportTickets admin /></main>;
}
