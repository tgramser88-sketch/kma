/*
 * 4.30 (punten 2-6, 24, 27, 53, 70, 74, 77): de persoonlijkheidstest als meting.
 *  - Kort (96 stellingen) of lang (240 = de 96 plus 144 aanvullende); de keuze zit in de vaste basis.
 *  - Percentiel en klokcurve uit een echte normgroep: IPIP-HEXACO, openpsychometrics.org (n = 20.365, internationaal,
 *    online, vrijwillig; via het R-pakket IPV). Schaal 1-7 omgerekend naar 0-100. Zodra de KMA zelf n >= 30 heeft,
 *    kan de Onderzoeksapp een KMA-norm leveren (punt 73).
 *  - Vijf banden op percentiel en een grensgeval als de score minder dan één meetfout (SEM) van een bandgrens ligt.
 *  - Metingen (begin, midden, eind) vanaf de eigen start (burger week 1, doorstromer week 8) met een groeilijn en
 *    reliable change (Jacobson & Truax, 1991): alleen een verschil groter dan de meetfout heet een echte verandering.
 *  - Standaard privé (punt 74): wie al eerder deelde, houdt zijn instelling (migratie).
 * Opslag: kma-x-hex-metingen = [{ id, datum, set: 'kort'|'lang', d: {H..O}, ans?, extra? }]. De laatste is de huidige.
 * Gegevens blijven (besluit 23-11): een nieuwe meting bewaart alle antwoorden van de vorige in de lijst.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var K = 'kma-x-hex-metingen';
  var TR = ['H', 'E', 'X', 'A', 'C', 'O'];
  var NORM = { H: [57.3, 13.5], E: [57.0, 14.7], X: [47.1, 16.8], A: [50.2, 15.3], C: [51.7, 13.4], O: [70.8, 10.8] };
  var NORM_BRON = 'IPIP-HEXACO, openpsychometrics.org (n = 20.365, internationaal, online afgenomen)';
  // Betrouwbaarheid (Cronbach's alfa) per domein: ongeveer .80 voor de korte versie (16 stellingen) en .90 voor de lange (40).
  var ALFA = { kort: 0.80, lang: 0.90 };
  /** @type {Array<[number, string]>} */
  var BANDEN = [[10, 'Zeer laag'], [30, 'Laag'], [70, 'Gemiddeld'], [90, 'Hoog'], [101, 'Zeer hoog']];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getJ(k, d) { try { var v = JSON.parse(kmaStore.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  /* ---------- Statistiek ---------- */
  function phi(z) { // standaardnormale verdelingsfunctie (Abramowitz & Stegun 26.2.17)
    var t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2);
    var p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - p : p;
  }
  function percentiel(k, v) { if (v == null || !NORM[k]) return null; var p = Math.round(phi((v - NORM[k][0]) / NORM[k][1]) * 100); return Math.max(1, Math.min(99, p)); }
  function band(p) { for (var i = 0; i < BANDEN.length; i++) if (p < BANDEN[i][0]) return BANDEN[i][1]; return BANDEN[BANDEN.length - 1][1]; }
  function sem(k, set) { return NORM[k][1] * Math.sqrt(1 - (ALFA[set] || ALFA.kort)); }
  /** Grensgeval: binnen één meetfout (68%) van de score ligt een andere band. */
  function grens(k, v, set) {
    if (v == null) return null;
    var e = sem(k, set), lo = percentiel(k, Math.max(0, v - e)), hi = percentiel(k, Math.min(100, v + e));
    return band(lo) !== band(hi) ? { lo: lo, hi: hi, van: band(lo), tot: band(hi) } : null;
  }
  /** Reliable change tussen twee metingen: z > 1,645 (90%) = echte verandering. */
  function verandering(k, a, b) {
    if (!a || !b || a.d[k] == null || b.d[k] == null) return null;
    var diff = b.d[k] - a.d[k], se = Math.sqrt(Math.pow(sem(k, a.set), 2) + Math.pow(sem(k, b.set), 2)), z = diff / se;
    return { diff: Math.round(diff), z: z, echt: Math.abs(z) > 1.645, richting: diff > 0 ? 'hoger' : 'lager' };
  }
  /* ---------- Metingen ---------- */
  function lijst() { if (kmaStore.getItem(K) == null) migreer(); var l = getJ(K, []); return Array.isArray(l) ? l.filter(function (m) { return m && m.d && typeof m.d === 'object'; }) : []; }
  function bewaar(l) { kmaStore.setItem(K, JSON.stringify(l)); }
  /** Scores van nu, rechtstreeks uit de opslag (werkt ook vóór het boekje zijn variabelen geladen heeft). */
  function huidigeScores() {
    var qs = typeof hexacoQuestionsSelf !== 'undefined' ? hexacoQuestionsSelf : null;
    if (!window.KMAHex || !qs) return null;
    var ans = getJ('kma-pers-self-ans', {}) || {};
    var s = KMAHex.plain(KMAHex.score(ans, qs));
    if (!TR.every(function (t) { return s[t] != null; })) return null;
    var X = window.kmaHex240, ex = getJ('kma-x-hex240', {}) || {};
    if (X && X.ITEMS && X.ITEMS.every(function (q) { var v = Number(ex[q.id]); return v >= 1 && v <= 5; })) {
      var all = {}, k; for (k in ans) all[k] = ans[k]; for (k in ex) all[k] = ex[k];
      var d = KMAHex.plain(KMAHex.score(all, qs.concat(X.ITEMS)));
      if (TR.every(function (t) { return d[t] != null; })) return { set: 'lang', d: d };
    }
    return { set: 'kort', d: s };
  }
  function datumVan() { var tj = getJ('kma-x-hex-tijd', null); if (tj && tj.last) { var d = new Date(tj.last); if (!isNaN(+d)) return d.toISOString().slice(0, 10); } return today(); }
  /** Werkt de huidige (laatste) meting bij met de antwoorden van nu; maakt de eerste aan als die er nog niet is. */
  function vastleggen() {
    var h = huidigeScores(); if (!h) return null;
    var l = lijst(), cur = l[l.length - 1];
    if (!cur || cur.af) { cur = { id: Date.now(), datum: datumVan(), set: h.set, d: h.d }; l.push(cur); }
    else { cur.set = h.set; cur.d = h.d; cur.datum = cur.datum || datumVan(); }
    bewaar(l); return cur;
  }
  /** Migratie: bestaande antwoorden tellen als eerste meting (kort, of lang als de 144 ook klaar zijn). */
  function migreer() {
    if (kmaStore.getItem(K) != null) return false;
    var h = huidigeScores(); bewaar(h ? [{ id: 1, datum: datumVan(), set: h.set, d: h.d }] : []);
    // Punt 74: standaard privé. Wie al eens deelde en nooit een keuze maakte, blijft delen zoals hij gewend was.
    try {
      var share = getJ('kma-x-share', {}) || {}, t = titel();
      if (t && !(t in share) && kmaStore.getItem('kma-x-last-shared') != null) { share[t] = true; kmaStore.setItem('kma-x-share', JSON.stringify(share)); }
    } catch (e) { /* geen hoofdstukken */ }
    return true;
  }
  /** Nieuwe meting: de huidige gaat met al zijn antwoorden de lijst in, daarna begint de test opnieuw. */
  function nieuw(set) {
    vastleggen();
    var l = lijst(), cur = l[l.length - 1];
    if (cur) { cur.af = true; cur.ans = JSON.parse(JSON.stringify(hexacoSelfAnswers)); if (window.kmaHex240) cur.extra = kmaHex240.antwoorden(); }
    bewaar(l);
    Object.keys(hexacoSelfAnswers).forEach(function (k) { delete hexacoSelfAnswers[k]; });
    try { kmaStore.setItem('kma-pers-self-ans', JSON.stringify(hexacoSelfAnswers)); var DB = /** @type {any} */ (window).dbSet; if (typeof DB === 'function') DB('kma-pers-self-ans', hexacoSelfAnswers); } catch (e) { /* opslag */ }
    if (window.kmaHex240 && kmaHex240.wis) kmaHex240.wis();
    kmaStore.setItem('kma-x-hex-keuze', set === 'lang' ? 'lang' : 'kort');
  }
  function keuze() { return kmaStore.getItem('kma-x-hex-keuze') === 'lang' ? 'lang' : 'kort'; }
  function titel() { try { var i = steps.findIndex(function (s) { return s.widget === 'hexaco'; }); return i >= 0 ? steps[i].title : ''; } catch (e) { return ''; } }
  /* ---------- Meetmomenten vanaf de eigen start ---------- */
  /** @type {Array<[string, number, number]>} */
  var MOMENTEN = [['Begin', 1, 3], ['Midden', 0, 21], ['Eind', 0, 33]];
  function momenten() {
    var I = window.kmaInstroom, ow = I ? I.opleidingsweek() : null, ew = I ? I.eigenWeek() : null, start = I ? I.START[I.lees().soort] : 1, l = lijst();
    return MOMENTEN.map(function (m, i) {
      var wk = i === 0 ? start + m[1] - 1 : m[2], tot = i === 0 ? start + m[2] - 1 : m[2] + 2;
      var gedaan = l[i] ? l[i] : null, nu = ow != null && ow >= wk && ow <= tot;
      return { naam: m[0], van: wk, tot: tot, gedaan: gedaan, nu: nu, over: ow != null && ow < wk ? wk - ow : null, eigenWeek: ew };
    });
  }
  /* ---------- Weergave ---------- */
  function curve(k, v, set) {
    var W = 280, H = 70, M = NORM[k][0], S = NORM[k][1], pts = [], x, y;
    for (var i = 0; i <= 56; i++) { x = i * 100 / 56; y = Math.exp(-Math.pow((x - M) / S, 2) / 2); pts.push([x / 100 * W, H - 6 - y * (H - 16)]); }
    var pad = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    var tot = pts.filter(function (p) { return p[0] <= v / 100 * W; });
    var vul = tot.length > 1 ? 'M0 ' + (H - 6) + ' L' + tot.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + ' L' + tot[tot.length - 1][0].toFixed(1) + ' ' + (H - 6) + ' Z' : '';
    var vx = (v / 100 * W).toFixed(1), e = 1.645 * sem(k, set), l = Math.max(0, v - e) / 100 * W, r = Math.min(100, v + e) / 100 * W;
    return '<svg class="kma-curve" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Klokcurve van de normgroep met jouw score">' +
      '<rect x="' + l.toFixed(1) + '" y="4" width="' + (r - l).toFixed(1) + '" height="' + (H - 10) + '" class="kma-curve-ci"/>' +
      (vul ? '<path d="' + vul + '" class="kma-curve-vul"/>' : '') + '<path d="' + pad + '" class="kma-curve-lijn"/>' +
      '<line x1="0" x2="' + W + '" y1="' + (H - 6) + '" y2="' + (H - 6) + '" class="kma-curve-as"/><line x1="' + vx + '" x2="' + vx + '" y1="4" y2="' + (H - 6) + '" class="kma-curve-jij"/></svg>';
  }
  function normHtml() {
    var l = lijst(), cur = l[l.length - 1]; if (!cur) return '';
    var rows = TR.map(function (k) {
      var t = KMAHex.BY_KEY[k], v = Math.round(cur.d[k]), p = percentiel(k, v), g = grens(k, v, cur.set);
      return '<div class="kma-norm-rij"><div class="kma-norm-kop"><b>' + esc(t.name) + '</b><span>' + band(p) + (g ? ' <em class="kma-grens">grensgeval</em>' : '') + '</span></div>' + curve(k, v, cur.set) +
        '<p class="muted small">Je scoort hoger dan ' + p + ' van de 100 mensen in de normgroep.' + (g ? ' Door de meetfout kan dit ook ' + esc((g.van === band(p) ? g.tot : g.van).toLowerCase()) + ' zijn.' : '') + '</p></div>';
    }).join('');
    return '<div class="kma-card-block kma-norm" id="kma-norm"><h4>' + icon('chart') + 'Waar sta je ten opzichte van anderen?</h4>' +
      '<p class="muted small">De curve is de verdeling in de normgroep; het gekleurde deel zijn de mensen die lager scoren. De lichte band is de meetfout' + (cur.set === 'lang' ? ' (klein: lange test)' : ' (de lange test maakt hem kleiner)') + '.</p>' + rows +
      '<p class="muted small">Normgroep: ' + esc(NORM_BRON) + '. Geen cadetten; zodra er genoeg KMA-gegevens zijn, komt er een KMA-norm. Je uitslag is geen beoordeling.</p></div>';
  }
  function icon(n) { return window.kmaIcon ? kmaIcon(n) : ''; }
  function groeiHtml() {
    var l = lijst();
    var mm = momenten().map(function (m) {
      return '<div class="kma-mm-rij"><span>' + m.naam + ' · week ' + m.van + (m.tot !== m.van ? '–' + m.tot : '') + '</span>' +
        (m.gedaan ? '<b>gedaan (' + m.gedaan.set + ')</b>' : m.nu ? '<b class="kma-mm-nu">nu</b>' : m.over != null ? '<span class="muted">over ' + m.over + (m.over === 1 ? ' week' : ' weken') + '</span>' : '<span class="muted">nog niet</span>') + '</div>';
    }).join('');
    var zonderStart = window.kmaInstroom && !kmaInstroom.lees().start ? '<p class="muted small">Vul je startdatum in bij je profiel (hoofdstuk 00), dan rekent de app je meetmomenten vanaf jouw start.</p>' : '';
    var lijn = '';
    if (l.length >= 2) {
      var a = l[l.length - 2], b = l[l.length - 1];
      lijn = '<div class="kma-groei-lijst">' + TR.map(function (k) {
        var r = verandering(k, a, b), t = KMAHex.BY_KEY[k];
        return '<div class="kma-groei-rij"><span>' + esc(t.name) + '</span><span>' + Math.round(a.d[k]) + ' → ' + Math.round(b.d[k]) + '</span><span class="' + (r && r.echt ? 'kma-echt' : 'muted') + '">' + (r ? (r.echt ? 'echt ' + r.richting : 'binnen de meetfout') : '') + '</span></div>';
      }).join('') + '</div><p class="muted small">Alleen een verschil groter dan de meetfout heet een echte verandering (reliable change). ' + (a.set === 'lang' && b.set === 'lang' ? 'Twee lange tests: de lijn is zo betrouwbaar mogelijk.' : 'Met de lange test is de lijn betrouwbaarder.') + '</p>';
    }
    return '<div class="kma-card-block kma-metingen" id="kma-metingen"><h4>' + icon('trend') + 'Metingen</h4>' + mm + zonderStart + lijn +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-meting="nieuw-kort">Nieuwe meting: kort</button><button type="button" class="kma-icon-btn" data-meting="nieuw-lang">Nieuwe meting: lang</button></div>' +
      '<p class="muted small">Bij een nieuwe meting blijven je vorige antwoorden bewaard.</p></div>';
  }
  function keuzeHtml() {
    var k = keuze(), c = function (w, t, s) { return '<label class="kma-instroom-keuze' + (k === w ? ' on' : '') + '"><input type="radio" name="kma-hex-keuze" value="' + w + '"' + (k === w ? ' checked' : '') + '><span><b>' + t + '</b><small>' + s + '</small></span></label>'; };
    return '<div class="kma-card-block kma-hex-keuze" id="kma-hex-keuze"><h4>' + icon('list') + 'Kies je test</h4>' +
      c('kort', 'Kort · 96 stellingen · ± 12 minuten', 'Je zes eigenschappen, je SWOT en je 4 V\'s. Goed om te herhalen.') +
      c('lang', 'Lang · 240 stellingen · ± 30-40 minuten', 'Hetzelfde, plus een kleinere meetfout en betrouwbare onderdelen. Mooi voor de eerste keer of het eind.') +
      '<p class="muted small">De korte test zit in de lange. Begin je kort, dan kun je later de 144 extra stellingen alsnog maken.</p>' +
      '<p class="kma-prive">' + icon('lock') + '<span><b>Je uitslag is privé.</b> Standaard deel je hem niet met je teamleider; jij kiest of en wanneer. Je uitslag telt nooit mee voor je beoordeling.</span></p></div>';
  }
  /** Knop voor de 144 extra stellingen als de korte klaar is en de lange gekozen of nog niet gemaakt. */
  function langHtml() {
    var X = window.kmaHex240; if (!X || X.klaar()) return '';
    var n = X.aantal();
    return '<div class="kma-card-block"><h4>' + icon('list') + 'Lange test: 144 extra stellingen</h4><p class="muted small">' + (n ? n + ' van 144 gedaan. ' : '') + 'Maakt de meetfout kleiner en je groeilijn betrouwbaarder. Je kunt pauzeren.</p>' +
      '<button type="button" class="kma-icon-btn' + (keuze() === 'lang' ? ' is-primary' : '') + '" data-meting="lang">' + (n ? 'Ga verder' : 'Start de 144 extra stellingen') + '</button></div>';
  }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || t.name !== 'kma-hex-keuze') return;
    kmaStore.setItem('kma-x-hex-keuze', t.value === 'lang' ? 'lang' : 'kort');
    document.querySelectorAll('#kma-hex-keuze .kma-instroom-keuze').forEach(function (l) { var i = l.querySelector('input'); l.classList.toggle('on', !!(i && i.checked)); });
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-meting]'); if (!b) return;
    var a = b.getAttribute('data-meting');
    if (a === 'lang' && window.kmaHex240) { kmaHex240.open(); return; }
    if (a === 'nieuw-kort' || a === 'nieuw-lang') {
      var doe = function () { nieuw(a === 'nieuw-lang' ? 'lang' : 'kort'); if (typeof renderWidgets === 'function') renderWidgets(); if (window.kmaHexaco) kmaHexaco.runSelf(0); };
      if (window.kmaConfirm) kmaConfirm('Nieuwe meting beginnen? Je vorige antwoorden blijven bewaard bij je metingen.', { ok: 'Beginnen' }).then(function (ja) { if (ja) doe(); }); else doe();
    }
  });
  // Punt 77: het meetmoment staat voor iedereen in Vandaag (niet alleen voor wie meedoet aan het onderzoek)
  (window.kmaVandaagExtra = window.kmaVandaagExtra || []).push(function () {
    var m = momenten().filter(function (x) { return x.nu && !x.gedaan; })[0]; if (!m) return [];
    return [{ ic: 'chart', t: 'Meetmoment ' + m.naam.toLowerCase(), s: 'Maak je persoonlijkheidstest vóór week ' + (m.tot + 1) + ' (kort of lang)', b: 'Naar de test', go: function () { var i = steps.findIndex(function (s) { return s.widget === 'hexaco'; }); if (i >= 0) goToStep(i); } }];
  });
  window.kmaMeting = { NORM: NORM, NORM_BRON: NORM_BRON, ALFA: ALFA, percentiel: percentiel, band: band, sem: sem, grens: grens, verandering: verandering,
    lijst: lijst, vastleggen: vastleggen, migreer: migreer, nieuw: nieuw, keuze: keuze, momenten: momenten, normHtml: normHtml, groeiHtml: groeiHtml, keuzeHtml: keuzeHtml, langHtml: langHtml, phi: phi };
})();
