/*
 * Personality test chapter (IPIP items, six-factor model) in the reflection book: guided test, 360° hand-over, results with chart and SWOT.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof hexacoQuestionsSelf === 'undefined' || !window.KMAHex) return;
  var H = window.KMAHex, V = window.KMAViz, esc = V.esc, icon = window.kmaIcon;
  var LABELS = ['Helemaal oneens', 'Oneens', 'Neutraal', 'Eens', 'Helemaal eens'];
  var openTrait = null;

  function cadetName() { return answers['Voornaam & Achternaam:'] || answers['Voornaam + Achternaam:'] || 'de cadet'; }
  function stepIdx(test) { return steps.findIndex(test); }
  function selfScores() { return H.plain(H.score(hexacoSelfAnswers, hexacoQuestionsSelf)); }
  function others() { return H.observerScores(hexacoObservers, hexacoQuestionsObserver); }

  /* ---------------- Corrected scoring ---------------- */
  function storeScores() {
    var s = selfScores();
    H.TRAITS.forEach(function (t) { if (s[t.key] != null) hexacoScores[t.full] = s[t.key]; });
    try { kmaStore.setItem(HEXACO_KEY, JSON.stringify(hexacoScores)); } catch (e) {}
    if (typeof dbSet === 'function') dbSet(HEXACO_KEY, hexacoScores);
  }
  window.calculateHexacoSelfScores = function () {
    storeScores();
    // 4.30: de test is een meting; bij de keuze "lang" volgen meteen de 144 extra stellingen
    if (window.kmaMeting) { kmaMeting.vastleggen(); if (kmaMeting.keuze() === 'lang' && window.kmaHex240 && !kmaHex240.klaar()) setTimeout(function () { kmaHex240.open(); }, 400); }
    renderWidgets();
    updateProgress();
    kmaToast('Je persoonlijkheidsprofiel is bijgewerkt');
  };
  // Two reflection questions were renamed: move old answers to the new wording.
  function migrateQuestions() {
    var ren = window.KMA_Q_RENAMES || {}, moved = false;
    Object.keys(ren).forEach(function (o) { if (answers[o] != null && answers[ren[o]] == null) { answers[ren[o]] = answers[o]; delete answers[o]; moved = true; } });
    if (moved) { try { kmaStore.setItem(STORAGE_KEY, JSON.stringify(answers)); } catch (e) {} if (typeof dbSet === 'function') dbSet(STORAGE_KEY, answers); }
  }
  migrateQuestions();
  setTimeout(migrateQuestions, 1500);
  // Recalculate from the answers (stored scores may come from an older formula).
  if (H.answeredCount(hexacoSelfAnswers) > 0) storeScores();

  /* ---------------- Guided test (one statement per screen) ---------------- */
  var overlay = null;
  function closeOverlay() { if (overlay) { overlay.remove(); overlay = null; document.body.classList.remove('kma-test-open'); } }

  function runTest(mode, obs, startAt) {
    var qs = mode === 'self' ? hexacoQuestionsSelf : hexacoQuestionsObserver;
    var ans = mode === 'self' ? hexacoSelfAnswers : (obs.answers = obs.answers || {});
    var idx = typeof startAt === 'number' ? startAt : qs.findIndex(function (q) { return !ans[q.id]; });
    if (idx < 0) idx = 0;
    closeOverlay();
    overlay = document.createElement('div');
    overlay.className = 'kma-test';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    document.body.appendChild(overlay);
    document.body.classList.add('kma-test-open');
    if (mode === 'obs') activeObsId = obs.id;

    function render() {
      var q = qs[idx], done = H.answeredCount(ans), cur = ans[q.id];
      // 4.31: bij de lange test telt de app tot 240 (deel 1: deze 96, deel 2: de 144 aanvullende)
      var lang = mode === 'self' && window.kmaMeting && kmaMeting.keuze() === 'lang', tot = lang ? 240 : qs.length;
      overlay.innerHTML =
        '<div class="kma-test-top">' +
        '<button type="button" class="kma-test-close" aria-label="Pauzeren">' + icon('x') + '<span>Pauzeren</span></button>' +
        '<span class="kma-test-who">' + (mode === 'self' ? 'Over mezelf' + (lang ? ' · lange test, deel 1 van 2' : '') : 'Over ' + esc(cadetName()) + ' · door ' + esc(obs.name)) + '</span></div>' +
        '<div class="kma-test-progress"><span style="width:' + Math.round(done / tot * 100) + '%"></span></div>' +
        '<div class="kma-test-count">Stelling ' + (idx + 1) + ' van ' + tot + ' · ' + done + ' beantwoord</div>' +
        '<div class="kma-test-q"></div>' +
        '<div class="kma-test-options">' + LABELS.map(function (l, i) {
          return '<button type="button" class="kma-test-opt' + (Number(cur) === i + 1 ? ' chosen' : '') + '" data-v="' + (i + 1) + '"><span class="n">' + (i + 1) + '</span>' + l + '</button>';
        }).join('') + '</div>' +
        '<div class="kma-test-nav">' +
        '<button type="button" class="kma-icon-btn" data-nav="prev"' + (idx === 0 ? ' disabled' : '') + '>' + icon('left') + 'Vorige</button>' +
        (done === qs.length ? '<button type="button" class="kma-icon-btn is-primary" data-nav="finish">' + icon('check') + 'Klaar</button>' :
          '<button type="button" class="kma-icon-btn" data-nav="next">Sla over' + icon('right') + '</button>') +
        '</div>';
      overlay.querySelector('.kma-test-q').textContent = q.text;
      overlay.querySelector('.kma-test-close').onclick = function () { closeOverlay(); renderWidgets(); kmaToast('Gepauzeerd bij stelling ' + (idx + 1)); };
      overlay.querySelectorAll('.kma-test-opt').forEach(function (b) {
        b.onclick = function () {
          var v = Number(b.getAttribute('data-v'));
          if (mode === 'self') saveHexacoSelfAnswer(q.id, v); else saveObserverAnswer(q.id, v);
          overlay.querySelectorAll('.kma-test-opt').forEach(function (x) { x.classList.toggle('chosen', x === b); });
          setTimeout(function () {
            if (!overlay) return;
            if (H.answeredCount(ans) >= qs.length) { finish(); return; }
            var next = qs.findIndex(function (qq, i) { return i > idx && !ans[qq.id]; });
            if (next < 0) next = qs.findIndex(function (qq) { return !ans[qq.id]; });
            idx = next < 0 ? Math.min(idx + 1, qs.length - 1) : next;
            render();
          }, 220);
        };
      });
      var nav = overlay.querySelector('[data-nav="prev"]');
      if (nav) nav.onclick = function () { if (idx > 0) { idx--; render(); } };
      var nx = overlay.querySelector('[data-nav="next"]');
      if (nx) nx.onclick = function () { idx = (idx + 1) % qs.length; render(); };
      var fin = overlay.querySelector('[data-nav="finish"]');
      if (fin) fin.onclick = finish;
    }

    function finish() {
      if (mode === 'self') {
        closeOverlay();
        window.calculateHexacoSelfScores();
        window.scrollTo({ top: (document.getElementById('widget-container') || document.body).offsetTop - 10, behavior: 'smooth' });
        return;
      }
      overlay.innerHTML = '<div class="kma-test-handover">' + icon('check', 'big') +
        '<h2>Bedankt, ' + esc(obs.name) + '!</h2><p>Geef de telefoon terug aan ' + esc(cadetName()) + '.</p>' +
        '<button type="button" class="kma-icon-btn is-primary" data-nav="back">Terug naar het reflectieboekje</button></div>';
      overlay.querySelector('[data-nav="back"]').onclick = function () { closeOverlay(); renderWidgets(); };
    }
    render();
  }

  function handover(obs) {
    closeOverlay();
    overlay = document.createElement('div');
    overlay.className = 'kma-test';
    document.body.appendChild(overlay);
    document.body.classList.add('kma-test-open');
    var started = H.answeredCount(obs.answers);
    overlay.innerHTML = '<div class="kma-test-handover">' + icon('users', 'big') +
      '<h2>Geef de telefoon aan ' + esc(obs.name) + '</h2>' +
      '<p>' + esc(obs.name) + ', je beantwoordt ' + hexacoQuestionsObserver.length + ' korte stellingen over hoe jij ' + esc(cadetName()) + ' ziet. Er is geen goed of fout; kies wat het best past. Het duurt ongeveer 12 minuten en je kunt pauzeren.</p>' +
      '<p class="muted">Je ziet de antwoorden van ' + esc(cadetName()) + ' zelf niet, en je antwoorden worden bewaard in dit reflectieboekje.</p>' +
      '<button type="button" class="kma-icon-btn is-primary" data-nav="go">' + (started >= hexacoQuestionsObserver.length ? 'Antwoorden bekijken' : started ? 'Ga verder bij stelling ' + (started + 1) : 'Start') + icon('right') + '</button>' +
      '<button type="button" class="kma-icon-btn" data-nav="cancel">Annuleren</button></div>';
    overlay.querySelector('[data-nav="go"]').onclick = function () { runTest('obs', obs, started >= hexacoQuestionsObserver.length ? 0 : undefined); };
    overlay.querySelector('[data-nav="cancel"]').onclick = function () { closeOverlay(); };
  }

  window.openHexacoTestModal = function () { runTest('self'); };
  window.kmaHexaco = { runSelf: function (i) { runTest('self', null, i); }, handover: handover };

  /* ---------------- Observers ---------------- */
  function addObserver(name, role) {
    var o = { id: Date.now(), name: name, role: role, answers: {} };
    hexacoObservers.push(o);
    kmaStore.setItem(HEXACO_OBSERVERS_KEY, JSON.stringify(hexacoObservers));
    if (typeof dbSet === 'function') dbSet(HEXACO_OBSERVERS_KEY, hexacoObservers);
    return o;
  }
  function observersHtml() {
    var list = hexacoObservers.map(function (o) {
      var n = H.answeredCount(o.answers);
      return '<div class="kma-obs" data-id="' + o.id + '"><div class="kma-avatar sm">' + esc(String(o.name || '?').trim().charAt(0).toUpperCase()) + '</div>' +
        '<div class="kma-obs-body"><strong>' + esc(o.name) + '</strong><small>' + esc(o.role) + ' · ' + (n >= hexacoQuestionsObserver.length ? 'klaar' : n + ' van ' + hexacoQuestionsObserver.length) + '</small>' +
        '<span class="kma-mini-bar"><i style="width:' + Math.round(n / hexacoQuestionsObserver.length * 100) + '%"></i></span></div>' +
        (n >= hexacoQuestionsObserver.length ? '' : '<button type="button" class="kma-icon-btn sm" data-act="obs-go">' + (n ? 'Ga verder' : 'Laat invullen') + '</button>') +
        '<button type="button" class="kma-icon-btn is-round sm" data-act="obs-del" aria-label="Verwijderen">' + icon('trash') + '</button></div>';
    }).join('');
    return '<div class="kma-card-block"><h4>' + icon('users') + '360°: hoe anderen jou zien</h4>' +
      '<p class="muted">Laat 2 tot 4 mensen die je goed kennen dezelfde stellingen over jou invullen, op jouw telefoon. Hun gemiddelde verschijnt naast je eigen profiel.</p>' +
      (list || kmaEmpty({ small: true, icon: 'users', title: 'Nog geen observatoren', text: 'Vul hieronder een naam in en geef je telefoon aan die persoon.' })) +
      '<div class="kma-obs-add"><input type="text" id="kma-obs-name" placeholder="Naam (bijv. Cadet Jansen)" />' +
      '<select id="kma-obs-role" aria-label="Rol van de observator"><option>Mede-cadet</option><option>Instructeur / GC</option><option>Partner / familie</option><option>Vriend / bekende</option></select>' +
      '<button type="button" class="kma-icon-btn is-primary" data-act="obs-add">' + icon('plus') + 'Toevoegen</button></div></div>';
  }

  /* ---------------- Results ---------------- */
  var curOth = null;   // 4.30: observatoren voor het bewijs bij de SWOT
  function pointHtml(p, quadrant) {
    var actions = (quadrant === 'w' || quadrant === 't')
      ? '<div class="kma-swot-try"><strong>Probeer dit:</strong> ' + esc(p.action) + '</div>' +
        '<div class="kma-swot-btns"><button type="button" class="kma-chip-btn" data-act="to-smart" data-text="' + esc(p.text) + '" data-trait="' + p.trait.key + '">' + icon('target') + 'Maak SMART-leervraag</button>' +
        (quadrant === 'w' && steps.some(function (s) { return /^Ik als officier/.test(s.title) && !s.verborgen; }) ? '<button type="button" class="kma-chip-btn" data-act="to-valkuil" data-text="' + esc(p.text) + '" data-trait="' + p.trait.key + '">' + icon('alert') + 'Neem op als valkuil</button>' : '') + '</div>'
      : '';
    return '<li><span class="kma-swot-text">' + esc(p.text) + '</span>' +
      '<span class="kma-swot-src">omdat je ' + (p.band === 'high' ? 'hoog' : 'laag') + ' scoort op ' + esc(p.trait.name) + ' (' + p.score + '%) · <em>' + esc(p.v) + '</em></span>' +
      (quadrant === 's' ? '<span class="kma-swot-why">' + esc(p.why) + '</span>' : '') + (window.kmaBewijs ? kmaBewijs.badges(kmaBewijs.bewijs(p, quadrant, curOth)) : '') + actions + '</li>';
  }

  function resultsHtml() {
    var s = selfScores(), oth = others(), an = H.analyse(s, oth.count ? oth : null), ind = H.vIndication(s);
    curOth = oth.count ? oth : null;
    // 4.30 (punt 28): de labels blinde vlek en verborgen kracht pas vanaf drie observatoren
    var BW = window.kmaBewijs, labels = !BW || BW.labelsAan(oth);
    var axes = ['Integr.', 'Emot.', 'Extrav.', 'Verdr.', 'Consc.', 'Openh.'];
    var series = [{ label: 'Jij', color: V.colors.gold, values: H.TRAITS.map(function (t) { return s[t.key]; }) }];
    if (oth.count) series.push({ label: oth.count === 1 ? oth.per[0].name : 'Anderen (gem. van ' + oth.count + ')', color: V.colors.blue, dashed: true, values: H.TRAITS.map(function (t) { return oth.avg[t.key]; }) });

    var strip = '<div class="kma-hex-strip">' + icon('chart') + '<span>Hoogst: <strong>' + esc(an.highest.name) + ' ' + s[an.highest.key] + '%</strong></span><span>Laagst: <strong>' + esc(an.lowest.name) + ' ' + s[an.lowest.key] + '%</strong></span></div>';

    var traits = H.TRAITS.map(function (t) {
      var v = s[t.key], o = oth.count ? oth.avg[t.key] : null, b = H.band(v), open = openTrait === t.key;
      var prof = b === 'mid' ? null : H.PROFILES[t.key + '_' + b];
      return '<div class="kma-trait' + (open ? ' open' : '') + '" data-trait="' + t.key + '">' +
        '<button type="button" class="kma-trait-head" data-act="trait" aria-expanded="' + open + '"><span class="kma-trait-name">' + esc(t.name) + '</span><span class="kma-trait-val">' + v + '%</span>' + icon('down') + '</button>' +
        '<div class="kma-trait-bar"><i style="width:' + v + '%"></i>' + (o != null ? '<b style="left:' + o + '%" title="Anderen: ' + o + '%"></b>' : '') + '</div>' +
        '<div class="kma-trait-poles"><span>' + esc(t.low) + '</span><span>' + esc(t.high) + '</span></div>' +
        (open ? '<div class="kma-trait-more"><p>' + esc(t.explain) + '</p>' +
          (prof ? '<p><strong>Sterk:</strong> ' + esc(prof.s) + '<br><strong>Let op:</strong> ' + esc(prof.w) + '<br><strong>Probeer dit:</strong> ' + esc(prof.a) + '</p>'
            : '<p>Je zit in het midden: je kunt per situatie kiezen. Let op welke kant je onder druk kiest.</p>') +
          (o != null ? '<p class="muted">Jij: ' + v + '% · Anderen: ' + o + '%</p>' : '') + '</div>' : '') +
        '</div>';
    }).join('');

    var gapHtml = labels && an.gaps.length ? '<div class="kma-gaps">' + an.gaps.map(function (g) {
      var title = g.kind === 'hidden' ? 'Verborgen kracht' : g.kind === 'blind' ? 'Mogelijke blinde vlek' : 'Wisselend beeld';
      return '<div class="kma-gap ' + g.kind + '"><strong>' + title + ' · ' + esc(g.trait.name) + '</strong><span>' + esc(g.text) + (g.self != null ? ' (jij ' + g.self + '%, anderen ' + g.others + '%)' : '') + '</span></div>';
    }).join('') + '</div>' : '';

    var vTiles = ind ? '<div class="kma-card-block"><h4>' + icon('shield') + 'Vertaling naar de 4 V\'s <small>indicatie</small></h4><div class="kma-v-grid">' +
      Object.keys(ind).map(function (k) { return '<div class="kma-v-tile"><span>' + k + '</span>' + H.vBandHtml(ind[k]) + '</div>'; }).join('') + '</div>' +
      '<p class="muted small">Een ruwe indicatie in drie banden: aandachtspunt, gemiddeld of sterk. Bedoeld als begin van een gesprek, niet als oordeel.</p>' + H.explainV(s) + '</div>' : '';

    var q = an.quadrants;
    var quad = function (key, title, cls, list) {
      return '<div class="kma-swot ' + cls + '"><h5>' + title + '</h5>' + (list.length ? '<ul>' + list.map(function (p) { return pointHtml(p, key); }).join('') + '</ul>' : '<p class="muted">Geen uitgesproken scores in deze richting.</p>') + '</div>';
    };
    var swot = '<div class="kma-card-block"><h4>' + icon('target') + 'Jouw SWOT</h4><p><span class="kma-bw kma-bw-ok">Alleen voor jou en je gesprek</span></p><p class="muted">Op basis van je scores, met bewijs uit je DTF-feiten en van je observatoren. Maximaal 3 punten per vak, de meest uitgesproken eerst.</p>' +
      '<div class="kma-swot-grid">' + quad('s', 'Sterke kanten', 's', q.s) + quad('w', 'Valkuilen', 'w', q.w) + quad('o', 'Kansen', 'o', q.o) + quad('t', 'Bedreigingen', 't', q.t) + '</div>' +
      (an.middle.length ? '<p class="kma-mid">' + an.middle.map(function (m) { return 'Je zit in het midden op <strong>' + esc(m.trait.name) + '</strong> (' + m.score + '%): je kunt per situatie kiezen.'; }).join(' ') + '</p>' : '') +
      (an.combos.length ? '<div class="kma-combos">' + an.combos.map(function (c) { return '<div class="kma-combo"><strong>' + esc(c.name) + '</strong><span>' + esc(c.mean) + '</span><em>Probeer dit: ' + esc(c.a) + '</em></div>'; }).join('') + '</div>' : '') +
      H.explainSwot() +
      '<p class="kma-disclaimer">' + icon('alert') + 'Indicatie op basis van je antwoorden. Bespreek dit met je teamleider; het is geen beoordeling. Stellingen: International Personality Item Pool (ipip.ori.org, publiek domein).</p></div>';

    var forQuestions = '<div class="kma-hex-forq"><strong>Voor de vragen hieronder</strong><span>Hoogst: ' + esc(an.highest.name) + ' (' + s[an.highest.key] + '%) · Laagst: ' + esc(an.lowest.name) + ' (' + s[an.lowest.key] + '%)</span>' +
      an.gaps.filter(function (g) { return g.kind !== 'mixed'; }).map(function (g) { return '<span>' + (g.kind === 'hidden' ? 'Verborgen kracht: ' : 'Blinde vlek: ') + esc(g.trait.name) + '</span>'; }).join('') + '</div>';

    var qual = H.quality ? H.qualityHtml(H.quality(hexacoSelfAnswers, hexacoQuestionsSelf, (function () { try { return JSON.parse(kmaStore.getItem('kma-x-hex-tijd')); } catch (e) { return null; } })()), 'cadet') : '';
    var MT = window.kmaMeting;
    if (MT) MT.vastleggen();
    return '<div class="kma-hex">' + strip + qual + (MT ? MT.normHtml() + MT.langHtml() : '') +
      '<div class="kma-card-block kma-hex-chart">' + V.radar(axes, series, { label: 'Persoonlijkheidsprofiel' }) + V.legend(series) + '</div>' +
      '<div class="kma-card-block"><h4>' + icon('chart') + 'Jouw zes eigenschappen</h4><p class="muted">Tik op een eigenschap voor uitleg.' + (oth.count ? ' Het blauwe streepje is hoe anderen je zien.' : '') + '</p>' + traits + H.explainProfile() + '</div>' +
      (BW ? BW.verschilHtml(s, oth) : '') + (gapHtml ? '<div class="kma-card-block"><h4>' + icon('eye') + 'Zelfbeeld en hoe anderen je zien</h4>' + gapHtml + '</div>' : '') +
      (oth.count && window.kmaActieKaart ? kmaActieKaart('360', (function () { var g = an.gaps.filter(function (x) { return x.kind !== 'mixed'; })[0]; return g ? (g.kind === 'blind' ? 'mogelijke blinde vlek op ' : 'verborgen kracht op ') + g.trait.name.toLowerCase() + ' (uit de 360°-feedback)' : ''; })()) : '') +
      observersHtml() + vTiles + swot + (MT ? MT.groeiHtml() : '') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-act="redo">' + icon('edit') + 'Antwoorden bekijken of wijzigen</button></div>' +
      forQuestions + '</div>';
  }

  function emptyHtml() {
    var n = H.answeredCount(hexacoSelfAnswers), total = hexacoQuestionsSelf.length;
    var lang = window.kmaMeting && kmaMeting.keuze() === 'lang';
    return '<div class="kma-hex">' + (window.kmaMeting ? kmaMeting.keuzeHtml() : '') + '<div class="kma-card-block kma-empty-hex">' + icon('chart', 'big') +
      '<h4>' + (n ? 'Ga verder met je persoonlijkheidstest' : 'Je hebt de test nog niet gedaan') + '</h4>' +
      '<p id="kma-hex-omvang">' + (lang ? '240 korte stellingen · 30 tot 40 minuten, in twee delen (96 en daarna 144 aanvullende)' : total + ' korte stellingen · ongeveer 12 minuten') + ' · één stelling per scherm. Je kunt altijd pauzeren; je antwoorden worden bewaard.</p>' +
      (n ? '<div class="kma-test-progress inline"><span style="width:' + Math.round(n / total * 100) + '%"></span></div><p class="muted">' + n + ' van ' + total + ' beantwoord</p>' : '') +
      '<button type="button" class="kma-icon-btn is-primary" data-act="start" id="kma-hex-start">' + (n ? 'Ga verder bij stelling ' + (n + 1) : (lang ? 'Start de lange test' : 'Start de korte test')) + icon('right') + '</button>' +
      '<p class="muted">Je profiel, je SWOT en de vertaling naar de 4 V\'s verschijnen hier zodra je klaar bent.</p></div>' + observersHtml() + '</div>';
  }

  function render(container) {
    container.innerHTML = H.isComplete(H.score(hexacoSelfAnswers, hexacoQuestionsSelf)) ? resultsHtml() : emptyHtml();
  }

  /* ---------------- Clicks ---------------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.kma-hex [data-act]');
    if (!b) return;
    var act = b.getAttribute('data-act');
    if (act === 'start') runTest('self');
    else if (act === 'redo') runTest('self', null, 0);
    else if (act === 'trait') { var k = b.closest('.kma-trait').getAttribute('data-trait'); openTrait = openTrait === k ? null : k; renderWidgets(); }
    else if (act === 'obs-add') {
      var name = (document.getElementById('kma-obs-name').value || '').trim();
      if (!name) { kmaToast('Vul eerst een naam in', 'error'); return; }
      var o = addObserver(name, document.getElementById('kma-obs-role').value);
      renderWidgets();
      handover(o);
    } else if (act === 'obs-go' || act === 'obs-del') {
      var id = Number(b.closest('.kma-obs').getAttribute('data-id'));
      var ob = hexacoObservers.find(function (x) { return x.id === id; });
      if (!ob) return;
      if (act === 'obs-go') handover(ob);
      else {
        var obSnap = JSON.parse(JSON.stringify(hexacoObservers));
        hexacoObservers = hexacoObservers.filter(function (x) { return x.id !== id; });
        if (window.kmaUndoToast) setTimeout(function () { kmaUndoToast('Observator ' + ob.name + ' verwijderd', function () { hexacoObservers = obSnap; kmaStore.setItem(HEXACO_OBSERVERS_KEY, JSON.stringify(hexacoObservers)); renderWidgets(); }); }, 0);
        kmaStore.setItem(HEXACO_OBSERVERS_KEY, JSON.stringify(hexacoObservers));
        if (typeof dbSet === 'function') dbSet(HEXACO_OBSERVERS_KEY, hexacoObservers);
        renderWidgets();
      }
    } else if (act === 'to-smart') {
      var si = stepIdx(function (s) { return /SMART/.test(s.title); });
      var key = steps[si].questions[0];
      var t = H.BY_KEY[b.getAttribute('data-trait')];
      var add = b.getAttribute('data-text') + ' (' + t.name + ')';
      saveAnswer(key, answers[key] ? answers[key] + '\n' + add : 'Ik wil werken aan: ' + add);
      goToStep(si);
      kmaToast('Toegevoegd als startpunt voor je SMART-leervraag');
    } else if (act === 'to-valkuil') {
      var oi = stepIdx(function (s) { return /Ik als officier/.test(s.title); });
      var vk = steps[oi].questions.find(function (q) { return /valkuil/i.test(q); });
      var t2 = H.BY_KEY[b.getAttribute('data-trait')];
      var add2 = b.getAttribute('data-text') + ' (uit je persoonlijkheidstest: ' + t2.name + ')';
      saveAnswer(vk, answers[vk] ? answers[vk] + '\n' + add2 : add2);
      kmaToast('Toegevoegd bij "Ik als officier" → valkuil');
    }
  });

  window.KMAChapterRenderers = window.KMAChapterRenderers || {};
  window.KMAChapterRenderers.hexaco = function () { migrateQuestions(); return render.apply(this, arguments); };
})();
