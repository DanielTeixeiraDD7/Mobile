import type { Source } from '@/lib/import';

/** Guide d'achat Peugeot e-2008 d'occasion — sources relevées le 18/10/2026. */

const S = {
  evdb22: { nom: 'EV-Database — e-2008 2022-2023 (50 kWh)', url: 'https://ev-database.org/car/1584/Peugeot-e-2008' },
  evdb54: { nom: 'EV-Database — e-2008 54 kWh', url: 'https://ev-database.org/car/1947/Peugeot-e-2008-54-kWh' },
  electrive: { nom: 'Electrive — restylage 2023 (115 kW, 54 kWh)', url: 'https://electrive.com/2023/05/04/the-peugeot-e-2008-gets-more-power-and-a-facelift' },
  gamme: { nom: 'Actu-Automobile — gamme 2008 (juillet 2024)', url: 'https://www.actu-automobile.com/2025/01/05/la-gamme-et-les-prix-du-peugeot-2008-juillet-2024' },
  fastned: { nom: 'InsideEVs — test de recharge rapide (Fastned)', url: 'https://insideevs.com/news/463106/peugeot-e208-dc-charging-test/' },
  garantie: { nom: 'Stellantis via Automotive World — garantie batterie 8 ans / 160 000 km', url: 'https://www.automotiveworld.com/news/peugeot-care-warranty-8-year-160000-km-coverage-to-support-all-peugeot-customers-towards-electric-mobility/' },
  rappels: { nom: 'RappelConso (rappels officiels, France)', url: 'https://rappel.conso.gouv.fr' },
  safetygate: { nom: 'Safety Gate (rappels UE)', url: 'https://ec.europa.eu/safety-gate-alerts/' },
  cable: { nom: 'L’argus — câbles de recharge (e-208, même plateforme)', url: 'https://www.largus.fr/actualite-automobile/peugeot-e-208-quel-chargeur-quel-cable-et-quelle-borne-choisir-10456392.html' },
  aviloo: { nom: 'Aviloo — véhicules pris en charge', url: 'https://aviloo.com/en/supported-vehicles' },
  adac12v: { nom: 'ADAC Pannenstatistik 2025 (via Motor1)', url: 'https://de.motor1.com/news/756195/adac-pannenstatistik-2025-eautos-zuverlässig/' },
} satisfies Record<string, Source>;

export interface Version { nom: string; periode: string; batterie: string; puissance: string; wltp: string; reperer: string; source: Source }

export const VERSIONS: Version[] = [
  { nom: '1re génération', periode: '2020 – 2021', batterie: '50 kWh (46 utiles)', puissance: '136 ch · 100 kW', wltp: '310–320 km', reperer: 'Finitions Active, Allure, GT Line, GT', source: S.evdb22 },
  { nom: 'Mise à jour 2022', periode: '2022 – juil. 2023', batterie: '50 kWh (46 utiles)', puissance: '136 ch · 100 kW', wltp: '345 km', reperer: 'Pneus A+, rapport de pont revu, nouvelle pompe à chaleur', source: S.evdb22 },
  { nom: 'Restylage 136 ch', periode: 'mi-2023 – avr. 2025', batterie: '50 kWh (46 utiles)', puissance: '136 ch · 100 kW', wltp: '340–345 km', reperer: 'Nouvelle face avant ; vendue à côté de la 156 ch', source: S.gamme },
  { nom: 'Restylage 156 ch', periode: 'depuis mi-2023', batterie: '54 kWh (≈ 48–51 utiles)', puissance: '156 ch · 115 kW', wltp: '406 km', reperer: 'La plus recherchée : +60 km d’autonomie', source: S.electrive },
];

export const POINTS_CLES: { icon: string; titre: string; texte: string; source?: Source }[] = [
  { icon: 'pi pi-id-card', titre: '50 ou 54 kWh ? Regarde la puissance', texte: 'Sur une 2023-2024, les deux batteries existent. Sur la carte grise : 100 kW = 50 kWh, 115 kW = 54 kWh.', source: S.electrive },
  { icon: 'pi pi-shield', titre: 'Garantie batterie : 8 ans / 160 000 km', texte: 'Jusqu’à 70 % de capacité, à partir de la 1re immatriculation, et elle suit la voiture. Calcule ce qu’il reste.', source: S.garantie },
  { icon: 'pi pi-bolt', titre: 'Recharge : 7,4 kW de série, 11 kW en option', texte: 'Le 11 kW ne sert qu’en triphasé (rare en maison au Portugal). Rapide : ~100 kW en pointe, mais ~53 kW en moyenne de 20 à 80 % (50 kWh).', source: S.fastned },
  { icon: 'pi pi-sun', titre: 'Pompe à chaleur : à vérifier', texte: 'De série ou en option selon le pays, la finition et l’année. Ne te fie pas à l’annonce : vérifie avec le VIN chez un concessionnaire.', source: S.evdb54 },
  { icon: 'pi pi-snowflake', titre: 'Pas de préchauffage de batterie', texte: 'Recharge rapide plus lente et autonomie en baisse par temps froid (moins gênant au Portugal).', source: S.evdb54 },
  { icon: 'pi pi-power-off', titre: 'Batterie 12 V', texte: 'Première cause de panne des électriques selon l’ADAC (pas un défaut propre à l’e-2008). Demande son âge.', source: S.adac12v },
];

