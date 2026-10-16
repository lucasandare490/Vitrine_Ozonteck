begin;
create table if not exists public.pedido_alteracoes (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id),
  user_id uuid not null references auth.users(id),
  motivo text not null check (motivo in ('pagamento','endereco','dados')),
  antes jsonb not null,
  novo_pedido_id uuid references public.pedidos(id),
  created_at timestamptz not null default now(),
  unique(pedido_id)
);
alter table public.pedido_alteracoes enable row level security;
create policy pedido_alteracoes_read on public.pedido_alteracoes for select to authenticated
  using ((user_id = auth.uid() or public.is_admin()) and public.account_mfa_allowed());
revoke all on public.pedido_alteracoes from anon, authenticated;
grant select on public.pedido_alteracoes to authenticated;
grant all on public.pedido_alteracoes to service_role;

create or replace function public.reabrir_compra_cancelada(p_order uuid, p_user uuid, p_payment text, p_reason text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o public.pedidos%rowtype; event public.pedido_alteracoes%rowtype; item jsonb;
begin
  select * into o from public.pedidos where id=p_order and user_id=p_user for update;
  if not found or o.id_pagamento_mp is distinct from p_payment then raise exception 'ORDER_NOT_FOUND'; end if;
  select * into event from public.pedido_alteracoes where pedido_id=p_order;
  if found then return to_jsonb(event); end if;
  if o.status not in ('pending','falha_pagamento','pagamento_recusado','cancelado','cancelled')
     or coalesce(o.status_pagamento,'') in ('approved','refunded','charged_back') then raise exception 'ORDER_NOT_EDITABLE'; end if;
  if o.estoque_baixado then
    for item in select value from jsonb_array_elements(o.itens) loop
      update public.produtos set estoque=estoque+(item->>'qtd')::integer where code=item->>'code';
    end loop;
  end if;
  update public.pedidos set status='cancelado',status_pagamento='cancelled',estoque_baixado=false,reserva_expira_em=null where id=p_order;
  insert into public.pedido_alteracoes(pedido_id,user_id,motivo,antes)
    values(p_order,p_user,p_reason,jsonb_build_object('itens',o.itens,'endereco',o.endereco_entrega,'total',o.valor_total)) returning * into event;
  return to_jsonb(event);
end $$;
revoke all on function public.reabrir_compra_cancelada(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.reabrir_compra_cancelada(uuid,uuid,text,text) to service_role;
create or replace function public.vincular_compra_alterada(p_change uuid, p_order uuid, p_user uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare e public.pedido_alteracoes%rowtype;
begin
  select * into e from public.pedido_alteracoes where id=p_change and user_id=p_user for update;
  if not found or (e.novo_pedido_id is not null and e.novo_pedido_id<>p_order) then raise exception 'CHANGE_ALREADY_USED'; end if;
  if e.novo_pedido_id=p_order then return; end if;
  if not exists(select 1 from public.pedidos where id=p_order and user_id=p_user and status='pending') then raise exception 'INVALID_ORDER'; end if;
  update public.pedido_alteracoes set novo_pedido_id=p_order where id=p_change;
end $$;
revoke all on function public.vincular_compra_alterada(uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.vincular_compra_alterada(uuid,uuid,uuid) to service_role;
commit;
