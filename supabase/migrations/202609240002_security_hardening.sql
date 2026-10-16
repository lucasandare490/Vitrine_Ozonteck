-- Hardening de uploads, enderecos e reserva transacional de estoque.
-- Execute depois de 202609240001_ozonteck_complete_setup.sql.
begin;

alter table public.pedidos
  add column if not exists reserva_expira_em timestamptz;

alter table public.enderecos
  add column if not exists complemento text;

-- Limites aplicados no servidor do Storage. SVG nao e aceito para evitar
-- conteudo ativo em buckets publicos.
update storage.buckets
   set file_size_limit = 2097152,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
 where id = 'avatars';
A
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
 where id = 'produtos';

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'produtos_preco_positivo'
       and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_preco_positivo check (price > 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'produtos_estoque_nao_negativo'
       and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_estoque_nao_negativo check (estoque >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'profiles_accessibility_settings_object'
       and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_accessibility_settings_object
      check (accessibility_settings is null or jsonb_typeof(accessibility_settings) = 'object')
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'profiles_carrinho_array'
       and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_carrinho_array
      check (carrinho is null or jsonb_typeof(carrinho) = 'array')
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'produtos_code_valido'
       and conrelid = 'public.produtos'::regclass
  ) then
    alter table public.produtos
      add constraint produtos_code_valido
      check (length(trim(code)) between 1 and 100)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'pedidos_valor_total_positivo'
       and conrelid = 'public.pedidos'::regclass
  ) then
    alter table public.pedidos
      add constraint pedidos_valor_total_positivo
      check (valor_total > 0)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'avaliacoes_comentario_limitado'
       and conrelid = 'public.avaliacoes'::regclass
  ) then
    alter table public.avaliacoes
      add constraint avaliacoes_comentario_limitado
      check (comentario is null or length(comentario) <= 1000)
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'profiles_campos_pessoais_limitados'
       and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_campos_pessoais_limitados
      check (
        (nome is null or length(nome) <= 150)
        and (telefone is null or length(telefone) <= 20)
        and (cpf is null or length(cpf) <= 14)
        and (cep is null or length(cep) <= 9)
        and (endereco_completo is null or length(endereco_completo) <= 500)
      ) not valid;
  end if;
end;
$$;

create unique index if not exists produtos_code_unique_idx
  on public.produtos (code);

create index if not exists pedidos_reserva_expira_idx
  on public.pedidos (reserva_expira_em)
  where estoque_baixado = true and reserva_expira_em is not null;

-- Corrige eventuais duplicidades antigas antes de garantir um unico endereco
-- principal por usuario.
with ranked_primary_addresses as (
  select id,
         row_number() over (
           partition by user_id
           order by created_at asc nulls last, id
         ) as position
    from public.enderecos
   where principal = true
)
update public.enderecos as address
   set principal = false
  from ranked_primary_addresses as ranked
 where address.id = ranked.id
   and ranked.position > 1;

create unique index if not exists enderecos_um_principal_por_usuario_idx
  on public.enderecos (user_id)
  where principal = true;

-- A tabela original fica visivel apenas ao dono e aos administradores. A
-- vitrine usa uma view deliberadamente limitada, sem user_id nem pedido_id.
drop policy if exists reviews_public_or_owner_read on public.avaliacoes;
drop policy if exists reviews_owner_or_admin_read on public.avaliacoes;
create policy reviews_owner_or_admin_read
on public.avaliacoes for select to authenticated
using ((select auth.uid()) = user_id or public.is_admin());

revoke select on table public.avaliacoes from anon;

drop view if exists public.public_reviews;
create view public.public_reviews
with (security_barrier = true)
as
select
       id,
       split_part(trim(nome_cliente), ' ', 1)
         || case
              when position(' ' in trim(nome_cliente)) > 0
                then ' ' || left(split_part(trim(nome_cliente), ' ', 2), 1) || '.'
              else ''
            end as nome_cliente,
       nota,
       comentario,
       created_at
  from public.avaliacoes
 where nota >= 4;

