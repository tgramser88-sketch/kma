/*
 * Web-app: gegevens veilig bewaren (4.5.4).
 * In de web-app staat alles alleen in de opslag van de browser. Die kan verdwijnen: Safari op de iPhone wist
 * hem na 7 dagen zonder gebruik (tenzij de app op het beginscherm staat), iemand wist de browsergegevens, of
 * opent de app in een andere browser. Deze module helpt op vier manieren:
 *  1. Opslagstatus: vraagt de browser de opslag vast te houden en meldt het als dat niet lukt; op de iPhone met
 *     uitleg om de app op het beginscherm te zetten.
 *  2. Back-upherinnering: een balk als de laatste back-up ouder is dan 7 dagen; één tik maakt een volledige
 *     back-up en opent het deelmenu (OneDrive, Bestanden, mail) of slaat hem op in Downloads.
 *  3. Automatische back-up naar een map (Chrome en Edge op een computer): na elke wijziging een back-up in een
 *     zelfgekozen map, bijvoorbeeld in OneDrive. Per dag één bestand; de laatste 14 blijven staan.
 *  4. Snel terugzetten: is de app leeg, dan staat "Back-up terugzetten" meteen bovenaan.
 * Een volledige back-up bevat alle gegevens van deze app op dit toestel (niet de pincode). Beide importknoppen
 * van de app (⋮ → Back-up terugzetten) lezen hem ook in.
 * Alleen in de web-app; de apps op de telefoon en computer bewaren hun gegevens zelf, versleuteld.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (window.KMA_PLATFORM !== 'web' || window.kmaWebSafe) return;
  var LS = null; try { LS = window.localStorage; } catch (e) { return; }
  if (!LS) return;

  var IS_CVS = /volgsysteem/i.test(location.pathname || '');
  var APP = IS_CVS ? 'cvs' : 'boek';
  var NAME = IS_CVS ? 'CadetVolgSysteem' : 'Reflectieboekje';
  var WAT = IS_CVS ? 'je cadetdossiers' : 'je boekje';
  var DAY = 864e5, REMIND_DAYS = 7, KEEP_FILES = 14;
  var UA = navigator.userAgent || '';
  var IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var TOUCH = (window.matchMedia && matchMedia('(pointer: coarse)').matches) || IOS || /Android/i.test(UA);

  /* ---------------- Welke sleutels horen bij deze app ---------------- */
  // Het boekje en het volgsysteem staan op dezelfde website en delen de opslag.
  function cvsKey(k) { return /^(idb:)?kma-(cvs|norm)/.test(k); }
  var SKIP = /^(kma-ui-|kma-eula|kma-large$|kma-contrast$|kma-pin-active|kma-cvs-unlocked|preview-pin)/;
  function ours(k) {
    if (!k || SKIP.test(k) || !/^(idb:)?kma/.test(k)) return false;
    return IS_CVS ? cvsKey(k) : !cvsKey(k);
  }
  // Eigen administratie (kma-ui-: telt niet mee voor de bewaking van andere tabbladen en gaat niet in de back-up)
  var META = 'kma-ui-web-' + APP + '-';
  function meta(k, v) {
    try {
      if (arguments.length < 2) { var x = LS.getItem(META + k); return x == null ? null : JSON.parse(x); }
      if (v == null) LS.removeItem(META + k); else LS.setItem(META + k, JSON.stringify(v));
    } catch (e) { return null; }
    return v;
  }
  function ts(iso) { var t = Date.parse(iso || ''); return isNaN(t) ? 0 : t; }
  function daysAgo(iso) { var t = ts(iso); return t ? Math.floor((Date.now() - t) / DAY) : null; }
  function ago(iso) { var d = daysAgo(iso); return d == null ? 'nog nooit' : d === 0 ? 'vandaag' : d === 1 ? 'gisteren' : d + ' dagen geleden'; }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function toast(m, k) { if (window.kmaToast) kmaToast(m, k || 'info', 4500); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------------- Staat er iets in? ---------------- */
  function hasData() {
    try {
      if (IS_CVS) return typeof cadets !== 'undefined' && Array.isArray(cadets) && cadets.some(function (c) { return c && !c.demo; });
      var n = 0;
      if (typeof answers === 'object' && answers) n += Object.keys(answers).filter(function (k) { return answers[k] && String(answers[k]).trim(); }).length;
      try { if (typeof timelineItems !== 'undefined' && Array.isArray(timelineItems)) n += timelineItems.length; } catch (e) {}
      try { if (typeof dtfItems !== 'undefined' && Array.isArray(dtfItems)) n += dtfItems.length; } catch (e) {}
      // de reflecties beginnen met één lege casus: tel alleen casussen met tekst
      var filled = function (c) { return c && Object.keys(c).some(function (k) { return k !== 'id' && k !== 'title' && k !== 'model' && typeof c[k] === 'string' && c[k].trim(); }); };
      try { if (typeof cases5GT !== 'undefined' && Array.isArray(cases5GT)) n += cases5GT.filter(filled).length; } catch (e) {}
      try { if (typeof casesKorthagen !== 'undefined' && Array.isArray(casesKorthagen)) n += casesKorthagen.filter(filled).length; } catch (e) {}
      return n > 0;
    } catch (e) { return false; }
  }

  /* ---------------- Volledige back-up ---------------- */
  function snapshot() {
    var data = {};
    for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (ours(k)) data[k] = LS.getItem(k); }
    return { kmaWebBackup: 1, app: APP, appNaam: 'KMA ' + NAME, gemaakt: new Date().toISOString(), data: data };
  }
  function isSnapshot(o) { return !!(o && o.kmaWebBackup && o.data && typeof o.data === 'object'); }
  function lastBackup() {
    var a = [meta('backup'), meta('autoLast')];
    if (!IS_CVS) { try { a.push(JSON.parse(LS.getItem('kma-x-last-backup') || 'null')); } catch (e) {} }
    return a.filter(Boolean).sort(function (x, y) { return ts(y) - ts(x); })[0] || null;
  }
  function markBackup(auto) {
    var now = new Date().toISOString();
    meta(auto ? 'autoLast' : 'backup', now);
    if (!auto && !IS_CVS && window.kmaMarkBackup) { try { kmaMarkBackup(); } catch (e) {} }
  }
  function fileName(auto) { return 'KMA_' + NAME + (auto ? '_auto_' : '_volledige_back-up_') + ymd() + '.json'; }
  function download(name, blob) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  /** Back-up maken: op de telefoon via het deelmenu (OneDrive, Bestanden, mail), anders naar Downloads. */
  function backupNow() {
    var name = fileName(false), text = JSON.stringify(snapshot());
    var blob = new Blob([text], { type: 'application/json' });
    var file = null; try { file = new File([blob], name, { type: 'application/json' }); } catch (e) {}
    var done = function (how) { markBackup(false); render(); toast(how === 'share' ? 'Back-up gemaakt. Bewaar hem in OneDrive, Bestanden of je mail, niet alleen op dit toestel.' : 'Back-up opgeslagen in je map Downloads: ' + name, 'success'); };
    if (TOUCH && file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).then(function () { done('share'); }, function (e) {
        if (e && e.name === 'AbortError') return;
        download(name, blob); done('download');
      });
    } else { download(name, blob); done('download'); }
  }

  /* ---------------- Terugzetten ---------------- */
  function restoreSnapshot(o) {
    if (!isSnapshot(o)) return false;
    if (o.app !== APP) { alert('Dit is een back-up van het ' + (o.app === 'cvs' ? 'CadetVolgSysteem' : 'Reflectieboekje') + '. Open die app om hem terug te zetten.'); return true; }
    var d = new Date(o.gemaakt || 0), wanneer = isNaN(d) ? '' : ' van ' + d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
    var ask = window.kmaConfirm ? kmaConfirm('Back-up' + wanneer + ' terugzetten?\n\nWat nu in deze app staat, wordt vervangen door de back-up.', { ok: 'Terugzetten', danger: false })
      : Promise.resolve(confirm('Back-up' + wanneer + ' terugzetten?\n\nWat nu in deze app staat, wordt vervangen door de back-up.'));
    ask.then(function (ok) {
      if (!ok) return;
      var keys = [];
      for (var i = 0; i < LS.length; i++) { var k = LS.key(i); if (ours(k)) keys.push(k); }
      try {
        keys.forEach(function (k) { LS.removeItem(k); });
        Object.keys(o.data).forEach(function (k) { if (ours(k)) LS.setItem(k, String(o.data[k])); });
      } catch (e) { alert('Terugzetten is niet gelukt: ' + (e && e.message || e)); return; }
      meta('had', new Date().toISOString()); meta('backup', o.gemaakt || new Date().toISOString());
      alert('Back-up teruggezet.');   // komt na het herladen terug als hij nog openstond (kmaAlert)
      location.reload();
    });
    return true;
  }
  function readFileText(file) {
    return file.slice(0, 2).arrayBuffer().then(function (b) {
      var u = new Uint8Array(b);
      if (u.length === 2 && u[0] === 0x1f && u[1] === 0x8b && typeof DecompressionStream !== 'undefined') {
        return new Response(file.stream().pipeThrough(new DecompressionStream('gzip'))).text();
      }
      return file.text();
    });
  }
  function appImport() { return IS_CVS ? window.importInstructorData : window.importBackupFile; }
  /** Een bestand terugzetten: een volledige back-up doet deze module, een gewone back-up de app zelf. */
  function restoreFile(file, orig) {
    return readFileText(file).then(function (t) {
      var o = null; try { o = JSON.parse(t); } catch (e) {}
      if (restoreSnapshot(o)) return;
      var f = orig || appImport();
      if (typeof f === 'function') f({ target: { files: [new File([t], file.name || 'back-up.json', { type: 'application/json' })], value: '' } });
      else alert('Dit bestand kan hier niet worden ingelezen.');
    });
  }
  function restorePick() {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,.kma,application/json'; inp.style.display = 'none';
    inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; inp.remove(); if (f) restoreFile(f); });
    document.body.appendChild(inp); inp.click();
  }
  // De importknoppen van de app lezen ook een volledige back-up.
  function wrapImport(name) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__kmaWeb) return;
    var w = function (ev) {
      var file = ev && ev.target && ev.target.files && ev.target.files[0];
      if (!file) return orig.apply(this, arguments);
      var self = this, args = arguments;
      readFileText(file).then(function (t) {
        var o = null; try { o = JSON.parse(t); } catch (e) {}
        // het invoerveld kan intussen leeg zijn gemaakt: geef de app het al gelezen bestand
        if (!restoreSnapshot(o)) orig.call(self, { target: { files: [new File([t], file.name || 'back-up.json', { type: 'application/json' })], value: '' } });
      }).catch(function (e) { console.error('KMA importeren', e); orig.apply(self, args); });
    };
    w.__kmaWeb = true; window[name] = w;
  }

  /* ---------------- Automatische back-up naar een map ---------------- */
  var CAN_DIR = typeof window.showDirectoryPicker === 'function' && window.isSecureContext !== false && !TOUCH;
  function idb() {
    return new Promise(function (ok, no) {
      var r = indexedDB.open('kma-web-veilig', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('h'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); };
    });
  }
  function idbDo(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (ok, no) {
        var tx = db.transaction('h', mode), st = tx.objectStore('h'), req = fn(st);
        tx.oncomplete = function () { ok(req && req.result); db.close(); }; tx.onerror = function () { no(tx.error); db.close(); };
      });
    });
  }
  var dir = null, paused = false, dirty = false, timer = null, writing = false;
  function loadDir() {
    if (!CAN_DIR) return Promise.resolve(null);
    return idbDo('readonly', function (s) { return s.get(APP); }).then(function (h) { dir = h || null; return dir; }, function () { return null; });
  }
  function perm(ask) {
    if (!dir) return Promise.resolve(false);
    var o = { mode: 'readwrite' };
    return Promise.resolve(dir.queryPermission ? dir.queryPermission(o) : 'granted').then(function (q) {
      if (q === 'granted') return true;
      if (!ask || !dir.requestPermission) return false;
      return dir.requestPermission(o).then(function (r) { return r === 'granted'; });
    }).catch(function () { return false; });
  }
  function chooseDir() {
    if (!CAN_DIR) return;
    window.showDirectoryPicker({ id: 'kma-backup-' + APP, mode: 'readwrite', startIn: 'documents' }).then(function (h) {
      dir = h; paused = false;
      // de map onthouden voor de volgende keer (lukt dat niet, dan werkt hij in elk geval tot de app sluit)
      return idbDo('readwrite', function (s) { return s.put(h, APP); }).catch(function () {}).then(function () {
        meta('autoName', h.name);
        return writeNow(true);
      }).then(function (ok) {
        toast(ok ? 'Automatische back-up staat aan. Na elke wijziging komt er een back-up in de map ' + h.name + '.' : 'De map is gekozen. Zodra er iets is ingevuld, komt daar een back-up.', 'success');
        render();
      });
    }).catch(function (e) { if (!e || e.name !== 'AbortError') alert('Deze map kan niet worden gebruikt: ' + (e && e.message || e)); });
  }
  function stopAuto() {
    dir = null; paused = false; meta('autoName', null);
    idbDo('readwrite', function (s) { return s.delete(APP); }).catch(function () {});
    toast('Automatische back-up staat uit. De bestanden in de map blijven bewaard.'); render();
  }
  var FILE_RE = new RegExp('^KMA_' + NAME + '_auto_(\\d{4}-\\d{2}-\\d{2})\\.json$');
  /** Schrijft de back-up van vandaag. Nooit een lege app over een goede back-up heen. */
  function writeNow(force) {
    if (!dir || writing) return Promise.resolve(false);
    if (!hasData()) return Promise.resolve(false);
    if (!force && !dirty) return Promise.resolve(false);
    writing = true;
    return perm(false).then(function (ok) {
      if (!ok) { paused = true; render(); return false; }
      paused = false; dirty = false;
      return dir.getFileHandle(fileName(true), { create: true }).then(function (fh) { return fh.createWritable(); }).then(function (w) {
        return w.write(JSON.stringify(snapshot())).then(function () { return w.close(); });
      }).then(function () { markBackup(true); return prune(); }).then(function () { render(); return true; });
    }).catch(function (e) { console.warn('KMA automatische back-up', e); return false; }).then(function (r) { writing = false; return r; });
  }
  function prune() {
    if (!dir || !dir.values) return Promise.resolve();
    var names = [];
    var it = dir.values();
    function next() {
      return it.next().then(function (r) {
        if (r.done) return;
        if (r.value && r.value.kind === 'file' && FILE_RE.test(r.value.name)) names.push(r.value.name);
        return next();
      });
    }
    return next().then(function () {
      names.sort().reverse();
      return Promise.all(names.slice(KEEP_FILES).map(function (n) { return dir.removeEntry(n).catch(function () {}); }));
    }).catch(function () {});
  }
  /** De nieuwste automatische back-up uit de map terugzetten. */
  function restoreFromDir() {
    if (!dir) return restorePick();
    perm(true).then(function (ok) {
      if (!ok) { restorePick(); return; }
      var names = [], it = dir.values();
      function next() { return it.next().then(function (r) { if (r.done) return; if (r.value.kind === 'file' && FILE_RE.test(r.value.name)) names.push(r.value.name); return next(); }); }
      return next().then(function () {
        if (!names.length) { alert('In de map ' + dir.name + ' staat nog geen automatische back-up. Kies zelf een bestand.'); restorePick(); return; }
        names.sort();
        return dir.getFileHandle(names[names.length - 1]).then(function (fh) { return fh.getFile(); }).then(function (f) { return restoreFile(f); });
      });
    }).catch(function () { restorePick(); });
  }
  function scheduleWrite() {
    dirty = true;
    if (!dir || paused) return;
    clearTimeout(timer); timer = setTimeout(function () { writeNow(false); }, 15000);
  }
  // Elke wijziging in de opslag van deze app plant een automatische back-up.
  function watchStore() {
    var s = window.kmaStore; if (!s || s.__kmaWebWatch) return;
    ['setItem', 'removeItem'].forEach(function (m) {
      var o = s[m]; if (typeof o !== 'function') return;
      s[m] = function (k) { var r = o.apply(s, arguments); if (ours(k)) scheduleWrite(); return r; };
    });
    s.__kmaWebWatch = true;
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (dirty && dir && !paused) { clearTimeout(timer); writeNow(false); } }
    else render();
  });

  /* ---------------- Opslagstatus ---------------- */
  var st = { persisted: null, standalone: false };
  var installPrompt = window.__kmaInstallPrompt || null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installPrompt = e; render(); });
  window.addEventListener('appinstalled', function () { installPrompt = null; render(); });
  function standalone() { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  function checkStorage() {
    st.standalone = standalone();
    var S = navigator.storage;
    if (!S || !S.persisted) return Promise.resolve();
    return S.persisted().then(function (p) {
      if (p || !S.persist) return p;
      return S.persist();
    }).then(function (p) { st.persisted = !!p; }).catch(function () { st.persisted = null; });
  }
  /** 'ios': Safari kan alles wissen; 'browser': de browser houdt de opslag niet vast; '' = in orde. */
  function risk() {
    if (IOS) return st.standalone ? '' : 'ios';
    if (st.persisted === false && !st.standalone) return 'browser';
    return '';
  }
  function statusLine() {
    var r = risk();
    if (r === 'ios') return 'Let op: Safari wist alles als je de app 7 dagen niet opent. Zet de app op je beginscherm.';
    if (r === 'browser') return 'Let op: deze browser kan de gegevens opruimen. Installeer de app en maak back-ups.';
    if (IOS) return 'De app staat op je beginscherm: Safari wist de gegevens niet automatisch.';
    return st.persisted ? 'De browser houdt de gegevens van deze app vast.' : 'Gegevens staan alleen in deze browser op dit toestel.';
  }
  function install() {
    if (installPrompt) {
      var p = installPrompt; installPrompt = null;
      p.prompt(); (p.userChoice || Promise.resolve()).then(function () { setTimeout(function () { checkStorage().then(render); }, 1500); });
      return;
    }
    howTo();
  }
  function howTo() {
    var steps = IOS
      ? ['Open de app in <b>Safari</b> (niet in een andere browser of in WhatsApp).', 'Tik onderaan op de knop <b>Delen</b> (vierkantje met pijl omhoog).', 'Kies <b>Zet op beginscherm</b> en tik op <b>Voeg toe</b>.', 'Open de app voortaan via het nieuwe icoon op je beginscherm. Je gegevens gaan mee zolang je in dezelfde Safari zit; maak voor de zekerheid eerst een back-up en zet die daarna in de app op het beginscherm terug.']
      : /Android/i.test(UA)
        ? ['Open het menu van de browser (⋮ rechtsboven in Chrome).', 'Kies <b>App installeren</b> of <b>Toevoegen aan startscherm</b>.', 'Open de app voortaan via het icoon op je startscherm.']
        : ['Klik in de adresbalk van Chrome of Edge op het pictogram <b>App installeren</b> (of kies in het menu ⋮ → <b>Apps</b> → <b>Deze site als app installeren</b>).', 'Open de app voortaan via het icoon in het startmenu of op het bureaublad.'];
    dialog('Op je beginscherm zetten', '<ol class="kma-ws-ol">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>');
  }
  function dialog(title, html) {
    var old = document.getElementById('kma-ws-dlg'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'kma-ws-dlg'; ov.className = 'kma-ws-ov';
    ov.innerHTML = '<div class="kma-ws-box" role="dialog" aria-modal="true" aria-labelledby="kma-ws-dlg-h"><h3 id="kma-ws-dlg-h"></h3>' + html + '<div class="kma-ws-act"><button type="button" class="kma-ws-b is-pri" data-ws="ok">Begrepen</button></div></div>';
    ov.querySelector('h3').textContent = title;
    ov.addEventListener('click', function (e) { if (e.target === ov || (e.target.closest && e.target.closest('[data-ws="ok"]'))) ov.remove(); });
    document.body.appendChild(ov);
    var b = ov.querySelector('[data-ws="ok"]'); if (b) b.focus();
  }

  /* ---------------- De balk bovenaan ---------------- */
  function snoozed(k) { var t = meta('later-' + k); return t && Date.now() < t; }
  function snooze(k, days) { meta('later-' + k, Date.now() + days * DAY); render(); }
  /** Welke melding is nu het belangrijkst? */
  function current() {
    var data = hasData();
    if (data && !meta('had')) meta('had', new Date().toISOString());
    if (data && !meta('since')) meta('since', new Date().toISOString());
    if (!data) {
      if (meta('had') && !snoozed('leeg')) return { k: 'leeg', urgent: true, t: 'Hier stonden eerder gegevens, maar ' + WAT + ' is nu leeg.', s: 'Zet je laatste back-up terug' + (dir ? ' (ook uit je back-upmap ' + esc(dir.name) + ')' : '') + '.', b: 'Back-up terugzetten', go: dir ? restoreFromDir : restorePick, later: 1 };
      if (!meta('had') && !meta('nieuw-ok')) return { k: 'nieuw', t: 'Heb je deze app al eerder gebruikt, op dit toestel of een ander?', s: 'Zet dan je back-up terug, zodat je verder kunt waar je was.', b: 'Back-up terugzetten', go: restorePick, b2: 'Ik begin net', go2: function () { meta('nieuw-ok', 1); render(); } };
      return null;
    }
    if (dir && paused) return { k: 'pauze', t: 'De automatische back-up staat stil.', s: 'De browser vraagt opnieuw toestemming voor de map ' + esc(dir.name) + '.', b: 'Toestemming geven', go: function () { perm(true).then(function (ok) { if (ok) { paused = false; writeNow(true); } render(); }); }, later: 1 };
    var r = risk();
    if (r && !snoozed('status')) {
      return r === 'ios'
        ? { k: 'status', t: 'Zet de app op je beginscherm.', s: 'Anders wist Safari alles als je de app 7 dagen niet opent.', b: 'Hoe?', go: howTo, later: 14 }
        : { k: 'status', t: 'Deze browser kan je gegevens opruimen.', s: 'Installeer de app' + (CAN_DIR ? ' of zet de automatische back-up aan' : '') + '.', b: installPrompt ? 'Installeren' : 'Hoe?', go: install, b3: CAN_DIR && !dir ? 'Automatische back-up' : '', go3: chooseDir, later: 14 };
    }
    var last = lastBackup(), age = daysAgo(last), since = daysAgo(meta('since'));
    if (((age != null && age >= REMIND_DAYS) || (age == null && since != null && since >= 3)) && !snoozed('backup')) {
      return { k: 'backup', t: age == null ? 'Je hebt nog geen back-up gemaakt.' : 'Je laatste back-up is ' + age + ' dagen oud.', s: 'Alles staat alleen in deze browser. Bewaar een back-up in OneDrive, Bestanden of je mail.', b: 'Back-up maken', go: backupNow, b3: CAN_DIR && !dir ? 'Automatisch' : '', go3: chooseDir, later: 2 };
    }
    return null;
  }
  var shown = null;
  function render() {
    if (!document.body) return;
    var m = null; try { m = current(); } catch (e) { m = null; }
    var el = document.getElementById('kma-websafe');
    if (!m) { if (el) el.remove(); shown = null; return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'kma-websafe'; el.setAttribute('role', 'status');
      var h = document.querySelector('.site-header');
      if (h && h.parentNode) h.parentNode.insertBefore(el, h.nextSibling); else document.body.insertBefore(el, document.body.firstChild);
    }
    el.className = 'kma-ws' + (m.urgent ? ' is-urgent' : '');
    el.innerHTML = '<div class="kma-ws-txt"><strong>' + esc(m.t) + '</strong><span>' + m.s + '</span></div><div class="kma-ws-act">' +
      '<button type="button" class="kma-ws-b is-pri" data-ws="go">' + esc(m.b) + '</button>' +
      (m.b3 ? '<button type="button" class="kma-ws-b" data-ws="go3">' + esc(m.b3) + '</button>' : '') +
      (m.b2 ? '<button type="button" class="kma-ws-b" data-ws="go2">' + esc(m.b2) + '</button>' : '') +
      (m.later ? '<button type="button" class="kma-ws-b" data-ws="later">Later</button>' : '') + '</div>';
    shown = m;
  }
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest && e.target.closest('#kma-websafe [data-ws]'); if (!b || !shown) return;
    var a = b.getAttribute('data-ws'), m = shown;
    if (a === 'go') m.go(); else if (a === 'go2') m.go2(); else if (a === 'go3') m.go3(); else if (a === 'later') snooze(m.k, m.later);
  });

  /* ---------------- Menu: Gegevens veilig bewaren ---------------- */
  function open() {
    if (!window.kmaSheet) return;
    var last = lastBackup(), items = [{ section: statusLine() }];
    if (IOS && !st.standalone) items.push({ icon: 'download', label: 'Op je beginscherm zetten', hint: 'Dan wist Safari je gegevens niet na 7 dagen zonder gebruik', onClick: howTo });
    else if (!IOS && !st.standalone) items.push({ icon: 'download', label: 'App installeren', hint: 'Als app op je ' + (TOUCH ? 'startscherm' : 'computer') + '; de browser houdt de gegevens dan beter vast', onClick: install });
    items.push({ icon: 'download', label: 'Back-up maken', hint: 'Laatste back-up: ' + ago(last) + ' · ' + (TOUCH ? 'bewaar hem in OneDrive, Bestanden of je mail' : 'naar je map Downloads'), onClick: backupNow });
    if (CAN_DIR) {
      if (dir) {
        items.push({ icon: 'folder', label: 'Automatische back-up: aan', hint: 'Map ' + dir.name + ' · laatst ' + ago(meta('autoLast')) + (paused ? ' · staat stil: tik om toestemming te geven' : ' · tik om nu een back-up te maken'), onClick: function () { perm(true).then(function (ok) { if (ok) { paused = false; writeNow(true).then(function (r) { toast(r ? 'Back-up gemaakt in ' + dir.name + '.' : 'Er is nog niets om te bewaren.', r ? 'success' : 'info'); }); } else render(); }); } });
        items.push({ icon: 'folder', label: 'Andere map kiezen', hint: 'Bijvoorbeeld een map in OneDrive', onClick: chooseDir });
        items.push({ icon: 'x', label: 'Automatische back-up uitzetten', hint: 'De bestanden in de map blijven staan', onClick: stopAuto });
      } else {
        items.push({ icon: 'folder', label: 'Automatische back-up naar een map', hint: 'Kies een map (bijvoorbeeld in OneDrive); na elke wijziging komt daar een back-up. Niet versleuteld: kies een map die alleen van jou is', onClick: chooseDir });
      }
    }
    items.push({ icon: 'folder', label: 'Back-up terugzetten', hint: dir ? 'De nieuwste uit ' + dir.name + ', of kies zelf een bestand' : 'Een back-up van deze app (ook een gewone back-up)', onClick: dir ? function () { kmaSheet({ title: 'Back-up terugzetten', items: [
      { icon: 'folder', label: 'Nieuwste automatische back-up', hint: 'Uit de map ' + dir.name, onClick: restoreFromDir },
      { icon: 'file', label: 'Zelf een bestand kiezen', hint: 'Een back-up uit Downloads, OneDrive of je mail', onClick: restorePick }] }); } : restorePick });
    kmaSheet({ title: 'Gegevens veilig bewaren', items: items });
  }
  function menuHint() {
    var r = risk(), last = lastBackup();
    if (r) return 'Let op: ' + (r === 'ios' ? 'zet de app op je beginscherm' : 'de browser kan je gegevens opruimen');
    return (dir ? 'Automatische back-up aan · ' : '') + 'Laatste back-up: ' + ago(last);
  }

  /* ---------------- Opmaak ---------------- */
  var css = document.createElement('style');
  css.textContent =
    '.kma-ws{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;justify-content:space-between;margin:10px 12px 0;padding:12px 14px;border-radius:14px;' +
    'background:var(--bg-card,#fff);color:var(--text-primary,#1b1b1b);border:1px solid var(--border-color,#d9d3bf);border-left:5px solid var(--accent-gold,#b59a52);font-size:14px;line-height:1.4}' +
    '.kma-ws.is-urgent{border-left-color:var(--accent-red,#b5272d)}' +
    '.kma-ws-txt{flex:1 1 220px;min-width:0;display:flex;flex-direction:column;gap:2px}.kma-ws-txt strong{font-size:15px}.kma-ws-txt span{color:var(--text-muted,#5f6a63)}' +
    '.kma-ws-act{display:flex;flex-wrap:wrap;gap:8px}' +
    '.kma-ws-b{min-height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--border-color,#c9c1a8);background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}' +
    '.kma-ws-b.is-pri{background:var(--accent-gold,#b59a52);border-color:var(--accent-gold,#b59a52);color:#18251d}' +
    '.kma-ws-b:focus-visible{outline:3px solid var(--accent-gold,#b59a52);outline-offset:2px}' +
    '.kma-ws-ov{position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:16px}' +
    '.kma-ws-box{width:min(520px,100%);max-height:90vh;overflow:auto;background:var(--bg-card,#fff);color:var(--text-primary,#1b1b1b);border-radius:18px;padding:18px 18px calc(16px + env(safe-area-inset-bottom))}' +
    '.kma-ws-box h3{margin:0 0 10px;font-size:18px}.kma-ws-ol{margin:0 0 14px;padding-left:22px;line-height:1.5}.kma-ws-ol li{margin:0 0 8px}.kma-ws-box .kma-ws-act{justify-content:flex-end}' +
    '@media (min-width:700px){.kma-ws-ov{align-items:center}}';
  document.head.appendChild(css);

  /* ---------------- Start ---------------- */
  window.kmaWebSafe = { open: open, hint: menuHint, backupNow: backupNow, restorePick: restorePick, restoreSnapshot: restoreSnapshot, snapshot: snapshot, hasData: hasData,
    chooseDir: chooseDir, writeNow: writeNow, risk: risk, _state: function () { return { st: st, dir: dir && dir.name, paused: paused, dirty: dirty, ios: IOS, canDir: CAN_DIR }; } };
  function start() {
    watchStore(); wrapImport('importBackupFile'); wrapImport('importInstructorData');
    Promise.all([checkStorage(), loadDir()]).then(function () {
      if (dir) return perm(false).then(function (ok) {
        paused = !ok;
        // eerste back-up van vandaag zodra de app open is
        if (ok && hasData() && daysAgo(meta('autoLast')) !== 0) { dirty = true; writeNow(false); }
      });
    }).then(function () { setTimeout(render, 600); });
    setInterval(render, 60000);
    if (window.kmaAfter) {
      ['renderCadets', 'goToStep', 'saveAnswer'].forEach(function (f) { if (typeof window[f] === 'function') kmaAfter(f, function () { setTimeout(render, 50); }); });
      ['exportAnswers', 'exportInstructorData', 'exportInstructorDataBluetooth'].forEach(function (f) { if (typeof window[f] === 'function') kmaAfter(f, function () { markBackup(false); setTimeout(render, 50); }); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 400); });
  else setTimeout(start, 400);
})();
