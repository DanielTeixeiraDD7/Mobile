import type { Pays } from '@/lib/types';
import { SOURCES, type Source } from '@/lib/import';

/** Étape ou vérification, avec sa source quand elle existe. */
export interface Point { id: string; titre: string; detail: string; pays?: Pays[]; source?: Source }

/** Démarches pour immatriculer au Portugal une voiture achetée dans l'UE (IMT / AT, relevé le 18/10/2026). */
export const ETAPES_IMPORT: Point[] = [
  { id: 'imp-coc', titre: 'Récupérer les papiers chez le vendeur', detail: 'Certificat d’immatriculation étranger (original), certificat de conformité (CoC), facture ou contrat de vente, et la lettre de voiture CMR si un transporteur la ramène.', source: SOURCES.imt },
  { id: 'imp-homolog', titre: 'Demander le numéro d’homologation à l’IMT', detail: 'En ligne, avec le CoC. Pas d’« aprovação de modelo » séparée pour une voiture homologuée UE.', source: SOURCES.imt },
  { id: 'imp-inspecao', titre: 'Inspection catégorie B (Modelo 112)', detail: 'Dans un centre d’inspection agréé pour la catégorie B : 76,03 € + IVA (tarif 2026).', source: SOURCES.inspecao },
  { id: 'imp-dav', titre: 'Déposer la DAV sur le Portal das Finanças', detail: 'Déclaration douanière du véhicule, obligatoire même pour un électrique (ISV à 0 €), dans les 20 jours ouvrés après l’entrée au Portugal. Elle attribue la matrícula portugaise.', source: SOURCES.isv },
  { id: 'imp-depot', titre: 'Remettre le certificat étranger à l’IMT', detail: 'L’original, dans les 10 jours qui suivent la DAV.', source: SOURCES.etapes },
  { id: 'imp-imt', titre: 'Matrícula à l’IMT (45 €)', detail: '165 € sans CoC. Avec la DAV, tu peux rouler 60 jours en attendant le certificat.', source: SOURCES.imt },
  { id: 'imp-irn', titre: 'Registo de propriedade à l’IRN', detail: '55 € (46,75 € en ligne) dans les 60 jours suivant la matrícula ; le double en cas de retard.', source: SOURCES.irn },
  { id: 'imp-assurance', titre: 'Assurance portugaise + plaques', detail: 'Assurer la voiture dès la matrícula et faire fabriquer les plaques (environ 15–20 €).' },
];

/** Ramener la voiture par la route. */
export const RAPATRIER: { pays: Exclude<Pays, 'PT'>; titre: string; points: string[]; source: Source }[] = [
  {
    pays: 'DE', titre: 'Plaques export (Ausfuhrkennzeichen)',
    points: [
      'Les plaques provisoires « Kurzzeitkennzeichen » ne valent qu’en Allemagne : pour sortir du pays, il faut des plaques export.',
      'Il faut un contrôle technique (HU/TÜV) valable, une assurance export, et une adresse de réception en Allemagne si tu n’y habites pas.',
      'Validité 15 jours à 1 an ; frais de bureau à partir d’environ 32 €, plaques et assurance en plus.',
    ],
    source: { nom: 'Service Berlin — Ausfuhrkennzeichen', url: 'https://service.berlin.de/dienstleistung/121476/' },
  },
  {
    pays: 'FR', titre: 'Papiers à exiger du vendeur',
    points: [
      'Carte grise barrée et signée, certificat de cession (cerfa 15776) et code de cession.',
      'Certificat de situation administrative (non-gage) de moins de 15 jours, et contrôle technique de moins de 6 mois si la voiture a plus de 4 ans.',
      'Rouler avec la plaque du vendeur après la vente est une zone grise : vérifie avec ton assureur (assurance temporaire).',
    ],
    source: { nom: 'Douane — Achat d’un véhicule en France pour un autre pays de l’UE', url: 'https://douane.gouv.fr/articles/a10762-expedition-vers-un-pays-de-l-ue-d-un-vehicule-a-moteur-achete-en-france' },
  },
  {
    pays: 'BE', titre: 'Plaque d’export « X »',
    points: [
      'Le vendeur garde ses plaques : il faut une plaque d’exportation (plaque X), valable 30 jours.',
      'Assurance temporaire obligatoire pour tout le trajet.',
      'Le vendeur doit te remettre le Car-Pass (obligatoire).',
    ],
    source: { nom: 'SPF Mobilité — Exporter un véhicule (plaque X)', url: 'https://mobilit.belgium.be/fr/route/immatriculer/exporter-un-vehicule-plaque-x' },
  },
];

