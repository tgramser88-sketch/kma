/*
 * Reflectieboekje: de kaart "Vandaag" op de startpagina (4.4.0).
 * Eén kaart met wat er nu te doen is, in plaats van zelf te moeten zoeken:
 *  - de SMART-check-in van deze week (als je een leervraag hebt en deze week nog niet hebt ingecheckt);
 *  - nieuwe feedback van je teamleider;
 *  - je evaluatiedatum of een gepland gesprek met je teamleider, als die dichtbij is;
 *  - afspraken uit een gesprek die bij jou liggen;
 *  - een back-up, als je laatste back-up lang geleden is;
 *  - verder gaan waar je gebleven was.
 * De kaart vervangt de oude kaart "Welkom terug" en staat er alleen als er iets te doen is.
 * Sinds 4.18.0 (blok P1) is de kaart een cockpit: hooguit drie dingen in beeld (op volgorde van belang), de rest
 * ingeklapt onder "Later". Nieuw: feedback van een medecadet, een snel vastgelegd DTF-feit dat nog een V mist
 * (+ Nieuw, kma-ux-boek.js) en een herinnering als je een week geen DTF-feit vastlegde. Op het tabblad Vandaag
 * (kma-boek-tabs.js) staat de kaart er altijd, ook als er niets te doen is.
 * Ook bewaart deze module wanneer je voor het laatst een back-up maakte (kma-x-last-backup).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaStore) return;
  var icon = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function getX(k, d) { try { var v = kmaStore.getItem('kma-x-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function setX(k, v) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(v)); } catch (e) {} }
  function day(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function today() { return day(new Date()); }
  /** Dagen van vandaag tot iso (negatief = geleden). */
  function daysTo(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return null;
    var t = new Date(+m[1], +m[2] - 1, +m[3]), n = new Date(); n.setHours(0, 0, 0, 0);
    return Math.round((t - n) / 864e5);
  }
  var DAGEN = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
  var MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  function longDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); if (!m) return ''; var d = new Date(+m[1], +m[2] - 1, +m[3]); return DAGEN[d.getDay()] + ' ' + d.getDate() + ' ' + MAANDEN[d.getMonth()]; }
  function when(n) { return n === 0 ? 'vandaag' : n === 1 ? 'morgen' : n > 1 ? 'over ' + n + ' dagen' : n === -1 ? 'gisteren' : (-n) + ' dagen geleden'; }
  function byTitle(re) { return steps.findIndex(function (s) { return re.test(s.title); }); }

  /* ---------------- Back-up bijhouden ---------------- */
  if (!getX('first-use', '')) setX('first-use', today());
  function markBackup() { setX('last-backup', new Date().toISOString()); }
  window.kmaMarkBackup = markBackup;
  kmaAfter('exportAnswers', markBackup);
  function backupAge() {
    var last = getX('last-backup', '');
    if (last) return Math.floor((Date.now() - Date.parse(last)) / 864e5);
    return null;
  }

  /* ---------------- Wat staat er klaar? ---------------- */
  function smartFilled() {
    var i = byTitle(/SMART/); if (i < 0) return false;
    return (steps[i].questions || []).some(function (q) { return answers[q] && String(answers[q]).trim(); });
  }
  function checkedInThisWeek() {
    var P = window.KMAPatterns; if (!P) return true;
    var wk = P.thisWeekKey();
    return getX('smart-checkins', []).some(function (x) { return x && x.week === wk; });
  }
  /** Gesprekken die de teamleider meestuurde (nieuwste eerst). */
  function gesprekken() {
    var d = window.kmaFeedback && kmaFeedback.latest ? kmaFeedback.latest() : null;
    return d && Array.isArray(d.gesprekken) ? d.gesprekken.filter(function (g) { return g && typeof g === 'object'; }) : [];
  }
  function afsprakenVoorMij() {
    var klaar = getX('afspraken-klaar', {}), out = [];
    gesprekken().forEach(function (g) {
      (Array.isArray(g.afspraken) ? g.afspraken : []).forEach(function (a) {
        if (!a || !a.wat || a.klaar || klaar[a.id]) return;
        if (a.wie && !/cadet|samen/i.test(a.wie)) return;
        out.push(a);
      });
    });
    return out.sort(function (x, y) { return String(x.wanneer || '9999').localeCompare(String(y.wanneer || '9999')); });
  }
  function items() {
    var list = [];
    // 1. SMART-check-in
    if (smartFilled() && !checkedInThisWeek()) list.push({ k: 'checkin', ic: 'target', t: 'SMART-check-in van deze week', s: 'Is het je gelukt om je leervraag toe te passen?', b: 'Invullen' });
    // 2. Nieuwe feedback
    if (window.kmaFeedback && kmaFeedback.unread && kmaFeedback.unread()) {
      var d = kmaFeedback.latest();
      list.push({ k: 'feedback', ic: 'message', t: 'Nieuwe feedback', nieuw: true, s: 'Van ' + (d && d.from ? d.from : 'je teamleider'), b: 'Lezen' });
    }
    // 2a. Feedback van een medecadet (4.18.0)
    var nk = window.kmaKameraad && kmaKameraad.newCount ? kmaKameraad.newCount() : 0;
    if (nk) list.push({ k: 'kameraad', ic: 'users', t: nk === 1 ? 'Feedback van een medecadet' : nk + ' feedbackkaarten van medecadetten', nieuw: true, s: 'Lees hem en kies wat je ermee doet', b: 'Lezen' });
    // 2b'. Items van andere modules (4.18.0): bijv. het verbeterplan (kma-boek-verbeterplan.js). Elk item: { ic, t, s, b, go }
    (window.kmaVandaagExtra || []).forEach(function (f) { try { (f() || []).forEach(function (x) { if (x && x.t) { x.k = 'extra'; list.push(x); } }); } catch (e) {} });
    // 2c. Snel vastgelegde DTF-feiten die nog een V missen (4.18.0, + Nieuw)
    var dtfIdx = steps.findIndex(function (x) { return x.widget === 'dtf-logbook'; });
    var open = typeof dtfItems !== 'undefined' && Array.isArray(dtfItems) ? dtfItems.filter(function (x) { return x && x.snel && !(x.vValues || []).length; }) : [];
    if (open.length && dtfIdx >= 0) list.push({ k: 'aanvullen', step: dtfIdx, ic: 'calendar', t: open.length === 1 ? 'Vul je DTF-feit aan' : 'Vul ' + open.length + ' DTF-feiten aan', s: 'Kies de V en of het positief of negatief was', b: 'Aanvullen' });
    // 2b. De volgende stap uit de feedback in drie vragen, tot de cadet hem op Verwerkt zet (4.5.0)
    var ns = window.kmaFeedback && kmaFeedback.nextStep ? kmaFeedback.nextStep() : null;
    if (ns) list.push({ k: 'stap', step: ns.step, ic: 'right', t: 'Volgende stap: ' + ns.text, s: 'Van ' + (ns.from || 'je teamleider') + ' · zet op Verwerkt als het gelukt is', b: 'Bekijk' });
    // 3. Gesprek met de teamleider of evaluatiedatum
    var g = gesprekken().find(function (x) { var n = daysTo(x.vervolg); return n != null && n >= -3 && n <= 14; });
    if (g) {
      var n1 = daysTo(g.vervolg);
      list.push({ k: 'gesprek', ic: 'users', t: 'Gesprek met je teamleider ' + when(n1), s: longDate(g.vervolg) + ' · bereid je gesprek voor', b: 'Voorbereiden', datum: g.vervolg });
    } else {
      var sd = getX('smart-date', ''), n2 = daysTo(sd);
      if (n2 != null && n2 >= -7 && n2 <= 14) list.push({ k: 'gesprek', ic: 'calendar', t: n2 >= 0 ? 'Evaluatie ' + when(n2) : 'Evaluatiedatum was ' + when(n2), s: longDate(sd) + ' · bereid je gesprek voor', b: 'Voorbereiden', datum: sd });
    }
    // 3b. Een week geen DTF-feit, terwijl je het logboek wel gebruikt (4.18.0): leg je laatste oefening vast
    if (typeof dtfItems !== 'undefined' && Array.isArray(dtfItems) && dtfItems.length && !open.length) {
      var laatste = dtfItems.map(function (x) { return x && x.datum || ''; }).sort().pop(), nd = daysTo(laatste);
      if (nd != null && nd <= -7) list.push({ k: 'dtf', ic: 'calendar', t: 'Leg een DTF-feit vast', s: 'Je laatste feit is van ' + when(nd) + '. Wat gebeurde er bij je laatste oefening?', b: 'Vastleggen' });
    }
    // 4. Afspraken die bij jou liggen
    afsprakenVoorMij().slice(0, 2).forEach(function (a) {
      var n = daysTo(a.wanneer);
      list.push({ k: 'afspraak', id: a.id, ic: 'check', t: 'Afspraak: ' + a.wat, s: a.wanneer ? 'Vóór ' + longDate(a.wanneer) + (n != null && n < 0 ? ' · verlopen' : '') : 'Uit je gesprek met je teamleider', b: 'Gedaan' });
    });
    // 5. Back-up
    var age = backupAge(), first = daysTo(getX('first-use', today()));
    var filled = Object.keys(answers || {}).filter(function (k) { return answers[k] && String(answers[k]).trim(); }).length;
    // In de web-app herinnert kma-web-veilig.js na 7 dagen, met een balk bovenaan; dan hier geen tweede melding.
    if (window.KMA_PLATFORM !== 'web' && ((age != null && age >= 14) || (age == null && first != null && first <= -14 && filled >= 10))) {
      list.push({ k: 'backup', ic: 'download', t: age == null ? 'Je hebt nog geen back-up' : 'Je laatste back-up is ' + age + ' dagen oud', s: 'Alles staat alleen op dit toestel. Een back-up beschermt je werk.', b: 'Back-up' });
    }
    // 6. Ga verder
    var last = parseInt(kmaStore.getItem('kma-ui-last-step') || '0', 10);
    if (last > 0 && last < steps.length && !steps[last].verborgen) {
      var st = window.kmaChapterStatus ? kmaChapterStatus(last) : null;
      var num = window.kmaChapterNum ? kmaChapterNum(last) : last;
      var nm = steps[last].title;
      var detail = st && st.total ? st.done + ' van ' + st.total + ' ingevuld' : '';
      if (!st || !(st.total && st.done >= st.total)) list.push({ k: 'verder', step: last, ic: 'right', t: 'Ga verder: hoofdstuk ' + num, s: nm + (detail ? ' · ' + detail : ''), b: 'Verder' });
    }
    return list;
  }

  /* ---------------- De kaart ---------------- */
  var MAX = 3;   // 4.18.0: hooguit drie dingen in beeld
  function row(it, i) {
    return '<div class="kma-vd-item"><span class="kma-vd-ic" aria-hidden="true">' + icon(it.ic) + '</span><span class="kma-vd-t"><b>' + esc(it.t) + (it.nieuw ? ' <em class="kma-vd-new">nieuw</em>' : '') + '</b><small>' + esc(it.s) + '</small></span>' +
      '<button type="button" class="kma-vd-btn" data-vd="' + i + '">' + esc(it.b) + '</button></div>';
  }
  function render() {
    var old = document.getElementById('kma-vandaag'); if (old) old.remove();
    var tab = document.body.getAttribute('data-boek-tab') === 'vandaag';
    if (!tab && typeof currentStepIndex !== 'undefined' && currentStepIndex !== 0) return;
    var content = document.querySelector('.content-panel'); if (!content) return;
    var list = items().slice(0, 8);
    var cont = document.querySelector('.kma-continue'); if (cont) cont.remove();
    if (!list.length && !tab) return;
    var d = new Date();
    var card = document.createElement('section');
    card.id = 'kma-vandaag'; card.className = 'kma-vandaag'; card.setAttribute('aria-label', 'Vandaag');
    var remOff = window.kmaReminders && !kmaReminders.anyOn();
    card.innerHTML = '<h3>Vandaag</h3><p class="kma-vd-sub">' + DAGEN[d.getDay()].charAt(0).toUpperCase() + DAGEN[d.getDay()].slice(1) + ' ' + d.getDate() + ' ' + MAANDEN[d.getMonth()] + ' · dit staat voor je klaar</p>' +
      (list.length ? list.slice(0, MAX).map(row).join('') : '<p class="kma-vd-leeg">Niets dat nu moet. Leg iets vast met <b>+ Nieuw</b> of werk verder aan je ontwikkeling.</p>') +
      (list.length > MAX ? '<details class="kma-vd-meer"><summary>Later (' + (list.length - MAX) + ')</summary>' + list.slice(MAX).map(function (it, j) { return row(it, j + MAX); }).join('') + '</details>' : '') +
      (remOff ? '<button type="button" class="kma-vd-link" data-vd-rem>' + icon('bell') + 'Herinneringen aanzetten</button>' : '');
    card.__items = list;
    content.insertBefore(card, content.firstChild);
  }
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('#kma-vandaag'); if (!card) return;
    if (e.target.closest('[data-vd-rem]')) { if (window.kmaReminders) kmaReminders.open(); return; }
    var b = e.target.closest('[data-vd]'); if (!b) return;
    var it = (card.__items || [])[+b.getAttribute('data-vd')]; if (!it) return;
    if (it.k === 'checkin') {
      goToStep(byTitle(/SMART/));
      setTimeout(function () { var el = document.querySelector('.kma-ci-pick'); if (el) el.scrollIntoView({ block: 'center' }); }, 250);
    } else if (it.k === 'feedback') { if (kmaFeedback.open) kmaFeedback.open(); }
    else if (it.k === 'gesprek') { if (window.kmaGesprek) kmaGesprek.open({ datum: it.datum }); }
    else if (it.k === 'afspraak') {
      var k = getX('afspraken-klaar', {}); k[it.id] = today(); setX('afspraken-klaar', k);
      if (window.kmaToast) kmaToast('Afspraak afgevinkt. Je teamleider ziet dit de volgende keer dat je deelt.');
      render();
    } else if (it.k === 'backup') { if (typeof exportAnswers === 'function') exportAnswers(); setTimeout(render, 300); }
    else if (it.k === 'verder' || it.k === 'aanvullen') goToStep(it.step);
    else if (it.k === 'kameraad') { if (kmaKameraad.inbox) kmaKameraad.inbox(); else kmaKameraad.open(); }
    else if (it.k === 'dtf') { if (window.kmaSnel) kmaSnel.dtf(); }
    else if (it.k === 'extra' && typeof it.go === 'function') { it.go(); setTimeout(render, 300); }
    else if (it.k === 'stap') { goToStep(it.step); setTimeout(function () { var el = document.getElementById('kma-fb-card'); if (el) el.scrollIntoView({ block: 'start' }); }, 250); }
  });

  // Alleen op de startpagina; weg zodra je een hoofdstuk opent, terug als je naar het begin gaat.
  kmaAfter('goToStep', function () { render(); });
  window.kmaVandaag = { render: render, items: items, backupAge: backupAge };
  try { render(); } catch (e) { console.error(e); }
  // Feedback of gegevens die later binnenkomen (deelmap) werken de kaart bij.
  document.addEventListener('visibilitychange', function () { if (!document.hidden) try { render(); } catch (e) {} });
})();
