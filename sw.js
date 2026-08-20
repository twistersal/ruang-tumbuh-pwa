/* Pocket Field Notes PWA cache: app shell first, then cache assets during normal use. */
const CACHE_NAME = "ruang-tumbuh-pocket-notes-v4";
const APP_ROOT = new URL(self.registration.scope).pathname;
const APP_SHELL = [APP_ROOT, `${APP_ROOT}manifest.webmanifest`, "https://ruangtumbuh-7wc6sasx.manus.space/manus-storage/ruang-tumbuh-icon-closeup_a590a1b3.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith("/@") || requestUrl.pathname.startsWith("/src/") || requestUrl.pathname.startsWith("/node_modules/") || requestUrl.pathname.includes("/@fs/")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(APP_ROOT, copy));
      return response;
    }).catch(() => caches.match(APP_ROOT)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response && response.status === 200 && (response.type === "basic" || response.type === "cors")) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => cached)));
});
