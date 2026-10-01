begin;

do $$
begin
  if to_regclass('public.produtos_code_unique_idx') is null then
    raise exception 'Pre-requisito ausente: confirme a instalacao de security_hardening e o indice unico de codigo antes de continuar.';
  end if;
end;
$$;

-- Existing orders identify their lines by SKU. Preserve those references;
-- soft deletion, price changes and stock updates remain available.
create or replace function public.proteger_produto_com_pedido()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.code is not distinct from old.code then return new; end if;
  if exists(select 1 from public.pedidos p, lateral jsonb_array_elements(
    case when jsonb_typeof(p.itens)='array' then p.itens else '[]'::jsonb end) item
    where item->>'code'=old.code) then
    raise exception 'Produto vinculado a pedido: preserve o codigo e utilize a exclusao logica.' using errcode='23503';
  end if;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.proteger_produto_com_pedido() from public;
drop trigger if exists proteger_produto_com_pedido on public.produtos;
create trigger proteger_produto_com_pedido before update of code or delete on public.produtos
for each row execute function public.proteger_produto_com_pedido();

-- Keep the existing product-review table and all order reviews intact.
alter table public.avaliacoes_produtos add column if not exists updated_at timestamptz not null default now();
create index if not exists product_reviews_owner_order on public.avaliacoes_produtos(user_id, pedido_id);
revoke insert on public.avaliacoes_produtos from authenticated;
revoke insert (produto_id, pedido_id, user_id, nome, nota, comentario) on public.avaliacoes_produtos from authenticated;

create or replace function public.itens_avaliaveis(p_pedido uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not exists(select 1 from public.pedidos where id=p_pedido and user_id=auth.uid() and lower(status)='entregue') then
    raise exception 'Pedido indisponivel' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('produto_id',pr.id,'nome',pr.name,'code',pr.code,
    'nota',r.nota,'comentario',r.comentario,'publicado',r.publicado) order by pr.name),'[]'::jsonb)
  into result from public.produtos pr
  left join public.avaliacoes_produtos r on r.produto_id=pr.id and r.pedido_id=p_pedido and r.user_id=auth.uid()
  where exists(select 1 from public.pedidos p, lateral jsonb_array_elements(
    case when jsonb_typeof(p.itens)='array' then p.itens else '[]'::jsonb end) item
    where p.id=p_pedido and item->>'code'=pr.code);
  return result;
end;
$$;

create or replace function public.enviar_avaliacao_produto(p_pedido uuid,p_produto uuid,p_nota integer,p_comentario text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_nome text;
begin
  if auth.uid() is null then raise exception 'Autenticacao obrigatoria' using errcode='42501'; end if;
  if p_nota is null or p_nota not between 1 and 5 or p_comentario is null or char_length(p_comentario)>2000 then
    raise exception 'Avaliacao invalida' using errcode='22023';
  end if;
  -- Lock the order so ownership/status cannot change during validation and insert.
  perform 1 from public.pedidos p where p.id=p_pedido and p.user_id=auth.uid() and lower(p.status)='entregue' for share;
  if not found then raise exception 'Pedido indisponivel' using errcode='42501'; end if;
  perform 1 from public.produtos where id=p_produto for share;
  if not exists(select 1 from public.pedidos p join public.produtos pr on pr.id=p_produto,
    lateral jsonb_array_elements(case when jsonb_typeof(p.itens)='array' then p.itens else '[]'::jsonb end) item
    where p.id=p_pedido and item->>'code'=pr.code) then
    raise exception 'Produto fora do pedido' using errcode='42501';
  end if;
  select left(coalesce(nullif(split_part(trim(nome),' ',1),''),'Cliente'),80) into v_nome
    from public.profiles where id=auth.uid();
  insert into public.avaliacoes_produtos(produto_id,pedido_id,user_id,nome,nota,comentario)
    values(p_produto,p_pedido,auth.uid(),coalesce(v_nome,'Cliente'),p_nota,btrim(p_comentario));
end;
$$;

revoke all on function public.itens_avaliaveis(uuid) from public,anon;
revoke all on function public.enviar_avaliacao_produto(uuid,uuid,integer,text) from public,anon;
grant execute on function public.itens_avaliaveis(uuid), public.enviar_avaliacao_produto(uuid,uuid,integer,text) to authenticated;

-- Moderation is restricted to existing administrators; no score-based filtering.
grant select on public.avaliacoes_produtos to authenticated;
grant update(publicado,updated_at) on public.avaliacoes_produtos to authenticated;
drop policy if exists product_reviews_admin_read on public.avaliacoes_produtos;
create policy product_reviews_admin_read on public.avaliacoes_produtos for select to authenticated using(public.is_admin());
drop policy if exists product_reviews_admin_moderate on public.avaliacoes_produtos;
create policy product_reviews_admin_moderate on public.avaliacoes_produtos for update to authenticated using(public.is_admin()) with check(public.is_admin());

commit;
