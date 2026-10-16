begin;
alter table public.categorias add column if not exists archived_at timestamptz;
drop policy if exists categories_public_read on public.categorias;
create policy categories_public_read on public.categorias
for select to anon, authenticated
using (archived_at is null or public.is_admin());
-- Restorable removal must not delete the row or reclassify its products.
revoke delete on public.categorias from anon, authenticated;
commit;
