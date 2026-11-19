// Master Stock Board app shell worker.
//
// LAW (accuracy outranks everything): this worker caches ONLY the static
// app-shell assets — the icons and the manifest. The board page (index.html)
// and EVERY data / feed / API call are NETWORK-ONLY: never cached, never
// intercepted into a cache, never served stale. The board's reads always
// come off the live tape, exactly as if no worker were installed.
var SHELL_CACHE = 'master-stock-board-shell-v1';
var SHELL_FILES = [
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(function (cache) {
      return cache.addAll(SHELL_FILES.map(function (f) {
        return new URL(f, self.registration.scope).href;
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === SHELL_CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // feeds/APIs: untouched
  var file = url.pathname.split('/').pop();
  if (SHELL_FILES.indexOf(file) === -1) return; // page + everything else: network-only, no interception
  // Static shell assets only: cache-first, refreshed from the network in the background.
  event.respondWith(
    caches.match(event.request).then(function (hit) {
      var refresh = fetch(event.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(SHELL_CACHE).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || refresh;
    })
  );
});
