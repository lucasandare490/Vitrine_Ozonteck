-- Read-only: checks installation, not execution history or payment correctness.
select
  to_regclass('public.avaliacoes_produtos') is not null as tabela_avaliacoes_produtos,
  to_regclass('public.public_reviews') is not null as vitrine_avaliacoes_loja,
  to_regprocedure('public.reservar_pedido_checkout(text,uuid,numeric,jsonb,jsonb,integer)') is not null as reserva_checkout,
  to_regprocedure('public.processar_status_pagamento(text,text,text,numeric)') is not null as webhook_quatro_parametros,
  to_regprocedure('public.listar_avaliacoes_produto(uuid,integer,boolean,text,integer)') is not null as consulta_avaliacoes_produto,
  to_regprocedure('public.itens_avaliaveis(uuid)') is not null as novo_fluxo_itens,
  to_regprocedure('public.enviar_avaliacao_produto(uuid,uuid,integer,text)') is not null as novo_fluxo_envio;

select tablename, indexname from pg_indexes
where schemaname='public' and tablename in ('avaliacoes','avaliacoes_produtos','produtos')
order by tablename,indexname;

select tablename,policyname,cmd,roles,qual,with_check from pg_policies
where schemaname='public' and tablename in ('avaliacoes','avaliacoes_produtos')
order by tablename,policyname;

select id,file_size_limit,allowed_mime_types from storage.buckets
where id in ('avatars','produtos','avaliacoes-produtos');

select count(*) as produtos_com_descricao from public.produtos
where nullif(btrim(description),'') is not null;
