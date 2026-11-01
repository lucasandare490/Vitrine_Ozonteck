import type { Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { renderCustomerEmail, type CustomerEmailEvent } from '../../lib/customer-email';
import { shouldDeliverOrderEmail, emailRetry } from '../../lib/customer-email-delivery';

// A scheduled function has no public HTTP endpoint. Credentials stay in server env vars.
export const config: Config = { schedule: '*/5 * * * *' };

export default async function deliverCustomerEmail() {
  if (process.env.CUSTOMER_EMAIL_ENABLED !== 'true') return;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_APP_PASSWORD;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url || !key || !user || !pass || !siteUrl) throw new Error('EMAIL_CONFIGURATION_MISSING');
  const site = new URL(siteUrl);
  if (site.protocol !== 'https:' || site.username || site.password) throw new Error('EMAIL_SITE_INVALID');
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.rpc('claim_customer_email');
  if (error) throw new Error('EMAIL_QUEUE_UNAVAILABLE');
  const job = data?.[0] as { id: string; lease: string; user_id: string; pedido_id: string | null; event: CustomerEmailEvent; attempts: number } | undefined;
  if (!job) return;
  const finish = async (values: Record<string, unknown>) => {
    const result = await db.from('customer_email_outbox').update(values).eq('id', job.id).eq('lease', job.lease).eq('state', 'sending').select('id');
    if (result.error || result.data?.length !== 1) throw new Error('EMAIL_ACK_FAILED');
  };
  let accepted = false;
  try {
    const { data: account, error: accountError } = await db.auth.admin.getUserById(job.user_id);
    if (accountError) throw new Error('EMAIL_ACCOUNT_LOOKUP_FAILED');
    if (!account.user?.email || !account.user.email_confirmed_at) {
      await finish({ state: 'skipped', error_code: 'NO_VERIFIED_EMAIL', lease: null, locked_until: null });
      return;
    }
    if (job.pedido_id) {
      const { data: order, error: orderError } = await db.from('pedidos').select('user_id,status,status_pagamento').eq('id', job.pedido_id).maybeSingle();
      if (orderError) throw new Error('EMAIL_ORDER_LOOKUP_FAILED');
      if (!order || order.user_id !== job.user_id || !shouldDeliverOrderEmail(job.event, order)) {
        await finish({ state: 'skipped', error_code: 'EVENT_SUPERSEDED', lease: null, locked_until: null });
        return;
      }
    }
    const content = renderCustomerEmail({ event: job.event, siteUrl,
      reference: job.pedido_id || undefined,
      actionUrl: job.pedido_id ? '/conta/pedidos' : '/conta',
    });
    const smtp = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user, pass: pass.replace(/\s/g, '') }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
      disableFileAccess: true, disableUrlAccess: true,
    });
    try {
      const result = await smtp.sendMail({ from: { name: 'Ozonteck Recife | Rogério André', address: user },
        to: account.user.email, messageId: `<${job.id}@${site.hostname}>`, ...content });
      if (!result.accepted?.length) throw new Error('EMAIL_NOT_ACCEPTED');
      accepted = true;
    } finally { smtp.close(); }
    await finish({ state: 'sent', sent_at: new Date().toISOString(), error_code: null, lease: null, locked_until: null });
  } catch {
    // Never expose SMTP responses, addresses, body text or credentials in logs.
    // An accepted SMTP message with a failed DB acknowledgement is held for manual review.
    await finish(accepted
      ? { state: 'failed', error_code: 'ACCEPTED_ACK_UNCERTAIN', lease: null, locked_until: null }
      : { ...emailRetry(job.attempts), error_code: 'DELIVERY_FAILED' });
  }
}
