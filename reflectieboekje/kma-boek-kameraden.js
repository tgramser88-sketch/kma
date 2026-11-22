/*
 * 4.9.0: Feedback tussen cadetten ("feedback van medecadetten").
 *
 * Een cadet geeft een medecadet feedback in de vorm van een DTF-kaart: datum, tijd, situatie, wat je zag of
 * hoorde (alleen gedrag), het effect, eventueel één van de 4V's, "vasthouden" of "verbeteren" en één tip.
 *  - Ongevraagd: hooguit 2 kaarten per week (maandag t/m zondag). Op een vraag van een medecadet: altijd.
 *  - Feedback vragen: aan de hele groep of aan een paar medecadetten, met een einddatum. De vrager ziet per vraag
 *    een samenvatting (vasthouden / verbeteren, de 4V's) en elke kaart apart.
 *  - De ontvanger heeft de regie: kaarten komen in een eigen postvak en gaan nergens vanzelf heen. Met één tik
 *    zet de cadet een kaart in het eigen DTF-logboek; pas dan kan de teamleider hem zien (als de cadet het
 *    DTF-logboek deelt). Niet anoniem: de ontvanger ziet altijd van wie een kaart komt.
 *
 * Versturen gaat op drie manieren:
 *  1. Deelmap (als de cadet die heeft gekoppeld): <deelmap>/kameraden/
 *       sleutels/<peoplesoft>.json  openbare sleutel van elke cadet, met een bewijs dat hij de groepscode kent
 *       post/<peoplesoft>/<id>.json kaarten voor die cadet, versleuteld met zijn openbare sleutel (RSA-OAEP +
 *                                   AES-GCM): alleen die ene cadet kan ze lezen, ook niet de andere cadetten
 *       vragen/<id>.json            vragen om feedback, versleuteld met de groepscode
 *  2. QR-code: de ontvanger scant de code op het scherm van de gever (of andersom bij een vraag).
 *  3. Bestand: via het deelmenu (WhatsApp, Teams, mail). Ook dan versleuteld met de groepscode.
 * Alles staat in kmaStore onder kma-x-kameraden.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaStore || window.kmaKameraad) return;
  var KEY = 'kma-x-kameraden', MAX_WEEK = 2, PREFIX = 'KMAK1:';
  var V4 = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'];
  var icon = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
  var subtle = window.crypto && crypto.subtle, enc = new TextEncoder(), dec = new TextDecoder();
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function clip(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n); }
  function toast(m, k) { if (window.kmaToast) kmaToast(m, k); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function nowTime() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function plusDays(n) { var d = new Date(Date.now() + n * 864e5); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function week() { return window.KMAPatterns ? KMAPatterns.thisWeekKey() : (function () { var d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); })(); }
  function fmtDate(s) { try { var d = new Date(String(s).length === 10 ? s + 'T12:00:00' : s); return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }); } catch (e) { return s || ''; } }
  function uid() { return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function b64(buf) { var u = new Uint8Array(buf), s = '', CH = 0x8000; for (var i = 0; i < u.length; i += CH) s += String.fromCharCode.apply(null, u.subarray(i, i + CH)); return btoa(s); }
  function unb64(s) { var t = atob(s), u = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; }
  function norm(c) { return String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  function lees(t) { return window.kmaLees ? kmaLees(t) : JSON.parse(t); }

  /* ---------------- Gegevens ---------------- */
  function S() {
    var s = null; try { s = JSON.parse(kmaStore.getItem(KEY)); } catch (e) {}
    s = s && typeof s === 'object' ? s : {};
    ['sent', 'inbox', 'mine', 'open', 'seen'].forEach(function (k) { if (!Array.isArray(s[k])) s[k] = []; });
    return s;
  }
  function save(s) { try { kmaStore.setItem(KEY, JSON.stringify(s)); } catch (e) {} if (typeof triggerSavePulse === 'function') triggerSavePulse(); badge(); }
  function me() { var a = typeof answers !== 'undefined' ? answers : {}; return clip(a['Voornaam & Achternaam:'] || a['Voornaam + Achternaam:'] || a['Voornaam:'] || '', 60); }
  function myPs() { var a = typeof answers !== 'undefined' ? answers : {}; return String(a['Peoplesoft Nummer:'] || a['Peoplesoft ID:'] || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 20); }
  function sentThisWeek() { var w = week(); return S().sent.filter(function (x) { return x.week === w && !x.req; }).length; }
  function leftThisWeek() { return Math.max(0, MAX_WEEK - sentThisWeek()); }
  function newCount() { return S().inbox.filter(function (c) { return c.nieuw; }).length; }
  function openRequests() { var t = today(); return S().open.filter(function (r) { return !r.done && (!r.tot || r.tot >= t); }); }

  /** Een kaart van buiten: alleen bekende velden, ingekort. Geeft null bij iets anders. */
  function cleanCard(o) {
    if (!o || o.type !== 'kma-kameraad' || typeof o.feit !== 'string') return null;
    var c = { type: 'kma-kameraad', v: 1, id: clip(o.id, 40) || uid(), van: clip(o.van, 60) || 'Medecadet', vanPs: clip(o.vanPs, 20), aan: clip(o.aan, 60), aanPs: clip(o.aanPs, 20),
      req: clip(o.req, 40), datum: /^\d{4}-\d{2}-\d{2}$/.test(o.datum) ? o.datum : '', tijd: /^\d{2}:\d{2}$/.test(o.tijd) ? o.tijd : '',
      situatie: clip(o.situatie, 140), feit: clip(o.feit, 500), effect: clip(o.effect, 400), v4: V4.indexOf(o.v4) >= 0 ? o.v4 : '',
      soort: o.soort === 'verbeteren' ? 'verbeteren' : 'vasthouden', tip: clip(o.tip, 400), at: clip(o.at, 40) };
    var lr = window.KMALeary ? KMALeary.clean(o.leary) : null; if (lr) c.leary = lr;
    return c.feit ? c : null;
  }
  function cleanReq(o) {
    if (!o || o.type !== 'kma-kameraad-vraag') return null;
    var r = { type: 'kma-kameraad-vraag', v: 1, id: clip(o.id, 40), van: clip(o.van, 60) || 'Medecadet', vanPs: clip(o.vanPs, 20), groep: clip(o.groep, 30),
      situatie: clip(o.situatie, 140), focus: clip(o.focus, 200), tot: /^\d{4}-\d{2}-\d{2}$/.test(o.tot) ? o.tot : '', at: clip(o.at, 40),
      aan: Array.isArray(o.aan) ? o.aan.map(function (x) { return clip(x, 20); }).filter(Boolean).slice(0, 40) : 'groep' };
    return r.id && r.situatie ? r : null;
  }

  /* ---------------- Inpakken (groepscode) ---------------- */
  function pack(obj) {
    var text = JSON.stringify(obj), code = window.KMAX && KMAX.myCode();
    if (!code || !subtle) return Promise.resolve(text);
    return KMAX.encrypt(text, code, { kind: 'kameraad' });
  }
  function unpack(text) {
    var o; try { o = lees(String(text)); } catch (e) { return Promise.reject(new Error('lezen')); }
    if (window.KMAX && KMAX.isEnc(o)) return KMAX.decrypt(o, KMAX.allCodes()).then(function (t) { return lees(t); }, function () { throw new Error('code'); });
    return Promise.resolve(o);
  }
  function ascii(t) { return t.replace(/[\u007f-￿]/g, function (ch) { return '\\u' + ('000' + ch.charCodeAt(0).toString(16)).slice(-4); }); }

  /* ---------------- Deelmap ---------------- */
  var A = window.Android;
  var F = {
    ok: function () { try { return !!(A && A.sharedIsSet && A.sharedIsSet()); } catch (e) { return false; } },
    list: function (p) { try { return JSON.parse(A.sharedList(p) || '[]'); } catch (e) { return []; } },
    read: function (p) { try { var r = JSON.parse(A.sharedRead(p) || '{}'); return r.ok ? r.t : null; } catch (e) { return null; } },
    write: function (p, t) { try { return !!A.sharedWrite(p, t); } catch (e) { return false; } },
    remove: function (p) { try { return !!(A.sharedRemove && A.sharedRemove(p)); } catch (e) { return false; } }
  };
  function deel() {
    var d = null; try { d = JSON.parse(kmaStore.getItem('kma-x-deel')); } catch (e) {}
    if (!d || !d.on || !F.ok() || !subtle || !window.KMAX || !KMAX.myCode() || !myPs()) return null;
    return { base: (d.base || '') + 'kameraden/', groep: d.group || '' };
  }
  var RSA = { name: 'RSA-OAEP', hash: 'SHA-256' };
  function keys() {
    var s = S();
    if (s.pub && s.priv) return Promise.resolve({ pub: s.pub, priv: s.priv });
    return subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['encrypt', 'decrypt']).then(function (kp) {
      return Promise.all([subtle.exportKey('spki', kp.publicKey), subtle.exportKey('jwk', kp.privateKey)]);
    }).then(function (r) { var s2 = S(); s2.pub = b64(r[0]); s2.priv = r[1]; save(s2); return { pub: s2.pub, priv: s2.priv }; });
  }
  /** Bewijs dat de sleutel van iemand met dezelfde groepscode komt (HMAC met een sleutel uit de groepscode). */
  function proof(ps, pub) {
    return subtle.digest('SHA-256', enc.encode('kma-kameraad:' + norm(KMAX.myCode()))).then(function (h) { return subtle.importKey('raw', h, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); })
      .then(function (k) { return subtle.sign('HMAC', k, enc.encode(ps + '|' + pub)); }).then(b64);
  }
  function seal(text, pubB64) {
    return Promise.all([subtle.importKey('spki', unb64(pubB64), RSA, false, ['encrypt']), subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])]).then(function (r) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      return Promise.all([subtle.exportKey('raw', r[1]), subtle.encrypt({ name: 'AES-GCM', iv: iv }, r[1], enc.encode(text))]).then(function (x) {
        return subtle.encrypt(RSA, r[0], x[0]).then(function (wk) { return JSON.stringify({ type: 'kma-sealed', v: 1, key: b64(wk), iv: b64(iv), z: 0, data: b64(x[1]) }); });
      });
    });
  }
  function unseal(o, privJwk) {
    return subtle.importKey('jwk', privJwk, RSA, false, ['decrypt']).then(function (k) { return subtle.decrypt(RSA, k, unb64(o.key)); })
      .then(function (raw) { return subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']); })
      .then(function (k) { return subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, k, unb64(o.data)); })
      .then(function (pt) { return dec.decode(pt); });
  }
  var peopleCache = null;
  /** Medecadetten in de deelmap met dezelfde groepscode (zonder jezelf). */
  function people() {
    var d = deel(); if (!d) return Promise.resolve([]);
    var files = F.list(d.base + 'sleutels').filter(function (f) { return !f.dir && /\.json$/i.test(f.name); });
    return Promise.all(files.map(function (f) {
      var t = F.read(d.base + 'sleutels/' + f.name); if (!t) return null;
      var o; try { o = lees(t); } catch (e) { return null; }
      if (!o || o.type !== 'kma-kameraad-sleutel' || !o.pub || !o.ps || o.ps === myPs()) return null;
      return proof(o.ps, o.pub).then(function (p) { return p === o.proof ? { naam: clip(o.naam, 60) || 'Medecadet', ps: clip(o.ps, 20), pub: o.pub } : null; }, function () { return null; });
    })).then(function (l) { peopleCache = l.filter(Boolean).sort(function (a, b) { return a.naam.localeCompare(b.naam); }); return peopleCache; });
  }
  var busy = false;
  /** Eén ronde: eigen sleutel bijwerken, post ophalen, vragen ophalen, eigen verlopen vragen opruimen. */
  function sync() {
    var d = deel(); if (!d || busy) return Promise.resolve(null);
    busy = true;
    var got = 0, ps = myPs();
    return keys().then(function (k) {
      return proof(ps, k.pub).then(function (pr) {
        var body = JSON.stringify({ type: 'kma-kameraad-sleutel', v: 1, naam: me(), ps: ps, groep: d.groep, pub: k.pub, proof: pr });
        var s = S(); if (s.pubSent !== body) { if (F.write(d.base + 'sleutels/' + ps + '.json', body)) { s.pubSent = body; save(s); } }
        // post
        var files = F.list(d.base + 'post/' + ps).filter(function (f) { return !f.dir && /\.json$/i.test(f.name); });
        return files.reduce(function (p, f) {
          return p.then(function () {
            var t = F.read(d.base + 'post/' + ps + '/' + f.name); if (!t) return;
            var o; try { o = lees(t); } catch (e) { return; }
            if (!o || o.type !== 'kma-sealed') return;
            return unseal(o, k.priv).then(function (txt) { if (addCard(lees(txt), true)) got++; F.remove(d.base + 'post/' + ps + '/' + f.name); }, function () {});
          });
        }, Promise.resolve());
      });
    }).then(function () {
      var vr = F.list(d.base + 'vragen').filter(function (f) { return !f.dir && /\.json$/i.test(f.name); });
      return vr.reduce(function (p, f) {
        return p.then(function () {
          var t = F.read(d.base + 'vragen/' + f.name); if (!t) return;
          return unpack(t).then(function (o) {
            var r = cleanReq(o); if (!r) return;
            if (r.vanPs === ps) { if (r.tot && r.tot < plusDays(-14)) F.remove(d.base + 'vragen/' + f.name); return; }
            if (r.aan !== 'groep' && r.aan.indexOf(ps) < 0) return;
            addRequest(r, true);
          }, function () {});
        });
      }, Promise.resolve());
    }).then(function () { busy = false; if (got) toast(got === 1 ? 'Nieuwe feedback van een medecadet' : got + ' nieuwe kaarten van medecadetten'); return got; },
      function () { busy = false; return null; });
  }

  /* ---------------- Postvak ---------------- */
  function addCard(o, quiet) {
    var c = cleanCard(o); if (!c) return false;
    var s = S();
    if (s.inbox.some(function (x) { return x.id === c.id; })) return false;
    c.got = new Date().toISOString(); c.nieuw = true;
    s.inbox.unshift(c);
    if (c.req) s.mine.forEach(function (r) { if (r.id === c.req && r.answers.indexOf(c.id) < 0) r.answers.push(c.id); });
    save(s);
    if (!quiet) toast('Feedback van ' + c.van + ' staat in je postvak');
    return true;
  }
  function addRequest(o, quiet) {
    var r = cleanReq(o); if (!r) return false;
    if (r.vanPs && r.vanPs === myPs()) return false;
    var s = S();
    if (s.open.some(function (x) { return x.id === r.id; })) return false;
    s.open.unshift(r); save(s);
    if (!quiet) toast('Vraag om feedback van ' + r.van + ' ontvangen');
    return true;
  }
  function badge() {
    var f = document.getElementById('kma-quick-fab'); if (!f) return;
    var n = newCount() + openRequests().length;
    f.classList.toggle('has-new', n > 0);
    f.setAttribute('aria-label', 'Nieuw: snel toevoegen' + (n ? ' (' + n + ' nieuw van medecadetten)' : ''));
  }

  /* ---------------- Venster ---------------- */
  /** form: een formulier om in te typen. Dat sluit niet met een veeg (en heeft dus geen greepje), zodat je niets kwijtraakt. */
  function sheet(title, body, onClick, form) {
    var old = document.getElementById('kma-kam-ov'); if (old) old.remove();
    var ov = document.createElement('div'); ov.id = 'kma-kam-ov'; ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-kam' + (form ? ' kma-no-swipe' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' + (form ? '' : '<div class="kma-sheet-grip"></div>') + '<div class="kma-sheet-title">' + esc(title) + '</div><div class="kma-code-body">' + body + '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-x="close"]')) {
        // een half ingevuld formulier niet zomaar weggooien
        var typed = form && Array.prototype.some.call(ov.querySelectorAll('textarea'), function (t) { return t.value.trim(); });
        if (typed) kmaConfirm('Stoppen zonder te versturen? Wat je hebt getypt, is dan weg.', { ok: 'Stoppen', cancel: 'Verder typen', danger: true }).then(function (ok) { if (ok) close(); });
        else close();
        return;
      }
      if (onClick) onClick(e, ov);
    });
    function close() { stopScan(); ov.remove(); }
    ov.__kmaClose = close;
    setTimeout(function () { var f = ov.querySelector('input:not([type=radio]):not([type=checkbox]), textarea'); if (f && !('ontouchstart' in window)) try { f.focus({ preventScroll: true }); } catch (e) {} }, 60);
    return ov;
  }
  function closeSheet() { var ov = document.getElementById('kma-kam-ov'); if (ov) { stopScan(); ov.remove(); } }

  /* ---------------- Overzicht ---------------- */
  function open() {
    if (deel()) sync().then(openMenu, openMenu); else openMenu();
  }
  function openMenu() {
    if (document.getElementById('kma-kam-ov')) return;
    var left = leftThisWeek(), n = newCount(), reqs = openRequests(), mine = S().mine;
    var items = [{ section: 'Geven' },
      { icon: 'message', label: 'Feedback geven', hint: left ? 'Ongevraagd: nog ' + left + ' van ' + MAX_WEEK + ' deze week' : 'Je hebt deze week al ' + MAX_WEEK + ' keer ongevraagd feedback gegeven. Op een vraag kan altijd.', onClick: function () { if (!left) { toast('Deze week kun je geen ongevraagde feedback meer geven. Op een vraag van een medecadet kan het wel.', 'error'); return; } giveForm(null); } }];
    if (reqs.length) items.push({ icon: 'users', label: 'Vragen van medecadetten (' + reqs.length + ')', hint: 'Zij vragen jou om feedback', onClick: listRequests });
    items.push({ section: 'Vragen' },
      { icon: 'send', label: 'Feedback vragen', hint: 'Aan je hele groep of aan een paar medecadetten', onClick: askForm });
    if (mine.length) items.push({ icon: 'chart', label: 'Mijn vragen (' + mine.length + ')', hint: 'Antwoorden en samenvatting', onClick: listMine });
    items.push({ section: 'Ontvangen' },
      { icon: 'download', label: 'Ontvangen feedback' + (S().inbox.length ? ' (' + S().inbox.length + ')' : ''), hint: n ? n + ' nieuw' : 'Kaarten van medecadetten', onClick: listInbox },
      { icon: 'qr', label: 'QR-code scannen of bestand kiezen', hint: 'Een kaart of vraag van een medecadet binnenhalen', onClick: scanSheet },
      { icon: 'idea', label: 'Zo geef je goede feedback', hint: 'Datum, tijd, feit: gedrag, geen oordeel', onClick: uitleg });
    kmaSheet({ title: 'Feedback van en voor medecadetten', items: items });
  }

  /* ---------------- Feedback geven ---------------- */
  var BAD = /\b(altijd|nooit|je bent|jij bent|lui|dom|stom|irritant|arrogant|slecht|waardeloos|zielig|egoïst|egoistisch)\b/i;
  function v4Chips(sel) {
    return '<div class="kma-kam-chips" role="radiogroup" aria-label="Welke V past erbij? (optioneel)">' + V4.map(function (v) {
      return '<label class="kma-kam-chip"><input type="radio" name="kk-v4" value="' + v + '"' + (sel === v ? ' checked' : '') + '><span>' + v + '</span></label>';
    }).join('') + '</div>';
  }
  function giveForm(req, preset) {
    var d = deel();
    var after = function (list) {
      var aanHtml;
      if (req) aanHtml = '<p class="kma-kam-to">' + icon('user') + ' Aan <b>' + esc(req.van) + '</b>, op zijn of haar vraag' + (req.focus ? ': <i>' + esc(req.focus) + '</i>' : '') + '</p>';
      else if (list && list.length) aanHtml = '<label class="kma-code-lab">Aan wie?<select id="kk-aan"><option value="">Kies een medecadet…</option>' + list.map(function (p) { return '<option value="' + esc(p.ps) + '">' + esc(p.naam) + '</option>'; }).join('') + '<option value="__qr">Iemand anders (via QR-code of bestand)</option></select></label>' +
        '<label class="kma-code-lab kma-kam-other" hidden>Naam van je medecadet<input type="text" id="kk-naam" maxlength="60" autocomplete="off"></label>';
      else aanHtml = '<label class="kma-code-lab">Naam van je medecadet<input type="text" id="kk-naam" maxlength="60" autocomplete="off" placeholder="bijv. Noor de Vries"></label>';
      var p = preset || {};
      var body = aanHtml +
        '<label class="kma-code-lab">Situatie<input type="text" id="kk-sit" maxlength="140" value="' + esc(p.situatie || (req ? req.situatie : '')) + '" placeholder="bijv. Oefening Hei, verkenning dinsdag"></label>' +
        '<div class="kma-kam-row"><label class="kma-code-lab">Datum<input type="date" id="kk-d" value="' + esc(p.datum || today()) + '"></label><label class="kma-code-lab">Tijd<input type="time" id="kk-t" value="' + esc(p.tijd || nowTime()) + '"></label></div>' +
        '<label class="kma-code-lab">Wat zag of hoorde je? <small>Alleen gedrag, geen oordeel</small><textarea id="kk-feit" maxlength="500" rows="3" placeholder="bijv. Je gaf de opdracht zonder het doel te noemen. Twee mensen vroegen daarna wat de bedoeling was.">' + esc(p.feit || '') + '</textarea></label>' +
        '<details class="kma-ex"><summary>' + icon('idea') + 'Voorbeeld</summary><div class="kma-ex-good"><b>Goed</b> Bij het uitzetten van de wachten noemde je eerst het doel en de tijden, en vroeg je of iemand nog een vraag had.</div><div class="kma-ex-bad"><b>Minder goed</b> Je bent een goede leider.</div></details>' +
        '<label class="kma-code-lab">Wat was het effect? <small>Op jou, de groep of de taak</small><textarea id="kk-eff" maxlength="400" rows="2" placeholder="bijv. Iedereen wist meteen wat er moest gebeuren; we waren 5 minuten eerder klaar.">' + esc(p.effect || '') + '</textarea></label>' +
        '<div class="kma-code-lab">Welke V past erbij? <small>Optioneel</small>' + v4Chips(p.v4) + '</div>' +
        (window.KMALeary ? '<details class="kma-leary-open"><summary class="muted small">Roos van Leary (optioneel): welk gedrag zag je?</summary>' + KMALeary.picker('kk-leary', p.leary, 'Gedrag van je medecadet') + '</details>' : '') +
        '<div class="kma-code-lab">Soort feedback<div class="kma-kam-chips" role="radiogroup" aria-label="Soort feedback">' +
          '<label class="kma-kam-chip is-keep"><input type="radio" name="kk-soort" value="vasthouden"' + (p.soort !== 'verbeteren' ? ' checked' : '') + '><span>Vasthouden</span></label>' +
          '<label class="kma-kam-chip is-grow"><input type="radio" name="kk-soort" value="verbeteren"' + (p.soort === 'verbeteren' ? ' checked' : '') + '><span>Verbeteren</span></label></div></div>' +
        '<label class="kma-code-lab">Volgende stap <small>Verplicht: wat kan je medecadet de volgende keer doen?</small><textarea id="kk-tip" maxlength="400" rows="2" placeholder="bijv. Noem eerst het doel en de tijd, dan pas wie wat doet.">' + esc(p.tip || '') + '</textarea></label>' +
        (req ? '' : '<p class="muted small">' + icon('idea') + ' Ongevraagd: nog ' + leftThisWeek() + ' van ' + MAX_WEEK + ' deze week. Je medecadet ziet dat de kaart van jou komt.</p>') +
        '<p class="kma-code-err" id="kk-err" role="alert"></p>' +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-k="send">' + icon('send') + 'Versturen</button></div>';
      var ov = sheet(req ? 'Feedback op een vraag' : 'Feedback geven', body, function (e, ov) {
        if (e.target.closest('[data-k="send"]')) send(ov);
      }, true);
      var selAan = ov.querySelector('#kk-aan');
      if (selAan) selAan.addEventListener('change', function () { var o = ov.querySelector('.kma-kam-other'); if (o) o.hidden = selAan.value !== '__qr'; });
    };
    function send(ov) {
      var v = function (id) { var el = ov.querySelector(id); return el ? el.value.trim() : ''; };
      var err = ov.querySelector('#kk-err'); err.textContent = '';
      var feit = v('#kk-feit');
      var sel = ov.querySelector('#kk-aan'), viaPs = sel && sel.value && sel.value !== '__qr' ? sel.value : '';
      var target = viaPs && peopleCache ? peopleCache.find(function (p) { return p.ps === viaPs; }) : null;
      var naam = req ? req.van : target ? target.naam : v('#kk-naam');
      if (!req && !naam) { err.textContent = sel ? 'Kies aan wie je feedback geeft.' : 'Vul de naam van je medecadet in.'; return; }
      if (feit.length < 15) { err.textContent = 'Beschrijf wat je zag of hoorde (minstens één zin).'; return; }
      // 4.17.0 (M2, feed-forward): feedback werkt pas als er een volgende stap in staat (Hattie & Timperley 2007)
      if (v('#kk-tip').length < 10) { err.textContent = 'Geef één concrete volgende stap: wat kan je medecadet de volgende keer doen of vasthouden?'; return; }
      if (!req && leftThisWeek() <= 0) { err.textContent = 'Je hebt deze week al ' + MAX_WEEK + ' keer ongevraagd feedback gegeven.'; return; }
      if (!me()) { err.textContent = 'Vul eerst je naam in bij je profiel (hoofdstuk 0): je medecadet ziet van wie de feedback komt.'; return; }
      var soortEl = ov.querySelector('input[name="kk-soort"]:checked'), v4El = ov.querySelector('input[name="kk-v4"]:checked');
      var card = cleanCard({ type: 'kma-kameraad', id: uid(), van: me(), vanPs: myPs(), aan: naam, aanPs: req ? req.vanPs : viaPs, req: req ? req.id : '',
        datum: v('#kk-d'), tijd: v('#kk-t'), situatie: v('#kk-sit'), feit: feit, effect: v('#kk-eff'), v4: v4El ? v4El.value : '', soort: soortEl ? soortEl.value : 'vasthouden', tip: v('#kk-tip'), at: new Date().toISOString(), leary: window.KMALeary ? KMALeary.value(ov.querySelector('#kk-leary')) : null });
      var go = function () {
        var s = S(); s.sent.push({ id: card.id, week: week(), aan: card.aan, req: card.req, at: card.at }); if (s.sent.length > 200) s.sent = s.sent.slice(-200);
        if (req) s.open.forEach(function (r) { if (r.id === req.id) r.done = true; });
        save(s);
        var pubOf = target ? target.pub : (req && peopleCache ? (peopleCache.find(function (p) { return p.ps === req.vanPs; }) || {}).pub : '');
        var dm = deel();
        if (dm && pubOf && card.aanPs) {
          seal(JSON.stringify(card), pubOf).then(function (t) {
            if (!F.write(dm.base + 'post/' + card.aanPs + '/' + card.id + '.json', t)) throw new Error('schrijven');
            closeSheet(); toast('Verstuurd naar ' + card.aan + ' via de deelmap'); if (window.kmaCheck) kmaCheck(null);
          }).catch(function () { deliver(card); });
        } else deliver(card);
      };
      if (BAD.test(feit + ' ' + v('#kk-tip'))) {
        kmaConfirm('Klinkt dit als een oordeel?\n\nWoorden als "altijd", "nooit" of "je bent …" gaan over wie iemand is, niet over wat iemand deed. Beschrijf liever wat je zag of hoorde, dan kan je medecadet er iets mee.', { ok: 'Toch versturen', cancel: 'Aanpassen', danger: false }).then(function (ok) { if (ok) go(); });
      } else go();
    }
    if (d && !req) people().then(after, function () { after([]); }); else if (d && req) people().then(function () { after(null); }, function () { after(null); }); else after(null);
  }
  /** Versturen zonder deelmap: QR-code tonen of als bestand delen. */
  function deliver(obj, title) {
    pack(obj).then(function (t) {
      var isReq = obj.type === 'kma-kameraad-vraag';
      var body = '<p class="muted">' + (isReq ? 'Laat je medecadetten deze QR-code scannen (<b>+ Nieuw → Feedback van en voor medecadetten → QR-code scannen</b>), of deel de vraag als bestand.' :
          'Laat <b>' + esc(obj.aan) + '</b> deze QR-code scannen (<b>+ Nieuw → Feedback van en voor medecadetten → QR-code scannen</b>), of deel de kaart als bestand.') + '</p>' +
        '<div class="kma-koppel-qr" id="kk-qr" aria-label="QR-code"></div>' +
        (window.KMAX && KMAX.myCode() ? '<p class="muted small">' + icon('lock') + ' Versleuteld met de groepscode: alleen cadetten uit jouw groep kunnen dit openen.</p>' : '<p class="kma-code-err">Zonder groepscode is dit niet versleuteld. Koppel met je teamleider (⋮ → Koppelen met je teamleider) om veilig te delen.</p>') +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-k="file">' + icon('share') + 'Als bestand delen</button><button type="button" class="kma-icon-btn is-primary" data-x="close">Klaar</button></div>';
      var ov = sheet(title || (isReq ? 'Vraag versturen' : 'Kaart versturen'), body, function (e) {
        if (e.target.closest('[data-k="file"]')) {
          var name = isReq ? 'KMA_Feedbackvraag_' + (obj.van || 'cadet').replace(/[^A-Za-z0-9]+/g, '_') + '.json' : 'KMA_Feedback_voor_' + (obj.aan || 'medecadet').replace(/[^A-Za-z0-9]+/g, '_') + '.json';
          if (window.kmaShareFile) kmaShareFile(name, t); else toast('Delen werkt hier niet', 'error');
        }
      });
      var box = ov.querySelector('#kk-qr');
      try { new QRCode(box, { text: PREFIX + ascii(t), width: 260, height: 260, colorDark: '#000000', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.L }); }
      catch (e) { box.innerHTML = '<p class="muted small">Te veel tekst voor een QR-code. Deel de kaart als bestand.</p>'; }
      if (!isReq && window.kmaCheck) kmaCheck(null);
    });
  }

  /* ---------------- Feedback vragen ---------------- */
  function askForm() {
    var d = deel();
    var after = function (list) {
      var aan = d ? '<div class="kma-code-lab">Aan wie?<div class="kma-kam-chips" role="radiogroup" aria-label="Aan wie?">' +
          '<label class="kma-kam-chip"><input type="radio" name="kk-wie" value="groep" checked><span>Hele groep</span></label>' +
          (list.length ? '<label class="kma-kam-chip"><input type="radio" name="kk-wie" value="kies"><span>Een paar medecadetten</span></label>' : '') + '</div></div>' +
          (list.length ? '<div class="kma-kam-pick" hidden>' + list.map(function (p) { return '<label class="kma-kam-check"><input type="checkbox" value="' + esc(p.ps) + '"><span>' + esc(p.naam) + '</span></label>'; }).join('') + '</div>' : '') +
          '<p class="muted small">' + icon('idea') + ' Tip: een paar mensen persoonlijk vragen levert meestal meer en betere antwoorden op dan de hele groep.</p>'
        : '<p class="muted small">' + icon('idea') + ' Je verstuurt de vraag met een QR-code of als bestand (bijvoorbeeld in de groepsapp). Met een gekoppelde deelmap komt de vraag vanzelf bij je medecadetten.</p>';
      var body = '<label class="kma-code-lab">Situatie<input type="text" id="kk-sit" maxlength="140" placeholder="bijv. Mijn leiding tijdens de oefening van dinsdag"></label>' +
        '<label class="kma-code-lab">Waarop wil je feedback? <small>Eén of twee punten</small><input type="text" id="kk-focus" maxlength="200" placeholder="bijv. Hoe ik opdrachten gaf en of ik luisterde"></label>' +
        '<label class="kma-code-lab">Graag vóór<input type="date" id="kk-tot" value="' + plusDays(7) + '" min="' + today() + '"></label>' + aan +
        '<p class="kma-code-err" id="kk-err" role="alert"></p>' +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-k="ask">' + icon('send') + 'Vraag versturen</button></div>';
      var ov = sheet('Feedback vragen', body, function (e, ov) {
        if (!e.target.closest('[data-k="ask"]')) return;
        var v = function (id) { var el = ov.querySelector(id); return el ? el.value.trim() : ''; };
        var err = ov.querySelector('#kk-err'); err.textContent = '';
        if (!v('#kk-sit')) { err.textContent = 'Beschrijf de situatie waarover je feedback wilt.'; return; }
        if (!me()) { err.textContent = 'Vul eerst je naam in bij je profiel (hoofdstuk 0).'; return; }
        var wie = ov.querySelector('input[name="kk-wie"]:checked'), aanL = 'groep';
        if (wie && wie.value === 'kies') {
          aanL = Array.prototype.map.call(ov.querySelectorAll('.kma-kam-pick input:checked'), function (c) { return c.value; });
          if (!aanL.length) { err.textContent = 'Kies minstens één medecadet.'; return; }
        }
        var r = cleanReq({ type: 'kma-kameraad-vraag', id: uid(), van: me(), vanPs: myPs(), groep: d ? d.groep : '', situatie: v('#kk-sit'), focus: v('#kk-focus'), tot: v('#kk-tot') || plusDays(7), aan: aanL, at: new Date().toISOString() });
        var s = S(); s.mine.unshift({ id: r.id, situatie: r.situatie, focus: r.focus, tot: r.tot, aan: r.aan, at: r.at, answers: [] }); save(s);
        if (d) {
          pack(r).then(function (t) {
            if (!F.write(d.base + 'vragen/' + r.id + '.json', t)) throw new Error('schrijven');
            closeSheet(); toast(aanL === 'groep' ? 'Je vraag staat klaar voor je hele groep' : 'Je vraag is verstuurd naar ' + aanL.length + (aanL.length === 1 ? ' medecadet' : ' medecadetten'));
          }).catch(function () { deliver(r); });
        } else deliver(r);
      }, true);
      ov.addEventListener('change', function (e) {
        if (e.target.name === 'kk-wie') { var p = ov.querySelector('.kma-kam-pick'); if (p) p.hidden = e.target.value !== 'kies'; }
      });
    };
    if (d) people().then(after, function () { after([]); }); else after([]);
  }

  /* ---------------- Lijsten ---------------- */
  function cardHtml(c, full) {
    return '<div class="kma-kam-card ' + (c.soort === 'verbeteren' ? 'is-grow' : 'is-keep') + '">' +
      '<div class="kma-kam-head"><strong>' + esc(c.van) + '</strong><span>' + esc(fmtDate(c.datum)) + (c.tijd ? ' · ' + esc(c.tijd) : '') + '</span></div>' +
      (c.situatie ? '<div class="kma-kam-sit">' + esc(c.situatie) + '</div>' : '') +
      '<p class="kma-kam-feit">' + esc(full ? c.feit : (c.feit.length > 110 ? c.feit.slice(0, 110) + '…' : c.feit)) + '</p>' +
      (full && c.effect ? '<p><b>Effect</b> ' + esc(c.effect) + '</p>' : '') +
      (full && c.tip ? '<p><b>Volgende stap</b> ' + esc(c.tip) + '</p>' : '') +
      '<div class="kma-kam-tags"><span class="kma-kam-tag ' + (c.soort === 'verbeteren' ? 'is-grow' : 'is-keep') + '">' + (c.soort === 'verbeteren' ? 'Verbeteren' : 'Vasthouden') + '</span>' +
      (c.v4 ? '<span class="kma-kam-tag">' + esc(c.v4) + '</span>' : '') + (c.leary && window.KMALeary ? '<span class="kma-kam-tag">Roos: ' + esc(KMALeary.label(c.leary)) + '</span>' : '') + (c.req ? '<span class="kma-kam-tag">Op jouw vraag</span>' : '') + (c.nieuw ? '<span class="kma-kam-tag is-new">nieuw</span>' : '') + (c.inDtf ? '<span class="kma-kam-tag">In je DTF-logboek</span>' : '') + '</div></div>';
  }
  function listInbox() {
    var l = S().inbox;
    var body = l.length ? '<div class="kma-kam-list">' + l.map(function (c) { return '<button type="button" class="kma-kam-item" data-card="' + esc(c.id) + '">' + cardHtml(c, false) + '</button>'; }).join('') + '</div>'
      : (window.kmaEmpty ? kmaEmpty({ icon: 'message', title: 'Nog geen feedback van medecadetten', text: 'Vraag je groep om feedback, of scan de QR-code van een medecadet.', small: true }) : '<p class="muted">Nog geen feedback van medecadetten.</p>');
    body += '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Sluiten</button></div>';
    sheet('Ontvangen feedback', body, function (e) { var b = e.target.closest('[data-card]'); if (b) showCard(b.getAttribute('data-card')); });
  }
  function showCard(id) {
    var s = S(), c = s.inbox.find(function (x) { return x.id === id; }); if (!c) return;
    if (c.nieuw) { c.nieuw = false; save(s); }
    var body = cardHtml(c, true) +
      '<div class="kma-kam-actie"><label class="kma-code-lab">Wat ga je ermee doen? <small>Eén zin; zonder deze stap verandert er weinig</small><textarea id="kk-actie" maxlength="300" rows="2" placeholder="bijv. Bij de volgende opdracht noem ik eerst het doel.">' + esc(c.actie || '') + '</textarea></label>' +
        (window.kmaPlannen ? '<label class="kma-check"><input type="checkbox" id="kk-actie-plan"> Maak er een als-dan-plan van</label><div class="kma-kam-plan" hidden><label class="kma-code-lab">Als …<input type="text" id="kk-actie-als" maxlength="160" value="' + esc(c.situatie || '') + '"></label></div>' : '') +
        '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-k="actie">' + icon('check') + 'Opslaan</button></div></div>' +
      '<p class="muted small">' + icon('lock') + ' Deze kaart is alleen van jou. Je teamleider ziet hem pas als je hem in je DTF-logboek zet en dat hoofdstuk deelt.</p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-k="del">' + icon('trash') + 'Verwijderen</button>' +
      (c.inDtf ? '' : '<button type="button" class="kma-icon-btn is-primary" data-k="dtf">' + icon('calendar') + 'In mijn DTF-logboek</button>') + '</div>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-k="back">Terug naar het postvak</button></div>';
    sheet('Feedback van ' + c.van, body, function (e) {
      if (e.target.closest('[data-k="back"]')) { listInbox(); return; }
      if (e.target.closest('[data-k="dtf"]')) { toDtf(c.id); return; }
      if (e.target.id === 'kk-actie-plan') { var pl = e.target.closest('.kma-kam-actie').querySelector('.kma-kam-plan'); if (pl) pl.hidden = !e.target.checked; return; }
      if (e.target.closest('[data-k="actie"]')) {
        var box = e.target.closest('.kma-kam-actie'), txt = String(box.querySelector('#kk-actie').value || '').trim();
        if (!txt) { toast('Schrijf in één zin wat je ermee gaat doen', 'error'); return; }
        var pc = box.querySelector('#kk-actie-plan'), planOk = false;
        if (pc && pc.checked) { planOk = kmaPlannen.add({ als: box.querySelector('#kk-actie-als').value, dan: txt, from: 'feedback medecadet' }); if (!planOk) return; }
        var s4 = S(); s4.inbox.forEach(function (x) { if (x.id === c.id) { x.actie = txt; x.actieAt = new Date().toISOString(); } }); save(s4);
        toast('Opgeslagen' + (planOk ? ', met een als-dan-plan' : ''));
        return;
      }
      if (e.target.closest('[data-k="del"]')) {
        var snap = JSON.stringify(S().inbox), s2 = S(); s2.inbox = s2.inbox.filter(function (x) { return x.id !== c.id; }); save(s2); listInbox();
        if (window.kmaUndoToast) kmaUndoToast('Kaart verwijderd', function () { var s3 = S(); s3.inbox = JSON.parse(snap); save(s3); });
      }
    });
  }
  function toDtf(id) {
    var s = S(), c = s.inbox.find(function (x) { return x.id === id; }); if (!c || typeof dtfItems === 'undefined') return;
    var feit = 'Feedback van ' + c.van + ' (' + (c.soort === 'verbeteren' ? 'verbeteren' : 'vasthouden') + ')' + (c.situatie ? ', ' + c.situatie : '') + ': ' + c.feit +
      (c.effect ? ' Effect: ' + c.effect : '') + (c.tip ? ' Tip: ' + c.tip : '');
    dtfItems.unshift({ id: Date.now(), datum: c.datum || today(), tijd: c.tijd || '', feit: feit, vValues: c.v4 ? [c.v4] : [], aspect: 'Feedback van een medecadet', bron: 'medecadet', leary: c.leary || undefined });
    try { kmaStore.setItem(DTF_KEY, JSON.stringify(dtfItems)); } catch (e) {}
    if (typeof dbSet === 'function') dbSet(DTF_KEY, dtfItems);
    c.inDtf = true; save(s);
    if (typeof renderWidgets === 'function') renderWidgets();
    if (typeof updateProgress === 'function') updateProgress();
    toast('Staat in je DTF-logboek'); showCard(id);
  }
  function listRequests() {
    var l = openRequests();
    var body = l.length ? '<div class="kma-kam-list">' + l.map(function (r) {
      return '<button type="button" class="kma-kam-item" data-req="' + esc(r.id) + '"><div class="kma-kam-card"><div class="kma-kam-head"><strong>' + esc(r.van) + '</strong><span>' + (r.tot ? 'vóór ' + esc(fmtDate(r.tot)) : '') + '</span></div>' +
        '<div class="kma-kam-sit">' + esc(r.situatie) + '</div>' + (r.focus ? '<p class="kma-kam-feit">' + esc(r.focus) + '</p>' : '') + '<div class="kma-kam-tags"><span class="kma-kam-tag is-new">Geef feedback</span></div></div></button>';
    }).join('') + '</div>' : '<p class="muted">Er staan geen vragen open.</p>';
    body += '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Sluiten</button></div>';
    sheet('Vragen van medecadetten', body, function (e) {
      var b = e.target.closest('[data-req]'); if (!b) return;
      var r = S().open.find(function (x) { return x.id === b.getAttribute('data-req'); }); if (r) giveForm(r);
    });
  }
  function listMine() {
    var s = S();
    var body = s.mine.length ? '<div class="kma-kam-list">' + s.mine.map(function (r) {
      var n = s.inbox.filter(function (c) { return c.req === r.id; }).length;
      return '<button type="button" class="kma-kam-item" data-mine="' + esc(r.id) + '"><div class="kma-kam-card"><div class="kma-kam-head"><strong>' + esc(r.situatie) + '</strong><span>' + (r.tot ? 'tot ' + esc(fmtDate(r.tot)) : '') + '</span></div>' +
        '<div class="kma-kam-tags"><span class="kma-kam-tag">' + (r.aan === 'groep' ? 'Hele groep' : (Array.isArray(r.aan) ? r.aan.length + ' medecadetten' : 'QR-code of bestand')) + '</span><span class="kma-kam-tag ' + (n ? 'is-keep' : '') + '">' + n + (n === 1 ? ' antwoord' : ' antwoorden') + '</span></div></div></button>';
    }).join('') + '</div>' : '<p class="muted">Je hebt nog geen feedback gevraagd.</p>';
    body += '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-x="close">Sluiten</button></div>';
    sheet('Mijn vragen', body, function (e) { var b = e.target.closest('[data-mine]'); if (b) summary(b.getAttribute('data-mine')); });
  }
  function summary(id) {
    var s = S(), r = s.mine.find(function (x) { return x.id === id; }); if (!r) return;
    var cs = s.inbox.filter(function (c) { return c.req === id; });
    var keep = cs.filter(function (c) { return c.soort !== 'verbeteren'; }).length, grow = cs.length - keep;
    var v4 = {}; cs.forEach(function (c) { if (c.v4) v4[c.v4] = (v4[c.v4] || 0) + 1; });
    var body = '<div class="kma-kam-sit">' + esc(r.situatie) + (r.focus ? ' · ' + esc(r.focus) : '') + '</div>' +
      (cs.length ? '<div class="kma-kam-sum"><div><b>' + cs.length + '</b><span>' + (cs.length === 1 ? 'antwoord' : 'antwoorden') + '</span></div><div class="is-keep"><b>' + keep + '</b><span>vasthouden</span></div><div class="is-grow"><b>' + grow + '</b><span>verbeteren</span></div></div>' +
        (Object.keys(v4).length ? '<p class="muted small">Genoemde V\'s: ' + Object.keys(v4).sort(function (a, b) { return v4[b] - v4[a]; }).map(function (k) { return esc(k) + ' (' + v4[k] + '×)'; }).join(', ') + '</p>' : '') +
        '<div class="kma-kam-list">' + cs.map(function (c) { return '<button type="button" class="kma-kam-item" data-card="' + esc(c.id) + '">' + cardHtml(c, false) + '</button>'; }).join('') + '</div>'
        : '<p class="muted">Nog geen antwoorden. ' + (r.tot ? 'Je vraag staat open tot ' + esc(fmtDate(r.tot)) + '.' : '') + '</p>') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-k="qr">' + icon('qr') + 'Vraag opnieuw tonen</button><button type="button" class="kma-icon-btn" data-k="back">Terug</button></div>';
    sheet('Antwoorden op je vraag', body, function (e) {
      var b = e.target.closest('[data-card]'); if (b) { showCard(b.getAttribute('data-card')); return; }
      if (e.target.closest('[data-k="back"]')) { listMine(); return; }
      if (e.target.closest('[data-k="qr"]')) deliver({ type: 'kma-kameraad-vraag', v: 1, id: r.id, van: me(), vanPs: myPs(), situatie: r.situatie, focus: r.focus, tot: r.tot, aan: r.aan, at: r.at });
    });
  }
  function uitleg() {
    var body = '<ol class="kma-kam-uitleg">' +
      '<li><b>Datum en tijd.</b> Wanneer gebeurde het? Hoe sneller na het moment, hoe beter.</li>' +
      '<li><b>Feit: gedrag, geen oordeel.</b> Wat zag of hoorde je precies? "Je gaf de opdracht zonder het doel te noemen", niet "je bent onduidelijk".</li>' +
      '<li><b>Effect.</b> Wat deed het met jou, de groep of de taak?</li>' +
      '<li><b>Vasthouden of verbeteren.</b> Geef ook feedback op wat goed gaat; dat is net zo nuttig.</li>' +
      '<li><b>Eén tip.</b> Wat zou je de volgende keer doen? Kort en concreet.</li></ol>' +
      '<p class="muted small">Ongevraagd geef je hooguit ' + MAX_WEEK + ' keer per week feedback. Op een vraag van een medecadet kan het altijd. Je feedback is niet anoniem: je medecadet ziet van wie hij komt.</p>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn is-primary" data-x="close">Begrepen</button></div>';
    sheet('Zo geef je goede feedback', body);
  }

  /* ---------------- Scannen en bestanden ---------------- */
  var scanner = null;
  function stopScan() { var sc = scanner; scanner = null; if (sc) { try { sc.stop().then(function () { try { sc.clear(); } catch (e) {} }, function () {}); } catch (e) {} } }
  function accept(text) {
    var t = String(text || '').trim();
    if (t.indexOf(PREFIX) === 0) t = t.slice(PREFIX.length);
    return unpack(t).then(function (o) {
      if (o && o.type === 'kma-kameraad') {
        if (o.vanPs && o.vanPs === myPs()) { toast('Dit is je eigen kaart', 'error'); return false; }
        if (!addCard(o, true)) { toast('Deze kaart heb je al', 'error'); return false; }
        closeSheet(); showCard(cleanCard(o).id); toast('Feedback van ' + clip(o.van, 60) + ' ontvangen'); return true;
      }
      if (o && o.type === 'kma-kameraad-vraag') {
        var r = cleanReq(o); if (!r) return false;
        if (r.vanPs && r.vanPs === myPs()) { toast('Dit is je eigen vraag', 'error'); return false; }
        addRequest(r, true); closeSheet();
        kmaConfirm(r.van + ' vraagt je om feedback:\n\n' + r.situatie + (r.focus ? '\n' + r.focus : '') + '\n\nNu feedback geven?', { ok: 'Feedback geven', cancel: 'Later', danger: false }).then(function (ok) { if (ok) giveForm(r); });
        return true;
      }
      toast('Dit is geen feedback van een medecadet', 'error'); return false;
    }, function (e) {
      toast(e && e.message === 'code' ? 'Deze feedback is versleuteld met een andere groepscode' : 'Dit kan niet worden gelezen', 'error'); return false;
    });
  }
  function scanSheet() {
    var body = '<p class="muted">Scan de QR-code op het scherm van je medecadet, of kies een bestand dat je kreeg.</p>' +
      '<div id="kk-reader" class="kma-koppel-reader"></div>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-k="file">' + icon('folder') + 'Bestand kiezen</button><button type="button" class="kma-icon-btn is-primary" data-k="scan">' + icon('qr') + 'Scan QR-code</button></div>';
    sheet('Binnenhalen', body, function (e, ov) {
      if (e.target.closest('[data-k="file"]')) { pickFile(); return; }
      if (!e.target.closest('[data-k="scan"]')) return;
      if (!window.Html5Qrcode) { toast('De scanner kan niet worden geladen', 'error'); return; }
      try { if (window.Android && window.Android.requestCameraPermission) window.Android.requestCameraPermission(); } catch (x) {}
      stopScan();
      var reader = ov.querySelector('#kk-reader'); reader.classList.add('on');
      var sc = new Html5Qrcode('kk-reader'); scanner = sc;
      var cfg = { fps: 10, qrbox: { width: 240, height: 240 } }, done = false;
      var ok = function (t) { if (done) return; done = true; stopScan(); accept(t); };
      sc.start({ facingMode: 'environment' }, cfg, ok, function () {}).catch(function () { return sc.start({ facingMode: 'user' }, cfg, ok, function () {}); })
        .catch(function () { reader.classList.remove('on'); toast('De camera kan niet starten. Kies een bestand.', 'error'); });
    });
  }
  function pickFile() {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,.kma,application/json'; inp.style.display = 'none';
    inp.addEventListener('change', function () {
      var f = inp.files && inp.files[0]; inp.remove(); if (!f) return;
      f.text().then(accept);
    });
    document.body.appendChild(inp); inp.click();
  }
  // Een kaart of vraag die via "Back-up terugzetten" wordt gekozen, wordt herkend (in plaats van als back-up gelezen).
  if (typeof importBackupFile === 'function') {
    var origImport = importBackupFile;
    window.importBackupFile = importBackupFile = function (event) {
      var f = event && event.target && event.target.files && event.target.files[0];
      if (!f) return origImport.apply(this, arguments);
      var self = this, args = arguments, ev = { target: { files: [f], value: '' } };
      f.text().then(function (t) {
        var mine = /"type"\s*:\s*"kma-kameraad/.test(t.slice(0, 400)) || /"kind"\s*:\s*"kameraad"/.test(t);
        if (mine) { accept(t); return; }
        origImport.call(self, ev);
      }, function () { origImport.apply(self, args); });
    };
  }

  /* ---------------- Start ---------------- */
  window.kmaKameraad = { open: open, give: giveForm, ask: askForm, inbox: listInbox, scan: scanSheet, accept: accept, sync: sync, left: leftThisWeek, newCount: newCount, requests: openRequests, people: people, _S: S };
  badge();
  setTimeout(function () { sync().then(badge); }, 4000);
  setInterval(function () { if (!document.hidden) sync().then(badge); }, 120000);
})();