/** Arnaques courantes et parades. */
export const ARNAQUES: { titre: string; texte: string }[] = [
  { titre: 'Prix bien en dessous du marché', texte: 'Compare aux repères de prix : un écart énorme cache souvent une arnaque ou un problème.' },
  { titre: 'Vendeur « à l’étranger » ou « militaire en mission »', texte: 'Il propose de livrer la voiture après un virement ou un acompte : ne paie jamais une voiture que tu n’as pas vue.' },
  { titre: 'Faux transporteur ou faux séquestre', texte: 'Un « service de livraison » ou de « paiement sécurisé » imposé par le vendeur, hors du site : c’est le schéma classique.' },
  { titre: 'Pression pour décider vite', texte: '« Un autre acheteur passe demain » : prends le temps de vérifier les papiers et l’historique.' },
  { titre: 'Papiers incomplets', texte: 'Pas de certificat d’immatriculation au nom du vendeur, pas d’historique, pas de CoC : passe ton chemin ou négocie fort.' },
];

/** Historique officiel du véhicule, par pays. */
export const HISTORIQUE: { pays: Pays; nom: string; texte: string; source: Source }[] = [
  { pays: 'FR', nom: 'HistoVec (gratuit, officiel)', texte: 'Le vendeur génère le rapport et te l’envoie : 1re immatriculation, changements de propriétaire, sinistres graves (procédure VGA), gage/vol, contrôles techniques avec kilométrage. Refus de le donner = signal d’alarme.', source: { nom: 'HistoVec — Ministère de l’Intérieur', url: 'https://histovec.interieur.gouv.fr/' } },
  { pays: 'BE', nom: 'Car-Pass (obligatoire)', texte: 'Le vendeur doit le fournir (moins de 2 mois) : historique du kilométrage, entretiens, rappels ouverts, et depuis 2026 parfois le certificat d’état de la batterie (SoH). Demande-le.', source: { nom: 'Car-Pass — certificat SoH batterie', url: 'https://www.car-pass.be/fr/particuliers/je-veux-acheter-une-occasion/que-figure-t-il-sur-le-car-pass-et-a-quoi-faut-il-faire-attention/certificat-soh-batterie-verifiez-le-avant-dacheter' } },
  { pays: 'DE', nom: 'Pas de rapport public officiel', texte: 'Demande la Zulassungsbescheinigung Teil II (nombre de propriétaires), le carnet d’entretien, les rapports TÜV (kilométrage) et les factures. L’ADAC publie une liste de contrôle d’achat.', source: { nom: 'ADAC — acheter une voiture d’occasion', url: 'https://www.adac.de/rund-ums-fahrzeug/auto-kaufen-verkaufen/gebrauchtwagenkauf/gebrauchtwagen-kauf/' } },
  { pays: 'PT', nom: 'Certidão de registo automóvel', texte: 'Le registo automóvel (IRN) indique le propriétaire et les charges (penhora, reserva de propriedade). Vérifie que le vendeur est bien le propriétaire et qu’il n’y a pas de crédit en cours.', source: SOURCES.irn },
];

/** Points à cocher sur une annonce (communs + selon le pays). Complétés par le guide e-2008. */
export const VERIFS_ANNONCE: Point[] = [
  { id: 'v-vue', titre: 'Voir la voiture avant de payer quoi que ce soit', detail: 'Aucun acompte à distance, aucun « transporteur » imposé par le vendeur, aucun paiement par mandat.' },
  { id: 'v-proprio', titre: 'Le vendeur est le propriétaire', detail: 'Le nom sur le certificat d’immatriculation = la pièce d’identité (ou la société du pro).' },
  { id: 'v-soh', titre: 'Certificat d’état de la batterie (SoH)', detail: 'Rapport de diagnostic concessionnaire ou test indépendant ; sinon négocie.' },
  { id: 'v-rappels', titre: 'Rappels soldés (VIN chez un concessionnaire)', detail: 'Plusieurs rappels batterie / haute tension sur 2019–2023 : voir le Guide.' },
  { id: 'v-kw', titre: '50 ou 54 kWh confirmé', detail: 'Carte grise : 100 kW = 50 kWh, 115 kW = 54 kWh.' },
  { id: 'v-cable', titre: 'Câble de recharge Type 2 fourni', detail: 'Câble Mode 3 pour les bornes ; s’il manque, compte-le dans le prix.' },
  { id: 'v-hist-fr', titre: 'Rapport HistoVec reçu', detail: 'Gratuit, généré par le vendeur.', pays: ['FR'] },
  { id: 'v-hist-be', titre: 'Car-Pass reçu', detail: 'Obligatoire, moins de 2 mois.', pays: ['BE'] },
  { id: 'v-hist-de', titre: 'Teil II + carnet + rapports TÜV', detail: 'Kilométrage cohérent dans le temps.', pays: ['DE'] },
  { id: 'v-hist-pt', titre: 'Registo automóvel sans charge', detail: 'Pas de penhora ni de reserva de propriedade.', pays: ['PT'] },
  { id: 'v-coc', titre: 'Certificat de conformité (CoC) fourni', detail: 'Sinon la matrícula portugaise coûte 165 € au lieu de 45 €.', pays: ['FR', 'DE', 'BE'] },
  { id: 'v-papiers', titre: 'Papiers d’export prêts', detail: 'Voir « Ramener la voiture » dans Import.', pays: ['FR', 'DE', 'BE'] },
];
