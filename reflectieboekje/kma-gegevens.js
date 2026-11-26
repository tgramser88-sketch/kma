/*
 * KMA-gegevens (4.8.0): één plek voor de vorm van gegevens die de apps bewaren, delen en inlezen.
 *
 * 1. GEGEVENSVERSIE. Back-ups, gedeelde dossiers en feedbackbestanden krijgen het veld "dataVersie". Een app leest
 *    geen bestand in dat met een nieuwere gegevensversie is gemaakt: hij zegt dan dat de app eerst bijgewerkt moet
 *    worden. Zo raakt er niets ongemerkt kwijt (zoals bij 4.7.0, toen een ouder CadetVolgSysteem de nieuwe
 *    stresscheck niet kon lezen). Verhoog VERSIE alleen als een oudere app de nieuwe gegevens niet goed kan lezen,
 *    en zet er een regel bij in GESCHIEDENIS.
 * 2. OMZETTINGEN. Alle omzettingen van oude naar nieuwe gegevens staan hier op een rij (OMZETTINGEN), met de plek
 *    in de code waar ze gebeuren. Een nieuwe omzetting hoort in deze lijst.
 * 3. VEILIG INLEZEN. Alles wat van buiten komt (gekozen bestand, QR-code, geplakte tekst, gedeelde map) gaat door
 *    KMAData.schoon(): velden met een afbeelding of bijlage mogen alleen een data-URL bevatten, lijsten moeten
 *    lijsten zijn en gevaarlijke sleutels (__proto__) verdwijnen. Een kapot of kwaadaardig bestand kan de app dan
 *    niet laten vastlopen of code laten uitvoeren. kma-bridge.js haalt elk gekozen bestand hier doorheen
 *    (window.kmaTransformFile, zie onderaan).
 *
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  if (window.KMAData) return;

  var VERSIE = 3;
  var GESCHIEDENIS = [
    { v: 1, app: 't/m 4.6.0', wat: 'Uitgangsvorm: stresscheck met 14 vragen (PSS-14).' },
    { v: 2, app: '4.7.0', wat: 'Stresscheck PSS-10 (10 antwoorden per meting), WHO-5, doel in vijf niveaus (GAS), obstakel (WOOP).' },
    { v: 3, app: '4.8.0', wat: 'Het veld dataVersie in back-ups, gedeelde dossiers en feedback. Bestanden zonder dit veld gelden als versie 2 of ouder.' }
  ];
  /* Omzettingen van oude gegevens. "waar" = het moment: bij binnenkomst (eenmalig, wordt opgeslagen) of bij lezen
     (de opgeslagen gegevens blijven zoals ze zijn; het scherm rekent om). */
  var OMZETTINGEN = [
    { sinds: '4.3', wat: 'Verbeterde vraagteksten: antwoorden verhuizen naar de nieuwe tekst', waar: 'bij binnenkomst en bij de start', code: 'kma-transfer.js: KMA_TEXT_RENAMES, kmaRenameAnswers' },
    { sinds: '4.3', wat: 'Luchtmacht heet CLRS (was CLSK / KLu)', waar: 'bij binnenkomst en bij de start', code: 'kma-transfer.js: kmaFixOpco' },
    { sinds: '4.4', wat: '5G-T: inzichten, leervraag en actieplan staan in stap 4', waar: 'bij lezen', code: 'kma-5gt.js: migrate, view' },
    { sinds: '4.3', wat: 'Persoonlijkheidstest: resultaten van de oude HEXACO-variant tellen niet mee', waar: 'bij lezen', code: 'pagina.html: KMA_PERS_SET, kmaPersLegacy' },
    { sinds: '4.7.0', wat: 'Stresscheck: een meting met 14 antwoorden (PSS-14) wordt als PSS-10 gelezen', waar: 'bij lezen', code: 'kma-pss.js: ten, legacy, FROM14' },
    // 4.30 (punt 62): elke omzetting heeft een test met oude gegevens erin (besluit 23-11: niets mag verdwijnen)
    { sinds: '4.30', wat: 'Profiel zonder instroom krijgt de standaard burger, zonder startdatum; niets anders verandert', waar: 'bij de start (eenmalig)', code: 'kma-boek-instroom.js: migreer · test_instroom' },
    { sinds: '4.30', wat: 'Gereedschapskist: al gebruikte modellen (WOOP, doel in vijf niveaus, roos, nabespreking) staan aan', waar: 'bij de start (eenmalig)', code: 'kma-boek-gereedschap.js: migreer · test_gereedschap' },
    { sinds: '4.30', wat: 'Bestaande persoonlijkheidstest = eerste meting (kort, of lang als de 144 klaar zijn); wie al deelde blijft de test delen', waar: 'bij het eerste lezen (eenmalig)', code: 'kma-boek-meting.js: migreer · test_meting' },
    { sinds: '4.30', wat: 'Nieuwe meting: de vorige antwoorden gaan met de meting mee de lijst in (niets wordt gewist)', waar: 'bij een nieuwe meting', code: 'kma-boek-meting.js: nieuw · test_meting' },
    { sinds: '4.30', wat: 'Deelmap: map met code i.p.v. Peoplesoft-nummer; oude mappen worden nog gelezen en beschreven', waar: 'bij delen en inlezen', code: 'kma-deelmap.js: psHash, psDirOud · test_deelmap' },
    { sinds: '4.30', wat: 'Pincode op de website: leesbare pincode wordt omgezet naar een afgeleide code', waar: 'bij de eerste keer goed invoeren', code: 'kma-bridge.js: kmaPin (web) · test_pinweb' },
    { sinds: '4.30', wat: 'CVS: stress en welzijn uit oude dossiers blijven bewaard maar worden niet getoond', waar: 'bij lezen', code: 'kma-volg-visuals.js, kma-volg-aandacht.js · test_welzijn_cvs' },
    { sinds: '4.31', wat: 'Deelmap CVS: niveau van de gekozen map (hoofdmap, pelotons of peloton) en "nieuw van je instructeurs"; oude koppelingen zonder niveau werken als hoofdmap', waar: 'bij koppelen en synchroniseren', code: 'kma-deelmap.js: niveau, pelBase, kmaStafNieuw · test_peloton' },
    { sinds: '4.31', wat: 'Keuze korte/lange test als JSON bewaard, zodat hij meegaat in de back-up; de oude vorm (lang) blijft gelden', waar: 'bij lezen en bij de volgende keuze', code: 'kma-boek-meting.js: keuze · test_controle431' },
    { sinds: '4.31', wat: 'Deelmap CVS: kiest een instructeur later een andere laag van de map, dan zoekt de app het niveau opnieuw (niets gaat verloren)', waar: 'bij synchroniseren', code: 'kma-deelmap.js: findMyPeloton, eigenSleutel · test_controle431' },
    { sinds: '4.33', wat: 'CVS-back-up: de beveiligde vorm is een object (cadetten + teamsleutel, instructeurs, peloton, groepscodes); de oude vorm (lijst cadetten) wordt nog gelezen, instructeurs worden samengevoegd', waar: 'bij terugzetten', code: 'kma-transfer.js: cvsTekst; kma-ui-volg.js: importInstructorData; kma-deelmap.js: kmaDeelHerstel · test_deelmap433' },
    { sinds: '4.33', wat: 'Deelmap: nieuwe bestanden ontvangst.json (cadet) en ontvangst/<id>.json (instructeur); oudere versies negeren ze, conflictkopieën van eigen bestanden worden opgeruimd', waar: 'bij synchroniseren', code: 'kma-deelmap.js: ontvangstNaarCadetten, ontvangstNaarStaf, opruimen · test_deelmap433' },
    { sinds: '4.33.1', wat: 'CVS: sleutels en concepten die oudere boekjes in extras meestuurden (kameraden, reserve-*, concepten) worden uit de dossiers gehaald; de rest van extras blijft', waar: 'bij de start en bij elk opslaan', code: 'kma-deelmap.js: schoonExtras · test_extras4331' },
    { sinds: '4.34.1', wat: 'teamsleutel.json krijgt het veld toestel (willekeurige id); oudere versies negeren het', waar: 'bij publiceren', code: 'kma-deelmap.js: toestelId, publish · test_herstel4341' },
    { sinds: '4.35', wat: 'Deelmap: busbestanden in de submap bus/ naast de vaste bestanden; oude versies lezen de vaste bestanden, nieuwe het jongste busbestand', waar: 'bij synchroniseren', code: 'kma-deelmap.js: busSchrijf, busLees · test_bus435' },
    { sinds: '4.40', wat: 'CVS web-app: bijlagen (dataUrl) gaan naar IndexedDB (kma-cvs-bijlagen); in het dossier blijft { opslag: \'idb\', ref, lengte }. Pas na zetten en teruglezen uit het dossier; back-ups en delen krijgen de bestanden terug. Apps: ongewijzigd', waar: 'bij de start en na elke keer opslaan', code: 'kma-bijlagen.js · test_bijlagen440' }
  ];

  var IMG = /^data:image\/(png|jpe?g|webp|gif|bmp|heic|heif);base64,[A-Za-z0-9+/=\s]+$/i;
  var DATA = /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+(;[a-z0-9=._-]+)*,/i;
  /** Een afbeelding uit een dossier: alleen een ingesloten afbeelding (data-URL), anders leeg. */
  function safeImage(s) { return typeof s === 'string' && s.length < 12e6 && IMG.test(s) ? s : ''; }
  /** Een bijlage: alleen een data-URL (nooit javascript:, http: of iets anders), anders leeg. */
  function safeDataUrl(s) { return typeof s === 'string' && DATA.test(s) && !/^data:text\/html/i.test(s) && !/^data:image\/svg/i.test(s) ? s : ''; }

  var FOTO = { profilePhoto: 1, photo: 1, foto: 1, pasfoto: 1 }, BIJLAGE = { dataUrl: 1 };
  var LIJSTEN = ['timeline', 'cases5GT', 'casesKorthagen', 'dtf', 'jargon', 'fitness', 'hexacoObservers', 'attachments'];
  var OBJECTEN = ['answers', 'hexaco', 'hexacoSelf', 'extras', 'officialKMAForm', 'kmaOfficialSelfForm', 'feedback', 'feedback3', 'reflFeedback'];
  function isObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function dossierAchtig(o) { return isObj(o) && (isObj(o.answers) || Array.isArray(o.cases5GT) || Array.isArray(o.dtf) || 'persItemSet' in o || 'sharedChapters' in o); }

  /** De vorm van een dossier (back-up, gedeeld dossier, cadet.data): lijsten zijn lijsten van objecten, objecten zijn objecten. */
  function vormDossier(d) {
    LIJSTEN.forEach(function (k) {
      if (!(k in d)) return;
      if (!Array.isArray(d[k])) { delete d[k]; return; }
      d[k] = d[k].filter(isObj);
    });
    OBJECTEN.forEach(function (k) { if (k in d && d[k] != null && !isObj(d[k])) delete d[k]; });
    // een bijlage zonder bestand (alleen een notitie) blijft staan; een bijlage met een ongeldig bestand (gewist door schoon) niet
    if (Array.isArray(d.attachments)) d.attachments = d.attachments.filter(function (a) { return typeof a.name === 'string' && (!('dataUrl' in a) || !!a.dataUrl); });
    return d;
  }
  /** Maakt ingelezen gegevens veilig (in het object zelf) en geeft ze terug. Werkt op elk JSON-object. */
  function schoon(o, diep) {
    diep = diep || 0;
    if (diep > 60 || o == null || typeof o !== 'object') return o;
    if (Array.isArray(o)) { for (var i = 0; i < o.length; i++) schoon(o[i], diep + 1); return o; }
    ['__proto__', 'constructor', 'prototype'].forEach(function (k) { if (Object.prototype.hasOwnProperty.call(o, k)) delete o[k]; });
    Object.keys(o).forEach(function (k) {
      var v = o[k];
      if (FOTO[k] && typeof v === 'string') { o[k] = safeImage(v); return; }
      if (BIJLAGE[k] && typeof v === 'string') { o[k] = safeDataUrl(v); return; }
      if (v && typeof v === 'object') schoon(v, diep + 1);
    });
    if (dossierAchtig(o)) vormDossier(o);
    if (isObj(o.data) && 'name' in o) vormDossier(o.data);                       // een cadet in het CadetVolgSysteem
    return o;
  }

  /** Zet de gegevensversie in een bestand dat de app maakt. */
  function stempel(o) { if (isObj(o)) o.dataVersie = VERSIE; return o; }
  /** De hoogste gegevensversie in ingelezen gegevens (een lijst cadetten: de hoogste van de dossiers). */
  function versieVan(o) {
    var v = 0, kijk = function (x) { if (isObj(x) && typeof x.dataVersie === 'number' && x.dataVersie > v) v = x.dataVersie; };
    kijk(o);
    if (Array.isArray(o)) o.forEach(function (c) { kijk(c); if (isObj(c)) kijk(c.data); });
    else if (isObj(o)) { kijk(o.data); kijk(o.payload); }
    return v;
  }
  function teNieuw(o) { return versieVan(o) > VERSIE; }
  var MELDING_NIEUWER = 'is gemaakt met een nieuwere versie van de app. Werk deze app eerst bij; daarna kun je het bestand inlezen.';

  /** Alles wat van buiten komt: veilig maken en de versie controleren. Geeft { ok, data, reden }. */
  function inkomend(o, naam) {
    if (o == null || typeof o !== 'object') return { ok: true, data: o };
    if (teNieuw(o)) return { ok: false, data: null, reden: (naam ? '"' + naam + '" ' : 'Dit bestand ') + MELDING_NIEUWER };
    return { ok: true, data: schoon(o) };
  }
  /** Tekst (JSON) van buiten: geeft het veilige object, of null met een melding als het te nieuw is. Geen JSON: undefined. */
  function leesTekst(tekst, naam, stil) {
    var o; try { o = JSON.parse(tekst); } catch (e) { return undefined; }
    var r = inkomend(o, naam);
    if (!r.ok) { if (!stil) { if (window.kmaToast) kmaToast(r.reden, 'error'); else alert(r.reden); } return null; }
    return r.data;
  }

  /** Vervangt JSON.parse voor tekst van buiten: veilig gemaakt; bij een te nieuw bestand een melding en een fout. */
  function lees(tekst, naam) {
    var r = inkomend(JSON.parse(tekst), naam);
    if (!r.ok) { if (window.kmaToast) kmaToast(r.reden, 'error'); else alert(r.reden); throw new Error('kma-te-nieuw'); }
    return r.data;
  }
  window.kmaLees = lees;

  window.KMAData = { VERSIE: VERSIE, GESCHIEDENIS: GESCHIEDENIS, OMZETTINGEN: OMZETTINGEN, safeImage: safeImage, safeDataUrl: safeDataUrl,
    schoon: schoon, stempel: stempel, versieVan: versieVan, teNieuw: teNieuw, inkomend: inkomend, leesTekst: leesTekst, MELDING_NIEUWER: MELDING_NIEUWER };
  /** Kort voor in de schermen: een afbeelding uit een dossier, of leeg als het geen afbeelding is. */
  window.kmaSafeImg = safeImage;

  /* ---------- Elk gekozen bestand ----------
     kma-bridge.js geeft elk gekozen bestand (na uitpakken) aan window.kmaTransformFile. kma-transfer.js zet daar het
     ontsleutelen neer; dit blok komt erachter: het ontsleutelde JSON-bestand wordt veilig gemaakt en op versie
     gecontroleerd. Bestanden die geen JSON zijn (foto, PDF, tekst) gaan ongemoeid door. */
  function schoonBestand(f) {
    if (!f || !f.text || f.size > 60 * 1024 * 1024 || /^image\/|pdf/.test(f.type || '')) return Promise.resolve(f);
    return f.slice(0, 200).text().then(function (kop) {
      if (!/^\s*[\[{]/.test(kop) || /^\s*\{\s*"type"\s*:\s*"kma-enc"/.test(kop)) return f;      // geen JSON, of nog versleuteld
      return f.text().then(function (t) {
        var o; try { o = JSON.parse(t); } catch (e) { return f; }
        var r = inkomend(o, f.name);
        if (!r.ok) { alert(r.reden); return null; }
        return new File([JSON.stringify(r.data)], f.name, { type: f.type || 'application/json' });
      });
    }, function () { return f; });
  }
  function installeer() {
    var vorige = window.kmaTransformFile;
    if (vorige && vorige.kmaSchoon) return;
    var nieuw = function (f) { return Promise.resolve(vorige ? vorige(f) : f).then(function (g) { return g ? schoonBestand(g) : g; }); };
    nieuw.kmaSchoon = true;
    window.kmaTransformFile = nieuw;
  }
  window.KMAData.schoonBestand = schoonBestand;
  // kma-transfer.js laadt vóór dit bestand en heeft kmaTransformFile dan al gezet.
  installeer();
})();
