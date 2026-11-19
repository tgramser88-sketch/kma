/*
 * Minder omslachtig (4.11.0, blok I). Werkt in het Reflectieboekje en (concepten) in het CadetVolgSysteem.
 *  1. Concepten: wat je typt in feedback aan een medecadet of een DTF-notitie (CVS) wordt bewaard tot je opslaat
 *     (het DTF-feit in het boekje had dit al, kma-ux-boek.js).
 *     Sluit je per ongeluk het venster of de app, dan staat de tekst er de volgende keer weer.
 *  2. Laatste keuzes: de V's van je vorige DTF-feit en de medecadet en situatie van je vorige
 *     feedback staan alvast klaar.
 *  3. Inbox (alleen boekje): alles wat binnenkomt op één plek; teller op de knop ⋮, Inbox bovenaan in dat menu.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var st = function () { return window.kmaStore || window.localStorage; };
  function getJ(k, d) { try { var v = JSON.parse(st().getItem(k)); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }
  function setJ(k, v) { try { st().setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m) { if (window.kmaToast) kmaToast(m); }

  /* ---------------- 1. Concepten ---------------- */
  var CKEY = 'kma-x-concepten', IDS = ['kk-sit', 'kk-feit', 'kk-eff', 'kk-tip', 'kk-focus', 'dtf-fact-input'];
  var MAXAGE = 14 * 864e5, suppress = 0, told = {}, timer = null;
  function isConcept(el) { return el && el.id && (IDS.indexOf(el.id) >= 0 || el.hasAttribute('data-concept')) && /^(TEXTAREA|INPUT)$/.test(el.tagName); }
  function drafts() {
    var d = getJ(CKEY, {}), now = Date.now(), ch = false;
    Object.keys(d).forEach(function (k) { if (!d[k] || typeof d[k].v !== 'string' || now - (d[k].at || 0) > MAXAGE) { delete d[k]; ch = true; } });
    if (ch) setJ(CKEY, d);
    return d;
  }
  document.addEventListener('input', function (e) {
    var el = e.target; if (!isConcept(el)) return;
    el.__kmaTouched = true;
    clearTimeout(timer);
    timer = setTimeout(function () {
      var d = drafts(), v = String(el.value || '');
      if (v.trim()) d[el.id] = { v: v.slice(0, 4000), at: Date.now() }; else delete d[el.id];
      setJ(CKEY, d);
    }, 400);
  }, true);
  function restore() {
    if (Date.now() < suppress) return;
    var d = drafts();
    Object.keys(d).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.__kmaRestored || el.__kmaTouched || String(el.value || '').trim()) return;
      el.__kmaRestored = true; el.value = d[id].v;
      var form = el.closest && el.closest('.kma-dtf-form.closed'); if (form) form.classList.remove('closed');
      if (!told[id]) { told[id] = true; toast('Je concept is teruggezet. Je kunt verder waar je was.'); }
    });
  }
  // Opslaan of versturen: daarna is het concept weg (alleen als het veld echt leeg is gemaakt).
  var SAVE = /opslaan|versturen|verstuur|toevoegen|sturen|bewaar/i;
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, [onclick]'); if (!b) return;
    if (!SAVE.test(b.textContent || '') && !/addDTFItem|addDtf|saveDtf/i.test(b.getAttribute('onclick') || '')) return;
    suppress = Date.now() + 1500;
    setTimeout(function () {
      var d = drafts(), ch = false;
      Object.keys(d).forEach(function (id) { var el = document.getElementById(id); if (!el || !String(el.value || '').trim()) { delete d[id]; ch = true; } });
      if (ch) setJ(CKEY, d);
    }, 900);
  }, true);

  /* ---------------- 2. Laatste keuzes ---------------- */
  var KKEY = 'kma-x-laatste-keuze';
  function keuze() { return getJ(KKEY, {}); }
  function setKeuze(k, v) { var o = keuze(); o[k] = v; setJ(KKEY, o); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button, [onclick]'); if (!b) return;
    // DTF-feit opslaan in het boekje: onthoud de gekozen V's
    if (/addDTFItem/.test(b.getAttribute('onclick') || '')) {
      var vs = [].slice.call(document.querySelectorAll('.kma-dtf-v input[type=checkbox]:checked')).map(function (x) { return x.value; });
      setKeuze('dtfV', vs);
    }
    // Feedback aan een medecadet: onthoud aan wie en de situatie
    var aan = document.getElementById('kk-aan'), sit = document.getElementById('kk-sit');
    if ((aan || sit) && SAVE.test(b.textContent || '')) {
      if (aan && aan.value) setKeuze('kkAan', aan.value);
      if (sit && sit.value.trim()) setKeuze('kkSit', sit.value.trim().slice(0, 200));
    }
  }, true);
  function prefill() {
    var k = keuze();
    var box = document.querySelector('.kma-dtf-v');
    if (box && !box.__kmaPre && Array.isArray(k.dtfV) && k.dtfV.length) {
      box.__kmaPre = true;
      if (!box.querySelector('input:checked')) k.dtfV.forEach(function (v) { var i = box.querySelector('input[value="' + v + '"]'); if (i) { i.checked = true; var l = i.closest('label'); if (l) l.classList.add('on'); } });
    }
    var aan = document.getElementById('kk-aan');
    if (aan && !aan.__kmaPre && k.kkAan) { aan.__kmaPre = true; if (aan.tagName === 'SELECT' ? [].some.call(aan.options, function (o) { return o.value === k.kkAan; }) : !aan.value) aan.value = k.kkAan; }
    var sit = document.getElementById('kk-sit');
    if (sit && !sit.__kmaPre && k.kkSit) { sit.__kmaPre = true; if (!String(sit.value || '').trim() && !sit.__kmaRestored) sit.value = k.kkSit; }
  }

  var mo = new MutationObserver(function () { try { restore(); prefill(); } catch (e) {} });
  function start() { if (document.body) { mo.observe(document.body, { childList: true, subtree: true }); restore(); prefill(); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  /* ---------------- 3. Inbox (Reflectieboekje) ---------------- */
  /* global cadets */
  var CVS = typeof cadets !== 'undefined';
  function inboxItems() {
    var out = [];
    try {
      if (window.kmaFeedback && kmaFeedback.unread && kmaFeedback.unread()) { var d = kmaFeedback.latest(); out.push({ n: 1, icon: 'message', label: 'Nieuwe feedback van ' + (d && d.from ? d.from : 'je teamleider'), hint: 'Lezen en verwerken', onClick: function () { kmaFeedback.open && kmaFeedback.open(); } }); }
      var K = window.kmaKameraad;
      if (K) {
        var nk = K.newCount ? K.newCount() : 0;
        if (nk) out.push({ n: nk, icon: 'users', label: nk + (nk === 1 ? ' nieuwe feedbackkaart' : ' nieuwe feedbackkaarten') + ' van medecadetten', hint: 'Bekijken en in je DTF-logboek zetten', onClick: function () { K.inbox(); } });
        var rq = K.requests ? K.requests() : [];
        if (rq.length) out.push({ n: rq.length, icon: 'send', label: rq.length + (rq.length === 1 ? ' medecadet vraagt' : ' medecadetten vragen') + ' om feedback', hint: 'Geef feedback op hun vraag', onClick: function () { K.open(); } });
      }
      var V = window.kmaVandaag && kmaVandaag.items ? kmaVandaag.items() : [];
      V.forEach(function (it) {
        if (it.k === 'gesprek') out.push({ n: 0, icon: 'users', label: it.t, hint: it.s, onClick: function () { window.kmaGesprek && kmaGesprek.open({ datum: it.datum }); } });
        else if (it.k === 'afspraak') out.push({ n: 0, icon: 'check', label: it.t, hint: it.s, onClick: function () { window.goToStep && goToStep(0); } });
        else if (it.k === 'stap') out.push({ n: 0, icon: 'right', label: it.t, hint: it.s, onClick: function () { window.goToStep && goToStep(it.step); } });
        else if (it.k === 'backup') out.push({ n: 0, icon: 'download', label: it.t, hint: 'Tik om nu een back-up te maken', onClick: function () { typeof window.exportAnswers === 'function' && exportAnswers(); } });
      });
    } catch (e) {}
    return out;
  }
  function count() { return inboxItems().reduce(function (a, x) { return a + (x.n || 0); }, 0); }
  function openInbox() {
    var it = inboxItems();
    if (!window.kmaSheet) return;
    kmaSheet({ title: 'Inbox', items: it.length ? it : [{ icon: 'check', label: 'Niets nieuws', hint: 'Nieuwe feedback, kaarten van medecadetten en afspraken komen hier', onClick: function () {} }] });
  }
  // De teller staat op de knop "Meer opties" (⋮); Inbox is daar het eerste item. Geen extra knop: de kopregel is op
  // smalle schermen al vol.
  function badge() {
    var b = document.getElementById('kma-more-btn'); if (!b) return;
    var n = count(), s = b.querySelector('.kma-inbox-n');
    if (n) { if (!s) { s = document.createElement('span'); s.className = 'kma-inbox-n'; b.appendChild(s); } s.textContent = n > 9 ? '9+' : String(n); b.setAttribute('aria-label', 'Meer opties, ' + n + ' nieuw in je inbox'); }
    else { if (s) s.remove(); b.setAttribute('aria-label', 'Meer opties'); }
  }
  if (!CVS) {
    window.kmaInbox = { open: openInbox, items: inboxItems, count: count, refresh: badge, hint: function () { var n = count(); return n ? n + ' nieuw' : 'Niets nieuws'; } };
    setTimeout(badge, 1500);
    setInterval(badge, 20000);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) badge(); });
  }
  window.kmaGemak = { drafts: drafts, keuze: keuze, _ids: IDS };
})();
