/*
 * Reflectieboekje: "Bereid je gesprek voor" (4.4.0).
 * Eén pagina voor het gesprek met de teamleider: SMART-leervraag en check-ins, de laatste reflecties,
 * feedback en lopende afspraken, desgewenst de stresscheck, en de eigen vragen van de cadet.
 *  - Maak PDF: de pagina afdrukken of als PDF bewaren.
 *  - Delen met teamleider: de voorbereiding (kma-x-gesprek-prep) gaat mee met het dossier. De teamleider ziet
 *    hem in het CadetVolgSysteem bij het gespreksverslag. De stresscheck gaat alleen mee als de cadet dat aanzet.
 * Te openen via de kaart Vandaag en via ⋮ → Bereid je gesprek voor.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || !window.kmaStore) return;
  var icon = function (n) { return window.kmaIcon ? kmaIcon(n) : ''; };
  var toast = function (m, k) { if (window.kmaToast) kmaToast(m, k); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function getX(k, d) { try { var v = kmaStore.getItem('kma-x-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function setX(k, v) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(v)); } catch (e) {} }
  function byTitle(re) { return steps.findIndex(function (s) { return re.test(s.title); }); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  var MND = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
  function longDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? Number(m[3]) + ' ' + MND[+m[2] - 1] + ' ' + m[1] : ''; }
  function idDate(id) { var t = Number(id); return t > 1.5e12 && t <= Date.now() + 864e5 ? (function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })(new Date(t)) : ''; }
  function cut(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
  function name() { return answers['Voornaam & Achternaam:'] || answers['Voornaam + Achternaam:'] || 'Cadet'; }

  /* ---------------- De inhoud ---------------- */
  function smart() {
    var i = byTitle(/SMART/); if (i < 0) return null;
    var q = steps[i].questions || [], first = (answers[q[0]] || '').trim();
    if (!first) return null;
    var ci = getX('smart-checkins', []).slice(-4), ok = ci.filter(function (x) { return x && x.r >= 1; }).length;
    return { vraag: first, checkins: ci.length ? ok + ' van de laatste ' + ci.length + ' weken (deels) gelukt' : 'nog geen check-ins', datum: getX('smart-date', '') };
  }
  function reflecties() {
    var out = [];
    (typeof cases5GT !== 'undefined' ? cases5GT : []).forEach(function (c) {
      if (!c || !(c.gebeurtenis || c.gedrag || c.gevolgen)) return;
      out.push({ id: Number(c.id) || 0, soort: '5G-T', titel: c.title || '5G-T-reflectie', tekst: cut(c.gedrag || c.gebeurtenis, 110) });
    });
    (typeof casesKorthagen !== 'undefined' ? casesKorthagen : []).forEach(function (c) {
      if (!c || !(c.actie || c.terugblik || c.alternatieven)) return;
      out.push({ id: Number(c.id) || 0, soort: 'Korthagen', titel: c.title || 'Korthagen-reflectie', tekst: cut(c.alternatieven ? 'actie: ' + c.alternatieven : (c.terugblik || c.actie), 110) });
    });
    return out.sort(function (a, b) { return b.id - a.id; }).slice(0, 3);
  }
  function feedback() {
    var d = window.kmaFeedback && kmaFeedback.latest ? kmaFeedback.latest() : null, out = [];
    if (!d) return out;
    var items = d.items || {};
    Object.keys(items).slice(0, 2).forEach(function (k) { if (items[k]) out.push('Feedback: ' + cut(items[k], 120)); });
    (d.plans || []).forEach(function (p) { (p.acties || []).forEach(function (a) { if (a && a.wat && !a.klaar) out.push('Plan: ' + cut(a.wat, 100) + (a.wanneer ? ' (vóór ' + longDate(a.wanneer) + ')' : '')); }); });
    var klaar = getX('afspraken-klaar', {});
    (d.gesprekken || []).forEach(function (g) { (g.afspraken || []).forEach(function (a) { if (a && a.wat && !a.klaar) out.push('Afspraak: ' + cut(a.wat, 100) + (klaar[a.id] ? ' · gedaan' : a.wanneer ? ' (vóór ' + longDate(a.wanneer) + ')' : '')); }); });
    return out.slice(0, 6);
  }
  function stress() {
    var P = window.KMAPSS; if (!P) return null;
    var l = P.latest(getX('pss', [])); if (!l) return null;
    var t = P.total(l.a), b = P.band(t);
    return { total: t, max: P.MAX, band: b ? b.label : '', date: l.date };
  }

  /* ---------------- Het scherm ---------------- */
  function prep() {
    var p = getX('gesprek-prep', {}) || {};
    return { datum: p.datum || '', vragen: p.vragen || '', incl: Object.assign({ smart: true, refl: true, fb: true, stress: false }, p.incl || {}) };
  }
  function docHtml(p) {
    var s = smart(), r = reflecties(), f = feedback(), st = p.incl.stress ? stress() : null;
    var vragen = String(p.vragen || '').split(/\n+/).map(function (x) { return x.trim(); }).filter(Boolean);
    return '<h2>Gespreksvoorbereiding · ' + esc(name()) + '</h2><p class="muted">' + (p.datum ? 'Gesprek ' + esc(longDate(p.datum)) : 'Gemaakt ' + esc(longDate(today()))) + '</p>' +
      (p.incl.smart ? '<h3>Leervraag</h3><p>' + (s ? esc(cut(s.vraag, 260)) + '<br><span class="muted">Check-ins: ' + esc(s.checkins) + (s.datum ? ' · evaluatie ' + esc(longDate(s.datum)) : '') + '</span>' : '<span class="muted">Nog geen SMART-leervraag ingevuld.</span>') + '</p>' : '') +
      (p.incl.refl ? '<h3>Reflecties</h3>' + (r.length ? '<ul>' + r.map(function (x) { return '<li><b>' + esc(x.soort) + ' · ' + esc(x.titel) + '</b>' + (idDate(x.id) ? ' <span class="muted">(' + esc(longDate(idDate(x.id))) + ')</span>' : '') + (x.tekst ? ': ' + esc(x.tekst) : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted">Nog geen reflecties.</p>') : '') +
      (p.incl.fb ? '<h3>Feedback en afspraken</h3>' + (f.length ? '<ul>' + f.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="muted">Geen lopende feedback of afspraken.</p>') : '') +
      (st ? '<h3>Stresscheck</h3><p>' + st.total + ' van ' + (st.max || 56) + ' · ' + esc(st.band.toLowerCase()) + ' (' + esc(longDate(st.date)) + ')</p>' : '') +
      '<h3>Mijn vragen</h3>' + (vragen.length ? '<ul>' + vragen.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '<p class="muted">-</p>') +
      '<h3>Afspraken uit dit gesprek</h3><p class="kma-summary-blank"></p>';
  }
  function open(opt) {
    opt = opt || {};
    var p = prep();
    if (opt.datum && opt.datum >= today()) p.datum = opt.datum;
    var hasStress = !!stress();
    var ov = document.createElement('div');
    ov.className = 'kma-sheet-overlay in kma-gp-ov';
    var row = function (k, l, sub, dis) { return '<label class="kma-rem-row"><span><b>' + l + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</span><span class="kma-rem-sw"><input type="checkbox" data-gp="' + k + '" aria-label="' + l + '"' + (p.incl[k] && !dis ? ' checked' : '') + (dis ? ' disabled' : '') + '/><i aria-hidden="true"></i></span></label>'; };
    ov.innerHTML = '<div class="kma-sheet kma-rem kma-gp" role="dialog" aria-modal="true" aria-labelledby="kma-gp-h" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<h2 id="kma-gp-h">' + icon('users') + 'Bereid je gesprek voor</h2>' +
      '<p class="kma-rem-intro">Eén pagina voor het gesprek met je teamleider. Kies wat erin komt en schrijf je eigen vragen erbij.</p>' +
      '<div class="kma-rem-sub"><label for="kma-gp-datum">Datum van het gesprek</label><input type="date" id="kma-gp-datum" value="' + esc(p.datum) + '"/></div>' +
      row('smart', 'SMART-leervraag en check-ins') + row('refl', 'Laatste 3 reflecties (5G-T en Korthagen)') + row('fb', 'Feedback en lopende afspraken') +
      row('stress', 'Stresscheck', hasStress ? 'Alleen als je dat wilt. Gaat alleen mee als dit aan staat.' : 'Je hebt nog geen stresscheck ingevuld', !hasStress) +
      '<div class="kma-gp-q"><label for="kma-gp-vragen"><b>Mijn vragen voor het gesprek</b><small>Eén vraag per regel</small></label><textarea id="kma-gp-vragen" rows="3" placeholder="Bijvoorbeeld: Hoe kan ik vaker het woord nemen in de groep?">' + esc(p.vragen) + '</textarea></div>' +
      '<p class="kma-gp-vb">Voorbeeld</p><div class="kma-gp-doc kma-summary-page" id="kma-gp-doc">' + docHtml(p) + '</div>' +
      '<div class="kma-row-btns kma-rem-btns"><button type="button" class="kma-icon-btn" data-gp-x>' + icon('x') + 'Sluiten</button><button type="button" class="kma-icon-btn" data-gp-share>' + icon('share') + 'Delen met teamleider</button><button type="button" class="kma-icon-btn is-primary" data-gp-pdf>' + icon('print') + 'Maak PDF</button></div></div>';
    document.body.appendChild(ov);
    var read = function () {
      var n = prep();
      n.datum = ov.querySelector('#kma-gp-datum').value || '';
      n.vragen = ov.querySelector('#kma-gp-vragen').value || '';
      ov.querySelectorAll('[data-gp]').forEach(function (c) { n.incl[c.getAttribute('data-gp')] = !!c.checked && !c.disabled; });
      return n;
    };
    var store = function (shared) {
      var n = read(), st = n.incl.stress ? stress() : null;
      setX('gesprek-prep', { at: new Date().toISOString(), datum: n.datum, vragen: n.vragen, incl: n.incl, stress: st, gedeeld: shared ? new Date().toISOString() : (getX('gesprek-prep', {}) || {}).gedeeld || '' });
      return n;
    };
    var refresh = function () { ov.querySelector('#kma-gp-doc').innerHTML = docHtml(read()); };
    ov.addEventListener('input', refresh);
    ov.addEventListener('change', function () { refresh(); store(false); });
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-gp-x]')) { store(false); ov.remove(); return; }
      if (e.target.closest('[data-gp-pdf]')) {
        var n = store(false), div = document.createElement('div');
        div.className = 'kma-summary';
        div.innerHTML = '<div class="kma-summary-page"><div class="kma-summary-tools"><button type="button" class="kma-icon-btn" data-act="sum-close">' + icon('x') + 'Sluiten</button><button type="button" class="kma-icon-btn is-primary" data-act="sum-print">' + icon('print') + 'PDF / afdrukken</button></div>' + docHtml(n) + '</div>';
        ov.remove(); document.body.appendChild(div);
        return;
      }
      if (e.target.closest('[data-gp-share]')) {
        store(true); ov.remove();
        if (window.kmaDeelStatus && kmaDeelStatus().on && window.kmaDeelSync) { kmaDeelSync(true); toast('Je voorbereiding gaat mee met je dossier in de deelmap'); }
        else { toast('Je voorbereiding gaat mee als je je dossier deelt'); var b = document.getElementById('kma-share-btn'); if (b) setTimeout(function () { b.click(); }, 300); }
      }
    });
  }
  window.kmaGesprek = { open: open, docHtml: function () { return docHtml(prep()); } };
})();
