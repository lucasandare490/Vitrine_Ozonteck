begin;

-- Commit the new reservation and its link together. An invalid link rolls back stock.
create or replace function public.reserve_changed_order(
  p_checkout_id text, p_user_id uuid, p_total numeric, p_delivery_address jsonb,
  p_items jsonb, p_reservation_minutes integer, p_change uuid
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  reservation jsonb;
begin
  reservation := public.reserve_priced_order(
    p_checkout_id, p_user_id, p_total, p_delivery_address, p_items, p_reservation_minutes
  );
  perform public.vincular_compra_alterada(p_change, (reservation->>'id')::uuid, p_user_id);
  return reservation;
end;
$$;

revoke all on function public.reserve_changed_order(text,uuid,numeric,jsonb,jsonb,integer,uuid)
  from public, anon, authenticated;
grant execute on function public.reserve_changed_order(text,uuid,numeric,jsonb,jsonb,integer,uuid) to service_role;
notify pgrst, 'reload schema';
commit;
