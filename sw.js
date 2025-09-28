// v29 — нов кеш за да „изблъска“ v28
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open('bt-cache-v29').then(c=>c.addAll([
      './',
      './index.html?v=29',
      './manifest.webmanifest?v=29',
      './assets/icons/icon-192.png?v=29',
      './assets/icons/icon-512.png?v=29'
    ]))
  );
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!=='bt-cache-v29').map(k=>caches.delete(k))))
  );
});
self.addEventListener('fetch', e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request))
  );
});
