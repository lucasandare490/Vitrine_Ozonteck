// Only established customer destinations are accepted; never redirect to caller URLs.
const destinations = new Set([
  '/suporte', '/junte-se-a-nos', '/lista', '/conta', '/conta/pedidos',
  '/conta/dados', '/conta/enderecos', '/conta/favoritos', '/conta/seguranca',
]);

export function safeLoginReturn(search: string): string | null {
  const destination = new URLSearchParams(search).get('redirect');
  return destination && destinations.has(destination) ? destination : null;
}
