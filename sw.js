// sw.js — 梨花祭2026 Service Worker
const CACHE_NAME = 'rikasai2026-v1';

// キャッシュするリソース
const PRECACHE_URLS = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// インストール時：リソースをキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// アクティベート時：古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// フェッチ時：キャッシュファースト戦略
self.addEventListener('fetch', event => {
  // GASへのAPIリクエストはキャッシュしない（常にネットワーク）
  if (event.request.url.includes('script.google.com')) {
    return; // ブラウザのデフォルト動作に任せる
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // 正常なレスポンスのみキャッシュ
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // オフライン時：index.htmlを返す
        return caches.match('./index.html');
      });
    })
  );
});