/*
 * Drie tabbladen onderaan het Reflectieboekje (4.18.0, blok P3): Vandaag, Mijn ontwikkeling en Naslag.
 *  - Vandaag: alleen de cockpit (kaart Vandaag, kma-boek-vandaag.js) en de voortgang; geen hoofdstukken.
 *  - Mijn ontwikkeling: de hoofdstukken uit Kern en Verdieping. Hoofdstukken uit Verdieping waar je nog niets
 *    hebt ingevuld staan ingeklapt achter "Toon ... niet gebruikt" (ongebruikte onderdelen verbergen).
 *  - Naslag: alleen de groep Naslag en overzicht.
 * Een hoofdstuk openen (ook via Vandaag of een link) kiest vanzelf het juiste tabblad. De keuze wordt onthouden
 * (kma-ui-tab). De indeling van de hoofdstukken (kma-ui-boek.js, onderdeel 8b) verandert niet.
 * In automatische tests staat dit uit, tenzij window.__kmaTabsForce vóór het laden gezet is (zoals de intro).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || typeof goToStep !== 'function' || !window.kmaChapterGroup) return;
  if (navigator.webdriver && !window.__kmaTabsForce) return;
  var KEY = 'kma-ui-tab', ALLES = 'kma-ui-alle-hoofdstukken';
  var TABS = [['vandaag', 'Vandaag', 'calendar'], ['ontwikkeling', 'Mijn ontwikkeling', 'trend'], ['naslag', 'Naslag', 'book']];
  function store() { return window.kmaStore || window.localStorage; }
  function get(k) { try { return store().getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { store().setItem(k, v); } catch (e) {} }
  function icon(n) { return window.kmaIcon ? kmaIcon(n) : ''; }
  function tabVan(idx) { return kmaChapterGroup(idx) === 'naslag' ? 'naslag' : 'ontwikkeling'; }
  var laatste = { ontwikkeling: null, naslag: null }, bezig = false;

  var bar = document.createElement('nav');
  bar.id = 'kma-tabs'; bar.className = 'kma-boektabs'; bar.setAttribute('aria-label', 'Onderdelen van het boekje');
  bar.innerHTML = TABS.map(function (t) {
    return '<button type="button" class="kma-bt" data-bt="' + t[0] + '">' + icon(t[2]) + '<span>' + t[1] + '</span></button>';
  }).join('');
  document.body.appendChild(bar);
  document.body.classList.add('kma-tabs-on');

  function huidig() { return document.body.getAttribute('data-boek-tab') || 'ontwikkeling'; }
  function markeer(t) {
    document.body.setAttribute('data-boek-tab', t);
    if (t !== 'vandaag') document.body.classList.add('hero-compact');   // bij de hoofdstukken: kleine kop, meteen de inhoud
    Array.prototype.forEach.call(bar.querySelectorAll('.kma-bt'), function (b) {
      var on = b.getAttribute('data-bt') === t;
      b.classList.toggle('on', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
  }
  function naarBoven() { try { window.scrollTo({ top: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); } }
  /** Kiest een tabblad. Bij Mijn ontwikkeling en Naslag opent zo nodig een hoofdstuk uit die groep. */
  function kies(t, stil) {
    if (TABS.every(function (x) { return x[0] !== t; })) t = 'ontwikkeling';
    set(KEY, t);
    if (t !== 'vandaag' && typeof currentStepIndex !== 'undefined' && tabVan(currentStepIndex) !== t) {
      var o = kmaChapterOrder(), doel = laatste[t];
      if (doel == null || tabVan(doel) !== t) doel = o.filter(function (i) { return tabVan(i) === t; })[0];
      if (doel != null) { bezig = true; try { goToStep(doel); } finally { bezig = false; } }
    }
    markeer(t);
    if (window.kmaOpenChapterGroup) {
      if (t === 'naslag') kmaOpenChapterGroup('naslag');
      else if (t === 'ontwikkeling') { var g = kmaChapterGroup(currentStepIndex); kmaOpenChapterGroup(window.matchMedia && matchMedia('(max-width: 850px)').matches ? '' : g); }
    }
    ongebruikt();
    if (window.kmaVandaag) try { kmaVandaag.render(); } catch (e) {}
    if (!stil) naarBoven();
  }
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-bt]'); if (!b) return;
    kies(b.getAttribute('data-bt'));
  });
  // Een hoofdstuk openen kiest het juiste tabblad (behalve als kies() zelf het hoofdstuk opent).
  kmaAfter('goToStep', function () {
    if (typeof currentStepIndex === 'undefined') return;
    var t = tabVan(currentStepIndex);
    laatste[t] = currentStepIndex;
    if (bezig) return;
    set(KEY, t); markeer(t); ongebruikt();
    if (window.kmaVandaag) try { kmaVandaag.render(); } catch (e) {}
  });

  /* Ongebruikte hoofdstukken uit Verdieping inklappen (niet het hoofdstuk dat open staat). */
  function leeg(i) { var st = window.kmaChapterStatus ? kmaChapterStatus(i) : null; return !!st && !(st.done > 0); }
  function ongebruikt() {
    var nav = document.getElementById('step-nav'); if (!nav) return;
    var alles = get(ALLES) === '1', n = 0;
    /** @type {any} */ var laatsteLink = null;
    Array.prototype.forEach.call(nav.querySelectorAll(':scope > .step-link[data-group="verdieping"]'), function (l) {
      var i = +l.getAttribute('data-idx'), weg = !alles && i !== currentStepIndex && leeg(i);
      l.classList.toggle('kma-ongebruikt', weg);
      if (leeg(i) && i !== currentStepIndex) n++;
      laatsteLink = l;
    });
    var knop = nav.querySelector(':scope > .kma-nav-meer');
    if (!n) { if (knop) knop.remove(); nav.classList.remove('kma-met-meer'); return; }
    if (!knop) {
      knop = document.createElement('button'); knop.type = 'button'; knop.className = 'kma-nav-meer'; knop.setAttribute('data-group', 'verdieping');
      knop.addEventListener('click', function () { set(ALLES, get(ALLES) === '1' ? '0' : '1'); ongebruikt(); });
    }
    if (laatsteLink && laatsteLink.nextSibling !== knop) laatsteLink.parentNode.insertBefore(knop, laatsteLink.nextSibling);
    nav.classList.add('kma-met-meer');
    knop.textContent = alles ? 'Verberg ' + n + ' niet gebruikt' : 'Toon ' + n + ' niet gebruikt';
    knop.setAttribute('aria-expanded', alles ? 'true' : 'false');
  }
  kmaAfter('renderNav', ongebruikt);
  kmaAfter('updateProgress', ongebruikt);

  // Start: het laatst gekozen tabblad; nieuwe gebruikers beginnen op Vandaag.
  var start = get(KEY) || 'vandaag';
  try { kies(start, true); } catch (e) { console.error(e); }
  window.kmaTabs = { kies: kies, huidig: huidig, ongebruikt: ongebruikt };
})();
