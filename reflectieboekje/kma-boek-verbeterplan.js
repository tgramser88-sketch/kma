/*
 * Reflectieboekje: verbeterplan van de cadet en meldingen uit het OER (4.18.0, blok Q1 en Q4).
 *  - Zet de teamleider bij een cadetfunctioneringsgesprek het verbetertraject aan (OER art. 3.7.3e), dan staat op
 *    Vandaag "Maak je verbeterplan (uiterlijk ...)": binnen 5 opleidingsdagen na het gesprek. Het plan staat in
 *    kma-x-verbeterplan { gesprek, wat, doel, acties, steun, meten, ingediend } en gaat mee met het dossier.
 *    Het akkoord van de teamleider komt terug met de feedback (verbeterAkkoord).
 *  - Heeft de teamleider afspraken met een collega gedeeld (OER art. 3.7.3c), dan krijgt de cadet daar één keer een
 *    melding van op Vandaag (kma-x-afspraken-melding = laatst geziene datum).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaStore) return;
  var O = function () { return window.kmaOER; };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function getX(k, d) { try { var v = kmaStore.getItem('kma-x-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function setX(k, v) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(v)); } catch (e) {} if (typeof triggerSavePulse === 'function') triggerSavePulse(); }
  function alle() { try { return window.kmaFeedback && kmaFeedback.all ? kmaFeedback.all() : []; } catch (e) { return []; } }
  /** Het nieuwste gesprek met een verbetertraject, of null. */
  function gesprek() {
    var best = null;
    alle().forEach(function (r) { (r && Array.isArray(r.gesprekken) ? r.gesprekken : []).forEach(function (g) { if (g && g.verbeter && g.datum && (!best || g.datum > best.datum)) best = g; }); });
    return best;
  }
  function akkoord(g) {
    var a = null;
    alle().forEach(function (r) { var x = r && r.verbeterAkkoord; if (x && x.gesprek === g.id && (!a || x.at > a.at)) a = x; });
    return a;
  }
  function plan() { var p = getX('verbeterplan', null); return p && typeof p === 'object' ? p : null; }
  function uiterlijk(g) { return O() ? O().plus(g.datum, 5) : ''; }
  function nl(s) { return O() ? O().nl(s) : s; }

  /* ---------------- Vandaag ---------------- */
  (window.kmaVandaagExtra = window.kmaVandaagExtra || []).push(function () {
    var out = [], g = gesprek(), p = plan();
    if (g) {
      var klaar = p && p.gesprek === g.id && p.ingediend, a = akkoord(g);
      if (!klaar) out.push({ ic: 'target', nieuw: true, t: 'Maak je verbeterplan', s: 'Uiterlijk ' + nl(uiterlijk(g)) + ' naar je teamleider (OER 3.7.3e)', b: 'Maken', go: open });
      else if (a && getX('verbeter-akkoord-gezien', '') !== a.at) out.push({ ic: 'check', t: 'Je teamleider is akkoord met je verbeterplan', s: 'De verbeterperiode duurt minstens tot ' + nl(O() ? O().plus(String(p.ingediend).slice(0, 10), 15) : ''), b: 'Bekijk', go: function () { setX('verbeter-akkoord-gezien', a.at); open(); } });
    }
    /** @type {any} */ var m = null;
    alle().forEach(function (r) { (r && Array.isArray(r.afsprakenGedeeld) ? r.afsprakenGedeeld : []).forEach(function (x) { if (x && x.at && (!m || x.at > m.at)) m = x; }); });
    if (m && getX('afspraken-melding', '') < m.at) out.push({ ic: 'users', t: 'Afspraken uit je gesprek gedeeld met een collega', s: 'Alleen de afspraken, niet wat jullie bespraken (OER 3.7.3c)', b: 'Gezien', go: function () { setX('afspraken-melding', m.at); } });
    return out;
  });

  /* ---------------- Het formulier ---------------- */
  var VELDEN = [
    ['wat', 'Wat moet er beter?', 'Wat bespraken jullie in het functioneringsgesprek? In je eigen woorden.'],
    ['doel', 'Mijn doel', 'Wat wil je aan het eind van de verbeterperiode laten zien?'],
    ['acties', 'Wat ga ik doen?', 'Concreet, met wanneer. Een als-dan-plan helpt: "Als ..., dan ...".'],
    ['steun', 'Wat heb ik nodig?', 'Van je teamleider, je groep of anderen.'],
    ['meten', 'Hoe zien we dat het lukt?', 'Bijv. DTF-feiten, feedback van medecadetten, een gesprek na twee weken.']
  ];
  var ov = null;
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open() {
    close();
    var g = gesprek(), p = plan() || {}, a = g ? akkoord(g) : null;
    var eigen = g && p.gesprek === g.id ? p : {};
    ov = document.createElement('div'); ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet kma-nb" role="dialog" aria-modal="true" aria-label="Verbeterplan" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<div class="kma-sheet-title">Mijn verbeterplan ' + (O() ? O().label('3.7.3e') : '') + '</div><div class="kma-code-body">' +
      (g ? '<p class="muted small">Na je functioneringsgesprek van ' + esc(nl(g.datum)) + '. Lever het uiterlijk ' + esc(nl(uiterlijk(g))) + ' in bij je teamleider; daarna volgt een verbeterperiode van minstens 15 opleidingsdagen.</p>' : '<p class="muted small">Je teamleider heeft geen verbetertraject gestart. Je kunt dit plan wel voor jezelf maken.</p>') +
      (eigen.ingediend ? '<p class="small"><b>Ingediend op ' + esc(nl(String(eigen.ingediend).slice(0, 10))) + '</b>' + (a ? ' · akkoord van je teamleider op ' + esc(nl(a.at.slice(0, 10))) : ' · nog geen akkoord') + '</p>' : '') +
      VELDEN.map(function (v) { return '<label class="kma-field"><span>' + v[1] + '</span><textarea id="vb-' + v[0] + '" rows="2" data-concept placeholder="' + esc(v[2]) + '">' + esc(eigen[v[0]] || '') + '</textarea></label>'; }).join('') +
      '<p class="kma-code-err" id="vb-err" role="alert"></p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-vb="x">Sluiten</button><button type="button" class="kma-icon-btn is-primary" data-vb="ok">' + (eigen.ingediend ? 'Bijwerken' : 'Indienen') + '</button></div></div></div>';
    ov.__kmaClose = close;
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var b = e.target.closest('[data-vb]'); if (!b) return;
      if (b.getAttribute('data-vb') !== 'ok') { close(); return; }
      var d = { gesprek: g ? g.id : '' };
      VELDEN.forEach(function (v) { d[v[0]] = String(ov.querySelector('#vb-' + v[0]).value || '').trim(); });
      if (!d.wat || !d.doel || !d.acties) { ov.querySelector('#vb-err').textContent = 'Vul minstens in wat er beter moet, je doel en wat je gaat doen.'; return; }
      d.ingediend = eigen.ingediend || new Date().toISOString();
      d.bijgewerkt = new Date().toISOString();
      setX('verbeterplan', d);
      close();
      if (window.kmaToast) kmaToast(window.kmaDeelStatus && kmaDeelStatus().on ? 'Verbeterplan opgeslagen. Het gaat via de deelmap naar je teamleider.' : 'Verbeterplan opgeslagen. Deel je dossier met je teamleider (Delen) zodat hij het krijgt.');
      if (window.kmaVandaag) kmaVandaag.render();
    });
  }
  window.kmaVerbeterplan = { open: open, close: close, actief: function () { return !!gesprek() || !!plan(); }, gesprek: gesprek };
})();
