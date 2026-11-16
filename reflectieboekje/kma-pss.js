/* PSS-10 (Perceived Stress Scale, Cohen & Williamson 1988): ervaren stress in de afgelopen maand.
   Gedeeld door het Reflectieboekje en het CadetVolgSysteem, zodat beide apps dezelfde score en uitleg geven.

   4.7.0: de PSS-14 is vervangen door de PSS-10. De PSS-10 bestaat uit 10 van de 14 vragen (PSS-14 vraag 4, 5, 12
   en 13 vallen weg). Oude metingen met 14 antwoorden blijven geldig: de app rekent ze om naar de PSS-10 met
   dezelfde antwoorden, zodat het verloop gewoon doorloopt. */
(function () {
  var ITEMS = [
    'Hoe vaak was je van je stuk gebracht door iets onverwachts?',
    'Hoe vaak had je het gevoel dat je belangrijke dingen niet kon controleren?',
    'Hoe vaak voelde je je zenuwachtig en gestrest?',
    'Hoe vaak voelde je je zelfverzekerd over het aanpakken van problemen?',
    'Hoe vaak verliepen dingen naar jouw wens?',
    'Hoe vaak merkte je dat je niet kon omgaan met al je taken?',
    'Hoe vaak kon je ergernissen onder controle houden?',
    'Hoe vaak had je de zaken volledig onder controle?',
    'Hoe vaak was je boos over dingen waar je geen invloed op had?',
    'Hoe vaak stapelden problemen zich zo hoog op dat je ze niet kon overwinnen?'
  ];
  var N = ITEMS.length;
  // Positief geformuleerde vragen (PSS-10-nummering): de score wordt omgedraaid (0=4, 1=3, enzovoort).
  var POSITIVE = [4, 5, 7, 8];
  var SCALE = ['Nooit', 'Bijna nooit', 'Soms', 'Redelijk vaak', 'Zeer vaak'];
  var MAX = 40;
  // Plek van de PSS-10-vragen in een oude PSS-14-meting (0-gebaseerd): PSS-14 vraag 1, 2, 3, 6, 7, 8, 9, 10, 11, 14.
  var FROM14 = [0, 1, 2, 5, 6, 7, 8, 9, 10, 13];

  function ok(v) { return v !== null && v !== undefined && v !== '' && !isNaN(v) && v >= 0 && v <= 4; }
  /** Antwoorden als PSS-10 (10 antwoorden). Een oude PSS-14-meting wordt omgerekend; anders null. */
  function ten(a) {
    if (!Array.isArray(a)) return null;
    var r = a.length === 14 ? FROM14.map(function (i) { return a[i]; }) : a.length === N ? a.slice() : null;
    return r && r.every(ok) ? r.map(Number) : null;
  }
  function itemScore(i, v) { v = Number(v); return POSITIVE.indexOf(i + 1) >= 0 ? 4 - v : v; }
  function complete(a) { return !!ten(a); }
  function total(a) { var t = ten(a); return t ? t.reduce(function (s, v, i) { return s + itemScore(i, v); }, 0) : null; }
  /** True for a measurement that was taken with the old 14-question list. */
  function legacy(a) { return Array.isArray(a) && a.length === 14; }

  /* Er bestaan geen officiële afkappunten voor de PSS-10. De indeling volgt de Amerikaanse normgroep van jonge
     volwassenen (jonger dan 25, 2009: gemiddeld 16,8, SD 6,9; Cohen & Janicki-Deverts, 2012):
     laag = ruim onder het gemiddelde, gemiddeld = rond het gemiddelde, verhoogd = vanaf ongeveer 0,8 SD erboven,
     hoog = vanaf ongeveer 2 SD erboven. Een indicatie, geen diagnose. */
  var BANDS = { gemiddeld: 13, verhoogd: 22, hoog: 30 };
  function band(t) {
    if (t == null) return null;
    if (t >= BANDS.hoog) return { key: 'hoog', label: 'Hoog', color: '#a91f2b', high: true };
    if (t >= BANDS.verhoogd) return { key: 'verhoogd', label: 'Verhoogd', color: '#c77a1a' };
    if (t >= BANDS.gemiddeld) return { key: 'gemiddeld', label: 'Gemiddeld', color: '#c79a2a' };
    return { key: 'laag', label: 'Laag', color: '#2f9e5b' };
  }
  /* De twee factoren die in onderzoek steeds terugkomen (Lee, 2012): ervaren hulpeloosheid (de zes negatief
     gestelde vragen) en ervaren grip (de vier positief gestelde vragen). */
  var THEMES = [
    { label: 'Ervaren hulpeloosheid', items: [1, 2, 3, 6, 9, 10] },
    { label: 'Te weinig grip', items: [4, 5, 7, 8] }
  ];
  function themes(a) {
    var t = ten(a); if (!t) return [];
    return THEMES.map(function (th) {
      var s = th.items.reduce(function (x, n) { return x + itemScore(n - 1, t[n - 1]); }, 0);
      return { label: th.label, value: Math.round(s / (th.items.length * 4) * 100) };
    });
  }
  function sorted(list) {
    return (Array.isArray(list) ? list : []).filter(function (r) { return r && complete(r.a); })
      .slice().sort(function (x, y) { return String(x.date).localeCompare(String(y.date)) || (x.id - y.id); });
  }
  function latest(list) { var s = sorted(list); return s.length ? s[s.length - 1] : null; }

  /* Betrouwbare verandering (Jacobson & Truax, 1991): een verschil telt pas als echte verandering als het groter is
     dan wat de meetfout kan verklaren: 1,96 × √2 × SD × √(1 − betrouwbaarheid).
     SD 6,9 (jonge volwassenen, Cohen & Janicki-Deverts, 2012) en betrouwbaarheid 0,85 (het midden van 0,74 tot 0,91,
     Lee, 2012) geven 7,4: een verschil van 8 punten of meer is een betrouwbare verandering. */
  var SD = 6.9, REL = 0.85;
  var RCI = Math.ceil(1.96 * Math.SQRT2 * SD * Math.sqrt(1 - REL));
  var RISE = RCI;
  function change(list) {
    var s = sorted(list);
    if (s.length < 2) return null;
    var cur = total(s[s.length - 1].a), prev = total(s[s.length - 2].a), diff = cur - prev;
    return { prev: prev, prevDate: s[s.length - 2].date, diff: diff, rise: diff >= RISE, fall: diff <= -RISE, reliable: Math.abs(diff) >= RCI };
  }
  /* Signaal voor een gesprek: een hoge score of een betrouwbare stijging ten opzichte van de vorige meting. */
  function signal(list) {
    var l = latest(list); if (!l) return null;
    var t = total(l.a), b = band(t), c = change(list);
    return { total: t, band: b, change: c, high: !!b.high, rise: !!(c && c.rise), any: !!(b.high || (c && c.rise)) };
  }
  function changeText(c) {
    if (!c) return '';
    if (c.diff === 0) return 'gelijk aan je vorige meting';
    var s = (c.diff > 0 ? c.diff + ' hoger' : (-c.diff) + ' lager') + ' dan de vorige meting (' + c.prev + ')';
    return s + (c.reliable ? ', een betrouwbare verandering' : ', binnen de meetfout');
  }
  var NOTE = 'De PSS-10 heeft geen officiële grenzen voor laag of hoog. De indeling in de app (tot ' + (BANDS.gemiddeld - 1) + ', ' + BANDS.gemiddeld + ' tot ' + (BANDS.verhoogd - 1) + ', ' + BANDS.verhoogd + ' tot ' + (BANDS.hoog - 1) + ', vanaf ' + BANDS.hoog + ') is een hulpmiddel en geen diagnose. Het verloop van je eigen scores zegt meer dan één losse score.';
  var LEGACY_NOTE = 'Metingen van vóór versie 4.7.0 (met 14 vragen) zijn omgerekend naar de PSS-10 met dezelfde antwoorden.';
  function explain() {
    return '<details class="kma-why"><summary>Hoe komt dit tot stand?</summary><div class="kma-why-body"><strong>Zo lees je de PSS-10</strong><ul>' +
      '<li>10 vragen over de afgelopen maand, elk 0 tot 4 punten. Bij 4 positief gestelde vragen telt het antwoord omgekeerd. Samen 0 tot 40: hoe hoger, hoe meer ervaren stress.</li>' +
      '<li>' + NOTE + ' De grenzen zijn afgeleid van jonge volwassenen (jonger dan 25) in de Verenigde Staten: gemiddeld 16,8.</li>' +
      '<li>De app geeft een signaal bij een score vanaf ' + BANDS.hoog + ', of als je score sinds de vorige meting ' + RISE + ' punten of meer is gestegen. Vanaf ' + RCI + ' punten is een verschil groter dan de meetfout; een kleiner verschil kan toeval zijn.</li>' +
      '<li>De twee balken zijn de twee kanten die in onderzoek steeds terugkomen: hoe hulpeloos je je voelde en hoeveel grip je had.</li>' +
      '<li>' + LEGACY_NOTE + '</li></ul>' +
      '<p class="kma-why-src">Bronnen: Cohen, Kamarck en Mermelstein (1983); Cohen en Williamson (1988); Cohen en Janicki-Deverts (2012); Lee (2012); Jacobson en Truax (1991).</p></div></details>';
  }

  window.KMAPSS = { ITEMS: ITEMS, N: N, POSITIVE: POSITIVE, SCALE: SCALE, MAX: MAX, BANDS: BANDS, FROM14: FROM14, ten: ten, legacy: legacy, complete: complete, total: total, band: band, themes: themes, sorted: sorted, latest: latest, itemScore: itemScore, RISE: RISE, RCI: RCI, change: change, signal: signal, changeText: changeText, NOTE: NOTE, LEGACY_NOTE: LEGACY_NOTE, explain: explain };
})();

