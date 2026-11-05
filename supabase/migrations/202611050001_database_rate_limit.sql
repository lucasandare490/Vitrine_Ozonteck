begin;

-- Operational counters only; no raw IP, user ID, token or payment information.
create table if not exists public.api_rate_limits (
  namespace text not null,
  identity_hash text not null,
  requests timestamptz[] not null default '{}',
  expires_at timestamptz not null,
  primary key(namespace, identity_hash)
);
create index if not exists api_rate_limits_expiry_idx on public.api_rate_limits(expires_at);
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated, service_role;

create or replace function public.consume_api_rate_limit(
  p_namespace text, p_key text, p_limit integer, p_window_ms integer
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  checked_at timestamptz;
  recent timestamptz[];
begin
  if p_namespace is null or length(p_namespace) not between 1 and 100
    or p_namespace !~ '^[a-zA-Z0-9:_-]+$'
    or p_key is null or p_key !~ '^[a-f0-9]{64}$'
    or p_limit is null or p_limit not between 1 and 10000
    or p_window_ms is null or p_window_ms not between 1 and 86400000 then
    raise exception 'INVALID_RATE_LIMIT_PARAMETERS' using errcode='22023';
  end if;

  -- Both first-use insert and row locking serialize concurrent server instances.
  insert into public.api_rate_limits(namespace, identity_hash, expires_at)
    values(p_namespace, p_key, clock_timestamp() + p_window_ms * interval '1 millisecond')
    on conflict do nothing;
  perform 1 from public.api_rate_limits
    where namespace=p_namespace and identity_hash=p_key for update;
  checked_at := clock_timestamp();
  select coalesce(array_agg(request_at order by request_at), '{}'::timestamptz[])
    into recent
    from public.api_rate_limits r cross join lateral unnest(r.requests) request_at
    where r.namespace=p_namespace and r.identity_hash=p_key
      and request_at > checked_at - p_window_ms * interval '1 millisecond';
  if cardinality(recent) >= p_limit then return false; end if;
  update public.api_rate_limits
    set requests=array_append(recent, checked_at),
        expires_at=checked_at + p_window_ms * interval '1 millisecond'
    where namespace=p_namespace and identity_hash=p_key;

  -- Bound housekeeping and avoid waiting on another request's locked counter.
  with expired as (
    select namespace, identity_hash from public.api_rate_limits
    where expires_at < checked_at - interval '1 day'
    order by expires_at limit 64 for update skip locked
  ) delete from public.api_rate_limits r using expired e
    where r.namespace=e.namespace and r.identity_hash=e.identity_hash;
  return true;
end;
$$;
revoke all on function public.consume_api_rate_limit(text,text,integer,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.consume_api_rate_limit(text,text,integer,integer) to service_role;

commit;