revoke all on table public.public_reviews from public, anon, authenticated;
grant select on table public.public_reviews to anon, authenticated;

create or replace function public.enforce_review_identity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if (select auth.role()) <> 'service_role' and not public.is_admin() then
    if v_user_id is null then
      raise exception 'Autenticacao obrigatoria';
    end if;
    new.user_id := v_user_id;
    select coalesce(nullif(nome, ''), 'Cliente Ozonteck')
      into new.nome_cliente
      from public.profiles
     where id = v_user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_review_identity_trigger on public.avaliacoes;
create trigger enforce_review_identity_trigger
before insert or update of user_id, nome_cliente on public.avaliacoes
for each row execute function public.enforce_review_identity();

create or replace function public.set_primary_address(p_address_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Autenticacao obrigatoria';
  end if;

  if not exists (
    select 1
      from public.enderecos
     where id = p_address_id
       and user_id = v_user_id
  ) then
    raise exception 'Endereco nao encontrado';
  end if;

  update public.enderecos
     set principal = (id = p_address_id)
   where user_id = v_user_id;
end;
$$;

revoke all on function public.set_primary_address(uuid) from public;
grant execute on function public.set_primary_address(uuid) to authenticated;

-- Libera reservas abandonadas. A funcao tambem e chamada automaticamente na
-- abertura de um novo checkout, sem depender de extensoes pagas de cron.
create or replace function public.liberar_reservas_expiradas()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.pedidos%rowtype;
  v_item jsonb;
  v_code text;
  v_quantity integer;
  v_released integer := 0;
begin
  for v_order in
    select *
      from public.pedidos
     where estoque_baixado = true
       and reserva_expira_em is not null
       and reserva_expira_em <= now()
       and status_pagamento in ('pending', 'in_process', 'error')
       and status in ('pending', 'falha_pagamento')
     for update skip locked
  loop
    for v_item in
      select value
        from jsonb_array_elements(coalesce(v_order.itens, '[]'::jsonb))
    loop
      v_code := nullif(v_item ->> 'code', '');
      v_quantity := nullif(v_item ->> 'qtd', '')::integer;
      if v_code is not null and v_quantity is not null and v_quantity > 0 then
        update public.produtos
           set estoque = estoque + v_quantity
         where code = v_code;
      end if;
    end loop;

    update public.pedidos
       set estoque_baixado = false,
           reserva_expira_em = null,
           status = 'reserva_expirada'
     where id = v_order.id;
    v_released := v_released + 1;
  end loop;

  return v_released;
end;
$$;

revoke all on function public.liberar_reservas_expiradas() from public;
grant execute on function public.liberar_reservas_expiradas() to service_role;

create or replace function public.reservar_pedido_checkout(
  p_checkout_id text,
  p_user_id uuid,
  p_total numeric,
  p_delivery_address jsonb,
  p_items jsonb,
  p_reservation_minutes integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.pedidos%rowtype;
  v_item jsonb;
  v_code text;
  v_quantity integer;
begin
  if nullif(trim(p_checkout_id), '') is null
     or length(p_checkout_id) > 128
     or p_total is null
     or p_total <= 0
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50
     or p_reservation_minutes < 5
     or p_reservation_minutes > 2880 then
    raise exception 'Dados de reserva invalidos';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_checkout_id, 0));
  perform public.liberar_reservas_expiradas();

  select *
    into v_order
    from public.pedidos
   where checkout_id = p_checkout_id
   for update;

  if found then
    if v_order.user_id is distinct from p_user_id
       or round(v_order.valor_total, 2) <> round(p_total, 2)
       or v_order.itens <> p_items then
      raise exception 'Identificador de checkout pertence a outro pedido';
    end if;

    if v_order.estoque_baixado or v_order.id_pagamento_mp is not null then
      return jsonb_build_object(
        'id', v_order.id,
        'user_id', v_order.user_id,
        'id_pagamento_mp', v_order.id_pagamento_mp,
        'valor_total', v_order.valor_total,
        'itens', v_order.itens
      );
    end if;
  end if;

  for v_item in
    select value
      from jsonb_array_elements(p_items)
     order by value ->> 'code'
  loop
    v_code := nullif(v_item ->> 'code', '');
    v_quantity := nullif(v_item ->> 'qtd', '')::integer;
    if v_code is null or v_quantity is null or v_quantity <= 0 or v_quantity > 100 then
      raise exception 'Item invalido na reserva';
    end if;

    update public.produtos
       set estoque = estoque - v_quantity
     where code = v_code
       and coalesce(is_deleted, false) = false
       and estoque >= v_quantity;

    if not found then
      raise exception 'Estoque insuficiente para o produto %', v_code;
    end if;
  end loop;

  if v_order.id is null then
    insert into public.pedidos (
      user_id,
      checkout_id,
      valor_total,
      status,
      status_pagamento,
      endereco_entrega,
      itens,
      estoque_baixado,
      reserva_expira_em
    ) values (
      p_user_id,
      p_checkout_id,
      round(p_total, 2),
      'pending',
      'pending',
      coalesce(p_delivery_address, '{}'::jsonb),
      p_items,
      true,
      now() + make_interval(mins => p_reservation_minutes)
    )
    returning * into v_order;
  else
    update public.pedidos
       set status = 'pending',
           status_pagamento = 'pending',
           estoque_baixado = true,
           reserva_expira_em = now() + make_interval(mins => p_reservation_minutes)
     where id = v_order.id
     returning * into v_order;
  end if;

  return jsonb_build_object(
    'id', v_order.id,
    'user_id', v_order.user_id,
    'id_pagamento_mp', v_order.id_pagamento_mp,
    'valor_total', v_order.valor_total,
    'itens', v_order.itens
  );
