begin;
create table public.admin_reminders (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(btrim(title)) between 3 and 160),
  note text not null default '' check(char_length(note)<=2000),
  due_at timestamptz not null,
  completed_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now()
);
create index admin_reminders_due on public.admin_reminders(due_at) where completed_at is null;
alter table public.admin_reminders enable row level security;
revoke all on public.admin_reminders from public,anon,authenticated;
grant select,insert,update on public.admin_reminders to authenticated;
create policy reminder_read on public.admin_reminders for select to authenticated using(public.is_admin() and public.account_mfa_allowed());
create policy reminder_insert on public.admin_reminders for insert to authenticated with check(public.is_admin() and public.account_mfa_allowed() and created_by=auth.uid());
create policy reminder_update on public.admin_reminders for update to authenticated using(public.is_admin() and public.account_mfa_allowed()) with check(public.is_admin() and public.account_mfa_allowed());
create function public.guard_admin_reminder() returns trigger language plpgsql set search_path='' as $$
begin
  if new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at or new.id is distinct from old.id then raise exception 'IMMUTABLE_REMINDER_AUTHOR'; end if;
  return new;
end $$;
create trigger guard_admin_reminder before update on public.admin_reminders for each row execute function public.guard_admin_reminder();
revoke all on function public.guard_admin_reminder() from public,anon,authenticated;
commit;
