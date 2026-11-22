/*
 * Verwijzingen naar de leertaken van het O&iT-voorstel DKOO (concept 15-06-2026) in beide apps (4.18.0, blok R0).
 * Alleen de leertaken die de apps volledig of deels ondersteunen (analyse: docs/kma-context/DKOO-OiT-dekking.md).
 * kmaLeertaak.label('Ref 04') geeft een klein label; tikken toont in gewone taal wat de leertaak vraagt en wat de app
 * daarbij doet. kmaLeertaak.labels(['Ref 02', 'MMV 08']) geeft er een paar achter elkaar. Teksten zijn eigen
 * samenvattingen, geen citaten uit het voorstel.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  // code: [titel, blok, wat de cadet leert (kort), wat de app doet, 'volledig' | 'deels']
  var LT = {
    'Ref 02': ['Reflecteren op een onderwerp naar keuze', 'Themablok 1', 'Zelf een situatie kiezen en daarop reflecteren.', '5G-T en Korthagen.', 'volledig'],
    'Ref 03': ['Verantwoordelijkheden bij reflecteren; autobiografie', 'Themablok 1', 'Begrijpen wat reflecteren is en beginnen aan je autobiografie "Mijn ontwikkeling door de jaren heen".', 'Ontwikkelbiografie Tijdlijn (levenslijn).', 'volledig'],
    'Ref 04': ['Reflecteren voor, tijdens en na OTV1', 'Themablok 1', 'Rond een oefening te velde terugkijken op leiderschap, team, gesprekken en mentale vaardigheden.', 'Nabespreking na een oefening, DTF-feiten en 5G-T.', 'volledig'],
    'Ref 12': ['Reflecteren voor, tijdens en na OTV2', 'Themablok 2', 'Als Ref 04, bij de tweede oefening te velde.', 'Nabespreking na een oefening, DTF-feiten en 5G-T.', 'volledig'],
    'Ref 14': ['Reflecteren voor, tijdens en na OTV3', 'Themablok 3', 'Als Ref 04, bij de derde oefening te velde.', 'Nabespreking na een oefening, DTF-feiten en 5G-T.', 'volledig'],
    'Ref 16': ['Reflecteren naar eigen behoefte', 'Themablok 3', 'Zelf bepalen waarop je reflecteert en een leer- of ontwikkelplan maken.', 'Leervraag met als-dan-plannen, reflecties en Mijn groei.', 'volledig'],
    'Ref 17': ['Reflectieopdracht Afscheidsspeech', 'Themablok 3', 'Terugkijken op je ontwikkeling sinds je autobiografie, als speech die een ander over jou houdt.', 'Levenslijn en Mijn groei als bron; een eigen opdracht ontbreekt nog.', 'deels'],
    'LeO 01': ['LTV-opdrachten', 'Themablok 1', 'Leidinggeven in kleine (groeps)opdrachten in de praktijk.', 'DTF-feit of nabespreking per opdracht.', 'deels'],
    'LeO 05': ['Communicatie- en leiderschapscircumplex, basis', 'Themablok 1', 'De assen en kwadranten van het circumplex kennen en het gedrag uitproberen.', 'Roos van Leary: hoofdstuk met uitleg, roos bij DTF en feedback.', 'volledig'],
    'LeO 06': ['Circumplex: gedrag herkennen en toepassen', 'Themablok 2', 'Gedrag en stijlen herkennen bij jezelf en anderen in een oefensetting.', 'Je eigen roos naast die van medecadetten en je teamleider.', 'volledig'],
    'LeO 07': ['Circumplex, verdieping', 'Themablok 3', 'Met het circumplex op je ervaringen reflecteren; stijlflexibiliteit en interactiepatronen.', 'Roos per sector met wat het gedrag bij anderen uitlokt.', 'volledig'],
    'LeO 08': ['Interactiepatronen en stijlflexibiliteit', 'Themablok 3', 'Patronen herkennen en bewust van stijl wisselen.', 'Uitleg bij de roos en de denkhulp met de 4V\'s.', 'deels'],
    'LeO 09': ['Gedrag voorspellen met leiderschapsstijlen', 'Themablok 3', 'Voorspellen welk gedrag een stijl in het team uitlokt.', 'Uitleg over complementariteit bij de roos.', 'deels'],
    'GI&E 00': ['Oriëntatieopdracht gedragscode', 'Themablok 1', 'De normen en waarden van Defensie benoemen.', 'Hoofdstuk Ik en de Gedragscode Defensie.', 'volledig'],
    'GI&E 01': ['Gedragscode, integriteit en ethiek', 'Themablok 1', 'In eigen woorden uitleggen wat gedragscode, integriteit en ethiek zijn; eigen normen naast die van de groep en Defensie.', 'Gedragscode-hoofdstuk en de 4V\'s bij DTF en feedback.', 'volledig'],
    'GV 01': ['Introductie en bezinning tijdens OTV', 'AMO', 'Stilstaan bij je ervaringen tijdens de oefening.', 'Nabespreking en 5G-T.', 'deels'],
    'GV 02': ['Overgang van burger naar militair', 'AMO', 'Nadenken over wat de overgang met je doet.', 'Introductie & Drijfveren en de levenslijn.', 'deels'],
    'GV 03': ['Groepsproces, sociale veiligheid en persoonlijke waarden', 'AMO', 'De groep, sociale veiligheid en je eigen waarden bespreekbaar maken.', 'Gedragscode-hoofdstuk (persoonlijke waarden).', 'deels'],
    'GV 04': ['Overgang van militair naar officier', 'Themablok 1', 'Nadenken over wat officier worden van je vraagt.', 'Introductie & Drijfveren en de levenslijn.', 'deels'],
    'GV 05': ['Sociale veiligheid, groepsproces en persoonlijke waarden', 'Themablok 1', 'Reflecteren op ervaringen, je eigen waarden benoemen en botsende waarden erkennen.', 'Gedragscode-hoofdstuk en reflecties.', 'deels'],
    'GV 06': ['Verbindende communicatie', 'Themablok 2', 'Waarnemen zonder oordeel en je gevoel en behoefte benoemen (Rosenberg).', 'DTF en feedback met de check op oordelen in plaats van feiten.', 'deels'],
    'MMV 02': ['Motivatie, de basis', 'Themablok 1', 'Bronnen van motivatie kennen en weten hoe je ze beïnvloedt.', 'Introductie & Drijfveren.', 'deels'],
    'MMV 03': ['Motivatie, doelen stellen', 'Themablok 1', 'Gerichte doelen stellen en ernaar handelen.', 'SMART-leervraag, als-dan-plannen, doel in vijf niveaus (GAS).', 'volledig'],
    'MMV 04': ['Motivatie, zelfspraak', 'Themablok 1', 'Positieve zelfspraak inzetten en omgaan met negatieve.', '5G-T: je belangrijkste gedachte toetsen en een alternatief bedenken.', 'deels'],
    'MMV 07': ['Zelfvertrouwen, verbeelding', 'Themablok 1', 'Verbeelding gebruiken om je voor te bereiden.', 'WOOP: je de uitkomst en het obstakel voorstellen.', 'deels'],
    'MMV 08': ['Zelfvertrouwen, emotieregulatie', 'Themablok 1', 'Emoties herkennen, waarderen en plaatsen in het 5G-schema.', '5G-T met het emotiewiel.', 'volledig'],
    'MMV 09': ['Weerbaarheid, de basis', 'Themablok 2', 'Weten wat weerbaarheid is en hoe je die opbouwt.', 'Stresscheck en welzijnscheck (privé).', 'deels'],
    'MMV 11': ['Zelfregulatie, de basis', 'Themablok 2', 'Regie nemen over je ontwikkeling met de PDCA-cyclus en terugblikken.', 'Leervraag, als-dan-plan, wekelijkse check-in en terugblik.', 'volledig'],
    'MMV 12': ['Zelfregulatie, coping', 'Themablok 2', 'Stress herkennen en copingstrategieën kiezen.', 'Stresscheck met signaal bij stijging (privé).', 'deels'],
    'IIV 01': ['Aanspreken van elkaar', 'Themablok 2', 'Elkaar aanspreken, met het OFGA-model.', 'Feedbackkaart aan een medecadet (situatie, feit, effect, volgende stap).', 'deels'],
    'IIV 02': ['Persoonlijke leiderschapsontwikkeling, theorie 1', 'Themablok 2', 'Emoties herkennen, doorvragen, inleven en systematisch reflecteren.', 'Reflecties en feedback van medecadetten.', 'deels'],
    'IIV 03': ['Het OFGA-gespreksmodel', 'Themablok 2', 'Een gesprek openen, de feitelijke en de gewenste situatie duiden en afsluiten.', 'Feedbackkaart; de vier stappen van OFGA heten in de app anders.', 'deels'],
    'IIV 04': ['Persoonlijke leiderschapsontwikkeling, praktijk 1', 'Themablok 2', 'Feedback geven en ontvangen en je ontwikkelpunt formuleren als HKI-vraag ("Hoe kan ik ...?").', 'Feedback geven en vragen, "Wat ga je ermee doen?", leervraag.', 'deels'],
    'IIV 05': ['Persoonlijke leiderschapsontwikkeling, theorie 2', 'Themablok 3', 'Feedback geven en ontvangen over gedrag en houding; HKI-vraag.', 'Feedback van medecadetten en de leervraag.', 'deels'],
    'IIV 06': ['Normbeelden', 'Themablok 3', 'Je eigen normen over het officierschap naast die van de organisatie leggen.', 'Gedragscode-hoofdstuk.', 'deels'],
    'IIV 09': ['Persoonlijke leiderschapsontwikkeling, praktijk 2', 'Themablok 3', 'Zelf kiezen met welke vaardigheden je experimenteert.', 'Leervraag, DTF, feedback en Mijn groei.', 'volledig'],
    'TEM 07': ['Teamleren stimuleren', 'Themablok 3', 'Gedrag in het team evalueren en verbeterpunten formuleren.', 'Nabespreking van een oefening in het CVS; het teameffectiviteitsmodel zelf ontbreekt.', 'deels'],
    'WFM 01': ['Slaap, de basis', 'Themablok 1', 'Effecten van slaapverstoring bij jezelf herkennen.', 'Fitheidslogboek met slaap en een melding bij slecht slapen.', 'deels'],
    'WFM 02': ['Slaap te velde', 'Themablok 1', 'Slaapstrategieën toepassen, zoals een powernap.', 'Fitheidslogboek met slaap.', 'deels'],
    'WFM 03': ['Slaap en studie', 'Themablok 2', 'Slaap in je studiepatroon inpassen en weten wanneer slaapproblemen om actie vragen.', 'Fitheidslogboek met slaap en de stresscheck.', 'deels'],
    'LO&S 01': ['Fysieke nulmeting', 'AMO', 'Weten hoe je er fysiek voor staat.', 'Fitheidslogboek.', 'deels'],
    'LO&S 02': ['KMA fysieke test (basis)', 'Themablok 1 en 2', 'Deelnemen aan de formatieve fysieke test.', 'Toetsing en examinering DKOO.', 'volledig'],
    'LO&S 03': ['KMA fysieke test', 'Themablok 1 t/m 3', 'De fysieke test afleggen (basis en specifiek).', 'Toetsing en examinering DKOO.', 'volledig'],
    'EVA 00': ['Weekevaluatie', 'Alle blokken', 'De afgelopen week evalueren met je groep.', 'Check-in van de week; een eigen weekcyclus volgt.', 'deels']
  };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function label(code) {
    if (!LT[code]) return '';
    return '<button type="button" class="kma-oer kma-lt" data-lt="' + esc(code) + '" title="Leertaak ' + esc(code) + ' uit het O&amp;iT-voorstel DKOO">' + esc(code) + '</button>';
  }
  function labels(codes) {
    var h = (codes || []).map(label).filter(Boolean).join('');
    return h ? '<span class="kma-lt-rij"><span class="kma-lt-kop">Leertaken</span>' + h + '</span>' : '';
  }
  function uitleg(code) {
    var x = LT[code]; if (!x) return;
    var t = 'Leertaak ' + code + ' (' + x[1] + '): ' + x[0] + '\n\n' + x[2] + '\n\nIn de app: ' + x[3] + (x[4] === 'deels' ? ' (sluit deels aan)' : '') + '\n\nO&iT-voorstel DKOO, concept 15-06-2026.';
    if (window.kmaAlert) kmaAlert(t); else alert(t);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-lt]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    uitleg(b.getAttribute('data-lt'));
  }, true);
  window.kmaLeertaak = { LT: LT, label: label, labels: labels, uitleg: uitleg };
})();
