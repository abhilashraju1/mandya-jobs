// Mandya Jobs (ಮಂಡ್ಯ ಜಾಬ್ಸ್) - Service Worker
const CACHE_NAME = 'mandya-jobs-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: Cache critical static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network first with cache fallback for pages and public static assets
// Excludes authenticated, private API or file upload requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache POST, PUT, DELETE, private API responses, or resumes
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/v1/auth') ||
    url.pathname.startsWith('/api/v1/resumes') ||
    url.pathname.startsWith('/api/v1/applications')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful public GET responses
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Return cached version or offline fallback
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return caches.match('/');
        });
      })
  );
});
