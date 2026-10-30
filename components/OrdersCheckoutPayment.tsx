'use client';

import { CardPayment } from '@mercadopago/sdk-react';
import { memo, useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';

export type CheckoutFormData = {
  payment_method_id: string;
  payment_type_id?: 'credit_card' | 'debit_card';
  token?: string;
  installments?: number;
  issuer_id?: string | number;
  payer?: { email?: string };
};
type Props = {
  initialization: ComponentProps<typeof CardPayment>['initialization'];
  onSubmit: (data: { formData: CheckoutFormData }) => Promise<unknown>;
};
const customization: ComponentProps<typeof CardPayment>['customization'] = {
  paymentMethods: { maxInstallments: 12, types: { included: ['credit_card', 'debit_card'] } },
};
const ready = () => undefined;

export default memo(function OrdersCheckoutPayment({ initialization, onSubmit }: Props) {
  const [method, setMethod] = useState<'pix' | 'boleto' | 'card'>('pix');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submitRef = useRef(onSubmit);
  const inFlight = useRef(false);
  useEffect(() => { submitRef.current = onSubmit; }, [onSubmit]);
  const submit = useCallback(async (formData: CheckoutFormData) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { await submitRef.current({ formData }); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível confirmar o pagamento.');
      throw cause;
    } finally { inFlight.current = false; setBusy(false); }
  }, []);
  const submitCard = useCallback<NonNullable<ComponentProps<typeof CardPayment>['onSubmit']>>(async (data, extra) => {
    if (extra?.paymentTypeId !== 'credit_card' && extra?.paymentTypeId !== 'debit_card') {
      setError('Não foi possível identificar o tipo do cartão. Confira os dados.');
      throw new Error('Tipo de cartão indisponível.');
    }
    await submit({ ...data, payment_type_id: extra.paymentTypeId });
  }, [submit]);
  const onError = useCallback<NonNullable<ComponentProps<typeof CardPayment>['onError']>>(event => {
    if (event.type === 'critical') setError('Não foi possível carregar o formulário do cartão. Atualize a página.');
  }, []);
  return <div className="space-y-5">
    <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-3">
      <legend className="mb-3 font-semibold">Como deseja pagar?</legend>
      {([['pix', 'Pix'], ['boleto', 'Boleto'], ['card', 'Cartão de crédito ou débito']] as const).map(([value, label]) =>
        <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 ${method === value ? 'border-teal-600 bg-teal-50' : 'border-slate-200'}`}>
          <input type="radio" name="payment-method" value={value} checked={method === value} onChange={() => { setMethod(value); setError(''); }} />{label}
        </label>)}
    </fieldset>
    {method === 'card'
      ? <CardPayment initialization={initialization} customization={customization} onSubmit={submitCard} onReady={ready} onError={onError} />
      : <div className="space-y-4">
        <p className="text-sm text-slate-600">{method === 'pix' ? 'O QR Code e o código Pix aparecerão na próxima tela e ficarão disponíveis em Meus pedidos.' : 'O boleto ficará disponível na próxima tela e em Meus pedidos. A compra será confirmada após a compensação bancária.'}</p>
        <button type="button" disabled={busy} onClick={() => void submit({ payment_method_id: method }).catch(() => undefined)} className="min-h-11 rounded-lg bg-teal-700 px-6 font-semibold text-white disabled:opacity-50">{busy ? 'Confirmando...' : method === 'pix' ? 'Gerar Pix' : 'Gerar boleto'}</button>
      </div>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
});
