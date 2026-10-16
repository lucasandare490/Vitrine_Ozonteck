begin;

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

  -- Ignore delayed non-final events after settlement or a financial reversal.
  if (v_order.status_pagamento in ('refunded', 'charged_back') and p_payment_status not in ('refunded', 'charged_back'))
     or (v_order.status_pagamento = 'approved' and p_payment_status in ('pending', 'in_process', 'authorized', 'rejected', 'cancelled')) then
    return jsonb_build_object('pedido_encontrado', true, 'pedido_id', v_order.id, 'evento_ignorado', true);
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
       set status = case
             when v_order.status in ('enviado', 'entregue', 'cancelado', 'cancelled', 'reembolsado') then v_order.status
             when v_stock_available then 'preparando'
             else 'revisao_estoque' end,
           reserva_expira_em = null
     where id = v_order.id;
  elsif p_payment_status in ('refunded', 'charged_back') then
    update public.pedidos
       set status = case when p_payment_status = 'refunded' then 'reembolsado' else 'revisao_pagamento' end,
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
  elsif p_payment_status in ('rejected', 'cancelled')
        and v_order.status in ('pending', 'falha_pagamento') then
    update public.pedidos
       set status = case when p_payment_status = 'cancelled' then 'cancelado' else 'pagamento_recusado' end,
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

