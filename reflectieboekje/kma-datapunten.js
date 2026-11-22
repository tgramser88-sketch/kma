/*
 * Datapunten per V (4.17.0, blok M1: programmatisch toetsen, Van der Vleuten e.a.).
 * Elke observatie (DTF-feit, feedback van een medecadet, waarneming van staf) is een datapunt met lage inzet.
 * Een beoordeling steunt pas op genoeg datapunten uit meerdere bronnen; dit overzicht laat per V zien of dat zo is.
 * Gebruikt door het CadetVolgSysteem (dossier, onderbouwing voor de 2e beoordelaar) en het Reflectieboekje.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var VS = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'];
  var BRON = { zelf: 'Cadet zelf', medecadet: 'Medecadet', teamleider: 'Teamleider', instructeur: 'Instructeur' };
  var MIN_N = 5, MIN_BRON = 2;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function arr(x) { return Array.isArray(x) ? x : (x ? [x] : []); }
  /** Bron van een DTF-item zoals de apps het opslaan. */
  function bronVan(x) {
    if (!x) return 'zelf';
    if (x.bron === 'medecadet') return 'medecadet';
    var a = x.author || x.role || '';
    if (a && a !== 'cadet') return /instructeur/i.test(a) ? 'instructeur' : 'teamleider';
    if (!a && x.v4 !== undefined && !x.vValues) return 'teamleider';
    return 'zelf';
  }
  /** Maakt een datapunt van een DTF-item (boekje of CVS) of null als er geen V bij staat. */
  function vanDtf(x, bron) {
    if (!x || typeof x !== 'object') return null;
    var v = arr(x.vValues && x.vValues.length ? x.vValues : x.v4).filter(function (k) { return VS.indexOf(k) >= 0; });
    if (!v.length) return null;
    return { datum: /^\d{4}-\d{2}-\d{2}/.test(x.datum || '') ? String(x.datum).slice(0, 10) : '', bron: bron || bronVan(x), v: v, teken: x.teken === '+' || x.teken === '-' ? x.teken : '', feit: String(x.feit || '') };
  }
  /** Overzicht per V: aantal, bronnen, eerste en laatste datum, positief/negatief en een waarschuwing. */
  function perV(punten) {
    return VS.map(function (v) {
      var p = punten.filter(function (x) { return x && x.v.indexOf(v) >= 0; });
      var br = {}; p.forEach(function (x) { br[x.bron] = (br[x.bron] || 0) + 1; });
      var d = p.map(function (x) { return x.datum; }).filter(Boolean).sort();
      var nb = Object.keys(br).length, warn = [];
      if (p.length < MIN_N) warn.push('minder dan ' + MIN_N + ' datapunten');
      if (nb < MIN_BRON) warn.push(nb ? 'maar één bron' : 'geen bron');
      return { v: v, n: p.length, bronnen: br, nBron: nb, van: d[0] || '', tot: d[d.length - 1] || '',
        pos: p.filter(function (x) { return x.teken === '+'; }).length, neg: p.filter(function (x) { return x.teken === '-'; }).length,
        ok: !warn.length, warn: warn, punten: p };
    });
  }
  function fmt(iso) { return iso ? iso.split('-').reverse().join('-') : ''; }
  /** HTML-tabel. opt.zelf = true voor het boekje (andere woorden). */
  function html(rows, opt) {
    opt = opt || {};
    var body = rows.map(function (r) {
      var b = Object.keys(BRON).filter(function (k) { return r.bronnen[k]; }).map(function (k) { return BRON[k] + ' ' + r.bronnen[k]; }).join(', ');
      return '<tr class="' + (r.ok ? 'ok' : 'warn') + '"><th scope="row">' + esc(r.v) + '</th><td>' + r.n + '</td><td>' + esc(b || '-') + '</td>' +
        '<td>' + (r.van ? esc(fmt(r.van)) + (r.tot !== r.van ? ' t/m ' + esc(fmt(r.tot)) : '') : '-') + '</td><td>' + r.pos + ' / ' + r.neg + '</td>' +
        '<td><span>' + (r.ok ? 'Genoeg' : esc(r.warn.join(', '))) + '</span></td></tr>';
    }).join('');
    var nWarn = rows.filter(function (r) { return !r.ok; }).length;
    return '<div class="kma-dp" tabindex="0" role="region" aria-label="Datapunten per V"><table class="kma-dp-tab"><thead><tr><th>V</th><th>Aantal</th><th>Bronnen</th><th>Periode</th><th>+ / −</th><th>Basis</th></tr></thead><tbody>' + body + '</tbody></table>' +
      '<p class="muted small">' + (nWarn
        ? (opt.zelf ? 'Bij ' + nWarn + (nWarn === 1 ? ' V' : " V's") + ' is er nog weinig om je beoordeling op te baseren. Leg meer DTF-feiten vast of vraag feedback aan een medecadet.'
          : 'Let op: bij ' + nWarn + (nWarn === 1 ? ' V' : " V's") + ' is de basis smal. Een beoordeling steunt op minstens ' + MIN_N + ' datapunten uit minstens ' + MIN_BRON + ' bronnen.')
        : (opt.zelf ? 'Bij elke V is er genoeg om je beoordeling op te baseren.' : 'Bij elke V zijn er genoeg datapunten uit meerdere bronnen.')) + '</p></div>';
  }
  /** Platte tekst met alle datapunten per V: de onderbouwing (audit trail) voor de tweede beoordelaar. */
  function tekst(rows, naam) {
    var out = ['ONDERBOUWING BEOORDELING' + (naam ? ': ' + naam : ''), 'Gemaakt: ' + new Date().toISOString().slice(0, 10), ''];
    rows.forEach(function (r) {
      out.push(r.v.toUpperCase() + ' (' + r.n + ' datapunten, ' + r.nBron + (r.nBron === 1 ? ' bron' : ' bronnen') + (r.ok ? '' : '; let op: ' + r.warn.join(', ')) + ')');
      r.punten.slice().sort(function (a, b) { return a.datum.localeCompare(b.datum); }).forEach(function (x) {
        out.push('- ' + (fmt(x.datum) || 'zonder datum') + ' · ' + BRON[x.bron] + (x.teken ? ' · ' + (x.teken === '+' ? 'positief' : 'negatief') : '') + ': ' + x.feit.replace(/\s+/g, ' ').trim());
      });
      out.push('');
    });
    return out.join('\n');
  }
  window.KMADatapunten = { VS: VS, BRON: BRON, MIN_N: MIN_N, MIN_BRON: MIN_BRON, bronVan: bronVan, vanDtf: vanDtf, perV: perV, html: html, tekst: tekst };
})();
