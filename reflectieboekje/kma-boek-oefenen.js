/*
 * 4.30 (punt 38): oefenen met feedback ontvangen. Drie korte casussen; de cadet kiest wat hij eerst doet en ziet waarom.
 * Onderbouwing: feedback ontvangen is een vaardigheid (Stone en Heen, 2014; Carless en Boud, 2018: feedback literacy):
 * eerst begrijpen, dan pas reageren, en daarna één volgende stap kiezen.
 * Punt 32: mijlpalen belonen het bijstellen van een plan na feedback, niet het aantal invoeringen.
 * Opslag: kma-x-oefenen = { klaar: [casus-ids] }. Menu ⋮/Meer → Oefenen met feedback ontvangen.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var K = 'kma-x-oefenen';
  var CASUS = [
    { id: 'c1', s: 'Je groepscommandant zegt na de oefening: "Je briefing was te lang."', q: 'Wat doe je eerst?',
      o: [['Uitleggen waarom het zo lang was', 0, 'Begrijpelijk, maar zo verdedig je je voordat je weet wat hij precies bedoelt.'],
        ['Vragen om een voorbeeld: wat was overbodig?', 1, 'Goed. Eerst begrijpen, dan pas reageren. Daarna kies je één volgende stap.'],
        ['Zeggen dat je het de volgende keer korter doet', 0, 'Netjes, maar je weet nog niet wat korter moet. Vraag eerst wat er overbodig was.']] },
    { id: 'c2', s: 'Een medecadet schrijft op een kaart: "Je luistert niet naar anderen."', q: 'Wat doe je eerst?',
      o: [['Vragen wanneer hij dat zag en wat je toen deed', 1, 'Goed. Je maakt van een oordeel een situatie waar je iets mee kunt.'],
        ['De kaart wegleggen: hij kent je niet goed', 0, 'Dan mis je misschien een blinde vlek. Eén voorbeeld vragen kost weinig.'],
        ['Meteen in je leervraag zetten: beter luisteren', 0, 'Snel, maar te vaag. Vraag eerst een voorbeeld, dan wordt je leervraag concreet.']] },
    { id: 'c3', s: 'Je teamleider zegt: "Je bent sterk in plannen, maar je laat weinig ruimte aan je groep."', q: 'Wat doe je met de tweede helft?',
      o: [['Alleen het compliment onthouden', 0, 'Fijn om te horen, maar de tweede helft is waar je van leert.'],
        ['Vragen hoe ruimte geven er bij de volgende opdracht uit kan zien', 1, 'Goed. Zo wordt het een concreet als-dan-plan voor de volgende opdracht.'],
        ['Uitleggen dat je groep anders te laat is', 0, 'Kan kloppen, maar zo sluit je het gesprek. Vraag eerst wat hij zag.']] }
  ];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function st() { try { var v = JSON.parse(kmaStore.getItem(K) || 'null'); return v && Array.isArray(v.klaar) ? v : { klaar: [] }; } catch (e) { return { klaar: [] }; } }
  function zetKlaar(id) { var v = st(); if (v.klaar.indexOf(id) < 0) v.klaar.push(id); kmaStore.setItem(K, JSON.stringify(v)); }
  /** Punt 32: is er een als-dan-plan bijgesteld na feedback? (plan met bijgesteld-markering of een check-in "niet" gevolgd door een wijziging) */
  function planBijgesteld() {
    try {
      var p = JSON.parse(kmaStore.getItem('kma-x-plannen') || '[]') || [];
      return (Array.isArray(p) ? p : []).some(function (x) { return x && (x.bijgesteld || x.edited || (Array.isArray(x.versies) && x.versies.length > 1)); });
    } catch (e) { return false; }
  }
  var ov = null, idx = 0, keuze = -1;
  function close() { if (ov) { ov.remove(); ov = null; } }
  function teken() {
    var c = CASUS[idx], o = keuze >= 0 ? c.o[keuze] : null;
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet kma-oef" role="dialog" aria-modal="true" aria-label="Oefenen met feedback ontvangen" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<div class="kma-sheet-title">Feedback ontvangen</div><div class="kma-code-body">' +
      '<p class="muted small">Casus ' + (idx + 1) + ' van ' + CASUS.length + '</p><p><b>' + esc(c.s) + '</b></p><p>' + esc(c.q) + '</p>' +
      c.o.map(function (x, i) { return '<button type="button" class="kma-oef-opt' + (keuze === i ? (x[1] ? ' goed' : ' fout') : '') + '" data-oef="' + i + '"' + (keuze >= 0 ? ' disabled' : '') + '>' + esc(x[0]) + '</button>'; }).join('') +
      (o ? '<p class="kma-oef-uitleg" role="status">' + (o[1] ? '<b>Goed.</b> ' : '') + esc(String(o[2]).replace(/^Goed\.\s*/, '')) + '</p>' : '') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-oef-x>Sluiten</button>' +
      (o ? (idx < CASUS.length - 1 ? '<button type="button" class="kma-icon-btn is-primary" data-oef-volgende>Volgende casus</button>' : '<button type="button" class="kma-icon-btn is-primary" data-oef-x>Klaar</button>') : '') + '</div>' +
      (idx === CASUS.length - 1 && o ? '<p class="muted small">Mijlpaal: je krijgt een insigne als je een plan bijstelt na feedback, niet voor het aantal invoeringen.' + (planBijgesteld() ? ' Die heb je al.' : '') + '</p>' : '') +
      '</div></div>';
  }
  function open() {
    close(); idx = 0; keuze = -1;
    ov = document.createElement('div'); ov.className = 'kma-sheet-overlay in';
    document.body.appendChild(ov); teken();
  }
  document.addEventListener('click', function (e) {
    if (!ov || !ov.contains(/** @type {Node} */ (e.target))) return;
    var t = /** @type {Element} */ (e.target);
    if (t === ov || t.closest('[data-oef-x]')) { close(); return; }
    var b = t.closest('[data-oef]');
    if (b && keuze < 0) { keuze = +b.getAttribute('data-oef'); if (CASUS[idx].o[keuze][1]) zetKlaar(CASUS[idx].id); teken(); return; }
    if (t.closest('[data-oef-volgende]')) { idx++; keuze = -1; teken(); }
  });
  window.kmaOefenen = { CASUS: CASUS, open: open, close: close, klaar: function () { return st().klaar.slice(); }, planBijgesteld: planBijgesteld };
})();
