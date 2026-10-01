-- Configuracao consolidada da Vitrine Ozonteck.
-- Execute este arquivo uma unica vez no SQL Editor do Supabase.
begin;

-- Colunas necessarias para checkout idempotente, webhook e avaliacoes por pedido.
alter table public.pedidos
  add column if not exists checkout_id text,
  add column if not exists status_pagamento text not null default 'pending',
  add column if not exists id_pagamento_mp text,
  add column if not exists estoque_baixado boolean not null default false;

alter table public.avaliacoes
  add column if not exists pedido_id uuid;

-- Pedidos antigos sem codigo de produto nao podem ter o estoque reprocessado.
update public.pedidos
   set estoque_baixado = true
 where estoque_baixado = false
   and case
     when jsonb_typeof(coalesce(itens, '[]'::jsonb)) = 'array' then not exists (
       select 1
         from jsonb_array_elements(coalesce(itens, '[]'::jsonb)) as item
        where item ? 'code'
     )
     else true
   end;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'avaliacoes_pedido_id_fkey'
       and conrelid = 'public.avaliacoes'::regclass
  ) then
    alter table public.avaliacoes
      add constraint avaliacoes_pedido_id_fkey
      foreign key (pedido_id) references public.pedidos(id)
      on delete cascade not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'avaliacoes_pedido_required'
       and conrelid = 'public.avaliacoes'::regclass
  ) then
    alter table public.avaliacoes
      add constraint avaliacoes_pedido_required
      check (pedido_id is not null) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'avaliacoes_nota_range'
       and conrelid = 'public.avaliacoes'::regclass
  ) then
    alter table public.avaliacoes
      add constraint avaliacoes_nota_range
      check (nota between 1 and 5) not valid;
  end if;
end;
$$;

drop index if exists public.pedidos_id_pagamento_mp_idx;
create unique index if not exists pedidos_checkout_id_unique_idx
  on public.pedidos (checkout_id) where checkout_id is not null;
create unique index if not exists pedidos_id_pagamento_mp_unique_idx
  on public.pedidos (id_pagamento_mp) where id_pagamento_mp is not null;
create unique index if not exists avaliacoes_pedido_id_unique_idx
  on public.avaliacoes (pedido_id) where pedido_id is not null;
create index if not exists avaliacoes_user_id_idx on public.avaliacoes (user_id);
create index if not exists pedidos_user_id_created_at_idx
  on public.pedidos (user_id, created_at desc);

-- Autorizacao de administradores baseada exclusivamente no banco.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
      from public.profiles
     where id = (select auth.uid())
       and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Impede que um cliente se transforme em administrador alterando o perfil.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.role()) = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.role := 'cliente';
  elsif new.role is distinct from old.role then
    raise exception 'Alteracao de papel nao autorizada';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_role_trigger on public.profiles;
create trigger protect_profile_role_trigger
before insert or update of role on public.profiles
for each row execute function public.protect_profile_role();

-- Cria o perfil automaticamente para cadastro por senha ou provedor social.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_name text;
  v_avatar text;
