begin;

-- CSV input contains only code/price/estoque; expectations come from the preview.
-- No INSERT, restore, category change, content/image update, or whole-record replacement.
create function public.import_product_updates(p_rows jsonb, p_expected jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  item jsonb;
  expected jsonb;
  product public.produtos%rowtype;
  changed integer := 0;
  affected integer;
begin
  if auth.uid() is null or public.is_admin() is not true or public.account_mfa_allowed() is not true then
    raise exception using errcode = '42501', message = 'Administrador e verificação MFA da conta são necessários';
  end if;
  if jsonb_typeof(p_rows) is distinct from 'array' or jsonb_typeof(p_expected) is distinct from 'array' then
    raise exception 'Lote e prévia devem ser listas';
  end if;
  if jsonb_array_length(p_rows) not between 1 and 100
    or jsonb_array_length(p_expected) <> jsonb_array_length(p_rows)
    or octet_length(p_rows::text) > 131072 or octet_length(p_expected::text) > 131072 then
    raise exception 'Informe de 1 a 100 produtos e a prévia correspondente';
  end if;

  -- Validate both lists before casting or locking. Reject unknown keys, not just ignore them.
  for item in select value from jsonb_array_elements(p_rows)
    union all select value from jsonb_array_elements(p_expected) loop
    if jsonb_typeof(item) is distinct from 'object' then raise exception 'Linha inválida'; end if;
    if exists(select 1 from jsonb_object_keys(item) as k(key) where key not in ('code','price','estoque'))
      or jsonb_typeof(item->'code') is distinct from 'string'
      or length(item->>'code') not between 1 and 100
      or item->>'code' <> btrim(item->>'code') or item->>'code' ~ '[[:cntrl:]]'
      or not (item ? 'price' or item ? 'estoque') then
      raise exception 'Use apenas código, preço e estoque válidos';
    end if;
    if item ? 'price' then
      if jsonb_typeof(item->'price') is distinct from 'number' then raise exception 'Preço deve ser numérico'; end if;
      if (item->>'price')::numeric <= 0 or (item->>'price')::numeric >= 1000000
        or (item->>'price')::numeric <> round((item->>'price')::numeric,2) then raise exception 'Preço inválido'; end if;
    end if;
    if item ? 'estoque' then
      if jsonb_typeof(item->'estoque') is distinct from 'number' then raise exception 'Estoque deve ser numérico'; end if;
      if (item->>'estoque')::numeric < 0 or (item->>'estoque')::numeric > 2147483647
        or (item->>'estoque')::numeric <> trunc((item->>'estoque')::numeric) then raise exception 'Estoque inválido'; end if;
    end if;
  end loop;
  if (select count(distinct value->>'code') from jsonb_array_elements(p_rows)) <> jsonb_array_length(p_rows)
    or (select count(distinct value->>'code') from jsonb_array_elements(p_expected)) <> jsonb_array_length(p_expected) then
    raise exception 'Códigos duplicados';
  end if;

  -- Lock in code order, validate the ENTIRE batch, then perform narrow updates.
  for item in select value from jsonb_array_elements(p_rows) order by value->>'code' loop
    select value into expected from jsonb_array_elements(p_expected) where value->>'code' = item->>'code';
    if not found or (expected ? 'price') <> (item ? 'price') or (expected ? 'estoque') <> (item ? 'estoque') then
      raise exception 'Prévia não corresponde aos campos importados';
    end if;
    select * into product from public.produtos where code = item->>'code' for update;
    if not found then raise exception 'Produto inexistente: %', item->>'code'; end if;
    if coalesce(product.is_deleted,false) or nullif(btrim(product.name),'') is null then
      raise exception 'Produto inativo ou nome inválido: %', product.code;
    end if;
    if nullif(btrim(product.category),'') is not null then
      perform 1 from public.categorias where name = product.category and archived_at is null for share;
      if not found then raise exception 'Categoria inexistente ou arquivada: %', product.code; end if;
    end if;
    -- An identical replay is a no-op. A concurrent change to an imported field
    -- requires a fresh preview; unrelated stock/content changes are preserved.
    if (item ? 'price' and product.price is distinct from (expected->>'price')::numeric
          and product.price is distinct from (item->>'price')::numeric)
      or (item ? 'estoque' and product.estoque is distinct from (expected->>'estoque')::integer
          and product.estoque is distinct from (item->>'estoque')::integer) then
      raise exception using errcode = '40001', message = 'Prévia desatualizada para ' || product.code || '. Gere uma nova prévia.';
    end if;
  end loop;

  for item in select value from jsonb_array_elements(p_rows) order by value->>'code' loop
    update public.produtos
      set price = case when item ? 'price' then (item->>'price')::numeric else price end,
          estoque = case when item ? 'estoque' then (item->>'estoque')::integer else estoque end
      where code = item->>'code'
        and ((item ? 'price' and price is distinct from (item->>'price')::numeric)
          or (item ? 'estoque' and estoque is distinct from (item->>'estoque')::integer));
    get diagnostics affected = row_count;
    changed := changed + affected;
  end loop;
  return jsonb_build_object('processed',jsonb_array_length(p_rows),'updated',changed);
end $$;
revoke all on function public.import_product_updates(jsonb,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.import_product_updates(jsonb,jsonb) to authenticated;

commit;
