const CACHE_NAME = "landbd-offline-v1";
const OFFLINE_URL = "/offline.html";
const APP_ROUTES = ["/", "/khatiyan", "/faraez", "/history"];
const API_PREFIX = "/api/rajuk/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([OFFLINE_URL, ...APP_ROUTES]),
    ).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("landbd-offline-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

function isExcluded(url) {
  return url.pathname.startsWith(API_PREFIX)
    || url.pathname.startsWith("/api/")
    || url.pathname.startsWith("/_next/image")
    || url.pathname.startsWith("/admin")
    || url.pathname.startsWith("/login");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || isExcluded(url)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok && APP_ROUTES.includes(url.pathname)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => caches.match(url.pathname) || caches.match(OFFLINE_URL));
      }),
    );
    return;
  }

  // Cache successful same-origin static chunks/assets as they are requested.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request))),
    );
  }
});
