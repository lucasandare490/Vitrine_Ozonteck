begin;

create table if not exists public.affiliate_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
create table if not exists public.affiliate_prices (
  product_code text primary key references public.produtos(code) on update cascade,
  price numeric(12,2) not null check (price > 0 and price < 1000000)
);
create table if not exists public.customer_prices (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_code text not null references public.produtos(code) on update cascade,
  price numeric(12,2) not null check (price > 0 and price < 1000000),
  primary key(user_id, product_code)
);
create table if not exists public.pricing_audit (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null,
  user_id uuid,
  product_code text,
  before_value jsonb,
  after_value jsonb,
  created_at timestamptz not null default now()
);

-- No client, including an administrator, can write tables directly.
alter table public.affiliate_access enable row level security;
alter table public.affiliate_prices enable row level security;
alter table public.customer_prices enable row level security;
alter table public.pricing_audit enable row level security;
revoke all on public.affiliate_access, public.affiliate_prices, public.customer_prices, public.pricing_audit from public, anon, authenticated;
grant select, insert, update, delete on public.affiliate_access, public.affiliate_prices, public.customer_prices to service_role;
grant select, insert on public.pricing_audit to service_role;
grant usage on sequence public.pricing_audit_id_seq to service_role;

create or replace function public.resolve_customer_prices(p_user_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'enabled', coalesce((select enabled from public.affiliate_access where user_id = p_user_id), false),
    'prices', coalesce((select jsonb_object_agg(p.code,
      case when coalesce(a.enabled, false) then coalesce(c.price, f.price, p.price) else p.price end)
      from public.produtos p
      left join public.affiliate_access a on a.user_id = p_user_id
      left join public.affiliate_prices f on f.product_code = p.code
      left join public.customer_prices c on c.product_code = p.code and c.user_id = p_user_id
      where coalesce(p.is_deleted, false) = false), '{}'::jsonb)
  );
$$;
revoke all on function public.resolve_customer_prices(uuid) from public, anon, authenticated;
grant execute on function public.resolve_customer_prices(uuid) to service_role;

create or replace function public.my_store_prices()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.account_mfa_allowed() then raise exception 'MFA required' using errcode = '42501'; end if;
  return public.resolve_customer_prices(auth.uid());
end;
$$;
revoke all on function public.my_store_prices() from public;
grant execute on function public.my_store_prices() to anon, authenticated;

create or replace function public.admin_pricing(p_user_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() or not public.account_mfa_allowed() then
    raise exception 'Admin required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'enabled', coalesce((select enabled from public.affiliate_access where user_id = p_user_id), false),
    'products', coalesce((select jsonb_agg(jsonb_build_object('code', p.code, 'name', p.name,
      'price', p.price, 'affiliate_price', f.price, 'customer_price', c.price) order by p.name)
      from public.produtos p left join public.affiliate_prices f on f.product_code = p.code
      left join public.customer_prices c on c.product_code = p.code and c.user_id = p_user_id
      where coalesce(p.is_deleted, false) = false), '[]'::jsonb),
    'audit', coalesce((select jsonb_agg(x) from (select action, product_code, before_value, after_value, created_at
      from public.pricing_audit where user_id is not distinct from p_user_id order by id desc limit 20) x), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_pricing(uuid) from public, anon;
grant execute on function public.admin_pricing(uuid) to authenticated;

create or replace function public.admin_set_pricing(
  p_action text, p_user_id uuid default null, p_code text default null,
  p_price numeric default null, p_enabled boolean default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_before jsonb; v_after jsonb;
begin
  if not public.is_admin() or not public.account_mfa_allowed() then
    raise exception 'Admin required' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(610090001);
  if p_action not in ('access', 'affiliate', 'customer') or p_action is null then raise exception 'Invalid action'; end if;
  if p_action in ('access', 'customer') and (p_user_id is null or not exists (
    select 1 from public.profiles where id = p_user_id and role = 'cliente'
  )) then raise exception 'Invalid customer'; end if;
  if p_action <> 'access' then
    if p_code is null or not exists(select 1 from public.produtos where code = p_code and not coalesce(is_deleted,false)) then raise exception 'Invalid product'; end if;
    if p_price is not null and (p_price <= 0 or p_price >= 1000000 or p_price <> round(p_price,2)) then raise exception 'Invalid price'; end if;
  end if;
  if p_action = 'access' then
    if p_enabled is null then raise exception 'Invalid approval'; end if;
    select to_jsonb(a) into v_before from public.affiliate_access a where user_id = p_user_id;
    insert into public.affiliate_access(user_id, enabled) values(p_user_id, p_enabled)
      on conflict(user_id) do update set enabled = excluded.enabled, updated_at = now();
    v_after := jsonb_build_object('enabled', p_enabled);
  elsif p_action = 'affiliate' then
    if p_user_id is not null then raise exception 'Global price has no customer'; end if;
    select to_jsonb(a) into v_before from public.affiliate_prices a where product_code = p_code;
    if p_price is null then delete from public.affiliate_prices where product_code = p_code;
    else insert into public.affiliate_prices values(p_code,p_price) on conflict(product_code) do update set price = excluded.price; end if;
    v_after := jsonb_build_object('price', p_price);
  else
    select to_jsonb(a) into v_before from public.customer_prices a where user_id = p_user_id and product_code = p_code;
    if p_price is null then delete from public.customer_prices where user_id = p_user_id and product_code = p_code;
    else insert into public.customer_prices values(p_user_id,p_code,p_price) on conflict(user_id,product_code) do update set price = excluded.price; end if;
    v_after := jsonb_build_object('price', p_price);
  end if;
  insert into public.pricing_audit(actor,action,user_id,product_code,before_value,after_value)
    values(auth.uid(),p_action,p_user_id,p_code,v_before,v_after);
end;
$$;
revoke all on function public.admin_set_pricing(text,uuid,text,numeric,boolean) from public, anon;
grant execute on function public.admin_set_pricing(text,uuid,text,numeric,boolean) to authenticated;

-- Serializes approval/price changes against reservation; price never comes from the browser.
create or replace function public.reserve_priced_order(
  p_checkout_id text, p_user_id uuid, p_total numeric, p_delivery_address jsonb,
  p_items jsonb, p_reservation_minutes integer default 30
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_prices jsonb; v_item jsonb; v_total numeric := 0; v_price numeric;
begin
  perform pg_catalog.pg_advisory_xact_lock(610090001);
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) not between 1 and 50 then raise exception 'Invalid items'; end if;
  perform 1 from public.produtos where code in (select value->>'code' from jsonb_array_elements(p_items)) order by code for share;
  v_prices := public.resolve_customer_prices(p_user_id)->'prices';
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_price := (v_prices->>(v_item->>'code'))::numeric;
    if v_price is null or v_price <= 0 or v_price is distinct from (v_item->>'preco_unitario')::numeric then raise exception 'PRICE_CHANGED'; end if;
    v_total := v_total + v_price * (v_item->>'qtd')::integer;
  end loop;
  if v_total is distinct from p_total then raise exception 'PRICE_CHANGED'; end if;
  return public.reservar_pedido_checkout(p_checkout_id,p_user_id,p_total,p_delivery_address,p_items,p_reservation_minutes);
end;
$$;
revoke all on function public.reserve_priced_order(text,uuid,numeric,jsonb,jsonb,integer) from public, anon, authenticated;
grant execute on function public.reserve_priced_order(text,uuid,numeric,jsonb,jsonb,integer) to service_role;
notify pgrst, 'reload schema';
commit;
