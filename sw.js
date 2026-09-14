/* ==========================================================
   Bitácora — Service Worker
   Estrategia: RED PRIMERO, caché como respaldo.
   Así la app abre sin señal, pero cuando hay internet siempre
   toma la última versión publicada (evita quedarse pegada en
   una versión vieja después de subir cambios a GitHub).
   ========================================================== */

const CACHE = 'bitacora-v2';
const ARCHIVOS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ARCHIVOS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(claves => Promise.all(
        claves.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  // Solo se cachea la navegación propia; nada de datos del usuario
  if(ev.request.method !== 'GET') return;

  ev.respondWith(
    fetch(ev.request)
      .then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(ev.request, copia)).catch(() => {});
        return resp;
      })
      .catch(() =>
        caches.match(ev.request).then(hit => hit || caches.match('./index.html'))
      )
  );
});
