/*
 * Weekcyclus en weekevaluatie (4.25.0, blok R5 en M6; leertaak EVA 00).
 * Zelfregulerend leren in drie stappen (Zimmerman): vooruitdenken (begin van de week één doel kiezen), monitoren
 * (tijdens de week DTF-feiten) en reflecteren (einde van de week een korte weekevaluatie). Het doel en de evaluatie
 * staan op de kaart Vandaag: maandag t/m woensdag het doel, donderdag t/m zondag de evaluatie.
 * Opslag: kma-x-weekcyclus = { '<jaar>-W<week>': { doel, at, eva: { r, goed, beter, mee, at } } }, de laatste 26 weken.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, t) { if (window.kmaToast) kmaToast(m, t); }
  function getX(k, d) { try { var v = kmaStore.getItem('kma-x-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function setX(k, v) { try { kmaStore.setItem('kma-x-' + k, JSON.stringify(v)); } catch (e) {} if (typeof triggerSavePulse === 'function') triggerSavePulse(); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  /** ISO-week, bijv. 2026-W48 (zoals de check-ins). */
  function week(d) {
    d = d ? new Date(d) : new Date();
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())), dag = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - dag);
    var j = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return t.getUTCFullYear() + '-W' + pad(Math.ceil(((t.getTime() - j.getTime()) / 864e5 + 1) / 7));
  }
  function maandag(d) { d = d ? new Date(d) : new Date(); var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function alle() { var w = getX('weekcyclus', {}); return w && typeof w === 'object' && !Array.isArray(w) ? w : {}; }
  function bewaar(k, patch) {
    var w = alle(), cur = w[k] || {};
    Object.keys(patch).forEach(function (p) { cur[p] = patch[p]; });
    w[k] = cur;
    var keys = Object.keys(w).sort(); keys.slice(0, Math.max(0, keys.length - 26)).forEach(function (o) { delete w[o]; });
    setX('weekcyclus', w);
  }
  /** DTF-feiten van deze week (eigen, niet van medecadetten). */
  function dtfDezeWeek() {
    var van = iso(maandag()), tot = iso(new Date(maandag().getTime() + 6 * 864e5));
    return (typeof dtfItems !== 'undefined' && Array.isArray(dtfItems) ? dtfItems : []).filter(function (d) { return d && d.bron !== 'medecadet' && d.datum >= van && d.datum <= tot; });
  }
  function voorstellen() {
    var out = [];
    try { (window.kmaPlannen ? window.kmaPlannen.list() : []).forEach(function (p) { out.push('Als ' + String(p.als).replace(/^als\s+/i, '') + ', dan ' + String(p.dan).replace(/^dan\s+/i, '')); }); } catch (e) {}
    try { var ns = window.kmaFeedback && kmaFeedback.nextStep ? kmaFeedback.nextStep() : null; if (ns && ns.text) out.push(ns.text); } catch (e) {}
    return out.slice(0, 4);
  }

  var ov = null;
  function close() { if (ov) { ov.remove(); ov = null; } }
  function sheet(titel, body, onOk) {
    close();
    ov = document.createElement('div'); ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet kma-wc" role="dialog" aria-modal="true" aria-label="' + esc(titel) + '" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<div class="kma-sheet-title">' + esc(titel) + '</div><div class="kma-code-body">' + body +
      '<p class="kma-code-err" role="alert"></p><div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-wc="x">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-wc="ok">Opslaan</button></div></div></div>';
    ov.__kmaClose = close;
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var s = e.target.closest('[data-wc-sug]'); if (s) { ov.querySelector('#wc-doel').value = s.getAttribute('data-wc-sug'); return; }
      var r = e.target.closest('[data-wc-r]'); if (r) { ov.querySelectorAll('[data-wc-r]').forEach(function (x) { x.classList.toggle('on', x === r); x.setAttribute('aria-pressed', String(x === r)); }); return; }
      var b = e.target.closest('[data-wc]'); if (!b) return;
      if (b.getAttribute('data-wc') === 'x') { close(); return; }
      var err = onOk(ov); if (err) { ov.querySelector('.kma-code-err').textContent = err; return; }
      close(); var rw = /** @type {any} */ (window).renderWidgets; if (typeof rw === 'function') try { rw(); } catch (x) {}
    });
    setTimeout(function () { var t = ov && ov.querySelector('textarea, input'); if (t) t.focus(); }, 60);
  }
  /** Begin van de week: één doel. */
  function doel() {
    var k = week(), cur = alle()[k] || {}, sug = voorstellen(), vorige = alle()[week(new Date(Date.now() - 7 * 864e5))] || {};
    if (vorige.eva && vorige.eva.mee) sug.unshift(vorige.eva.mee);
    sheet('Mijn doel voor deze week', '<p class="muted small">Kies één ding waar je deze week op let. Leg tijdens de week DTF-feiten vast; aan het eind kijk je terug in de weekevaluatie.</p>' +
      (sug.length ? '<div class="kma-chips">' + sug.map(function (s) { return '<button type="button" class="kma-chip-btn" data-wc-sug="' + esc(s) + '">' + esc(s.length > 70 ? s.slice(0, 68) + '…' : s) + '</button>'; }).join('') + '</div>' : '') +
      '<label class="kma-field"><span>Deze week let ik op …</span><textarea id="wc-doel" rows="2" maxlength="240" placeholder="bijv. bij elke opdracht eerst het doel noemen">' + esc(cur.doel || '') + '</textarea></label>',
      function (o) { var v = o.querySelector('#wc-doel').value.trim(); if (!v) return 'Schrijf je doel voor deze week op.'; bewaar(k, { doel: v, at: new Date().toISOString() }); toast('Doel voor deze week opgeslagen'); return ''; });
  }
  /** Einde van de week: weekevaluatie (EVA 00). */
  function evaluatie() {
    var k = week(), cur = alle()[k] || {}, e = cur.eva || {}, n = dtfDezeWeek().length;
    sheet('Weekevaluatie', '<p class="small">' + (cur.doel ? 'Je doel: <b>' + esc(cur.doel) + '</b>. ' : '') + 'Deze week legde je ' + n + ' DTF-feit' + (n === 1 ? '' : 'en') + ' vast.</p>' +
      (cur.doel ? '<div class="kma-field"><span>Is je doel gelukt?</span><div class="kma-chips">' + [['2', 'Gelukt'], ['1', 'Deels'], ['0', 'Niet gelukt']].map(function (x) { var on = String(e.r) === x[0]; return '<button type="button" class="kma-chip-btn' + (on ? ' on' : '') + '" data-wc-r="' + x[0] + '" aria-pressed="' + on + '">' + x[1] + '</button>'; }).join('') + '</div></div>' : '') +
      '<label class="kma-field"><span>Wat ging goed deze week?</span><textarea id="wc-goed" rows="2" maxlength="400">' + esc(e.goed || '') + '</textarea></label>' +
      '<label class="kma-field"><span>Wat kan beter?</span><textarea id="wc-beter" rows="2" maxlength="400">' + esc(e.beter || '') + '</textarea></label>' +
      '<label class="kma-field"><span>Wat neem je mee naar volgende week?</span><textarea id="wc-mee" rows="2" maxlength="240">' + esc(e.mee || '') + '</textarea></label>' +
      '<p class="muted small">Neem dit mee naar de weekevaluatie met je groep.</p>' + (window.kmaLeertaak ? kmaLeertaak.labels(['EVA 00']) : ''),
      function (o) {
        var g = function (id) { return o.querySelector(id).value.trim(); }, r = o.querySelector('[data-wc-r].on');
        var eva = { goed: g('#wc-goed'), beter: g('#wc-beter'), mee: g('#wc-mee'), at: new Date().toISOString() };
        if (r) eva.r = Number(r.getAttribute('data-wc-r'));
        if (!eva.goed && !eva.beter && !eva.mee) return 'Vul minstens één vraag in.';
        bewaar(k, { eva: eva });
        // Wat je meeneemt, staat volgende week als eerste voorstel bij het doel
        toast('Weekevaluatie opgeslagen'); return '';
      });
  }
  (window.kmaVandaagExtra = window.kmaVandaagExtra || []).push(function () {
    // Pas als de cadet het boekje gebruikt (DTF-feiten, plannen of al eens een weekdoel): een leeg boekje blijft rustig.
    var actief = Object.keys(alle()).length || (typeof dtfItems !== 'undefined' && Array.isArray(dtfItems) && dtfItems.length) || (window.kmaPlannen && window.kmaPlannen.count && window.kmaPlannen.count());
    if (!actief) return [];
    var dag = new Date().getDay(), k = week(), cur = alle()[k] || {}, vorige = alle()[week(new Date(Date.now() - 7 * 864e5))] || {};
    if (dag >= 1 && dag <= 3 && !cur.doel) return [{ ic: 'target', t: 'Kies je doel voor deze week', s: vorige.eva && vorige.eva.mee ? 'Vorige week nam je mee: ' + vorige.eva.mee : 'Eén ding waar je deze week op let', b: 'Kiezen', go: doel }];
    if ((dag >= 4 || dag === 0) && !cur.eva) return [{ ic: 'check', t: 'Weekevaluatie', s: cur.doel ? 'Is je doel gelukt? ' + cur.doel : 'Kijk kort terug op deze week', b: 'Invullen', go: evaluatie }];
    return [];
  });
  window.kmaWeek = { week: week, alle: alle, doel: doel, evaluatie: evaluatie, dtfDezeWeek: dtfDezeWeek };
})();
