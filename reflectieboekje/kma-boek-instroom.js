/*
 * 4.30 (punten 66 en 67): instroom en geslacht in het profiel.
 *  - Instroom: burger (start in week 1) of doorstromer (al militair, start in week 8), plus de eigen startdatum.
 *    De app telt de opleidingsweek (1-35) en de eigen week vanaf die start.
 *  - Geslacht: vrijwillig en alleen voor het onderzoek. Gaat nooit naar het CadetVolgSysteem of in een export met naam.
 * Opslag: kma-x-instroom = { soort: 'burger'|'doorstromer', start: 'JJJJ-MM-DD'|'', geslacht: ''|'man'|'vrouw'|'anders' }.
 * Gegevens blijven (besluit 23-11): een bestaand profiel zonder deze gegevens krijgt alleen de standaard (burger, geen
 * startdatum); er wordt niets anders gewijzigd of gewist.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var K = 'kma-x-instroom', WEKEN = 35, START = { burger: 1, doorstromer: 8 };
  var GESLACHT = [['', 'Zeg ik liever niet'], ['man', 'Man'], ['vrouw', 'Vrouw'], ['anders', 'Anders']];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lees() {
    var v = null; try { v = JSON.parse(kmaStore.getItem(K) || 'null'); } catch (e) { v = null; }
    v = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    return {
      soort: v.soort === 'doorstromer' ? 'doorstromer' : 'burger',
      start: typeof v.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.start) ? v.start : '',
      geslacht: ['man', 'vrouw', 'anders'].indexOf(v.geslacht) >= 0 ? v.geslacht : ''
    };
  }
  function schrijf(v) { kmaStore.setItem(K, JSON.stringify(v)); }
  /** Migratie: alleen aanvullen, nooit overschrijven. */
  function migreer() { if (kmaStore.getItem(K) == null) schrijf(lees()); }
  function dag(d) { var x = d instanceof Date ? d : new Date(d); return Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()); }
  /** Aantal weken sinds de eigen start (1 = eerste week), of null zonder startdatum. */
  function eigenWeek(nu) {
    var v = lees(); if (!v.start) return null;
    var p = v.start.split('-'), s = Date.UTC(+p[0], +p[1] - 1, +p[2]);
    var n = Math.floor((dag(nu || new Date()) - s) / 864e5 / 7) + 1;
    return n < 1 ? 0 : n;
  }
  /** Opleidingsweek 1-35 (doorstromers beginnen in week 8), of null. */
  function opleidingsweek(nu) {
    var e = eigenWeek(nu); if (e == null || e < 1) return e;
    return Math.min(WEKEN, START[lees().soort] + e - 1);
  }
  function html() {
    var v = lees();
    var keuze = function (k, t, s) {
      return '<label class="kma-instroom-keuze' + (v.soort === k ? ' on' : '') + '"><input type="radio" name="kma-instroom" value="' + k + '"' + (v.soort === k ? ' checked' : '') + '>' +
        '<span><b>' + t + '</b><small>' + s + '</small></span></label>';
    };
    return '<section class="kma-instroom" id="kma-instroom">' +
      '<h3>Je opleiding</h3><p class="muted small">Wanneer begon je opleiding?</p>' +
      keuze('burger', 'Ik begin in week 1', 'Je start als burger aan de opleiding van 35 weken.') +
      keuze('doorstromer', 'Ik ben doorstromer (instroom week 8)', 'Je bent al militair. De app telt je weken en meetmomenten vanaf jouw start.') +
      '<label class="kma-instroom-veld"><span>Startdatum</span><input type="date" id="kma-instroom-start" value="' + esc(v.start) + '"><small class="muted">Je eerste dag op de KMA.</small></label>' +
      '<h3>Voor het onderzoek (vrijwillig)</h3>' +
      '<label class="kma-instroom-veld"><span>Geslacht</span><select id="kma-instroom-geslacht">' +
      GESLACHT.map(function (g) { return '<option value="' + g[0] + '"' + (v.geslacht === g[0] ? ' selected' : '') + '>' + g[1] + '</option>'; }).join('') + '</select>' +
      '<small class="muted">Alleen nodig als je meedoet aan het onderzoek. Gaat zonder naam mee en wordt alleen over alle cadetten samen bekeken, nooit per peloton. Je teamleider ziet dit niet.</small></label>' +
      '</section>';
  }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.closest || !t.closest('#kma-instroom')) return;
    var v = lees();
    if (t.name === 'kma-instroom') v.soort = t.value === 'doorstromer' ? 'doorstromer' : 'burger';
    else if (t.id === 'kma-instroom-start') v.start = /^\d{4}-\d{2}-\d{2}$/.test(t.value) ? t.value : '';
    else if (t.id === 'kma-instroom-geslacht') v.geslacht = ['man', 'vrouw', 'anders'].indexOf(t.value) >= 0 ? t.value : '';
    schrijf(v);
    document.querySelectorAll('.kma-instroom-keuze').forEach(function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
    if (window.kmaToast) kmaToast('Opgeslagen');
  });
  try { migreer(); } catch (e) { /* opslag nog niet klaar: bij de volgende start */ }
  window.kmaInstroom = { lees: lees, migreer: migreer, eigenWeek: eigenWeek, opleidingsweek: opleidingsweek, html: html, WEKEN: WEKEN, START: START };
})();
