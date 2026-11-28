'use client';

import { useEffect } from 'react';
import { backNavigationEvent } from '@/lib/back-navigation';

type Step = 'cart' | 'address' | 'payment';
export default function CheckoutBackNavigation({ step, complete, onStep }: { step: Step; complete: boolean; onStep: (step: Step) => void }) {
  useEffect(() => {
    const onBack = (event: Event) => {
      if (complete || step === 'cart') return;
      event.preventDefault();
      onStep(step === 'payment' ? 'address' : 'cart');
    };
    window.addEventListener(backNavigationEvent, onBack);
    return () => window.removeEventListener(backNavigationEvent, onBack);
  }, [step, complete, onStep]);
  return null;
}
