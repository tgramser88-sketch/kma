/*
 * Individuele nabespreking na een oefening (4.17.0, blok M3).
 * Vier vragen van de After Action Review: wat was de bedoeling, wat gebeurde er, waarom, wat doe ik volgende keer.
 * Goed opgezette nabesprekingen verbeteren prestaties met gemiddeld 20 tot 25 procent (Tannenbaum & Cerasoli, 2013).
 * Opslaan maakt één DTF-feit (met de vier antwoorden in het veld aar) en, als de cadet dat kiest, een als-dan-plan
 * bij de leervraag (Gollwitzer & Sheeran, 2006). Menu ⋮ → Nabespreking na een oefening.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var VS = ['Verbondenheid', 'Veiligheid', 'Vertrouwen', 'Verantwoordelijkheid'];
  var ov = null;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function toast(m, t) { if (window.kmaToast) kmaToast(m, t); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  var VRAGEN = [
    ['bedoeling', 'Wat was de bedoeling?', 'Wat moest er bereikt worden, en wat was jouw taak?'],
    ['gebeurd', 'Wat gebeurde er echt?', 'Alleen feiten: wat deed jij, wat deden anderen?'],
    ['waarom', 'Waarom ging het zo?', 'Wat hielp, wat zat in de weg? Ook je eigen aandeel.'],
    ['volgende', 'Wat doe je volgende keer?', 'Eén concreet ding dat je anders of weer zo doet.']
  ];
  function close() { if (ov) { ov.remove(); ov = null; } }
  function open() {
    close();
    ov = document.createElement('div'); ov.className = 'kma-sheet-overlay in';
    ov.innerHTML = '<div class="kma-sheet kma-code-sheet kma-nb" role="dialog" aria-modal="true" aria-label="Nabespreking na een oefening" style="transform:none"><div class="kma-sheet-grip"></div>' +
      '<div class="kma-sheet-title">Nabespreking na een oefening</div><div class="kma-code-body">' +
      '<p class="muted small">Doe dit zo snel mogelijk na de oefening, als je het nog goed weet. Het wordt een DTF-feit in je logboek.</p>' +
      '<div class="kma-inline-form"><label class="kma-field"><span>Datum</span><input type="date" id="nb-datum" value="' + today() + '"></label>' +
      '<label class="kma-field"><span>Oefening of situatie</span><input type="text" id="nb-sit" maxlength="120" placeholder="bijv. Verkenning, oefening Hei"></label></div>' +
      VRAGEN.map(function (q) { return '<label class="kma-field"><span>' + q[1] + '</span><textarea id="nb-' + q[0] + '" rows="2" data-concept placeholder="' + esc(q[2]) + '"></textarea></label>'; }).join('') +
      '<div class="kma-field"><span>Bij welke V hoort dit?</span><div class="kma-chips">' + VS.map(function (v) { return '<label class="kma-chip-btn"><input type="checkbox" class="sr-only" name="nb-v" value="' + v + '">' + v + '</label>'; }).join('') + '</div></div>' +
      '<label class="kma-check"><input type="checkbox" id="nb-plan"> Maak er een als-dan-plan van voor mijn leervraag</label>' +
      '<div class="kma-nb-plan" hidden><label class="kma-field"><span>Als …</span><input type="text" id="nb-als" maxlength="160" placeholder="bijv. ik een opdracht geef"></label>' +
      '<label class="kma-field"><span>dan …</span><input type="text" id="nb-dan" maxlength="160"></label></div>' +
      '<p class="kma-code-err" id="nb-err" role="alert"></p>' + (window.kmaLeertaak ? kmaLeertaak.labels(['Ref 04', 'Ref 12', 'Ref 14', 'GV 01', 'LeO 01']) : '') +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-nb="x">Annuleren</button><button type="button" class="kma-icon-btn is-primary" data-nb="ok">Opslaan</button></div></div></div>';
    ov.__kmaClose = close;
    document.body.appendChild(ov);
    ov.addEventListener('change', function (e) {
      if (e.target.name === 'nb-v') e.target.closest('label').classList.toggle('on', e.target.checked);
      if (e.target.id === 'nb-plan') {
        ov.querySelector('.kma-nb-plan').hidden = !e.target.checked;
        var dan = ov.querySelector('#nb-dan'); if (e.target.checked && !dan.value) dan.value = ov.querySelector('#nb-volgende').value.trim();
      }
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov) { close(); return; }
      var b = e.target.closest('[data-nb]'); if (!b) return;
      if (b.getAttribute('data-nb') === 'ok') save(); else close();
    });
    setTimeout(function () { var t = ov && ov.querySelector('#nb-sit'); if (t) t.focus(); }, 60);
  }
  function save() {
    var g = function (id) { var e = ov.querySelector('#' + id); return e ? String(e.value || '').trim() : ''; };
    var err = ov.querySelector('#nb-err'); err.textContent = '';
    var a = { bedoeling: g('nb-bedoeling'), gebeurd: g('nb-gebeurd'), waarom: g('nb-waarom'), volgende: g('nb-volgende') };
    if (!a.gebeurd || !a.volgende) { err.textContent = 'Vul minstens in wat er gebeurde en wat je volgende keer doet.'; return; }
    var plan = ov.querySelector('#nb-plan').checked, als = g('nb-als'), dan = g('nb-dan');
    if (plan && (!als || !dan)) { err.textContent = 'Vul bij het als-dan-plan zowel "als" als "dan" in, of zet het vinkje uit.'; return; }
    var v = [].map.call(ov.querySelectorAll('input[name="nb-v"]:checked'), function (x) { return x.value; });
    var sit = g('nb-sit');
    var feit = 'Nabespreking' + (sit ? ' ' + sit : '') + '. Bedoeling: ' + (a.bedoeling || '-') + ' Gebeurd: ' + a.gebeurd + ' Waarom: ' + (a.waarom || '-') + ' Volgende keer: ' + a.volgende;
    if (typeof dtfItems === 'undefined') { err.textContent = 'Het DTF-logboek is niet geladen.'; return; }
    var now = new Date();
    dtfItems.unshift({ id: Date.now(), datum: g('nb-datum') || today(), tijd: ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2), feit: feit, vValues: v, aspect: 'Nabespreking na een oefening', aar: Object.assign({ situatie: sit }, a) });
    try { kmaStore.setItem(DTF_KEY, JSON.stringify(dtfItems)); } catch (e) {}
    if (typeof dbSet === 'function') dbSet(DTF_KEY, dtfItems);
    var planOk = plan && window.kmaPlannen ? kmaPlannen.add({ als: als, dan: dan, from: 'nabespreking' }) : false;
    ['nb-bedoeling', 'nb-gebeurd', 'nb-waarom', 'nb-volgende'].forEach(function (id) { try { var d = window.kmaGemak ? kmaGemak.drafts() : null; if (d && d[id]) { delete d[id]; (window.kmaStore || localStorage).setItem('kma-x-concepten', JSON.stringify(d)); } } catch (e) {} });
    close();
    toast('Nabespreking opgeslagen als DTF-feit' + (planOk ? ', met een als-dan-plan' : ''));
    if (typeof renderWidgets === 'function') try { renderWidgets(); } catch (e) {}
  }
  window.kmaNabespreking = { open: open, close: close, VRAGEN: VRAGEN };
})();
