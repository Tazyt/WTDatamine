// Cache version identifier
const CACHE_VERSION = 'wt-leaks-v1';

// Assets to cache on install
const CACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/optimized-script.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2'
];

// Install event - cache critical assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => {
                console.log('Caching critical assets');
                return cache.addAll(CACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_VERSION) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - cache-first strategy for static assets, network-first for API calls
self.addEventListener('fetch', event => {
    // Skip cross-origin requests and API calls
    if (event.request.url.includes('api.github.com')) {
        return;
    }
    
    // For CDN resources and static assets
    if (event.request.url.includes('cdnjs.cloudflare.com') || 
        event.request.url.endsWith('.css') || 
        event.request.url.endsWith('.js') ||
        event.request.url.endsWith('.woff2')) {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    
                    return fetch(event.request)
                        .then(fetchResponse => {
                            // Don't cache non-successful responses
                            if (!fetchResponse || fetchResponse.status !== 200) {
                                return fetchResponse;
                            }
                            
                            // Clone the response so we can return one and cache one
                            const responseToCache = fetchResponse.clone();
                            
                            caches.open(CACHE_VERSION)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                                
                            return fetchResponse;
                        })
                        .catch(error => {
                            console.error('Fetch failed:', error);
                            // Could return a custom offline page here
                        });
                })
        );
    }
});

// Update the service worker registration in optimized-script.js
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(error => {
            console.log('ServiceWorker registration failed:', error);
        });
    });
}
