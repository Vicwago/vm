/*
 * SERVICE WORKER: caché offline (cache-first) de los archivos estáticos.
 * Para que la tablet recoja una versión nueva: subir CACHE_VERSION y abrir la app una vez con internet.
 * Cambiar CACHE_VERSION no borra el historial ni la cola de emails (viven en localStorage).
 * Solo se interceptan peticiones GET del propio sitio: los POST de email nunca pasan por la caché.
 */
var CACHE_VERSION = "v1.6.0";
var CACHE = "norteia-auditoria-" + CACHE_VERSION;

importScripts("niches/index.js");

var ARCHIVOS = [
  "./",
  "index.html",
  "styles.css",
  "config.js",
  "almacen.js",
  "motor.js",
  "email.js",
  "app.js",
  "manifest.webmanifest",
  "niches/index.js",
  "assets/logo-norteia.svg",
  "assets/logo-norteia-blanco.svg",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/icon-maskable-512.png",
  "assets/qr.js",
  "assets/iconos.js",
  "assets/fonts/Outfit-Regular.woff2",
  "assets/fonts/Outfit-SemiBold.woff2",
  "assets/fonts/Inter-Regular.woff2",
  "assets/fonts/Inter-SemiBold.woff2"
].concat((self.NICHOS_LISTA || []).map(function (id) { return "niches/" + id + ".js"; }));

// Opcionales: pueden no existir en la publicación (config local de EmailJS, logo en PNG)
var OPCIONALES = ["config.local.js", "assets/logo-norteia.png"];

self.addEventListener("install", function (ev) {
  ev.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ARCHIVOS.map(function (u) { return new Request(u, { cache: "reload" }); })).then(function () {
        return Promise.all(OPCIONALES.map(function (u) {
          return fetch(new Request(u, { cache: "reload" })).then(function (r) {
            var tipo = (r.headers.get("Content-Type") || "").toLowerCase();
            if (r.ok && tipo.indexOf("html") < 0) return cache.put(u, r);
          }).catch(function () { /* no existe: sin config local */ });
        }));
      });
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ev) {
  ev.waitUntil(
    caches.keys().then(function (claves) {
      return Promise.all(claves.filter(function (k) {
        return k.indexOf("norteia-auditoria-") === 0 && k !== CACHE;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ev) {
  var req = ev.request;
  if (req.method !== "GET") return;                          // POST de email: directo a la red
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // nada externo (EmailJS, Cal.com)

  ev.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (enCache) {
      if (enCache) return enCache;
      return fetch(req).then(function (resp) {
        return resp;
      }).catch(function () {
        // Sin red: las navegaciones abren la app desde la caché
        if (req.mode === "navigate") return caches.match("index.html");
        return new Response("", { status: 504, statusText: "Sin conexión" });
      });
    })
  );
});
