// Retired from new sales; order snapshots and historical reviews remain intact.
export const retiredAccessoryCodes = ['AC-CXMEM', 'AC-CAM-P', 'AC-CAM-R', 'AC-SQUEEZE'] as const;
export const discontinuedProductCodes = [
  'NUT-AMYNO-CX', 'NUT-AMYNO-UN', 'NUT-POWER-UN', 'NUT-MUNITY-UN',
  'BE-SER-LUM', 'CAP-CO-KES', 'CAP-PRO-KES', 'CAP-AT-MC',
  'BE-TOQUE-LUM', 'BE-XBOOST-269',
] as const;
export const retiredProductCodes = [...retiredAccessoryCodes, ...discontinuedProductCodes] as const;

export function isRetiredProduct(product: { code: string; category?: string }) {
  const category = product.category?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  return (retiredProductCodes as readonly string[]).includes(product.code) || category === 'acessorios';
}
