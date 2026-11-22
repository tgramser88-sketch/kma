/*
 * Teamkoppeling: de teamleider toont per groep een QR-code; de cadet scant die één keer.
 * Daarmee staan de groepscode, de groep, de naam van de teamleider en de plek van de deelmap goed.
 * De cadet kiest daarna alleen nog één keer de deelmap (dat vraagt het systeem altijd zelf).
 *
 * Inhoud van de QR-code: "KMAT1:" + JSON { g: groep, c: groepscode, t: teamleider, m: aanwijzing deelmap, p: peloton, s: optioneel adres SharePoint }.
 * Het veld s is er al voor een latere directe koppeling met SharePoint; nu wordt het alleen getoond.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var PREFIX = 'KMAT1:';
  // 4.13.0: de QR-code is een link. De gewone camera van de telefoon opent dan de koppelpagina; de gegevens staan
  // na het #-teken en gaan dus niet naar de website. Oude QR-codes (KMAT1:{json}) blijven werken.
  var LINK = 'https://tgramser88-sketch.github.io/kma/koppel.html#';
  function b64u(t) { var u = new TextEncoder().encode(t), s = ''; for (var i = 0; i < u.length; i++) s += String.fromCharCode(u[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64u(t) { var s = atob(String(t).replace(/-/g, '+').replace(/_/g, '/')), u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new TextDecoder().decode(u); }
  var CVS = typeof cadets !== 'undefined' && /volgsysteem/i.test(location.pathname);
  var st = function () { return window.kmaStore || window.localStorage; };
  function getJ(k, d) { try { var v = JSON.parse(st().getItem(k)); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }
  function setJ(k, v) { try { st().setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, k) { if (window.kmaToast) kmaToast(m, k); }
  function clip(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n); }

  /** Maakt de tekst voor de QR-code. */
  function encode(o) {
    var p = { g: clip(o.g, 30), c: window.KMAX ? KMAX.pretty(o.c) : clip(o.c, 40), t: clip(o.t, 60), m: clip(o.m, 160) };
    if (o.p) p.p = clip(o.p, 40);
    if (o.s) p.s = clip(o.s, 300);
    // Alleen ASCII in de QR-code: de QR-bibliotheek rekent de grootte uit op tekens, niet op bytes.
    return PREFIX + JSON.stringify(p).replace(/[\u007f-\uffff]/g, function (ch) { return '\\u' + ('000' + ch.charCodeAt(0).toString(16)).slice(-4); });
  }
  /** De link voor de QR-code en voor "Deel link". */
  function encodeLink(o) { var raw = encode(o); return LINK + PREFIX + b64u(raw.slice(PREFIX.length)); }
  /** Haalt de KMAT1-tekst uit een link (https://…/koppel.html#…, kmaapp://koppel#…, #koppel=…) of laat de tekst staan. */
  function fromLink(text) {
    var t = String(text || '').trim(), i = t.indexOf('#');
    if (i >= 0 && /^(https?:|kmaapp:|#)/i.test(t)) t = t.slice(i + 1);
    t = t.replace(/^koppel=/, '');
    try { if (/%[0-9a-f]{2}/i.test(t)) t = decodeURIComponent(t); } catch (e) {}
    return t;
  }
  /** Leest een gescande tekst of link; geeft null terug als het geen geldige teamkoppeling is. */
  function decode(text) {
    var t = fromLink(text);
    if (t.indexOf(PREFIX) !== 0) return null;
    var body = t.slice(PREFIX.length), o;
    try { o = JSON.parse(body.charAt(0) === '{' ? body : unb64u(body)); } catch (e) { return null; }
    if (!o || typeof o !== 'object') return null;
    var code = clip(o.c, 40);
    if (!window.KMAX || !KMAX.valid(code)) return null;
    var s = clip(o.s, 300);
    if (s && !/^https:\/\//i.test(s)) s = '';
    return { g: clip(o.g, 30), c: KMAX.pretty(code), t: clip(o.t, 60), m: clip(o.m, 160), p: clip(o.p, 40), s: s };
  }

  function sheet(title, body, onClick) {
    var ov = document.createElement('div');
    ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet kma-koppel-sheet" role="dialog" aria-modal="true" style="transform:none"><div class="kma-sheet-grip"></div><div class="kma-sheet-title">' + esc(title) + '</div>' + body + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-x="close"]')) { close(ov); return; }
      if (onClick) onClick(e, ov);
    });
    return ov;
  }
  var scanner = null;
  function stopScan() { var s = scanner; scanner = null; if (s) { try { s.stop().catch(function () {}).then(function () { try { s.clear(); } catch (x) {} }); } catch (e) {} } }
  function close(ov) { stopScan(); if (ov && ov.parentNode) ov.remove(); }

  /* ================= CadetVolgSysteem: QR-code tonen ================= */
  var HINT = 'kma-cvs-koppel';
  function showQr(group) {
    var code = window.KMAX && KMAX.codeForGroup(group);
    if (!code) { toast('Maak eerst een groepscode voor ' + group, 'error'); return; }
    var cfg = getJ(HINT, {});
    var folder = (window.kmaDeelStatus && kmaDeelStatus().on) ? kmaDeelStatus().name : '';
    var body = '<div class="kma-code-body">' +
      '<p class="muted">Laat je cadetten deze QR-code scannen in het Reflectieboekje (menu ⋮ → Koppelen met je teamleider). Daarmee staan de groepscode en de groep meteen goed.</p>' +
      '<label class="kma-code-lab">Jouw naam<input type="text" id="kk-t" maxlength="60" value="' + esc(cfg.t || '') + '" placeholder="bijv. Kapitein De Vries"/></label>' +
      '<label class="kma-code-lab">Waar staat de deelmap?<input type="text" id="kk-m" maxlength="160" value="' + esc(cfg.m || folder) + '" placeholder="bijv. SharePoint › KMA Peloton 3 › Deelmap"/></label>' +
      '<div class="kma-koppel-qr" id="kk-qr" aria-label="QR-code teamkoppeling"></div>' +
      '<p class="kma-koppel-group"><strong>' + (window.kmaPeloton && kmaPeloton() ? esc(kmaPeloton()) + ' · ' : '') + 'Groep ' + esc(group) + '</strong></p>' +
      '<p class="muted small">Cadetten kunnen ook de gewone camera van hun telefoon gebruiken: de code opent de koppelpagina.</p>' +
      '<p class="kma-code-err">Deel de code of link alleen met je eigen cadetten, bijvoorbeeld in de Teams-chat van je groep. Wie hem heeft, kan de groepscode lezen.</p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-kq="groot">Groot tonen</button><button type="button" class="kma-icon-btn" data-kq="link">Deel link</button><button type="button" class="kma-icon-btn is-primary" data-x="close">Klaar</button></div></div>';
    var link = '';
    var ov = sheet('Teamkoppeling', body, function (e) {
      var b = e.target.closest('[data-kq]'); if (!b) return;
      if (b.getAttribute('data-kq') === 'link') shareLink(link, group);
      else bigQr(link, group);
    });
    var draw = function () {
      var t = ov.querySelector('#kk-t').value, m = ov.querySelector('#kk-m').value;
      setJ(HINT, { t: clip(t, 60), m: clip(m, 160) });
      var box = ov.querySelector('#kk-qr'); box.innerHTML = '';
      try {
        link = encodeLink({ g: group, c: code, t: t, m: m, p: window.kmaPeloton ? kmaPeloton() : '' });
        new QRCode(box, { text: link, width: 260, height: 260, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.L });
      } catch (e) { box.textContent = 'De QR-code kan niet worden gemaakt. Maak de tekst bij de deelmap korter, of geef de groepscode mondeling door: ' + KMAX.pretty(code); }
    };
    ov.addEventListener('input', function (e) { if (e.target.id === 'kk-t' || e.target.id === 'kk-m') draw(); });
    draw();
  }

  function shareLink(link, group) {
    if (!link) return;
    var txt = 'Koppel je Reflectieboekje met groep ' + group + ': ' + link;
    try { if (window.KMA_CAP && window.KMA_CAP.shareText) { window.KMA_CAP.shareText(txt); return; } } catch (e) {}
    if (navigator.share) { navigator.share({ title: 'Koppelen met je teamleider', text: txt }).catch(function () {}); return; }
    try { navigator.clipboard.writeText(link).then(function () { toast('Link gekopieerd: plak hem in de chat van je groep'); }, function () { toast('Kopiëren lukte niet', 'error'); }); } catch (e) { toast('Kopiëren lukte niet', 'error'); }
  }
  /** QR-code schermvullend, wit, voor scannen op afstand. Tik om te sluiten. */
  function bigQr(link, group) {
    if (!link) return;
    var ov = document.createElement('div'); ov.className = 'kma-qr-big'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'QR-code groot');
    ov.innerHTML = '<div class="kma-qr-big-box"></div><p>Groep ' + esc(group) + ' · tik om te sluiten</p>';
    document.body.appendChild(ov);
    var n = Math.min(window.innerWidth, window.innerHeight) * 0.86 | 0;
    try { new QRCode(ov.querySelector('.kma-qr-big-box'), { text: link, width: n, height: n, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.L }); } catch (e) {}
    try { if (window.KMA_CAP && window.KMA_CAP.brightness) window.KMA_CAP.brightness(1); } catch (e) {}
    ov.addEventListener('click', function () { try { if (window.KMA_CAP && window.KMA_CAP.brightness) window.KMA_CAP.brightness(-1); } catch (e) {} ov.remove(); });
  }

  /* ================= Reflectieboekje: scannen en koppelen ================= */
  var KEY = 'kma-x-koppel';
  function info() { return getJ(KEY, null); }
  function apply(k) {
    KMAX.setMyCode(k.c);
    setJ(KEY, { g: k.g, t: k.t, m: k.m, p: k.p || '', s: k.s || '', at: new Date().toISOString() });
  }
  function doneHtml(k) {
    var nativeFolder = !!(window.Android && window.Android.sharedPick);
    return '<div class="kma-code-body"><div class="kma-koppel-ok"><span class="kma-koppel-check">✓</span><div><strong>Gekoppeld' + (k.g ? ' met groep ' + esc(k.g) : '') + (k.p ? ' (' + esc(k.p) + ')' : '') + '</strong>' +
      (k.t ? '<span>Teamleider: ' + esc(k.t) + '</span>' : '') + '</div></div>' +
      '<p>Je dossier wordt nu versleuteld gedeeld met de groepscode van je teamleider.</p>' +
      (nativeFolder
        ? '<p class="kma-koppel-step">Stap 1 van 2 klaar</p><h5>Stap 2 van 2: kies de deelmap</h5><p class="muted">Je telefoon vraagt één keer om toegang tot de map.' + (k.m ? ' Je teamleider zegt: <b>' + esc(k.m) + '</b>' : '') + '</p>' +
          '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Later</button><button type="button" class="kma-icon-btn is-primary" data-k="map">Deelmap kiezen</button></div>'
        : '<p class="muted">Deel je dossier met de knop <b>Delen</b>. Een deelmap kun je alleen in de app op je telefoon of pc koppelen.</p>' +
          '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-x="close">Klaar</button></div>') + '</div>';
  }
  /** Groene status: gekoppeld, deelmap, laatste synchronisatie. */
  function statusHtml(cur) {
    var d = window.kmaDeelStatus ? kmaDeelStatus() : null, last = d && d.last ? new Date(d.last) : null;
    var lastTxt = last && !isNaN(last.getTime()) ? last.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    return '<div class="kma-koppel-status"><div class="kma-koppel-ok"><span class="kma-koppel-check">✓</span><div><strong>Gekoppeld' + (cur.g ? ' met groep ' + esc(cur.g) : '') + (cur.p ? ' (' + esc(cur.p) + ')' : '') + '</strong>' + (cur.t ? '<span>Teamleider: ' + esc(cur.t) + '</span>' : '') + '</div></div>' +
      (d ? (d.on ? '<p class="kma-koppel-line ok">✓ Deelmap: ' + esc(d.name || 'gekoppeld') + (lastTxt ? ' · laatst gesynchroniseerd ' + esc(lastTxt) : '') + '</p>' : '<p class="kma-koppel-line warn">Nog geen deelmap gekozen</p>') : '') +
      (d && d.err ? '<p class="kma-koppel-line warn">' + esc(d.err) + '</p>' : '') + '</div>';
  }
  /** Eén scanner voor alles (4.13.0): teamkoppeling (KMAT1, ook als link) en kaarten van medecadetten (KMAK1). */
  function scanDialog(opt) {
    opt = opt || {};
    var cur = info(), code = window.KMAX && KMAX.myCode(), linked = !!(code && cur) && !opt.rescan;
    var d = window.kmaDeelStatus ? kmaDeelStatus() : null, broken = linked && d && (!d.on || d.err);
    var body = '<div class="kma-code-body">' +
      (linked ? statusHtml(cur) +
        '<div class="kma-row-btns">' + (window.kmaDeelDialog ? '<button type="button" class="kma-icon-btn' + (broken ? ' is-primary' : '') + '" data-k="map">' + (d && d.on ? 'Deelmap wijzigen' : 'Deelmap kiezen') + '</button>' : '') + '<button type="button" class="kma-icon-btn" data-k="rescan">Opnieuw koppelen</button><button type="button" class="kma-icon-btn' + (broken ? '' : ' is-primary') + '" data-x="close">Klaar</button></div>'
      : '<p class="muted">Richt de camera op de QR-code van je teamleider, of op de kaart van een medecadet.</p>' +
        '<div id="kk-reader" class="kma-koppel-reader"></div><button type="button" class="kma-chip-btn kma-koppel-torch" data-k="torch" hidden>Zaklamp</button>' +
        '<p class="kma-code-err" id="kk-err" role="alert"></p>' +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-k="code">Code intypen</button><button type="button" class="kma-icon-btn" data-k="scan">Opnieuw starten</button></div>') + '</div>';
    var ov = sheet(linked ? 'Koppeling met je teamleider' : 'Scan code', body, function (e, ov) {
      var b = e.target.closest('[data-k]'); if (!b) return;
      var what = b.getAttribute('data-k');
      if (what === 'code') { close(ov); KMAX.codeDialog(); return; }
      if (what === 'map') { close(ov); if (window.kmaDeelDialog) kmaDeelDialog(); return; }
      if (what === 'rescan') { close(ov); scanDialog({ rescan: true }); return; }
      if (what === 'torch') { torch(b); return; }
      if (what === 'scan') start(ov);
    });
    if (!linked) setTimeout(function () { if (ov.parentNode) start(ov); }, 150);
    return ov;
  }
  var torchOn = false;
  function torch(b) {
    if (!scanner || !scanner.applyVideoConstraints) return;
    torchOn = !torchOn;
    scanner.applyVideoConstraints({ advanced: [{ torch: torchOn }] }).then(function () { b.classList.toggle('on', torchOn); }, function () { torchOn = false; b.hidden = true; });
  }
  function buzz() { try { if (window.KMA_CAP && window.KMA_CAP.haptic) window.KMA_CAP.haptic('medium'); else if (navigator.vibrate) navigator.vibrate(30); } catch (e) {} }
  /** Koppelen vanuit een link (camera van de telefoon, Teams-chat): eerst bevestigen. */
  function fromLinkDialog(url) {
    var k = decode(url);
    if (!k) { toast('Deze koppellink is niet geldig. Vraag je teamleider om de link of QR-code opnieuw.', 'error'); return false; }
    var cur = info();
    var body = '<div class="kma-code-body"><p>Koppelen met <b>groep ' + esc(k.g || '?') + '</b>' + (k.p ? ' (' + esc(k.p) + ')' : '') + (k.t ? ' van <b>' + esc(k.t) + '</b>' : '') + '?</p>' +
      (cur && cur.g && cur.g !== k.g ? '<p class="kma-code-err">Je bent nu gekoppeld met groep ' + esc(cur.g) + '. Die koppeling wordt vervangen.</p>' : '') +
      '<p class="muted small">Doe dit alleen als je de link van je eigen teamleider hebt gekregen.</p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-k="ja">Koppelen</button></div></div>';
    sheet('Koppelen met je teamleider', body, function (e, ov) {
      if (!e.target.closest('[data-k="ja"]')) return;
      apply(k); buzz();
      ov.querySelector('.kma-sheet').innerHTML = '<div class="kma-sheet-grip"></div><div class="kma-sheet-title">Koppelen met je teamleider</div>' + doneHtml(k);
      toast('Gekoppeld' + (k.g ? ' met groep ' + k.g : ''));
    });
    return true;
  }
  function accept(ov, text) {
    var raw = String(text || '').trim();
    if (raw.indexOf('KMAK1:') === 0 && window.kmaKameraad && kmaKameraad.accept) { stopScan(); buzz(); close(ov); kmaKameraad.accept(raw); return true; }
    var k = decode(text);
    var err = ov.querySelector('#kk-err');
    if (!k) { if (err) err.textContent = 'Dit is geen QR-code voor een teamkoppeling. Vraag je teamleider om de QR-code van je groep.'; return false; }
    stopScan(); apply(k); buzz();
    ov.querySelector('.kma-sheet').innerHTML = '<div class="kma-sheet-grip"></div><div class="kma-sheet-title">Koppelen met je teamleider</div>' + doneHtml(k);
    toast('Gekoppeld' + (k.g ? ' met groep ' + k.g : ''));
    return true;
  }
  function start(ov) {
    var err = ov.querySelector('#kk-err'); if (err) err.textContent = '';
    if (!window.Html5Qrcode) { if (err) err.textContent = 'De scanner kan niet worden geladen. Typ de code in.'; return; }
    try { if (window.Android && window.Android.requestCameraPermission) window.Android.requestCameraPermission(); } catch (e) {}
    stopScan();
    var reader = ov.querySelector('#kk-reader'); reader.classList.add('on');
    var sc = new Html5Qrcode('kk-reader'); scanner = sc;
    var w = Math.min(320, Math.max(200, (reader.clientWidth || 300) * 0.8 | 0));
    var cfg = { fps: 10, qrbox: { width: w, height: w } };
    var ok = function (t) { accept(ov, t); };
    sc.start({ facingMode: 'environment' }, cfg, ok, function () {}).then(function () {
      try { var c = sc.getRunningTrackCapabilities && sc.getRunningTrackCapabilities(); var t = ov.querySelector('[data-k="torch"]'); if (t && c && c.torch) t.hidden = false; } catch (e) {}
    }, function () { return Promise.reject(); }).catch(function () {
      return sc.start({ facingMode: 'user' }, cfg, ok, function () {});
    }).catch(function () {
      reader.classList.remove('on');
      if (err) err.textContent = 'De camera kan niet starten. Geef de app toegang tot de camera, of typ de code in.';
    });
  }

  window.KMAKoppel = { encode: encode, encodeLink: encodeLink, decode: decode, showQr: showQr, scanDialog: scanDialog, info: info, accept: accept, apply: apply, fromLink: fromLinkDialog, LINK: LINK };
  // Web-app geopend via een koppellink (…/reflectieboekje/index.html#koppel=…)
  if (typeof cadets === 'undefined' && /^#koppel=/.test(location.hash)) {
    var h = location.hash;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    setTimeout(function () { fromLinkDialog(h); }, 1200);
  }
})();
