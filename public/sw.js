/**
 * Offline cache for Rule or Drool (TRANSFER.md phase 7).
 *
 * CACHE_NAME and PRECACHE below are the source-of-truth defaults used in development.
 * `npm run build` rewrites both in `dist/sw.js`: CACHE_NAME from APP_VERSION, PRECACHE
 * from the files Vite actually emitted, since their names are content-hashed. That makes
 * the section 12 convention ("bump APP_VERSION and CACHE_NAME together") automatic rather
 * than a thing to remember; `tests/pwa.test.ts` checks the literal below still matches.
 */
const CACHE_NAME = "rod-v0.80.0";
/**
 * Every cache this game has made is named rod-v<version>. The origin is not the game's own:
 * rcjlabs.github.io serves every Pages site on the account, and caches belong to the origin.
 * So only caches with this prefix are ever cleared (BACKLOG-8 phase 50).
 */
const CACHE_PREFIX = "rod-v";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest"];
const INDEX = "./index.html";

self.addEventListener("install", (event) => {
  // Deliberately no skipWaiting: a new worker must not swap the bundle out from under a
  // run in progress. The page offers the player a reload instead (see useServiceWorker).
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // One bad URL must not fail the whole install, so add individually.
      Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // Navigations always resolve to the cached shell, which is what makes offline play work.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const shell = await cache.match(INDEX);
        if (shell) return shell;
        try {
          return await fetch(req);
        } catch {
          return new Response("Offline and nothing cached yet.", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => undefined);
        return res;
      } catch (err) {
        const shell = await cache.match(INDEX);
        if (shell) return shell;
        throw err;
      }
    })(),
  );
});
