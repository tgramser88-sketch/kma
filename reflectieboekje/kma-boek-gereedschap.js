/*
 * 4.30 (punt 18): de gereedschapskist. De vaste basis (00-10, de rode draad) staat altijd aan; deze modellen zet de cadet
 * zelf aan als het past, of omdat de teamleider er een aanraadt:
 *   woop  Wat houdt je tegen? (WOOP, Oettingen)          bij de SMART-leervraag
 *   gas   Doel in vijf niveaus (Goal Attainment Scaling)  bij de SMART-leervraag
 *   roos  Roos van Leary (hoofdstuk 17)                   in Werkboek stap 3
 *   aar   Nabespreking na een oefening (After Action Review) in + en ⋮/Meer
 * Opslag: kma-x-gereedschap = { v: 1, aan: { woop, gas, roos, aar } }.
 * Gegevens blijven (besluit 23-11): uitzetten verbergt alleen; wat de cadet al invulde blijft bewaard en komt terug bij
 * aanzetten. Bij de eerste start van 4.30 staat elk model dat de cadet al gebruikte vanzelf aan.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var K = 'kma-x-gereedschap';
  var MODELLEN = [
    { k: 'woop', t: 'Wat houdt je tegen? (WOOP)', h: 'Als je doel steeds blijft hangen' },
    { k: 'gas', t: 'Doel in vijf niveaus', h: 'Om je groei zichtbaar te maken' },
    { k: 'roos', t: 'Roos van Leary', h: 'Hoe je gedrag op anderen werkt' },
    { k: 'aar', t: 'Nabespreking', h: 'Na een oefening: vier vragen, wordt een DTF-feit' }
  ];
  var KEYS = MODELLEN.map(function (m) { return m.k; });
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getJ(k, d) { try { var v = JSON.parse(kmaStore.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function vol(o) { return !!o && typeof o === 'object' && Object.keys(o).some(function (k) { var v = o[k]; return typeof v === 'string' ? v.trim() !== '' : v && typeof v === 'object' ? vol(v) : false; }); }
  function dtf() { var s = getJ('kma-dtf-items', null); if (Array.isArray(s)) return s; try { return typeof dtfItems !== 'undefined' && Array.isArray(dtfItems) ? dtfItems : []; } catch (e) { return []; } }
  /** Wat de cadet al gebruikte: dat model staat vanzelf aan. */
  function gebruikt() {
    var g = getJ('kma-x-gas', {}) || {}, d = dtf();
    return {
      woop: vol(getJ('kma-x-woop', {})),
      gas: vol(g.n) || (Array.isArray(g.scores) && g.scores.length > 0),
      roos: d.some(function (x) { return x && x.leary; }) || ((getJ('kma-x-kameraden', {}) || {}).inbox || []).some(function (x) { return x && x.leary; }),
      aar: d.some(function (x) { return x && (x.aar || x.aspect === 'Nabespreking na een oefening'); })
    };
  }
  function lees() {
    var v = getJ(K, null);
    var aan = v && v.aan && typeof v.aan === 'object' ? v.aan : {};
    var o = {}; KEYS.forEach(function (k) { o[k] = aan[k] === true; });
    return { v: 1, aan: o };
  }
  /** Migratie: eenmalig; zet aan wat al gebruikt is. Overschrijft nooit een keuze van de cadet. */
  function migreer() {
    if (kmaStore.getItem(K) != null) return false;
    var u = gebruikt(), o = { v: 1, aan: {} };
    KEYS.forEach(function (k) { o.aan[k] = !!u[k]; });
    kmaStore.setItem(K, JSON.stringify(o));
    return true;
  }
  function aan(k) { return lees().aan[k] === true; }
  function zet(k, on) {
    if (KEYS.indexOf(k) < 0) return;
    var v = lees(); v.aan[k] = !!on; kmaStore.setItem(K, JSON.stringify(v));
    try { document.dispatchEvent(new CustomEvent('kma-gereedschap', { detail: { k: k, aan: !!on } })); } catch (e) { /* oude webview */ }
  }
  /** Aanraden van de teamleider (komt mee in de feedback uit het CVS: feedback.received[].aanraden = ['roos', ...]). */
  function aangeraden() {
    var fb = getJ('kma-x-feedback', { received: [] }) || {}, out = [];
    (fb.received || []).forEach(function (r) { (r && Array.isArray(r.aanraden) ? r.aanraden : []).forEach(function (k) { if (KEYS.indexOf(k) >= 0 && out.indexOf(k) < 0) out.push(k); }); });
    return out;
  }
  /** Voorstel op basis van wat er gebeurt: een als-dan-plan dat twee keer niet lukte → WOOP. */
  function voorstel() {
    try {
      if (!aan('woop') && window.kmaPlannen && kmaPlannen.list) {
        var vast = kmaPlannen.list().some(function (p) { var s = kmaPlannen.stats ? kmaPlannen.stats(p.id) : null; return s && s.stuck; });
        if (vast) return { k: 'woop', t: 'Je als-dan-plan lukte twee keer niet helemaal.' };
      }
    } catch (e) { /* geen voorstel */ }
    return null;
  }
  function naam(k) { var m = MODELLEN.filter(function (x) { return x.k === k; })[0]; return m ? m.t : k; }
  function html() {
    var v = lees(), r = aangeraden(), vs = voorstel();
    return '<div class="kma-gs" id="kma-gs">' +
      (vs ? '<p class="kma-gs-voorstel"><b>Voorstel:</b> ' + esc(naam(vs.k)) + '. ' + esc(vs.t) + '</p>' : '') +
      (r.length ? '<p class="kma-gs-tl"><b>Aangeraden door je teamleider:</b> ' + r.map(function (k) { return esc(naam(k)); }).join(', ') + '</p>' : '') +
      '<p class="muted small">De vaste basis (hoofdstuk 00 tot en met 10) staat altijd aan. Zet hier aan wat je erbij wilt gebruiken.</p>' +
      MODELLEN.map(function (m) {
        return '<label class="kma-gs-rij"><input type="checkbox" data-gs="' + m.k + '"' + (v.aan[m.k] ? ' checked' : '') + '><span><b>' + esc(m.t) + '</b><small>' + esc(m.h) + (r.indexOf(m.k) >= 0 ? ' · aangeraden' : '') + '</small></span></label>';
      }).join('') +
      '<p class="muted small">Uitzetten kan altijd; wat je al invulde blijft bewaard.</p></div>';
  }
  function open() {
    if (!window.kmaSheet) return;
    kmaSheet({ title: 'Gereedschapskist', html: html(), items: [] });
  }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t || !t.getAttribute || !t.hasAttribute('data-gs')) return;
    zet(t.getAttribute('data-gs'), t.checked);
    if (window.kmaToast) kmaToast(t.checked ? 'Aangezet' : 'Uitgezet; je gegevens blijven bewaard');
    if (typeof renderWidgets === 'function' && typeof currentStepIndex !== 'undefined') { var y = window.scrollY; try { renderWidgets(); } catch (er) { /* hoofdstuk zonder widget */ } window.scrollTo(0, y); }
    if (window.kmaDash && kmaDash.werkboek) try { kmaDash.werkboek(); } catch (er) { /* Klassiek */ }
  });
  try { migreer(); } catch (e) { /* opslag nog niet klaar */ }
  window.kmaGereedschap = { MODELLEN: MODELLEN, lees: lees, aan: aan, zet: zet, migreer: migreer, gebruikt: gebruikt, aangeraden: aangeraden, voorstel: voorstel, html: html, open: open, naam: naam };
})();
