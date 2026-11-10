/* KMA OpOrder Generator, web-app zonder wachtwoord. Versie: 34201f74fe1d
   Zorgt dat de app ook offline werkt. Bij een nieuwe versie wordt de cache vervangen.
   Ingevulde bevelen staan in de browseropslag (localStorage), niet in deze cache. */
const CACHE = 'kma-oporder-34201f74fe1d';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'kma-embleem.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable.png', 'apple-touch-icon.png',
  'fonts/fonts.css', 'fonts/DMSans-Variable.ttf', 'fonts/LibreFranklin-Variable.ttf'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('kma-oporder-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Eerst het netwerk (altijd de nieuwste versie), zonder verbinding uit de cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
});
