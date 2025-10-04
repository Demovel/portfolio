// sw.js - Service Worker для кэширования
const CACHE_NAME = 'portfolio-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/script.js',
  '/zlata1.png',
  '/images/proj_pmgf.jpg',
  '/images/proj_nsi.jpg',
  '/images/proj_hr.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
