'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, ExternalLink, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import OrderChangeActions from './OrderChangeActions';

type PaymentDetails = {
  orderId: string; orderStatus: string; status: string; amount: number; method: string; type: string;
  expiresAt: string | null; expired: boolean; payable: boolean;
  pixCode: string | null; pixImage: string | null; boletoCode: string | null; boletoUrl: string | null;
  authenticationUrl?: string | null;
};

export default function OrderPayment({ orderId, onStatusChange }: { orderId: string; onStatusChange?: (status: string) => void }) {
  const statusCallback = useRef(onStatusChange);
  useEffect(() => { statusCallback.current = onStatusChange; }, [onStatusChange]);
  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const previous = useRef<string | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const controller = new AbortController();
    async function update() {
      if (inFlight || document.hidden) return;
      inFlight = true;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Entre na sua conta para consultar o pagamento.');
        const response = await fetch(`/api/pedidos/${encodeURIComponent(orderId)}/pagamento`, { cache: 'no-store', headers: { Authorization: `Bearer ${session.access_token}` }, signal: controller.signal });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Não foi possível consultar o pagamento.');
        if (!active) return;
        setPayment(result); setError('');
        statusCallback.current?.(result.status);
        const signature = `${result.status}:${result.orderStatus}`;
        if (previous.current !== signature) {
          previous.current = signature;
          window.dispatchEvent(new Event('order-payment-updated'));
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o pagamento.');
      } finally { inFlight = false; if (active) setLoading(false); }
    }
    void update();
    const interval = window.setInterval(() => void update(), 15000);
    const refresh = () => void update();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { active = false; controller.abort(); clearInterval(interval); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [orderId, retry]);
  const copy = useCallback(async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(true); }
    catch { setError('Não foi possível copiar. Selecione o código abaixo e copie manualmente.'); }
  }, []);
  const approved = payment?.status === 'approved';
  const terminal: Record<string, string> = { rejected: 'Pagamento recusado', cancelled: 'Pagamento cancelado', refunded: 'Pagamento reembolsado', charged_back: 'Pagamento contestado' };
  const status = !payment ? 'Pagamento do pedido' : approved ? 'Pagamento aprovado' : payment.expired ? 'Prazo de pagamento encerrado' : terminal[payment.status || ''] || (payment.status === 'in_process' ? 'Pagamento em análise' : 'Aguardando pagamento');
  return <section aria-label="Pagamento do pedido" className="w-full min-w-0 space-y-4 text-left">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <h2 aria-live="polite" className="flex items-center gap-2 text-lg font-bold">{approved ? <CheckCircle2 className="text-teal-700" size={22} /> : <Clock className="text-amber-600" size={22} />}{loading ? 'Consultando pagamento...' : status}</h2>
      <button type="button" title="Atualizar pagamento" aria-label="Atualizar pagamento" onClick={() => setRetry(value => value + 1)} className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-200"><RefreshCw size={18} /></button>
    </div>
    {error && <p role="alert" className="text-sm text-amber-800">{error}</p>}
    {approved && <p className="text-sm">O Mercado Pago confirmou o pagamento. Acompanhe a preparação e o recebimento em Meus pedidos.</p>}
    {payment?.payable && payment.authenticationUrl && <div className="space-y-3">
      <p className="font-semibold">Confirme o pagamento com seu banco</p>
      <iframe title="Confirmação segura do cartão" src={payment.authenticationUrl} className="h-[600px] w-full rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
    </div>}
    {payment?.payable && !error && <>
      <p className="font-semibold">{payment.method === 'pix' ? 'Pague com Pix' : payment.type === 'ticket' ? 'Pague o boleto' : 'Acompanhe a análise do pagamento'} · {payment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
      {payment.expiresAt && <p className="text-sm text-slate-600">Vencimento: {new Date(payment.expiresAt).toLocaleString('pt-BR')}</p>}
      <div className="flex flex-col items-start gap-5 sm:flex-row">
        {payment.pixImage && /^[A-Za-z0-9+/=\r\n]+$/.test(payment.pixImage) && <div className="shrink-0 bg-white p-2">{/* Provider-supplied QR; never send it to the image optimizer. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/png;base64,${payment.pixImage}`} alt="QR Code para pagar este pedido com Pix" width={200} height={200} className="h-[200px] w-[200px]" />
        </div>}
        <div className="min-w-0 flex-1 space-y-3">
          {(payment.pixCode || payment.boletoCode) && <>
            <label className="block text-sm font-medium">{payment.pixCode ? 'Pix copia e cola' : 'Código do boleto'}<textarea readOnly value={payment.pixCode || payment.boletoCode || ''} rows={3} className="mt-2 w-full resize-none break-all rounded-md border border-slate-300 bg-white p-3 font-mono text-xs text-slate-900" /></label>
            <button type="button" onClick={() => void copy(payment.pixCode || payment.boletoCode || '')} className="flex min-h-11 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 font-semibold text-white"><Copy size={18} />{copied ? 'Código copiado' : payment.pixCode ? 'Copiar código Pix' : 'Copiar código do boleto'}</button>
          </>}
          {payment.boletoUrl && <a href={payment.boletoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-teal-700 underline"><ExternalLink size={18} />Abrir boleto</a>}
          {payment.type === 'ticket' && <p className="text-sm text-slate-600">O status será atualizado após a confirmação bancária. Gerar o boleto não significa que ele foi pago.</p>}
        </div>
      </div>
    </>}
    {payment?.expired && !approved && <p className="text-sm">Não pague este código vencido. Entre em contato com a loja para verificar como continuar.</p>}
    {payment && !error && ['pending', 'in_process', 'authorized', 'rejected', 'cancelled'].includes(payment.status) && <OrderChangeActions orderId={orderId} />}
  </section>;
}