end;
$$;

revoke all on function public.reservar_pedido_checkout(text, uuid, numeric, jsonb, jsonb, integer) from public;
grant execute on function public.reservar_pedido_checkout(text, uuid, numeric, jsonb, jsonb, integer) to service_role;

create or replace function public.cancelar_reserva_checkout(p_checkout_id text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.pedidos%rowtype;
  v_item jsonb;
  v_code text;
  v_quantity integer;
begin
  select *
    into v_order
    from public.pedidos
   where checkout_id = p_checkout_id
   for update;

  if not found or not v_order.estoque_baixado or v_order.id_pagamento_mp is not null then
    return false;
  end if;

  for v_item in
    select value from jsonb_array_elements(coalesce(v_order.itens, '[]'::jsonb))
  loop
    v_code := nullif(v_item ->> 'code', '');
    v_quantity := nullif(v_item ->> 'qtd', '')::integer;
    if v_code is not null and v_quantity is not null and v_quantity > 0 then
      update public.produtos
         set estoque = estoque + v_quantity
       where code = v_code;
    end if;
  end loop;

  update public.pedidos
     set estoque_baixado = false,
         reserva_expira_em = null,
         status_pagamento = 'error',
         status = 'falha_pagamento'
   where id = v_order.id;

  return true;
end;
$$;

revoke all on function public.cancelar_reserva_checkout(text) from public;
grant execute on function public.cancelar_reserva_checkout(text) to service_role;

drop function if exists public.processar_status_pagamento(text, text, text);

create or replace function public.processar_status_pagamento(
  p_payment_id text,
  p_payment_status text,
  p_checkout_id text default null,
  p_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order public.pedidos%rowtype;
  v_item jsonb;
  v_code text;
  v_quantity integer;
  v_stock_available boolean := true;
begin
  if nullif(trim(p_payment_id), '') is null
     or nullif(trim(p_payment_status), '') is null then
    raise exception 'Identificador e status do pagamento sao obrigatorios';
  end if;

  select *
    into v_order
    from public.pedidos
   where id_pagamento_mp = p_payment_id
      or (p_checkout_id is not null and checkout_id = p_checkout_id)
   order by (id_pagamento_mp = p_payment_id) desc
   limit 1
   for update;

  if not found then
    return jsonb_build_object('pedido_encontrado', false);
  end if;

  if v_order.id_pagamento_mp is not null
     and v_order.id_pagamento_mp <> p_payment_id then
    raise exception 'Pedido ja vinculado a outro pagamento';
  end if;

  if p_checkout_id is not null
     and v_order.checkout_id is distinct from p_checkout_id then
    raise exception 'Pagamento nao pertence ao checkout informado';
  end if;

  if p_payment_status = 'approved'
     and (p_amount is null or round(p_amount, 2) <> round(v_order.valor_total, 2)) then
    update public.pedidos
       set id_pagamento_mp = p_payment_id,
           status_pagamento = p_payment_status,
           status = 'revisao_pagamento',
           reserva_expira_em = null
     where id = v_order.id;

    return jsonb_build_object(
      'pedido_encontrado', true,
      'pedido_id', v_order.id,
      'valor_valido', false,
      'estoque_disponivel', v_order.estoque_baixado
    );
  end if;

  update public.pedidos
     set id_pagamento_mp = p_payment_id,
         status_pagamento = p_payment_status
   where id = v_order.id;

  if p_payment_status = 'approved' then
    if not v_order.estoque_baixado then
      begin
        for v_item in
          select value
            from jsonb_array_elements(coalesce(v_order.itens, '[]'::jsonb))
           order by value ->> 'code'
        loop
          v_code := nullif(v_item ->> 'code', '');
          v_quantity := nullif(v_item ->> 'qtd', '')::integer;
          if v_code is null or v_quantity is null or v_quantity <= 0 then
            raise exception 'Item invalido no pedido %', v_order.id;
          end if;

          update public.produtos
             set estoque = estoque - v_quantity
           where code = v_code
             and coalesce(is_deleted, false) = false
             and estoque >= v_quantity;

          if not found then
            raise exception 'Estoque insuficiente para o produto %', v_code;
          end if;
        end loop;

        update public.pedidos
           set estoque_baixado = true
         where id = v_order.id;
      exception when others then
        v_stock_available := false;
      end;
    end if;

    update public.pedidos
       set status = case when v_stock_available then 'preparando' else 'revisao_estoque' end,
           reserva_expira_em = null
     where id = v_order.id;
  elsif p_payment_status in ('rejected', 'cancelled')
        and v_order.estoque_baixado
        and v_order.status in ('pending', 'falha_pagamento') then
    for v_item in
      select value from jsonb_array_elements(coalesce(v_order.itens, '[]'::jsonb))
    loop
      v_code := nullif(v_item ->> 'code', '');
      v_quantity := nullif(v_item ->> 'qtd', '')::integer;
      if v_code is not null and v_quantity is not null and v_quantity > 0 then
        update public.produtos
           set estoque = estoque + v_quantity
         where code = v_code;
      end if;
    end loop;

    update public.pedidos
       set status = 'pagamento_recusado',
           estoque_baixado = false,
           reserva_expira_em = null
     where id = v_order.id;
  end if;

  return jsonb_build_object(
    'pedido_encontrado', true,
    'pedido_id', v_order.id,
    'valor_valido', true,
    'estoque_disponivel', v_stock_available,
    'estoque_baixado', case
      when p_payment_status = 'approved' then v_stock_available
      else v_order.estoque_baixado
    end
  );
end;
$$;

revoke all on function public.processar_status_pagamento(text, text, text, numeric) from public;
grant execute on function public.processar_status_pagamento(text, text, text, numeric) to service_role;

commit;

select
  'Hardening de seguranca concluido' as resultado,
  exists (
    select 1 from pg_proc where proname = 'reservar_pedido_checkout'
  ) as reserva_transacional_instalada,
  exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and indexname = 'enderecos_um_principal_por_usuario_idx'
  ) as endereco_principal_unico,
  exists (
    select 1 from storage.buckets
     where id = 'avatars'
       and file_size_limit = 2097152
       and allowed_mime_types is not null
  ) as uploads_limitados;
