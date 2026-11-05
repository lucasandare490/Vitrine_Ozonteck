import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Central de Ajuda', alternates: { canonical: '/suporte' } };
export default function SupportLayout({ children }: { children: React.ReactNode }) { return children; }
