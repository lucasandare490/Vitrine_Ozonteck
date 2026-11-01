begin;

-- Events created after this migration only; never mail historical purchases.
create table public.customer_email_outbox (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  pedido_id uuid references public.pedidos(id) on delete cascade,
  event text not null check (event in ('welcome','payment_pending','payment_approved','payment_rejected','order_changed','order_shipped','order_delivered','order_cancelled','refund_confirmed')),
  state text not null default 'pending' check (state in ('pending','sending','sent','skipped','failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  lease uuid,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  error_code text,
  created_at timestamptz not null default now()
);
create index customer_email_queue on public.customer_email_outbox(state, available_at);
alter table public.customer_email_outbox enable row level security;
revoke all on public.customer_email_outbox from public, anon, authenticated;
grant select, update, insert on public.customer_email_outbox to service_role;

create function public.queue_order_email() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare o public.pedidos%rowtype; e text;
begin
  if tg_op='UPDATE' and new.status is not distinct from old.status
    and new.status_pagamento is not distinct from old.status_pagamento
    and new.id_pagamento_mp is not distinct from old.id_pagamento_mp then return null; end if;
  -- Deferred execution reads the final order, not intermediate reconciliation writes.
  select * into o from public.pedidos where id=new.id;
  if not found or o.user_id is null then return null; end if;
  e := case
    when o.status_pagamento='refunded' and o.status='reembolsado' then 'refund_confirmed'
    when o.status='entregue' and o.status_pagamento='approved' then 'order_delivered'
    when o.status='enviado' and o.status_pagamento='approved' then 'order_shipped'
    when o.status='preparando' and o.status_pagamento='approved' then 'payment_approved'
    when o.status='pagamento_recusado' and o.status_pagamento='rejected' then 'payment_rejected'
    when o.status in ('cancelado','cancelled') and o.status_pagamento='cancelled' then 'order_cancelled'
    when o.status='pending' and o.status_pagamento in ('pending','in_process','authorized') and o.id_pagamento_mp is not null then 'payment_pending'
    else null end;
  if e is not null then
    insert into public.customer_email_outbox(dedupe_key,user_id,pedido_id,event)
      values(o.id::text||':'||e,o.user_id,o.id,e) on conflict(dedupe_key) do nothing;
  end if;
  return null;
end $$;
create constraint trigger customer_order_email after insert or update on public.pedidos
  deferrable initially deferred for each row execute function public.queue_order_email();

create function public.queue_account_email() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.email_confirmed_at is not null and
    (tg_op='INSERT' or old.email_confirmed_at is null) then
    insert into public.customer_email_outbox(dedupe_key,user_id,event)
      values(new.id::text||':welcome',new.id,'welcome') on conflict(dedupe_key) do nothing;
  end if;
  return new;
end $$;
create trigger customer_welcome_email after insert or update of email_confirmed_at on auth.users
  for each row execute function public.queue_account_email();

create function public.queue_changed_order_email() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.novo_pedido_id is not null and old.novo_pedido_id is distinct from new.novo_pedido_id then
    insert into public.customer_email_outbox(dedupe_key,user_id,pedido_id,event)
      values(new.id::text||':changed',new.user_id,new.novo_pedido_id,'order_changed')
      on conflict(dedupe_key) do nothing;
  end if;
  return new;
end $$;
create trigger customer_changed_order_email after update of novo_pedido_id on public.pedido_alteracoes
  for each row execute function public.queue_changed_order_email();

-- One lease at a time, bounded daily sends and retries. No recipient/content from callers.
create function public.claim_customer_email() returns setof public.customer_email_outbox
language plpgsql security definer set search_path=public,pg_temp as $$
declare picked uuid;
begin
  perform pg_advisory_xact_lock(891021);
  if (select count(*) from public.customer_email_outbox where
      sent_at >= now()-interval '24 hours' or last_attempt_at >= now()-interval '24 hours') >= 100 then return; end if;
  update public.customer_email_outbox set state='failed', error_code='ATTEMPTS_EXHAUSTED', lease=null
    where state='sending' and locked_until<now() and attempts>=5;
  select id into picked from public.customer_email_outbox
    where attempts<5 and ((state='pending' and available_at<=now()) or (state='sending' and locked_until<now()))
    order by created_at for update skip locked limit 1;
  if picked is null then return; end if;
  return query update public.customer_email_outbox set state='sending', attempts=attempts+1,
    lease=gen_random_uuid(), locked_until=now()+interval '5 minutes', last_attempt_at=now()
    where id=picked returning *;
end $$;
revoke all on function public.queue_order_email(), public.queue_account_email(), public.queue_changed_order_email(), public.claim_customer_email() from public, anon, authenticated;
grant execute on function public.claim_customer_email() to service_role;
commit;
