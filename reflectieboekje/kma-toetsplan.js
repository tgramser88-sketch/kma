/*
 * Toetsing en examinering DKOO: alle toetsen per blok, summatief of formatief.
 *  - Reflectieboekje: de cadet houdt zelf bij wat voldoende, onvoldoende of nog niet behaald is (kma-x-toetsen).
 *  - CadetVolgSysteem: alleen de teamleider vult per cadet de uitslag in (cadet.toetsTL). De uitslag gaat mee
 *    in de feedback naar de cadet, zodat de cadet ziet wat de teamleider heeft vastgelegd.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var S = 'Summatief', F = 'Formatief';
  var DIG = 'Digitale theorietoets', PRA = 'Praktijkassessment', VELD = 'Veldoefening';
  // [id, blok, onderdeel, functie, toetsvorm]
  var RAW = [
    ['amo-zkh-t', 'AMO', 'Zelfhulp Kameradenhulp', S, DIG],
    ['amo-zkh-p', 'AMO', 'Zelfhulp Kameradenhulp', S, PRA],
    ['amo-cbrn-t', 'AMO', 'Chemisch, Biologisch, Radiologisch en Nucleair', S, DIG],
    ['amo-cbrn-p', 'AMO', 'Chemisch, Biologisch, Radiologisch en Nucleair', S, PRA],
    ['amo-brand-t', 'AMO', 'Brandpreventie', S, DIG],
    ['amo-brand-p', 'AMO', 'Brandpreventie', S, PRA],
    ['amo-recht', 'AMO', 'Militair recht/Humanitair oorlogsrecht', S, DIG],
    ['amo-hyg', 'AMO', 'Hygiëne en Preventieve Gezondheidszorg', S, DIG],
    ['amo-cyber', 'AMO', 'Cyber awareness', S, DIG],
    ['amo-search-t', 'AMO', 'Search Aware/Ammunition Awareness', S, DIG],
    ['amo-search-p', 'AMO', 'Search Aware/Ammunition Awareness', S, PRA],
    ['amo-safety', 'AMO', 'Safety', S, DIG],
    ['amo-security', 'AMO', 'Security', S, DIG],
    ['amo-sere', 'AMO', 'Survival, Evasion, Resistance, Extraction basis', S, DIG],
    ['amo-colt-t', 'AMO', 'COLT theorie', S, DIG],
    ['amo-colt-w', 'AMO', 'COLT wapenhandelingen', S, PRA],
    ['amo-colt-b', 'AMO', 'COLT basisschutter', S, PRA],
    ['amo-nulmeting', 'AMO', 'Fysieke nulmeting', F, PRA],
    ['amo-voet', 'AMO', 'Verplaatsing te voet', F, PRA],
    ['amo-otv01', 'AMO', 'Oefening te velde 0.1', F, VELD],
    ['amo-otv02', 'AMO', 'Oefening te velde 0.2', F, VELD],
    ['amo-intake', 'AMO', 'Intakegesprek begeleiding', F, 'Intakegesprek'],
    ['amo-intro', 'AMO', 'Cadetintroductiegesprek beoordeling', F, 'Introductiegesprek'],
    ['tb1-otv1', 'Themablok 1', 'Oefening te velde 1', F, VELD],
    ['tb1-cdo', 'Themablok 1', 'Commandovoering basis', F, PRA],
    ['tb1-voet', 'Themablok 1', 'Verplaatsing te voet', F, PRA],
    ['tb1-pmv1', 'Themablok 1', 'Praktijkmoment mentale vaardigheden 1', F, PRA],
    ['tb1-mfv', 'Themablok 1', 'Militaire Fysieke Vorming', F, PRA],
    ['tb1-le', 'Themablok 1', 'Leiderschap en ethiek: Leiderschap', F, 'Theorietoets'],
    ['tb1-blok', 'Themablok 1', 'Bloktoets 1', F, 'Multidisciplinaire toets'],
    ['tb1-fys', 'Themablok 1', 'KMA fysieke test (basis)', F, PRA],
    ['tb1-intake-d', 'Themablok 1', 'Intakegesprek begeleiding (doorstromers)', F, 'Intakegesprek'],
    ['tb1-begel', 'Themablok 1', 'Begeleidingsgesprek', F, 'Voortgangsgesprek'],
    ['tb1-intro-d', 'Themablok 1', 'Cadetintroductiegesprek beoordeling (doorstromers)', F, 'Introductiegesprek'],
    ['tb1-cbg', 'Themablok 1', 'Cadetbeoordelingsgesprek', S, 'Beoordelingsgesprek'],
    ['tb2-otv2', 'Themablok 2', 'Oefening te velde 2', F, VELD],
    ['tb2-pistool', 'Themablok 2', 'Hanteren pistool', S, PRA],
    ['tb2-cdo2', 'Themablok 2', 'Commandovoering niveau II', F, PRA],
    ['tb2-voet', 'Themablok 2', 'Verplaatsing te voet', F, PRA],
    ['tb2-pmv2', 'Themablok 2', 'Praktijkmoment mentale vaardigheden 2', F, PRA],
    ['tb2-rmo', 'Themablok 2', 'Rechtsregime militaire operaties', S, 'Theorietoets'],
    ['tb2-blok', 'Themablok 2', 'Bloktoets 2', F, 'Multidisciplinaire toets'],
    ['tb2-fys', 'Themablok 2', 'KMA fysieke test (basis)', F, PRA],
    ['tb2-begel', 'Themablok 2', 'Begeleidingsgesprek', F, 'Voortgangsgesprek'],
    ['tb3-otv3', 'Themablok 3', 'Oefening te velde 3', F, VELD],
    ['tb3-uas', 'Themablok 3', 'UAS Aware', S, 'Digitale kennistoets'],
    ['tb3-recht', 'Themablok 3', 'Militair recht/Humanitair oorlogsrecht', S, DIG],
    ['tb3-le', 'Themablok 3', 'Leiderschap en ethiek: Ethiek', F, 'Theorietoets'],
    ['tb3-blok', 'Themablok 3', 'Bloktoets 3', F, 'Multidisciplinaire toets'],
    ['tb3-voet', 'Themablok 3', 'Verplaatsing te voet', F, PRA],
    ['tb3-pmv3', 'Themablok 3', 'Praktijkmoment mentale vaardigheden 3', F, PRA],
    ['tb3-fys', 'Themablok 3', 'KMA fysieke test (specifiek)', S, PRA],
    ['tb3-eind', 'Themablok 3', 'Eindgesprek begeleiding', F, 'Reflectiegesprek'],
    ['tb3-cbg', 'Themablok 3', 'Cadetbeoordelingsgesprek', S, 'Beoordelingsgesprek']
  ];
  var ITEMS = RAW.map(function (r) { return { id: r[0], blok: r[1], naam: r[2], functie: r[3], vorm: r[4] }; });
  var BLOKKEN = ['AMO', 'Themablok 1', 'Themablok 2', 'Themablok 3'];
  var LABEL = { v: 'Voldoende', o: 'Onvoldoende', a: 'Afgerond', '': 'Nog niet behaald' };

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(n) { return window.kmaIcon ? kmaIcon(n) : ''; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function fmt(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? Number(m[3]) + ' ' + ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][m[2] - 1] : ''; }
  var BYID = {}; ITEMS.forEach(function (i) { BYID[i.id] = i; });
  /** Summatief: 'v' (voldoende) of 'o' (onvoldoende); formatief: 'a' (afgerond); anders '' (nog niet). */
  function st(map, id) {
    var x = map && map[id], it = BYID[id]; if (!x || !it) return '';
    if (it.functie === F) return x.s === 'a' || x.s === 'v' ? 'a' : '';
    return x.s === 'v' || x.s === 'o' ? x.s : '';
  }
  function counts(map, items) {
    var c = { v: 0, o: 0, a: 0, open: 0, n: items.length, ns: 0, nf: 0 };
    items.forEach(function (it) { var s = st(map, it.id); if (it.functie === S) c.ns++; else c.nf++; if (s) c[s]++; else c.open++; });
    return c;
  }
  function blokLabel(c) {
    var p = [];
    if (c.ns) p.push(c.v + '/' + c.ns + ' voldoende');
    if (c.nf) p.push(c.a + '/' + c.nf + ' afgerond');
    return p.join(' · ');
  }

  /** The list: own marks (editable), and the other party's marks shown next to them. */
  function listHtml(opts) {
    var mine = opts.mine || {}, other = opts.other || {}, filter = opts.filter || 'alle', edit = opts.edit;
    var c0 = counts(mine, ITEMS);
    var head = '<div class="kma-tp-sum"><div class="kma-tp-two">' +
      '<div class="kma-tp-big"><strong>' + c0.v + '<small>/' + c0.ns + '</small></strong><span>summatief voldoende</span><div class="kma-tp-bar" aria-hidden="true"><i style="width:' + Math.round(c0.v / c0.ns * 100) + '%"></i></div></div>' +
      '<div class="kma-tp-big"><strong>' + c0.a + '<small>/' + c0.nf + '</small></strong><span>formatief afgerond</span><div class="kma-tp-bar f" aria-hidden="true"><i style="width:' + Math.round(c0.a / c0.nf * 100) + '%"></i></div></div></div>' +
      (c0.o ? '<div class="kma-tp-legend"><span class="o">' + c0.o + ' onvoldoende</span></div>' : '') + '</div>' +
      '<div class="kma-chips kma-tp-filter">' + [['alle', 'Alles'], ['S', 'Summatief'], ['F', 'Formatief'], ['open', 'Nog open'], ['o', 'Onvoldoende']].map(function (f) {
        return '<button type="button" class="kma-chip-btn' + (filter === f[0] ? ' on' : '') + '" data-tp-filter="' + f[0] + '">' + f[1] + '</button>';
      }).join('') + '</div>';
    var body = BLOKKEN.map(function (b) {
      var all = ITEMS.filter(function (i) { return i.blok === b; });
      var items = all.filter(function (i) {
        var s = st(mine, i.id);
        return filter === 'alle' || (filter === 'S' && i.functie === S) || (filter === 'F' && i.functie === F) || (filter === 'open' && !s) || (filter === 'o' && s === 'o');
      });
      if (!items.length) return '';
      return '<details class="kma-tp-blok" open><summary><span>' + esc(b) + '</span><em>' + blokLabel(counts(mine, all)) + '</em></summary>' +
        items.map(function (i) {
          var s = st(mine, i.id), o = st(other, i.id), od = other[i.id] && other[i.id].d, form = i.functie === F;
          var ctl;
          if (!edit) ctl = '<span class="kma-tp-badge k-' + (s || 'n') + '">' + (form && !s ? 'Nog niet afgerond' : LABEL[s]) + '</span>';
          else if (form) ctl = '<button type="button" class="kma-tp-check' + (s ? ' on' : '') + '" data-tp-set="' + (s ? '' : 'a') + '" aria-pressed="' + !!s + '"><i>' + (s ? icon('check') : '') + '</i>Afgerond</button>';
          else ctl = '<div class="kma-tp-seg" role="group" aria-label="Uitslag ' + esc(i.naam) + '">' + ['v', 'o', ''].map(function (k) {
              return '<button type="button" class="' + (s === k ? 'on ' : '') + 'k-' + (k || 'n') + '" data-tp-set="' + k + '" aria-pressed="' + (s === k) + '">' + (k === 'v' ? 'Voldoende' : k === 'o' ? 'Onvoldoende' : 'Nog niet') + '</button>';
            }).join('') + '</div>';
          return '<div class="kma-tp-row s-' + (s || 'n') + (form ? ' is-f' : '') + '" data-tp-id="' + i.id + '"><div class="kma-tp-name"><strong>' + esc(i.naam) + '</strong>' +
            '<small><b class="kma-tp-fn ' + (form ? 'form' : 'sum') + '">' + i.functie + '</b> ' + esc(i.vorm) + '</small>' +
            (o ? '<small class="kma-tp-other ' + o + '">' + esc(opts.otherLabel) + ': ' + LABEL[o].toLowerCase() + (od ? ' (' + fmt(od) + ')' : '') + '</small>' : '') + '</div>' + ctl + '</div>';
        }).join('') + '</details>';
    }).join('');
    return head + (body || '<p class="muted">Geen toetsen bij dit filter.</p>');
  }
  function setMark(map, id, s, by) {
    map = map || {};
    if (!s) delete map[id]; else map[id] = { s: s, d: today(), by: by || undefined };
    return map;
  }

  /* ======================= Reflectieboekje ======================= */
  var boekFilter = 'alle';
  function getJ(k, d) { try { var v = JSON.parse(kmaStore.getItem(k)); return v && typeof v === 'object' ? v : d; } catch (e) { return d; } }
  function teamleiderMarks() {
    var fb = getJ('kma-x-feedback', { received: [] }), r = (fb.received || []).find(function (x) { return x && x.toets && typeof x.toets === 'object'; });
    return r ? r.toets : {};
  }
  function renderBoek(c) {
    c.innerHTML = '<div class="kma-card-block kma-tp"><h4>' + icon('list') + 'Mijn toetsen</h4>' +
      '<p class="muted">Hier zie je waarop je in de DKOO getoetst wordt. Houd zelf bij wat je hebt behaald. Heeft je teamleider een uitslag vastgelegd, dan zie je die eronder. Dit is een eigen overzicht; de officiële registratie loopt via bureau Cadettenbeheer. ' + (window.kmaOER ? kmaOER.label('4.2') : '') + (window.kmaOER ? kmaOER.label('4.10') : '') + '</p>' +
      listHtml({ mine: getJ('kma-x-toetsen', {}), other: teamleiderMarks(), otherLabel: 'Teamleider', filter: boekFilter, edit: true }) + '</div>';
  }

  /* ======================= CadetVolgSysteem ======================= */
  var cvsFilter = 'alle';
  function role() { return window.kmaRole ? kmaRole() : 'teamleider'; }
  function cvsSection(cadet) {
    var d = cadet.data || {}, own = (d.extras && d.extras.toetsen) || {}, edit = role() === 'teamleider';
    var sec = document.createElement('div');
    sec.className = 'kma-vis-section kma-tp';
    sec.innerHTML = '<h3>' + icon('list') + 'Toetsing en examinering DKOO</h3>' +
      '<p class="muted" style="font-size:13px;">' + (edit ? 'Vul na elke toets de uitslag in. De cadet ziet deze uitslag in zijn Reflectieboekje zodra je feedback stuurt of de deelmap bijwerkt.' : 'Alleen de teamleider vult de uitslagen in.') + ' Eigen overzicht; de officiële registratie loopt via bureau Cadettenbeheer. ' + (window.kmaOER ? kmaOER.label('4.10') : '') + '</p>' +
      '<div class="kma-tp-host">' + listHtml({ mine: cadet.toetsTL || {}, other: own, otherLabel: 'Cadet zelf', filter: cvsFilter, edit: edit }) + '</div>';
    return sec;
  }

  window.KMAToets = { ITEMS: ITEMS, BLOKKEN: BLOKKEN, LABEL: LABEL, renderBoek: renderBoek, counts: counts, status: st };

  var CVS = typeof cadets !== 'undefined' && /volgsysteem/i.test(location.pathname);
  if (CVS) {
    var origOpen = window.openDetailView;
    if (typeof origOpen === 'function') {
      window.openDetailView = function (id) {
        var r = origOpen.apply(this, arguments);
        try {
          var cadet = cadets.find(function (c) { return c.id === id; }), content = document.getElementById('det-content');
          if (cadet && content) content.appendChild(cvsSection(cadet));
        } catch (e) { console.error(e); }
        return r;
      };
    }
    // The result goes to the cadet with the feedback (kma-ui-volg.js defines kmaBuildFeedback after this file).
    var hookBuild = function () {
      if (!window.kmaBuildFeedback || window.kmaBuildFeedback.kmaToets) return;
      var origBuild = window.kmaBuildFeedback;
      window.kmaBuildFeedback = function (c) { var p = origBuild.apply(this, arguments); if (c && c.toetsTL && Object.keys(c.toetsTL).length) p.toets = c.toetsTL; return p; };
      window.kmaBuildFeedback.kmaToets = true;
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookBuild); else setTimeout(hookBuild, 0);
  }

  document.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('[data-tp-filter]');
    var b = e.target.closest && e.target.closest('[data-tp-set]');
    if (!f && !b) return;
    var inCvs = CVS && e.target.closest('.kma-tp-host');
    if (f) {
      if (inCvs) cvsFilter = f.getAttribute('data-tp-filter'); else boekFilter = f.getAttribute('data-tp-filter');
    } else {
      var id = b.closest('[data-tp-id]').getAttribute('data-tp-id'), s = b.getAttribute('data-tp-set');
      if (inCvs) {
        if (role() !== 'teamleider') return;
        var cadet = cadets.find(function (c) { return c.id === activeCadetId; }); if (!cadet) return;
        var me = ''; try { me = kmaStore.getItem('kma-cvs-instructor-name') || ''; } catch (x) {}
        cadet.toetsTL = setMark(cadet.toetsTL, id, s, me);
        if (typeof saveCVS === 'function') saveCVS();
        if (window.kmaToast) kmaToast(s ? LABEL[s] + ' vastgelegd' : 'Uitslag gewist');
      } else {
        var m = setMark(getJ('kma-x-toetsen', {}), id, s);
        try { kmaStore.setItem('kma-x-toetsen', JSON.stringify(m)); } catch (x) {}
        if (typeof triggerSavePulse === 'function') triggerSavePulse();
      }
    }
    if (inCvs) {
      var host = e.target.closest('.kma-tp-host'), cad = cadets.find(function (c) { return c.id === activeCadetId; });
      if (host && cad) host.innerHTML = listHtml({ mine: cad.toetsTL || {}, other: ((cad.data || {}).extras || {}).toetsen || {}, otherLabel: 'Cadet zelf', filter: cvsFilter, edit: role() === 'teamleider' });
    } else if (typeof renderWidgets === 'function') {
      var y = window.scrollY; renderWidgets(); window.scrollTo(0, y);
    }
  });
})();
