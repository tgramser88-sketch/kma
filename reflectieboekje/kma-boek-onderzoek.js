/*
 * Reflectieboekje: meedoen aan het onderzoek (blok B stap 2, blok F). Proof of concept.
 * Menu ⋮ → Onderzoek. Zonder sleutel van de onderzoeker gebeurt er niets: geen vraag, geen melding, niets verzameld.
 *  1. De cadet plakt de onderzoekssleutel (of kiest het sleutelbestand) en vergelijkt de vingerafdruk met de onderzoeker.
 *  2. Toestemming: uitleg wat wel en niet meegaat, vrijwillig, altijd te stoppen. Daarna een willekeurige onderzoekscode.
 *  3. "Gegevens versturen" bouwt een record zonder namen, Peoplesoft-nummers of vrije tekst (KMAOnderzoek.check), versleutelt
 *     het met de sleutel van de onderzoeker en zet het in de deelmap (onderzoek/inbox/) of bewaart het als bestand.
 * Stoppen: sleutel en code verwijderen. De code reist mee met kaarten aan medecadetten (veld oc), voor de paaranalyse (H8).
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
/* global dtfItems, hexacoSelfAnswers, hexacoQuestionsSelf */
(function () {
  'use strict';
  var O = window.KMAOnderzoek; if (!O) return;
  var K = 'kma-x-onderzoek';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var icon = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
  function toast(m, t) { if (window.kmaToast) kmaToast(m, t); }
  function S() { try { var o = JSON.parse(kmaStore.getItem(K) || 'null'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function setS(o) { kmaStore.setItem(K, JSON.stringify(o)); }
  function actief() { var s = S(); return !!(s.key && s.code && s.akkoord); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function getX(k, d) { try { var v = kmaStore.getItem('kma-x-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function gemiddeld(a) { return a.length ? Math.round(a.reduce(function (x, y) { return x + y; }, 0) / a.length * 100) / 100 : null; }

  /* ---------------- Het record ---------------- */
  function bronVan(d) { return d.bron === 'medecadet' ? 'medecadet' : 'zelf'; }
  function bouw() {
    var s = S(), mm = O.meetmoment(today()), L = window.KMALeary, D = window.KMADatapunten;
    var qs = typeof hexacoQuestionsSelf !== 'undefined' ? hexacoQuestionsSelf : [], ans = typeof hexacoSelfAnswers !== 'undefined' ? hexacoSelfAnswers : {};
    var rec = { type: 'kma-onderzoek', v: 1, bron: 'boekje', code: s.code, jaar: mm.jaar, moment: mm.moment, maand: O.maand(today()), app: String(window.KMA_APPVERSIE || '0.0.0') };
    if (s.groep) rec.groep = s.groep;
    // Persoonlijkheid (IPIP-HEXACO-96): antwoorden per stelling (voor alfa en omega), domeinen 0-100 en facetten 1-5
    var items = qs.map(function (q) { var a = Number(ans[q.id]); return a >= 1 && a <= 5 ? a : null; });
    if (items.some(function (x) { return x != null; })) {
      rec.set = 'ipip-hexaco-96';
      // Antwoorden per stelling (voor alfa en omega) alleen bij een volledig ingevulde test
      if (items.every(function (x) { return x != null; })) rec.items = items;
      var H = window.KMAHex;
      if (H) { var sc = H.plain(H.score(ans, qs)); rec.domein = {}; O.TR.forEach(function (t) { if (sc[t] != null) rec.domein[t] = sc[t]; }); }
      var fac = {};
      qs.forEach(function (q) { var a = Number(ans[q.id]); if (!(a >= 1 && a <= 5) || O.FACETS.indexOf(q.facet) < 0) return; (fac[q.facet] = fac[q.facet] || []).push(q.reversed ? 6 - a : a); });
      rec.facet = {}; Object.keys(fac).forEach(function (f) { rec.facet[f] = gemiddeld(fac[f]); });
      try { if (H && H.analyse) { var an = H.analyse(H.plain(H.score(ans, qs)), null); rec.sterktes = (an.quadrants.s || []).map(function (x) { return x.trait && x.trait.key; }).filter(function (k) { return O.TR.indexOf(k) >= 0; }).slice(0, 6); } } catch (e) {}
    }
    // Roos van Leary: per moment de asscores, bron en maand (geen tekst)
    rec.leary = [];
    (Array.isArray(dtfItems) ? dtfItems : []).forEach(function (d) {
      var l = d && L ? L.clean(d.leary) : null; if (!l || d.bron === 'medecadet') return;   // medecadetten: via de kaarten
      var p = D ? D.vanDtf(d) : null, x = { bron: bronVan(d), b: l.b, s: l.s, maand: O.maand(d.datum) };
      if (p && p.v.length === 1) x.v = p.v[0];
      if (d.oc && O.CODE_RE.test(d.oc)) x.gever = d.oc;
      rec.leary.push(x);
    });
    // Feedback van medecadetten: per kaart V, soort, volgende stap en actie (ja/nee), asscores en de code van de gever
    rec.kaarten = [];
    try {
      (window.kmaKameraad ? kmaKameraad._S().inbox || [] : []).forEach(function (c) {
        if (!c) return;
        var k = { soort: c.soort === 'verbeteren' ? 'verbeteren' : 'vasthouden', stap: String(c.tip || '').trim() ? 1 : 0, actie: String(c.actie || '').trim() ? 1 : 0, maand: O.maand(c.datum || c.at) };
        if (O.V4.indexOf(c.v4) >= 0) k.v = c.v4;
        var l = L ? L.clean(c.leary) : null; if (l) { k.b = l.b; k.s = l.s; }
        if (c.oc && O.CODE_RE.test(c.oc)) k.gever = c.oc;
        rec.kaarten.push(k);
      });
    } catch (e) {}
    // 4V's: aantal datapunten per bron
    rec.v4 = {};
    O.V4.forEach(function (v) { rec.v4[v] = { zelf: 0, medecadet: 0, staf: 0 }; });
    (Array.isArray(dtfItems) ? dtfItems : []).forEach(function (d) { var p = D ? D.vanDtf(d) : null; if (!p) return; p.v.forEach(function (v) { if (rec.v4[v]) rec.v4[v][bronVan(d)]++; }); });
    // Zelfbeoordeling en beoordeling door de teamleider: de laatste in dit meetmoment
    try {
      var g = window.kmaGroeiData ? window.kmaGroeiData() : null;
      var inMM = function (x) { var m = O.meetmoment(x.date); return m && m.jaar === mm.jaar && m.moment === mm.moment; };
      var last = function (list) { var l = (list || []).filter(inMM); return l[l.length - 1] || null; };
      var zb = g && last(g.self), tb = g && last(g.tl);
      if (zb) { rec.zelfbeoordeling = {}; O.V4.forEach(function (v, i) { if (zb.vals[i] != null && isFinite(zb.vals[i])) rec.zelfbeoordeling[v] = Number(zb.vals[i]); }); }
      if (tb) { rec.beoordeling = {}; O.V4.forEach(function (v, i) { if (tb.vals[i] != null && isFinite(tb.vals[i])) rec.beoordeling[v] = Number(tb.vals[i]); }); }
    } catch (e) {}
    if (s.bruikbaar) { rec.bruikbaar = {}; ['norm', 'schaal', 'roos'].forEach(function (k) { if (s.bruikbaar[k] >= 1 && s.bruikbaar[k] <= 5) rec.bruikbaar[k] = s.bruikbaar[k]; }); }
    return rec;
  }

  /* ---------------- Versturen ---------------- */
  function verstuur() {
    var s = S(); if (!actief()) return Promise.reject(new Error('Niet actief'));
    var rec = bouw(), err = O.check(rec);
    if (err.length) { toast('Niet verstuurd: ' + err[0], 'error'); return Promise.reject(new Error(err.join('; '))); }
    return O.seal(rec, s.key).then(function (txt) {
      var naam = s.code + '-' + rec.jaar + '-' + rec.moment + '-' + Date.now() + '.json', fs = window.kmaDeelFS, waar = '';
      if (fs && fs.ok() && fs.write('onderzoek/inbox/' + naam, txt)) waar = 'deelmap';
      else if (typeof window.downloadTextFile === 'function') { window.downloadTextFile(txt, 'KMA-onderzoek-' + naam); waar = 'bestand'; }
      s = S(); (s.verzonden = s.verzonden || []).push({ at: new Date().toISOString(), jaar: rec.jaar, moment: rec.moment, waar: waar }); s.verzonden = s.verzonden.slice(-20); setS(s);
      toast(waar === 'deelmap' ? 'Versleuteld in de deelmap gezet' : 'Versleuteld bestand gemaakt: geef het aan de onderzoeker');
      return { rec: rec, txt: txt, waar: waar };
    });
  }

  /* ---------------- Scherm ---------------- */
  var ov = null;
  function close() { if (ov) { ov.remove(); ov = null; } }
  function scherm() {
    var s = S();
    if (!s.key) return '<p>Doe je mee aan onderzoek van de KMA naar persoonlijkheid, gedrag en de 4V\'s? Dat kan alleen als de onderzoeker je een <b>onderzoekssleutel</b> geeft. Zonder sleutel verzamelt het boekje niets.</p>' +
      '<label class="kma-field"><span>Onderzoekssleutel (begint met KMAO1.)</span><textarea id="ok-key" rows="4" spellcheck="false" autocomplete="off" placeholder="KMAO1.…"></textarea></label>' +
      '<div class="kma-row-btns"><label class="kma-icon-btn">' + icon('folder') + 'Uit bestand<input type="file" id="ok-file" accept=".txt,.json,text/plain" hidden></label><button type="button" class="kma-icon-btn is-primary" data-ok="key">Sleutel controleren</button></div><p class="kma-code-err" role="alert"></p>';
    if (!s.akkoord) return '<p class="small">Vingerafdruk van de sleutel: <b class="kma-ok-fp">' + esc(s.fp) + '</b>. Vergelijk die met wat de onderzoeker je laat zien. Klopt hij niet, stop dan.</p>' +
      '<div class="kma-ok-box"><p><b>Wat gaat er mee</b></p><ul class="small"><li>Een willekeurige onderzoekscode, het opleidingsjaar en het meetmoment (begin, midden of eind)</li><li>Je antwoorden op de persoonlijkheidstest (IPIP) en de scores</li><li>Plekken op de roos van Leary (alleen de getallen), met de bron: jijzelf, een medecadet of staf</li><li>Aantallen datapunten per V, en per feedbackkaart: V, soort en of er een volgende stap en een actie bij stond</li><li>Je zelfbeoordeling en de beoordeling van je teamleider (alleen de cijfers per V)</li></ul>' +
      '<p><b>Wat gaat er nooit mee</b></p><ul class="small"><li>Je naam, Peoplesoft- of registratienummer</li><li>Wat je opschrijft (geen enkele tekst)</li><li>Fitheid, stress en welzijn</li></ul></div>' +
      '<p class="small">Meedoen is vrijwillig. Je kunt op elk moment stoppen; dan verstuurt het boekje niets meer. De uitkomsten worden niet gebruikt voor beslissingen over jou, zoals je beoordeling.</p>' +
      '<label class="kma-check"><input type="checkbox" id="ok-ja"> Ik doe vrijwillig mee en weet dat ik kan stoppen.</label>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-ok="stop">Niet meedoen</button><button type="button" class="kma-icon-btn is-primary" data-ok="akkoord">Akkoord</button></div><p class="kma-code-err" role="alert"></p>';
    var mm = O.meetmoment(today()), last = (s.verzonden || []).slice(-1)[0], b = s.bruikbaar || {};
    var rate = function (k, vraag) { return '<div class="kma-field"><span>' + vraag + '</span><div class="kma-chips">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" class="kma-chip-btn' + (b[k] === n ? ' on' : '') + '" data-ok-r="' + k + '|' + n + '" aria-pressed="' + (b[k] === n) + '">' + n + '</button>'; }).join('') + '</div></div>'; };
    var rec = bouw();
    return '<p>Je doet mee. Je onderzoekscode: <b class="kma-ok-code">' + esc(s.code) + '</b></p>' +
      '<p class="small">Meetmoment nu: <b>' + mm.moment + '</b> van het opleidingsjaar ' + mm.jaar + '-' + (mm.jaar + 1) + '. ' + (last ? 'Laatst verstuurd: ' + esc(String(last.at).slice(0, 10)) + ' (' + esc(last.moment) + ').' : 'Nog niets verstuurd.') + '</p>' +
      '<p class="small">Klaar om te versturen: ' + (rec.items ? 'persoonlijkheidstest volledig' : 'persoonlijkheidstest nog niet volledig') + ', ' + rec.leary.length + ' plekken op de roos, ' + rec.kaarten.length + ' feedbackkaarten' + (rec.beoordeling ? ', beoordeling' : '') + '.</p>' +
      '<details class="kma-ex"><summary>' + icon('idea') + 'Hoe bruikbaar vind je … (1 = niet, 5 = heel)</summary>' +
      rate('norm', 'de vergelijking van je test met andere KMA-cadetten?') + rate('schaal', 'de scores op de vaste schaal (0-100)?') + rate('roos', 'de roos van Leary?') + '</details>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-ok="stop">Stoppen met meedoen</button><button type="button" class="kma-icon-btn is-primary" data-ok="send">' + icon('share') + 'Gegevens versturen</button></div>' +
      '<p class="muted small">Versleuteld met de sleutel van de onderzoeker (vingerafdruk ' + esc(s.fp) + '). Alleen de onderzoeker kan het openen.</p>';
  }
  function teken() { if (!ov) return; ov.querySelector('.kma-code-body').innerHTML = scherm(); }
  function zetSleutel(txt) {
    var e = ov.querySelector('.kma-code-err');
    return O.checkKey(txt).then(function (ok) {
      if (!ok) { if (e) e.textContent = 'Dit is geen geldige onderzoekssleutel.'; return; }
      return O.fingerprint(txt).then(function (fp) { var s = S(); s.key = String(txt).replace(/\s+/g, ''); s.fp = fp; setS(s); teken(); });
    });
  }
  function open() {
    close();
    ov = document.createElement('div'); ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet kma-ok" role="dialog" aria-modal="true" aria-label="Onderzoek" style="transform:none"><div class="kma-sheet-grip"></div><div class="kma-sheet-title">Onderzoek</div><div class="kma-code-body"></div><div class="kma-row-btns"><button type="button" class="kma-chip-btn" data-ok="x">Sluiten</button></div></div>';
    ov.__kmaClose = close;
    document.body.appendChild(ov); teken();
    ov.addEventListener('change', function (e) {
      if (e.target.id !== 'ok-file' || !e.target.files[0]) return;
      var r = new FileReader(); r.onload = function () { var t = String(r.result || ''), m = /KMAO1\.[A-Za-z0-9_-]+/.exec(t); ov.querySelector('#ok-key').value = m ? m[0] : t.trim(); }; r.readAsText(e.target.files[0]);
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var r = e.target.closest('[data-ok-r]');
      if (r) { var kv = r.getAttribute('data-ok-r').split('|'), s0 = S(); s0.bruikbaar = s0.bruikbaar || {}; s0.bruikbaar[kv[0]] = Number(kv[1]); setS(s0); teken(); ov.querySelector('details.kma-ex').open = true; return; }
      var b = e.target.closest('[data-ok]'); if (!b) return;
      var a = b.getAttribute('data-ok'), s = S();
      if (a === 'x') { close(); return; }
      if (a === 'key') { zetSleutel(ov.querySelector('#ok-key').value); return; }
      if (a === 'akkoord') {
        if (!ov.querySelector('#ok-ja').checked) { ov.querySelector('.kma-code-err').textContent = 'Vink eerst aan dat je vrijwillig meedoet.'; return; }
        s.akkoord = new Date().toISOString(); s.code = s.code || O.newCode();
        var grp = ''; try { grp = (window.kmaPeloton && kmaPeloton()) || ''; } catch (x) {}
        O.pseudo('groep', grp).then(function (g) { var s2 = S(); if (g) s2.groep = g; setS(s2); teken(); });
        setS(s); toast('Je doet mee. Dank je wel.'); teken(); return;
      }
      if (a === 'stop') { kmaStore.removeItem(K); toast('Je doet niet (meer) mee. Er wordt niets meer verstuurd.'); teken(); return; }
      if (a === 'send') { b.disabled = true; verstuur().then(teken, function () { b.disabled = false; }); }
    });
  }
  window.kmaOnderzoek = { open: open, actief: actief, code: function () { return actief() ? S().code : ''; }, bouw: bouw, verstuur: verstuur };
})();
