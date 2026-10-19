// Service worker de Bruuk: permite instalar la web y abrirla sin conexión con lo último que se vio.
// Las páginas van primero a la red (así cada deploy se ve al instante) y las APIs nunca se guardan.
const CACHE = 'bruuk-v1';
const OFFLINE_URLS = ['/', '/guadalajara'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

const putInCache = (request, response) => {
  if (response.ok) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/guadalajara') || caches.match('/'))),
    );
    return;
  }

  // Archivos con hash, imágenes y fuentes: caché primero, red de respaldo.
  if (/^\/(assets|img|icons|radar)\//.test(url.pathname) || /\.(webp|png|jpe?g|svg|woff2?)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => putInCache(request, response))));
  }
});
