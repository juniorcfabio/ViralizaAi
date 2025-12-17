// Service Worker para PWA Viraliza.ai
const CACHE_NAME = 'viraliza-ai-v1.0.0';
const STATIC_CACHE = 'viraliza-static-v1';
const DYNAMIC_CACHE = 'viraliza-dynamic-v1';

// Arquivos para cache offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// URLs da API que devem ser cacheadas
const API_CACHE_PATTERNS = [
  /\/api\/affiliates\/me/,
  /\/api\/payments\/history/
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error caching static assets:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para outros domínios (exceto APIs)
  if (url.origin !== location.origin && !url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Se encontrou no cache, retorna
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }

        // Senão, busca na rede
        return fetch(request)
          .then((networkResponse) => {
            // Só cacheia respostas válidas
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clona a resposta para o cache
            const responseToCache = networkResponse.clone();

            // Determina qual cache usar
            let cacheName = DYNAMIC_CACHE;
            
            // APIs específicas vão para cache dinâmico
            if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
              cacheName = DYNAMIC_CACHE;
            }

            // Adiciona ao cache
            caches.open(cacheName)
              .then((cache) => {
                console.log('[SW] Caching new resource:', request.url);
                cache.put(request, responseToCache);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.log('[SW] Network request failed:', request.url, error);
            
            // Para navegação, retorna página offline
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // Para outros recursos, retorna erro
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'affiliate-data-sync') {
    event.waitUntil(syncAffiliateData());
  }
});

// Notificações push
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalhes',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Viraliza.ai', options)
  );
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Função auxiliar para sincronizar dados de afiliados
async function syncAffiliateData() {
  try {
    console.log('[SW] Syncing affiliate data...');
    
    const response = await fetch('/api/affiliates/me');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/affiliates/me', response.clone());
      console.log('[SW] Affiliate data synced');
    }
  } catch (error) {
    console.error('[SW] Error syncing affiliate data:', error);
  }
}

// Limpeza periódica do cache
setInterval(() => {
  caches.open(DYNAMIC_CACHE)
    .then((cache) => {
      cache.keys()
        .then((requests) => {
          requests.forEach((request) => {
            const url = new URL(request.url);
            // Remove cache de APIs antigas (mais de 1 hora)
            if (url.pathname.startsWith('/api/')) {
              cache.delete(request);
            }
          });
        });
    });
}, 3600000); // 1 hora
