begin;

-- Future changes only: existing categories/products are never rewritten or backfilled.
-- IDs are stored without foreign keys so deleting a category or actor cannot erase
-- history. Text category IDs also accommodate the preexisting (external) baseline.
create table if not exists public.category_audit (
  id bigint generated always as identity primary key,
  category_id text not null,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  actor uuid,
  actor_role text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default clock_timestamp(),
  constraint category_audit_snapshots check (
    (action = 'INSERT' and old_data is null and new_data is not null)
    or (action = 'UPDATE' and old_data is not null and new_data is not null)
    or (action = 'DELETE' and old_data is not null and new_data is null)
  )
);

create index if not exists category_audit_category_time_idx
  on public.category_audit (category_id, created_at desc, id desc);

alter table public.category_audit enable row level security;
-- The trigger alone appends. Clients (including admins) cannot forge, change,
-- delete or truncate events, and cannot advance/reset the identity sequence.
revoke all on table public.category_audit from public, anon, authenticated, service_role;
revoke all on sequence public.category_audit_id_seq from public, anon, authenticated, service_role;
grant select on table public.category_audit to authenticated, service_role;

drop policy if exists category_audit_admin_read on public.category_audit;
create policy category_audit_admin_read on public.category_audit
  for select to authenticated using ((select public.is_admin()));

create or replace function public.audit_category_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.category_audit (
    category_id, action, actor, actor_role, old_data, new_data
  ) values (
    case when tg_op = 'DELETE' then old.id::text else new.id::text end,
    tg_op,
    auth.uid(),
    auth.role(),
    case when tg_op in ('UPDATE', 'DELETE') then pg_catalog.to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then pg_catalog.to_jsonb(new) else null end
  );
  return null; -- AFTER trigger; the mutation and its audit event commit together.
end;
$$;

revoke all on function public.audit_category_change() from public, anon, authenticated, service_role;

drop trigger if exists category_audit_change on public.categorias;
create trigger category_audit_change
  after insert or update or delete on public.categorias
  for each row execute function public.audit_category_change();

commit;
