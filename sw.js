// Sayı Avcısı Service Worker - Network-first strategy
// Her açılışta GitHub'dan taze HTML çek, network başarısız olursa cache'i kullan

const CACHE_NAME = 'sa-cache-alpha1'; // 🔄 Alpha1 için önbellek sürümü artırıldı — eski kullanıcılara zorla güncelleme

self.addEventListener('install', function(e) {
  // Yeni service worker hemen aktif olsun, eski sürümü bekleme
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Aktif olunca eski cache'leri temizle, kontrolü ele al
  e.waitUntil(
    Promise.all([
      // Eski cache'leri sil
      caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(key) {
          if (key !== CACHE_NAME) return caches.delete(key);
        }));
      }),
      // Tüm açık sekmelerin kontrolünü al
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
        // Başarılı yanıtı cache'e de yaz (bir sonraki offline erişim için)
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, responseClone);
        });
        return response;
      })
      .catch(function() {
        // Network başarısız oldu (offline) -> cache'den dene
        return caches.match(e.request);
      })
  );
});
