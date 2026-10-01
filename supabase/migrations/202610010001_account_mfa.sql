-- Optional TOTP: require AAL2 only for accounts that enabled a verified factor.
-- Apply with the database owner, after deploying the MFA challenge UI.
-- Abort rather than replace another application's pre-request hook.
begin;

do $$
declare existing text;
begin
  select setting into existing
  from (
    select unnest(rolconfig) setting from pg_roles where rolname = 'authenticator'
    union all
    select unnest(setconfig) from pg_db_role_setting
    where setdatabase = (select oid from pg_database where datname = current_database())
      and setrole in (0, (select oid from pg_roles where rolname = 'authenticator'))
  ) settings
  where setting like 'pgrst.db_pre_request=%'
    and setting not in ('pgrst.db_pre_request=', 'pgrst.db_pre_request=public.enforce_account_mfa')
  limit 1;
  if existing is not null then
    raise exception 'Existing pre-request hook: review and compose it before installing account MFA';
  end if;
end $$;

create or replace function public.account_mfa_allowed()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is null
    or coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors
      where user_id = auth.uid() and status = 'verified'
    );
$$;
revoke all on function public.account_mfa_allowed() from public;
grant execute on function public.account_mfa_allowed() to anon, authenticated, service_role;

create or replace function public.enforce_account_mfa()
returns void language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.account_mfa_allowed() then
    raise sqlstate '42501' using message = 'MFA verification required';
  end if;
end;
$$;
revoke all on function public.enforce_account_mfa() from public;
grant execute on function public.enforce_account_mfa() to anon, authenticated, service_role;

-- Runs before every PostgREST request, including SECURITY DEFINER RPCs.
alter role authenticator set pgrst.db_pre_request = 'public.enforce_account_mfa';

-- Storage does not execute the PostgREST pre-request hook.
drop policy if exists account_mfa_required on storage.objects;
create policy account_mfa_required on storage.objects as restrictive
for all to authenticated
using ((select public.account_mfa_allowed()))
with check ((select public.account_mfa_allowed()));

create or replace function public.account_mfa_ready()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_roles
    where rolname = 'authenticator'
      and 'pgrst.db_pre_request=public.enforce_account_mfa' = any(rolconfig)
  ) and exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'account_mfa_required' and permissive = 'RESTRICTIVE'
  );
$$;
revoke all on function public.account_mfa_ready() from public;
grant execute on function public.account_mfa_ready() to authenticated;

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
commit;
