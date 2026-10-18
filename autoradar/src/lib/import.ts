import type { Annonce, Pays } from './types';

/**
 * Coût total au Portugal d'une voiture 100 % électrique, achetée au Portugal ou importée (UE).
 * Montants officiels relevés le 18/10/2026 (sources ci-dessous) ; transport et plaques = estimations modifiables.
 */

export interface Source { nom: string; url: string }

export const SOURCES = {
  isv: { nom: 'Código do ISV, art. 2.º n.º 2 a) et art. 17.º n.º 3 (AT)', url: 'https://info-aduaneiro.portaldasfinancas.gov.pt/pt/legislacao_aduaneira/codigos_aduaneiros/Documents/CISV.pdf' },
  isvFaq: { nom: 'AT — FAQ ISV n.º 2 (véhicules électriques)', url: 'https://info-aduaneiro.portaldasfinancas.gov.pt/pt/informacao_aduaneira/Veiculos/regularizacao/Pages/faq-isv-02.aspx' },
  iuc: { nom: 'Código do IUC, art. 5.º n.º 1 e) (AT)', url: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/Cod_download/Documents/CIUC_08_2025.pdf' },
  iva: { nom: 'RITI, art. 6.º n.º 2 (moyen de transport neuf)', url: 'https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/riti/Pages/riti6.aspx' },
  ivaUe: { nom: 'Your Europe — TVA à l’achat d’une voiture dans l’UE', url: 'https://europa.eu/youreurope/citizens/vehicles/cars/vat-buying-selling-cars/index_en.htm' },
  imt: { nom: 'IMT — Matrícula para veículos usados', url: 'https://www.imt-ip.pt/veiculos/matricula/matricula-para-veiculos-usados/' },
  inspecao: { nom: 'IMT — Deliberação 1598-A/2025 (tarifs 2026)', url: 'https://antram.pt/attachments/legislacao/Deliberacao%201598-A2025.pdf' },
  irn: { nom: 'IRN — Custos dos serviços', url: 'https://irn.justica.gov.pt/Custos-dos-servicos' },
  etapes: { nom: 'AT — Étapes de régularisation d’un véhicule (PDF)', url: 'https://info-aduaneiro.portaldasfinancas.gov.pt/pt/informacao_aduaneira/veiculos/veiculos/Documents/Etapas_Regularizacao_Fiscal_Veiculo_Links.pdf' },
  transport: { nom: 'Tarifs publiés par un importateur (sept. 2026)', url: 'https://ecoimport.pt/transporte-automovel/' },
} satisfies Record<string, Source>;

/** Montants officiels (€). */
export const OFFICIEL = {
  inspectionB: 93.52, // 76,03 € + IVA 23 % (inspection catégorie B, Modelo 112)
  imtMatriculaAvecCoc: 45,
  imtMatriculaSansCoc: 165,
  irnRegistoInicial: 55, // −15 % en ligne
  irnRegistoTransfert: 65, // achat d'occasion au Portugal ; −15 % en ligne
  remiseEnLigne: 0.15,
  ivaPt: 0.23,
  seuilNeufKm: 6000,
  seuilNeufMois: 6,
};

export interface Hypotheses {
  /** Transport par camion ouvert, TVA comprise (estimation). */
  transport: Record<Exclude<Pays, 'PT'>, number>;
  plaques: number;
  enLigne: boolean; // démarches IRN en ligne (−15 %)
  coc: boolean; // certificat de conformité fourni par le vendeur
}

export const HYPOTHESES_DEFAUT: Hypotheses = {
  // Milieu des fourchettes publiées, + IVA 23 % : FR 700–1 050 €, BE ~900 €, DE 1 000–1 400 € HT.
  transport: { FR: 1080, BE: 1110, DE: 1480 },
  plaques: 20,
  enLigne: true,
  coc: true,
};

export interface Ligne { libelle: string; montant: number; note?: string; estimation?: boolean; source?: Source }
export interface Cout { lignes: Ligne[]; total: number | null; alertes: string[] }

type Entree = Pick<Annonce, 'pays' | 'prix' | 'annee' | 'km'>;

const arrondi = (n: number) => Math.round(n * 100) / 100;

/**
 * Voiture « neuve » au sens de la TVA si 6 mois ou moins depuis la 1re mise en service OU 6 000 km ou moins.
 * Avec seulement l'année, on ne sait pas toujours : null = à vérifier.
 */
export function estNeuveTva(e: Pick<Entree, 'annee' | 'km'>, maintenant = new Date()): boolean | null {
  if (e.km != null && e.km <= OFFICIEL.seuilNeufKm) return true;
  const an = maintenant.getFullYear();
  // Immatriculée au plus tard en décembre de l'année A : plus de 6 mois dès juillet de A+1.
  const plusDe6Mois = e.annee != null && (e.annee <= an - 2 || (e.annee === an - 1 && maintenant.getMonth() >= 6));
  if (plusDe6Mois && e.km != null) return false;
  return null;
}

export function calculer(e: Entree, h: Hypotheses = HYPOTHESES_DEFAUT, maintenant = new Date()): Cout {
  const alertes: string[] = [];
  if (e.prix == null) return { lignes: [], total: null, alertes };
  const remise = h.enLigne ? 1 - OFFICIEL.remiseEnLigne : 1;
  const lignes: Ligne[] = [{ libelle: 'Prix affiché', montant: e.prix }];

  if (e.pays === 'PT') {
    lignes.push({
      libelle: 'Registo de propriedade (IRN)',
      montant: arrondi(OFFICIEL.irnRegistoTransfert * remise),
      note: h.enLigne ? 'Transfert de propriété, demande en ligne (−15 %)' : 'Transfert de propriété, au guichet',
      source: SOURCES.irn,
    });
    lignes.push({ libelle: 'ISV / IUC', montant: 0, note: 'Électrique : déjà immatriculée, IUC exonéré', source: SOURCES.iuc });
  } else {
    lignes.push({ libelle: 'Transport jusqu’au Portugal', montant: h.transport[e.pays], estimation: true, note: 'Camion ouvert, TVA comprise (estimation)', source: SOURCES.transport });
    lignes.push({ libelle: 'Inspection catégorie B', montant: OFFICIEL.inspectionB, note: '76,03 € + IVA, obligatoire avant la matrícula', source: SOURCES.inspecao });
    lignes.push({
      libelle: 'Matrícula portugaise (IMT)',
      montant: h.coc ? OFFICIEL.imtMatriculaAvecCoc : OFFICIEL.imtMatriculaSansCoc,
      note: h.coc ? 'Avec certificat de conformité (CoC)' : 'Sans CoC : homologation plus chère',
      source: SOURCES.imt,
    });
    lignes.push({ libelle: 'Registo inicial (IRN)', montant: arrondi(OFFICIEL.irnRegistoInicial * remise), note: 'Dans les 60 jours suivant la matrícula', source: SOURCES.irn });
    lignes.push({ libelle: 'Plaques', montant: h.plaques, estimation: true });
    lignes.push({ libelle: 'ISV', montant: 0, note: '100 % électrique : hors champ de l’ISV (DAV quand même obligatoire)', source: SOURCES.isv });
    lignes.push({ libelle: 'IUC (taxe annuelle)', montant: 0, note: 'Électrique : exonéré', source: SOURCES.iuc });

    const neuve = estNeuveTva(e, maintenant);
    if (neuve) {
      lignes.push({ libelle: 'IVA 23 % (voiture « neuve »)', montant: arrondi(e.prix * OFFICIEL.ivaPt), note: '6 000 km ou moins : TVA due au Portugal (prix supposé hors TVA étrangère)', source: SOURCES.iva });
      alertes.push('Moins de 6 000 km : fiscalement « neuve ». L’IVA portugaise est due ; achète-la hors TVA étrangère (facture HT) sinon tu paies deux fois.');
    } else if (neuve === null) {
      alertes.push('Si la voiture a 6 mois ou moins ou 6 000 km ou moins, elle est « neuve » au sens de la TVA : IVA 23 % au Portugal. Indique l’année et le kilométrage.');
    }
    if (!h.coc) alertes.push('Demande le certificat de conformité (CoC) au vendeur : sans lui, la matrícula coûte 165 € au lieu de 45 €.');
  }
  const total = arrondi(lignes.reduce((s, l) => s + l.montant, 0));
  return { lignes, total, alertes };
}
