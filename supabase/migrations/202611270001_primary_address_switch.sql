-- Preserve the existing function signature, owner and grants. No data backfill.
-- Clearing the previous address first avoids a transient partial-unique-index conflict.
begin;

do $$
begin
  if to_regprocedure('public.set_primary_address(uuid)') is null
    or to_regclass('public.enderecos_um_principal_por_usuario_idx') is null then
    raise exception 'PRIMARY_ADDRESS_PREREQUISITES_REQUIRED';
  end if;
end;
$$;

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

  -- Calls for the same account serialize; unrelated accounts do not block each other.
  perform pg_advisory_xact_lock(hashtextextended('ozonteck-primary-address:' || v_user_id::text, 0));
  perform 1 from public.enderecos
    where id = p_address_id and user_id = v_user_id for update;
  if not found then
    raise exception 'Endereco nao encontrado';
  end if;

  update public.enderecos set principal = false
    where user_id = v_user_id and id <> p_address_id and principal = true;
  update public.enderecos set principal = true
    where id = p_address_id and user_id = v_user_id;
end;
$$;

commit;
