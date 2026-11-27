-- Owner confirmation received 2026-11-26. Soft deletion only.
-- Preserve prices, stock, descriptions, IDs and all order/review history.
-- The Mel & Ozonio mask (CAP-MAS-MEL) is not part of this withdrawal.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
do $$
begin
  if (select count(*) from public.produtos where code in ('CAP-SH-MEL', 'CAP-CO-MEL')) <> 2 then
    raise exception 'EXPECTED_TWO_EXISTING_MEL_PRODUCTS';
  end if;
end $$;
update public.produtos
set is_deleted = true
where code in ('CAP-SH-MEL', 'CAP-CO-MEL')
  and is_deleted is distinct from true
returning id, code, name, is_deleted;
commit;
