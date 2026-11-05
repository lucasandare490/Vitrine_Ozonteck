import type { Metadata } from 'next';
import Storefront from '@/components/Storefront';

export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function HomePage() { return <Storefront />; }
