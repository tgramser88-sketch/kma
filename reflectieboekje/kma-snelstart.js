/*
 * 4.30 (punt 41): Snel starten. Per rol één pagina: cadet, teamleider, instructeur, onderzoeker.
 * Dezelfde tekst staat in de app (⋮ / Meer → Snel starten), in de handleiding (0b) en als PDF van één A4 op het
 * bureaublad. De handleiding en de PDF lezen de gegevens hieronder (tussen de JSON-markeringen) uit dit bestand.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  /*SNELSTART-JSON*/
  var DATA = {
    "cadet": {
      "titel": "Snel starten · cadet",
      "intro": "Vijf stappen voor je eerste week. De volledige handleiding is voor als je iets wilt opzoeken.",
      "stappen": [
        ["Maak je profiel", "Hoofdstuk 00: je naam en of je in week 1 begint of doorstromer bent (instroom week 8), met je startdatum. Dan telt de app jouw weken."],
        ["Doe de persoonlijkheidstest", "Hoofdstuk 03: kies kort (96 stellingen, ± 12 minuten) of lang (240, ± 30-40 minuten). Je uitslag is privé."],
        ["Schrijf je leervraag met een als-dan-plan", "Hoofdstuk 05: één SMART-leervraag, en bij een vaste situatie wat je dan doet. Na de situatie: is het gelukt?"],
        ["Leg vast wat je doet", "Tik op + voor een DTF-feit: datum, tijd, feit. Kort is goed; zes per vier weken is genoeg."],
        ["Reflecteer en vraag feedback", "Hoofdstuk 06 (5G-T) of 07 (Korthagen) na iets wat je bezighoudt. Geef en vraag kaarten aan medecadetten."]
      ],
      "rechten": ["Je kiest per hoofdstuk wat je teamleider ziet; je test is standaard privé.", "Kaarten van medecadetten tellen nooit mee voor je beoordeling.", "Stress en welzijn gaan nooit naar het CadetVolgSysteem.", "Extra modellen zet je zelf aan: menu → Gereedschapskist."]
    },
    "teamleider": {
      "titel": "Snel starten · teamleider",
      "intro": "Vijf stappen om met je peloton te beginnen.",
      "stappen": [
        ["Start het CadetVolgSysteem", "Kies je rang, naam en functie en maak een pincode van 4 cijfers. Vergeet hem niet."],
        ["Koppel de deelmap", "Open menu → Deelmap: kies de gedeelde map van je peloton en geef je cadetten de groepscode. Dossiers komen dan vanzelf binnen."],
        ["Kijk wie aandacht nodig heeft", "Bovenaan Peloton: lang niets gedeeld, SMART verlopen, een vervolggesprek, of tijd voor een gesprek na zes weken."],
        ["Voer het ontwikkelgesprek", "Open een dossier: profiel, leervraag, plannen met check-ins en groei. Raad onderaan een model aan of stel een observator voor."],
        ["Beoordeel en geef feedback", "Bij de beoordeling zie je de waarnemingen per maand en je eigen verdeling per V. Feedback gaat via de deelmap terug."]
      ],
      "rechten": ["Wat de cadet deelt is voor het ontwikkelgesprek, niet voor de beoordeling.", "Kaarten van medecadetten staan niet bij de waarnemingen voor de beoordeling.", "Stress en welzijn zie je niet; vraag in het gesprek hoe het gaat.", "Oefenen: menu → Oefenen met een gesprek, en Oefenen met beoordelen."]
    },
    "instructeur": {
      "titel": "Snel starten · instructeur",
      "intro": "Je werkt mee in het peloton van een teamleider. Je rol (senior of junior) bepaalt wat je ziet.",
      "stappen": [
        ["Open de uitnodiging", "Je teamleider stuurt je een uitnodiging met een code. Start het CadetVolgSysteem, kies je rol en voer de code in."],
        ["Leg waarnemingen vast", "Tik op + voor een DTF-notitie bij een cadet: datum, feit en de V. Kort en feitelijk."],
        ["Nabespreking na een oefening", "Menu → Nabespreking oefening: vier vragen met de groep. Wat je vastlegt, kan een DTF-feit worden."],
        ["Lees mee (senior)", "Als senior-instructeur open je dossiers en plannen om mee te kijken; je wijzigt niets aan de beoordeling."],
        ["Oefen", "Menu → Oefenen met beoordelen en Oefenen met een gesprek."]
      ],
      "rechten": ["De teamleider kiest welke van jouw notities de cadet ziet.", "Junior-instructeurs zien geen dossiers.", "Stress en welzijn staan niet in het CadetVolgSysteem."]
    },
    "onderzoeker": {
      "titel": "Snel starten · onderzoeker",
      "intro": "De Onderzoeksapp leest versleutelde, anonieme gegevens van cadetten die zelf toestemming gaven.",
      "stappen": [
        ["Maak een sleutel", "Stap 1: maak een sleutelpaar met een wachtwoord. Noteer de vingerafdruk; die vergelijken cadetten met de jouwe."],
        ["Geef de sleutel", "Laat de QR-code scannen of geef het bestand. Pas als een cadet zelf de sleutel invoert, vraagt het boekje toestemming."],
        ["Lees de gegevens in", "Stap 2: Deelmap inlezen (map onderzoek/inbox) of kies bestanden. Daarna kun je de inbox opruimen."],
        ["Voer de analyses uit", "Stap 3: beschrijvend, verdelingen, hypothesen, verandering, deelname en power. Groepen kleiner dan vijf worden onderdrukt."],
        ["Exporteer", "Stap 4: CSV, SPSS-syntax, R-script en preregistratie. Geen namen, nummers of tekst."]
      ],
      "rechten": ["Er gaan nooit namen, Peoplesoft-nummers of vrije tekst mee.", "Geslacht staat alleen in totalen, nooit per cadet.", "Uitkomsten worden nooit gebruikt voor beslissingen over een cadet."]
    }
  };
  /*SNELSTART-JSON-EINDE*/
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function menu() { return window.kmaWeergave && kmaWeergave.dash() ? 'Meer' : '⋮'; }
  function html(rol) {
    var d = DATA[rol]; if (!d) return '';
    return '<div class="kma-snel" id="kma-snel" data-rol="' + esc(rol) + '"><p class="muted small">' + esc(d.intro) + '</p><ol class="kma-snel-stappen">' +
      d.stappen.map(function (s) { return '<li><b>' + esc(s[0]) + '</b><span>' + esc(s[1].replace(/menu →/g, menu() + ' →')) + '</span></li>'; }).join('') + '</ol>' +
      '<h4>Goed om te weten</h4><ul class="kma-snel-rechten">' + d.rechten.map(function (r) { return '<li>' + esc(r.replace(/menu →/g, menu() + ' →')) + '</li>'; }).join('') + '</ul>' +
      '<div class="kma-row-btns"><button type="button" class="kma-icon-btn" data-snel="handleiding">Alles lezen: handleiding</button></div></div>';
  }
  function eigenRol() {
    if (typeof cadets !== 'undefined') { var r = window.kmaRole ? kmaRole() : 'teamleider'; return r === 'teamleider' ? 'teamleider' : 'instructeur'; }
    if (/onderzoek/i.test(location.pathname)) return 'onderzoeker';
    return 'cadet';
  }
  function open(rol) {
    rol = rol || eigenRol();
    try { (window.kmaStore || localStorage).setItem('kma-x-snelstart-gezien', '1'); } catch (e) { /* geen opslag */ }
    if (window.kmaSheet) kmaSheet({ title: DATA[rol].titel, html: html(rol), items: [] });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-snel="handleiding"]'); if (!b) return;
    if (window.kmaCloseSheet) kmaCloseSheet();
    if (window.kmaHandleiding && kmaHandleiding.open) kmaHandleiding.open();
  });
  // Boekje: in Vandaag tot de cadet het een keer opende
  if (typeof steps !== 'undefined' && typeof cadets === 'undefined') {
    (window.kmaVandaagExtra = window.kmaVandaagExtra || []).push(function () {
      var gezien = false; try { gezien = (window.kmaStore || localStorage).getItem('kma-x-snelstart-gezien') === '1'; } catch (e) { gezien = true; }
      return gezien ? [] : [{ ic: 'book', t: 'Snel starten', s: 'In vijf stappen op weg; één pagina', b: 'Lees', go: function () { open('cadet'); } }];
    });
  }
  // 4.30 (punt 76): het startpad ook in Klassiek, als één taak in Vandaag (in Dashboard staat het als eigen kaart)
  if (typeof steps !== 'undefined' && typeof cadets === 'undefined') {
    (window.kmaVandaagExtra = window.kmaVandaagExtra || []).push(function () {
      if (window.kmaWeergave && kmaWeergave.dash()) return [];
      var idx = function (re) { for (var i = 0; i < steps.length; i++) if (!steps[i].verborgen && re.test(steps[i].title)) return i; return -1; };
      var gedaan = function (i) { var st = i >= 0 && window.kmaChapterStatus ? kmaChapterStatus(i) : null; return !!(st && st.done > 0); };
      var naam = typeof answers !== 'undefined' && String(answers['Voornaam & Achternaam:'] || '').trim();
      var test = window.KMAHex && typeof hexacoQuestionsSelf !== 'undefined' && typeof hexacoSelfAnswers !== 'undefined' && KMAHex.isComplete(KMAHex.score(hexacoSelfAnswers, hexacoQuestionsSelf));
      /** @type {Array<[string, boolean, number]>} */
      var sp = [['Je profiel', !!naam, idx(/Cadet Informatie/)], ['De persoonlijkheidstest', !!test, idx(/Persoonlijkheidstest/)], ['Jij en de 4 V\'s', gedaan(idx(/Gedragscode/)), idx(/Gedragscode/)], ['Je eerste leervraag', gedaan(idx(/SMART/)), idx(/SMART/)]];
      var klaar = sp.filter(function (x) { return x[1]; }).length, volgende = sp.filter(function (x) { return !x[1]; })[0];
      if (!volgende || volgende[2] < 0) return [];
      return [{ ic: 'flag', t: 'Je startpad: ' + klaar + ' van 4 klaar', s: 'Volgende stap: ' + volgende[0].toLowerCase(), b: 'Ga', go: function () { goToStep(volgende[2]); } }];
    });
  }
  window.kmaSnelstart = { DATA: DATA, html: html, open: open, rol: eigenRol };
})();
