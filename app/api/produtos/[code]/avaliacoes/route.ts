import { catalogClient, getProduct } from '@/lib/server/products';
import { reviewFilters } from '@/lib/product-reviews';
import { isTestProduct } from '@/lib/products';

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const filters = reviewFilters(new URL(request.url).searchParams);
  if (!filters) return Response.json({ error: 'Filtros inválidos.' }, { status: 400 });
  try {
    const product = await getProduct((await context.params).code);
    if (!product || isTestProduct(product)) return Response.json({ error: 'Produto não encontrado.' }, { status: 404 });
    const { data, error } = await catalogClient().rpc('listar_avaliacoes_produto', {
      p_produto: product.id, p_nota: filters.stars, p_imagens: filters.images,
      p_ordem: filters.sort, p_pagina: filters.page,
    });
    if (error || !data) return Response.json({ error: 'Avaliações temporariamente indisponíveis.' }, { status: 503 });
    return Response.json(data, { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } });
  } catch {
    return Response.json({ error: 'Avaliações temporariamente indisponíveis.' }, { status: 503 });
  }
}
