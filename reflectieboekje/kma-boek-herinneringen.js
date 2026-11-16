/*
 * Reflectieboekje: herinneringen (4.4.0).
 * De cadet kiest in ⋮ → Herinneringen welke meldingen de telefoon geeft:
 *  - de wekelijkse SMART-check-in (dag en tijd zelf te kiezen);
 *  - de evaluatiedatum van de SMART-leervraag (3 dagen ervoor en op de dag zelf, om 9.00 uur);
 *  - nieuwe feedback van de teamleider (als die via de deelmap binnenkomt);
 *  - een back-up, als de laatste back-up 30 dagen oud is.
 * Er gaat niets naar de teamleider: de meldingen staan alleen op het eigen toestel.
 *
 * Zo komt de melding op het toestel:
 *  - Android, iPhone en Windows: de app plant de meldingen (window.Android.remindersSet(json)). Op Android en
 *    iPhone komen ze ook als de app dicht is; op Windows zolang het programma open is.
 *  - Web-app: alleen zolang de pagina open is, en alleen als de browser meldingen toestaat.
 * De lijst met geplande meldingen wordt opnieuw berekend bij het starten, bij elke wijziging van de instellingen,
 * van de evaluatiedatum en na een back-up. kmaReminders.build() is de berekening (zonder bijwerkingen, getest).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaStore) return;
  var icon = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
  var toast = function (m, k) { if (window.kmaToast) kmaToast(m, k); };
  function getX(k, d) { try { var v = kmaStore.getItem('kma-x-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function setX(k, v) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(v)); } catch (e) {} }
  var KEY = 'herinneringen';
  var DEF = { checkin: { on: false, day: 5, time: '16:30' }, evaluatie: { on: false }, feedback: { on: false }, backup: { on: false } };
  var DAGEN = ['', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  var APP = 'Reflectieboekje';

  function settings() {
    var s = getX(KEY, {}), o = JSON.parse(JSON.stringify(DEF));
    Object.keys(o).forEach(function (k) { if (s && s[k] && typeof s[k] === 'object') Object.keys(s[k]).forEach(function (f) { o[k][f] = s[k][f]; }); });
    o.checkin.day = Math.min(7, Math.max(1, parseInt(o.checkin.day, 10) || 5));
    if (!/^\d{2}:\d{2}$/.test(o.checkin.time || '')) o.checkin.time = '16:30';
    return o;
  }
  function anyOn() { var s = settings(); return !!(s.checkin.on || s.evaluatie.on || s.feedback.on || s.backup.on); }

  /* ---------------- De berekening ---------------- */
  function atTime(dateIso, hhmm) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateIso || ''), t = /^(\d{2}):(\d{2})$/.exec(hhmm || '09:00');
    if (!m || !t) return null;
    return new Date(+m[1], +m[2] - 1, +m[3], +t[1], +t[2], 0, 0).getTime();
  }
  /** De geplande meldingen. s = instellingen, d = { smartDate, lastBackup, firstUse }, now = tijd in ms. */
  function build(s, d, now) {
    s = s || settings(); d = d || {}; now = now || Date.now();
    var out = [];
    if (s.checkin.on) {
      var n = new Date(now), want = s.checkin.day % 7, t = s.checkin.time.split(':');
      var c = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +t[1], 0, 0);
      var add = (want - c.getDay() + 7) % 7;
      c.setDate(c.getDate() + add);
      if (c.getTime() <= now) c.setDate(c.getDate() + 7);
      out.push({ id: 101, at: c.getTime(), weekly: true, day: s.checkin.day, time: s.checkin.time, title: APP + ' · SMART-check-in', text: 'Is het je deze week gelukt met je leervraag? Tik om in te vullen.' });
    }
    if (s.evaluatie.on && d.smartDate) {
      var e0 = atTime(d.smartDate, '09:00');
      if (e0) {
        var e3 = e0 - 3 * 864e5;
        if (e3 > now) out.push({ id: 201, at: e3, title: APP + ' · evaluatie over 3 dagen', text: 'Je SMART-leervraag wordt op ' + fmt(d.smartDate) + ' geëvalueerd. Bereid je gesprek voor.' });
        if (e0 > now) out.push({ id: 202, at: e0, title: APP + ' · evaluatie vandaag', text: 'Vandaag evalueer je je SMART-leervraag. Succes!' });
      }
    }
    if (s.backup.on) {
      var base = d.lastBackup ? Date.parse(d.lastBackup) : (d.firstUse ? atTime(d.firstUse, '19:00') : now);
      var b = new Date((base || now) + 30 * 864e5); b.setHours(19, 0, 0, 0);
      var bt = b.getTime(); if (bt <= now) { var tm = new Date(now + 864e5); tm.setHours(19, 0, 0, 0); bt = tm.getTime(); }
      out.push({ id: 301, at: bt, title: APP + ' · tijd voor een back-up', text: 'Alles staat alleen op je telefoon. Maak een back-up via ⋮ → Back-up maken.' });
    }
    return out;
  }
  function fmt(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? Number(m[3]) + '-' + Number(m[2]) + '-' + m[1] : iso; }
  function data() { return { smartDate: getX('smart-date', ''), lastBackup: getX('last-backup', ''), firstUse: getX('first-use', '') }; }

  /* ---------------- Naar het toestel ---------------- */
  var A = function () { return window.Android && typeof window.Android.remindersSet === 'function' ? window.Android : null; };
  function nativeAllowed() { try { return A() && A().remindersAllowed ? !!A().remindersAllowed() : true; } catch (e) { return true; } }
  var webTimer = null;
  function sync() {
    var list = build(settings(), data(), Date.now());
    setX('herinneringen-plan', list);
    if (A()) { try { A().remindersSet(JSON.stringify(list)); } catch (e) { console.error(e); } return list; }
    // Web: zolang de pagina open is.
    clearInterval(webTimer);
    if (list.length && 'Notification' in window) webTimer = setInterval(webTick, 60000);
    return list;
  }
  function webTick() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    var fired = getX('herinneringen-af', {}), now = Date.now(), changed = false;
    build(settings(), data(), now - 61000).forEach(function (r) {
      if (r.at <= now && !fired[r.id + '@' + r.at]) { show(r.title, r.text); fired[r.id + '@' + r.at] = 1; changed = true; }
    });
    if (changed) setX('herinneringen-af', fired);
  }
  function show(title, text) {
    if (A() && A().notifyNow) { try { A().notifyNow(String(title), String(text)); } catch (e) {} return; }
    try { if ('Notification' in window && Notification.permission === 'granted') new Notification(title, { body: text, icon: 'icon-192.png' }); } catch (e) {}
  }
  /** Vraagt toestemming voor meldingen; cb(true/false). */
  var pendingAsk = null;
  window.kmaRemindersPermission = function (ok) { var f = pendingAsk; pendingAsk = null; if (f) f(!!ok); };
  function ask(cb) {
    if (A()) {
      if (nativeAllowed()) { cb(true); return; }
      if (A().remindersAsk) { pendingAsk = cb; try { A().remindersAsk(); } catch (e) { pendingAsk = null; cb(false); } setTimeout(function () { if (pendingAsk === cb) { pendingAsk = null; cb(nativeAllowed()); } }, 20000); return; }
      cb(true); return;
    }
    if (!('Notification' in window)) { cb(false); return; }
    if (Notification.permission === 'granted') { cb(true); return; }
    try { Notification.requestPermission().then(function (p) { cb(p === 'granted'); }, function () { cb(false); }); } catch (e) { cb(false); }
  }

  /* ---------------- Het scherm ---------------- */
  var LAB = { checkin: 'Wekelijkse SMART-check-in', evaluatie: 'Herinnering evaluatiedatum', feedback: 'Melding bij nieuwe feedback', backup: 'Herinnering back-up' };
  function sw(name, on) { return '<label class="kma-rem-sw"><input type="checkbox" data-rem="' + name + '" aria-label="' + LAB[name] + '"' + (on ? ' checked' : '') + '/><i aria-hidden="true"></i></label>'; }
  function open() {
    var s = settings(), web = !A();
    var ov = document.createElement('div');
    ov.className = 'kma-sheet-overlay in kma-rem-ov';
    ov.innerHTML = '<div class="kma-sheet kma-rem" role="dialog" aria-modal="true" aria-labelledby="kma-rem-h" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<h2 id="kma-rem-h">' + icon('bell') + 'Herinneringen</h2>' +
      '<p class="kma-rem-intro">' + (web ? 'De web-app geeft alleen een melding zolang deze pagina open is. Met de app op je telefoon komen meldingen ook als de app dicht is.' :
        (window.KMA_PLATFORM === 'windows' ? 'Je krijgt een melding zolang het programma open is.' : 'Je telefoon geeft een melding, ook als de app dicht is.')) + ' Er gaat niets naar je teamleider.</p>' +
      '<div class="kma-rem-row"><span><b>Wekelijkse SMART-check-in</b><small>Elke week een seintje om je leervraag te checken</small></span>' + sw('checkin', s.checkin.on) + '</div>' +
      '<div class="kma-rem-sub"><label for="kma-rem-day">Dag</label><select id="kma-rem-day">' + [1, 2, 3, 4, 5, 6, 7].map(function (d) { return '<option value="' + d + '"' + (d === s.checkin.day ? ' selected' : '') + '>' + DAGEN[d].charAt(0).toUpperCase() + DAGEN[d].slice(1) + '</option>'; }).join('') + '</select>' +
      '<label for="kma-rem-time">Tijd</label><input type="time" id="kma-rem-time" value="' + s.checkin.time + '"/></div>' +
      '<div class="kma-rem-row"><span><b>Evaluatiedatum</b><small>' + (getX('smart-date', '') ? 'Een melding 3 dagen ervoor en op de dag zelf (' + fmt(getX('smart-date', '')) + ')' : 'Vul eerst een evaluatiedatum in bij je SMART-leervraag') + '</small></span>' + sw('evaluatie', s.evaluatie.on) + '</div>' +
      '<div class="kma-rem-row"><span><b>Nieuwe feedback</b><small>Als er feedback van je teamleider binnenkomt in de deelmap</small></span>' + sw('feedback', s.feedback.on) + '</div>' +
      '<div class="kma-rem-row"><span><b>Back-up</b><small>Als je laatste back-up ouder is dan 30 dagen</small></span>' + sw('backup', s.backup.on) + '</div>' +
      '<div class="kma-row-btns kma-rem-btns"><button type="button" class="kma-icon-btn" data-rem-test>' + icon('bell') + 'Probeer een melding</button><button type="button" class="kma-icon-btn is-primary" data-rem-close>' + icon('check') + 'Klaar</button></div></div>';
    document.body.appendChild(ov);
    var save = function () {
      var n = settings();
      ['checkin', 'evaluatie', 'feedback', 'backup'].forEach(function (k) { var c = ov.querySelector('[data-rem="' + k + '"]'); n[k].on = !!(c && c.checked); });
      n.checkin.day = parseInt(ov.querySelector('#kma-rem-day').value, 10) || 5;
      n.checkin.time = ov.querySelector('#kma-rem-time').value || '16:30';
      setX(KEY, n); sync();
      if (window.kmaVandaag) try { kmaVandaag.render(); } catch (e) {}
    };
    ov.addEventListener('change', function (e) {
      var c = e.target.closest('[data-rem]');
      if (c && c.checked) {
        ask(function (ok) {
          if (!ok) { c.checked = false; save(); toast(web ? 'Je browser staat geen meldingen toe. Zet ze aan in de instellingen van je browser.' : 'Meldingen staan uit voor deze app. Zet ze aan in de instellingen van je toestel.', 'error'); return; }
          save();
        });
        return;
      }
      save();
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-rem-close]')) { save(); ov.remove(); if (anyOn()) toast('Herinneringen opgeslagen'); return; }
      if (e.target.closest('[data-rem-test]')) {
        ask(function (ok) {
          if (!ok) { toast('Meldingen staan uit. Zet ze aan in de instellingen.', 'error'); return; }
          show(APP, 'Zo ziet een herinnering eruit.');
          if (!A()) toast('Er is een melding verstuurd');
        });
      }
    });
  }

  /* ---------------- Wanneer opnieuw berekenen ---------------- */
  document.addEventListener('change', function (e) { if (e.target && e.target.id === 'kma-smart-date') setTimeout(sync, 50); });
  kmaAfter('kmaMarkBackup', function () { setTimeout(sync, 50); });
  kmaAfter('exportAnswers', function () { setTimeout(sync, 100); });
  // Nieuwe feedback uit de deelmap
  if (window.kmaFeedback && kmaFeedback.accept) {
    var acc = kmaFeedback.accept;
    kmaFeedback.accept = function (d, opt) {
      var r = acc.apply(this, arguments);
      try { if (r && opt && opt.quiet && settings().feedback.on && !(d && d.receipt && !Object.keys(d.items || {}).length && !(d.cases5GT || []).length)) show(APP + ' · nieuwe feedback', 'Je teamleider heeft feedback gegeven' + (d && d.from ? ' (' + d.from + ')' : '') + '. Tik om te lezen.'); } catch (e) {}
      try { if (window.kmaVandaag) kmaVandaag.render(); } catch (e) {}
      return r;
    };
  }

  window.kmaReminders = { open: open, anyOn: anyOn, sync: sync, build: build, settings: settings, show: show };
  try { if (anyOn()) sync(); } catch (e) { console.error(e); }
})();
