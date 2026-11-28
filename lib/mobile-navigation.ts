export const mobileDestinations = [
  { href: '/#catalogo', label: 'Catálogo', icon: 'catalog' },
  { href: '/busca', label: 'Buscar', icon: 'search' },
  { href: '/conta/favoritos', label: 'Favoritos', icon: 'heart' },
  { href: '/lista', label: 'Carrinho', icon: 'cart' },
  { href: '/conta', label: 'Conta', icon: 'account' },
] as const;

export const mobileTitles: Record<string, string> = {
  '/': 'Ozonteck Recife', '/busca': 'Buscar produtos', '/lista': 'Carrinho e pagamento',
  '/login': 'Acesse sua conta', '/conta': 'Minha conta', '/conta/dados': 'Meus dados',
  '/conta/enderecos': 'Meus endereços', '/conta/favoritos': 'Favoritos', '/conta/pedidos': 'Meus pedidos',
  '/conta/seguranca': 'Segurança da conta', '/suporte': 'Central de ajuda',
  '/sobre_cliente': 'Conheça a loja', '/junte-se-a-nos': 'Junte-se a nós', '/instalar': 'Aplicativo Ozonteck',
};
export function mobileSection(path: string) {
  if (path.startsWith('/admin')) return 'admin';
  if (path.startsWith('/produto/')) return 'product';
  if (path === '/lista') return 'checkout';
  if (path.startsWith('/conta')) return 'account';
  if (path === '/login') return 'auth';
  return 'store';
}
export function isMobileDestinationActive(path: string, href: string) {
  if (href === '/#catalogo') return path === '/' || path.startsWith('/produto/');
  if (href === '/conta') return (path.startsWith('/conta') && path !== '/conta/favoritos') || path === '/login';
  return path === href;
}
export function catalogReturn(value: string | null) {
  try {
    const url = new URL(value || '/', 'https://store.invalid');
    if (url.origin !== 'https://store.invalid' || url.pathname !== '/') return '/#catalogo';
    return `/${url.search}#catalogo`;
  } catch { return '/#catalogo'; }
}
