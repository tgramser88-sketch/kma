/*
 * 4.30 (punten 7, 21, 28-30, 69): de SWOT met bewijs, eerlijker 360 en een hoofdboodschap bij de roos.
 *  - Bewijs per SWOT-punt: DTF-feiten die de cadet aan dat punt koppelde (swot-label met dezelfde eigenschap) en
 *    observatoren die dezelfde kant op wijzen. Uitkomst: bevestigd, niet bevestigd of nog te weinig gegevens.
 *  - Per eigenschap een korte bron uit het onderzoek (punt 69).
 *  - 360: de labels "blinde vlek" en "verborgen kracht" pas vanaf 3 observatoren; daarvoor is het verschil zelf de
 *    boodschap (punt 28, 30). Tip: kies minstens één observator buiten je vriendengroep (punt 29).
 *  - Roos: één zin over het grootste verschil tussen jouw beeld en dat van anderen (punt 30).
 * Alles wordt berekend uit gegevens die er al zijn; er wordt niets opgeslagen of gewijzigd.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var MIN_OBS = 3;
  var BRON = {
    H: 'Lee, Ashton en De Vries (2005): integriteit (H) voorspelt eerlijk en betrouwbaar gedrag op het werk.',
    E: 'Ashton en Lee (2007): emotionaliteit (E) hangt samen met hoe sterk je spanning en zorgen ervaart.',
    X: 'Judge en anderen (2002): extraversie hangt het sterkst samen met wie als leider naar voren komt.',
    A: 'Ashton en Lee (2007): verdraagzaamheid (A) gaat over geduld en vergeven als anderen je dwarszitten.',
    C: 'Barrick en Mount (1991): consciëntieusheid voorspelt prestaties in alle beroepen.',
    O: 'Barrick en Mount (1991): openheid hangt samen met hoe goed je leert in een opleiding.'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dtf() { try { return typeof dtfItems !== 'undefined' && Array.isArray(dtfItems) ? dtfItems : []; } catch (e) { return []; } }
  /** Bewijs voor een SWOT-punt (p uit KMAHex.analyse, q = 's'|'w'|'o'|'t'), met observatoren (KMAHex.observerScores). */
  function bewijs(p, q, oth) {
    var k = p.trait.key, kant = q === 's' || q === 'o' ? 's' : 'w';
    var feiten = dtf().filter(function (d) { return d && Array.isArray(d.swot) && d.swot.some(function (t) { return t && t.trait === k && t.k === kant; }); }).length;
    var obs = null;
    if (oth && oth.count && oth.avg[k] != null) {
      var zelfHoog = p.band === 'high', o = oth.avg[k];
      obs = { n: oth.count, eens: zelfHoog ? o > 65 : o < 35, anders: zelfHoog ? o < 50 : o > 50 };
    }
    var status = feiten >= 2 || (obs && obs.eens && obs.n >= 2) ? 'bevestigd' : obs && obs.anders ? 'niet' : 'weinig';
    return { feiten: feiten, obs: obs, status: status, bron: BRON[k] || '' };
  }
  function badges(b) {
    var out = [];
    if (b.feiten) out.push('<span class="kma-bw kma-bw-ok">' + (b.feiten >= 2 ? 'bevestigd: ' : '') + b.feiten + (b.feiten === 1 ? ' DTF-feit' : ' DTF-feiten') + '</span>');
    if (b.obs) out.push('<span class="kma-bw ' + (b.obs.eens ? 'kma-bw-ok' : b.obs.anders ? 'kma-bw-niet' : '') + '">' + (b.obs.eens ? b.obs.n + (b.obs.n === 1 ? ' observator ziet dit ook' : ' observatoren zien dit ook') : b.obs.anders ? 'observatoren zien het anders' : 'observatoren: geen duidelijk beeld') + '</span>');
    if (!out.length) out.push('<span class="kma-bw">nog te weinig gegevens</span>');
    return '<span class="kma-bw-rij">' + out.join('') + '</span>' + (b.bron ? '<span class="kma-bw-bron">Bron: ' + esc(b.bron) + '</span>' : '');
  }
  /** 360: hoofdboodschap en labels pas vanaf drie observatoren. */
  function verschilHtml(s, oth) {
    if (!oth || !oth.count || !window.KMAHex) return '';
    var H = KMAHex, best = /** @type {any} */ (null);
    H.TRAITS.forEach(function (t) { var a = s[t.key], o = oth.avg[t.key]; if (a == null || o == null) return; var d = o - a; if (!best || Math.abs(d) > Math.abs(best.d)) best = { t: t, d: d, a: a, o: o }; });
    var zin = best && Math.abs(best.d) >= 8 ? 'Anderen zagen je ' + (best.d > 0 ? 'hoger' : 'lager') + ' op ' + esc(best.t.name) + ' dan jijzelf (' + Math.round(best.o) + ' tegen ' + Math.round(best.a) + ').' : 'Anderen zien je ongeveer zoals jij jezelf ziet.';
    return '<div class="kma-card-block kma-360-kern" id="kma-360-kern"><h4>Wat anderen zagen</h4><p><b>' + zin + '</b></p>' +
      (oth.count < MIN_OBS ? '<p class="muted small">De labels "blinde vlek" en "verborgen kracht" verschijnen vanaf ' + MIN_OBS + ' observatoren. Nu: ' + oth.count + '.</p>' : '') +
      '<p class="muted small">Kies minstens één observator buiten je vriendengroep: dat geeft een eerlijker beeld.' + (voorgesteld().length ? ' Je teamleider stelde voor: ' + voorgesteld().map(esc).join(', ') + '.' : '') + '</p></div>';
  }
  /** Observatoren die de teamleider voorstelde (feedback.received[].observator, alleen namen als tekst). */
  function voorgesteld() {
    var out = [];
    try { var fb = JSON.parse(kmaStore.getItem('kma-x-feedback') || '{}') || {}; (fb.received || []).forEach(function (r) { if (r && typeof r.observator === 'string' && r.observator.trim() && out.indexOf(r.observator.trim()) < 0) out.push(r.observator.trim().slice(0, 60)); }); } catch (e) { /* geen feedback */ }
    return out;
  }
  function labelsAan(oth) { return !!(oth && oth.count >= MIN_OBS); }
  /** Roos: grootste verschil tussen zelf en anderen op een as, vanaf 3 momenten aan beide kanten. */
  function roosZin(zelf, anderen) {
    var L = window.KMALeary; if (!L) return '';
    var gem = function (list, as) { var v = (list || []).map(function (x) { var l = L.clean(x && x.leary !== undefined ? x.leary : x); return l ? l[as] : null; }).filter(function (x) { return x != null; }); return v.length ? { m: v.reduce(function (a, b) { return a + b; }, 0) / v.length, n: v.length } : null; };
    var zs = gem(zelf, 's'), as = gem(anderen, 's'), zb = gem(zelf, 'b'), ab = gem(anderen, 'b');
    if (!zs || !as || zs.n < 3 || as.n < 3) return '';
    var ds = zs.m - as.m, db = zb && ab ? zb.m - ab.m : 0, s = Math.abs(ds) >= Math.abs(db);
    var d = s ? ds : db; if (Math.abs(d) < 0.3) return '<p class="kma-roos-zin"><b>Jij en anderen zien je gedrag ongeveer hetzelfde.</b></p>';
    var kant = s ? (d > 0 ? 'samen' : 'tegen') : (d > 0 ? 'boven' : 'onder');
    return '<p class="kma-roos-zin"><b>Jij ziet jezelf vaker <i>' + kant + '</i> dan anderen je zien.</b><span class="muted small"> Op ' + zs.n + ' eigen DTF-feiten zie jij je gemiddeld ' + String(Math.abs(d).toFixed(1)).replace('.', ',') + ' verder naar "' + kant + '" dan ' + as.n + ' momenten van anderen. Vraag een maat om een voorbeeld.</span></p>';
  }
  window.kmaBewijs = { BRON: BRON, MIN_OBS: MIN_OBS, bewijs: bewijs, badges: badges, verschilHtml: verschilHtml, labelsAan: labelsAan, roosZin: roosZin, voorgesteld: voorgesteld };
})();
