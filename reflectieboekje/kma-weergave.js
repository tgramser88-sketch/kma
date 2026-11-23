/*
 * 4.28.0 (blok T): twee weergaven, blijvend: Klassiek en Dashboard. Gedeeld door het boekje en het CVS.
 *  - kmaWeergave.get() → 'klassiek' | 'dashboard'; set(w) bewaart (kma-ui-weergave) en laadt de pagina opnieuw,
 *    zodat alle onderdelen in de nieuwe indeling opbouwen. De gegevens veranderen niet.
 *  - body krijgt de klasse kma-dash in de Dashboard-weergave (vóór de andere modules laden).
 *  - In automatische tests is Dashboard alleen aan met window.__kmaWeergave = 'dashboard' (vóór het laden).
 * Regel (CLAUDE.md): elke nieuwe functie werkt in beide weergaven.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var KEY = 'kma-ui-weergave';
  function store() { return window.kmaStore || window.localStorage; }
  function get() {
    if (window.__kmaWeergave) return window.__kmaWeergave === 'dashboard' ? 'dashboard' : 'klassiek';
    var v = null; try { v = store().getItem(KEY); } catch (e) {}
    return v === 'dashboard' ? 'dashboard' : 'klassiek';
  }
  function set(w) {
    try { store().setItem(KEY, w === 'dashboard' ? 'dashboard' : 'klassiek'); } catch (e) {}
    if (window.__kmaWeergave) window.__kmaWeergave = w;
    try { location.reload(); } catch (e) {}
  }
  function zet() { if (document.body) document.body.classList.toggle('kma-dash', get() === 'dashboard'); }
  if (document.body) zet(); else document.addEventListener('DOMContentLoaded', zet);
  window.kmaWeergave = { get: get, set: set, dash: function () { return get() === 'dashboard'; } };
})();
