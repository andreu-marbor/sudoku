/* Service worker del sudoku: red con respaldo en caché.
   Estrategia: intentar siempre red (contenido freso); si falla (sin
   conexión), servir desde la caché. Cada activación limpia las versiones
   antiguas. */

const CACHE = 'sudoku-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    (async () => {
      const claves = await caches.keys();
      await Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (evento) => {
  if (evento.request.method !== 'GET') return;
  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const respuesta = await fetch(evento.request);
        if (respuesta.ok) cache.put(evento.request, respuesta.clone());
        return respuesta;
      } catch {
        const guardada = await cache.match(evento.request);
        if (guardada) return guardada;
        throw errorSinRed(evento.request);
      }
    })(),
  );
});

function errorSinRed(peticion) {
  return new Response(`Sin conexión y sin copia de ${peticion.url}`, {
    status: 503,
    statusText: 'Sin conexión',
  });
}
