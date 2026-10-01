begin;

-- Product reviews are separate from the existing one-review-per-order feature.
create table if not exists public.avaliacoes_produtos (
  id uuid primary key default gen_random_uuid(),
  produto_id uuid not null references public.produtos(id),
  pedido_id uuid not null references public.pedidos(id),
  user_id uuid not null references auth.users(id),
  nome text not null check (char_length(nome) between 1 and 80),
  nota smallint not null check (nota between 1 and 5),
  comentario text not null default '' check (char_length(comentario) <= 2000),
  imagens text[] not null default '{}' check (cardinality(imagens) <= 6),
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  unique (pedido_id, produto_id)
);
alter table public.avaliacoes_produtos enable row level security;
revoke all on public.avaliacoes_produtos from anon, authenticated;
-- Publication and photos are curated server-side; clients cannot publish themselves.
grant insert (produto_id, pedido_id, user_id, nome, nota, comentario) on public.avaliacoes_produtos to authenticated;
grant all on public.avaliacoes_produtos to service_role;
drop policy if exists product_review_own_delivered_order on public.avaliacoes_produtos;
create policy product_review_own_delivered_order on public.avaliacoes_produtos
for insert to authenticated with check (
  user_id = (select auth.uid()) and publicado = false and cardinality(imagens) = 0
  and exists (
    select 1 from public.pedidos p join public.produtos pr on pr.id = produto_id
    where p.id = pedido_id and p.user_id = (select auth.uid())
      and lower(p.status) = 'entregue'
      and exists (select 1 from jsonb_array_elements(
        case when jsonb_typeof(p.itens) = 'array' then p.itens else '[]'::jsonb end
      ) item where item->>'code' = pr.code)
  )
);
create index if not exists product_reviews_published_recent on public.avaliacoes_produtos (produto_id, created_at desc, id) where publicado;
create index if not exists product_reviews_published_rating on public.avaliacoes_produtos (produto_id, nota desc, created_at desc, id) where publicado;

-- Restricted projection: never expose account IDs or order IDs publicly.
create or replace function public.listar_avaliacoes_produto(
  p_produto uuid, p_nota integer default 0, p_imagens boolean default false,
  p_ordem text default 'recent', p_pagina integer default 1
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_nota is null or p_nota not between 0 and 5 or p_pagina is null or p_pagina not between 1 and 9999
    or p_ordem is null or p_ordem not in ('recent', 'best') or p_imagens is null then
    raise exception 'Invalid filters' using errcode = '22023';
  end if;
  with published as (
    select r.id, r.nome, r.nota, r.comentario, r.created_at, r.imagens
    from public.avaliacoes_produtos r join public.produtos p on p.id = r.produto_id
    where r.produto_id = p_produto and r.publicado and p.is_deleted = false
  ), filtered as (
    select * from published where (p_nota = 0 or nota = p_nota)
      and (not p_imagens or cardinality(imagens) > 0)
  ), paginated as (
    select * from filtered order by case when p_ordem = 'best' then nota end desc,
      created_at desc, id limit 6 offset ((p_pagina - 1) * 6)
  )
  select jsonb_build_object(
    'total', (select count(*) from published),
    'average', (select round(avg(nota), 2) from published),
    'stars', (select jsonb_agg((select count(*) from published where nota = n) order by n) from generate_series(1, 5) n),
    'filtered', (select count(*) from filtered),
    'items', coalesce((select jsonb_agg(to_jsonb(v) order by case when p_ordem = 'best' then v.nota end desc, v.created_at desc, v.id) from paginated v), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.listar_avaliacoes_produto(uuid, integer, boolean, text, integer) from public;
grant execute on function public.listar_avaliacoes_produto(uuid, integer, boolean, text, integer) to anon, authenticated;

-- Only approved photos belong in this public bucket. Upload through trusted administration.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avaliacoes-produtos', 'avaliacoes-produtos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

commit;
