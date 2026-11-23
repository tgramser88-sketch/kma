/*
 * Reflectieboekje: als-dan-plannen bij de SMART-leervraag (4.5.0).
 * Gebaseerd op implementatie-intenties (Gollwitzer, 1999; Gollwitzer & Sheeran, 2006):
 * een vooraf gemaakte koppeling "Als [situatie], dan [gedrag]" maakt de kans groter dat je het gedrag
 * ook onder druk uitvoert.
 *  - maximaal drie plannen per leervraag (kma-x-plannen: [{id, als, dan, at, from}]);
 *  - per plan een wekelijkse check-in Gelukt / Deels / Niet met "Wat hielp?" (kma-x-plan-checkins);
 *    het gemiddelde gaat ook in de bestaande weekstrip (kma-x-smart-checkins), zodat Vandaag, het gesprek
 *    en Mijn groei gewoon blijven werken;
 *  - na twee weken "deels" of "niet" stelt de app voor het plan aan te passen;
 *  - een DTF-feit kun je koppelen aan een plan (kma-x-plan-dtf: {dtfId: planId}).
 *
 * 4.7.0, twee aanvullingen die de leervraag sterker maken:
 *  - Doel in vijf niveaus (Goal Attainment Scaling; Kiresuk & Sherman, 1968): de cadet beschrijft vooraf wat
 *    -2 (veel minder dan verwacht) tot +2 (veel meer dan verwacht) betekent, met 0 als het verwachte resultaat
 *    op de einddatum. Daarna geeft hij af en toe aan waar hij staat (kma-x-gas: {n: {...}, scores: [{week, date, v}]}).
 *  - Het obstakel (WOOP: Wish, Outcome, Obstacle, Plan; Oettingen): eerst het mooiste resultaat voor je zien,
 *    dan het belangrijkste obstakel in jezelf benoemen, en dat obstakel als "als" gebruiken in een plan
 *    (kma-x-woop: {uitkomst, obstakel}).
 * Window: kmaPlannen { list, add, count, openAdd }, kmaDoelNiveaus { LEVELS, data, now }.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaStore) return;
  var MAX = 3;
  var icon = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var toast = function (m, t) { if (window.kmaToast) kmaToast(m, t); };
  function getX(k, d) {
    try { var v = kmaStore.getItem('kma-x-' + k); if (v == null) return d; v = JSON.parse(v); if (Array.isArray(d) !== Array.isArray(v) || typeof v !== 'object' || !v) return d; return v; } catch (e) { return d; }
  }
  function setX(k, v) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(v)); } catch (e) {} if (typeof triggerSavePulse === 'function') triggerSavePulse(); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function wk() { return window.KMAPatterns ? KMAPatterns.thisWeekKey() : today(); }
  function isSmart() { var s = steps[currentStepIndex]; return !!(s && /SMART/.test(s.title)); }
  function smartIdx() { return steps.findIndex(function (s) { return /SMART/.test(s.title); }); }

  /* ---------------- Gegevens ---------------- */
  function list() { return getX('plannen', []).filter(function (p) { return p && p.id && (p.als || p.dan); }); }
  function checkins() { return getX('plan-checkins', []).filter(function (c) { return c && c.id; }); }
  function links() { return getX('plan-dtf', {}); }
  function add(p) {
    var l = list();
    if (l.length >= MAX) { toast('Je hebt al drie plannen. Pas eerst een plan aan of verwijder er een.', 'error'); return false; }
    var als = String(p.als || '').trim(), dan = String(p.dan || '').trim();
    if (!als || !dan) { toast('Vul zowel "als" als "dan" in', 'error'); return false; }
    l.push({ id: 'p' + Date.now().toString(36), als: als, dan: dan, at: new Date().toISOString(), from: p.from || '' });
    setX('plannen', l);
    return true;
  }
  function update(id, patch) { setX('plannen', list().map(function (p) { if (p.id === id) Object.keys(patch).forEach(function (k) { p[k] = patch[k]; }); return p; })); }
  function remove(id) {
    setX('plannen', list().filter(function (p) { return p.id !== id; }));
    setX('plan-checkins', checkins().filter(function (c) { return c.id !== id; }));
    var L = links(); Object.keys(L).forEach(function (k) { if (L[k] === id) delete L[k]; }); setX('plan-dtf', L);
  }
  function stats(id) {
    var ci = checkins().filter(function (c) { return c.id === id; }).sort(function (a, b) { return a.week < b.week ? -1 : 1; });
    var L = links(), dtf = (typeof dtfItems !== 'undefined' && Array.isArray(dtfItems)) ? dtfItems : null;
    var nDtf = Object.keys(L).filter(function (k) { return L[k] === id && (!dtf || dtf.some(function (d) { return String(d.id) === k; })); }).length;
    var last2 = ci.slice(-2);
    return {
      gelukt: ci.filter(function (c) { return c.r === 2; }).length, n: ci.length, dtf: nDtf,
      stuck: last2.length === 2 && last2.every(function (c) { return c.r < 2; }) && !last2.some(function (c) { return c.week < (window.__kmaPlanEdited || {})[id]; }),
      thisWeek: ci.find(function (c) { return c.week === wk(); }) || null
    };
  }
  function low(t) { t = String(t || '').trim(); return /^[A-ZÀ-Ý][a-zà-ÿ]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
  function plan(p) { return '<p class="kma-plan-zin"><strong>Als</strong> ' + esc(low(p.als.replace(/^als\s+/i, '')).replace(/,\s*$/, '')) + ', <strong>dan</strong> ' + esc(low(p.dan.replace(/^dan\s+/i, ''))) + '</p>'; }
  window.kmaPlanZin = plan;

  /* ---------------- Kaart in de SMART-leervraag ---------------- */
  var editing = null, draft = { als: '', dan: '' };
  function card() {
    var l = list();
    var rows = l.map(function (p) {
      if (editing === p.id) {
        return '<div class="kma-plan" data-plan="' + esc(p.id) + '">' + form(p.als, p.dan, 'save') + '</div>';
      }
      var s = stats(p.id);
      return '<div class="kma-plan" data-plan="' + esc(p.id) + '">' + plan(p) +
        '<div class="kma-plan-meta">' +
        (s.n ? '<span class="kma-pill ok">' + s.gelukt + (s.gelukt === 1 ? ' keer' : ' keer') + ' gelukt</span>' : '<span class="kma-pill">Nog geen check-in</span>') +
        (s.dtf ? '<span class="kma-pill">' + s.dtf + (s.dtf === 1 ? ' DTF-feit' : ' DTF-feiten') + '</span>' : '') +
        (p.from ? '<span class="kma-pill">Voorstel van ' + esc(p.from) + '</span>' : '') + '</div>' +
        (s.stuck ? '<div class="kma-plan-hint">' + icon('idea') + '<span>Twee weken op rij niet helemaal gelukt. Misschien is de situatie te breed of het gedrag te groot. Pas je plan aan?</span></div>' : '') +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn sm is-primary" data-plan-act="moment">' + icon('check') + 'Net gebeurd: gelukt?</button>' +
        '<button type="button" class="kma-icon-btn sm" data-plan-act="edit">' + icon('edit') + 'Aanpassen</button>' +
        '<button type="button" class="kma-icon-btn sm" data-plan-act="del" aria-label="Plan verwijderen">' + icon('trash') + 'Verwijderen</button></div></div>';
    }).join('');
    var addBox = l.length < MAX && !editing ? '<div class="kma-plan-new">' + form(draft.als, draft.dan, 'add') + '<p class="muted small">Maximaal drie plannen per leervraag: minder is sterker.</p></div>' : '';
    return '<div class="kma-card-block kma-plannen" id="kma-plannen"><h4>' + icon('repeat') + 'Als-dan-plannen</h4>' +
      '<p class="muted">Spreek vooraf af wát je doet in een concrete situatie. Zo doe je het ook als het druk is.</p>' +
      (rows ? '<div class="kma-plan-list">' + rows + '</div>' : '') + addBox + '</div>';
  }
  function form(als, dan, act) {
    return '<label class="kma-plan-lab">Als (de situatie)<input type="text" data-plan-f="als" maxlength="160" value="' + esc(als) + '" placeholder="bijv. ik feedback krijg die ik oneens ben"/></label>' +
      '<label class="kma-plan-lab">Dan (wat je doet)<input type="text" data-plan-f="dan" maxlength="160" value="' + esc(dan) + '" placeholder="bijv. vraag ik eerst om een voorbeeld"/></label>' +
      (act === 'add' ? '<button type="button" class="kma-icon-btn is-primary" data-plan-act="add">' + icon('plus') + 'Plan toevoegen</button>'
        : '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-plan-act="cancel">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-plan-act="save">' + icon('save') + 'Opslaan</button></div>');
  }

  /* ---------------- Doel in vijf niveaus (Goal Attainment Scaling) ---------------- */
  var LEVELS = [
    { v: 2, k: '2', l: '+2', t: 'Veel meer dan verwacht' },
    { v: 1, k: '1', l: '+1', t: 'Iets meer dan verwacht' },
    { v: 0, k: '0', l: '0', t: 'Het verwachte resultaat op je einddatum' },
    { v: -1, k: '-1', l: '\u22121', t: 'Iets minder dan verwacht' },
    { v: -2, k: '-2', l: '\u22122', t: 'Veel minder dan verwacht (vaak: waar je nu staat)' }
  ];
  var HINT = { '2': 'bijv. ik geef in elke briefing ongevraagd het doel en de tijdlijn', '1': 'bijv. ik noem het doel ook onder tijdsdruk', '0': 'bijv. ik noem in 4 van de 5 briefings eerst het doel', '-1': 'bijv. ik noem het doel als ik eraan herinnerd word', '-2': 'bijv. ik begin mijn briefing meestal met de taken' };
  function gas() { var g = getX('gas', {}); if (!g.n || typeof g.n !== 'object') g.n = {}; if (!Array.isArray(g.scores)) g.scores = []; return g; }
  function gasFilled(g) { return LEVELS.every(function (L) { return String(g.n[L.k] || '').trim(); }); }
  function gasNow(g) { g = g || gas(); var s = g.scores.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }); return s.length ? s[s.length - 1] : null; }
  var gasEdit = false;
  function lvl(v) { return LEVELS.find(function (L) { return L.v === v; }); }
  function gasCard() {
    var g = gas(), filled = gasFilled(g), now = gasNow(g);
    var head = '<div class="kma-card-block kma-gas" id="kma-gas"><h4>' + icon('trend') + 'Doel in vijf niveaus</h4>';
    if (!filled || gasEdit) {
      return head + '<p class="muted">Beschrijf vooraf wat je op je einddatum ziet als het precies lukt (0), en wat minder of meer is. Zo maak je je leervraag echt meetbaar en zie je je groei op een vaste schaal.</p>' +
        LEVELS.map(function (L) {
          return '<label class="kma-plan-lab kma-gas-lab' + (L.v === 0 ? ' is-zero' : '') + '"><span><b>' + L.l + '</b> ' + esc(L.t) + '</span><input type="text" data-gas-f="' + L.k + '" maxlength="200" value="' + esc(g.n[L.k] || '') + '" placeholder="' + esc(HINT[L.k]) + '"/></label>';
        }).join('') +
        '<div class="kma-row-btns">' + (filled ? '<button type="button" class="kma-icon-btn" data-gas-act="cancel">Annuleren</button>' : '') + '<button type="button" class="kma-icon-btn is-primary" data-gas-act="save">' + icon('save') + 'Niveaus opslaan</button></div></div>';
    }
    var hist = g.scores.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(-10), V = window.KMAViz;
    return head + '<div class="kma-gas-list">' + LEVELS.map(function (L) {
        return '<div class="kma-gas-row' + (now && now.v === L.v ? ' on' : '') + (L.v === 0 ? ' is-zero' : '') + '"><b>' + L.l + '</b><span>' + esc(g.n[L.k]) + '</span></div>';
      }).join('') + '</div>' +
      '<p class="kma-gas-q">Waar sta je nu?</p><div class="kma-seg kma-gas-seg" role="group" aria-label="Waar sta je nu?">' + LEVELS.slice().reverse().map(function (L) {
        var on = now && now.week === wk() && now.v === L.v;
        return '<button type="button" class="' + (on ? 'on' : '') + '" aria-pressed="' + !!on + '" data-gas-v="' + L.v + '">' + L.l + '</button>';
      }).join('') + '</div>' +
      (hist.length > 1 && V ? V.lineChart(hist.map(function (h) { return String(h.date).slice(5).split('-').reverse().join('-'); }), [{ label: 'Niveau', color: V.colors.gold, values: hist.map(function (h) { return h.v; }) }], { yMin: -2, yMax: 2, ticks: [-2, -1, 0, 1, 2], label: 'Je niveau over tijd' }) : '') +
      (now ? '<p class="muted small">Laatst: ' + esc(lvl(now.v).l) + ' op ' + esc(fmt(now.date)) + '.</p>' : '<p class="muted small">Kies hierboven waar je nu staat. Meestal begin je op \u22122 of \u22121.</p>') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn sm" data-gas-act="edit">' + icon('edit') + 'Niveaus aanpassen</button></div></div>';
  }
  function gasSave(box) {
    var g = gas(), n = {};
    LEVELS.forEach(function (L) { var i = box.querySelector('[data-gas-f="' + L.k + '"]'); n[L.k] = i ? i.value.trim() : ''; });
    if (!String(n['0']).trim()) { toast('Beschrijf in elk geval niveau 0: het verwachte resultaat', 'error'); return false; }
    var miss = LEVELS.filter(function (L) { return !n[L.k]; });
    if (miss.length) { toast('Vul alle vijf niveaus in (nog: ' + miss.map(function (L) { return L.l; }).join(', ') + ')', 'error'); return false; }
    g.n = n; setX('gas', g); return true;
  }
  function gasScore(v) {
    var g = gas(), w = wk();
    g.scores = g.scores.filter(function (x) { return x.week !== w; });
    g.scores.push({ week: w, date: today(), v: v });
    setX('gas', g);
  }
  window.kmaDoelNiveaus = { LEVELS: LEVELS, data: gas, now: gasNow, filled: function () { return gasFilled(gas()); } };

  /* ---------------- Het obstakel (WOOP) ---------------- */
  function woop() { var w = getX('woop', {}); return { uitkomst: w.uitkomst || '', obstakel: w.obstakel || '' }; }
  function woopCard() {
    var w = woop();
    return '<div class="kma-card-block kma-woop" id="kma-woop"><h4>' + icon('idea') + 'Wat houdt je tegen?</h4>' +
      '<p class="muted">Stel je eerst het mooiste resultaat voor, en daarna wat er in jezelf het meest in de weg staat. Die combinatie werkt beter dan alleen een doel.</p>' +
      '<label class="kma-plan-lab">Het mooiste resultaat als het lukt<input type="text" data-woop-f="uitkomst" maxlength="200" value="' + esc(w.uitkomst) + '" placeholder="bijv. mijn groep weet altijd wat er van ze verwacht wordt"/></label>' +
      '<label class="kma-plan-lab">Het belangrijkste obstakel in jezelf<input type="text" data-woop-f="obstakel" maxlength="200" value="' + esc(w.obstakel) + '" placeholder="bijv. ik wil snel beginnen en sla de uitleg over"/></label>' +
      (w.obstakel && list().length < MAX && !list().some(function (p) { return String(p.als).toLowerCase() === String(w.obstakel).toLowerCase(); }) ? '<button type="button" class="kma-icon-btn sm" data-woop-act="plan">' + icon('repeat') + 'Maak er een als-dan-plan van</button>' : '') +
      '</div>';
  }

  /* ---------------- Check-in per plan ---------------- */
  function checkinRows() {
    var P = window.KMAPatterns, l = list(); if (!P || !l.length) return '';
    return '<div class="kma-plan-ci">' + l.map(function (p) {
      var s = stats(p.id), cur = s.thisWeek;
      return '<div class="kma-plan-ci-row" data-plan="' + esc(p.id) + '">' + plan(p) +
        '<div class="kma-seg kma-plan-seg" role="group" aria-label="Werkte dit plan?">' + [2, 1, 0].map(function (r) {
          return '<button type="button" class="' + (cur && cur.r === r ? 'on' : '') + '" aria-pressed="' + !!(cur && cur.r === r) + '" data-pci="' + r + '">' + (r === 0 ? 'Niet' : P.CHECK[r].l) + '</button>';
        }).join('') + '</div>' +
        '<label class="kma-plan-lab">Wat hielp?<input type="text" data-pcn maxlength="200" value="' + esc(cur && cur.note || '') + '" placeholder="Of: wat hield je tegen?"/></label></div>';
    }).join('') + '</div>';
  }
  function saveCi(id, r, note) {
    var w = wk(), all = checkins(), cur = all.find(function (c) { return c.id === id && c.week === w; });
    all = all.filter(function (c) { return !(c.id === id && c.week === w); });
    all.push({ week: w, id: id, date: today(), r: r == null ? (cur ? cur.r : 1) : r, note: note != null ? note : (cur && cur.note) || '' });
    setX('plan-checkins', all);
    // De bestaande weekstrip: het gemiddelde van de plannen deze week.
    var ids = list().map(function (p) { return p.id; });
    var mine = all.filter(function (c) { return c.week === w && ids.indexOf(c.id) >= 0; });
    if (!mine.length) return;
    var avg = Math.round(mine.reduce(function (a, c) { return a + c.r; }, 0) / mine.length);
    var notes = mine.filter(function (c) { return c.note; }).map(function (c) { return c.note; }).join(' · ');
    var sc = getX('smart-checkins', []).filter(function (x) { return x.week !== w; });
    sc.push({ week: w, date: today(), r: avg, note: notes });
    sc.sort(function (a, b) { return a.week < b.week ? -1 : 1; });
    setX('smart-checkins', sc);
  }

  /* ---------------- 4.29.0: check-in vlak na de situatie (M5) ----------------
     Naast de wekelijkse check-in: direct na de situatie "Is het gelukt?" (Gelukt / Deels / Niet), via + of de knop bij het plan.
     Elk moment wordt bewaard (kma-x-plan-momenten) en telt mee als check-in van deze week (de laatste van de week telt). */
  function momenten() { return getX('plan-momenten', []).filter(function (m) { return m && m.id; }); }
  function momentOpslaan(id, r) {
    var m = momenten(); m.push({ id: id, at: new Date().toISOString(), r: r }); setX('plan-momenten', m.slice(-200));
    saveCi(id, r, null);
    toast(r === 2 ? 'Gelukt: goed bezig! Opgeslagen.' : r === 1 ? 'Deels gelukt: opgeslagen. Wat hielp, en wat niet?' : 'Opgeslagen. Wat hield je tegen? Misschien is je plan te groot.');
    if (isSmart()) rerender();
  }
  function snelCheckin(id) {
    var l = list();
    if (!l.length) { openAdd(); return; }
    var p = id ? l.find(function (x) { return x.id === id; }) : (l.length === 1 ? l[0] : null);
    if (!p) { kmaSheet({ title: 'Welk plan was het?', items: l.map(function (x) { return { icon: 'repeat', label: 'Als ' + x.als, hint: 'dan ' + x.dan, onClick: function () { setTimeout(function () { snelCheckin(x.id); }, 60); } }; }) }); return; }
    kmaSheet({ title: 'Is het gelukt?', items: [
      { section: 'Als ' + p.als + ', dan ' + p.dan },
      { icon: 'check', label: 'Gelukt', hint: 'Ik deed wat ik me had voorgenomen', onClick: function () { momentOpslaan(p.id, 2); } },
      { icon: 'activity', label: 'Deels', hint: 'Een deel lukte', onClick: function () { momentOpslaan(p.id, 1); } },
      { icon: 'x', label: 'Niet', hint: 'Het lukte deze keer niet', onClick: function () { momentOpslaan(p.id, 0); } }
    ] });
  }
  /* 4.29.0 (M7): 360°- en roosfeedback eindigt altijd in een doel en een als-dan-plan (Smither e.a. 2005: alleen met opvolging).
     kmaActieKaart(bron, voorstel) geeft het slotblok; de knoppen zetten het doel in de leervraag en openen een nieuw plan. */
  function actieKaart(bron, voorstel) {
    var nPlan = list().length, doel = leervraagIngevuld();
    var stap = function (ok, t) { return '<li class="' + (ok ? 'is-klaar' : '') + '">' + (ok ? icon('check') : '') + t + '</li>'; };
    return '<div class="kma-card-block kma-actie" data-actie-bron="' + esc(bron) + '"><h4>' + icon('target') + 'Van feedback naar actie</h4>' +
      '<p class="muted">Feedback van anderen helpt pas als je er iets mee doet. Kies één punt, maak er een doel van en spreek af wát je doet.</p>' +
      '<ol class="kma-actie-stappen">' + stap(doel, '<b>Doel</b> in je leervraag') + stap(nPlan > 0, '<b>Als-dan-plan</b> voor de situatie') + stap(false, '<b>Check-in</b> direct na de situatie: gelukt?') + '</ol>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-actie="doel" data-actie-tekst="' + esc(voorstel || '') + '">' + icon('target') + 'Zet in mijn leervraag</button>' +
      '<button type="button" class="kma-icon-btn is-primary" data-actie="plan">' + icon('repeat') + 'Als-dan-plan maken</button></div></div>';
  }
  window.kmaActieKaart = actieKaart;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-actie]'); if (!b) return;
    if (b.getAttribute('data-actie') === 'plan') { openAdd(); return; }
    var i = smartIdx(); if (i < 0) return;
    var key = steps[i].questions[0], t = b.getAttribute('data-actie-tekst') || '';
    if (t && typeof saveAnswer === 'function') saveAnswer(key, answers[key] ? answers[key] + '\n' + t : 'Ik wil werken aan: ' + t);
    goToStep(i); toast(t ? 'Toegevoegd aan je leervraag. Maak er nu een als-dan-plan bij.' : 'Schrijf je doel bij je leervraag en maak er een als-dan-plan bij.');
  });
  /** Is de leervraag ingevuld (minstens één antwoord in het SMART-hoofdstuk)? */
  function leervraagIngevuld() {
    var s = steps[smartIdx()]; if (!s || typeof answers === 'undefined') return false;
    return (s.questions || []).some(function (q) { var a = answers[q]; return a && String(a).trim().length > 5; });
  }
  // Vandaag (Klassiek en Dashboard): een ingevulde leervraag zonder als-dan-plan krijgt een duwtje
  (window.kmaVandaagExtra = window.kmaVandaagExtra || []).push(function () {
    try { if (lvActief().status === 'voltooid') return []; } catch (e) {}
    if (!leervraagIngevuld() || list().length) return [];
    return [{ ic: 'repeat', t: 'Maak een als-dan-plan bij je leervraag', s: 'Spreek af wát je doet in een concrete situatie. Dat verdubbelt ongeveer de kans dat het lukt.', b: 'Plan maken', go: function () { openAdd(); return ''; } }];
  });

  /* ---------------- Meerdere leervragen (4.5.1) ----------------
     De leervraag waar je nu aan werkt staat op de gewone plek (antwoorden, smart-date, check-ins, plannen),
     zodat Vandaag, het gesprek, Mijn groei, de PDF en het CadetVolgSysteem gewoon blijven werken.
     De andere leervragen staan in kma-x-leervragen: [{id, status: 'open'|'voltooid', at, voltooid, terugblik, data}]. */
  var LKEYS = ['smart-date', 'smart-checkins', 'plannen', 'plan-checkins', 'plan-dtf', 'gas', 'woop'];
  function smartStep() { return steps[smartIdx()]; }
  function rawX(k) { try { var v = kmaStore.getItem('kma-x-' + k); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function liveData() {
    var st = smartStep(), d = { answers: st.questions.map(function (q) { return answers[q] || ''; }) };
    LKEYS.forEach(function (k) { d[k] = rawX(k); });
    return d;
  }
  function loadData(d) {
    d = d || {};
    smartStep().questions.forEach(function (q, i) { saveAnswer(q, (d.answers || [])[i] || ''); });
    LKEYS.forEach(function (k) { if (d[k] == null) { try { kmaStore.removeItem('kma-x-' + k); } catch (e) {} } else setX(k, d[k]); });
  }
  function lvAll() {
    var l = getX('leervragen', []);
    if (!l.length) { l = [{ id: 'lv' + Date.now().toString(36), status: 'open', at: new Date().toISOString() }]; setX('leervragen', l); setX('leervraag-stand', { actief: l[0].id }); }
    return l;
  }
  function lvActief() { var l = lvAll(), a = getX('leervraag-stand', {}).actief; return l.find(function (x) { return x.id === a; }) || l[l.length - 1]; }
  function lvSave(l) { setX('leervragen', l); }
  function lvTitle(x, i) {
    var a = x === lvActief() ? (answers[smartStep().questions[0]] || '') : ((x.data && x.data.answers) || [])[0] || '';
    a = String(a).trim().split(/\n/)[0];
    return 'Leervraag ' + (i + 1) + (a ? ': ' + (a.length > 34 ? a.slice(0, 33) + '…' : a) : '');
  }
  function lvSwitch(id) {
    var l = lvAll(), cur = lvActief();
    if (cur.id === id) return;
    cur.data = liveData();
    var to = l.find(function (x) { return x.id === id; }); if (!to) return;
    lvSave(l.map(function (x) { return x.id === cur.id ? cur : x; }));
    loadData(to.data); delete to.data;
    setX('leervraag-stand', { actief: id });
    editing = null; draft = { als: '', dan: '' }; gasEdit = false;
  }
  function lvNew() {
    var l = lvAll(), cur = lvActief();
    cur.data = liveData();
    var n = { id: 'lv' + Date.now().toString(36), status: 'open', at: new Date().toISOString() };
    l = l.map(function (x) { return x.id === cur.id ? cur : x; }); l.push(n); lvSave(l);
    loadData({}); setX('leervraag-stand', { actief: n.id });
    editing = null; draft = { als: '', dan: '' }; gasEdit = false;
  }
  var closing = false;
  function lvCard() {
    var l = lvAll(), cur = lvActief(), done = cur.status === 'voltooid';
    var item = function (x) { var i = l.indexOf(x); return '<button type="button" class="kma-lv-item' + (x.id === cur.id ? ' active' : '') + '" data-lv-open="' + esc(x.id) + '" aria-current="' + (x.id === cur.id) + '">' + icon(x.status === 'voltooid' ? 'check' : 'target') + '<span>' + esc(lvTitle(x, i)) + '</span><small>' + (x.status === 'voltooid' ? 'afgerond ' + esc(fmt(x.voltooid)) : (x.id === cur.id ? 'open · actief' : 'open')) + '</small></button>'; };
    var open = l.filter(function (x) { return x.status !== 'voltooid'; }), klaar = l.filter(function (x) { return x.status === 'voltooid'; });
    var tabs = l.length > 1 ? '<div class="kma-lv-list">' + open.slice().reverse().map(item).join('') + '</div>' +
      (klaar.length ? '<details class="kma-lv-done-list"' + (cur.status === 'voltooid' ? ' open' : '') + '><summary>Afgeronde leervragen (' + klaar.length + ')</summary><div class="kma-lv-list">' + klaar.slice().reverse().map(item).join('') + '</div></details>' : '') : '';
    var body;
    if (done) {
      body = '<div class="kma-lv-done">' + icon('medal') + '<div><strong>Voltooid op ' + esc(fmt(cur.voltooid)) + '</strong>' + (cur.terugblik ? '<p>' + esc(cur.terugblik) + '</p>' : '') + '</div></div>' +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-lv="heropen">' + icon('repeat') + 'Heropenen</button><button type="button" class="kma-icon-btn is-primary" data-lv="nieuw">' + icon('plus') + 'Nieuwe leervraag</button></div>';
    } else if (closing) {
      body = '<label class="kma-plan-lab">Wat heb je bereikt en wat neem je mee?<textarea id="kma-lv-terugblik" rows="3" placeholder="Bijvoorbeeld: ik noem nu altijd eerst het doel; volgende stap is dat ook onder tijdsdruk doen."></textarea></label>' +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-lv="annuleer">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-lv="voltooi-ok">' + icon('check') + 'Leervraag voltooien</button></div>';
    } else {
      body = '<p class="muted small">Klaar met deze leervraag? Voltooi hem; hij blijft bewaard en je kunt een nieuwe beginnen.</p>' +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-lv="voltooi">' + icon('check') + 'Leervraag voltooien</button><button type="button" class="kma-icon-btn" data-lv="nieuw">' + icon('plus') + 'Nieuwe leervraag</button></div>';
    }
    return '<div class="kma-card-block kma-leervragen" id="kma-leervragen"><h4>' + icon('target') + (l.length > 1 ? 'Mijn leervragen' : 'Mijn leervraag') + '</h4>' + tabs + body + '</div>';
  }
  function fmt(iso) { try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-lv-open],[data-lv]'); if (!t) return;
    if (t.hasAttribute('data-lv-open')) { lvSwitch(t.getAttribute('data-lv-open')); rerenderAll(); return; }
    var a = t.getAttribute('data-lv'), l = lvAll(), cur = lvActief();
    if (a === 'voltooi') { closing = true; rerender(); setTimeout(function () { var x = document.getElementById('kma-lv-terugblik'); if (x) x.focus(); }, 50); return; }
    if (a === 'annuleer') { closing = false; rerender(); return; }
    if (a === 'voltooi-ok') {
      var tb = document.getElementById('kma-lv-terugblik');
      cur.status = 'voltooid'; cur.voltooid = new Date().toISOString(); cur.terugblik = tb ? tb.value.trim() : '';
      lvSave(l.map(function (x) { return x.id === cur.id ? cur : x; })); closing = false;
      toast('Leervraag voltooid. Goed gedaan!'); rerenderAll(); return;
    }
    if (a === 'heropen') { cur.status = 'open'; delete cur.voltooid; lvSave(l.map(function (x) { return x.id === cur.id ? cur : x; })); rerenderAll(); return; }
    if (a === 'nieuw') { lvNew(); toast('Nieuwe leervraag. Je vorige leervraag blijft bewaard.'); rerenderAll(); }
  });
  function rerenderAll() { if (typeof renderStep === 'function') renderStep(); else rerender(); }
  window.kmaLeervragen = { all: lvAll, actief: lvActief, nieuw: lvNew, wissel: lvSwitch, live: liveData };

  function decorate() {
    var after = document.getElementById('kma-widget-after');
    if (!isSmart()) { if (after) { after.innerHTML = ''; after.hidden = true; } return; }
    var c = document.getElementById('widget-container'); if (!c || document.getElementById('kma-plannen')) return;
    var cur = lvActief(), done = cur.status === 'voltooid';
    var first = c.querySelector('.kma-card-block');
    var h = document.createElement('div'); h.innerHTML = lvCard();
    c.insertBefore(h.firstChild, c.firstChild);
    h.innerHTML = card();
    var planEl = h.firstChild;
    if (first) first.insertAdjacentElement('afterend', planEl); else c.appendChild(planEl);
    planEl.insertAdjacentHTML('beforebegin', gasCard() + woopCard());
    // Check-in: per plan in plaats van één keuze.
    var pick = c.querySelector('.kma-ci-pick');
    if (pick && list().length) {
      var note = c.querySelector('#kma-ci-note');
      pick.style.display = 'none'; if (note) note.style.display = 'none';
      var p = pick.previousElementSibling; if (p && p.tagName === 'P') p.textContent = 'Werkte elk plan deze week?';
      pick.insertAdjacentHTML('afterend', checkinRows());
    }
    // Volgorde: leervraag(en) en "Jouw leervraag in één zin" bovenaan, dan de vijf SMART-vragen,
    // dan de als-dan-plannen, de check-in en de rest.
    var q = document.getElementById('questions-container');
    if (q && q.parentNode) {
      if (!after) { after = document.createElement('div'); after.id = 'kma-widget-after'; }
      if (after.previousElementSibling !== q) q.insertAdjacentElement('afterend', after);
      after.innerHTML = ''; after.hidden = false;
      var plan = c.querySelector('#kma-plannen'), node = c.querySelector('#kma-gas') || plan, move = [];
      while (node) { move.push(node); node = node.nextElementSibling; }
      move.forEach(function (n) { after.appendChild(n); });
      if (done) {
        q.querySelectorAll('textarea, input').forEach(function (el) { el.readOnly = true; });
        after.querySelectorAll('.kma-plan-new, .kma-plan-ci, [data-plan-act], [data-gas-act], .kma-gas-q, .kma-gas-seg, [data-woop-act]').forEach(function (el) { el.remove(); });
        after.querySelectorAll('[data-woop-f]').forEach(function (el) { el.readOnly = true; });
        var ci = after.querySelector('.kma-ci-pick'); if (ci) { var box = ci.closest('.kma-card-block'); if (box) box.remove(); }
      }
    }
  }
  function rerender() { if (typeof renderWidgets === 'function') renderWidgets(); }

  document.addEventListener('input', function (e) {
    var f = e.target.getAttribute && e.target.getAttribute('data-plan-f');
    if (f && e.target.closest('.kma-plan-new')) draft[f] = e.target.value;
    var wf = e.target.getAttribute && e.target.getAttribute('data-woop-f');
    if (wf && !e.target.readOnly) { var w = woop(); w[wf] = e.target.value.trim(); setX('woop', w); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.getAttribute && e.target.getAttribute('data-woop-f') === 'obstakel') rerender();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-gas-act],[data-gas-v],[data-woop-act]'); if (!b) return;
    if (b.hasAttribute('data-gas-v')) {
      var v = Number(b.getAttribute('data-gas-v')); gasScore(v);
      toast('Opgeslagen: niveau ' + lvl(v).l); rerender(); return;
    }
    var a = b.getAttribute('data-gas-act');
    if (a === 'edit') { gasEdit = true; rerender(); return; }
    if (a === 'cancel') { gasEdit = false; rerender(); return; }
    if (a === 'save') { if (gasSave(b.closest('.kma-gas'))) { gasEdit = false; toast('Niveaus opgeslagen'); rerender(); } return; }
    if (b.getAttribute('data-woop-act') === 'plan') {
      var w = woop(); draft = { als: w.obstakel, dan: '' }; editing = null; rerender();
      setTimeout(function () { var el = document.querySelector('#kma-plannen .kma-plan-new [data-plan-f="dan"]'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }, 120);
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-plan-act],[data-pci],[data-plan-dtf]'); if (!b) return;
    if (b.hasAttribute('data-plan-dtf')) { pickPlanForDtf(b.getAttribute('data-plan-dtf')); return; }
    var row = b.closest('[data-plan]'), id = row && row.getAttribute('data-plan');
    if (b.hasAttribute('data-pci')) {
      var n = row.querySelector('[data-pcn]');
      saveCi(id, Number(b.getAttribute('data-pci')), n ? n.value.trim() : '');
      toast('Check-in opgeslagen'); rerender(); return;
    }
    var act = b.getAttribute('data-plan-act'), box = b.closest('.kma-plan, .kma-plan-new');
    var val = function (k) { var i = box.querySelector('[data-plan-f="' + k + '"]'); return i ? i.value.trim() : ''; };
    if (act === 'add') { if (add({ als: val('als'), dan: val('dan') })) { draft = { als: '', dan: '' }; toast('Plan toegevoegd'); rerender(); } return; }
    if (act === 'moment') { snelCheckin(id); return; }
    if (act === 'edit') { editing = id; rerender(); return; }
    if (act === 'cancel') { editing = null; rerender(); return; }
    if (act === 'save') {
      if (!val('als') || !val('dan')) { toast('Vul zowel "als" als "dan" in', 'error'); return; }
      update(id, { als: val('als'), dan: val('dan'), edited: wk() });
      (window.__kmaPlanEdited = window.__kmaPlanEdited || {})[id] = wk();
      editing = null; toast('Plan aangepast'); rerender(); return;
    }
    if (act === 'del') {
      // 4.8.3: direct verwijderen, met "Ongedaan maken" (zoals bij de andere lijsten)
      var snap = { p: getX('plannen', []), c: getX('plan-checkins', []), l: getX('plan-dtf', {}) };
      remove(id); rerender();
      if (window.kmaUndoToast) kmaUndoToast('Plan verwijderd', function () { setX('plannen', snap.p); setX('plan-checkins', snap.c); setX('plan-dtf', snap.l); rerender(); });
      else toast('Plan verwijderd');
    }
  });
  document.addEventListener('change', function (e) {
    if (!e.target.hasAttribute || !e.target.hasAttribute('data-pcn')) return;
    var row = e.target.closest('[data-plan]'), id = row && row.getAttribute('data-plan');
    var cur = id && stats(id).thisWeek;
    if (cur) saveCi(id, null, e.target.value.trim());
  });
  // Na het aanpassen telt het "vastlopen" opnieuw vanaf die week.
  list().forEach(function (p) { if (p.edited) (window.__kmaPlanEdited = window.__kmaPlanEdited || {})[p.id] = p.edited; });

  /* ---------------- DTF-feit bij een plan ---------------- */
  function dtfChip(id) {
    var pid = links()[id], p = pid && list().find(function (x) { return x.id === pid; });
    return '<button type="button" class="kma-chip-btn kma-plan-chip' + (p ? ' on' : '') + '" data-plan-dtf="' + esc(id) + '">' + icon('repeat') +
      (p ? 'Bij plan: ' + esc(p.als.length > 28 ? p.als.slice(0, 27) + '…' : p.als) : 'Bij plan…') + '</button>';
  }
  function pickPlanForDtf(id) {
    var l = list();
    if (!l.length) {
      kmaConfirm('Je hebt nog geen als-dan-plan. Nu een plan maken bij je SMART-leervraag?', { danger: false }).then(function (ok) { if (!ok) return; goToStep(smartIdx()); setTimeout(function () { var el = document.getElementById('kma-plannen'); if (el) el.scrollIntoView({ block: 'start' }); }, 250); });
      return;
    }
    var L = links();
    var items = l.map(function (p) {
      return { icon: 'repeat', label: 'Als ' + p.als, hint: 'dan ' + p.dan, checked: L[id] === p.id, onClick: function () { var M = links(); M[id] = p.id; setX('plan-dtf', M); toast('Feit gekoppeld aan je plan'); rerender(); } };
    });
    if (L[id]) items.push({ icon: 'x', label: 'Niet bij een plan', onClick: function () { var M = links(); delete M[id]; setX('plan-dtf', M); rerender(); } });
    kmaSheet({ title: 'Bij welk plan hoort dit feit?', items: items });
  }
  function decorateDtf() {
    var s = steps[currentStepIndex]; if (!s || s.widget !== 'dtf-logbook') return;
    document.querySelectorAll('#widget-container .kma-dtf-item').forEach(function (it) {
      var b = it.querySelector('[data-dtflink]'); if (!b || it.querySelector('.kma-plan-chip')) return;
      var id = b.getAttribute('data-dtflink'), leer = it.querySelector('.kma-leer-chip');
      var h = document.createElement('span'); h.innerHTML = dtfChip(id);
      if (leer) leer.insertAdjacentElement('afterend', h.firstChild); else b.parentNode.insertBefore(h.firstChild, b.parentNode.firstChild);
    });
  }

  var origRW = window.renderWidgets;
  window.renderWidgets = function () { var af = document.getElementById('kma-widget-after'); if (af) af.innerHTML = ''; var r = origRW.apply(this, arguments); try { decorate(); decorateDtf(); } catch (e) { console.error('kma-plannen', e); } return r; };
  try { renderWidgets = window.renderWidgets; } catch (e) {}
  // Een voltooide leervraag is alleen te lezen (de vragen worden na de widgets getekend).
  var origRS = window.renderStep;
  if (typeof origRS === 'function') {
    window.renderStep = function () {
      var r = origRS.apply(this, arguments);
      try { if (isSmart() && lvActief().status === 'voltooid') document.querySelectorAll('#questions-container textarea, #questions-container input').forEach(function (el) { el.readOnly = true; }); } catch (e) {}
      return r;
    };
    try { renderStep = window.renderStep; } catch (e) {}
  }

  /** Opent de SMART-leervraag met het formulier alvast ingevuld (bijv. een voorstel van de teamleider aanpassen). */
  function openAdd(p) {
    draft = { als: (p && p.als) || '', dan: (p && p.dan) || '' }; editing = null;
    var i = smartIdx(); if (i < 0) return;
    if (currentStepIndex !== i) goToStep(i); else rerender();
    setTimeout(function () { var el = document.querySelector('#kma-plannen .kma-plan-new'); if (el) { el.scrollIntoView({ block: 'center' }); var inp = el.querySelector('input'); if (inp) inp.focus(); } }, 300);
  }
  window.kmaPlannen = { snelCheckin: snelCheckin, momenten: momenten, leervraagIngevuld: leervraagIngevuld, list: list, add: function (p) { var ok = add(p); if (ok && isSmart()) rerender(); return ok; }, count: function () { return list().length; }, max: MAX, openAdd: openAdd, stats: stats };
  try { if (isSmart() || (steps[currentStepIndex] || {}).widget === 'dtf-logbook') rerender(); } catch (e) {}
})();
