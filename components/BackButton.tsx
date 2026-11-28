'use client';

import type { ButtonHTMLAttributes } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { navigateBack } from '@/lib/back-navigation';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & { fallback?: string; iconOnly?: boolean };
export default function BackButton({ fallback = '/#catalogo', iconOnly = false, children, className, ...props }: Props) {
  const router = useRouter();
  return <button {...props} className={`min-h-11 ${className || ''}`} type="button" aria-label={props['aria-label'] || (iconOnly ? 'Voltar' : undefined)}
    onClick={() => navigateBack(window, href => router.replace(href), fallback)}>
    {children || <><ArrowLeft size={20} aria-hidden="true" />{!iconOnly && <span>Voltar</span>}</>}
  </button>;
}
