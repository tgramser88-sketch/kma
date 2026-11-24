/*
 * Onderzoek (blok B stap 2 en 3, F): gedeelde kern voor het Reflectieboekje, het CadetVolgSysteem en de Onderzoeksapp.
 *  - Sleutel van de onderzoeker: 'KMAO1.' + base64url(SPKI van een RSA-OAEP-3072-sleutel). Vingerafdruk: 8 tekens uit SHA-256.
 *  - seal(record, sleutel): AES-GCM-256 met een willekeurige sleutel, die sleutel versleuteld met RSA-OAEP-SHA-256.
 *  - Een record bevat ALLEEN codes, getallen, keuzes uit vaste lijsten en maanden (JJJJ-MM). check(record) weigert alles
 *    wat daarbuiten valt: geen namen, Peoplesoft-nummers, vrije tekst of welzijnsvragen (PSS, WHO-5).
 *  - Meetmoment: begin (sep-dec), midden (jan-apr), eind (mei-aug) van het opleidingsjaar.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var subtle = (window.crypto || {}).subtle;
  var RSA = { name: 'RSA-OAEP', hash: 'SHA-256' };
  var V4 = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'];
  var TR = ['H', 'E', 'X', 'A', 'C', 'O'];
  var BRON = ['zelf', 'medecadet', 'staf'];
  var MM = ['begin', 'midden', 'eind'];
  var CODE_RE = /^OC-[0-9A-HJ-NP-Z]{4}-[0-9A-HJ-NP-Z]{4}$/;
  var HEX_RE = /^[0-9a-f]{8}$/;
  var MAAND_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

  function b64(buf) { var u = new Uint8Array(buf), s = ''; for (var i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { var t = atob(s), u = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; }
  function b64url(buf) { return b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64url(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return unb64(s); }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }
  var enc = new TextEncoder(), dec = new TextDecoder();

  /* ---------------- Sleutels ---------------- */
  function parseKey(s) {
    s = String(s || '').replace(/\s+/g, '');
    var m = /^KMAO1\.([A-Za-z0-9_-]{300,1200})$/.exec(s);
    return m ? m[1] : null;
  }
  function fingerprint(keyStr) {
    var raw = parseKey(keyStr); if (!raw || !subtle) return Promise.resolve('');
    return subtle.digest('SHA-256', unb64url(raw)).then(function (h) { var x = hex(h).slice(0, 8).toUpperCase(); return x.slice(0, 4) + '-' + x.slice(4); });
  }
  /** Controleert dat de sleutel een echte RSA-OAEP-sleutel is. */
  function checkKey(keyStr) {
    var raw = parseKey(keyStr); if (!raw || !subtle) return Promise.resolve(false);
    return subtle.importKey('spki', unb64url(raw), RSA, false, ['encrypt']).then(function () { return true; }, function () { return false; });
  }
  /** Onderzoeksapp: nieuw sleutelpaar. → { key: 'KMAO1.…', priv: jwk } */
  function makeKeyPair() {
    return subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']).then(function (kp) {
      return Promise.all([subtle.exportKey('spki', kp.publicKey), subtle.exportKey('jwk', kp.privateKey)]).then(function (x) { return { key: 'KMAO1.' + b64url(x[0]), priv: x[1] }; });
    });
  }

  /* ---------------- Versleutelen ---------------- */
  function seal(record, keyStr) {
    var raw = parseKey(keyStr); if (!raw) return Promise.reject(new Error('Geen geldige onderzoekssleutel'));
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return Promise.all([subtle.importKey('spki', unb64url(raw), RSA, false, ['encrypt']), subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']), fingerprint(keyStr)]).then(function (r) {
      return Promise.all([subtle.exportKey('raw', r[1]), subtle.encrypt({ name: 'AES-GCM', iv: iv }, r[1], enc.encode(JSON.stringify(record)))]).then(function (x) {
        return subtle.encrypt(RSA, r[0], x[0]).then(function (wk) { return JSON.stringify({ type: 'kma-onderzoek-sealed', v: 1, fp: r[2], key: b64(wk), iv: b64(iv), data: b64(x[1]) }); });
      });
    });
  }
  function unseal(o, privJwk) {
    if (typeof o === 'string') o = JSON.parse(o);
    if (!o || o.type !== 'kma-onderzoek-sealed') return Promise.reject(new Error('Geen onderzoeksbestand'));
    return subtle.importKey('jwk', privJwk, RSA, false, ['decrypt']).then(function (k) { return subtle.decrypt(RSA, k, unb64(o.key)); })
      .then(function (rawK) { return subtle.importKey('raw', rawK, 'AES-GCM', false, ['decrypt']); })
      .then(function (k) { return subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, k, unb64(o.data)); })
      .then(function (buf) { return JSON.parse(dec.decode(buf)); });
  }
  /** Privésleutel bewaren met een wachtwoord (PBKDF2 600 000 x, AES-GCM). */
  function lockPriv(privJwk, pw) {
    var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    return subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 600000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
    }).then(function (k) { return subtle.encrypt({ name: 'AES-GCM', iv: iv }, k, enc.encode(JSON.stringify(privJwk))); })
      .then(function (ct) { return { type: 'kma-onderzoek-privsleutel', v: 1, salt: b64(salt), iv: b64(iv), data: b64(ct) }; });
  }
  function unlockPriv(o, pw) {
    return subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return subtle.deriveKey({ name: 'PBKDF2', salt: unb64(o.salt), iterations: 600000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    }).then(function (k) { return subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, k, unb64(o.data)); })
      .then(function (b) { return JSON.parse(dec.decode(b)); });
  }

  /* ---------------- Codes en meetmomenten ---------------- */
  var ALFA = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  function newCode() {
    var r = crypto.getRandomValues(new Uint8Array(8)), s = '';
    for (var i = 0; i < 8; i++) s += ALFA[r[i] % ALFA.length];
    return 'OC-' + s.slice(0, 4) + '-' + s.slice(4);
  }
  /** Code zonder naam voor een groep, teamleider of peloton (8 hex). */
  function pseudo(kind, naam) {
    if (!naam || !subtle) return Promise.resolve('');
    return subtle.digest('SHA-256', enc.encode('kma-onderzoek:' + kind + ':' + String(naam).trim().toLowerCase())).then(function (h) { return hex(h).slice(0, 8); });
  }
  function maand(d) { var m = /^(\d{4})-(\d{2})/.exec(String(d || '')); return m ? m[1] + '-' + m[2] : ''; }
  function meetmoment(d) {
    var m = /^(\d{4})-(\d{2})/.exec(String(d || '')); if (!m) return null;
    var y = Number(m[1]), mo = Number(m[2]), jaar = mo >= 9 ? y : y - 1;
    return { jaar: jaar, moment: mo >= 9 ? 'begin' : (mo <= 4 ? 'midden' : 'eind') };
  }

  /* ---------------- Controle: niets identificerends ---------------- */
  // Toegestane velden per pad; '*' = elk element van een lijst of elke sleutel van een object.
  var NUM = function (lo, hi) { return function (v) { return typeof v === 'number' && isFinite(v) && v >= lo && v <= hi; }; };
  var INT = function (lo, hi) { return function (v) { return NUM(lo, hi)(v) && Math.round(v) === v; }; };
  var ONE = function (list) { return function (v) { return list.indexOf(v) >= 0; }; };
  var RE = function (re) { return function (v) { return typeof v === 'string' && re.test(v); }; };
  var OPT = function (f) { return function (v) { return v === null || v === undefined || v === '' || f(v); }; };
  var SCHEMA = {
    type: ONE(['kma-onderzoek']), v: ONE([1]), bron: ONE(['boekje', 'cvs']), code: RE(CODE_RE), groep: OPT(RE(HEX_RE)), tl: OPT(RE(HEX_RE)),
    jaar: INT(2020, 2100), moment: ONE(MM), maand: RE(MAAND_RE), app: RE(/^\d+\.\d+\.\d+$/), set: OPT(ONE(['ipip-hexaco-96', 'ipip-hexaco-240'])),
    instroom: OPT(ONE(['burger', 'doorstromer'])), geslacht: OPT(ONE(['man', 'vrouw', 'anders'])),
    'items.*': INT(1, 5), 'items': function (v) { return Array.isArray(v) && v.length <= 200; },
    'extra.*': INT(1, 5), 'extra': function (v) { return Array.isArray(v) && v.length === 144; }, 'domein240.*': OPT(NUM(0, 100)),
    'domein.*': OPT(NUM(0, 100)), 'facet.*': OPT(NUM(1, 5)),
    'leary': function (v) { return Array.isArray(v) && v.length <= 2000; },
    'leary.*.bron': ONE(BRON), 'leary.*.b': NUM(-2, 2), 'leary.*.s': NUM(-2, 2), 'leary.*.maand': OPT(RE(MAAND_RE)), 'leary.*.gever': OPT(RE(CODE_RE)), 'leary.*.v': OPT(ONE(V4)),
    'kaarten': function (v) { return Array.isArray(v) && v.length <= 2000; },
    'kaarten.*.gever': OPT(RE(CODE_RE)), 'kaarten.*.v': OPT(ONE(V4)), 'kaarten.*.soort': ONE(['vasthouden', 'verbeteren']), 'kaarten.*.maand': OPT(RE(MAAND_RE)),
    'kaarten.*.b': OPT(NUM(-2, 2)), 'kaarten.*.s': OPT(NUM(-2, 2)), 'kaarten.*.stap': ONE([0, 1]), 'kaarten.*.actie': ONE([0, 1]),
    'v4.*.zelf': INT(0, 100000), 'v4.*.medecadet': INT(0, 100000), 'v4.*.staf': INT(0, 100000),
    'zelfbeoordeling.*': OPT(NUM(0, 10)), 'beoordeling.*': OPT(NUM(0, 10)), 'sterktes.*': ONE(TR), 'sterktes': function (v) { return Array.isArray(v) && v.length <= 6; },
    'bruikbaar.norm': OPT(INT(1, 5)), 'bruikbaar.schaal': OPT(INT(1, 5)), 'bruikbaar.roos': OPT(INT(1, 5))
  };
  function keyOk(path) {
    if (SCHEMA[path]) return SCHEMA[path];
    var gen = path.replace(/\.\d+(?=\.|$)/g, '.*').replace(/^(domein240|domein|facet|v4|zelfbeoordeling|beoordeling)\.[^.]+/, '$1.*');
    return SCHEMA[gen] || null;
  }
  var OBJ = /^(domein240|domein|facet|v4|v4\.[^.]+|zelfbeoordeling|beoordeling|bruikbaar|leary\.\d+|kaarten\.\d+)$/;
  /** Lijst met problemen; leeg = in orde. */
  function check(rec) {
    var err = [];
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return ['geen record'];
    (function walk(v, path) {
      if (Array.isArray(v)) {
        var fa = keyOk(path);
        if (!fa) err.push(path + ': lijst niet toegestaan'); else if (!fa(v)) err.push(path + ': lijst te lang');
        v.forEach(function (x, i) { walk(x, path + '.' + i); });
        return;
      }
      if (v && typeof v === 'object') {
        if (path && !OBJ.test(path)) { err.push(path + ': object niet toegestaan'); return; }
        Object.keys(v).forEach(function (k) { walk(v[k], path ? path + '.' + k : k); });
        return;
      }
      var f = keyOk(path);
      if (!f) { err.push(path + ': veld niet toegestaan'); return; }
      if (!f(v)) err.push(path + ': waarde niet toegestaan');
    })(rec, '');
    ['type', 'v', 'bron', 'code', 'jaar', 'moment'].forEach(function (k) { if (rec[k] === undefined) err.push(k + ': ontbreekt'); });
    if (rec.domein) Object.keys(rec.domein).forEach(function (k) { if (TR.indexOf(k) < 0) err.push('domein.' + k + ': onbekend'); });
    if (rec.domein240) Object.keys(rec.domein240).forEach(function (k) { if (TR.indexOf(k) < 0) err.push('domein240.' + k + ': onbekend'); });
    if ((rec.extra || rec.domein240) && rec.set !== 'ipip-hexaco-240') err.push('extra: alleen bij set ipip-hexaco-240');
    if (rec.v4) Object.keys(rec.v4).forEach(function (k) { if (V4.indexOf(k) < 0) err.push('v4.' + k + ': onbekend'); });
    ['zelfbeoordeling', 'beoordeling'].forEach(function (g) { if (rec[g]) Object.keys(rec[g]).forEach(function (k) { if (V4.indexOf(k) < 0) err.push(g + '.' + k + ': onbekend'); }); });
    if (rec.facet) Object.keys(rec.facet).forEach(function (k) { if (!/^[A-Za-zÀ-ÿ\- ]{3,40}$/.test(k) || FACETS.indexOf(k) < 0) err.push('facet: onbekend facet'); });
    return err;
  }
  // Facetnamen van de IPIP-HEXACO-96 zoals in het boekje (vaste lijst, geen vrije tekst).
  var FACETS = ['Afhankelijkheid', 'Angstigheid', 'Bedachtzaamheid', 'Bescheidenheid', 'Bezorgdheid', 'Creativiteit', 'Eerlijkheid', 'Esthetische waardering',
    'Expressiviteit', 'Flexibiliteit', 'Geduld', 'Hebzuchtvermijding', 'IJver', 'Levendigheid', 'Mildheid', 'Nieuwsgierigheid', 'Onconventionaliteit',
    'Oprechtheid', 'Ordelijkheid', 'Perfectionisme', 'Sentimentaliteit', 'Sociabiliteit', 'Sociale durf', 'Vergevingsgezindheid'];

  window.KMAOnderzoek = { parseKey: parseKey, fingerprint: fingerprint, checkKey: checkKey, makeKeyPair: makeKeyPair, seal: seal, unseal: unseal,
    lockPriv: lockPriv, unlockPriv: unlockPriv, newCode: newCode, pseudo: pseudo, maand: maand, meetmoment: meetmoment, check: check,
    CODE_RE: CODE_RE, V4: V4, TR: TR, MM: MM, FACETS: FACETS };
})();
