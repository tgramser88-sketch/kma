/*
 * Versleuteld delen tussen het Reflectieboekje en het CadetVolgSysteem.
 * De teamleider maakt per groep een groepscode; cadetten vullen die code in. Het dossier van de cadet en
 * de feedback van de teamleider worden dan versleuteld (AES-GCM, sleutel via PBKDF2 uit de groepscode).
 * Een versleuteld bestand wordt bij het kiezen automatisch ontsleuteld, vóór de pagina het leest.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
/* Questions whose wording was corrected: answers saved under the old wording move to the new one. */
window.KMA_TEXT_RENAMES = {
  '[Verdieping] In hoeverre biedt jouw huidige thuis- or relatiesituatie de mentale rust en ondersteuning die nodig is tijdens een intensieve opleiding?': '[Verdieping] In hoeverre biedt jouw huidige thuis- of relatiesituatie de mentale rust en ondersteuning die nodig is tijdens een intensieve opleiding?',
  'TIJDGEBONDEN: Op welk vast moment ga jij jouw voortgang actief evalueren met een mentor or buddy?': 'TIJDGEBONDEN: Op welk vast moment ga jij jouw voortgang actief evalueren met een mentor of buddy?',
  'Welke eigenschappen van jouzelf gaan je vooruithelpen in je ontwikkeling tot officier?': 'Welke eigenschappen van jezelf gaan je vooruithelpen in je ontwikkeling tot officier?'
};
/** The air force is now CLRS (formerly CLSK / KLu). */
window.kmaFixOpco = function (v) {
  if (typeof v !== 'string') return v;
  return v.replace(/^\s*(CLSK|KLu)\b/i, 'CLRS');
};
/** Moves answers saved under an old question text; returns true when something changed. */
window.kmaRenameAnswers = function (a) {
  var ch = false;
  if (!a || typeof a !== 'object') return ch;
  Object.keys(window.KMA_TEXT_RENAMES).forEach(function (o) {
    var n = window.KMA_TEXT_RENAMES[o];
    if (Object.prototype.hasOwnProperty.call(a, o)) { if (!(n in a) || !String(a[n] || '').trim()) a[n] = a[o]; delete a[o]; ch = true; }
  });
  var op = 'OPCO (Krijgsmachtdeel, bijv. CLAS, CZSK):', v = window.kmaFixOpco(a[op]);
  if (typeof a[op] === 'string' && v !== a[op]) { a[op] = v; ch = true; }
  return ch;
};
(function () {
  'use strict';
  var ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', ITER = 600000, ITER_V1 = 150000; // 600.000 rondes: OWASP-advies voor PBKDF2-SHA256
  var CVS = /volgsysteem/i.test(location.pathname);
  var MY = 'kma-x-groupcode', GROUPS = 'kma-cvs-groupcodes';
  var st = function () { return window.kmaStore || window.localStorage; };
  var enc = new TextEncoder(), dec = new TextDecoder();
  function subtle() { return window.crypto && crypto.subtle; }
  function norm(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function pretty(c) { return norm(c).replace(/(.{4})(?=.)/g, '$1-'); }
  function valid(c) { return norm(c).length >= 8; }
  function gen() {
    var b = new Uint8Array(12); crypto.getRandomValues(b);
    return pretty(Array.prototype.map.call(b, function (x) { return ABC[x % ABC.length]; }).join(''));
  }
  function b64(buf) { var u = new Uint8Array(buf), s = '', CH = 0x8000; for (var i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); }
  function unb64(s) { var t = atob(s), u = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; }
  function codeId(code) {
    return subtle().digest('SHA-256', enc.encode('kma-groepscode:' + norm(code))).then(function (h) { return Array.prototype.map.call(new Uint8Array(h).slice(0, 4), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
  }
  /* Versie 2 (vanaf 4.3): 600.000 rondes, geen naam meer leesbaar in het bestand, de kop is beschermd (AAD)
     en in plaats van een vaste vingerafdruk van de code een hint van 1 byte die per bestand anders is.
     Versie 1-bestanden blijven leesbaar. */
  function key(code, salt, it) {
    it = Math.max(100000, Math.min(5000000, Number(it) || ITER_V1));
    return subtle().importKey('raw', enc.encode(norm(code)), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return subtle().deriveKey({ name: 'PBKDF2', salt: salt, iterations: it, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }
  function hint(code, saltB64) {
    return subtle().digest('SHA-256', enc.encode('kma-hint:' + saltB64 + ':' + norm(code))).then(function (h) { return ('0' + new Uint8Array(h)[0].toString(16)).slice(-2); });
  }
  function aad(o) { return enc.encode(['kma-enc', o.v, o.alg, o.kdf, o.it, o.z, o.salt, o.hint].join('|')); }
  function zip(text) {
    if (typeof CompressionStream === 'undefined') return Promise.resolve({ z: 0, bytes: enc.encode(text) });
    var s = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return new Response(s).arrayBuffer().then(function (b) { return { z: 1, bytes: new Uint8Array(b) }; });
  }
  function unzip(bytes, z) {
    if (!z) return Promise.resolve(dec.decode(bytes));
    var s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(s).text();
  }
  /** Encrypt text with a group code → JSON text of the envelope. */
  function encrypt(text, code, meta) {
    if (!subtle()) return Promise.reject(new Error('geen-crypto'));
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    var saltB64 = b64(salt);
    return Promise.all([zip(String(text)), key(code, salt, ITER), hint(code, saltB64)]).then(function (r) {
      var o = { type: 'kma-enc', v: 2, alg: 'AES-GCM', kdf: 'PBKDF2-SHA256', it: ITER, z: r[0].z, salt: saltB64, hint: r[2] };
      return subtle().encrypt({ name: 'AES-GCM', iv: iv, additionalData: aad(o) }, r[1], r[0].bytes).then(function (ct) {
        o.iv = b64(iv); o.data = b64(ct);
        if (meta && meta.kind) o.kind = meta.kind;   // alleen het soort bestand, nooit een naam
        return JSON.stringify(o);
      });
    });
  }
  function isEnc(o) { return !!(o && o.type === 'kma-enc' && o.data && o.iv && o.salt); }
  /** Decrypt an envelope with one of the codes; resolves with the text, rejects when no code fits. */
  function decrypt(o, codes) {
    if (!subtle()) return Promise.reject(new Error('geen-crypto'));
    var list = (codes || []).filter(valid);
    var v2 = Number(o.v) >= 2;
    return Promise.all(list.map(function (c) { return v2 ? hint(c, o.salt) : codeId(c); })).then(function (ids) {
      // v2: alleen codes met de juiste hint proberen; v1: de code met de juiste vingerafdruk eerst
      var order = list.map(function (c, i) { return { c: c, hit: ids[i] === (v2 ? o.hint : o.codeId) }; }).filter(function (x) { return !v2 || x.hit; }).sort(function (a, b) { return b.hit - a.hit; });
      var tryAt = function (i) {
        if (i >= order.length) return Promise.reject(new Error('code'));
        var prm = { name: 'AES-GCM', iv: unb64(o.iv) }; if (v2) prm.additionalData = aad(o);
        return key(order[i].c, unb64(o.salt), v2 ? o.it : ITER_V1).then(function (k) { return subtle().decrypt(prm, k, unb64(o.data)); })
          .then(function (pt) { return unzip(new Uint8Array(pt), o.z); }, function () { return tryAt(i + 1); });
      };
      return tryAt(0);
    });
  }

  /* ---------------- Codes ---------------- */
  function myCode() { try { return st().getItem(MY) || ''; } catch (e) { return ''; } }
  function groupCodes() { try { var g = JSON.parse(st().getItem(GROUPS)); return g && typeof g === 'object' ? g : {}; } catch (e) { return {}; } }
  function saveGroupCodes(g) { try { st().setItem(GROUPS, JSON.stringify(g)); } catch (e) {} }
  function codeForGroup(g) { var x = groupCodes()[g]; return x && x.code ? x.code : ''; }
  function allCodes() {
    if (!CVS) return myCode() ? [myCode()] : [];
    var g = groupCodes(), out = [];
    Object.keys(g).forEach(function (k) { if (g[k].code) out.push(g[k].code); (g[k].old || []).forEach(function (c) { out.push(c); }); });
    return out;
  }
  var asked = [];   // codes typed in during this session (e.g. a code from another group)

  /* ---------------- Decrypt chosen files before the page reads them ----------------
     kma-bridge.js passes every chosen file through window.kmaTransformFile (after unzipping). */
  window.kmaTransformFile = function (f) {
    if (!f || f.size > 40 * 1024 * 1024 || /^image\//.test(f.type)) return Promise.resolve(f);
    return f.slice(0, 120).text().then(function (head) {
      if (!/^\s*\{\s*"type"\s*:\s*"kma-enc"/.test(head)) return f;
      return f.text().then(function (t) {
        var o = null; try { o = JSON.parse(t); } catch (x) {}
        if (!isEnc(o)) return f;
        var attempt = function (cs, again) {
          return decrypt(o, cs).catch(function (err) {
            if (err && err.message === 'geen-crypto') { alert('"' + f.name + '" is versleuteld, maar versleutelen werkt niet op dit toestel.'); return null; }
            var c = o.kind === 'backup'
              ? prompt((again ? 'Dat wachtwoord past niet. ' : '') + '"' + f.name + '" is een beveiligde back-up.\nTyp het wachtwoord van deze back-up:', '')
              : prompt((again ? 'Die code past niet. ' : '') + '"' + f.name + '" is versleuteld met een groepscode.\nTyp de groepscode:', '');
            if (!c) return null;
            asked.push(c);
            return attempt([c], true);
          });
        };
        return attempt(allCodes().concat(asked), false).then(function (text) {
          return text == null ? null : new File([text], f.name.replace(/\.kma$/i, '.json'), { type: 'application/json' });
        });
      });
    }, function () { return f; });
  };

  /* ---------------- Sharing ---------------- */
  var plainShare = window.kmaShareFile;
  function shareWith(code, filename, text) {
    if (!code || !plainShare) return plainShare && plainShare(filename, text);
    encrypt(text, code, { kind: /Feedback/i.test(filename) ? 'feedback' : 'dossier' }).then(function (t) {
      plainShare(filename, t);
      if (window.kmaToast) kmaToast('Versleuteld gedeeld met de groepscode');
    }, function () {
      kmaConfirm('Versleutelen lukt niet op dit toestel. Onversleuteld delen?', { danger: false }).then(function (ok) { if (!ok) return; plainShare(filename, text); });
    });
  }
  if (plainShare && !CVS) {
    // The cadet's dossier is encrypted when a group code is set; backups and exports for yourself are not.
    window.kmaShareFile = function (filename, text) {
      if (/^KMA_Cadet_Profiel/i.test(filename) && myCode()) return shareWith(myCode(), filename, text);
      return plainShare(filename, text);
    };
  }

  /* ---------------- Beveiligde back-up ----------------
     Een back-up bevat alles (ook privé-hoofdstukken, of in het CadetVolgSysteem alle cadetten). Daarom wordt bij
     elke back-up gevraagd om een wachtwoord. Terugzetten gaat zoals altijd: de app vraagt dan om het wachtwoord. */
  window.kmaProtectBackup = function (filename, text, save) {
    if (!subtle()) return save(filename, text, false);
    var ov = sheet('Back-up beveiligen', '<div class="kma-code-body"><p>Een back-up bevat al je gegevens. Met een wachtwoord kan niemand anders het bestand lezen, ook niet als het in verkeerde handen komt.</p>' +
      '<label class="kma-code-lab">Wachtwoord (minstens 10 letters of cijfers)<input type="password" id="kma-bk-pw" autocomplete="new-password"/></label>' +
      '<label class="kma-code-lab">Herhaal het wachtwoord<input type="password" id="kma-bk-pw2" autocomplete="new-password"/></label>' +
      '<p class="muted small">Onthoud dit wachtwoord goed. Zonder wachtwoord kun je de back-up niet terugzetten.</p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="plain">Zonder wachtwoord</button><button type="button" class="kma-icon-btn is-primary" data-x="prot">Beveiligd opslaan</button></div></div>', function (e) {
      var b = e.target.closest('[data-x]'); if (!b) return;
      if (b.getAttribute('data-x') === 'plain') { ov.remove(); save(filename, text, false); return; }
      if (b.getAttribute('data-x') !== 'prot') return;
      var pw = ov.querySelector('#kma-bk-pw').value, pw2 = ov.querySelector('#kma-bk-pw2').value;
      if (norm(pw).length < 10) { alert('Kies een wachtwoord van minstens 10 letters of cijfers.'); return; }
      if (pw !== pw2) { alert('De twee wachtwoorden zijn niet gelijk.'); return; }
      b.disabled = true;
      encrypt(text, pw, { kind: 'backup' }).then(function (t) { ov.remove(); save(filename, t, true); if (window.kmaToast) kmaToast('Back-up beveiligd opgeslagen'); },
        function () { b.disabled = false; alert('Beveiligen lukt niet op dit toestel.'); });
    });
  };
  // kma-transfer.js staat in de kop van de pagina; de exportfuncties bestaan pas als de pagina is gelezen.
  function installCvsBackup() {
    if (!CVS || typeof window.exportInstructorData !== 'function' || window.exportInstructorData.kmaProtected) return;
    var cvsSave = function (name, t) {
      if (window.Android && window.Android.saveJsonFile) return window.Android.saveJsonFile(name, t);
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'application/json' })); a.download = name;
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    };
    var cvsName = function () { return 'KMA_CVS_Database_Backup_' + new Date().toISOString().split('T')[0] + '.json'; };
    window.exportInstructorData = function () { window.kmaProtectBackup(cvsName(), JSON.stringify(cadets, null, 2), cvsSave); };
    window.exportInstructorData.kmaProtected = true;
    window.exportInstructorDataBluetooth = function () {
      window.kmaProtectBackup(cvsName(), JSON.stringify(cadets, null, 2), function (name, t) {
        if (window.Android && window.Android.shareFileViaBluetooth && window.kmaShareFile) kmaShareFile(name, t); else cvsSave(name, t);
      });
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installCvsBackup); else installCvsBackup();

  /* ---------------- Dialogs ---------------- */
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sheet(title, body, onClick) {
    var ov = document.createElement('div');
    ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet" role="dialog" aria-modal="true" style="transform:none"><div class="kma-sheet-grip"></div><div class="kma-sheet-title">' + esc(title) + '</div>' + body + '</div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-x="close"]')) { ov.remove(); return; } onClick(e, ov); });
    return ov;
  }
  /** Cadet: fill in or remove the group code. */
  function codeDialog() {
    var cur = myCode();
    var ov = sheet('Versleuteld delen',
      '<div class="kma-code-body"><p class="muted">Vraag je teamleider om de groepscode. Met die code wordt je dossier versleuteld voordat je het deelt; alleen het CadetVolgSysteem met dezelfde code kan het openen.</p>' +
      '<input type="text" id="kma-code-in" class="kma-code-input" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX" value="' + esc(cur ? pretty(cur) : '') + '"/>' +
      '<p class="kma-code-err" id="kma-code-err" role="alert"></p>' +
      '<div class="kma-row-btns">' + (cur ? '<button type="button" class="kma-icon-btn" data-x="off">Uitzetten</button>' : '<button type="button" class="kma-icon-btn" data-x="close">Annuleren</button>') +
      '<button type="button" class="kma-icon-btn is-primary" data-x="save">Opslaan</button></div></div>',
      function (e, ov) {
        if (e.target.closest('[data-x="off"]')) { try { st().removeItem(MY); } catch (x) {} ov.remove(); if (window.kmaToast) kmaToast('Versleuteld delen staat uit'); return; }
        if (e.target.closest('[data-x="save"]')) {
          var v = ov.querySelector('#kma-code-in').value;
          if (!valid(v)) { ov.querySelector('#kma-code-err').textContent = 'Een groepscode heeft minstens 8 letters of cijfers.'; return; }
          try { st().setItem(MY, pretty(v)); } catch (x) {}
          ov.remove(); if (window.kmaToast) kmaToast('Groepscode opgeslagen: je dossier wordt versleuteld gedeeld');
        }
      });
    setTimeout(function () { var i = ov.querySelector('#kma-code-in'); if (i && !cur) i.focus(); }, 50);
  }
  /** Teamleider: a code per group. Old codes are kept so earlier files still open. */
  function groupsDialog() {
    var groups = ['ALFA', 'BRAVO', 'CHARLIE', 'DELTA'];
    (typeof cadets !== 'undefined' ? cadets : []).forEach(function (c) { if (c && c.group && groups.indexOf(c.group) < 0) groups.push(c.group); });
    var draw = function () {
      var g = groupCodes();
      return '<div class="kma-code-body"><p class="muted">Geef de groepscode aan de cadetten van die groep: laat ze de <b>QR</b> scannen (⋮ → Koppelen met je teamleider) of geef de code door (⋮ → Versleuteld delen). Hun dossiers en jouw feedback gaan dan versleuteld. Bestanden zonder code blijven gewoon werken.</p>' +
        '<div class="kma-code-list">' + groups.map(function (n) {
          var c = g[n] && g[n].code;
          return '<div class="kma-code-row"><strong>' + esc(n) + '</strong>' + (c ? '<code>' + esc(pretty(c)) + '</code>' : '<span class="muted">geen code</span>') +
            (c && window.KMAKoppel ? '<button type="button" class="kma-chip-btn is-qr" data-qr="' + esc(n) + '">QR</button>' : '') +
            '<button type="button" class="kma-chip-btn" data-new="' + esc(n) + '">' + (c ? 'Nieuwe code' : 'Maak code') + '</button>' +
            (c ? '<button type="button" class="kma-chip-btn" data-del="' + esc(n) + '">Uitzetten</button>' : '') + '</div>';
        }).join('') + '</div><div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-x="close">Klaar</button></div></div>';
    };
    var title = function () { return 'Groepscodes' + (window.kmaPeloton && kmaPeloton() ? ' · ' + kmaPeloton() : ''); };
    var ov = sheet(title(), draw(), function (e, ov) {
      var q = e.target.closest('[data-qr]');
      if (q) { ov.remove(); window.KMAKoppel.showQr(q.getAttribute('data-qr')); return; }
      var b = e.target.closest('[data-new],[data-del]'); if (!b) return;
      var g = groupCodes(), n = b.getAttribute('data-new') || b.getAttribute('data-del'), x = g[n] || {};
      if (b.hasAttribute('data-new')) {
        var kmaGo = function () {
        if (x.code) x.old = (x.old || []).concat([x.code]).slice(-5);
        x.code = gen();
      };
      if (x.code) { kmaConfirm('Een nieuwe code maken voor ' + n + '? Cadetten moeten dan de nieuwe code invullen. Bestanden met de oude code kun je nog steeds openen.', { danger: false }).then(function (ok) { if (ok) kmaGo(); }); return; }
      kmaGo();
} else {
        kmaConfirm('Versleuteld delen uitzetten voor ' + n + '? Je feedback gaat dan onversleuteld.', { ok: 'Uitzetten', danger: true }).then(function (ok) { if (!ok) return;
        if (x.code) x.old = (x.old || []).concat([x.code]).slice(-5);
        x.code = '';
      });
}
      g[n] = x; saveGroupCodes(g);
      ov.querySelector('.kma-sheet').innerHTML = '<div class="kma-sheet-grip"></div><div class="kma-sheet-title">' + esc(title()) + '</div>' + draw();
    });
  }

  window.KMAX = {
    encrypt: encrypt, decrypt: decrypt, isEnc: isEnc, gen: gen, pretty: pretty, valid: valid,
    myCode: myCode, setMyCode: function (c) { if (!valid(c)) return false; try { st().setItem(MY, pretty(c)); } catch (x) { return false; } return true; }, codeForGroup: codeForGroup, allCodes: allCodes, codeDialog: codeDialog, groupsDialog: groupsDialog,
    /** Share a file encrypted with this group's code (CadetVolgSysteem) when the group has one. */
    shareFor: function (group, filename, text) { return shareWith(CVS ? codeForGroup(group) : myCode(), filename, text); }
  };
})();
