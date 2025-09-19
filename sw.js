self.addEventListener('install', e => {
  e.waitUntil(caches.open('bt-cache-v1').then(c=>c.addAll(['./','./index.html','./manifest.webmanifest','./sw.js','./assets/icons/icon-192.png','./assets/icons/icon-512.png','./chart.local.js'])));
});
self.addEventListener('fetch', e => { e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))); });
