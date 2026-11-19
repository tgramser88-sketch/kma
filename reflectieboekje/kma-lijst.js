/*
 * KMALijst: overzichtelijke lijsten met veel items (DTF-feiten, tijdlijn, notities).
 *  - compacte regels die openklappen (of alles uitgebreid tonen; keuze wordt onthouden)
 *  - gegroepeerd per maand met inklapbare koppen; standaard is alleen de nieuwste maand open
 *  - "Meer laden" per 15 items in plaats van alles tegelijk
 *  - maandbalk om direct naar een maand te springen
 * De lijst ververst zichzelf ter plekke (geen herberekening van de hele pagina, geen sprong naar boven).
 *
 * Gebruik: KMALijst.render('dtf', items, { date: function (it) { return 'YYYY-MM-DD'; },
 *            row: function (it, i) { return { when, title, badges, body, cls }; }, empty: '<p>…</p>' })
 * Hulp voor filters: KMALijst.inPeriod(iso, 'alles' | '30d' | 'gesprek', sindsIso)
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var PAGE = 15, MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  var KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  var reg = {}, state = {};
  var st = function () { return window.kmaStore || window.localStorage; };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function compact() { try { return st().getItem('kma-x-lijst-uitgebreid') !== '1' && localStorage.getItem('kma-x-lijst-uitgebreid') !== '1'; } catch (e) { return true; } }
  function setCompact(on) { [st(), window.localStorage].forEach(function (x) { try { if (on) x.removeItem('kma-x-lijst-uitgebreid'); else x.setItem('kma-x-lijst-uitgebreid', '1'); } catch (e) {} }); }
  function ym(iso) { var m = /^(\d{4})-(\d{2})/.exec(String(iso || '')); return m ? m[1] + '-' + m[2] : 'zz'; }
  function monthLabel(k, short) {
    if (k === 'zz') return 'Zonder datum';
    var m = /^(\d{4})-(\d{2})$/.exec(k); if (!m) return k;
    return short ? KORT[m[2] - 1] + ' \'' + m[1].slice(2) : MAANDEN[m[2] - 1] + ' ' + m[1];
  }
  function S(id) { return state[id] || (state[id] = { shown: PAGE, open: null }); }
  function sorted(id) {
    var r = reg[id]; if (!r) return [];
    return r.items.map(function (it, i) { return { it: it, i: i, d: String(r.opts.date(it) || '') }; })
      .sort(function (a, b) { return a.d === b.d ? b.i - a.i : (a.d < b.d ? 1 : -1); });
  }
  function rowHtml(r, e, open) {
    var x = r.opts.row(e.it, e.i) || {};
    return '<details class="kma-kl-row' + (x.cls ? ' ' + x.cls : '') + '"' + (open ? ' open' : '') + '><summary>' +
      '<span class="kma-kl-when">' + (x.when || '') + '</span><span class="kma-kl-title">' + (x.title || '') + '</span>' +
      (x.badges ? '<span class="kma-kl-badges">' + x.badges + '</span>' : '') + '</summary><div class="kma-kl-body">' + (x.body || '') + '</div></details>';
  }
  function inner(id) {
    var r = reg[id], s = S(id), all = sorted(id);
    if (!all.length) return r.opts.empty || '<p class="muted">Niets gevonden.</p>';
    var counts = {}, order = [];
    all.forEach(function (e) { var k = ym(e.d); if (!counts[k]) { counts[k] = 0; order.push(k); } counts[k]++; });
    if (!s.open) { s.open = {}; s.open[order[0]] = true; }
    var shown = all.slice(0, s.shown), groups = {}, gOrder = [];
    shown.forEach(function (e) { var k = ym(e.d); if (!groups[k]) { groups[k] = []; gOrder.push(k); } groups[k].push(e); });
    var open = !compact(), html = '<div class="kma-kl-bar">';
    if (order.length > 1) html += '<div class="kma-kl-months" role="navigation" aria-label="Spring naar maand">' + order.map(function (k) {
      return '<button type="button" class="kma-chip-btn" data-kl-jump="' + esc(id) + '|' + k + '">' + esc(monthLabel(k, true)) + ' <em>' + counts[k] + '</em></button>';
    }).join('') + '</div>';
    html += '<button type="button" class="kma-chip-btn kma-kl-mode" data-kl-mode="' + esc(id) + '" aria-pressed="' + open + '">' + (open ? 'Compact tonen' : 'Alles uitklappen') + '</button></div>';
    gOrder.forEach(function (k) {
      var isOpen = open || !!s.open[k];
      html += '<details class="kma-kl-month" data-kl-m="' + esc(id) + '|' + k + '"' + (isOpen ? ' open' : '') + '><summary><span>' + esc(monthLabel(k)) + '</span><em>' + counts[k] + '</em></summary>' +
        (isOpen ? groups[k].map(function (e) { return rowHtml(r, e, open); }).join('') : '') + '</details>';
    });
    if (all.length > s.shown) html += '<button type="button" class="kma-icon-btn kma-kl-more" data-kl-more="' + esc(id) + '">Meer laden <span class="muted">(' + s.shown + ' van ' + all.length + ')</span></button>';
    return html;
  }
  function render(id, items, opts) {
    reg[id] = { items: Array.isArray(items) ? items.filter(Boolean) : [], opts: opts || {} };
    var key = reg[id].items.length + '|' + (opts && opts.key || '');
    var s = S(id); if (s.key !== key) { s.key = key; if (s.shown < PAGE) s.shown = PAGE; }
    return '<div class="kma-kl" data-kl="' + esc(id) + '">' + inner(id) + '</div>';
  }
  function refresh(id) {
    var el = document.querySelector('.kma-kl[data-kl="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
    if (el && reg[id]) el.innerHTML = inner(id);
    return el;
  }
  function split(v) { var i = v.indexOf('|'); return [v.slice(0, i), v.slice(i + 1)]; }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kl-more],[data-kl-mode],[data-kl-jump]'); if (!b) return;
    if (b.hasAttribute('data-kl-more')) { var id = b.getAttribute('data-kl-more'); S(id).shown += PAGE; refresh(id); return; }
    if (b.hasAttribute('data-kl-mode')) { setCompact(!compact()); Object.keys(reg).forEach(refresh); return; }
    var p = split(b.getAttribute('data-kl-jump')), s = S(p[0]), all = sorted(p[0]);
    var last = -1; all.forEach(function (x, n) { if (ym(x.d) === p[1]) last = n; });
    if (last >= s.shown) s.shown = Math.ceil((last + 1) / PAGE) * PAGE;
    s.open = s.open || {}; s.open[p[1]] = true;
    var el = refresh(p[0]);
    var m = el && el.querySelector('[data-kl-m="' + p[0] + '|' + p[1] + '"]');
    if (m) m.scrollIntoView({ behavior: 'auto', block: 'start' });
  });
  document.addEventListener('toggle', function (e) {
    var d = e.target; if (!d || !d.matches || !d.matches('details.kma-kl-month')) return;
    var p = split(d.getAttribute('data-kl-m')), s = S(p[0]); s.open = s.open || {};
    var was = !!s.open[p[1]]; s.open[p[1]] = d.open;
    if (d.open && !was && !d.querySelector('.kma-kl-row')) refresh(p[0]);
  }, true);
  /** Valt een datum binnen de gekozen periode? gesprek = sinds de laatste gespreksdatum (sindsIso). */
  function inPeriod(iso, p, sindsIso) {
    if (!p || p === 'alles') return true;
    var d = String(iso || '').slice(0, 10); if (!d) return false;
    if (p === '30d') { var t = new Date(); t.setDate(t.getDate() - 30); return d >= t.toISOString().slice(0, 10); }
    if (p === 'gesprek') return !sindsIso || d >= String(sindsIso).slice(0, 10);
    return true;
  }
  /** Chipknoppen voor een filtergroep. attr = data-attribuut dat de aanroeper zelf afhandelt. */
  function chips(attr, options, current) {
    return options.map(function (o) { var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o; return '<button type="button" class="kma-chip-btn' + (v === current ? ' on' : '') + '" ' + attr + '="' + esc(v) + '" aria-pressed="' + (v === current) + '">' + esc(l) + '</button>'; }).join('');
  }
  window.KMALijst = { render: render, refresh: refresh, inPeriod: inPeriod, chips: chips, monthLabel: monthLabel, PAGE: PAGE, _state: state };
})();
