-- Retirada reversivel apenas dos dois SKUs solicitados.
-- Preserva registros, fotos, precos, estoque, pedidos e avaliacoes.
-- NUT-XBOOST (capsulas) nao e afetado.
begin;
set local lock_timeout = '5s';
update public.produtos
set is_deleted = true
where code in ('BE-TOQUE-LUM', 'BE-XBOOST-269')
  and coalesce(is_deleted, false) = false
returning code, name, is_deleted;
commit;
