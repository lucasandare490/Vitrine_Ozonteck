begin;

-- Bind before contacting a provider. Credentials themselves never belong in SQL.
create table if not exists public.pedido_payment_provider (
  pedido_id uuid primary key references public.pedidos(id),
  api text not null check (api in ('payments', 'orders')),
  profile text not null,
  account_id text,
  application_id text,
  environment text not null check (environment in ('production', 'sandbox')),
  created_at timestamptz not null default now(),
  check (api <> 'orders' or (account_id is not null and application_id is not null))
);

alter table public.pedido_payment_provider enable row level security;
revoke all on public.pedido_payment_provider from public, anon, authenticated;
grant select, insert on public.pedido_payment_provider to service_role;

-- Includes old reservations whose provider request might have timed out.
insert into public.pedido_payment_provider (pedido_id, api, profile, environment)
select id, 'payments', 'legacy',
  case when checkout_id like 'sandbox-%' then 'sandbox' else 'production' end
from public.pedidos
on conflict (pedido_id) do nothing;

create or replace function public.bind_order_payment_provider(
  p_order uuid, p_account text, p_application text
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_order public.pedidos%rowtype;
  v_binding public.pedido_payment_provider%rowtype;
begin
  if p_account is null or p_account !~ '^[0-9]+$'
     or p_application is null or p_application !~ '^[0-9]+$' then
    raise exception 'INVALID_PROVIDER_IDENTITY';
  end if;
  select * into v_order from public.pedidos where id = p_order for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  select * into v_binding from public.pedido_payment_provider where pedido_id = p_order;
  if found then return to_jsonb(v_binding); end if;
  if v_order.id_pagamento_mp is not null then
    raise exception 'UNBOUND_EXISTING_PAYMENT';
  end if;
  insert into public.pedido_payment_provider
    (pedido_id, api, profile, account_id, application_id, environment)
  values (p_order, 'orders', 'ozonlife', p_account, p_application, 'production')
  returning * into v_binding;
  return to_jsonb(v_binding);
end;
$$;
revoke all on function public.bind_order_payment_provider(uuid,text,text) from public, anon, authenticated;
grant execute on function public.bind_order_payment_provider(uuid,text,text) to service_role;

commit;
