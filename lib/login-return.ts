// Only established customer destinations are accepted; never redirect to caller URLs.
const destinations = new Set([
  '/suporte', '/junte-se-a-nos', '/lista', '/conta', '/conta/pedidos',
  '/conta/dados', '/conta/enderecos', '/conta/favoritos', '/conta/seguranca',
]);

export function safeLoginReturn(search: string): string | null {
  const destination = new URLSearchParams(search).get('redirect');
  if (!destination) return null;
  if (destinations.has(destination)) return destination;
  // Product links created by the catalog use one known SKU segment, never a caller URL.
  return /^\/produto\/[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(destination) ? destination : null;
}