begin
  v_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Cliente Ozonteck'
  );
  v_avatar := coalesce(
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'picture', '')
  );

  insert into public.profiles as existing_profile (
    id,
    nome,
    email,
    avatar_url,
    role,
    telefone,
    cpf,
    cep,
    endereco_completo,
    accessibility_settings,
    carrinho
  )
  values (
    new.id,
    v_name,
    new.email,
    v_avatar,
    'cliente',
    nullif(new.raw_user_meta_data ->> 'telefone', ''),
    nullif(new.raw_user_meta_data ->> 'cpf', ''),
    nullif(new.raw_user_meta_data ->> 'cep', ''),
    nullif(new.raw_user_meta_data ->> 'endereco_completo', ''),
    case
      when jsonb_typeof(new.raw_user_meta_data -> 'accessibility_settings') = 'object'
        then new.raw_user_meta_data -> 'accessibility_settings'
      else '{}'::jsonb
    end,
    case
      when jsonb_typeof(new.raw_user_meta_data -> 'carrinho') = 'array'
        then new.raw_user_meta_data -> 'carrinho'
      else '[]'::jsonb
    end
  )
  on conflict (id) do update
    set email = coalesce(existing_profile.email, excluded.email),
        nome = case
          when existing_profile.nome is null or existing_profile.nome = 'Cliente Ozonteck'
            then excluded.nome
          else existing_profile.nome
        end,
        avatar_url = coalesce(existing_profile.avatar_url, excluded.avatar_url),
        telefone = coalesce(existing_profile.telefone, excluded.telefone),
        cpf = coalesce(existing_profile.cpf, excluded.cpf),
        cep = coalesce(existing_profile.cep, excluded.cep),
        endereco_completo = coalesce(existing_profile.endereco_completo, excluded.endereco_completo);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of raw_user_meta_data, email on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.profiles (id, nome, email, avatar_url, role)
