begin;

-- Contact requests are separate from official registration and affiliate approval.
-- Existing profiles, registrations and commercial benefits are never changed.
create table if not exists public.join_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 120 and name !~ '[[:cntrl:]]'),
  phone text not null check (phone ~ '^[1-9][0-9]{9,14}$'),
  email text not null check (char_length(email) <= 254 and email ~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?([.][A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$'),
  interest text not null check (interest in ('consumo', 'distribuicao', 'ambos')),
  contact_consent boolean not null check (contact_consent = true),
  consent_version text not null default 'join-contact-v1',
  consented_at timestamptz not null default clock_timestamp(),
  status text not null default 'new' check (status in ('new', 'contacted')),
  contacted_at timestamptz,
  contacted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  last_submitted_at timestamptz not null default clock_timestamp(),
  check ((status = 'new' and contacted_at is null and contacted_by is null)
    or (status = 'contacted' and contacted_at is not null))
);
create index if not exists join_interests_status_created_idx
  on public.join_interests (status, created_at desc, id desc);

alter table public.join_interests enable row level security;
revoke all on table public.join_interests from public, anon, authenticated, service_role;
grant select on table public.join_interests to authenticated;
drop policy if exists join_interests_read on public.join_interests;
create policy join_interests_read on public.join_interests
  for select to authenticated
  using ((user_id = (select auth.uid()) or (select public.is_admin()))
    and (select public.account_mfa_allowed()));

create or replace function public.submit_join_interest(
  p_name text default null,
  p_phone text default null,
  p_email text default null,
  p_interest text default 'distribuicao',
  p_consent boolean default false
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  owner_id uuid := auth.uid();
  profile public.profiles%rowtype;
  account auth.users%rowtype;
  saved public.join_interests%rowtype;
  contact_name text;
  contact_phone text;
  contact_email text;
  stamp timestamptz;
begin
  if owner_id is null or not public.account_mfa_allowed() then
    raise exception 'AUTH_REQUIRED';
  end if;
  if p_consent is distinct from true then raise exception 'CONSENT_REQUIRED'; end if;
  if p_interest is null or p_interest not in ('consumo', 'distribuicao', 'ambos') then
    raise exception 'INVALID_INTEREST';
  end if;
  if char_length(p_name) > 120 or char_length(p_phone) > 32 or char_length(p_email) > 254 then
    raise exception 'INVALID_CONTACT';
  end if;
  select * into profile from public.profiles where id = owner_id;
  select * into account from auth.users where id = owner_id;
  if not found then raise exception 'AUTH_REQUIRED'; end if;
  contact_name := coalesce(nullif(btrim(p_name), ''), nullif(btrim(profile.nome), ''));
  contact_phone := coalesce(nullif(btrim(p_phone), ''), nullif(btrim(profile.telefone), ''), nullif(btrim(account.phone), ''));
  contact_email := lower(coalesce(nullif(btrim(p_email), ''), nullif(btrim(account.email), ''), nullif(btrim(profile.email), '')));
  if contact_name is null or char_length(contact_name) not between 3 and 120
    or contact_name ~ '[[:cntrl:]]'
    or contact_phone is null or char_length(contact_phone) > 32 or contact_phone !~ '^[0-9+(). -]+$'
    or contact_email is null or char_length(contact_email) > 254
    or contact_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?([.][A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$'
  then raise exception 'INVALID_CONTACT'; end if;
  contact_phone := pg_catalog.regexp_replace(contact_phone, '[^0-9]', '', 'g');
  if contact_phone !~ '^[1-9][0-9]{9,14}$' then raise exception 'INVALID_CONTACT'; end if;

  -- Serialize per account, including concurrent first submissions. Exact retries
  -- return the existing ID without consuming quota or changing consent/status.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text, 110405));
  select * into saved from public.join_interests where user_id = owner_id for update;
  if found then
    if saved.name = contact_name and saved.phone = contact_phone and saved.email = contact_email
      and saved.interest = p_interest then return saved.id; end if;
    stamp := pg_catalog.clock_timestamp();
    if saved.last_submitted_at > stamp - interval '1 minute' then raise exception 'JOIN_RATE_LIMIT'; end if;
    -- Contact status belongs to the administrator and survives user edits.
    update public.join_interests set name = contact_name, phone = contact_phone, email = contact_email,
      interest = p_interest, contact_consent = true, consent_version = 'join-contact-v1',
      consented_at = stamp, updated_at = stamp, last_submitted_at = stamp
      where id = saved.id;
    return saved.id;
  end if;
  insert into public.join_interests(user_id, name, phone, email, interest, contact_consent)
    values (owner_id, contact_name, contact_phone, contact_email, p_interest, true)
    returning id into saved.id;
  return saved.id;
end;
$$;

create or replace function public.admin_set_join_interest_status(p_id uuid, p_status text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare saved public.join_interests%rowtype; stamp timestamptz;
begin
  if auth.uid() is null or not public.is_admin() or not public.account_mfa_allowed() then
    raise exception 'ADMIN_REQUIRED';
  end if;
  if p_status is null or p_status not in ('new', 'contacted') then raise exception 'INVALID_STATUS'; end if;
  select * into saved from public.join_interests where id = p_id for update;
  if not found then raise exception 'INTEREST_NOT_FOUND'; end if;
  if saved.status = p_status then return saved.id; end if;
  stamp := pg_catalog.clock_timestamp();
  update public.join_interests set status = p_status, updated_at = stamp,
    contacted_at = case when p_status = 'contacted' then stamp else null end,
    contacted_by = case when p_status = 'contacted' then auth.uid() else null end
    where id = saved.id;
  return saved.id;
end;
$$;

revoke all on function public.submit_join_interest(text, text, text, text, boolean),
  public.admin_set_join_interest_status(uuid, text) from public, anon, authenticated, service_role;
grant execute on function public.submit_join_interest(text, text, text, text, boolean),
  public.admin_set_join_interest_status(uuid, text) to authenticated;

commit;
