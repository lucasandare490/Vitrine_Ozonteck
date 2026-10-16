import type { Product } from './data';

export function productPath(code: string) {
  return `/produto/${encodeURIComponent(code)}`;
}

export function isTestProduct(product: Pick<Product, 'category' | 'name'>) {
  return product.category.trim().toLowerCase() === 'teste' || /^\[teste\]/i.test(product.name);
}

export function isHiddenTestProduct(product: Pick<Product, 'category' | 'name'> & { code?: string }) {
  return isTestProduct(product) && !((process.env.NEXT_PUBLIC_PAYMENT_SANDBOX === 'true' || process.env.NEXT_PUBLIC_LIVE_TEST_PRODUCT === 'TESTE-001') && product.code === 'TESTE-001');
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function serializeStructuredData(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
