/*
 * Pagina "Wetenschappelijke onderbouwing" in beide apps (4.18.0, blok O1): menu ⋮ → Hulp → Wetenschappelijke onderbouwing.
 * Per onderdeel in gewone taal: wat het is, waarom het werkt (effect uit meta-analyses), de grenzen en de bronnen (APA).
 * Doorzoekbaar en per onderdeel in te klappen. De inhoud komt uit kma-bronnen.js (window.KMABronnen).
 * Elke knop met data-waarom="<id>" (zie kmaOnderbouwing.link) opent de pagina bij dat onderdeel ("Waarom zo?").
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(n) { return window.kmaIcon ? kmaIcon(n) : ''; }
  function B() { return window.KMABronnen; }
  var ov = null;

  function bronnenHtml(o) {
    return '<ol class="kma-ob-bronnen">' + o.bronnen.map(function (id) {
      var b = B().bron(id); if (!b) return '';
      return '<li>' + B().html(b.apa) + (b.doi ? ' <a href="https://doi.org/' + esc(b.doi) + '" target="_blank" rel="noopener">doi.org/' + esc(b.doi) + '</a>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  function itemHtml(o) {
    var tekst = [o.titel, o.waar, o.wat, o.waarom, o.effect, o.grenzen].concat(o.bronnen.map(function (id) { var b = B().bron(id); return b ? B().plain(b.apa) : ''; })).join(' ').toLowerCase();
    return '<details class="kma-ob-item" id="kma-ob-' + esc(o.id) + '" data-ob="' + esc(o.id) + '" data-zoek="' + esc(tekst) + '">' +
      '<summary><span class="kma-ob-t">' + esc(o.titel) + '</span><small>' + esc(o.waar) + '</small></summary>' +
      '<div class="kma-ob-body">' +
      '<h4>Wat is het?</h4><p>' + esc(o.wat) + '</p>' +
      '<h4>Waarom werkt het?</h4><p>' + esc(o.waarom) + '</p>' +
      (o.effect ? '<p class="kma-ob-effect">' + icon('activity') + '<span><b>Effect.</b> ' + esc(o.effect) + '</span></p>' : '') +
      '<h4>Grenzen</h4><p>' + esc(o.grenzen) + '</p>' +
      '<h4>Bronnen</h4>' + bronnenHtml(o) +
      '</div></details>';
  }
  function close() {
    if (!ov) return;
    ov.remove(); ov = null;
    document.removeEventListener('keydown', key);
  }
  function key(e) { if (e.key === 'Escape') close(); }
  function filter(q) {
    if (!ov) return;
    var w = String(q || '').toLowerCase().trim().split(/\s+/).filter(Boolean), n = 0;
    Array.prototype.forEach.call(ov.querySelectorAll('.kma-ob-item'), function (d) {
      var hit = !w.length || w.every(function (x) { return d.getAttribute('data-zoek').indexOf(x) >= 0; });
      d.hidden = !hit; if (hit) n++;
      if (w.length && hit) d.open = true;
    });
    var leeg = ov.querySelector('.kma-ob-leeg'); if (leeg) leeg.hidden = n > 0;
    var tel = ov.querySelector('.kma-ob-tel'); if (tel) tel.textContent = n + (n === 1 ? ' onderdeel' : ' onderdelen');
  }
  /** Opent de pagina; met een id klapt dat onderdeel open en staat het bovenaan. */
  function open(id) {
    if (!B()) return;
    close();
    var D = B().data;
    // Alleen de onderdelen die bij deze app horen (4.18.1: boekje voor de cadet, CVS voor teamleider en instructeur).
    var app = document.body.classList.contains('kma-volg') ? 'cvs' : 'boek';
    var lijst = D.onderdelen.filter(function (o) { return !o.apps || o.apps.indexOf(app) >= 0; });
    ov = document.createElement('div');
    ov.className = 'kma-ob'; ov.id = 'kma-ob';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Wetenschappelijke onderbouwing');
    ov.innerHTML = '<div class="kma-ob-bar"><strong>Wetenschappelijke onderbouwing</strong><span class="kma-ob-sp"></span>' +
      '<button type="button" class="kma-ob-btn" data-ob-x aria-label="Sluiten">' + (icon('x') || '×') + '</button></div>' +
      '<div class="kma-ob-scroll"><div class="kma-ob-in">' +
      '<p class="kma-ob-intro">Waarom werkt ' + (app === 'cvs' ? 'het CadetVolgSysteem' : 'het Reflectieboekje') + ' zo? Per onderdeel: wat het is, waarom het werkt, hoe groot het effect is in onderzoek en wat de grenzen zijn. ' +
      'Effecten zijn gemiddelden uit meta-analyses (d of g: 0,2 klein, 0,5 middelgroot, 0,8 groot). Ze gelden niet automatisch voor de KMA; daarom wordt het effect hier zelf ook onderzocht.</p>' +
      '<label class="kma-ob-zoek"><span class="sr-only">Zoeken in de onderbouwing</span>' + icon('search') +
      '<input type="search" id="kma-ob-q" placeholder="Zoek, bijv. feedback, stress of Gollwitzer" autocomplete="off" data-nomic></label>' +
      '<p class="kma-ob-meta"><span class="kma-ob-tel"></span> · <button type="button" class="kma-ob-link" data-ob-alles>Alles openklappen</button></p>' +
      lijst.map(itemHtml).join('') +
      '<p class="kma-ob-leeg" hidden>Niets gevonden. Probeer een ander woord.</p>' +
      '<p class="kma-ob-voet">Bronnen nagelopen op ' + esc(D.versie.split('-').reverse().join('-')) + '. Alle onderdelen van beide apps staan in de handleiding (C4); de bronnen ook in het onderzoeksvoorstel.</p>' +
      '</div></div>';
    ov.__kmaClose = close;
    document.body.appendChild(ov);
    if (window.kmaEnter) kmaEnter(ov, 'r');
    document.addEventListener('keydown', key);
    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-ob-x]')) { close(); return; }
      var a = e.target.closest('[data-ob-alles]');
      if (a) {
        var dicht = [].some.call(ov.querySelectorAll('.kma-ob-item:not([hidden])'), function (d) { return !d.open; });
        [].forEach.call(ov.querySelectorAll('.kma-ob-item:not([hidden])'), function (d) { d.open = dicht; });
        a.textContent = dicht ? 'Alles inklappen' : 'Alles openklappen';
      }
    });
    ov.querySelector('#kma-ob-q').addEventListener('input', function (e) { filter(e.target.value); });
    filter('');
    var it = id && ov.querySelector('#kma-ob-' + String(id).replace(/[^a-z0-9-]/gi, ''));
    if (it) {
      it.open = true;
      setTimeout(function () { try { it.scrollIntoView({ block: 'start', behavior: 'instant' }); } catch (x) { it.scrollIntoView(); } var s = it.querySelector('summary'); if (s) s.focus({ preventScroll: true }); }, 30);
    } else {
      setTimeout(function () { var b = ov && ov.querySelector('[data-ob-x]'); if (b) b.focus(); }, 30);
    }
  }
  /** Knop "Waarom zo?" naar een onderdeel. */
  function link(id, label) {
    if (!B() || !B().onderdeel(id)) return '';
    return '<button type="button" class="kma-waarom" data-waarom="' + esc(id) + '">' + icon('idea') + esc(label || 'Waarom zo?') + '</button>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-waarom]');
    if (!b) return;
    e.preventDefault();
    open(b.getAttribute('data-waarom'));
  });
  window.kmaOnderbouwing = { open: open, close: close, link: link, filter: filter };
})();
