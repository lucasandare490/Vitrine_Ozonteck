'use client';

import { CardPayment } from '@mercadopago/sdk-react';
import { Barcode, CreditCard, Check, ArrowRight, Loader2 } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import CvvHelp from './CvvHelp';

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

function PixSymbol() {
  return <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true"><path d="m10 7 4-4a3 3 0 0 1 4 0l4 4h-2l-4 4-4-4h-2Zm-3 3-4 4a3 3 0 0 0 0 4l4 4h5l4-4 4 4h5l4-4a3 3 0 0 0 0-4l-4-4h-5l-4 4-4-4H7Zm3 15 4 4a3 3 0 0 0 4 0l4-4h-2l-4-4-4 4h-2Z" fill="currentColor" /></svg>;
}

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
      {([['pix', 'Pix', 'QR Code ou copia e cola'], ['boleto', 'Boleto', 'Pague pelo app do seu banco'], ['card', 'Cartão', 'Crédito ou débito']] as const).map(([value, label, description]) =>
        <label key={value} className={`relative flex min-h-36 cursor-pointer flex-col gap-3 rounded-2xl border-2 p-5 transition-colors focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2 ${busy ? 'cursor-wait opacity-60' : ''} ${method === value ? 'border-teal-600 bg-teal-50/70 shadow-sm dark:bg-teal-950/40' : 'border-slate-200 bg-white hover:border-teal-300 dark:border-neutral-700 dark:bg-neutral-900'}`}>
          <input className="sr-only" type="radio" name="payment-method" value={value} checked={method === value} onChange={() => { setMethod(value); setError(''); }} />
          <span className="flex items-center justify-between gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-teal-100 dark:bg-neutral-800 dark:text-teal-300 dark:ring-neutral-700">{value === 'pix' ? <PixSymbol /> : value === 'card' ? <CreditCard size={29} aria-hidden="true" /> : <Barcode size={29} aria-hidden="true" />}</span><span aria-hidden="true" className={`flex h-5 w-5 items-center justify-center rounded-full border ${method === value ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300'}`}>{method === value && <Check size={13} strokeWidth={3} />}</span></span>
          <span><span className="block text-base font-bold text-slate-900 dark:text-white">{label}</span><span className="mt-1 block text-xs leading-relaxed text-slate-600 dark:text-slate-300">{description}</span></span>
        </label>)}
    </fieldset>
    {method === 'card'
      ? <><CardPayment initialization={initialization} customization={customization} onSubmit={submitCard} onReady={ready} onError={onError} /><CvvHelp /></>
      : <div className="space-y-4 rounded-xl bg-slate-50 p-5 dark:bg-neutral-900">
        <p className="text-sm text-slate-600">{method === 'pix' ? 'O QR Code e o código Pix aparecerão na próxima tela e ficarão disponíveis em Meus pedidos.' : 'O boleto ficará disponível na próxima tela e em Meus pedidos. A compra será confirmada após a compensação bancária.'}</p>
        <button type="button" disabled={busy} onClick={() => void submit({ payment_method_id: method }).catch(() => undefined)} className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-teal-700 px-6 font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:opacity-50 sm:w-auto">{busy ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : null}{busy ? 'Confirmando...' : method === 'pix' ? 'Gerar Pix' : 'Gerar boleto'}{!busy && <ArrowRight size={18} aria-hidden="true" />}</button>
      </div>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </div>;
});
