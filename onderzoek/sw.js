/* KMA web-app met wachtwoord. Versie: 3a5e4e19656d
   De app-bestanden staan versleuteld op de server (*.enc). Deze service worker ontsleutelt ze op het toestel
   met de sleutel die bij het inloggen is afgeleid van het wachtwoord. Zonder sleutel: naar login.html. */
const APP = 'onderzoek', CACHE = 'kma-' + APP + '-3a5e4e19656d', START = 'onderzoek.html';
const ENC = new Set(["fonts/DejaVuSans-Bold.ttf","fonts/DejaVuSans.ttf","fonts/LICENSE-DejaVu.txt","fonts/fonts.css","kma-bridge.js","kma-embleem.svg","kma-oanalyse.js","kma-odata.js","kma-oexport.js","kma-ografiek.js","kma-onderzoek-core.js","kma-oui.js","kma-stats.js","kma-versie.js","kma-web-veilig.js","kma-web.js","onderzoek.html","qrcode.min.js"]);
const PLAIN = ["login.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable.png","apple-touch-icon.png"];
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css; charset=utf-8', svg: 'image/svg+xml', json: 'application/json',
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', mp4: 'video/mp4', pdf: 'application/pdf', ttf: 'font/ttf', woff2: 'font/woff2', txt: 'text/plain; charset=utf-8' };
const BASE = new URL('./', self.location).pathname;
function idb() { return new Promise((ok, bad) => { const r = indexedDB.open('kma-gate', 1); r.onupgradeneeded = () => r.result.createObjectStore('k'); r.onsuccess = () => ok(r.result); r.onerror = () => bad(r.error); }); }
function getKey() { return idb().then(db => new Promise(ok => { const q = db.transaction('k').objectStore('k').get(APP); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); })).catch(() => null); }
function dropKey() { return idb().then(db => new Promise(ok => { const tx = db.transaction('k', 'readwrite'); tx.objectStore('k').delete(APP); tx.oncomplete = ok; tx.onerror = ok; })).catch(() => {}); }
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PLAIN.concat([...ENC].map(f => f + '.enc')))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kma-' + APP + '-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
function fromCache(url) {
  return caches.open(CACHE).then(c => c.match(url).then(hit => {
    const net = fetch(url).then(r => { if (r && r.ok) c.put(url, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
}
function toLogin() { return Response.redirect(BASE + 'login.html', 302); }
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(BASE)) return;
  let rel = decodeURIComponent(u.pathname.slice(BASE.length)) || START.replace(/^\.\//, '');
  if (rel === '' ) rel = 'index.html';
  if (!ENC.has(rel)) {
    if (PLAIN.indexOf(rel) >= 0) e.respondWith(fromCache(BASE + rel));
    return;
  }
  e.respondWith(getKey().then(key => {
    if (!key) return toLogin();
    return fromCache(BASE + rel + '.enc').then(r => {
      if (!r || !r.ok) return new Response('Niet gevonden', { status: 404 });
      return r.arrayBuffer().then(buf => crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(buf, 0, 12) }, key, new Uint8Array(buf, 12)))
        .then(plain => new Response(plain, { headers: { 'Content-Type': TYPES[(rel.split('.').pop() || '').toLowerCase()] || 'application/octet-stream' } }))
        .catch(() => dropKey().then(toLogin));   // other password since the last login: log in again
    });
  }));
});
