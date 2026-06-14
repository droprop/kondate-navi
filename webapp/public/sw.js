/**
 * こんだてボード Service Worker
 * - アプリシェル（HTML/JS/CSS/アイコン）をキャッシュしてオフラインでも起動できるようにする
 * - 献立JSON (/data/*.json) はアプリ側の localStorage キャッシュ（SWR方式）に任せ、SWでは触らない
 * - キャッシュ戦略を変えたら CACHE_VERSION を上げること（古いキャッシュは activate 時に削除される）
 */
const CACHE_VERSION = 'kondate-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(['/']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // GET かつ同一オリジンのみ対象（GA等の外部リクエストは素通し）
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // 献立JSONはネットワークに任せる（アプリ側でlocalStorageキャッシュ済み）
  if (url.pathname.startsWith('/data/')) return;

  // ページ遷移: ネットワーク優先、オフライン時はキャッシュにフォールバック
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/'))
        )
    );
    return;
  }

  // 静的アセット: stale-while-revalidate（キャッシュを即返しつつ裏で更新）
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
