/* RONYCODE — Service Worker
   Estratégia:
   - navegações (HTML): rede primeiro, cai para o cache quando offline
   - demais arquivos: cache primeiro, atualizando em segundo plano   */

const VERSAO = "trcode-v1";
const ESSENCIAIS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches
      .open(VERSAO)
      .then((cache) => cache.addAll(ESSENCIAIS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (evento) => {
  if (evento.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // O manifest precisa ser sempre fresco: é ele que define
  // o nome/ícone do app instalado no celular.
  if (url.pathname === "/manifest.webmanifest") {
    evento.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copia = resp.clone();
            caches.open(VERSAO).then((c) => c.put("/manifest.webmanifest", copia));
          }
          return resp;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/manifest.webmanifest")))
    );
    return;
  }

  if (req.mode === "navigate") {
    evento.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(VERSAO).then((c) => c.put(req, copia));
          return resp;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match("/index.html")))
    );
    return;
  }

  evento.respondWith(
    caches.match(req).then((emCache) => {
      const naRede = fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && resp.type === "basic") {
            const copia = resp.clone();
            caches.open(VERSAO).then((c) => c.put(req, copia));
          }
          return resp;
        })
        .catch(() => emCache);
      return emCache || naRede;
    })
  );
});
