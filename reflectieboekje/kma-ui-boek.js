/*
 * Reflection book UI improvements (loaded after the page's own script and kma-ui.js).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || typeof renderStep !== 'function') return;

  var LAST_STEP_KEY = 'kma-ui-last-step';
  var VISITED_KEY = 'kma-ui-visited';
  var icon = window.kmaIcon;
  document.body.classList.add('kma-boek', 'kma-has-bottombar');

  function store() { return window.kmaStore || window.localStorage; }
  function get(k) { try { return store().getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { store().setItem(k, v); } catch (e) {} }

  /* ---------------- Chapter status (same rules as the progress bar) ---------------- */
  function filled(v) { return v != null && String(v).trim().length > 0; }
  function chapterStatus(idx) {
    var s = steps[idx];
    var done = 0, total = 0, unit = 'ingevuld';
    if (!s) return { done: 0, total: 0, unit: unit };
    if (s.widget === '5gt-multi') {
      cases5GT.forEach(function (c) {
        if (window.KMA5GT) { var pr = KMA5GT.progress(c); total += pr.total; done += pr.done; return; }
        ['gebeurtenis', 'gedachten', 'gevoelens', 'gedrag', 'gevolgen'].forEach(function (f) { total++; if (filled(c[f])) done++; });
      });
    } else if (s.widget === 'korthagen-multi') {
      casesKorthagen.forEach(function (c) {
        ['actie', 'terugblik', 'bewustwording', 'alternatieven', 'uitproberen'].forEach(function (f) { total++; if (filled(c[f])) done++; });
      });
    } else if (s.widget === 'dtf-logbook') {
      return { done: dtfItems.length, total: 0, unit: dtfItems.length === 1 ? 'feit vastgelegd' : 'feiten vastgelegd', count: true };
    } else if (s.widget === 'jargon-list') {
      return { done: jargonItems.length, total: 0, unit: 'begrippen', count: true };
    } else {
      (s.questions || []).forEach(function (q) { total++; if (filled(answers[q])) done++; });
      if (s.widget === 'fitheid') { total++; if (fitnessLogs.length > 0 || (window.kmaPssLast && kmaPssLast())) done++; }
    }
    return { done: done, total: total, unit: unit };
  }
  window.kmaChapterStatus = function (i) { return chapterStatus(i); };
  function isComplete(st) { return st.count ? st.done > 0 : (st.total > 0 && st.done >= st.total); }

  /* ---------------- 1. Header: "Delen" + "⋯" ---------------- */
  var actions = document.querySelector('.site-header .header-actions');
  if (actions) {
    var shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'kma-icon-btn is-primary';
    shareBtn.id = 'kma-share-btn';
    shareBtn.innerHTML = icon('share') + '<span>Delen</span>';
    shareBtn.setAttribute('aria-label', 'Delen');   // bij grotere tekst blijft alleen het pictogram over
    shareBtn.addEventListener('click', openShareSheet);
    var moreBtn = document.createElement('button');
    moreBtn.type = 'button';
    moreBtn.className = 'kma-icon-btn is-round';
    moreBtn.id = 'kma-more-btn';
    moreBtn.setAttribute('aria-label', 'Meer opties');
    moreBtn.innerHTML = icon('more');
    moreBtn.addEventListener('click', openMoreSheet);
    actions.appendChild(shareBtn);
    actions.appendChild(moreBtn);
  }

  function shareSummary() {
    var shared = 0, priv = [];
    steps.forEach(function (st, i) { if (i === 0 || st.verborgen) return; if (!window.kmaIsShared || kmaIsShared(st.title)) shared++; else priv.push(st.title); });
    var last = get('kma-x-last-shared'), when = '';
    try { last = last ? JSON.parse(last) : null; } catch (e) { last = null; }
    if (last && last.date) { var d = new Date(last.date); when = d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear() + (last.how ? ' via ' + last.how : ''); }
    var rc = window.kmaFeedback && kmaFeedback.receipt ? kmaFeedback.receipt() : null, got = '';
    if (rc && rc.at) { var r = new Date(rc.at); got = r.getDate() + '-' + (r.getMonth() + 1) + '-' + r.getFullYear(); }
    return { shared: shared, priv: priv, when: when, got: got };
  }
  window.kmaMarkShared = function (how) { set('kma-x-last-shared', JSON.stringify({ date: new Date().toISOString(), how: how })); };
  function openShareSheet() {
    var sum = shareSummary();
    var bigDossier = (typeof dtfItems !== 'undefined' && dtfItems.length) || (typeof cases5GT !== 'undefined' && cases5GT.some(function (c) { return c && c.gebeurtenis; }));
    kmaSheet({
      title: 'Delen met je teamleider',
      items: [
        { section: sum.shared + ' hoofdstukken gedeeld' + (sum.priv.length ? ' · privé: ' + sum.priv.join(', ') : '') + (sum.when ? ' · laatst gedeeld ' + sum.when : ' · nog niet gedeeld') + (sum.got ? ' · ontvangen door teamleider ' + sum.got : '') + (window.kmaDeelStatus && kmaDeelStatus().on ? ' · deelmap aan: automatisch gedeeld' : '') },
        { icon: 'qr', label: 'QR-code tonen', hint: (bigDossier ? '' : 'Aanbevolen · ') + 'Snel profiel voor je instructeur: naam, scores en zelfbeoordeling. Teksten en DTF gaan alleen via een bestand', onClick: function () { openCadetQRModal(); } },
        { icon: 'bluetooth', label: 'Via Quick Share of Bluetooth', hint: (window.KMAX && KMAX.myCode() ? 'Versleuteld met groepscode · ' : '') + (bigDossier ? 'Aanbevolen · ' : '') + 'Je volledige dossier als bestand: alle gedeelde hoofdstukken, reflecties en DTF · kies Quick Share, dat is het snelst', onClick: function () { shareViaBluetoothNative(); } },
        { icon: 'file', label: 'Portfolio (PDF)', hint: 'Al je producten in een mooi opgemaakt portfolio: levenslijn, profiel, reflecties en DTF', onClick: function () { window.kmaPortfolio && kmaPortfolio(); } },
        { icon: 'print', label: 'PDF / afdrukken', hint: 'Opgemaakt verslag van al je antwoorden', onClick: function () { openPrintPreview(); } }
      ]
    });
  }

  function openMoreSheet() {
    var mode = themeMode();
    kmaSheet({
      title: 'Meer',
      items: [
        // 4.8.3: zoeken in het hele boekje, ook vanuit het menu te vinden
        window.kmaStart && kmaStart.state() !== 'klaar' ? { icon: 'right', label: 'Aan de slag', hint: (function () { var l = kmaStart.steps(); return l.filter(function (x) { return x.done; }).length + ' van ' + l.length + ' stappen klaar: naam, koppelen, deelmap, pincode'; })(), onClick: function () { kmaStart.open(); } } : null,
        window.kmaInbox ? { icon: 'message', label: 'Inbox', hint: kmaInbox.hint(), onClick: function () { kmaInbox.open(); } } : null,
        { icon: 'search', label: 'Zoeken in je boekje', hint: 'Antwoorden, DTF, reflecties, levenslijn, plannen en begrippen', onClick: function () {
          var inp = document.getElementById('search-input'); if (!inp) return;
          setTimeout(function () { try { inp.scrollIntoView({ block: 'center', behavior: 'smooth' }); inp.focus({ preventScroll: true }); } catch (e) { inp.focus(); } }, 320);
        } },
        { icon: 'file', label: 'Portfolio (PDF)', hint: 'Download al je producten als opgemaakt portfolio', onClick: function () { window.kmaPortfolio && kmaPortfolio(); } },
        window.kmaOefenen ? { icon: 'talk', label: 'Oefenen met feedback ontvangen', hint: 'Drie korte casussen: eerst begrijpen, dan reageren', onClick: function () { kmaOefenen.open(); } } : null,
        window.kmaGereedschap ? { icon: 'puzzle', label: 'Gereedschapskist', hint: 'Modellen die je erbij aanzet: WOOP, doel in vijf niveaus, roos, nabespreking', onClick: function () { kmaGereedschap.open(); } } : null,
        window.kmaNabespreking && (!window.kmaGereedschap || kmaGereedschap.aan('aar')) ? { icon: 'talk', label: 'Nabespreking na een oefening', hint: 'Vier vragen, wordt een DTF-feit en zo nodig een als-dan-plan', onClick: function () { kmaNabespreking.open(); } } : null,
        window.kmaVerbeterplan && kmaVerbeterplan.actief() ? { icon: 'target', label: 'Mijn verbeterplan', hint: 'Na een functioneringsgesprek met verbetertraject (OER 3.7.3e)', onClick: function () { kmaVerbeterplan.open(); } } : null,
        { icon: 'users', label: 'Bereid je gesprek voor', hint: 'Eén pagina voor het gesprek met je teamleider', onClick: function () { window.kmaGesprek && kmaGesprek.open(); } },
        { icon: 'bell', label: 'Herinneringen', hint: window.kmaReminders && kmaReminders.anyOn() ? 'Aan' : 'Uit: meldingen voor je check-in, evaluatie en back-up', onClick: function () { window.kmaReminders && kmaReminders.open(); } },
        { icon: 'shield', label: 'Mijlpalen', hint: window.kmaMilestones ? kmaMilestones.summary() : 'Je insignes', onClick: function () { window.kmaMilestones && kmaMilestones.open(); } },
        window.KMAKoppel ? { icon: 'qr', label: 'Scan code', hint: 'QR-code van je teamleider of de kaart van een medecadet', onClick: function () { KMAKoppel.scanDialog({ rescan: true }); } } : null,
        { icon: 'users', label: 'Koppelen met je teamleider', hint: window.KMAKoppel && KMAKoppel.info() && window.KMAX && KMAX.myCode() ? 'Gekoppeld' + (KMAKoppel.info().g ? ' met groep ' + KMAKoppel.info().g : '') + ': opnieuw scannen' : 'Scan de QR-code van je teamleider', onClick: function () { window.KMAKoppel && KMAKoppel.scanDialog(); } },
        { icon: 'folder', label: 'Deelmap', hint: window.kmaDeelStatus && kmaDeelStatus().on ? 'Aan: ' + kmaDeelStatus().name + ' · ' + (kmaDeelStatus().bij || 'automatisch delen') : 'Uit: koppel de gedeelde map van je teamleider', onClick: function () { window.kmaDeelDialog && kmaDeelDialog(); } },
        { icon: 'lock', label: 'Versleuteld delen', hint: window.KMAX && KMAX.myCode() ? 'Aan: je dossier wordt versleuteld met de groepscode' : 'Uit: vul de groepscode van je teamleider in', onClick: function () { window.KMAX && KMAX.codeDialog(); } },
        { icon: 'form', label: 'Beoordelingsformulier', hint: 'Officiële KMA zelfbeoordeling', onClick: function () { openKMASelfFormModal(); } },
        { icon: 'lock', label: 'PIN-code', hint: kmaPin.isSet('reflectie') ? 'Aan: wijzigen of uitzetten' : 'Uit: beveilig je antwoorden', onClick: function () { openPinSetupModal(); } },
        { icon: 'message', label: 'Feedback van je teamleider', hint: window.kmaFeedback ? kmaFeedback.menuHint() : 'Bestand van je teamleider inlezen', onClick: function () { window.kmaFeedback && kmaFeedback.open(); } },
        { section: 'Hulp' },
        window.kmaOnderbouwing ? { icon: 'idea', label: 'Wetenschappelijke onderbouwing', hint: 'Waarom werkt het boekje zo? Per onderdeel het effect, de grenzen en de bronnen', onClick: function () { kmaOnderbouwing.open(); } } : null,
        { icon: 'book', label: 'Handleiding', hint: 'Uitleg en tutorials, met een knop naar elk hoofdstuk', onClick: function () { window.kmaHandleiding && kmaHandleiding.open(); } },
        window.kmaSnelstart ? { icon: 'book', label: 'Snel starten', hint: 'Vijf stappen op één pagina', onClick: function () { kmaSnelstart.open('cadet'); } } : null,
        window.kmaHulp ? { icon: 'alert', label: 'Hulp en opslag', hint: (function () { var p = kmaHulp.procent(); return 'Foutrapport en opslag: ' + p + '% gebruikt' + (p >= 80 ? ' (bijna vol)' : ''); })(), onClick: function () { kmaHulp.open(); } } : null,
        { icon: 'book', label: 'Uitleg', hint: 'De drie introschermen opnieuw bekijken', onClick: function () { window.kmaIntro && kmaIntro.open(); } },
        window.kmaMelden ? { icon: 'message', label: 'Probleem melden', hint: 'Vaste melding met app, versie en toestel: delen of kopiëren', onClick: function () { kmaMelden.open(); } } : null,
        // 4.6.0: back-up maken en terugzetten staan samen hier (voor jezelf), niet meer bij Delen (naar je teamleider)
        { icon: 'download', label: 'Back-up maken', hint: (function () { var a = window.kmaVandaag && kmaVandaag.backupAge ? kmaVandaag.backupAge() : null; return (a == null ? 'Nog nooit gemaakt' : a === 0 ? 'Laatste back-up: vandaag' : 'Laatste back-up: ' + a + (a === 1 ? ' dag' : ' dagen') + ' geleden') + ' · back-up (.json) en tekstbestand naar Downloads'; })(), onClick: function () { exportAnswers(); } },
        window.kmaReserve ? { icon: 'refresh', label: 'Reservekopie terugzetten', hint: (function () { var a = kmaReserve.age(); return 'Elke week vanzelf, versleuteld' + (a == null ? '' : ' · laatste: ' + (a === 0 ? 'vandaag' : a + (a === 1 ? ' dag' : ' dagen') + ' geleden')); })(), onClick: function () { kmaReserve.open(); } } : null,
        { icon: 'folder', label: 'Back-up terugzetten', hint: 'Een eerder gemaakte back-up terugzetten, bijvoorbeeld op een nieuwe telefoon', onClick: function () { triggerImportBackup(); } },
        // 4.5.4: alleen in de web-app (kma-web-veilig.js)
        window.kmaWebSafe ? { icon: 'shield', label: 'Gegevens veilig bewaren', hint: kmaWebSafe.hint(), onClick: function () { kmaWebSafe.open(); } } : null,
        { icon: 'users', label: 'Demodossier', hint: 'Het boekje van een fictieve cadet bekijken (alleen in een leeg boekje)', onClick: function () { window.kmaDemo && kmaDemo.boek(); } },
        { section: 'Weergave' },
        window.kmaWeergave ? { icon: 'list', label: 'Indeling: Klassiek', hint: 'Menu en hoofdstukken zoals je gewend bent', checked: !kmaWeergave.dash(), onClick: function () { if (kmaWeergave.dash()) kmaWeergave.set('klassiek'); } } : null,
        window.kmaWeergave ? { icon: 'chart', label: 'Indeling: Dashboard', hint: 'Overzichten met tegels en vaste knoppen onderin; je gegevens blijven hetzelfde', checked: kmaWeergave.dash(), onClick: function () { if (!kmaWeergave.dash()) kmaWeergave.set('dashboard'); } } : null,
        { icon: 'search', label: 'Grotere tekst', hint: 'Alles iets groter, handig buiten en in het veld', checked: window.kmaDisplayPref && kmaDisplayPref('large'), onClick: function () { kmaDisplayToggle('large'); } },
        { icon: 'eye', label: 'Hoog contrast', hint: 'Donkerdere tekst en duidelijkere randen', checked: window.kmaDisplayPref && kmaDisplayPref('contrast'), onClick: function () { kmaDisplayToggle('contrast'); } },
        { icon: 'auto', label: 'Automatisch', hint: 'Volgt de instelling van je telefoon', checked: mode === 'auto', onClick: function () { setThemeMode('auto'); } },
        { icon: 'sun', label: 'Licht', checked: mode === 'light', onClick: function () { setThemeMode('light'); } },
        { icon: 'moon', label: 'Donker', checked: mode === 'dark', onClick: function () { setThemeMode('dark'); } },
        { section: 'Gegevens' },
        window.kmaOnderzoek ? { icon: 'chart', label: 'Onderzoek', hint: kmaOnderzoek.actief() ? 'Je doet mee: gegevens versturen of stoppen' : 'Alleen met een sleutel van de onderzoeker', onClick: function () { kmaOnderzoek.open(); } } : null,
        { icon: 'trash', label: 'Alles wissen', hint: 'Verwijdert al je antwoorden op dit toestel', danger: true, onClick: function () { clearData(); } }
      ]
    });
  }

  /* ---------------- 4. Follow the phone's dark mode ---------------- */
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function themeMode() {
    var v = get(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : 'auto';
  }
  function applyTheme() {
    var mode = themeMode();
    var dark = mode === 'dark' || (mode === 'auto' && mq && mq.matches);
    document.body.classList.toggle('dark-theme', !!dark);
  }
  function setThemeMode(mode) {
    try { if (mode === 'auto') store().removeItem(THEME_KEY); else store().setItem(THEME_KEY, mode); } catch (e) {}
    applyTheme();
  }
  window.toggleTheme = function () { setThemeMode(document.body.classList.contains('dark-theme') ? 'light' : 'dark'); };
  if (mq) {
    var onChange = function () { if (themeMode() === 'auto') applyTheme(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }
  applyTheme();

  /* ---------------- 6. Smaller hero after the first visit + "Ga verder" ---------------- */
  var returning = get(VISITED_KEY) === '1';
  if (returning) document.body.classList.add('hero-compact');
  set(VISITED_KEY, '1');

  var content = document.querySelector('.content-panel');
  var continueCard = null;
  function showContinueCard() {
    if (window.kmaVandaag) { kmaVandaag.render(); return; }   // sinds 4.4.0 staat "Ga verder" op de kaart Vandaag
    var last = parseInt(get(LAST_STEP_KEY) || '0', 10);
    if (!content || !returning || !(last > 0) || last >= steps.length || currentStepIndex !== 0) return;
    var pctText = (document.getElementById('progress-percentage') || {}).innerText || '0%';
    var pct = parseInt(pctText, 10) || 0;
    continueCard = document.createElement('div');
    continueCard.className = 'kma-continue';
    continueCard.innerHTML =
      '<div class="kma-continue-ring" style="--p:' + pct + '"><span>' + pct + '%</span></div>' +
      '<div class="kma-continue-copy"><small>Welkom terug</small><strong></strong></div>' +
      '<button type="button" class="kma-icon-btn is-primary">Ga verder' + icon('right') + '</button>';
    continueCard.querySelector('strong').textContent = chapTitle(last);
    continueCard.querySelector('button').addEventListener('click', function () { goToStep(last); });
    content.insertBefore(continueCard, content.firstChild);
  }

  /* ---------------- 7. Inhoudsopgave: drie uitklapmenu's (4.3.10) ----------------
     De inhoudsopgave (#step-nav) heeft drie groepen: Kern, Verdieping en Naslag en overzicht. Elke groep is
     een knop die zijn hoofdstukken open- of dichtklapt; er staat altijd hoogstens één groep open. Op de
     computer staat de groep van het huidige hoofdstuk open; op de telefoon klapt alles dicht zodra je een
     hoofdstuk kiest, zodat je meteen bij de vragen bent. Het oude keuzemenu (#quick-chapter-select) blijft
     onzichtbaar bestaan, zodat bestaande code gewoon blijft werken. */
  var quick = document.getElementById('quick-chapter-select');
  if (quick && quick.parentElement) quick.parentElement.classList.add('kma-quick-select');
  function isPhone() { return !!(window.matchMedia && window.matchMedia('(max-width: 850px)').matches); }

  /* ---------------- 8. Sticky bar status ---------------- */
  var nav = document.querySelector('.form-navigation');
  var status = document.createElement('div');
  status.className = 'kma-step-status';
  status.id = 'kma-step-status';
  if (nav) {
    var prev = document.getElementById('btn-prev');
    if (prev && prev.nextSibling) nav.insertBefore(status, prev.nextSibling); else nav.appendChild(status);
  }
  function updateStatus() {
    var st = chapterStatus(currentStepIndex);
    var label = currentStepIndex === 0 ? 'Profiel' : 'Hoofdstuk ' + chapNum(currentStepIndex) + ' van ' + (order().length - 1);
    var grp = groupOf(currentStepIndex);
    if (grp !== 'kern') label += ' · ' + (grp === 'verdieping' ? 'Verdieping' : 'Naslag');
    var detail = st.count ? st.done + ' ' + st.unit : (st.total ? st.done + ' van ' + st.total + ' ingevuld' : '');
    var pct = st.count ? (st.done > 0 ? 100 : 0) : (st.total ? Math.round(st.done / st.total * 100) : 0);
    status.innerHTML = '<strong></strong><span></span>' + (st.count || st.total ? '<span class="kma-bar"><i style="width:' + pct + '%"></i></span>' : '');
    status.querySelector('strong').textContent = label;
    status.querySelector('span').textContent = detail;
    var next = document.getElementById('btn-next');
    if (next) next.innerHTML = isLast(currentStepIndex) ? 'Klaar ' + icon('check') : 'Volgende ' + icon('right');
    var prevBtn = document.getElementById('btn-prev');
    if (prevBtn) { prevBtn.innerHTML = icon('left') + '<span class="kma-btn-label">Vorige</span>'; prevBtn.setAttribute('aria-label', 'Vorige'); }
  }

  /* ---------------- 8b. Kern, verdieping en naslag ----------------
     De hoofdstukken staan in drie groepen. Leesvolgorde, nummering en Vorige/Volgende volgen die groepen:
     eerst de kern (in de volgorde van de lijst steps), dan de verdieping en dan naslag (allebei in de volgorde
     hieronder). Intern blijft elk hoofdstuk zijn eigen index houden, zodat opgeslagen antwoorden, koppelingen en
     gedeelde dossiers niet veranderen. Een hoofdstuk met verborgen: true (zie de hoofdstukkenlijst) telt nergens mee.
     Nummering sinds 4.3.9: kern 0 t/m 8, verdieping 9 t/m 13, naslag en overzicht 14 t/m 17 (Roos van Leary sinds 4.16.0). */
  var GROUPS = { verdieping: ['Zelfbeoordelingsformulier KMA', 'Voorbereiding Cadetbeoordeling', 'Probleem- en Behoefteanalyse', 'Fitheid & stress', 'Curriculum vitae'],
    naslag: ['Toetsing en examinering DKOO', 'Begrippenlijst & Vakjargon', 'Mijn groei & ontwikkeling', 'Roos van Leary'] };
  var GROUP_INFO = { kern: ['Vaste basis', 'Je rode draad: hiermee werk je de hele opleiding'], verdieping: ['Verdieping', 'Rond een beoordeling, als er iets speelt of als het past'], naslag: ['Naslag en overzicht', 'Niets invullen: opzoeken en terugkijken'] };
  /** 4.30: stap van de rode draad voor de kopjes in Klassiek (zelfde stappen als het Werkboek in Dashboard). */
  function FASE_KL(t) {
    if (/Cadet Informatie|Introductie|Ontwikkelbiografie|Persoonlijkheidstest|Gedragscode/.test(t)) return 'Jezelf leren kennen';
    if (/SMART/.test(t)) return 'Leervraag';
    if (/5G-T|Korthagen/.test(t)) return 'Reflecteren';
    if (/Datum-Tijd-Feit/.test(t)) return 'Doen en vastleggen';
    return '';
  }
  function hidden(idx) { return !!(steps[idx] && steps[idx].verborgen); }
  window.kmaChapterHidden = hidden;
  function groupOf(idx) {
    if (hidden(idx)) return 'verborgen';
    var t = steps[idx] && steps[idx].title;
    if (GROUPS.verdieping.indexOf(t) >= 0) return 'verdieping';
    if (GROUPS.naslag.indexOf(t) >= 0) return 'naslag';
    return 'kern';
  }
  window.kmaChapterGroup = groupOf;
  /** Leesvolgorde: lijst van interne indexen, kern → verdieping → naslag. */
  function order() {
    var out = [];
    for (var i = 0; i < steps.length; i++) if (groupOf(i) === 'kern') out.push(i);
    ['verdieping', 'naslag'].forEach(function (g) {
      GROUPS[g].forEach(function (t) { for (var j = 0; j < steps.length; j++) if (steps[j].title === t && groupOf(j) === g) out.push(j); });
    });
    return out;
  }
  /** Hoofdstuknummer zoals de cadet het ziet (0 = profiel). */
  function chapNum(idx) { var p = order().indexOf(idx); return p < 0 ? idx : p; }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function chapTitle(idx) { return idx === 0 ? steps[0].title : 'Hoofdstuk ' + chapNum(idx) + ': ' + steps[idx].title; }
  function isLast(idx) { var o = order(); return o[o.length - 1] === idx; }
  window.kmaChapterOrder = order;
  window.kmaChapterNum = chapNum;
  window.kmaChapterTitle = chapTitle;
  function relabel() {
    var nav = document.getElementById('step-nav');
    if (nav) Array.prototype.forEach.call(nav.querySelectorAll('.step-link[data-idx]'), function (l) {
      var i = +l.getAttribute('data-idx');
      var b = l.querySelector('.step-number'); if (b) b.textContent = pad(chapNum(i));
      var t = l.querySelector('.step-copy strong'); if (t) t.textContent = chapTitle(i);
    });
    var select = document.getElementById('quick-chapter-select');
    if (select) Array.prototype.forEach.call(select.options, function (o) {
      var i = +o.value, base = pad(chapNum(i)) + '. ' + chapTitle(i);
      o.setAttribute('data-kma-label', base); o.textContent = base;
    });
    var title = document.getElementById('step-title');
    if (title && steps[currentStepIndex]) title.innerText = chapTitle(currentStepIndex);
    var prevB = document.getElementById('btn-prev');
    if (prevB) prevB.disabled = order()[0] === currentStepIndex;
  }
  /* Een verborgen hoofdstuk wordt nooit getoond: wie er toch heen gaat (een oude link, de laatst bezochte plek),
     komt bij het volgende zichtbare hoofdstuk uit. */
  var goToOrig = window.goToStep;
  if (typeof goToOrig === 'function' && !goToOrig.__kmaHidden) {
    window.goToStep = function (idx) {
      if (hidden(idx)) { var o = order(), next = o.filter(function (i) { return i > idx; })[0]; idx = next != null ? next : o[o.length - 1]; }
      return goToOrig.call(this, idx);
    };
    window.goToStep.__kmaHidden = true;
  }
  window.changeStep = function (delta) {
    var o = order(), p = o.indexOf(currentStepIndex) + (delta < 0 ? -1 : 1);
    if (p >= 0 && p < o.length) goToStep(o[p]);
  };
  function groupNav() {
    var nav = document.getElementById('step-nav');
    if (!nav) return;
    Array.prototype.forEach.call(nav.querySelectorAll(':scope > .kma-nav-group, :scope > .kma-nav-fase'), function (h) { h.remove(); });
    var links = Array.prototype.slice.call(nav.querySelectorAll(':scope > .step-link'));
    if (!links.length) return;
    links.forEach(function (l, i) { if (!l.hasAttribute('data-idx')) l.setAttribute('data-idx', i); });
    links.forEach(function (l) { if (hidden(+l.getAttribute('data-idx'))) l.remove(); });
    var frag = document.createDocumentFragment();
    ['kern', 'verdieping', 'naslag'].forEach(function (g) {
      var o = order();
      var mine = links.filter(function (l) { return groupOf(+l.getAttribute('data-idx')) === g; })
        .sort(function (x, y) { return o.indexOf(+x.getAttribute('data-idx')) - o.indexOf(+y.getAttribute('data-idx')); });
      if (!mine.length) return;
      var head = document.createElement('button');
      head.type = 'button';
      head.className = 'kma-nav-group kma-nav-group-' + g;
      head.setAttribute('data-group', g);
      head.setAttribute('aria-controls', 'step-nav');
      head.innerHTML = '<span class="kma-nav-group-text"><strong></strong><span></span></span>' +
        '<span class="kma-nav-group-count"></span>' + icon('down');
      head.querySelector('strong').textContent = GROUP_INFO[g][0];
      head.querySelector('.kma-nav-group-text span').textContent = GROUP_INFO[g][1];
      head.querySelector('.kma-nav-group-count').textContent = mine.length + (mine.length === 1 ? ' hoofdstuk' : ' hoofdstukken');
      head.addEventListener('click', function () { openGroup(nav.getAttribute('data-open') === g ? '' : g); });
      frag.appendChild(head);
      var vorige = '';
      mine.forEach(function (l, k) {
        // 4.30 (punt 18): in de vaste basis staan de stappen van de rode draad als kopjes
        var f = g === 'kern' ? FASE_KL(steps[+l.getAttribute('data-idx')].title) : '';
        if (f && f !== vorige) { var fk = document.createElement('div'); fk.className = 'kma-nav-fase'; fk.setAttribute('data-group', g); fk.setAttribute('aria-hidden', 'true'); fk.textContent = f; frag.appendChild(fk); vorige = f; }
        l.setAttribute('data-group', g); l.classList.toggle('is-last', k === mine.length - 1); frag.appendChild(l);
      });
    });
    nav.appendChild(frag);
    nav.classList.add('kma-acc');
    if (!nav.hasAttribute('data-open')) openGroup(isPhone() ? '' : groupOf(currentStepIndex));
    else openGroup(nav.getAttribute('data-open'));
    relabel();
    var select = document.getElementById('quick-chapter-select');
    if (select && !select.querySelector('optgroup')) {
      var opts = Array.prototype.slice.call(select.options);
      opts.forEach(function (o) { if (hidden(+o.value)) o.remove(); });
      ['kern', 'verdieping', 'naslag'].forEach(function (g) {
        var og = document.createElement('optgroup'); og.label = GROUP_INFO[g][0];
        order().forEach(function (i) { var o = opts.filter(function (x) { return +x.value === i; })[0]; if (o && groupOf(i) === g) og.appendChild(o); });
        if (og.children.length) select.appendChild(og);
      });
      select.value = String(currentStepIndex);
    }
    relabel();
  }

  /* Klapt één groep van de inhoudsopgave open ('' = alles dicht). */
  function openGroup(g) {
    var nav = document.getElementById('step-nav'); if (!nav) return;
    nav.setAttribute('data-open', g || '');
    var cur = groupOf(currentStepIndex);
    Array.prototype.forEach.call(nav.querySelectorAll(':scope > .kma-nav-group'), function (h) {
      var mine = h.getAttribute('data-group');
      h.setAttribute('aria-expanded', mine === g ? 'true' : 'false');
      h.classList.toggle('is-current', mine === cur);
    });
  }
  window.kmaOpenChapterGroup = openGroup;

  /* ---------------- 9. Checkmarks ---------------- */
  function markChapters() {
    var links = document.querySelectorAll('#step-nav .step-link');
    links.forEach(function (link, pos) {
      var a = link.getAttribute('data-idx'), idx = a == null ? pos : +a;
      var st = chapterStatus(idx);
      var complete = isComplete(st);
      link.classList.toggle('is-done', complete);
      var bar = link.querySelector('.kma-mini-progress');
      if (!st.count && st.total && st.done > 0 && !complete) {
        if (!bar) {
          bar = document.createElement('span');
          bar.className = 'kma-mini-progress';
          bar.innerHTML = '<i></i>';
          var copy = link.querySelector('.step-copy') || link;
          copy.appendChild(bar);
        }
        bar.firstChild.style.width = Math.round(st.done / st.total * 100) + '%';
      } else if (bar) {
        bar.remove();
      }
    });
    var select = document.getElementById('quick-chapter-select');
    if (select) {
      Array.prototype.forEach.call(select.options, function (opt) {
        var idx = +opt.value;
        var base = opt.getAttribute('data-kma-label');
        if (base == null) { base = opt.textContent; opt.setAttribute('data-kma-label', base); }
        opt.textContent = (isComplete(chapterStatus(idx)) ? '✓ ' : '') + base;
      });
    }
  }
  function markQuestions() {
    document.querySelectorAll('#questions-container .question-card').forEach(function (card) {
      var t = card.querySelector('textarea');
      card.classList.toggle('is-answered', !!(t && t.value.trim()));
    });
  }
  document.addEventListener('input', function (e) {
    var card = e.target.closest && e.target.closest('.question-card');
    if (card && e.target.tagName === 'TEXTAREA') card.classList.toggle('is-answered', !!e.target.value.trim());
  });

  /* ---------------- Hook into the page ---------------- */
  var origRenderNav = window.renderNav;
  window.renderNav = function () {
    var r = origRenderNav.apply(this, arguments);
    groupNav();
    markChapters();
    return r;
  };
  var origUpdateProgress = window.updateProgress;
  window.updateProgress = function () {
    var r = origUpdateProgress.apply(this, arguments);
    markChapters();
    updateStatus();
    return r;
  };
  var origRenderStep = window.renderStep;
  window.renderStep = function () {
    var r = origRenderStep.apply(this, arguments);
    relabel();
    markQuestions();
    updateStatus();
    requestAnimationFrame(function () { document.querySelectorAll('textarea').forEach(window.kmaGrow); });
    return r;
  };
  var origGoToStep = window.goToStep;
  window.goToStep = function (idx) {
    var r = origGoToStep.apply(this, arguments);
    set(LAST_STEP_KEY, String(currentStepIndex));
    if (continueCard && currentStepIndex !== 0) { continueCard.remove(); continueCard = null; }
    openGroup(isPhone() ? '' : groupOf(currentStepIndex));
    return r;
  };

  function init() {
    applyTheme();
    if (document.querySelector('#step-nav > .step-link')) groupNav();
    showContinueCard();
    markChapters();
    markQuestions();
    updateStatus();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else init();
})();
