/*
 * Reflectieboekje: feedback from the teamleider / senior-instructeur.
 * The instructor sends a file from the CadetVolgSysteem (Dossier ⋮ → Feedback naar cadet sturen);
 * the cadet reads it in via ⋮ → Feedback van je teamleider → Feedback importeren (or Backup importeren).
 * Each piece of feedback is shown in the chapter it belongs to.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaStore) return;
  var KEY = 'kma-x-feedback';
  var icon = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var toast = function (m) { if (window.kmaToast) kmaToast(m); };

  /* Which chapter each feedback field belongs to (keys as used by the CadetVolgSysteem). */
  var PLACE = {
    algemeen: { label: 'Algemene feedback', step: function (s, i) { return i === 0; } },
    attachments: { label: 'Bij je documenten', step: function (s, i) { return i === 0; } },
    h1_intro: { label: 'Introductie & Drijfveren', step: function (s) { return /^Introductie/.test(s.title); } },
    h2_timeline: { label: 'Ontwikkelbiografie', step: function (s) { return /Ontwikkelbiografie/.test(s.title); } },
    hexaco: { label: 'Persoonlijkheid', step: function (s) { return s.widget === 'hexaco'; } },
    h4_gedragscode: { label: 'Ik en de Gedragscode Defensie', step: function (s) { return s.widget === 'gedragscode-form'; } },
    h5_smart: { label: 'SMART-leervraag', step: function (s) { return /SMART/.test(s.title); } },
    h5_zelf: { label: 'Zelfbeoordeling', step: function (s) { return /^Zelfbeoordelingsformulier/.test(s.title); } },
    h6_officier: { label: 'Ik als officier', step: function (s) { return /^Ik als officier/.test(s.title); } },
    h10_analyse: { label: 'Probleem- en behoefteanalyse', step: function (s) { return /^Probleem/.test(s.title); } },
    h13_voorbereiding: { label: 'Voorbereiding beoordelingsgesprek', step: function (s) { return /^Voorbereiding/.test(s.title); } },
    h14_groei: { label: 'Mijn groei & ontwikkeling', step: function (s) { return s.widget === 'groei'; } },
    '5gt': { label: '5G-T-reflecties', step: function (s) { return s.widget === '5gt-multi'; } },
    korthagen: { label: 'Korthagen-reflecties', step: function (s) { return s.widget === 'korthagen-multi'; } },
    dtf: { label: 'DTF-logboek', step: function (s) { return s.widget === 'dtf-logbook'; } }
  };

  function load() { try { return JSON.parse(kmaStore.getItem(KEY)) || { received: [] }; } catch (e) { return { received: [] }; } }
  function save(st) { try { kmaStore.setItem(KEY, JSON.stringify(st)); } catch (e) { alert('Feedback kon niet worden opgeslagen.'); } }
  function latest() { var st = load(); return st.received[0] || null; }
  function unread() { var st = load(); return !!(st.received[0] && st.seen !== st.received[0].date); }
  function markSeen() { var st = load(); if (st.received[0]) { st.seen = st.received[0].date; save(st); } updateBanner(); }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function myName() { var a = typeof answers !== 'undefined' ? answers : {}; return a['Voornaam & Achternaam:'] || a['Voornaam + Achternaam:'] || ''; }

  /* ---------------- Import ---------------- */
  function isFeedback(d) { return d && d.type === 'kma-feedback' && typeof d.items === 'object'; }
  var RKEY = 'kma-x-receipt';
  function receipt() { try { return JSON.parse(kmaStore.getItem(RKEY)) || null; } catch (e) { return null; } }
  function onlyReceipt(d) {
    return !Object.keys(d.items || {}).length && !(d.cases5GT || []).length && !(d.casesKorthagen || []).length && !(d.dtfNotes || []).length && !d.form && !(d.plans || []).length && !(d.gesprekken || []).length && !Object.keys(d.drie || {}).length;
  }
  function accept(d, opt) {
    opt = opt || {};
    var mine = myName().trim().toLowerCase(), theirs = String((d.cadet && d.cadet.name) || '').trim().toLowerCase();
    if (mine && theirs && mine !== theirs && !opt.nameOk) {
      // 4.6.0: de vraag in de stijl van de app; bij Toch inlezen gaat het gewoon verder
      kmaConfirm('Deze feedback is voor "' + d.cadet.name + '", maar jouw naam in het Reflectieboekje is "' + myName() + '".\n\nToch inlezen?', { ok: 'Toch inlezen', danger: false })
        .then(function (ok) { if (ok) accept(d, Object.assign({}, opt, { nameOk: true })); });
      return 'gevraagd';
    }
    if (d.receipt && d.receipt.at) {
      try { kmaStore.setItem(RKEY, JSON.stringify({ at: d.receipt.at, sharedAt: d.receipt.sharedAt || '', from: d.from || '' })); } catch (e) {}
      if (onlyReceipt(d)) {
        toast('Je teamleider heeft je dossier ontvangen op ' + fmtDate(d.receipt.at));
        return true;
      }
    }
    var st = load();
    st.received = (st.received || []).filter(function (x) { return x.date !== d.date; });
    st.received.unshift({ date: d.date || new Date().toISOString(), from: d.from || '', items: d.items || {}, cases5GT: d.cases5GT || [], casesKorthagen: Array.isArray(d.casesKorthagen) ? d.casesKorthagen : [], plans: Array.isArray(d.plans) ? d.plans : [], gesprekken: Array.isArray(d.gesprekken) ? d.gesprekken : [], dtfNotes: d.dtfNotes || [], form: d.form || null, toets: d.toets && typeof d.toets === 'object' ? d.toets : null, drie: d.drie && typeof d.drie === 'object' ? d.drie : {} });
    st.received = st.received.slice(0, 10);
    save(st);
    toast(opt.quiet ? 'Nieuwe feedback van je teamleider' : 'Feedback van je teamleider ingelezen');
    if (typeof renderStep === 'function') renderStep();
    updateBanner();
    if (!opt.quiet) setTimeout(openOverview, 250);
    return true;
  }
  function pickFile() {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json'; inp.style.display = 'none';
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.remove();
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var d; try { d = kmaLees(r.result); } catch (e) { alert('Dit bestand kan niet worden gelezen.'); return; }
        if (!isFeedback(d)) { alert('Dit is geen feedbackbestand. Kies het bestand KMA_Feedback_….json dat je teamleider je stuurde.'); return; }
        accept(d);
      };
      r.readAsText(f);
    });
    document.body.appendChild(inp); inp.click();
  }
  // A feedback file chosen via "Backup importeren" is recognised too, instead of being treated as a backup.
  if (typeof importBackupFile === 'function') {
    var origImport = importBackupFile;
    window.importBackupFile = importBackupFile = function (event) {
      var input = event && event.target, f = input && input.files && input.files[0];
      if (!f) return origImport.apply(this, arguments);
      var self = this, args = arguments;
      // The file input is cleared right after this handler, so hand the original a stable copy of the event.
      var ev = { target: { files: [f], value: '' } };
      f.text().then(function (t) {
        var d = null; try { d = kmaLees(t); } catch (e) {}
        if (isFeedback(d)) accept(d); else origImport.call(self, ev);
      }, function () { origImport.call(self, ev); });
    };
  }

  /* ---------------- Feedback with one reflection ---------------- */
  function findCase(cases, f) {
    return (cases || []).find(function (c) { return c && ((f.id != null && String(c.id) === String(f.id)) || (f.id == null && c.title && c.title === f.title)); });
  }
  /** The teamleider's feedback on this one reflection (shown in the reflection itself). kind: '5gt' | 'kort'. */
  var visit = { step: -1, keys: [] };
  window.kmaFeedbackFor = function (kind, cs) {
    var d = latest(); if (!d || !cs) return '';
    var list = kind === '5gt' ? d.cases5GT : d.casesKorthagen;
    var f = (list || []).find(function (x) { return (x.id != null && String(x.id) === String(cs.id)) || (x.id == null && x.title && x.title === cs.title); });
    if (!f || (!f.feedback && !(f.steps && Object.keys(f.steps).length))) return '';
    // "nieuw" until the cadet has seen it: it stays during this visit to the chapter and is gone the next time.
    var k = d.date + '|' + kind + '|' + (f.id != null ? f.id : f.title), seen = [];
    try { seen = JSON.parse(kmaStore.getItem('kma-x-fb-seen') || '[]'); } catch (e) {}
    if (typeof currentStepIndex !== 'undefined' && visit.step !== currentStepIndex) { visit.step = currentStepIndex; visit.keys = []; }
    var isNew = seen.indexOf(k) < 0 || visit.keys.indexOf(k) >= 0;
    if (seen.indexOf(k) < 0) { seen.push(k); visit.keys.push(k); try { kmaStore.setItem('kma-x-fb-seen', JSON.stringify(seen.slice(-200))); } catch (e) {} }
    return '<div class="kma-fb-card kma-fb-inline"><div class="kma-fb-head">' + icon('message') + '<div><strong>Feedback van je teamleider' + (isNew ? ' <em class="kma-fb-new">nieuw</em>' : '') + '</strong><small>' +
      esc((d.from ? d.from + ' · ' : '') + fmtDate(d.date)) + '</small></div></div>' + (f.feedback ? textBlock(f.feedback) : '<p class="kma-fb-text muted">Je teamleider gaf feedback bij ' + Object.keys(f.steps).length + (Object.keys(f.steps).length === 1 ? ' stap' : ' stappen') + '; je ziet die bij de stap zelf.</p>') +
      replyHtml(d.date + '|' + kind + ':' + (f.id != null ? f.id : f.title), (kind === '5gt' ? '5G-T: ' : 'Korthagen: ') + (cs.title || '')) + '</div>';
  };

  /* ---------------- Reageren op feedback (4.4.0) ----------------
     Bij elke feedback kan de cadet "Verwerkt" aanvinken en kort reageren. Dat staat in kma-x-fb-reply en gaat
     mee als de cadet zijn dossier deelt; de teamleider ziet het in het CadetVolgSysteem bij de feedback. */
  var RKEY2 = 'kma-x-fb-reply';
  function replies() { try { var r = JSON.parse(kmaStore.getItem(RKEY2) || '{}'); return r && typeof r === 'object' ? r : {}; } catch (e) { return {}; } }
  function saveReply(key, patch) {
    var r = replies(), cur = r[key] || {};
    Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
    cur.at = new Date().toISOString();
    if (!cur.t && !cur.ok) delete r[key]; else r[key] = cur;
    try { kmaStore.setItem(RKEY2, JSON.stringify(r)); } catch (e) {}
  }
  function shortDate(iso) { try { return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }); } catch (e) { return ''; } }
  function replyHtml(key, label) {
    var r = replies()[key] || {};
    return '<div class="kma-fbr" data-fbr="' + esc(key) + '" data-fbr-label="' + esc(label || '') + '">' +
      (r.t ? '<div class="kma-fbr-text"><small>Jouw reactie · ' + esc(shortDate(r.at)) + '</small>' + esc(r.t) + '</div>' : '') +
      '<div class="kma-fbr-acts">' +
      (r.ok ? '<span class="kma-fbr-done">' + icon('check') + 'Verwerkt</span><button type="button" class="kma-fbr-link" data-fbr-act="undo">Toch niet</button>'
        : '<button type="button" class="kma-icon-btn" data-fbr-act="ok">' + icon('check') + 'Verwerkt</button>') +
      '<button type="button" class="kma-icon-btn" data-fbr-act="reply">' + icon('message') + (r.t ? 'Reactie wijzigen' : 'Reageer') + '</button></div></div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fbr-act]'); if (!b) return;
    var box = b.closest('[data-fbr]'), key = box.getAttribute('data-fbr'), act = b.getAttribute('data-fbr-act');
    if (act === 'ok' || act === 'undo') {
      saveReply(key, { ok: act === 'ok', w: box.getAttribute('data-fbr-label') || '' });
      box.outerHTML = replyHtml(key, box.getAttribute('data-fbr-label'));
      if (act === 'ok') toast('Gemarkeerd als verwerkt. Je teamleider ziet dit als je deelt.');
      return;
    }
    if (act === 'reply') {
      var r = replies()[key] || {};
      box.innerHTML = '<label class="kma-fbr-lab" for="fbr-' + esc(key.replace(/[^a-z0-9]/gi, '')) + '">Jouw reactie aan je teamleider</label><textarea id="fbr-' + esc(key.replace(/[^a-z0-9]/gi, '')) + '" maxlength="600" rows="3" placeholder="Bijvoorbeeld: Aangepast, ik evalueer nu op 16 november met mijn buddy.">' + esc(r.t || '') + '</textarea>' +
        '<div class="kma-fbr-acts"><button type="button" class="kma-icon-btn" data-fbr-act="cancel">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-fbr-act="save">' + icon('save') + 'Opslaan</button></div>';
      var ta = box.querySelector('textarea'); if (ta) ta.focus();
      return;
    }
    if (act === 'save') {
      var t = (box.querySelector('textarea') || {}).value || '';
      saveReply(key, { t: t.trim().slice(0, 600), w: box.getAttribute('data-fbr-label') || '' });
      box.outerHTML = replyHtml(key, box.getAttribute('data-fbr-label'));
      toast(t.trim() ? 'Reactie opgeslagen. Je teamleider ziet hem als je deelt.' : 'Reactie verwijderd');
      return;
    }
    if (act === 'cancel') box.outerHTML = replyHtml(key, box.getAttribute('data-fbr-label'));
  });
  window.kmaFeedbackReplies = replies;

  var PLAN_F = [['probleem', 'Probleemstelling'], ['oorzaken', 'Oorzaken'], ['doel', 'Doel'], ['steun', 'Ondersteuning en randvoorwaarden'], ['regie', 'Regie en overlegritme'], ['signalen', 'Signalen om bij te sturen'], ['evaluatie', 'Evaluatie']];
  function planHtml(p) {
    var acts = (p.acties || []).filter(function (a) { return a && (a.wat || a.wie); });
    return '<div class="kma-fb-plan"><div class="kma-fb-plan-top"><strong>' + esc(p.title || 'Plan') + '</strong><span>' + esc(p.status === 'afgerond' ? 'Afgerond' : 'Actief') + '</span></div>' +
      '<small class="muted">' + esc((p.type === 'verbeter' ? 'Verbeterplan' : 'Ontwikkelplan') + (p.by ? ' · ' + p.by : '') + (p.evalDatum ? ' · evaluatie ' + fmtDate(p.evalDatum) : '')) + '</small>' +
      PLAN_F.filter(function (f) { return p[f[0]]; }).slice(0, 3).map(function (f) { return '<p><b>' + f[1] + ':</b> ' + esc(p[f[0]]) + '</p>'; }).join('') +
      (acts.length ? '<ul class="kma-fb-acts">' + acts.map(function (a) { return '<li class="' + (a.klaar ? 'ok' : '') + '">' + esc(a.wat || '') + (a.wie ? ' <em>' + esc(a.wie) + '</em>' : '') + (a.wanneer ? ' <small>' + esc(fmtDate(a.wanneer)) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '') +
      (PLAN_F.filter(function (f) { return p[f[0]]; }).length > 3 ? '<details><summary>Hele plan</summary>' + PLAN_F.filter(function (f) { return p[f[0]]; }).slice(3).map(function (f) { return '<p><b>' + f[1] + ':</b> ' + esc(p[f[0]]) + '</p>'; }).join('') + '</details>' : '') + '</div>';
  }
  /** Een gespreksverslag dat de teamleider meestuurde (4.4.0). */
  function gesprekHtml(g) {
    var acts = (g.afspraken || []).filter(function (a) { return a && a.wat; });
    return '<div class="kma-fb-plan"><div class="kma-fb-plan-top"><strong>' + esc(g.soort || 'Gesprek') + '</strong><span>' + esc(fmtDate(g.datum)) + '</span></div>' +
      (g.besproken ? '<p>' + esc(g.besproken) + '</p>' : '') +
      (acts.length ? '<ul class="kma-fb-acts">' + acts.map(function (a) { return '<li class="' + (a.klaar ? 'ok' : '') + '">' + esc(a.wat) + (a.wie ? ' <em>' + esc(a.wie) + '</em>' : '') + (a.wanneer ? ' <small>' + esc(fmtDate(a.wanneer)) + '</small>' : '') + '</li>'; }).join('') + '</ul>' : '') +
      (g.vervolg ? '<small class="muted">Vervolggesprek: ' + esc(fmtDate(g.vervolg)) + '</small>' : '') + '</div>';
  }
  /** Feedback on one step (5G-T: 's1'…'s4') or phase (Korthagen: 'actie'…) of this reflection. */
  window.kmaStepFeedbackFor = function (kind, cs, step) {
    var d = latest(); if (!d || !cs) return '';
    var list = kind === '5gt' ? d.cases5GT : d.casesKorthagen;
    var f = (list || []).find(function (x) { return (x.id != null && String(x.id) === String(cs.id)) || (x.id == null && x.title && x.title === cs.title); });
    var t = f && f.steps && f.steps[step];
    if (!t) return '';
    return '<div class="kma-fb-step">' + icon('message') + '<div><strong>Feedback op deze stap</strong>' + textBlock(t) + '</div></div>';
  };

  /* ---------------- Showing it ---------------- */
  function head(title, d) {
    return '<div class="kma-fb-head">' + icon('message') + '<div><strong>' + esc(title) + '</strong><small>' +
      esc((d.from ? d.from + ' · ' : 'Je teamleider · ') + fmtDate(d.date)) + '</small></div></div>';
  }
  function textBlock(t) { return '<p class="kma-fb-text">' + esc(t) + '</p>'; }
  function formHtml(f) {
    var V = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'];
    if (f && f.v === 2) {
      var nl = function (d) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || ''); return m ? m[3] + '-' + m[2] + '-' + m[1] : (d || ''); };
      return '<div class="kma-fb-form"><table><tr><td></td><th>Per gedragsregel</th><th>Totaal</th></tr>' + V.map(function (v, i) {
        var k = 'v' + (i + 1);
        return '<tr><td>' + (window.kmaVIcon ? kmaVIcon(v) : '') + v + '</td><td>' + esc(((f.scores || {})[k] || []).map(function (s) { return s || '·'; }).join('  ')) + '</td><td><strong>' + esc((f.totals || {})[k] || '-') + '</strong></td></tr>' +
          ((f.toelichting || {})[k] ? '<tr><td colspan="3" class="kma-fb-sub">' + esc(f.toelichting[k]) + '</td></tr>' : '');
      }).join('') + '</table>' +
        '<p class="muted small">1 = niveau 1 · 2 = niveau 2 · NTB = niet te beoordelen · 0 = onvoldoende</p>' +
        '<p><strong>Totaaloordeel:</strong> ' + esc(f.totaaloordeel || '-') + '</p>' +
        (f.toelichting1 ? '<p><strong>Toelichting 1e beoordelaar:</strong> ' + esc(f.toelichting1) + '</p>' : '') +
        (f.toelichting2 ? '<p><strong>Toelichting 2e beoordelaar:</strong> ' + esc(f.toelichting2) + '</p>' : '') +
        (f.beoordelaar ? '<p class="muted">Beoordelaar: ' + esc(f.beoordelaar) + (f.datumGesprek ? ' · gesprek ' + esc(nl(f.datumGesprek)) : '') + '</p>' : '') + '</div>';
    }
    return '<div class="kma-fb-form"><table><tr><td></td><th>Niveau 1</th><th>Niveau 2</th></tr>' + V.map(function (v, i) {
      var n = i + 1;
      return '<tr><td>' + v + '</td><td>' + esc(f['v' + n + '_n1_score'] != null ? f['v' + n + '_n1_score'] : '-') + '</td><td>' + esc(f['v' + n + '_n2_score'] != null ? f['v' + n + '_n2_score'] : '-') + '</td></tr>' +
        (f['v' + n + '_text'] ? '<tr><td colspan="3" class="kma-fb-sub">' + esc(f['v' + n + '_text']) + '</td></tr>' : '');
    }).join('') + '</table>' +
      '<p><strong>Totaal:</strong> ' + esc(f.totalScore != null ? f.totalScore + ' / 16' : '-') + (f.eindoordeel ? ' · <strong>Eindoordeel:</strong> ' + esc(f.eindoordeel) : '') + '</p>' +
      (f.motivation ? '<p><strong>Motivatie:</strong> ' + esc(f.motivation) + '</p>' : '') +
      (f.agreements ? '<p><strong>Ontwikkelafspraken:</strong> ' + esc(f.agreements) + '</p>' : '') +
      (f.beoordelaar ? '<p class="muted">Beoordelaar: ' + esc(f.beoordelaar) + (f.datumBeoordeling ? ' · ' + esc(f.datumBeoordeling) : '') + '</p>' : '') + '</div>';
  }
  /* Feedback in drie vragen (Hattie & Timperley, 2007) en een voorgesteld als-dan-plan (4.5.0). */
  var TKEY = 'kma-x-fb-plan-taken';
  function taken() { try { return JSON.parse(kmaStore.getItem(TKEY) || '{}') || {}; } catch (e) { return {}; } }
  function drieHtml(d, k, f) {
    var row = function (ic, lab, t, act) { return t ? '<div class="kma-fb3-row"><span class="kma-fb3-ic' + (act ? ' act' : '') + '" aria-hidden="true">' + icon(ic) + '</span><div><strong>' + lab + '</strong><p>' + esc(t) + '</p></div></div>' : ''; };
    var h = '<div class="kma-fb3-cadet">' + row('flag', 'Waar werk je naartoe', f.fu) + row('eye', 'Hoe gaat het', f.fb) + row('right', 'Volgende stap', f.ff, true);
    if (f.plan && f.plan.als && f.plan.dan) {
      var tk = taken()[d.date + '|' + k];
      h += '<div class="kma-fb3-voorstel" data-fb3-plan="' + esc(d.date + '|' + k) + '"><p>Je teamleider stelt dit voor als plan:</p>' + (window.kmaPlanZin ? kmaPlanZin(f.plan) : '<p class="kma-plan-zin"><strong>Als</strong> ' + esc(f.plan.als) + ', <strong>dan</strong> ' + esc(f.plan.dan) + '</p>') +
        (tk ? '<span class="kma-fbr-done">' + icon('check') + (tk === 'aangepast' ? 'Aangepast overgenomen' : 'Overgenomen') + '</span>'
          : '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-fb3-take="over">' + icon('check') + 'Overnemen</button><button type="button" class="kma-icon-btn" data-fb3-take="edit">' + icon('edit') + 'Aanpassen</button></div>') + '</div>';
    }
    return h + '</div>';
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-fb3-take]'); if (!b) return;
    var box = b.closest('[data-fb3-plan]'), key = box.getAttribute('data-fb3-plan'), d = latest(), k = key.split('|').slice(1).join('|');
    var f = d && d.drie && d.drie[k]; if (!f || !f.plan || !window.kmaPlannen) return;
    var mark = function (v) { var t = taken(); t[key] = v; try { kmaStore.setItem(TKEY, JSON.stringify(t)); } catch (er) {} };
    if (b.getAttribute('data-fb3-take') === 'over') {
      if (kmaPlannen.add({ als: f.plan.als, dan: f.plan.dan, from: d.from || 'je teamleider' })) { mark('over'); toast('Plan overgenomen bij je leervraag'); if (typeof renderStep === 'function') renderStep(); }
    } else { mark('aangepast'); kmaPlannen.openAdd(f.plan); }
  });
  /** De open "volgende stap" uit de laatste feedback (voor de kaart Vandaag), of null als die verwerkt is. */
  function openNextStep() {
    var d = latest(); if (!d || !d.drie) return null;
    var keys = Object.keys(d.drie).filter(function (k) { return d.drie[k] && d.drie[k].ff && PLACE[k]; });
    for (var j = 0; j < keys.length; j++) {
      var i = steps.findIndex(function (s, n) { return PLACE[keys[j]].step(s, n); });
      if (i < 0) continue;
      var r = replies()[d.date + '|h:' + steps[i].title];
      if (!(r && r.ok)) return { text: d.drie[keys[j]].ff, step: i, from: d.from || '' };
    }
    return null;
  }

  /** The feedback card for chapter i (empty string if there is none). */
  function cardFor(i) {
    var d = latest(); if (!d) return '';
    var s = steps[i], parts = [];
    Object.keys(d.items || {}).forEach(function (k) {
      var pl = PLACE[k];
      if (pl ? pl.step(s, i) : i === 0) parts.push((pl ? '<h5>' + esc(pl.label) + '</h5>' : '') + textBlock(d.items[k]));
    });
    Object.keys(d.drie || {}).forEach(function (k) {
      var pl = PLACE[k];
      if (pl && pl.step(s, i)) parts.unshift(drieHtml(d, k, d.drie[k]));
    });
    // Feedback on one reflection is shown with that reflection; only feedback on a reflection that no longer exists stays here.
    var perCase = function (list) { return list.map(function (c) { return '<div class="kma-fb-case"><strong>' + esc(c.title) + '</strong>' + textBlock(c.feedback) + '</div>'; }).join(''); };
    var orphans = function (list, cases) { return (list || []).filter(function (f) { return !findCase(cases, f); }); };
    var o5 = s.widget === '5gt-multi' ? orphans(d.cases5GT, typeof cases5GT !== 'undefined' ? cases5GT : []) : [];
    var ok = s.widget === 'korthagen-multi' ? orphans(d.casesKorthagen, typeof casesKorthagen !== 'undefined' ? casesKorthagen : []) : [];
    if (o5.length) parts.push('<h5>Per reflectie</h5>' + perCase(o5));
    if (ok.length) parts.push('<h5>Per reflectie</h5>' + perCase(ok));
    if (s.widget === 'dtf-logbook' && (d.dtfNotes || []).length) {
      parts.push('<h5>Waarnemingen van je teamleider en instructeurs</h5>' + d.dtfNotes.map(function (n) {
        var sg = n.teken === '+' ? ' pos' : n.teken === '-' ? ' neg' : '';
        return '<div class="kma-fb-case kma-dtf-obs' + sg + '"><small class="muted">' + esc([n.datum, n.tijd, n.by].filter(Boolean).join(' · ')) + (sg ? ' · ' + (n.teken === '+' ? 'positief' : 'negatief') : '') + '</small>' + textBlock(n.feit) +
          ((n.v4 || []).length ? '<span class="kma-fb-tags">' + n.v4.map(function (v) { return '<i>' + esc(v) + '</i>'; }).join('') + '</span>' : '') + '</div>';
      }).join(''));
    }
    if (i === 0 && (d.gesprekken || []).length) parts.push('<h5>Gesprekken met je teamleider</h5>' + d.gesprekken.map(gesprekHtml).join(''));
    if ((d.plans || []).length && /Probleem- en Behoefteanalyse/.test(s.title)) parts.push('<h5>Ontwikkelplan van je teamleider</h5>' + d.plans.map(planHtml).join(''));
    if (d.form && (/Zelfbeoordelingsformulier/.test(s.title) || /Voorbereiding/.test(s.title))) parts.push('<h5>Beoordelingsformulier van je teamleider</h5>' + formHtml(d.form));
    if (!parts.length) return '';
    return '<div class="kma-fb-card" id="kma-fb-card">' + head('Feedback van je teamleider', d) + parts.join('') + replyHtml(d.date + '|h:' + s.title, s.title) + '</div>';
  }
  function chaptersWithFeedback() {
    return steps.map(function (s, i) { return !s.verborgen && cardFor(i) ? i : -1; }).filter(function (i) { return i >= 0; });
  }

  kmaAfter('renderStep', function () {
    var old = document.getElementById('kma-fb-card'); if (old) old.remove();
    var html = cardFor(currentStepIndex);
    if (html) {
      var anchor = document.getElementById('kma-share-holder') || document.querySelector('.section-heading');
      if (anchor) anchor.insertAdjacentHTML('afterend', html);
    }
  });

  function openOverview() {
    if (unread()) markSeen();
    var d = latest();
    var items = [];
    if (d) {
      chaptersWithFeedback().forEach(function (i) {
        items.push({ icon: 'message', label: steps[i].title, hint: 'Ga naar de feedback in dit hoofdstuk', onClick: function () { goToStep(i); } });
      });
      items.unshift({ section: 'Ontvangen ' + fmtDate(d.date) + (d.from ? ' · ' + d.from : '') });
    }
    items.push({ section: 'Bestand' });
    items.push({ icon: 'download', label: 'Feedback importeren', hint: 'Kies het bestand KMA_Feedback_….json van je teamleider', onClick: pickFile });
    if (d) items.push({ icon: 'trash', label: 'Feedback verwijderen', danger: true, onClick: function () { kmaConfirm('Alle ontvangen feedback van dit toestel verwijderen?', { ok: 'Verwijderen', danger: true }).then(function (ok) { if (!ok) return; kmaStore.removeItem(KEY); renderStep(); updateBanner(); }); } });
    kmaSheet({ title: 'Feedback van je teamleider', items: items });
  }

  /* A banner on the first screen when new feedback has arrived. */
  function updateBanner() {
    var old = document.getElementById('kma-fb-banner'); if (old) old.remove();
    if (!unread()) return;
    var target = document.querySelector('.progress-card');
    if (!target) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'kma-fb-banner'; b.className = 'kma-fb-banner';
    b.innerHTML = icon('message') + '<span><strong>Nieuwe feedback van je teamleider</strong><small>Tik om te zien bij welke hoofdstukken</small></span>' + icon('right');
    b.addEventListener('click', function () { markSeen(); openOverview(); });
    target.parentNode.insertBefore(b, target);
  }

  window.kmaFeedback = {
    open: openOverview, import: pickFile, nextStep: openNextStep, accept: accept, latest: latest, cardFor: cardFor, unread: unread, receipt: receipt,
    all: function () { return (load().received || []).slice(); },
    menuHint: function () { var d = latest(); return d ? 'Ontvangen ' + fmtDate(d.date) + (unread() ? ' · nieuw' : '') : 'Bestand van je teamleider inlezen'; }
  };
  updateBanner();
  // The first chapter was drawn before this file loaded.
  try { if (latest() && !document.getElementById('kma-fb-card')) { var h = cardFor(currentStepIndex), an = document.getElementById('kma-share-holder') || document.querySelector('.section-heading'); if (h && an) an.insertAdjacentHTML('afterend', h); } } catch (e) {}
})();
