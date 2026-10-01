-- Retirada logica: preserva IDs, codigos, pedidos, avaliacoes e favoritos historicos.
-- CAP-CO-MEL (Condicionador Mel & Ozonio) e NUT-XBOOST (capsulas) NAO sao alterados.
begin;
set local lock_timeout = '5s';
update public.produtos set is_deleted = true
where code in (
  'NUT-AMYNO-CX', 'NUT-AMYNO-UN', 'NUT-POWER-UN', 'NUT-MUNITY-UN',
  'BE-SER-LUM', 'CAP-CO-KES', 'CAP-PRO-KES', 'CAP-AT-MC',
  'BE-TOQUE-LUM', 'BE-XBOOST-269'
) and is_deleted is distinct from true
returning id, code, name, is_deleted;
commit;
