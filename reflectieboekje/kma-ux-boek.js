/*
 * Reflectieboekje: gebruiksgemak:
 *  - snelle invoer (+): DTF-feit, 5G-T of Korthagen vanaf elk scherm
 *  - voorbeelden bij 5G-T, Korthagen en DTF (goed en minder goed)
 *  - concept van een DTF-feit blijft bewaard
 *  - status per hoofdstuk in de lijst (leeg / half / klaar) en "nieuw" bij feedback
 *  - ongedaan maken na verwijderen
 *  - zoeken in het hele boekje
 * Loaded last (after kma-boek-feedback.js).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined') return;
  var icon = window.kmaIcon || function () { return ''; };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function st() { return window.kmaStore; }
  function idx(w) { return steps.findIndex(function (s) { return s.widget === w; }); }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function after(ms, fn) { setTimeout(fn, ms); }

  /* ======================= 1. Snelle invoer ======================= */
  var fab = document.createElement('button');
  fab.type = 'button'; fab.id = 'kma-quick-fab'; fab.className = 'kma-quick-fab';
  fab.setAttribute('aria-label', 'Nieuw: snel toevoegen');
  fab.innerHTML = icon('plus') + '<span>Nieuw</span>';
  fab.addEventListener('click', function () {
    kmaSheet({ title: 'Snel toevoegen', items: [
      { icon: 'calendar', label: 'DTF-feit', hint: 'Leg nu vast wat er gebeurde, met datum en tijd', onClick: quickDtf },
      { icon: 'refresh', label: '5G-T-reflectie', hint: 'Nieuwe reflectie in 4 stappen', onClick: function () { goToStep(idx('5gt-multi')); after(80, function () { if (typeof add5GTCase === 'function') add5GTCase(); }); } },
      { icon: 'activity', label: 'Korthagen-reflectie', hint: 'Nieuwe ronde door de ALACT-cirkel', onClick: function () { goToStep(idx('korthagen-multi')); after(80, function () { if (typeof addKorthagenCase === 'function') addKorthagenCase(); }); } }
    ] });
  });
  document.body.appendChild(fab);
  document.body.classList.add('kma-has-quick');
  function quickDtf() {
    goToStep(idx('dtf-logbook'));
    after(120, function () { var b = document.querySelector('[data-act="dtf-open"]'); if (b) b.click(); });
  }

  /* ======================= 2. Voorbeelden ======================= */
  var EX = {
    g1: ['Maandag 07:32 kwam ik bij het appel aan. De sectie stond al opgesteld. De sergeant noteerde mijn naam.', 'Ik was weer eens te laat omdat niemand me had gewaarschuwd.'],
    g2: ['Tijdens: schaamte (7/10) toen de sectie naar me keek. Achteraf: frustratie (5/10) op mezelf.', 'Het voelde gewoon niet goed.'],
    g3: ['Vooraf: "Dit red ik nog wel." Tijdens: "Iedereen vindt mij nu onbetrouwbaar."', 'Ik denk dat de sergeant mij niet mag.'],
    g4: ['Ik rende naar mijn plek, keek naar de grond en zei niets tegen de sergeant.', 'Ik deed normaal.'],
    g5: ['De sectie stond twee minuten extra in de kou. Mijn gedachte "iedereen vindt me onbetrouwbaar" maakte me stil, waardoor ik me niet verontschuldigde.', 'Het viel wel mee.'],
    v: ['Belangrijkste gedachte: "Iedereen vindt mij onbetrouwbaar" (70%). Bewijs ertegen: ik was dit blok alleen deze keer te laat. Alternatief: "Ik maakte één fout en kan die herstellen."', 'Ik weet niet wat ik hier moet invullen.'],
    i: ['Zorg: wat de groep van me denkt (invloed). Actie: mijn excuses aanbieden en de komende week als eerste aantreden (controle).', 'Ik kan er toch niks aan doen.'],
    t: ['Bij elke vroege aantreding zet ik twee wekkers 10 minuten eerder. Meetbaar: 4 weken lang op tijd. Ik probeer het vanaf maandag.', 'Ik ga beter mijn best doen.'],
    actie: ['Ik wilde dat mijn groep binnen 10 minuten klaarstond voor de mars. Ik gaf de opdracht en ging zelf mijn spullen pakken.', 'Er ging iets mis bij de mars.'],
    terugblik: ['Ik wilde snelheid; de groep wilde eerst weten waarom het zo snel moest. Ik voelde me gehaast, zij voelden zich overvallen.', 'Het was chaotisch.'],
    bewustwording: ['Ik geef opdrachten zonder uitleg als ik onder tijdsdruk sta. Dat werkt averechts: vragen kosten dan meer tijd.', 'Ik moet beter communiceren.'],
    alternatieven: ['1) Eerst 30 seconden het doel uitleggen. 2) Taken verdelen per persoon. 3) Een tijdstip noemen in plaats van "snel".', 'Het anders doen.'],
    uitproberen: ['Bij de volgende opdracht noem ik eerst doel en tijdstip, en vraag ik of iemand nog een vraag heeft.', 'Volgende keer beter.'],
    dtf: ['3 nov 08:15, schietbaan: ik zag dat de veiligheidspal van de buurman los zat en meldde dit direct aan de baancommandant.', 'Ik was weer heel oplettend op de schietbaan.']
  };
  function exHtml(k) {
    var e = EX[k]; if (!e) return '';
    return '<details class="kma-ex"><summary>' + icon('idea') + 'Voorbeeld</summary><div class="kma-ex-good"><b>Goed</b> ' + esc(e[0]) + '</div><div class="kma-ex-bad"><b>Minder goed</b> ' + esc(e[1]) + '</div></details>';
  }
  function addExamples() {
    var w = steps[currentStepIndex] && steps[currentStepIndex].widget, card, k;
    if (w === '5gt-multi') { card = document.querySelector('.kma-flow .kma-flow-card'); k = window.kma5gtNode; }
    else if (w === 'korthagen-multi') { card = document.querySelector('.kma-flow .kma-flow-card, .kma-alact ~ .question-card, #widget-container .question-card'); k = window.kmaKStep; }
    else if (w === 'dtf-logbook') { card = document.querySelector('.kma-dtf-form'); k = 'dtf'; }
    if (!card || !k || card.querySelector('.kma-ex')) return;
    var anchor = card.querySelector('.muted.small') || card.querySelector('#kma-dtf-hint') || card.querySelector('label');
    if (anchor) anchor.insertAdjacentHTML('afterend', exHtml(k)); else card.insertAdjacentHTML('afterbegin', exHtml(k));
  }

  /* ======================= 3. Concept van een DTF-feit ======================= */
  var DRAFT = 'kma-x-dtf-draft';
  function getDraft() { try { return JSON.parse(st().getItem(DRAFT) || 'null'); } catch (e) { return null; } }
  function restoreDraft() {
    var t = document.getElementById('dtf-feit'), d = getDraft();
    if (!t || t.value || !d || !d.feit) return;
    t.value = d.feit;
    var a = document.getElementById('dtf-aspect'); if (a && d.aspect) a.value = d.aspect;
    var form = document.querySelector('.kma-dtf-form'); if (form) form.classList.remove('closed');
    if (!document.getElementById('kma-draft-note')) t.insertAdjacentHTML('beforebegin', '<p class="muted small" id="kma-draft-note">' + icon('save') + ' Je concept is teruggezet.</p>');
  }
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'dtf-feit' && e.target.id !== 'dtf-aspect') return;
    var f = document.getElementById('dtf-feit'), a = document.getElementById('dtf-aspect');
    try { st().setItem(DRAFT, JSON.stringify({ feit: f ? f.value : '', aspect: a ? a.value : '', at: Date.now() })); } catch (er) {}
  });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-act="dtf-cancel"]')) { try { st().removeItem(DRAFT); } catch (er) {} } }, true);
  var origAddDtf = window.addDTFItem;
  if (typeof origAddDtf === 'function') {
    window.addDTFItem = addDTFItem = function () {
      var n = dtfItems.length, r = origAddDtf.apply(this, arguments);
      if (dtfItems.length > n) { try { st().removeItem(DRAFT); } catch (e) {} }
      return r;
    };
  }

  /* ======================= 4. Status per hoofdstuk ======================= */
  function markRings() {
    var links = document.querySelectorAll('#step-nav .step-link');
    var fb = window.kmaFeedback, unread = fb && fb.unread && fb.unread();
    links.forEach(function (link, pos) {
      // De inhoudsopgave is gegroepeerd: de plek in de lijst is niet het hoofdstuk zelf.
      var a = link.getAttribute('data-idx'), i = a == null ? pos : +a;
      var s = window.kmaChapterStatus ? kmaChapterStatus(i) : null; if (!s) return;
      var state = s.count ? (s.done > 0 ? 'full' : 'empty') : (!s.total ? 'empty' : s.done >= s.total ? 'full' : s.done > 0 ? 'half' : 'empty');
      var ring = link.querySelector('.kma-ring');
      if (!ring) { ring = document.createElement('span'); ring.className = 'kma-ring'; ring.setAttribute('aria-hidden', 'true'); link.insertBefore(ring, link.firstChild); }
      ring.className = 'kma-ring ' + state;
      ring.title = state === 'full' ? 'Klaar' : state === 'half' ? 'Deels ingevuld' : 'Nog niet begonnen';
      var dot = link.querySelector('.kma-new');
      var has = unread && fb.cardFor && (function () { try { return !!fb.cardFor(i); } catch (e) { return false; } })();
      if (has && !dot) link.insertAdjacentHTML('beforeend', '<span class="kma-new">nieuw</span>');
      if (!has && dot) dot.remove();
    });
  }

  /* ======================= 5. Ongedaan maken ======================= */
  function undoable(name, snapshot, restore, label) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      var snap = snapshot(), args = arguments, before = JSON.stringify(snap.data);
      var oc = window.confirm; window.confirm = function () { return true; }; window.__kmaConfirmYes = true;
      var r;
      try { r = orig.apply(this, args); } finally { window.confirm = oc; window.__kmaConfirmYes = false; }
      if (JSON.stringify(snapshot().data) !== before) kmaUndoToast(label, function () { restore(snap); });
      return r;
    };
  }
  function putKey(key, v) { try { kmaStore.setItem(key, JSON.stringify(v)); } catch (e) {} if (typeof dbSet === 'function') dbSet(key, v); }
  undoable('deleteDTFItem', function () { return { data: clone(dtfItems) }; }, function (s) { dtfItems = s.data; putKey(DTF_KEY, dtfItems); renderWidgets(); updateProgress(); }, 'Feit verwijderd');
  undoable('deleteCurrent5GTCase', function () { return { data: clone(cases5GT), i: active5GTIndex }; }, function (s) { cases5GT = s.data; active5GTIndex = s.i; save5GTCases(); renderWidgets(); }, 'Reflectie verwijderd');
  undoable('deleteCurrentKorthagenCase', function () { return { data: clone(casesKorthagen), i: activeKorthagenIndex }; }, function (s) { casesKorthagen = s.data; activeKorthagenIndex = s.i; putKey(CASES_KORTHAGEN_KEY, casesKorthagen); renderWidgets(); updateProgress(); }, 'Reflectie verwijderd');
  undoable('deleteFitnessLog', function () { return { data: clone(fitnessLogs) }; }, function (s) { fitnessLogs = s.data; putKey(FITNESS_KEY, fitnessLogs); renderWidgets(); }, 'Meting verwijderd');
  undoable('deleteObserverProfile', function () { return { data: clone(hexacoObservers) }; }, function (s) { hexacoObservers = s.data; putKey(HEXACO_OBSERVERS_KEY, hexacoObservers); if (typeof renderObserverProfiles === 'function') renderObserverProfiles(); renderWidgets(); }, 'Observator verwijderd');
  undoable('removeProfilePhoto', function () { return { data: kmaStore.getItem('kma-profile-photo') || '' }; }, function (s) { try { kmaStore.setItem('kma-profile-photo', s.data); } catch (e) {} renderWidgets(); }, 'Foto verwijderd');
  undoable('deleteJargonItem', function () { return { data: clone(jargonItems) }; }, function (s) { jargonItems = s.data; putKey(JARGON_KEY, jargonItems); renderWidgets(); }, 'Begrip verwijderd');

  /* ======================= 6. Zoeken in het hele boekje ======================= */
  var search = document.getElementById('search-input'), box = null;
  function results(q) {
    q = q.toLowerCase();
    var out = [], hit = function (t) { return String(t || '').toLowerCase().indexOf(q) >= 0; };
    var snip = function (t) { t = String(t || ''); var i = t.toLowerCase().indexOf(q); if (i < 0) return t.slice(0, 80); var a = Math.max(0, i - 30); return (a ? '…' : '') + t.slice(a, i + q.length + 50) + '…'; };
    steps.forEach(function (s, i) {
      if (s.verborgen) return;
      if (hit(s.title)) out.push({ step: i, kind: 'Hoofdstuk', label: s.title, hint: '' });
      (s.questions || []).forEach(function (qq) { var a = answers[qq]; if (typeof a === 'string' && (hit(a) || hit(qq)) && a.trim()) out.push({ step: i, kind: 'Antwoord', label: qq, hint: snip(hit(a) ? a : qq) }); });
    });
    (dtfItems || []).forEach(function (d) { if (d && hit(d.feit)) out.push({ step: idx('dtf-logbook'), kind: 'DTF', label: snip(d.feit), hint: d.datum || '' }); });
    (cases5GT || []).forEach(function (c, ci) { if (!c) return; var t = Object.keys(c).filter(function (k) { return typeof c[k] === 'string'; }).map(function (k) { return c[k]; }).join(' '); if (hit(t)) out.push({ step: idx('5gt-multi'), kind: '5G-T', label: c.title || '5G-T', hint: snip(t), act: function () { select5GTCase(ci); } }); });
    (casesKorthagen || []).forEach(function (c, ci) { if (!c) return; var t = Object.keys(c).filter(function (k) { return typeof c[k] === 'string'; }).map(function (k) { return c[k]; }).join(' '); if (hit(t)) out.push({ step: idx('korthagen-multi'), kind: 'Korthagen', label: c.title || 'Korthagen', hint: snip(t), act: function () { if (typeof selectKorthagenCase === 'function') selectKorthagenCase(ci); } }); });
    (jargonItems || []).forEach(function (j) { if (j && (hit(j.term) || hit(j.def))) out.push({ step: idx('jargon-list'), kind: 'Begrip', label: j.term, hint: snip(j.def) }); });
    // 4.8.3: ook de levenslijn, de als-dan-plannen en de notities bij fitheid
    try { (typeof timelineItems !== 'undefined' ? timelineItems : []).forEach(function (t) { if (t && hit(t.text)) out.push({ step: idx('timeline'), kind: 'Levenslijn', label: (t.year ? t.year + ' · ' : '') + snip(t.text), hint: '' }); }); } catch (e) {}
    try { (JSON.parse(kmaStore.getItem('kma-x-plannen') || '[]') || []).forEach(function (pl) { if (pl && (hit(pl.als) || hit(pl.dan))) out.push({ step: steps.findIndex(function (s) { return /SMART/.test(s.title); }), kind: 'Plan', label: 'Als ' + (pl.als || '') + ', dan ' + (pl.dan || ''), hint: '' }); }); } catch (e) {}
    try { (typeof fitnessLogs !== 'undefined' ? fitnessLogs : []).forEach(function (f) { if (f && hit(f.notes)) out.push({ step: idx('fitheid'), kind: 'Fitheid', label: snip(f.notes), hint: f.date || '' }); }); } catch (e) {}
    return out.slice(0, 40);
  }
  function showResults(q) {
    if (!search) return;
    if (!box) { box = document.createElement('div'); box.className = 'kma-search-results'; var host = search.parentElement && getComputedStyle(search.parentElement).display.indexOf('flex') >= 0 ? search.parentElement : search; host.insertAdjacentElement('afterend', box); }
    if (!q || q.trim().length < 2) { box.innerHTML = ''; box.hidden = true; return; }
    var r = results(q.trim());
    box.hidden = false;
    box.innerHTML = '<div class="kma-sr-head">' + (r.length ? r.length + (r.length === 40 ? '+' : '') + (r.length === 1 ? ' resultaat' : ' resultaten') + ' in je hele boekje' : 'Niets gevonden in je boekje') + '</div>' +
      r.map(function (x, i) { return '<button type="button" class="kma-sr" data-sr="' + i + '"><em>' + esc(x.kind) + '</em><strong>' + esc(x.label) + '</strong>' + (x.hint ? '<small>' + esc(x.hint) + '</small>' : '') + '</button>'; }).join('');
    box.__r = r;
  }
  if (search) {
    search.setAttribute('placeholder', 'Zoek in je hele boekje…');
    search.addEventListener('input', function () { clearTimeout(search.__t); var v = search.value; search.__t = setTimeout(function () { showResults(v); }, 200); });
    document.addEventListener('click', function (e) {
      var b = e.target.closest('.kma-sr'); if (!b || !box || !box.__r) return;
      var x = box.__r[Number(b.getAttribute('data-sr'))]; if (!x) return;
      search.value = ''; if (typeof filterQuestions === 'function') filterQuestions(''); showResults('');
      if (x.step >= 0) goToStep(x.step);
      if (x.act) after(60, x.act);
      window.scrollTo(0, 0);
    });
  }

  /* ======================= Hooks ======================= */
  var origRW = window.renderWidgets;
  if (typeof origRW === 'function') window.renderWidgets = renderWidgets = function () { var r = origRW.apply(this, arguments); try { addExamples(); restoreDraft(); } catch (e) {} return r; };
  var origUP = window.updateProgress;
  if (typeof origUP === 'function') window.updateProgress = updateProgress = function () { var r = origUP.apply(this, arguments); try { markRings(); } catch (e) {} return r; };
  var origRN = window.renderNav;
  if (typeof origRN === 'function') window.renderNav = renderNav = function () { var r = origRN.apply(this, arguments); try { markRings(); } catch (e) {} return r; };
  ['shareViaBluetoothNative', 'openCadetQRModal'].forEach(function (n, i) {
    var o = window[n]; if (typeof o !== 'function') return;
    window[n] = function () { if (window.kmaMarkShared) kmaMarkShared(i ? 'QR-code' : 'bestand'); return o.apply(this, arguments); };
  });
  try { markRings(); addExamples(); restoreDraft(); } catch (e) {}
})();

