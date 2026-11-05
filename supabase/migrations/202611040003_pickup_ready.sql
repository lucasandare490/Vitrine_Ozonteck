begin;

-- Payment approval starts preparation; readiness is always an explicit admin action.
alter table public.pedidos add column retirada_pronta_em timestamptz;
alter table public.pedidos add constraint pedidos_pickup_ready_eligible check (
  retirada_pronta_em is null or coalesce(
    status = 'preparando' and status_pagamento = 'approved'
    and endereco_entrega ->> 'modalidade' = 'retirada', false)
);

create function public.guard_pickup_ready() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare changed boolean;
begin
  if tg_op = 'INSERT' then
    changed := new.retirada_pronta_em is not null;
  else
    changed := new.retirada_pronta_em is distinct from old.retirada_pronta_em;
  end if;

  -- No service-role bypass: backend/payment writes cannot announce readiness.
  if changed and public.is_admin() is not true then
    raise exception using errcode = '42501', message = 'Somente administradores podem alterar a retirada pronta';
  end if;

  if new.retirada_pronta_em is not null and (
    new.status = 'preparando' and new.status_pagamento = 'approved'
    and new.endereco_entrega ->> 'modalidade' = 'retirada'
  ) is not true then
    if changed then
      raise exception using errcode = '23514', message = 'Retirada pronta exige pedido em preparo, pagamento aprovado e modalidade retirada';
    end if;
    -- Preserve refund/reconciliation/status updates while revoking obsolete readiness.
    new.retirada_pronta_em := null;
  end if;
  return new;
end $$;
create trigger guard_pickup_ready before insert or update on public.pedidos
  for each row execute function public.guard_pickup_ready();

-- support_received is also reserved for the following support migration (0004).
alter table public.customer_email_outbox drop constraint customer_email_outbox_event_check;
alter table public.customer_email_outbox add constraint customer_email_outbox_event_check check (
  event in ('welcome','payment_pending','payment_approved','payment_rejected','order_changed',
    'order_shipped','order_delivered','order_cancelled','refund_confirmed','pickup_ready','support_received')
);

create function public.queue_pickup_ready_email() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.pedidos%rowtype;
begin
  -- Read the committed transaction's final order, including multi-write refunds.
  select * into o from public.pedidos where id = new.id;
  if not found then return null; end if;
  if o.retirada_pronta_em is not null and o.status = 'preparando'
     and o.status_pagamento = 'approved' and o.endereco_entrega ->> 'modalidade' = 'retirada' then
    if o.user_id is not null then
      insert into public.customer_email_outbox(dedupe_key,user_id,pedido_id,event)
        values(o.id::text || ':pickup_ready',o.user_id,o.id,'pickup_ready')
        on conflict(dedupe_key) do nothing;
    end if;
  else
    -- Revoke an in-flight lease too, so the worker cannot settle an obsolete claim.
    -- Sent history stays intact; a skipped event is never revived or queued twice.
    update public.customer_email_outbox
      set state = 'skipped', error_code = 'PICKUP_NO_LONGER_READY', lease = null, locked_until = null
      where pedido_id = o.id and event = 'pickup_ready' and state in ('pending','sending','failed');
  end if;
  return null;
end $$;
create constraint trigger customer_pickup_ready_email after insert or update on public.pedidos
  deferrable initially deferred for each row execute function public.queue_pickup_ready_email();

revoke all on function public.guard_pickup_ready(), public.queue_pickup_ready_email()
  from public, anon, authenticated, service_role;

commit;
