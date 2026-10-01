-- Execucao manual. Altera SOMENTE o nome do shampoo identificado pelo SKU.
-- Mantem codigo, imagem, descricao, categoria, preco, estoque e historico.
begin;
set local lock_timeout = '5s';
do $$
declare nome_atual text;
begin
  select name into nome_atual from public.produtos
  where code = 'CAP-SH-MEL' for update;
  if not found then
    raise exception 'Shampoo CAP-SH-MEL nao encontrado. Nenhuma alteracao aplicada.';
  end if;
  if nome_atual not in ('Shampoo Ozon Mel', 'Shampoo Mel & Ozônio') then
    raise exception 'Nome inesperado: %. Confira o produto antes de alterar.', nome_atual;
  end if;
end;
$$;
update public.produtos
set name = 'Shampoo Mel & Ozônio'
where code = 'CAP-SH-MEL' and name = 'Shampoo Ozon Mel'
returning code, name;
commit;
