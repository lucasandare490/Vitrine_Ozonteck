'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react';
import { Payment, StatusScreen } from '@mercadopago/sdk-react';
import CvvHelp from './CvvHelp';

type Props = Pick<ComponentProps<typeof Payment>, 'initialization' | 'onSubmit'>;
const customization: ComponentProps<typeof Payment>['customization'] = {
  visual: { style: { theme: 'default' } },
  paymentMethods: process.env.NEXT_PUBLIC_PAYMENT_SANDBOX === 'true'
    ? { creditCard: 'all' }
    : { ticket: 'all', bankTransfer: 'all', creditCard: 'all' },
};
const onReady = () => undefined;

export const CheckoutStatus = memo(function CheckoutStatus({ paymentId }: { paymentId: string }) {
  const initialization = useMemo(() => ({ paymentId }), [paymentId]);
  const [error, setError] = useState(false);
  const onError = useCallback(() => setError(true), []);
  return <><StatusScreen initialization={initialization} onReady={onReady} onError={onError} />{error && <p role="alert" className="p-4 text-sm">Não foi possível carregar as instruções de pagamento. Consulte seus pedidos antes de tentar pagar novamente.</p>}</>;
});

export default memo(function CheckoutPayment({ initialization, onSubmit }: Props) {
  const submitRef = useRef(onSubmit);
  const root = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [showCvv, setShowCvv] = useState(false);
  useEffect(() => { submitRef.current = onSubmit; }, [onSubmit]);
  // The SDK recreates its Brick when any callback or configuration identity changes.
  const submit = useCallback<NonNullable<Props['onSubmit']>>(async (...args) => {
    setError('');
    try { return await submitRef.current(...args); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível processar o pagamento.');
      throw cause;
    }
  }, []);
  const onError = useCallback<NonNullable<ComponentProps<typeof Payment>['onError']>>((event) => {
    if (event.type === 'critical') setError('Não foi possível carregar o pagamento. Atualize a página ou tente novamente em instantes.');
    // Field validation belongs beside the field; non-critical SDK warnings are not payment failures.
  }, []);

  useEffect(() => {
    const container = root.current;
    if (!container) return;
    // Inspect only the outer secure-field element, never card values or iframe contents.
    const refresh = () => {
      const fields = Array.from(container.querySelectorAll('iframe, input'));
      const cvv = fields.find(field => /security.?code|cvv|c[oó]digo de seguran[cç]a/i.test(
        `${field.id} ${field.getAttribute('name') || ''} ${field.getAttribute('title') || ''}`,
      ) && field.getClientRects().length > 0);
      if (!cvv) { setShowCvv(false); return; }
      if (document.activeElement === cvv) setShowCvv(true);
      else if (!container.querySelector('details')?.contains(document.activeElement)) setShowCvv(false);
    };
    const observer = new MutationObserver(refresh);
    observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
    const onFocus = () => window.setTimeout(refresh, 0);
    window.addEventListener('blur', onFocus);
    container.addEventListener('focusin', onFocus);
    container.addEventListener('click', onFocus);
    return () => { observer.disconnect(); window.removeEventListener('blur', onFocus); container.removeEventListener('focusin', onFocus); container.removeEventListener('click', onFocus); };
  }, []);

  return <div ref={root}>
    <Payment initialization={initialization} customization={customization} onSubmit={submit} onReady={onReady} onError={onError} />
    {error && <p role="alert" className="px-4 py-2 text-sm text-red-700">{error}</p>}
    {showCvv && <CvvHelp />}
  </div>;
});
