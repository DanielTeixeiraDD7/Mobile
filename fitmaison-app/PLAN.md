# Plan « Objectif Foot » : justification et sources

Pour qui : un homme de 18 à 29 ans, 180 cm, 125 kg (IMC ≈ 38,6), assis au moins 8 h par jour, très essoufflé dans les escaliers, avec des genoux et un dos sensibles. Il s'entraîne seulement à la maison et au jardin, au poids du corps. Son objectif est de reprendre le football.
Code : `src/core/plan.ts` (logique pure, testée dans `tests/plan.test.ts`), séances dans `src/core/seance.ts` et `src/core/programmes.ts`, page `src/pages/plan.vue`, carte d'accueil `src/components/CartePlanDuJour.vue`.

> Ce plan ne remplace pas un avis médical. Avec un IMC ≥ 35 et un essoufflement marqué à l'effort léger, l'app conseille de consulter son médecin traitant avant de s'entraîner vraiment (voir § 1).

Toutes les sources ont été consultées le **2 novembre 2026**. Quand un chiffre vient d'un résumé ou d'une source secondaire et non du texte intégral, c'est précisé.

---

## 0. Ce qui vient des sources, ce qui est un choix de conception

| Élément | Origine |
|---|---|
| 150 à 300 min/sem d'activité modérée, renforcement musculaire ≥ 2 j/sem, limiter la sédentarité, « un peu vaut mieux que rien », commencer petit et augmenter progressivement | OMS 2020 [S1], NHS [S4] |
| 150 à 250 min/sem → perte de poids modeste ; > 250 min/sem → perte cliniquement significative ; le renforcement n'accélère pas la perte mais préserve la masse maigre | ACSM 2009 [S2] |
| Perte sûre et durable de **0,5 à 1 kg par semaine** | NHS [S5] |
| Déficit d'environ 600 kcal/jour pour atteindre ce rythme | NICE CG189, repris par des sources secondaires : la page NICE a renvoyé une erreur 403. Notre déficit de 650 kcal (formule historique de l'app) reste cohérent avec cet ordre de grandeur |
| Test de la parole (« tu peux parler mais pas chanter » = modéré), échelle 0–10 (5–6 = modéré, 7–8 = soutenu) | CDC [S6], NHS [S4] |
| Marche / trottinement : 5 min de marche, puis 1 min de course et 1 min 30 de marche, 3 fois par semaine ; on peut répéter une semaine | NHS Couch to 5K [S3] |
| Catégories de pas (< 5 000 = sédentaire), paliers d'environ 1 000 pas (≈ 10 min de marche), gains typiques de 2 000 à 2 500 pas/j avec un podomètre, 100 pas/min ≈ intensité modérée | Tudor-Locke 2011 [S10] |
| Le bénéfice des pas se stabilise vers 8 000–10 000 pas/j avant 60 ans | Paluch 2022 [S11], d'après le résumé |
| Rompre la position assise (2 min de marche toutes les 20 min) réduit la glycémie et l'insuline après le repas chez des adultes en surpoids | Dunstan 2012 [S12] (petite étude, effet aigu) |
| Se lever et marcher au moins toutes les 2 h | PNNS / mangerbouger.fr, cité par la presse médicale [S13] (page officielle non lue en direct) |
| FIFA 11+ : échauffement en 3 parties (course, puis renforcement / pliométrie / équilibre en 3 niveaux, puis course) ; efficace **à partir de 2 fois par semaine** ; environ −39 % de blessures dans une méta-analyse | Bizzini & Dvorak 2015 [S9], Thorborg 2017 [S14] (d'après le résumé), manuel FIFA via des sources secondaires |
| Questionnaire santé (7 questions générales) ; le formulaire officiel ne doit pas être modifié | PAR-Q+ 2025 [S7] : l'app **paraphrase** les thèmes et renvoie vers le formulaire officiel |
| Essoufflement anormal au repos ou à l'effort léger = symptôme qui justifie un avis médical avant de commencer | ACSM 2015, Riebe et al. [S15] (d'après le résumé et des supports de formation) |
| Mifflin-St Jeor : l'équation qui estime le plus souvent le métabolisme de repos à ±10 % près, chez les personnes obèses comme non obèses | Frankenfield 2005 [S16] (d'après le résumé) |
| Le poids réagit lentement à un changement d'apport (demi-vie d'environ 1 an) : la perte ralentit avec le temps | Hall 2011, Lancet [S17] |
| Protéines : plus de 1,3 g/kg/j aide à préserver le muscle pendant une perte de poids ; moins de 1,0 g/kg/j augmente le risque d'en perdre | Kokura 2024, méta-analyse [S18] |
| Chaque kilo perdu réduit d'environ 4 fois la charge sur le genou à la marche | Messier 2005 [S19] (adultes âgés avec arthrose ; association biomécanique) |
| Modèle de surveillance de la douleur : douleur pendant l'effort tolérée jusqu'à 5/10 si elle a disparu le lendemain matin | Silbernagel 2007 [S20] (tendinopathie d'Achille). **Le plan est plus prudent : 3/10.** |
| Test de marche de 6 min : parcours plat, demi-tours, aucun encouragement ; norme de 2002 remplacée en 2014 | ATS 2002 / ERS-ATS 2014 [S21] |
| Assis-debout en 30 s : 33,0 ± 5,4 répétitions chez des adultes sains de 19 à 35 ans | Lein 2022 [S22] |
| Parcours de soins de l'obésité (France) : changer les habitudes de vie en premier, avec des objectifs d'activité adaptés et progressifs | HAS [S8] |
| **Seuils des bilans** (8 séances, +5 %, 15 / 20 / 25 assis-debout, gainage 30 / 45 / 60 s, escaliers ≤ 7 / 3 / 2) | **Choix de conception prudents**, pas des normes médicales. Ils s'appuient sur les références ci-dessus (Lein : 33 répétitions en moyenne chez des jeunes adultes sains, donc 25 reste en dessous de la moyenne). L'app l'indique à l'utilisateur. |
| Durées des phases (4 / 6 / 7 / 7 semaines), +500 pas par semaine, cible de pauses bureau 4 → 6 → 8 | **Choix de conception** guidés par « commencer petit, progresser » [S1] et les paliers de 1 000 pas [S10] |

---

## 1. Sécurité avant de commencer

- **8 questions oui/non**. Les 7 premières reprennent les thèmes des questions générales du PAR-Q+ : cœur ou tension, douleur thoracique, malaise ou vertige, autre maladie chronique, médicaments, problème d'os ou d'articulation, activité seulement sous surveillance médicale. Elles sont paraphrasées en tutoiement, avec un lien vers le formulaire officiel [S7]. La 8ᵉ porte sur l'essoufflement marqué pour un petit effort (ACSM [S15]).
- **Avis médical conseillé** dès qu'une réponse est « oui » ou que l'IMC est ≥ 35. Pour cet utilisateur, c'est le cas (IMC ≈ 38,6 et essoufflement dans les escaliers). Le ton reste encourageant : c'est présenté comme une précaution normale, et le médecin pourra adapter le plan. En attendant, la consigne est de rester à une intensité « facile ». Une case « J'ai eu le feu vert de mon médecin » fait disparaître le bandeau. Ce feu vert est aussi **un critère obligatoire** de l'étape finale « prêt pour un entraînement de foot ».
- **Signaux d'arrêt** (`SIGNAUX_ARRET`), affichés sur la page du plan, avec un rappel sous le bouton « Démarrer » :
  - douleur ou serrement dans la poitrine ;
  - malaise, vertige ;
  - essoufflement anormal : impossible de dire quelques mots, ou qui ne se calme pas au repos ;
  - palpitations ;
  - douleur articulaire au-dessus de 3/10.

  Si un signal ne passe pas au repos : appeler le 15 ou le 112.
- **Règle de la douleur** (genoux et dos, saisie de 0 à 10 chaque jour sur la page du plan) :
  - jusqu'à 3/10, avec une douleur qui redescend en 24 h : rien ne change ;
  - plus de 3/10 hier ou aujourd'hui : la séance à impact du jour (marche/trot, intervalles, cardio, technique balle) devient « Souffle », et les autres séances baissent d'un niveau ;
  - plus de 5/10 : mobilité seulement ;
  - douleur qui ne redescend pas d'un jour à l'autre : la séance du jour baisse d'un niveau ;
  - une douleur au-dessus de 3/10 dans les 14 derniers jours bloque le passage de phase.

## 2. Structure : 4 phases, au moins 24 semaines

Une semaine type va du lundi au dimanche. Le dimanche est un jour de repos, ou de bilan. N1, N2 et N3 désignent les niveaux.

| Phase | Min. | Contenu (lun → sam) | Pauses bureau / jour |
|---|---|---|---|
| 🌅 **Réveil** | 4 sem. | Full body N1, Souffle N1, Technique balle N1, Mobilité, Renfo N1, Marche active N1 (semaine 1 plus légère) | 4 (≈ toutes les 2 h) |
| 🧱 **Fondations** | 6 sem. | Full body N1→N2, Intervalles de marche N1→N2, Ballon N1→N2, Mobilité, Renfo N1→N2, Marche N2 (35 min) | 6 |
| 🫀 **Moteur** | 7 sem. | Renfo / Full N2, Intervalles N2→N3 (avec montées de marche), Ballon N2, Mobilité, Prévention type 11+ N1→N2, Marche N3 (45 min) | 8 (≈ 1 par heure) |
| ⚽ **Retour terrain** | 7 sem. | Renfo N2→N3, **Marche / trottinement** N1→N2→N3 (2 fois par semaine, jamais 2 jours de suite), Ballon N3, Mobilité, Prévention N2→N3 | 8 |

- **Le ballon dès la semaine 1**, à faible intensité et sans course : toucher de balle, conduite, passes contre un mur, contrôle de la semelle, équilibre sur une jambe. Ensuite viennent le slalom, la frappe lente, puis les pas chassés.
- **Aucun saut** dans tout le plan. La bibliothèque ne contient d'ailleurs aucun exercice sauté (burpee sans saut, step jack…). Le drapeau `sauts` ne passe à `true` qu'une fois l'étape finale validée, et l'app précise alors : « les petits sauts peuvent maintenant être introduits progressivement ».
- **La course n'arrive qu'en phase 4**, sous forme d'intervalles marche / trottinement inspirés de Couch to 5K [S3] :
  - N1 : 6 × (30 s de trot + 2 min de marche). C'est plus prudent que la semaine 1 de Couch to 5K, compte tenu du poids ;
  - N2 : **identique à la semaine 1 de Couch to 5K** (7 × (1 min de trot + 1 min 30 de marche) + 1 min) ;
  - N3 : semaine 2 de Couch to 5K (5 × (1 min 30 + 2 min) + 1 min 30).

  L'échauffement et le retour au calme durent 5 min de marche, comme dans Couch to 5K.
- **Le renforcement 2 fois par semaine** pendant tout le plan (OMS [S1]). Les niveaux de Renfo et Full body suivent le niveau du profil, qui s'ajuste déjà selon le ressenti des séances.
- **Prévention inspirée du FIFA 11+** : planche, pont (puis pont avec marche), équilibre sur une jambe, squat puis fente arrière, déplacements latéraux, mollets. Il n'y a pas de partie pliométrique, ni l'ischio « nordique » qui demande un partenaire. Elle est faite **1 fois par semaine** (le vendredi) à partir de la phase Moteur, pour apprendre les gestes et construire l'habitude. Les études montrent un effet **à partir de 2 fois par semaine, en échauffement avant le football** [S9]. C'est pourquoi l'étape finale conseille de faire le 11+ complet avant chaque entraînement. **Limite assumée** : avant la reprise du foot, le plan ne reproduit pas la fréquence du 11+.

## 3. Progression conditionnée par les bilans (pas seulement par le temps)

- **Bilan de départ** : proposé tant qu'aucun bilan n'a été fait. Il sert de référence pour mesurer les progrès.
- **Bilan de passage** : le dimanche de la dernière semaine de la phase. **S'il n'est pas réussi, la phase est prolongée** (on répète sa dernière semaine type) et un nouveau bilan est proposé **toutes les 2 semaines**.
- **Bilan d'étape** au milieu des phases de 6 semaines ou plus, pour information.
- Un bilan réussi à partir de la dernière semaine de la phase la valide. **La phase suivante commence le lundi suivant.** Un bilan fait trop tôt ne valide rien.
- **Contenu du bilan** : il est guidé dans l'app, avec un minuteur.
  - Marche de 6 min : un aller-retour de 10 à 30 m, compter les allers (adapté de l'ATS [S21]).
  - Test de la parole pendant cette marche.
  - Assis-debout en 30 s.
  - Gainage (planche sur les genoux ou chaise contre le mur).
  - Essoufflement après un étage d'escalier (0–10).
  - Poids, tour de taille, et douleur pendant les tests.

  Chaque mesure est facultative, mais un critère qui n'a pas été mesuré n'est pas validé.

| Pour quitter… | Critères (tous requis) |
|---|---|
| Réveil | ≥ 8 jours de séance dans la phase ; 6 min de marche sans s'arrêter ; parole ≥ phrases courtes ; escaliers ≤ 7/10 ou en baisse ; douleur OK |
| Fondations | ≥ 12 jours de séance ; parole = phrases complètes ; marche de 6 min ≥ +5 % ; assis-debout ≥ 15 (ou +3) ; gainage ≥ 30 s ; douleur OK |
| Moteur (avant le trot) | ≥ 14 jours de séance ; ≥ 2 séances longues (marche 45 min ou intervalles N3) ; escaliers ≤ 3/10 ; assis-debout ≥ 20 ; gainage ≥ 45 s ; marche de 6 min ≥ +10 % ; douleur OK |
| Retour terrain → **« Prêt pour un entraînement de foot »** | ≥ 4 séances de trot N3 ; ≥ 4 séances de ballon N3 ; ≥ 4 séances de prévention ; escaliers ≤ 2/10 ; assis-debout ≥ 25 ; gainage 60 s ; douleur OK ; **feu vert médical** |

La dernière étape est présentée honnêtement : c'est « prêt pour **un entraînement** », pas pour un match. L'app conseille de prévenir le coach, de faire le 11+ complet, de jouer à intensité réduite et de s'arrêter avant d'être épuisé.

## 4. Pas, pauses bureau, jours manqués

- **Pas** : on part des pas mesurés. C'est la moyenne des 14 derniers jours si au moins 3 jours ont été notés, sinon 3 000 pas, et jamais moins de 2 500. La cible augmente de **+500 par semaine** (≈ +1 000 toutes les 2 semaines, les paliers de Tudor-Locke) et **plafonne à 10 000** [S10, S11]. En semaine de reprise, la cible baisse de 1 000.
- **Pauses bureau** : une séance « Pause active bureau » de 4 min, sans échauffement, à faire en tenue de travail :
  - assis-debout ;
  - rotations du buste ;
  - étirement de la nuque ;
  - ouverture de la poitrine ;
  - étirement des fléchisseurs de hanche ;
  - extension du dos ;
  - marche.

  Le compteur `Jour.pauses` augmente quand la séance est terminée, ou quand on note une pause à la main. Cible par jour de bureau (lundi → vendredi) : 4, puis 6, puis 8 (`OBJECTIF_PAUSES = 8`, soit environ 1 pause par heure sur 8 h). On part du repère « toutes les 2 h » du PNNS [S13] pour aller vers des pauses plus fréquentes, appuyées par Dunstan [S12].
- **Rappel** : en option, réglable (30, 45, 60 ou 90 min, plage horaire, du lundi au vendredi). Il fonctionne **uniquement quand l'app est ouverte** : un toast « Go » lance la pause. La notification système n'est utilisée **que si l'utilisateur l'active explicitement**, et la permission n'est demandée qu'à ce moment-là. Aucun serveur n'est utilisé et rien n'est envoyé.
- **Jours manqués** : le plan ne casse jamais. Les jours d'une semaine se calculent toujours, et le manque de régularité se voit simplement au bilan. Après **7 jours ou plus sans séance**, l'app propose « Reprendre en douceur ». Le plan recule alors d'autant de semaines qu'il en manque (`reprises`) et la semaine de reprise est allégée : niveau −1, cible de pas −1 000.
- **Phase choisie à la main** : utile si le plan est trop facile ou trop dur. Les phases précédentes sont marquées comme passées, mais les bilans restent nécessaires pour la suite.

## 5. Nutrition

On garde `calculs.nutrition` tel quel. Les formules ne changent pas et les tests existants restent valides.

- Métabolisme de base (Mifflin-St Jeor [S16]) : 10 × 125 + 6,25 × 180 − 5 × 25 + 5 = **2 255 kcal** (à 25 ans).
- Dépense totale avec un coefficient de 1,2 (sédentaire) : 2 706 kcal.
- **Cible : 2 060 kcal** (déficit de 650 kcal, avec un plancher de 1 600 kcal pour un homme).
- Perte estimée : environ **0,59 kg par semaine**, dans la fourchette NHS de 0,5 à 1 kg [S5].

L'app précise que la perte va souvent plus vite au début (eau), puis ralentit, ce qui est normal (Hall [S17]).

Protéines : 1,6 g × poids objectif (formule existante). Pour un objectif de 90 kg, cela donne 144 g, soit 1,15 g par kg de poids actuel et 1,6 g par kg de poids objectif. C'est cohérent avec les plus de 1,3 g/kg [S18] si l'on raisonne sur un poids de référence plutôt que sur le poids total. **Point d'attention** : la littérature ne tranche pas clairement le poids de référence à utiliser en cas d'obésité. Nous n'avons pas modifié la formule.

Répartition indicative des repas (**choix de conception**, en arrondissant) :

| Repas | Part | Kcal |
|---|---|---|
| Petit-déjeuner | 25 % | ≈ 510 |
| Déjeuner | 35 % | ≈ 710 |
| Collation, seulement en cas de faim | 10 % | ≈ 200 |
| Dîner | 30 % | ≈ 610 |

L'assiette type : ½ légumes, ¼ protéines, ¼ féculents complets. C'est le conseil déjà présent dans l'app.

## 6. Données

Les nouveaux champs sont tous **facultatifs**. La clé reste `fitmaison_v1`, et les données v1 et v2 sont relues sans perte.

- `Jour.pauses?`, `Jour.douleur?`.
- `Etat.plan?: { debut, bilans[], phaseForcee?, reprises?, pasDepart?, sante?, rappel? }`.

`normaliser` ignore un plan invalide.

Une séance « bureau » ne compte pas comme une séance : elle n'entre ni dans la série, ni dans les séances de la semaine, ni dans les badges.

---

## Sources (consultées le 2 novembre 2026)

- **[S1]** Bull FC et al. *World Health Organization 2020 guidelines on physical activity and sedentary behaviour.* Br J Sports Med 2020. https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/ ; fiche OMS : https://www.who.int/news-room/fact-sheets/detail/physical-activity
- **[S2]** Donnelly JE et al. *ACSM Position Stand. Appropriate physical activity intervention strategies for weight loss and prevention of weight regain for adults.* Med Sci Sports Exerc 2009;41(2):459-471. https://pubmed.ncbi.nlm.nih.gov/19127177/
- **[S3]** NHS. *Couch to 5K running plan.* https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/
- **[S4]** NHS. *Physical activity guidelines for adults aged 19 to 64.* https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/
- **[S5]** NHS. *Obesity – Treatment* (« aim to lose 1 to 2lbs, or 0.5 to 1kg, a week »). https://www.nhs.uk/conditions/obesity/treatment/
- **[S6]** CDC. *Measuring physical activity intensity* (test de la parole, échelle 0–10). https://www.cdc.gov/physical-activity-basics/measuring/index.html
- **[S7]** PAR-Q+ Collaboration. *PAR-Q+ 2025.* https://eparmedx.com/ (formulaire : https://eparmedx.com/wp-content/uploads/2025/01/PARQPlus2025Fillable.pdf)
- **[S8]** HAS. *Guide du parcours de soins : surpoids et obésité de l'adulte* (mis à jour le 27/11/2024). https://www.has-sante.fr/jcms/p_3408871/ ; recommandations sur l'obésité sévère (2022) : https://has-sante.fr/jcms/p_3346198/fr/obesite-de-l-adulte-ameliorer-la-prise-en-charge-medicale-des-cas-les-plus-severes
- **[S9]** Bizzini M, Dvorak J. *FIFA 11+: an effective programme to prevent football injuries in various player groups worldwide — a narrative review.* Br J Sports Med 2015;49:577-579. https://pmc.ncbi.nlm.nih.gov/articles/PMC4413741/
- **[S10]** Tudor-Locke C et al. *How many steps/day are enough? For adults.* Int J Behav Nutr Phys Act 2011;8:79. https://pmc.ncbi.nlm.nih.gov/articles/PMC3197470/
- **[S11]** Paluch AE et al. *Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts.* Lancet Public Health 2022;7(3):e219-e228. https://ora.ox.ac.uk/objects/uuid:c77d223f-33ce-4d5c-9124-a00e5a43fcc1 (résumé)
- **[S12]** Dunstan DW et al. *Breaking up prolonged sitting reduces postprandial glucose and insulin responses.* Diabetes Care 2012;35(5):976-983. https://pubmed.ncbi.nlm.nih.gov/22374636/
- **[S13]** PNNS / mangerbouger.fr, cité dans *Le Quotidien du Médecin* (« marcher quelques minutes et vous étirer au bout de deux heures d'affilée en position assise ») : https://diabetologie-endocrinologie.lequotidiendumedecin.fr/fmc-recos/activite-physique-sedentarite-savoir-les-evaluer ; Santé publique France : https://sante.fr/activite-physique-pour-les-adultes
- **[S14]** Thorborg K et al. *Effect of specific exercise-based football injury prevention programmes on the overall injury rate in football: a systematic review and meta-analysis of the FIFA 11 and 11+ programmes.* Br J Sports Med 2017;51:562-571. https://bjsm.bmj.com/content/51/7/562 (article inaccessible, erreur 403 ; chiffres tirés du résumé)
- **[S15]** Riebe D et al. *Updating ACSM's recommendations for exercise preparticipation health screening.* Med Sci Sports Exerc 2015;47(11):2473-2479. https://digitalcommons.uri.edu/kinesiology_facpubs/180
- **[S16]** Frankenfield D et al. *Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review.* J Am Diet Assoc 2005;105:775-789. https://pure.psu.edu/en/publications/comparison-of-predictive-equations-for-resting-metabolic-rate-in-/
- **[S17]** Hall KD et al. *Quantification of the effect of energy imbalance on bodyweight.* Lancet 2011;378:826-837. https://pubmed.ncbi.nlm.nih.gov/21872751/
- **[S18]** Kokura Y et al. *Enhanced protein intake on maintaining muscle mass, strength, and physical function in adults with overweight/obesity: a systematic review and meta-analysis.* Clin Nutr ESPEN 2024;63:417-426. https://pubmed.ncbi.nlm.nih.gov/39002131/
- **[S19]** Messier SP et al. *Weight loss reduces knee-joint loads in overweight and obese older adults with knee osteoarthritis.* Arthritis Rheum 2005. https://pubmed.ncbi.nlm.nih.gov/15986358/
- **[S20]** Silbernagel KG et al. *Continued sports activity, using a pain-monitoring model, during rehabilitation in patients with Achilles tendinopathy.* Am J Sports Med 2007;35(6):897-906. https://search.pedro.org.au/search-results/record-detail/18389 (lu via PEDro et des résumés)
- **[S21]** ATS Statement: *Guidelines for the six-minute walk test.* Am J Respir Crit Care Med 2002;166:111-117 ; remplacé par l'ERS/ATS Technical Standard 2014 : https://publications.ersnet.org/lookup/pmid/25359355
- **[S22]** Lein DH et al. *Normative reference values and validity for the 30-second chair-stand test in healthy young adults.* Int J Sports Phys Ther 2022;17(5):907-914. https://pubmed.ncbi.nlm.nih.gov/35949374/
