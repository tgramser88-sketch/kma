/*
 * Reflectieboekje: voorbeeldantwoorden bij lastige vragen (4.4.0).
 * Achter de vraag staat een kleine knop "Voorbeeld". Die klapt een kort voorbeeld uit van hoe een cadet zo'n
 * vraag zou kunnen beantwoorden. Het voorbeeld is bedoeld om op gang te komen, niet om over te nemen; het staat
 * nooit in het antwoordveld en gaat niet mee met delen of de PDF.
 * Alleen bij vragen waar cadetten vaak op vastlopen (reflectie, gedragscode, SMART, zelfbeoordeling,
 * probleemanalyse en gespreksvoorbereiding); niet bij eenvoudige vragen zoals naam of woonsituatie.
 * De voorbeelden zijn geschreven door de ontwikkelaar; laat ze door de KMA nalezen voor gebruik.
 * Een vraag wordt herkend aan het begin van de tekst (zonder "[Verdieping] "), zodat een kleine wijziging verderop
 * in de vraag het voorbeeld niet kwijtraakt.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (typeof steps === 'undefined') return;
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var EX = [
    ['Analyseer per gebeurtenis: welke kwaliteiten', 'Verhuizing naar een nieuwe stad op mijn 14e: ik moest opnieuw vrienden maken. Dat lukte door nieuwsgierig te zijn en me aan te sluiten bij de voetbalclub. Kwaliteiten: aanpassingsvermogen en initiatief.'],
    ['Welke inzichten levert je dat op over jezelf?', 'Ik merk dat ik in nieuwe situaties eerst afwacht en kijk hoe anderen het doen. Daarna pak ik het wel op. Dat afwachten kan in een groep overkomen als terughoudendheid.'],
    ['Welke rode draden zie je bij jezelf?', 'Ik zoek steeds structuur en duidelijke doelen: in sport, school en werk deed ik het best als ik wist waar ik naartoe werkte. Als dat ontbreekt, verlies ik sneller mijn motivatie.'],
    ['Welke patronen in jouw verleden leveren je nu niets meer op', 'Vroeger loste ik problemen het liefst alleen op, zodat niemand zag dat ik moeite had. In een groep betekent dat dat anderen pas te laat horen dat iets niet loopt.'],
    ['Welke eigenschappen (uit de persoonlijkheidstest) kunnen remmend werken', 'Ik scoor hoog op zorgvuldigheid. Onder tijdsdruk wil ik dan alles nog controleren, waardoor ik later beslis dan nodig is.'],
    ['Welke eigenschappen van jezelf gaan je vooruithelpen', 'Ik blijf rustig als het hectisch wordt en ik luister goed. Tijdens de AMO merkte ik dat groepsgenoten daardoor naar mij toe kwamen als er onduidelijkheid was.'],
    ['Welke patronen wil jij graag doorbreken?', 'Ik wil eerder hulp vragen in plaats van alles zelf op te lossen. Daarvoor heb ik een buddy nodig die me erop aanspreekt, en ik spreek met mezelf af dat ik na een uur vastlopen iemand vraag.'],
    ['Welke situaties zorgen bij jou voor spanning', 'Onduidelijke opdrachten met weinig tijd geven mij spanning, vooral als ik verantwoordelijk ben voor anderen. Ik merk het aan slechter slapen en kortaf reageren.'],
    ['Hoe ga jij in het algemeen om met tegenslag?', 'Ik ben teleurgesteld, maar pak het daarna snel weer op en zoek wat ik anders kan doen. Wat beter kan: ik praat er weinig over, waardoor ik minder leer van hoe anderen het zien.'],
    ['VERBONDENHEID: Wat is voor jou verbondenheid?', 'Weten dat je op elkaar kunt rekenen, ook als het tegenzit. In mijn groep voel ik dat als we na een zware dag samen de dag doornemen en niemand er alleen voor staat.'],
    ['VEILIGHEID: Wat betekent veiligheid voor jou?', 'Dat iemand fouten durft te melden zonder bang te zijn uitgelachen te worden. Ik zorg daarvoor door zelf toe te geven als ik iets fout doe en rustig te reageren als een ander dat doet.'],
    ['VERTROUWEN: Wat betekent vertrouwen voor jou?', 'Dat iemand doet wat hij zegt. Om iemand te vertrouwen moet ik zien dat afspraken worden nagekomen, ook als niemand meekijkt.'],
    ['VERANTWOORDELIJKHEID: Wat is de laatste keer dat jij jouw verantwoordelijkheid nam?', 'Bij de oefening van vorige week was ons materiaal niet compleet. Ik heb dat direct gemeld bij de groepscommandant en samen met twee anderen opgelost voordat we vertrokken.'],
    ['Wat is jouw belangrijkste conclusie over jouw gedrag uit deze zelfbeoordeling?', 'Ik doe het goed op verbondenheid en verantwoordelijkheid, maar ik spreek anderen nog te weinig aan op ongewenst gedrag. Daar wil ik de komende periode aan werken.'],
    ['Welke specifieke feitelijke DTF-waarnemingen', '12 okt, 07:40, appel: ik sprak een groepsgenoot aan die te laat was en vroeg wat er speelde (Verantwoordelijkheid, niveau 1). 20 okt, 14:00, briefing: ik bracht een alternatief plan in toen het oorspronkelijke niet werkte (Vertrouwen, niveau 2).'],
    ['Wat is jouw verwachte eindoordeel', 'Geschikt. Ik laat op alle vier de V\'s gedrag op niveau 1 zien en op Verbondenheid en Verantwoordelijkheid ook op niveau 2, met DTF\'s als bewijs. Aanspreken op gedrag ontwikkel ik nog.'],
    ['SPECIFIEK: Wat is het exacte gedrag', 'Ik wil in groepsoverleg mijn mening geven voordat er een besluit valt, in plaats van achteraf te zeggen wat ik ervan vond.'],
    ['MEETBAAR: Aan welk concreet gedrag', 'Bij elke briefing of groepsoverleg breng ik minstens één eigen punt in. Mijn buddy houdt dat twee weken bij.'],
    ['ACCEPTABEL: Waarom is juist deze ontwikkeling', 'Als officier moet ik beslissingen kunnen beïnvloeden en mijn mensen vertegenwoordigen. Als ik zwijg, mist het team informatie en verlies ik vertrouwen.'],
    ['REALISTISCH: Welke kleine, haalbare stap', 'Deze week schrijf ik voor elk overleg één punt op dat ik wil inbrengen, en ik zeg het in de eerste vijf minuten.'],
    ['TIJDGEBONDEN: Op welk vast moment', 'Elke vrijdag na het tenue-appel bespreek ik vijf minuten met mijn buddy hoe het ging. Op 16 november evalueer ik het geheel met mijn teamleider.'],
    ['FASE 1: PROBLEEMSTELLING - Waarneming', 'Feit: in drie van de vier laatste oefeningen was ik te laat met mijn verslag. Interpretatie (niet getoetst): ik heb te weinig tijd. Dat moet ik nog nagaan.'],
    ['GESPREKSVOORBEREIDING: Wat zijn jouw belangrijkste leerpunten', 'Ik neem vaker het woord in overleg (3 van de 4 weken gelukt volgens mijn check-ins). Ik ben beter geworden in plannen onder tijdsdruk; dat bleek bij de oefening in week 44.'],
    ['GESPREKSVOORBEREIDING: Wat is jouw specifieke hulpvraag', 'Ik wil graag een keer de leiding krijgen over een kleine opdracht, zodat ik kan oefenen met beslissen en anderen aanspreken. En ik wil feedback op hoe ik dat doe.']
  ];
  function norm(q) { return String(q || '').replace(/^\[Verdieping\]\s*/, '').trim(); }
  function exampleFor(q) { var n = norm(q); for (var i = 0; i < EX.length; i++) if (n.indexOf(EX[i][0]) === 0) return EX[i][1]; return ''; }
  function decorate() {
    document.querySelectorAll('.question-card').forEach(function (card) {
      if (card.querySelector('.kma-ex-btn')) return;
      var lab = card.querySelector('label'); if (!lab) return;
      var ex = exampleFor(lab.textContent); if (!ex) return;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'kma-ex-btn'; b.textContent = 'Voorbeeld';
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-label', 'Voorbeeld: toon een voorbeeldantwoord bij deze vraag');
      b.__ex = ex;
      lab.appendChild(document.createTextNode(' '));
      lab.appendChild(b);
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.kma-ex-btn'); if (!b) return;
    e.preventDefault(); e.stopPropagation();   // binnen het label: niet naar het tekstveld springen
    var lab = b.closest('label'), box = lab && lab.nextElementSibling && lab.nextElementSibling.classList.contains('kma-ex-box') ? lab.nextElementSibling : null;
    if (box) { box.remove(); b.textContent = 'Voorbeeld'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', 'Voorbeeld: toon een voorbeeldantwoord bij deze vraag'); return; }
    box = document.createElement('div'); box.className = 'kma-ex-box';
    box.innerHTML = '<small>Voorbeeld van een cadet (niet jouw antwoord)</small>' + esc(b.__ex);
    lab.insertAdjacentElement('afterend', box);
    b.textContent = 'Verberg voorbeeld'; b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-label', 'Verberg voorbeeld');
  }, true);
  kmaAfter('renderStep', decorate);
  kmaAfter('renderWidgets', decorate);   // de gedragscode tekent zijn vragen zelf
  window.kmaVoorbeelden = { exampleFor: exampleFor, count: EX.length };
  try { decorate(); } catch (e) {}
})();
