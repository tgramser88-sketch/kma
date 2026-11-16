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
  /** Leest een gescande tekst; geeft null terug als het geen geldige teamkoppeling is. */
  function decode(text) {
    var t = String(text || '').trim();
    if (t.indexOf(PREFIX) !== 0) return null;
    var o; try { o = JSON.parse(t.slice(PREFIX.length)); } catch (e) { return null; }
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
      '<p class="kma-code-err">Toon deze code alleen aan je eigen cadetten. Zet hem niet op een foto of in een groepsapp: wie hem heeft, kan de groepscode lezen.</p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-x="close">Klaar</button></div></div>';
    var ov = sheet('Teamkoppeling', body);
    var draw = function () {
      var t = ov.querySelector('#kk-t').value, m = ov.querySelector('#kk-m').value;
      setJ(HINT, { t: clip(t, 60), m: clip(m, 160) });
      var box = ov.querySelector('#kk-qr'); box.innerHTML = '';
      try {
        new QRCode(box, { text: encode({ g: group, c: code, t: t, m: m, p: window.kmaPeloton ? kmaPeloton() : '' }), width: 240, height: 240, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
      } catch (e) { box.textContent = 'De QR-code kan niet worden gemaakt. Maak de tekst bij de deelmap korter, of geef de groepscode mondeling door: ' + KMAX.pretty(code); }
    };
    ov.addEventListener('input', function (e) { if (e.target.id === 'kk-t' || e.target.id === 'kk-m') draw(); });
    draw();
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
        ? '<h5>Laatste stap: kies de deelmap</h5><p class="muted">Je telefoon vraagt één keer om toegang tot de map.' + (k.m ? ' Je teamleider zegt: <b>' + esc(k.m) + '</b>' : '') + '</p>' +
          '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Later</button><button type="button" class="kma-icon-btn is-primary" data-k="map">Deelmap kiezen</button></div>'
        : '<p class="muted">Deel je dossier met de knop <b>Delen</b>. Een deelmap kun je alleen in de app op je telefoon of pc koppelen.</p>' +
          '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-x="close">Klaar</button></div>') + '</div>';
  }
  function scanDialog() {
    var cur = info(), code = window.KMAX && KMAX.myCode();
    var body = '<div class="kma-code-body">' +
      (code && cur ? '<p class="kma-koppel-now">Nu gekoppeld' + (cur.g ? ' met groep <b>' + esc(cur.g) + '</b>' : '') + (cur.t ? ' (' + esc(cur.t) + ')' : '') + '.</p>' : '') +
      '<p class="muted">Vraag je teamleider om de QR-code van je groep (CadetVolgSysteem → Groepscodes → QR) en scan die hier.</p>' +
      '<div id="kk-reader" class="kma-koppel-reader"></div>' +
      '<p class="kma-code-err" id="kk-err" role="alert"></p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-k="code">Code intypen</button><button type="button" class="kma-icon-btn is-primary" data-k="scan">Scan QR-code</button></div></div>';
    var ov = sheet('Koppelen met je teamleider', body, function (e, ov) {
      var b = e.target.closest('[data-k]'); if (!b) return;
      var what = b.getAttribute('data-k');
      if (what === 'code') { close(ov); KMAX.codeDialog(); return; }
      if (what === 'map') { close(ov); if (window.kmaDeelDialog) kmaDeelDialog(); return; }
      if (what === 'scan') start(ov);
    });
    return ov;
  }
  function accept(ov, text) {
    var k = decode(text);
    var err = ov.querySelector('#kk-err');
    if (!k) { if (err) err.textContent = 'Dit is geen QR-code voor een teamkoppeling. Vraag je teamleider om de QR-code van je groep.'; return false; }
    stopScan(); apply(k);
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
    var cfg = { fps: 10, qrbox: { width: 220, height: 220 } };
    var ok = function (t) { accept(ov, t); };
    sc.start({ facingMode: 'environment' }, cfg, ok, function () {}).catch(function () {
      return sc.start({ facingMode: 'user' }, cfg, ok, function () {});
    }).catch(function () {
      reader.classList.remove('on');
      if (err) err.textContent = 'De camera kan niet starten. Geef de app toegang tot de camera, of typ de code in.';
    });
  }

  window.KMAKoppel = { encode: encode, decode: decode, showQr: showQr, scanDialog: scanDialog, info: info, accept: accept, apply: apply };
})();
