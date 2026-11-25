/*
 * 4.29.0: de volledige IPIP-HEXACO (240 stellingen) voor deelnemers aan het onderzoek, alleen bij hun eerste meetmoment
 * (besluit gebruiker 23-11). De 96 stellingen van de gewone test zijn een deelverzameling; dit bestand voegt de andere 144 toe
 * (10 per facet in totaal). Sinds 4.30 kiest elke cadet kort of lang (kma-boek-meting.js): de meting (normcurve, groeilijn)
 * rekent op de 240 zodra ze klaar zijn; de zes eigenschappen, SWOT, 4 V's en de KMA-norm in het CVS blijven op de 96, zodat
 * scores nooit worden gemengd. Naar het onderzoek gaan de 144 extra antwoorden en de domeinscores over alle 240
 * (set 'ipip-hexaco-240'). Bron: Ashton, Lee en Goldberg (2007), ipip.ori.org, publiek domein; Nederlandse vertaling voor deze app.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var ITEMS = [
    {"id": 101, "trait": "H", "facet": "Oprechtheid", "reversed": true, "text": "Ik verander van kant wanneer het mij uitkomt."},
    {"id": 102, "trait": "H", "facet": "Eerlijkheid", "reversed": false, "text": "Ik zou nooit frauderen met mijn belastingen."},
    {"id": 103, "trait": "H", "facet": "Hebzuchtvermijding", "reversed": false, "text": "Ik streef niet naar elegantie in mijn uiterlijk."},
    {"id": 104, "trait": "H", "facet": "Bescheidenheid", "reversed": false, "text": "Ik ben gewoon een doorsnee persoon."},
    {"id": 105, "trait": "E", "facet": "Angstigheid", "reversed": false, "text": "Lichamelijk ben ik een bangerik."},
    {"id": 106, "trait": "E", "facet": "Bezorgdheid", "reversed": false, "text": "Ik maak me vaak zorgen over dingen die achteraf onbelangrijk blijken."},
    {"id": 107, "trait": "E", "facet": "Afhankelijkheid", "reversed": false, "text": "Ik laat me door anderen beïnvloeden."},
    {"id": 108, "trait": "E", "facet": "Sentimentaliteit", "reversed": false, "text": "Ik word meteen verdrietig als ik over iets ergs hoor."},
    {"id": 109, "trait": "X", "facet": "Expressiviteit", "reversed": false, "text": "Ik ben het middelpunt van het feest."},
    {"id": 110, "trait": "X", "facet": "Sociale durf", "reversed": false, "text": "Ik vind het niet erg om in het middelpunt van de belangstelling te staan."},
    {"id": 111, "trait": "X", "facet": "Sociabiliteit", "reversed": false, "text": "Ik breng mijn vrije tijd meestal graag met anderen door."},
    {"id": 112, "trait": "X", "facet": "Levendigheid", "reversed": false, "text": "Ik houd de hele dag veel energie."},
    {"id": 113, "trait": "A", "facet": "Vergevingsgezindheid", "reversed": false, "text": "Ik houd van mijn vijanden."},
    {"id": 114, "trait": "A", "facet": "Mildheid", "reversed": false, "text": "Ik klaag zelden."},
    {"id": 115, "trait": "A", "facet": "Flexibiliteit", "reversed": true, "text": "In een groep stoor ik me vaak aan minstens één persoon."},
    {"id": 116, "trait": "A", "facet": "Geduld", "reversed": false, "text": "Er is veel voor nodig voordat ik boos word op iemand."},
    {"id": 117, "trait": "C", "facet": "Ordelijkheid", "reversed": false, "text": "Ik doe klusjes meteen."},
    {"id": 118, "trait": "C", "facet": "IJver", "reversed": false, "text": "Ik begin snel aan een klus."},
    {"id": 119, "trait": "C", "facet": "Perfectionisme", "reversed": false, "text": "Ik ga door tot alles perfect is."},
    {"id": 120, "trait": "C", "facet": "Bedachtzaamheid", "reversed": false, "text": "Ik doe dingen volgens een plan."},
    {"id": 121, "trait": "O", "facet": "Esthetische waardering", "reversed": false, "text": "Ik ga helemaal op in muziek."},
    {"id": 122, "trait": "O", "facet": "Nieuwsgierigheid", "reversed": false, "text": "Ik houd van denkspelletjes."},
    {"id": 123, "trait": "O", "facet": "Creativiteit", "reversed": false, "text": "Ik bedenk iets nieuws."},
    {"id": 124, "trait": "O", "facet": "Onconventionaliteit", "reversed": false, "text": "Ik word als een beetje excentriek gezien."},
    {"id": 125, "trait": "H", "facet": "Oprechtheid", "reversed": true, "text": "Ik speel een rol om indruk op mensen te maken."},
    {"id": 126, "trait": "H", "facet": "Eerlijkheid", "reversed": false, "text": "Ik zou me lang heel schuldig voelen als ik iets van iemand zou stelen."},
    {"id": 127, "trait": "H", "facet": "Hebzuchtvermijding", "reversed": true, "text": "Ik heb een sterke behoefte aan macht."},
    {"id": 128, "trait": "H", "facet": "Bescheidenheid", "reversed": false, "text": "Ik beschouw mezelf als een gemiddeld mens."},
    {"id": 129, "trait": "E", "facet": "Angstigheid", "reversed": false, "text": "Ik zou bang zijn om door een wijk met veel criminaliteit te lopen."},
    {"id": 130, "trait": "E", "facet": "Bezorgdheid", "reversed": false, "text": "Onaangename gedachten die bij me opkomen, brengen me van slag."},
    {"id": 131, "trait": "E", "facet": "Afhankelijkheid", "reversed": false, "text": "Ik heb bescherming nodig."},
    {"id": 132, "trait": "E", "facet": "Sentimentaliteit", "reversed": false, "text": "Ik huil bij films."},
    {"id": 133, "trait": "X", "facet": "Expressiviteit", "reversed": false, "text": "Ik zeg het tegen mensen als ik geïrriteerd ben."},
    {"id": 134, "trait": "X", "facet": "Sociale durf", "reversed": false, "text": "Ik voel me op mijn gemak tussen mensen."},
    {"id": 135, "trait": "X", "facet": "Sociabiliteit", "reversed": false, "text": "Op feestjes praat ik met veel verschillende mensen."},
    {"id": 136, "trait": "X", "facet": "Levendigheid", "reversed": false, "text": "Ik heb een groot uithoudingsvermogen."},
    {"id": 137, "trait": "A", "facet": "Vergevingsgezindheid", "reversed": false, "text": "Ik ben aardig tegen mensen op wie ik eigenlijk boos zou moeten zijn."},
    {"id": 138, "trait": "A", "facet": "Mildheid", "reversed": false, "text": "Ik neem de dingen zoals ze komen."},
    {"id": 139, "trait": "A", "facet": "Flexibiliteit", "reversed": true, "text": "Ik reageer heftig op kritiek."},
    {"id": 140, "trait": "A", "facet": "Geduld", "reversed": false, "text": "Ik ben zelden boos op mensen."},
    {"id": 141, "trait": "C", "facet": "Ordelijkheid", "reversed": false, "text": "Ik ruim graag op."},
    {"id": 142, "trait": "C", "facet": "IJver", "reversed": false, "text": "Ik ben veeleisend in mijn werk."},
    {"id": 143, "trait": "C", "facet": "Perfectionisme", "reversed": false, "text": "Ik heb oog voor detail."},
    {"id": 144, "trait": "C", "facet": "Bedachtzaamheid", "reversed": true, "text": "Ik doe dingen zonder aan de gevolgen te denken."},
    {"id": 145, "trait": "O", "facet": "Esthetische waardering", "reversed": false, "text": "Ik voel me graag verbonden met de natuur."},
    {"id": 146, "trait": "O", "facet": "Nieuwsgierigheid", "reversed": false, "text": "Ik lees graag uitdagende teksten."},
    {"id": 147, "trait": "O", "facet": "Creativiteit", "reversed": false, "text": "Ik til een gesprek naar een hoger niveau."},
    {"id": 148, "trait": "O", "facet": "Onconventionaliteit", "reversed": false, "text": "Ik weet dat mijn ideeën mensen soms verrassen."},
    {"id": 149, "trait": "H", "facet": "Oprechtheid", "reversed": true, "text": "Ik doe alsof ik me zorgen maak om anderen."},
    {"id": 150, "trait": "H", "facet": "Eerlijkheid", "reversed": false, "text": "Ik probeer me aan de regels te houden."},
    {"id": 151, "trait": "H", "facet": "Hebzuchtvermijding", "reversed": true, "text": "Ik zou voor altijd jong willen blijven."},
    {"id": 152, "trait": "H", "facet": "Bescheidenheid", "reversed": true, "text": "Ik zou graag meer macht hebben dan andere mensen."},
    {"id": 153, "trait": "E", "facet": "Angstigheid", "reversed": false, "text": "Ik zou nooit in een kano een stuk wildwater afvaren."},
    {"id": 154, "trait": "E", "facet": "Bezorgdheid", "reversed": false, "text": "Ik raak snel in paniek."},
    {"id": 155, "trait": "E", "facet": "Afhankelijkheid", "reversed": false, "text": "Ik laat zien als ik verdrietig ben."},
    {"id": 156, "trait": "E", "facet": "Sentimentaliteit", "reversed": false, "text": "Ik ben gevoelig voor wat anderen nodig hebben."},
    {"id": 157, "trait": "X", "facet": "Expressiviteit", "reversed": false, "text": "Ik heb een harde, uitbundige lach."},
    {"id": 158, "trait": "X", "facet": "Sociale durf", "reversed": false, "text": "Ik heb een sterke persoonlijkheid."},
    {"id": 159, "trait": "X", "facet": "Sociabiliteit", "reversed": false, "text": "Ik klets graag."},
    {"id": 160, "trait": "X", "facet": "Levendigheid", "reversed": false, "text": "Ik glimlach veel."},
    {"id": 161, "trait": "A", "facet": "Vergevingsgezindheid", "reversed": true, "text": "Ik vind het moeilijk om anderen te vergeven."},
    {"id": 162, "trait": "A", "facet": "Mildheid", "reversed": true, "text": "Ik raak gefrustreerd en boos op mensen als ze niet aan mijn verwachtingen voldoen."},
    {"id": 163, "trait": "A", "facet": "Flexibiliteit", "reversed": true, "text": "Ik raak van streek als anderen veranderen hoe ik iets geregeld heb."},
    {"id": 164, "trait": "A", "facet": "Geduld", "reversed": false, "text": "Ik word zelden kwaad."},
    {"id": 165, "trait": "C", "facet": "Ordelijkheid", "reversed": false, "text": "Ik wil dat alles precies goed is."},
    {"id": 166, "trait": "C", "facet": "IJver", "reversed": false, "text": "Ik voer taken met succes uit."},
    {"id": 167, "trait": "C", "facet": "Perfectionisme", "reversed": false, "text": "Ik wil dat elk detail geregeld is."},
    {"id": 168, "trait": "C", "facet": "Bedachtzaamheid", "reversed": true, "text": "Ik handel impulsief als iets me dwarszit."},
    {"id": 169, "trait": "O", "facet": "Esthetische waardering", "reversed": false, "text": "Ik heb de grote literaire klassiekers gelezen."},
    {"id": 170, "trait": "O", "facet": "Nieuwsgierigheid", "reversed": false, "text": "Ik vind politieke discussies interessant."},
    {"id": 171, "trait": "O", "facet": "Creativiteit", "reversed": false, "text": "Ik zit vol ideeën."},
    {"id": 172, "trait": "O", "facet": "Onconventionaliteit", "reversed": false, "text": "Ik kom in opstand tegen gezag."},
    {"id": 173, "trait": "H", "facet": "Oprechtheid", "reversed": true, "text": "Ik gedraag me in verschillende situaties als een ander persoon."},
    {"id": 174, "trait": "H", "facet": "Eerlijkheid", "reversed": true, "text": "Ik steel dingen."},
    {"id": 175, "trait": "H", "facet": "Hebzuchtvermijding", "reversed": true, "text": "Ik probeer indruk te maken op anderen."},
    {"id": 176, "trait": "H", "facet": "Bescheidenheid", "reversed": true, "text": "Ik trek graag de aandacht."},
    {"id": 177, "trait": "E", "facet": "Angstigheid", "reversed": true, "text": "Ik doe graag dingen die eng zijn."},
    {"id": 178, "trait": "E", "facet": "Bezorgdheid", "reversed": true, "text": "Ik voel me zelden neerslachtig."},
    {"id": 179, "trait": "E", "facet": "Afhankelijkheid", "reversed": false, "text": "Ik vermoed dat mijn gezicht verraadt wanneer ik verdrietig ben."},
    {"id": 180, "trait": "E", "facet": "Sentimentaliteit", "reversed": true, "text": "Ik huil zelden bij droevige films."},
    {"id": 181, "trait": "X", "facet": "Expressiviteit", "reversed": true, "text": "Ik praat niet veel."},
    {"id": 182, "trait": "X", "facet": "Sociale durf", "reversed": true, "text": "Ik vind het moeilijk om op anderen af te stappen."},
    {"id": 183, "trait": "X", "facet": "Sociabiliteit", "reversed": true, "text": "Ik lijk minder plezier te halen uit de omgang met mensen dan anderen."},
    {"id": 184, "trait": "X", "facet": "Levendigheid", "reversed": false, "text": "Ik voel me meestal gezond en vol leven."},
    {"id": 185, "trait": "A", "facet": "Vergevingsgezindheid", "reversed": true, "text": "Ik neem wraak op mensen die mij beledigen."},
    {"id": 186, "trait": "A", "facet": "Mildheid", "reversed": true, "text": "Ik vind overal wel iets op aan te merken."},
    {"id": 187, "trait": "A", "facet": "Flexibiliteit", "reversed": true, "text": "Ik erger me aan de fouten van anderen."},
    {"id": 188, "trait": "A", "facet": "Geduld", "reversed": true, "text": "Ik raak snel geërgerd."},
    {"id": 189, "trait": "C", "facet": "Ordelijkheid", "reversed": true, "text": "Ik laat mijn kamer rommelig achter."},
    {"id": 190, "trait": "C", "facet": "IJver", "reversed": true, "text": "Ik doe te weinig werk."},
    {"id": 191, "trait": "C", "facet": "Perfectionisme", "reversed": false, "text": "Ik houd niet van onvolmaakt werk."},
    {"id": 192, "trait": "C", "facet": "Bedachtzaamheid", "reversed": true, "text": "Ik maak slordige fouten."},
    {"id": 193, "trait": "O", "facet": "Esthetische waardering", "reversed": true, "text": "Ik merk zelden de emotionele kant van schilderijen en afbeeldingen op."},
    {"id": 194, "trait": "O", "facet": "Nieuwsgierigheid", "reversed": false, "text": "Ik heb een rijke woordenschat."},
    {"id": 195, "trait": "O", "facet": "Creativiteit", "reversed": false, "text": "Ik heb uitstekende ideeën."},
    {"id": 196, "trait": "O", "facet": "Onconventionaliteit", "reversed": true, "text": "Ik zou het vreselijk vinden om als raar of vreemd gezien te worden."},
    {"id": 197, "trait": "H", "facet": "Oprechtheid", "reversed": true, "text": "Ik vind het nodig om de mensen met macht te behagen."},
    {"id": 198, "trait": "H", "facet": "Eerlijkheid", "reversed": true, "text": "Ik bedrieg mensen die mij vertrouwd hebben."},
    {"id": 199, "trait": "H", "facet": "Hebzuchtvermijding", "reversed": true, "text": "Ik eet het liefst in dure restaurants."},
    {"id": 200, "trait": "H", "facet": "Bescheidenheid", "reversed": true, "text": "Ik ben bekwamer dan de meeste anderen."},
    {"id": 201, "trait": "E", "facet": "Angstigheid", "reversed": true, "text": "Ik zou goed zijn in het redden van mensen uit een brandend gebouw."},
    {"id": 202, "trait": "E", "facet": "Bezorgdheid", "reversed": true, "text": "Ik raak niet snel van streek door gebeurtenissen."},
    {"id": 203, "trait": "E", "facet": "Afhankelijkheid", "reversed": false, "text": "Ik kan niet zonder het gezelschap van anderen."},
    {"id": 204, "trait": "E", "facet": "Sentimentaliteit", "reversed": true, "text": "Ik krijg zelden tranen in mijn ogen bij een droevig stuk in een verhaal."},
    {"id": 205, "trait": "X", "facet": "Expressiviteit", "reversed": true, "text": "Ik vestig niet graag de aandacht op mezelf."},
    {"id": 206, "trait": "X", "facet": "Sociale durf", "reversed": true, "text": "Ik haat het om in het middelpunt van de belangstelling te staan."},
    {"id": 207, "trait": "X", "facet": "Sociabiliteit", "reversed": true, "text": "Ik zou een baan met veel contact met mensen niet leuk vinden."},
    {"id": 208, "trait": "X", "facet": "Levendigheid", "reversed": false, "text": "Ik voel dat ik veel innerlijke kracht heb."},
    {"id": 209, "trait": "A", "facet": "Vergevingsgezindheid", "reversed": true, "text": "Ik wantrouw mensen."},
    {"id": 210, "trait": "A", "facet": "Mildheid", "reversed": true, "text": "Ik spreek kwaad over anderen."},
    {"id": 211, "trait": "A", "facet": "Flexibiliteit", "reversed": true, "text": "Ik ben moeilijk tevreden te stellen."},
    {"id": 212, "trait": "A", "facet": "Geduld", "reversed": true, "text": "Ik raak snel geïrriteerd."},
    {"id": 213, "trait": "C", "facet": "Ordelijkheid", "reversed": true, "text": "Ik maak niet af waar ik aan begin."},
    {"id": 214, "trait": "C", "facet": "IJver", "reversed": true, "text": "Ik hang wat rond zonder iets te doen."},
    {"id": 215, "trait": "C", "facet": "Perfectionisme", "reversed": false, "text": "Ik wil dat alles precies klopt."},
    {"id": 216, "trait": "C", "facet": "Bedachtzaamheid", "reversed": true, "text": "Ik weet niet waarom ik sommige dingen doe."},
    {"id": 217, "trait": "O", "facet": "Esthetische waardering", "reversed": true, "text": "Ik houd niet van concerten."},
    {"id": 218, "trait": "O", "facet": "Nieuwsgierigheid", "reversed": true, "text": "Ik weet niet veel van geschiedenis."},
    {"id": 219, "trait": "O", "facet": "Creativiteit", "reversed": true, "text": "Ik kan moeilijk inschatten hoe anderen zullen reageren."},
    {"id": 220, "trait": "O", "facet": "Onconventionaliteit", "reversed": true, "text": "Ik vind het fijn om als een normaal, doorsnee persoon gezien te worden."},
    {"id": 221, "trait": "H", "facet": "Oprechtheid", "reversed": true, "text": "Ik laat me door mensen ringeloren zodat zij zich belangrijk voelen."},
    {"id": 222, "trait": "H", "facet": "Eerlijkheid", "reversed": true, "text": "Ik zou geen spijt hebben als ik in een opwelling misbruik zou maken van iemand."},
    {"id": 223, "trait": "H", "facet": "Hebzuchtvermijding", "reversed": true, "text": "Ik ben uit op mijn eigen voordeel."},
    {"id": 224, "trait": "H", "facet": "Bescheidenheid", "reversed": true, "text": "Als ik de kans krijg, ga ik graag pronken."},
    {"id": 225, "trait": "E", "facet": "Angstigheid", "reversed": true, "text": "Ik ben bereid risico's te nemen."},
    {"id": 226, "trait": "E", "facet": "Bezorgdheid", "reversed": true, "text": "Ik maak me geen zorgen over dingen die al gebeurd zijn."},
    {"id": 227, "trait": "E", "facet": "Afhankelijkheid", "reversed": false, "text": "Ik wil graag aardig gevonden worden."},
    {"id": 228, "trait": "E", "facet": "Sentimentaliteit", "reversed": true, "text": "Ik begrijp mensen niet die emotioneel worden."},
    {"id": 229, "trait": "X", "facet": "Expressiviteit", "reversed": true, "text": "Ik praat zacht."},
    {"id": 230, "trait": "X", "facet": "Sociale durf", "reversed": true, "text": "Ik heb weinig te zeggen."},
    {"id": 231, "trait": "X", "facet": "Sociabiliteit", "reversed": true, "text": "Ik ben moeilijk te leren kennen."},
    {"id": 232, "trait": "X", "facet": "Levendigheid", "reversed": false, "text": "Ik heb veel plezier."},
    {"id": 233, "trait": "A", "facet": "Vergevingsgezindheid", "reversed": true, "text": "Ik vind dat je de meeste mensen niet kunt vertrouwen."},
    {"id": 234, "trait": "A", "facet": "Mildheid", "reversed": true, "text": "Ik heb een scherpe tong."},
    {"id": 235, "trait": "A", "facet": "Flexibiliteit", "reversed": true, "text": "Ik ben moeilijk voor rede vatbaar."},
    {"id": 236, "trait": "A", "facet": "Geduld", "reversed": true, "text": "Ik raak snel overstuur."},
    {"id": 237, "trait": "C", "facet": "Ordelijkheid", "reversed": true, "text": "Ik heb geen last van wanorde."},
    {"id": 238, "trait": "C", "facet": "IJver", "reversed": true, "text": "Ik verlies snel mijn interesse in taken waaraan ik begin."},
    {"id": 239, "trait": "C", "facet": "Perfectionisme", "reversed": false, "text": "Ik zie fouten snel."},
    {"id": 240, "trait": "C", "facet": "Bedachtzaamheid", "reversed": true, "text": "Ik maak mezelf belachelijk."},
    {"id": 241, "trait": "O", "facet": "Esthetische waardering", "reversed": true, "text": "Ik kijk niet graag naar dansvoorstellingen."},
    {"id": 242, "trait": "O", "facet": "Nieuwsgierigheid", "reversed": true, "text": "Ik maak me niet druk om politieke en maatschappelijke problemen."},
    {"id": 243, "trait": "O", "facet": "Creativiteit", "reversed": true, "text": "Ik heb zelden plotselinge ingevingen."},
    {"id": 244, "trait": "O", "facet": "Onconventionaliteit", "reversed": true, "text": "Ik probeer ingewikkelde mensen te vermijden."}
  ];
  var K = 'kma-x-hex240', LABELS = ['Helemaal oneens', 'Oneens', 'Neutraal', 'Eens', 'Helemaal eens'];
  function st() { return window.kmaStore || window.localStorage; }
  function icon(n) { return window.kmaIcon ? kmaIcon(n) : ''; }
  function toast(m, k) { if (window.kmaToast) kmaToast(m, k); }
  function antwoorden() { try { var o = JSON.parse(st().getItem(K) || 'null'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
  function bewaar(id, v) { var a = antwoorden(); a[id] = v; st().setItem(K, JSON.stringify(a)); }
  function geldig(v) { v = Number(v); return v >= 1 && v <= 5; }
  function aantal() { var a = antwoorden(); return ITEMS.filter(function (q) { return geldig(a[q.id]); }).length; }
  function klaar() { return aantal() === ITEMS.length; }
  function basis() { return typeof hexacoQuestionsSelf !== 'undefined' && typeof hexacoSelfAnswers !== 'undefined' ? { qs: hexacoQuestionsSelf, ans: hexacoSelfAnswers } : { qs: [], ans: {} }; }
  function basisKlaar() { var b = basis(); return b.qs.length > 0 && b.qs.every(function (q) { return geldig(b.ans[q.id]); }); }
  /** Alleen voor deelnemers aan het onderzoek, bij hun eerste meetmoment. */
  function aangeboden() { var O = window.kmaOnderzoek; return !!(O && O.actief && O.actief() && O.eersteMeetmoment && O.eersteMeetmoment()); }
  function extra() { var a = antwoorden(); return ITEMS.map(function (q) { var v = Number(a[q.id]); return geldig(v) ? v : null; }); }
  /** Domeinscores (0-100) over alle 240 stellingen; alleen als beide delen volledig zijn. */
  function domein240() {
    if (!klaar() || !basisKlaar() || !window.KMAHex) return null;
    var b = basis(), a = antwoorden(), all = {}, k;
    for (k in b.ans) if (Object.prototype.hasOwnProperty.call(b.ans, k)) all[k] = b.ans[k];
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) all[k] = a[k];
    return KMAHex.plain(KMAHex.score(all, b.qs.concat(ITEMS)));
  }
  function wis() { st().removeItem(K); }
  /* 4.33: facetprofiel van de lange test (24 facetten, elk 10 stellingen over de 96 en de 144 samen). Omschrijvingen in eigen
     woorden, naar de facetbeschrijvingen van Lee en Ashton (2004) en De Vries, Ashton en Lee (2009). Pas als alle 240 klaar zijn. */
  var DOMEIN = { H: 'Integriteit', E: 'Emotionaliteit', X: 'Extraversie', A: 'Verdraagzaamheid', C: 'Consciëntieusheid', O: 'Openheid' };
  var OMSCHR = {
    'Oprechtheid': 'Speelt geen rol en vleit niet om iets gedaan te krijgen.', 'Eerlijkheid': 'Houdt zich aan regels en neemt geen voordeel dat niet toekomt.',
    'Hebzuchtvermijding': 'Hecht weinig aan luxe, bezit en status.', 'Bescheidenheid': 'Ziet zichzelf als gewoon en eist geen voorrechten op.',
    'Angstigheid': 'Is voorzichtig bij fysiek gevaar; laag: durft risico aan.', 'Bezorgdheid': 'Maakt zich snel zorgen, ook over kleine dingen.',
    'Afhankelijkheid': 'Zoekt steun en troost bij anderen als het moeilijk is.', 'Sentimentaliteit': 'Leeft sterk mee met anderen en voelt zich met hen verbonden.',
    'Expressiviteit': 'Laat zich zien en horen in een groep.', 'Sociale durf': 'Voelt zich zeker bij spreken voor een groep en het nemen van de leiding.',
    'Sociabiliteit': 'Zoekt graag gezelschap en gesprekken op.', 'Levendigheid': 'Heeft veel energie en is meestal optimistisch.',
    'Vergevingsgezindheid': 'Geeft anderen na een fout weer snel vertrouwen.', 'Mildheid': 'Oordeelt mild over anderen als er iets misgaat.',
    'Flexibiliteit': 'Past zich aan, sluit compromissen en vermijdt onnodig conflict.', 'Geduld': 'Blijft kalm en wordt niet snel boos.',
    'Ordelijkheid': 'Houdt orde en structuur in spullen en werk.', 'IJver': 'Werkt hard en zet door om een doel te halen.',
    'Perfectionisme': 'Let op details en wil dat iets precies klopt.', 'Bedachtzaamheid': 'Denkt eerst na en weegt gevolgen af voor hij handelt.',
    'Esthetische waardering': 'Geniet van kunst, muziek en natuur.', 'Nieuwsgierigheid': 'Wil weten hoe dingen werken en zoekt kennis op.',
    'Creativiteit': 'Bedenkt graag nieuwe ideeën en oplossingen.', 'Onconventionaliteit': 'Staat open voor het ongewone en volgt niet vanzelf de gewoonte.'
  };
  /** [{trait, facet, score 0-100, n}] in de volgorde H E X A C O; null als de 240 niet klaar zijn. */
  function facetten() {
    if (!klaar() || !basisKlaar()) return null;
    var b = basis(), a = antwoorden(), all = {}, k, per = {}, volg = [];
    for (k in b.ans) if (Object.prototype.hasOwnProperty.call(b.ans, k)) all[k] = b.ans[k];
    for (k in a) if (Object.prototype.hasOwnProperty.call(a, k)) all[k] = a[k];
    b.qs.concat(ITEMS).forEach(function (q) {
      var v = Number(all[q.id]); if (!q.facet || !(v >= 1 && v <= 5)) return;
      var key = q.trait + '|' + q.facet; if (!per[key]) { per[key] = { trait: q.trait, facet: q.facet, som: 0, n: 0 }; volg.push(key); }
      per[key].som += q.reversed ? 6 - v : v; per[key].n++;
    });
    return ['H', 'E', 'X', 'A', 'C', 'O'].reduce(function (out, t) {
      volg.filter(function (x) { return per[x].trait === t; }).forEach(function (x) { var f = per[x]; out.push({ trait: t, facet: f.facet, n: f.n, score: Math.round((f.som / f.n - 1) / 4 * 100) }); });
      return out;
    }, []);
  }
  function facetHtml() {
    var f = facetten(); if (!f) return '';
    var e2 = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    return '<div class="kma-card-block kma-facet" id="kma-facet"><h4>' + icon('list') + 'Je facetprofiel (lange test)</h4>' +
      '<p class="muted small">Elke eigenschap bestaat uit vier facetten. Zo zie je waar een score vandaan komt: twee cadetten met dezelfde score op Consciëntieusheid kunnen heel verschillend zijn in Ordelijkheid of IJver. Elk facet rust op 10 stellingen, dus lees het als een richting, niet als een exact cijfer (0 = laag, 100 = hoog).</p>' +
      ['H', 'E', 'X', 'A', 'C', 'O'].map(function (t) {
        return '<h5>' + e2(DOMEIN[t]) + '</h5>' + f.filter(function (x) { return x.trait === t; }).map(function (x) {
          return '<div class="kma-facet-row"><span>' + e2(x.facet) + '</span><i aria-hidden="true"><b style="width:' + x.score + '%"></b></i><strong>' + x.score + '</strong><small>' + e2(OMSCHR[x.facet] || '') + '</small></div>';
        }).join('');
      }).join('') +
      '<p class="muted small">Bron: facetten van het HEXACO-model (Lee & Ashton, 2004; Nederlandse beschrijving: De Vries, Ashton & Lee, 2009), gemeten met de IPIP-HEXACO (Ashton, Lee & Goldberg, 2007, publiek domein). Omschrijvingen in eigen woorden.</p>' +
      (window.kmaOnderbouwing ? kmaOnderbouwing.link('hexbig5') : '') + '</div>';
  }

  var ov = null;
  function sluit() { if (ov) { ov.remove(); ov = null; document.body.classList.remove('kma-test-open'); } }
  function open(start) {
    var a = antwoorden(), idx = typeof start === 'number' ? start : ITEMS.findIndex(function (q) { return !geldig(a[q.id]); });
    if (idx < 0) idx = 0;
    sluit();
    ov = document.createElement('div'); ov.className = 'kma-test kma-test-240'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    document.body.appendChild(ov); document.body.classList.add('kma-test-open');
    function teken() {
      var q = ITEMS[idx], ans = antwoorden(), done = aantal(), cur = ans[q.id];
      // 4.31: bij de lange test (keuze 'lang', de 96 klaar) loopt de telling door tot 240
      var deel2 = !aangeboden() && window.kmaMeting && kmaMeting.keuze() === 'lang' && basisKlaar(), off = deel2 ? 96 : 0, tot = ITEMS.length + off;
      ov.innerHTML = '<div class="kma-test-top"><button type="button" class="kma-test-close" aria-label="Pauzeren">' + icon('x') + '<span>Pauzeren</span></button>' +
        '<span class="kma-test-who">' + (aangeboden() ? 'Onderzoek · aanvullende stellingen' : deel2 ? 'Over mezelf · lange test, deel 2 van 2' : 'Lange test · aanvullende stellingen') + '</span></div>' +
        '<div class="kma-test-progress"><span style="width:' + Math.round((done + off) / tot * 100) + '%"></span></div>' +
        '<div class="kma-test-count">Stelling ' + (idx + 1 + off) + ' van ' + tot + ' · ' + (done + off) + ' beantwoord</div><div class="kma-test-q"></div>' +
        '<div class="kma-test-options">' + LABELS.map(function (l, i) { return '<button type="button" class="kma-test-opt' + (Number(cur) === i + 1 ? ' chosen' : '') + '" data-v="' + (i + 1) + '"><span class="n">' + (i + 1) + '</span>' + l + '</button>'; }).join('') + '</div>' +
        '<div class="kma-test-nav"><button type="button" class="kma-icon-btn" data-nav="prev"' + (idx === 0 ? ' disabled' : '') + '>' + icon('left') + 'Vorige</button>' +
        (done === ITEMS.length ? '<button type="button" class="kma-icon-btn is-primary" data-nav="finish">' + icon('check') + 'Klaar</button>' : '<button type="button" class="kma-icon-btn" data-nav="next">Sla over' + icon('right') + '</button>') + '</div>';
      ov.querySelector('.kma-test-q').textContent = q.text;
      ov.querySelector('.kma-test-close').onclick = function () { sluit(); toast('Gepauzeerd bij stelling ' + (idx + 1) + ' van ' + ITEMS.length); };
      ov.querySelectorAll('.kma-test-opt').forEach(function (b) {
        b.onclick = function () {
          bewaar(q.id, Number(b.getAttribute('data-v')));
          setTimeout(function () {
            if (!ov) return;
            if (klaar()) { klaarScherm(); return; }
            var an = antwoorden(), nx = ITEMS.findIndex(function (qq, i) { return i > idx && !geldig(an[qq.id]); });
            if (nx < 0) nx = ITEMS.findIndex(function (qq) { return !geldig(an[qq.id]); });
            idx = nx < 0 ? Math.min(idx + 1, ITEMS.length - 1) : nx; teken();
          }, 200);
        };
      });
      var p = ov.querySelector('[data-nav="prev"]'); if (p) p.onclick = function () { if (idx > 0) { idx--; teken(); } };
      var n = ov.querySelector('[data-nav="next"]'); if (n) n.onclick = function () { idx = (idx + 1) % ITEMS.length; teken(); };
      var f = ov.querySelector('[data-nav="finish"]'); if (f) f.onclick = klaarScherm;
    }
    function klaarScherm() {
      var ond = aangeboden();
      if (window.kmaMeting) kmaMeting.vastleggen();
      ov.innerHTML = '<div class="kma-test-handover">' + icon('check') + '<h2>Klaar, bedankt!</h2><p>' + (ond ? 'De aanvullende stellingen gaan mee als je je gegevens voor dit meetmoment verstuurt. ' : '') + 'Je uitslag gebruikt nu alle 240 stellingen: een kleinere meetfout.</p>' +
        '<button type="button" class="kma-icon-btn is-primary" data-nav="back">Terug</button></div>';
      ov.querySelector('[data-nav="back"]').onclick = function () { sluit(); if (ond && window.kmaOnderzoek && kmaOnderzoek.open) kmaOnderzoek.open(); else if (typeof renderWidgets === 'function') renderWidgets(); };
    }
    teken();
  }
  window.kmaHex240 = { facetten: facetten, facetHtml: facetHtml, ITEMS: ITEMS, antwoorden: antwoorden, aantal: aantal, klaar: klaar, basisKlaar: basisKlaar, aangeboden: aangeboden, extra: extra, domein240: domein240, open: open, sluit: sluit, wis: wis };
})();
