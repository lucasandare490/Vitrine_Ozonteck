import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'Ozonteck Recife', short_name: 'Ozonteck', lang: 'pt-BR',
    description: 'Catálogo, pedidos e atendimento da Ozonteck Recife.',
    start_url: '/', scope: '/', display: 'standalone',
    background_color: '#f5f8f8', theme_color: '#064e49',
    icons: [
      { src: '/app-icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/app-icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/app-icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Explorar catálogo', url: '/#catalogo' },
      { name: 'Meus pedidos', url: '/conta/pedidos' },
    ],
  };
}
