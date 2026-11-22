/*
 * Roos van Leary (4.16.0, blok B stap 1): gedeelde module voor het Reflectieboekje en het CadetVolgSysteem.
 * Opslag per item: leary = { b, s } met twee asscores van -2 tot +2 (b = boven/onder, s = samen/tegen).
 * De sector (octant) wordt daaruit afgeleid; de assen zijn wetenschappelijk steviger dan de acht sectoren (Wiggins 1979).
 * Kiezen gaat met een roos van 8 sectoren x 2 ringen (licht = 1, duidelijk = 2). Altijd optioneel.
 * Overzichten tonen alleen verdelingen vanaf MIN (5) items per bron: één kaart van één beoordelaar zegt weinig.
 * De koppeling met de 4V's wordt NIET in de gegevens vastgelegd (de V kiest de gebruiker zelf).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var MIN = 5;
  // hoek in graden: 0 = samen (rechts), 90 = boven; klok tegen in
  var SECT = [
    { k: 'helpend', n: 'Helpend', a: 22.5, d: 'Steunt, geeft hulp en advies, neemt anderen iets uit handen.', lokt: 'aanleunend of volgend gedrag' },
    { k: 'leidend', n: 'Leidend', a: 67.5, d: 'Neemt initiatief, geeft richting en beslist.', lokt: 'volgend gedrag' },
    { k: 'concurrerend', n: 'Concurrerend', a: 112.5, d: 'Wil winnen of gelijk krijgen, laat de eigen prestatie zien.', lokt: 'opstandig of teruggetrokken gedrag' },
    { k: 'aanvallend', n: 'Aanvallend', a: 157.5, d: 'Bekritiseert, stelt harde grenzen, valt aan.', lokt: 'opstandig of teruggetrokken gedrag' },
    { k: 'opstandig', n: 'Opstandig', a: 202.5, d: 'Gaat ertegenin, wantrouwt, zegt kritisch wat niet klopt.', lokt: 'aanvallend gedrag' },
    { k: 'teruggetrokken', n: 'Teruggetrokken', a: 247.5, d: 'Houdt zich afzijdig, zegt weinig, wacht af.', lokt: 'aanvallend of concurrerend gedrag' },
    { k: 'volgend', n: 'Volgend', a: 292.5, d: 'Voert uit wat gevraagd wordt, vraagt om richting.', lokt: 'leidend gedrag' },
    { k: 'meewerkend', n: 'Meewerkend', a: 337.5, d: 'Doet mee, zoekt aansluiting en overeenstemming.', lokt: 'helpend of meewerkend gedrag' }
  ];
  var BY = {}; SECT.forEach(function (x) { BY[x.k] = x; });
  var R = Math.PI / 180;
  function num(x) { var n = Number(x); return isFinite(n) ? Math.max(-2, Math.min(2, Math.round(n * 100) / 100)) : null; }
  /** Schoon een opgeslagen waarde; geeft null bij iets onbruikbaars (ook {0,0}). */
  function clean(v) {
    if (!v || typeof v !== 'object') return null;
    var b = num(v.b), s = num(v.s);
    if (b === null || s === null || (b === 0 && s === 0)) return null;
    return { b: b, s: s };
  }
  function fromSector(k, i) {
    var x = BY[k]; if (!x) return null; i = i === 1 ? 1 : 2;
    return { b: Math.round(Math.sin(x.a * R) * i * 100) / 100, s: Math.round(Math.cos(x.a * R) * i * 100) / 100 };
  }
  function sector(v) {
    v = clean(v); if (!v) return null;
    var a = Math.atan2(v.b, v.s) / R; if (a < 0) a += 360;
    return SECT[Math.floor(a / 45) % 8];
  }
  function intensity(v) { v = clean(v); return v ? (Math.sqrt(v.b * v.b + v.s * v.s) > 1.5 ? 2 : 1) : 0; }
  function label(v) { var x = sector(v); return x ? x.n + (intensity(v) === 1 ? ' (licht)' : '') : ''; }

  /** Verdeling over de sectoren + gemiddelde assen. items: [{leary}] of [{b,s}] */
  function dist(list) {
    var c = {}, n = 0, sb = 0, ss = 0;
    SECT.forEach(function (x) { c[x.k] = 0; });
    (list || []).forEach(function (it) {
      var v = clean(it && it.leary !== undefined ? it.leary : it); if (!v) return;
      c[sector(v).k]++; n++; sb += v.b; ss += v.s;
    });
    return { counts: c, n: n, b: n ? Math.round(sb / n * 100) / 100 : 0, s: n ? Math.round(ss / n * 100) / 100 : 0, ok: n >= MIN };
  }

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function pt(a, r) { return (Math.cos(a * R) * r).toFixed(1) + ' ' + (-Math.sin(a * R) * r).toFixed(1); }
  function wedge(a0, a1, r0, r1) {
    return 'M' + pt(a0, r0) + ' L' + pt(a0, r1) + ' A' + r1 + ' ' + r1 + ' 0 0 0 ' + pt(a1, r1) + ' L' + pt(a1, r0) + (r0 ? ' A' + r0 + ' ' + r0 + ' 0 0 1 ' + pt(a0, r0) : '') + ' Z';
  }
  function axes() {
    return '<g class="kma-leary-ax"><line x1="-104" y1="0" x2="104" y2="0"/><line x1="0" y1="-104" x2="0" y2="104"/>' +
      '<text x="0" y="-108" text-anchor="middle">BOVEN</text><text x="0" y="117" text-anchor="middle">ONDER</text>' +
      '<text x="-110" y="4" text-anchor="end">TEGEN</text><text x="110" y="4" text-anchor="start">SAMEN</text></g>';
  }
  function labels() {
    // boven en onder iets verder naar opzij, zodat de namen niet over BOVEN en ONDER vallen
    return SECT.map(function (x) { var c = Math.cos(x.a * R), sn = Math.sin(x.a * R), px = c * (Math.abs(sn) > 0.9 ? 150 : 128), py = -sn * 120 + 4;
      return '<text class="kma-leary-lab" x="' + px.toFixed(1) + '" y="' + py.toFixed(1) + '" text-anchor="middle">' + x.n + '</text>'; }).join('');
  }

  /** Kiezer: SVG-roos met 16 tikvlakken. Waarde staat in data-leary op het element .kma-leary-pick. */
  function picker(id, val, title) {
    val = clean(val); var cur = val ? sector(val).k : '', ci = intensity(val);
    var w = SECT.map(function (x) {
      return [1, 2].map(function (i) {
        var on = cur === x.k && ci === i;
        return '<path class="kma-leary-w' + (on ? ' on' : '') + '" data-lk="' + x.k + '" data-li="' + i + '" d="' + wedge(x.a - 22.5, x.a + 22.5, i === 1 ? 0 : 52, i === 1 ? 52 : 100) + '" role="button" tabindex="0" aria-label="' + x.n + (i === 1 ? ', licht' : ', duidelijk') + '"><title>' + x.n + (i === 1 ? ' (licht)' : '') + '</title></path>';
      }).join('');
    }).join('');
    return '<div class="kma-leary-pick" id="' + esc(id) + '" data-leary="' + esc(val ? JSON.stringify(val) : '') + '">' +
      '<div class="kma-leary-head"><span>' + esc(title || 'Roos van Leary (optioneel)') + '</span><b class="kma-leary-cur">' + esc(val ? label(val) : 'Niet gekozen') + '</b>' +
      '<button type="button" class="kma-chip-btn small" data-leary-clear' + (val ? '' : ' hidden') + '>Wissen</button></div>' +
      '<svg viewBox="-160 -135 320 262" class="kma-leary-svg" aria-label="Kies een plek op de roos">' + axes() + w + labels() + '</svg>' +
      '<p class="muted small">Binnenring: een beetje. Buitenring: duidelijk. Kies het gedrag dat je zag, niet de persoon.</p></div>';
  }
  function value(el) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (!el) return null;
    try { return clean(JSON.parse(el.getAttribute('data-leary') || 'null')); } catch (e) { return null; }
  }
  function setPick(el, v) {
    v = clean(v); el.setAttribute('data-leary', v ? JSON.stringify(v) : '');
    var k = v ? sector(v).k : '', i = intensity(v);
    el.querySelectorAll('.kma-leary-w').forEach(function (p) { p.classList.toggle('on', p.getAttribute('data-lk') === k && Number(p.getAttribute('data-li')) === i); });
    var c = el.querySelector('.kma-leary-cur'); if (c) c.textContent = v ? label(v) : 'Niet gekozen';
    var b = el.querySelector('[data-leary-clear]'); if (b) b.hidden = !v;
  }
  function onPick(e) {
    var w = e.target.closest && e.target.closest('.kma-leary-w'), el;
    if (w) {
      el = w.closest('.kma-leary-pick'); if (!el) return;
      var nv = fromSector(w.getAttribute('data-lk'), Number(w.getAttribute('data-li'))), old = value(el);
      setPick(el, old && nv && old.b === nv.b && old.s === nv.s ? null : nv);
      return;
    }
    var cl = e.target.closest && e.target.closest('[data-leary-clear]');
    if (cl && (el = cl.closest('.kma-leary-pick'))) setPick(el, null);
  }
  document.addEventListener('click', onPick);
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('kma-leary-w')) { e.preventDefault(); onPick(e); } });

  /** Roos-diagram: per sector het aandeel van bron A (gevuld) en bron B (lijn). Alleen bronnen met ok=true tekenen. */
  function rose(a, b, opt) {
    opt = opt || {};
    var max = 0;
    [a, b].forEach(function (d) { if (d && d.ok) SECT.forEach(function (x) { max = Math.max(max, d.counts[x.k] / d.n); }); });
    var g = function (d, cls) {
      if (!d || !d.ok || !max) return '';
      return SECT.map(function (x) { var r = 100 * Math.sqrt(d.counts[x.k] / d.n / max); return r > 0.5 ? '<path class="' + cls + '" d="' + wedge(x.a - 21, x.a + 21, 0, r) + '"><title>' + x.n + ': ' + d.counts[x.k] + ' van ' + d.n + '</title></path>' : ''; }).join('') +
        '<circle class="' + cls + '-m" cx="' + (d.s * 50).toFixed(1) + '" cy="' + (-d.b * 50).toFixed(1) + '" r="5"><title>Gemiddelde plek</title></circle>';
    };
    var grid = [33, 66, 100].map(function (r) { return '<circle class="kma-leary-grid" r="' + r + '"/>'; }).join('') +
      SECT.map(function (x) { var p = pt(x.a - 22.5, 100).split(' '); return '<line class="kma-leary-grid" x1="0" y1="0" x2="' + p[0] + '" y2="' + p[1] + '"/>'; }).join('');
    return '<svg viewBox="-160 -135 320 262" class="kma-leary-rose" role="img" aria-label="' + esc(opt.label || 'Roos van Leary: verdeling') + '">' + grid + axes() + g(a, 'kma-leary-a') + g(b, 'kma-leary-b') + labels() + '</svg>';
  }
  /** Gemiddelde op beide assen als twee balkjes (-2..+2). */
  function axisBars(d, name) {
    if (!d || !d.ok) return '';
    var bar = function (v, l, r) { var x = 50 + v * 25; return '<div class="kma-leary-axis"><span>' + l + '</span><i><b style="left:' + x.toFixed(0) + '%"></b></i><span>' + r + '</span></div>'; };
    return '<div class="kma-leary-axes"><small>' + esc(name) + '</small>' + bar(d.b, 'Onder', 'Boven') + bar(d.s, 'Tegen', 'Samen') + '</div>';
  }
  function dot(v) { var x = sector(v); return x ? '<span class="kma-leary-dot" title="Leary: ' + esc(label(v)) + '" data-s="' + x.k + '">' + x.n.charAt(0) + '</span>' : ''; }

  /** Venster om bij een bestaand item de plek op de roos te kiezen of te wissen. onSave(waarde of null). */
  function edit(val, title, onSave) {
    var ov = document.createElement('div'); ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet" role="dialog" aria-modal="true" aria-label="Roos van Leary" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<div class="kma-sheet-title">' + esc(title || 'Plek op de roos') + '</div><div class="kma-code-body">' + picker('kma-leary-edit', val, 'Welk gedrag zag je?') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-le="x">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-le="ok">Opslaan</button></div></div></div>';
    var close = function () { ov.remove(); };
    ov.__kmaClose = close;
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var b = e.target.closest('[data-le]'); if (!b) return;
      if (b.getAttribute('data-le') === 'ok') { var v = value('kma-leary-edit'); close(); onSave(v); } else close();
    });
    document.body.appendChild(ov);
    return ov;
  }

  window.KMALeary = { edit: edit, MIN: MIN, SECT: SECT, clean: clean, fromSector: fromSector, sector: sector, intensity: intensity, label: label,
    dist: dist, picker: picker, value: value, set: setPick, rose: rose, axisBars: axisBars, dot: dot };
})();
