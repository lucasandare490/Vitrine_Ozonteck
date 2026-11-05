'use client';

import { loadMercadoPago } from '@mercadopago/sdk-js';
import { useEffect, useId, useRef, useState } from 'react';
import { cardMethods, cardInstallments, type CardMethod, type CardInstallment } from '@/lib/secure-card-options';
import { mountCardFields } from '@/lib/secure-card-fields';
import { isValidCpf } from '@/lib/auth';
import type { CheckoutFormData } from './OrdersCheckoutPayment';
import CvvHelp from './CvvHelp';

type Client = {
  fields: Parameters<typeof mountCardFields>[0] & { createCardToken(data: object): Promise<{ id?: string } | undefined> };
  getPaymentMethods(data: { bin: string }): Promise<unknown>;
  getInstallments(data: { bin: string; amount: string; paymentMethodId: string; paymentTypeId: string }): Promise<unknown>;
};
type Props = {
  amount: number;
  payer?: { firstName?: string; lastName?: string; email?: string; identification?: { number?: string } };
  onSubmit(data: CheckoutFormData): Promise<unknown>;
};

export default function SecureCardPayment({ amount, payer, onSubmit }: Props) {
  const prefix = `secure-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [client, setClient] = useState<Client | null>(null);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [valid, setValid] = useState<Record<string, boolean>>({});
  const [bin, setBin] = useState('');
  const [methods, setMethods] = useState<CardMethod[]>([]);
  const [methodKey, setMethodKey] = useState('');
  const [costs, setCosts] = useState<CardInstallment[]>([]);
  const [costIndex, setCostIndex] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [cvvFocused, setCvvFocused] = useState(false);
  const [name, setName] = useState(() => `${payer?.firstName || ''} ${payer?.lastName || ''}`.trim());
  const [cpf, setCpf] = useState(() => payer?.identification?.number || '');
  const fields = useRef<ReturnType<typeof mountCardFields> | null>(null);
  const lifetime = useRef(0);
  const locked = useRef(false);
  const submitRef = useRef(onSubmit);
  useEffect(() => { submitRef.current = onSubmit; }, [onSubmit]);

  useEffect(() => {
    const run = ++lifetime.current;
    let currentFields: ReturnType<typeof mountCardFields> | null = null;
    const initialized = new Set<string>();
    const active = () => run === lifetime.current;
    const timeout = window.setTimeout(() => {
      if (active() && initialized.size < 3) setError('Os campos seguros demoraram para carregar. Confira a conexão e atualize a página.');
    }, 15000);
    void (async () => {
      try {
        await loadMercadoPago();
        if (!active()) return;
        const Constructor = (window as unknown as { MercadoPago?: new (key: string, options: object) => Client }).MercadoPago;
        const key = process.env.NEXT_PUBLIC_MP_ORDERS_PUBLIC_KEY;
        if (!Constructor || !key) throw new Error('SDK_UNAVAILABLE');
        const instance = new Constructor(key, { locale: 'pt-BR' });
        currentFields = mountCardFields(instance.fields, prefix, {
          ready: field => { if (active()) { initialized.add(field); setReady(value => ({ ...value, [field]: true })); if (initialized.size === 3) { window.clearTimeout(timeout); setError(''); } } },
          valid: (field, value) => { if (active()) setValid(previous => ({ ...previous, [field]: value })); },
          bin: value => { if (active()) { setBin(value); setMethods([]); setCosts([]); setMethodKey(''); setCostIndex(''); } },
          cvvFocus: focused => { if (active()) setCvvFocused(focused); },
          error: () => { if (active()) setError('Confira os campos do cartão. Se o formulário não carregar, atualize a página.'); },
        });
        fields.current = currentFields; setClient(instance);
      } catch { if (active()) setError('Não foi possível carregar os campos seguros do cartão. Atualize a página.'); }
    })();
    const currentLifetime = lifetime;
    return () => { currentLifetime.current++; window.clearTimeout(timeout); currentFields?.unmount(); fields.current = null; };
  }, [prefix]);

  useEffect(() => {
    let active = true;
    if (!client || !bin) return;
    void (async () => {
      try {
        const result = cardMethods(await client.getPaymentMethods({ bin }));
        if (!active) return;
        setMethods(result); setMethodKey(result[0]?.key || '');
        setError(result.length ? '' : 'Este cartão não está disponível para pagamento nesta loja. Escolha outra forma.');
      } catch { if (active) setError('Não foi possível identificar o cartão. Confira o número e tente novamente.'); }
    })();
    return () => { active = false; };
  }, [client, bin]);

  const selectedMethod = methods.find(method => method.key === methodKey);
  useEffect(() => {
    let active = true;
    const start = window.setTimeout(() => {
      setCosts([]); setCostIndex('');
      if (!client || !bin || !selectedMethod) { setLoadingOptions(false); return; }
      setLoadingOptions(true);
      // These settings come from the provider's BIN lookup, never from card values.
      fields.current?.configure(selectedMethod.settings?.[0]);
      void (async () => {
        try {
          const response = await client.getInstallments({ amount: amount.toFixed(2), bin,
            paymentMethodId: selectedMethod.id, paymentTypeId: selectedMethod.type });
          if (!active) return;
          const options = cardInstallments(response, selectedMethod);
          setCosts(options); setCostIndex(options.length ? '0' : '');
          setError(options.length ? '' : 'Não há condições de pagamento disponíveis para este cartão e valor. Escolha outra forma.');
        } catch { if (active) setError('Não foi possível consultar as condições do cartão. Tente outra forma ou atualize a página.'); }
        finally { if (active) setLoadingOptions(false); }
      })();
    }, 0);
    return () => { active = false; window.clearTimeout(start); };
  }, [client, bin, selectedMethod, amount]);

  async function pay(event: React.FormEvent) {
    event.preventDefault();
    if (locked.current) return;
    const cost = costs[Number(costIndex)];
    if (!client || !selectedMethod || loadingOptions || costIndex === '' || !cost || !['cardNumber', 'expirationDate', 'securityCode'].every(key => ready[key] && valid[key])) {
      setError('Preencha os campos do cartão e selecione uma condição de pagamento disponível.'); return;
    }
    if (name.trim().length < 3 || !isValidCpf(cpf)) { setError('Confira o nome e o CPF do titular do cartão.'); return; }
    const run = lifetime.current;
    locked.current = true; setBusy(true); setError('');
    try {
      // The provider reads its own fields. PAN, expiry and CVV never enter our state or request.
      const token = await client.fields.createCardToken({ cardholderName: name.trim(), identificationType: 'CPF', identificationNumber: cpf.replace(/\D/g, '') });
      if (run !== lifetime.current) return;
      if (!token?.id) throw new Error('TOKEN_UNAVAILABLE');
      await submitRef.current({ token: token.id, payment_method_id: selectedMethod.id,
        payment_type_id: selectedMethod.type, installments: cost.installments, issuer_id: cost.issuer,
        payer: { email: payer?.email } });
    } catch { if (run === lifetime.current) setError('Não foi possível confirmar o pagamento. Confira os dados e consulte sua compra antes de tentar novamente.'); }
    finally { locked.current = false; if (run === lifetime.current) setBusy(false); }
  }
  const input = 'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 focus-within:ring-2 focus-within:ring-teal-600';
  const secureInput = `${input} h-12 overflow-hidden [&>iframe]:block [&>iframe]:h-full [&>iframe]:w-full`;
  return <form onSubmit={event => void pay(event)} className="space-y-4 rounded-xl border border-slate-200 p-5" aria-label="Dados seguros do cartão">
    <p className="text-sm text-slate-600">Os dados do cartão são preenchidos nos campos protegidos do Mercado Pago.</p>
    {Object.keys(ready).length < 3 && !error && <p role="status" className="text-sm text-slate-600">Carregando campos seguros...</p>}
    <label className="block text-sm font-semibold">Nome do titular<input autoComplete="cc-name" required minLength={3} maxLength={100} disabled={busy} value={name} onChange={event => setName(event.target.value)} className={input} /></label>
    <label className="block text-sm font-semibold">CPF do titular<input inputMode="numeric" required maxLength={14} disabled={busy} value={cpf} onChange={event => setCpf(event.target.value)} className={input} /></label>
    <div><p id={`${prefix}-number-label`} className="text-sm font-semibold">Número do cartão</p><div aria-labelledby={`${prefix}-number-label`} id={`${prefix}-cardNumber`} className={secureInput} /></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div><p className="text-sm font-semibold">Validade</p><div id={`${prefix}-expirationDate`} className={secureInput} /></div>
      <div><p className="text-sm font-semibold">Código de segurança (CVV)</p><div id={`${prefix}-securityCode`} className={secureInput} /></div>
    </div>
    {cvvFocused && <CvvHelp expanded />}
    {methods.length > 0 && <label className="block text-sm font-semibold">Tipo de cartão<select value={methodKey} disabled={busy} onChange={event => { setMethodKey(event.target.value); setCosts([]); setCostIndex(''); }} className={input}>{methods.map(method => <option key={method.key} value={method.key}>{method.name} · {method.type === 'credit_card' ? 'Crédito' : 'Débito'}</option>)}</select></label>}
    {loadingOptions && <p role="status" className="text-sm">Consultando condições disponíveis...</p>}
    {costs.length > 0 && <label className="block text-sm font-semibold">Condição de pagamento<select value={costIndex} disabled={busy || loadingOptions} onChange={event => setCostIndex(event.target.value)} className={input}>{costs.map((cost, index) => <option key={`${cost.issuer}-${index}`} value={String(index)}>{cost.label}</option>)}</select></label>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button disabled={busy || !client || loadingOptions || !costs.length} className="min-h-12 rounded-xl bg-teal-700 px-6 font-semibold text-white disabled:opacity-50">{busy ? 'Confirmando...' : `Pagar ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}</button>
  </form>;
}
