/*
 * KMA app bridge: loaded first by every page.
 *
 *  - kmaStore : drop-in replacement for localStorage. In the Android app every value is
 *               kept in encrypted files (AES-256-GCM, key protected by the Android Keystore).
 *  - kmaPin   : PIN codes are stored as a salted hash in the encrypted store, with a lockout
 *               after repeated wrong attempts. The PIN itself is never stored.
 *  - Makes the microphone buttons, printing and file downloads work inside the app.
 *
 * Opened in an ordinary browser (for previewing), it falls back to browser storage.
 *
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';

  var nativeStore = window.SecureStore || null;
  var browserStore = null;
  try { browserStore = window.localStorage; } catch (e) { browserStore = null; }

  /* ---------------- Storage ---------------- */
  var memory = {};
  var fallback = browserStore || {
    getItem: function (k) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; },
    setItem: function (k, v) { memory[k] = String(v); },
    removeItem: function (k) { delete memory[k]; },
    clear: function () { memory = {}; },
    key: function (i) { return Object.keys(memory)[i] || null; },
    get length() { return Object.keys(memory).length; }
  };

  var kmaStore;
  if (nativeStore) {
    kmaStore = {
      getItem: function (k) { return JSON.parse(nativeStore.getItem(String(k))); },
      setItem: function (k, v) {
        if (!nativeStore.setItem(String(k), String(v))) {
          throw new Error('Opslaan mislukt (versleutelde opslag).');
        }
      },
      removeItem: function (k) { nativeStore.removeItem(String(k)); },
      clear: function () { nativeStore.clear(); },
      key: function (i) { return JSON.parse(nativeStore.keyAt(i | 0)); },
      get length() { return nativeStore.size(); }
    };
  } else {
    kmaStore = fallback;
    if (browserStore) kmaStore = webGuard(browserStore);
  }
  window.kmaStore = kmaStore;

  /* ---------------- Web-app: veilig opslaan in de browser (4.4.0) ----------------
     In de browser (web-app en voorvertoning) staat alles in localStorage. Twee dingen gingen daar mis:
      1. Hetzelfde boekje in twee tabbladen (of de geïnstalleerde web-app naast een tabblad): elk tabblad houdt
         zijn eigen kopie in het geheugen en schrijft die in zijn geheel weg, dus het ene tabblad overschreef
         wat in het andere was ingevuld. Nu ziet een tabblad wanneer een ander tabblad iets van dezelfde app
         opslaat; het schrijft dan niets meer weg en laadt opnieuw (ongemerkt als het op de achtergrond stond).
      2. Als de opslag van de browser vol is, mislukte opslaan zonder melding. Nu verschijnt een duidelijke
         melding met wat je kunt doen.
     Het Reflectieboekje en het CadetVolgSysteem staan op dezelfde website en delen dus de opslag; ze letten
     alleen op hun eigen sleutels (het volgsysteem: kma-cvs-…). In de apps (Android, iPhone, Windows) speelt dit
     niet: daar heeft elke app een eigen, versleutelde opslag. */
  function webGuard(ls) {
    var isCvs = /volgsysteem/i.test(location.pathname || '');
    var SKIP = /^(kma-ui-|kma-eula|kma-large$|kma-contrast$|kma-pin-active|kma-cvs-unlocked)/;
    function mine(k) {
      if (k == null) return true;                  // clear()
      if (SKIP.test(k)) return false;
      var cvs = /^(idb:)?kma-cvs/.test(k);
      return isCvs ? cvs : !cvs;
    }
    var stale = false, warnedFull = false;
    function banner(id, html, btn) {
      if (!document.body) { document.addEventListener('DOMContentLoaded', function () { banner(id, html, btn); }); return; }
      if (document.getElementById(id)) return;
      var b = document.createElement('div');
      b.id = id; b.setAttribute('role', 'alert');
      b.style.cssText = 'position:fixed;left:12px;right:12px;top:12px;z-index:2147483000;background:#18251d;color:#f1f0e9;border:2px solid #d8cb92;border-radius:14px;padding:14px 16px;font:15px/1.4 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:560px;margin:0 auto';
      b.innerHTML = html + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">' +
        (btn ? '<button type="button" data-k="go" style="background:#d8cb92;color:#18251d;border:0;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer">' + btn + '</button>' : '') +
        '<button type="button" data-k="x" style="background:transparent;color:#f1f0e9;border:1px solid #6b7a70;border-radius:10px;padding:9px 14px;cursor:pointer">Sluiten</button></div>';
      b.addEventListener('click', function (e) {
        var k = e.target && e.target.getAttribute && e.target.getAttribute('data-k');
        if (k === 'go') location.reload();
        if (k === 'x') b.remove();
      });
      document.body.appendChild(b);
    }
    function showStale() {
      banner('kma-stale', '<strong>Je hebt de app ook in een ander tabblad open.</strong><br>Daar is net iets opgeslagen. Laad opnieuw om met de nieuwste gegevens verder te gaan; tot dan wordt hier niets opgeslagen, zodat er niets verloren gaat.', 'Opnieuw laden');
    }
    function showFull() {
      if (warnedFull) return; warnedFull = true;
      banner('kma-full', '<strong>Opslaan is niet gelukt: de opslag van deze browser is vol.</strong><br>Maak nu een back-up (⋮ → Back-up maken). Verwijder daarna grote bijlagen of je profielfoto, of gebruik de app op je telefoon of computer.', '');
    }
    window.addEventListener('storage', function (e) {
      try { if (e.storageArea && e.storageArea !== ls) return; } catch (x) {}
      if (!mine(e.key)) return;
      stale = true;
      if (!document.hidden) showStale();
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && stale) location.reload(); });
    window.kmaStoreStale = function () { return stale; };
    return {
      getItem: function (k) { return ls.getItem(k); },
      setItem: function (k, v) {
        if (stale && mine(k)) { showStale(); throw new Error('Niet opgeslagen: de app is in een ander tabblad gewijzigd.'); }
        try { ls.setItem(k, v); }
        catch (e) {
          if (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)) showFull();
          throw e;
        }
      },
      removeItem: function (k) { if (stale && mine(k)) { showStale(); return; } ls.removeItem(k); },
      clear: function () { ls.clear(); },
      key: function (i) { return ls.key(i); },
      get length() { return ls.length; }
    };
  }

  /* ---------------- PIN ---------------- */
  var kmaPin;
  if (nativeStore) {
    kmaPin = {
      isSet: function (scope) { return !!nativeStore.pinIsSet(scope); },
      set: function (scope, pin) { return !!nativeStore.pinSet(scope, String(pin)); },
      clear: function (scope) { nativeStore.pinClear(scope); },
      verify: function (scope, pin) { return JSON.parse(nativeStore.pinVerify(scope, String(pin))); }
    };
  } else {
    // Browser preview only: no real protection here.
    kmaPin = {
      isSet: function (scope) { return !!fallback.getItem('preview-pin:' + scope); },
      set: function (scope, pin) { fallback.setItem('preview-pin:' + scope, String(pin)); return true; },
      clear: function (scope) { fallback.removeItem('preview-pin:' + scope); },
      verify: function (scope, pin) { return { ok: fallback.getItem('preview-pin:' + scope) === String(pin), wait: 0 }; }
    };
  }
  window.kmaPin = kmaPin;

  /* Called by the app when it comes back after a while in the background: ask for the PIN again. */
  window.kmaRelock = function () {
    try {
      if (typeof checkCVSPinLock === 'function' && kmaPin.isSet('cvs')) {
        cvsIsUnlocked = false;
        try { sessionStorage.removeItem('kma-cvs-unlocked'); } catch (e) {}
        checkCVSPinLock();
      }
      var lock = document.getElementById('pin-lock-screen');
      if (lock && kmaPin.isSet('reflectie')) {
        if (typeof isUnlocked !== 'undefined') isUnlocked = false;
        var input = document.getElementById('pin-verify-input');
        if (input) input.value = '';
        lock.classList.add('active');
      }
    } catch (e) { /* page not ready yet */ }
  };

  /* ---------------- Faster transfer: compressed .kma files ----------------
     A cadet file is mostly text and shrinks 5-10× with gzip, so Quick Share / Bluetooth is that much faster.
     kmaShareFile() compresses big files when the app supports it; every file picker in both apps
     unpacks .kma files before the page reads them, so all existing import buttons accept them. */
  var GZ_MIN = 20 * 1024;
  function canGzip() { return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'; }
  function gzip(text) {
    var stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }
  function toBase64(buf) {
    var bytes = new Uint8Array(buf), out = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) out += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(out);
  }
  window.kmaShareFile = function (filename, text) {
    var A = window.Android;
    var plain = function () {
      if (A && A.shareFileViaBluetooth) A.shareFileViaBluetooth(filename, text);
      else { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = filename; a.click(); }
    };
    if (!(A && A.shareBase64File) || !canGzip() || String(text).length < GZ_MIN || !/\.json$/i.test(filename)) return plain();
    gzip(String(text)).then(function (buf) {
      A.shareBase64File(filename.replace(/\.json$/i, '.kma'), 'application/octet-stream', toBase64(buf));
    }).catch(plain);
  };
  // .kma files must be selectable in every picker that accepts .json
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (el && el.tagName === 'INPUT' && el.type === 'file') {
      var acc = el.getAttribute('accept') || '';
      if (/\.json/i.test(acc) && !/\.kma/i.test(acc)) el.setAttribute('accept', acc + ',.kma');
    }
  }, true);
  // Unpack gzip files (by content, whatever their name) before the page's own handler reads them.
  function isGzip(file) {
    return file.slice(0, 2).arrayBuffer().then(function (b) { var u = new Uint8Array(b); return u.length === 2 && u[0] === 0x1f && u[1] === 0x8b; });
  }
  function gunzipFile(file) {
    var stream = file.stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).text().then(function (t) {
      return new File([t], (file.name || 'bestand').replace(/\.kma$/i, '') + (/\.json$/i.test(file.name) ? '' : '.json'), { type: 'application/json' });
    });
  }
  document.addEventListener('change', function (e) {
    var input = e.target;
    var tf = window.kmaTransformFile;   // e.g. decrypting a file shared with a group code (kma-transfer.js)
    if (!input || input.type !== 'file' || !input.files || !input.files.length || input.__kmaUnpacked || (!canGzip() && !tf) || typeof DataTransfer === 'undefined') return;
    var files = Array.prototype.slice.call(input.files);
    if (files.some(function (f) { return /^image\//.test(f.type); })) return;   // photos are handled below
    e.stopImmediatePropagation();
    Promise.all(files.map(function (f) {
      var un = canGzip() ? isGzip(f).then(function (z) { return z ? gunzipFile(f) : f; }, function () { return f; }) : Promise.resolve(f);
      return tf ? un.then(function (g) { return tf(g); }) : un;
    })).then(function (out) {
      out = out.filter(Boolean);
      if (!out.length) { try { input.value = ''; } catch (err) {} return; }
      try { var dt = new DataTransfer(); out.forEach(function (f) { dt.items.add(f); }); input.files = dt.files; } catch (err) {}
      input.__kmaUnpacked = true;
      try { input.dispatchEvent(new Event('change', { bubbles: true })); } finally { input.__kmaUnpacked = false; }
    }).catch(function () { alert('Dit bestand kon niet worden uitgepakt.'); });
  }, true);

  /* ---------------- Photos: shrink camera pictures before the page reads them ----------------
     A phone photo is several MB; stored as text in the encrypted store and in shared files that makes
     saving and sharing slow or fail. Photos are scaled down (pasfoto 900 px, attachments 1800 px). */
  var PHOTO_INPUTS = { 'profile-photo-upload': 900, 'manual-photo-input': 900, 'cadet-photo-upload': 900 };
  function shrinkImage(file, maxSide) {
    var load = window.createImageBitmap
      ? createImageBitmap(file, { imageOrientation: 'from-image' })
      : new Promise(function (ok, bad) { var img = new Image(); img.onload = function () { ok(img); }; img.onerror = bad; img.src = URL.createObjectURL(file); });
    return load.then(function (bmp) {
      var w = bmp.width, h = bmp.height, k = Math.min(1, maxSide / Math.max(w, h));
      if (k === 1 && file.size < 600 * 1024) return file;
      var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (ok) { c.toBlob(function (b) { ok(b ? new File([b], (file.name || 'foto').replace(/\.[a-z0-9]+$/i, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() }) : file); }, 'image/jpeg', 0.85); });
    });
  }
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!input || input.type !== 'file' || !input.files || !input.files.length || input.__kmaShrunk) return;
    var max = PHOTO_INPUTS[input.id] || 1800;
    var files = Array.prototype.slice.call(input.files);
    var big = files.some(function (f) { return /^image\/(jpeg|png|webp|heic|heif)$/i.test(f.type) && f.size > 300 * 1024; });
    if (!big || typeof DataTransfer === 'undefined') return;
    e.stopImmediatePropagation();
    Promise.all(files.map(function (f) {
      return /^image\/(jpeg|png|webp|heic|heif)$/i.test(f.type) && f.size > 300 * 1024 ? shrinkImage(f, max).catch(function () { return f; }) : f;
    })).then(function (out) {
      try { var dt = new DataTransfer(); out.forEach(function (f) { dt.items.add(f); }); input.files = dt.files; } catch (err) {}
      input.__kmaShrunk = true;
      try { input.dispatchEvent(new Event('change', { bubbles: true })); } finally { input.__kmaShrunk = false; }
    });
  }, true);
  // Let the same file be chosen again (e.g. importing a corrected backup with the same name).
  // Runs after the page's own handler has taken the file; the manual-cadet photo is read later, so it keeps its file.
  document.addEventListener('change', function (e) {
    var input = e.target;
    if (input && input.type === 'file' && input.id !== 'manual-photo-input') setTimeout(function () { try { input.value = ''; } catch (err) {} }, 0);
  });

  var android = window.Android || null;
  if (!android) return;

  /* ---------------- Printing / PDF ---------------- */
  if (android.printPdf) {
    window.print = function () { android.printPdf(document.title || 'KMA'); };
  }

  /* ---------------- Downloads (<a download> with data: or blob: links) ---------------- */
  if (android.saveBase64File) {
    var originalRevoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = function (url) { setTimeout(function () { originalRevoke(url); }, 60000); };

    var originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      var href = this.href || '';
      if (this.hasAttribute('download') && (href.indexOf('data:') === 0 || href.indexOf('blob:') === 0)) {
        var name = this.getAttribute('download') || 'KMA_bestand';
        fetch(href).then(function (r) { return r.blob(); }).then(function (blob) {
          var reader = new FileReader();
          reader.onload = function () {
            var s = String(reader.result);
            android.saveBase64File(name, blob.type || 'application/octet-stream', s.slice(s.indexOf(',') + 1));
          };
          reader.readAsDataURL(blob);
        }).catch(function () { alert('Bestand kon niet worden opgeslagen.'); });
        return;
      }
      return originalClick.apply(this, arguments);
    };
  }

  /* ---------------- Speech-to-text for the microphone buttons ---------------- */
  // Android's WebView has no working Web Speech API, so the old mic buttons never worked in the app.
  // Always use Android's own speech recognition when the app provides it.
  if (android.startSpeech) {
    var pending = {};
    var seq = 0;
    var KmaSpeechRecognition = function () {
      this.lang = 'nl-NL';
      this.continuous = false;
      this.interimResults = false;
      this.onstart = null; this.onresult = null; this.onerror = null; this.onend = null;
    };
    KmaSpeechRecognition.prototype.start = function () {
      var id = String(++seq);
      pending[id] = this;
      if (this.onstart) this.onstart();
      android.startSpeech(id, this.lang || 'nl-NL');
    };
    KmaSpeechRecognition.prototype.stop = function () {};
    KmaSpeechRecognition.prototype.abort = function () {};
    window.__kmaSpeechResult = function (id, text, error) {
      var rec = pending[id];
      delete pending[id];
      if (!rec) return;
      if (text) {
        var alternative = [{ transcript: text, confidence: 1 }];
        alternative.isFinal = true;
        if (rec.onresult) rec.onresult({ resultIndex: 0, results: [alternative] });
      } else if (error && rec.onerror) {
        rec.onerror({ error: error });
      }
      if (rec.onend) rec.onend();
    };
    window.SpeechRecognition = KmaSpeechRecognition;
    window.webkitSpeechRecognition = KmaSpeechRecognition;
  }
})();