export interface Rappel { ref: string; production: string; probleme: string; url: string }

/** Rappels qui concernent la version électrique (vérifier par le VIN). */
export const RAPPELS: Rappel[] = [
  { ref: 'A12/00171/22', production: 'janv. – juin 2020', probleme: 'Court-circuit possible de la batterie : risque d’incendie', url: 'https://rappel.conso.gouv.fr/fiche-rappel/48474/rapex' },
  { ref: 'A12/00570/22', production: 'juil. 2019 – sept. 2020', probleme: 'Coupure haute tension trop sensible : perte de puissance en roulant', url: 'https://rappel.conso.gouv.fr/fiche-rappel/48420/rapex' },
  { ref: 'A12/01307/22', production: 'mars – avr. 2022', probleme: 'Faisceau haute tension défectueux : risque d’incendie', url: 'https://rappel.conso.gouv.fr/fiche-rappel/48358/rapex' },
  { ref: 'SR/01450/25 (MV4)', production: 'mai 2022 – févr. 2023', probleme: 'Logiciel de gestion de batterie : la voiture peut ne pas démarrer ou couper', url: 'https://rappel.conso.gouv.fr/fiche-rappel/47824/rapex' },
  { ref: 'KBA 012795 (MF9)', production: '2019 – 2022', probleme: 'Compresseur de clim pouvant couper la traction : mise à jour logicielle', url: 'https://www.auto-motor-und-sport.de/verkehr/stellantis-rueckruf-ueber-400000-elektrofahrzeuge-betroffen/' },
];

export const CHECKLIST_E2008: { id: string; titre: string; detail: string; source?: Source }[] = [
  { id: 'e-soh', titre: 'Certificat d’état de batterie (SoH)', detail: 'Diagnostic concessionnaire Peugeot / Spoticar daté de moins de quelques mois. Ou test indépendant (vérifie que l’e-2008 est pris en charge par Aviloo).', source: S.aviloo },
  { id: 'e-rappels', titre: 'Rappels soldés (impression du VIN)', detail: 'Demande à un concessionnaire la liste des campagnes ouvertes (« campanhas de recolha pendentes »).', source: S.rappels },
  { id: 'e-kw', titre: 'Batterie 50 ou 54 kWh', detail: 'Puissance sur la carte grise : 100 kW ou 115 kW.' },
  { id: 'e-cable', titre: 'Câble Type 2 (Mode 3) présent', detail: 'Il était parfois en option (249 € pour un câble 32 A selon L’argus).', source: S.cable },
  { id: 'e-recharge', titre: 'Tester une recharge AC et une rapide', detail: 'Regarde la puissance affichée et l’état de la prise.' },
  { id: 'e-pac', titre: 'Pompe à chaleur et chargeur 11 kW', detail: 'Confirmés par l’équipement d’origine (VIN), pas par l’annonce.' },
  { id: 'e-garantie', titre: 'Garantie batterie restante', detail: '8 ans / 160 000 km depuis la 1re immatriculation.', source: S.garantie },
  { id: 'e-entretien', titre: 'Carnet d’entretien et pneus', detail: 'Entretiens réseau, usure des pneus (lourd et puissant), jantes frottées.' },
];

export const SOURCES_E2008 = S;

/** Repères de prix demandés (pas des prix de vente), relevés le 18/10/2026. */
export const REPERES_PRIX = {
  date: '18/10/2026',
  lignes: [
    { pays: 'PT' as const, avant: '≈ 19 000 – 21 000 € (50–75 000 km)', apres: '2024 ≈ 25 600 € · 2025 ≈ 28 700 €', echantillon: '180 annonces Standvirtual' },
    { pays: 'DE' as const, avant: '≈ 17 900 – 21 000 € (29–49 000 km)', apres: '2023 ≈ 25 500 € · 2025 ≈ 29 400 €', echantillon: '281 annonces AutoScout24' },
    { pays: 'FR' as const, avant: '≈ 15 500 – 23 000 €', apres: '2025 ≈ 24 000 – 30 000 €', echantillon: '46 annonces AutoScout24 (peu fiable)' },
  ],
};
