begin;

-- Preserve existing public testimonials; do not automatically publish old private criticism.
alter table public.avaliacoes add column if not exists publicado boolean;
-- NOT VALID checks can reject updates to legacy rows they intentionally allow
-- to remain. Restore those exact checks before releasing the transaction lock.
do $$
declare checks jsonb; item jsonb;
begin
  lock table public.avaliacoes in access exclusive mode;
  select coalesce(jsonb_agg(jsonb_build_object('name', conname,
    'definition', pg_get_constraintdef(oid))), '[]'::jsonb) into checks
  from pg_constraint where conrelid='public.avaliacoes'::regclass
    and contype='c' and not convalidated;
  for item in select value from jsonb_array_elements(checks) loop
    execute format('alter table public.avaliacoes drop constraint %I', item->>'name');
  end loop;
  update public.avaliacoes set publicado = (nota >= 4) where publicado is null;
  for item in select value from jsonb_array_elements(checks) loop
    execute format('alter table public.avaliacoes add constraint %I %s',
      item->>'name', item->>'definition');
  end loop;
end;
$$;
alter table public.avaliacoes alter column publicado set default false;
alter table public.avaliacoes alter column publicado set not null;

create or replace function public.proteger_publicacao_avaliacao_loja()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    if tg_op='INSERT' then new.publicado := false;
    elsif new.publicado is distinct from old.publicado then
      raise exception 'Publicacao restrita a administradores' using errcode='42501';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.proteger_publicacao_avaliacao_loja() from public;
drop trigger if exists proteger_publicacao_avaliacao_loja on public.avaliacoes;
create trigger proteger_publicacao_avaliacao_loja before insert or update of publicado
on public.avaliacoes for each row execute function public.proteger_publicacao_avaliacao_loja();

-- Same limited projection; never reveal order/account IDs.
create or replace view public.public_reviews with (security_barrier=true) as
select id,
  split_part(trim(nome_cliente),' ',1) || case when position(' ' in trim(nome_cliente))>0
    then ' ' || left(split_part(trim(nome_cliente),' ',2),1) || '.' else '' end as nome_cliente,
  nota, comentario, created_at
from public.avaliacoes where publicado;
revoke all on public.public_reviews from public,anon,authenticated;
grant select on public.public_reviews to anon,authenticated;

create index if not exists store_reviews_published_recent on public.avaliacoes(created_at desc,id) where publicado;

create or replace function public.listar_avaliacoes_loja(p_pagina integer default 1)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if p_pagina is null or p_pagina not between 1 and 9999 then
    raise exception 'Pagina invalida' using errcode='22023';
  end if;
  with visible as (
    select v.*, exists(select 1 from public.avaliacoes r join public.pedidos p on p.id=r.pedido_id
      where r.id=v.id and r.user_id=p.user_id and lower(p.status)='entregue') as verificado
    from public.public_reviews v
  ), paginated as (
    select * from visible order by created_at desc,id limit 12 offset ((p_pagina-1)*12)
  ) select jsonb_build_object('total',(select count(*) from visible),
    'average',(select round(avg(nota),2) from visible),
    'items',coalesce((select jsonb_agg(to_jsonb(p) order by created_at desc,id) from paginated p),'[]'::jsonb)) into result;
  return result;
end;
$$;
revoke all on function public.listar_avaliacoes_loja(integer) from public;
grant execute on function public.listar_avaliacoes_loja(integer) to anon,authenticated;
commit;
