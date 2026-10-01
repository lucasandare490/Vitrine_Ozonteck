-- Retires accessories without deleting products, images, reviews or order history.
-- No stock/price/payment changes. Review affected rows before running in production.
begin;
update public.produtos
set is_deleted = true
where (code in ('AC-CXMEM', 'AC-CAM-P', 'AC-CAM-R', 'AC-SQUEEZE')
       or lower(trim(category)) in ('acessórios', 'acessorios'))
  and coalesce(is_deleted, false) = false
returning code, name;
commit;
