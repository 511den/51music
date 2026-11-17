const CACHE = '51music-v9-singles-art';
const ASSETS = [
  'index.html',
  'songs.html',
  'manifest.json',
  'songs.json',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'covers/play.png',
  'og-image.png',
  'covers/kilotonna.svg?v=4',
  'covers/singles.svg?v=2',
  'favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for songs.json (so new songs show up without waiting for cache to expire),
// cache-first for everything else (app shell, icons).
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.endsWith('songs.json')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
