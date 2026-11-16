/*
 * Web-versie (zonder app store): dezelfde schermen als de apps, in de browser.
 *  - Delen: via het deelmenu van het toestel (WhatsApp, Teams, mail, ...) als de browser dat kan,
 *    anders wordt het bestand gedownload.
 *  - Werkt offline na het eerste bezoek (service worker) en is te installeren op het beginscherm.
 *  - Gegevens blijven op dit toestel, in de opslag van de browser. Maak regelmatig een back-up.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  window.KMA_PLATFORM = 'web';
  function toast(m, k) { if (window.kmaToast) kmaToast(m, k || 'info', 4500); }
  function download(name, blob) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    toast('Opgeslagen in je map Downloads: ' + name);
  }
  function share(name, blob) {
    var file = null;
    try { file = new File([blob], name, { type: blob.type || 'application/octet-stream' }); } catch (e) {}
    if (file && navigator.canShare && navigator.share && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: name }).catch(function (e) { if (!e || e.name !== 'AbortError') download(name, blob); });
    } else download(name, blob);
  }
  function b64blob(b64, mime) { var t = atob(String(b64)), u = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return new Blob([u], { type: mime || 'application/octet-stream' }); }
  // Only what the pages need for sharing and saving; printing, the microphone and the camera use the browser itself.
  window.Android = {
    shareFileViaBluetooth: function (n, t) { share(String(n || 'KMA.json'), new Blob([String(t == null ? '' : t)], { type: 'application/json' })); },
    shareBase64File: function (n, m, b) { share(String(n || 'KMA'), b64blob(b, m)); },
    saveJsonFile: function (n, t) { download(String(n || 'KMA.json'), new Blob([String(t == null ? '' : t)], { type: 'application/json' })); }
  };

  /* 4.5.4: de installatievraag van de browser bewaren voor kma-web-veilig.js (die laadt later). */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); window.__kmaInstallPrompt = e; });
  /* Keep the data: ask the browser not to clear this site's storage. */
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  /* Offline + installable */
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  /* Web wording instead of "Quick Share / Bluetooth" */
  var RULES = [
    [/Via Quick Share \(snelst\) of Bluetooth/g, 'Delen als bestand'],
    [/Quick Share \(snelst\) of Bluetooth/g, 'WhatsApp, Teams, e-mail of een gedeelde map'],
    [/[Vv]ia Quick Share of Bluetooth/g, 'Als bestand delen'],
    [/Quick Share of Bluetooth/g, 'WhatsApp, Teams, e-mail of een gedeelde map'],
    [/Bluetooth of Quick Share/g, 'WhatsApp, Teams, e-mail of een gedeelde map'],
    [/Quick Share & Bluetooth/g, 'WhatsApp, Teams, e-mail of een gedeelde map'],
    [/ · kies Quick Share, dat is het snelst/g, ''],
    [/uit de map 'Downloads' \(Quick Share\) of 'Bluetooth'/g, 'uit je map Downloads'],
    [/Bluetooth Export/g, 'Als bestand delen'],
    [/Bluetooth Import/g, 'Bestand inlezen'],
    [/via Quick Share/g, 'als bestand'],
    [/Quick Share/g, 'het deelmenu'],
    [/Downloads\/KMA/g, 'Downloads'],
    [/\bBluetooth\b/g, 'bestand']
  ];
  function fix(t) { var o = t; RULES.forEach(function (r) { o = o.replace(r[0], r[1]); }); return o.replace(/bestand of bestand/g, 'bestand'); }
  var HIT = /Quick Share|Bluetooth|Downloads\/KMA/;
  function walk(n) {
    if (!n) return;
    if (n.nodeType === 3) { if (HIT.test(n.nodeValue)) { var t = fix(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; } return; }
    if (n.nodeType !== 1 || n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'TEXTAREA') return;
    ['title', 'placeholder', 'aria-label'].forEach(function (a) { var v = n.getAttribute && n.getAttribute(a); if (v && HIT.test(v)) n.setAttribute(a, fix(v)); });
    for (var c = n.firstChild; c; c = c.nextSibling) walk(c);
  }
  var al = window.alert, cf = window.confirm, pr = window.prompt;
  window.alert = function (m) { return al.call(window, fix(String(m))); };
  window.confirm = function (m) { return cf.call(window, fix(String(m))); };
  window.prompt = function (m, v) { return pr.call(window, fix(String(m)), v); };
  document.addEventListener('DOMContentLoaded', function () {
    walk(document.body);
    new MutationObserver(function (l) { l.forEach(function (m) { if (m.type === 'characterData') walk(m.target); else m.addedNodes.forEach(walk); }); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
