-- Preparado para execucao MANUAL apos conferir o diagnostico.
-- Complementa o hardening sem recriar funcoes, tabelas, policies ou dados.
-- Nao resolve o aviso da view nem os avisos de listagem dos buckets.
begin;
do $$
declare
  signature text;
  fn regprocedure;
begin
  foreach signature in array array[
    'public.cancelar_reserva_checkout(text)',
    'public.liberar_reservas_expiradas()',
    'public.reservar_pedido_checkout(text,uuid,numeric,jsonb,jsonb,integer)',
    'public.processar_status_pagamento(text,text,text,numeric)'
  ] loop
    fn := to_regprocedure(signature);
    if fn is null then
      raise exception 'Pre-requisito ausente: %. Pare e revise o diagnostico.',signature;
    end if;
    execute format('revoke execute on function %s from public,anon,authenticated',fn);
    execute format('grant execute on function %s to service_role',fn);
    if has_function_privilege('anon',fn,'EXECUTE')
      or has_function_privilege('authenticated',fn,'EXECUTE') then
      raise exception 'Permissao herdada ainda permite acesso a %. Transacao cancelada.',signature;
    end if;
  end loop;

  -- Gatilhos continuam associados as mesmas funcoes. Nao sao RPCs do cliente.
  foreach signature in array array[
    'public.enforce_review_identity()', 'public.handle_new_auth_user()',
    'public.handle_new_user()', 'public.protect_profile_role()',
    'public.proteger_produto_com_pedido()', 'public.proteger_publicacao_avaliacao_loja()'
  ] loop
    fn := to_regprocedure(signature);
    if fn is not null then
      if (select prorettype <> 'trigger'::regtype from pg_proc where oid=fn) then
        raise exception 'Assinatura inesperada: % nao retorna trigger.',signature;
      end if;
      execute format('revoke execute on function %s from public,anon,authenticated',fn);
    end if;
  end loop;

  foreach signature in array array[
    'public.set_primary_address(uuid)', 'public.itens_avaliaveis(uuid)',
    'public.enviar_avaliacao_produto(uuid,uuid,integer,text)'
  ] loop
    fn := to_regprocedure(signature);
    if fn is not null then
      execute format('revoke execute on function %s from public,anon',fn);
      execute format('grant execute on function %s to authenticated',fn);
    end if;
  end loop;
end;
$$;
-- is_admin e as consultas publicas de avaliacoes permanecem acessiveis:
-- seus chamadores e policies dependem disso. Nenhum REVOKE global.
commit;
