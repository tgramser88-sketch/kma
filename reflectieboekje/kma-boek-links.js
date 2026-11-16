/*
 * Samenhang tussen de hoofdstukken van het Reflectieboekje.
 *  1. De SMART-leervraag als rode draad: DTF-feiten, 5G-T- en Korthagen-reflecties markeer je met
 *     "Hoort bij mijn leervraag"; bij de leervraag zie je dat bewijs bij elkaar (ook de teamleider).
 *  2. Van DTF-feit naar reflectie (5G-T of Korthagen), met een koppeling in beide richtingen.
 *  3. Van analyse naar actie: probleemanalyse, blinde vlek uit de 360°-feedback, feedback en
 *     verbeterplannen van de teamleider als startpunt voor de leervraag.
 *  4. Kwaliteiten uit de levenslijn als suggestie bij "Ik als officier".
 *  5. Onder elk hoofdstuk een "Volgende stap".
 *  6. Begrippen uit de begrippenlijst zijn in de andere hoofdstukken aan te tikken voor de uitleg.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaStore) return;
  var H = window.KMAHex;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(n) { return window.kmaIcon ? kmaIcon(n) : ''; }
  function toast(m, k) { if (window.kmaToast) kmaToast(m, k); }
  function getX(k, d) { try { var v = kmaStore.getItem('kma-x-' + k); if (v == null) return d; v = JSON.parse(v); return v && typeof v === typeof d ? v : d; } catch (e) { return d; } }
  function setX(k, v) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(v)); } catch (e) {} if (typeof triggerSavePulse === 'function') triggerSavePulse(); }
  function idx(test) { return steps.findIndex(test); }
  function byTitle(re) { return idx(function (s) { return re.test(s.title); }); }
  function byWidget(w) { return idx(function (s) { return s.widget === w; }); }
  function cur() { return steps[currentStepIndex] || {}; }
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return iso || '';
    return Number(m[3]) + ' ' + ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][Number(m[2]) - 1] + ' ' + m[1];
  }
  function short(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
  function card(title, body, ic, cls) { return '<div class="kma-card-block ' + (cls || '') + '"><h4>' + (ic ? icon(ic) : '') + esc(title) + '</h4>' + body + '</div>'; }
  function dtfs() { return typeof dtfItems !== 'undefined' && Array.isArray(dtfItems) ? dtfItems : []; }
  function g5s() { return typeof cases5GT !== 'undefined' && Array.isArray(cases5GT) ? cases5GT : []; }
  function korts() { return typeof casesKorthagen !== 'undefined' && Array.isArray(casesKorthagen) ? casesKorthagen : []; }

  /* ===================== 1. Leervraag: links ===================== */
  var KIND = { dtf: 'DTF-feit', g5: '5G-T', kort: 'Korthagen' };
  function leer() { var l = getX('leer', { items: [] }); if (!Array.isArray(l.items)) l.items = []; return l; }
  function isLeer(t, id) { return leer().items.some(function (x) { return x.t === t && String(x.id) === String(id); }); }
  function toggleLeer(t, id) {
    var l = leer(), on = isLeer(t, id);
    l.items = on ? l.items.filter(function (x) { return !(x.t === t && String(x.id) === String(id)); }) : l.items.concat([{ t: t, id: id, at: new Date().toISOString().slice(0, 10) }]);
    setX('leer', l);
    toast(on ? 'Niet meer gekoppeld aan je leervraag' : 'Gekoppeld aan je leervraag');
    return !on;
  }
  function resolve(x) {
    if (x.t === 'dtf') { var d = dtfs().find(function (v) { return String(v.id) === String(x.id); }); return d ? { kind: KIND.dtf, label: d.feit, when: fmtDate(d.datum), sign: d.teken } : null; }
    if (x.t === 'g5') { var i = g5s().findIndex(function (v) { return String(v.id) === String(x.id); }); return i >= 0 ? { kind: KIND.g5, label: g5s()[i].title, when: '', index: i } : null; }
    if (x.t === 'kort') { var k = korts().findIndex(function (v) { return String(v.id) === String(x.id); }); return k >= 0 ? { kind: KIND.kort, label: korts()[k].title, when: '', index: k } : null; }
    return null;
  }
  function linked() { return leer().items.map(function (x) { var r = resolve(x); return r ? Object.assign({ t: x.t, id: x.id }, r) : null; }).filter(Boolean); }
  function leerChip(t, id) {
    var on = isLeer(t, id);
    return '<button type="button" class="kma-chip-btn kma-leer-chip' + (on ? ' on' : '') + '" data-leer="' + t + ':' + esc(id) + '" aria-pressed="' + on + '">' + icon('target') + (on ? 'Hoort bij mijn leervraag' : 'Bij mijn leervraag') + '</button>';
  }
  function openItem(t, id) {
    if (t === 'dtf') { goToStep(byWidget('dtf-logbook')); return; }
    if (t === 'g5') { var i = g5s().findIndex(function (v) { return String(v.id) === String(id); }); goToStep(byWidget('5gt-multi')); if (i >= 0 && window.select5GTCase) select5GTCase(i); return; }
    if (t === 'kort') { var k = korts().findIndex(function (v) { return String(v.id) === String(id); }); goToStep(byWidget('korthagen-multi')); if (k >= 0 && window.selectKorthagenCase) selectKorthagenCase(k); }
  }
  function evidenceCard() {
    var L = linked();
    var counts = { 'DTF-feit': 0, '5G-T': 0, 'Korthagen': 0 }; L.forEach(function (x) { counts[x.kind]++; });
    var body = '<p class="muted">Alles wat bij je leervraag hoort, bij elkaar. Markeer een feit of reflectie met <strong>Bij mijn leervraag</strong>; je teamleider ziet dit ook in je dossier.</p>' +
      '<div class="kma-leer-counts">' + Object.keys(counts).map(function (k) { return '<span><strong>' + counts[k] + '</strong> ' + k + (counts[k] === 1 || k === 'Korthagen' || k === '5G-T' ? '' : 'en') + '</span>'; }).join('') + '</div>';
    body += L.length ? '<div class="kma-leer-list">' + L.map(function (x) {
      return '<button type="button" class="kma-leer-item" data-leer-open="' + x.t + ':' + esc(x.id) + '"><em>' + esc(x.kind) + (x.when ? ' · ' + esc(x.when) : '') + '</em><span>' + esc(short(x.label, 110)) + '</span>' + icon('right') + '</button>';
    }).join('') + '</div>' : '<p class="muted small">Nog niets gekoppeld. Ga naar je DTF-logboek of je reflecties en tik op <strong>Bij mijn leervraag</strong>.</p>';
    return card('Bewijs bij je leervraag', body, 'target', 'kma-leer-card');
  }

  /* ===================== 3. Startpunten voor een leervraag ===================== */
  function starters() {
    var out = [];
    // probleemanalyse: intention (phase 3) or what to anchor (phase 5)
    var pi = byTitle(/^Probleem/);
    if (pi >= 0) {
      var ps = steps[pi], st = getX('probleem', null) || { cases: [{ title: 'Analyse 1' }] };
      var qI = ps.questions.findIndex(function (q) { return /PLANVORMING - Intentie/.test(q); });
      var qB = ps.questions.findIndex(function (q) { return /EVALUATIE - Borging/.test(q); });
      (st.cases || []).forEach(function (cs, i) {
        var val = function (qi) { return qi < 0 ? '' : (i === 0 ? (answers[ps.questions[qi]] || '') : ((cs.a || {})[qi] || '')); };
        var t = String(val(qI) || val(qB)).trim();
        if (t) out.push({ from: 'Probleemanalyse' + (cs.title ? ' · ' + cs.title : ''), text: t });
      });
    }
    // 360°: blind spots
    try {
      if (H && typeof hexacoObservers !== 'undefined' && typeof hexacoQuestionsObserver !== 'undefined' && typeof hexacoSelfAnswers !== 'undefined') {
        var sc = H.score(hexacoSelfAnswers, hexacoQuestionsSelf);
        if (H.isComplete(sc)) {
          var oth = H.observerScores(hexacoObservers, hexacoQuestionsObserver);
          if (oth.count) H.analyse(H.plain(sc), oth).gaps.filter(function (g) { return g.kind === 'blind'; }).forEach(function (g) {
            out.push({ from: 'Blinde vlek (360°) · ' + g.trait.name, text: 'Ik wil meer laten zien van ' + g.trait.name.toLowerCase() + ' (' + g.trait.high + '), zodat anderen dat ook zo ervaren.' });
          });
        }
      }
    } catch (e) {}
    // feedback and plans from the teamleider
    try {
      var fb = JSON.parse(kmaStore.getItem('kma-x-feedback') || 'null');
      var rec = fb && Array.isArray(fb.received) ? fb.received[0] : null;
      if (rec) {
        (rec.plans || []).slice(0, 3).forEach(function (p) {
          var t = typeof p === 'string' ? p : (p.goal || p.doel || p.title || p.text || '');
          if (t) out.push({ from: 'Ontwikkelplan van ' + (rec.from || 'je teamleider'), text: String(t) });
        });
        Object.keys(rec.items || {}).slice(0, 4).forEach(function (k) {
          var v = rec.items[k], t = typeof v === 'string' ? v : (v && (v.text || v.feedback)) || '';
          if (String(t).trim()) out.push({ from: 'Feedback van ' + (rec.from || 'je teamleider'), text: String(t) });
        });
      }
    } catch (e) {}
    return out.slice(0, 8);
  }
  function startersCard() {
    var s = starters();
    if (!s.length) return '';
    return card('Startpunten uit je andere hoofdstukken', '<p class="muted">Tik op een startpunt om het bij "wat precies" toe te voegen; maak het daarna specifiek.</p>' +
      '<div class="kma-starters">' + s.map(function (x) {
        return '<button type="button" class="kma-starter" data-smart-start="' + esc(short(x.text, 220)) + '"><em>' + esc(x.from) + '</em><span>' + esc(short(x.text, 160)) + '</span></button>';
      }).join('') + '</div>', 'idea');
  }

  /* ===================== 2. DTF ↔ reflecties ===================== */
  function reflectionsFor(dtfId) {
    var r = [];
    g5s().forEach(function (c) { if (String(c.dtfId) === String(dtfId)) r.push({ t: 'g5', id: c.id, title: c.title }); });
    korts().forEach(function (c) { if (String(c.dtfId) === String(dtfId)) r.push({ t: 'kort', id: c.id, title: c.title }); });
    return r;
  }
  function startKorthagenFromDtf(id) {
    var d = dtfs().find(function (x) { return String(x.id) === String(id); }); if (!d) return;
    if (typeof addKorthagenCase === 'function') addKorthagenCase();
    var cs = korts()[activeKorthagenIndex] || korts()[korts().length - 1];
    if (!cs) return;
    cs.title = (d.feit || 'Reflectie').split(/\s+/).slice(0, 5).join(' ');
    cs.actie = (d.datum ? fmtDate(d.datum) + (d.tijd ? ' ' + d.tijd : '') + ': ' : '') + (d.feit || '');
    cs.dtfId = d.id;
    try { kmaStore.setItem(CASES_KORTHAGEN_KEY, JSON.stringify(casesKorthagen)); if (typeof dbSet === 'function') dbSet(CASES_KORTHAGEN_KEY, casesKorthagen); } catch (e) {}
    var ki = byWidget('korthagen-multi');
    if (currentStepIndex !== ki) goToStep(ki); else renderWidgets();
    toast('Nieuwe Korthagen-ronde gestart met dit feit als actie');
  }
  window.kmaStartKorthagenFromDtf = startKorthagenFromDtf;

  function decorateDtf(c) {
    c.querySelectorAll('.kma-dtf-item').forEach(function (it) {
      var b = it.querySelector('[data-dtflink]'); if (!b || it.querySelector('.kma-leer-chip')) return;
      var id = b.getAttribute('data-dtflink'), btns = b.parentNode;
      var mk5 = btns.querySelector('[onclick^="kmaStart5GTFromDtf"]');
      var k = document.createElement('button'); k.type = 'button'; k.className = 'kma-chip-btn'; k.setAttribute('data-kort-from-dtf', id);
      k.innerHTML = icon('refresh') + 'Maak Korthagen';
      if (mk5) mk5.insertAdjacentElement('afterend', k); else btns.insertBefore(k, btns.firstChild);
      btns.insertAdjacentHTML('afterbegin', leerChip('dtf', id));
      var refl = reflectionsFor(id);
      if (refl.length) it.querySelector('.kma-dtf-body > p').insertAdjacentHTML('afterend', '<div class="kma-chips small kma-reflinks">' + refl.map(function (r) {
        return '<button type="button" class="kma-chip-btn" data-leer-open="' + r.t + ':' + esc(r.id) + '">' + icon('refresh') + (r.t === 'g5' ? '5G-T: ' : 'Korthagen: ') + esc(short(r.title, 40)) + '</button>';
      }).join('') + '</div>');
    });
  }
  function decorateCase(c, t) {
    var title = c.querySelector('.kma-case-title'); if (!title || c.querySelector('.kma-case-links')) return;
    var cs = t === 'g5' ? (g5s()[active5GTIndex] || g5s()[0]) : (korts()[activeKorthagenIndex] || korts()[0]);
    if (!cs) return;
    var html = '<div class="kma-chips kma-case-links">' + leerChip(t, cs.id);
    if (cs.dtfId != null) {
      var d = dtfs().find(function (x) { return String(x.id) === String(cs.dtfId); });
      if (d) html += '<button type="button" class="kma-chip-btn" data-leer-open="dtf:' + esc(d.id) + '">' + icon('calendar') + 'DTF-feit ' + esc(fmtDate(d.datum)) + ': ' + esc(short(d.feit, 50)) + '</button>';
    }
    title.insertAdjacentHTML('afterend', html + '</div>');
  }

  /* ===================== 4. Levenslijn → Ik als officier ===================== */
  function decorateOfficer() {
    var st = cur(); if (!/^Ik als officier/.test(st.title || '')) return;
    var qi = (st.questions || []).findIndex(function (q) { return /2 belangrijkste kwaliteiten/.test(q); });
    var t = document.getElementById('q-input-' + qi), cardEl = t && t.closest('.question-card');
    if (!cardEl || cardEl.querySelector('.kma-tl-quals')) return;
    var counts = {};
    (typeof timelineItems !== 'undefined' ? timelineItems : []).forEach(function (it) { (it.qualities || []).forEach(function (q) { counts[q] = (counts[q] || 0) + 1; }); });
    var top = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 6);
    if (!top.length) return;
    var val = t.value || '';
    var box = document.createElement('div'); box.className = 'kma-tl-quals';
    box.innerHTML = '<p class="muted small">' + icon('chart') + 'Uit je levenslijn (hoe vaak je ze noemde):</p><div class="kma-chips">' + top.map(function (q) {
      return '<button type="button" class="kma-chip-btn' + (val.split('\n').some(function (l) { return l.indexOf(q) === 0; }) ? ' on' : '') + '" data-offq="' + esc(q) + '">' + esc(q) + ' <em>' + counts[q] + '×</em></button>';
    }).join('') + '</div>';
    var after = cardEl.querySelector('.kma-chips') ? cardEl.querySelector('.kma-chips').parentNode : cardEl.querySelector('label');
    after.insertAdjacentElement('afterend', box);
  }

  /* ===================== 5. Volgende stap ===================== */
  var NEXT = [
    [/^Cadet Informatie/, /^Introductie/, 'Vertel wat je drijft en wie je steunen.'],
    [/^Introductie/, /Ontwikkelbiografie/, 'Je drijfveren komen ergens vandaan: zet de belangrijkste momenten op je levenslijn.'],
    [/Ontwikkelbiografie/, /Persoonlijkheidstest/, 'Vergelijk de kwaliteiten uit je levenslijn met je persoonlijkheidsprofiel.'],
    [/Persoonlijkheidstest/, /Gedragscode/, 'Je profiel geeft per V een indicatie; kijk nu hoe jij de 4 V\'s waarmaakt.'],
    [/Gedragscode/, /^SMART/, 'Maak van wat je over de 4 V\'s ontdekte een leervraag.'],
    [/^Zelfbeoordelingsformulier/, /^Voorbereiding/, 'Bereid je beoordelingsgesprek voor met je zelfbeoordeling en het bewijs dat je hebt verzameld.'],
    [/^SMART/, /Datum-Tijd-Feit/, 'Verzamel feiten die laten zien hoe het met je leervraag gaat, en koppel ze aan je leervraag.'],
    [/5G-T/, /^SMART/, 'Koppel deze reflectie aan je leervraag en kijk of je check-in van deze week klopt.'],
    [/Korthagen/, /^SMART/, 'Wat je bij "Uitproberen" schreef, is je volgende actie: neem het mee in je leervraag.'],
    [/^Probleem/, /^SMART/, 'Gebruik de intentie uit je analyse als startpunt voor een leervraag.'],
    [/Datum-Tijd-Feit/, /5G-T/, 'Kies een belangrijk feit en reflecteer erop: tik bij het feit op "Maak 5G-T" of "Maak Korthagen".'],
    [/^Begrippenlijst/, /^Voorbereiding/, 'Bereid je beoordelingsgesprek voor met het bewijs dat je hebt verzameld.'],
    [/^Voorbereiding/, /^Fitheid/, 'Hoe gaat het met je slaap, belasting en stress? Neem het mee in je gesprek als je dat wilt.'],
    [/^Fitheid/, /^Toetsing/, 'Houd bij welke toetsen je al hebt behaald.'],
    [/^Toetsing/, /groei/i, 'Bekijk hoe je je over de tijd hebt ontwikkeld.'],
    [/groei/i, /^Curriculum/, 'Zet je groei om in je cv; via Delen → Portfolio maak je er één document van.']
  ];
  function started(i) {
    var s = steps[i]; if (!s) return false;
    if ((s.questions || []).some(function (q) { return String(answers[q] || '').trim(); })) return true;
    if (s.widget === 'dtf-logbook') return dtfs().length > 0;
    if (s.widget === '5gt-multi') return g5s().some(function (c) { return window.KMA5GT && KMA5GT.anyFilled ? KMA5GT.anyFilled(c) : !!c.gebeurtenis; });
    if (s.widget === 'korthagen-multi') return korts().some(function (c) { return !!String(c.actie || '').trim(); });
    if (s.widget === 'timeline') return typeof timelineItems !== 'undefined' && timelineItems.length > 0;
    return false;
  }
  function nextCard() {
    var st = cur(), rule = NEXT.find(function (r) { return r[0].test(st.title || ''); });
    if (!rule) return '';
    var ti = byTitle(rule[1]); if (ti < 0 || ti === currentStepIndex || steps[ti].verborgen) return '';
    var t = steps[ti].title.replace(/ \(.*\)$/, '').replace(/^HEXACO /, '');
    return '<div class="kma-next"><div><em>Volgende stap</em><strong>' + esc(t) + '</strong><span>' + esc(rule[2]) + (started(ti) ? '' : ' <b>Nog niet begonnen.</b>') + '</span></div>' +
      '<button type="button" class="kma-icon-btn is-primary sm" data-next-go="' + ti + '">Ga verder' + icon('right') + '</button></div>';
  }
  function placeNext() {
    document.querySelectorAll('.kma-next').forEach(function (e) { e.remove(); });
    var html = nextCard(); if (!html) return;
    var nav = document.querySelector('.form-navigation');
    var host = document.createElement('div'); host.innerHTML = html;
    if (nav) nav.parentNode.insertBefore(host.firstChild, nav);
    else { var p = document.querySelector('.content-panel'); if (p) p.appendChild(host.firstChild); }
  }

  /* ===================== 6. Begrippenlijst overal ===================== */
  var termCache = null, termSig = '';
  function terms() {
    var J = typeof jargonItems !== 'undefined' && Array.isArray(jargonItems) ? jargonItems : [];
    var sig = J.map(function (j) { return j.term + '|' + j.def; }).join('#');
    if (termCache && sig === termSig) return termCache;
    termSig = sig;
    termCache = [];
    J.forEach(function (j) {
      if (!j || !j.term || !j.def) return;
      var forms = [String(j.term).trim()], base = String(j.term).replace(/\s*\(.*?\)\s*/g, ' ').trim();
      var inParen = /\(([^)]+)\)/.exec(j.term);
      if (base && base !== forms[0]) forms.push(base);
      if (inParen && /^[A-Z0-9 '-]{2,12}$/.test(inParen[1].trim()) === false && inParen[1].length < 30) forms.push(inParen[1].trim());
      forms.filter(function (f) { return f.length >= 3; }).forEach(function (f) {
        var acr = /^[A-Z0-9-]{2,6}$/.test(f);
        var re = new RegExp('(^|[^\\wÀ-ÿ])(' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(?=$|[^\\wÀ-ÿ])', acr ? '' : 'i');
        termCache.push({ re: re, term: j.term, def: j.def, len: f.length });
      });
    });
    termCache.sort(function (a, b) { return b.len - a.len; });
    return termCache;
  }
  function markTerms(root) {
    var T = terms(); if (!T.length || !root) return;
    var done = {};
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      var p = n.parentNode; if (!p || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (p.closest('summary, textarea, input, button, select, a, abbr, .kma-jterm, .kma-next, script, style, .kma-sheet, svg, mark, .question-label')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    } });
    var nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      for (var i = 0; i < T.length; i++) {
        var t = T[i]; if (done[t.term]) continue;
        var m = t.re.exec(n.nodeValue); if (!m) continue;
        done[t.term] = 1;
        var start = m.index + m[1].length, word = m[2];
        var after = n.splitText(start); after.nodeValue = after.nodeValue.slice(word.length);
        var span = document.createElement('span'); span.className = 'kma-jterm'; span.tabIndex = 0; span.setAttribute('role', 'button');
        span.setAttribute('data-term', t.term); span.textContent = word;
        n.parentNode.insertBefore(span, after);
        n = after; i = -1;   // look for other terms in the rest of this text
      }
    });
  }
  function markAll() {
    var st = cur(); if (st.widget === 'jargon-list') return;
    ['#step-desc', '#questions-container label', '#widget-container .muted'].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { try { markTerms(el); } catch (e) {} });
    });
  }
  var popAt = 0;
  function showTerm(el) {
    popAt = Date.now();
    var J = typeof jargonItems !== 'undefined' ? jargonItems : [], name = el.getAttribute('data-term');
    var j = J.find(function (x) { return x.term === name; }); if (!j) return;
    document.querySelectorAll('.kma-jterm-pop').forEach(function (p) { p.remove(); });
    var pop = document.createElement('div'); pop.className = 'kma-jterm-pop'; pop.setAttribute('role', 'dialog');
    pop.innerHTML = '<strong>' + esc(j.term) + '</strong>' + (j.category ? '<em>' + esc(j.category) + '</em>' : '') + '<p>' + esc(j.def) + '</p>' +
      '<button type="button" class="kma-chip-btn" data-term-list>' + icon('book') + 'Begrippenlijst</button>';
    document.body.appendChild(pop);
    var r = el.getBoundingClientRect(), w = Math.min(320, window.innerWidth - 24);
    pop.style.width = w + 'px';
    pop.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, r.left)) + 'px';
    var top = r.bottom + 8; if (top + pop.offsetHeight > window.innerHeight - 10) top = Math.max(10, r.top - pop.offsetHeight - 8);
    pop.style.top = top + 'px';
  }

  /* ===================== Hooks ===================== */
  function decorate() {
    var st = cur(), c = document.getElementById('widget-container');
    if (!c) return;
    if (st.widget === 'dtf-logbook') decorateDtf(c);
    if (st.widget === '5gt-multi') decorateCase(c, 'g5');
    if (st.widget === 'korthagen-multi') decorateCase(c, 'kort');
    if (/^SMART/.test(st.title || '') && !c.querySelector('.kma-leer-card')) {
      var host = document.createElement('div'); host.innerHTML = evidenceCard() + startersCard();
      while (host.firstChild) c.appendChild(host.firstChild);
    }
    markAll();
  }
  var origRW = window.renderWidgets;
  window.renderWidgets = function () { var r = origRW.apply(this, arguments); try { decorate(); } catch (e) { console.error('kma-links', e); } return r; };
  try { renderWidgets = window.renderWidgets; } catch (e) {}
  var origRS = window.renderStep;
  window.renderStep = function () {
    var r = origRS.apply(this, arguments);
    try { decorateOfficer(); placeNext(); markAll(); } catch (e) { console.error('kma-links', e); }
    return r;
  };
  try { renderStep = window.renderStep; } catch (e) {}

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-leer],[data-leer-open],[data-kort-from-dtf],[data-next-go],.kma-jterm,[data-term-list]');
    if (!t) { if (!(e.target.closest && e.target.closest('.kma-jterm-pop'))) document.querySelectorAll('.kma-jterm-pop').forEach(function (p) { p.remove(); }); return; }
    if (t.hasAttribute('data-leer')) {
      var p = t.getAttribute('data-leer').split(':'), on = toggleLeer(p[0], p.slice(1).join(':'));
      t.classList.toggle('on', on); t.setAttribute('aria-pressed', on); t.innerHTML = icon('target') + (on ? 'Hoort bij mijn leervraag' : 'Bij mijn leervraag');
      return;
    }
    if (t.hasAttribute('data-leer-open')) { var q = t.getAttribute('data-leer-open').split(':'); openItem(q[0], q.slice(1).join(':')); return; }
    if (t.hasAttribute('data-kort-from-dtf')) { startKorthagenFromDtf(t.getAttribute('data-kort-from-dtf')); return; }
    if (t.hasAttribute('data-next-go')) { goToStep(Number(t.getAttribute('data-next-go'))); window.scrollTo(0, 0); return; }
    if (t.hasAttribute('data-term-list')) { document.querySelectorAll('.kma-jterm-pop').forEach(function (p) { p.remove(); }); goToStep(byWidget('jargon-list')); return; }
    if (t.classList.contains('kma-jterm')) { e.preventDefault(); showTerm(t); }
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('kma-jterm')) { e.preventDefault(); showTerm(e.target); }
    if (e.key === 'Escape') document.querySelectorAll('.kma-jterm-pop').forEach(function (p) { p.remove(); });
  });
  // Close on scrolling, but not on the small scroll that tapping a term near the edge can cause.
  window.addEventListener('scroll', function () { if (Date.now() - popAt < 700) return; document.querySelectorAll('.kma-jterm-pop').forEach(function (p) { p.remove(); }); }, { passive: true });

  window.KMALinks = { leer: leer, linked: linked, toggleLeer: toggleLeer, starters: starters, reflectionsFor: reflectionsFor, terms: terms, nextCard: nextCard };
  // first paint already happened before this file loaded
  try { if (typeof currentStepIndex !== 'undefined') { decorate(); decorateOfficer(); placeNext(); } } catch (e) {}
})();
