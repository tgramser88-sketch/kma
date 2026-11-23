/*
 * Reflectieboekje 4.28.0 (blok T): de Dashboard-weergave. Alleen actief als kmaWeergave.dash().
 * De tabbladen (kma-boek-tabs.js) worden dan: Vandaag · Groei · + · Werkboek · Postvak · Meer.
 *  - Vandaag: startpad (T8, tot alles af is), weekdoel en vier tegels met "Waarom zie ik dit?" (T14), daaronder
 *    de bestaande kaart Vandaag (kma-boek-vandaag.js).
 *  - Groei: het hoofdstuk Mijn groei & ontwikkeling.
 *  - +: "Wat wil je vastleggen?" (T7, dezelfde keuzes als de knop + Nieuw).
 *  - Werkboek: de hoofdstukken per stap van de ontwikkelcyclus met status klaar/bezig/open (T12), zoeken (T10);
 *    hoofdstukken uit Verdieping die je nog niet gebruikte achter "Meer hoofdstukken" (T9).
 *  - Postvak: feedback van medecadetten en je teamleider, vragen om feedback, en wat je zelf gaf.
 *  - Meer: het bestaande menu (⋮).
 * Een rood bolletje alleen bij iets dat actie vraagt (T11). Alle gegevens komen uit de bestaande onderdelen.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
/* global steps, goToStep, currentStepIndex, dtfItems, hexacoQuestionsSelf, hexacoSelfAnswers, answers */
(function () {
  'use strict';
  if (!window.kmaWeergave || !kmaWeergave.dash() || typeof steps === 'undefined') return;
  var icon = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function idx(re) { for (var i = 0; i < steps.length; i++) if (!steps[i].verborgen && re.test(steps[i].title)) return i; return -1; }
  function status(i) {
    var st = window.kmaChapterStatus ? kmaChapterStatus(i) : null;
    if (!st || !st.total) return st && st.done ? 'bezig' : 'open';
    return st.done >= st.total ? 'klaar' : st.done > 0 ? 'bezig' : 'open';
  }
  function getX(k, d) { try { var v = kmaStore.getItem('kma-x-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }

  /* ---------------- De stappen van de ontwikkelcyclus ---------------- */
  var FASEN = [
    ['Ken jezelf', /Cadet Informatie|Introductie|Ontwikkelbiografie|Persoonlijkheidstest|Gedragscode/],
    ['Leervraag', /SMART|Probleem- en Behoefte/],
    ['Doen en vastleggen', /Datum-Tijd-Feit|Roos van Leary|Fitheid/],
    ['Reflecteren', /5G-T|Korthagen/],
    ['Beoordeling', /Zelfbeoordelingsformulier|Voorbereiding Cadetbeoordeling|Toetsing/],
    ['Naslag', /Begrippenlijst|Curriculum|Mijn groei/]
  ];
  function fase(i) { var t = steps[i].title; for (var f = 0; f < FASEN.length; f++) if (/** @type {RegExp} */ (FASEN[f][1]).test(t)) return f; return FASEN.length - 1; }
  var STATUS_KL = { klaar: 'is-klaar', bezig: 'is-bezig', open: 'is-open' };

  /* ---------------- Werkboek (T9, T10, T12) ---------------- */
  var zoekterm = '';
  function werkboekHtml() {
    var per = FASEN.map(function () { return { kern: [], verd: [] }; });
    for (var i = 0; i < steps.length; i++) {
      if (steps[i].verborgen) continue;
      var g = window.kmaChapterGroup ? kmaChapterGroup(i) : 'kern', st = status(i);
      if (zoekterm && steps[i].title.toLowerCase().indexOf(zoekterm) < 0) continue;
      // T9: verdieping die je nog niet gebruikte, staat achter "Meer hoofdstukken" (behalve bij zoeken)
      (g === 'verdieping' && st === 'open' && !zoekterm ? per[fase(i)].verd : per[fase(i)].kern).push(i);
    }
    var rij = function (i) {
      var st = status(i), nr = window.kmaChapterNum ? kmaChapterNum(i) : i;
      return '<button type="button" class="kma-wb-rij" data-wb="' + i + '"><span class="kma-wb-t"><small>' + nr + '</small>' + esc(steps[i].title) + '</span><span class="kma-status ' + STATUS_KL[st] + '">' + st + '</span>' + icon('right') + '</button>';
    };
    var verborgen = 0;
    var html = per.map(function (p, f) {
      verborgen += p.verd.length;
      if (!p.kern.length) return '';
      return '<section class="kma-wb-fase"><h3><span>' + (f + 1) + '</span>' + FASEN[f][0] + '</h3><div class="kma-wb-lijst">' + p.kern.map(rij).join('') + '</div></section>';
    }).join('');
    var meer = [];
    per.forEach(function (p) { meer = meer.concat(p.verd); });
    return '<div class="kma-dash-kop"><h2>Werkboek</h2><p class="muted small">De hoofdstukken in de volgorde van de ontwikkelcyclus: jezelf leren kennen, een leervraag, doen en vastleggen, reflecteren en beoordelen.</p></div>' +
      '<label class="kma-dash-zoek">' + icon('search') + '<span class="sr-only">Zoek een hoofdstuk</span><input type="search" id="kma-wb-zoek" placeholder="Zoek een hoofdstuk" value="' + esc(zoekterm) + '" autocomplete="off"></label>' +
      (html || '<p class="muted">Geen hoofdstuk gevonden. <button type="button" class="kma-chip-btn" data-wb-alles>Zoek in je hele boekje</button></p>') +
      (verborgen ? '<details class="kma-wb-meer"><summary>Meer hoofdstukken (' + verborgen + ')</summary><p class="muted small">Verdieping: gebruik ze als het past of als je teamleider ze aanraadt.</p><div class="kma-wb-lijst">' + meer.map(rij).join('') + '</div></details>' : '') +
      '<p class="muted small"><button type="button" class="kma-chip-btn" data-wb-alles>' + icon('search') + 'Zoeken in je antwoorden, DTF en reflecties</button></p>';
  }

  /* ---------------- Postvak ---------------- */
  function postvakData() {
    var K = window.kmaKameraad, s = K && K._S ? K._S() : { inbox: [] }, inbox = (s.inbox || []).slice().sort(function (a, b) { return String(b.datum || b.at || '') < String(a.datum || a.at || '') ? -1 : 1; });
    var vragen = K && K.requests ? K.requests() : [];
    var fb = window.kmaFeedback && kmaFeedback.all ? kmaFeedback.all() : [];
    var nieuwFb = window.kmaFeedback && kmaFeedback.unread && kmaFeedback.unread() ? 1 : 0;
    return { inbox: inbox, nieuw: inbox.filter(function (c) { return c.nieuw; }).length, vragen: vragen, fb: fb, nieuwFb: nieuwFb, scores: K && K.mijnScores ? K.mijnScores() : { n: 0 } };
  }
  function postvakHtml() {
    var d = postvakData();
    var item = function (ic, t, s, data, label, rood) { return '<button type="button" class="kma-pv-item" ' + data + '><span class="kma-pv-ic">' + icon(ic) + '</span><span class="kma-pv-t"><b>' + esc(t) + '</b><small>' + esc(s) + '</small></span>' + (label ? '<span class="kma-status ' + (rood ? 'is-open' : 'is-bezig') + '">' + esc(label) + '</span>' : '') + '</button>'; };
    var html = '<div class="kma-dash-kop"><h2>Postvak</h2><p class="muted small">Feedback die je kreeg, vragen om feedback en wat je zelf gaf.</p></div>';
    var l = [];
    d.vragen.slice(0, 3).forEach(function (r) { l.push(item('users', r.van + ' vraagt om feedback', r.situatie || r.focus || '', 'data-pv="vragen"', 'vraag', true)); });
    if (d.fb.length) { var f = d.fb[0]; l.push(item('message', 'Feedback van je teamleider', (f.from ? f.from + ' · ' : '') + String(f.date || '').slice(0, 10), 'data-pv="teamleider"', d.nieuwFb ? 'nieuw' : '', !!d.nieuwFb)); }
    d.inbox.slice(0, 5).forEach(function (c) { l.push(item('message', c.van, String(c.feit || '').slice(0, 90), 'data-pv="inbox"', c.nieuw ? 'nieuw' : (c.actie ? '' : 'wat doe je ermee?'), !!c.nieuw)); });
    html += l.length ? '<div class="kma-pv-lijst">' + l.join('') + '</div>' : '<p class="muted">Nog niets ontvangen. Vraag feedback aan je groep of je teamleider.</p>';
    html += '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-pv="vraag">' + icon('send') + 'Feedback vragen</button><button type="button" class="kma-icon-btn is-primary" data-pv="geef">' + icon('message') + 'Feedback geven</button></div>';
    if (d.scores.n >= 3) html += '<p class="small">' + icon('check') + ' Jouw feedback aan anderen: gemiddeld <b>' + String(d.scores.gem).replace('.', ',') + ' van 5</b> bruikbaar (' + d.scores.n + ' scores).</p>';
    html += '<p class="small"><button type="button" class="kma-chip-btn" data-pv="inbox">Alle ontvangen kaarten</button> <button type="button" class="kma-chip-btn" data-pv="teamleider">Alle feedback van je teamleider</button></p>';
    return html;
  }
  /** T11: alleen iets dat actie vraagt telt mee voor het rode bolletje. */
  function actieTelling() { var d = postvakData(); return d.nieuw + d.vragen.length + (d.nieuwFb || 0); }

  /* ---------------- Vandaag: startpad, weekdoel en tegels ---------------- */
  function startpad() {
    var n = function (re) { var i = idx(re); return i >= 0 ? status(i) : 'open'; };
    var naam = typeof answers !== 'undefined' && answers && String(answers['Voornaam & Achternaam:'] || answers['Voornaam + Achternaam:'] || '').trim();
    var test = window.KMAHex && typeof hexacoQuestionsSelf !== 'undefined' ? KMAHex.isComplete(KMAHex.score(hexacoSelfAnswers, hexacoQuestionsSelf)) : n(/Persoonlijkheidstest/) === 'klaar';
    return [
      { t: 'Je profiel', ok: !!naam, i: idx(/Cadet Informatie/) },
      { t: 'De persoonlijkheidstest', ok: !!test, i: idx(/Persoonlijkheidstest/) },
      { t: 'Jij en de 4 V\'s', ok: n(/Gedragscode/) !== 'open', i: idx(/Gedragscode/) },
      { t: 'Je eerste leervraag', ok: n(/SMART/) !== 'open', i: idx(/SMART/) }
    ];
  }
  function tegels() {
    var d = postvakData(), wk = window.kmaWeek ? kmaWeek.week() : '', w = window.kmaWeek ? (kmaWeek.alle()[wk] || {}) : {};
    var ci = getX('smart-checkins', []), ok = ci.filter(function (x) { return x.r === 2; }).length;
    var vandaag = new Date(), ma = new Date(vandaag); ma.setDate(vandaag.getDate() - ((vandaag.getDay() + 6) % 7)); var vanaf = ma.toISOString().slice(0, 10);
    var dtfWeek = (Array.isArray(typeof dtfItems !== 'undefined' ? dtfItems : null) ? dtfItems : []).filter(function (x) { return x && String(x.datum || '') >= vanaf; }).length;
    var gesprek = '';
    (d.fb || []).forEach(function (f) { (f.gesprekken || []).forEach(function (g) { if (g.vervolg && g.vervolg >= vandaag.toISOString().slice(0, 10) && (!gesprek || g.vervolg < gesprek)) gesprek = g.vervolg; }); });
    return { doel: w.doel || '', eva: !!w.eva, t: [
      { k: 'fb', ic: 'message', l: 'Nieuwe feedback', v: String(d.nieuw + (d.nieuwFb || 0)), s: d.vragen.length ? d.vragen.length + ' vraag om feedback' : 'van medecadetten en teamleider', rood: d.nieuw + (d.nieuwFb || 0) + d.vragen.length > 0, go: 'postvak',
        w: 'Kaarten van medecadetten die je nog niet opende, en feedback van je teamleider die je nog niet las.' },
      { k: 'lv', ic: 'target', l: 'Leervraag', v: ci.length ? ok + '/' + ci.length : '–', s: ci.length ? 'weken gelukt' : 'nog geen check-in', go: idx(/SMART/),
        w: 'Je wekelijkse check-in bij je SMART-leervraag: in hoeveel weken het lukte. Zelf bijhouden helpt om een doel te halen (zelfregulatie).' },
      { k: 'dtf', ic: 'calendar', l: 'DTF deze week', v: String(dtfWeek), s: 'feiten vastgelegd', go: idx(/Datum-Tijd-Feit/),
        w: 'Het aantal DTF-feiten met een datum in deze week (vanaf maandag). Concrete feiten zijn de basis voor reflectie en beoordeling.' },
      { k: 'gs', ic: 'users', l: 'Volgend gesprek', v: gesprek ? gesprek.split('-').reverse().slice(0, 2).join('-') : '–', s: gesprek ? 'met je teamleider' : 'nog niet gepland', go: 'gesprek',
        w: 'Het eerstvolgende vervolggesprek uit de gespreksverslagen die je teamleider met je deelde.' }
    ] };
  }
  function vandaagHtml() {
    var sp = startpad(), open = sp.filter(function (x) { return !x.ok; }).length, T = tegels();
    var html = '';
    if (open) html += '<section class="kma-dash-kaart kma-startpad"><h3>' + icon('flag') + 'Je startpad</h3><p class="muted small">Vier stappen om te beginnen. Deze kaart verdwijnt als alles af is.</p><ol>' +
      sp.map(function (x, j) { return '<li class="' + (x.ok ? 'ok' : '') + '"><button type="button" data-sp="' + x.i + '"><span class="kma-sp-nr">' + (x.ok ? icon('check') : j + 1) + '</span>' + esc(x.t) + '</button></li>'; }).join('') + '</ol></section>';
    html += '<section class="kma-dash-kaart"><h3>' + icon('target') + 'Doel van deze week</h3>' + (T.doel ? '<p>' + esc(T.doel) + '</p>' : '<p class="muted">Nog geen weekdoel.</p>') +
      '<button type="button" class="kma-chip-btn" data-dw="' + (T.doel ? 'eva' : 'doel') + '">' + (T.doel ? (T.eva ? 'Evaluatie bekijken' : 'Weekevaluatie') : 'Kies je doel') + '</button></section>';
    html += '<div class="kma-tegels">' + T.t.map(function (x) {
      return '<div class="kma-tegel' + (x.rood ? ' is-actie' : '') + '"><button type="button" class="kma-tegel-knop" data-tg="' + x.k + '"><span class="kma-tegel-l">' + icon(x.ic) + esc(x.l) + '</span><span class="kma-tegel-v">' + esc(x.v) + '</span><span class="kma-tegel-s">' + esc(x.s) + '</span></button>' +
        '<button type="button" class="kma-tegel-waarom" data-tw="' + x.k + '" aria-label="Waarom zie ik dit: ' + esc(x.l) + '">?</button></div>';
    }).join('') + '</div>';
    return { html: html, tegels: T.t };
  }

  /* ---------------- Plaatsen in de pagina ---------------- */
  var laatsteTegels = [];
  function plaats(id, html) {
    var c = document.querySelector('.content-panel'); if (!c) return null;
    var el = document.getElementById(id);
    if (!el) { el = document.createElement('section'); el.id = id; el.className = 'kma-dash-paneel'; }
    el.innerHTML = html;
    if (el.parentNode !== c || c.firstChild !== el) c.insertBefore(el, c.firstChild);
    return el;
  }
  function tekenVandaag() {
    var v = vandaagHtml(); laatsteTegels = v.tegels;
    var el = plaats('kma-dash-vandaag', v.html);
    // de bestaande kaart Vandaag komt eronder
    var kaart = document.getElementById('kma-vandaag'); if (el && kaart && el.nextSibling !== kaart) el.parentNode.insertBefore(kaart, el.nextSibling);
  }
  function tekenWerkboek() { plaats('kma-dash-werkboek', werkboekHtml()); }
  function tekenPostvak() { plaats('kma-dash-postvak', postvakHtml()); }
  function badge() {
    var b = document.querySelector('.kma-bt[data-bt="postvak"]'); if (!b) return;
    var n = 0; try { n = actieTelling(); } catch (e) {}
    var el = b.querySelector('.kma-bt-badge');
    if (!n) { if (el) el.remove(); b.setAttribute('aria-label', 'Postvak'); return; }
    if (!el) { el = document.createElement('i'); el.className = 'kma-bt-badge'; b.appendChild(el); }
    el.textContent = n > 9 ? '9+' : String(n); b.setAttribute('aria-label', 'Postvak, ' + n + ' wacht op je');
  }
  function waarom(k) {
    var x = laatsteTegels.find(function (t) { return t.k === k; }); if (!x || !window.kmaSheet) return;
    kmaSheet({ title: 'Waarom zie ik dit?', items: [{ icon: 'idea', label: x.l, hint: x.w }, window.kmaOnderbouwing ? { icon: 'book', label: 'Wetenschappelijke onderbouwing', hint: 'Waarom werkt het boekje zo?', onClick: function () { kmaOnderbouwing.open(); } } : null].filter(Boolean) });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-wb],[data-wb-alles],[data-pv],[data-sp],[data-dw],[data-tg],[data-tw]'); if (!t) return;
    if (t.hasAttribute('data-wb')) { goToStep(+t.getAttribute('data-wb')); return; }
    if (t.hasAttribute('data-wb-alles')) { var inp = document.getElementById('search-input'); if (window.kmaTabs) kmaTabs.toon(); if (inp) setTimeout(function () { inp.value = zoekterm; try { inp.focus(); inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (x) {} }, 200); return; }
    if (t.hasAttribute('data-sp')) { var i = +t.getAttribute('data-sp'); if (i >= 0) goToStep(i); return; }
    if (t.hasAttribute('data-dw')) { if (window.kmaWeek) (t.getAttribute('data-dw') === 'doel' ? kmaWeek.doel : kmaWeek.evaluatie)(); return; }
    if (t.hasAttribute('data-tw')) { waarom(t.getAttribute('data-tw')); return; }
    if (t.hasAttribute('data-tg')) {
      var x = laatsteTegels.find(function (y) { return y.k === t.getAttribute('data-tg'); }); if (!x) return;
      if (x.go === 'postvak') { if (window.kmaTabs) kmaTabs.kies('postvak'); }
      else if (x.go === 'gesprek') { if (window.kmaGesprek) kmaGesprek.open(); }
      else if (typeof x.go === 'number' && x.go >= 0) goToStep(x.go);
      return;
    }
    var a = t.getAttribute('data-pv'), K = window.kmaKameraad;
    if (a === 'inbox' && K) K.inbox(); else if (a === 'vragen' && K) (K.requests && K.requests().length && K.give ? K.give(K.requests()[0]) : K.open());
    else if (a === 'teamleider' && window.kmaFeedback) kmaFeedback.open(); else if (a === 'vraag' && K) K.ask(); else if (a === 'geef' && K) K.give(null);
  });
  document.addEventListener('input', function (e) { if (e.target && e.target.id === 'kma-wb-zoek') { zoekterm = e.target.value.trim().toLowerCase(); var pos = e.target.selectionStart; tekenWerkboek(); var n = document.getElementById('kma-wb-zoek'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } } });

  window.kmaDash = { FASEN: FASEN, fase: fase, status: status, groeiIdx: function () { return idx(/Mijn groei/); },
    vandaag: tekenVandaag, werkboek: tekenWerkboek, postvak: tekenPostvak, badge: badge, startpad: startpad, tegels: tegels, actieTelling: actieTelling, waarom: waarom };
})();
