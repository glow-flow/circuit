const PRECACHE_VERSION = '__CIRCUIT_SW_VERSION__';
const PRECACHE_CACHE_PREFIX = 'circuit-sandbox-precache-';
const PRECACHE_CACHE_NAME = `${PRECACHE_CACHE_PREFIX}${PRECACHE_VERSION}`;
const FONT_CACHE_NAME = 'circuit-sandbox-fonts-v1';

const PRECACHE_URLS = /* __CIRCUIT_PRECACHE_URLS__ */ ['/', '/index.html', '/manifest.webmanifest', '/favicon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_CACHE_NAME).then((cache) => {
      // Reload flag avoids populating a new release cache with stale HTTP cache entries.
      const requests = PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' }));
      return cache.addAll(requests);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheKeys) =>
        Promise.all(
          cacheKeys
            .filter(
              (key) => key.startsWith(PRECACHE_CACHE_PREFIX) && key !== PRECACHE_CACHE_NAME
            )
            .map((staleKey) => caches.delete(staleKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function handleFontAsset(request, isImmutableFontFile) {
  const cache = await caches.open(FONT_CACHE_NAME);
  const cached = await cache.match(request);

  if (isImmutableFontFile && cached) {
    return cached;
  }

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && (response.ok || response.type === 'opaque')) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  return networkResponse || new Response('', { status: 504, statusText: 'Offline' });
}

async function handleNavigationRequest(request) {
  const cache = await caches.open(PRECACHE_CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
      cache.put('/index.html', networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedShell =
      (await cache.match('/index.html', { ignoreSearch: true })) ||
      (await cache.match('/', { ignoreSearch: true })) ||
      (await caches.match('/index.html', { ignoreSearch: true }));

    return (
      cachedShell ||
      new Response('Offline: aplikasi belum selesai di-cache di perangkat ini.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
}

async function handleSameOriginAsset(request) {
  const precache = await caches.open(PRECACHE_CACHE_NAME);
  const cached = (await precache.match(request)) || (await caches.match(request));
  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
      precache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(handleFontAsset(request, true));
    return;
  }

  if (url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(handleFontAsset(request, false));
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  // Never serve the service worker script itself from cache.
  if (url.pathname === '/sw.js') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  event.respondWith(handleSameOriginAsset(request));
});
