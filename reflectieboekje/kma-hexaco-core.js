/*
 * HEXACO scoring and SWOT engine: shared by the reflection book and the instructor app.
 * Scores run 0-100: (average answer − 1) ÷ 4 × 100, so "neutraal" on everything = 50.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';

  var TRAITS = [
    { key: 'H', name: 'Integriteit', full: 'Integriteit (H)', v: 'Vertrouwen',
      low: 'pragmatisch, eigen belang', high: 'oprecht, bescheiden',
      explain: 'Hoe eerlijk, bescheiden en niet-manipulatief je met anderen omgaat. Hoog: je speelt open kaart en zoekt geen eigen voordeel. Laag: je bent pragmatischer en durft je eigen belang voorop te zetten.' },
    { key: 'E', name: 'Emotionaliteit', full: 'Emotionaliteit (E)', v: 'Veiligheid',
      low: 'kalm, onbewogen', high: 'gevoelig, betrokken',
      explain: 'Hoe sterk je spanning, zorgen en behoefte aan steun ervaart. Hoog: je voelt veel mee en bent voorzichtig. Laag: je blijft kalm onder druk, maar kunt afstandelijk overkomen.' },
    { key: 'X', name: 'Extraversie', full: 'Extraversie (X)', v: 'Verbondenheid',
      low: 'rustig, luistert eerst', high: 'spontaan, neemt het woord',
      explain: 'Hoeveel energie je haalt uit contact en hoe zichtbaar je bent in een groep. Hoog: je neemt makkelijk het woord en het initiatief. Laag: je observeert eerst en spreekt als je iets te zeggen hebt.' },
    { key: 'A', name: 'Verdraagzaamheid', full: 'Verdraagzaamheid (A)', v: 'Verbondenheid',
      low: 'kritisch, direct', high: 'geduldig, vergevingsgezind',
      explain: 'Hoe je reageert als anderen fouten maken of je dwarszitten. Hoog: je bent geduldig en vergeeft snel. Laag: je bent kritisch en direct, en zegt het als iets je niet bevalt.' },
    { key: 'C', name: 'Consciëntieusheid', full: 'Consciëntieusheid (C)', v: 'Verantwoordelijkheid',
      low: 'flexibel, spontaan', high: 'georganiseerd, nauwkeurig',
      explain: 'Hoe gestructureerd, zorgvuldig en gedisciplineerd je werkt. Hoog: je plant, controleert en maakt af. Laag: je bent flexibel en spontaan, maar details kunnen erbij inschieten.' },
    { key: 'O', name: 'Openheid', full: 'Openheid (O)', v: 'Verantwoordelijkheid',
      low: 'praktisch, vertrouwd', high: 'nieuwsgierig, creatief',
      explain: 'Hoe nieuwsgierig je bent naar nieuwe ideeën, kunst en andere manieren van denken. Hoog: je zoekt het onbekende en denkt creatief. Laag: je houdt van het praktische en bewezen methodes.' }
  ];
  var BY_KEY = {};
  TRAITS.forEach(function (t) { BY_KEY[t.key] = t; });
  var MIN_ANSWERS = 13;

  /* ---- The 12 score profiles (doc: "HEXACO SWOT: points per trait") ---- */
  var P = {
    H_high: { s: 'Betrouwbaar en eerlijk; niet uit op eigen voordeel', w: 'Kan star of naïef zijn over regels', o: 'Rolmodel en vertrouwenspersoon in de sectie', t: 'Loyaliteit aan de groep botst met melden van misstanden', v: 'Vertrouwen', a: 'Benoem een kleine regelovertreding direct en zonder oordeel', why: 'Een team volgt een officier die het voorbeeld geeft.' },
    H_low: { s: 'Pragmatisch; durft eigen belang te benoemen', w: 'Kan regels oprekken of als berekenend overkomen', o: 'Oefenen met open zijn over je eigen belang', t: 'Sluiproutes onder tijdsdruk; vertrouwensverlies als het uitkomt', v: 'Vertrouwen', a: 'Vraag na elke opdracht een buddy: "waar koos ik voor mezelf?"', why: 'Vertrouwen is de basis van gezag; het is snel kwijt en traag terug.' },
    E_high: { s: "Empathisch; ziet hoe het met anderen gaat; voorzichtig met risico's", w: 'Piekeren en twijfel bij beslissen onder druk', o: 'Zorgzame leider; spanning bij anderen vroeg zien', t: 'Stress loopt op bij slaaptekort en veldoefeningen', v: 'Verbondenheid', a: 'Maak een stressplan: 3 vaste herstelmomenten en tactisch ademen', why: 'Onder druk moet je beslissen terwijl je team naar jou kijkt.' },
    E_low: { s: 'Kalm en stressbestendig; objectief in een crisis', w: 'Kan afstandelijk lijken; onderschat andermans spanning', o: 'Rust uitstralen bij incidenten', t: "Overbelasting bij teamleden of echte risico's missen", v: 'Veiligheid', a: 'Vraag elke dag één teamlid: "hoe gaat het echt?"', why: 'Jouw rust helpt het team, mits je ziet wat er in anderen omgaat.' },
    X_high: { s: 'Zelfverzekerd en sociaal; neemt initiatief', w: 'Praat voordat je luistert; overstemt anderen', o: 'Natuurlijke rol bij briefings en groepsopdrachten', t: 'Stillere teamleden houden input voor zich', v: 'Verbondenheid', a: 'Laat bij elk overleg eerst twee anderen spreken', why: 'Een goed besluit gebruikt de kennis van het hele team.' },
    X_low: { s: 'Luistert en observeert; denkt na voor je spreekt', w: 'Terughoudend in de groep; je intenties blijven onzichtbaar', o: 'Oefenen met luid en duidelijk commando geven', t: 'Je wordt over het hoofd gezien; anderen nemen het initiatief', v: 'Verantwoordelijkheid', a: 'Neem in elk overleg één keer als eerste het woord', why: 'Een officier moet zichtbaar en hoorbaar leidinggeven.' },
    A_high: { s: 'Geduldig, vergevingsgezind, verbindend', w: 'Vermijdt conflict; te mild bij feedback; moeite met nee zeggen', o: 'Bemiddelaar en bewaker van de teamsfeer', t: 'Ongewenst gedrag te lang laten gaan; overvraagd worden', v: 'Veiligheid', a: 'Geef deze week één keer directe feedback op basis van een DTF-feit', why: 'Ingrijpen bij ongewenst gedrag hoort bij een veilige eenheid.' },
    A_low: { s: 'Kritisch en direct; houdt de standaard hoog', w: 'Ongeduldig; kan hard overkomen', o: 'Eerlijke kwaliteitsbewaker in de sectie', t: 'Conflicten; mensen haken af', v: 'Verbondenheid', a: 'Vraag eerst "wat is jouw kant?" voordat je reageert', why: 'Je standaard werkt pas als het team je blijft volgen.' },
    C_high: { s: 'Georganiseerd, plichtsgetrouw, nauwkeurig', w: 'Perfectionisme; moeite met improviseren en loslaten', o: 'Sterk in planning, logistiek en voorbereiding', t: 'Vastlopen als het plan verandert; jezelf overbelasten', v: 'Verantwoordelijkheid', a: 'Oefen "80% is goed genoeg" en delegeer één taak per week', why: 'Plannen veranderen altijd; een officier moet kunnen bijsturen.' },
    C_low: { s: 'Flexibel; schakelt snel als het anders loopt', w: 'Slordig onder tijdsdruk; uitstellen', o: 'Sterk in dynamische, onvoorspelbare situaties', t: 'Details missen bij uitvoering; als onbetrouwbaar gezien worden', v: 'Verantwoordelijkheid', a: 'Gebruik een vaste checklist en plan elke avond de volgende dag', why: 'In het veld kan één gemist detail grote gevolgen hebben.' },
    O_high: { s: 'Nieuwsgierig en creatief; leert snel iets nieuws', w: 'Vindt procedures snel overbodig; ideeën zonder uitvoering', o: 'Alternatieve oplossingen bij planvorming', t: 'Botsing met strakke hiërarchie en vaste procedures', v: 'Verantwoordelijkheid', a: 'Koppel elk idee aan een eerste concrete stap; vraag naar het waarom van een procedure', why: 'Creativiteit helpt, mits het past binnen opdracht en procedure.' },
    O_low: { s: 'Praktisch en nuchter; houdt van bewezen methodes', w: 'Weerstand tegen verandering', o: 'Betrouwbaar in drills en vaste procedures', t: 'Vastlopen als het plan niet past', v: 'Veiligheid', a: 'Bedenk bij elke opdracht één plan B', why: 'Situaties lopen zelden volgens plan; een plan B geeft rust.' }
  };

  var COMBOS = [
    { name: 'Doorpakker', when: { X: 'high', A: 'low' }, mean: 'Stuurt snel en direct; anderen voelen zich overruled', a: 'Vraag na een beslissing expliciet om tegenspraak' },
    { name: 'Perfectionist onder druk', when: { C: 'high', E: 'high' }, mean: 'Hoge eisen plus piekeren: grootste risico op overbelasting', a: 'Plan herstel net zo strak als je werk' },
    { name: 'Koel en kritisch', when: { E: 'low', A: 'low' }, mean: 'Sterk in een crisis, maar het team voelt zich niet gezien', a: 'Benoem na een zware dag wat goed ging bij anderen' },
    { name: 'Principieel en strikt', when: { H: 'high', C: 'high' }, mean: 'Betrouwbaar voorbeeld; kan oordelend zijn over anderen', a: 'Vraag eerst naar de reden voordat je corrigeert' },
    { name: 'Ideeënmens', when: { O: 'high', C: 'low' }, mean: 'Veel ideeën, weinig afgerond', a: 'Kies per week één idee en maak het af' },
    { name: 'Stille uitvoerder', when: { X: 'low', C: 'high' }, mean: 'Levert goed werk dat niemand ziet', a: 'Meld je resultaat zelf bij je teamleider' },
    { name: 'Vredebewaker', when: { A: 'high', X: 'low' }, mean: 'Ingrijpen bij ongewenst gedrag is lastig', a: 'Spreek van tevoren met jezelf af wanneer je ingrijpt' },
    { name: 'Binnenvetter', when: { E: 'high', X: 'low' }, mean: 'Spanning blijft binnen en loopt ongezien op', a: 'Kies een vaste buddy om dagelijks mee te checken' },
    { name: 'Indrukmaker', when: { H: 'low', X: 'high' }, mean: 'Invloed via indruk maken; vertrouwen kan wankel zijn', a: 'Laat je daden je woorden een week lang voorgaan' },
    { name: 'Laid-back', when: { E: 'low', C: 'low' }, mean: 'Kalm, maar risico op onderschatting en slordigheid bij veiligheid', a: 'Werk veiligheidsstappen altijd af met een checklist' }
  ];

  function band(p) { return p == null ? null : (p < 35 ? 'low' : (p > 65 ? 'high' : 'mid')); }

  /** answers: {questionId: 1..5}; questions: [{id, trait, reversed}] → {H: {score, n}, ...} */
  function score(answers, questions) {
    var acc = {};
    TRAITS.forEach(function (t) { acc[t.key] = { sum: 0, n: 0, total: 0 }; });
    (questions || []).forEach(function (q) {
      var a = acc[q.trait]; if (!a) return;
      a.total++;
      var raw = answers && answers[q.id];
      if (!raw) return;
      raw = Number(raw);
      a.sum += q.reversed ? (6 - raw) : raw;
      a.n++;
    });
    var out = {};
    TRAITS.forEach(function (t) {
      var a = acc[t.key];
      out[t.key] = { score: a.n >= Math.min(MIN_ANSWERS, a.total) && a.n > 0 ? Math.round(((a.sum / a.n) - 1) / 4 * 100) : null, n: a.n, total: a.total };
    });
    return out;
  }
  function answeredCount(answers) { return Object.keys(answers || {}).filter(function (k) { return answers[k]; }).length; }
  function isComplete(scores) { return TRAITS.every(function (t) { return scores[t.key] && scores[t.key].score != null; }); }
  function plain(scores) { var o = {}; TRAITS.forEach(function (t) { o[t.key] = scores[t.key] ? scores[t.key].score : null; }); return o; }

  /** Average observer scores per trait + spread */
  function observerScores(observers, questions) {
    var per = (observers || []).map(function (o) { return { name: o.name, role: o.role, s: plain(score(o.answers || {}, questions)) }; })
      .filter(function (o) { return TRAITS.some(function (t) { return o.s[t.key] != null; }); });
    var avg = {}, spread = {};
    TRAITS.forEach(function (t) {
      var vals = per.map(function (o) { return o.s[t.key]; }).filter(function (v) { return v != null; });
      avg[t.key] = vals.length ? Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / vals.length) : null;
      spread[t.key] = vals.length > 1 ? Math.max.apply(null, vals) - Math.min.apply(null, vals) : 0;
    });
    return { count: per.length, per: per, avg: avg, spread: spread };
  }

  /** Full analysis. self: {H: n|null}, others: result of observerScores (optional) */
  function analyse(self, others) {
    var items = { s: [], w: [], o: [], t: [] }, middle = [];
    var ranked = TRAITS.filter(function (t) { return self[t.key] != null; })
      .map(function (t) { return { t: t, v: self[t.key], d: Math.abs(self[t.key] - 50) }; })
      .sort(function (a, b) { return b.d - a.d; });
    ranked.forEach(function (r) {
      var b = band(r.v);
      if (b === 'mid') { middle.push({ trait: r.t, score: r.v }); return; }
      var p = P[r.t.key + '_' + b];
      var base = { trait: r.t, score: r.v, band: b, v: p.v, why: p.why, action: p.a };
      items.s.push(Object.assign({ text: p.s }, base));
      items.w.push(Object.assign({ text: p.w }, base));
      items.o.push(Object.assign({ text: p.o }, base));
      items.t.push(Object.assign({ text: p.t }, base));
    });
    Object.keys(items).forEach(function (k) { items[k] = items[k].slice(0, 3); });
    var bands = {}; TRAITS.forEach(function (t) { bands[t.key] = band(self[t.key]); });
    var combos = COMBOS.filter(function (c) { return Object.keys(c.when).every(function (k) { return bands[k] === c.when[k]; }); }).slice(0, 2);
    var sorted = TRAITS.filter(function (t) { return self[t.key] != null; }).sort(function (a, b) { return self[b.key] - self[a.key]; });
    var gaps = [];
    if (others && others.count) {
      TRAITS.forEach(function (t) {
        var s = self[t.key], o = others.avg[t.key];
        if (s == null || o == null) return;
        if (o - s >= 15) gaps.push({ kind: 'hidden', trait: t, self: s, others: o, text: 'Anderen zien meer ' + t.name.toLowerCase() + ' in je dan jij zelf.' });
        else if (s - o >= 15) gaps.push({ kind: 'blind', trait: t, self: s, others: o, text: 'Jij ziet jezelf als ' + t.high.split(',')[0] + '; anderen ervaren dat minder.' });
        if (others.spread[t.key] >= 25) gaps.push({ kind: 'mixed', trait: t, text: 'Je observatoren zien ' + t.name.toLowerCase() + ' verschillend: je gedrag verschilt mogelijk per situatie of per persoon.' });
      });
    }
    return { quadrants: items, middle: middle, combos: combos, gaps: gaps, highest: sorted[0] || null, lowest: sorted[sorted.length - 1] || null, bands: bands };
  }

  /** The 4 V's indication, same formula as before but on the corrected scale */
  function vIndication(s) {
    if (!TRAITS.every(function (t) { return s[t.key] != null; })) return null;
    return {
      Verbondenheid: Math.round((s.X + s.A) / 2),
      Veiligheid: Math.round(((100 - s.E) + s.C) / 2),
      Vertrouwen: Math.round((s.H + s.A) / 2),
      Verantwoordelijkheid: Math.round((s.C + s.H) / 2)
    };
  }

  /* ---- Onderbouwing: waarop de 4 V-indicatie en de SWOT rusten (zie het onderbouwingsdocument) ---- */
  var V_BASIS = {
    Verbondenheid: { parts: [{ key: 'X' }, { key: 'A' }],
      why: 'Verdraagzaamheid hangt in meta-analyses samen met de prestaties van teams (Peeters e.a., 2006). Extraversie hangt samen met het nemen van initiatief en leiderschap in groepen (Judge e.a., 2002).' },
    Veiligheid: { parts: [{ key: 'E', rev: true }, { key: 'C' }],
      why: 'Consciëntieusheid hangt samen met veilig werken en het naleven van regels (Christian e.a., 2009; Beus e.a., 2015). Een lage emotionaliteit staat voor kalm blijven onder druk. Let op: emotionaliteit omvat ook voorzichtigheid, en die kan juist bijdragen aan veiligheid. Deze koppeling is daarom het minst sterk onderbouwd.' },
    Vertrouwen: { parts: [{ key: 'H' }, { key: 'A' }],
      why: 'Integriteit (Honesty-Humility) voorspelt integer gedrag en minder regelovertreding op het werk, beter dan de Big Five (Lee, Ashton en De Vries, 2005; Pletzer e.a., 2019). Verdraagzaamheid hangt samen met vergevingsgezindheid en minder conflict (Ashton en Lee, 2007).' },
    Verantwoordelijkheid: { parts: [{ key: 'C' }, { key: 'H' }],
      why: 'Consciëntieusheid is de meest consistente persoonlijkheidsvoorspeller van werkprestaties (Barrick en Mount, 1991). Integriteit hangt samen met minder contraproductief gedrag (Pletzer e.a., 2019).' }
  };
  /** Ruime band in plaats van een exact percentage: de indicatie is niet zo precies als een getal suggereert. */
  function vBand(p) {
    if (p == null) return null;
    if (p > 60) return { key: 'sterk', label: 'Sterk', step: 3 };
    if (p < 40) return { key: 'aandacht', label: 'Aandachtspunt', step: 1 };
    return { key: 'gemiddeld', label: 'Gemiddeld', step: 2 };
  }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function vBandHtml(p) {
    var b = vBand(p);
    if (!b) return '<span class="kma-vband none">-</span>';
    return '<span class="kma-vband ' + b.key + '" title="' + b.label + '"><span class="kma-vband-dots" aria-hidden="true"><i' + (b.step >= 1 ? ' class="on"' : '') + '></i><i' + (b.step >= 2 ? ' class="on"' : '') + '></i><i' + (b.step >= 3 ? ' class="on"' : '') + '></i></span><b>' + b.label + '</b></span>';
  }
  function partName(pt) { var t = BY_KEY[pt.key]; return pt.rev ? 'lage ' + t.name.toLowerCase() : t.name.toLowerCase(); }
  function partVal(pt, s) { var v = s && s[pt.key]; return v == null ? null : (pt.rev ? 100 - v : v); }
  var SCALE_NOTE = 'Een score van 0 tot 100 is je gemiddelde antwoord omgerekend: helemaal oneens is 0, neutraal is 50, helemaal eens is 100. Het is geen percentage en geen vergelijking met andere cadetten.';
  function whyBox(title, body) {
    return '<details class="kma-why"><summary>Hoe komt dit tot stand?</summary><div class="kma-why-body"><strong>' + title + '</strong>' + body + '</div></details>';
  }
  /** Uitleg bij de 4 V-indicatie; met s (eigen scores) ook de eigen tussenstappen. */
  function explainV(s) {
    var rows = Object.keys(V_BASIS).map(function (v) {
      var b = V_BASIS[v], vals = b.parts.map(function (pt) { return partVal(pt, s); }), ok = vals.every(function (x) { return x != null; });
      var calc = ok ? ' Jouw scores: ' + b.parts.map(function (pt, i) { return partName(pt) + ' ' + Math.round(vals[i]); }).join(' en ') + ', samen ' + Math.round((vals[0] + vals[1]) / 2) + ' (' + vBand((vals[0] + vals[1]) / 2).label.toLowerCase() + ').' : '';
      return '<li><b>' + v + '</b>: gemiddelde van ' + b.parts.map(partName).join(' en ') + ', elk telt voor de helft.' + esc(calc) + '<br><span class="kma-why-lit">' + esc(b.why) + '</span></li>';
    }).join('');
    return whyBox('Zo wordt de indicatie berekend', '<ul>' + rows + '</ul>' +
      '<p>Banden: onder 40 aandachtspunt, 40 tot 60 gemiddeld, boven 60 sterk. Een band is eerlijker dan een exact getal, omdat een vragenlijst nooit precies meet.</p>' +
      '<p>' + SCALE_NOTE + '</p>' +
      '<p><b>Wat nog niet bekend is.</b> De koppeling met de 4 V\'s is door de ontwikkelaar gemaakt op basis van de literatuur hierboven. Er is nog niet onderzocht of deze indicatie samenhangt met de beoordeling door je teamleider. Gebruik de indicatie daarom als begin van een gesprek, niet als oordeel. Hij mag niet worden gebruikt voor selectie of beoordeling.</p>' +
      '<p class="kma-why-src">Vragenlijst: IPIP-HEXACO (Ashton, Lee en Goldberg, 2007), publiek domein, Nederlandse vertaling gemaakt voor deze app. Model: Ashton en Lee (2007).</p>');
  }
  /** Uitleg bij de SWOT en de profielteksten. */
  function explainSwot() {
    return whyBox('Zo ontstaat je SWOT', '<ul>' +
      '<li>Per eigenschap kijkt de app of je score uitgesproken is: <b>onder 35</b> telt als laag, <b>boven 65</b> als hoog. Daartussen krijg je geen punten, want dan kun je per situatie kiezen.</li>' +
      '<li>Bij een lage of hoge score hoort een vaste tekst voor sterke kant, valkuil, kans en bedreiging. Die teksten zijn geschreven door de ontwikkelaar op basis van de beschrijving van de HEXACO-eigenschappen (Ashton en Lee, 2007) en vertaald naar de militaire praktijk.</li>' +
      '<li>Per vak zie je hoogstens 3 punten: die van de eigenschappen die het verst van het midden liggen.</li>' +
      '<li>Bij sommige combinaties van scores verschijnt een extra uitleg met een tip (Probeer dit).</li></ul>' +
      '<p>' + SCALE_NOTE + '</p>' +
      '<p><b>Wat nog niet bekend is.</b> Of cadetten zich herkennen in deze teksten en of de tips werken, is nog niet onderzocht. Herken je iets niet? Bespreek het met je teamleider of met de mensen die je observeren.</p>');
  }

  /** Uitleg bij de eigenschapsscores en het verschil tussen zelfbeeld en observatoren. */
  function explainProfile() {
    return whyBox('Zo lees je de scores', '<ul>' +
      '<li>' + SCALE_NOTE + '</li>' +
      '<li>Elke eigenschap wordt gemeten met 16 stellingen uit de IPIP-HEXACO (Ashton, Lee en Goldberg, 2007). Bij sommige stellingen telt het antwoord omgekeerd.</li>' +
      '<li><b>Verborgen kracht</b> of <b>mogelijke blinde vlek</b>: de observatoren scoren gemiddeld minstens 15 punten hoger of lager dan je zelf. <b>Wisselend beeld</b>: de observatoren verschillen onderling minstens 25 punten.</li>' +
      '<li>Bij weinig observatoren is het gemiddelde onzeker. Vanaf 3 observatoren wordt het beeld betrouwbaarder.</li></ul>' +
      '<p><b>Wat nog niet bekend is.</b> De Nederlandse vertaling van de stellingen is gemaakt voor deze app en nog niet apart onderzocht. Het origineel is wel uitgebreid onderzocht.</p>');
  }

  /* 4.7.0: controle op slordig invullen. De scores veranderen niet; de app laat alleen een zin zien als de antwoorden
     op weinig aandacht wijzen. Drie bekende controles (Johnson, 2005; Huang e.a., 2012; Meade & Craig, 2012):
      - een lange reeks hetzelfde antwoord achter elkaar (vanaf LONG stellingen);
      - lage samenhang tussen de twee helften van elk facet (even-oneven-consistentie, Spearman-Brown, onder EO_MIN);
      - heel snel ingevuld: gemiddeld minder dan 2 seconden per stelling (alleen als de app de tijd kent).
     De drempels zijn een keuze van de app en gelden als signaal, niet als oordeel. */
  var LONG = 20, EO_MIN = 0.30, SEC_PER_ITEM = 2;
  function quality(answers, questions, timing) {
    var qs = questions || [], vals = qs.map(function (q) { return Number(answers && answers[q.id]) || 0; });
    if (!qs.length || vals.some(function (v) { return !v; })) return null;
    var flags = [], run = 1, max = 1;
    for (var i = 1; i < vals.length; i++) { run = vals[i] === vals[i - 1] ? run + 1 : 1; if (run > max) max = run; }
    if (max >= LONG) flags.push({ key: 'long', text: 'Bij ' + max + ' stellingen achter elkaar is hetzelfde antwoord gegeven.' });
    var fac = {}, order = [];
    qs.forEach(function (q, idx) {
      var k = q.trait + '|' + (q.facet || ''); if (!fac[k]) { fac[k] = []; order.push(k); }
      fac[k].push(q.reversed ? 6 - vals[idx] : vals[idx]);
    });
    var xs = [], ys = [];
    order.forEach(function (k) {
      var v = fac[k]; if (v.length < 2) return;
      var odd = v.filter(function (_, j) { return j % 2 === 0; }), even = v.filter(function (_, j) { return j % 2 === 1; });
      xs.push(odd.reduce(function (a, b) { return a + b; }, 0) / odd.length); ys.push(even.reduce(function (a, b) { return a + b; }, 0) / even.length);
    });
    var eo = null;
    if (xs.length >= 10) {
      var mx = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length, my = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length, sxy = 0, sxx = 0, syy = 0;
      xs.forEach(function (x, j) { sxy += (x - mx) * (ys[j] - my); sxx += (x - mx) * (x - mx); syy += (ys[j] - my) * (ys[j] - my); });
      if (sxx > 0 && syy > 0) { var r = sxy / Math.sqrt(sxx * syy); eo = r > -1 ? 2 * r / (1 + r) : -1; }
      if (eo != null && eo < EO_MIN) flags.push({ key: 'inconsistent', text: 'Antwoorden op stellingen die bij elkaar horen, spreken elkaar vaak tegen.' });
    }
    var secs = null;
    if (timing && typeof timing.first === 'number' && typeof timing.last === 'number' && timing.last >= timing.first) {
      secs = Math.round((timing.last - timing.first) / 1000);
      if (secs < qs.length * SEC_PER_ITEM) flags.push({ key: 'fast', text: 'De test is in ' + Math.max(1, Math.round(secs / 60)) + (secs < 90 ? ' minuut' : ' minuten') + ' ingevuld; dat is minder dan 2 seconden per stelling.' });
    }
    return { ok: !flags.length, flags: flags, longstring: max, evenOdd: eo, seconds: secs };
  }
  function qualityHtml(q, who) {
    if (!q || q.ok) return '';
    return '<div class="kma-alert kma-hex-quality"><span><strong>Deze uitslag is mogelijk minder betrouwbaar.</strong> ' + q.flags.map(function (f) { return esc(f.text); }).join(' ') +
      ' ' + (who === 'cadet' ? 'Dat kan gebeuren als je snel of zonder aandacht invult. Lees de stellingen nog eens rustig door en pas aan waar nodig.' : 'Bespreek de uitslag daarom voorzichtig, of vraag de cadet de test rustig opnieuw te maken.') +
      ' De scores zelf zijn niet aangepast.</span></div>';
  }

  window.KMAHex = { TRAITS: TRAITS, quality: quality, qualityHtml: qualityHtml, QUALITY: { LONG: LONG, EO_MIN: EO_MIN, SEC_PER_ITEM: SEC_PER_ITEM }, BY_KEY: BY_KEY, PROFILES: P, COMBOS: COMBOS, MIN_ANSWERS: MIN_ANSWERS,
    band: band, score: score, plain: plain, answeredCount: answeredCount, isComplete: isComplete,
    observerScores: observerScores, analyse: analyse, vIndication: vIndication,
    V_BASIS: V_BASIS, vBand: vBand, vBandHtml: vBandHtml, explainV: explainV, explainSwot: explainSwot, explainProfile: explainProfile, SCALE_NOTE: SCALE_NOTE };
})();
