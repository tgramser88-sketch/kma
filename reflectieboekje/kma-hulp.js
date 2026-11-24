/*
 * 4.30 (punten 15, 17): hulp en opslag, in het Reflectieboekje en het CadetVolgSysteem.
 *  - Foutenlogboek: de app onthoudt de laatste 50 fouten (melding, bestand en regel, versie, datum). Nooit antwoorden,
 *    namen of andere invoer: de melding wordt ingekort en ontdaan van alles wat op tekst van de gebruiker lijkt.
 *    "Stuur foutrapport mee" maakt een klein bestand dat de gebruiker zelf kan delen.
 *  - Opslag: hoeveel van de ruimte in gebruik is; vanaf 80% een waarschuwing (in het menu en bij het openen).
 * Opslag: kma-x-fouten = [{ t, m, b, r, v }].
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var K = 'kma-x-fouten', MAX = 50, LIMIET = 5 * 1024 * 1024;   // localStorage: in de praktijk ongeveer 5 MB per app
  function st() { return window.kmaStore || window.localStorage; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lijst() { try { var l = JSON.parse(st().getItem(K) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  /** Melding zonder inhoud van de gebruiker: tekst tussen aanhalingstekens en lange cijferreeksen gaan eruit. */
  function schoon(m) { return String(m || '').replace(/(["'`]).*?\1/g, '"…"').replace(/\d{5,}/g, '#').replace(/\s+/g, ' ').slice(0, 160); }
  function bestand(b) { var s = String(b || ''); var i = s.lastIndexOf('/'); return (i >= 0 ? s.slice(i + 1) : s).replace(/[?#].*$/, '').slice(0, 60); }
  function bewaar(m, b, r) {
    try {
      var l = lijst(); l.push({ t: new Date().toISOString().slice(0, 16), m: schoon(m), b: bestand(b), r: Number(r) || 0, v: String(window.KMA_APPVERSIE || '') });
      if (l.length > MAX) l = l.slice(-MAX);
      st().setItem(K, JSON.stringify(l));
    } catch (e) { /* opslag vol: niets doen */ }
  }
  window.addEventListener('error', function (e) { bewaar(e.message, e.filename, e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { var r = e && e.reason; bewaar(r && r.message ? r.message : String(r), r && r.fileName, 0); });
  /** Grootte van alle opgeslagen gegevens van deze app, in bytes (sleutel + waarde, UTF-16). */
  function gebruikt() {
    var n = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i) || '', v = localStorage.getItem(k) || ''; n += (k.length + v.length) * 2; } } catch (e) { n = 0; }
    return n;
  }
  function procent() { return Math.min(100, Math.round(gebruikt() / LIMIET * 100)); }
  function rapport() {
    return JSON.stringify({ type: 'kma-foutrapport', app: document.body.classList.contains('kma-volg') ? 'cvs' : 'boekje', versie: String(window.KMA_APPVERSIE || ''), opslag: procent(),
      scherm: (window.innerWidth || 0) + 'x' + (window.innerHeight || 0), fouten: lijst() }, null, 1);
  }
  function stuur() {
    // Liefst via Probleem melden: daar staan de laatste fouten al in, en de gebruiker kan stappen toevoegen
    if (window.kmaMelden && kmaMelden.open) { if (window.kmaCloseSheet) kmaCloseSheet(); kmaMelden.open(); return; }
    var tekst = rapport(), naam = 'kma-foutrapport-' + new Date().toISOString().slice(0, 10) + '.json';
    if (window.Android && window.Android.saveJsonFile) { window.Android.saveJsonFile(naam, tekst); return; }
    try { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([tekst], { type: 'application/json' })); a.download = naam; document.body.appendChild(a); a.click(); a.remove(); } catch (e) { /* geen download */ }
  }
  function html() {
    var p = procent(), n = lijst().length;
    return '<div class="kma-hulp" id="kma-hulp">' +
      '<h4>Iets ging mis?</h4><p class="small">' + (n ? 'De app hield ' + n + (n === 1 ? ' fout' : ' fouten') + ' bij, zonder je antwoorden of namen.' : 'De app hield geen fouten bij.') + '</p>' +
      (n ? '<button type="button" class="kma-icon-btn" data-hulp="stuur">Stuur foutrapport mee</button>' : '') +
      '<h4>Opslag</h4><div class="kma-hulp-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + p + '" aria-label="Opslag in gebruik"><i style="width:' + p + '%"' + (p >= 80 ? ' class="vol"' : '') + '></i></div>' +
      '<p class="muted small">' + p + '% gebruikt. ' + (p >= 80 ? '<b>Bijna vol:</b> maak een back-up en verwijder oude foto\'s of bijlagen.' : 'Vanaf 80% waarschuwt de app.') + '</p></div>';
  }
  function open() { if (window.kmaSheet) kmaSheet({ title: 'Hulp en opslag', html: html(), items: [] }); }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-hulp="stuur"]'); if (b) stuur(); });
  // Bij het openen: één keer per dag een melding als de opslag bijna vol is
  setTimeout(function () {
    try {
      var p = procent(), d = new Date().toISOString().slice(0, 10);
      if (p >= 80 && st().getItem('kma-x-opslag-melding') !== d && window.kmaToast) { st().setItem('kma-x-opslag-melding', d); kmaToast('Je opslag is ' + p + '% vol. Maak een back-up (menu → Hulp en opslag).', 'error'); }
    } catch (e) { /* geen melding */ }
  }, 2500);
  // 4.30 (punt 56): op de website eerlijk zeggen wat de pincode wel en niet doet
  var pinUitleg = function () { if (window.kmaPin && kmaPin.web) document.querySelectorAll('.kma-pin-web').forEach(function (p) { /** @type {HTMLElement} */ (p).style.display = 'block'; }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pinUitleg); else pinUitleg();
  window.kmaHulp = { lijst: lijst, bewaar: bewaar, schoon: schoon, gebruikt: gebruikt, procent: procent, rapport: rapport, stuur: stuur, html: html, open: open, LIMIET: LIMIET };
})();
