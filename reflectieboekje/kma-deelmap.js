/*
 * Gesloten deelsysteem via een gedeelde map ("deelmap"), zoals een gedeelde container maar tussen toestellen:
 * een map in OneDrive, SharePoint, een netwerkschijf enz. die de teamleider en de cadetten allemaal kiezen.
 *
 *   pelotons/<peloton>/teamsleutel.json                  openbare teamsleutel + per groep een controle met de groepscode
 *   pelotons/<peloton>/cadetten/<code>/dossier.json  het dossier van de cadet, alleen te openen met de teamsleutel
 *   pelotons/<peloton>/cadetten/<code>/feedback.json feedback van de teamleider, alleen te openen door die ene cadet
 *   (<code> = afgeleid van het Peoplesoft-nummer, sinds 4.30; oudere versies gebruiken het nummer zelf)
 *   pelotons/<peloton>/staf/<id>.json                      DTF-notities en feedback van teamleider en instructeurs
 *                                                          (alleen te openen met de stafsleutel; cadetten hebben die niet)
 *   pelotons/<peloton>/uitnodigingen/<id>.json             uitnodiging voor een instructeur (alleen te openen met de code)
 *   pelotons/<peloton>/cadetten/<code>/ontvangst.json  4.33: ontvangst en "gelezen" van de teamleider, alleen voor die cadet
 *   pelotons/<peloton>/ontvangst/<id>.json                4.33: ontvangst en "gezien" van de notities van instructeur <id> (stafsleutel)
 * Elke teamleider beheert zijn eigen peloton; meerdere pelotons kunnen in dezelfde SharePoint-map staan.
 * Zonder pelotonnaam (oudere versies) staat alles direct in de map.
 *
 * - De cadet versleutelt zijn dossier met de openbare teamsleutel (RSA-OAEP + AES-GCM): andere cadetten
 *   kunnen het niet lezen, ook al zitten ze in dezelfde map. De cadet controleert de teamsleutel met zijn
 *   groepscode, zodat niemand een eigen sleutel kan onderschuiven.
 * - Elke cadet maakt een eigen geheime sleutel en geeft die versleuteld mee in zijn dossier; de teamleider
 *   versleutelt zijn feedback daarmee. Zo kan alleen die cadet zijn feedback lezen.
 * - Wat de cadet deelt volgt de deel-schakelaars per hoofdstuk; het gaat automatisch (bij openen, elke minuut).
 * - De teamleider schrijft feedback automatisch; DTF-notities van teamleider en instructeurs alleen als de
 *   teamleider ze heeft gekozen om te delen.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var A = window.Android;
  var CVS = typeof cadets !== 'undefined' && /volgsysteem/i.test(location.pathname);
  var BOEK = !CVS && typeof steps !== 'undefined';
  if (!CVS && !BOEK) return;
  var subtle = window.crypto && crypto.subtle, enc = new TextEncoder(), dec = new TextDecoder();
  var st = function () { return window.kmaStore; };
  function getJ(k, d) { try { var v = JSON.parse(st().getItem(k)); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }
  function setJ(k, v) { try { st().setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var toast = function (m, k) { if (window.kmaToast) kmaToast(m, k); };
  function b64(buf) { var u = new Uint8Array(buf), s = '', CH = 0x8000; for (var i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); }
  function unb64(s) { var t = atob(s), u = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; }
  function norm(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function sha(t) { return subtle.digest('SHA-256', enc.encode(t)).then(function (h) { return b64(h); }); }
  function zip(text) {
    if (typeof CompressionStream === 'undefined') return Promise.resolve({ z: 0, bytes: enc.encode(text) });
    return new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer().then(function (b) { return { z: 1, bytes: new Uint8Array(b) }; });
  }
  function unzip(bytes, z) { return z ? new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text() : Promise.resolve(dec.decode(bytes)); }

  /* ---------------- The folder (native) ---------------- */
  var F = {
    native: function () { return !!(A && A.sharedIsSet); },
    ok: function () { try { return F.native() && A.sharedIsSet(); } catch (e) { return false; } },
    name: function () { try { return A.sharedName() || ''; } catch (e) { return ''; } },
    list: function (p) { try { return JSON.parse(A.sharedList(p || '') || '[]'); } catch (e) { return []; } },
    read: function (p) { try { var r = JSON.parse(A.sharedRead(p) || '{}'); return r.ok ? r.t : null; } catch (e) { return null; } },
    write: function (p, t) { try { return !!A.sharedWrite(p, t); } catch (e) { return false; } },
    remove: function (p) { try { return !!A.sharedRemove(p); } catch (e) { return false; } }
  };
  // Voor de automatische reservekopie (4.13.0): alleen de bestandsfuncties, geen sleutels.
  window.kmaDeelFS = { ok: F.ok, list: F.list, read: F.read, write: F.write, remove: F.remove };
  var picked = null;
  window.kmaSharedPicked = function (ok, name) { var f = picked; picked = null; if (f) f(!!ok, name || ''); };
  function pick(cb) { if (!F.native()) { alert('De deelmap werkt alleen in de app op je telefoon.'); return; } picked = cb; A.sharedPick(); }
  /* 4.30 (punt 1): de mapnaam van een cadet is niet meer zijn Peoplesoft-nummer maar een afgeleide code, zodat wie
     de map opent niet meteen ziet wiens dossier het is. Let op: het is geen geheim; met moeite is het nummer terug te
     rekenen. De inhoud blijft versleuteld zoals altijd. Oude mappen (nummer) worden nog gelezen en, voor cadetten die
     nog niet bijgewerkt zijn, ook nog beschreven; het boekje ruimt zijn eigen oude dossier.json op na de overstap. */
  function psClean(ps) { return String(ps).replace(/[^0-9A-Za-z]/g, ''); }
  function fnv(s, h) { for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function psHash(ps) { var s = 'kma-deelmap:' + psClean(ps); return 'c' + ('0000000' + fnv(s, 2166136261).toString(16)).slice(-8) + ('0000000' + fnv(s + ':2', 3735928559).toString(16)).slice(-8); }
  function psDir(ps) { return 'cadetten/' + psHash(ps); }
  function psDirOud(ps) { return 'cadetten/' + psClean(ps); }
  window.kmaDeelPsHash = psHash;
  /** Mapnaam van een peloton: letters, cijfers, spatie, - en _. */
  function slug(n) { return String(n || '').replace(/[^A-Za-z0-9 _-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40); }
  /* 4.31: een instructeur kiest soms niet de hoofdmap maar de map 'pelotons' of de map van het peloton zelf. Dan zoekt de app
     de uitnodiging daar ook, en onthoudt op welk niveau de gekozen map zit (kma-cvs-deel.niveau). */
  function niveau() { if (BOEK) return ''; try { var s = JSON.parse(window.kmaStore.getItem('kma-cvs-deel') || '{}'); return s && s.niveau || ''; } catch (e) { return ''; } }
  function pelBase(n) { var p = slug(n), nv = niveau(); if (nv === 'peloton') return ''; if (nv === 'pelotons') return p ? p + '/' : ''; return p ? 'pelotons/' + p + '/' : ''; }
  window.kmaPelotonSlug = slug;

  /* ---------------- Crypto ---------------- */
  var RSA = { name: 'RSA-OAEP', hash: 'SHA-256' };
  function sealTo(text, pubB64) {
    return Promise.all([subtle.importKey('spki', unb64(pubB64), RSA, false, ['encrypt']), subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']), zip(text)]).then(function (r) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      return Promise.all([subtle.exportKey('raw', r[1]), subtle.encrypt({ name: 'AES-GCM', iv: iv }, r[1], r[2].bytes)]).then(function (x) {
        return subtle.encrypt(RSA, r[0], x[0]).then(function (wk) { return JSON.stringify({ type: 'kma-sealed', v: 1, key: b64(wk), iv: b64(iv), z: r[2].z, data: b64(x[1]) }); });
      });
    });
  }
  function unseal(o, privJwk) {
    return subtle.importKey('jwk', privJwk, RSA, false, ['decrypt']).then(function (k) { return subtle.decrypt(RSA, k, unb64(o.key)); })
      .then(function (raw) { return subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']); })
      .then(function (k) { return subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, k, unb64(o.data)); })
      .then(function (pt) { return unzip(new Uint8Array(pt), o.z); });
  }
  function encK(text, kB64) {
    var iv = crypto.getRandomValues(new Uint8Array(12));
    return Promise.all([subtle.importKey('raw', unb64(kB64), 'AES-GCM', false, ['encrypt']), zip(text)]).then(function (r) {
      return subtle.encrypt({ name: 'AES-GCM', iv: iv }, r[0], r[1].bytes).then(function (ct) { return JSON.stringify({ type: 'kma-enc-cadet', v: 1, iv: b64(iv), z: r[1].z, data: b64(ct) }); });
    });
  }
  function decK(o, kB64) {
    return subtle.importKey('raw', unb64(kB64), 'AES-GCM', false, ['decrypt']).then(function (k) { return subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, k, unb64(o.data)); })
      .then(function (pt) { return unzip(new Uint8Array(pt), o.z); });
  }
  /** Proof that the team key belongs to a group code (only someone with the code can make it). */
  /* Versie 2: de sleutel voor het bewijs komt uit PBKDF2 (600.000 rondes), zodat iemand met toegang tot de map
     de groepscode niet snel kan raden. Het resultaat wordt per code onthouden (alleen in het geheugen). */
  var proofMemo = {};
  function teamProof2(code, pubB64) {
    var id = norm(code) + '|' + pubB64;
    if (proofMemo[id]) return proofMemo[id];
    proofMemo[id] = subtle.digest('SHA-256', enc.encode('kma-teamsleutel-zout:' + pubB64)).then(function (salt) {
      return subtle.importKey('raw', enc.encode(norm(code)), 'PBKDF2', false, ['deriveKey']).then(function (k) {
        return subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 600000, hash: 'SHA-256' }, k, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
      });
    }).then(function (k) { return subtle.sign('HMAC', k, enc.encode(pubB64)); }).then(function (sig) { return 'p2:' + b64(sig); });
    proofMemo[id].catch(function () { delete proofMemo[id]; });
    return proofMemo[id];
  }
  function teamProof(code, pubB64) {
    return subtle.digest('SHA-256', enc.encode('kma-teamsleutel:' + norm(code))).then(function (h) { return subtle.importKey('raw', h, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); })
      .then(function (k) { return subtle.sign('HMAC', k, enc.encode(pubB64)); }).then(b64);
  }

  var busy = false;
  function ago(iso) { if (!iso) return 'nog niet'; var m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return m < 1 ? 'zojuist' : m < 60 ? m + ' min geleden' : new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  function sheet(title, body, onClick) {
    var old = document.getElementById('kma-deel-ov'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'kma-deel-ov'; ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet" role="dialog" aria-modal="true" style="transform:none"><div class="kma-sheet-grip"></div><div class="kma-sheet-title">' + esc(title) + '</div><div class="kma-code-body">' + body + '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('[data-x="close"]')) { ov.remove(); return; } onClick(e, ov); });
    return ov;
  }
  function row(label, value, cls) { return '<div class="kma-deel-row' + (cls ? ' ' + cls : '') + '"><span>' + esc(label) + '</span><strong>' + value + '</strong></div>'; }

  /* 4.33 (punt 7): OneDrive en SharePoint maken een conflictkopie als twee toestellen tegelijk schrijven, bijvoorbeeld
     "dossier (1).json" of "dossier-LAPTOP-12.json". De app ruimt alleen kopieën op van bestanden die hij zelf schrijft. */
  function conflictVan(naam, origineel) {
    var b = String(origineel).replace(/\.json$/i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return naam !== origineel && new RegExp('^' + b + '( \\(\\d+\\)|-[A-Za-z0-9_]{2,30}(-[A-Za-z0-9_]{1,30})?)\\.json$', 'i').test(naam);
  }
  /** Verwijdert in map dir de conflictkopieën van de genoemde bestanden. Geeft het aantal terug. */
  function opruimen(dir, namen) {
    dir = String(dir || '').replace(/\/$/, ''); var n = 0;
    F.list(dir).forEach(function (f) { if (!f.dir && namen.some(function (o) { return conflictVan(f.name, o); }) && F.remove((dir ? dir + '/' : '') + f.name)) n++; });
    return n;
  }
  window.kmaDeelConflict = conflictVan;
  var TIP_BESCHIKBAAR = 'Tip: zet de gedeelde map in OneDrive op <b>Altijd behouden op dit apparaat</b> (in de OneDrive-app: ⋮ bij de map → Offline beschikbaar maken). Dan kan de app de bestanden ook lezen als je even geen bereik hebt.';
  /* 4.33 (punt 4): automatisch bijwerken; "Bijgewerkt: x min geleden" in het menu en de dialoog */
  function bijgewerkt(iso) { return iso ? 'bijgewerkt ' + ago(iso) : 'nog niet bijgewerkt'; }
  /* 4.33 (punt 1): Deelmap controleren. Toont alleen wat er mis is, met wat je kunt doen. Het foutrapport is anoniem:
     geen namen, Peoplesoft-nummers, mapnamen of inhoud; alleen codes en aantallen. */
  function rapportTekst(app, info, lijst) {
    var regels = ['KMA-apps foutrapport (anoniem: geen namen, nummers, mapnamen of inhoud)', 'App: ' + app + ' ' + (window.KMA_APPVERSIE || '?'),
      'Datum: ' + new Date().toISOString().slice(0, 16).replace('T', ' '), 'Toestel: ' + (F.native() ? 'app' : 'browser') + (/android/i.test(navigator.userAgent) ? ', Android' : /iphone|ipad/i.test(navigator.userAgent) ? ', iOS' : '')];
    Object.keys(info).forEach(function (k) { regels.push(k + ': ' + info[k]); });
    regels.push('Problemen: ' + (lijst.length ? lijst.map(function (x) { return x.c; }).join(', ') : 'geen'));
    return regels.join('\n');
  }
  function controleSheet(app, uitkomst, opnieuw) {
    var l = uitkomst.lijst, rap = rapportTekst(app, uitkomst.info, l);
    window.__kmaFoutrapport = rap;
    var body = (l.length ? '<ul class="kma-controle">' + l.map(function (x) { return '<li class="kma-controle-' + (x.ernst || 'fout') + '"><b>' + esc(x.t) + '</b><span>' + esc(x.d) + '</span></li>'; }).join('') + '</ul>'
      : '<p class="kma-controle-ok"><b>Geen problemen gevonden.</b> De deelmap werkt zoals het hoort.</p>') +
      (uitkomst.opgeruimd ? '<p class="muted small">Opgeruimd: ' + uitkomst.opgeruimd + ' conflictkopie' + (uitkomst.opgeruimd === 1 ? '' : 'ën') + ' van OneDrive of SharePoint (bijv. "dossier (1).json").</p>' : '') +
      '<p class="muted small">Lukt het niet? Stuur het foutrapport naar de ontwikkelaar (of plak het in een gesprek met Claude). Het rapport bevat geen namen, Peoplesoft-nummers, mapnamen of inhoud, alleen codes en aantallen.</p>' +
      '<details class="kma-controle-rap"><summary class="muted small">Wat staat er in het foutrapport?</summary><pre>' + esc(rap) + '</pre></details>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-c="again">Opnieuw controleren</button><button type="button" class="kma-icon-btn is-primary" data-c="rap">Foutrapport delen</button></div>';
    sheet('Deelmap controleren', body, function (e, ov) {
      if (e.target.closest('[data-c="again"]')) { ov.remove(); opnieuw(); return; }
      if (!e.target.closest('[data-c="rap"]')) return;
      try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(rap).catch(function () {}); } catch (x) {}
      if (window.kmaShareFile) kmaShareFile('KMA_Foutrapport_' + new Date().toISOString().slice(0, 10) + '.txt', rap);
      toast('Foutrapport gekopieerd en klaar om te delen');
    });
  }
  /** 4.33 (punt 4): bijwerken bij openen, terugkeren naar de app en weer online komen (niet vaker dan elke 20 seconden). */
  function autoBij() {
    var laatst = 0, go = function () { if (document.hidden || Date.now() - laatst < 20000) return; laatst = Date.now(); window.kmaDeelSync(false); };
    document.addEventListener('visibilitychange', go); window.addEventListener('focus', go); window.addEventListener('online', go); document.addEventListener('resume', go);
  }
  function oud(iso, uren) { return !iso || Date.now() - new Date(iso).getTime() > uren * 3600000; }

  /* =====================================================================================
     Reflectieboekje (cadet)
     ===================================================================================== */
  if (BOEK) {
    var KEY = 'kma-x-deel';
    var S = function () { return getJ(KEY, {}); };
    var save = function (s) { setJ(KEY, s); };
    var ps = function () { var a = typeof answers !== 'undefined' ? answers : {}; return String(a['Peoplesoft Nummer:'] || a['Peoplesoft ID:'] || '').replace(/\s/g, ''); };
    var myKey = function () { var s = S(); if (!s.k) { s.k = b64(crypto.getRandomValues(new Uint8Array(32))); save(s); } return s.k; };
    var cbase = function () { return S().base || ''; };
    /** Checks <base>teamsleutel.json against the group code. null = no key there. */
    var checkAt = function (base, code) {
      var t = F.read(base + 'teamsleutel.json'); if (!t) return Promise.resolve(null);
      var o; try { o = kmaLees(t); } catch (e) { return Promise.resolve({ bad: 1 }); }
      if (!o || !o.pub || !o.groups) return Promise.resolve({ bad: 1 });
      var v2 = Object.keys(o.groups).some(function (k) { return /^p2:/.test(o.groups[k]); });
      return Promise.all([teamProof(code, o.pub), v2 ? teamProof2(code, o.pub) : Promise.resolve('')]).then(function (pr) {
        var g = Object.keys(o.groups).find(function (k) { return o.groups[k] === pr[0] || (pr[1] && o.groups[k] === pr[1]); });
        return g ? { g: g, pub: o.pub, pel: o.peloton || '' } : { no: 1 };
      });
    };
    /** Finds the team key that belongs to the group code: first the known peloton, then the one from the QR code,
        then every peloton in the map, then the map itself (older versions). Returns the reason when none fits. */
    var verify = function () {
      var code = window.KMAX && KMAX.myCode();
      if (!code) return Promise.resolve('Vul eerst de groepscode van je teamleider in (⋮ → Versleuteld delen).');
      var s = S(), kp = window.KMAKoppel && KMAKoppel.info(), cand = [];
      var add = function (b) { if (b != null && cand.indexOf(b) < 0) cand.push(b); };
      if (typeof s.base === 'string') add(s.base);
      if (kp && kp.p) add(pelBase(kp.p));
      F.list('pelotons').forEach(function (d) { if (d.dir) add('pelotons/' + d.name + '/'); });
      add('');
      // 4.31: koos de cadet de map pelotons zelf, dan staan de pelotons direct in de gekozen map
      F.list('').forEach(function (d) { if (d.dir && !/^(pelotons|cadetten|kameraden|reservekopie|onderzoek|staf|uitnodigingen)$/.test(d.name)) add(d.name + '/'); });
      var found = 0, bad = 0;
      var tryAt = function (i) {
        if (i >= cand.length) return Promise.resolve(!found ? 'In deze map staat (nog) geen teamsleutel. Kies de map die je teamleider heeft ingesteld.' :
          bad === found ? 'De teamsleutel in deze map is beschadigd.' : 'Deze map hoort niet bij jouw groepscode. Vraag je teamleider om de juiste map of code.');
        return checkAt(cand[i], code).then(function (r) {
          if (!r) return tryAt(i + 1);
          found++;
          if (r.bad) { bad++; return tryAt(i + 1); }
          if (r.no) return tryAt(i + 1);
          var s2 = S();
          if ((s2.base || '') !== cand[i] || s2.pub !== r.pub) s2.lastUp = '';   // new place: share the dossier again
          s2.pub = r.pub; s2.group = r.g; s2.base = cand[i]; s2.peloton = r.pel; save(s2); return '';
        });
      };
      return tryAt(0);
    };
    var payload = function () {
      // The same content as "Via Quick Share" (the page's own variables).
      var name = (answers['Voornaam & Achternaam:'] || answers['Voornaam + Achternaam:'] || answers['Voornaam:'] || 'Cadet');
      var data = {
        answers: answers,
        persItemSet: window.KMA_PERS_SET || undefined,
        hexaco: typeof hexacoScores !== 'undefined' ? hexacoScores : {},
        hexacoSelf: typeof hexacoSelfAnswers !== 'undefined' ? hexacoSelfAnswers : {},
        hexacoObservers: typeof hexacoObservers !== 'undefined' ? hexacoObservers : [],
        timeline: typeof timelineItems !== 'undefined' ? timelineItems : [],
        name: name,
        cases5GT: typeof cases5GT !== 'undefined' ? cases5GT : [],
        casesKorthagen: typeof casesKorthagen !== 'undefined' ? casesKorthagen : [],
        dtf: typeof dtfItems !== 'undefined' ? dtfItems : [],
        jargon: typeof jargonItems !== 'undefined' ? jargonItems : [],
        fitness: typeof fitnessLogs !== 'undefined' ? fitnessLogs : [],
        profilePhoto: st().getItem('kma-profile-photo') || '',
        officialKMAForm: typeof kmaOfficialSelfForm !== 'undefined' ? kmaOfficialSelfForm : null
      };
      return window.kmaPrepareShare ? kmaPrepareShare(data) : data;
    };
    var up = function () {
      var s = S(), p = payload(); delete p.sharedAt;
      var body = JSON.stringify(p);
      // 4.30: staat het dossier nog niet in de nieuwe map (overstap), dan nu schrijven; staat het er al, dan de oude kopie weg
      var nieuwPad = cbase() + psDir(ps()) + '/dossier.json', oudPad = cbase() + psDirOud(ps()) + '/dossier.json', heeftNieuw = F.read(nieuwPad) != null;
      if (heeftNieuw && F.read(oudPad) != null) F.remove(oudPad);
      return sha(body).then(function (h) {
        if (h === s.lastUp && heeftNieuw) return false;
        p.sharedAt = new Date().toISOString(); p.deelKey = myKey(); p.groep = s.group || ''; p.peoplesoft = ps(); p.via = 'deelmap';
        return sealTo(JSON.stringify(p), s.pub).then(function (sealed) {
          if (!F.write(cbase() + psDir(ps()) + '/dossier.json', sealed)) throw new Error('schrijven');
          // 4.30: na de overstap het eigen oude dossier (map met nummer) weghalen; feedback daar blijft leesbaar
          if (F.read(oudPad) != null) F.remove(oudPad);
          opruimen(cbase() + psDir(ps()), ['dossier.json']);
          s = S(); s.lastUp = h; s.lastUpAt = p.sharedAt; save(s);
          if (window.kmaMarkShared) kmaMarkShared('de deelmap');
          return true;
        });
      });
    };
    /* 4.33 (punt 5): ontvangstbevestiging van de teamleider (alleen door deze cadet te openen) */
    var ontvangst = function () {
      var t = F.read(cbase() + psDir(ps()) + '/ontvangst.json'); if (!t) return Promise.resolve(false);
      var o; try { o = JSON.parse(t); } catch (e) { return Promise.resolve(false); }
      return decK(o, myKey()).then(function (txt) {
        var d = kmaLees(txt); if (!d || d.type !== 'kma-ontvangst') return false;
        var s = S(), nieuwGelezen = d.gelezen && (!s.ontv || s.ontv.gelezen !== d.gelezen) && d.dossier === s.lastUpAt;
        s.ontv = { dossier: d.dossier || '', gelezen: d.gelezen || '', at: d.at || '' }; save(s);
        if (nieuwGelezen) toast('Je dossier is gelezen door je teamleider');
        return true;
      }, function () { return false; });
    };
    var ontvangstTekst = function () {
      var s = S(), o = s.ontv || {};
      if (!s.lastUpAt) return '';
      if (o.dossier === s.lastUpAt && o.gelezen) return 'Gelezen door je teamleider (' + ago(o.gelezen) + ')';
      if (o.dossier === s.lastUpAt) return 'Ontvangen door je teamleider';
      // de cadet heeft sindsdien opnieuw gedeeld: zeg wat er wel binnen is
      if (o.dossier && o.dossier < s.lastUpAt) return (o.gelezen ? 'Gelezen' : 'Ontvangen') + ' door je teamleider (versie van ' + ago(o.dossier) + '); je laatste wijzigingen nog niet';
      return 'Verstuurd; nog niet opgehaald door je teamleider';
    };
    window.kmaDeelOntvangst = ontvangstTekst;
    var down = function () {
      var t = F.read(cbase() + psDir(ps()) + '/feedback.json') || F.read(cbase() + psDirOud(ps()) + '/feedback.json'); if (!t) return Promise.resolve(false);
      var o; try { o = kmaLees(t); } catch (e) { return Promise.resolve(false); }
      return decK(o, myKey()).then(function (txt) {
        var d = kmaLees(txt), s = S();
        if (!d || d.type !== 'kma-feedback' || d.date === s.lastFb) return false;
        if (window.kmaFeedback && kmaFeedback.accept(d, { quiet: true }) !== false) { s = S(); s.lastFb = d.date; save(s); return true; }
        return false;
      }, function () { return false; });
    };
    /** One round: check the team key, send the dossier when it changed, fetch new feedback. */
    window.kmaDeelSync = function (manual) {
      if (busy || !F.ok() || !S().on) return Promise.resolve(null);
      if (!ps()) { if (manual) toast('Vul eerst je Peoplesoft-nummer in (bij Profiel, hoofdstuk 0); daaruit maakt de app de (versleutelde) naam van jouw map.', 'error'); return Promise.resolve(null); }
      busy = true;
      return verify().then(function (err) {
        if (err) { var s = S(); s.err = err; save(s); if (manual) toast(err, 'error'); return null; }
        return up().then(function (sent) { return down().then(function (got) { return ontvangst().then(function () { return got; }); }).then(function (got) {
          var s = S(); s.err = ''; s.lastSync = new Date().toISOString(); save(s);
          if (manual) toast(sent || got ? (sent ? 'Je dossier is gedeeld' : '') + (sent && got ? ' · ' : '') + (got ? 'nieuwe feedback ontvangen' : '') : 'Alles is bijgewerkt');
          return { sent: sent, got: got };
        }); });
      }).catch(function () { var s = S(); s.err = 'De deelmap kon niet worden bijgewerkt. Is de map nog bereikbaar?'; save(s); if (manual) toast(s.err, 'error'); return null; })
        .then(function (r) { busy = false; return r; }, function () { busy = false; });
    };
  window.kmaDeelStatus = function () { var s = S(); return { on: !!s.on && F.ok(), name: F.name(), last: s.lastSync || '', bij: bijgewerkt(s.lastSync), err: s.err || '', group: s.group || '', peloton: s.peloton || '', ontvangst: ontvangstTekst() }; };
    /** 4.33 (punt 1): alle controles van de cadetkant; geeft {lijst, info, opgeruimd} */
    var controle = function () {
      var s = S(), l = [], info = {}, on = !!s.on && F.ok(), add = function (c, t, d, ernst) { l.push({ c: c, t: t, d: d, ernst: ernst }); };
      info.gekoppeld = on ? 'ja' : 'nee'; info.groepscode = window.KMAX && KMAX.myCode() ? 'ja' : 'nee'; info.peoplesoft = ps() ? 'ja' : 'nee';
      info.laatst = s.lastSync ? Math.round((Date.now() - new Date(s.lastSync).getTime()) / 60000) + ' min' : 'nooit';
      if (!F.native()) { add('B-geen-app', 'Alleen in de app', 'De deelmap werkt alleen in de app op je telefoon, niet in een browser.'); return Promise.resolve({ lijst: l, info: info, opgeruimd: 0 }); }
      if (info.groepscode === 'nee') add('B-geen-code', 'Geen groepscode', 'Koppel met je teamleider (⋮ → Koppelen met je teamleider) of vul de groepscode in (⋮ → Versleuteld delen).');
      if (!ps()) add('B-geen-ps', 'Geen Peoplesoft-nummer', 'Vul je Peoplesoft-nummer in bij Profiel (hoofdstuk 0). Daaruit maakt de app de naam van jouw map.');
      if (!on) { add('B-niet-gekoppeld', 'Deelmap niet gekoppeld', 'Tik in Deelmap op Map kiezen en kies de map die je teamleider heeft gedeeld.'); return Promise.resolve({ lijst: l, info: info, opgeruimd: 0 }); }
      if (!window.KMAX || !KMAX.myCode()) return Promise.resolve({ lijst: l, info: info, opgeruimd: 0 });
      return verify().then(function (err) {
        info.teamsleutel = err ? 'nee' : 'ja';
        if (err) { add('B-teamsleutel', 'Teamsleutel niet gevonden', err); return { lijst: l, info: info, opgeruimd: 0 }; }
        var n = ps() ? opruimen(cbase() + psDir(ps()), ['dossier.json']) : 0;
        info.conflictkopieen = n;
        if (ps() && F.read(cbase() + psDir(ps()) + '/dossier.json') == null) add('B-geen-dossier', 'Je dossier staat nog niet in de map', 'Wacht een minuut of open de app opnieuw. Blijft dit staan, kies dan in Deelmap opnieuw de map van je teamleider.');
        if (s.err) add('B-fout', 'Laatste keer bijwerken mislukt', s.err);
        if (oud(s.lastSync, 24)) add('B-oud', 'Lang niet bijgewerkt', 'De app werkt bij als je hem opent. Is de map bereikbaar? Zet de map in OneDrive op "Altijd behouden op dit apparaat".', 'let');
        var o = s.ontv || {}; info.ontvangen = o.dossier && o.dossier === s.lastUpAt ? 'ja' : 'nee';
        if (s.lastUpAt && o.dossier !== s.lastUpAt && oud(s.lastUpAt, 72)) add('B-niet-opgehaald', 'Je teamleider heeft je dossier nog niet opgehaald', 'Dat gebeurt vanzelf als je teamleider het CadetVolgSysteem opent. Duurt het langer dan een paar dagen, vraag dan of de deelmap bij hem werkt.', 'let');
        return { lijst: l, info: info, opgeruimd: n };
      });
    };
    window.kmaDeelControle = function () { return controle().then(function (u) { controleSheet('Reflectieboekje', u, window.kmaDeelControle); return u; }); };
    window.kmaDeelDialog = function () {
      var s = S(), on = !!s.on && F.ok();
      var kp = window.KMAKoppel && KMAKoppel.info();
      var body = '<p class="muted">Een gedeelde map die je teamleider heeft ingesteld (bijv. in OneDrive of SharePoint). De hoofdstukken die je deelt gaan automatisch en versleuteld naar je eigen map daarin; feedback van je teamleider komt vanzelf binnen. Andere cadetten kunnen jouw gegevens niet lezen.</p>' +
        (kp && kp.m && !on ? '<p class="kma-koppel-hint">Je teamleider: de deelmap staat in <b>' + esc(kp.m) + '</b></p>' : '') +
        row('Map', on ? esc(F.name()) : 'niet gekoppeld') + (on && s.peloton ? row('Peloton', esc(s.peloton)) : '') + (on ? row('Groep', esc(s.group || '-')) + row('Bijgewerkt', esc(ago(s.lastSync)) + ' · automatisch') + (ontvangstTekst() ? row('Je dossier', esc(ontvangstTekst()), /Gelezen|Ontvangen/.test(ontvangstTekst()) ? 'ok' : '') : '') : '') +
        (s.err && on ? '<p class="kma-code-err">' + esc(s.err) + '</p>' : '') + (!on ? '<p class="muted small kma-deel-tip">' + TIP_BESCHIKBAAR + '</p>' : '') +
        (!window.KMAX || !KMAX.myCode() ? '<p class="kma-code-err">Koppel eerst met je teamleider (⋮ → Koppelen met je teamleider) of vul de groepscode in.</p>' : '') +
        '<div class="kma-row-btns">' + (on ? '<button type="button" class="kma-icon-btn" data-d="off">Ontkoppelen</button><button type="button" class="kma-icon-btn is-primary" data-d="check">Deelmap controleren</button>' :
          '<button type="button" class="kma-icon-btn" data-x="close">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-d="pick">Map kiezen</button>') + '</div>' +
        (on ? '<div class="kma-row-btns kma-deel-btns"><button type="button" class="kma-chip-btn" data-d="sync">Nu bijwerken</button></div>' : '<div class="kma-row-btns kma-deel-btns"><button type="button" class="kma-chip-btn" data-d="check">Deelmap controleren</button></div>');
      sheet('Deelmap', body, function (e, ov) {
        if (e.target.closest('[data-d="pick"]')) {
          if (!window.KMAX || !KMAX.myCode()) { toast('Vul eerst de groepscode in', 'error'); return; }
          ov.remove();
          pick(function (ok) {
            if (!ok) return;
            verify().then(function (err) {
              if (err) { alert(err); return; }
              var s2 = S(); s2.on = true; s2.lastUp = ''; save(s2); toast('Deelmap gekoppeld. Tip: zet de map in OneDrive op "Altijd behouden op dit apparaat".'); window.kmaDeelSync(true);
            });
          });
        } else if (e.target.closest('[data-d="sync"]')) { ov.remove(); window.kmaDeelSync(true); }
        else if (e.target.closest('[data-d="check"]')) { ov.remove(); window.kmaDeelControle(); }
        else if (e.target.closest('[data-d="off"]')) {
          kmaConfirm('Deelmap ontkoppelen? Je dossier wordt dan niet meer automatisch gedeeld.', { ok: 'Ontkoppelen', danger: true }).then(function (ok) { if (!ok) return;
          var s3 = S(); s3.on = false; save(s3); try { A.sharedClear(); } catch (x) {} ov.remove(); toast('Deelmap ontkoppeld');
        });
}
      });
    };
    setTimeout(function () { window.kmaDeelSync(false); }, 2500);
    setInterval(function () { if (!document.hidden) window.kmaDeelSync(false); }, 60000);
    autoBij();
    return;
  }

  /* =====================================================================================
     CadetVolgSysteem
     ===================================================================================== */
  var CK = 'kma-cvs-deel', TK = 'kma-cvs-teamkey', PK = 'kma-cvs-peloton', SK = 'kma-cvs-staff', MK = 'kma-cvs-staffme';
  var S2 = function () { return getJ(CK, { written: {} }); };
  var save2 = function (s) { setJ(CK, s); };
  var team = function () { return getJ(TK, null); };
  var role = function () { return window.kmaRole ? kmaRole() : 'teamleider'; };
  var me = function () { return window.kmaMe ? kmaMe() : ''; };
  // 4.32.1: Peoplesoft-nummer altijd zonder spaties vergelijken (de cadet typt soms "123 4567"); anders vielen DTF-notities van instructeurs weg
  var normPs = function (x) { return String(x == null ? '' : x).replace(/\s/g, ''); };
  var cps = function (c) { return normPs((c && c.deelPs) || (typeof cvsPeoplesoft === 'function' && cvsPeoplesoft((c.data || {}).answers)) || ''); };
  var nmKey = function (n) { return String(n || '').trim().toLowerCase().replace(/\s+/g, ' '); };
  function hex(n) { return Array.prototype.map.call(crypto.getRandomValues(new Uint8Array(n)), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); }

  /* ---------------- Peloton ---------------- */
  function peloton() { var p = getJ(PK, null); return p && p.name ? String(p.name) : ''; }
  function base() { return pelBase(peloton()); }
  window.kmaPeloton = peloton;
  /** Sets the peloton name. The peloton gets its own folder in the deelmap; cadets and instructors find it themselves. */
  window.kmaSetPeloton = function (name) {
    var n = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!slug(n)) return false;
    var oldBase = base(), t = team();
    if (n === peloton()) return true;
    if (t && F.ok() && S2().on && role() === 'teamleider') {
      var other = F.read(pelBase(n) + 'teamsleutel.json');
      try { if (other && JSON.parse(other).pub !== t.pub) { toast('Het peloton "' + n + '" heeft in deze map al een andere teamleider. Kies een andere naam.', 'error'); return false; } } catch (e) {}
    }
    setJ(PK, { name: n, at: new Date().toISOString() });
    if (t && F.ok() && S2().on && role() === 'teamleider') {
      // the old place is cleared: cadets and instructors look for the team key again and find the new folder
      try { var cur = F.read(oldBase + 'teamsleutel.json'); if (cur && JSON.parse(cur).pub === t.pub) F.remove(oldBase + 'teamsleutel.json'); } catch (e) {}
      var s = S2(); s.written = {}; s.staffHash = ''; s.staffSeen = {}; save2(s);
      setTimeout(function () { window.kmaDeelSync(false); }, 50);
    }
    return true;
  };
  /** An instructor follows the team key when the teamleider renamed the peloton, or when he chose another level of the
      folder later (4.31: hoofdmap, de map pelotons of de map van het peloton). Returns {pel, nv} or null. */
  function findMyPeloton() {
    var t = team(); if (!t) return null;
    var hit = null, kijk = function (pad, naam, nv) {
      if (hit) return;
      try { var o = JSON.parse(F.read(pad + 'teamsleutel.json') || 'null'); if (o && o.pub === t.pub) hit = { pel: o.peloton || naam, nv: nv }; } catch (e) { /* geen sleutel */ }
    };
    F.list('pelotons').forEach(function (d) { if (d.dir) kijk('pelotons/' + d.name + '/', d.name, ''); });
    F.list('').forEach(function (d) { if (d.dir && d.name !== 'pelotons') kijk(d.name + '/', d.name, 'pelotons'); });
    if (!hit) kijk('', peloton(), 'peloton');
    return hit;
  }

  /* ---------------- Team key, staff key ---------------- */
  function makeTeamKey() {
    return subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 3072, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']).then(function (kp) {
      return Promise.all([subtle.exportKey('spki', kp.publicKey), subtle.exportKey('jwk', kp.privateKey)]).then(function (x) {
        var t = { pub: b64(x[0]), priv: x[1], sk: b64(crypto.getRandomValues(new Uint8Array(32))), at: new Date().toISOString(), by: me() };
        setJ(TK, t); return t;
      });
    });
  }
  /** The staff key (only teamleider and instructors have it) protects their notes and feedback in the folder. */
  function staffKey() {
    var t = team(); if (!t) return '';
    if (!t.sk && role() === 'teamleider') { t.sk = b64(crypto.getRandomValues(new Uint8Array(32))); setJ(TK, t); }
    return t.sk || '';
  }
  function myId() {
    var m = getJ(MK, null);
    if (!m || !m.id) { m = { id: 'tl' + hex(5) }; setJ(MK, m); }
    return m.id;
  }

  /** Teamleider: write teamsleutel.json with a proof per group code. */
  function publish() {
    var t = team(); if (!t || role() !== 'teamleider' || !window.KMAX) return Promise.resolve(false);
    var groups = ['ALFA', 'BRAVO', 'CHARLIE', 'DELTA'];
    cadets.forEach(function (c) { if (c.group && groups.indexOf(c.group) < 0) groups.push(c.group); });
    var withCode = groups.filter(function (g) { return KMAX.codeForGroup(g); });
    return Promise.all(withCode.map(function (g) { return teamProof2(KMAX.codeForGroup(g), t.pub); })).then(function (proofs) {
      var o = { type: 'kma-teamsleutel', v: 2, pub: t.pub, groups: {}, by: t.by || '', at: t.at };
      if (peloton()) o.peloton = peloton();
      withCode.forEach(function (g, i) { o.groups[g] = proofs[i]; });
      var txt = JSON.stringify(o), cur = F.read(base() + 'teamsleutel.json');
      if (cur === txt) return true;
      return F.write(base() + 'teamsleutel.json', txt);
    });
  }
  function silent(f) { var a = window.alert; window.alert = function () {}; try { return f(); } finally { window.alert = a; } }
  /** Read every cadet folder of the peloton. */
  function pull() {
    var t = team(); if (!t) return Promise.resolve({ n: 0, added: 0, warn: 0 });
    var dirs = F.list(base() + 'cadetten').filter(function (d) { return d.dir; }), res = { n: 0, added: 0, warn: 0 };
    return dirs.reduce(function (pr, d) {
      return pr.then(function () {
        var txt = F.read(base() + 'cadetten/' + d.name + '/dossier.json'); if (!txt) return;
        var o; try { o = JSON.parse(txt); } catch (e) { return; }
        if (!o || o.type !== 'kma-sealed') return;
        return unseal(o, t.priv).then(function (plain) {
          var data = kmaLees(plain), key = data.deelKey; delete data.deelKey;
          var ps = String(data.peoplesoft || d.name);
          if (psClean(ps) !== d.name && psHash(ps) !== d.name) { res.warn++; return; }   // a dossier in someone else's folder
          var c = cadets.find(function (x) { return cps(x) && String(cps(x)) === ps; });
          if (!c) {
            var nm = data.name || (typeof cvsName === 'function' && cvsName(data.answers)) || 'Cadet ' + ps;
            c = { id: Date.now() + Math.floor(Math.random() * 100000), name: nm, group: data.groep || 'ALFA', importDate: new Date().toLocaleDateString('nl-NL'),
              addedAt: new Date().toISOString(), data: data, feedback: {}, deelPs: ps, deelKey: key, receivedAt: new Date().toISOString() };
            cadets.push(c); res.added++; res.n++; return;
          }
          if (c.deelKey && key && c.deelKey !== key) { c.deelWarn = 'Het dossier in de deelmap is met een andere cadetsleutel gemaakt dan eerder. Het is niet ingelezen; controleer bij de cadet of hij de app opnieuw heeft geïnstalleerd.'; res.warn++; return; }
          c.deelPs = ps; if (key) c.deelKey = key; delete c.deelWarn;
          if (String(data.sharedAt || '') > String((c.data || {}).sharedAt || '')) { silent(function () { updateCadetWithData(c.id, c.name, data); }); res.n++; }
        }, function () { res.warn++; });
      });
    }, Promise.resolve()).then(function () { return res; });
  }
  /** Teamleider: feedback to every cadet whose folder is known (only that cadet can read it). */
  function push() {
    if (role() !== 'teamleider' || !window.kmaBuildFeedback) return Promise.resolve(0);
    var s = S2(), n = 0;
    return cadets.filter(function (c) { return c.deelKey && cps(c); }).reduce(function (pr, c) {
      return pr.then(function () {
        var p = kmaBuildFeedback(c), cmp = Object.assign({}, p); delete cmp.date;
        return sha(JSON.stringify(cmp)).then(function (h) {
          if ((s.written || {})[cps(c)] === h) return;
          p.date = new Date().toISOString();
          return encK(JSON.stringify(p), c.deelKey).then(function (txt) {
            if (F.write(base() + psDir(cps(c)) + '/feedback.json', txt)) {
              // 4.30: cadet nog op een oudere versie (map met nummer)? Dan daar ook, zodat hij zijn feedback krijgt
              if (F.list(base() + 'cadetten').some(function (x) { return x.dir && x.name === psClean(cps(c)); })) F.write(base() + psDirOud(cps(c)) + '/feedback.json', txt);
              s.written = s.written || {}; s.written[cps(c)] = h; c.feedbackSentAt = p.date; n++;
            }
          });
        });
      });
    }, Promise.resolve()).then(function () { save2(s); return ontvangstNaarCadetten().then(function () { return n; }); });
  }
  /* 4.33 (punt 5): ontvangstbevestiging naar de cadet: welk dossier de teamleider heeft binnengehaald en of hij het heeft
     geopend. In een eigen bestand (ontvangst.json), versleuteld met de sleutel van die ene cadet. */
  function ontvangstNaarCadetten() {
    if (role() !== 'teamleider') return Promise.resolve(0);
    var s = S2(); s.ontvC = s.ontvC || {}; var n = 0;
    return cadets.filter(function (c) { return c.deelKey && cps(c) && c.data && c.data.sharedAt; }).reduce(function (pr, c) {
      return pr.then(function () {
        var o = { type: 'kma-ontvangst', v: 1, dossier: String(c.data.sharedAt), gelezen: c.deelGelezenVoor === String(c.data.sharedAt) ? c.deelGelezen || '' : '' };
        var key = o.dossier + '|' + o.gelezen; if (s.ontvC[cps(c)] === key) return;
        o.at = new Date().toISOString();
        return encK(JSON.stringify(o), c.deelKey).then(function (txt) { if (F.write(base() + psDir(cps(c)) + '/ontvangst.json', txt)) { s.ontvC[cps(c)] = key; n++; } });
      });
    }, Promise.resolve()).then(function () { var s2 = S2(); s2.ontvC = s.ontvC; save2(s2); return n; });
  }

  /* ---------------- Notes and feedback of teamleider and instructors ---------------- */
  function staffList() { var x = getJ(SK, null); return x && Array.isArray(x.list) ? x.list : []; }
  function saveStaff(l) { setJ(SK, { list: l }); }
  /** Everyone (teamleider and instructors) writes his own DTF notes and feedback to staf/<id>.json. */
  function pushStaff() {
    var sk = staffKey(); if (!sk || !window.kmaColleaguePackage) return Promise.resolve(false);
    var list = cadets.filter(function (c) { return cps(c); });
    var p = kmaColleaguePackage(list, { notes: true, feedback: true, plans: true });
    p.staffId = myId(); p.peloton = peloton();
    var cmp = Object.assign({}, p); delete cmp.at;
    return sha(JSON.stringify(cmp)).then(function (h) {
      if (S2().staffHash === h) return false;
      return encK(JSON.stringify(p), sk).then(function (txt) {
        if (!F.write(base() + 'staf/' + myId() + '.json', txt)) { if (role() !== 'teamleider') toast('Je notities konden niet in de deelmap worden gezet. Controleer de deelmap (⋮ → Deelmap).', 'error'); return false; }
        opruimen(base() + 'staf', [myId() + '.json']);
        var s = S2(); s.staffHash = h; s.staffAt = p.at || new Date().toISOString(); save2(s); return true;
      });
    });
  }
  function dtfSleutels() { var k = {}; cadets.forEach(function (c) { ((c.data && c.data.dtf) || []).forEach(function (n) { k[c.id + ':' + n.id] = 1; }); }); return k; }
  function nieuwBij(voor, wieBestand) {
    var s3 = S2(), nw = s3.nieuw || {}, at = new Date().toISOString(), veranderd = false;
    cadets.forEach(function (c) { ((c.data && c.data.dtf) || []).forEach(function (n) {
      if (voor[c.id + ':' + n.id] || n.author === 'cadet' || n.author === 'teamleider') return;
      var wie = n.by || wieBestand, k = 'w:' + wie; nw[k] = { wie: wie, n: ((nw[k] || {}).n || 0) + 1, at: at }; veranderd = true;
    }); });
    if (veranderd) { s3.nieuw = nw; save2(s3); }
  }
  /** Staat de teamsleutel van mijn team op de plek waar de app hem verwacht? */
  function eigenSleutel() { try { var o = JSON.parse(F.read(base() + 'teamsleutel.json') || 'null'), t = team(); return !!(o && t && o.pub === t.pub); } catch (e) { return false; } }
  /** Reads the files of colleagues. The teamleider only accepts instructors he added himself. */
  function pullStaff() {
    var sk = staffKey(); if (!sk || !window.kmaImportColleague) return Promise.resolve(0);
    var files = F.list(base() + 'staf').filter(function (f) { return !f.dir && /\.json$/.test(f.name); });
    var seen = S2().staffSeen || {}, fout = S2().staffFout || {}, n = 0, tl = role() === 'teamleider', staff = staffList();
    return files.reduce(function (pr, f) {
      return pr.then(function () {
        var id = f.name.replace(/\.json$/, '');
        if (id === myId()) return;
        var who = staff.find(function (x) { return x.id === id; });
        if (tl && !who) return;   // not (or no longer) in the team
        var txt = F.read(base() + 'staf/' + f.name); if (!txt) return;
        return sha(txt).then(function (h) {
          if (seen[id] === h) return;
          var o; try { o = JSON.parse(txt); } catch (e) { return; }
          if (!o || o.type !== 'kma-enc-cadet') return;
          return decK(o, sk).then(function (plain) {
            var d = kmaLees(plain);
            if (!d || d.type !== 'kma-cvs-share' || (d.staffId && d.staffId !== id)) return;
            if (who) {
              d.from = Object.assign({}, d.from || {}, { name: (who.rank ? who.rank + ' ' : '') + who.name, role: who.role }); who.seen = d.at || new Date().toISOString();
              if (who.role === 'junior') (d.cadets || []).forEach(function (e) { delete e.feedback; delete e.reflFeedback; delete e.plans; });   // a junior only logs DTF notes
              else (d.cadets || []).forEach(function (e) { delete e.plans; });
            }
            // only cadets of this peloton that are already known here; no empty dossiers
            d.cadets = (d.cadets || []).filter(function (e) { var q = e && normPs(e.peoplesoft); return e && cadets.some(function (c) { return q ? cps(c) === q : nmKey(c.name) === nmKey(e.name) && !!e.name; }); })
              .map(function (e) { var x = Object.assign({}, e); delete x.data; return x; });
            if (d.cadets.length) {
              var tq = window.kmaToast; window.kmaToast = function () {};
              var voor = tl ? dtfSleutels() : null;
              try { kmaImportColleague(d); } finally { window.kmaToast = tq; }
              // 4.31 (punt 3): nieuwe DTF-notities van instructeurs bewaren tot de teamleider ze heeft gezien (per schrijver)
              if (voor) nieuwBij(voor, d.from && d.from.name || 'Instructeur');
            }
            seen[id] = h; n++; if (fout[id]) delete fout[id];
            if (tl && who) { var so = S2(); so.ontv = so.ontv || {}; so.ontv[id] = d.at || new Date().toISOString(); save2(so); }
          }, function () { fout[id] = new Date().toISOString(); });   // 4.32.1: niet te openen (andere teamsleutel): laten zien bij Peloton en team
        });
      });
    }, Promise.resolve()).then(function () {
      var s = S2(); s.staffSeen = seen; s.staffFout = fout; save2(s);
      if (tl) saveStaff(staff);
      return n;
    });
  }

  /* 4.33 (punt 5): de teamleider schrijft per instructeur een ontvangstbevestiging (ontvangst/<id>.json, met de stafsleutel):
     wanneer hij diens laatste notities binnenhaalde en wanneer hij op Gezien tikte. */
  function ontvangstNaarStaf() {
    if (role() !== 'teamleider') return Promise.resolve(0);
    var sk = staffKey(); if (!sk) return Promise.resolve(0);
    var s = S2(), ontv = s.ontv || {}, h = s.ontvH || {}, n = 0;
    return staffList().reduce(function (pr, x) {
      return pr.then(function () {
        if (!ontv[x.id]) return;
        var o = { type: 'kma-ontvangst', v: 1, ontvangen: ontv[x.id], gezien: s.gezienAt && (s.ontvAt || {})[x.id] === ontv[x.id] ? s.gezienAt : '' };
        var key = o.ontvangen + '|' + o.gezien; if (h[x.id] === key) return;
        return encK(JSON.stringify(o), sk).then(function (txt) { if (F.write(base() + 'ontvangst/' + x.id + '.json', txt)) { h[x.id] = key; n++; } });
      });
    }, Promise.resolve()).then(function () { var s2 = S2(); s2.ontvH = h; save2(s2); return n; });
  }
  /** Instructeur: leest zijn eigen ontvangstbevestiging. */
  function ontvangstLezen() {
    if (role() === 'teamleider') return Promise.resolve(false);
    var sk = staffKey(), t = sk && F.read(base() + 'ontvangst/' + myId() + '.json'); if (!t) return Promise.resolve(false);
    var o; try { o = JSON.parse(t); } catch (e) { return Promise.resolve(false); }
    return decK(o, sk).then(function (txt) {
      var d = kmaLees(txt); if (!d || d.type !== 'kma-ontvangst') return false;
      var s = S2(), was = s.bev || {}; s.bev = { ontvangen: d.ontvangen || '', gezien: d.gezien || '' }; save2(s);
      if (d.gezien && d.gezien !== was.gezien && d.ontvangen === s.staffAt) toast('Je notities zijn gelezen door je teamleider');
      return true;
    }, function () { return false; });
  }
  function stafOntvangstTekst() {
    var s = S2(), b = s.bev || {};
    if (role() === 'teamleider' || !s.staffAt) return '';
    if (b.ontvangen === s.staffAt && b.gezien) return 'Gelezen door je teamleider (' + ago(b.gezien) + ')';
    if (b.ontvangen === s.staffAt) return 'Ontvangen door je teamleider';
    if (b.ontvangen && b.ontvangen < s.staffAt) return (b.gezien ? 'Gelezen' : 'Ontvangen') + ' door je teamleider (eerdere notities); je laatste nog niet';
    return 'Verstuurd; nog niet opgehaald door je teamleider';
  }
  window.kmaStafOntvangst = stafOntvangstTekst;
  window.kmaDeelSync = function (manual) {
    if (busy || !F.ok() || !S2().on) return Promise.resolve(null);
    if (!team()) { if (manual) toast(role() === 'teamleider' ? 'Maak eerst de teamsleutel (Deelmap)' : 'Gebruik eerst de uitnodiging van je teamleider (⋮ → Peloton en team)', 'error'); return Promise.resolve(null); }
    if (role() === 'teamleider' && !peloton()) { if (manual) toast('Vul eerst de naam van je peloton in (⋮ → Peloton en team)', 'error'); }
    if (role() !== 'teamleider' && !eigenSleutel()) {
      var p = findMyPeloton();
      if (p) { var s0 = S2(); if ((s0.niveau || '') !== p.nv) { s0.niveau = p.nv; s0.staffSeen = {}; save2(s0); } if (p.pel && p.pel !== peloton()) setJ(PK, { name: p.pel, at: new Date().toISOString() }); }
      else {   // 4.31: het peloton staat niet (meer) in de gekozen map, bijv. na hernoemen terwijl de map van het peloton zelf gekozen is
        var s1 = S2(); s1.err = 'In de map "' + F.name() + '" staat je peloton niet (meer). Tik in Deelmap op Ontkoppelen en kies de hoofdmap van je teamleider opnieuw (de map waarin "pelotons" staat).'; save2(s1);
        if (manual) toast(s1.err, 'error');
        return Promise.resolve(null);
      }
    }
    busy = true;
    return publish().then(pull).then(function (r) {
      return pullStaff().then(function (st) {
        return push().then(function (w) {
          return pushStaff().then(function (sw) { return ontvangstNaarStaf().then(ontvangstLezen).then(function () { return sw; }); }).then(function (sw) {
            var s = S2(); s.lastSync = new Date().toISOString(); s.err = ''; save2(s);
            if (oud(s.opruimAt, 1)) { try { cvsOpruimen(); } catch (e) { /* map niet bereikbaar */ } }
            if (r.n || r.added || w || st) { saveCVS(); try { renderCadets(); } catch (e) {} }
            if (manual || r.added || r.n || st) toast('Deelmap: ' + r.n + ' dossier' + (r.n === 1 ? '' : 's') + ' bijgewerkt' + (r.added ? ' (' + r.added + ' nieuw)' : '') +
              (st ? ' · bijdragen van ' + st + ' collega' + (st === 1 ? '' : "'s") : '') +
              (role() === 'teamleider' ? ' · feedback naar ' + w + ' cadet' + (w === 1 ? '' : 'ten') : '') + (r.warn ? ' · ' + r.warn + ' niet ingelezen' : ''));
            if (sw && role() !== 'teamleider' && !manual) toast('Verstuurd naar je teamleider');
            return { pulled: r, wrote: w, staff: st, sent: !!sw };
          });
        });
      });
    }).catch(function () { var s = S2(); s.err = 'De deelmap kon niet worden bijgewerkt.'; save2(s); if (manual) toast(s.err, 'error'); return null; })
      .then(function (x) { busy = false; return x; }, function () { busy = false; });
  };
  /** 4.33 (punt 7): conflictkopieën van de eigen bestanden weghalen (teamleider: teamsleutel, feedback, ontvangst; iedereen: eigen stafbestand). */
  function cvsOpruimen() {
    var n = opruimen(base() + 'staf', [myId() + '.json']);
    if (role() === 'teamleider') {
      n += opruimen(base(), ['teamsleutel.json']);
      F.list(base() + 'cadetten').forEach(function (d) { if (d.dir) n += opruimen(base() + 'cadetten/' + d.name, ['feedback.json', 'ontvangst.json']); });
      n += opruimen(base() + 'ontvangst', staffList().map(function (x) { return x.id + '.json'; }));
    }
    var s = S2(); s.opruimAt = new Date().toISOString(); s.opgeruimd = (s.opgeruimd || 0) + n; save2(s);
    return n;
  }
  /** 4.33 (punt 1): alle controles van het CadetVolgSysteem; geeft {lijst, info, opgeruimd} */
  function cvsControle() {
    var s = S2(), l = [], info = {}, on = !!s.on && F.ok(), tl = role() === 'teamleider', t = team(), add = function (c, tx, d, ernst) { l.push({ c: c, t: tx, d: d, ernst: ernst }); };
    info.rol = role(); info.gekoppeld = on ? 'ja' : 'nee'; info.teamsleutel = t ? 'ja' : 'nee'; info.peloton = peloton() ? 'ja' : 'nee'; info.niveau = niveau() || 'hoofdmap';
    info.cadetten = cadets.length; info.laatst = s.lastSync ? Math.round((Date.now() - new Date(s.lastSync).getTime()) / 60000) + ' min' : 'nooit';
    if (!F.native()) { add('C-geen-app', 'Alleen in de app', 'De deelmap werkt alleen in de app op je telefoon, niet in een browser.'); return { lijst: l, info: info, opgeruimd: 0 }; }
    if (tl && !peloton()) add('C-geen-peloton', 'Geen pelotonnaam', 'Vul de naam van je peloton in (⋮ → Peloton en team).');
    if (!on) { add('C-niet-gekoppeld', 'Deelmap niet gekoppeld', tl ? 'Tik in Deelmap op Map kiezen en kies de gedeelde map (bijv. in SharePoint).' : 'Kies bij ⋮ → Peloton en team → Uitnodiging gebruiken de map van je teamleider.'); return { lijst: l, info: info, opgeruimd: 0 }; }
    if (!t) { add('C-geen-teamsleutel', tl ? 'Nog geen teamsleutel' : 'Nog niet uitgenodigd', tl ? 'Tik in Deelmap op Map kiezen; de app maakt dan de teamsleutel.' : 'Vraag je teamleider om een uitnodigingscode en gebruik die bij ⋮ → Peloton en team.'); return { lijst: l, info: info, opgeruimd: 0 }; }
    var codes = window.KMAX ? ['ALFA', 'BRAVO', 'CHARLIE', 'DELTA'].filter(function (g) { return KMAX.codeForGroup(g); }) : [];
    if (tl) { info.groepscodes = codes.length; if (!codes.length) add('C-geen-codes', 'Geen groepscodes', 'Maak een groepscode per groep (⋮ → Groepscodes) en geef die aan je cadetten. Zonder code kunnen zij de teamsleutel niet vinden.'); }
    var eig = eigenSleutel(); info.sleutelInMap = eig ? 'ja' : 'nee';
    if (!eig) {
      if (tl) add('C-sleutel-weg', 'Teamsleutel staat niet in de map', 'Wacht een minuut (OneDrive of SharePoint synchroniseert nog) of tik op Nu bijwerken. Blijft dit staan, kies dan de map opnieuw.');
      else if (!findMyPeloton()) add('C-peloton-weg', 'Je peloton staat niet in deze map', 'Ontkoppel in Deelmap en kies de hoofdmap van je teamleider (de map waarin "pelotons" staat).');
    }
    var fout = Object.keys(s.staffFout || {}).length; info.stafNietTeOpenen = fout;
    if (fout) add('C-staf-fout', fout + (fout === 1 ? ' bestand van een collega' : " bestanden van collega's") + ' niet te openen', tl ? 'Tik bij Peloton en team bij die instructeur op Nieuwe code en laat hem de nieuwe code gebruiken.' : 'Gebruik een nieuwe uitnodiging van je teamleider.');
    var warn = cadets.filter(function (c) { return c.deelWarn; }).length; info.dossierWaarschuwing = warn;
    if (warn) add('C-dossier-warn', warn + ' dossier' + (warn === 1 ? '' : 's') + ' niet ingelezen', 'Open het dossier: daar staat wat er aan de hand is (meestal heeft de cadet de app opnieuw geïnstalleerd).');
    if (s.err) add('C-fout', 'Laatste keer bijwerken mislukt', s.err);
    if (oud(s.lastSync, 24)) add('C-oud', 'Lang niet bijgewerkt', 'De app werkt bij als je hem opent. Is de map bereikbaar? Zet de map in OneDrive op "Altijd behouden op dit apparaat".', 'let');
    if (tl) { var nooit = staffList().filter(function (x) { return !x.seen && oud(x.at, 72); }).length; info.instructeursNietActief = nooit; if (nooit) add('C-staf-stil', nooit + ' instructeur' + (nooit === 1 ? '' : 's') + ' nog niet actief', 'Een uitnodiging werkt pas als de instructeur dezelfde map kiest en de code invult. Maak zo nodig een nieuwe code (Peloton en team).', 'let'); }
    else { var b = s.bev || {}; info.ontvangen = s.staffAt && b.ontvangen === s.staffAt ? 'ja' : 'nee'; if (s.staffAt && b.ontvangen !== s.staffAt && oud(s.staffAt, 72)) add('C-niet-opgehaald', 'Je teamleider heeft je notities nog niet opgehaald', 'Dat gebeurt vanzelf als je teamleider het CadetVolgSysteem opent. Duurt het langer, vraag dan of jij nog in zijn lijst met instructeurs staat.', 'let'); }
    var n = cvsOpruimen(); info.conflictkopieen = n;
    return { lijst: l, info: info, opgeruimd: n };
  }
  window.kmaDeelControle = function () { var u = cvsControle(); controleSheet('CadetVolgSysteem', u, window.kmaDeelControle); return Promise.resolve(u); };
  /** Removes a cadet's folder (bewaartermijn, or the dossier was deleted by the teamleider). */
  window.kmaDeelRemove = function (c) { var p = cps(c); if (p && F.ok() && S2().on && role() === 'teamleider') { F.remove(base() + psDir(p)); F.remove(base() + psDirOud(p)); } };
  window.kmaDeelStatus = function () { var s = S2(); return { on: !!s.on && F.ok(), name: F.name(), last: s.lastSync || '', bij: bijgewerkt(s.lastSync), key: !!team(), peloton: peloton(), ontvangst: stafOntvangstTekst() }; };

  /* Team key to colleagues: a file protected with a password the teamleider chooses (still possible; the invitation is easier). */
  function shareKey() {
    var t = team(); if (!t) return;
    staffKey();
    var pw = prompt('Kies een wachtwoord van minstens 12 letters of cijfers voor de teamsleutel, bijvoorbeeld drie losse woorden. Geef dat wachtwoord apart (mondeling) aan je collega.', '');
    if (pw == null) return;
    if (String(pw).replace(/[^A-Za-z0-9]/g, '').length < 12) { alert('Het wachtwoord moet minstens 12 letters of cijfers hebben. De teamsleutel geeft toegang tot alle dossiers, dus kies een lang wachtwoord.'); return; }
    var body = JSON.stringify({ type: 'kma-teamkey', v: 1, key: team(), from: me(), peloton: peloton() });
    KMAX.encrypt(body, pw, { kind: 'teamsleutel' }).then(function (txt) { kmaShareFile('KMA_Teamsleutel_' + new Date().toISOString().slice(0, 10) + '.json', txt); });
  }

  /* ---------------- Instructors: invite and accept ---------------- */
  var LABEL = { senior: 'Senior-instructeur', junior: 'Junior-instructeur', teamleider: 'Teamleider' };
  /** Teamleider: makes an invitation (team key, staff key, peloton, function) that only opens with a one-time code. */
  function invite(rank, name, r, id) {
    var t = team(); if (!t) return Promise.reject(new Error('geen-teamsleutel'));
    staffKey(); t = team();
    id = id || 'i' + hex(5);
    var code = KMAX.gen(), now = new Date().toISOString();
    var body = { type: 'kma-staff-invite', v: 1, id: id, rank: rank, name: name, role: r, peloton: peloton(), team: t, from: me(), at: now };
    return KMAX.encrypt(JSON.stringify(body), code, { kind: 'uitnodiging' }).then(function (env) {
      var wrote = F.ok() && S2().on && F.write(base() + 'uitnodigingen/' + id + '.json', env);
      var l = staffList().filter(function (x) { return x.id !== id; });
      l.push({ id: id, rank: rank, name: name, role: r, at: now, seen: '' }); saveStaff(l);
      return { id: id, code: code, env: env, wrote: wrote };
    });
  }
  function applyInvite(b, path) {
    if (!b || b.type !== 'kma-staff-invite' || !b.team || !b.team.pub || !b.team.priv || !b.team.sk) throw new Error('beschadigd');
    setJ(TK, b.team); setJ(MK, { id: b.id, from: b.from || '', at: new Date().toISOString() });
    if (b.peloton) setJ(PK, { name: b.peloton, at: new Date().toISOString() });
    try {
      kmaStore.setItem('kma-cvs-role', b.role === 'senior' ? 'senior' : 'junior');
      if (b.rank) kmaStore.setItem('kma-cvs-rank', b.rank);
      if (b.name) kmaStore.setItem('kma-cvs-lastname', b.name);
      kmaStore.setItem('kma-cvs-instructor-name', ((b.rank ? b.rank + ' ' : '') + (b.name || '')).trim());
    } catch (e) {}
    if (path && F.ok()) F.remove(path);   // an invitation works once
    var s = S2(); s.staffHash = ''; s.staffSeen = {}; if (F.ok()) s.on = true; save2(s);
    if (window.kmaApplyRole) kmaApplyRole();
    toast('Welkom in ' + (b.peloton || 'het team') + ' als ' + (LABEL[b.role] || 'instructeur').toLowerCase() + (b.from ? ' (teamleider ' + b.from + ')' : ''));
    window.kmaDeelSync(false);
  }
  /** Instructor: looks for the invitation in the folder (every peloton) and opens it with the code. */
  function acceptCode(code) {
    var paths = [], add = function (dir, nv) { F.list(dir).forEach(function (f) { if (!f.dir && /\.json$/i.test(f.name)) paths.push({ p: dir + '/' + f.name, nv: nv }); }); };
    // hoofdmap (met de map pelotons), de map pelotons zelf, of de map van het peloton (of een oude map zonder peloton)
    F.list('pelotons').forEach(function (d) { if (d.dir) add('pelotons/' + d.name + '/uitnodigingen', 'root'); });
    F.list('').forEach(function (d) { if (d.dir && d.name !== 'uitnodigingen' && d.name !== 'pelotons') add(d.name + '/uitnodigingen', 'pelotons'); });
    add('uitnodigingen', F.list('').some(function (d) { return d.dir && d.name === 'cadetten'; }) || F.read('teamsleutel.json') != null ? 'peloton' : 'root');
    var tryAt = function (i) {
      if (i >= paths.length) return Promise.reject(new Error(paths.length ? 'code' : 'geen'));
      var o; try { o = JSON.parse(F.read(paths[i].p) || 'null'); } catch (e) { o = null; }
      if (!KMAX.isEnc(o)) return tryAt(i + 1);
      return KMAX.decrypt(o, [code]).then(function (txt) { return { b: kmaLees(txt), path: paths[i].p, nv: paths[i].nv }; }, function () { return tryAt(i + 1); });
    };
    return tryAt(0);
  }
  function acceptFile(o, code) { return KMAX.decrypt(o, [code]).then(function (txt) { return { b: kmaLees(txt), path: '' }; }); }

  function staffRow(x) {
    var fout = (S2().staffFout || {})[x.id];
    var st = fout ? '<b class="kma-staff-fout">bestand niet te openen: tik op Nieuwe code en laat de instructeur die gebruiken</b>' : x.seen ? 'actief · ' + esc(ago(x.seen)) : 'uitgenodigd';
    return '<div class="kma-staff-row" data-sid="' + esc(x.id) + '"><div><strong>' + esc(((x.rank ? x.rank + ' ' : '') + x.name).trim()) + '</strong><small>' + esc(LABEL[x.role] || x.role) + ' · ' + st + '</small></div>' +
      '<button type="button" class="kma-chip-btn" data-s="again">Nieuwe code</button><button type="button" class="kma-chip-btn" data-s="del">Verwijderen</button></div>';
  }
  function inviteResult(x, rank, name, r) {
    var who = ((rank ? rank + ' ' : '') + name).trim();
    var body = '<p>Uitnodiging voor <strong>' + esc(who) + '</strong> als ' + esc((LABEL[r] || '').toLowerCase()) + ' in <strong>' + esc(peloton() || 'je peloton') + '</strong>.</p>' +
      '<div class="kma-invite-code" aria-label="Uitnodigingscode"><code>' + esc(x.code) + '</code></div>' +
      '<ol class="kma-invite-steps"><li>' + esc(who) + ' installeert het CadetVolgSysteem en kiest bij <b>⋮ → Peloton en team</b> voor <b>Uitnodiging gebruiken</b>.</li>' +
      '<li>' + (x.wrote ? 'Hij of zij kiest dezelfde gedeelde map (' + esc(F.name()) + ') en vult deze code in.' : 'Stuur het uitnodigingsbestand (knop hieronder) en geef de code apart door.') + '</li>' +
      '<li>Daarna staan de dossiers van je peloton bij hem of haar, en komen DTF-notities' + (r === 'senior' ? ' en feedback' : '') + ' vanzelf bij jou binnen.</li></ol>' +
      '<p class="kma-code-err">Geef de code mondeling of persoonlijk door, niet in hetzelfde bericht als het bestand. De code werkt één keer.</p>' +
      '<div id="kma-inv-qr" class="kma-invite-qr" hidden></div>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-i="file">Uitnodiging als bestand</button>' + (window.QRCode ? '<button type="button" class="kma-icon-btn" data-i="qr">QR-code tonen</button>' : '') + '<button type="button" class="kma-icon-btn is-primary" data-i="done">Klaar</button></div>';
    sheet('Instructeur toegevoegd', body, function (e, ov) {
      /* 4.33 (punt 3): de code als QR, voor als de instructeur naast je staat (extra optie naast intypen) */
      if (e.target.closest('[data-i="qr"]')) {
        var box = ov.querySelector('#kma-inv-qr'); box.hidden = false; box.innerHTML = '';
        try { new QRCode(box, { text: QR_PRE + norm(x.code), width: 220, height: 220, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M }); } catch (q) { box.textContent = 'De QR-code kan niet worden gemaakt. Geef de code mondeling door.'; }
        return;
      }
      if (e.target.closest('[data-i="file"]')) kmaShareFile('KMA_Uitnodiging_' + who.replace(/[^A-Za-z0-9]+/g, '_') + '.json', x.env);
      else if (e.target.closest('[data-i="done"]')) { ov.remove(); window.kmaPelotonDialog(); }
    });
  }
  function addStaffDialog(prefill) {
    var body = '<p class="muted">Een senior- of junior-instructeur krijgt toegang tot de dossiers van <b>' + esc(peloton()) + '</b> en legt DTF-notities vast. Een senior-instructeur geeft ook feedback. Wat zij vastleggen komt vanzelf bij jou binnen via de deelmap.</p>' +
      '<div class="kma-role-who"><label>Rang<input type="text" id="kma-st-rank" list="kma-st-ranks" autocomplete="off" placeholder="bijv. Sgt" value="' + esc((prefill && prefill.rank) || '') + '"/></label>' +
      '<label>Naam<input type="text" id="kma-st-name" autocomplete="off" placeholder="bijv. Bakker" value="' + esc((prefill && prefill.name) || '') + '"/></label></div>' +
      '<datalist id="kma-st-ranks">' + ['Kpl', 'Sgt', 'Sgt1', 'Smi', 'Aoo', 'Vdg', 'Tlt', 'Elnt', 'Lt', 'Kapt', 'Ritm', 'Maj'].map(function (r) { return '<option value="' + r + '">'; }).join('') + '</datalist>' +
      '<div class="kma-role-list" role="radiogroup" aria-label="Functie">' + ['senior', 'junior'].map(function (r) {
        return '<label class="kma-role-opt"><input type="radio" name="kma-st-role" value="' + r + '"' + ((prefill && prefill.role === r) || (!prefill && r === 'senior') ? ' checked' : '') + '/><span><strong>' + LABEL[r] + '</strong><small>' + (r === 'senior' ? 'Feedback en DTF-notities; geen cadetbeoordeling' : 'DTF-notities vastleggen; dossiers inzien') + '</small></span></label>';
      }).join('') + '</div><p class="kma-code-err" id="kma-st-err" role="alert"></p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-st="go">Uitnodigen</button></div>';
    sheet('Instructeur toevoegen', body, function (e, ov) {
      if (!e.target.closest('[data-st="go"]')) return;
      var rk = ov.querySelector('#kma-st-rank').value.trim(), nm = ov.querySelector('#kma-st-name').value.trim(), r = ov.querySelector('input[name="kma-st-role"]:checked');
      var err = function (t) { ov.querySelector('#kma-st-err').textContent = t; };
      if (!nm) return err('Vul de naam in.');
      if (!r) return err('Kies de functie.');
      ov.remove();
      invite(rk, nm, r.value, prefill && prefill.id).then(function (x) { inviteResult(x, rk, nm, r.value); }, function () { toast('De uitnodiging kon niet worden gemaakt.', 'error'); });
    });
  }
  window.kmaUseInvite = function () { useInviteDialog(); };
  var QR_PRE = 'KMA-UITNODIGING:', invScanner = null;
  function stopInvScan() { var sc = invScanner; invScanner = null; if (sc) { try { sc.stop().then(function () { try { sc.clear(); } catch (e) {} }, function () {}); } catch (e) { /* al gestopt */ } } }
  /** Leest de code uit de tekst van een gescande QR-code; '' als het geen uitnodiging is. */
  function codeUitQr(t) { t = String(t || '').trim(); if (t.indexOf(QR_PRE) !== 0) return ''; var c = norm(t.slice(QR_PRE.length)); return c.length === 12 ? c.slice(0, 4) + '-' + c.slice(4, 8) + '-' + c.slice(8) : ''; }
  window.kmaInvCodeUitQr = codeUitQr;
  function useInviteDialog() {
    var on = !!S2().on && F.ok();
    var body = '<ol class="kma-invite-steps"><li' + (on ? ' class="ok"' : '') + '><b>Kies de gedeelde map</b> van je teamleider (dezelfde map in SharePoint of OneDrive).</li><li><b>Vul de code in</b> die je teamleider je gaf.</li><li>Klaar: je DTF-notities gaan daarna vanzelf naar je teamleider.</li></ol>' +
      row('Map', on ? esc(F.name()) : 'niet gekoppeld', on ? '' : 'warn') +
      '<label class="kma-code-lab">Uitnodigingscode<input type="text" id="kma-inv-code" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="XXXX-XXXX-XXXX"/></label>' +
      (window.Html5Qrcode ? '<div class="kma-row-btns kma-deel-btns"><button type="button" class="kma-chip-btn" data-u="scan">Scan de QR-code van je teamleider</button></div><div id="kma-inv-reader" class="kma-inv-reader"></div>' : '') +
      '<p class="kma-code-err" id="kma-inv-err" role="alert"></p>' +
      '<div class="kma-row-btns kma-deel-btns">' + (on ? '' : '<button type="button" class="kma-icon-btn" data-u="pick">Map kiezen</button>') + '<button type="button" class="kma-icon-btn is-primary" data-u="go">Uitnodiging gebruiken</button></div>' +
      '<div class="kma-row-btns kma-deel-btns"><button type="button" class="kma-chip-btn" data-u="file">Ik heb een uitnodigingsbestand</button>' + (window.kmaOnderbouwing ? kmaOnderbouwing.link('deelmap') : '') + '</div>';
    var file = null;
    var ovU = sheet('Uitnodiging gebruiken', body, function (e, ov) {
      var err = function (t) { ov.querySelector('#kma-inv-err').textContent = t; };
      if (e.target.closest('[data-u="scan"]')) {
        try { if (window.Android && window.Android.requestCameraPermission) window.Android.requestCameraPermission(); } catch (x) { /* geen camera */ }
        stopInvScan();
        var rd = ov.querySelector('#kma-inv-reader'); rd.classList.add('on');
        var sc = new Html5Qrcode('kma-inv-reader'); invScanner = sc;
        var cfg = { fps: 10, qrbox: { width: 220, height: 220 } }, klaar = false;
        var ok = function (t) {
          if (klaar) return; var c = codeUitQr(t);
          if (!c) { err('Dit is geen uitnodigingscode. Scan de QR-code die je teamleider bij Instructeur toegevoegd laat zien.'); return; }
          klaar = true; stopInvScan(); rd.classList.remove('on'); ov.querySelector('#kma-inv-code').value = c; err(''); toast('Code gescand');
        };
        sc.start({ facingMode: 'environment' }, cfg, ok, function () {}).catch(function () { return sc.start({ facingMode: 'user' }, cfg, ok, function () {}); })
          .catch(function () { rd.classList.remove('on'); err('De camera kan niet starten. Typ de code over.'); });
        return;
      }
      if (e.target.closest('[data-u="pick"]')) { stopInvScan(); ov.remove(); pick(function (ok) { if (ok) { var s = S2(); s.on = true; save2(s); } useInviteDialog(); }); return; }
      if (e.target.closest('[data-u="file"]')) {
        var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,.kma,.txt'; inp.style.display = 'none';
        inp.addEventListener('change', function () { var f = inp.files && inp.files[0]; inp.remove(); if (!f) return; f.text().then(function (t) { try { file = kmaLees(t); } catch (x) { file = null; } err(file && KMAX.isEnc(file) ? '' : 'Dit is geen uitnodigingsbestand.'); if (file) ov.querySelector('#kma-inv-code').focus(); }); });
        document.body.appendChild(inp); inp.click(); return;
      }
      if (!e.target.closest('[data-u="go"]')) return;
      var code = ov.querySelector('#kma-inv-code').value;
      if (!KMAX.valid(code)) return err('Vul de code van je teamleider in (12 letters en cijfers).');
      if (!file && !F.ok()) return err('Kies eerst de gedeelde map, of gebruik het uitnodigingsbestand.');
      err('Even zoeken …');
      (file && KMAX.isEnc(file) ? acceptFile(file, code) : acceptCode(code)).then(function (r) {
        try {
          if (r.nv) { var s0 = S2(); s0.niveau = r.nv === 'root' ? '' : r.nv; save2(s0); }
          applyInvite(r.b, r.path); ov.remove(); setTimeout(window.kmaPelotonDialog, 400);
        } catch (x) { err('Deze uitnodiging is beschadigd. Vraag je teamleider om een nieuwe code.'); }
      }, function (x) {
        err(x && x.message === 'geen' ? 'In de map "' + F.name() + '" staat geen uitnodiging. Kies dezelfde map als je teamleider (de map waarin "pelotons" staat). Net gemaakt? Wacht een minuut tot OneDrive of SharePoint hem heeft gesynchroniseerd en probeer opnieuw. Of vraag om het uitnodigingsbestand.' : 'Deze code past bij geen uitnodiging in "' + F.name() + '". Controleer de code (12 tekens, zonder O, I, 0 en 1) of vraag je teamleider om een nieuwe.');
      });
    });
    ovU.addEventListener('click', function (e) { if (e.target === ovU || e.target.closest('[data-x="close"]') || e.target.closest('[data-u="go"]')) stopInvScan(); });
  }
  /** ⋮ → Peloton en team */
  window.kmaPelotonDialog = function () {
    var tl = role() === 'teamleider', t = team(), on = !!S2().on && F.ok();
    var body;
    if (tl) {
      var list = staffList();
      body = '<p class="muted">Je groepen (ALFA, BRAVO …) vallen onder je peloton. In een gedeelde SharePoint-map heeft elk peloton een eigen map, zodat andere teamleiders hun eigen peloton beheren.</p>' +
        '<label class="kma-code-lab">Naam van je peloton<input type="text" id="kma-pel-name" maxlength="40" autocomplete="off" placeholder="bijv. Peloton 3" value="' + esc(peloton()) + '"/></label>' +
        '<div class="kma-row-btns kma-deel-btns"><button type="button" class="kma-chip-btn" data-p="save">Naam opslaan</button></div>' +
        row('Deelmap', on ? esc(F.name()) + (peloton() ? ' › pelotons › ' + esc(slug(peloton())) : '') : 'niet gekoppeld', on ? '' : 'warn') +
        '<h4 class="kma-staff-h">Instructeurs</h4>' +
        (list.length ? '<div class="kma-staff-list">' + list.map(staffRow).join('') + '</div>' : '<p class="muted">Nog geen senior- of junior-instructeurs toegevoegd.</p>') +
        (!t ? '<p class="kma-code-err">Koppel eerst de deelmap (⋮ → Deelmap). Daarmee maak je de teamsleutel die je instructeurs nodig hebben.</p>' : '') +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Sluiten</button><button type="button" class="kma-icon-btn is-primary" data-p="add"' + (t && peloton() ? '' : ' disabled') + '>Instructeur toevoegen</button></div>';
    } else {
      var m = getJ(MK, null);
      body = t ? row('Peloton', esc(peloton() || '-')) + row('Functie', esc(LABEL[role()] || role())) + (m && m.from ? row('Teamleider', esc(m.from)) : '') + row('Deelmap', on ? esc(F.name()) + ' · ' + esc(bijgewerkt(S2().lastSync)) : 'niet gekoppeld', on ? '' : 'warn') + (stafOntvangstTekst() ? row('Je notities', esc(stafOntvangstTekst()), /Gelezen|Ontvangen/.test(stafOntvangstTekst()) ? 'ok' : '') : '') +
        '<p class="muted">Je DTF-notities' + (role() === 'senior' ? ' en feedback' : '') + ' gaan automatisch en versleuteld naar je teamleider en de andere instructeurs van je peloton. Cadetten kunnen ze niet lezen.</p>' +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-p="use">Andere uitnodiging</button><button type="button" class="kma-icon-btn is-primary" data-p="check">Deelmap controleren</button></div><div class="kma-row-btns kma-deel-btns"><button type="button" class="kma-chip-btn" data-p="sync">Nu bijwerken</button></div>'
        : '<p class="muted">Je bent nog niet aan een peloton gekoppeld. Vraag je teamleider om je toe te voegen; je krijgt dan een uitnodigingscode.</p><div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Sluiten</button><button type="button" class="kma-icon-btn is-primary" data-p="use">Uitnodiging gebruiken</button></div>';
    }
    sheet('Peloton en team', body, function (e, ov) {
      var b = e.target.closest('[data-p],[data-s]'); if (!b) return;
      var a = b.getAttribute('data-p');
      if (a === 'save') {
        var v = ov.querySelector('#kma-pel-name').value;
        if (!slug(v)) { toast('Vul een naam in met letters of cijfers', 'error'); return; }
        if (window.kmaSetPeloton(v)) { toast('Peloton: ' + peloton()); ov.remove(); window.kmaPelotonDialog(); }
        return;
      }
      if (a === 'add') { ov.remove(); addStaffDialog(null); return; }
      if (a === 'use') { ov.remove(); useInviteDialog(); return; }
      if (a === 'sync') { ov.remove(); window.kmaDeelSync(true); return; }
      if (a === 'check') { ov.remove(); window.kmaDeelControle(); return; }
      var rowEl = e.target.closest('[data-sid]'); if (!rowEl) return;
      var id = rowEl.getAttribute('data-sid'), x = staffList().find(function (y) { return y.id === id; }); if (!x) return;
      if (b.getAttribute('data-s') === 'again') { ov.remove(); addStaffDialog(x); return; }
      if (b.getAttribute('data-s') === 'del') {
        kmaConfirm((x.rank ? x.rank + ' ' : '') + x.name + ' verwijderen uit je peloton?\n\nNieuwe notities en feedback van deze instructeur komen dan niet meer binnen. Wat al binnen is, blijft staan.\n\nDe instructeur heeft de teamsleutel nog. Wil je dat hij of zij ook nieuwe dossiers niet meer kan lezen, ontkoppel dan de deelmap en maak een nieuwe teamsleutel; cadetten en instructeurs moeten dan opnieuw koppelen.', { ok: 'Verwijderen', danger: true }).then(function (ok) { if (!ok) return;
        saveStaff(staffList().filter(function (y) { return y.id !== id; }));
        if (F.ok()) { F.remove(base() + 'uitnodigingen/' + id + '.json'); F.remove(base() + 'staf/' + id + '.json'); }
        ov.remove(); window.kmaPelotonDialog();
      });
}
    });
  };

  // A team-key file chosen anywhere a file is read in.
  if (typeof handleBluetoothImportFile === 'function') {
    var prevImp = handleBluetoothImportFile;
    window.handleBluetoothImportFile = handleBluetoothImportFile = function (event) {
      var files = Array.prototype.slice.call((event && event.target && event.target.files) || []), self = this;
      if (!files.length) return prevImp.apply(this, arguments);
      Promise.all(files.map(function (f) { return f.text().then(function (t) { var d = null; try { d = kmaLees(t); } catch (x) {} return { f: f, d: d }; }, function () { return { f: f, d: null }; }); })).then(function (list) {
        var keys = list.filter(function (x) { return x.d && x.d.type === 'kma-teamkey'; }), rest = list.filter(function (x) { return !(x.d && x.d.type === 'kma-teamkey'); });
        keys.forEach(function (x) {
          var k = x.d.key;
          if (!k || !k.pub || !k.priv) { alert('Dit sleutelbestand is beschadigd.'); return; }
          var kmaGo = function () {
          setJ(TK, k); if (x.d.peloton) setJ(PK, { name: x.d.peloton, at: new Date().toISOString() });
          toast('Teamsleutel ingelezen' + (x.d.from ? ' van ' + x.d.from : ''));
          try { closeImportModal(); } catch (e) {}
          window.kmaDeelSync(false);
        };
      if (team() && team().pub !== k.pub) { kmaConfirm('Je hebt al een andere teamsleutel. Vervangen door die van ' + (x.d.from || 'je collega') + '?', { ok: 'Vervangen', danger: true }).then(function (ok) { if (ok) kmaGo(); }); return; }
      kmaGo();
});
        if (rest.length) prevImp.call(self, { target: { files: rest.map(function (x) { return x.f; }), value: '' } });
      });
    };
  }
  window.kmaDeelDialog = function () {
    var s = S2(), on = !!s.on && F.ok(), t = team(), tl = role() === 'teamleider';
    var codes = window.KMAX ? ['ALFA', 'BRAVO', 'CHARLIE', 'DELTA'].filter(function (g) { return KMAX.codeForGroup(g); }) : [];
    var body = '<p class="muted">Een gedeelde map (bijv. in OneDrive of SharePoint) voor jou, je instructeurs en je cadetten. Je peloton krijgt daarin een eigen map, en elke cadet een eigen map met een code (niet zijn Peoplesoft-nummer). Dossiers komen automatisch binnen; ' +
      (tl ? 'jouw feedback gaat automatisch naar de cadet. DTF-notities alleen als je ze zelf deelt.' : 'feedback naar cadetten verstuurt de teamleider.') + '</p>' +
      row('Peloton', peloton() ? esc(peloton()) : (tl ? 'nog niet ingevuld' : '-'), peloton() || !tl ? '' : 'warn') +
      row('Map', on ? esc(F.name()) : 'niet gekoppeld') + row('Teamsleutel', t ? 'aanwezig' + (t.by ? ' (' + esc(t.by) + ')' : '') : (tl ? 'nog niet gemaakt' : 'nog niet ingelezen'), t ? '' : 'warn') +
      (tl ? row('Groepscodes', codes.length ? esc(codes.join(', ')) : 'geen. Maak ze via ⋮ → Groepscodes', codes.length ? '' : 'warn') : '') +
      (on ? row('Bijgewerkt', esc(ago(s.lastSync)) + ' · automatisch') : '') + (on && stafOntvangstTekst() ? row('Je notities', esc(stafOntvangstTekst()), /Gelezen|Ontvangen/.test(stafOntvangstTekst()) ? 'ok' : '') : '') + (on && s.err ? '<p class="kma-code-err" role="alert">' + esc(s.err) + '</p>' : '') +
      (!on ? '<p class="muted small kma-deel-tip">' + TIP_BESCHIKBAAR + '</p>' : '') +
      '<div class="kma-row-btns kma-deel-btns">' +
      (on ? '<button type="button" class="kma-icon-btn" data-d="off">Ontkoppelen</button><button type="button" class="kma-icon-btn is-primary" data-d="check">Deelmap controleren</button>' : '<button type="button" class="kma-icon-btn is-primary" data-d="pick">Map kiezen</button><button type="button" class="kma-icon-btn" data-d="check">Deelmap controleren</button>') + '</div>' +
      (on ? '<div class="kma-row-btns kma-deel-btns"><button type="button" class="kma-chip-btn" data-d="sync">Nu bijwerken</button></div>' : '') +
      '<div class="kma-row-btns kma-deel-btns">' + (tl ? '<button type="button" class="kma-chip-btn" data-d="team">Peloton en instructeurs</button>' + (t ? '<button type="button" class="kma-chip-btn" data-d="sharekey">Teamsleutel als bestand</button>' : '') :
        (t ? '' : '<button type="button" class="kma-chip-btn" data-d="invite">Uitnodiging gebruiken</button>') + '<button type="button" class="kma-chip-btn" data-d="readkey">Teamsleutel inlezen</button>') + '</div>';
    sheet('Deelmap', body, function (e, ov) {
      if (e.target.closest('[data-d="pick"]')) {
        if (tl && !peloton()) { ov.remove(); toast('Vul eerst de naam van je peloton in', 'error'); window.kmaPelotonDialog(); return; }
        ov.remove();
        pick(function (ok) {
          if (!ok) return;
          var go = function () { var s2 = S2(); s2.on = true; s2.written = {}; s2.staffHash = ''; save2(s2); toast('Deelmap gekoppeld: ' + F.name() + '. Tip: zet de map in OneDrive op "Altijd behouden op dit apparaat".'); window.kmaDeelSync(true); };
          var exists = F.read(base() + 'teamsleutel.json');
          if (tl && !team()) {
            var kmaGo = function () {
            makeTeamKey().then(go);
          };
      if (exists) { kmaConfirm('In deze map staat voor ' + (peloton() || 'dit peloton') + ' al een teamsleutel van een andere teamleider. Een nieuwe maken? Cadetten en instructeurs moeten dan opnieuw koppelen.', { danger: false }).then(function (ok) { if (ok) kmaGo(); }); return; }
      kmaGo();
} else if (tl && exists) {
            var other = false; try { other = JSON.parse(exists).pub !== team().pub; } catch (x) {}
            if (other) kmaConfirm('Het peloton "' + peloton() + '" heeft in deze map al een andere teamleider. Toch deze map gebruiken? Kies anders eerst een andere pelotonnaam.', { ok: 'Toch deze map', danger: false }).then(function (ok) { if (ok) go(); });
            else go();
          } else go();
        });
      } else if (e.target.closest('[data-d="sync"]')) { ov.remove(); window.kmaDeelSync(true); }
      else if (e.target.closest('[data-d="check"]')) { ov.remove(); window.kmaDeelControle(); }
      else if (e.target.closest('[data-d="off"]')) {
        kmaConfirm('Deelmap ontkoppelen? Dossiers en feedback gaan dan niet meer automatisch.', { ok: 'Ontkoppelen', danger: true }).then(function (ok) { if (!ok) return;
        var s3 = S2(); s3.on = false; save2(s3); try { A.sharedClear(); } catch (x) {} ov.remove();
      });
} else if (e.target.closest('[data-d="sharekey"]')) { ov.remove(); shareKey(); }
      else if (e.target.closest('[data-d="team"]')) { ov.remove(); window.kmaPelotonDialog(); }
      else if (e.target.closest('[data-d="invite"]')) { ov.remove(); useInviteDialog(); }
      else if (e.target.closest('[data-d="readkey"]')) { ov.remove(); if (window.kmaPickColleagueFile) kmaPickColleagueFile(); }
    });
  };
  window.kmaStaffList = staffList;
  /* 4.33 (punt 6): wat in een beveiligde back-up van het CVS meegaat, en het terugzetten daarvan */
  window.kmaDeelBackup = function () {
    var t = team(); if (!t) return null;
    var g = null; try { g = JSON.parse(st().getItem('kma-cvs-groupcodes') || 'null'); } catch (e) { g = null; }
    return { team: t, staff: staffList(), me: getJ(MK, null), peloton: getJ(PK, null), groepscodes: g, rol: role() };
  };
  window.kmaDeelHerstel = function (d) {
    if (!d || !d.team || !d.team.pub || !d.team.priv) return false;
    var t = team(), zet = function () {
      setJ(TK, d.team);
      if (d.me && d.me.id) setJ(MK, d.me);
      if (d.peloton && d.peloton.name) setJ(PK, d.peloton);
      // instructeurs: samenvoegen, niets weggooien
      var l = staffList(); (d.staff || []).forEach(function (x) { if (x && x.id && !l.some(function (y) { return y.id === x.id; })) l.push(x); }); saveStaff(l);
      if (d.groepscodes && typeof d.groepscodes === 'object') {
        var cur = {}; try { cur = JSON.parse(st().getItem('kma-cvs-groupcodes') || '{}') || {}; } catch (e) { cur = {}; }
        Object.keys(d.groepscodes).forEach(function (k) { if (!cur[k] || !cur[k].code) cur[k] = d.groepscodes[k]; });
        try { st().setItem('kma-cvs-groupcodes', JSON.stringify(cur)); } catch (e) { /* opslag vol */ }
      }
      var s = S2(); s.staffHash = ''; s.staffSeen = {}; s.written = {}; save2(s);
      toast('Teamsleutel en ' + (d.staff || []).length + ' instructeur(s) teruggezet');
      setTimeout(function () { window.kmaDeelSync(false); }, 300);
    };
    if (t && t.pub !== d.team.pub) {
      kmaConfirm('In de back-up staat een andere teamsleutel dan op dit toestel. De teamsleutel uit de back-up gebruiken? Doe dit alleen als dit je eigen back-up is.', { ok: 'Teamsleutel terugzetten', cancel: 'Huidige houden', danger: false }).then(function (ok) { if (ok) zet(); });
      return true;
    }
    zet(); return true;
  };
  setTimeout(function () { window.kmaDeelSync(false); }, 3000);
  setInterval(function () { if (!document.hidden) window.kmaDeelSync(false); }, 90000);
  autoBij();
  /* 4.31 (punt 2): na elke wijziging (bijv. een nieuwe DTF-notitie) meteen synchroniseren, niet pas na een minuut */
  var sTimer = null;
  if (typeof window.saveCVS === 'function' || typeof saveCVS === 'function') {
    var origSave = window.saveCVS || saveCVS;
    window.saveCVS = saveCVS = function () {
      var r = origSave.apply(this, arguments);
      try { if (!busy && F.ok() && S2().on && team()) { clearTimeout(sTimer); sTimer = setTimeout(function () { window.kmaDeelSync(false); }, 1500); } } catch (e) { /* geen deelmap */ }
      return r;
    };
  }
  /* 4.31 (punt 3): de teamleider ziet nieuwe DTF-notities van instructeurs boven de cadettenlijst */
  window.kmaStafNieuw = function () { if (role() !== 'teamleider') return []; var nw = S2().nieuw || {}; return Object.keys(nw).map(function (k) { return { id: k, wie: nw[k].wie, n: nw[k].n, at: nw[k].at }; }).filter(function (x) { return x.n > 0; }); };
  /** De kaart "Nieuw van je instructeurs" als HTML (leeg als er niets nieuws is). Klassiek: boven de cadettenlijst; Dashboard: bovenaan Peloton en Postvak. */
  window.kmaStafNieuwHtml = function (id) {
    var l = window.kmaStafNieuw(); if (!l.length) return '';
    return '<div id="' + esc(id || 'kma-staf-nieuw') + '" class="kma-staf-nieuw"><div><b>Nieuw van je instructeurs</b><span>' + l.map(function (x) { return esc(x.n + (x.n === 1 ? ' DTF-notitie' : ' DTF-notities') + ' van ' + x.wie); }).join(' · ') + '</span><small class="muted">Je vindt ze in het dossier van de cadet, bij DTF. ' + (window.kmaOnderbouwing ? kmaOnderbouwing.link('deelmap') : '') + '</small></div><button type="button" class="kma-chip-btn" data-staf-gezien>Gezien</button></div>';
  };
  // 4.31: in Dashboard staat de kaart op Peloton en in het Postvak (de cadettenlijst is daar niet in beeld)
  function dashBij() { try { if (window.kmaCvsDash && /^(peloton|postvak)$/.test(kmaCvsDash.huidig()) && !(document.getElementById('detail-view') || { classList: { contains: function () { return false; } } }).classList.contains('active')) kmaCvsDash.teken(); } catch (e) { /* geen dashboard */ } }
  window.kmaStafGezien = function () { var s = S2(); s.nieuw = {}; s.gezienAt = new Date().toISOString(); s.ontvAt = Object.assign({}, s.ontv || {}); save2(s); setTimeout(function () { window.kmaDeelSync(false); }, 300); document.querySelectorAll('.kma-staf-nieuw').forEach(function (el) { el.remove(); }); dashBij(); };
  function stafNieuwPaneel() {
    var grid = document.getElementById('cadets-grid'); if (!grid || !grid.parentElement) return;
    var old = document.getElementById('kma-staf-nieuw'); if (old) old.remove();
    var h = window.kmaStafNieuwHtml('kma-staf-nieuw'); if (!h) return;
    var d = document.createElement('div'); d.innerHTML = h;
    grid.parentElement.insertBefore(d.firstChild, grid);
  }
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-staf-gezien]')) window.kmaStafGezien(); });
  /* 4.33 (punt 5): opent de teamleider een dossier, dan krijgt de cadet "Gelezen door je teamleider" */
  if (typeof openDetailView === 'function') {
    var origOpen = openDetailView;
    window.openDetailView = openDetailView = function (id) {
      var r = origOpen.apply(this, arguments);
      try {
        var c = cadets.find(function (x) { return x.id === id; });
        if (c && role() === 'teamleider' && c.deelKey && c.data && c.data.sharedAt && c.deelGelezenVoor !== String(c.data.sharedAt)) { c.deelGelezen = new Date().toISOString(); c.deelGelezenVoor = String(c.data.sharedAt); saveCVS(); }
      } catch (e) { /* geen dossier */ }
      return r;
    };
  }
  if (typeof renderCadets === 'function') {
    var origRender = renderCadets;
    window.renderCadets = renderCadets = function () { var r = origRender.apply(this, arguments); try { stafNieuwPaneel(); dashBij(); } catch (e) { /* geen lijst */ } return r; };
  }
})();
