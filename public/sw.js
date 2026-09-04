// Bumping this name is load-bearing: `activate` deletes every cache that does
// not match, which is how already-installed apps purge the HTML that older
// versions of this worker cached. Earlier versions served that HTML back
// whenever a fetch failed, which on an Android PWA cold start (process killed,
// radio still reconnecting) meant handing the user a stale signed-out page.
const CACHE_NAME = "catalog-v3";
const STATIC_ASSETS = [
  "/favicon.ico",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // Per-asset rather than addAll, so one 404 cannot fail the whole install.
      Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          fetch(asset).then((response) =>
            response.ok ? cache.put(asset, response) : undefined,
          ),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Bypass non-GET and cross-origin requests.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Cache-first for immutable, content-hashed build assets. These are safe to
  // cache indefinitely because the filename changes whenever the content does,
  // and they never carry per-user data.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone))
              .catch(() => {});
          }
          return response;
        });
      }),
    );
    return;
  }

  // Everything else — navigations, API routes, images, RSC payloads — is left
  // entirely to the browser. Deliberately no `respondWith`: returning early
  // keeps native handling intact, which matters for redirect semantics and for
  // `Set-Cookie` on the /auth/callback 302. Nothing that can carry auth state
  // is ever written to the cache, so a stale response can never resurrect a
  // signed-out page over a live session.
});
