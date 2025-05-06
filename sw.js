const CACHE_NAME = 'tacticalops-cache-v1';
const urlsToCache = [
    '/', // Represents the root index.html
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    // Add essential media files (adjust paths as needed)
    'media/Start Match.m4a',
    'media/red captured base.m4a',
    'media/blue captured base.m4a',
    'media/end game.m4a',
    'media/victorysfx.m4a',
    'media/red wins.m4a',
    'media/blue wins.m4a',
    'media/draw.m4a',
    'media/red capturing base.m4a',
    'media/blue capturing base.m4a',
    'media/scanning sfx.mp3',
    'media/bgm.m4a', // Cache BGM?
    'media/ambiance.m4a', // Cache Ambiance?
    'media/redteamqrcode.png', // Cache QR codes
    'media/blueteamqrcode.png',
    // Add icons (important for PWA installation appearance)
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    // Add any other absolutely essential assets here
    // Note: Dynamic announcement sounds are NOT cached here initially 
    // to keep the initial cache small. They will be fetched on demand.
];

// Install event: Cache essential assets
self.addEventListener('install', event => {
    console.log('[Service Worker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[Service Worker] Failed to cache app shell:', error);
            })
    );
});

// Activate event: Clean up old caches (optional but good practice)
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate');
    const cacheWhitelist = [CACHE_NAME]; // Current cache name
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhitelist.includes(cacheName)) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim(); // Take control immediately
});

// Fetch event: Serve cached assets if available, otherwise fetch from network
self.addEventListener('fetch', event => {
    // console.log('[Service Worker] Fetching:', event.request.url);
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    // console.log('[Service Worker] Found in cache:', event.request.url);
                    return response; // Serve from cache
                }
                // console.log('[Service Worker] Not in cache, fetching from network:', event.request.url);
                return fetch(event.request); // Fetch from network
            })
            .catch(error => {
                console.error('[Service Worker] Fetch error:', error);
                // Optional: Return a custom offline fallback page/response here
            })
    );
}); 