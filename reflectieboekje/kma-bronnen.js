/*
 * Wetenschappelijke onderbouwing: één bronnenbestand voor de apps, de handleiding en het onderzoeksvoorstel (4.18.0, blok O2).
 * Per onderdeel van de apps (apps: boek, cvs of beide; de pagina toont alleen wat bij de app hoort): wat het is, waarom het werkt (met het effect uit meta-analyses waar die er zijn),
 * de grenzen, en de bronnen in APA-stijl. De pagina (kma-onderbouwing.js), de handleiding (docs/handleiding/build.py)
 * en het onderzoeksvoorstel (tools/bronnen.py → docs/onderzoek/voorstel.md) lezen het blok tussen JSON-START en
 * JSON-END. Dat blok moet dus geldige JSON blijven (dubbele aanhalingstekens, geen komma na het laatste element).
 * Alle DOI's zijn op 22-11-2026 nagelopen via Crossref (jaar = jaar van het tijdschriftnummer, zoals APA vraagt).
 * Taalregel: geen gedachtestreepjes; paginabereiken met een gewoon streepje.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
(function () {
  'use strict';
  var DATA = /*JSON-START*/{
  "versie": "2026-11-24",
  "bronnen": {
    "ashton2007": { "apa": "Ashton, M. C., & Lee, K. (2007). Empirical, theoretical, and practical advantages of the HEXACO model of personality structure. *Personality and Social Psychology Review, 11*(2), 150-166.", "doi": "10.1177/1088868306294907" },
    "ashton2007ipip": { "apa": "Ashton, M. C., Lee, K., & Goldberg, L. R. (2007). The IPIP-HEXACO scales: An alternative, public-domain measure of the personality constructs in the HEXACO model. *Personality and Individual Differences, 42*(8), 1515-1526.", "doi": "10.1016/j.paid.2006.10.027" },
    "lee2004": { "apa": "Lee, K., & Ashton, M. C. (2004). Psychometric properties of the HEXACO Personality Inventory. *Multivariate Behavioral Research, 39*(2), 329-358.", "doi": "10.1207/s15327906mbr3902_8" },
    "lee2018": { "apa": "Lee, K., & Ashton, M. C. (2018). Psychometric properties of the HEXACO-100. *Assessment, 25*(5), 543-556.", "doi": "10.1177/1073191116659134" },
    "pletzer2019": { "apa": "Pletzer, J. L., Bentvelzen, M., Oostrom, J. K., & de Vries, R. E. (2019). A meta-analysis of the relations between personality and workplace deviance: Big Five versus HEXACO. *Journal of Vocational Behavior, 112*, 369-383.", "doi": "10.1016/j.jvb.2019.04.004" },
    "judge2002": { "apa": "Judge, T. A., Bono, J. E., Ilies, R., & Gerhardt, M. W. (2002). Personality and leadership: A qualitative and quantitative review. *Journal of Applied Psychology, 87*(4), 765-780.", "doi": "10.1037/0021-9010.87.4.765" },
    "johnson2005": { "apa": "Johnson, J. A. (2005). Ascertaining the validity of individual protocols from Web-based personality inventories. *Journal of Research in Personality, 39*(1), 103-129.", "doi": "10.1016/j.jrp.2004.09.009" },
    "meade2012": { "apa": "Meade, A. W., & Craig, S. B. (2012). Identifying careless responses in survey data. *Psychological Methods, 17*(3), 437-455.", "doi": "10.1037/a0028085" },
    "roberts2006": { "apa": "Roberts, B. W., Walton, K. E., & Viechtbauer, W. (2006). Patterns of mean-level change in personality traits across the life course: A meta-analysis of longitudinal studies. *Psychological Bulletin, 132*(1), 1-25.", "doi": "10.1037/0033-2909.132.1.1" },
    "jackson2012": { "apa": "Jackson, J. J., Thoemmes, F., Jonkmann, K., Lüdtke, O., & Trautwein, U. (2012). Military training and personality trait development: Does the military make the man, or does the man make the military? *Psychological Science, 23*(3), 270-277.", "doi": "10.1177/0956797611423545" },
    "vazire2010": { "apa": "Vazire, S. (2010). Who knows what about a person? The self-other knowledge asymmetry (SOKA) model. *Journal of Personality and Social Psychology, 98*(2), 281-300.", "doi": "10.1037/a0017908" },
    "helms2010": { "apa": "Helms, M. M., & Nixon, J. (2010). Exploring SWOT analysis, where are we now? A review of academic research from the last decade. *Journal of Strategy and Management, 3*(3), 215-251.", "doi": "10.1108/17554251011064837" },
    "leary1957": { "apa": "Leary, T. (1957). *Interpersonal diagnosis of personality*. Ronald Press." },
    "wiggins1979": { "apa": "Wiggins, J. S. (1979). A psychological taxonomy of trait-descriptive terms: The interpersonal domain. *Journal of Personality and Social Psychology, 37*(3), 395-412.", "doi": "10.1037/0022-3514.37.3.395" },
    "kiesler1983": { "apa": "Kiesler, D. J. (1983). The 1982 interpersonal circle: A taxonomy for complementarity in human transactions. *Psychological Review, 90*(3), 185-214.", "doi": "10.1037/0033-295X.90.3.185" },
    "barford2015": { "apa": "Barford, K. A., Zhao, K., & Smillie, L. D. (2015). Mapping the interpersonal domain: Translating between the Big Five, HEXACO, and Interpersonal Circumplex. *Personality and Individual Differences, 86*, 232-237.", "doi": "10.1016/j.paid.2015.05.038" },
    "defensie2019": { "apa": "Defensie. (2019). *Gedragsregels Defensie: Sociale veiligheid & integriteit* (versie 1.0)." },
    "cohen1983": { "apa": "Cohen, S., Kamarck, T., & Mermelstein, R. (1983). A global measure of perceived stress. *Journal of Health and Social Behavior, 24*(4), 385-396.", "doi": "10.2307/2136404" },
    "cohen1988": { "apa": "Cohen, S., & Williamson, G. (1988). Perceived stress in a probability sample of the United States. In S. Spacapan & S. Oskamp (Red.), *The social psychology of health* (pp. 31-67). Sage." },
    "cohen2012": { "apa": "Cohen, S., & Janicki-Deverts, D. (2012). Who's stressed? Distributions of psychological stress in the United States in probability samples from 1983, 2006, and 2009. *Journal of Applied Social Psychology, 42*(6), 1320-1334.", "doi": "10.1111/j.1559-1816.2012.00900.x" },
    "lee2012": { "apa": "Lee, E.-H. (2012). Review of the psychometric evidence of the Perceived Stress Scale. *Asian Nursing Research, 6*(4), 121-127.", "doi": "10.1016/j.anr.2012.08.004" },
    "jacobson1991": { "apa": "Jacobson, N. S., & Truax, P. (1991). Clinical significance: A statistical approach to defining meaningful change in psychotherapy research. *Journal of Consulting and Clinical Psychology, 59*(1), 12-19.", "doi": "10.1037/0022-006X.59.1.12" },
    "topp2015": { "apa": "Topp, C. W., Østergaard, S. D., Søndergaard, S., & Bech, P. (2015). The WHO-5 Well-Being Index: A systematic review of the literature. *Psychotherapy and Psychosomatics, 84*(3), 167-176.", "doi": "10.1159/000376585" },
    "flanagan1954": { "apa": "Flanagan, J. C. (1954). The critical incident technique. *Psychological Bulletin, 51*(4), 327-358.", "doi": "10.1037/h0061470" },
    "hattie2007": { "apa": "Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research, 77*(1), 81-112.", "doi": "10.3102/003465430298487" },
    "wisniewski2020": { "apa": "Wisniewski, B., Zierer, K., & Hattie, J. (2020). The power of feedback revisited: A meta-analysis of educational feedback research. *Frontiers in Psychology, 10*, Artikel 3087.", "doi": "10.3389/fpsyg.2019.03087" },
    "kluger1996": { "apa": "Kluger, A. N., & DeNisi, A. (1996). The effects of feedback interventions on performance: A historical review, a meta-analysis, and a preliminary feedback intervention theory. *Psychological Bulletin, 119*(2), 254-284.", "doi": "10.1037/0033-2909.119.2.254" },
    "ellis1962": { "apa": "Ellis, A. (1962). *Reason and emotion in psychotherapy*. Lyle Stuart." },
    "david2018": { "apa": "David, D., Cotet, C., Matu, S., Mogoase, C., & Stefan, S. (2018). 50 years of rational-emotive and cognitive-behavioral therapy: A systematic review and meta-analysis. *Journal of Clinical Psychology, 74*(3), 304-318.", "doi": "10.1002/jclp.22514" },
    "mann2009": { "apa": "Mann, K., Gordon, J., & MacLeod, A. (2009). Reflection and reflective practice in health professions education: A systematic review. *Advances in Health Sciences Education, 14*(4), 595-621.", "doi": "10.1007/s10459-007-9090-2" },
    "korthagen2005": { "apa": "Korthagen, F., & Vasalos, A. (2005). Levels in reflection: Core reflection as a means to enhance professional growth. *Teachers and Teaching, 11*(1), 47-71.", "doi": "10.1080/1354060042000337093" },
    "locke2002": { "apa": "Locke, E. A., & Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation: A 35-year odyssey. *American Psychologist, 57*(9), 705-717.", "doi": "10.1037/0003-066X.57.9.705" },
    "doran1981": { "apa": "Doran, G. T. (1981). There's a S.M.A.R.T. way to write management's goals and objectives. *Management Review, 70*(11), 35-36." },
    "gollwitzer2006": { "apa": "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. *Advances in Experimental Social Psychology, 38*, 69-119.", "doi": "10.1016/S0065-2601(06)38002-1" },
    "kiresuk1968": { "apa": "Kiresuk, T. J., & Sherman, R. E. (1968). Goal attainment scaling: A general method for evaluating comprehensive community mental health programs. *Community Mental Health Journal, 4*(6), 443-453.", "doi": "10.1007/BF01530764" },
    "oettingen2012": { "apa": "Oettingen, G. (2012). Future thought and behaviour change. *European Review of Social Psychology, 23*(1), 1-63.", "doi": "10.1080/10463283.2011.643698" },
    "wang2021": { "apa": "Wang, G., Wang, Y., & Gai, X. (2021). A meta-analysis of the effects of mental contrasting with implementation intentions on goal attainment. *Frontiers in Psychology, 12*, Artikel 565202.", "doi": "10.3389/fpsyg.2021.565202" },
    "double2020": { "apa": "Double, K. S., McGrane, J. A., & Hopfenbeck, T. N. (2020). The impact of peer assessment on academic performance: A meta-analysis of control group studies. *Educational Psychology Review, 32*(2), 481-509.", "doi": "10.1007/s10648-019-09510-3" },
    "smither2005": { "apa": "Smither, J. W., London, M., & Reilly, R. R. (2005). Does performance improve following multisource feedback? A theoretical model, meta-analysis, and review of empirical findings. *Personnel Psychology, 58*(1), 33-66.", "doi": "10.1111/j.1744-6570.2005.514_1.x" },
    "tannenbaum2013": { "apa": "Tannenbaum, S. I., & Cerasoli, C. P. (2013). Do team and individual debriefs enhance performance? A meta-analysis. *Human Factors, 55*(1), 231-245.", "doi": "10.1177/0018720812448394" },
    "keiser2021": { "apa": "Keiser, N. L., & Arthur, W., Jr. (2021). A meta-analysis of the effectiveness of the after-action review (or debrief) and factors that influence its effectiveness. *Journal of Applied Psychology, 106*(7), 1007-1032.", "doi": "10.1037/apl0000821" },
    "schuwirth2011": { "apa": "Schuwirth, L. W. T., & Van der Vleuten, C. P. M. (2011). Programmatic assessment: From assessment of learning to assessment for learning. *Medical Teacher, 33*(6), 478-485.", "doi": "10.3109/0142159X.2011.565828" },
    "vleuten2012": { "apa": "Van der Vleuten, C. P. M., Schuwirth, L. W. T., Driessen, E. W., Dijkstra, J., Tigelaar, D., Baartman, L. K. J., & van Tartwijk, J. (2012). A model for programmatic assessment fit for purpose. *Medical Teacher, 34*(3), 205-214.", "doi": "10.3109/0142159X.2012.652239" },
    "vleuten2018": { "apa": "Van der Vleuten, C. P. M., Lindemann, I., & Schmidt, L. (2018). Programmatic assessment: The process, rationale and evidence for modern evaluation approaches in medical education. *Medical Journal of Australia, 209*(9), 386-388.", "doi": "10.5694/mja17.00926" },
    "woehr1994": { "apa": "Woehr, D. J., & Huffcutt, A. I. (1994). Rater training for performance appraisal: A quantitative review. *Journal of Occupational and Organizational Psychology, 67*(3), 189-205.", "doi": "10.1111/j.2044-8325.1994.tb00562.x" },
    "roch2012": { "apa": "Roch, S. G., Woehr, D. J., Mishra, V., & Kieszczynska, U. (2012). Rater training revisited: An updated meta-analytic review of frame-of-reference training. *Journal of Occupational and Organizational Psychology, 85*(2), 370-395.", "doi": "10.1111/j.2044-8325.2011.02045.x" },
    "orford1986": { "apa": "Orford, J. (1986). The rules of interpersonal complementarity: Does hostility beget hostility and dominance, submission? *Psychological Review, 93*(3), 365-377.", "doi": "10.1037/0033-295X.93.3.365" },
    "sadler2009": { "apa": "Sadler, P., Ethier, N., Gunn, G. R., Duong, D., & Woody, E. (2009). Are we on the same wavelength? Interpersonal complementarity as shared cyclical patterns during interactions. *Journal of Personality and Social Psychology, 97*(6), 1005-1020.", "doi": "10.1037/a0016232" },
    "mainhard2011": { "apa": "Mainhard, M. T., Brekelmans, M., & Wubbels, T. (2011). Coercive and supportive teacher behaviour: Within- and across-lesson associations with the classroom social climate. *Learning and Instruction, 21*(3), 345-354.", "doi": "10.1016/j.learninstruc.2010.03.003" },
    "watling2019": { "apa": "Watling, C. J., & Ginsburg, S. (2019). Assessment, feedback and the alchemy of learning. *Medical Education, 53*(1), 76-85.", "doi": "10.1111/medu.13645" },
    "theeboom2014": { "apa": "Theeboom, T., Beersma, B., & van Vianen, A. E. M. (2014). Does coaching work? A meta-analysis on the effects of coaching on individual level outcomes in an organizational context. *The Journal of Positive Psychology, 9*(1), 1-18.", "doi": "10.1080/17439760.2013.837499" },
    "zimmerman2002": { "apa": "Zimmerman, B. J. (2002). Becoming a self-regulated learner: An overview. *Theory Into Practice, 41*(2), 64-70.", "doi": "10.1207/s15430421tip4102_2" },
    "theobald2021": { "apa": "Theobald, M. (2021). Self-regulated learning training programs enhance university students' academic performance, self-regulated learning strategies, and motivation: A meta-analysis. *Contemporary Educational Psychology, 66*, Artikel 101976.", "doi": "10.1016/j.cedpsych.2021.101976" },
    "day2014": { "apa": "Day, D. V., Fleenor, J. W., Atwater, L. E., Sturm, R. E., & McKee, R. A. (2014). Advances in leader and leadership development: A review of 25 years of research and theory. *The Leadership Quarterly, 25*(1), 63-82.", "doi": "10.1016/j.leaqua.2013.11.004" },
    "winstone2017": { "apa": "Winstone, N. E., Nash, R. A., Parker, M., & Rowntree, J. (2017). Supporting learners' agentic engagement with feedback: A systematic review and a taxonomy of recipience processes. *Educational Psychologist, 52*(1), 17-37.", "doi": "10.1080/00461520.2016.1207538" },
    "carless2018": { "apa": "Carless, D., & Boud, D. (2018). The development of student feedback literacy: Enabling uptake of feedback. *Assessment & Evaluation in Higher Education, 43*(8), 1315-1325.", "doi": "10.1080/02602938.2018.1463354" },
    "landy1980": { "apa": "Landy, F. J., & Farr, J. L. (1980). Performance rating. *Psychological Bulletin, 87*(1), 72-107.", "doi": "10.1037/0033-2909.87.1.72" },
    "ashton2004": { "apa": "Ashton, M. C., Lee, K., Perugini, M., Szarota, P., de Vries, R. E., Di Blas, L., Boies, K., & De Raad, B. (2004). A six-factor structure of personality-descriptive adjectives: Solutions from psycholexical studies in seven languages. *Journal of Personality and Social Psychology, 86*(2), 356-366.", "doi": "10.1037/0022-3514.86.2.356" },
    "ashton2009types": { "apa": "Ashton, M. C., & Lee, K. (2009). An investigation of personality types within the HEXACO personality framework. *Journal of Individual Differences, 30*(4), 181-187.", "doi": "10.1027/1614-0001.30.4.181" },
    "devries2009": { "apa": "De Vries, R. E., Ashton, M. C., & Lee, K. (2009). De zes belangrijkste persoonlijkheidsdimensies en de HEXACO Persoonlijkheidsvragenlijst. *Gedrag & Organisatie, 22*(3), 232-274." },
    "haslam2012": { "apa": "Haslam, N., Holland, E., & Kuppens, P. (2012). Categories versus dimensions in personality and psychopathology: A quantitative review of taxometric research. *Psychological Medicine, 42*(5), 903-920.", "doi": "10.1017/S0033291711001966" },
    "wiggins2003": { "apa": "Wiggins, J. S. (2003). *Paradigms of personality assessment*. Guilford Press." },
    "redeker2014": { "apa": "Redeker, M., de Vries, R. E., Rouckhout, D., Vermeren, P., & de Fruyt, F. (2014). Integrating leadership: The leadership circumplex. *European Journal of Work and Organizational Psychology, 23*(3), 435-455.", "doi": "10.1080/1359432X.2012.738671" },
    "devries2017": { "apa": "De Vries, R. E. (2017). The leadership circumplex. In S. G. Rogelberg (Red.), *The SAGE encyclopedia of industrial and organizational psychology* (2e ed., pp. 874-875). SAGE.", "doi": "10.4135/9781483386874.n555" },
    "fabrigar1997": { "apa": "Fabrigar, L. R., Visser, P. S., & Browne, M. W. (1997). Conceptual and methodological issues in testing the circumplex structure of data in personality and social psychology. *Personality and Social Psychology Review, 1*(3), 184-203.", "doi": "10.1207/s15327957pspr0103_1" },
    "locke2019": { "apa": "Locke, K. D. (2019). Development and validation of a circumplex measure of the interpersonal culture in work teams and organizations. *Frontiers in Psychology, 10*, Artikel 850.", "doi": "10.3389/fpsyg.2019.00850" },
    "hoge2004": { "apa": "Hoge, C. W., Castro, C. A., Messer, S. C., McGurk, D., Cotting, D. I., & Koffman, R. L. (2004). Combat duty in Iraq and Afghanistan, mental health problems, and barriers to care. *New England Journal of Medicine, 351*(1), 13-22.", "doi": "10.1056/NEJMoa040603" }
  },
  "onderdelen": [
    {
      "id": "dtf", "apps": ["boek","cvs"], "titel": "Datum-Tijd-Feit (DTF)", "waar": "Boekje: DTF-logboek, + Nieuw → DTF-feit. CVS: DTF-notities per cadet.",
      "hoofdstukken": ["Datum-Tijd-Feit Logboek"],
      "wat": "Je legt kort na een gebeurtenis vast wanneer het was en wat er feitelijk gebeurde, zonder oordeel. Daarna koppel je het aan een V van de Gedragscode.",
      "waarom": "Een oordeel ('hij is lui') kun je niet nagaan en niet verbeteren; een feit wel. Vastleggen kort na de gebeurtenis voorkomt dat het geheugen het verhaal bijkleurt. De methode komt uit de critical incident technique: concrete, waargenomen voorvallen als basis voor beoordelen en leren. Feedback over concreet gedrag werkt beter dan feedback over de persoon.",
      "effect": "Feedback over taak en proces: gemiddeld d = 0,48 (435 studies); feedback over de persoon heeft nauwelijks effect.",
      "grenzen": "Er is geen onderzoek naar een DTF-logboek als zodanig. Het effect komt pas als de feiten worden besproken en tot een volgende stap leiden. Feiten van één persoon blijven één perspectief.",
      "bronnen": ["flanagan1954", "hattie2007", "wisniewski2020", "kluger1996"]
    },
    {
      "id": "5gt", "apps": ["boek"], "titel": "5G-T-reflectie", "waar": "Boekje: Zelfreflectie Leervraag (5G-T).",
      "hoofdstukken": ["Zelfreflectie Leervraag (5G-T)"],
      "wat": "Je ontleedt een situatie in vijf G's (gebeurtenis, gevoel, gedachten, gedrag, gevolg), toetst je belangrijkste gedachte, kijkt wat je kunt beïnvloeden en kiest wat je de volgende keer doet (T van toekomst).",
      "waarom": "Het 5G-schema komt uit de rationeel-emotieve en cognitieve gedragstherapie: niet de gebeurtenis zelf, maar je gedachte erover bepaalt grotendeels je gevoel en gedrag. Door die gedachte te toetsen aan de feiten krijg je meer keuze in hoe je reageert.",
      "effect": "Rationeel-emotieve en cognitieve gedragstherapie: in een meta-analyse over 50 jaar onderzoek gemiddeld een middelgroot effect.",
      "grenzen": "Dat effect geldt voor therapie onder begeleiding, niet voor zelfreflectie in een boekje. Het 5G-T-format zelf is niet onderzocht. Het is geen behandeling: bij aanhoudende klachten hoort een professional.",
      "bronnen": ["ellis1962", "david2018", "mann2009"]
    },
    {
      "id": "korthagen", "apps": ["boek"], "titel": "Procesreflectie (Korthagen)", "waar": "Boekje: Procesreflectie (Korthagen).",
      "hoofdstukken": ["Procesreflectie (Korthagen)"],
      "wat": "Reflecteren in vijf fasen (ALACT): handelen, terugblikken, je bewust worden van de kern, alternatieven bedenken en die uitproberen. Daarna begint de cirkel opnieuw.",
      "waarom": "Het model maakt van reflectie een cyclus die eindigt in ander gedrag, in plaats van alleen nadenken. Het is in de Nederlandse beroepsopleidingen (eerst lerarenopleiding) breed in gebruik.",
      "effect": "",
      "grenzen": "Reviews laten zien dat reflectie in opleidingen veel wordt gebruikt, maar dat er weinig onderzoek met een vergelijkingsgroep is naar het effect op gedrag. Reflectie werkt beter met begeleiding en een concrete volgende stap.",
      "bronnen": ["korthagen2005", "mann2009"]
    },
    {
      "id": "smart", "apps": ["boek"], "titel": "SMART-leervraag en als-dan-plannen", "waar": "Boekje: SMART Leervraag (leervraag, als-dan-plannen, wekelijkse check-in).",
      "hoofdstukken": ["SMART Leervraag"],
      "wat": "Je maakt van je leerdoel een specifieke, meetbare leervraag met een datum. De app laat dezelfde leervraag ook zien als HKI-vraag ('Hoe kan ik ...?'), de vorm die de KMA gebruikt. Daarbij maak je tot drie als-dan-plannen: 'Als situatie X, dan doe ik Y'. Elke week check je in: is het gelukt?",
      "waarom": "Specifieke, uitdagende doelen leiden tot betere prestaties dan 'doe je best'. Een als-dan-plan koppelt het doel aan een herkenbaar moment, zodat je in die situatie bijna vanzelf handelt. De check-in houdt bij of het werkt.",
      "effect": "Als-dan-plannen: middelgroot tot groot effect op het bereiken van doelen, d = 0,65 (94 toetsen).",
      "grenzen": "Werkt vooral als het doel je echt iets zegt. Een SMART-formulering alleen is geen bewezen methode (het acroniem komt uit de managementpraktijk); de kracht zit in specifiek en uitdagend.",
      "bronnen": ["locke2002", "doran1981", "gollwitzer2006"]
    },
    {
      "id": "gas", "apps": ["boek"], "titel": "Doel in vijf niveaus (GAS)", "waar": "Boekje: SMART Leervraag, onderdeel Doel in vijf niveaus.",
      "hoofdstukken": ["SMART Leervraag"],
      "wat": "Je beschrijft vooraf vijf niveaus van je doel, van veel slechter (-2) tot veel beter (+2) dan verwacht, en geeft elke week aan waar je staat.",
      "waarom": "Goal Attainment Scaling maakt een persoonlijk doel meetbaar zonder dat iedereen hetzelfde doel hoeft te hebben. Je ziet je voortgang in een lijn.",
      "effect": "",
      "grenzen": "GAS is een meetmethode, geen interventie met een eigen effect. De niveaus zijn zo goed als je ze opschrijft: vaag geformuleerde niveaus maken de meting onbetrouwbaar.",
      "bronnen": ["kiresuk1968"]
    },
    {
      "id": "woop", "apps": ["boek"], "titel": "WOOP (wens, uitkomst, obstakel, plan)", "waar": "Boekje: SMART Leervraag, onderdeel WOOP.",
      "hoofdstukken": ["SMART Leervraag"],
      "wat": "Je stelt je de beste uitkomst voor en daarna het belangrijkste obstakel in jezelf. Van dat obstakel maak je een als-dan-plan.",
      "waarom": "Alleen positief dromen maakt mensen soms minder actief. Het contrast tussen gewenste uitkomst en obstakel (mentaal contrasteren), gecombineerd met een als-dan-plan, helpt juist om in actie te komen.",
      "effect": "Mentaal contrasteren met als-dan-plannen: een klein tot middelgroot effect op doelbereik in een meta-analyse.",
      "grenzen": "De meeste studies zijn kort en bij studenten. Het effect hangt af van een concreet en eerlijk benoemd obstakel.",
      "bronnen": ["oettingen2012", "wang2021", "gollwitzer2006"]
    },
    {
      "id": "hexaco", "apps": ["boek","cvs"], "titel": "Persoonlijkheidstest (HEXACO, IPIP)", "waar": "Boekje: Persoonlijkheidstest (IPIP), metingen en groeilijn, 360-observaties, SWOT met bewijs. CVS: profiel, groei en de verdeling in je peloton.",
      "hoofdstukken": ["Persoonlijkheidstest (IPIP)"],
      "wat": "Kort (96 stellingen, ongeveer 12 minuten) of lang (240 stellingen, 30 tot 40 minuten) over zes eigenschappen: Integriteit, Emotionaliteit, Extraversie, Verdraagzaamheid, Consciëntieusheid en Openheid. Je ziet per eigenschap een percentiel en een band. Medecadetten kunnen dezelfde stellingen over jou invullen. De test is standaard privé; jij kiest of je teamleider hem ziet.",
      "waarom": "Het HEXACO-model is gevonden in taalonderzoek in veel talen, waaronder het Nederlands. De zesde eigenschap, Integriteit (Honesty-Humility), voorspelt integer en niet-integer gedrag op het werk beter dan de Big Five. Extraversie hangt samen met het ontstaan van leiderschap. Anderen zien sommige eigenschappen beter dan jijzelf; daarom de observaties.",
      "effect": "Integriteit is in een meta-analyse de sterkste voorspeller van ongewenst gedrag op het werk.",
      "grenzen": "De app gebruikt vrij te gebruiken IPIP-stellingen; de Nederlandse vertaling is nog niet apart onderzocht. De percentielen komen uit een internationale, online normgroep, niet uit KMA-cadetten. Ligt je score binnen één meetfout van een bandgrens, dan meldt de app een grensgeval. De uitslag is niet bedoeld voor selectie of beoordeling. Persoonlijkheid verandert langzaam, ook in een militaire opleiding.",
      "bronnen": ["ashton2007", "ashton2007ipip", "lee2004", "pletzer2019", "judge2002", "vazire2010", "roberts2006", "jackson2012", "johnson2005", "meade2012"]
    },
    {
      "id": "meting", "apps": ["boek","cvs"], "titel": "Herhaalde meting en echte verandering", "waar": "Boekje: Persoonlijkheidstest (IPIP) → metingen, Vandaag (meetmoment). CVS: groei in het profiel van de cadet.",
      "hoofdstukken": ["Persoonlijkheidstest (IPIP)"],
      "wat": "Je maakt de test aan het begin, midden en eind van je opleiding, gerekend vanaf je eigen start (burger week 1, doorstromer week 8). De groeilijn toont alleen een echte verandering als het verschil groter is dan de meetfout.",
      "waarom": "Elke test heeft meetfout: twee keer meten geeft nooit precies dezelfde score. De reliable change index berekent of een verschil groter is dan je door toeval zou verwachten. Zo zie je geen groei of achteruitgang die er niet is. Een lange test heeft een kleinere meetfout en laat dus eerder een echte verandering zien.",
      "effect": "Persoonlijkheid verandert in de jongvolwassenheid gemiddeld wel, vooral in Consciëntieusheid en emotionele stabiliteit (meta-analyse van 92 studies).",
      "grenzen": "De meetfout is berekend met een geschatte betrouwbaarheid (ongeveer .80 kort, .90 lang), niet met KMA-gegevens. Een opleiding van een paar jaar is kort voor persoonlijkheid; geen verandering is dus een gewone uitkomst.",
      "bronnen": ["jacobson1991", "roberts2006", "jackson2012"]
    },
    {
      "id": "swot", "apps": ["boek"], "titel": "SWOT met bewijs en kernkwadranten", "waar": "Boekje: profiel na de persoonlijkheidstest, gereedschapskist, koppeling bij DTF-feiten.",
      "hoofdstukken": [],
      "wat": "Je sterktes, zwaktes, kansen en bedreigingen, afgeleid uit je testuitslag. Bij elk punt zie je het bewijs: je eigen DTF-feiten en of observatoren dezelfde kant op wijzen (bevestigd, niet bevestigd of nog te weinig gegevens).",
      "waarom": "Een testuitslag is een eerste aanwijzing, geen feit. Door elk punt naast concreet gedrag (DTF) en het oordeel van anderen te leggen, wordt de SWOT toetsbaar en bespreekbaar. Wat niet bevestigd wordt, blijft een vraag in plaats van een etiket.",
      "effect": "",
      "grenzen": "De SWOT is een denkhulp uit de strategische planning. Er is weinig onderzoek naar SWOT als methode, en geen naar SWOT voor persoonlijke ontwikkeling. De afleiding uit de test is een keuze van de ontwikkelaar.",
      "bronnen": ["helms2010", "flanagan1954", "vazire2010"]
    },
    {
      "id": "gereedschap", "apps": ["boek"], "titel": "Gereedschapskist", "waar": "Boekje: Gereedschapskist (menu en de werkboekfasen).",
      "hoofdstukken": [],
      "wat": "De vaste basis van het boekje volgt vijf stappen. Hulpmiddelen die je niet altijd nodig hebt (bijvoorbeeld SWOT, roos van Leary, WOOP, GAS) staan in de gereedschapskist. Je pakt ze erbij als ze bij je leervraag passen.",
      "waarom": "Zelfsturend leren betekent ook zelf kiezen welke aanpak bij je doel past. Minder verplichte onderdelen houdt de vaste route kort en laat ruimte voor wat jij nodig hebt.",
      "effect": "",
      "grenzen": "Of een vrije keuze van hulpmiddelen beter werkt dan een vaste volgorde, is voor deze opleiding niet onderzocht. Wat je in een hulpmiddel invulde, blijft bewaard, ook als je het weer opbergt.",
      "bronnen": ["zimmerman2002", "theobald2021"]
    },
    {
      "id": "leary", "apps": ["boek","cvs"], "titel": "Roos van Leary", "waar": "Boekje: Roos van Leary (via de gereedschapskist), met één hoofdboodschap. CVS: roos per cadet.",
      "hoofdstukken": ["Roos van Leary"],
      "wat": "Interpersoonlijk gedrag op twee assen: boven tegenover onder (invloed) en samen tegenover tegen (verbondenheid). Je zet een gedraging als stip op de roos.",
      "waarom": "De twee assen van het interpersoonlijk circumplex zijn in veel onderzoek teruggevonden. Gedrag lokt gedrag uit: op de samen-tegen-as roept gedrag hetzelfde gedrag op (samen roept samen op, tegen roept tegen op), op de boven-onder-as het tegenovergestelde (boven lokt onder uit). Metingen van moment tot moment laten zien dat twee mensen in een gesprek zo op elkaar inregelen. In de klas hangt ondersteunend gedrag van de leraar samen met een beter klimaat en dwingend gedrag met een slechter; het beste werkt warm en duidelijk tegelijk. Zo kun je bewuster kiezen hoe je een ander beïnvloedt, en een escalatie doorbreken door niet mee te gaan in tegen-gedrag.",
      "effect": "",
      "grenzen": "Aan de tegen-kant klopt de regel maar half: op aanvallend gedrag reageren mensen vaak óók aanvallend, niet onderdanig, en zo escaleert het. Dat een samen-reactie zo'n escalatie doorbreekt, komt vooral uit de therapiepraktijk en is minder hard bewezen. De assen zijn goed onderbouwd, de gelijke verdeling in acht sectoren niet; daarom bewaart de app asscores. Eén stip van één beoordelaar zegt weinig: de verdeling verschijnt pas vanaf vijf stippen per bron. HEXACO en de roos hangen maar matig samen. De koppeling met de 4 V's is een denkhulp, geen meting.",
      "bronnen": ["leary1957", "wiggins1979", "kiesler1983", "orford1986", "sadler2009", "mainhard2011", "barford2015"]
    },
    {
      "id": "pss", "apps": ["boek"], "titel": "Stresscheck (PSS-10)", "waar": "Boekje: Fitheid & stress (altijd privé, nooit zichtbaar in het CVS).",
      "hoofdstukken": ["Fitheid & stress"],
      "wat": "Tien vragen over hoe onvoorspelbaar, oncontroleerbaar en overbelast je de afgelopen maand je leven ervoer. Score van 0 tot 40.",
      "waarom": "De Perceived Stress Scale is de meest gebruikte vragenlijst voor ervaren stress en heeft in een overzichtsstudie goede betrouwbaarheid. De app vergelijkt vooral met je eigen vorige meting en meldt een betrouwbare stijging (8 punten of meer).",
      "effect": "",
      "grenzen": "Er zijn geen officiële afkappunten; de indeling is afgeleid van Amerikaanse cijfers voor jongvolwassenen. Het is geen diagnose. De uitslag blijft altijd op je eigen toestel en wordt nooit gedeeld, ook niet met je teamleider: in militaire opleidingen is de drempel om stress te melden hoog als men vreest dat het de beoordeling raakt.",
      "bronnen": ["cohen1983", "cohen1988", "cohen2012", "lee2012", "jacobson1991", "hoge2004"]
    },
    {
      "id": "who5", "apps": ["boek"], "titel": "Welzijnscheck (WHO-5)", "waar": "Boekje: Fitheid & stress (altijd privé, nooit zichtbaar in het CVS).",
      "hoofdstukken": ["Fitheid & stress"],
      "wat": "Vijf uitspraken over je welbevinden in de afgelopen twee weken, van 0 tot 100.",
      "waarom": "De WHO-5 is in een systematisch overzicht van 213 studies valide gebleken als maat voor welbevinden en om te zien wanneer het verstandig is met iemand te praten (50 of lager).",
      "effect": "",
      "grenzen": "Een korte vragenlijst, geen diagnose. Een lage score is een reden om met iemand te praten, niet meer en niet minder.",
      "bronnen": ["topp2015"]
    },
    {
      "id": "feedback", "apps": ["boek","cvs"], "titel": "Feedback van de teamleider (feed-up, feed-back, feed-forward)", "waar": "Boekje: Feedback van je teamleider, Vandaag. CVS: feedback in drie vragen.",
      "hoofdstukken": [],
      "wat": "Feedback in drie vragen: waar werk je naartoe (doel), wat zag ik (gedrag), wat is je volgende stap.",
      "waarom": "Feedback werkt het best als hij antwoord geeft op deze drie vragen en over taak, proces of zelfsturing gaat, niet over de persoon. Zonder volgende stap verandert er weinig.",
      "effect": "Gemiddeld d = 0,48 (435 studies). In een oudere meta-analyse verslechterde in een derde van de studies de prestatie na feedback, vooral bij feedback over de persoon.",
      "grenzen": "Gemiddelden uit onderwijsonderzoek; het effect bij cadetten wordt nog gemeten. De kwaliteit van de feedback bepaalt het effect.",
      "bronnen": ["hattie2007", "wisniewski2020", "kluger1996"]
    },
    {
      "id": "medecadet", "apps": ["boek"], "titel": "Feedback van medecadetten", "waar": "Boekje: + Nieuw → Feedback geven, inbox.",
      "hoofdstukken": [],
      "wat": "Cadetten geven elkaar korte feedbackkaarten (situatie, feit, effect, V, volgende stap). De ontvanger kiest wat hij ermee doet. De kaart volgt het OFGA-gespreksmodel dat de KMA leert (Opening, Feitelijk, Gewenst, Afsluiting): de letters staan bij de velden; de ontvanger sluit af met wat hij ermee gaat doen.",
      "waarom": "Feedback van medestudenten verhoogt prestaties, ook omdat je leert door zelf goed te kijken en te formuleren. Feedback van meerdere kanten (360 graden) helpt alleen als de ontvanger er doelen en acties aan verbindt; daarom de vraag 'Wat ga je ermee doen?'.",
      "effect": "Feedback van medestudenten: g = 0,31 (54 studies). 360-gradenfeedback: gemiddeld klein, groter met doelen en opvolging.",
      "grenzen": "Eén kaart van één medecadet is één perspectief. Zonder oefening is feedback van medestudenten minder nauwkeurig; vriendschap en groepsdruk kunnen meespelen. De labels 'blinde vlek' en 'verborgen kracht' verschijnen pas vanaf drie observatoren; daarvoor is het verschil zelf de boodschap. Kaarten van medecadetten tellen niet mee in de beoordeling door de teamleider.",
      "bronnen": ["double2020", "smither2005", "hattie2007"]
    },
    {
      "id": "ontvangen", "apps": ["boek","cvs"], "titel": "Oefenen met feedback ontvangen en geven", "waar": "Boekje: Meer → Oefenen met feedback ontvangen. CVS: Meer → Oefenen met een gesprek.",
      "hoofdstukken": [],
      "wat": "Korte casussen. De cadet kiest wat hij eerst doet als hij feedback krijgt; de teamleider oefent hoe hij een gesprek over een blinde vlek begint. Na elke keuze zie je waarom.",
      "waarom": "Feedback werkt pas als de ontvanger er iets mee doet. Feedback ontvangen is een vaardigheid: eerst begrijpen wat de ander bedoelt, dan pas reageren, en daarna één volgende stap kiezen. Wie dat oefent, gebruikt feedback vaker.",
      "effect": "Een overzicht van 195 studies vond dat oefeningen, gesprekken en hulpmiddelen rond feedback de betrokkenheid van de ontvanger vergroten.",
      "grenzen": "De casussen zijn door de ontwikkelaar geschreven en niet apart onderzocht. Oefenen in de app vervangt geen echt gesprek.",
      "bronnen": ["winstone2017", "carless2018", "kluger1996"]
    },
    {
      "id": "nabespreking", "apps": ["boek","cvs"], "titel": "Nabespreking (After Action Review)", "waar": "Boekje: + Nieuw → Nabespreking. CVS: Nabespreking oefening.",
      "hoofdstukken": [],
      "wat": "Vier vragen kort na een oefening: wat was de bedoeling, wat gebeurde er echt, waarom ging het zo, wat doe je volgende keer.",
      "waarom": "Een gestructureerde nabespreking zet ervaring om in een concrete verbetering. Dit is een van de best onderbouwde leermethoden in militaire en medische opleidingen.",
      "effect": "Debriefs verbeteren prestaties met gemiddeld 20 tot 25 procent, d = 0,67 (46 studies); een latere meta-analyse bevestigt een groot effect.",
      "grenzen": "Werkt beter met structuur en begeleiding en als de lessen echt worden toegepast. Een nabespreking die een schuldvraag wordt, werkt averechts.",
      "bronnen": ["tannenbaum2013", "keiser2021"]
    },
    {
      "id": "datapunten", "apps": ["boek","cvs"], "titel": "Datapunten en programmatisch toetsen", "waar": "Boekje: Voorbereiding Cadetbeoordeling (mijn datapunten). CVS: datapunten per V, beoordelingsformulier, onderbouwing delen.",
      "hoofdstukken": ["Voorbereiding Cadetbeoordeling", "Zelfbeoordelingsformulier KMA"],
      "wat": "Elke observatie (DTF, feedback, nabespreking) is een datapunt met lage inzet: bedoeld om van te leren. Een beoordeling rust op veel datapunten uit meerdere bronnen. De app waarschuwt bij minder dan 5 datapunten of minder dan 2 bronnen per V.",
      "waarom": "Eén meting is nooit betrouwbaar genoeg voor een zware beslissing. Door veel kleine observaties uit verschillende bronnen te combineren wordt het oordeel betrouwbaarder en kan de cadet er tussendoor van leren. Dit sluit aan op de OER (relevante observaties).",
      "effect": "",
      "grenzen": "Programmatisch toetsen is een samenhangend kader met onderbouwing uit de medische opleidingen, geen enkele interventie met één effectgrootte. De drempels (5 en 2) zijn een keuze, geen norm.",
      "bronnen": ["schuwirth2011", "vleuten2012", "vleuten2018"]
    },
    {
      "id": "kalibreren", "apps": ["cvs"], "titel": "Kalibreren (oefenen met beoordelen)", "waar": "CVS: Oefenen met beoordelen.",
      "hoofdstukken": [],
      "wat": "Teamleiders beoordelen dezelfde voorbeeldcasussen en vergelijken hun oordeel met een voorbeeldoordeel per V.",
      "waarom": "Frame-of-reference-training geeft beoordelaars een gedeeld beeld van wat goed en minder goed gedrag is. Daardoor worden oordelen nauwkeuriger en lopen ze minder uiteen tussen beoordelaars.",
      "effect": "Frame-of-reference-training: middelgroot tot groot effect op de nauwkeurigheid van beoordelen (twee meta-analyses).",
      "grenzen": "De voorbeeldoordelen in de app zijn niet door de KMA vastgesteld. Het effect blijft alleen als er regelmatig opnieuw wordt gekalibreerd.",
      "bronnen": ["woehr1994", "roch2012"]
    },
    {
      "id": "beoordelaar", "apps": ["cvs"], "titel": "Eerlijk beoordelen: verdeling, spreiding in de tijd en gesprekken", "waar": "CVS: beoordelingsformulier (waarnemingen per maand, je eigen verdeling), Aandacht (gesprek na 6 weken), verdeling in je peloton.",
      "hoofdstukken": [],
      "wat": "Bij elke V zie je hoeveel waarnemingen er per maand zijn. Je ziet je eigen verdeling van scores over je cadetten (privé). Na zes weken zonder gesprek met een cadet geeft de app een signaal. De verdeling van een eigenschap in je peloton verschijnt alleen als vijf of meer cadetten hun test delen, zonder namen.",
      "waarom": "Beoordelaars maken voorspelbare fouten: recente gebeurtenissen wegen te zwaar (recency), sommigen beoordelen structureel mild of streng, en wie weinig ziet, oordeelt op een indruk. Zichtbaar maken waar je waarnemingen vandaan komen en hoe je scoort, helpt die fouten zelf te zien. Regelmatige gesprekken houden de beoordeling verbonden met de ontwikkeling.",
      "effect": "Training en bewustwording van beoordelaarsfouten verbeteren de nauwkeurigheid van beoordelen (meta-analyse).",
      "grenzen": "De app toont wat er is; hij corrigeert geen scores. Een milde verdeling kan ook kloppen als je groep echt sterk is. Kaarten van medecadetten tellen niet mee.",
      "bronnen": ["landy1980", "woehr1994", "vleuten2012"]
    },
    {
      "id": "deelmap", "apps": ["cvs"], "titel": "Samenwerken in het team (deelmap)", "waar": "CVS: Peloton en team, Deelmap, 'Nieuw van je instructeurs'.",
      "hoofdstukken": [],
      "wat": "Instructeurs koppelen in één stap met een uitnodiging van de teamleider. Hun DTF-notities gaan meteen versleuteld naar de teamleider, die ziet wat er nieuw is en van wie.",
      "waarom": "Een beoordeling is betrouwbaarder als ze rust op veel waarnemingen van meerdere beoordelaars, verspreid over de tijd. Hoe minder stappen het delen kost, hoe meer waarnemingen er bij de teamleider aankomen.",
      "effect": "",
      "grenzen": "Alleen DTF-notities en (van senior-instructeurs) feedback worden gedeeld; stress en welzijn nooit. Een notitie is één waarneming van één persoon.",
      "bronnen": ["vleuten2012", "schuwirth2011"]
    },
    {
      "id": "coaching", "apps": ["boek","cvs"], "titel": "Coaching en gesprekken met teamleider en senior-instructeur", "waar": "Boekje: Bereid je gesprek voor, afspraken op Vandaag. CVS: gespreksverslagen (teamleider), meelezen en feedback (senior-instructeur).",
      "hoofdstukken": [],
      "wat": "Regelmatige gesprekken waarin de teamleider vragen stelt, de cadet zelf een doel en een afspraak kiest, en die afspraak in het volgende gesprek terugkomt. Daarnaast is er de senior-instructeur: die coacht en begeleidt alleen en beoordeelt niet.",
      "waarom": "Coaching in organisaties heeft positieve effecten op prestaties, welbevinden, omgaan met druk en vooral op doelgerichte zelfsturing. Leiderschap ontwikkelt zich over jaren via ervaring, feedback en zelfbeeld; gesprekken verbinden die.",
      "effect": "Coaching: van g = 0,43 (omgaan met druk) tot g = 0,74 (doelgerichte zelfsturing).",
      "grenzen": "De studies gaan vooral over professionele coaches, niet over een teamleider die ook beoordeelt. Wie beoordeeld wordt, deelt minder snel twijfels en fouten; programmatisch toetsen raadt daarom aan coachen en beslissen te scheiden. De senior-instructeur maakt dat deels mogelijk: bij hem kan de cadet vrijer praten, omdat hij niet beoordeelt. Bij de teamleider blijft de dubbele rol bestaan en zijn duidelijke afspraken nodig over wat wel en niet meetelt.",
      "bronnen": ["theeboom2014", "day2014", "vleuten2012", "watling2019"]
    },
    {
      "id": "zelfregulatie", "apps": ["boek"], "titel": "Zelfregulerend leren (de cyclus in het boekje)", "waar": "Boekje: Vandaag, leervraag, check-in, DTF en terugblik.",
      "hoofdstukken": ["Mijn groei & ontwikkeling", "Introductie & Drijfveren"],
      "wat": "Vooruitdenken (doel kiezen), uitvoeren en bijhouden (DTF, check-in) en terugkijken (reflectie). Het boekje is rond die cyclus gebouwd.",
      "waarom": "Wie leert zijn eigen leren te plannen, te volgen en te evalueren, presteert beter. De grootste effecten komen van metacognitieve strategieën: weten wat je doet en waarom.",
      "effect": "Trainingen in zelfregulerend leren in het hoger onderwijs: g = 0,38 op studieprestaties (49 studies).",
      "grenzen": "Een app is geen training; het effect hangt af van begeleiding en van hoe trouw de cyclus wordt doorlopen.",
      "bronnen": ["zimmerman2002", "theobald2021", "day2014"]
    },
    {
      "id": "dimensies", "apps": ["boek","cvs"], "titel": "Dimensies in plaats van typen", "waar": "Boekje: Persoonlijkheidstest (IPIP), uitslag per eigenschap. CVS: profiel van de cadet.",
      "hoofdstukken": ["Persoonlijkheidstest (IPIP)"],
      "wat": "De test geeft op elke eigenschap een plek op een glijdende schaal (een percentiel), geen hokje of type zoals 'introvert' of 'ENTJ'.",
      "waarom": "Bij onderzoek naar persoonlijkheid blijken mensen bijna altijd op een doorlopende schaal te verschillen, niet in losse groepen. Als je naar groepen zoekt in HEXACO-scores, vind je niet meer structuur dan in willekeurige gegevens met dezelfde verdeling. Een type gooit informatie weg: twee mensen net boven en net onder een grens krijgen een ander label, terwijl ze bijna gelijk scoren. Daarom toont de app scores, banden en een meetfout.",
      "effect": "",
      "grenzen": "Een band (laag, gemiddeld, hoog) is ook een grens op een schaal; ligt je score dicht bij een bandgrens, dan meldt de app dat. Typemodellen kunnen een gesprek op gang brengen, maar zijn geen meting.",
      "bronnen": ["haslam2012", "ashton2009types", "ashton2007"]
    },
    {
      "id": "hexbig5", "apps": ["boek","cvs"], "titel": "HEXACO en de Big Five", "waar": "Boekje: Persoonlijkheidstest (IPIP), facetprofiel na de lange test. CVS: profiel van de cadet.",
      "hoofdstukken": ["Persoonlijkheidstest (IPIP)"],
      "wat": "HEXACO beschrijft persoonlijkheid met zes eigenschappen, de Big Five met vijf. Elke HEXACO-eigenschap bestaat uit vier facetten; de lange test (240 stellingen) laat alle 24 facetten zien.",
      "waarom": "Taalonderzoek in onder meer het Nederlands, Frans, Duits, Italiaans, Pools en Koreaans vond telkens zes in plaats van vijf dimensies. Het verschil met de Big Five: Integriteit (oprechtheid, eerlijkheid, hebzuchtvermijding, bescheidenheid) is een eigen eigenschap, boosheid en ergernis horen bij lage Verdraagzaamheid in plaats van bij emotionele instabiliteit, en meeleven hoort bij Emotionaliteit. Dezelfde naam kan dus net iets anders betekenen. Facetten maken zichtbaar waar een score vandaan komt.",
      "effect": "",
      "grenzen": "Een facet rust op tien stellingen en is daardoor minder nauwkeurig dan de eigenschap zelf; lees het als richting. De Nederlandse vertaling van de IPIP-stellingen is niet apart onderzocht. De facetnamen in de app volgen de IPIP-HEXACO en kunnen iets afwijken van die in de HEXACO-PI-R.",
      "bronnen": ["ashton2004", "ashton2007", "lee2004", "devries2009", "ashton2007ipip"]
    },
    {
      "id": "circumplex", "apps": ["boek","cvs"], "titel": "Persoonsvector en stijlflexibiliteit (circumplex, alleen de assen)", "waar": "Boekje: Roos van Leary, onder de roos. CVS: roos per cadet, onder de roos.",
      "hoofdstukken": ["Roos van Leary"],
      "wat": "Alle plekken op de roos samen geven een pijl vanuit het midden: de persoonsvector. De richting zegt welke kant het gedrag meestal op gaat op de twee assen sturen-volgen en samen-tegen; de lengte hoe uitgesproken. Stijlflexibiliteit laat zien in hoeveel van de acht delen gedrag is gezien en hoe ver het uiteenligt. Zelf en anderen staan naast elkaar.",
      "waarom": "In een circumplex liggen gedragingen rond twee assen; elke gedraging of vraag krijgt een hoek en een lengte (de vectormethode). Onderzoek naar het leiderschapscircumplex laat zien dat leidinggevenden en medewerkers dezelfde cirkel gebruiken: de stijlen liggen bij beiden in dezelfde volgorde rond de assen. Het oordeel van een leidinggevende over zichzelf en dat van zijn medewerker hingen daar samen met correlaties van .26 tot .50: er is overeenkomst, maar ook veel ruimte voor verschil. Juist een verschil tussen de pijl van jezelf en die van anderen is dus een goed gespreksonderwerp. Geen enkele stijl is altijd effectief: wie kan schakelen, past zich aan de situatie aan.",
      "effect": "",
      "grenzen": "De app gebruikt alleen de twee assen, geen stijlnamen of kleuren van het communicatie- en leiderschapscircumplex (CLX) van Perco (besluit 23-11, tot er toestemming is). De pijl komt uit eigen waarnemingen op de roos, niet uit een gevalideerde vragenlijst; het is dus geen CLS-score. Pas vanaf vijf waarnemingen per bron. De grenzen voor breed en smal zijn een keuze van de app, geen norm.",
      "bronnen": ["leary1957", "wiggins2003", "redeker2014", "devries2017", "fabrigar1997", "locke2019"]
    }
  ],
  "voorstel": ["ashton2007", "barford2015", "defensie2019", "jackson2012", "kiesler1983", "leary1957", "lee2004", "lee2018", "roberts2006", "vazire2010", "wiggins1979"]
}/*JSON-END*/;

  /** APA-tekst zonder opmaaktekens (sterretjes = cursief in markdown). */
  function plain(apa) { return String(apa || '').replace(/\*/g, ''); }
  /** APA met cursief als HTML; tekst wordt eerst veilig gemaakt. */
  function html(apa) {
    var e = String(apa || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    return e.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  }
  function bron(id) { return DATA.bronnen[id] || null; }
  function onderdeel(id) { return DATA.onderdelen.filter(function (o) { return o.id === id; })[0] || null; }
  /** Onderdeel dat bij een hoofdstuk (titel) van het boekje hoort, of null. */
  function voorHoofdstuk(titel) { return DATA.onderdelen.filter(function (o) { return (o.hoofdstukken || []).indexOf(titel) >= 0; })[0] || null; }
  /** Korte verwijzing in de tekst: "Gollwitzer & Sheeran, 2006". */
  function kort(id) {
    var b = bron(id); if (!b) return id;
    var m = /^(.*?)\s\((\d{4})\)/.exec(b.apa); if (!m) return id;
    var namen = [], re = /(?:^|,\s|&\s)([^,&]+?),\s(?:[A-Z]\.(?:-[A-Z]\.)?\s?)+/g, x;
    while ((x = re.exec(m[1]))) namen.push(x[1].trim());
    if (!namen.length) namen = [m[1].replace(/\.$/, '')];
    return (namen.length > 2 ? namen[0] + ' e.a.' : namen.join(' & ')) + ', ' + m[2];
  }
  window.KMABronnen = { data: DATA, bron: bron, onderdeel: onderdeel, voorHoofdstuk: voorHoofdstuk, kort: kort, plain: plain, html: html };
})();
