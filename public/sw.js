/* XPI BD Intelligence — service worker
   Goal: make the app installable + open instantly, WITHOUT ever caching live AI results.
   - Navigations: network-first, fall back to a cached app shell when offline.
   - Static assets (icons/fonts): cache-first (fast, offline).
   - /api/*: always network, never cached (results must be live).
*/
const VERSION = 'bd-v1';
const SHELL = 'shell-' + VERSION;
const ASSETS = 'assets-' + VERSION;
const SHELL_URL = '/index.html';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', SHELL_URL])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never touch API or auth traffic — must always be live.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;
  if (url.origin.includes('supabase.co') || url.origin.includes('api.anthropic.com')) return;

  // App navigations: network-first, fall back to the cached shell offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { caches.open(SHELL).then((c) => c.put(SHELL_URL, res.clone())); return res; })
        .catch(() => caches.match(SHELL_URL).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static assets: cache-first, then fill the cache.
  if (url.origin === location.origin || url.origin.includes('fonts.gstatic.com') || url.origin.includes('fonts.googleapis.com')) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(ASSETS).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        }).catch(() => hit)
      )
    );
  }
});
