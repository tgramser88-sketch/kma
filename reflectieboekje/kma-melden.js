/*
 * Probleem melden (4.15.0, blok K7). Eén vast formaat voor een foutmelding, in beide apps (menu ⋮ → Hulp).
 * Vult zelf de app, de versie en het toestel in; de gebruiker beschrijft de stappen, wat hij verwachtte en wat er gebeurde.
 * Delen of kopiëren; een schermafbeelding voegt de gebruiker zelf toe in het bericht.
 * Bevat bewust geen dossiergegevens, namen of antwoorden.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var ov = null;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, t) { if (window.kmaToast) kmaToast(m, t); }
  function appNaam() { return /volgsysteem/i.test(location.pathname) || document.getElementById('cvs-pin-lock-screen') ? 'CadetVolgSysteem' : 'Reflectieboekje'; }
  function platform() { var c = window.Capacitor; try { if (c && c.getPlatform) return c.getPlatform(); } catch (e) {} return 'web'; }
  function info() {
    return { app: appNaam(), versie: window.KMA_APPVERSIE || 'onbekend', platform: platform(), toestel: navigator.userAgent, scherm: window.innerWidth + 'x' + window.innerHeight };
  }
  /** Het vaste formaat (ook beschreven in ONTWIKKELAARSGIDS.md). */
  function tekst(v) {
    var i = info();
    return ['PROBLEEMMELDING KMA-apps',
      'App: ' + i.app + ' ' + i.versie + ' (' + i.platform + ')',
      'Toestel: ' + i.toestel,
      'Scherm: ' + i.scherm,
      'Datum: ' + new Date().toISOString().slice(0, 16).replace('T', ' '),
      '', 'Stappen:', (v.stappen || '-').trim(),
      '', 'Verwacht:', (v.verwacht || '-').trim(),
      '', 'Gebeurd:', (v.gebeurd || '-').trim(),
      '', 'Schermafbeelding: ' + (v.foto ? 'ja, bijgevoegd' : 'nee')].join('\n');
  }
  function close() { if (ov) { ov.remove(); ov = null; } }
  function lees() { var g = function (id) { var e = ov && ov.querySelector('#' + id); return e ? (e.type === 'checkbox' ? e.checked : e.value) : ''; }; return { stappen: g('pm-stappen'), verwacht: g('pm-verwacht'), gebeurd: g('pm-gebeurd'), foto: g('pm-foto') }; }
  function deel(t) {
    try { if (window.KMA_CAP && window.KMA_CAP.shareText) { window.KMA_CAP.shareText(t); return; } } catch (e) {}
    if (navigator.share) { navigator.share({ title: 'Probleemmelding KMA-apps', text: t }).catch(function () {}); return; }
    kopieer(t);
  }
  function kopieer(t) {
    try { navigator.clipboard.writeText(t).then(function () { toast('Melding gekopieerd: plak hem in een mail of chat aan de beheerder'); }, function () { toast('Kopiëren lukte niet', 'error'); }); } catch (e) { toast('Kopiëren lukte niet', 'error'); }
  }
  function open() {
    close(); var i = info();
    ov = document.createElement('div'); ov.className = 'kma-sheet-overlay in';
    var veld = function (id, label, ph) { return '<label class="kma-field"><span>' + label + '</span><textarea id="' + id + '" rows="3" placeholder="' + esc(ph) + '"></textarea></label>'; };
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet kma-pm" role="dialog" aria-modal="true" aria-label="Probleem melden" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<div class="kma-sheet-title">Probleem melden</div><div class="kma-code-body">' +
      '<p class="muted small">' + esc(i.app + ' ' + i.versie + ' · ' + i.platform + ' · ' + i.scherm) + '. Zet geen namen of dossiergegevens in de melding.</p>' +
      veld('pm-stappen', 'Wat deed je? (stap voor stap)', '1. Menu ⋮ geopend  2. …') +
      veld('pm-verwacht', 'Wat verwachtte je?', '') +
      veld('pm-gebeurd', 'Wat gebeurde er?', 'Bijvoorbeeld een foutmelding of een leeg scherm') +
      '<label class="kma-check"><input type="checkbox" id="pm-foto"> Ik voeg een schermafbeelding toe</label>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-pm="kopieer">Kopiëren</button><button type="button" class="kma-icon-btn is-primary" data-pm="deel">Delen</button></div></div></div>';
    ov.__kmaClose = close;
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var a = e.target.closest('[data-pm]'); if (!a) return;
      var v = lees(); if (!String(v.gebeurd).trim()) { toast('Beschrijf kort wat er gebeurde', 'error'); return; }
      var t = tekst(v);
      if (a.getAttribute('data-pm') === 'deel') deel(t); else kopieer(t);
    });
  }
  window.kmaMelden = { open: open, close: close, tekst: tekst, info: info };
})();