select
  user_account.id,
  coalesce(
    nullif(user_account.raw_user_meta_data ->> 'nome', ''),
    nullif(user_account.raw_user_meta_data ->> 'full_name', ''),
    nullif(user_account.raw_user_meta_data ->> 'name', ''),
    nullif(split_part(coalesce(user_account.email, ''), '@', 1), ''),
    'Cliente Ozonteck'
  ),
  user_account.email,
  coalesce(
    nullif(user_account.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(user_account.raw_user_meta_data ->> 'picture', '')
  ),
  'cliente'
from auth.users as user_account
on conflict (id) do nothing;

-- Atualiza pagamento e estoque na mesma transacao. O checkout_id cobre a
-- situacao em que o webhook chega antes de o id do pagamento ser vinculado.
drop function if exists public.processar_status_pagamento(text, text);

create or replace function public.processar_status_pagamento(
  p_payment_id text,
  p_payment_status text,
  p_checkout_id text default null
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
  v_stock_reduced boolean;
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

  update public.pedidos
     set id_pagamento_mp = p_payment_id,
         status_pagamento = p_payment_status
   where id = v_order.id;

  v_stock_reduced := v_order.estoque_baixado;

  if p_payment_status = 'approved' and not v_order.estoque_baixado then
    for v_item in
      select value
        from jsonb_array_elements(coalesce(v_order.itens, '[]'::jsonb))
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
       set status = 'preparando',
           estoque_baixado = true
     where id = v_order.id;
    v_stock_reduced := true;
  elsif p_payment_status in ('rejected', 'cancelled')
        and v_order.status in ('pending', 'falha_pagamento') then
    update public.pedidos
       set status = 'pagamento_recusado'
     where id = v_order.id;
  end if;

  return jsonb_build_object(
    'pedido_encontrado', true,
    'pedido_id', v_order.id,
    'estoque_baixado', v_stock_reduced
  );
end;
$$;

revoke all on function public.processar_status_pagamento(text, text, text) from public;
grant execute on function public.processar_status_pagamento(text, text, text) to service_role;

-- Remove as politicas permissivas e duplicadas das tabelas usadas pelo app.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'public'
       and tablename in (
         'profiles', 'produtos', 'categorias', 'enderecos',
         'favoritos', 'pedidos', 'avaliacoes'
       )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;

  for policy_record in
    select schemaname, tablename, policyname
      from pg_policies
     where schemaname = 'storage' and tablename = 'objects'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.produtos enable row level security;
alter table public.categorias enable row level security;
alter table public.enderecos enable row level security;
alter table public.favoritos enable row level security;
alter table public.pedidos enable row level security;
alter table public.avaliacoes enable row level security;

revoke all on table public.profiles, public.produtos, public.categorias,
  public.enderecos, public.favoritos, public.pedidos, public.avaliacoes
  from public, anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.produtos, public.categorias to anon, authenticated;
grant insert, update, delete on table public.produtos, public.categorias to authenticated;
grant select, insert, update, delete on table public.enderecos to authenticated;
grant select, insert, delete on table public.favoritos to authenticated;
grant select, update on table public.pedidos to authenticated;
grant select on table public.avaliacoes to anon, authenticated;
grant insert, update, delete on table public.avaliacoes to authenticated;
grant all on table public.profiles, public.produtos, public.categorias,
  public.enderecos, public.favoritos, public.pedidos, public.avaliacoes
  to service_role;

-- Perfis.
create policy profiles_select_own_or_admin
on public.profiles for select to authenticated
using ((select auth.uid()) = id or public.is_admin());

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check ((select auth.uid()) = id);

create policy profiles_update_own_or_admin
on public.profiles for update to authenticated
using ((select auth.uid()) = id or public.is_admin())
with check ((select auth.uid()) = id or public.is_admin());

-- Catalogo publico, escrita apenas para administradores.
create policy products_public_read
on public.produtos for select to anon, authenticated
using (coalesce(is_deleted, false) = false or public.is_admin());

create policy products_admin_insert
on public.produtos for insert to authenticated
with check (public.is_admin());

create policy products_admin_update
on public.produtos for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy products_admin_delete
on public.produtos for delete to authenticated
using (public.is_admin());

create policy categories_public_read
on public.categorias for select to anon, authenticated
using (true);

create policy categories_admin_insert
on public.categorias for insert to authenticated
with check (public.is_admin());

create policy categories_admin_update
on public.categorias for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy categories_admin_delete
on public.categorias for delete to authenticated
using (public.is_admin());

-- Dados privados do cliente.
create policy addresses_owner_all
on public.enderecos for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy addresses_admin_read
on public.enderecos for select to authenticated
using (public.is_admin());

create policy favorites_owner_all
on public.favoritos for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy orders_owner_read
on public.pedidos for select to authenticated
using ((select auth.uid()) = user_id);

create policy orders_admin_all
on public.pedidos for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Uma avaliacao por pedido entregue. Avaliacoes positivas ficam publicas;
-- cada cliente tambem consegue ler a propria avaliacao.
create policy reviews_public_or_owner_read
on public.avaliacoes for select to anon, authenticated
using (nota >= 4 or (select auth.uid()) = user_id or public.is_admin());

create policy reviews_owner_insert
on public.avaliacoes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and pedido_id is not null
  and exists (
    select 1
      from public.pedidos as customer_order
     where customer_order.id = avaliacoes.pedido_id
       and customer_order.user_id = (select auth.uid())
       and customer_order.status = 'entregue'
  )
);

create policy reviews_admin_all
on public.avaliacoes for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Buckets e politicas de arquivos usados pelo projeto.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('produtos', 'produtos', true)
on conflict (id) do update set public = excluded.public;

create policy avatars_public_read
on storage.objects for select to public
using (bucket_id = 'avatars');

create policy avatars_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_owner_update
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy avatars_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy product_images_public_read
on storage.objects for select to public
using (bucket_id = 'produtos');

create policy product_images_admin_insert
on storage.objects for insert to authenticated
with check (bucket_id = 'produtos' and public.is_admin());

create policy product_images_admin_update
on storage.objects for update to authenticated
using (bucket_id = 'produtos' and public.is_admin())
with check (bucket_id = 'produtos' and public.is_admin());

create policy product_images_admin_delete
on storage.objects for delete to authenticated
using (bucket_id = 'produtos' and public.is_admin());

commit;

select
  'Configuracao concluida' as resultado,
  exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'avaliacoes'
       and column_name = 'pedido_id'
  ) as avaliacoes_vinculadas_a_pedidos,
  exists (
    select 1 from pg_indexes
     where schemaname = 'public'
       and indexname = 'avaliacoes_pedido_id_unique_idx'
  ) as uma_avaliacao_por_pedido,
  exists (
    select 1 from pg_proc
     where proname = 'processar_status_pagamento'
  ) as webhook_transacional_instalado;
