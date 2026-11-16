/*
 * 5G-T reflectiemodel (KMA): shared by the Reflectieboekje and the CadetVolgSysteem.
 * Four steps, as in the "5G-T reflectiemodel: Reflectiemodel cadetten" booklet:
 *   Stap 1  5G: Gebeurtenis, Gevoel, Gedachtes, Gedrag, Gevolg
 *   Stap 2  Verdieping in gedachte (11 vragen)
 *   Stap 3  Invloed (cirkel van invloed, 4 vragen)
 *   Stap 4  Toekomst (6 vragen): replaces the old Inzichten / Leervraag / Actieplan
 * Older reflections (inzichten, leervraag, actieplan) are moved into Stap 4 by migrate().
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var VS = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'];
  var MOMENTS = ['Vooraf', 'Tijdens', 'Achteraf'];

  /* Each node of the step chain; `q` are its questions (field, label, hint, kind). */
  var NODES = [
    { id: 'g1', short: 'G1', label: 'Gebeurtenis', stap: 1, q: [
      { f: 'gebeurtenis', l: 'Gebeurtenis', d: 'Beschrijf in chronologische volgorde het feitelijke fenomeen dat heeft plaatsgevonden. Probeer jezelf zoveel mogelijk te distantiëren van de context, zodat je zo objectief mogelijk blijft.' }] },
    { id: 'g2', short: 'G2', label: 'Gevoel', stap: 1, q: [
      { f: 'gevoelens', l: 'Gevoel', d: 'Beschrijf welke emoties je hebt gevoeld. Onderscheid wanneer je ze ervoer (vooraf, tijdens of achteraf) en geef de intensiteit een cijfer van 1 tot 10. Gebruik het emotiewiel om te duiden welke emoties je precies voelde.', kind: 'gevoel' }] },
    { id: 'g3', short: 'G3', label: 'Gedachtes', stap: 1, q: [
      { f: 'gedachten', l: 'Gedachtes', d: 'Beschrijf wat je gedachtes waren tijdens het moment. Maak onderscheid in wanneer je ze had (vooraf, tijdens of achteraf). Schrijf in de ik-vorm: je feitelijke gedachtes, niet je mening erover.', kind: 'moment' }] },
    { id: 'g4', short: 'G4', label: 'Gedrag', stap: 1, q: [
      { f: 'gedrag', l: 'Gedrag', d: 'Beschrijf welk gedrag je feitelijk hebt laten zien. Bekijk jezelf van een afstand: wat vertoonde je allemaal, verbaal en non-verbaal?' }] },
    { id: 'g5', short: 'G5', label: 'Gevolg', stap: 1, q: [
      { f: 'gevolgen', l: 'Gevolg', d: 'Wat was het gevolg van jouw gedrag tijdens deze gebeurtenis? Wat was het effect? Was het de gebeurtenis of juist jouw gedachtes die de emoties veroorzaakten, en hoe hadden die invloed op jouw gedrag?', kind: 'gevolg' }] },
    { id: 'v', short: 'V', label: 'Verdieping', stap: 2, intro: 'Deze vragen gaan dieper in op jouw gedachtes. De antwoorden helpen die gedachtes te verduidelijken.', q: [
      { f: 'd_gedachte', l: 'Kies en benoem de voor jou belangrijkste gedachte', kind: 'gedachte' },
      { f: 'd_geloof', l: 'Hoe geloofwaardig is deze gedachte? (0 tot 100%)', kind: 'percent' },
      { f: 'd_voor', l: 'Welke bewijzen maken deze gedachte waar?' },
      { f: 'd_tegen', l: 'Welke bewijzen maken deze gedachte niet waar?' },
      { f: 'd_ergste', l: 'Wat is het ergste dat er kan gebeuren?' },
      { f: 'd_overheen', l: 'Ben je in staat daar overheen te komen?' },
      { f: 'd_voorNadelen', l: 'Wat zijn de voor- en nadelen van deze gedachte?' },
      { f: 'd_andereKijk', l: 'Is er een andere kijk of benadering waar ik nog niet aan heb gedacht?' },
      { f: 'd_vriend', l: 'Wat zou ik zeggen tegen een vriend of collega die een soortgelijke gedachte heeft?' },
      { f: 'd_vriendMij', l: 'Als een goede vriend, familielid of collega weet dat ik deze gedachte heb, wat zou hij of zij dan tegen mij zeggen?' },
      { f: 'd_alternatief', l: 'Zou je een alternatieve gedachte kunnen bedenken?' },
      { f: 'd_geloofNa', l: 'Hoe geloofwaardig is je belangrijkste gedachte nu, na deze vragen? (0 tot 100%)', kind: 'percent' }] },
    { id: 'i', short: 'I', label: 'Invloed', stap: 3, intro: 'De cirkel van invloed helpt je te zien waar jij invloed op had of hebt, en waar niet. Controle: jouw handelen, beslissingen en gedrag. Invloed: waar je invloed kunt uitoefenen zonder volledige controle. Negatieve gedachte: alles wat jou beïnvloedt, maar waar je zelf geen invloed of controle over hebt.', q: [
      { f: 'i_zorgen', l: 'Waar maak je je zorgen om?', d: 'Zet elke zorg op een eigen regel; daarna kun je ze in de cirkel plaatsen.', kind: 'zorgen' },
      { f: 'i_acties', l: 'Welke acties kun je nemen op zaken waar je invloed op hebt?' },
      { f: 'i_cirkel', l: 'Waar zitten je zorgen? Passen deze in de cirkel van negatieve gedachte, invloed of controle?', kind: 'cirkel' },
      { f: 'i_verplaatsen', l: 'Zou je iets van wat nu in de cirkel van negatieve gedachte zit kunnen verplaatsen naar controle of invloed?' }] },
    { id: 't', short: 'T', label: 'Toekomst', stap: 4, intro: 'Deze vragen helpen je met een plan voor de toekomst aan de hand van jouw reflectie.', q: [
      { f: 't_situaties', l: 'Zie je in de toekomst situaties voor je die op jouw beschreven situatie lijken? Benoem deze.' },
      { f: 't_toepassen', l: 'Wat zou je aan de hand van deze reflectie toe kunnen passen in een vergelijkbare situatie?' },
      { f: 't_gedrag', l: 'Wat voor gedrag ga je dan specifiek proberen toe te passen?', kind: 'smart' },
      { f: 't_meetbaar', l: 'Hoe ga je dit gedrag voor jezelf meetbaar maken?' },
      { f: 't_hulp', l: 'Is hetgeen wat je wil proberen acceptabel? Of heb je daar extra hulp bij nodig? Zo ja, waar zou je deze hulp kunnen vinden of vragen?' },
      { f: 't_wanneer', l: 'Wanneer ga je dit uitproberen?' }] }
  ];
  var STAP_TITLES = { 1: 'Stap 1: 5G', 2: 'Stap 2: Verdieping in gedachte', 3: 'Stap 3: Invloed', 4: 'Stap 4: Toekomst' };
  var FIELDS = [];
  NODES.forEach(function (n) { n.q.forEach(function (q) { FIELDS.push(q.f); }); });

  /* Emotiewiel: kern → [emotie, [verfijning, verfijning]] (zoals in het boekje). */
  var WIEL = [
    { kern: 'Angst', kleur: '#7d6aa8', sub: [['Verward', ['Gedesillusioneerd', 'Perplex']], ['Verrast', ['Ontzet', 'Geschokt']], ['Angstig', ['Doodsangst', 'Geschrokken']],
      ['Onzeker', ['Inferieur', 'Schaamte']], ['Volgzaam', ['Waardeloos', 'Onbelangrijk']], ['Afwijzing', ['Ontoereikend', 'Buitengesloten']], ['Vernedering', ['Minachting', 'Bespot']]] },
    { kern: 'Verdriet', kleur: '#4f7fae', sub: [['Verveeld', ['Onverschillig', 'Apathisch']], ['Eenzaam', ['Verlaten', 'Afgezonderd']], ['Depressief', ['Leeg', 'Inferieur']],
      ['Wanhopig', ['Kwetsbaar', 'Machteloos']], ['Verlaten', ['Genegeerd', 'Gedupeerd']], ['Schuldig', ['Beschaamd', 'Berouwvol']], ['Vermijdend', ['Aversie', 'Aarzeling']],
      ['Teleurgesteld', ['Verzetten', 'Weerzinwekkend']]] },
    { kern: 'Woede', kleur: '#b4473a', sub: [['Afkeurend', ['Veroordelend', 'Walging']], ['Kritisch', ['Skeptisch', 'Sarcastisch']], ['Afstandelijk', ['Teruggetrokken', 'Wantrouwend']],
      ['Gefrustreerd', ['Geïrriteerd', 'Woedend']], ['Agressief', ['Vijandig', 'Provocerend']], ['Boos', ['Woedend', 'Furieus']], ['Hatelijk', ['Haatdragend', 'Geschonden']],
      ['Bedreigd', ['Jaloers', 'Onzeker']], ['Gekwetst', ['Vernederd', 'Gebroken']]] },
    { kern: 'Vreugde', kleur: '#c79a2a', sub: [['Optimistisch', ['Open', 'Geïnspireerd']], ['Intiem', ['Gevoelig', 'Speels']], ['Vredig', ['Liefdevol', 'Hoopvol']],
      ['Krachtig', ['Provocerend', 'Moedig']], ['Geaccepteerd', ['Voldaan', 'Gerespecteerd']], ['Trots', ['Zelfverzekerd', 'Belangrijk']], ['Geïnteresseerd', ['Nieuwsgierig', 'Geamuseerd']],
      ['Vrolijk', ['Extatisch', 'Bevrijd']], ['Enthousiast', ['Energiek', 'Gewillig']], ['Verwonderd', ['Ontzag', 'Verbazing']]] }
  ];
  var CIRKEL = { C: 'Controle', I: 'Invloed', N: 'Negatieve gedachte' };

  function arr(x) { return Array.isArray(x) ? x.filter(Boolean) : []; }
  function obj(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  function filled(v) { return v != null && String(v).trim().length > 0; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /** Moves the old Inzichten / Leervraag / Actieplan into Stap 4 (in place). Returns true if something changed. */
  function migrate(c) {
    if (!c || typeof c !== 'object') return false;
    var changed = false;
    var add = function (f, label, v) { if (!filled(v)) return; c[f] = filled(c[f]) ? c[f] + '\n' + (label ? label + ': ' : '') + v : (label ? label + ': ' : '') + v; changed = true; };
    if ('inzichten' in c) { add('t_toepassen', '', c.inzichten); delete c.inzichten; changed = true; }
    if ('leervraag' in c) { add('t_gedrag', 'Leervraag', c.leervraag); delete c.leervraag; changed = true; }
    if ('actieplan' in c) { add('t_gedrag', 'Actieplan', c.actieplan); delete c.actieplan; changed = true; }
    if (c.model !== 2) { c.model = 2; changed = true; }
    // repair odd data (old or edited files)
    if ('emoties' in c && !Array.isArray(c.emoties)) { c.emoties = []; changed = true; }
    if (Array.isArray(c.emoties)) { var ok = c.emoties.filter(function (e) { return e && typeof e === 'object' && e.naam; }); if (ok.length !== c.emoties.length) { c.emoties = ok; changed = true; } }
    ['gevolgenV', 'i_plaats'].forEach(function (k) { if (k in c && (!c[k] || typeof c[k] !== 'object' || Array.isArray(c[k]))) { c[k] = {}; changed = true; } });
    FIELDS.forEach(function (f) { if (c[f] != null && typeof c[f] !== 'string') { c[f] = String(c[f]); changed = true; } });
    return changed;
  }
  function view(c) { var o = JSON.parse(JSON.stringify(c || {})); migrate(o); return o; }
  function blank(id, title) { var c = { id: id || Date.now(), title: title || '5G-T Reflectie', model: 2 }; FIELDS.forEach(function (f) { c[f] = ''; }); return c; }

  function extraFilled(c, n) {
    if (n.id === 'g5') { var g = obj(c.gevolgenV); return Object.keys(g).some(function (k) { return filled(g[k]); }); }
    if (n.id === 'g2') return arr(c.emoties).length > 0;
    return false;
  }
  /** A node counts as done when (most of) its questions are answered. */
  function nodeDone(c, n) {
    var qs = n.q.filter(function (q) { return q.kind !== 'percent'; });
    var k = qs.filter(function (q) { return filled(c[q.f]); }).length;
    if (qs.length === 1) return k === 1 || extraFilled(c, n);
    return k >= Math.ceil(qs.length / 2);
  }
  function progress(c) { var v = view(c); var d = NODES.map(function (n) { return nodeDone(v, n); }); return { total: NODES.length, done: d.filter(Boolean).length, nodes: d }; }
  function anyFilled(c) { var v = view(c); return FIELDS.some(function (f) { return filled(v[f]); }); }

  function vList(c) {
    var g = obj(c.gevolgenV); return VS.filter(function (v) { return v in g; }).map(function (v) { return { v: v, t: String(g[v] || '') }; });
  }
  function plaatsList(c) {
    var p = obj(c.i_plaats);
    return String(c.i_zorgen || '').split('\n').map(function (l) { return l.replace(/^[\s•\-–]+/, '').trim(); }).filter(Boolean)
      .map(function (l) { return { zorg: l, plek: p[l] || '' }; });
  }

  /** Plain text of one reflection (exports, .txt, print). */
  function toText(c, title) {
    var v = view(c), out = '', stap = 0;
    NODES.forEach(function (n) {
      if (n.stap !== stap) { stap = n.stap; out += '\n' + STAP_TITLES[stap].toUpperCase() + '\n'; }
      n.q.forEach(function (q) {
        var val = v[q.f];
        if (q.kind === 'percent') val = filled(val) ? val + '%' : '';
        out += '\n' + (n.stap === 1 ? q.l.toUpperCase() : q.l) + ':\n' + (filled(val) ? val : '-') + '\n';
        if (q.kind === 'gevolg') vList(v).forEach(function (x) { out += '  Invloed op ' + x.v + ': ' + (x.t || '-') + '\n'; });
        if (q.kind === 'zorgen') plaatsList(v).forEach(function (x) { out += '  • ' + x.zorg + (x.plek ? ' → ' + CIRKEL[x.plek] : '') + '\n'; });
      });
    });
    return (title ? title + '\n' : '') + out.replace(/^\n/, '');
  }
  /** Read-only HTML of one reflection (print, Gesprekssamenvatting). */
  /** Read-only HTML per step: [{stap, title, html}] (feedback per step in the CadetVolgSysteem). */
  function stepsHtml(c) {
    var v = view(c), out = [], cur = null;
    NODES.forEach(function (n) {
      if (!cur || cur.stap !== n.stap) { cur = { stap: n.stap, title: STAP_TITLES[n.stap], html: '' }; out.push(cur); }
      n.q.forEach(function (q) {
        var val = v[q.f];
        if (q.kind === 'percent') val = filled(val) ? val + '%' : '';
        if (!filled(val) && n.stap !== 1) return;
        cur.html += '<p><strong>' + esc(q.l) + ':</strong> ' + (filled(val) ? esc(val).replace(/\n/g, '<br>') : '-') + '</p>';
        if (q.kind === 'gevolg') vList(v).forEach(function (x) { cur.html += '<p style="margin-left:12px;"><em>Invloed op ' + esc(x.v) + ':</em> ' + esc(x.t || '-') + '</p>'; });
        if (q.kind === 'zorgen') { var pl = plaatsList(v); if (pl.length) cur.html += '<ul>' + pl.map(function (x) { return '<li>' + esc(x.zorg) + (x.plek ? ' → <em>' + CIRKEL[x.plek] + '</em>' : '') + '</li>'; }).join('') + '</ul>'; }
      });
    });
    return out;
  }
  function toHtml(c) {
    var v = view(c), out = '', stap = 0;
    NODES.forEach(function (n) {
      if (n.stap !== stap) { stap = n.stap; out += '<h5 style="margin:10px 0 4px;">' + esc(STAP_TITLES[stap]) + '</h5>'; }
      n.q.forEach(function (q) {
        var val = v[q.f];
        if (q.kind === 'percent') val = filled(val) ? val + '%' : '';
        if (!filled(val) && n.stap !== 1) return;
        out += '<p><strong>' + esc(q.l) + ':</strong> ' + (filled(val) ? esc(val).replace(/\n/g, '<br>') : '-') + '</p>';
        if (q.kind === 'gevolg') vList(v).forEach(function (x) { out += '<p style="margin-left:12px;"><em>Invloed op ' + esc(x.v) + ':</em> ' + esc(x.t || '-') + '</p>'; });
        if (q.kind === 'zorgen') { var pl = plaatsList(v); if (pl.length) out += '<ul>' + pl.map(function (x) { return '<li>' + esc(x.zorg) + (x.plek ? ' → <em>' + CIRKEL[x.plek] + '</em>' : '') + '</li>'; }).join('') + '</ul>'; }
      });
    });
    return out;
  }

  /** Circle of influence (SVG). items: [{zorg, plek}]: numbered dots; opts.legend adds a numbered list below. */
  function circleSvg(items, opts) {
    opts = opts || {};
    var W = 300, cx = 150, cy = 150, R = [140, 96, 52];
    var col = { N: '#ff7700', I: '#8a8f8c', C: '#1f2f45' };
    var out = '<svg class="kma-5gt-circle" viewBox="0 0 ' + W + ' ' + W + '" role="img" aria-label="Cirkel van invloed">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R[0] + '" fill="' + col.N + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R[1] + '" fill="' + col.I + '"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R[2] + '" fill="' + col.C + '"/>';
    var lab = function (y, t) { return '<text x="' + cx + '" y="' + y + '" text-anchor="middle" font-size="12" font-weight="700" fill="#fff">' + t + '</text>'; };
    out += lab(cy - R[0] + 20, 'Negatieve gedachte') + lab(cy - R[1] + 19, 'Invloed') + lab(cy - 24, 'Controle');
    var ring = { C: [], I: [], N: [] };
    arr(items).forEach(function (x, i) { if (ring[x.plek]) ring[x.plek].push(i + 1); });
    var rad = { C: 22, I: 74, N: 118 };
    ['C', 'I', 'N'].forEach(function (k) {
      var list = ring[k], n = list.length;
      list.forEach(function (num, i) {
        // spread over the lower part of the ring (the label sits at the top)
        var a = k === 'C' ? Math.PI / 2 + (i - (n - 1) / 2) * 0.9 : Math.PI / 2 + (i - (n - 1) / 2) * Math.min(0.42, 4.2 / Math.max(n, 1));
        var px = cx + rad[k] * Math.cos(a), py = cy + (k === 'C' ? 10 : 0) + rad[k] * Math.sin(a);
        out += '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="10" fill="#fff"/>' +
          '<text x="' + px.toFixed(1) + '" y="' + (py + 4).toFixed(1) + '" text-anchor="middle" font-size="11.5" font-weight="800" fill="#1f2f45">' + num + '</text>';
      });
    });
    out += '</svg>';
    if (opts.legend) {
      var li = arr(items).map(function (x, i) { return x.plek ? '<li><b>' + (i + 1) + '</b> ' + esc(x.zorg) + ' <em>(' + CIRKEL[x.plek] + ')</em></li>' : ''; }).join('');
      if (li) out += '<ol class="kma-5gt-legend">' + li + '</ol>';
    }
    return out;
  }

  /** Emotion wheel (SVG): core in the middle, emotions in the ring; refinements are chosen below it. */
  function wheelSvg(selKern, selSub) {
    var cx = 160, cy = 160, r0 = 52, r1 = 156, out = '';
    var total = 0; WIEL.forEach(function (k) { total += k.sub.length; });
    var a = -Math.PI / 2, step = 2 * Math.PI / total;
    var pt = function (r, ang) { return (cx + r * Math.cos(ang)).toFixed(1) + ',' + (cy + r * Math.sin(ang)).toFixed(1); };
    var arc = function (ri, ro, a0, a1) {
      var large = a1 - a0 > Math.PI ? 1 : 0;
      return 'M' + pt(ro, a0) + 'A' + ro + ',' + ro + ' 0 ' + large + ' 1 ' + pt(ro, a1) + 'L' + pt(ri, a1) + 'A' + ri + ',' + ri + ' 0 ' + large + ' 0 ' + pt(ri, a0) + 'Z';
    };
    WIEL.forEach(function (k, ki) {
      var a0 = a;
      k.sub.forEach(function (s, si) {
        var b0 = a, b1 = a + step, on = selKern === ki && selSub === si, mid = (b0 + b1) / 2;
        out += '<path class="kma-wiel-sub" data-wk="' + ki + '" data-ws="' + si + '" d="' + arc(r0, r1, b0, b1) + '" fill="' + k.kleur + '" fill-opacity="' + (on ? 1 : 0.55) + '" stroke="#fff" stroke-width="1"/>';
        var deg = mid * 180 / Math.PI, flip = Math.cos(mid) < 0;
        var tx = cx + (r0 + r1) / 2 * Math.cos(mid), ty = cy + (r0 + r1) / 2 * Math.sin(mid);
        out += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" transform="rotate(' + (flip ? deg + 180 : deg).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ')" text-anchor="middle" dominant-baseline="middle" font-size="9.5" font-weight="' + (on ? 700 : 500) + '" fill="#fff" pointer-events="none">' + esc(s[0]) + '</text>';
        a = b1;
      });
      out += '<path class="kma-wiel-kern" data-wk="' + ki + '" d="' + arc(0.01, r0, a0, a) + '" fill="' + k.kleur + '" stroke="#fff" stroke-width="1.5"/>';
      var m = (a0 + a) / 2;
      out += '<text x="' + (cx + r0 * 0.58 * Math.cos(m)).toFixed(1) + '" y="' + (cy + r0 * 0.58 * Math.sin(m)).toFixed(1) + '" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="800" fill="#fff" pointer-events="none">' + esc(k.kern) + '</text>';
    });
    return '<svg class="kma-wiel" viewBox="0 0 320 320" role="img" aria-label="Emotiewiel">' + out + '</svg>';
  }

  /** Editable form for the instructor app (all questions, grouped per step). */
  function editHtml(c, idx, fieldStyle) {
    var v = view(c), out = '', stap = 0;
    NODES.forEach(function (n) {
      if (n.stap !== stap) { if (stap) out += '</div>'; stap = n.stap; out += '<h5 style="margin:14px 0 6px; color:var(--accent-gold);">' + esc(STAP_TITLES[stap]) + '</h5><div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:10px;">'; }
      n.q.forEach(function (q) {
        out += '<div style="background:var(--bg-widget); padding:10px; border:1px solid var(--border-color); border-radius:4px;">' +
          '<label style="font-size:13px; font-weight:bold; color:var(--accent-gold); display:block; margin-bottom:4px;">' + esc(q.l) + '</label>' +
          (q.kind === 'percent'
            ? '<input type="number" min="0" max="100" value="' + esc(v[q.f] || '') + '" oninput="update5GTCaseField(' + idx + ', \'' + q.f + '\', this.value)" style="' + fieldStyle + 'width:90px; min-height:0;"/> %'
            : '<textarea style="' + fieldStyle + '" oninput="update5GTCaseField(' + idx + ', \'' + q.f + '\', this.value)">' + esc(v[q.f] || '') + '</textarea>');
        if (q.kind === 'gevolg' && vList(v).length) out += '<div style="font-size:13px; margin-top:6px;">' + vList(v).map(function (x) { return '<div><strong>' + esc(x.v) + ':</strong> ' + esc(x.t || '-') + '</div>'; }).join('') + '</div>';
        if (q.kind === 'gevoel' && arr(v.emoties).length) out += '<div style="font-size:13px; margin-top:6px;">' + v.emoties.map(function (e) { return esc((e.moment ? e.moment + ': ' : '') + e.naam + ' (' + e.intensiteit + '/10)'); }).join(' · ') + '</div>';
        out += '</div>';
      });
      if (n.id === 'i') { var pl = plaatsList(v); if (pl.some(function (x) { return x.plek; })) out += '<div style="max-width:260px;">' + circleSvg(pl, { legend: true }) + '</div>'; }
    });
    return out + '</div>';
  }

  /** Belief in the main thought before and after stap 2 (two bars). */
  function beliefBars(c) {
    var a = c.d_geloof, b = c.d_geloofNa;
    if ((a === '' || a == null) && (b === '' || b == null)) return '';
    var row = function (lab, v, col) {
      var n = v === '' || v == null ? null : Math.max(0, Math.min(100, Number(v)));
      return '<div class="kma-belief-row"><span>' + lab + '</span><span class="kma-belief-bar"><i style="width:' + (n || 0) + '%;background:' + col + '"></i></span><b>' + (n == null ? '-' : n + '%') + '</b></div>';
    };
    var d = (a !== '' && a != null && b !== '' && b != null) ? Number(b) - Number(a) : null;
    return '<div class="kma-belief">' + row('Vooraf', a, '#8a8f8c') + row('Nu', b, '#c79a2a') +
      (d != null ? '<p class="muted small">' + (d < 0 ? 'Je gelooft de gedachte ' + (-d) + ' procentpunt minder dan eerst.' : d > 0 ? 'Je gelooft de gedachte ' + d + ' procentpunt meer dan eerst.' : 'Je gelooft de gedachte even sterk als eerst.') + '</p>' : '') + '</div>';
  }
  /** Emotions over all reflections: per core emotion how often and how strong; intensity per reflection. */
  function emotionOverview(cases) {
    var V = window.KMAViz; if (!V) return '';
    var all = []; arr(cases).forEach(function (c) { arr(c.emoties).forEach(function (e) { all.push(e); }); });
    if (!all.length) return '<p class="muted small">Voeg bij <b>Gevoel</b> emoties toe uit het emotiewiel; hier zie je dan welke emoties vaak terugkomen en hoe sterk.</p>';
    var bars = WIEL.map(function (k) {
      var es = all.filter(function (e) { return e.kern === k.kern; });
      return { label: k.kern, value: es.length, color: k.kleur };
    }).filter(function (x) { return x.value; });
    var top = {}; all.forEach(function (e) { top[e.naam] = (top[e.naam] || 0) + 1; });
    var topList = Object.keys(top).sort(function (a, b) { return top[b] - top[a]; }).slice(0, 5);
    var withE = arr(cases).filter(function (c) { return arr(c.emoties).length; });
    var line = withE.length >= 2 ? V.lineChart(withE.map(function (c) { return String(c.title || '').slice(0, 10); }),
      [{ label: 'Gemiddelde intensiteit', color: '#b4473a', values: withE.map(function (c) { return Math.round(c.emoties.reduce(function (t, e) { return t + Number(e.intensiteit); }, 0) / c.emoties.length * 10) / 10; }) }],
      { yMin: 0, yMax: 10, ticks: [0, 5, 10], label: 'Intensiteit per reflectie' }) : '';
    var moments = MOMENTS.map(function (m) { return m + ' ' + all.filter(function (e) { return e.moment === m; }).length; }).join(' · ');
    return V.hbars(bars, { label: 'Emoties per kern' }) +
      '<p class="muted small">Vaakst: ' + topList.map(function (n) { return '<b>' + esc(n) + '</b> (' + top[n] + '×)'; }).join(', ') + ' · ' + moments + '</p>' + line;
  }

  window.KMA5GT = {
    beliefBars: beliefBars, emotionOverview: emotionOverview,
    NODES: NODES, FIELDS: FIELDS, WIEL: WIEL, VS: VS, MOMENTS: MOMENTS, CIRKEL: CIRKEL, STAP_TITLES: STAP_TITLES,
    migrate: migrate, view: view, blank: blank, progress: progress, anyFilled: anyFilled, nodeDone: nodeDone,
    toText: toText, toHtml: toHtml, stepsHtml: stepsHtml, editHtml: editHtml, circleSvg: circleSvg, wheelSvg: wheelSvg, plaatsList: plaatsList, vList: vList
  };
})();
