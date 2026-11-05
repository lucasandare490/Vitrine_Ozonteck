begin;
create table public.support_tickets (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 4 and 120),
  message text not null check (char_length(message) between 10 and 4000),
  status text not null default 'aberto' check(status in ('aberto','respondido','resolvido')),
  response text check(response is null or char_length(response) between 2 and 4000),
  responded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index support_tickets_user_created on public.support_tickets(user_id,created_at desc);
create index support_tickets_status_created on public.support_tickets(status,created_at desc);
alter table public.support_tickets enable row level security;
revoke all on public.support_tickets from public,anon,authenticated;
grant select on public.support_tickets to authenticated;
grant select on public.support_tickets to service_role;
create policy support_read on public.support_tickets for select to authenticated
using ((user_id=auth.uid() or public.is_admin()) and public.account_mfa_allowed());

alter table public.customer_email_outbox add column support_id uuid references public.support_tickets(id) on delete cascade;
alter table public.customer_email_outbox drop constraint customer_email_outbox_event_check;
alter table public.customer_email_outbox add constraint customer_email_outbox_event_check check(event in
('welcome','payment_pending','payment_approved','payment_rejected','order_changed','order_shipped','pickup_ready','order_delivered','order_cancelled','refund_confirmed','support_received','support_updated'));

create function public.open_support_ticket(p_id uuid,p_subject text,p_message text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare owner_id uuid := auth.uid(); existing public.support_tickets%rowtype;
begin
  if owner_id is null or not public.account_mfa_allowed() then raise exception 'AUTH_REQUIRED'; end if;
  -- Serialize submissions per account; idempotency is checked before quota.
  perform pg_advisory_xact_lock(hashtextextended(owner_id::text,731));
  select * into existing from public.support_tickets where id=p_id;
  if found then
    if existing.user_id<>owner_id or existing.subject<>btrim(p_subject) or existing.message<>btrim(p_message) then raise exception 'REQUEST_CONFLICT'; end if;
    return p_id;
  end if;
  if (select count(*) from public.support_tickets where user_id=owner_id and created_at>now()-interval '24 hours')>=5 then raise exception 'SUPPORT_LIMIT'; end if;
  insert into public.support_tickets(id,user_id,subject,message) values(p_id,owner_id,btrim(p_subject),btrim(p_message));
  insert into public.customer_email_outbox(dedupe_key,user_id,support_id,event)
    values(p_id::text||':support_received',owner_id,p_id,'support_received') on conflict(dedupe_key) do nothing;
  return p_id;
end $$;

create function public.respond_support_ticket(p_id uuid,p_response text,p_status text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare ticket public.support_tickets%rowtype;
begin
  if auth.uid() is null or not public.is_admin() or not public.account_mfa_allowed() then raise exception 'ADMIN_REQUIRED'; end if;
  if p_status not in ('respondido','resolvido') or p_status is null or p_response is null or char_length(btrim(p_response)) not between 2 and 4000 then raise exception 'INVALID_RESPONSE'; end if;
  select * into ticket from public.support_tickets where id=p_id for update;
  if not found then raise exception 'TICKET_NOT_FOUND'; end if;
  if ticket.response is not distinct from btrim(p_response) and ticket.status=p_status then return p_id; end if;
  update public.support_tickets set response=btrim(p_response),status=p_status,responded_by=auth.uid(),updated_at=clock_timestamp() where id=p_id returning * into ticket;
  insert into public.customer_email_outbox(dedupe_key,user_id,support_id,event)
    values(p_id::text||':response:'||ticket.updated_at::text,ticket.user_id,p_id,'support_updated');
  return p_id;
end $$;
revoke all on function public.open_support_ticket(uuid,text,text),public.respond_support_ticket(uuid,text,text) from public,anon;
grant execute on function public.open_support_ticket(uuid,text,text),public.respond_support_ticket(uuid,text,text) to authenticated;
commit;
