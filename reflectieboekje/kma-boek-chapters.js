/*
 * Reflection book: chapter improvements, visuals, links between chapters and privacy controls.
 * Loaded after the page script, kma-ui.js, kma-ui-boek.js, kma-viz.js, kma-hexaco-core.js and kma-boek-hexaco.js.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.KMAViz) return;
  var V = window.KMAViz, esc = V.esc, icon = window.kmaIcon, H = window.KMAHex;
  var R = window.KMAChapterRenderers = window.KMAChapterRenderers || {};
  var VS = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'];

  /* ======================= Small helpers ======================= */
  function getX(k, d) {
    try {
      var v = kmaStore.getItem('kma-x-' + k); if (v == null) return d;
      v = JSON.parse(v);
      // a damaged or edited value must not break a chapter: fall back to the default when the type is wrong
      if (Array.isArray(d) && !Array.isArray(v)) return d;
      if (d && typeof d === 'object' && !Array.isArray(d) && (!v || typeof v !== 'object' || Array.isArray(v))) return d;
      return v;
    } catch (e) { return d; }
  }
  function setX(k, v) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(v)); } catch (e) {} if (typeof triggerSavePulse === 'function') triggerSavePulse(); }
  function idxOf(test) { return steps.findIndex(test); }
  function byTitle(re) { return idxOf(function (s) { return re.test(s.title); }); }
  function byWidget(w) { return idxOf(function (s) { return s.widget === w; }); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function nowTime() { var d = new Date(); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function fmtDate(iso) {
    if (!iso) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return iso;
    return Number(m[3]) + ' ' + ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][Number(m[2]) - 1] + ' ' + m[1];
  }
  function selfScores() { return H ? H.plain(H.score(hexacoSelfAnswers, hexacoQuestionsSelf)) : {}; }
  function hexDone() { return H && H.isComplete(H.score(hexacoSelfAnswers, hexacoQuestionsSelf)); }
  function cardHtml(title, body, ic) { return '<div class="kma-card-block">' + (title ? '<h4>' + (ic ? icon(ic) : '') + title + '</h4>' : '') + body + '</div>'; }
  function chips(list, selected, attr) {
    return '<div class="kma-chips">' + list.map(function (c) {
      return '<button type="button" class="kma-chip-btn' + (selected.indexOf(c) >= 0 ? ' on' : '') + '" ' + attr + '="' + esc(c) + '">' + esc(c) + '</button>';
    }).join('') + '</div>';
  }
  var QUALITIES = ['Doorzettingsvermogen', 'Teamspeler', 'Verantwoordelijkheid', 'Flexibiliteit', 'Moed', 'Eerlijkheid', 'Discipline', 'Humor', 'Empathie',
    'Leiderschap', 'Creativiteit', 'Zelfstandigheid', 'Rust', 'Nieuwsgierigheid', 'Betrouwbaarheid', 'Zorgvuldigheid', 'Daadkracht', 'Enthousiasme', 'Behulpzaamheid'];

  /* ======================= Privacy & sharing ======================= */
  // Fitheid (logboek, PSS-10 en WHO-5) is een eigen hoofdstuk en blijft standaard privé.
  var FIT_TITLE = 'Fitheid & stress';
  var PRIVATE_DEFAULT = { 'Introductie & Drijfveren': true, 'Curriculum vitae': true };
  PRIVATE_DEFAULT[FIT_TITLE] = true;
  // 4.30 (punt 74): de persoonlijkheidstest is standaard privé; wie al deelde, houdt zijn instelling (kma-boek-meting.js)
  PRIVATE_DEFAULT['Persoonlijkheidstest (IPIP)'] = true;
  var RENAMED = [['Gedragscode Defensie (4 V\'s)', 'Ik en de Gedragscode Defensie'], ['__fitheid', FIT_TITLE], ['Voorbereiding Cadetbeoordeling & Fitheid', 'Voorbereiding Cadetbeoordeling']];
  function sharePrefs() {
    var p = getX('share', {}), moved = false;
    RENAMED.forEach(function (r) { if (r[0] in p) { if (!(r[1] in p)) p[r[1]] = p[r[0]]; delete p[r[0]]; moved = true; } });
    if (moved) setX('share', p);
    return p;
  }
  function shareKey(key) { return key === '__fitheid' ? FIT_TITLE : key; }
  /** Een verborgen hoofdstuk (verborgen: true) wordt nooit gedeeld. */
  function isHiddenTitle(key) { return typeof steps !== 'undefined' && steps.some(function (s) { return s.verborgen && s.title === key; }); }
  // 4.5.1: Fitheid & stress (PSS-10 sinds 4.7.0) is altijd privé en kan niet gedeeld worden; het is van de cadet zelf.
  var ALWAYS_PRIVATE = {}; ALWAYS_PRIVATE[FIT_TITLE] = true;
  window.kmaAlwaysPrivate = function (key) { return !!ALWAYS_PRIVATE[shareKey(key)]; };
  function isShared(key) { if (isHiddenTitle(key)) return false; key = shareKey(key); if (ALWAYS_PRIVATE[key]) return false; var p = sharePrefs(); return key in p ? !!p[key] : !PRIVATE_DEFAULT[key]; }
  function setShared(key, on) { key = shareKey(key); if (ALWAYS_PRIVATE[key]) on = false; var p = sharePrefs(); p[key] = !!on; setX('share', p); }
  window.kmaIsShared = isShared;

  function collectExtras(forShare) {
    var out = {};
    for (var i = 0; i < kmaStore.length; i++) {
      var k = kmaStore.key(i);
      if (!k || k.indexOf('kma-x-') !== 0 || k === 'kma-x-flash') continue;
      try { out[k.slice(6)] = JSON.parse(kmaStore.getItem(k)); } catch (e) {}
    }
    if (forShare) {
      delete out.feedback; // feedback came from the instructor; no need to send it back
      delete out.resume; delete out['dtf-draft']; delete out['last-shared'];
      if (!isShared('Introductie & Drijfveren')) delete out.support;
      if (!isShared(steps[byTitle(/^Ik als officier/)].title)) delete out.kernkwadrant;
      if (!isShared(steps[byTitle(/SMART/)].title)) { ['smart-date', 'smart-checkins', 'plannen', 'plan-checkins', 'plan-dtf', 'leervragen', 'leervraag-stand', 'gas', 'woop'].forEach(function (k) { delete out[k]; }); }
      if (!isShared(steps[byTitle(/^Probleem/)].title)) delete out.probleem;
      // own settings and keys never leave the phone
      ['groupcode', 'deel', 'koppel', 'fb-seen', 'receipt', 'portfolio'].forEach(function (k) { delete out[k]; });
      var cvI = byWidget('cv'); if (cvI < 0 || !isShared(steps[cvI].title)) delete out.cv;
      var grI = byWidget('groei'); if (grI >= 0 && !isShared(steps[grI].title)) { delete out['self-history']; delete out['v4-history']; }
      if (!isShared(FIT_TITLE)) { delete out.pss; delete out.who5; }
      delete out['pss-groep']; // de groepsberekening is van het groepje zelf
      // 4.30: geslacht is alleen voor het onderzoek en gaat nooit naar het CadetVolgSysteem; instroom en startdatum wel
      if (out.instroom && typeof out.instroom === 'object') out.instroom = { soort: out.instroom.soort, start: out.instroom.start };
      // 4.30 (punt 68): stress en welzijn gaan nooit naar het CadetVolgSysteem, ook niet via de gespreksvoorbereiding
      if (out['gesprek-prep'] && typeof out['gesprek-prep'] === 'object') { delete out['gesprek-prep'].stress; if (out['gesprek-prep'].incl) out['gesprek-prep'].incl.stress = false; }
      delete out.pss; delete out.who5;
      // 4.30: onderzoeksinstellingen blijven op de telefoon (de code reist apart mee); de 144 extra stellingen alleen als de test gedeeld is
      delete out.onderzoek;
      var hxI = byWidget('hexaco'); if (hxI < 0 || !isShared(steps[hxI].title)) delete out.hex240;
      // 4.30 (punt 78): metingen alleen als de test gedeeld is, en dan alleen de scores (niet de losse antwoorden)
      if (hxI < 0 || !isShared(steps[hxI].title)) delete out['hex-metingen'];
      else if (Array.isArray(out['hex-metingen'])) out['hex-metingen'] = out['hex-metingen'].map(function (m) { return m && { datum: m.datum, set: m.set, d: m.d }; }).filter(Boolean);
      // 4.30: eigen hulpgegevens blijven op de telefoon
      delete out.fouten; delete out['opslag-melding']; delete out.oefenen;
      /* 4.33.1: sleutels, concepten en schermstanden blijven ook op de telefoon. Voorheen gingen o.a. de sleutel van de
         reservekopie, de privésleutel en de kaartenbak van Kameraden en niet-opgeslagen concepten mee naar het CVS. Ze
         maakten het dossier bovendien "veranderd" zodra ze voor het eerst werden aangemaakt, waardoor het opnieuw werd gedeeld. */
      ['kameraden', 'reserve-sleutel', 'reserve-kopie', 'reserve-toestel', 'reserve-laatste', 'concepten', 'laatste-keuze', 'lijst-uitgebreid',
        'startwizard', 'snelstart-gezien', 'demo', 'hex-keuze'].forEach(function (k) { delete out[k]; });
      // vangnet: nooit iets met een sleutel in JWK-vorm (zoals een privésleutel) delen
      Object.keys(out).forEach(function (k) { try { if (/"kty"\s*:/.test(JSON.stringify(out[k]))) delete out[k]; } catch (e) { delete out[k]; } });
    }
    return out;
  }
  window.kmaCollectExtras = collectExtras;
  window.kmaRestoreExtras = function (x) {
    if (!x || typeof x !== 'object') return;
    Object.keys(x).forEach(function (k) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(x[k])); } catch (e) {} });
  };

  /** Removes everything from private chapters before it leaves the phone. */
  /* QR "snel profiel": a QR code holds ~3 kB and must stay scannable, so it carries only the
     essentials (no photo, no reflection texts). The full file goes via Bluetooth / Quick Share. */
  window.kmaQrPayload = function (payload) {
    var o = window.kmaPrepareShare ? kmaPrepareShare(payload) : JSON.parse(JSON.stringify(payload));
    delete o.extras; delete o.sharedChapters; delete o.profilePhoto;
    delete o.dtf; delete o.fitness; delete o.timeline; delete o.casesKorthagen; delete o.hexacoObservers; delete o.hexacoSelf;
    var bytes = function (x) { return unescape(encodeURIComponent(JSON.stringify(x))).length; };
    var LIMIT = 1400;
    o.qrLite = true;
    if (o.officialKMAForm) {
      var f = o.officialKMAForm, keep = {};
      Object.keys(f).forEach(function (k) { if (/_score$|^totalScore$|^eindoordeel$|^datum$|^group$/.test(k)) keep[k] = f[k]; });
      o.officialKMAForm = keep;
    }
    if (o.cases5GT) o.cases5GT = o.cases5GT.map(function (c) { return { title: c.title || '5G-T' }; });
    if (bytes(o) > LIMIT) delete o.cases5GT;
    if (bytes(o) > LIMIT && o.answers) Object.keys(o.answers).forEach(function (k) { if (!/Naam|OPCO|Peoplesoft/i.test(k)) delete o.answers[k]; });
    // The QR library miscounts non-ASCII characters (ë, é…): send them as \\u escapes, which JSON.parse reads back.
    return JSON.stringify(o).replace(/[\u0080-\uffff]/g, function (ch) { return '\\u' + ('000' + ch.charCodeAt(0).toString(16)).slice(-4); });
  };

  window.kmaPrepareShare = function (payload) {
    var p = JSON.parse(JSON.stringify(payload));
    steps.forEach(function (s, i) {
      if (i === 0 || isShared(s.title)) return;
      if (p.answers) (s.questions || []).forEach(function (q) { delete p.answers[q]; });
      if (s.widget === 'hexaco') { delete p.hexaco; delete p.hexacoSelf; delete p.hexacoObservers; }
      if (s.widget === 'timeline') p.timeline = [];
      if (s.widget === '5gt-multi') p.cases5GT = [];
      if (s.widget === 'korthagen-multi') p.casesKorthagen = [];
      if (s.widget === 'dtf-logbook') p.dtf = [];
      if (s.widget === 'gedragscode-form' && p.answers) delete p.answers['gedragscode-scores'];
      if (s.widget === 'kma-self-form-widget') { p.officialKMAForm = null; p.kmaOfficialSelfForm = null; }
    });
    if (!isShared(FIT_TITLE)) p.fitness = [];
    p.extras = collectExtras(true);
    // 4.26.0 (B2): de onderzoekscode reist mee, zodat de teamleider zijn deel aan hetzelfde record kan koppelen
    if (window.kmaOnderzoek && kmaOnderzoek.code()) p.onderzoekscode = kmaOnderzoek.code();
    p.sharedChapters = steps.map(function (s, i) { return i === 0 || isShared(s.title); });
    // Ook op titel: een oudere of nieuwere app met andere hoofdstuknummers leest dan toch het juiste hoofdstuk.
    p.sharedTitles = {}; steps.forEach(function (s, i) { p.sharedTitles[s.title] = i === 0 || isShared(s.title); });
    // Who wrote what, so the CadetVolgSysteem never has to guess; and when it was shared (for the receipt).
    if (Array.isArray(p.dtf)) p.dtf.forEach(function (d) { if (d && typeof d === 'object' && !d.author) d.author = 'cadet'; });
    p.sharedAt = new Date().toISOString();
    if (window.KMAData) KMAData.stempel(p);
    p.format = 'kma-cadet-dossier';
    return p;
  };

  function sharePreview(onGo) {
    var ov = document.createElement('div');
    ov.className = 'kma-sheet-overlay in';
    var rows = steps.map(function (s, i) {
      if (i === 0 || s.verborgen) return '';
      if (ALWAYS_PRIVATE[s.title]) return '<label class="kma-share-row is-locked"><span>' + esc(s.title) + ' <small class="muted">(altijd privé)</small></span>' + icon('lock') + '</label>';
      return '<label class="kma-share-row"><span>' + esc(s.title) + '</span><input type="checkbox" data-key="' + esc(s.title) + '"' + (isShared(s.title) ? ' checked' : '') + '/><i class="kma-switch"></i></label>';
    }).join('');
    ov.innerHTML = '<div class="kma-sheet" role="dialog" aria-modal="true" style="transform:none"><div class="kma-sheet-grip"></div><div class="kma-sheet-title">Wat deel je met je teamleider?</div>' +
      '<p class="muted" style="padding:0 14px">Je profiel wordt altijd gedeeld. Zet uit wat privé moet blijven; dit wordt onthouden.</p>' +
      '<div class="kma-share-list">' + rows + '</div>' +
      '<div class="kma-row-btns" style="padding:12px 14px"><button type="button" class="kma-icon-btn" data-x="cancel">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-x="go">' + icon('share') + 'Delen</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('change', function (e) { var c = e.target; if (c.dataset && c.dataset.key) setShared(c.dataset.key, c.checked); });
    ov.addEventListener('click', function (e) {
      if (e.target === ov || (e.target.closest('[data-x="cancel"]'))) ov.remove();
      if (e.target.closest('[data-x="go"]')) { ov.remove(); onGo(); }
    });
  }
  if (typeof shareViaBluetoothNative === 'function') {
    var origShare = window.shareViaBluetoothNative;
    window.shareViaBluetoothNative = function () { sharePreview(function () { origShare(); }); };
  }
  if (typeof openCadetQRModal === 'function') {
    var origQR = window.openCadetQRModal;
    window.openCadetQRModal = function () { sharePreview(function () { origQR(); }); };
  }

  function shareToggleHtml(key) {
    if (ALWAYS_PRIVATE[shareKey(key)]) return '<div class="kma-share-toggle off is-locked">' + icon('lock') + '<span>Altijd privé: dit hoofdstuk is van jou en wordt nooit gedeeld</span></div>';
    var on = isShared(key);
    return '<label class="kma-share-toggle' + (on ? '' : ' off') + '">' + icon(on ? 'share' : 'lock') +
      '<span>' + (on ? 'Gedeeld met teamleider' : 'Privé, niet gedeeld') + '</span><input type="checkbox" data-share-key="' + esc(key) + '"' + (on ? ' checked' : '') + '/><i class="kma-switch"></i></label>';
  }
  document.addEventListener('change', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-share-key');
    if (!k) return;
    setShared(k, e.target.checked);
    var lab = e.target.closest('.kma-share-toggle');
    if (lab) { lab.outerHTML = shareToggleHtml(k); }
    kmaToast(e.target.checked ? 'Wordt gedeeld met je teamleider' : 'Blijft privé op je telefoon');
  });

  /* ======================= Chapter dispatch ======================= */
  var origRenderWidgets = window.renderWidgets;
  window.renderWidgets = function () {
    var step = steps[currentStepIndex], c = document.getElementById('widget-container');
    document.body.className = document.body.className.replace(/\bkma-ch-\S+/g, '').trim();
    if (step) document.body.classList.add('kma-ch-' + (step.widget || ('q' + currentStepIndex)));
    if (step && c && step.widget && R[step.widget]) R[step.widget](c, step);
    else origRenderWidgets.apply(this, arguments);
    if (step && c && QR[step.title] && QR[step.title].widget) QR[step.title].widget(c, step);
  };
  var origRenderStep = window.renderStep;
  window.renderStep = function () {
    document.querySelectorAll('.content-panel > .kma-q-tabs, #kma-v4-after').forEach(function (el) { el.remove(); });
    var r = origRenderStep.apply(this, arguments);
    var step = steps[currentStepIndex];
    var head = document.querySelector('.section-heading');
    var old = document.getElementById('kma-share-holder');
    if (old) old.remove();
    if (head && currentStepIndex > 0) {
      var holder = document.createElement('div');
      holder.id = 'kma-share-holder';
      holder.innerHTML = shareToggleHtml(step.title);
      var desc = document.getElementById('step-desc');
      (desc || head).insertAdjacentElement('afterend', holder);
    }
    if (step && QR[step.title] && QR[step.title].questions) QR[step.title].questions(step);
    if (step && step.widget && AFTERQ[step.widget]) AFTERQ[step.widget](step);
    return r;
  };
  var QR = {};      // question-based chapters, keyed by title
  var AFTERQ = {};  // extra work after questions of widget chapters

  function qCards() { return Array.prototype.slice.call(document.querySelectorAll('#questions-container .question-card')); }
  function cardFor(qIdx) { return document.getElementById('q-input-' + qIdx) ? document.getElementById('q-input-' + qIdx).closest('.question-card') : null; }
  function setAnswer(qIdx, val) {
    var t = document.getElementById('q-input-' + qIdx);
    if (t) { t.value = val; t.dispatchEvent(new Event('input', { bubbles: true })); }
    else saveAnswerByIdx(currentStepIndex, qIdx, val);
  }

  /* ======================= 0. Profiel ======================= */
  var OPCO = [['CLAS', 'CLAS (Landmacht)'], ['CZSK', 'CZSK (Marine)'], ['CLRS', 'CLRS (Luchtmacht)'], ['KMar', 'KMar (Marechaussee)'], ['', 'Anders…']];
  function idCard() {
    var photo = kmaStore.getItem('kma-profile-photo') || '';
    var a = function (k) { return answers[k] || ''; };
    return '<div class="kma-idcard"><div class="kma-idcard-top"><img src="kma-embleem.svg" alt=""><span>Koninklijke Militaire Academie</span></div>' +
      '<div class="kma-idcard-body"><div class="kma-idcard-photo">' + (photo ? '<img alt="" src="' + esc(photo) + '">' : icon('user')) + '</div>' +
      '<div class="kma-idcard-info"><strong>' + esc(a('Voornaam & Achternaam:') || 'Je naam') + '</strong>' +
      '<span>' + esc(a('OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):') || 'OPCO') + ' · ' + esc(a('Dienstvak / Wapen / Korps:') || 'Dienstvak') + '</span>' +
      '<small>Peoplesoft ' + esc(a('Peoplesoft Nummer:') || '-') + ' · RegNr ' + esc(a('Registratienummer (RegNr):') || '-') + '</small></div>' +
      (window.kmaOpcoIcon && kmaOpcoIcon(a('OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):')) ? '<div class="kma-idcard-opco">' + kmaOpcoIcon(a('OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):')) + '</div>' : '') + '</div>' +
      '<div class="kma-idcard-foot">Zo ziet je teamleider je in het CadetVolgSysteem</div></div>';
  }
  R['cadet-profile'] = function (c) {
    origRenderWidgets();
    var holder = document.createElement('div');
    holder.id = 'kma-idcard-holder';
    holder.innerHTML = idCard();
    c.insertBefore(holder, c.firstChild);
    // 4.30 (punten 66, 67): instroom (burger/doorstromer), startdatum en geslacht (alleen onderzoek)
    if (window.kmaInstroom && !document.getElementById('kma-instroom')) { var ins = document.createElement('div'); ins.innerHTML = kmaInstroom.html(); c.appendChild(ins.firstChild); }
  };
  AFTERQ['cadet-profile'] = function () {
    var opcoT = document.getElementById('q-input-3');
    if (opcoT && !document.getElementById('kma-opco')) {
      var cur = opcoT.value.trim();
      var known = OPCO.some(function (o) { return o[0] && o[0] === cur; });
      var sel = document.createElement('select');
      sel.id = 'kma-opco';
      sel.className = 'kma-select';
      sel.innerHTML = '<option value="" disabled' + (cur ? '' : ' selected') + '>Kies je krijgsmachtdeel</option>' +
        OPCO.map(function (o) { return '<option value="' + o[0] + '"' + ((known && o[0] === cur) || (!known && cur && !o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
      opcoT.parentElement.insertAdjacentElement('beforebegin', sel);
      opcoT.parentElement.style.display = known || !cur ? 'none' : '';
      sel.addEventListener('change', function () {
        if (sel.value) { opcoT.parentElement.style.display = 'none'; opcoT.value = sel.value; opcoT.dispatchEvent(new Event('input', { bubbles: true })); }
        else { opcoT.parentElement.style.display = ''; opcoT.value = ''; opcoT.focus(); }
      });
    }
    [1, 2].forEach(function (i) {
      var t = document.getElementById('q-input-' + i);
      if (!t || t.dataset.kmaNum) return;
      t.dataset.kmaNum = '1';
      t.setAttribute('inputmode', 'numeric');
      t.rows = 1;
      t.classList.add('kma-short');
      var hint = document.createElement('div');
      hint.className = 'kma-field-hint';
      t.parentElement.insertAdjacentElement('afterend', hint);
      var check = function () { var v = t.value.trim(); hint.textContent = v && /[^0-9 ]/.test(v) ? 'Alleen cijfers, zonder letters of tekens.' : ''; };
      t.addEventListener('input', check); check();
    });
    var nameT = document.getElementById('q-input-0');
    if (nameT) { nameT.rows = 1; nameT.classList.add('kma-short'); }
  };
  document.addEventListener('input', function (e) {
    if (currentStepIndex !== 0 || !e.target.closest || !e.target.closest('#questions-container')) return;
    var h = document.getElementById('kma-idcard-holder');
    if (h) setTimeout(function () { h.innerHTML = idCard(); }, 0);
  });

  /* ======================= 1. Introductie: steuncirkel ======================= */
  QR['Introductie & Drijfveren'] = {
    widget: function (c) {
      var people = getX('support', []);
      c.innerHTML = cardHtml('Jouw steuncirkel', '<p class="muted">Wie staat er om je heen tijdens de opleiding? Hoe dichter bij het midden, hoe meer steun.</p>' +
        V.supportCircle(people, 'Ik') +
        '<div class="kma-inline-form"><input type="text" id="kma-sup-name" placeholder="Naam (bijv. moeder, Sanne)"/>' +
        '<select id="kma-sup-ring"><option value="1">Heel dichtbij</option><option value="2">Dichtbij</option><option value="3">Verder weg</option></select>' +
        '<button type="button" class="kma-icon-btn is-primary" data-act="sup-add">' + icon('plus') + 'Toevoegen</button></div>' +
        (people.length ? '<div class="kma-chips">' + people.map(function (p) { return '<button type="button" class="kma-chip-btn" data-act="sup-del" data-id="' + p.id + '">' + esc(p.name) + ' ' + icon('x') + '</button>'; }).join('') + '</div>' : ''), 'users');
    }
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act="sup-add"],[data-act="sup-del"]');
    if (!b) return;
    var people = getX('support', []);
    if (b.dataset.act === 'sup-add') {
      var n = document.getElementById('kma-sup-name').value.trim();
      if (!n) return;
      people.push({ id: Date.now(), name: n, ring: Number(document.getElementById('kma-sup-ring').value) });
    } else people = people.filter(function (p) { return String(p.id) !== b.dataset.id; });
    setX('support', people);
    renderWidgets();
  });

  /* ======================= 2. Ontwikkelbiografie: levenslijn ======================= */
  var tlEdit = null; // { id|null, year, score, text, qualities }
  function tlYears(items) {
    var now = new Date().getFullYear(), ys = items.map(function (i) { return parseInt(i.year, 10); }).filter(function (y) { return !isNaN(y); });
    var birth = parseInt(String(answers['Geboortedatum:'] || answers['Geboortejaar:'] || '').replace(/.*(\d{4}).*/, '$1'), 10);
    var lo = Math.min.apply(null, ys.concat([isNaN(birth) ? now - 12 : birth + 4])), hi = Math.max.apply(null, ys.concat([now]));
    if (hi - lo < 6) lo = hi - 6;
    return { lo: lo, hi: hi };
  }
  var TL = { W: 340, H: 230, L: 30, R: 14, T: 22, B: 34 };
  function tlX(y, r) { return TL.L + (y - r.lo) / (r.hi - r.lo) * (TL.W - TL.L - TL.R); }
  function tlY(v) { return TL.T + (5 - v) * (TL.H - TL.T - TL.B) / 10; }
  function tlSvg(items, r) {
    var gold = V.colors.gold, out = '';
    out += '<rect x="' + TL.L + '" y="' + TL.T + '" width="' + (TL.W - TL.L - TL.R) + '" height="' + (tlY(0) - TL.T) + '" fill="#2f7d4f" fill-opacity="0.07"/>';
    out += '<rect x="' + TL.L + '" y="' + tlY(0) + '" width="' + (TL.W - TL.L - TL.R) + '" height="' + (tlY(-5) - tlY(0)) + '" fill="#b4473a" fill-opacity="0.07"/>';
    [-5, 0, 5].forEach(function (t) {
      out += '<line x1="' + TL.L + '" x2="' + (TL.W - TL.R) + '" y1="' + tlY(t) + '" y2="' + tlY(t) + '" stroke="currentColor" stroke-opacity="' + (t === 0 ? 0.55 : 0.18) + '" stroke-width="' + (t === 0 ? 1.6 : 0.8) + '"' + (t === 0 ? '' : ' stroke-dasharray="2 3"') + '/>';
      out += '<text x="' + (TL.L - 6) + '" y="' + (tlY(t) + 4) + '" text-anchor="end" font-size="10" fill="currentColor" fill-opacity="0.6">' + (t > 0 ? '+' : '') + t + '</text>';
    });
    out += '<text x="' + (TL.L + 4) + '" y="' + (TL.T - 7) + '" font-size="10" fill="#2f7d4f" font-weight="700">hoogtepunten</text>';
    out += '<text x="' + (TL.L + 4) + '" y="' + (TL.H - TL.B + 13) + '" font-size="10" fill="#b4473a" font-weight="700">dieptepunten</text>';
    var span = r.hi - r.lo, stepY = span > 20 ? 5 : span > 8 ? 2 : 1;
    for (var y = r.lo; y <= r.hi; y++) if ((y - r.lo) % stepY === 0 || y === r.hi) out += '<text x="' + tlX(y, r) + '" y="' + (TL.H - 6) + '" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.6">' + y + '</text>';
    var pts = items.filter(function (i) { return !isNaN(parseInt(i.year, 10)); }).map(function (i) { return { it: i, x: tlX(parseInt(i.year, 10), r), y: tlY(i.score != null ? Number(i.score) : (i.pos === 'bottom' ? -2 : 2)) }; });
    if (pts.length > 1) out += '<path d="' + pts.map(function (p, k) { return (k ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1); }).join('') + '" fill="none" stroke="' + gold + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
    pts.forEach(function (p, k) {
      var neg = Number(p.it.score) < 0, lab = String(p.it.text || '');
      lab = lab.length > 16 ? lab.slice(0, 15) + '…' : lab;
      out += '<g class="kma-tl-dot" data-tlid="' + esc(p.it.id) + '"><circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="13" fill="transparent"/><circle cx="' + p.x.toFixed(1) + '" cy="' + p.y.toFixed(1) + '" r="5.5" fill="' + gold + '" stroke="#fff" stroke-width="1.5"/>' +
        (pts.length <= 10 ? '<text x="' + p.x.toFixed(1) + '" y="' + (neg ? p.y + 17 : p.y - 10).toFixed(1) + '" text-anchor="middle" font-size="9" fill="currentColor">' + esc(lab) + '</text>' : '') + '</g>';
    });
    if (tlEdit && !tlEdit.id) {
      var gx = tlX(parseInt(tlEdit.year, 10) || r.hi, r), gy = tlY(tlEdit.score);
      out += '<circle cx="' + gx + '" cy="' + gy + '" r="7" fill="none" stroke="' + gold + '" stroke-width="2" stroke-dasharray="3 2"/><text x="' + gx + '" y="' + (gy + 4) + '" text-anchor="middle" font-size="11" font-weight="800" fill="' + gold + '">+</text>';
    }
    return '<svg class="kv kma-tl-svg" viewBox="0 0 ' + TL.W + ' ' + TL.H + '" role="img" aria-label="Levenslijn: tik om een gebeurtenis toe te voegen">' + out + '</svg>';
  }
  function tlForm() {
    if (!tlEdit) return '';
    var e = tlEdit;
    return '<div class="kma-tl-form" id="kma-tl-form"><h5>' + (e.id ? 'Gebeurtenis aanpassen' : 'Nieuwe gebeurtenis') + '</h5>' +
      '<div class="kma-inline-form"><input type="text" id="tl-year" inputmode="numeric" value="' + esc(e.year) + '" aria-label="Jaar" style="max-width:90px"/>' +
      '<input type="text" id="tl-text" value="' + esc(e.text || '') + '" placeholder="Wat gebeurde er?" aria-label="Wat gebeurde er?"/></div>' +
      '<label class="kma-range-label">Hoe was dit moment? <strong id="kma-tl-score-val">' + (e.score > 0 ? '+' : '') + e.score + '</strong></label>' +
      '<input type="range" id="kma-tl-score" min="-5" max="5" value="' + e.score + '" class="kma-range"/><div class="kma-range-ends"><span>−5 dieptepunt</span><span>+5 hoogtepunt</span></div>' +
      '<p class="muted small">Welke kwaliteiten hielpen je hierbij?</p>' + chips(QUALITIES, e.qualities, 'data-tlq') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-act="tl-cancel">Annuleren</button>' +
      (e.id ? '<button type="button" class="kma-icon-btn" data-act="tl-del">' + icon('trash') + 'Verwijderen</button>' : '') +
      '<button type="button" class="kma-icon-btn is-primary" data-act="tl-save">' + icon('save') + (e.id ? 'Opslaan' : 'Toevoegen') + '</button></div></div>';
  }
  R.timeline = function (c) {
    var items = timelineItems.filter(Boolean).slice().sort(function (a, b) { return (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0); });
    var counts = {};
    items.forEach(function (it) { (it.qualities || []).forEach(function (q) { counts[q] = (counts[q] || 0) + 1; }); });
    var thread = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 3);
    var r = tlYears(items);
    c.innerHTML = cardHtml('Jouw levenslijn', '<p class="muted">Tik op de plek in de lijn waar iets belangrijks gebeurde: links-rechts is het jaar, hoger is een hoogtepunt, lager een dieptepunt. Tik op een punt om het aan te passen.</p>' +
      '<div class="kma-tl-wrap" data-r="' + r.lo + ',' + r.hi + '">' + tlSvg(items, r) + '</div>' +
      (tlEdit ? tlForm() : '<button type="button" class="kma-chip-btn" data-act="tl-new">' + icon('plus') + 'Gebeurtenis toevoegen</button>') +
      (thread.length ? '<div class="kma-thread">' + icon('target') + '<span>Jouw rode draad: <strong>' + thread.map(function (q) { return esc(q) + ' (' + counts[q] + '×)'; }).join(', ') + '</strong></span></div>' : ''), 'activity') +
      (items.length ? cardHtml('Gebeurtenissen', items.map(function (it) {
        return '<button type="button" class="kma-tl-item" data-tlid="' + esc(it.id) + '"><div class="kma-tl-score ' + ((it.score != null ? it.score : (it.pos === 'bottom' ? -1 : 1)) < 0 ? 'neg' : 'pos') + '">' + (it.score != null ? (it.score > 0 ? '+' : '') + it.score : '-') + '</div>' +
          '<div class="kma-tl-body"><strong>' + esc(it.year) + '</strong> ' + esc(it.text) +
          ((it.qualities || []).length ? '<div class="kma-chips small">' + it.qualities.map(function (q) { return '<span class="kma-chip-btn on">' + esc(q) + '</span>'; }).join('') + '</div>' : '') +
          '</div>' + icon('edit') + '</button>';
      }).join(''), 'list') : '');
  };
  function tlSave() {
    try { kmaStore.setItem(TIMELINE_KEY, JSON.stringify(timelineItems)); } catch (e) {}
    if (typeof dbSet === 'function') dbSet(TIMELINE_KEY, timelineItems);
    if (typeof triggerSavePulse === 'function') triggerSavePulse();
  }
  function tlOpen(edit) {
    tlEdit = edit; renderWidgets();
    setTimeout(function () { var f = document.getElementById('kma-tl-form'); if (f) { f.scrollIntoView({ block: 'nearest' }); var t = document.getElementById('tl-text'); if (t && !edit.id) t.focus(); } }, 30);
  }
  document.addEventListener('input', function (e) {
    if (e.target.id === 'kma-tl-score' && tlEdit) { tlEdit.score = Number(e.target.value); var l = document.getElementById('kma-tl-score-val'); if (l) l.textContent = (tlEdit.score > 0 ? '+' : '') + tlEdit.score; }
    if (e.target.id === 'tl-text' && tlEdit) tlEdit.text = e.target.value;
    if (e.target.id === 'tl-year' && tlEdit) tlEdit.year = e.target.value;
  });
  document.addEventListener('click', function (e) {
    var dot = e.target.closest('[data-tlid]');
    if (dot) {
      var it = timelineItems.find(function (i) { return i && String(i.id) === dot.getAttribute('data-tlid'); });
      if (it) tlOpen({ id: it.id, year: it.year, score: it.score != null ? Number(it.score) : (it.pos === 'bottom' ? -2 : 2), text: it.text, qualities: (it.qualities || []).slice() });
      return;
    }
    var svg = e.target.closest('.kma-tl-svg');
    if (svg) {
      var box = svg.getBoundingClientRect(), wrap = svg.parentElement, rr = wrap.getAttribute('data-r').split(',').map(Number);
      var sx = (e.clientX - box.left) / box.width * TL.W, sy = (e.clientY - box.top) / box.height * TL.H;
      var year = Math.round(rr[0] + (sx - TL.L) / (TL.W - TL.L - TL.R) * (rr[1] - rr[0]));
      year = Math.max(rr[0], Math.min(rr[1], year));
      var score = Math.max(-5, Math.min(5, Math.round(5 - (sy - TL.T) / (TL.H - TL.T - TL.B) * 10)));
      tlOpen({ id: null, year: String(year), score: score, text: tlEdit && !tlEdit.id ? tlEdit.text : '', qualities: tlEdit && !tlEdit.id ? tlEdit.qualities : [] });
      return;
    }
    if (e.target.closest('[data-act="tl-new"]')) { tlOpen({ id: null, year: String(new Date().getFullYear()), score: 0, text: '', qualities: [] }); return; }
    if (e.target.closest('[data-act="tl-cancel"]')) { tlEdit = null; renderWidgets(); return; }
    var q = e.target.closest('[data-tlq]');
    if (q && tlEdit) { var n = q.getAttribute('data-tlq'), i = tlEdit.qualities.indexOf(n); if (i >= 0) tlEdit.qualities.splice(i, 1); else tlEdit.qualities.push(n); q.classList.toggle('on'); return; }
    if (e.target.closest('[data-act="tl-del"]') && tlEdit && tlEdit.id) {
      var snap = timelineItems.slice(), id = tlEdit.id;
      timelineItems = timelineItems.filter(function (i) { return i && i.id !== id; });
      tlEdit = null; tlSave(); renderWidgets(); updateProgress();
      if (window.kmaUndoToast) kmaUndoToast('Gebeurtenis verwijderd', function () { timelineItems = snap; tlSave(); renderWidgets(); updateProgress(); });
      return;
    }
    if (e.target.closest('[data-act="tl-save"]') && tlEdit) {
      var year2 = String(document.getElementById('tl-year').value || '').trim(), text = String(document.getElementById('tl-text').value || '').trim();
      if (!/^\d{4}$/.test(year2) || !text) { kmaToast('Vul een jaartal (4 cijfers) en een korte beschrijving in', 'error'); return; }
      var data = { year: year2, text: text, score: tlEdit.score, pos: tlEdit.score < 0 ? 'bottom' : 'top', qualities: tlEdit.qualities.slice() };
      if (tlEdit.id) { var it2 = timelineItems.find(function (i) { return i && i.id === tlEdit.id; }); if (it2) Object.assign(it2, data); }
      else timelineItems.push(Object.assign({ id: Date.now() }, data));
      tlEdit = null; tlSave(); renderWidgets(); updateProgress();
      kmaToast('Levenslijn bijgewerkt');
    }
  });

  /* ======================= 4. Gedragscode: tabs, lege scores, 2×2 ======================= */
  var gcTab = 'Algemeen';
  window.updateGedragscodeScore = function (v, val) {
    var s = answers['gedragscode-scores'] || {};
    s[v] = parseInt(val, 10);
    saveAnswer('gedragscode-scores', s);
    var l = document.getElementById('score-' + v);
    if (l) l.textContent = val + '/10';
  };
  /* What the 4 V's mean: the "ik"-sentences of the Gedragsregels Defensie (2019) and the
     behaviour (niveau 1) on the KMA cadet assessment form. */
  var V4DEF = {
    Verbondenheid: { ik: 'Ik werk samen, help anderen, sta open voor feedback en spreek aan.', uit: 'Kameraadschap is het uitgangspunt: je werkt samen, helpt elkaar en staat open voor kritiek op je eigen gedrag.',
      n1: ['Stelt zich open voor samenwerking en zet de eigen belangen zo nodig opzij.', 'Toont interesse in mensen.', 'Houdt rekening met de gevoelens van anderen en staat open voor een andere mening.', 'Bouwt voort op eigen sterke punten, werkt aan ontwikkelpunten en staat open voor reacties.', 'Leert van eigen en andermans ervaringen.'] },
    Veiligheid: { ik: 'Ik werk veilig. Onveilig of ongewenst gedrag maak ik bespreekbaar of meld ik.', uit: 'Iedereen draagt bij aan een veilige werkomgeving. Wie onveilig of ongewenst gedrag ziet, bespreekt het of meldt het.',
      n1: ['Controleert het eigen werk nauwgezet en laat het zo nodig door anderen controleren.', 'Kent de geldende procedures en past ze toe.', 'Gaat respectvol om met verschillende mensen, culturen en achtergronden.', 'Maakt twijfels en dilemma\'s bespreekbaar.'] },
    Vertrouwen: { ik: 'Ik zorg dat mijn collega\'s en de samenleving op mij kunnen vertrouwen.', uit: 'Defensie heeft verstrekkende bevoegdheden. Daarom moeten collega\'s en de samenleving op je kunnen rekenen.',
      n1: ['Geeft het goede voorbeeld: fatsoenlijk, respectvol, open, geeft fouten toe en spreekt anderen aan.', 'Kan nauwkeurig werken.', 'Werkt zorgvuldig met de beschikbare middelen.', 'Draagt ideeën en informatie begrijpelijk over.'] },
    Verantwoordelijkheid: { ik: 'Ik toon vakmanschap en neem verantwoordelijkheid in mijn werk.', uit: 'Je gaat zorgvuldig om met middelen en bevoegdheden en bent je bewust van je voorbeeldfunctie.',
      n1: ['Neemt verantwoordelijkheid voor afspraken en acties in het eigen werk.', 'Plant en regelt de eigen werkzaamheden.', 'Hakt knopen door.', 'Neemt zo nodig actie en wacht niet passief op instructies.', 'Past zich aan bij veranderende omstandigheden.'] }
  };
  function v4DefHtml() {
    return cardHtml('Wat zijn de 4 V\'s?', '<p class="muted">De vier kernwaarden, in de woorden van de Gedragsregels Defensie. Tik op <em>Waar let je teamleider op?</em> voor het gedrag dat op het beoordelingsformulier staat.</p><div class="kma-v4def">' +
      VS.map(function (v) {
        var d = V4DEF[v];
        return '<div class="kma-v4def-item"><div class="kma-v4def-head">' + (window.kmaVIcon ? kmaVIcon(v) : '') + '<strong>' + v + '</strong></div>' +
          '<p class="kma-v4def-ik">“' + esc(d.ik) + '”</p><p class="kma-v4def-uit">' + esc(d.uit) + '</p>' +
          '<details class="kma-v4def-more"><summary>Waar let je teamleider op? (niveau 1)</summary><ul>' + d.n1.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details></div>';
      }).join('') + '</div><p class="muted small">Bron: Gedragsregels Defensie en het KMA-beoordelingsformulier.</p>', 'shield');
  }
  R['gedragscode-form'] = function (c) { c.innerHTML = v4DefHtml(); };
  function v4OverviewHtml() {
    var sc = answers['gedragscode-scores'] || {}, ind = H && hexDone() ? H.vIndication(selfScores()) : null;
    var dtfCount = function (v) { return dtfItems.filter(function (d) { return (d.vValues || []).indexOf(v) >= 0; }).length; };
    var icons = { Verbondenheid: 'users', Veiligheid: 'shield', Vertrouwen: 'lock', Verantwoordelijkheid: 'scale' };
    return cardHtml('De 4 V\'s in één oogopslag', '<p class="muted">Geef jezelf per V een score (1-10), nu je de vragen hebt beantwoord. Ernaast zie je de indicatie uit je persoonlijkheidstest en hoeveel DTF-feiten je per V hebt.</p><div class="kma-v4">' +
      VS.map(function (v) {
        var key = v.toLowerCase(), val = sc[key];
        return '<div class="kma-v4-tile"><div class="kma-v4-head">' + ((window.kmaVIcon && kmaVIcon(v)) || icon(icons[v])) + '<strong>' + v + '</strong></div>' +
          '<div class="kma-v4-score"><span id="score-' + key + '">' + (val ? val + '/10' : 'Nog niet gescoord') + '</span></div>' +
          '<input type="range" min="1" max="10" value="' + (val || 5) + '" class="kma-range' + (val ? '' : ' unset') + '" oninput="this.classList.remove(\'unset\'); updateGedragscodeScore(\'' + key + '\', this.value)" aria-label="Score ' + v + '"/>' +
          '<div class="kma-v4-meta"><span>Persoonlijkheid: <strong>' + (ind ? H.vBand(ind[v]).label.toLowerCase() : '-') + '</strong></span><span>DTF-feiten: <strong>' + dtfCount(v) + '</strong></span></div></div>';
      }).join('') + '</div>' + (ind ? H.explainV(selfScores()) : '') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" onclick="openKMASelfFormModal()">' + icon('form') + 'Zelfbeoordelingsformulier</button>' +
      '<button type="button" class="kma-icon-btn" onclick="exportKMASelfFormDocument()">' + icon('download') + 'Exporteer (.txt)</button></div>', 'shield');
  }
  AFTERQ['gedragscode-form'] = function (step) {
    var qc = document.getElementById('questions-container');
    if (qc) {
      var after = document.getElementById('kma-v4-after');
      if (!after) { after = document.createElement('div'); after.id = 'kma-v4-after'; qc.parentElement.insertBefore(after, qc.nextSibling); }
      after.innerHTML = v4OverviewHtml();
    }
    var group = 'Algemeen', groups = {};
    (step.questions || []).forEach(function (q, i) {
      var m = /^(VERBONDENHEID|VEILIGHEID|VERTROUWEN|VERANTWOORDELIJKHEID):/.exec(q);
      if (m) group = m[1].charAt(0) + m[1].slice(1).toLowerCase();
      groups[i] = group;
    });
    var tabs = ['Algemeen'].concat(VS);
    var cont = document.getElementById('questions-container');
    if (!cont) return;
    var bar = document.createElement('div');
    bar.className = 'kma-tabs kma-q-tabs';
    var answeredIn = function (t) { var n = 0, tot = 0; Object.keys(groups).forEach(function (i) { if (groups[i] === t) { tot++; if (answers[step.questions[i]] && String(answers[step.questions[i]]).trim()) n++; } }); return n + '/' + tot; };
    var draw = function () {
      bar.innerHTML = tabs.map(function (t) { return '<button type="button" class="kma-tab' + (t === gcTab ? ' active' : '') + '" data-gctab="' + t + '">' + (t !== 'Algemeen' && window.kmaVIcon ? kmaVIcon(t) || '' : '') + t + ' <em>' + answeredIn(t) + '</em></button>'; }).join('');
      qCards().forEach(function (card, i) { card.style.display = groups[i] === gcTab ? '' : 'none'; });
    };
    cont.parentElement.insertBefore(bar, cont);
    bar.addEventListener('click', function (e) { var b = e.target.closest('[data-gctab]'); if (!b) return; gcTab = b.getAttribute('data-gctab'); draw(); });
    draw();
  };

  /* ======================= 5. Zelfbeoordeling: matrix, meter, DTF-bewijs ======================= */
  R['kma-self-form-widget'] = function (c) {
    var f = kmaOfficialSelfForm || {}, filled = f.totalScore != null;
    var rows = VS.map(function (v, i) { var n = i + 1; return { label: v, n1: filled ? f['v' + n + '_n1_score'] : null, n2: filled ? f['v' + n + '_n2_score'] : null }; });
    var ev = VS.map(function (v) { return dtfItems.filter(function (d) { return (d.vValues || []).indexOf(v) >= 0; }).length; });
    c.innerHTML = cardHtml('Jouw zelfbeoordeling', '<div class="kma-self-grid"><div>' + V.vMatrix(rows) +
      '<p class="muted small">0 = onvoldoende · 1 = voldoende (norm) · 2 = goed</p></div><div class="kma-self-gauge">' +
      V.gauge(filled ? f.totalScore : 0, 16, { caption: filled ? 'eigen inschatting: ' + (f.eindoordeel || '-') : 'nog niet ingevuld' }) + '</div></div>' +
      '<p class="muted">Bewijs uit je DTF-logboek: ' + VS.map(function (v, i) { return esc(v) + ' <strong>' + ev[i] + '</strong>'; }).join(' · ') + '</p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" onclick="openKMASelfFormModal()">' + icon('edit') + (filled ? 'Bewerken' : 'Invullen') + '</button>' +
      '<button type="button" class="kma-icon-btn" onclick="exportKMASelfFormDocument()">' + icon('download') + 'Exporteer (.txt)</button></div>', 'form');
  };
  function addEvidenceButtons() {
    VS.forEach(function (v, i) {
      var ta = document.getElementById('kma-self-v' + (i + 1) + '-text');
      if (!ta || ta.dataset.kmaEv) return;
      ta.dataset.kmaEv = '1';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'kma-chip-btn';
      b.innerHTML = icon('calendar') + 'DTF-feit invoegen';
      b.addEventListener('click', function () {
        var list = dtfItems.slice().sort(function (a, z) { return ((z.vValues || []).indexOf(v) >= 0) - ((a.vValues || []).indexOf(v) >= 0); });
        if (!list.length) { kmaToast('Je hebt nog geen DTF-feiten', 'error'); return; }
        kmaSheet({ title: 'Bewijs voor ' + v, items: list.slice(0, 30).map(function (d) {
          return { icon: (d.vValues || []).indexOf(v) >= 0 ? 'check' : 'calendar', label: (d.feit || '').slice(0, 70), hint: fmtDate(d.datum) + (d.tijd ? ' · ' + d.tijd : '') + ((d.vValues || []).length ? ' · ' + d.vValues.join(', ') : ''),
            onClick: function () { ta.value = (ta.value ? ta.value + '\n' : '') + '• ' + (d.datum ? fmtDate(d.datum) + (d.tijd ? ' ' + d.tijd : '') + ': ' : '') + d.feit; ta.dispatchEvent(new Event('input', { bubbles: true })); } };
        }) });
      });
      ta.insertAdjacentElement('afterend', b);
    });
  }
  var origOpenSelf = window.openKMASelfFormModal;
  window.openKMASelfFormModal = function () { var r = origOpenSelf.apply(this, arguments); addEvidenceButtons(); return r; };

  /* ======================= 6. Ik als officier: kwaliteiten, valkuil, kernkwadrant ======================= */
  var OFMAN = {
    'Doorzettingsvermogen': ['Koppigheid', 'Flexibiliteit', 'Wispelturigheid'], 'Zorgvuldigheid': ['Perfectionisme', 'Loslaten', 'Slordigheid'],
    'Daadkracht': ['Drammerigheid', 'Geduld', 'Passiviteit'], 'Flexibiliteit': ['Wispelturigheid', 'Vasthoudendheid', 'Starheid'],
    'Rust': ['Passiviteit', 'Daadkracht', 'Gejaagdheid'], 'Eerlijkheid': ['Botheid', 'Tact', 'Vaagheid'], 'Enthousiasme': ['Overdrijven', 'Rust', 'Lusteloosheid'],
    'Empathie': ['Overbetrokkenheid', 'Afstand nemen', 'Kilheid'], 'Leiderschap': ['Dominantie', 'Ruimte geven', 'Onderdanigheid'],
    'Discipline': ['Rigiditeit', 'Spontaniteit', 'Losbandigheid'], 'Teamspeler': ['Afhankelijkheid', 'Zelfstandigheid', 'Eigengereidheid'],
    'Moed': ['Roekeloosheid', 'Voorzichtigheid', 'Lafheid'], 'Behulpzaamheid': ['Bemoeizucht', 'Grenzen stellen', 'Egoïsme'],
    'Betrouwbaarheid': ['Starheid', 'Flexibiliteit', 'Onbetrouwbaarheid'], 'Zelfstandigheid': ['Eigengereidheid', 'Samenwerken', 'Afhankelijkheid'],
    'Creativiteit': ['Chaos', 'Structuur', 'Saaiheid'], 'Humor': ['Niet serieus nemen', 'Ernst', 'Zwaarmoedigheid'],
    'Nieuwsgierigheid': ['Afgeleid zijn', 'Focus', 'Bekrompenheid'], 'Verantwoordelijkheid': ['Alles zelf doen', 'Delegeren', 'Onverschilligheid']
  };
  QR['Ik als officier'] = {
    widget: function (c) {
      var kk = getX('kernkwadrant', [{}, {}]);
      c.innerHTML = cardHtml('Kernkwadranten', '<p class="muted">Per kwaliteit: wat gebeurt er bij te veel ervan (valkuil), wat is je uitdaging, en waar ben je allergisch voor? Kies eerst je kwaliteiten bij vraag 5.</p>' +
        kk.map(function (k, i) {
          var cell = function (field, label, cls) {
            return '<label class="kma-kk-cell ' + cls + '"><span>' + label + '</span><input type="text" data-kk="' + i + '" data-field="' + field + '" value="' + esc(k[field] || '') + '" placeholder="' + esc(OFMAN[k.kwaliteit] ? OFMAN[k.kwaliteit][['valkuil', 'uitdaging', 'allergie'].indexOf(field)] || '' : '') + '"/></label>';
          };
          return '<div class="kma-kk"><div class="kma-kk-grid">' + cell('kwaliteit', 'Kwaliteit', 'q') + cell('valkuil', 'Valkuil: te veel van het goede', 'v') +
            cell('allergie', 'Allergie: te veel van je uitdaging', 'a') + cell('uitdaging', 'Uitdaging: het positieve tegenovergestelde', 'u') +
            '<span class="kma-kk-arrow a1">→</span><span class="kma-kk-arrow a2">↓</span><span class="kma-kk-arrow a3">←</span><span class="kma-kk-arrow a4">↑</span></div>' +
            (k.kwaliteit && OFMAN[k.kwaliteit] && !k.valkuil ? '<button type="button" class="kma-chip-btn" data-kk-fill="' + i + '">' + icon('idea') + 'Vul voorbeeld in</button>' : '') + '</div>';
        }).join(''), 'target');
    },
    questions: function (step) {
      var qi = step.questions.findIndex(function (q) { return /2 belangrijkste kwaliteiten/.test(q); });
      var vi = step.questions.findIndex(function (q) { return /valkuil/i.test(q); });
      var card = cardFor(qi);
      if (card && !card.querySelector('.kma-chips')) {
        var t = document.getElementById('q-input-' + qi);
        var picked = QUALITIES.filter(function (q) { return (t.value || '').indexOf(q) >= 0; });
        var box = document.createElement('div');
        box.innerHTML = '<p class="muted small">Tik er twee aan om mee te beginnen:</p>' + chips(QUALITIES, picked, 'data-offq');
        card.querySelector('label').insertAdjacentElement('afterend', box);
      }
      var vcard = cardFor(vi);
      if (vcard && H && hexDone() && !vcard.querySelector('.kma-suggest')) {
        var an = H.analyse(selfScores(), null);
        if (an.quadrants.w.length) {
          var s = document.createElement('div');
          s.className = 'kma-suggest';
          s.innerHTML = '<p class="muted small">Suggesties uit je persoonlijkheidstest:</p><div class="kma-chips">' + an.quadrants.w.map(function (p) { return '<button type="button" class="kma-chip-btn" data-offv="' + esc(p.text) + '">' + esc(p.text) + '</button>'; }).join('') + '</div>';
          vcard.querySelector('label').insertAdjacentElement('afterend', s);
        }
      }
    }
  };
  document.addEventListener('click', function (e) {
    var q = e.target.closest('[data-offq]');
    if (q) {
      var step = steps[currentStepIndex], qi = step.questions.findIndex(function (x) { return /2 belangrijkste kwaliteiten/.test(x); });
      var t = document.getElementById('q-input-' + qi), name = q.getAttribute('data-offq');
      var parts = (t.value || '').split('\n').filter(function (l) { return l.trim(); });
      var has = parts.findIndex(function (l) { return l.indexOf(name) === 0; });
      if (has >= 0) parts.splice(has, 1); else parts.push(name + ': ');
      setAnswer(qi, parts.join('\n'));
      q.classList.toggle('on');
      var chosen = QUALITIES.filter(function (x) { return parts.some(function (l) { return l.indexOf(x) === 0; }); }).slice(0, 2);
      var kk = getX('kernkwadrant', [{}, {}]);
      chosen.forEach(function (c, i) { if (!kk[i].kwaliteit || QUALITIES.indexOf(kk[i].kwaliteit) >= 0) kk[i].kwaliteit = c; });
      setX('kernkwadrant', kk);
      renderWidgets();
      return;
    }
    var v = e.target.closest('[data-offv]');
    if (v) {
      var st = steps[currentStepIndex], vi = st.questions.findIndex(function (x) { return /valkuil/i.test(x); });
      var tv = document.getElementById('q-input-' + vi);
      setAnswer(vi, tv.value ? tv.value + '\n' + v.getAttribute('data-offv') : v.getAttribute('data-offv'));
      return;
    }
    var f = e.target.closest('[data-kk-fill]');
    if (f) {
      var kk2 = getX('kernkwadrant', [{}, {}]), k = kk2[Number(f.getAttribute('data-kk-fill'))], o = OFMAN[k.kwaliteit];
      if (o) { k.valkuil = o[0]; k.uitdaging = o[1]; k.allergie = o[2]; setX('kernkwadrant', kk2); renderWidgets(); }
    }
  });
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el.dataset || el.dataset.kk == null) return;
    var kk = getX('kernkwadrant', [{}, {}]);
    kk[Number(el.dataset.kk)][el.dataset.field] = el.value;
    setX('kernkwadrant', kk);
  });

  /* ======================= 7. SMART: zin, checklist, datum ======================= */
  function smartParts(step) { return step.questions.map(function (q) { return (answers[q] || '').trim(); }); }
  function smartSentence(step) {
    var p = smartParts(step), date = getX('smart-date', '');
    // 4.5.2: een antwoord als hele zin ("Ik wil ... .") past ook in de zin: geen "Ik wil Ik wil" en geen dubbele punten.
    var lead = [/^ik wil\s+/i, /^(dat )?merk je (dat )?aan\s+/i, /^(dit is belangrijk )?omdat\s+/i, /^deze week\s+/i, /^ik evalueer\s+/i];
    p = p.map(function (v, i) {
      v = String(v || '').replace(/\s+/g, ' ').trim().replace(lead[i], '').replace(/[.!\s]+$/, '');
      return v.replace(/^(Ik|Mijn|Elke|Iedere|Bij|Een|De|Het|Als|Op|In|Met|Dat|Door|Dan|Wanneer|Deze|Na|Voor|Tijdens|Om|Zo|Niet|Meer|Minder|Samen|Eerst)\b/, function (w) { return w.toLowerCase(); });
    });
    var f = function (v, ph) { return v ? '<mark>' + esc(v) + '</mark>' : '<span class="ph">' + ph + '</span>'; };
    return 'Ik wil ' + f(p[0], '[wat precies]') + '. Dat merk je aan ' + f(p[1], '[welk gedrag]') + '. Dit is belangrijk omdat ' + f(p[2], '[waarom]') +
      '. Deze week ' + f(p[3], '[eerste stap]') + '. Ik evalueer ' + f(p[4], '[met wie]') + (date ? ' op <mark>' + fmtDate(date) + '</mark>' : '') + '.';
  }
  /** 4.24.0 (R3): dezelfde leervraag als HKI-vraag ("Hoe kan ik ...?"), zoals in de leerlijn IIV van de KMA. */
  function hkiVraag(step) {
    var v = String(smartParts(step)[0] || '').replace(/\s+/g, ' ').trim().replace(/^ik (wil|ga|zou)\s+/i, '').replace(/^hoe kan ik\s+/i, '').replace(/[.?!\s]+$/, '');
    if (!v) return '<span class="ph">Hoe kan ik [wat precies]?</span>';
    v = v.replace(/^(Leren|Beter|Meer|Minder|Mijn|Een|De|Het)\b/, function (w) { return w.toLowerCase(); });
    return 'Hoe kan ik <mark>' + esc(v) + '</mark>?';
  }
  QR['SMART Leervraag'] = {
    widget: function (c, step) {
      var p = smartParts(step), letters = ['S', 'M', 'A', 'R', 'T'], names = ['Specifiek', 'Meetbaar', 'Acceptabel', 'Realistisch', 'Tijdgebonden'];
      var starters = H && hexDone() ? H.analyse(selfScores(), null).quadrants.w : [];
      c.innerHTML = cardHtml('Jouw leervraag in één zin', '<div class="kma-smart-letters">' + letters.map(function (l, i) {
        return '<div class="kma-smart-l' + (p[i] ? ' ok' : '') + '" title="' + names[i] + '"><b>' + l + '</b><small>' + names[i] + '</small></div>';
      }).join('') + '</div><p class="kma-smart-sentence" id="kma-smart-sentence">' + smartSentence(step) + '</p>' +
        '<p class="kma-smart-hki"><span class="kma-ofga" title="HKI-vraag">HKI</span><span id="kma-smart-hki">' + hkiVraag(step) + '</span></p>' +
        '<p class="muted small">Als HKI-vraag ("Hoe kan ik ...?"), zoals bij de KMA in de lessen persoonlijke leiderschapsontwikkeling: een vraag die je zelf onderzoekt en waar je in de praktijk mee experimenteert.</p>' +
        '<div class="kma-inline-form"><label class="muted small" for="kma-smart-date">Evaluatiedatum</label><input type="date" id="kma-smart-date" value="' + esc(getX('smart-date', '')) + '"/>' +
        '<button type="button" class="kma-icon-btn" data-act="smart-ics">' + icon('calendar') + 'Zet in agenda</button></div>' +
        (starters.length ? '<p class="muted small">Startpunten uit je persoonlijkheidstest:</p><div class="kma-chips">' + starters.map(function (s) { return '<button type="button" class="kma-chip-btn" data-smart-start="' + esc(s.text) + '">' + esc(s.text) + '</button>'; }).join('') + '</div>' : ''), 'target') +
        checkinCard();
    }
  };
  document.addEventListener('input', function (e) {
    var step = steps[currentStepIndex];
    if (!step || !/SMART/.test(step.title)) return;
    if (e.target.id === 'kma-smart-date') setX('smart-date', e.target.value);
    var s = document.getElementById('kma-smart-sentence');
    if (s) setTimeout(function () {
      s.innerHTML = smartSentence(step);
      var hk = document.getElementById('kma-smart-hki'); if (hk) hk.innerHTML = hkiVraag(step);
      var p = smartParts(step);
      document.querySelectorAll('.kma-smart-l').forEach(function (el, i) { el.classList.toggle('ok', !!p[i]); });
    }, 0);
  });
  document.addEventListener('change', function (e) { if (e.target.id === 'kma-smart-date') { setX('smart-date', e.target.value); renderWidgets(); } });
  /* Weekly check-in on the leervraag */
  function checkinCard() {
    var P = window.KMAPatterns; if (!P) return '';
    var list = getX('smart-checkins', []), wk = P.thisWeekKey(), cur = list.find(function (x) { return x.week === wk; });
    return cardHtml('Wekelijkse check-in', '<p class="muted">Is het je deze week gelukt om je leervraag in de praktijk te brengen?</p>' +
      '<div class="kma-seg kma-ci-pick">' + [2, 1, 0].map(function (r) { return '<button type="button" class="' + (cur && cur.r === r ? 'on' : '') + '" data-ci="' + r + '">' + P.CHECK[r].l + '</button>'; }).join('') + '</div>' +
      '<input type="text" id="kma-ci-note" placeholder="Korte notitie (optioneel): wat hielp of wat hield je tegen?" value="' + esc(cur && cur.note || '') + '"/>' +
      P.checkinStrip(list, 12), 'calendar');
  }
  function saveCheckin(r, note) {
    var P = window.KMAPatterns, wk = P.thisWeekKey(), list = getX('smart-checkins', []).filter(function (x) { return x.week !== wk; });
    var old = getX('smart-checkins', []).find(function (x) { return x.week === wk; });
    list.push({ week: wk, date: today(), r: r == null ? (old ? old.r : 1) : r, note: note != null ? note : (old && old.note) || '' });
    list.sort(function (a, b) { return a.week < b.week ? -1 : 1; });
    setX('smart-checkins', list);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ci]'); if (!b) return;
    var n = document.getElementById('kma-ci-note');
    saveCheckin(Number(b.getAttribute('data-ci')), n ? n.value.trim() : '');
    kmaToast('Check-in van deze week opgeslagen'); renderWidgets();
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'kma-ci-note') return;
    var P = window.KMAPatterns, cur = getX('smart-checkins', []).find(function (x) { return x.week === P.thisWeekKey(); });
    if (cur) saveCheckin(null, e.target.value.trim());
  });
  document.addEventListener('click', function (e) {
    var st = e.target.closest('[data-smart-start]');
    if (st) { var step = steps[currentStepIndex]; setAnswer(0, (answers[step.questions[0]] ? answers[step.questions[0]] + '\n' : '') + st.getAttribute('data-smart-start')); renderWidgets(); return; }
    if (!e.target.closest('[data-act="smart-ics"]')) return;
    var date = getX('smart-date', '');
    if (!date) { kmaToast('Kies eerst een evaluatiedatum', 'error'); return; }
    var stp = steps[byTitle(/SMART/)], txt = smartParts(stp)[0] || 'SMART-leervraag';
    var d = date.replace(/-/g, '');
    var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//KMA//Reflectieboekje//NL', 'BEGIN:VEVENT', 'UID:kma-smart-' + Date.now() + '@kma', 'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;VALUE=DATE:' + d, 'SUMMARY:Evaluatie SMART-leervraag', 'DESCRIPTION:' + txt.replace(/[\r\n]+/g, ' ').replace(/[,;]/g, ' '),
      'BEGIN:VALARM', 'TRIGGER:-PT12H', 'ACTION:DISPLAY', 'DESCRIPTION:Evaluatie SMART-leervraag', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    var a = document.createElement('a');
    a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
    a.download = 'KMA_SMART_evaluatie.ics';
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ======================= 8. 5G-T: stap voor stap (4 stappen, zoals het KMA-boekje) ======================= */
  var G = window.KMA5GT, NODES = G.NODES;
  var g5Step = 0, g5Wiel = { k: null, s: null, w: null }, g5Moment = 'Tijdens', g5Int = 6;
  (function () { var r = getX('resume', {}); if (typeof r.g5 === 'number' && r.g5 >= 0) g5Step = r.g5; })();
  function saveResume(k, v) { var r = getX('resume', {}); r[k] = v; setX('resume', r); }
  function caseTabs(list, active, selectFn, addFn, delFn, exportFn, extraBtn) {
    return '<div class="kma-case-head"><div class="cases-tabs">' + list.map(function (c, i) {
      return '<button type="button" class="case-tab' + (i === active ? ' active' : '') + '" onclick="' + selectFn + '(' + i + ')">' + esc(c.title) + '</button>';
    }).join('') + '</div><div class="kma-row-btns"><button type="button" class="kma-icon-btn sm" onclick="' + addFn + '()">' + icon('plus') + 'Nieuw</button>' + (extraBtn || '') +
      '<button type="button" class="kma-icon-btn sm" onclick="' + exportFn + '()">' + icon('download') + 'Exporteer</button>' +
      '<button type="button" class="kma-icon-btn is-round sm" onclick="' + delFn + '()" aria-label="Verwijderen">' + icon('trash') + '</button></div></div>';
  }
  function migrateAll5GT() {
    var ch = false;
    (cases5GT || []).forEach(function (c) { if (G.migrate(c)) ch = true; });
    if (ch) { try { kmaStore.setItem(CASES_5GT_KEY, JSON.stringify(cases5GT)); } catch (e) {} }
  }
  migrateAll5GT();
  function cur5() {
    if (!Array.isArray(cases5GT) || !cases5GT.length) { cases5GT = [G.blank(Date.now(), '5G-T Reflectie 1')]; active5GTIndex = 0; save5(); }
    return cases5GT[active5GTIndex] || cases5GT[0];
  }
  function save5() { if (typeof save5GTCases === 'function') save5GTCases(); }
  function textArea(f, val, rows) {
    return '<div class="textarea-wrapper"><textarea id="case-' + f + '" rows="' + (rows || 3) + '" placeholder="Typ hier…" oninput="update5GTField(\'' + f + '\', this.value)" onchange="kma5gtChanged(\'' + f + '\')">' + esc(val || '') + '</textarea>' +
      '<button type="button" class="btn-mic" id="mic-btn-case-' + f + '" onclick="startDictation(\'case-' + f + '\')" title="Spreek in">🎙️</button></div>';
  }
  function momentChips(f) {
    return '<div class="kma-chips kma-5gt-mom">' + G.MOMENTS.map(function (m) { return '<button type="button" class="kma-chip-btn" data-g5ins="' + f + '" data-m="' + m + '">' + icon('plus') + m + '</button>'; }).join('') + '</div>';
  }
  function gevoelBox(cs) {
    var k = g5Wiel.k, s = g5Wiel.s, sub = k != null && s != null ? G.WIEL[k].sub[s] : null;
    var words = sub ? [sub[0]].concat(sub[1]) : [];
    return '<div class="kma-emo kma-5gt-wiel"><p class="muted small">Wanneer voelde je dit?</p><div class="kma-chips">' + G.MOMENTS.map(function (m) {
      return '<button type="button" class="kma-chip-btn' + (m === g5Moment ? ' on' : '') + '" data-g5mom="' + m + '">' + m + '</button>'; }).join('') + '</div>' +
      '<p class="muted small">Tik in het emotiewiel de emotie aan die het beste past.</p>' + G.wheelSvg(k, s) +
      (sub ? '<p class="muted small">Precies: <strong>' + esc(G.WIEL[k].kern) + '</strong> › kies het woord</p><div class="kma-chips">' + words.map(function (w) {
        return '<button type="button" class="kma-chip-btn' + (w === g5Wiel.w ? ' on' : '') + '" data-g5word="' + esc(w) + '">' + esc(w) + '</button>'; }).join('') + '</div>' : '') +
      '<label class="kma-range-label">Intensiteit <span><strong id="kma-emo-val">' + g5Int + '</strong>/10</span></label><input type="range" id="kma-emo-int" class="kma-range" min="1" max="10" value="' + g5Int + '"/>' +
      '<button type="button" class="kma-chip-btn" data-act="emo-add">' + icon('plus') + 'Voeg emotie toe</button>' +
      ((cs.emoties || []).length ? '<div class="kma-chips kma-5gt-emolist">' + cs.emoties.map(function (e, i) {
        return '<span class="kma-chip-btn on">' + esc((e.moment ? e.moment + ': ' : '') + e.naam + ' ' + e.intensiteit + '/10') + ' <button type="button" class="kma-x" data-g5emodel="' + i + '" aria-label="Verwijder">×</button></span>'; }).join('') + '</div>' : '') + '</div>';
  }
  function gevolgBox(cs) {
    var gv = cs.gevolgenV || {};
    return '<p class="muted small">Indien van toepassing: hoe had jouw gedrag invloed op de 4 V\'s?</p><div class="kma-chips">' + VS.map(function (v) {
      return '<button type="button" class="kma-chip-btn kma-v-chip' + (v in gv ? ' on' : '') + '" data-g5v="' + v + '">' + (window.kmaVIcon ? kmaVIcon(v) : '') + v + '</button>'; }).join('') + '</div>' +
      VS.filter(function (v) { return v in gv; }).map(function (v) {
        return '<label class="kma-5gt-vrow">' + (window.kmaVIcon ? kmaVIcon(v) : '') + '<span>' + v + '</span><input type="text" data-g5vt="' + v + '" value="' + esc(gv[v] || '') + '" placeholder="Invloed op ' + v.toLowerCase() + '…"/></label>';
      }).join('');
  }
  function zorgenBox(cs) {
    var pl = G.plaatsList(cs);
    if (!pl.length) return '<div class="kma-5gt-plaats"></div>';
    return '<div class="kma-5gt-plaats"><p class="muted small">Plaats elke zorg in de cirkel:</p>' + pl.map(function (x, i) {
      return '<div class="kma-5gt-prow"><span><b class="kma-5gt-num">' + (i + 1) + '</b>' + esc(x.zorg) + '</span><div class="kma-seg">' + ['C', 'I', 'N'].map(function (p) {
        return '<button type="button" class="' + (x.plek === p ? 'on' : '') + '" data-g5pl="' + i + '" data-p="' + p + '">' + G.CIRKEL[p] + '</button>'; }).join('') + '</div></div>';
    }).join('') + '</div>';
  }
  function questionHtml(cs, q, multi) {
    var body = '';
    if (q.kind === 'percent') {
      var val = cs[q.f] === '' || cs[q.f] == null ? 50 : Number(cs[q.f]);
      body = '<label class="kma-range-label">Geloofwaardigheid <span><strong id="kma-g5-pct-' + q.f + '">' + (cs[q.f] === '' || cs[q.f] == null ? '-' : val) + '</strong>%</span></label>' +
        '<input type="range" class="kma-range' + (cs[q.f] === '' || cs[q.f] == null ? ' unset' : '') + '" min="0" max="100" step="5" value="' + val + '" data-g5pct="' + q.f + '"/>';
      if (q.f === 'd_geloofNa') body += '<div id="kma-belief-box">' + G.beliefBars(cs) + '</div>';
    } else {
      if (q.kind === 'gevoel') body += gevoelBox(cs) + momentChips(q.f);
      if (q.kind === 'moment') body += momentChips(q.f);
      if (q.kind === 'gedachte') {
        var lines = String(cs.gedachten || '').split('\n').map(function (l) { return l.replace(/^(Vooraf|Tijdens|Achteraf):\s*/, '').trim(); }).filter(Boolean).slice(0, 8);
        if (lines.length) body += '<p class="muted small">Uit je gedachtes:</p><div class="kma-chips">' + lines.map(function (l) { return '<button type="button" class="kma-chip-btn" data-g5pick="' + esc(l) + '">' + esc(l.length > 60 ? l.slice(0, 58) + '…' : l) + '</button>'; }).join('') + '</div>';
      }
      body += textArea(q.f, cs[q.f], multi ? 2 : 4);
      if (q.kind === 'gevolg') body += gevolgBox(cs);
      if (q.kind === 'zorgen') body += zorgenBox(cs);
      if (q.kind === 'cirkel') { var pl = G.plaatsList(cs); body = (pl.some(function (x) { return x.plek; }) ? '' : '') + body; }
      if (q.kind === 'smart') body += '<button type="button" class="kma-chip-btn" data-act="g5-to-smart">' + icon('target') + 'Gebruik als SMART-leervraag</button>';
    }
    return (multi ? '<div class="kma-5gt-q"><label>' + esc(q.l) + '</label>' : '') + (q.d && multi ? '<p class="muted small">' + esc(q.d) + '</p>' : '') + body + (multi ? '</div>' : '');
  }
  R['5gt-multi'] = function (c) {
    var cs = cur5();
    G.migrate(cs);
    if (g5Step >= NODES.length) g5Step = 0;
    var n = NODES[g5Step], pr = G.progress(cs);
    window.kma5gtNode = n.id; if (getX('resume', {}).g5 !== g5Step) saveResume('g5', g5Step);
    var head = '<div class="question-label"><span>' + esc(G.STAP_TITLES[n.stap]) + (n.stap === 1 ? ' · ' + esc(n.label) : '') + '</span><span class="muted small">' + (g5Step + 1) + ' / ' + NODES.length + '</span></div>';
    var inner;
    if (n.q.length === 1) {
      var q = n.q[0];
      inner = '<label>' + esc(q.l) + '</label><p class="muted small">' + esc(q.d || '') + '</p>' + questionHtml(cs, q, false);
    } else {
      inner = '<label>' + esc(n.label) + '</label>' + (n.intro ? '<p class="muted small">' + esc(n.intro) + '</p>' : '') +
        (n.id === 'i' ? '<div class="kma-5gt-circlewrap">' + G.circleSvg(G.plaatsList(cs)) + '</div>' : '') +
        n.q.map(function (q) { return questionHtml(cs, q, true); }).join('');
    }
    if (window.kmaStepFeedbackFor) inner += kmaStepFeedbackFor('5gt', cs, 's' + n.stap);
    c.innerHTML = '<div class="widget-box kma-flow">' +
      caseTabs(cases5GT, active5GTIndex, 'select5GTCase', 'add5GTCase', 'deleteCurrent5GTCase', 'exportSingle5GTCase', '<button type="button" class="kma-icon-btn sm" data-act="g5-from-dtf">' + icon('calendar') + 'Vanuit DTF-feit</button>') +
      '<input type="text" class="kma-case-title" value="' + esc(cs.title) + '" onchange="update5GTTitle(this.value)" aria-label="Titel"/>' +
      (window.kmaFeedbackFor ? kmaFeedbackFor('5gt', cs) : '') +
      V.chain(NODES.map(function (x) { return { short: x.short, label: x.label }; }), g5Step, pr.nodes) +
      '<div class="question-card kma-flow-card">' + head + inner + '</div>' +
      '<div class="kma-flow-nav"><button type="button" class="kma-icon-btn" data-g5="-1"' + (g5Step === 0 ? ' disabled' : '') + '>' + icon('left') + 'Vorige stap</button>' +
      (g5Step < NODES.length - 1 ? '<button type="button" class="kma-icon-btn is-primary" data-g5="1">Volgende stap' + icon('right') + '</button>' : '<span class="muted small">' + pr.done + ' van ' + pr.total + ' stappen ingevuld</span>') + '</div></div>' +
      (window.KMAPatterns ? KMAPatterns.details('boek-emo', icon('chart') + 'Emoties over al je reflecties', G.emotionOverview(cases5GT), false) : '');
  };
  // Typing worries updates the placement list and the circle without re-rendering the text box.
  var plaatsTimer = null;
  function refreshPlaats() {
    var flow = document.querySelector('.kma-flow'); if (!flow) return;
    var cs = cur5(), box = flow.querySelector('.kma-5gt-plaats'), wrap = flow.querySelector('.kma-5gt-circlewrap');
    if (box) box.outerHTML = zorgenBox(cs);
    if (wrap) wrap.innerHTML = G.circleSvg(G.plaatsList(cs));
  }
  window.kma5gtChanged = function () {};
  var origSel5 = window.select5GTCase;
  window.select5GTCase = function (i) { g5Step = 0; return origSel5(i); };
  var origAdd5 = window.add5GTCase;
  window.add5GTCase = function () { g5Step = 0; return origAdd5(); };
  function keepScroll(fn) { var y = window.scrollY; fn(); window.scrollTo(0, y); }
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-g5]');
    if (g) { g5Step = Math.max(0, Math.min(NODES.length - 1, g5Step + Number(g.getAttribute('data-g5')))); renderWidgets(); return; }
    var ch = e.target.closest('.kv-chain-step');
    if (ch && ch.closest('.kma-flow') && steps[currentStepIndex].widget === '5gt-multi') { g5Step = Number(ch.getAttribute('data-step')); renderWidgets(); return; }
    if (!e.target.closest('.kma-flow')) return;
    var cs = cur5();
    var mo = e.target.closest('[data-g5mom]');
    if (mo) { g5Moment = mo.getAttribute('data-g5mom'); keepScroll(renderWidgets); return; }
    var wp = e.target.closest('.kma-wiel-sub, .kma-wiel-kern');
    if (wp) {
      var k = Number(wp.getAttribute('data-wk')), s = wp.hasAttribute('data-ws') ? Number(wp.getAttribute('data-ws')) : 0;
      g5Wiel = { k: k, s: s, w: G.WIEL[k].sub[s][0] }; keepScroll(renderWidgets); return;
    }
    var wd = e.target.closest('[data-g5word]');
    if (wd) { g5Wiel.w = wd.getAttribute('data-g5word'); keepScroll(renderWidgets); return; }
    if (e.target.closest('[data-act="emo-add"]')) {
      if (g5Wiel.k == null || !g5Wiel.w) { kmaToast('Kies eerst een emotie in het wiel', 'error'); return; }
      var inten = Number((document.getElementById('kma-emo-int') || {}).value || g5Int);
      cs.emoties = (cs.emoties || []).concat([{ naam: g5Wiel.w, kern: G.WIEL[g5Wiel.k].kern, intensiteit: inten, moment: g5Moment }]);
      var line = g5Moment + ': ' + g5Wiel.w + ' (' + inten + '/10)';
      update5GTField('gevoelens', cs.gevoelens ? cs.gevoelens + '\n' + line : line);
      g5Wiel = { k: null, s: null, w: null }; keepScroll(renderWidgets); return;
    }
    var ed = e.target.closest('[data-g5emodel]');
    if (ed) { cs.emoties.splice(Number(ed.getAttribute('data-g5emodel')), 1); save5(); keepScroll(renderWidgets); return; }
    var ins = e.target.closest('[data-g5ins]');
    if (ins) {
      var f = ins.getAttribute('data-g5ins'), ta = document.getElementById('case-' + f), pre = ins.getAttribute('data-m') + ': ';
      if (!ta) return;
      ta.value = (ta.value && !/\n$/.test(ta.value) ? ta.value + '\n' : ta.value) + pre;
      update5GTField(f, ta.value); ta.focus(); try { ta.setSelectionRange(ta.value.length, ta.value.length); } catch (er) {}
      return;
    }
    var vb = e.target.closest('[data-g5v]');
    if (vb) {
      var v = vb.getAttribute('data-g5v'); cs.gevolgenV = cs.gevolgenV || {};
      if (v in cs.gevolgenV) delete cs.gevolgenV[v]; else cs.gevolgenV[v] = '';
      save5(); keepScroll(renderWidgets); return;
    }
    var pk = e.target.closest('[data-g5pick]');
    if (pk) { update5GTField('d_gedachte', pk.getAttribute('data-g5pick')); keepScroll(renderWidgets); return; }
    var pb = e.target.closest('[data-g5pl]');
    if (pb) {
      var item = G.plaatsList(cs)[Number(pb.getAttribute('data-g5pl'))]; if (!item) return;
      cs.i_plaats = cs.i_plaats || {};
      var p = pb.getAttribute('data-p');
      if (cs.i_plaats[item.zorg] === p) delete cs.i_plaats[item.zorg]; else cs.i_plaats[item.zorg] = p;
      save5(); keepScroll(renderWidgets); return;
    }
    if (e.target.closest('[data-act="g5-to-smart"]')) {
      var c5 = cur5();
      if (!c5.t_gedrag) { kmaToast('Vul eerst in welk gedrag je gaat toepassen', 'error'); return; }
      var si = byTitle(/SMART/), kk = steps[si].questions[0];
      saveAnswer(kk, answers[kk] ? answers[kk] + '\n' + c5.t_gedrag : c5.t_gedrag);
      kmaToast('Toegevoegd aan je SMART-leervraag');
      return;
    }
    if (e.target.closest('[data-act="g5-from-dtf"]')) pickDtfFor5GT();
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'case-i_zorgen') { clearTimeout(plaatsTimer); plaatsTimer = setTimeout(refreshPlaats, 350); }
    if (e.target.id === 'kma-emo-int') { g5Int = Number(e.target.value); var l = document.getElementById('kma-emo-val'); if (l) l.textContent = e.target.value; }
    if (e.target.hasAttribute && e.target.hasAttribute('data-g5pct')) {
      var f = e.target.getAttribute('data-g5pct'); update5GTField(f, String(e.target.value));
      var o = document.getElementById('kma-g5-pct-' + f); if (o) o.textContent = e.target.value;
      e.target.classList.remove('unset');
      var bb = document.getElementById('kma-belief-box'); if (bb) bb.innerHTML = G.beliefBars(cur5());
    }
    if (e.target.hasAttribute && e.target.hasAttribute('data-g5vt')) {
      var cs = cur5(); cs.gevolgenV = cs.gevolgenV || {}; cs.gevolgenV[e.target.getAttribute('data-g5vt')] = e.target.value; save5();
    }
  });
  function pickDtfFor5GT() {
    if (!dtfItems.length) { kmaToast('Je hebt nog geen DTF-feiten', 'error'); return; }
    kmaSheet({ title: 'Start een 5G-T vanuit een feit', items: dtfItems.slice(0, 30).map(function (d) {
      return { icon: 'calendar', label: (d.feit || '').slice(0, 70), hint: fmtDate(d.datum) + (d.tijd ? ' · ' + d.tijd : ''), onClick: function () { startFromDtf(d); } };
    }) });
  }
  function startFromDtf(d) {
    origAdd5();
    var cs = cases5GT[active5GTIndex];
    cs.title = (d.feit || 'Reflectie').split(/\s+/).slice(0, 5).join(' ');
    cs.gebeurtenis = (d.datum ? fmtDate(d.datum) + (d.tijd ? ' ' + d.tijd : '') + ': ' : '') + d.feit;
    cs.dtfId = d.id;
    save5GTCases();
    g5Step = 1;
    var gi = byWidget('5gt-multi');
    if (currentStepIndex !== gi) goToStep(gi); else renderWidgets();
    kmaToast('Nieuwe 5G-T gestart met dit feit als gebeurtenis');
  }
  window.kmaStart5GTFromDtf = function (id) { var d = dtfItems.find(function (x) { return x.id === id; }); if (d) startFromDtf(d); };

  /* ======================= 9. Korthagen: ALACT-cirkel en 8 vragen ======================= */
  var KF = [
    { f: 'actie', l: 'Actie', d: 'Wat wilde je bereiken? Wat probeerde je? Wat gebeurde er feitelijk?' },
    { f: 'terugblik', l: 'Terugblik', d: 'Kijk terug: wat speelde er bij jou en bij de ander? Beantwoord de acht vragen.' },
    { f: 'bewustwording', l: 'Bewustwording', d: 'Wat is de kern? Welke factoren spelen een rol? Wat betekent dit voor jou?' },
    { f: 'alternatieven', l: 'Alternatieven', d: 'Welke andere keuzes had je? Wat zijn de voor- en nadelen?' },
    { f: 'uitproberen', l: 'Uitproberen', d: 'Wat ga je de volgende keer concreet anders doen? Dit wordt je nieuwe actie.' }
  ];
  var EIGHT = [['willen', 'Wat wilde'], ['denken', 'Wat dacht'], ['voelen', 'Wat voelde'], ['doen', 'Wat deed']];
  var kStep = 0;
  (function () { var r = getX('resume', {}); if (typeof r.k === 'number' && r.k >= 0 && r.k < 5) kStep = r.k; })();
  R['korthagen-multi'] = function (c) {
    if (!Array.isArray(casesKorthagen) || !casesKorthagen.length) {
      casesKorthagen = [{ id: Date.now(), title: 'Korthagen Reflectie 1', actie: '', terugblik: '', bewustwording: '', alternatieven: '', uitproberen: '' }];
      activeKorthagenIndex = 0; try { kmaStore.setItem(CASES_KORTHAGEN_KEY, JSON.stringify(casesKorthagen)); } catch (e) {}
    }
    var cs = casesKorthagen[activeKorthagenIndex] || casesKorthagen[0];
    var done = KF.map(function (k) { return !!(cs[k.f] && String(cs[k.f]).trim()); });
    var st = KF[kStep], body;
    window.kmaKStep = st.f; if (getX('resume', {}).k !== kStep) saveResume('k', kStep);
    if (st.f === 'terugblik') {
      var e8 = cs.vragen8 || {};
      body = '<div class="kma-eight"><div></div><div class="kma-eight-h">Ik</div><div class="kma-eight-h">De ander</div>' + EIGHT.map(function (r) {
        return '<div class="kma-eight-r">' + r[1] + '…</div>' + ['ik', 'ander'].map(function (who) {
          var k = who + '_' + r[0];
          return '<textarea data-k8="' + k + '" placeholder="' + r[1] + (who === 'ik' ? ' ik?' : ' de ander?') + '">' + esc(e8[k] || '') + '</textarea>';
        }).join('');
      }).join('') + '</div>';
    } else {
      body = '<div class="textarea-wrapper"><textarea id="korthagen-' + st.f + '" aria-label="' + st.l + ': ' + st.d + '" placeholder="Typ hier…" oninput="updateKorthagenField(\'' + st.f + '\', this.value)">' + esc(cs[st.f] || '') + '</textarea>' +
        '<button type="button" class="btn-mic" id="mic-btn-korthagen-' + st.f + '" onclick="startDictation(\'korthagen-' + st.f + '\')" title="Spreek in">🎙️</button></div>';
    }
    if (window.kmaStepFeedbackFor) body += kmaStepFeedbackFor('kort', cs, st.f);
    c.innerHTML = '<div class="widget-box kma-flow">' +
      caseTabs(casesKorthagen, activeKorthagenIndex, 'selectKorthagenCase', 'addKorthagenCase', 'deleteCurrentKorthagenCase', 'exportSingleKorthagenCase') +
      '<input type="text" class="kma-case-title" value="' + esc(cs.title) + '" onchange="updateKorthagenTitle(this.value)" aria-label="Titel"/>' +
      (window.kmaFeedbackFor ? kmaFeedbackFor('kort', cs) : '') +
      '<div class="kma-alact">' + V.cycle(KF.map(function (k) { return { label: k.l }; }), kStep, done, { center: 'ALACT', label: 'ALACT-cyclus' }) + '</div>' +
      '<div class="question-card kma-flow-card"><div class="question-label"><span>Fase ' + (kStep + 1) + ' van 5</span></div><label>' + st.l + '</label><p class="muted small">' + st.d + '</p>' + body + '</div>' +
      '<div class="kma-flow-nav"><button type="button" class="kma-icon-btn" data-ks="-1"' + (kStep === 0 ? ' disabled' : '') + '>' + icon('left') + 'Vorige fase</button>' +
      (kStep < 4 ? '<button type="button" class="kma-icon-btn is-primary" data-ks="1">Volgende fase' + icon('right') + '</button>' :
        '<button type="button" class="kma-icon-btn is-primary" data-act="k-new">' + icon('refresh') + 'Nieuwe ronde starten</button>') + '</div></div>';
  };
  var origSelK = window.selectKorthagenCase;
  window.selectKorthagenCase = function (i) { kStep = 0; return origSelK(i); };
  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-ks]');
    if (s) { kStep = Math.max(0, Math.min(4, kStep + Number(s.getAttribute('data-ks')))); renderWidgets(); return; }
    var n = e.target.closest('.kma-alact .kv-node');
    if (n) { kStep = Number(n.getAttribute('data-step')); renderWidgets(); return; }
    if (e.target.closest('[data-act="k-new"]')) {
      var prev = casesKorthagen[activeKorthagenIndex];
      addKorthagenCase();
      var cs = casesKorthagen[activeKorthagenIndex];
      cs.actie = prev && prev.uitproberen ? 'Vorige ronde besloot ik: ' + prev.uitproberen : '';
      saveKorthagenCases(); kStep = 0; renderWidgets();
      kmaToast('Nieuwe ronde gestart met je voornemen als actie');
    }
  });
  document.addEventListener('input', function (e) {
    var k = e.target.dataset && e.target.dataset.k8;
    if (!k) return;
    var cs = casesKorthagen[activeKorthagenIndex];
    cs.vragen8 = cs.vragen8 || {};
    cs.vragen8[k] = e.target.value;
    var lines = [];
    EIGHT.forEach(function (r) { ['ik', 'ander'].forEach(function (who) { var v = cs.vragen8[who + '_' + r[0]]; if (v) lines.push(r[1] + (who === 'ik' ? ' ik' : ' de ander') + ': ' + v); }); });
    updateKorthagenField('terugblik', lines.join('\n'));
  });

  /* ======================= 10. Probleemanalyse: meerdere analyses, fasen, balans ======================= */
  var PHASES = ['Probleemstelling', 'Diagnostiek', 'Planvorming', 'Ingreep', 'Evaluatie'];
  var pPhase = 0;
  function probState() { var p = getX('probleem', null); if (!p) p = { active: 0, cases: [{ title: 'Analyse 1' }] }; return p; }
  QR['Probleem- en Behoefteanalyse'] = {
    questions: function (step) {
      var st = probState(), cs = st.cases[st.active] || st.cases[0];
      var phaseOf = function (q) { var m = /FASE (\d)/.exec(q); return m ? Number(m[1]) - 1 : 0; };
      var valOf = function (qi) { return st.active === 0 ? (answers[step.questions[qi]] || '') : ((cs.a || {})[qi] || ''); };
      var done = PHASES.map(function (_, p) { return step.questions.every(function (q, qi) { return phaseOf(q) !== p || String(valOf(qi)).trim(); }); });
      var cont = document.getElementById('questions-container');
      var html = '<div class="kma-flow"><div class="kma-case-head"><div class="cases-tabs">' + st.cases.map(function (c, i) {
        return '<button type="button" class="case-tab' + (i === st.active ? ' active' : '') + '" data-pcase="' + i + '">' + esc(c.title) + '</button>';
      }).join('') + '</div><div class="kma-row-btns"><button type="button" class="kma-icon-btn sm" data-act="p-add">' + icon('plus') + 'Nieuwe analyse</button>' +
        (st.active > 0 ? '<button type="button" class="kma-icon-btn is-round sm" data-act="p-del" aria-label="Verwijderen">' + icon('trash') + '</button>' : '') + '</div></div>' +
        '<input type="text" class="kma-case-title" data-act="p-title" value="' + esc(cs.title) + '" aria-label="Titel"/>' +
        V.chain(PHASES.map(function (p, i) { return { short: String(i + 1), label: p }; }), pPhase, done);
      if (pPhase === 1) {
        var kr = cs.kracht != null ? cs.kracht : 5, la = cs.last != null ? cs.last : 5;
        html += '<div class="kma-card-block kma-balance"><h4>' + icon('scale') + 'Draagkracht en draaglast</h4>' + V.balance(kr, la) +
          '<label class="kma-range-label">Draagkracht (hulpbronnen, competenties) <strong>' + kr + '</strong></label><input type="range" class="kma-range" min="0" max="10" value="' + kr + '" data-pbal="kracht"/>' +
          '<label class="kma-range-label">Draaglast (stressoren, verwachtingen) <strong>' + la + '</strong></label><input type="range" class="kma-range" min="0" max="10" value="' + la + '" data-pbal="last"/></div>';
      }
      step.questions.forEach(function (q, qi) {
        if (phaseOf(q) !== pPhase) return;
        var deep = q.indexOf('[Verdieping]') === 0, label = q.replace('[Verdieping] ', '').replace(/^FASE \d: [A-ZÉ ]+ - /, '');
        html += '<div class="question-card' + (deep ? ' deepening' : '') + (String(valOf(qi)).trim() ? ' is-answered' : '') + '"><div class="question-label"><span>' + PHASES[pPhase] + '</span>' + (deep ? '<strong>Verdieping</strong>' : '') + '</div>' +
          '<label>' + esc(label) + '</label><div class="textarea-wrapper"><textarea id="q-input-' + qi + '" data-pq="' + qi + '" placeholder="Typ hier jouw antwoord...">' + esc(valOf(qi)) + '</textarea>' +
          '<button type="button" class="btn-mic" id="mic-btn-q-input-' + qi + '" onclick="startDictation(\'q-input-' + qi + '\')" title="Spreek in">🎙️</button></div></div>';
      });
      html += '<div class="kma-flow-nav"><button type="button" class="kma-icon-btn" data-pp="-1"' + (pPhase === 0 ? ' disabled' : '') + '>' + icon('left') + 'Vorige fase</button>' +
        (pPhase < 4 ? '<button type="button" class="kma-icon-btn is-primary" data-pp="1">Volgende fase' + icon('right') + '</button>' : '<span class="muted small">Laatste fase</span>') + '</div></div>';
      cont.innerHTML = html;
    }
  };
  function rerenderProb() { QR['Probleem- en Behoefteanalyse'].questions(steps[currentStepIndex]); }
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.pq != null) {
      var st = probState(), qi = Number(t.dataset.pq), step = steps[currentStepIndex];
      if (st.active === 0) saveAnswerByIdx(currentStepIndex, qi, t.value);
      else { var cs = st.cases[st.active]; cs.a = cs.a || {}; cs.a[qi] = t.value; setX('probleem', st); }
      var card = t.closest('.question-card'); if (card) card.classList.toggle('is-answered', !!t.value.trim());
      return;
    }
    if (t.dataset && t.dataset.pbal) {
      var s2 = probState(), c2 = s2.cases[s2.active];
      c2[t.dataset.pbal] = Number(t.value); setX('probleem', s2);
      var bx = t.closest('.kma-balance');
      if (bx) { bx.querySelector('svg').outerHTML = V.balance(c2.kracht != null ? c2.kracht : 5, c2.last != null ? c2.last : 5); t.previousElementSibling.querySelector('strong').textContent = t.value; }
      return;
    }
    if (t.dataset && t.dataset.act === 'p-title') { var s3 = probState(); s3.cases[s3.active].title = t.value; setX('probleem', s3); }
  });
  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-pcase]'))) { var st = probState(); st.active = Number(b.getAttribute('data-pcase')); setX('probleem', st); pPhase = 0; rerenderProb(); }
    else if ((b = e.target.closest('[data-pp]'))) { pPhase = Math.max(0, Math.min(4, pPhase + Number(b.getAttribute('data-pp')))); rerenderProb(); window.scrollTo({ top: document.getElementById('questions-container').offsetTop - 80, behavior: (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth') }); }
    else if ((b = e.target.closest('.kma-flow .kv-chain-step')) && /^Probleem/.test(steps[currentStepIndex].title)) { pPhase = Number(b.getAttribute('data-step')); rerenderProb(); }
    else if (e.target.closest('[data-act="p-add"]')) { var s2 = probState(); s2.cases.push({ title: 'Analyse ' + (s2.cases.length + 1), a: {} }); s2.active = s2.cases.length - 1; setX('probleem', s2); pPhase = 0; rerenderProb(); }
    else if (e.target.closest('[data-act="p-del"]')) { var s3 = probState(); if (s3.active > 0) { var pSnap = JSON.parse(JSON.stringify(s3)), pGone = s3.cases[s3.active]; s3.cases.splice(s3.active, 1); s3.active = 0; setX('probleem', s3); rerenderProb(); if (window.kmaUndoToast) kmaUndoToast('Analyse "' + ((pGone && pGone.title) || 'analyse') + '" verwijderd', function () { setX('probleem', pSnap); rerenderProb(); }); } }
  });

  /* ======================= 11. DTF-logboek ======================= */
  var dtfFilter = 'Alle', dtfFormOpen = false;
  var INTERP = /\b(vind|vond|denk|dacht|lijkt|leek|waarschijnlijk|altijd|nooit|lui|slecht|geweldig|irritant|ongeïnteresseerd|duidelijk dat|eigenlijk|expres|bewust)\b/i;
  /** Datum (JJJJ-MM-DD) van het laatste gesprek/feedbackmoment met de teamleider, of ''. */
  window.kmaLaatsteGesprek = function () {
    var best = '';
    try { (window.kmaFeedback && kmaFeedback.all ? kmaFeedback.all() : []).forEach(function (r) { var f = r && r.form || {}, d = /^\d{4}-\d{2}-\d{2}/.test(f.datumGesprek || '') ? f.datumGesprek.slice(0, 10) : String(r && r.date || '').slice(0, 10); if (/^\d{4}-\d{2}-\d{2}$/.test(d) && d > best) best = d; }); } catch (e) {}
    return best;
  };
  var P = window.KMAPatterns, dtfSel = {}, dtfSug = [];
  // repair DTF data from old or edited files
  (function () {
    if (!Array.isArray(dtfItems)) { dtfItems = []; return; }
    var ch = false;
    dtfItems = dtfItems.filter(function (d) { if (!d || typeof d !== 'object') { ch = true; return false; } return true; });
    dtfItems.forEach(function (d) {
      if ('swot' in d) { var ok = Array.isArray(d.swot) ? d.swot.filter(function (t) { return t && (t.k === 's' || t.k === 'w') && t.t; }) : []; if (!Array.isArray(d.swot) || ok.length !== d.swot.length) { d.swot = ok; ch = true; } }
      if (d.vValues && !Array.isArray(d.vValues)) { d.vValues = []; ch = true; }
      if (d.feit != null && typeof d.feit !== 'string') { d.feit = String(d.feit); ch = true; }
      if ('leary' in d && window.KMALeary) { var lc = KMALeary.clean(d.leary); if (!lc) { delete d.leary; ch = true; } else if (lc.b !== d.leary.b || lc.s !== d.leary.s) { d.leary = lc; ch = true; } }
      if ('learyAnder' in d && window.KMALeary) { var la = KMALeary.clean(d.learyAnder); if (!la) { delete d.learyAnder; ch = true; } else if (la.b !== d.learyAnder.b || la.s !== d.learyAnder.s) { d.learyAnder = la; ch = true; } }
    });
    if (ch) { try { kmaStore.setItem(DTF_KEY, JSON.stringify(dtfItems)); } catch (e) {} }
  })();
  function dtfTags() {
    if (!P) return [];
    var sw = null;
    try { if (H && hexDone()) sw = H.analyse(selfScores(), null).quadrants; } catch (e) {}
    return P.tagsFrom({ swot: sw, kernkwadrant: getX('kernkwadrant', []), used: P.used(dtfItems) });
  }
  function saveDtf() { try { kmaStore.setItem(DTF_KEY, JSON.stringify(dtfItems)); } catch (e) {} if (typeof dbSet === 'function') dbSet(DTF_KEY, dtfItems); if (typeof triggerSavePulse === 'function') triggerSavePulse(); }
  function tagChip(t, i, on, sug, attr) {
    return '<button type="button" class="kma-chip-btn kma-swtag ' + t.k + (on ? ' on' : '') + (sug ? ' sug' : '') + '" ' + attr + '="' + i + '" title="' + esc((t.k === 's' ? 'Sterkte' : 'Valkuil') + ' · ' + t.from + (sug ? ' · voorgesteld' : '')) + '"><i>' + (t.k === 's' ? 'S' : 'V') + '</i>' + esc(t.t) + '</button>';
  }
  function swotPicker() {
    var tags = dtfTags();
    if (!tags.length) return '<p class="muted small">Maak de persoonlijkheidstest (SWOT) of vul je kernkwadranten in; dan kun je feiten koppelen aan je sterktes en valkuilen.</p>';
    var sugK = dtfSug.map(P.tagKey);
    return '<p class="muted small">Past dit bij een sterkte of valkuil? (optioneel' + (dtfSug.length ? ', <span class="kma-sug-dot"></span> = voorgesteld' : '') + ')</p><div class="kma-chips kma-dtf-swot">' +
      tags.map(function (t, i) { return tagChip(t, i, !!dtfSel[P.tagKey(t)], sugK.indexOf(P.tagKey(t)) >= 0, 'data-dtfsw'); }).join('') + '</div>';
  }
  R['dtf-logbook'] = function (c) {
    var counts = VS.map(function (v) { return { label: v, value: dtfItems.filter(function (d) { return (d.vValues || []).indexOf(v) >= 0; }).length }; });
    var since = window.kmaLaatsteGesprek ? kmaLaatsteGesprek() : '';
    var list = dtfItems.filter(function (d) {
      if (dtfFilter !== 'Alle' && (d.vValues || []).indexOf(dtfFilter) < 0) return false;
      if (dtfTeken !== 'alle' && (d.teken || '') !== dtfTeken) return false;
      if (dtfBron !== 'alle' && (d.bron === 'medecadet' ? 'medecadet' : 'zelf') !== dtfBron) return false;
      if (dtfLeary !== 'alle' && (!window.KMALeary || (KMALeary.sector(d.leary) || {}).k !== dtfLeary)) return false;
      return !window.KMALijst || KMALijst.inPeriod(d.datum, dtfPeriode, since);
    });
    var nMore = (dtfTeken !== 'alle') + (dtfBron !== 'alle') + (dtfPeriode !== 'alles') + (dtfLeary !== 'alle');
    var form = '<div class="kma-card-block kma-dtf-form' + (dtfFormOpen ? '' : ' closed') + '"><h4>' + icon('plus') + 'Nieuw feit</h4>' +
      '<div class="kma-inline-form"><input type="date" id="dtf-date" value="' + today() + '"/><input type="time" id="dtf-time" value="' + nowTime() + '"/></div>' +
      '<textarea id="dtf-feit" placeholder="Wat gebeurde er precies? Wie was erbij, wat deed je feitelijk?"></textarea><div class="kma-field-hint" id="kma-dtf-hint"></div>' +
      '<p class="muted small">Bij welke V hoort dit?</p><div class="kma-chips kma-dtf-v">' + VS.map(function (v) {
        return '<label class="kma-chip-btn"><input type="checkbox" id="v-' + v.toLowerCase() + '" value="' + v + '"/>' + v + '</label>';
      }).join('') + '</div>' +
      '<p class="muted small">Was dit positief of negatief?</p><div class="kma-chips kma-dtf-sign">' +
        '<button type="button" class="kma-chip-btn pos' + (dtfSign === '+' ? ' on' : '') + '" data-dtfsign-new="+" aria-pressed="' + (dtfSign === '+') + '">Positief</button>' +
        '<button type="button" class="kma-chip-btn neg' + (dtfSign === '-' ? ' on' : '') + '" data-dtfsign-new="-" aria-pressed="' + (dtfSign === '-') + '">Negatief</button></div>' +
      (window.KMALeary ? '<details class="kma-leary-open"><summary class="muted small">Roos van Leary (optioneel): welk gedrag liet je zien?</summary>' + (window.kmaReactie ? kmaReactie.paarHtml('dtf-leary', 'dtf-leary-ander', null, null) : KMALeary.picker('dtf-leary', null, 'Jouw gedrag op de roos')) + '</details>' : '') +
      '<div id="kma-dtf-swot-box">' + swotPicker() + '</div>' +
      '<textarea id="dtf-aspect" placeholder="Waarom is dit belangrijk voor je beoordeling of leervraag? (optioneel)"></textarea>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-act="dtf-cancel">Annuleren</button><button type="button" class="kma-icon-btn is-primary" onclick="addDTFItem()">' + icon('save') + 'Opslaan</button></div></div>';
    c.innerHTML = '<div class="kma-dtf">' +
      cardHtml('Bewijs per V', V.hbars(counts, { label: 'DTF-feiten per V' }), 'chart') +
      (P && dtfItems.length ? P.patternsHtml(dtfItems, { prefix: 'boek-', open: true }) : '') +
      form +
      '<div class="kma-chips kma-filter">' + ['Alle'].concat(VS).map(function (v) { return '<button type="button" class="kma-chip-btn' + (v === dtfFilter ? ' on' : '') + '" data-dtff="' + v + '">' + v + '</button>'; }).join('') +
      '<button type="button" class="kma-chip-btn" onclick="exportDTFLogbook()">' + icon('download') + 'Exporteer</button></div>' +
      (window.KMALijst ? '<details class="kma-filter-more"' + (nMore ? ' open' : '') + '><summary>' + icon('list') + 'Meer filters' + (nMore ? ' <em>' + nMore + '</em>' : '') + '</summary>' +
        '<div class="kma-filter-lab">Positief of negatief</div><div class="kma-chips">' + KMALijst.chips('data-dtft', [['alle', 'Alle'], ['+', 'Positief'], ['-', 'Negatief']], dtfTeken) + '</div>' +
        '<div class="kma-filter-lab">Van wie</div><div class="kma-chips">' + KMALijst.chips('data-dtfb', [['alle', 'Alle'], ['zelf', 'Zelf'], ['medecadet', 'Medecadet']], dtfBron) + '</div>' +
        (window.KMALeary && dtfItems.some(function (d) { return KMALeary.clean(d.leary); }) ? '<div class="kma-filter-lab">Roos van Leary</div><div class="kma-chips">' + KMALijst.chips('data-dtfl', [['alle', 'Alle']].concat(KMALeary.SECT.map(function (x) { return [x.k, x.n]; })), dtfLeary) + '</div>' : '') +
        '<div class="kma-filter-lab">Periode</div><div class="kma-chips">' + KMALijst.chips('data-dtfp', [['alles', 'Alles'], ['30d', 'Laatste 30 dagen'], ['gesprek', since ? 'Sinds laatste gesprek (' + fmtDate(since) + ')' : 'Sinds laatste gesprek']], dtfPeriode) + '</div></details>' : '') +
      (list.length ? (window.KMALijst ? KMALijst.render('dtf', list, { key: dtfFilter + dtfTeken + dtfBron + dtfPeriode + dtfLeary, date: function (d) { return d.datum; }, row: dtfRow }) : list.map(function (d) { return dtfRow(d).body; }).join(''))
        : (dtfItems.length ? '<p class="muted">Geen feiten met deze filters.</p>' : kmaEmpty({ icon: 'calendar', title: 'Nog geen DTF-feiten', text: 'Leg vast wat er gebeurde: datum, tijd en het feit, zonder oordeel. Zo heb je later voorbeelden voor je gesprek en je beoordeling.', btn: 'Eerste feit vastleggen', attrs: 'data-act="dtf-open"' }))) +
      '<button type="button" class="kma-fab kma-dtf-fab" data-act="dtf-open">' + icon('plus') + '<span>Nieuw feit</span></button></div>';
  };
  var dtfLeary = 'alle', dtfSign = '', dtfTeken = 'alle', dtfBron = 'alle', dtfPeriode = 'alles';
  var VKL = { Verbondenheid: '#c79a2a', Veiligheid: '#3f7cac', Vertrouwen: '#2f9e5b', Verantwoordelijkheid: '#a91f2b' };
  function dtfRow(d) {
    var sg = d.teken === '+' ? ' pos' : d.teken === '-' ? ' neg' : '';
    var t = String(d.feit || '').replace(/\s+/g, ' ').trim();
    return { cls: sg.trim(), when: esc(fmtDate(d.datum).replace(/ \d{4}$/, '')) + (d.tijd ? ' · ' + esc(d.tijd) : ''),
      title: esc(t.length > 90 ? t.slice(0, 88) + '…' : t) + (d.bron === 'medecadet' ? ' <span class="muted small">(medecadet)</span>' : ''),
      badges: (d.vValues || []).map(function (v) { return '<span class="kma-vdot" style="background:' + (VKL[v] || '#777') + '" title="' + esc(v) + '">' + esc(v.charAt(0)) + '</span>'; }).join('') + (window.KMALeary ? (KMALeary.dotPaar ? KMALeary.dotPaar(d.leary, d.learyAnder) : KMALeary.dot(d.leary)) : ''),
      body: '<div class="kma-dtf-item' + sg + '"><div class="kma-dtf-when">' + esc(fmtDate(d.datum)) + (d.tijd ? '<br>' + esc(d.tijd) : '') + '</div><div class="kma-dtf-body"><p>' + esc(d.feit) + '</p>' +
        ((d.vValues || []).length ? '<div class="kma-chips small">' + d.vValues.map(function (v) { return '<span class="kma-chip-btn on">' + esc(v) + '</span>'; }).join('') + '</div>' : '') +
        ((d.swot || []).length ? '<div class="kma-chips small">' + d.swot.map(function (t) { return '<span class="kma-chip-btn kma-swtag on ' + t.k + '"><i>' + (t.k === 's' ? 'S' : 'V') + '</i>' + esc(t.t) + '</span>'; }).join('') + '</div>' : '') +
        (d.aspect ? '<p class="muted small">' + esc(d.aspect) + '</p>' : '') +
        // 4.18.0: snel vastgelegd (+ Nieuw) of zonder V: hier alsnog de V kiezen
        (!(d.vValues || []).length ? '<p class="muted small">Bij welke V hoort dit?</p><div class="kma-chips small kma-dtf-vlater">' + VS.map(function (v) { return '<button type="button" class="kma-chip-btn" data-dtfvset="' + d.id + '" data-v="' + esc(v) + '">' + esc(v) + '</button>'; }).join('') + '</div>' : '') +
        (window.KMALeary && KMALeary.clean(d.leary) ? '<p class="muted small">Roos van Leary: ' + esc(KMALeary.label(d.leary)) + '</p>' : '') +
        '<div class="kma-row-btns"><button type="button" class="kma-chip-btn" onclick="kmaStart5GTFromDtf(' + d.id + ')">' + icon('refresh') + 'Maak 5G-T</button>' +
        '<button type="button" class="kma-chip-btn" data-dtflink="' + d.id + '">' + icon('target') + 'Sterkte/valkuil</button>' +
        (window.KMALeary ? '<button type="button" class="kma-chip-btn" data-dtfleary="' + d.id + '">Roos</button>' : '') +
        '<button type="button" class="kma-chip-btn kma-signbtn' + sg + '" data-dtfsign="' + d.id + '" title="Tik om te wisselen: positief, negatief, geen">' + (d.teken === '+' ? 'Positief' : d.teken === '-' ? 'Negatief' : '+/−') + '</button>' +
        '<button type="button" class="kma-chip-btn" onclick="deleteDTFItem(' + d.id + ')">' + icon('trash') + 'Verwijder</button></div></div></div>' };
  }
  document.addEventListener('click', function (e) {
    var vs = e.target.closest && e.target.closest('[data-dtfvset]');
    if (vs) {
      var di = dtfItems.find(function (x) { return String(x.id) === vs.getAttribute('data-dtfvset'); }); if (!di) return;
      var v = vs.getAttribute('data-v'); if (VS.indexOf(v) < 0) return;
      di.vValues = [v]; saveDtf(); renderWidgets();
      if (window.kmaVandaag) kmaVandaag.render();
      if (window.kmaToast) kmaToast('V gekozen: ' + v);
      return;
    }
    var lb = e.target.closest && e.target.closest('[data-dtfleary]');
    if (lb) {
      var it = dtfItems.find(function (x) { return String(x.id) === lb.getAttribute('data-dtfleary'); }); if (!it) return;
      KMALeary.edit(it.leary, 'Roos van Leary bij dit feit', function (v) { if (v) it.leary = v; else delete it.leary; saveDtf(); renderWidgets(); });
      return;
    }
    var b = e.target.closest && e.target.closest('[data-dtft],[data-dtfb],[data-dtfp],[data-dtfl]'); if (!b) return;
    if (b.hasAttribute('data-dtfl')) dtfLeary = b.getAttribute('data-dtfl');
    else if (b.hasAttribute('data-dtft')) dtfTeken = b.getAttribute('data-dtft');
    else if (b.hasAttribute('data-dtfb')) dtfBron = b.getAttribute('data-dtfb');
    else dtfPeriode = b.getAttribute('data-dtfp');
    renderWidgets();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-dtfsign-new]');
    if (b) {
      var v = b.getAttribute('data-dtfsign-new'); dtfSign = dtfSign === v ? '' : v;
      b.parentNode.querySelectorAll('[data-dtfsign-new]').forEach(function (x) { var on = x.getAttribute('data-dtfsign-new') === dtfSign; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
      return;
    }
    b = e.target.closest && e.target.closest('[data-dtfsign]');
    if (b) {
      var d = dtfItems.find(function (x) { return String(x.id) === b.getAttribute('data-dtfsign'); }); if (!d) return;
      d.teken = d.teken === '+' ? '-' : d.teken === '-' ? '' : '+';
      if (!d.teken) delete d.teken;
      saveDtf(); renderWidgets();
    }
  });
  var origAddDtf = window.addDTFItem;
  window.addDTFItem = function () {
    var lv = window.KMALeary ? KMALeary.value('dtf-leary') : null, lr = window.KMALeary ? KMALeary.value('dtf-leary-ander') : null;
    var sign = dtfSign, n = dtfItems.length, sel = dtfTags().filter(function (t) { return dtfSel[P.tagKey(t)]; }).map(function (t) { return { k: t.k, t: t.t, trait: t.trait }; });
    origAddDtf();
    if (dtfItems.length > n) {
      if (sel.length) dtfItems[0].swot = sel;
      if (sign) dtfItems[0].teken = sign;
      if (lv) dtfItems[0].leary = lv;
      if (lr) dtfItems[0].learyAnder = lr;   // 4.21.0 (S1): wat deed de ander daarna?
      if (sel.length || sign || lv || lr) saveDtf();
      dtfSign = '';
      dtfSel = {}; dtfSug = []; dtfFormOpen = false; renderWidgets();
      if (lv && lr && window.kmaReactie) kmaReactie.aanbod(lv, lr);
    }
  };
  function linkSheet(id) {
    var d = dtfItems.find(function (x) { return x.id === id; }); if (!d) return;
    var tags = dtfTags();
    if (!tags.length) { kmaToast('Maak eerst de persoonlijkheidstest of je kernkwadranten', 'error'); return; }
    var has = function (t) { return (d.swot || []).some(function (x) { return P.tagKey(x) === P.tagKey(t); }); };
    var sugK = P.suggest(d.feit, tags).map(P.tagKey);
    kmaSheet({ title: 'Koppel aan sterkte of valkuil', items: tags.map(function (t) {
      return { icon: has(t) ? 'check' : (t.k === 's' ? 'plus' : 'alert'), label: (t.k === 's' ? 'Sterkte: ' : 'Valkuil: ') + t.t, hint: t.from + (sugK.indexOf(P.tagKey(t)) >= 0 ? ' · voorgesteld' : '') + (has(t) ? ' · gekoppeld (tik om los te maken)' : ''),
        onClick: function () {
          d.swot = (d.swot || []).filter(function (x) { return P.tagKey(x) !== P.tagKey(t); });
          if (!has(t)) d.swot.push({ k: t.k, t: t.t, trait: t.trait });
          saveDtf(); renderWidgets();
        } };
    }) });
  }
  document.addEventListener('click', function (e) {
    var f = e.target.closest('[data-dtff]');
    if (f) { dtfFilter = f.getAttribute('data-dtff'); renderWidgets(); return; }
    if (e.target.closest('[data-act="dtf-open"]')) {
      dtfFormOpen = true;
      var form = document.querySelector('.kma-dtf-form');
      if (form) { form.classList.remove('closed'); form.scrollIntoView({ behavior: (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'), block: 'center' }); setTimeout(function () { var t = document.getElementById('dtf-feit'); if (t) t.focus(); }, 300); }
      return;
    }
    var sw = e.target.closest('[data-dtfsw]');
    if (sw) {
      var t = dtfTags()[Number(sw.getAttribute('data-dtfsw'))]; if (!t) return;
      var k = P.tagKey(t); if (dtfSel[k]) delete dtfSel[k]; else dtfSel[k] = true;
      sw.classList.toggle('on', !!dtfSel[k]); return;
    }
    var ln = e.target.closest('[data-dtflink]');
    if (ln) { linkSheet(Number(ln.getAttribute('data-dtflink'))); return; }
    if (e.target.closest('[data-act="dtf-cancel"]')) { dtfFormOpen = false; var fm = document.querySelector('.kma-dtf-form'); if (fm) fm.classList.add('closed'); }
  });
  document.addEventListener('change', function (e) { if (e.target.closest && e.target.closest('.kma-dtf-v')) e.target.closest('label').classList.toggle('on', e.target.checked); });
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'dtf-feit') return;
    var txt = e.target.value;
    clearTimeout(window.__kmaSugT);
    window.__kmaSugT = setTimeout(function () { if (!P) return; dtfSug = P.suggest(txt, dtfTags()); var box = document.getElementById('kma-dtf-swot-box'); if (box) box.innerHTML = swotPicker(); }, 400);
    var m = INTERP.exec(e.target.value), h = document.getElementById('kma-dtf-hint');
    if (h) h.textContent = m ? 'Let op: "' + m[1] + '" klinkt als een interpretatie. Beschrijf wat je zag en hoorde.' : '';
  });

  /* ======================= Gedeeld bestand als back-up: samenvoegen =======================
     A file made with "Delen" leaves out private chapters. Read in as a backup it used to wipe those chapters
     (answers, reflections, DTF…) on the cadet's own phone. Now only the shared parts are taken over. */
  var origImportBackup = window.importBackupFile;
  if (typeof origImportBackup === 'function') {
    window.importBackupFile = importBackupFile = function (event) {
      var input = event.target, file = input.files && input.files[0];
      if (!file || !file.text) return origImportBackup.apply(this, arguments);
      var self = this, args = arguments;
      file.text().then(function (txt) {
        var d; try { d = kmaLees(txt); } catch (e) { return origImportBackup.apply(self, args); }
        if (!d || !Array.isArray(d.sharedChapters)) return origImportBackup.apply(self, args);
        kmaConfirm('Dit is een gedeeld dossier, geen volledige back-up: privé-hoofdstukken staan er niet in.\n\nWil je alleen de gedeelde onderdelen overnemen? Je privé-hoofdstukken blijven staan.', { ok: 'Overnemen', danger: false }).then(function (ok) { input.value = ''; if (ok) mergeShared(d); });
      });
    };
  }
  function mergeShared(d) {
    var on = function (test) { var i = steps.findIndex(test); if (i < 0) return false; if (d.sharedTitles && steps[i].title in d.sharedTitles) return !!d.sharedTitles[steps[i].title]; return !!d.sharedChapters[i]; };
    var put = function (key, val) { try { kmaStore.setItem(key, JSON.stringify(val)); } catch (e) {} if (typeof dbSet === 'function') dbSet(key, val); };
    if (d.answers && typeof d.answers === 'object') { answers = Object.assign({}, answers, d.answers); put(STORAGE_KEY, answers); }
    var lists = [['5gt-multi', 'cases5GT', CASES_5GT_KEY], ['korthagen-multi', 'casesKorthagen', CASES_KORTHAGEN_KEY], ['dtf-logbook', 'dtf', DTF_KEY], ['timeline', 'timeline', TIMELINE_KEY]];
    lists.forEach(function (l) {
      var v = d[l[1]];
      if (!Array.isArray(v) || !v.length || !on(function (s) { return s.widget === l[0]; })) return;
      if (l[1] === 'cases5GT') cases5GT = v; else if (l[1] === 'casesKorthagen') casesKorthagen = v; else if (l[1] === 'dtf') dtfItems = v; else timelineItems = v;
      put(l[2], v);
    });
    var persOk = !window.KMA_PERS_SET || d.persItemSet === window.KMA_PERS_SET;
    if (persOk && on(function (s) { return s.widget === 'hexaco'; })) {
      if (d.hexacoSelf && Object.keys(d.hexacoSelf).length) { hexacoSelfAnswers = d.hexacoSelf; put(HEXACO_SELF_ANSWERS_KEY, d.hexacoSelf); }
      if (d.hexacoObservers && d.hexacoObservers.length) { hexacoObservers = d.hexacoObservers; put(HEXACO_OBSERVERS_KEY, d.hexacoObservers); }
      if (d.hexaco && Object.keys(d.hexaco).length) { hexacoScores = d.hexaco; put(HEXACO_KEY, d.hexaco); }
    }
    if (Array.isArray(d.fitness) && d.fitness.length) { fitnessLogs = d.fitness; put(FITNESS_KEY, d.fitness); }
    var form = d.kmaOfficialSelfForm || d.officialKMAForm;
    if (form && typeof form === 'object' && !('beoordelaar' in form)) { kmaOfficialSelfForm = form; put(OFFICIAL_FORM_KEY, form); }
    if (d.profilePhoto) { try { kmaStore.setItem('kma-profile-photo', d.profilePhoto); } catch (e) {} }
    if (d.extras && window.kmaRestoreExtras) kmaRestoreExtras(d.extras);
    alert('De gedeelde onderdelen zijn overgenomen. Je privé-hoofdstukken zijn niet aangeraakt.');
    location.reload();
  }

  /* ======================= 12. Begrippenlijst: zoeken, A-Z, flitskaarten ======================= */
  var jq = '', jcat = 'Alle', jmode = 'lijst', jcard = 0, jflip = false;
  R['jargon-list'] = function (c) {
    var cats = ['Alle'].concat(jargonItems.map(function (j) { return j.category || 'Algemeen'; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort());
    var list = jargonItems.filter(function (j) {
      return (jcat === 'Alle' || (j.category || 'Algemeen') === jcat) && (!jq || (j.term + ' ' + j.def).toLowerCase().indexOf(jq.toLowerCase()) >= 0);
    }).slice().sort(function (a, b) { return a.term.localeCompare(b.term, 'nl'); });
    var known = getX('flash', []);
    var head = '<div class="kma-tabs kma-q-tabs"><button type="button" class="kma-tab' + (jmode === 'lijst' ? ' active' : '') + '" data-jmode="lijst">' + icon('list') + 'Lijst</button>' +
      '<button type="button" class="kma-tab' + (jmode === 'kaarten' ? ' active' : '') + '" data-jmode="kaarten">' + icon('book') + 'Flitskaarten</button></div>';
    var filters = '<input type="search" id="kma-jq" class="has-search-icon kma-search" placeholder="Zoek een begrip" value="' + esc(jq) + '"/>' +
      '<div class="kma-chips kma-filter">' + cats.map(function (x) { return '<button type="button" class="kma-chip-btn' + (x === jcat ? ' on' : '') + '" data-jcat="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>';
    if (jmode === 'kaarten') {
      var deck = list.filter(function (j) { return known.indexOf(j.id) < 0; });
      if (!deck.length) {
        c.innerHTML = head + cardHtml('', '<p>Je kent alle ' + list.length + ' begrippen in deze selectie.</p><button type="button" class="kma-icon-btn" data-act="j-reset">' + icon('refresh') + 'Opnieuw beginnen</button>');
        return;
      }
      if (jcard >= deck.length) jcard = 0;
      var j = deck[jcard];
      c.innerHTML = head + '<div class="kma-flash' + (jflip ? ' flipped' : '') + '" data-act="j-flip" role="button" tabindex="0"><div class="kma-flash-cat">' + esc(j.category || 'Algemeen') + '</div>' +
        '<div class="kma-flash-front">' + esc(j.term) + '<small>Tik om om te draaien</small></div><div class="kma-flash-back">' + esc(j.def) + '</div></div>' +
        '<p class="muted small" style="text-align:center">Nog ' + deck.length + ' te leren · ' + known.length + ' gekend</p>' +
        '<div class="kma-flow-nav"><button type="button" class="kma-icon-btn" data-act="j-later">' + icon('refresh') + 'Nog niet</button><button type="button" class="kma-icon-btn is-primary" data-act="j-know" data-id="' + j.id + '">' + icon('check') + 'Ken ik</button></div>';
      return;
    }
    var letters = list.map(function (j) { return j.term.charAt(0).toUpperCase(); }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var groups = letters.map(function (L) {
      return '<div class="kma-jgroup" id="kma-j-' + esc(L) + '"><h5>' + esc(L) + '</h5>' + list.filter(function (j) { return j.term.charAt(0).toUpperCase() === L; }).map(function (j) {
        return '<div class="jargon-card"><div class="jargon-card-header"><span class="jargon-title">' + esc(j.term) + '</span><span class="jargon-cat">' + esc(j.category || 'Algemeen') + '</span></div><p class="jargon-def">' + esc(j.def) + '</p>' +
          (j.id > 5 ? '<button type="button" class="kma-chip-btn" onclick="deleteJargonItem(' + j.id + ')">' + icon('trash') + 'Verwijder</button>' : '') + '</div>';
      }).join('') + '</div>';
    }).join('');
    c.innerHTML = head + filters + (letters.length > 3 ? '<div class="kma-az">' + letters.map(function (L) { return '<a href="#kma-j-' + esc(L) + '" data-az="' + esc(L) + '">' + esc(L) + '</a>'; }).join('') + '</div>' : '') +
      (groups || '<p class="muted">Niets gevonden.</p>') +
      cardHtml('Begrip toevoegen', '<input type="text" id="jargon-term" placeholder="Begrip of afkorting"/><input type="text" id="jargon-cat" placeholder="Categorie (bijv. Organisatie)"/>' +
        '<textarea id="jargon-def" placeholder="Betekenis"></textarea><button type="button" class="kma-icon-btn is-primary" onclick="addJargonItem()">' + icon('plus') + 'Opslaan</button>', 'plus');
  };
  document.addEventListener('input', function (e) {
    if (e.target.id !== 'kma-jq') return;
    jq = e.target.value;
    var pos = e.target.selectionStart;
    renderWidgets();
    var n = document.getElementById('kma-jq'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} }
  });
  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-jmode]'))) { jmode = b.getAttribute('data-jmode'); jflip = false; renderWidgets(); }
    else if ((b = e.target.closest('[data-jcat]'))) { jcat = b.getAttribute('data-jcat'); renderWidgets(); }
    else if ((b = e.target.closest('[data-az]'))) { e.preventDefault(); var t = document.getElementById('kma-j-' + b.getAttribute('data-az')); if (t) t.scrollIntoView({ behavior: (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth') }); }
    else if (e.target.closest('[data-act="j-flip"]')) { jflip = !jflip; e.target.closest('.kma-flash').classList.toggle('flipped', jflip); }
    else if (e.target.closest('[data-act="j-later"]')) { jcard++; jflip = false; renderWidgets(); }
    else if ((b = e.target.closest('[data-act="j-know"]'))) { var k = getX('flash', []); k.push(Number(b.getAttribute('data-id'))); setX('flash', k); jflip = false; renderWidgets(); }
    else if (e.target.closest('[data-act="j-reset"]')) { setX('flash', []); jcard = 0; renderWidgets(); }
  });

  /* ======================= 13. Beoordeling & fitheid ======================= */
  function fitAlert() {
    var logs = fitnessLogs.slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).slice(-3);
    if (logs.length < 3) return null;
    if (logs.every(function (l) { return Number(l.sleep) <= 4; })) return 'Je hebt drie keer op rij slecht geslapen.';
    if (logs.every(function (l) { return Number(l.mind) >= 8; })) return 'Je staat al drie metingen op rij onder hoge mentale druk.';
    return null;
  }
  window.kmaFitAlert = fitAlert;
  function evidenceItems() {
    var out = [];
    dtfItems.forEach(function (d) { out.push({ id: 'dtf:' + d.id, kind: 'DTF', label: d.feit, hint: fmtDate(d.datum) + ((d.vValues || []).length ? ' · ' + d.vValues.join(', ') : '') }); });
    cases5GT.forEach(function (c) { if (c.gebeurtenis || c.t_toepassen) out.push({ id: '5gt:' + c.id, kind: '5G-T', label: c.title, hint: (c.t_toepassen || c.gebeurtenis || '').slice(0, 80) }); });
    casesKorthagen.forEach(function (c) { if (c.actie || c.uitproberen) out.push({ id: 'kort:' + c.id, kind: 'Korthagen', label: c.title, hint: (c.uitproberen || c.actie || '').slice(0, 80) }); });
    return out;
  }
  /** 4.17.0 (M1): je eigen datapunten per V: wat weet je teamleider van je? Eigen feiten, medecadetten en gedeelde waarnemingen van staf. */
  function mijnDatapunten() {
    var D = window.KMADatapunten; if (!D) return '';
    var p = [];
    (dtfItems || []).forEach(function (x) { var d = D.vanDtf(x, x && x.bron === 'medecadet' ? 'medecadet' : 'zelf'); if (d) p.push(d); });
    try { (window.kmaKameraad ? kmaKameraad._S().inbox || [] : []).forEach(function (k) { if (!k.inDtf && k.v4) p.push(D.vanDtf({ datum: k.datum, feit: k.feit, v4: [k.v4] }, 'medecadet')); }); } catch (e) {}
    var seen = {};
    try { (window.kmaFeedback ? kmaFeedback.all() : []).forEach(function (r) { (r.dtfNotes || []).forEach(function (n) { if (seen[n.id]) return; seen[n.id] = 1; var d = D.vanDtf(n, /instructeur/i.test(n.role || '') ? 'instructeur' : 'teamleider'); if (d) p.push(d); }); }); } catch (e) {}
    return cardHtml('Wat weet je teamleider van je?', '<p class="muted small">Elk DTF-feit, elke feedback van een medecadet en elke waarneming die je teamleider met je deelde, is een datapunt. Je beoordeling steunt op deze punten, niet op één moment. ' + (window.kmaOER ? kmaOER.label('3.7.5') + kmaOER.label('3.7.4') : '') + '</p>' + D.html(D.perV(p), { zelf: true }), 'chart');
  }
  R['beoordeling-prep'] = function (c) {
    var sel = getX('gesprek', { ids: [] }).ids, ev = evidenceItems();
    c.innerHTML = mijnDatapunten() +
      cardHtml('Bewijs voor je gesprek', '<p class="muted">Kies de feiten en reflecties die je wilt bespreken. Ze komen in je antwoord en in je gesprekssamenvatting.</p>' +
        (ev.length ? '<div class="kma-evidence">' + ev.map(function (it) {
          return '<label class="kma-ev"><input type="checkbox" data-ev="' + esc(it.id) + '"' + (sel.indexOf(it.id) >= 0 ? ' checked' : '') + '/><span><em>' + it.kind + '</em> ' + esc(String(it.label).slice(0, 90)) + '<small>' + esc(it.hint) + '</small></span></label>';
        }).join('') + '</div>' : '<p class="muted">Leg eerst DTF-feiten of reflecties vast.</p>') +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-act="ev-fill">' + icon('edit') + 'Zet in mijn antwoord</button>' +
        '<button type="button" class="kma-icon-btn is-primary" data-act="summary">' + icon('file') + 'Gesprekssamenvatting</button>' +
        '<button type="button" class="kma-icon-btn" onclick="kmaPortfolio()">' + icon('download') + 'Portfolio (PDF)</button></div>', 'clip');
  };
  /* ======================= 15. Toetsing en examinering DKOO (kma-toetsplan.js) ======================= */
  R['toetsplan'] = function (c) { if (window.KMAToets) KMAToets.renderBoek(c); };

  /* ======================= 14. Fitheid & stress (fitheidslogboek, PSS-10 en WHO-5) ======================= */
  var PSS = window.KMAPSS, pssOpen = false, pssDraft = null;
  function pssList() { return PSS ? PSS.sorted(getX('pss', [])) : []; }
  function pssLast() { var l = pssList(); return l.length ? l[l.length - 1] : null; }
  window.kmaPssLast = function () { var r = pssLast(); return r ? { date: r.date, total: PSS.total(r.a), band: PSS.band(PSS.total(r.a)) } : null; };
  function supportNames() {
    return getX('support', []).slice().sort(function (a, b) { return a.ring - b.ring; }).map(function (p) { return p.name; }).filter(Boolean);
  }
  function pssAdvice(b, sig) {
    var rise = sig && sig.rise && b && b.key !== 'hoog';
    if (!b || (b.key !== 'hoog' && b.key !== 'verhoogd' && !rise)) return '';
    var names = supportNames(), circle = names.length ? 'iemand uit je steuncirkel, zoals ' + esc(names.slice(0, 3).join(', ')) : 'iemand uit je steuncirkel (vul die in bij Introductie & Drijfveren)';
    if (rise) return '<div class="kma-pss-advice soft">' + icon('users') + '<div><strong>Je score is ' + sig.change.diff + ' punten hoger dan bij je vorige meting.</strong><p>Dat is meer dan de meetfout, dus een echte stijging. Een duidelijke stijging is een goed moment om even stil te staan. Wat is er veranderd? Vertel het iemand die je vertrouwt, bijvoorbeeld je teamleider, een buddy of ' + circle + '.</p></div></div>';
    if (b.key === 'verhoogd') return '<div class="kma-pss-advice soft">' + icon('users') + '<div><strong>Je ervaart meer stress dan gemiddeld.</strong><p>Vertel iemand die je vertrouwt wat je bezighoudt, bijvoorbeeld je teamleider, een buddy of ' + circle + '. Kijk ook naar je slaap en herstel hieronder.</p></div></div>';
    return '<div class="kma-pss-advice">' + icon('alert') + '<div><strong>Je score is hoog. Je hoeft dit niet alleen te dragen.</strong>' +
      '<p>Een gesprek kan echt helpen. Overweeg om contact op te nemen met:</p><ul>' +
      '<li><b>Geestelijke verzorging</b>: vertrouwelijk, ook als je niet gelovig bent</li>' +
      '<li><b>Bedrijfsmaatschappelijk werk (BMW)</b></li>' +
      '<li>je <b>teamleider</b></li><li>een <b>senior-instructeur</b></li><li>' + circle + '</li></ul>' +
      '<p class="small">Gaat het echt niet meer? Bel dan 113 (gratis via 0800-0113) of je huisarts. Bij direct gevaar bel je 112.</p></div></div>';
  }
  function pssForm() {
    var a = pssDraft || [];
    return '<p class="muted">Hoe vaak gold dit voor jou <b>in de afgelopen maand</b>? Er zijn geen goede of foute antwoorden.</p>' +
      PSS.ITEMS.map(function (q, i) {
        return '<fieldset class="kma-pss-q' + (a[i] == null ? '' : ' done') + '" data-q="' + i + '"><legend><span>' + (i + 1) + '</span>' + esc(q) + '</legend><div class="kma-pss-opts">' +
          PSS.SCALE.map(function (l, v) { return '<label><input type="radio" name="pss-' + i + '" value="' + v + '"' + (a[i] === v ? ' checked' : '') + '/><span><b>' + v + '</b>' + l + '</span></label>'; }).join('') + '</div></fieldset>';
      }).join('') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-act="pss-cancel">' + icon('x') + 'Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-act="pss-save">' + icon('save') + 'Score berekenen en opslaan</button></div>';
  }
  function pssResult() {
    var list = pssList(), last = list[list.length - 1];
    if (!last) return '<p class="muted">Met 10 korte vragen zie je hoeveel stress je de afgelopen maand hebt ervaren. Vul de vragenlijst bijvoorbeeld één keer per maand in, dan zie je hoe het zich ontwikkelt.</p>' +
      '<button type="button" class="kma-icon-btn is-primary" data-act="pss-open">' + icon('edit') + 'Vul de PSS-10 in</button>';
    var t = PSS.total(last.a), b = PSS.band(t), th = PSS.themes(last.a), sig = PSS.signal(list), ch = sig && sig.change;
    var trend = list.length > 1 ? V.lineChart(list.slice(-12).map(function (r) { return fmtDate(r.date).replace(/ \d{4}$/, ''); }), [{ label: 'PSS-10', color: V.colors.red, values: list.slice(-12).map(function (r) { return PSS.total(r.a); }) }], { yMin: 0, yMax: PSS.MAX, ticks: [0, PSS.BANDS.gemiddeld, PSS.BANDS.verhoogd, PSS.BANDS.hoog, PSS.MAX], label: 'PSS-10 over tijd' }) : '';
    return '<div class="kma-vis-row"><div class="kma-self-gauge">' + V.gauge(t, PSS.MAX, { caption: b.label + ' · ' + fmtDate(last.date), color: b.color, label: 'PSS-10 score' }) + (ch ? '<p class="muted small kma-pss-change">' + esc(PSS.changeText(ch)) + '</p>' : '') + '</div>' +
      '<div>' + V.hbars(th.map(function (x) { return { label: x.label, value: x.value, color: x.value >= 60 ? V.colors.red : V.colors.gold }; }), { max: 100, labelW: 150, label: 'Hulpeloosheid en grip (procent van het maximum)' }) + '</div></div>' +
      pssAdvice(b, sig) + trend +
      '<p class="muted small">Score 0 tot ' + PSS.MAX + '. ' + esc(PSS.NOTE) + (list.some(function (r) { return PSS.legacy(r.a); }) ? ' ' + esc(PSS.LEGACY_NOTE) : '') + '</p>' + PSS.explain() +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-act="pss-open">' + icon('edit') + 'Opnieuw invullen</button></div>' +
      '<div class="kma-fit-list">' + list.slice().reverse().slice(0, 8).map(function (r) {
        var tt = PSS.total(r.a), bb = PSS.band(tt);
        return '<div class="kma-fit-row"><span>' + esc(fmtDate(r.date)) + '</span><span><b style="color:' + bb.color + '">' + tt + '</b> · ' + bb.label + '</span><button type="button" class="kma-icon-btn is-round sm" data-act="pss-del" data-id="' + r.id + '" aria-label="Verwijderen">' + icon('trash') + '</button></div>';
      }).join('') + '</div>';
  }
  /* ---------- 4.7.0: welzijnscheck (WHO-5) ---------- */
  var W5 = window.KMAWHO5, w5Open = false, w5Draft = null;
  function w5List() { return W5 ? W5.sorted(getX('who5', [])) : []; }
  function w5Form() {
    var a = w5Draft || [];
    return '<p class="muted">Geef bij elke uitspraak aan wat het best weergeeft hoe je je <b>de laatste twee weken</b> hebt gevoeld.</p>' +
      W5.ITEMS.map(function (q, i) {
        return '<fieldset class="kma-pss-q kma-w5-q' + (a[i] == null ? '' : ' done') + '" data-q="' + i + '"><legend><span>' + (i + 1) + '</span>' + esc(q) + '</legend><div class="kma-pss-opts">' +
          W5.SCALE.map(function (o) { return '<label><input type="radio" name="who5-' + i + '" value="' + o[0] + '"' + (a[i] === o[0] ? ' checked' : '') + '/><span><b>' + o[0] + '</b>' + esc(o[1]) + '</span></label>'; }).join('') + '</div></fieldset>';
      }).join('') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-act="w5-cancel">' + icon('x') + 'Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-act="w5-save">' + icon('save') + 'Score berekenen en opslaan</button></div>';
  }
  function w5Result() {
    var list = w5List(), last = list[list.length - 1];
    if (!last) return '<p class="muted">Vijf korte uitspraken over hoe het de laatste twee weken met je ging. Samen met de stresscheck zie je zo twee kanten: hoeveel druk je ervaart en hoe het met je gaat.</p>' +
      '<button type="button" class="kma-icon-btn is-primary" data-act="w5-open">' + icon('edit') + 'Vul de WHO-5 in</button>';
    var t = W5.total(last.a), b = W5.band(t), ch = W5.change(list);
    var trend = list.length > 1 ? V.lineChart(list.slice(-12).map(function (r) { return fmtDate(r.date).replace(/ \d{4}$/, ''); }), [{ label: 'WHO-5', color: V.colors.green, values: list.slice(-12).map(function (r) { return W5.total(r.a); }) }], { yMin: 0, yMax: 100, ticks: [0, W5.LOW, 100], label: 'WHO-5 over tijd' }) : '';
    var names = supportNames(), circle = names.length ? 'iemand uit je steuncirkel, zoals ' + esc(names.slice(0, 3).join(', ')) : 'iemand uit je steuncirkel';
    return '<div class="kma-self-gauge">' + V.gauge(t, 100, { caption: b.label + ' · ' + fmtDate(last.date), color: b.color, label: 'WHO-5 score' }) +
      (ch ? '<p class="muted small">' + (ch.diff === 0 ? 'gelijk aan je vorige meting' : (ch.diff > 0 ? ch.diff + ' hoger' : (-ch.diff) + ' lager') + ' dan de vorige meting (' + ch.prev + ')') + '</p>' : '') + '</div>' +
      (b.low ? '<div class="kma-pss-advice soft">' + icon('users') + '<div><strong>Het gaat de laatste tijd minder goed met je.</strong><p>Dat is een goede reden om met iemand te praten, bijvoorbeeld je teamleider, een buddy, geestelijke verzorging, het bedrijfsmaatschappelijk werk (BMW) of ' + circle + '. Blijft het zo, ga dan ook langs je huisarts.</p></div></div>' : '') +
      trend + '<p class="muted small">' + esc(W5.NOTE) + '</p>' + W5.explain() +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-act="w5-open">' + icon('edit') + 'Opnieuw invullen</button></div>' +
      '<div class="kma-fit-list">' + list.slice().reverse().slice(0, 8).map(function (r) {
        var tt = W5.total(r.a), bb = W5.band(tt);
        return '<div class="kma-fit-row"><span>' + esc(fmtDate(r.date)) + '</span><span><b style="color:' + bb.color + '">' + tt + '</b> · ' + bb.label + '</span><button type="button" class="kma-icon-btn is-round sm" data-act="w5-del" data-id="' + r.id + '" aria-label="Verwijderen">' + icon('trash') + '</button></div>';
      }).join('') + '</div>';
  }
  document.addEventListener('change', function (e) {
    var m = /^who5-(\d+)$/.exec(e.target.name || ''); if (!m) return;
    w5Draft = w5Draft || []; w5Draft[Number(m[1])] = Number(e.target.value);
    var f = e.target.closest('.kma-pss-q'); if (f) f.classList.add('done');
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act^="w5-"]'); if (!b || !W5) return;
    var act = b.getAttribute('data-act');
    if (act === 'w5-open') { w5Open = true; w5Draft = []; renderWidgets(); var c = document.getElementById('kma-w5-card'); if (c) c.scrollIntoView({ block: 'start' }); }
    else if (act === 'w5-cancel') { w5Open = false; w5Draft = null; renderWidgets(); }
    else if (act === 'w5-save') {
      var a = []; for (var i = 0; i < 5; i++) a[i] = w5Draft && w5Draft[i] != null ? w5Draft[i] : null;
      var miss = a.indexOf(null);
      if (miss >= 0) { kmaToast('Beantwoord nog uitspraak ' + (miss + 1), 'error'); var q = document.querySelector('.kma-w5-q[data-q="' + miss + '"]'); if (q) q.scrollIntoView({ block: 'center' }); return; }
      var l = getX('who5', []); l.push({ id: Date.now(), date: today(), a: a }); setX('who5', l.slice(-60));
      w5Open = false; w5Draft = null; renderWidgets();
      var t = W5.total(a); kmaToast('Je score is ' + t + ' (' + W5.band(t).label.toLowerCase() + ')');
    } else if (act === 'w5-del') {
      var snap = getX('who5', []);
      setX('who5', snap.filter(function (r) { return String(r.id) !== b.getAttribute('data-id'); })); renderWidgets();
      if (window.kmaUndoToast) kmaUndoToast('Meting verwijderd', function () { setX('who5', snap); renderWidgets(); });
    }
  });
  function pssGuide() {
    var g = getX('pss-groep', { scores: '' }), nums = String(g.scores || '').split(/[\s,;]+/).map(Number).filter(function (n) { return n >= 0 && n <= PSS.MAX && String(n) !== 'NaN'; });
    var avg = nums.length ? Math.round(nums.reduce(function (a, b) { return a + b; }, 0) / nums.length * 10) / 10 : null;
    var body = '<p class="muted">Voor een groepsgesprek met 6 tot 8 personen. Doel: elkaar beter leren kennen, het gesprek verdiepen en je kwetsbaar durven opstellen.</p>' +
      '<h5>Groepsgesprek</h5><ul class="kma-pss-guide">' +
      '<li><b>De spiegel.</b> Welke vraag raakte je het meest, of gaf een verrassende score?</li>' +
      '<li><b>Het masker.</b> Waar voel je de meeste druk om alles onder controle te houden? Wat gebeurt er als je dat loslaat?</li>' +
      '<li><b>Signalen.</b> Hoe merk jij (of je omgeving) dat stress de overhand krijgt, en wat heb je dan nodig?</li>' +
      '<li><b>Grenzen.</b> Waar vind je het het lastigst om nee tegen te zeggen, en waar ben je dan bang voor?</li>' +
      '<li><b>Veiligheid.</b> Bij wie kun je je het makkelijkst kwetsbaar opstellen, en waarom?</li>' +
      '<li><b>Steun.</b> Wanneer had je de afgelopen maand meer steun willen hebben, maar durfde je er niet om te vragen?</li></ul>' +
      '<h5>Vervolgopdracht: de gemene deler</h5><ol class="kma-pss-guide">' +
      '<li><b>Scores bundelen.</b> Tel de totaalscores van het groepje op en bereken het gemiddelde. Welke vragen of thema\'s scoren het hoogst?</li>' +
      '<li><b>Patronen herkennen.</b> Welke stressbronnen delen jullie, zoals werkdruk, controleverlies of piekeren?</li>' +
      '<li><b>De gemene deler.</b> Maak samen één zin die jullie gezamenlijke stressbron van de afgelopen maand het best beschrijft.</li>' +
      '<li><b>Samen steunen.</b> Spreek één concrete manier af om elkaar de komende tijd te steunen of te ontlasten.</li></ol>' +
      '<div class="kma-inline-form"><input type="text" id="kma-pss-group" aria-label="Scores van het groepje" inputmode="numeric" placeholder="Scores van het groepje, bijv. 24, 31, 18" value="' + esc(g.scores || '') + '"/><button type="button" class="kma-icon-btn" data-act="pss-group">' + icon('activity') + 'Gemiddelde</button></div>' +
      (avg != null ? '<p><b>Gemiddelde van ' + nums.length + ' personen: ' + avg + '</b> (' + PSS.band(Math.round(avg)).label.toLowerCase() + '). Deze scores blijven op deze telefoon en worden niet gedeeld.</p>' : '') +
      '<p class="kma-pss-bonus"><b>Bonusvraag:</b> Welke vraag zou je graag eens oprecht gesteld krijgen?</p>';
    return window.KMAPatterns ? KMAPatterns.details('pss-gids', icon('users') + 'Gespreksgids voor je groepje', body, false) : '<details class="kma-pat"><summary>Gespreksgids voor je groepje</summary><div class="kma-pat-body">' + body + '</div></details>';
  }
  R['fitheid'] = function (c) {
    var logs = fitnessLogs.slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).slice(-14);
    var series = [
      { label: 'Slaap', color: V.colors.blue, values: logs.map(function (l) { return Number(l.sleep); }) },
      { label: 'Fysieke belasting', color: V.colors.gold, values: logs.map(function (l) { return Number(l.body); }) },
      { label: 'Mentale druk', color: V.colors.red, values: logs.map(function (l) { return Number(l.mind); }) }
    ];
    var alert = fitAlert();
    c.innerHTML =
      (PSS ? cardHtml('Stresscheck (PSS-10)', pssOpen ? pssForm() : pssResult(), 'activity') : '') +
      (W5 ? '<div id="kma-w5-card">' + cardHtml('Welzijnscheck (WHO-5)', w5Open ? w5Form() : w5Result(), 'sun') + '</div>' : '') +
      '<div class="kma-card-block"><h4>' + icon('activity') + 'Fitheidslogboek</h4>' +
      (alert ? '<div class="kma-alert">' + icon('alert') + '<span>' + alert + ' Bespreek dit met je teamleider of een buddy. Herstel hoort ook bij je opleiding.</span></div>' : '') +
      (logs.length ? V.lineChart(logs.map(function (l) { return fmtDate(l.date).replace(/ \d{4}$/, ''); }), series, { yMin: 0, yMax: 10, ticks: [0, 5, 10], label: 'Fitheid over tijd' }) + V.legend(series) : '<p class="muted">Nog geen metingen. Je grafiek verschijnt na je eerste meting.</p>') +
      '<div class="kma-inline-form"><input type="date" id="fit-date" aria-label="Datum van de meting" value="' + today() + '"/></div>' +
      '<label class="kma-range-label">Slaap en rust <span><strong id="kma-fs">7</strong>/10</span></label><input type="range" id="fit-sleep" class="kma-range" min="1" max="10" value="7" data-out="kma-fs"/>' +
      '<label class="kma-range-label">Fysieke belasting <span><strong id="kma-fb">5</strong>/10</span></label><input type="range" id="fit-body" class="kma-range" min="1" max="10" value="5" data-out="kma-fb"/>' +
      '<label class="kma-range-label">Mentale druk <span><strong id="kma-fm">5</strong>/10</span></label><input type="range" id="fit-mind" class="kma-range" min="1" max="10" value="5" data-out="kma-fm"/>' +
      '<textarea id="fit-notes" placeholder="Notities (optioneel)"></textarea>' +
      '<button type="button" class="kma-icon-btn is-primary" onclick="addFitnessLog()">' + icon('save') + 'Meting opslaan</button>' +
      (fitnessLogs.length ? '<div class="kma-fit-list">' + fitnessLogs.slice(0, 10).map(function (l) {
        return '<div class="kma-fit-row"><span>' + esc(fmtDate(l.date)) + '</span><span>Slaap ' + esc(l.sleep) + ' · Fysiek ' + esc(l.body) + ' · Mentaal ' + esc(l.mind) + '</span><button type="button" class="kma-icon-btn is-round sm" onclick="deleteFitnessLog(' + Number(l.id) + ')" aria-label="Verwijderen">' + icon('trash') + '</button></div>';
      }).join('') + '</div>' : '') + '</div>' +
      (PSS ? pssGuide() : '') +
      (window.KMAPatterns ? KMAPatterns.details('boek-week', icon('activity') + 'Week in samenhang: fitheid, DTF en emoties', KMAPatterns.weekSummaryHtml({ fitness: fitnessLogs, dtf: dtfItems, cases5GT: cases5GT }), true) : '');
  };
  document.addEventListener('change', function (e) {
    var m = /^pss-(\d+)$/.exec(e.target.name || ''); if (!m) return;
    pssDraft = pssDraft || []; pssDraft[Number(m[1])] = Number(e.target.value);
    var f = e.target.closest('.kma-pss-q'); if (f) f.classList.add('done');
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act^="pss-"]'); if (!b || !PSS) return;
    var act = b.getAttribute('data-act');
    if (act === 'pss-open') { pssOpen = true; pssDraft = []; renderWidgets(); var w = document.getElementById('widget-container'); if (w) w.scrollIntoView({ block: 'start' }); }
    else if (act === 'pss-cancel') { pssOpen = false; pssDraft = null; renderWidgets(); }
    else if (act === 'pss-save') {
      var a = []; for (var i = 0; i < PSS.N; i++) a[i] = pssDraft && pssDraft[i] != null ? pssDraft[i] : null;
      var miss = a.indexOf(null);
      if (miss >= 0) { kmaToast('Beantwoord nog vraag ' + (miss + 1) + (a.filter(function (x) { return x == null; }).length > 1 ? ' en de andere open vragen' : ''), 'error'); var q = document.querySelector('.kma-pss-q[data-q="' + miss + '"]'); if (q) q.scrollIntoView({ block: 'center' }); return; }
      var list = getX('pss', []); list.push({ id: Date.now(), date: today(), a: a }); setX('pss', list.slice(-60));
      pssOpen = false; pssDraft = null; renderWidgets();
      var t = PSS.total(a); kmaToast('Je score is ' + t + ' (' + PSS.band(t).label.toLowerCase() + ')');
    } else if (act === 'pss-del') {
      var pssSnap = getX('pss', []);
      setX('pss', pssSnap.filter(function (r) { return String(r.id) !== b.getAttribute('data-id'); })); renderWidgets();
      if (window.kmaUndoToast) kmaUndoToast('Meting verwijderd', function () { setX('pss', pssSnap); renderWidgets(); });
    } else if (act === 'pss-group') {
      var inp = document.getElementById('kma-pss-group'); setX('pss-groep', { scores: inp ? inp.value : '' }); renderWidgets();
    }
  });
  document.addEventListener('input', function (e) { var o = e.target.dataset && e.target.dataset.out; if (o) { var el = document.getElementById(o); if (el) el.textContent = e.target.value; } });
  document.addEventListener('change', function (e) {
    var id = e.target.dataset && e.target.dataset.ev;
    if (!id) return;
    var g = getX('gesprek', { ids: [] });
    g.ids = g.ids.filter(function (x) { return x !== id; });
    if (e.target.checked) g.ids.push(id);
    setX('gesprek', g);
  });
  function chosenEvidence() { var ids = getX('gesprek', { ids: [] }).ids; return evidenceItems().filter(function (i) { return ids.indexOf(i.id) >= 0; }); }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-act="ev-fill"]')) {
      var step = steps[currentStepIndex], qi = step.questions.findIndex(function (q) { return /bewijslast/.test(q); });
      var list = chosenEvidence();
      if (!list.length) { kmaToast('Kies eerst een of meer items', 'error'); return; }
      setAnswer(qi, list.map(function (i) { return '• ' + i.kind + ': ' + String(i.label).slice(0, 120); }).join('\n'));
      kmaToast('Bewijs toegevoegd aan je antwoord');
    }
    if (e.target.closest('[data-act="summary"]')) showSummary();
    if (e.target.closest('[data-act="sum-close"]')) { var s = document.querySelector('.kma-summary'); if (s) s.remove(); document.body.classList.remove('kma-print-summary'); }
    if (e.target.closest('[data-act="sum-print"]')) { document.body.classList.add('kma-print-summary'); window.print(); }
  });
  function showSummary() {
    var st = steps[byWidget('beoordeling-prep')], sm = steps[byTitle(/SMART/)], a = function (q) { return answers[q] || ''; };
    var s = selfScores(), an = H && hexDone() ? H.analyse(s, null) : null, sc = answers['gedragscode-scores'] || {};
    var name = answers['Voornaam & Achternaam:'] || 'Cadet';
    var div = document.createElement('div');
    div.className = 'kma-summary';
    var fa = fitAlert(), logs = fitnessLogs.slice().sort(function (x, y) { return String(x.date).localeCompare(String(y.date)); }).slice(-5);
    var avg = function (k) { return logs.length ? Math.round(logs.reduce(function (t, l) { return t + Number(l[k]); }, 0) / logs.length * 10) / 10 : '-'; };
    div.innerHTML = '<div class="kma-summary-page"><div class="kma-summary-tools"><button type="button" class="kma-icon-btn" data-act="sum-close">' + icon('x') + 'Sluiten</button><button type="button" class="kma-icon-btn is-primary" data-act="sum-print">' + icon('print') + 'PDF / afdrukken</button></div>' +
      '<h2>Gesprekssamenvatting</h2><p class="muted">' + esc(name) + ' · ' + fmtDate(today()) + '</p>' +
      '<h3>Leerpunten en gegroeide kwaliteiten</h3><p>' + esc(a(st.questions[0]) || '-').replace(/\n/g, '<br>') + '</p>' +
      '<h3>Bewijs</h3>' + (chosenEvidence().length ? '<ul>' + chosenEvidence().map(function (i) { return '<li><strong>' + i.kind + ':</strong> ' + esc(i.label) + ' <span class="muted">' + esc(i.hint) + '</span></li>'; }).join('') + '</ul>' : '<p>-</p>') +
      '<h3>Mijn SMART-leervraag</h3><p>' + (smartParts(sm).some(Boolean) ? smartSentence(sm).replace(/<span class="ph">[^<]*<\/span>/g, '…').replace(/…\./g, '…') : 'Nog niet ingevuld') + '</p>' +
      (window.KMAPatterns && getX('smart-checkins', []).length ? '<h3>Check-ins leervraag</h3>' + KMAPatterns.checkinStrip(getX('smart-checkins', []), 8) : '') +
      (window.KMAPatterns && KMAPatterns.signals(dtfItems).length ? '<h3>Patronen in mijn gedrag</h3><ul>' + KMAPatterns.signals(dtfItems).map(function (x) { return '<li>' + esc(x.text) + '</li>'; }).join('') + '</ul>' : '') +
      '<h3>De 4 V\'s: eigen score</h3><p>' + VS.map(function (v) { return v + ': <strong>' + (sc[v.toLowerCase()] || '-') + '</strong>'; }).join(' · ') + '</p>' +
      (an ? '<h3>Persoonlijkheid</h3><p>Hoogst: ' + esc(an.highest.name) + ' (' + s[an.highest.key] + '%) · Laagst: ' + esc(an.lowest.name) + ' (' + s[an.lowest.key] + '%)</p>' : '') +
      (isShared(FIT_TITLE) && pssLast() ? '<h3>Ervaren stress (PSS-10)</h3><p>' + PSS.total(pssLast().a) + ' van ' + PSS.MAX + ', ' + PSS.band(PSS.total(pssLast().a)).label.toLowerCase() + ' (' + fmtDate(pssLast().date) + ')</p>' : '') +
      (isShared(FIT_TITLE) && logs.length ? '<h3>Fitheid (laatste ' + logs.length + ' metingen)</h3><p>Slaap ' + avg('sleep') + ' · Fysiek ' + avg('body') + ' · Mentaal ' + avg('mind') + (fa ? '<br><strong>' + fa + '</strong>' : '') + '</p>' : '') +
      '<h3>Mijn hulpvraag</h3><p>' + esc(a(st.questions[2]) || '-').replace(/\n/g, '<br>') + '</p>' +
      '<h3>Afspraken met de teamleider</h3><p class="kma-summary-blank">' + esc(a(st.questions[3]) || '').replace(/\n/g, '<br>') + '</p></div>';
    document.body.appendChild(div);
  }

  /* ======================= 14. Mijn groei & ontwikkeling ======================= */
  var VCOL = { Verbondenheid: '#c79a2a', Veiligheid: '#3f7cac', Vertrouwen: '#2f9e5b', Verantwoordelijkheid: '#a91f2b' };
  function isoDay(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function idDate(id) { var t = Number(id); return t > 1.5e12 && t <= Date.now() + 864e5 ? isoDay(new Date(t)) : ''; }
  function weekDate(w) { var m = /^(\d{4})-W(\d{2})$/.exec(w || ''); if (!m) return ''; var d = new Date(+m[1], 0, 4); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + (m[2] - 1) * 7); return isoDay(d); }
  function monthLabel(ym) { var m = /^(\d{4})-(\d{2})/.exec(ym); return m ? ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][m[2] - 1] + ' ' + m[1].slice(2) : ym; }
  /* Snapshots so the growth over time can be shown */
  function snapSelf() {
    var f = kmaOfficialSelfForm; if (!f || f.totalScore == null) return;
    var h = getX('self-history', []), day = today(), e = { date: day, total: f.totalScore, eind: f.eindoordeel || '', v: VS.map(function (v, i) { var n = i + 1; return [Number(f['v' + n + '_n1_score']), Number(f['v' + n + '_n2_score'])]; }) };
    h = h.filter(function (x) { return x && x.date !== day; }); h.push(e); h.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    setX('self-history', h.slice(-60));
  }
  if (typeof window.saveKMASelfForm === 'function') {
    var origSaveSelf = window.saveKMASelfForm;
    window.saveKMASelfForm = function () { var r = origSaveSelf.apply(this, arguments); try { snapSelf(); } catch (e) {} return r; };
  }
  function snapV4() {
    var sc = answers['gedragscode-scores'] || {}; if (!VS.some(function (v) { return sc[v.toLowerCase()]; })) return;
    var h = getX('v4-history', []), day = today();
    h = h.filter(function (x) { return x && x.date !== day; }); h.push({ date: day, s: VS.map(function (v) { return Number(sc[v.toLowerCase()]) || null; }) });
    h.sort(function (a, b) { return a.date < b.date ? -1 : 1; }); setX('v4-history', h.slice(-60));
  }
  if (typeof window.updateGedragscodeScore === 'function') {
    var origV4 = window.updateGedragscodeScore, v4t = null;
    window.updateGedragscodeScore = function () { var r = origV4.apply(this, arguments); clearTimeout(v4t); v4t = setTimeout(function () { try { snapV4(); } catch (e) {} }, 800); return r; };
  }
  /** Everything that says something about growth, in date order. */
  window.kmaGroeiData = function () { return groeiData(); };   // 4.26.0: voor het onderzoek (kma-boek-onderzoek.js)
  function groeiData() {
    if (!getX('self-history', []).length) try { snapSelf(); } catch (e) {}
    if (!getX('v4-history', []).length) try { snapV4(); } catch (e) {}
    var ev = [], tl = [];
    var rec = (window.kmaFeedback && kmaFeedback.all ? kmaFeedback.all() : []).filter(function (r) { return r && r.form && r.form.v === 2 && r.form.totals; });
    var seenB = {};
    rec.forEach(function (r) {
      var f = r.form, d = /^\d{4}-\d{2}-\d{2}/.test(f.datumGesprek || '') ? f.datumGesprek.slice(0, 10) : String(r.date || '').slice(0, 10), k = d + '|' + JSON.stringify(f.totals);
      if (seenB[k]) return; seenB[k] = 1;
      var vals = VS.map(function (v, i) { var t = f.totals['v' + (i + 1)]; return t === '' || t == null || t === 'NTB' ? null : Number(t); });
      tl.push({ date: d, vals: vals, by: f.beoordelaar || r.from || '', oordeel: f.totaaloordeel || '' });
      ev.push({ date: d, kind: 'beoordeling', icon: 'form', title: 'Beoordeling door ' + (f.beoordelaar || r.from || 'je teamleider'), text: VS.map(function (v, i) { return v + ' ' + (f.totals['v' + (i + 1)] || '-'); }).join(' · ') + (f.totaaloordeel ? ' · ' + f.totaaloordeel : '') });
    });
    tl.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var self = getX('self-history', []).map(function (h) { return { date: h.date, vals: (h.v || []).map(function (p) { return p && p.length ? Math.round((Number(p[0] || 0) + Number(p[1] || 0)) / 2 * 10) / 10 : null; }), total: h.total, eind: h.eind }; });
    self.forEach(function (s) { ev.push({ date: s.date, kind: 'zelf', icon: 'edit', title: 'Zelfbeoordeling', text: 'Totaal ' + s.total + '/16' + (s.eind ? ' · ' + s.eind : '') }); });
    var v4 = getX('v4-history', []);
    var g5 = cases5GT.filter(function (c) { return c && G.anyFilled(c); });
    g5.forEach(function (c) {
      var d = idDate(c.id); if (!d) return;
      var a = c.d_geloof, b = c.d_geloofNa, drop = a !== '' && a != null && b !== '' && b != null ? Number(a) - Number(b) : null;
      ev.push({ date: d, kind: '5gt', icon: 'refresh', title: '5G-T: ' + (c.title || 'reflectie'), text: drop != null ? (drop > 0 ? 'Geloof in de gedachte ' + drop + ' procentpunt lager na reflectie' : 'Geloof in de gedachte gelijk gebleven') : (c.t_toepassen ? 'Toekomst: ' + String(c.t_toepassen).slice(0, 90) : ''), drop: drop });
    });
    casesKorthagen.filter(function (c) { return c && (c.actie || c.uitproberen); }).forEach(function (c) {
      var d = idDate(c.id); if (d) ev.push({ date: d, kind: 'kort', icon: 'refresh', title: 'Korthagen: ' + (c.title || 'reflectie'), text: c.uitproberen ? 'Uitproberen: ' + String(c.uitproberen).slice(0, 90) : '' });
    });
    getX('smart-checkins', []).forEach(function (x) { var d = weekDate(x.week); if (d) ev.push({ date: d, kind: 'checkin', icon: 'target', title: 'Check-in leervraag', text: ['Niet gelukt', 'Deels gelukt', 'Gelukt'][x.r] + (x.note ? ': ' + x.note : ''), r: x.r }); });
    dtfItems.forEach(function (d) { if (!d || !/^\d{4}-\d{2}-\d{2}/.test(d.datum || '')) return; var t = String(d.feit || '').replace(/\s+/g, ' ').trim(); ev.push({ date: d.datum.slice(0, 10), kind: 'dtf', icon: 'calendar', title: 'DTF' + (d.teken === '+' ? ' (positief)' : d.teken === '-' ? ' (negatief)' : '') + ': ' + (t.length > 60 ? t.slice(0, 58) + '…' : t), text: t + ((d.vValues || []).length ? ' · ' + d.vValues.join(', ') : ''), teken: d.teken }); });
    var months = {};
    dtfItems.forEach(function (d) { var m = String(d.datum || '').slice(0, 7); if (!/^\d{4}-\d{2}$/.test(m)) return; months[m] = months[m] || { pos: 0, neg: 0, neu: 0 }; months[m][d.teken === '+' ? 'pos' : d.teken === '-' ? 'neg' : 'neu']++; });
    var latest = window.kmaFeedback && kmaFeedback.latest ? kmaFeedback.latest() : null;
    (latest && latest.plans || []).forEach(function (p) { var d = String(p.updatedAt || '').slice(0, 10); if (d) ev.push({ date: d, kind: 'plan', icon: 'target', title: (p.type === 'verbeter' ? 'Verbeterplan: ' : 'Ontwikkelplan: ') + (p.title || ''), text: p.doel ? String(p.doel).slice(0, 100) : '' }); });
    ev.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var drops = g5.map(function (c) { var a = c.d_geloof, b = c.d_geloofNa; return a !== '' && a != null && b !== '' && b != null ? Number(a) - Number(b) : null; }).filter(function (x) { return x != null; });
    return { tl: tl, self: self, v4: v4, ev: ev, months: months, g5: g5.length, ko: casesKorthagen.filter(function (c) { return c && (c.actie || c.uitproberen); }).length, drops: drops };
  }
  /** Per V: zelfbeoordeling and teamleider over time (0-2). */
  function groeiV(g) {
    var dates = g.self.map(function (s) { return s.date; }).concat(g.tl.map(function (t) { return t.date; })).filter(function (d, i, a) { return d && a.indexOf(d) === i; }).sort();
    if (!dates.length) return '';
    var at = function (list, d, i) { var e = list.find(function (x) { return x.date === d; }); return e && e.vals[i] != null && !isNaN(e.vals[i]) ? e.vals[i] : null; };
    var lab = dates.map(function (d) { return fmtDate(d).replace(/ \d{4}$/, ''); });
    return '<div class="kma-groei-vgrid">' + VS.map(function (v, i) {
      var sz = dates.map(function (d) { return at(g.self, d, i); }), st = dates.map(function (d) { return at(g.tl, d, i); });
      var series = [{ label: 'Zelf', color: '#9aa39a', values: sz }, { label: 'Teamleider', color: VCOL[v], values: st }];
      var last = st.filter(function (x) { return x != null; }), first = last[0], now = last[last.length - 1];
      var trend = last.length > 1 ? (now > first ? '<em class="up">▲ gegroeid</em>' : now < first ? '<em class="down">▼ lager</em>' : '<em>= gelijk</em>') : '';
      return '<div class="kma-groei-v"><div class="kma-groei-vh">' + (window.kmaVIcon ? kmaVIcon(v) || '' : '') + '<strong>' + esc(v) + '</strong>' + trend + '</div>' +
        V.lineChart(lab, series, { yMin: 0, yMax: 2, ticks: [0, 1, 2], label: v + ' over tijd', dot: 4, connect: true }) + '</div>';
    }).join('') + '</div>' + V.legend([{ label: 'Zelfbeoordeling', color: '#9aa39a' }, { label: 'Beoordeling teamleider', color: '#c79a2a' }]) +
      '<p class="muted small">0 = onvoldoende · 1 = voldoende (norm) · 2 = goed</p>';
  }
  function groeiDtf(g) {
    var keys = Object.keys(g.months).sort().slice(-8); if (!keys.length) return '';
    var W = 340, H = 150, L = 24, B = 26, T = 10, max = Math.max.apply(null, keys.map(function (k) { var m = g.months[k]; return m.pos + m.neg + m.neu; }).concat([1]));
    var bw = Math.min(30, (W - L - 10) / keys.length - 8), out = '';
    keys.forEach(function (k, i) {
      var m = g.months[k], x = L + 6 + i * ((W - L - 10) / keys.length), y = H - B, sc = (H - B - T) / max;
      [['pos', '#2f9e5b'], ['neu', '#b9b5a8'], ['neg', '#c8463a']].forEach(function (p) {
        var h = m[p[0]] * sc; if (!h) return; y -= h;
        out += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="3" fill="' + p[1] + '"><title>' + monthLabel(k) + ': ' + m[p[0]] + ' ' + ({ pos: 'positief', neg: 'negatief', neu: 'zonder teken' })[p[0]] + '</title></rect>';
      });
      out += '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle" font-size="10" fill="currentColor" fill-opacity="0.6">' + monthLabel(k) + '</text>';
    });
    return '<svg class="kv" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="DTF-feiten per maand">' + out + '</svg>' +
      V.legend([{ label: 'Positief', color: '#2f9e5b' }, { label: 'Negatief', color: '#c8463a' }, { label: 'Zonder teken', color: '#b9b5a8' }]);
  }
  function groeiTiles(g) {
    var pos = 0, neg = 0; Object.keys(g.months).forEach(function (k) { pos += g.months[k].pos; neg += g.months[k].neg; });
    var avg = g.drops.length ? Math.round(g.drops.reduce(function (a, b) { return a + b; }, 0) / g.drops.length) : null;
    var t = function (n, l, sub) { return '<div class="kma-groei-tile"><strong>' + n + '</strong><span>' + l + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>'; };
    return '<div class="kma-groei-tiles">' + t(g.tl.length, g.tl.length === 1 ? 'beoordeling teamleider' : 'beoordelingen teamleider', g.self.length ? '+ ' + g.self.length + ' zelfbeoordeling' + (g.self.length === 1 ? '' : 'en') : '') + t(g.g5 + g.ko, g.g5 + g.ko === 1 ? 'reflectie' : 'reflecties', avg != null ? '−' + avg + ' pp geloof' : '') +
      t(dtfItems.length, 'DTF-feiten', pos || neg ? pos + ' + · ' + neg + ' −' : '') + (function (n) { return t(n, n === 1 ? 'check-in gelukt' : 'check-ins gelukt', ''); })(getX('smart-checkins', []).filter(function (x) { return x.r === 2; }).length) + '</div>';
  }
  var groeiSoort = 'alles', SOORT = { dtf: ['dtf'], refl: ['5gt', 'kort'], leer: ['checkin', 'plan'], beo: ['beoordeling', 'zelf'] };
  function groeiTimeline(g) {
    if (!g.ev.length) return kmaEmpty({ icon: 'activity', title: 'Nog geen momenten', text: 'Maak een zelfbeoordeling, een reflectie of een DTF-feit; ze verschijnen hier op datum.', btn: 'DTF-feit vastleggen', attrs: 'data-empty-step="dtf-logbook"' });
    var ev = groeiSoort === 'alles' ? g.ev : g.ev.filter(function (e) { return SOORT[groeiSoort].indexOf(e.kind) >= 0; });
    var chips = '<div class="kma-chips kma-filter">' + (window.KMALijst ? KMALijst.chips('data-groeis', [['alles', 'Alles'], ['dtf', 'DTF-feiten'], ['refl', 'Reflecties'], ['leer', 'Leervraag en plannen'], ['beo', 'Beoordelingen']], groeiSoort) : '') + '</div>';
    if (!window.KMALijst) return chips + '<div class="kma-groei-line">' + ev.slice(0, 60).map(function (e) { return '<div class="kma-groei-ev ' + e.kind + '"><i>' + icon(e.icon) + '</i><div><small>' + esc(fmtDate(e.date)) + '</small><strong>' + esc(e.title) + '</strong>' + (e.text ? '<p>' + esc(e.text) + '</p>' : '') + '</div></div>'; }).join('') + '</div>';
    return chips + (ev.length ? KMALijst.render('groei', ev, { key: groeiSoort, date: function (e) { return e.date; }, row: function (e) {
      return { cls: e.kind + (e.teken === '+' ? ' pos' : e.teken === '-' ? ' neg' : ''), when: esc(fmtDate(e.date).replace(/ \d{4}$/, '')), title: '<i class="kma-kl-ic">' + icon(e.icon) + '</i> ' + esc(e.title), body: e.text ? '<p>' + esc(e.text) + '</p>' : '<p class="muted small">Geen toelichting.</p>' };
    } }) : '<p class="muted">Niets in deze categorie.</p>');
  }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-groeis]'); if (!b) return; groeiSoort = b.getAttribute('data-groeis'); var c = document.getElementById('kma-groei-tl'); if (c) c.innerHTML = groeiTimeline(groeiData()); });

  /* ---------------- 4.23.0 (P8): één leerlijn per opleidingsjaar ----------------
     "Dit wilde ik, dit deed ik, dit zagen anderen" en de beoordeling, per V naast elkaar. Opleidingsjaar = 1 september
     t/m 31 augustus. Alleen gegevens die al in het boekje staan; er wordt niets nieuws opgeslagen. */
  function ojaar(d) { var m = /^(\d{4})-(\d{2})/.exec(d || ''); return m ? (Number(m[2]) >= 9 ? Number(m[1]) : Number(m[1]) - 1) : null; }
  function ojaarLabel(y) { return y + '-' + (y + 1); }
  var leerJaar = null;
  function leerlijnData(y) {
    var inJ = function (d) { return ojaar(String(d || '').slice(0, 10)) === y; };
    var D = window.KMADatapunten, g = groeiData();
    var eigen = dtfItems.filter(function (d) { return d && d.bron !== 'medecadet' && inJ(d.datum); });
    var nab = eigen.filter(function (d) { return d.aar || d.aspect === 'Nabespreking na een oefening'; }).length;
    var mede = [], staf = [];
    try { mede = (window.kmaKameraad ? kmaKameraad._S().inbox || [] : []).filter(function (c) { return c && inJ(c.datum || c.at); }); } catch (e) {}
    try { (window.kmaFeedback ? kmaFeedback.all() : []).forEach(function (r) { (r.dtfNotes || []).forEach(function (n) { if (n && inJ(n.datum) && !staf.some(function (x) { return String(x.id) === String(n.id); })) staf.push(n); }); }); } catch (e) {}
    var perV = VS.map(function (v) {
      var heeft = function (x) { var p = D ? D.vanDtf(x) : null; return p && p.v.indexOf(v) >= 0; };
      var mV = mede.filter(function (c) { return c.v4 === v; }).length + dtfItems.filter(function (d) { return d && d.bron === 'medecadet' && inJ(d.datum) && heeft(d) && !mede.some(function (c) { return String(c.feit || '') && String(d.feit || '').indexOf(String(c.feit)) >= 0; }); }).length;
      return { v: v, zelf: eigen.filter(heeft).length, anderen: mV + staf.filter(heeft).length };
    });
    var tl = g.tl.filter(function (t) { return inJ(t.date); }), self = g.self.filter(function (t) { return inJ(t.date); });
    var ci = getX('smart-checkins', []).filter(function (x) { return inJ(weekDate(x.week)); });
    var plannen = window.kmaPlannen ? kmaPlannen.list() : [];
    return { eigen: eigen.length, nab: nab, mede: mede.length, staf: staf.length, perV: perV, tl: tl[tl.length - 1] || null, self: self[self.length - 1] || null,
      ci: ci.length, ciOk: ci.filter(function (x) { return x.r === 2; }).length, plannen: plannen };
  }
  function leerlijnHtml() {
    var jaren = {};
    dtfItems.forEach(function (d) { var y = d && ojaar(d.datum); if (y) jaren[y] = 1; });
    (groeiData().tl || []).forEach(function (t) { var y = ojaar(t.date); if (y) jaren[y] = 1; });
    var nu = ojaar(today()); jaren[nu] = 1;
    var lijst = Object.keys(jaren).map(Number).sort(function (a, b) { return b - a; });
    if (leerJaar == null || lijst.indexOf(leerJaar) < 0) leerJaar = nu;
    var L = leerlijnData(leerJaar), stp = steps[byTitle(/SMART/)];
    var vraag = '';
    try { vraag = stp && smartParts(stp)[0] ? smartSentence(stp) : ''; } catch (e) {}   // HTML: smartSentence escapet zelf
    var chips = lijst.length > 1 ? '<div class="kma-chips kma-filter">' + lijst.map(function (y) { return '<button type="button" class="kma-chip-btn' + (y === leerJaar ? ' on' : '') + '" data-leerjaar="' + y + '" aria-pressed="' + (y === leerJaar) + '">' + ojaarLabel(y) + '</button>'; }).join('') + '</div>' : '<p class="muted small">Opleidingsjaar ' + ojaarLabel(leerJaar) + '</p>';
    var plan = L.plannen.length ? '<ul class="plain small">' + L.plannen.map(function (p) { var st = kmaPlannen.stats ? kmaPlannen.stats(p.id) : null; return '<li>Als ' + esc(String(p.als).replace(/^als\s+/i, '')) + ', dan ' + esc(String(p.dan).replace(/^dan\s+/i, '')) + (st && st.n ? ' <span class="muted">(' + st.gelukt + ' van ' + st.n + ' weken gelukt)</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted small">Nog geen als-dan-plan.</p>';
    var beo = function (r, i) { return r && r.vals && r.vals[i] != null ? String(r.vals[i]) : '-'; };
    var tab = '<div class="kma-dp" tabindex="0" role="region" aria-label="Leerlijn per V"><table class="kma-dp-tab"><thead><tr><th>V</th><th>Ik deed (DTF)</th><th>Anderen zagen</th><th>Zelf</th><th>Teamleider</th></tr></thead><tbody>' +
      L.perV.map(function (r, i) { return '<tr><th scope="row">' + r.v + '</th><td>' + r.zelf + '</td><td>' + r.anderen + '</td><td>' + beo(L.self, i) + '</td><td>' + beo(L.tl, i) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return chips +
      '<div class="kma-leerlijn"><div><h5>' + icon('target') + 'Dit wilde ik</h5>' + (vraag ? '<p class="small kma-leerlijn-vraag">' + vraag + '</p>' : '<p class="muted small">Nog geen leervraag (hoofdstuk SMART-leervraag).</p>') + plan + '</div>' +
      '<div><h5>' + icon('calendar') + 'Dit deed ik</h5><p class="small">' + L.eigen + ' DTF-feiten, waarvan ' + L.nab + ' nabespreking' + (L.nab === 1 ? '' : 'en') + (L.ci ? '. Leervraag: ' + L.ciOk + ' van ' + L.ci + ' weken gelukt' : '') + '.</p></div>' +
      '<div><h5>' + icon('users') + 'Dit zagen anderen</h5><p class="small">' + L.mede + ' feedbackkaart' + (L.mede === 1 ? '' : 'en') + ' van medecadetten, ' + L.staf + ' waarneming' + (L.staf === 1 ? '' : 'en') + ' van je teamleider of instructeurs.</p></div>' +
      '<div><h5>' + icon('form') + 'Beoordeling</h5><p class="small">' + (L.tl ? 'Teamleider ' + esc(fmtDate(L.tl.date)) + (L.tl.oordeel ? ': ' + esc(L.tl.oordeel) : '') : 'Nog geen beoordeling van je teamleider dit jaar') + (L.self ? '. Zelfbeoordeling ' + esc(fmtDate(L.self.date)) : '') + '.</p></div></div>' +
      tab + '<p class="muted small">Per V naast elkaar: wat je zelf vastlegde, wat anderen zagen en hoe jij en je teamleider het beoordeelden. Zie je een V met veel eigen feiten maar weinig van anderen, vraag dan feedback op die V.</p>';
  }

  /* ---------------- 4.27.0 (M9): de hele opleiding, jaar na jaar ----------------
     Leiderschapsontwikkeling verloopt over jaren (Day e.a. 2014). Per opleidingsjaar: datapunten per V (zelf en
     anderen), de gemiddelde plek op de roos (zelf en anderen) en de mijlpalen (beoordelingen, nabesprekingen).
     De pijl vergelijkt met het jaar ervoor. */
  function opleidingData() {
    var jaren = {}, nu = ojaar(today()); jaren[nu] = 1;
    dtfItems.forEach(function (d) { var y = d && ojaar(d.datum); if (y) jaren[y] = 1; });
    (groeiData().tl || []).forEach(function (t) { var y = ojaar(t.date); if (y) jaren[y] = 1; });
    var L = window.KMALeary, gem = function (l, k) { return l.length ? Math.round(l.reduce(function (a, x) { return a + x[k]; }, 0) / l.length * 10) / 10 : null; };
    return Object.keys(jaren).map(Number).sort(function (a, b) { return a - b; }).map(function (y) {
      var inJ = function (d) { return ojaar(String(d || '').slice(0, 10)) === y; }, D = leerlijnData(y);
      var zelf = [], anderen = [];
      if (L) {
        dtfItems.forEach(function (d) { if (!d || !inJ(d.datum)) return; var a = L.clean(d.leary); if (a) (d.bron === 'medecadet' ? anderen : zelf).push(a); var b = L.clean(d.learyAnder); if (b) anderen.push(b); });
        try { (window.kmaKameraad ? kmaKameraad._S().inbox || [] : []).forEach(function (c) { var a = c && inJ(c.datum || c.at) && L.clean(c.leary); if (a) anderen.push(a); }); } catch (e) {}
        try { (window.kmaFeedback ? kmaFeedback.all() : []).forEach(function (r) { (r.dtfNotes || []).forEach(function (n) { var a = n && inJ(n.datum) && L.clean(n.leary); if (a) anderen.push(a); }); }); } catch (e) {}
      }
      return { y: y, D: D, zb: gem(zelf, 'b'), zs: gem(zelf, 's'), ab: gem(anderen, 'b'), as: gem(anderen, 's'), nz: zelf.length, na: anderen.length };
    });
  }
  function opleidingHtml() {
    var J = opleidingData();
    var pijl = function (a, b) { return a == null || b == null ? '' : b > a + 0.2 ? ' <span class="kma-up" title="hoger dan het jaar ervoor">▲</span>' : b < a - 0.2 ? ' <span class="kma-down" title="lager dan het jaar ervoor">▼</span>' : ''; };
    var getal = function (x) { return x == null ? '–' : String(x).replace('.', ','); };
    var kop = '<tr><th scope="col">Opleidingsjaar</th>' + J.map(function (j) { return '<th scope="col">' + ojaarLabel(j.y) + '</th>'; }).join('') + '</tr>';
    var rij = function (label, f) { return '<tr><th scope="row">' + label + '</th>' + J.map(function (j, i) { return '<td>' + f(j, i ? J[i - 1] : null) + '</td>'; }).join('') + '</tr>'; };
    var tab = '<div class="kma-dp" tabindex="0" role="region" aria-label="Groei over de hele opleiding"><table class="kma-dp-tab"><thead>' + kop + '</thead><tbody>' +
      VS.map(function (v, k) { return rij(v + ' <small class="muted">(zelf / anderen)</small>', function (j, p) { var r = j.D.perV[k]; return r.zelf + ' / ' + r.anderen + (p ? pijl(p.D.perV[k].zelf + p.D.perV[k].anderen, r.zelf + r.anderen) : ''); }); }).join('') +
      rij('Dominantie <small class="muted">(zelf / anderen)</small>', function (j, p) { return getal(j.zb) + ' / ' + getal(j.ab) + (p ? pijl(p.ab, j.ab) : ''); }) +
      rij('Affiliatie <small class="muted">(zelf / anderen)</small>', function (j, p) { return getal(j.zs) + ' / ' + getal(j.as) + (p ? pijl(p.as, j.as) : ''); }) +
      rij('Beoordeling teamleider', function (j) { return j.D.tl ? esc(fmtDate(j.D.tl.date)) + (j.D.tl.oordeel ? '<br><small>' + esc(j.D.tl.oordeel) + '</small>' : '') : '–'; }) +
      rij('Nabesprekingen', function (j) { return String(j.D.nab); }) +
      rij('Leervraag gelukt', function (j) { return j.D.ci ? j.D.ciOk + ' van ' + j.D.ci + ' weken' : '–'; }) +
      '</tbody></table></div>';
    return (J.length < 2 ? '<p class="muted small">Dit is je eerste opleidingsjaar in het boekje. Volgend jaar zie je hier naast elkaar hoe je per V en op de roos van Leary groeit.</p>' : '') + tab +
      '<p class="muted small">Dominantie en affiliatie: gemiddelde plek op de roos van Leary (−2 tot +2), uit je eigen DTF-feiten en uit wat medecadetten en je teamleider zagen. ▲ en ▼ vergelijken met het jaar ervoor.</p>';
  }
  window.kmaOpleidingData = opleidingData;

  /* ---------------- 4.23.0 (P10): wat doe je met feedback? ---------------- */
  function feedbackKwaliteit() {
    var inbox = []; try { inbox = window.kmaKameraad ? kmaKameraad._S().inbox || [] : []; } catch (e) {}
    var n = inbox.length, tip = inbox.filter(function (c) { return String(c.tip || '').trim(); }).length, actie = inbox.filter(function (c) { return String(c.actie || '').trim(); }).length;
    var plannen = (window.kmaPlannen ? kmaPlannen.list() : []).filter(function (p) { return /feedback|roos|nabespreking/.test(p.from || ''); }).length;
    var rep = {}; try { rep = JSON.parse(kmaStore.getItem('kma-x-fb-reply') || '{}') || {}; } catch (e) {}
    var rk = Object.keys(rep), ok = rk.filter(function (k) { return rep[k] && rep[k].ok; }).length, rt = rk.filter(function (k) { return rep[k] && rep[k].t; }).length;
    return { n: n, tip: tip, actie: actie, plannen: plannen, ok: ok, rt: rt };
  }
  function pct(a, b) { return b ? Math.round(a / b * 100) + '%' : '-'; }
  function feedbackKwaliteitHtml() {
    var k = feedbackKwaliteit();
    if (!k.n && !k.ok && !k.rt) return '<p class="muted small">Nog geen feedback ontvangen. Vraag een medecadet om feedback (menu ⋮ → Feedback van medecadetten).</p>';
    var bar = function (label, a, b, uitleg) { var p = b ? Math.round(a / b * 100) : 0; return '<div class="kma-fbq"><div class="kma-fbq-top"><span>' + label + '</span><b>' + a + ' van ' + b + ' (' + pct(a, b) + ')</b></div><i><b style="width:' + p + '%"></b></i>' + (uitleg ? '<small class="muted">' + uitleg + '</small>' : '') + '</div>'; };
    return (k.n ? bar('Kaarten met een volgende stap', k.tip, k.n, 'Feedback met een concrete volgende stap helpt het meest.') +
        bar('Kaarten waar jij een actie bij schreef', k.actie, k.n, k.actie < k.n ? 'Schrijf bij elke kaart wat je ermee gaat doen; zonder die stap verandert er weinig.' : 'Bij elke kaart weet je wat je ermee doet.') : '') +
      '<p class="small">' + (k.plannen ? k.plannen + ' als-dan-plan' + (k.plannen === 1 ? '' : 'nen') + ' kwam' + (k.plannen === 1 ? '' : 'en') + ' uit feedback of een nabespreking. ' : '') +
      (k.ok || k.rt ? 'Feedback van je teamleider: ' + k.ok + ' keer verwerkt, ' + k.rt + ' keer gereageerd.' : '') + '</p>';
  }
  window.kmaFeedbackKwaliteit = feedbackKwaliteit;
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-leerjaar]'); if (!b) return; leerJaar = Number(b.getAttribute('data-leerjaar')); var c = document.getElementById('kma-leerlijn'); if (c) c.innerHTML = leerlijnHtml(); });

  /* ---------------- 4.25.0 (R6): reflectieopdracht Afscheidsspeech (leertaak Ref 17) ----------------
     Een speech die een ander over jou zou houden bij het einde van je opleiding. Bouwstenen uit het boekje: hoogtepunten
     uit je levenslijn, wat medecadetten bij "vasthouden" schreven, je sterkten op de roos en je leerlijn. Opslag:
     kma-x-afscheidsspeech = { tekst, at }. Gaat mee met het portfolio niet automatisch: de cadet kopieert of deelt zelf. */
  function speechBouwstenen() {
    var out = [];
    try {
      var hoog = (typeof timelineItems !== 'undefined' ? timelineItems : []).filter(function (t) { return t && Number(t.score) > 0 && (t.title || t.text); })
        .sort(function (a, b) { return Number(b.score) - Number(a.score); }).slice(0, 3);
      if (hoog.length) out.push(['Hoogtepunten uit je levenslijn', hoog.map(function (t) { return (t.year ? t.year + ': ' : '') + (t.title || t.text); })]);
    } catch (e) {}
    try {
      var vh = (window.kmaKameraad ? kmaKameraad._S().inbox || [] : []).filter(function (c) { return c && c.soort !== 'verbeteren' && c.feit; }).slice(-4);
      if (vh.length) out.push(['Wat medecadetten zagen (vasthouden)', vh.map(function (c) { return String(c.feit).replace(/\s+/g, ' ').slice(0, 140); })]);
    } catch (e) {}
    try {
      var L = window.KMALeary, d = L ? L.dist(dtfItems.filter(function (x) { return x && L.clean(x.leary); })) : null;
      if (d && d.n) { var top = L.SECT.slice().sort(function (a, b) { return d.counts[b.k] - d.counts[a.k]; }).filter(function (x) { return d.counts[x.k]; }).slice(0, 2); out.push(['Je gedrag op de roos', top.map(function (x) { return x.n + ': ' + x.d; })]); }
    } catch (e) {}
    try { var stp = steps[byTitle(/SMART/)], p = stp ? smartParts(stp)[0] : ''; if (p) out.push(['Waar je aan werkte', [p]]); } catch (e) {}
    return out;
  }
  function speechHtml() {
    var sp = getX('afscheidsspeech', null), b = speechBouwstenen();
    return '<p class="small">Aan het eind van je opleiding schrijf je een speech die iemand anders over jou zou kunnen houden: een medecadet of iemand van het kader. Begin met de eigenschappen waarmee je graag herinnerd wilt worden. Wat zou diegene echt vertellen, en wat zou hij idealiter vertellen?</p>' +
      (b.length ? '<details class="kma-ex"><summary>' + icon('idea') + 'Bouwstenen uit je boekje</summary>' + b.map(function (x) { return '<p class="small"><b>' + esc(x[0]) + '</b></p><ul class="plain small">' + x[1].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; }).join('') + '</details>' : '') +
      '<label class="kma-field"><span class="sr-only">Je afscheidsspeech</span><textarea id="kma-speech" rows="8" maxlength="6000" placeholder="Beste collega\'s, vandaag nemen we afscheid van …">' + esc(sp && sp.tekst || '') + '</textarea></label>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-speech="opslaan">' + icon('save') + 'Opslaan</button><button type="button" class="kma-icon-btn" data-speech="delen">' + icon('share') + 'Delen</button></div>' +
      (sp && sp.at ? '<p class="muted small">Laatst opgeslagen ' + esc(fmtDate(String(sp.at).slice(0, 10))) + '.</p>' : '') + (window.kmaLeertaak ? kmaLeertaak.labels(['Ref 17']) : '');
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-speech]'); if (!b) return;
    var t = (document.getElementById('kma-speech') || {}).value || '';
    if (b.getAttribute('data-speech') === 'opslaan') { setX('afscheidsspeech', { tekst: t, at: new Date().toISOString() }); kmaToast('Speech opgeslagen'); return; }
    if (!t.trim()) { kmaToast('Schrijf eerst je speech', 'error'); return; }
    try { if (window.KMA_CAP && window.KMA_CAP.shareText) { window.KMA_CAP.shareText(t); return; } } catch (x) {}
    if (navigator.share) { navigator.share({ title: 'Afscheidsspeech', text: t }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(t).then(function () { kmaToast('Speech gekopieerd'); }); } catch (x) {}
  });
  /* 4.25.0 (R5, M6): de laatste weken van de weekcyclus (doel en weekevaluatie). */
  function weekHtml() {
    var W = window.kmaWeek; if (!W) return '';
    var a = W.alle(), ks = Object.keys(a).sort().reverse().slice(0, 6);
    var nu = '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-week="doel">' + icon('target') + 'Doel deze week</button><button type="button" class="kma-icon-btn" data-week="eva">' + icon('check') + 'Weekevaluatie</button></div>';
    if (!ks.length) return cardHtml('Weekcyclus', '<p class="muted small">Kies aan het begin van de week één doel, leg tijdens de week DTF-feiten vast en kijk aan het eind kort terug. Vandaag herinnert je eraan.</p>' + nu, 'calendar');
    var R2 = ['Niet gelukt', 'Deels gelukt', 'Gelukt'];
    return cardHtml('Weekcyclus', '<ul class="plain small kma-week-lijst">' + ks.map(function (k) { var w = a[k] || {}, e = w.eva || {}; return '<li><b>' + esc(k.replace('-W', ' week ')) + '</b>' + (w.doel ? ': ' + esc(w.doel) : '') + (e.r != null ? ' <span class="muted">(' + R2[e.r] + ')</span>' : '') + (e.mee ? '<br><span class="muted">Mee naar volgende week: ' + esc(e.mee) + '</span>' : '') + (!e.at ? ' <span class="muted">· nog geen evaluatie</span>' : '') + '</li>'; }).join('') + '</ul>' + nu, 'calendar');
  }
  document.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-week]'); if (!b || !window.kmaWeek) return; if (b.getAttribute('data-week') === 'doel') kmaWeek.doel(); else kmaWeek.evaluatie(); });
  R['groei'] = function (c) {
    var g = groeiData();
    c.innerHTML = groeiTiles(g) +
      cardHtml('Beoordelingen over tijd', groeiV(g) || '<p class="muted">Nog geen beoordelingen. Na je zelfbeoordeling (hoofdstuk Zelfbeoordelingsformulier) en de beoordeling van je teamleider zie je hier per V hoe je groeit.</p>', 'chart') +
      (g.v4.length > 1 ? cardHtml('Eigen score per V (1-10)', V.lineChart(g.v4.map(function (h) { return fmtDate(h.date).replace(/ \d{4}$/, ''); }), VS.map(function (v, i) { return { label: v, color: VCOL[v], values: g.v4.map(function (h) { return h.s[i]; }) }; }), { yMin: 0, yMax: 10, ticks: [0, 5, 10], label: 'Eigen score per V', connect: true }) + V.legend(VS.map(function (v) { return { label: v, color: VCOL[v] }; })), 'activity') : '') +
      (Object.keys(g.months).length ? cardHtml('DTF-feiten per maand', groeiDtf(g), 'calendar') : '') +
      cardHtml('Mijn leerlijn', '<div id="kma-leerlijn">' + leerlijnHtml() + '</div>', 'trend') +
      cardHtml('Over de hele opleiding', opleidingHtml(), 'flag') +
      cardHtml('Wat doe je met feedback?', feedbackKwaliteitHtml(), 'message') +
      weekHtml() +
      cardHtml('Afscheidsspeech', speechHtml(), 'message') +
      cardHtml('Jouw groei op een tijdlijn', '<div id="kma-groei-tl">' + groeiTimeline(g) + '</div>', 'activity');
  };
  window.kmaGroeiData = groeiData;

  /* ======================= 17. Roos van Leary (4.16.0) =======================
     Inzicht en uitleg op één plek (groep Naslag en overzicht). Bronnen:
     - zelf: DTF-feiten met een plek op de roos (niet die van een medecadet);
     - anderen: feedbackkaarten van medecadetten (inbox) en waarnemingen die de teamleider deelde (dtfNotes).
     Een verdeling verschijnt pas vanaf KMALeary.MIN items per bron. Geen koppeling met de 4V's in de gegevens. */
  var learyPer = 'alles';
  function learyData() {
    var L = window.KMALeary, since = window.kmaLaatsteGesprek ? kmaLaatsteGesprek() : '';
    var inP = function (d) { return !window.KMALijst || KMALijst.inPeriod(d, learyPer, since); };
    var zelf = (dtfItems || []).filter(function (d) { return d && d.bron !== 'medecadet' && L.clean(d.leary) && inP(d.datum); });
    var mede = [];
    try { mede = (window.kmaKameraad ? kmaKameraad._S().inbox || [] : []).filter(function (c) { return L.clean(c.leary) && inP(c.datum); }); } catch (e) {}
    var staf = [];
    try { (window.kmaFeedback ? kmaFeedback.all() : []).forEach(function (r) { (r.dtfNotes || []).forEach(function (n) { if (L.clean(n.leary) && inP(n.datum) && !staf.some(function (x) { return String(x.id) === String(n.id); })) staf.push(n); }); }); } catch (e) {}
    return { zelf: zelf, mede: mede, staf: staf, since: since };
  }
  R['leary'] = function (c) {
    var L = window.KMALeary;
    if (!L) { c.innerHTML = '<p class="muted">De roos is niet geladen.</p>'; return; }
    var g = learyData(), dz = L.dist(g.zelf), da = L.dist(g.mede.concat(g.staf));
    var nodig = function (d) { return d.ok ? '' : ' <span class="muted">(nog ' + (L.MIN - d.n) + ' voor een verdeling)</span>'; };
    var per = window.KMALijst ? '<div class="kma-chips kma-filter">' + KMALijst.chips('data-learyp', [['alles', 'Alles'], ['30d', 'Laatste 30 dagen'], ['gesprek', g.since ? 'Sinds laatste gesprek (' + fmtDate(g.since) + ')' : 'Sinds laatste gesprek']], learyPer) + '</div>' : '';
    var beeld = (dz.ok || da.ok)
      ? L.rose(dz, da, { label: 'Roos van Leary: jij en anderen' }) + '<div class="kma-leary-legend"><span><i class="a"></i>Zelf (' + dz.n + ')</span><span><i class="b"></i>Anderen (' + da.n + ')</span></div>' +
        L.axisBars(dz, 'Zelf: gemiddelde plek') + L.axisBars(da, 'Anderen: gemiddelde plek')+
        (L.vectorHtml ? L.vectorHtml(g.zelf, g.mede.concat(g.staf), 'Zelf', 'Anderen') : '')
      : kmaEmpty({ icon: 'target', title: 'Nog te weinig om een beeld te geven', text: 'Kies bij een DTF-feit (knop Roos) of bij feedback aan een medecadet welk gedrag je zag. Vanaf ' + L.MIN + ' keer zie je hier hoe je gedrag over de roos verdeeld is.', btn: 'Naar het DTF-logboek', attrs: 'data-leary-go="dtf"' });
    var bron = '<ul class="plain small"><li>Je eigen DTF-feiten: ' + dz.n + nodig(dz) + '</li><li>Medecadetten: ' + g.mede.length + '</li><li>Teamleider en instructeurs: ' + g.staf.length + '</li></ul>' +
      (da.n && !da.ok ? '<p class="muted small">Feedback van anderen: nog ' + (L.MIN - da.n) + ' nodig voor een verdeling.</p>' : '');
    var secs = L.SECT.map(function (x) {
      var mine = g.zelf.filter(function (d) { return L.sector(d.leary).k === x.k; }), oth = dz.counts && da.counts ? da.counts[x.k] : 0;
      var tags = {}; mine.forEach(function (d) { (d.swot || []).forEach(function (t) { var k = (t.k === 's' ? 'Sterkte: ' : 'Valkuil: ') + t.t; tags[k] = (tags[k] || 0) + 1; }); });
      return '<details class="kma-leary-sec"><summary><b>' + x.n + '</b><em>zelf ' + mine.length + ' · anderen ' + oth + '</em></summary>' +
        '<p class="small">' + esc(x.d) + ' <span class="muted">Lokt vaak ' + esc(x.lokt) + ' uit.</span></p>' +
        (Object.keys(tags).length ? '<p class="muted small">Gekoppeld aan: ' + Object.keys(tags).map(function (k) { return esc(k) + (tags[k] > 1 ? ' (' + tags[k] + '×)' : ''); }).join(', ') + '</p>' : '') +
        (mine.length ? '<ul class="plain small">' + mine.slice(0, 5).map(function (d) { var t = String(d.feit || '').replace(/\s+/g, ' '); return '<li><span class="muted">' + esc(fmtDate(d.datum)) + '</span> ' + esc(t.length > 110 ? t.slice(0, 108) + '…' : t) + '</li>'; }).join('') + '</ul>' : '') + '</details>';
    }).join('');
    var hex = '';
    try {
      if (H && hexDone()) {
        var sc = selfScores();
        hex = '<p class="small">Uit je persoonlijkheidstest: <b>Extraversie ' + (sc.X != null ? Math.round(sc.X) : '-') + '</b> en <b>Verdraagzaamheid ' + (sc.A != null ? Math.round(sc.A) : '-') + '</b> (schaal 0-100).</p>' +
          '<p class="muted small">Deze twee eigenschappen liggen het dichtst bij de assen van de roos, maar hangen er maar matig mee samen. Een test meet hoe je jezelf in het algemeen ziet; de roos laat gedrag in concrete situaties zien. Leg ze naast elkaar en kijk waar ze verschillen; trek geen conclusies uit één van beide.</p>';
      } else hex = '<p class="muted small">Maak de persoonlijkheidstest (hoofdstuk 3) om je uitkomsten hier naast de roos te zien.</p>';
    } catch (e) {}
    // 4V-denkhulp (goedgekeurd door de gebruiker 22-11). Bewust NIET in de gegevens: de cadet kiest de V zelf.
    var V4 = [['Leidend', 'Verantwoordelijkheid, Vertrouwen', 'Verbondenheid (de groep wordt passief)'],
      ['Helpend', 'Verbondenheid, Veiligheid', 'Verantwoordelijkheid (werk van anderen overnemen)'],
      ['Meewerkend', 'Verbondenheid', 'Verantwoordelijkheid (meegaan in plaats van kiezen)'],
      ['Volgend', 'Verantwoordelijkheid (opdracht goed uitvoeren)', 'Verantwoordelijkheid (afwachten)'],
      ['Teruggetrokken', 'Veiligheid (rust, zorgvuldigheid)', 'Verbondenheid'],
      ['Opstandig', 'Verbondenheid (elkaar aanspreken), Veiligheid (kritisch zijn)', 'Vertrouwen'],
      ['Aanvallend', 'Veiligheid (grenzen stellen)', 'Vertrouwen, Veiligheid van anderen'],
      ['Concurrerend', 'Verantwoordelijkheid (eigen prestatie)', 'Verbondenheid']];
    var denk = '<details class="kma-leary-theory kma-leary-4v"><summary>' + icon('idea') + 'De roos en de 4V\'s (denkhulp)</summary>' +
      '<p class="small">Dit is een denkhulp, geen regel. Hetzelfde gedrag kan in de ene situatie helpen en in de andere doorschieten. Welke V bij een feit hoort, kies je altijd zelf.</p>' +
      '<div class="kma-dp" tabindex="0" role="region" aria-label="Roos en 4V\'s"><table class="kma-dp-tab"><thead><tr><th>Gedrag</th><th>Kan helpen bij</th><th>Als het doorschiet</th></tr></thead><tbody>' +
      V4.map(function (r) { return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>'; }).join('') + '</tbody></table></div></details>';
    var uitleg = '<details class="kma-leary-theory"><summary>' + icon('book') + 'Uitleg: hoe werkt de roos?</summary>' +
      '<p>De Roos van Leary (Timothy Leary, 1957) beschrijft gedrag tussen mensen op twee assen. De verticale as gaat over <b>invloed</b>: neem je de leiding (boven) of laat je de ander bepalen (onder)? De horizontale as gaat over <b>verbondenheid</b>: werk je samen met de ander of zet je je ertegen af?</p>' +
      '<p>Samen geven die assen acht soorten gedrag. Geen enkel gedrag is goed of fout: leidend gedrag helpt bij een snelle beslissing, maar maakt de groep passief als het te lang duurt. Opstandig gedrag kan precies het kritische geluid zijn dat een plan veiliger maakt.</p>' +
      '<p><b>Actie lokt reactie uit.</b> Gedrag boven lokt vaak gedrag onder uit, en omgekeerd. Gedrag samen lokt samen uit, gedrag tegen lokt tegen uit. Wil je ander gedrag van je groep, kijk dan eerst naar je eigen plek op de roos.</p>' +
      '<p><b>Escalatie doorbreken.</b> Aan de tegen-kant klopt de regel maar half: op aanvallend gedrag reageren mensen vaak óók aanvallend, en zo loopt het op. Ga niet mee in tegen-gedrag: blijf samen en wees duidelijk. Leg bij een DTF-feit ook vast wat de ander daarna deed; dan zie je je eigen patronen.</p>' +
      '<p><b>Zo gebruik je het:</b> kies bij een DTF-feit welk gedrag je liet zien, en vraag medecadetten bij hun feedback hetzelfde. Na een tijd zie je waar je vaak zit, en of anderen dat ook zo zien. Bespreek verschillen in het gesprek met je teamleider.</p>' +
      '<p class="muted small">Let op: de twee assen zijn in onderzoek goed terug te vinden; de precieze indeling in acht gelijke sectoren minder (Wiggins, 1979). Daarom bewaart de app de plek op beide assen en toont hij pas een verdeling bij genoeg waarnemingen.</p></details>';
    c.innerHTML = '<div class="kma-leary-ch">' + per +
      cardHtml('Jouw gedrag op de roos', (window.kmaBewijs ? kmaBewijs.roosZin(g.zelf, g.mede.concat(g.staf)) : '') + beeld + bron, 'target') +
      (g.mede.length + g.staf.length && window.kmaActieKaart ? kmaActieKaart('roos', '') : '') +
      (L.clxAan ? cardHtml('Communicatie- en leiderschapscircumplex (CLX)', (L.clx ? L.clx(g.zelf, g.mede.concat(g.staf), 'Zelf', 'Anderen') : '') + '<p class="muted small">De KMA noemt dit model het communicatie- en leiderschapscircumplex (CLX). De vier kwadranten komen uit dezelfde twee assen als de roos: invloed (boven of onder) en verbondenheid (samen of tegen). De namen in je lesmateriaal kunnen iets anders zijn.</p>' + (window.kmaLeertaak ? kmaLeertaak.labels(['LeO 05', 'LeO 06', 'LeO 07']) : ''), 'target') : '') +
      cardHtml('Per soort gedrag', secs, 'list') +
      cardHtml('Naast je persoonlijkheidstest', hex, 'user') +
      denk + (window.kmaReactie ? kmaReactie.oefeningHtml() : '') + uitleg + '</div>';
  };
  document.addEventListener('click', function (e) {
    var p = e.target.closest && e.target.closest('[data-learyp]');
    if (p) { learyPer = p.getAttribute('data-learyp'); renderWidgets(); return; }
    var go = e.target.closest && e.target.closest('[data-leary-go]');
    if (go) { var i = steps.findIndex(function (s) { return s.widget === 'dtf-logbook'; }); if (i >= 0) goToStep(i); }
  });
  /* ======================= 15. Curriculum vitae ======================= */
  var CV_LISTS = {
    loopbaan: { l: 'Militaire loopbaan en werkervaring', f: [['van', 'Van', 'month'], ['tot', 'Tot', 'month'], ['functie', 'Functie', 'text'], ['organisatie', 'Eenheid / organisatie', 'text'], ['omschrijving', 'Wat deed je, wat bereikte je?', 'area']] },
    opleidingen: { l: 'Opleidingen', f: [['van', 'Van', 'month'], ['tot', 'Tot', 'month'], ['opleiding', 'Opleiding', 'text'], ['instituut', 'School / instituut', 'text'], ['diploma', 'Diploma behaald', 'check']] },
    cursussen: { l: 'Cursussen en certificaten', f: [['jaar', 'Jaar', 'text'], ['naam', 'Cursus / certificaat', 'text'], ['instantie', 'Instantie', 'text']] },
    talen: { l: 'Talen', f: [['taal', 'Taal', 'text'], ['niveau', 'Niveau', 'level']] },
    neven: { l: 'Nevenactiviteiten en sport', f: [['periode', 'Periode', 'text'], ['activiteit', 'Activiteit / rol', 'text']] }
  };
  var CV_LEVELS = ['Moedertaal', 'Vloeiend', 'Goed', 'Redelijk', 'Basis'];
  // One copy in memory while typing, so quick changes in several fields never overwrite each other.
  var cvCur = null, cvT = null;
  function cvLoad() {
    var d = getX('cv', {});
    Object.keys(CV_LISTS).forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    return d;
  }
  function cvData() { if (!cvCur) cvCur = cvLoad(); return cvCur; }
  function cvFlush() { clearTimeout(cvT); if (cvCur) setX('cv', cvCur); }
  window.kmaCvData = cvData;
  function cvMonth(v) { var m = /^(\d{4})-(\d{2})/.exec(v || ''); return m ? ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][m[2] - 1] + ' ' + m[1] : (v || ''); }
  function cvPeriod(r) { return [cvMonth(r.van), r.tot ? cvMonth(r.tot) : (r.van ? 'heden' : '')].filter(Boolean).join(' tot '); }
  function cvRow(list, r, i) {
    return '<div class="kma-cv-row" data-cvrow="' + list + ':' + i + '">' + CV_LISTS[list].f.map(function (f) {
      var v = r[f[0]] == null ? '' : r[f[0]], a = 'data-cvl="' + list + '" data-i="' + i + '" data-k="' + f[0] + '"';
      if (f[2] === 'area') return '<label class="wide">' + f[1] + '<textarea ' + a + '>' + esc(v) + '</textarea></label>';
      if (f[2] === 'check') return '<label class="chk"><input type="checkbox" ' + a + (v ? ' checked' : '') + '/>' + f[1] + '</label>';
      if (f[2] === 'level') return '<label>' + f[1] + '<select ' + a + '>' + ['<option value=""></option>'].concat(CV_LEVELS.map(function (l) { return '<option' + (v === l ? ' selected' : '') + '>' + l + '</option>'; })).join('') + '</select></label>';
      return '<label' + (f[2] === 'month' ? ' class="sm"' : '') + '>' + f[1] + '<input type="' + (f[2] === 'month' ? 'month' : 'text') + '" ' + a + ' value="' + esc(v) + '"/></label>';
    }).join('') + '<button type="button" class="kma-icon-btn is-round sm" data-cvdel="' + list + ':' + i + '" aria-label="Verwijderen">' + icon('trash') + '</button></div>';
  }
  R['cv'] = function (c) {
    cvFlush(); cvCur = null;
    var d = cvData(), a = function (k) { return answers[k] || ''; }, photo = kmaStore.getItem('kma-profile-photo') || '';
    var strengths = [];
    try { if (H && hexDone()) strengths = H.analyse(selfScores(), null).quadrants.s.map(function (p) { return p.trait && p.trait.name; }); } catch (e) {}
    getX('kernkwadrant', []).forEach(function (k) { if (k && k.kwaliteit) strengths.push(k.kwaliteit); });
    strengths = strengths.filter(function (s, i, l) { return s && l.indexOf(s) === i; });
    var inp = function (k, l, type, ph) { return '<label>' + l + '<input type="' + (type || 'text') + '" data-cvf="' + k + '" value="' + esc(d[k] || '') + '" placeholder="' + esc(ph || '') + '"/></label>'; };
    c.innerHTML = '<div class="kma-cv">' +
      '<div class="kma-card-block kma-cv-head"><div class="kma-cv-photo">' + (photo ? '<img alt="" src="' + esc(photo) + '">' : icon('user')) + '</div><div><strong>' + esc(a('Voornaam & Achternaam:') || 'Je naam') + '</strong>' +
      '<span>' + esc([a('OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):'), a('Dienstvak / Wapen / Korps:')].filter(Boolean).join(' · ') || 'Vul je gegevens in bij Profiel (hoofdstuk 0)') + '</span><small class="muted">Naam, foto en krijgsmachtdeel komen uit Profiel (hoofdstuk 0).</small></div></div>' +
      cardHtml('Persoonlijke gegevens', '<div class="kma-cv-grid">' + inp('geboortedatum', 'Geboortedatum', 'date') + inp('woonplaats', 'Woonplaats') + inp('email', 'E-mail', 'email') + inp('telefoon', 'Telefoon', 'tel') + inp('rijbewijs', 'Rijbewijs', 'text', 'bijv. B, C') + '</div>', 'user') +
      cardHtml('Profiel', '<p class="muted small">Twee tot vier zinnen: wie ben je, wat drijft je, wat breng je mee?</p><textarea data-cvf="profiel" class="kma-cv-profile">' + esc(d.profiel || '') + '</textarea>', 'edit') +
      Object.keys(CV_LISTS).map(function (k) {
        return cardHtml(CV_LISTS[k].l, '<div class="kma-cv-list">' + d[k].map(function (r, i) { return cvRow(k, r, i); }).join('') + '</div>' +
          '<button type="button" class="kma-chip-btn" data-cvadd="' + k + '">' + icon('plus') + 'Toevoegen</button>', k === 'talen' ? 'message' : k === 'neven' ? 'activity' : 'file');
      }).join('') +
      cardHtml('Vaardigheden en kwaliteiten', '<p class="muted small">Gescheiden door komma\'s.</p><textarea data-cvf="vaardigheden" aria-label="Vaardigheden en kwaliteiten">' + esc(d.vaardigheden || '') + '</textarea>' +
        (strengths.length ? '<p class="muted small">Uit je persoonlijkheidstest en kernkwadranten:</p><div class="kma-chips">' + strengths.map(function (s) { return '<button type="button" class="kma-chip-btn" data-cvskill="' + esc(s) + '">' + icon('plus') + esc(s) + '</button>'; }).join('') + '</div>' : ''), 'target') +
      cardHtml('Referenties', '<input type="text" data-cvf="referenties" value="' + esc(d.referenties == null ? 'Op aanvraag beschikbaar' : d.referenties) + '"/>', 'users') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" onclick="kmaPortfolio && kmaPortfolio()">' + icon('download') + 'Bekijk in je portfolio</button></div></div>';
  };
  function cvSave() { clearTimeout(cvT); cvT = setTimeout(cvFlush, 300); }
  window.addEventListener('pagehide', cvFlush);
  document.addEventListener('input', function (e) {
    var t = e.target, d;
    if (t.dataset && t.dataset.cvf) { d = cvData(); d[t.dataset.cvf] = t.value; cvSave(); return; }
    if (t.dataset && t.dataset.cvl) { d = cvData(); var r = d[t.dataset.cvl][Number(t.dataset.i)]; if (!r) return; r[t.dataset.k] = t.type === 'checkbox' ? t.checked : t.value; cvSave(); }
  });
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.cvl && (t.type === 'checkbox' || t.tagName === 'SELECT')) { var d = cvData(), r = d[t.dataset.cvl][Number(t.dataset.i)]; if (!r) return; r[t.dataset.k] = t.type === 'checkbox' ? t.checked : t.value; cvFlush(); }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-cvadd],[data-cvdel],[data-cvskill]'); if (!b) return;
    var d = cvData();
    // keep what was typed but not yet saved
    document.querySelectorAll('[data-cvf]').forEach(function (i) { d[i.dataset.cvf] = i.value; });
    document.querySelectorAll('[data-cvl]').forEach(function (i) { var r = d[i.dataset.cvl][Number(i.dataset.i)]; if (r) r[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.value; });
    if (b.dataset.cvadd) d[b.dataset.cvadd].push({});
    else if (b.dataset.cvdel) { var p = b.dataset.cvdel.split(':'), old = d[p[0]].splice(Number(p[1]), 1)[0]; if (window.kmaUndoToast && old) { cvFlush(); renderWidgets(); kmaUndoToast('Regel verwijderd', function () { var d2 = cvData(); d2[p[0]].splice(Number(p[1]), 0, old); cvFlush(); renderWidgets(); }); return; } }
    else if (b.dataset.cvskill) { var list = String(d.vaardigheden || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean); if (list.indexOf(b.dataset.cvskill) < 0) list.push(b.dataset.cvskill); d.vaardigheden = list.join(', '); }
    cvFlush(); renderWidgets();
    if (b.dataset.cvadd) { var rows = document.querySelectorAll('[data-cvrow^="' + b.dataset.cvadd + ':"]'), last = rows[rows.length - 1]; if (last) { var f = last.querySelector('input[type=text],input[type=month]'); if (f) f.focus(); } }
  });

  /* ======================= Portfolio (PDF) ======================= */
  function pfText(v) { return esc(String(v)).replace(/\n/g, '<br>'); }
  function pfQA(step, skip) {
    return (step.questions || []).filter(function (q) { return typeof answers[q] === 'string' && answers[q].trim() && !(skip && skip(q)); }).map(function (q) {
      return '<div class="pf-qa"><h4>' + esc(q) + '</h4><p>' + pfText(answers[q].trim()) + '</p></div>';
    }).join('');
  }
  function pfCard(title, body, cls) { return body ? '<div class="pf-card' + (cls ? ' ' + cls : '') + '">' + (title ? '<h3>' + title + '</h3>' : '') + body + '</div>' : ''; }
  function pfSvg(s) { return String(s || '').replace(/ data-tlid="[^"]*"/g, '').replace(/aria-label="Levenslijn: [^"]*"/, 'aria-label="Levenslijn"'); }
  var PF_VIS = {
    'cadet-profile': function (step) {
      var rows = (step.questions || []).filter(function (q) { return typeof answers[q] === 'string' && answers[q].trim(); });
      return rows.length ? pfCard('', '<table class="pf-table">' + rows.map(function (q) { return '<tr><th>' + esc(q.replace(/:$/, '')) + '</th><td>' + pfText(answers[q]) + '</td></tr>'; }).join('') + '</table>') : '';
    },
    timeline: function () {
      var items = timelineItems.filter(function (i) { return i && (i.text || i.year); }).slice().sort(function (a, b) { return (parseInt(a.year, 10) || 0) - (parseInt(b.year, 10) || 0); });
      if (!items.length) return '';
      var keep = tlEdit; tlEdit = null; var chart = pfSvg(tlSvg(items, tlYears(items))); tlEdit = keep;
      var counts = {}; items.forEach(function (it) { (it.qualities || []).forEach(function (q) { counts[q] = (counts[q] || 0) + 1; }); });
      var thread = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; }).slice(0, 3);
      return pfCard('Mijn levenslijn', '<div class="pf-chart wide">' + chart + '</div>' +
        (thread.length ? '<p class="pf-note">Rode draad: <strong>' + thread.map(function (q) { return esc(q) + ' (' + counts[q] + '×)'; }).join(', ') + '</strong></p>' : '')) +
        pfCard('Gebeurtenissen', '<table class="pf-table pf-events">' + items.map(function (it) {
          var sc = it.score != null ? Number(it.score) : (it.pos === 'bottom' ? -2 : 2);
          return '<tr><td class="pf-badge ' + (sc < 0 ? 'neg' : 'pos') + '">' + (sc > 0 ? '+' : '') + sc + '</td><th>' + esc(it.year || '') + '</th><td>' + esc(it.text || '') +
            ((it.qualities || []).length ? '<div class="pf-tags">' + it.qualities.map(function (q) { return '<i>' + esc(q) + '</i>'; }).join('') + '</div>' : '') + '</td></tr>';
        }).join('') + '</table>');
    },
    hexaco: function () {
      if (!H || !hexDone()) return '';
      var s = selfScores(), oth = null;
      try { if (typeof hexacoObservers !== 'undefined' && typeof hexacoQuestionsObserver !== 'undefined') { var o = H.observerScores(hexacoObservers, hexacoQuestionsObserver); if (o && o.count) oth = o; } } catch (e) {}
      var an = H.analyse(s, oth), ind = H.vIndication(s);
      var series = [{ label: 'Zelfbeeld', color: V.colors.gold, values: H.TRAITS.map(function (t) { return s[t.key]; }) }];
      if (oth) series.push({ label: 'Hoe anderen mij zien', color: V.colors.blue, dashed: true, values: H.TRAITS.map(function (t) { return oth.avg[t.key]; }) });
      var axes = H.TRAITS.map(function (t) { return t.name.length > 9 ? t.name.slice(0, 7) + '.' : t.name; });
      var bars = H.TRAITS.map(function (t) {
        return '<div class="pf-bar"><span>' + esc(t.name) + '</span><b><i style="width:' + s[t.key] + '%"></i></b><em>' + s[t.key] + '%</em></div>';
      }).join('');
      var q = an.quadrants, quad = function (title, cls, list) {
        return '<div class="pf-swot ' + cls + '"><h4>' + title + '</h4>' + (list.length ? '<ul>' + list.map(function (p) { var bw = window.kmaBewijs ? kmaBewijs.bewijs(p, cls, oth) : null; return '<li>' + esc(p.text) + '<small>' + esc(p.trait.name) + ' ' + p.score + '%' + (bw ? ' · ' + (bw.status === 'bevestigd' ? 'bevestigd' : bw.status === 'niet' ? 'anderen zien het anders' : 'nog te weinig bewijs') + (bw.feiten ? ' (' + bw.feiten + ' DTF)' : '') : '') + '</small></li>'; }).join('') + '</ul>' : '<p class="pf-muted">-</p>') + '</div>';
      };
      return pfCard('Profiel', '<div class="pf-two"><div class="pf-chart">' + V.radar(axes, series, { label: 'Persoonlijkheidsprofiel' }) + V.legend(series) + '</div><div>' + bars + '</div></div>') +
        pfCard('SWOT', '<div class="pf-swot-grid">' + quad('Sterke kanten', 's', q.s) + quad('Valkuilen', 'w', q.w) + quad('Kansen', 'o', q.o) + quad('Bedreigingen', 't', q.t) + '</div>') +
        (ind ? pfCard('Vertaling naar de 4 V\'s <small>indicatie</small>', '<div class="pf-v4">' + VS.map(function (v) { return '<div><span>' + (window.kmaVIcon ? kmaVIcon(v) || '' : '') + esc(v) + '</span><strong>' + H.vBand(ind[v]).label + '</strong></div>'; }).join('') + '</div>' +
          '<p class="pf-muted">Ruwe indicatie in drie banden op basis van de persoonlijkheidstest (gemiddelde van twee eigenschappen per V). Niet onderzocht als voorspeller van de beoordeling; bedoeld als begin van een gesprek.</p>') : '');
    },
    'gedragscode-form': function () {
      var sc = answers['gedragscode-scores'] || {};
      if (!VS.some(function (v) { return sc[v.toLowerCase()]; })) return '';
      return pfCard('Mijn score per V (1-10)', '<div class="pf-v4">' + VS.map(function (v) {
        var x = Number(sc[v.toLowerCase()]) || 0;
        return '<div><span>' + (window.kmaVIcon ? kmaVIcon(v) || '' : '') + esc(v) + '</span><strong>' + (x ? x + '/10' : '-') + '</strong><i style="width:' + (x * 10) + '%"></i></div>';
      }).join('') + '</div>');
    },
    'kma-self-form-widget': function () {
      var f = kmaOfficialSelfForm || {};
      if (f.totalScore == null) return '';
      var rows = VS.map(function (v, i) { var n = i + 1; return { label: v, n1: f['v' + n + '_n1_score'], n2: f['v' + n + '_n2_score'] }; });
      var txt = VS.map(function (v, i) { var t = f['v' + (i + 1) + '_text']; return t && String(t).trim() ? '<div class="pf-qa"><h4>' + esc(v) + '</h4><p>' + pfText(t) + '</p></div>' : ''; }).join('');
      return pfCard('Zelfbeoordeling', '<div class="pf-two"><div class="pf-chart">' + V.vMatrix(rows) + '<p class="pf-muted">0 = onvoldoende · 1 = voldoende (norm) · 2 = goed</p></div><div class="pf-chart">' +
        V.gauge(f.totalScore, 16, { caption: 'eigen inschatting: ' + (f.eindoordeel || '-') }) + '</div></div>') + (txt ? pfCard('Toelichting', txt) : '');
    },
    officier: function () {
      var kk = getX('kernkwadrant', []).filter(function (k) { return k && (k.kwaliteit || k.valkuil); });
      return kk.length ? pfCard('Mijn kernkwadranten', '<div class="pf-kk-list">' + kk.map(function (k) {
        var c = function (lab, v, cls) { return '<div class="pf-kk ' + cls + '"><small>' + lab + '</small><strong>' + esc(v || '-') + '</strong></div>'; };
        return '<div class="pf-kk-grid">' + c('Kernkwaliteit', k.kwaliteit, 'a') + c('Valkuil', k.valkuil, 'b') + c('Allergie', k.allergie, 'c') + c('Uitdaging', k.uitdaging, 'd') + '</div>';
      }).join('') + '</div>') : '';
    },
    smart: function (step) {
      if (!smartParts(step).some(Boolean)) return '';
      var ci = getX('smart-checkins', []);
      return pfCard('Mijn leervraag', '<p class="pf-lead">' + smartSentence(step).replace(/<span class="ph">[^<]*<\/span>/g, '…') + '</p>') +
        (ci.length && window.KMAPatterns ? pfCard('Wekelijkse check-ins', KMAPatterns.checkinStrip(ci, 12) +
          ci.filter(function (x) { return x && x.note; }).slice(-6).map(function (x) { return '<p class="pf-small"><strong>' + esc(String(x.week || '').replace(/^(\d{4})-W0?(\d+)$/, 'Week $2 ($1)')) + ':</strong> ' + esc(x.note) + '</p>'; }).join('')) : '');
    },
    '5gt-multi': function () {
      var list = cases5GT.filter(function (c) { return c && KMA5GT.anyFilled(c); });
      if (!list.length) return '';
      var emo = list.some(function (c) { return (c.emoties || []).length; }) ? pfCard('Emoties over al mijn reflecties', KMA5GT.emotionOverview(list)) : '';
      return emo + list.map(function (c, i) {
        var v = KMA5GT.view(c), pl = KMA5GT.plaatsList(v);
        return pfCard(esc(c.title || '5G-T-reflectie ' + (i + 1)), KMA5GT.toHtml(c) +
          (pl.length || KMA5GT.beliefBars(v) ? '<h5>Cirkel van invloed en geloofwaardigheid</h5><div class="pf-two">' + (pl.length ? '<div class="pf-chart sm">' + KMA5GT.circleSvg(pl, { legend: true }) + '</div>' : '') + '<div>' + KMA5GT.beliefBars(v) + '</div></div>' : ''), 'pf-refl');
      }).join('');
    },
    'korthagen-multi': function () {
      var F = [['actie', 'Actie'], ['terugblik', 'Terugblik op de actie'], ['bewustwording', 'Bewustwording van wezenlijke aspecten'], ['alternatieven', 'Alternatieven ontwikkelen'], ['uitproberen', 'Uitproberen']];
      var list = casesKorthagen.filter(function (c) { return c && F.some(function (f) { return c[f[0]] && String(c[f[0]]).trim(); }); });
      return list.map(function (c, i) {
        return pfCard(esc(c.title || 'Korthagen-reflectie ' + (i + 1)), '<ol class="pf-phases">' + F.map(function (f) {
          return '<li><h4>' + f[1] + '</h4><p>' + (c[f[0]] && String(c[f[0]]).trim() ? pfText(c[f[0]]) : '<span class="pf-muted">-</span>') + '</p></li>';
        }).join('') + '</ol>', 'pf-refl');
      }).join('');
    },
    'dtf-logbook': function () {
      var list = dtfItems.filter(function (d) { return d && d.feit; }).slice().sort(function (a, b) { return String(a.datum + a.tijd).localeCompare(String(b.datum + b.tijd)); });
      if (!list.length) return '';
      var counts = VS.map(function (v) { return { label: v, value: list.filter(function (d) { return (d.vValues || []).indexOf(v) >= 0; }).length }; });
      var sig = window.KMAPatterns ? KMAPatterns.signals(list) : [];
      return pfCard('Overzicht', '<div class="pf-two"><div class="pf-chart">' + V.hbars(counts, { label: 'DTF-feiten per V' }) + '</div><div><p class="pf-big">' + list.length + '<small>vastgelegde feiten</small></p>' +
        (sig.length ? '<ul class="pf-signals">' + sig.map(function (x) { return '<li>' + esc(x.text) + '</li>'; }).join('') + '</ul>' : '') + '</div></div>') +
        pfCard('Logboek', '<table class="pf-table pf-dtf"><thead><tr><th>Datum</th><th>Feit</th><th>V / SWOT</th></tr></thead><tbody>' + list.map(function (d) {
          return '<tr class="' + (d.teken === '+' ? 'pf-pos' : d.teken === '-' ? 'pf-neg' : '') + '"><td>' + esc(fmtDate(d.datum)) + (d.tijd ? '<br><small>' + esc(d.tijd) + '</small>' : '') + '</td><td>' + pfText(d.feit) + (d.teken ? ' <i class="pf-sign">' + (d.teken === '+' ? 'positief' : 'negatief') + '</i>' : '') + '</td><td><div class="pf-tags">' +
            (d.vValues || []).map(function (v) { return '<i>' + esc(v) + '</i>'; }).join('') + (Array.isArray(d.swot) ? d.swot.map(function (t) { return '<i class="' + (t.k === 'w' ? 'w' : 's') + '">' + esc(t.t) + '</i>'; }).join('') : '') + '</div></td></tr>';
        }).join('') + '</tbody></table>');
    }
  };
  PF_VIS.groei = function () {
    var g = groeiData();
    if (!g.ev.length && !g.tl.length && !g.self.length) return '';
    return pfCard('', groeiTiles(g).replace('kma-groei-tiles', 'kma-groei-tiles pf-tiles')) +
      (groeiV(g) ? pfCard('Beoordelingen over tijd', '<div class="pf-chart">' + groeiV(g) + '</div>') : '') +
      (Object.keys(g.months).length ? pfCard('DTF-feiten per maand', '<div class="pf-chart wide">' + groeiDtf(g) + '</div>') : '') +
      pfCard('Mijlpalen', '<table class="pf-table">' + g.ev.filter(function (e) { return e.kind !== 'dtf'; }).slice(0, 25).map(function (e) { return '<tr><th style="width:90px">' + esc(fmtDate(e.date)) + '</th><td><strong>' + esc(e.title) + '</strong>' + (e.text ? '<br><span class="pf-muted">' + esc(e.text) + '</span>' : '') + '</td></tr>'; }).join('') + '</table>');
  };
  PF_VIS.cv = function () {
    cvFlush();
    var d = cvData(), a = function (k) { return answers[k] || ''; }, photo = kmaStore.getItem('kma-profile-photo') || '';
    var has = d.profiel || Object.keys(CV_LISTS).some(function (k) { return d[k].length; }) || d.vaardigheden;
    if (!has) return '';
    var list = function (k, fn) { var rows = d[k].filter(function (r) { return Object.keys(r).some(function (x) { return r[x]; }); }); return rows.length ? rows.map(fn).join('') : ''; };
    var skills = String(d.vaardigheden || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    var lvl = { Moedertaal: 5, Vloeiend: 4, Goed: 3, Redelijk: 2, Basis: 1 };
    var side = '<aside class="pf-cv-side">' + (photo ? '<img class="pf-cv-photo" alt="" src="' + esc(photo) + '">' : '') +
      '<h4>Contact</h4>' + [d.woonplaats, d.email, d.telefoon].filter(Boolean).map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') +
      (d.geboortedatum ? '<p>Geboren ' + esc(fmtDate(d.geboortedatum)) + '</p>' : '') + (d.rijbewijs ? '<p>Rijbewijs ' + esc(d.rijbewijs) + '</p>' : '') +
      (skills.length ? '<h4>Vaardigheden</h4><div class="pf-cv-skills">' + skills.map(function (x) { return '<i>' + esc(x) + '</i>'; }).join('') + '</div>' : '') +
      (list('talen', function () { return 1; }) ? '<h4>Talen</h4>' + list('talen', function (r) { var n = lvl[r.niveau] || 0; return '<div class="pf-cv-lang"><span>' + esc(r.taal || '') + '</span><b>' + [1, 2, 3, 4, 5].map(function (i) { return '<u class="' + (i <= n ? 'on' : '') + '"></u>'; }).join('') + '</b></div>'; }) : '') +
      (d.referenties ? '<h4>Referenties</h4><p>' + esc(d.referenties) + '</p>' : '') + '</aside>';
    var sec = function (t, body) { return body ? '<h4 class="pf-cv-h">' + t + '</h4>' + body : ''; };
    var item = function (when, title, sub, text) { return '<div class="pf-cv-item"><span>' + esc(when) + '</span><div><strong>' + esc(title) + '</strong>' + (sub ? '<em>' + esc(sub) + '</em>' : '') + (text ? '<p>' + esc(text).replace(/\n/g, '<br>') + '</p>' : '') + '</div></div>'; };
    var main = '<div class="pf-cv-main"><div class="pf-cv-name"><h3>' + esc(a('Voornaam & Achternaam:') || 'Cadet') + '</h3><p>' + esc(['Cadet KMA', a('OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):'), a('Dienstvak / Wapen / Korps:')].filter(Boolean).join(' · ')) + '</p></div>' +
      (d.profiel ? '<p class="pf-cv-profile">' + esc(d.profiel).replace(/\n/g, '<br>') + '</p>' : '') +
      sec('Militaire loopbaan en werkervaring', list('loopbaan', function (r) { return item(cvPeriod(r), r.functie || '', r.organisatie || '', r.omschrijving || ''); })) +
      sec('Opleidingen', list('opleidingen', function (r) { return item(cvPeriod(r), r.opleiding || '', [r.instituut, r.diploma ? 'diploma behaald' : ''].filter(Boolean).join(' · '), ''); })) +
      sec('Cursussen en certificaten', list('cursussen', function (r) { return item(r.jaar || '', r.naam || '', r.instantie || '', ''); })) +
      sec('Nevenactiviteiten en sport', list('neven', function (r) { return item(r.periode || '', r.activiteit || '', '', ''); })) + '</div>';
    return '<div class="pf-cv">' + side + main + '</div>';
  };
  function pfFitness() {
    var logs = fitnessLogs.filter(Boolean).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); }).slice(-20);
    if (!logs.length) return '';
    var series = [{ label: 'Slaap', color: V.colors.blue, values: logs.map(function (l) { return Number(l.sleep); }) }, { label: 'Fysieke belasting', color: V.colors.gold, values: logs.map(function (l) { return Number(l.body); }) }, { label: 'Mentale druk', color: V.colors.red, values: logs.map(function (l) { return Number(l.mind); }) }];
    return pfCard('Fitheid over tijd', '<div class="pf-chart wide">' + V.lineChart(logs.map(function (l) { return fmtDate(l.date).replace(/ \d{4}$/, ''); }), series, { yMin: 0, yMax: 10, ticks: [0, 5, 10], label: 'Fitheid over tijd' }) + V.legend(series) + '</div>');
  }
  function pfPss() {
    var list = pssList(); if (!list.length) return '';
    var last = list[list.length - 1], t = PSS.total(last.a), b = PSS.band(t);
    return pfCard('Ervaren stress (PSS-10)', '<div class="pf-chart">' + V.gauge(t, PSS.MAX, { caption: b.label + ' · ' + fmtDate(last.date), color: b.color }) + '</div>' +
      (list.length > 1 ? '<div class="pf-chart wide">' + V.lineChart(list.slice(-12).map(function (r) { return fmtDate(r.date).replace(/ \d{4}$/, ''); }), [{ label: 'PSS-10', color: V.colors.red, values: list.slice(-12).map(function (r) { return PSS.total(r.a); }) }], { yMin: 0, yMax: PSS.MAX, ticks: [0, PSS.BANDS.gemiddeld, PSS.BANDS.verhoogd, PSS.BANDS.hoog, PSS.MAX], label: 'PSS-10 over tijd' }) + '</div>' : '') +
      '<p class="pf-muted">' + esc(PSS.NOTE) + '</p>');
  }
  PF_VIS.fitheid = function () { return pfFitness() + (PSS ? pfPss() : ''); };
  /** Every portfolio part: key, title and its HTML (empty when there is nothing to show). */
  /* 4.30 (punt 79): het portfolio volgt de rode draad in vijf stappen (zelfde indeling als het Werkboek), met daarna
     verdieping en naslag. Nieuw: metingen (kort/lang), als-dan-plannen met check-ins, gebruikt gereedschap en de
     bronnen als bijlage. De keuze per onderdeel blijft bewaard (zelfde sleutels als voorheen). */
  var PF_FASEN = ['Jezelf leren kennen', 'Leervraag', 'Doen en vastleggen', 'Reflecteren', 'Feedback en beoordeling', 'Verdieping en naslag'];
  function pfFase(t) {
    if (/Cadet Informatie|Introductie|Ontwikkelbiografie|Persoonlijkheidstest|Gedragscode/.test(t)) return 0;
    if (/SMART/.test(t)) return 1;
    if (/Datum-Tijd-Feit/.test(t)) return 2;
    if (/5G-T|Korthagen/.test(t)) return 3;
    if (/Zelfbeoordelingsformulier|Voorbereiding Cadetbeoordeling/.test(t)) return 4;
    return 5;
  }
  function pfExtra() {
    var out = [], M = window.kmaMeting, P2 = window.kmaPlannen, G = window.kmaGereedschap, hx = steps.findIndex(function (s) { return s.widget === 'hexaco'; }), sm = steps.findIndex(function (s) { return /SMART/.test(s.title); });
    var ml = M ? M.lijst() : [];
    if (ml.length) out.push({ key: 'x-metingen', title: 'Metingen persoonlijkheidstest', fase: 0, def: hx >= 0 && isShared(steps[hx].title),
      html: pfCard('', '<table class="pf-table"><tr><th>Datum</th><th>Test</th>' + H.TRAITS.map(function (t) { return '<th>' + esc(t.key) + '</th>'; }).join('') + '</tr>' + ml.map(function (m) { return '<tr><td>' + esc(fmtDate(m.datum)) + '</td><td>' + esc(m.set) + '</td>' + H.TRAITS.map(function (t) { return '<td>' + (m.d[t.key] != null ? Math.round(m.d[t.key]) : '–') + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
        (ml.length >= 2 ? '<p class="pf-muted">' + H.TRAITS.map(function (t) { var r = M.verandering(t.key, ml[ml.length - 2], ml[ml.length - 1]); return r && r.echt ? esc(t.name) + ': echt ' + r.richting : ''; }).filter(Boolean).join(' · ') + '</p>' : '') +
        '<p class="pf-muted">Percentielen ten opzichte van ' + esc(M.NORM_BRON) + '. Alleen een verschil groter dan de meetfout heet een echte verandering.</p>') });
    var pl = P2 && P2.list ? P2.list() : [];
    if (pl.length) out.push({ key: 'x-plannen', title: 'Als-dan-plannen en check-ins', fase: 1, def: sm >= 0 && isShared(steps[sm].title),
      html: pfCard('', '<table class="pf-table">' + pl.map(function (p) { var s = P2.stats ? P2.stats(p.id) : { gelukt: 0, n: 0 }; return '<tr><th>Als ' + esc(p.als || '') + ', dan ' + esc(p.dan || '') + '</th><td>' + (s.n ? s.gelukt + ' van ' + s.n + ' keer gelukt' : 'nog geen check-in') + (p.edited ? ' · bijgesteld' : '') + '</td></tr>'; }).join('') + '</table>') });
    if (G) { var aan = G.MODELLEN.filter(function (m) { return G.aan(m.k); }); if (aan.length) out.push({ key: 'x-gereedschap', title: 'Gebruikt gereedschap', fase: 2, def: true, html: pfCard('', '<p>' + aan.map(function (m) { return esc(m.t); }).join(' · ') + '</p><p class="pf-muted">Naast de vaste basis gekozen uit de gereedschapskist.</p>') }); }
    var B = window.kmaBewijs;
    out.push({ key: 'x-bronnen', title: 'Bijlage: bronnen', fase: 6, def: true, html: pfCard('', '<ul class="pf-bronnen">' + [
      'Ashton, M. C., & Lee, K. (2007). Empirical, theoretical, and practical advantages of the HEXACO model of personality structure. Personality and Social Psychology Review, 11(2), 150-166.',
      'Barrick, M. R., & Mount, M. K. (1991). The Big Five personality dimensions and job performance: A meta-analysis. Personnel Psychology, 44(1), 1-26.',
      'Judge, T. A., Bono, J. E., Ilies, R., & Gerhardt, M. W. (2002). Personality and leadership: A qualitative and quantitative review. Journal of Applied Psychology, 87(4), 765-780.',
      'Lee, K., Ashton, M. C., & de Vries, R. E. (2005). Predicting workplace delinquency and integrity with the HEXACO and Five-Factor Models of personality structure. Human Performance, 18(2), 179-197.',
      'Jacobson, N. S., & Truax, P. (1991). Clinical significance: A statistical approach to defining meaningful change in psychotherapy research. Journal of Consulting and Clinical Psychology, 59(1), 12-19.',
      'Korthagen, F. A. J. (2001). Linking practice and theory: The pedagogy of realistic teacher education. Mahwah: Erlbaum.',
      'Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist, 54(7), 493-503.',
      'IPIP-HEXACO-normen: openpsychometrics.org (n = 20.365), via het R-pakket IPV.'
    ].map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' + (B ? '' : '')) });
    return out;
  }
  function pfParts() {
    var out = [];
    steps.forEach(function (s, i) {
      if (s.widget === 'jargon-list' || s.verborgen) return;
      var key = s.widget === 'hexaco' ? 'hexaco' : /^Ik als officier/.test(s.title) ? 'officier' : /SMART/.test(s.title) ? 'smart' : s.widget;
      var vis = PF_VIS[key] ? PF_VIS[key](s) : '';
      var qa = key === 'cadet-profile' ? '' : pfQA(s, key === 'smart' ? function () { return true; } : null);
      var title = String(s.title || '').replace(/^[^\wÀ-ÿ]+/, '');
      if (vis || qa) out.push({ key: 's' + i, title: title, html: vis + (qa ? pfCard(vis ? 'Mijn antwoorden' : '', qa) : ''), def: s.widget === 'cv' || s.widget === 'groei' ? true : isShared(s.title), cv: s.widget === 'cv', fase: pfFase(String(s.title || '')), nr: i });
    });
    try { out = out.concat(pfExtra()); } catch (e) { /* zonder de nieuwe onderdelen */ }
    // The CV opens the portfolio, right after the table of contents; daarna de rode draad (4.30).
    out.forEach(function (p, i) { p.volg = i; });
    out.sort(function (a, b) { return (b.cv ? 1 : 0) - (a.cv ? 1 : 0) || (a.cv ? 0 : (a.fase - b.fase)) || a.volg - b.volg; });
    return out;
  }
  function pfDoc(parts, sel) {
    var a = function (k) { return answers[k] || ''; }, name = a('Voornaam & Achternaam:') || 'Cadet', photo = kmaStore.getItem('kma-profile-photo') || '';
    var chosen = parts.filter(function (p) { return sel[p.key]; });
    var cover = '<section class="pf-cover"><div class="pf-cover-top"><img src="kma-embleem.svg" alt=""><span>Koninklijke Militaire Academie</span></div>' +
      '<div class="pf-cover-main"><p class="pf-kicker">Ontwikkeling &amp; Reflectie</p><h1>Portfolio</h1><div class="pf-rule"></div>' +
      '<div class="pf-who">' + (photo ? '<img class="pf-photo" alt="" src="' + esc(photo) + '">' : '') + '<div><h2>' + esc(name) + '</h2>' +
      '<p>' + esc([a('OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):'), a('Dienstvak / Wapen / Korps:')].filter(Boolean).join(' · ')) + '</p>' +
      '<p class="pf-cover-small">' + esc([a('Peoplesoft Nummer:') ? 'Peoplesoft ' + a('Peoplesoft Nummer:') : '', a('Registratienummer (RegNr):') ? 'RegNr ' + a('Registratienummer (RegNr):') : ''].filter(Boolean).join(' · ')) + '</p></div></div></div>' +
      '<div class="pf-cover-foot"><span>' + esc(fmtDate(today())) + '</span><span>' + chosen.length + ' onderdelen</span></div></section>';
    var toc = '<section class="pf-sec pf-toc"><div class="pf-sec-head"><span>Inhoud</span><h2>Wat zit er in dit portfolio</h2></div><ol>' +
      chosen.map(function (p, i) { return '<li><b>' + String(i + 1).padStart(2, '0') + '</b>' + esc(p.title) + '</li>'; }).join('') + '</ol>' +
      '<p class="pf-muted">Gemaakt met het KMA Reflectieboekje. De onderdelen zijn door de cadet zelf gekozen.</p></section>';
    var vorige = -1;
    return cover + toc + chosen.map(function (p, i) {
      var kop = '';
      // de stap van de rode draad staat in de kop zelf (geen los regeltje dat op een eigen pagina kan belanden)
      if (!p.cv && p.fase !== vorige && p.fase < PF_FASEN.length) { kop = ' data-fase="' + esc((p.fase < 5 ? 'Stap ' + (p.fase + 1) + ' · ' : '') + PF_FASEN[p.fase]) + '"'; vorige = p.fase; }
      return '<section class="pf-sec"><div class="pf-sec-head"><span>' + String(i + 1).padStart(2, '0') + '</span>' + '<h2' + kop + '>' + esc(p.title) + '</h2>' + '</div>' + p.html + '</section>';
    }).join('');
  }
  function pfSel(parts) {
    var saved = getX('portfolio', {}), sel = {};
    parts.forEach(function (p) { sel[p.key] = p.key in saved ? !!saved[p.key] : p.def; });
    return sel;
  }
  function pfRender(ov) {
    var parts = pfParts(), sel = pfSel(parts), n = parts.filter(function (p) { return sel[p.key]; }).length;
    ov.querySelector('.kma-pf-pick').innerHTML = '<p><strong>Kies wat erin komt</strong> · ' + n + ' van ' + parts.length + ' onderdelen. Alleen hoofdstukken met inhoud staan in de lijst.</p>' +
      '<div class="kma-chips">' + parts.map(function (p) { return '<button type="button" class="kma-chip-btn' + (sel[p.key] ? ' on' : '') + '" data-pfk="' + p.key + '" aria-pressed="' + !!sel[p.key] + '">' + esc(p.title) + '</button>'; }).join('') + '</div>';
    ov.querySelector('.kma-pf-doc').innerHTML = parts.length ? pfDoc(parts, sel) : '<p class="pf-empty">Je hebt nog niets ingevuld. Werk eerst een paar hoofdstukken uit; dan vult je portfolio zich vanzelf.</p>';
    ov.querySelector('[data-act="pf-print"]').disabled = !n;
    var st = document.getElementById('kma-pf-page');
    if (!st) { st = document.createElement('style'); st.id = 'kma-pf-page'; document.head.appendChild(st); }
    var nm = String(answers['Voornaam & Achternaam:'] || 'Cadet').replace(/["\\\n]/g, '');
    st.textContent = '@media print { @page { @bottom-left { content: "Portfolio · ' + nm + '"; font: 8pt sans-serif; color: #7a7f78; } @bottom-right { content: counter(page); font: 8pt sans-serif; color: #7a7f78; } } @page :first { @bottom-left { content: none; } @bottom-right { content: none; } } }';
  }
  window.kmaPortfolio = function () {
    var old = document.querySelector('.kma-pf'); if (old) old.remove();
    var ov = document.createElement('div');
    ov.className = 'kma-pf';
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Portfolio');
    ov.innerHTML = '<div class="kma-pf-bar"><button type="button" class="kma-icon-btn" data-act="pf-close">' + icon('x') + 'Sluiten</button><strong>Portfolio</strong>' +
      '<button type="button" class="kma-icon-btn is-primary" data-act="pf-print">' + icon('download') + 'Download als PDF</button></div>' +
      '<div class="kma-pf-pick"></div><p class="kma-pf-tip">Kies bij het afdrukken <b>Opslaan als PDF</b> als printer.</p><div class="kma-pf-doc"></div>';
    document.body.appendChild(ov);
    document.body.classList.add('kma-pf-open');
    pfRender(ov);
  };
  document.addEventListener('click', function (e) {
    var ov = e.target.closest && e.target.closest('.kma-pf'); if (!ov) return;
    var b = e.target.closest('[data-pfk]');
    if (b) {
      var parts = pfParts(), sel = pfSel(parts), k = b.getAttribute('data-pfk');
      sel[k] = !sel[k]; setX('portfolio', sel); pfRender(ov); return;
    }
    if (e.target.closest('[data-act="pf-close"]')) { ov.remove(); document.body.classList.remove('kma-pf-open', 'kma-print-pf'); return; }
    if (e.target.closest('[data-act="pf-print"]')) {
      document.body.classList.add('kma-print-pf');
      var prev = document.title; document.title = 'Portfolio_' + String(answers['Voornaam & Achternaam:'] || 'Cadet').replace(/[^A-Za-z0-9À-ÿ]+/g, '_');
      try { window.print(); } finally { setTimeout(function () { document.title = prev; }, 1500); }
    }
  });
  window.addEventListener('afterprint', function () { document.body.classList.remove('kma-print-pf'); });

  /* After the first render, apply our renderers */
  if (document.readyState !== 'loading') renderStep();
})();
