export type ProductReview = {
  id: string; nome: string; nota: number; comentario: string; created_at: string; imagens: string[];
};
export type ReviewPage = {
  total: number; average: number | null; stars: number[]; filtered: number; items: ProductReview[];
};
export function reviewFilters(params: URLSearchParams) {
  const stars = params.get('stars') || '0';
  const page = params.get('page') || '1';
  const sort = params.get('sort') || 'recent';
  const images = params.get('images') || 'false';
  if (!/^[0-5]$/.test(stars) || !/^[1-9]\d{0,3}$/.test(page) || !['recent', 'best'].includes(sort) || !['true', 'false'].includes(images)) return null;
  return { stars: Number(stars), page: Number(page), sort, images: images === 'true' };
}
export function reviewImageUrl(path: string, base: string) {
  if (!/^[a-f0-9-]{36}\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(path)) return null;
  try {
    const url = new URL(base);
    if (url.protocol !== 'https:') return null;
    return new URL(`/storage/v1/object/public/avaliacoes-produtos/${path}`, url.origin).toString();
  } catch { return null; }
}
