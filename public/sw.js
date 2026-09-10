/// <reference lib="webworker" />

const CACHE_NAME = "swapspot-v1";

// Shell assets to pre-cache on install. These make the app load instantly when
// offline or on flaky campus Wi-Fi. We intentionally keep this list small —
// dynamic pages are cached at runtime via the stale-while-revalidate strategy.
const PRECACHE_URLS = [
  "/",
  "/browse",
  "/categories",
  "/how-it-works",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// ---------- Install: pre-cache the app shell ----------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ---------- Activate: purge old caches ----------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------- Fetch: stale-while-revalidate ----------
// For navigation requests (HTML) we try network first, falling back to cache.
// For static assets we serve from cache first, updating in the background.
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Skip Supabase API calls and auth-related requests
  if (request.url.includes("/auth/") || request.url.includes("/rest/")) return;

  // Navigation requests: network-first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