/* WHO-5 Welzijnsindex (1999-versie, officiële Nederlandse vertaling): welbevinden in de afgelopen twee weken.
   Vijf uitspraken, 0 tot 5 punten; de som maal 4 geeft 0 tot 100 (hoger = beter). Een score van 50 of lager wordt
   in onderzoek gebruikt als grens om verder te kijken (Topp, Østergaard, Søndergaard & Bech, 2015). De positieve
   tegenhanger van de stresscheck: niet alleen hoeveel druk je ervaart, maar ook hoe het met je gaat. */
(function () {
  var ITEMS = [
    'Ik voelde me vrolijk en in een opperbeste stemming',
    'Ik voelde me rustig en ontspannen',
    'Ik voelde me actief en doelbewust',
    'Ik voelde me fris en uitgerust wanneer ik wakker werd',
    'Mijn dagelijkse leven was gevuld met dingen die me interesseren'
  ];
  // Van hoog naar laag, zoals op het officiële formulier.
  var SCALE = [[5, 'Constant'], [4, 'Meestal'], [3, 'Meer dan de helft van de tijd'], [2, 'Minder dan de helft van de tijd'], [1, 'Soms'], [0, 'Helemaal niet']];
  var LOW = 50;
  function complete(a) { return Array.isArray(a) && a.length === 5 && a.every(function (v) { return v !== null && v !== undefined && v !== '' && !isNaN(v) && v >= 0 && v <= 5; }); }
  function total(a) { return complete(a) ? a.reduce(function (t, v) { return t + Number(v); }, 0) * 4 : null; }
  function band(t) {
    if (t == null) return null;
    if (t <= LOW) return { key: 'laag', label: 'Laag welbevinden', color: '#c77a1a', low: true };
    return { key: 'ok', label: 'Goed welbevinden', color: '#2f9e5b' };
  }
  function sorted(list) {
    return (Array.isArray(list) ? list : []).filter(function (r) { return r && complete(r.a); })
      .slice().sort(function (x, y) { return String(x.date).localeCompare(String(y.date)) || (x.id - y.id); });
  }
  function latest(list) { var s = sorted(list); return s.length ? s[s.length - 1] : null; }
  function change(list) {
    var s = sorted(list); if (s.length < 2) return null;
    var cur = total(s[s.length - 1].a), prev = total(s[s.length - 2].a);
    return { prev: prev, diff: cur - prev };
  }
  var NOTE = 'De WHO-5 meet je welbevinden in de afgelopen twee weken, van 0 tot 100: hoe hoger, hoe beter. Een score van ' + LOW + ' of lager is een reden om met iemand te praten; het is geen diagnose.';
  function explain() {
    return '<details class="kma-why"><summary>Hoe komt dit tot stand?</summary><div class="kma-why-body"><strong>Zo lees je de WHO-5</strong><ul>' +
      '<li>Vijf uitspraken over de afgelopen twee weken, elk 0 (helemaal niet) tot 5 (constant) punten. De som maal 4 geeft een score van 0 tot 100.</li>' +
      '<li>In onderzoek wordt een score van ' + LOW + ' of lager gebruikt als signaal om verder te kijken. De app geeft dan het advies om met iemand te praten.</li>' +
      '<li>Samen met de stresscheck zie je twee kanten: hoeveel druk je ervaart en hoe het met je gaat.</li></ul>' +
      '<p class="kma-why-src">Bronnen: WHO (vijf) Welzijnsindex, 1999-versie, Nederlandse vertaling; Topp, Østergaard, Søndergaard en Bech (2015).</p></div></details>';
  }
  window.KMAWHO5 = { ITEMS: ITEMS, SCALE: SCALE, LOW: LOW, complete: complete, total: total, band: band, sorted: sorted, latest: latest, change: change, NOTE: NOTE, explain: explain };
})();
