/*
 * KMA visuals: small SVG drawings shared by both apps (no libraries, works offline).
 * Every function returns an SVG string. Colours follow the page theme through CSS variables.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var GOLD = 'var(--accent-gold)', RED = 'var(--accent-red)', INK = 'var(--text-primary)', MUTED = 'var(--text-muted)', LINE = 'var(--border-color)';
  var BLUE = '#5b9bd5', GREEN = '#3fa66b';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function svg(w, h, body, label) {
    return '<svg class="kv" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label || '') + '" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
  }
  function txt(x, y, s, opts) {
    opts = opts || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (opts.size || 12) + '" fill="' + (opts.fill || INK) + '" text-anchor="' + (opts.anchor || 'start') + '"' +
      (opts.weight ? ' font-weight="' + opts.weight + '"' : '') + '>' + esc(s) + '</text>';
  }

  /** Radar (hexagon) chart. axes: [labels]; series: [{values:[0-100|null], color, label, dashed}] */
  function radar(axes, series, opts) {
    opts = opts || {};
    var W = 340, H = 300, cx = W / 2, cy = 150, R = 105, n = axes.length, out = '';
    var pt = function (i, v) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
    [25, 50, 75, 100].forEach(function (lvl) {
      var pts = axes.map(function (_, i) { return pt(i, lvl).join(','); }).join(' ');
      out += '<polygon points="' + pts + '" fill="none" stroke="' + LINE + '" stroke-width="' + (lvl === 50 ? 1.2 : 0.8) + '"' + (lvl === 50 ? ' stroke-dasharray="3 3"' : '') + '/>';
    });
    axes.forEach(function (label, i) {
      var p = pt(i, 100), l = pt(i, 122);
      out += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" stroke="' + LINE + '" stroke-width="0.8"/>';
      var anchor = Math.abs(l[0] - cx) < 8 ? 'middle' : (l[0] < cx ? 'end' : 'start');
      out += txt(l[0], l[1] + 4, label, { size: 12, anchor: anchor, weight: 600 });
    });
    series.forEach(function (s) {
      if (!s.values || s.values.every(function (v) { return v == null; })) return;
      var pts = s.values.map(function (v, i) { return pt(i, v == null ? 0 : v).join(','); }).join(' ');
      out += '<polygon points="' + pts + '" fill="' + s.color + '" fill-opacity="' + (s.dashed ? 0.06 : 0.18) + '" stroke="' + s.color + '" stroke-width="2"' + (s.dashed ? ' stroke-dasharray="5 4"' : '') + '/>';
      s.values.forEach(function (v, i) { if (v == null) return; var p = pt(i, v); out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.2" fill="' + s.color + '"/>'; });
    });
    return svg(W, H, out, opts.label || 'Persoonlijkheidsprofiel');
  }

  /** Line chart. series: [{label, color, values:[number|null]}], xLabels: [..], yMin, yMax */
  function lineChart(xLabels, series, opts) {
    opts = opts || {};
    var W = 340, H = 190, L = 30, Rr = 12, T = 14, B = 34, yMin = opts.yMin != null ? opts.yMin : 0, yMax = opts.yMax != null ? opts.yMax : 10;
    var n = Math.max(xLabels.length, 1), out = '';
    var X = function (i) { return n === 1 ? (L + W - Rr) / 2 : L + i * (W - L - Rr) / (n - 1); };
    var Y = function (v) { return T + (yMax - v) * (H - T - B) / (yMax - yMin); };
    (opts.ticks || [yMin, (yMin + yMax) / 2, yMax]).forEach(function (t) {
      out += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="' + LINE + '" stroke-width="0.8"' + (t === 0 && yMin < 0 ? '' : ' stroke-dasharray="2 3"') + '/>';
      out += txt(L - 6, Y(t) + 4, t, { size: 10.5, anchor: 'end', fill: MUTED });
    });
    var step = Math.ceil(n / 6);
    xLabels.forEach(function (l, i) { if (i % step === 0 || i === n - 1) out += txt(X(i), H - 14, l, { size: 10.5, anchor: 'middle', fill: MUTED }); });
    series.forEach(function (s) {
      var d = '', started = false;
      s.values.forEach(function (v, i) { if (v == null) { if (!opts.connect) started = false; return; } d += (started ? 'L' : 'M') + X(i) + ' ' + Y(v); started = true; });
      out += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>';
      s.values.forEach(function (v, i) { if (v != null) out += '<circle cx="' + X(i) + '" cy="' + Y(v) + '" r="' + (opts.dot || 3) + '" fill="' + s.color + '"><title>' + esc((s.label ? s.label + ': ' : '') + v) + '</title></circle>'; });
    });
    return svg(W, H, out, opts.label || 'Lijngrafiek');
  }

  function legend(series) {
    return '<div class="kv-legend">' + series.map(function (s) {
      return '<span><i style="background:' + s.color + (s.dashed ? ';opacity:.55' : '') + '"></i>' + esc(s.label) + '</span>';
    }).join('') + '</div>';
  }

  /** Horizontal bars: items [{label, value, max, color}] */
  function hbars(items, opts) {
    opts = opts || {};
    var W = 340, rowH = 30, H = items.length * rowH + 6, out = '', hasV = window.kmaVIcon && items.some(function (i) { return kmaVIcon(i.label); }), labelW = opts.labelW || (hasV ? 160 : 140);
    var max = opts.max || Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    items.forEach(function (it, i) {
      var y = 4 + i * rowH, w = (W - labelW - 40) * (it.value / max);
      out += txt(labelW - 8, y + 18, it.label, { size: 12, anchor: 'end' });
      var vi = window.kmaVIcon ? kmaVIcon(it.label) : '';
      if (vi) out += vi.replace('<svg ', '<svg x="0" y="' + (y + 7) + '" width="20" height="15" style="color:' + GOLD + '" ');
      out += '<rect x="' + labelW + '" y="' + (y + 6) + '" width="' + (W - labelW - 40) + '" height="16" rx="8" fill="' + LINE + '" fill-opacity="0.5"/>';
      out += '<rect x="' + labelW + '" y="' + (y + 6) + '" width="' + Math.max(w, it.value > 0 ? 6 : 0) + '" height="16" rx="8" fill="' + (it.color || GOLD) + '"/>';
      out += txt(W - 32, y + 18, it.value, { size: 12, weight: 700 });
    });
    return svg(W, H, out, opts.label || 'Staafdiagram');
  }

  /** Semicircle gauge */
  function gauge(value, max, opts) {
    opts = opts || {};
    var W = 220, H = 128, cx = 110, cy = 112, r = 88, frac = Math.max(0, Math.min(1, value / max));
    var arc = function (f) { var a = Math.PI * (1 - f); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
    var e = arc(frac), out = '';
    out += '<path d="M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy + '" fill="none" stroke="' + LINE + '" stroke-width="16" stroke-linecap="round"/>';
    if (frac > 0) out += '<path d="M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + e[0] + ' ' + e[1] + '" fill="none" stroke="' + (opts.color || GOLD) + '" stroke-width="16" stroke-linecap="round"/>';
    out += txt(cx, cy - 14, value + ' / ' + max, { size: 26, anchor: 'middle', weight: 700 });
    if (opts.caption) out += txt(cx, cy + 10, opts.caption, { size: 11, anchor: 'middle', fill: MUTED });
    return svg(W, H + 8, out, opts.label || 'Meter');
  }

  /** Balance scale: left (draagkracht) vs right (draaglast), 0..10 */
  function balance(left, right, opts) {
    opts = opts || {};
    var W = 320, H = 170, cx = 160, py = 58, diff = (right - left), ang = Math.max(-18, Math.min(18, diff * 3)), out = '';
    var rad = ang * Math.PI / 180, arm = 110;
    var lx = cx - arm * Math.cos(rad), ly = py - arm * Math.sin(rad), rx = cx + arm * Math.cos(rad), ry = py + arm * Math.sin(rad);
    out += '<path d="M' + (cx - 30) + ' 150 L' + cx + ' ' + (py + 6) + ' L' + (cx + 30) + ' 150 Z" fill="' + LINE + '" fill-opacity="0.6"/>';
    out += '<line x1="' + lx + '" y1="' + ly + '" x2="' + rx + '" y2="' + ry + '" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>';
    out += '<circle cx="' + cx + '" cy="' + py + '" r="5" fill="' + INK + '"/>';
    var pan = function (x, y, val, color, label) {
      return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 30) + '" stroke="' + MUTED + '"/>' +
        '<path d="M' + (x - 38) + ' ' + (y + 30) + ' Q' + x + ' ' + (y + 54) + ' ' + (x + 38) + ' ' + (y + 30) + ' Z" fill="' + color + '" fill-opacity="0.25" stroke="' + color + '" stroke-width="2"/>' +
        txt(x, y + 45, val, { size: 15, anchor: 'middle', weight: 700 }) + txt(x, y - 8, label, { size: 11.5, anchor: 'middle', fill: MUTED });
    };
    out += pan(lx, ly, left, GREEN, 'Draagkracht') + pan(rx, ry, right, RED, 'Draaglast');
    return svg(W, H, out, 'Balans draagkracht en draaglast');
  }

  /** Cycle (ALACT): steps [{label}], active index, done flags. Labels sit under (or above) each node so nothing is cut off. */
  function cycle(steps, active, done, opts) {
    opts = opts || {};
    var W = 380, H = 300, cx = 190, cy = 150, R = 92, n = steps.length, out = '';
    out += '<defs><marker id="kv-cyc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="' + MUTED + '"/></marker></defs>';
    var pos = function (i) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };
    for (var i = 0; i < n; i++) {
      var a1 = -Math.PI / 2 + i * 2 * Math.PI / n + 0.34, a2 = -Math.PI / 2 + (i + 1) * 2 * Math.PI / n - 0.34;
      out += '<path d="M' + (cx + R * Math.cos(a1)) + ' ' + (cy + R * Math.sin(a1)) + ' A' + R + ' ' + R + ' 0 0 1 ' + (cx + R * Math.cos(a2)) + ' ' + (cy + R * Math.sin(a2)) + '" fill="none" stroke="' + MUTED + '" stroke-width="1.4"' + (i === n - 1 ? ' stroke-dasharray="4 4"' : '') + ' marker-end="url(#kv-cyc)"/>';
    }
    steps.forEach(function (s, i) {
      var p = pos(i), on = i === active, ok = done && done[i];
      out += '<g class="kv-node" data-step="' + i + '" style="cursor:pointer">' +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="24" fill="' + (on || ok ? GOLD : 'var(--bg-card, var(--bg-widget))') + '" fill-opacity="' + (on ? 1 : (ok ? 0.3 : 1)) + '" stroke="' + (on || ok ? GOLD : LINE) + '" stroke-width="2"/>' +
        txt(p[0], p[1] + 5, String(i + 1), { size: 15, anchor: 'middle', weight: 700, fill: on ? '#111a14' : INK }) +
        (Math.abs(p[0] - cx) < 20
          ? txt(p[0], p[1] < cy ? p[1] - 32 : p[1] + 42, s.label, { size: 11.5, anchor: 'middle', weight: on ? 700 : 400, fill: on ? INK : MUTED })
          : txt(p[0] < cx ? p[0] - 30 : p[0] + 30, p[1] + 4, s.label, { size: 11.5, anchor: p[0] < cx ? 'end' : 'start', weight: on ? 700 : 400, fill: on ? INK : MUTED })) + '</g>';
    });
    if (opts.center) out += txt(cx, cy + 4, opts.center, { size: 12, anchor: 'middle', fill: MUTED });
    return svg(W, H, out, opts.label || 'Cyclus');
  }

  /** Step chain: steps [{short, label}], active, done flags → HTML (tappable) */
  function chain(steps, active, done) {
    return '<div class="kv-chain" role="tablist">' + steps.map(function (s, i) {
      return '<button type="button" role="tab" class="kv-chain-step' + (i === active ? ' active' : '') + (done && done[i] ? ' done' : '') + '" data-step="' + i + '" aria-selected="' + (i === active) + '" title="' + esc(s.label) + '">' +
        '<span class="kv-chain-dot">' + esc(s.short) + '</span><span class="kv-chain-label">' + esc(s.label) + '</span></button>';
    }).join('<span class="kv-chain-link"></span>') + '</div>';
  }

  /** Support circle: people [{name, role, ring 1..3}] */
  function supportCircle(people, centerLabel) {
    var W = 340, H = 340, cx = 170, cy = 170, radii = [62, 110, 156], out = '';
    radii.slice().reverse().forEach(function (r, i) {
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + GOLD + '" fill-opacity="' + (0.05 + i * 0.05) + '" stroke="' + LINE + '"/>';
    });
    out += '<circle cx="' + cx + '" cy="' + cy + '" r="24" fill="' + GOLD + '"/>' + txt(cx, cy + 4, centerLabel || 'Ik', { size: 12, anchor: 'middle', weight: 700, fill: '#111a14' });
    var byRing = { 1: [], 2: [], 3: [] };
    people.forEach(function (p) { (byRing[p.ring] || byRing[3]).push(p); });
    [1, 2, 3].forEach(function (ring) {
      var list = byRing[ring], r = [44, 88, 134][ring - 1];
      list.forEach(function (p, i) {
        var a = -Math.PI / 2 + (i + (ring % 2 ? 0 : 0.5)) * 2 * Math.PI / Math.max(list.length, 1);
        var x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
        out += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="' + (ring === 1 ? GREEN : ring === 2 ? GOLD : MUTED) + '"/>';
        out += txt(x, y - 11, p.name, { size: 11, anchor: 'middle', weight: 600 });
      });
    });
    return svg(W, H, out, 'Steuncirkel');
  }

  /** 2×2 matrix of tiles is HTML; V × niveau grid */
  function vMatrix(rows) {
    // rows: [{label, n1, n2}] with 0/1/2 or null
    var cls = function (v) { return v == null ? 'none' : ('s' + v); };
    return '<div class="kv-matrix"><div></div><div class="kv-mh">Niveau 1</div><div class="kv-mh">Niveau 2</div>' +
      rows.map(function (r) {
        return '<div class="kv-mr">' + (window.kmaVIcon ? kmaVIcon(r.label) : '') + esc(r.label).replace('Verantwoordelijkheid', 'Verantwoorde&shy;lijkheid') + '</div><div class="kv-mc ' + cls(r.n1) + '">' + (r.n1 == null ? '-' : r.n1) + '</div><div class="kv-mc ' + cls(r.n2) + '">' + (r.n2 == null ? '-' : r.n2) + '</div>';
      }).join('') + '</div>';
  }

  window.KMAViz = { radar: radar, lineChart: lineChart, legend: legend, hbars: hbars, gauge: gauge, balance: balance, cycle: cycle, chain: chain, supportCircle: supportCircle, vMatrix: vMatrix, esc: esc, colors: { gold: GOLD, red: RED, blue: BLUE, green: GREEN, muted: MUTED } };
})();
