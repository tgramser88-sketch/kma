/* Offline-cache voor de KMA web-app. Versie: 434f58aa1722 */
const CACHE = 'kma-reflectieboekje-434f58aa1722';
const FILES = ["./", "apple-touch-icon.png", "fonts/DejaVuSans-Bold.ttf", "fonts/DejaVuSans.ttf", "fonts/LICENSE-DejaVu.txt", "fonts/fonts.css", "html5-qrcode.min.js", "icon-192.png", "icon-512.png", "icon-maskable.png", "index.html", "kma-5gt.js", "kma-academie.jpg", "kma-boek-bewijs.js", "kma-boek-chapters.js", "kma-boek-dashboard.js", "kma-boek-feedback.js", "kma-boek-gereedschap.js", "kma-boek-gesprek.js", "kma-boek-herinneringen.js", "kma-boek-hex240.js", "kma-boek-hexaco.js", "kma-boek-instroom.js", "kma-boek-kameraden.js", "kma-boek-links.js", "kma-boek-meting.js", "kma-boek-nabespreking.js", "kma-boek-oefenen.js", "kma-boek-onderzoek.js", "kma-boek-opbouw.js", "kma-boek-plannen.js", "kma-boek-reactie.js", "kma-boek-reservekopie.js", "kma-boek-tabs.js", "kma-boek-vandaag.js", "kma-boek-verbeterplan.js", "kma-boek-voorbeelden.js", "kma-boek-weekcyclus.js", "kma-bridge.js", "kma-bronnen.js", "kma-chapters.css", "kma-datapunten.js", "kma-deelmap.js", "kma-demo.js", "kma-embleem.svg", "kma-eula.js", "kma-gegevens.js", "kma-gemak.js", "kma-handleiding-boek.js", "kma-hexaco-core.js", "kma-html.js", "kma-hulp.js", "kma-koppel.js", "kma-leary.js", "kma-leertaken.js", "kma-lijst.js", "kma-melden.js", "kma-oer.js", "kma-onderbouwing.js", "kma-onderzoek-core.js", "kma-opco.js", "kma-patterns.js", "kma-pss.js", "kma-snelstart.js", "kma-toetsplan.js", "kma-transfer.js", "kma-ui-boek.js", "kma-ui.css", "kma-ui.js", "kma-ux-boek.js", "kma-versie.js", "kma-viz.js", "kma-web-veilig.js", "kma-web.js", "kma-weergave.js", "manifest.webmanifest", "qrcode.min.js"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kma-reflectieboekje-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  // Cache first (works offline); refresh the cache in the background when online.
  e.respondWith(caches.open(CACHE).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});
