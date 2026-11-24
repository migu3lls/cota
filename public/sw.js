const CACHE_NAME = "cota-10a-cache-v2";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/apple-touch-icon.png",
  "/favicon.svg",
  "/favicon-32x32.png",
  "/icons/pwa-192.png",
  "/icons/pwa-512.png",
  "/icons/pwa-maskable-192.png",
  "/icons/pwa-maskable-512.png",
  "/icons/apple-touch-icon-512.png",
  "/brand/cota-icone.svg",
  "/brand/cota-icone-dark.svg",
  "/brand/cota-logo.svg",
  "/brand/cota-logo-dark.svg",
  "/brand/logo-compacta.svg",
  "/brand/logo-compacta-dark.svg"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Assets imutaveis do Next.js: Cache-First para abrir instantaneo offline
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => undefined);
          }
          return response;
        });
      })
    );
    return;
  }

  // Navegacao e demais rotas: Network-First com fallback offline imediato
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned)).catch(() => undefined);
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/"))
      )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/?tab=cobrar";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(targetUrl).catch(() => undefined);
            }
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
