/*
 * Roos van Leary: actie → reactie en escalatie doorbreken (4.21.0, blok S1 en S2).
 *  - Hint onder een paar rozen (eigen gedrag en "wat deed de ander daarna?"): wat het paar laat zien (KMALeary.paar).
 *  - aanbod(a, r): bij tegen → tegen biedt de app een als-dan-plan aan (Gollwitzer & Sheeran, 2006), aan te passen.
 *  - oefeningHtml(): vier militaire situaties; de cadet kiest een reactie en ziet wat die waarschijnlijk uitlokt.
 * Onderbouwing: Leary 1957, Carson 1969, Sadler e.a. 2009; kanttekening Orford 1986 (aan de tegen-kant escaleert het).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, t) { if (window.kmaToast) kmaToast(m, t); }
  var L = function () { return window.KMALeary; };

  /** Paar rozen in één blok: id-a = eigen gedrag, id-r = reactie van de ander. */
  function paarHtml(idA, idR, a, r, titelA) {
    if (!L()) return '';
    return L().picker(idA, a, titelA || 'Jouw gedrag op de roos') +
      L().picker(idR, r, 'Wat deed de ander daarna? (optioneel)') +
      '<p class="kma-reactie-hint muted small" data-reactie-hint="' + esc(idA) + '|' + esc(idR) + '" aria-live="polite"></p>';
  }
  function hints() {
    if (!L()) return;
    document.querySelectorAll('[data-reactie-hint]').forEach(function (h) {
      var ids = h.getAttribute('data-reactie-hint').split('|'), p = L().paar(L().value(ids[0]), L().value(ids[1]));
      h.textContent = p ? p.tekst : '';
      h.classList.toggle('kma-reactie-esc', !!(p && p.escalatie));
    });
  }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.kma-leary-pick')) setTimeout(hints, 0); });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.kma-leary-pick')) setTimeout(hints, 0); });

  /** Bij tegen → tegen: als-dan-plan aanbieden. Geeft true als het aanbod getoond werd. */
  function aanbod(a, r) {
    var p = L() && L().paar(a, r);
    if (!p || !p.escalatie || !window.kmaPlannen) return false;
    var ov = document.createElement('div'); ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet kma-reactie" role="dialog" aria-modal="true" aria-label="Als-dan-plan bij tegen-gedrag" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<div class="kma-sheet-title">Tegen lokte tegen uit</div><div class="kma-code-body">' +
      '<p class="small">' + esc(p.van) + ' → ' + esc(p.naar) + '. ' + esc(p.tekst) + '</p>' +
      '<p class="muted small">Een als-dan-plan helpt om de volgende keer niet mee te gaan in tegen-gedrag. Pas het aan in je eigen woorden.</p>' +
      '<label class="kma-field"><span>Als …</span><input type="text" id="rc-als" maxlength="160" value="' + esc(L().PLAN.als) + '"></label>' +
      '<label class="kma-field"><span>dan …</span><input type="text" id="rc-dan" maxlength="160" value="' + esc(L().PLAN.dan) + '"></label>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-rc="x">Niet nu</button><button type="button" class="kma-icon-btn is-primary" data-rc="ok">Plan opslaan</button></div></div></div>';
    var close = function () { ov.remove(); };
    ov.__kmaClose = close;
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var b = e.target.closest('[data-rc]'); if (!b) return;
      if (b.getAttribute('data-rc') === 'x') { close(); return; }
      var ok = window.kmaPlannen.add({ als: ov.querySelector('#rc-als').value, dan: ov.querySelector('#rc-dan').value, from: 'roos' });
      if (ok) { close(); toast('Als-dan-plan opgeslagen'); var rw = /** @type {any} */ (window).renderWidgets; if (typeof rw === 'function') try { rw(); } catch (x) {} }
    });
    return true;
  }

  /* ---------------- S2: oefening escalatie doorbreken ---------------- */
  var SIT = [
    { s: 'Bij de nabespreking zegt een medecadet fel: "Jouw plan was waardeloos."', ander: 'aanvallend', opties: [
      { t: '"Jij deed het ook niet beter."', k: 'aanvallend', u: 'Tegen beantwoord met tegen: hij gaat er waarschijnlijk nog harder tegenin. Zo escaleert het.' },
      { t: 'Je zegt niets meer en kijkt weg.', k: 'teruggetrokken', u: 'Het lijkt rustig, maar de kritiek blijft hangen en hij neemt het gesprek over.' },
      { t: '"Wat had volgens jou beter gemoeten?"', k: 'meewerkend', u: 'Je gaat niet mee in het tegen-gedrag en nodigt uit tot samen. Dat geeft de beste kans dat het rustiger wordt.', goed: true },
      { t: '"Ik ben de groepscommandant, we doen het zo."', k: 'concurrerend', u: 'Boven en tegen tegelijk: dat wordt een strijd om gelijk, geen gesprek.' }] },
    { s: 'Een medecadet voert je opdracht niet uit en zegt: "Dat heeft toch geen zin."', ander: 'opstandig', opties: [
      { t: 'Je verheft je stem: "Doe wat ik zeg."', k: 'aanvallend', u: 'Aanvallend gedrag lokt bij opstandig gedrag meestal meer verzet uit.' },
      { t: '"Wat zie jij dat ik mis? Daarna beslis ik."', k: 'leidend', u: 'Je neemt zijn bezwaar serieus (samen) en houdt de leiding (boven). Warm en duidelijk tegelijk.', goed: true },
      { t: 'Je doet het dan zelf maar.', k: 'volgend', u: 'Het conflict is weg, maar hij leert dat tegenwerken loont en jij draait op voor het werk.' }] },
    { s: 'Een medecadet zegt al dagen weinig en houdt zich afzijdig van de groep.', ander: 'teruggetrokken', opties: [
      { t: 'Je spreekt hem streng aan, waar de hele groep bij is.', k: 'aanvallend', u: 'Hij trekt zich waarschijnlijk nog verder terug.' },
      { t: 'Je vraagt hem apart hoe het gaat en geeft hem een duidelijke taak.', k: 'helpend', u: 'Samen en met richting: dat maakt het makkelijker om weer mee te doen.', goed: true },
      { t: 'Je laat hem met rust; hij komt vanzelf wel.', k: 'teruggetrokken', u: 'Er verandert niets; afstand roept afstand op.' }] },
    { s: 'Je teamleider geeft je kritische feedback op je optreden als commandant.', ander: 'leidend', opties: [
      { t: '"Dat zag ik anders, u was er niet bij."', k: 'opstandig', u: 'Het gesprek gaat nu over gelijk krijgen in plaats van over leren.' },
      { t: '"Kunt u een voorbeeld geven? Wat had u willen zien?"', k: 'meewerkend', u: 'Samen blijven terwijl de ander leidt: zo haal je het meeste uit de feedback.', goed: true },
      { t: 'Je knikt en zegt overal "ja" op.', k: 'volgend', u: 'Rustig, maar je eigen kijk ontbreekt en je leert er weinig van.' }] }
  ];
  function naam(k) { var x = L() && L().SECT.filter(function (s) { return s.k === k; })[0]; return x ? x.n : k; }
  function oefeningHtml() {
    return '<details class="kma-leary-theory kma-reactie-oef"><summary>Oefening: escalatie doorbreken</summary>' +
      '<p class="small">Gedrag lokt gedrag uit. Kies bij elke situatie wat jij zou doen; je ziet dan welk gedrag dat is en wat het waarschijnlijk uitlokt.</p>' +
      SIT.map(function (x, i) {
        return '<div class="kma-reactie-sit" data-rsit="' + i + '"><p><b>' + (i + 1) + '.</b> ' + esc(x.s) + ' <span class="muted small">(' + esc(naam(x.ander)) + ')</span></p>' +
          '<div class="kma-reactie-opts">' + x.opties.map(function (o, j) { return '<button type="button" class="kma-chip-btn" data-ropt="' + i + '|' + j + '" aria-pressed="false">' + esc(o.t) + '</button>'; }).join('') + '</div>' +
          '<p class="kma-reactie-uit small" aria-live="polite"></p></div>';
      }).join('') +
      '<p class="muted small">Let op: aan de tegen-kant klopt de regel van de roos maar half. Op aanvallend gedrag reageren mensen vaak óók aanvallend, en zo loopt het op (Orford, 1986). Niet meegaan in tegen-gedrag, maar samen blijven en duidelijk zijn, geeft de beste kans dat het rustiger wordt. Er is niet altijd één goed antwoord: soms is een harde grens nodig.</p></details>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-ropt]'); if (!b) return;
    var ij = b.getAttribute('data-ropt').split('|'), x = SIT[+ij[0]], o = x && x.opties[+ij[1]]; if (!o) return;
    var box = b.closest('.kma-reactie-sit');
    box.querySelectorAll('[data-ropt]').forEach(function (y) { y.classList.toggle('on', y === b); y.setAttribute('aria-pressed', String(y === b)); });
    var goed = x.opties.filter(function (q) { return q.goed; })[0];
    box.querySelector('.kma-reactie-uit').innerHTML = '<b>' + esc(naam(o.k)) + '.</b> ' + esc(o.u) + (o.goed ? '' : (goed ? ' <span class="muted">Meeste kans op rust: ' + esc(goed.t) + '</span>' : ''));
    box.classList.toggle('goed', !!o.goed);
  });

  window.kmaReactie = { paarHtml: paarHtml, hints: hints, aanbod: aanbod, oefeningHtml: oefeningHtml, SIT: SIT };
})();