/* =======================================================================================
   Mijlpalen (4.3.7): acht insignes in schildvorm, te bekijken via ⋮ → Mijlpalen. Behaalde insignes blijven
   behaald (met datum), ook als de gegevens later veranderen. Bij een nieuw insigne verschijnt onderin kort een melding.
   ======================================================================================= */
(function () {
  'use strict';
  if (typeof steps === 'undefined') return;
  var KEY = 'kma-x-mijlpalen';
  function getX(k, d) { try { var v = JSON.parse(kmaStore.getItem('kma-x-' + k)); return v == null ? d : v; } catch (e) { return d; } }
  function load() { try { var v = JSON.parse(kmaStore.getItem(KEY)); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } }
  function save(v) { try { kmaStore.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ans(k) { try { return String((answers || {})[k] || '').trim(); } catch (e) { return ''; } }
  // the page keeps its lists in top-level "let" variables (not on window)
  function g(name, d) { try { return name === 'cases5GT' ? cases5GT : name === 'dtfItems' ? dtfItems : name === 'hexacoObservers' ? hexacoObservers : d; } catch (e) { return d; } }

  var SYM = {
    star: '<path stroke="none" d="M27 17l3.2 6.6 7.2 1-5.2 5 1.3 7.2L27 33.4l-6.5 3.4 1.3-7.2-5.2-5 7.2-1z"/>',
    eye: '<path fill="none" stroke-width="2.4" d="M15 31c4-6 8-8 12-8s8 2 12 8c-4 6-8 8-12 8s-8-2-12-8z"/><circle stroke="none" cx="27" cy="31" r="4"/>',
    ten: '<text x="27" y="37" text-anchor="middle" font-family="Verdana, sans-serif" font-weight="700" font-size="16" stroke="none">10</text>',
    chev: '<path fill="none" stroke-width="3" stroke-linejoin="round" d="M17 24l10 6 10-6M17 31l10 6 10-6M17 38l10 6 10-6"/>',
    ring: '<circle fill="none" stroke-width="2.6" cx="27" cy="31" r="10"/><text x="27" y="35" text-anchor="middle" font-family="Verdana, sans-serif" font-weight="700" font-size="9" stroke="none">360</text>',
    check: '<path fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" d="M18 31l6 6 12-13"/>',
    heart: '<path stroke="none" d="M27 41s-11-7-11-14a6 6 0 0 1 11-3 6 6 0 0 1 11 3c0 7-11 14-11 14z"/>',
    book: '<path fill="none" stroke-width="2.4" stroke-linejoin="round" d="M16 22h9c1.5 0 2 1 2 2v17c0-1-1-2-2-2h-9zM38 22h-9c-1.5 0-2 1-2 2v17c0-1 1-2 2-2h9z"/>'
  };
  function shield(sym, on) {
    var gold = '#c5b983', rim = on ? gold : '#9aa39b', fg = on ? gold : '#9aa39b';
    return '<svg viewBox="0 0 54 62" aria-hidden="true"><path d="M27 2 L50 10 V30 C50 45 40 55 27 60 C14 55 4 45 4 30 V10 Z" fill="' + (on ? '#18251d' : 'none') + '" stroke="' + rim + '" stroke-width="' + (on ? 3 : 2) + '"' + (on ? '' : ' stroke-dasharray="4 3"') + '/>' +
      (on ? '<path d="M27 7 L45 13.5 V30 C45 42 37 50.5 27 54.5 C17 50.5 9 42 9 30 V13.5 Z" fill="none" stroke="' + gold + '" stroke-opacity=".45" stroke-width="1"/>' : '') +
      '<g fill="' + fg + '" stroke="' + fg + '">' + SYM[sym] + '</g></svg>';
  }
  /** Longest run of weeks in a row with a (partly) successful check-in. */
  function streak() {
    var weeks = (getX('smart-checkins', []) || []).filter(function (x) { return x && x.week && Number(x.r) >= 1; }).map(function (x) { return new Date(x.week + 'T12:00:00').getTime(); }).sort();
    var best = 0, run = 0, prev = null;
    weeks.forEach(function (t) { run = prev != null && Math.round((t - prev) / 864e5) === 7 ? run + 1 : (prev === t ? run : 1); prev = t; if (run > best) best = run; });
    return best;
  }
  function kernDone() {
    if (!window.kmaChapterOrder || !window.kmaChapterStatus || !window.kmaChapterGroup) return false;
    var kern = kmaChapterOrder().filter(function (i) { return kmaChapterGroup(i) === 'kern'; });
    return kern.length > 0 && kern.every(function (i) { var st = kmaChapterStatus(i); return st && (st.count ? st.done > 0 : (st.total > 0 && st.done >= st.total)); });
  }
  var LIST = [
    { id: 'profiel', sym: 'star', t: 'Eerste stap', d: 'Profiel ingevuld', ok: function () { return !!(ans('Voornaam & Achternaam:') && ans('Peoplesoft Nummer:') && ans('OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):')); } },
    { id: '5gt', sym: 'eye', t: 'Reflector', d: 'Eerste 5G-T', ok: function () { return (g('cases5GT', []) || []).some(function (c) { return Object.keys(c || {}).some(function (k) { return !/^(id|title|model)$/.test(k) && typeof c[k] === 'string' && c[k].trim(); }); }); } },
    { id: 'dtf', sym: 'ten', t: 'Waarnemer', d: '10 DTF-feiten', ok: function () { return (g('dtfItems', []) || []).length >= 10; } },
    { id: 'reeks', sym: 'chev', t: 'Volhouder', d: '4 weken op rij', ok: function () { return streak() >= 4; } },
    { id: '360', sym: 'ring', t: '360°', d: '3 anderen gaven feedback', ok: function () { return (g('hexacoObservers', []) || []).length >= 3; } },
    { id: 'kern', sym: 'check', t: 'Kern', d: 'Kern afgerond', ok: kernDone },
    { id: 'fit', sym: 'heart', t: 'Fit & scherp', d: '3 stresschecks', ok: function () { return (getX('pss', []) || []).length >= 3; } },
    { id: 'portfolio', sym: 'book', t: 'Portfolio', d: 'Eerste PDF', ok: function () { return false; } }
  ];
  var LONG = { profiel: 'Profiel ingevuld met naam, Peoplesoft-nummer en krijgsmachtdeel', '5gt': 'Eerste 5G-T-reflectie geschreven', dtf: '10 DTF-feiten vastgelegd', reeks: '4 weken op rij je SMART-check-in (deels) gelukt', '360': 'Drie anderen gaven 360°-feedback', kern: 'Alle hoofdstukken van de kern afgerond', fit: 'Drie stresschecks ingevuld', portfolio: 'Je eerste portfolio als PDF gemaakt' };
  function fmt(iso) { try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return ''; } }

  function toast(m) {
    var old = document.querySelector('.kma-ms-toast'); if (old) old.remove();
    var t = document.createElement('div'); t.className = 'kma-ms-toast'; t.setAttribute('role', 'status');
    t.innerHTML = shield(m.sym, true) + '<div><b>Insigne behaald</b><span>' + esc(m.t) + ': ' + esc(LONG[m.id]) + '</span></div>';
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 400); }, 4200);
  }
  /** Checks all milestones; the first time only records them, afterwards a new one gives a message. */
  function check(quiet) {
    var got = load(), first = !got; got = got || {};
    var fresh = [];
    LIST.forEach(function (m) { if (!got[m.id]) { var ok = false; try { ok = m.ok(); } catch (e) {} if (ok) { got[m.id] = new Date().toISOString(); fresh.push(m); } } });
    if (fresh.length || first) save(got);
    if (!first && !quiet) fresh.forEach(function (m, i) { setTimeout(function () { toast(m); }, i * 4700); });
    return fresh.map(function (m) { return m.id; });
  }
  function count() { var got = load() || {}; return LIST.filter(function (m) { return got[m.id]; }).length; }
  function cardHtml() {
    var got = load() || {}, n = count();
    return '<div class="kma-ms-head"><p>' + n + ' van ' + LIST.length + ' insignes behaald. Tik op een insigne voor meer uitleg.</p></div><div class="kma-ms-grid">' +
      LIST.map(function (m) { var on = !!got[m.id]; return '<div class="kma-ms-badge' + (on ? '' : ' lock') + '" title="' + esc(LONG[m.id] + (on ? ' · ' + fmt(got[m.id]) : ' · nog niet behaald')) + '">' + shield(m.sym, on) + '<span>' + esc(m.t) + '</span><small>' + esc(m.d) + '</small></div>'; }).join('') +
      '</div><div class="kma-ms-bar" aria-hidden="true"><i style="width:' + Math.round(n / LIST.length * 100) + '%"></i></div>';
  }
  /** ⋮ → Mijlpalen: the insignia in a sheet (not on the start page). */
  function open() {
    var old = document.getElementById('kma-ms-ov'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'kma-ms-ov'; ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-ms" role="dialog" aria-modal="true" aria-label="Mijlpalen" style="transform:none"><div class="kma-sheet-grip"></div><div class="kma-sheet-title">Mijlpalen</div>' + cardHtml() +
      '<p class="kma-ms-why" id="kma-ms-why" aria-live="polite"></p><div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-x="close">Sluiten</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-x="close"]')) { ov.remove(); return; }
      var b = e.target.closest('.kma-ms-badge'); if (b) ov.querySelector('#kma-ms-why').textContent = b.getAttribute('title');
    });
  }
  window.kmaMilestones = {
    list: function () { var got = load() || {}; return LIST.map(function (m) { return { id: m.id, title: m.t, desc: LONG[m.id], at: got[m.id] || '' }; }); },
    mark: function (id) { var got = load() || {}, m = LIST.find(function (x) { return x.id === id; }); if (!m || got[id]) return; got[id] = new Date().toISOString(); save(got); toast(m); },
    check: check,
    open: open,
    summary: function () { return count() + ' van ' + LIST.length + ' insignes behaald'; }
  };
  // check after every change (debounced) and on every chapter
  var tm = null;
  function soon() { clearTimeout(tm); tm = setTimeout(function () { check(false); }, 700); }
  ['updateProgress', 'renderStep'].forEach(function (n) {
    var f = window[n]; if (typeof f !== 'function') return;
    window[n] = function () { var r = f.apply(this, arguments); soon(); return r; };
  });
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-act="pf-print"]')) window.kmaMilestones.mark('portfolio'); }, true);
  check(true);
})();

/* =======================================================================================
   Kleur per krijgsmachtdeel (4.3.7): de kopbalk, de streep eronder en de accentkleur volgen het
   krijgsmachtdeel uit het profiel; het embleem van het krijgsmachtdeel staat naast het KMA-embleem.
   ======================================================================================= */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaOpcoKey) return;
  var Q = 'OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):';
  var cur = null;
  function apply() {
    var v = ''; try { v = (answers || {})[Q] || ''; } catch (e) {}
    var k = kmaOpcoKey(v);
    if (k === cur) return; cur = k;
    var b = document.body;
    ['clas', 'czsk', 'clrs', 'kmar'].forEach(function (x) { b.classList.toggle('kma-opco-' + x, x === k); });
    var old = document.querySelector('.kma-opco-hero'); if (old) old.remove();
    var logo = document.querySelector('.hero-logo');
    if (k && logo && window.kmaOpcoIcon) logo.insertAdjacentHTML('afterend', kmaOpcoIcon(v, 'kma-opco-hero'));
  }
  window.kmaOpcoApply = apply;
  document.addEventListener('input', function () { setTimeout(apply, 50); });
  document.addEventListener('change', function () { setTimeout(apply, 50); });
  kmaAfter('renderStep', apply);
  apply();
})();
