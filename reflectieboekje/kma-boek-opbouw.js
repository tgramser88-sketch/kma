/*
 * Overal dezelfde opbouw per hoofdstuk (4.18.0, blok P4): bovenaan elk hoofdstuk één kaart met
 * "Wat is dit?" (de ondertitel van het hoofdstuk), "Wat doe je hier?" en "Waarom?" met de knop "Waarom zo?"
 * naar het juiste stuk van de wetenschappelijke onderbouwing (kma-onderbouwing.js). Daaronder volgen de invoer
 * en het overzicht zoals elk hoofdstuk die al heeft.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined' || typeof kmaAfter !== 'function') return;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  /* Per hoofdstuk (op titel): wat doe je hier, waarom, en welk onderdeel van de onderbouwing ('' = de hele pagina). */
  var OPBOUW = {
    'Cadet Informatie & Profiel': ['Vul je gegevens in. Dit is de basis van je dossier en je portfolio.', 'Je teamleider weet zo wie je bent en waar je vandaan komt.', ''],
    'Introductie & Drijfveren': ['Beantwoord de vragen over wat je drijft en wat je wilt leren.', 'Weten wat je wilt is de eerste stap van zelfsturend leren: vooruitdenken, doen, terugkijken.', 'zelfregulatie'],
    'Ontwikkelbiografie Tijdlijn': ['Zet belangrijke gebeurtenissen uit je leven op een lijn en schrijf op wat ze met je deden.', 'Leiderschap groeit via ervaring en zelfbeeld; je levenslijn laat zien waar je vandaan komt.', 'coaching'],
    'Persoonlijkheidstest (IPIP)': ['Maak de test (96 stellingen, ongeveer 15 minuten) en vraag medecadetten om je te observeren.', 'Je ziet je sterke kanten en valkuilen op zes eigenschappen; anderen zien soms wat jij mist.', 'hexaco'],
    'Ik en de Gedragscode Defensie': ['Beschrijf per V wat die waarde voor jou betekent, met een eigen voorbeeld.', 'De 4 V\'s zijn de maatstaf bij je beoordeling; met concrete voorbeelden worden ze bespreekbaar.', 'dtf'],
    'Zelfbeoordelingsformulier KMA': ['Beoordeel jezelf op het officiële formulier, met voorbeelden uit je DTF-logboek.', 'Een oordeel dat op feiten rust kun je naast dat van je teamleider leggen en bespreken.', 'datapunten'],
    'Ik als officier': ['Beschrijf wat voor officier je wilt worden.', 'Een helder beeld van waar je naartoe werkt geeft richting aan je leervragen.', 'zelfregulatie'],
    'SMART Leervraag': ['Schrijf één leervraag, maak een als-dan-plan en check elke week in.', 'Een concreet doel met een als-dan-plan vergroot de kans dat je het in de situatie ook echt doet.', 'smart'],
    'Zelfreflectie Leervraag (5G-T)': ['Kies een situatie en loop de vier stappen door: 5G, verdieping, invloed en toekomst.', 'Je toetst je gedachte aan de feiten en kiest bewust wat je de volgende keer doet.', '5gt'],
    'Procesreflectie (Korthagen)': ['Loop een situatie door in vijf fasen en eindig met iets om uit te proberen.', 'Reflectie levert pas iets op als ze eindigt in ander gedrag.', 'korthagen'],
    'Probleem- en Behoefteanalyse': ['Ontleed een probleem: wat speelt er, wat heb je nodig en wat ga je doen?', 'Eerst ontleden en dan kiezen voorkomt dat je het verkeerde probleem oplost.', ''],
    'Datum-Tijd-Feit Logboek': ['Leg na een gebeurtenis kort vast: datum, tijd, wat er feitelijk gebeurde en bij welke V het hoort.', 'Feiten kun je bespreken en verbeteren, oordelen niet. Ze zijn je bewijs bij de beoordeling.', 'dtf'],
    'Begrippenlijst & Vakjargon': ['Zoek begrippen op of voeg je eigen begrippen toe.', 'Een gedeelde taal maakt feedback en gesprekken duidelijker.', ''],
    'Voorbereiding Cadetbeoordeling': ['Bekijk je datapunten per V en bereid je beoordelingsgesprek voor.', 'Een beoordeling rust op veel observaties uit meerdere bronnen; hier zie je wat je teamleider van je weet.', 'datapunten'],
    'Fitheid & stress': ['Houd je trainingen bij en doe af en toe de stress- en welzijnscheck. Dit blijft altijd privé.', 'Je ziet op tijd of de druk oploopt, vergeleken met je eigen vorige meting.', 'pss'],
    'Toetsing en examinering DKOO': ['Zoek op hoe toetsing en examinering in de opleiding werken.', 'Weten hoe je beoordeeld wordt helpt je gericht te leren en datapunten te verzamelen.', 'datapunten'],
    'Mijn groei & ontwikkeling': ['Kijk terug: wat is er over de tijd veranderd?', 'Terugkijken is de derde stap van zelfsturend leren; zonder terugblik blijft groei onzichtbaar.', 'zelfregulatie'],
    'Curriculum vitae': ['Houd je opleidingen, functies en prestaties bij.', 'Je portfolio en latere sollicitaties beginnen hier.', ''],
    'Roos van Leary': ['Bekijk hoe jij en anderen je gedrag op de roos zetten.', 'Gedrag lokt gedrag uit; als je je positie kent, kun je bewuster kiezen hoe je een ander beïnvloedt.', 'leary']
  };
  /* Leertaken uit het O&iT-voorstel DKOO die bij dit hoofdstuk horen (4.18.0, blok R0; alleen volledig of deels in de app). */
  var LEERTAKEN = {
    'Introductie & Drijfveren': ['MMV 02', 'GV 02', 'GV 04'],
    'Ontwikkelbiografie Tijdlijn': ['Ref 03', 'Ref 17'],
    'Ik en de Gedragscode Defensie': ['GI&E 00', 'GI&E 01', 'GV 05', 'IIV 06'],
    'SMART Leervraag': ['MMV 03', 'MMV 07', 'MMV 11', 'Ref 16', 'IIV 04'],
    'Zelfreflectie Leervraag (5G-T)': ['Ref 02', 'MMV 04', 'MMV 08'],
    'Procesreflectie (Korthagen)': ['Ref 02', 'Ref 04'],
    'Datum-Tijd-Feit Logboek': ['LeO 01', 'GV 06', 'Ref 04'],
    'Fitheid & stress': ['WFM 01', 'WFM 02', 'WFM 03', 'MMV 09', 'MMV 12', 'LO&S 01'],
    'Toetsing en examinering DKOO': ['LO&S 02', 'LO&S 03'],
    'Mijn groei & ontwikkeling': ['IIV 09', 'Ref 16', 'EVA 00'],
    'Roos van Leary': ['LeO 05', 'LeO 06', 'LeO 07', 'LeO 08', 'LeO 09']
  };
  function voor(idx) { var s = steps[idx]; return s ? OPBOUW[s.title] || null : null; }
  function render() {
    var old = document.getElementById('kma-opbouw'); if (old) old.remove();
    var head = document.querySelector('.content-panel .section-heading');
    var o = typeof currentStepIndex !== 'undefined' ? voor(currentStepIndex) : null;
    document.body.classList.toggle('kma-met-opbouw', !!(head && o));
    if (!head || !o) return;
    var link = window.kmaOnderbouwing ? '<button type="button" class="kma-waarom" data-waarom="' + esc(o[2]) + '">' + (window.kmaIcon ? kmaIcon('idea') : '') + 'Waarom zo?</button>' : '';
    var card = document.createElement('div');
    card.id = 'kma-opbouw'; card.className = 'kma-opbouw';
    card.innerHTML = '<div class="kma-ob-rij"><b>Wat doe je hier?</b><span>' + esc(o[0]) + '</span></div>' +
      '<div class="kma-ob-rij"><b>Waarom?</b><span>' + esc(o[1]) + '</span></div>' + (link ? '<div class="kma-ob-knop">' + link + '</div>' : '') +
      (window.kmaLeertaak && LEERTAKEN[steps[currentStepIndex].title] ? '<div class="kma-ob-lt">' + kmaLeertaak.labels(LEERTAKEN[steps[currentStepIndex].title]) + '</div>' : '');
    head.parentNode.insertBefore(card, head.nextSibling);
  }
  kmaAfter('renderStep', render);
  try { render(); } catch (e) { console.error(e); }
  window.kmaOpbouw = { render: render, voor: voor, OPBOUW: OPBOUW, LEERTAKEN: LEERTAKEN };
})();
