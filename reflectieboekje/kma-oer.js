/*
 * OER-verwijzingen en termijnen in opleidingsdagen (4.18.0, blok Q), in beide apps.
 * Bron: OER KMA 2026-2027 v17 (docs/kma-context/). Teksten zijn korte samenvattingen in gewone taal, geen citaten.
 *  - kmaOER.label('3.7.3c') geeft een klein label "OER 3.7.3c"; tikken toont de samenvatting van dat artikel.
 *  - Opleidingsdagen worden voorlopig benaderd als werkdagen (maandag t/m vrijdag): kmaOER.plus(iso, n) en
 *    kmaOER.tussen(van, tot). Feestdagen en verlof tellen dus mee; de app waarschuwt alleen, hij blokkeert niets.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var ART = {
    '3.7': ['Beoordelingssysteem', 'De gesprekscyclus tijdens de opleiding: cadetintroductiegesprek, begeleidingsgesprek, cadetfunctioneringsgesprek en cadetbeoordelingsgesprek, elk met eigen termijnen. Afspraken worden vastgelegd en later geëvalueerd.'],
    '2.2.4': ['Begeleidingsgesprekken', 'De begeleider voert minstens een intakegesprek, een begeleidingsgesprek en een eindgesprek. Daarin bespreekt hij sterke punten en ontwikkelpunten. De lerende kan een afschrift van het verslag krijgen.'],
    '3.7.2': ['Cadetintroductiegesprek', 'Binnen de eerste 20 opleidingsdagen voert de eerste beoordelaar een introductiegesprek: opleidingsdocumentatie, de rol van de beoordelaar en de verwachtingen. Afspraken uit dit gesprek kunnen later worden geëvalueerd.'],
    '3.7.2c': ['Afspraken', 'Afspraken uit het introductie- of functioneringsgesprek kunnen schriftelijk worden vastgelegd en later worden geëvalueerd in een functionerings- of beoordelingsgesprek.'],
    '3.7.3': ['Cadetfunctioneringsgesprek', 'Een gesprek in twee richtingen over hoe de cadet functioneert: beide geven hun zienswijze. Niet eerder dan 20 opleidingsdagen na het introductiegesprek en pas na een begeleidingsgesprek. De cadet krijgt een afschrift van het verslag.'],
    '3.7.3c': ['Zienswijzen blijven intern', 'De zienswijzen van cadet en beoordelaar uit het functioneringsgesprek blijven intern. Afspraken mogen wel gedeeld worden met anderen die bij het leren van de cadet betrokken zijn; de cadet krijgt daar dan een melding van.'],
    '3.7.3e': ['Verbetertraject', 'Bij onvoldoende functioneren wordt het functioneringsgesprek minstens 3 opleidingsdagen vooraf aangekondigd. Daarna maakt de cadet binnen 5 opleidingsdagen een verbeterplan en koppelt dat terug aan de eerste beoordelaar. Dan volgt een verbeterperiode van minstens 15 opleidingsdagen.'],
    '3.7.4': ['Cadetbeoordelingsgesprek', 'Een gesprek in één richting: de beoordelaar bespreekt zijn oordeel. Een cadetbeoordeling wordt niet eerder opgemaakt dan na 40 opleidingsdagen, en pas na een introductie- en een begeleidingsgesprek. De cadet krijgt een afschrift.'],
    '3.7.5': ['Eerste beoordelaar', 'De eerste beoordelaar beoordeelt het gedrag met het Cadetbeoordelingsformulier KMA, op basis van relevante observaties, gesprekken en documentatie.'],
    '3.7.6': ['Bezwaar', 'De cadet kan binnen 5 opleidingsdagen na ontvangst van het afschrift van de beoordeling schriftelijk bezwaar maken bij de tweede beoordelaar.'],
    '3.7.7': ['Tweede beoordelaar', 'De tweede beoordelaar neemt bezwaar binnen 5 opleidingsdagen in behandeling, heeft dezelfde informatie als de eerste beoordelaar, maakt na bespreking een aantekening en stelt de beoordeling vast.'],
    '4.2': ['Toetsvormen', 'Toetsen zijn summatief (telt mee voor het afronden van een module) of formatief (bedoeld om van te leren). Per module ligt de toetsvorm vast.'],
    '4.9': ['Waardering', 'Een toets wordt gewaardeerd met een cijfer (voldoende vanaf 5,5) of met voldoende of onvoldoende. Daarnaast bestaan VR (vrijstelling), NVD (niet voldaan) en NTB (niet te beoordelen).'],
    '4.10': ['Registratie en afschriften', 'De officiële registratie van uitslagen loopt via bureau Cadettenbeheer. Een afschrift van het introductie-, functionerings- en beoordelingsgesprek krijgt de cadet uiterlijk 5 opleidingsdagen na het gesprek.']
  };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function art(code) { return ART[code] || ART[String(code).replace(/[a-z]$/, '')] || null; }
  /** Klein label naar een OER-artikel. */
  function label(code) {
    if (!art(code)) return '';
    return '<button type="button" class="kma-oer" data-oer="' + esc(code) + '" title="Uitleg bij OER-artikel ' + esc(code) + '">OER ' + esc(code) + '</button>';
  }
  function uitleg(code) {
    var a = art(code); if (!a) return;
    var t = 'OER ' + code + ', ' + a[0] + '\n\n' + a[1] + '\n\nOnderwijs- en Examenreglement KMA 2026-2027. De app benadert opleidingsdagen als werkdagen.';
    if (window.kmaAlert) kmaAlert(t); else alert(t);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-oer]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    uitleg(b.getAttribute('data-oer'));
  }, true);

  /* ---------- Opleidingsdagen (benaderd als werkdagen) ---------- */
  function dag(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function vandaag() { return iso(new Date()); }
  function werkdag(d) { var w = d.getDay(); return w !== 0 && w !== 6; }
  /** Datum n opleidingsdagen na iso. */
  function plus(s, n) {
    var d = dag(s); if (!d) return '';
    var k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (werkdag(d)) k++; }
    return iso(d);
  }
  /** Aantal opleidingsdagen van 'van' tot 'tot' (negatief als tot eerder ligt). */
  function tussen(van, tot) {
    var a = dag(van), b = dag(tot); if (!a || !b) return null;
    var teken = 1; if (b < a) { var x = a; a = b; b = x; teken = -1; }
    var n = 0, d = new Date(a.getTime()), totaal = Math.round((b.getTime() - a.getTime()) / 864e5);
    for (var i = 0; i < totaal; i++) { d.setDate(d.getDate() + 1); if (werkdag(d)) n++; }
    return n * teken;
  }
  function nl(s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? Number(m[3]) + '-' + Number(m[2]) + '-' + m[1] : (s || ''); }

  /* ---------- Gesprekssoorten (art. 2.2.4 en 3.7) ---------- */
  var SOORTEN = ['Cadetintroductiegesprek', 'Intakegesprek', 'Begeleidingsgesprek', 'Cadetfunctioneringsgesprek', 'Cadetbeoordelingsgesprek', 'Eindgesprek', 'Voortgangsgesprek', 'Anders'];
  /** Oude soort (tot 4.17.0) naar de soort uit het OER. */
  function soort(s) {
    s = String(s || '');
    if (/^functionering/i.test(s)) return 'Cadetfunctioneringsgesprek';
    if (/^beoordeling/i.test(s)) return 'Cadetbeoordelingsgesprek';
    if (/^introductie/i.test(s)) return 'Cadetintroductiegesprek';
    return s;
  }
  window.kmaOER = { ART: ART, art: art, label: label, uitleg: uitleg, plus: plus, tussen: tussen, vandaag: vandaag, nl: nl, SOORTEN: SOORTEN, soort: soort };
})();
