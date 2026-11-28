/* Ozonteck: deliberately small offline shell. Never cache commerce or account data. */
const OFFLINE_CACHE = 'ozonteck-offline-v1';
const STATIC_FILES = ['/offline.html', '/app-icons/icon-192.png', '/app-icons/icon-512.png', '/app-icons/maskable-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.addAll(STATIC_FILES)));
  // Updates remain waiting until the user chooses to apply them or all old clients close.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('ozonteck-offline-') && name !== OFFLINE_CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // APIs, auth, Supabase, payment frames, Next RSC/prefetch and all mutations bypass caches.
  if (request.method !== 'GET' || url.origin !== self.location.origin
    || url.pathname === '/api' || url.pathname.startsWith('/api/')
    || request.headers.has('authorization') || request.headers.has('rsc') || request.headers.has('next-router-prefetch')) return;
  if (!url.search && STATIC_FILES.includes(url.pathname)) {
    event.respondWith(caches.open(OFFLINE_CACHE).then(async cache => (await cache.match(url.pathname)) || fetch(request)));
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store' }).catch(async () => {
      const offline = await (await caches.open(OFFLINE_CACHE)).match('/offline.html');
      return offline || new Response('Sem conexão. Tente novamente.', { status: 503, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
    }));
  }
});
