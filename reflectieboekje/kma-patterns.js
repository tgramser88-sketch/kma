/*
 * Patronen in gedrag: shared by the Reflectieboekje and the CadetVolgSysteem.
 *  - DTF-feiten koppelen aan sterktes en valkuilen (SWOT uit de persoonlijkheidstest, kernkwadranten)
 *  - suggesties op basis van de tekst van het feit
 *  - patroonkaart (per sterkte/valkuil per week), weekdag × dagdeel, V × sterkte/valkuil
 *  - signalen ("valkuil X 3× in 2 weken"), week in samenhang (fitheid, DTF, emoties), SMART-check-ins
 * Everything is plain HTML/SVG; blocks are <details> so they can be folded away.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var VS = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'];
  var DAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
  var PARTS = [{ k: 'n', l: 'nacht', from: 0 }, { k: 'o', l: 'ochtend', from: 6 }, { k: 'm', l: 'middag', from: 12 }, { k: 'a', l: 'avond', from: 18 }];
  var KEYWORDS = {
    H: ['eerlijk', 'regel', 'toegeven', 'toegegeven', 'fout', 'schuld', 'liegen', 'gelogen', 'voordeel', 'afspraak', 'integer', 'stiekem'],
    E: ['spanning', 'zenuw', 'stress', 'zorgen', 'bang', 'onzeker', 'emotie', 'gevoel', 'pieker', 'steun', 'hulp', 'nerveus', 'druk'],
    X: ['praten', 'initiatief', 'groep', 'leiding', 'presenter', 'spreken', 'voorop', 'enthousias', 'sociaal', 'aanspreken', 'briefing', 'stil', 'mening'],
    A: ['geduld', 'boos', 'conflict', 'kritiek', 'rustig', 'irritatie', 'geïrriteerd', 'ruzie', 'vergeven', 'scherp', 'tegenspraak', 'uitval', 'kortaf'],
    C: ['plan', 'tijd', 'laat', 'netjes', 'controle', 'uitrusting', 'voorbereid', 'structuur', 'nauwkeurig', 'vergeten', 'orde', 'kluis', 'appel', 'deadline'],
    O: ['idee', 'nieuw', 'creatief', 'oplossing', 'anders', 'nieuwsgierig', 'verbeter', 'alternatief', 'vraag']
  };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function words(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/).filter(function (w) { return w.length >= 4; }); }
  function stem(w) { return w.slice(0, 5); }
  function tagKey(t) { return t.k + ':' + t.t; }
  function sw(d) { return d && Array.isArray(d.swot) ? d.swot.filter(function (t) { return t && (t.k === 's' || t.k === 'w') && t.t; }) : []; }
  function arr(x) { return Array.isArray(x) ? x.filter(Boolean) : []; }
  function dateOf(iso) { var d = iso ? new Date(iso + 'T12:00:00') : null; return d && !isNaN(d) ? d : null; }
  function mondayKey(d) { var m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') + '-' + String(m.getDate()).padStart(2, '0'); }
  function weekNo(d) { var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); var dn = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - dn); var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); }
  function lastWeeks(n, end) {
    var out = [], d = end ? new Date(end) : new Date();
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    for (var i = n - 1; i >= 0; i--) { var x = new Date(d); x.setDate(d.getDate() - 7 * i); out.push({ key: mondayKey(x), label: 'wk ' + weekNo(x) }); }
    return out;
  }
  function partOf(time) { var h = parseInt(String(time || '').split(':')[0], 10); if (isNaN(h)) return null; return h < 6 ? 0 : h < 12 ? 1 : h < 18 ? 2 : 3; }
  function store() { return window.kmaStore || null; }
  function prefs() { try { var st = store(); return st ? JSON.parse(st.getItem('kma-pat-open') || '{}') : {}; } catch (e) { return {}; } }
  function details(id, title, body, openByDefault) {
    var p = prefs(), open = id in p ? p[id] : !!openByDefault;
    return '<details class="kma-pat" data-pat="' + id + '"' + (open ? ' open' : '') + '><summary><span class="kma-pat-t">' + title + '</span></summary><div class="kma-pat-body">' + body + '</div></details>';
  }
  document.addEventListener('toggle', function (e) {
    var d = e.target; if (!d || !d.matches || !d.matches('details.kma-pat')) return;
    try { var p = prefs(), st = store(); p[d.getAttribute('data-pat')] = d.open; if (st) st.setItem('kma-pat-open', JSON.stringify(p)); } catch (er) {}
  }, true);

  /* ---------------- Tags ---------------- */
  /** Sterktes (k:'s') and valkuilen (k:'w') the cadet can link facts to. */
  function tagsFrom(src) {
    var out = [], seen = {};
    var add = function (k, t, trait, from) { t = String(t || '').trim(); if (!t || seen[k + t]) return; seen[k + t] = 1; out.push({ k: k, t: t, trait: trait || '', from: from }); };
    (src.swot && src.swot.s || []).forEach(function (p) { add('s', p.text, p.trait && p.trait.key, 'SWOT'); });
    (src.swot && src.swot.w || []).forEach(function (p) { add('w', p.text, p.trait && p.trait.key, 'SWOT'); });
    arr(src.kernkwadrant).forEach(function (q) { if (q && q.kwaliteit) add('s', q.kwaliteit, '', 'Kernkwadrant'); if (q && q.valkuil) add('w', q.valkuil, '', 'Kernkwadrant'); });
    arr(src.used).forEach(function (t) { add(t.k, t.t, t.trait, 'eerder gebruikt'); });
    return out;
  }
  /** Tags that seem to fit the text of a fact, best first. */
  function suggest(text, tags) {
    var ws = words(text), st = ws.map(stem);
    if (!ws.length) return [];
    return tags.map(function (t) {
      var score = 0;
      (KEYWORDS[t.trait] || []).forEach(function (k) { if (ws.some(function (w) { return w.indexOf(k.slice(0, 5)) === 0 || w.indexOf(k) >= 0; })) score += 2; });
      words(t.t).forEach(function (w) { if (st.indexOf(stem(w)) >= 0) score += 1; });
      return { tag: t, score: score };
    }).filter(function (x) { return x.score > 0; }).sort(function (a, b) { return b.score - a.score; }).slice(0, 4).map(function (x) { return x.tag; });
  }
  function used(list) {
    var out = [], seen = {};
    (list || []).forEach(function (d) { sw(d).forEach(function (t) { if (!seen[tagKey(t)]) { seen[tagKey(t)] = 1; out.push(t); } }); });
    return out;
  }

  /* ---------------- Patterns ---------------- */
  function heatCell(n, max, cls) {
    var a = max ? n / max : 0;
    return '<td class="kma-heat ' + (cls || '') + '" style="--a:' + (n ? (0.18 + 0.82 * a).toFixed(2) : 0) + '">' + (n || '') + '</td>';
  }
  function patternMap(list, weeks) {
    var tags = used(list);
    if (!tags.length) return '<p class="muted small">Koppel feiten aan een sterkte of valkuil; dan zie je hier per week hoe vaak ze voorkomen.</p>';
    var rows = tags.map(function (t) {
      var cnt = weeks.map(function (w) { return list.filter(function (d) { var dd = dateOf(d.datum); return dd && mondayKey(dd) === w.key && sw(d).some(function (x) { return tagKey(x) === tagKey(t); }); }).length; });
      return { t: t, cnt: cnt, total: cnt.reduce(function (a, b) { return a + b; }, 0) };
    }).sort(function (a, b) { return (a.t.k === b.t.k ? b.total - a.total : a.t.k === 's' ? -1 : 1); });
    var max = Math.max.apply(null, rows.map(function (r) { return Math.max.apply(null, r.cnt); }).concat([1]));
    // newest week first, so the recent weeks are visible without scrolling
    return '<div class="kma-heat-wrap" tabindex="0" role="group" aria-label="Overzicht per week, schuif opzij voor meer weken"><table class="kma-heat-table"><thead><tr><td></td>' + weeks.slice().reverse().map(function (w, i) { return '<th>' + (i === 0 ? 'deze week' : esc(w.label)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) {
        var half = Math.floor(r.cnt.length / 2), a = r.cnt.slice(0, half).reduce(function (x, y) { return x + y; }, 0), b = r.cnt.slice(half).reduce(function (x, y) { return x + y; }, 0);
        var trend = b > a ? '↑' : b < a ? '↓' : '';
        return '<tr><th class="kma-heat-lab ' + r.t.k + '"><i>' + (r.t.k === 's' ? 'S' : 'V') + '</i>' + esc(r.t.t) + (trend ? ' <b class="kma-trend ' + r.t.k + (trend === '↑' ? ' up' : ' down') + '" title="laatste weken ' + (trend === '↑' ? 'vaker' : 'minder vaak') + '">' + trend + '</b>' : '') + '</th>' +
          r.cnt.slice().reverse().map(function (n) { return heatCell(n, max, r.t.k); }).join('') + '</tr>';
      }).join('') + '</tbody></table></div><p class="muted small"><i class="kma-key s"></i> sterkte · <i class="kma-key w"></i> valkuil · ↑ ↓ vaker of minder vaak in de laatste weken</p>';
  }
  function whenMap(list, filter) {
    var m = DAYS.map(function () { return [0, 0, 0, 0]; }), any = false;
    list.forEach(function (d) {
      if (filter && !sw(d).some(function (t) { return t.k === filter; })) return;
      var dd = dateOf(d.datum), p = partOf(d.tijd); if (!dd || p == null) return;
      m[(dd.getDay() + 6) % 7][p]++; any = true;
    });
    if (!any) return '<p class="muted small">Nog geen feiten met datum en tijd' + (filter ? ' bij een ' + (filter === 'w' ? 'valkuil' : 'sterkte') : '') + '.</p>';
    var max = Math.max.apply(null, m.map(function (r) { return Math.max.apply(null, r); }).concat([1]));
    return '<table class="kma-heat-table kma-when"><thead><tr><td></td>' + PARTS.map(function (p) { return '<th>' + p.l + '</th>'; }).join('') + '</tr></thead><tbody>' +
      DAYS.map(function (day, i) { return '<tr><th>' + day + '</th>' + m[i].map(function (n) { return heatCell(n, max, filter || 'all'); }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  function vMatrix(list) {
    var tags = used(list); if (!tags.length) return '';
    var rows = tags.map(function (t) { return { t: t, c: VS.map(function (v) { return list.filter(function (d) { return arr(d.vValues || d.v4).indexOf(v) >= 0 && sw(d).some(function (x) { return tagKey(x) === tagKey(t); }); }).length; }) }; });
    var max = Math.max.apply(null, rows.map(function (r) { return Math.max.apply(null, r.c); }).concat([1]));
    return '<table class="kma-heat-table kma-vx"><thead><tr><td></td>' + VS.map(function (v) { return '<th title="' + v + '">' + (window.kmaVIcon ? kmaVIcon(v) : '') + '<span>' + v.slice(0, 4) + '.</span></th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><th class="kma-heat-lab ' + r.t.k + '"><i>' + (r.t.k === 's' ? 'S' : 'V') + '</i>' + esc(r.t.t) + '</th>' + r.c.map(function (n) { return heatCell(n, max, r.t.k); }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  }
  /** Short signals for cadet and instructor. */
  function signals(list, now) {
    var out = [], t0 = (now ? new Date(now) : new Date()).getTime(), DAY = 864e5;
    used(list).forEach(function (t) {
      var recent = list.filter(function (d) { var dd = dateOf(d.datum); return dd && t0 - dd.getTime() <= 14 * DAY && t0 - dd.getTime() >= -DAY && sw(d).some(function (x) { return tagKey(x) === tagKey(t); }); }).length;
      if (t.k === 'w' && recent >= 3) out.push({ kind: 'w', text: 'Valkuil "' + t.t + '" kwam ' + recent + '× voor in de laatste 2 weken.' });
      if (t.k === 's' && recent >= 3) out.push({ kind: 's', text: 'Sterkte "' + t.t + '" ' + recent + '× gezien in de laatste 2 weken.' });
    });
    // hotspot for valkuilen
    var cells = {}, tot = 0;
    list.forEach(function (d) {
      if (!sw(d).some(function (t) { return t.k === 'w'; })) return;
      var dd = dateOf(d.datum), p = partOf(d.tijd); if (!dd || p == null) return;
      var k = ((dd.getDay() + 6) % 7) + ':' + p; cells[k] = (cells[k] || 0) + 1; tot++;
    });
    Object.keys(cells).forEach(function (k) {
      if (cells[k] >= 3 && cells[k] / tot >= 0.4) { var a = k.split(':'); out.push({ kind: 'w', text: 'Valkuilgedrag vooral op ' + ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'][+a[0]] + PARTS[+a[1]].l + ' (' + cells[k] + ' van ' + tot + ').' }); }
    });
    return out;
  }
  function signalsHtml(list) {
    var s = signals(list);
    return s.length ? '<div class="kma-signals">' + s.map(function (x) { return '<div class="kma-signal ' + x.kind + '">' + (window.kmaIcon ? kmaIcon(x.kind === 'w' ? 'alert' : 'check') : '') + '<span>' + esc(x.text) + '</span></div>'; }).join('') + '</div>' : '';
  }
  /** All pattern blocks for a DTF list. */
  function patternsHtml(list, opts) {
    opts = opts || {};
    list = arr(list);
    var weeks = lastWeeks(8);
    var tagged = list.filter(function (d) { return sw(d).length; }).length;
    return '<div class="kma-patterns">' + signalsHtml(list) +
      details((opts.prefix || '') + 'map', (window.kmaIcon ? kmaIcon('chart') : '') + 'Patroonkaart: sterktes en valkuilen per week <em>' + tagged + ' gekoppeld</em>', patternMap(list, weeks), opts.open) +
      details((opts.prefix || '') + 'when', (window.kmaIcon ? kmaIcon('clock') : '') + 'Wanneer gebeurt het? Weekdag × dagdeel',
        '<div class="kma-when-grid"><div><h6>Valkuilen</h6>' + whenMap(list, 'w') + '</div><div><h6>Sterktes</h6>' + whenMap(list, 's') + '</div><div><h6>Alle feiten</h6>' + whenMap(list, null) + '</div></div>', false) +
      (used(list).length ? details((opts.prefix || '') + 'vx', (window.kmaIcon ? kmaIcon('target') : '') + "4 V's × sterktes en valkuilen", vMatrix(list), false) : '') + '</div>';
  }

  /* ---------------- Week in samenhang ---------------- */
  function caseDate(c) { var n = Number(c && c.id); return n > 1e12 ? new Date(n) : null; }
  function weekSummary(src, n) {
    var weeks = lastWeeks(n || 6);
    return weeks.map(function (w) {
      var inW = function (d) { return d && mondayKey(d) === w.key; };
      var fit = arr(src.fitness).filter(function (l) { return inW(dateOf(String(l.date).slice(0, 10))); });
      var avg = function (k) { var v = fit.map(function (l) { return Number(l[k]); }).filter(function (x) { return !isNaN(x); }); return v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10 : null; };
      var dtf = arr(src.dtf).filter(function (d) { return inW(dateOf(d.datum)); });
      var emo = []; arr(src.cases5GT).forEach(function (c) { if (inW(caseDate(c))) arr(c.emoties).forEach(function (e) { emo.push(Number(e.intensiteit)); }); });
      return { label: w.label, sleep: avg('sleep'), body: avg('body'), mind: avg('mind'), dtf: dtf.length, w: dtf.filter(function (d) { return sw(d).some(function (t) { return t.k === 'w'; }); }).length,
        s: dtf.filter(function (d) { return sw(d).some(function (t) { return t.k === 's'; }); }).length, emo: emo.length ? Math.round(emo.reduce(function (a, b) { return a + b; }, 0) / emo.length * 10) / 10 : null };
    });
  }
  function weekSummaryHtml(src) {
    var rows = weekSummary(src, 6);
    if (!rows.some(function (r) { return r.sleep != null || r.dtf || r.emo != null; })) return '<p class="muted small">Nog te weinig gegevens: vul je fitheid, DTF-feiten en 5G-T-emoties in, dan zie je hier per week hoe ze samenhangen.</p>';
    var bar = function (v, max, cls) { return v == null ? '<span class="muted">-</span>' : '<span class="kma-mbar ' + cls + '"><i style="width:' + Math.round(Math.min(1, v / max) * 100) + '%"></i></span><b>' + v + '</b>'; };
    var note = '';
    var bad = rows.filter(function (r) { return (r.sleep != null && r.sleep <= 4) || (r.mind != null && r.mind >= 7); });
    if (bad.length) {
      var wBad = bad.reduce(function (a, r) { return a + r.w; }, 0), good = rows.filter(function (r) { return bad.indexOf(r) < 0 && r.sleep != null; }), wGood = good.reduce(function (a, r) { return a + r.w; }, 0);
      if (wBad && bad.length && (wBad / bad.length) > (good.length ? wGood / good.length : 0)) note = '<div class="kma-signal w">' + (window.kmaIcon ? kmaIcon('alert') : '') + '<span>In weken met weinig slaap of hoge druk legde je meer valkuilgedrag vast. Iets om op te letten.</span></div>';
    }
    return note + '<div class="kma-heat-wrap" tabindex="0" role="group" aria-label="Overzicht per week, schuif opzij voor meer weken"><table class="kma-week-table"><thead><tr><th>Week</th><th>Slaap</th><th>Mentale druk</th><th>DTF</th><th>Emotie (5G-T)</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><th>' + esc(r.label) + '</th><td>' + bar(r.sleep, 10, 'sleep') + '</td><td>' + bar(r.mind, 10, 'mind') + '</td><td>' + (r.dtf ? r.dtf + (r.s || r.w ? ' <small><i class="kma-key s"></i>' + r.s + ' <i class="kma-key w"></i>' + r.w + '</small>' : '') : '<span class="muted">-</span>') +
          '</td><td>' + bar(r.emo, 10, 'emo') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* ---------------- SMART check-ins ---------------- */
  var CHECK = { 2: { l: 'Gelukt', c: 'ok' }, 1: { l: 'Deels', c: 'half' }, 0: { l: 'Niet gelukt', c: 'no' } };
  function checkinStrip(list, n) {
    var weeks = lastWeeks(n || 12), by = {};
    arr(list).forEach(function (x) { if (x.week) by[x.week] = x; });
    var streak = 0;
    for (var i = weeks.length - 1; i >= 0; i--) { var x = by[weeks[i].key]; if (x && CHECK[x.r] && x.r >= 1) streak++; else if (i < weeks.length - 1 || x) break; }
    return '<div class="kma-checkins">' + weeks.map(function (w) {
      var x = by[w.key]; if (x && !CHECK[x.r]) x = null;
      return '<span class="kma-ci ' + (x ? CHECK[x.r].c : 'none') + '" title="' + esc(w.label + (x ? ': ' + CHECK[x.r].l + (x.note ? ': ' + x.note : '') : ': geen check-in')) + '"><i></i><small>' + esc(w.label.replace('wk ', '')) + '</small></span>';
    }).join('') + '</div><p class="muted small">' + (streak ? streak + (streak === 1 ? ' week' : ' weken') + ' op rij (deels) gelukt' : 'Nog geen reeks') + ' · groen = gelukt, geel = deels, rood = niet gelukt</p>';
  }
  function thisWeekKey() { return mondayKey(new Date()); }

  window.KMAPatterns = {
    tagsFrom: tagsFrom, suggest: suggest, used: used, tagKey: tagKey, patternsHtml: patternsHtml, signals: signals, signalsHtml: signalsHtml,
    weekSummary: weekSummary, weekSummaryHtml: weekSummaryHtml, checkinStrip: checkinStrip, thisWeekKey: thisWeekKey, CHECK: CHECK, details: details, lastWeeks: lastWeeks
  };
})();
