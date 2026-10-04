// Sayı Avcısı Service Worker - Network-first strategy
// Güncel yayın adresi: https://furher92.github.io/SayiAvcisi/
// Her açılışta bu adresten taze HTML çek, network başarısız olursa cache'i kullan.
// Not: Bu dosya origin'den bağımsız çalışır (relative fetch) — adres değişse bile kod değişmez,
// bu satır sadece dokümantasyon/takip amaçlıdır.

const CACHE_NAME = 'sa-cache-alpha2-logo'; // 🔄 Yeni logo/ikonlar için önbellek adı değişti — eski kullanıcılar yeni ikonları alır

self.addEventListener('install', function(e) {
  // Yeni service worker hemen aktif olsun, eski sürümü bekleme
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Aktif olunca eski cache'leri temizle, kontrolü ele al
  e.waitUntil(
    Promise.all([
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        }));
      }),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', function(e) {
  // Sadece GET isteklerini ele al
  if (e.request.method !== 'GET') return;

  // Network-first: önce GitHub'a sor, başarısız olursa cache'den ver
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Sadece başarılı (200) yanıtları cache'e yaz — 404/hata sayfaları önbelleğe girmesin
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(function() {
        // Network başarısız oldu (offline) -> cache'den dene, o da yoksa ana sayfayı ver
        return caches.match(e.request).then(function(cached) {
          return cached || caches.match('./');
        });
      })
  );
});
