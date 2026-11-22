/*
 * Automatische reservekopie (4.13.0, blok I punt 10).
 * Eén keer per week (en bij het openen als de laatste ouder is dan 7 dagen) maakt het boekje zelf een versleutelde
 * reservekopie van alles wat in een gewone back-up zit.
 *  - Versleuteld met AES-GCM (256 bit). De sleutel staat alleen op deze telefoon (in de beveiligde opslag van de app)
 *    en gaat nooit mee naar de deelmap of naar de teamleider. Alleen dit toestel kan de kopie dus terugzetten.
 *  - Waar: in de deelmap (map reservekopie/<toestel>/, de laatste 3) als die gekoppeld is; anders één kopie in de app.
 *  - Waartegen: per ongeluk iets gewist, een verkeerde import of beschadigde gegevens. NIET tegen een kapotte of
 *    nieuwe telefoon: daarvoor blijft de gewone back-up (menu ⋮ → Back-up maken) nodig.
 * Menu ⋮ → Reservekopie terugzetten.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
/* global answers, hexacoScores, hexacoSelfAnswers, hexacoObservers, timelineItems, cases5GT, casesKorthagen, dtfItems, jargonItems, fitnessLogs, kmaOfficialSelfForm, importBackupFile */
(function () {
  'use strict';
  if (typeof dtfItems === 'undefined') return;
  var st = function () { return window.kmaStore || window.localStorage; };
  var KEY = 'kma-x-reserve-sleutel', DEV = 'kma-x-reserve-toestel', LAST = 'kma-x-reserve-laatste', LOCAL = 'kma-x-reserve-kopie';
  var WEEK = 7 * 864e5, KEEP = 3, subtle = window.crypto && crypto.subtle;
  function b64(u) { var s = ''; for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(t) { var s = atob(t), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  function get(k) { try { return st().getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { st().setItem(k, v); return true; } catch (e) { return false; } }
  function device() { var d = get(DEV); if (!d) { d = 't' + Math.random().toString(36).slice(2, 10); set(DEV, d); } return d; }
  function key() {
    var raw = get(KEY);
    if (raw) return subtle.importKey('raw', unb64(raw), 'AES-GCM', false, ['encrypt', 'decrypt']);
    return subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']).then(function (k) {
      return subtle.exportKey('raw', k).then(function (r) { set(KEY, b64(new Uint8Array(r))); return k; });
    });
  }
  /** Hetzelfde als de gewone back-up (exportAnswers), zonder tekstbestand. */
  function build() {
    var o = { answers: answers, persItemSet: 'ipip-hexaco-96', hexaco: hexacoScores, hexacoSelf: hexacoSelfAnswers, hexacoObservers: hexacoObservers, timeline: timelineItems, cases5GT: cases5GT, casesKorthagen: casesKorthagen, dtf: dtfItems, jargon: jargonItems, fitness: fitnessLogs, profilePhoto: get('kma-profile-photo') || '', kmaOfficialSelfForm: kmaOfficialSelfForm, officialKMAForm: kmaOfficialSelfForm };
    if (window.kmaCollectExtras) o.extras = kmaCollectExtras(false);
    return JSON.stringify(o);
  }
  function seal(text) {
    return key().then(function (k) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      return subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, new TextEncoder().encode(text)).then(function (c) {
        return JSON.stringify({ type: 'kma-reservekopie', v: 1, at: new Date().toISOString(), dev: device(), iv: b64(iv), c: b64(new Uint8Array(c)) });
      });
    });
  }
  function open(env) {
    var e = typeof env === 'string' ? JSON.parse(env) : env;
    if (!e || e.type !== 'kma-reservekopie') return Promise.reject(new Error('geen reservekopie'));
    return key().then(function (k) { return subtle.decrypt({ name: 'AES-GCM', iv: unb64(e.iv) }, k, unb64(e.c)); }).then(function (p) { return new TextDecoder().decode(p); });
  }
  function dir() { return 'reservekopie/' + device(); }
  function deel() { var F = window.kmaDeelFS; return F && F.ok && F.ok() ? F : null; }
  /** Maakt nu een reservekopie. Geeft een Promise met waar hij staat ('deelmap' of 'app'). */
  function make() {
    if (!subtle) return Promise.reject(new Error('versleutelen kan niet op dit toestel'));
    return seal(build()).then(function (env) {
      var F = deel(), where = 'app';
      if (F) {
        var name = dir() + '/reservekopie-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.kmar';
        if (F.write(name, env)) {
          where = 'deelmap';
          var l = (F.list(dir()) || []).map(function (x) { return typeof x === 'string' ? x : x.name; }).filter(function (n) { return /\.kmar$/.test(n); }).sort();
          l.slice(0, Math.max(0, l.length - KEEP)).forEach(function (n) { F.remove(dir() + '/' + n.split('/').pop()); });
        }
      }
      if (where === 'app' && !window.KMA_CAP) where = set(LOCAL, env) ? 'app' : 'niet';
      else if (where === 'app') set(LOCAL, env);
      if (where !== 'niet') set(LAST, new Date().toISOString());
      return where;
    });
  }
  function age() { var t = Date.parse(get(LAST) || ''); return isNaN(t) ? null : Math.floor((Date.now() - t) / 864e5); }
  function due() { var t = Date.parse(get(LAST) || ''); return isNaN(t) || Date.now() - t >= WEEK; }
  function hasData() { return (dtfItems || []).length || Object.keys(answers || {}).length > 3; }
  // Automatisch alleen in de app of met een deelmap; in de browser zou een extra kopie de opslag vullen.
  function auto() { if (due() && hasData() && (deel() || window.KMA_CAP)) make().catch(function () {}); }
  /** Lijst met reservekopieën (nieuwste eerst): { at, bron, env }. */
  function list() {
    var out = [], F = deel();
    if (F) (F.list(dir()) || []).forEach(function (x) { var n = typeof x === 'string' ? x : x.name; if (!/\.kmar$/.test(n)) return; var t = F.read(dir() + '/' + n.split('/').pop()); try { var e = JSON.parse(t); out.push({ at: e.at, bron: 'deelmap', env: e }); } catch (er) {} });
    var l = get(LOCAL); if (l) try { var e = JSON.parse(l); out.push({ at: e.at, bron: 'in de app', env: e }); } catch (er) {}
    return out.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  }
  function fmt(iso) { var d = new Date(iso); return isNaN(d) ? iso : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }); }
  function restore(env) {
    return open(env).then(function (text) {
      var f = new File([text], 'reservekopie.json', { type: 'application/json' });
      importBackupFile({ target: { files: [f] } });
    });
  }
  function dialog() {
    var l = list();
    if (!window.kmaSheet) return;
    kmaSheet({ title: 'Reservekopie terugzetten', items: (l.length ? l.slice(0, 6).map(function (x) {
      return { icon: 'refresh', label: fmt(x.at), hint: 'Opgeslagen ' + x.bron + ' · tik om terug te zetten', onClick: function () {
        (window.kmaConfirm ? kmaConfirm('Je boekje terugzetten naar de reservekopie van ' + fmt(x.at) + '? Wat je daarna hebt ingevuld, is dan weg.', { ok: 'Terugzetten', danger: true }) : Promise.resolve(confirm('Terugzetten?')))
          .then(function (ok) { if (ok) restore(x.env).catch(function () { window.kmaToast && kmaToast('Deze reservekopie kan op dit toestel niet worden geopend.', 'error'); }); });
      } };
    }) : [{ icon: 'info', label: 'Nog geen reservekopie', hint: 'Het boekje maakt er elke week zelf een', onClick: function () {} }])
      .concat([{ icon: 'download', label: 'Nu een reservekopie maken', hint: deel() ? 'Versleuteld in de deelmap; alleen deze telefoon kan hem openen' : 'Versleuteld in de app', onClick: function () { make().then(function (w) { window.kmaToast && kmaToast(w === 'niet' ? 'Reservekopie maken lukte niet' : 'Reservekopie gemaakt (' + (w === 'deelmap' ? 'in de deelmap' : 'in de app') + ')'); }); } }]) });
  }
  window.kmaReserve = { make: make, list: list, restore: restore, open: dialog, age: age, _open: open };
  setTimeout(auto, 8000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(auto, 3000); });
})();
