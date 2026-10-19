/**
 * Catalogue marques / modèles et leurs adresses sur chaque site.
 * Relevé le 19/10/2026 sur les pages publiques de Standvirtual et AutoScout24 (DE, FR, BE) :
 * par défaut l'adresse est le nom « slugifié » (ex. « C3 Aircross » → c3-aircross) ;
 * seules les exceptions sont notées. null = modèle absent de ce site sous ce nom : on cherche alors la marque seule.
 * mobile.de (codes numériques) : site inaccessible aux robots, codes non vérifiés.
 */
export interface CodesMarque { sv?: string; cj?: string; as24?: string; mobilede?: number }
/** elec = modèle 100 % électrique (filtre ajouté d'office) ; as24 = les 3 AutoScout24 ; as24de = Allemagne ; as24fb = France + Belgique. */
export interface CodesModele { elec?: true; sv?: string | null; as24?: string | null; as24de?: string | null; as24fb?: string | null }
export interface Marque { nom: string; codes?: CodesMarque; modeles: (string | [string, CodesModele])[] }

export const MARQUES: Marque[] = [
  { nom: 'Peugeot', codes: { mobilede: 19300 }, modeles: ['108', '208', ['e-208', { elec: true, as24de: '208' }], '2008', ['e-2008', { elec: true, as24de: '2008' }], '308', ['e-308', { elec: true, as24: '308' }], '3008', '5008', 'Rifter'] },
  { nom: 'Renault', codes: { mobilede: 20700 }, modeles: ['Twingo', 'Clio', 'Captur', 'Mégane', ['Mégane E-Tech', { elec: true, as24de: 'megane' }], ['Zoe', { elec: true }], 'Arkana', 'Austral', 'Kadjar', 'Scénic'] },
  { nom: 'Citroën', modeles: ['C1', 'C3', 'C3 Aircross', 'C4', ['ë-C4', { elec: true, as24: 'c4' }], 'C5 Aircross', 'Berlingo'] },
  { nom: 'Volkswagen', codes: { sv: 'vw', cj: 'vw', mobilede: 25200 }, modeles: ['Up', 'Polo', 'Golf', 'T-Roc', 'T-Cross', 'Tiguan', 'Passat', ['ID.3', { elec: true }], ['ID.4', { elec: true }]] },
  { nom: 'BMW', codes: { mobilede: 3500 }, modeles: [['Série 1', { as24de: '1er', sv: null, as24fb: 'serie-1-tous' }], ['Série 2', { as24de: '2er', sv: null, as24fb: 'serie-2-tous' }], ['Série 3', { as24de: '3er', sv: null, as24fb: 'serie-3-tous' }], ['Série 5', { as24de: '5er', sv: null, as24fb: 'serie-5-tous' }], 'X1', 'X3', ['i3', { elec: true }], ['i4', { elec: true }], ['iX1', { elec: true }]] },
  { nom: 'Mercedes-Benz', codes: { mobilede: 17200 }, modeles: [['Classe A', { as24de: 'a-klasse', sv: null, as24fb: 'classe-a-tous' }], ['Classe B', { as24de: 'b-klasse', sv: null, as24fb: 'classe-b-tous' }], ['Classe C', { as24de: 'c-klasse', sv: null, as24fb: 'classe-c-tous' }], ['Classe E', { as24de: 'e-klasse', sv: null, as24fb: 'classe-e-tous' }], ['GLA', { sv: null, as24fb: 'gla-tous' }], ['GLC', { sv: null, as24fb: 'glc-tous' }], ['EQA', { elec: true }]] },
  { nom: 'Audi', codes: { mobilede: 1900 }, modeles: ['A1', 'A3', 'A4', 'A6', 'Q2', 'Q3', 'Q5', ['Q4 e-tron', { elec: true }], ['e-tron', { elec: true }]] },
  { nom: 'Toyota', codes: { mobilede: 24100 }, modeles: ['Aygo', 'Aygo X', 'Yaris', 'Yaris Cross', 'Corolla', 'C-HR', 'RAV4'] },
  { nom: 'Tesla', codes: { mobilede: 135 }, modeles: [['Model 3', { elec: true }], ['Model Y', { elec: true }], ['Model S', { elec: true }]] },
  { nom: 'Dacia', modeles: ['Sandero', 'Duster', 'Jogger', ['Spring', { elec: true }]] },
  { nom: 'Fiat', modeles: ['500', ['500e', { elec: true }], 'Panda', 'Tipo'] },
  { nom: 'Opel', codes: { mobilede: 19000 }, modeles: ['Corsa', ['Corsa-e', { elec: true, as24de: 'corsa' }], 'Astra', 'Mokka', ['Crossland X', { as24de: null }]] },
  { nom: 'Ford', codes: { mobilede: 9000 }, modeles: ['Fiesta', 'Focus', 'Puma', 'Kuga', ['Mustang Mach-E', { elec: true }]] },
  { nom: 'Kia', modeles: ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Niro', ['e-Niro', { elec: true, as24de: 'niro' }], 'Sportage', ['EV6', { elec: true }]] },
  { nom: 'Hyundai', modeles: ['i10', 'i20', 'i30', ['Kona', { sv: null }], 'Tucson', ['Ioniq 5', { elec: true }]] },
  { nom: 'Nissan', modeles: ['Micra', 'Juke', 'Qashqai', ['Leaf', { elec: true }]] },
  { nom: 'Seat', modeles: ['Ibiza', 'Leon', 'Arona', 'Ateca'] },
  { nom: 'Cupra', modeles: [['Born', { elec: true }], 'Formentor', ['Leon', { sv: null }]] },
  { nom: 'Skoda', modeles: ['Fabia', 'Octavia', 'Kamiq', 'Karoq', ['Enyaq', { elec: true }]] },
  { nom: 'MG', modeles: [['MG4', { elec: true }], 'ZS', 'MG5'] },
  { nom: 'Mini', modeles: [['Cooper', { as24de: null, sv: null }], ['Cooper SE', { elec: true, as24de: null, sv: null }], 'Countryman'] },
  { nom: 'Volvo', modeles: [['XC40', { sv: 'xc-40' }], ['XC60', { sv: 'xc-60' }], ['EX30', { elec: true, sv: 'ex-30' }]] },
  { nom: 'Smart', modeles: ['fortwo', 'forfour'] },
  { nom: 'Honda', modeles: ['Jazz', 'Civic', 'HR-V'] },
  { nom: 'Mazda', modeles: [['2', { as24de: null }], ['3', { as24de: null }], ['CX-30', { sv: 'cx30' }], ['MX-30', { elec: true }]] },
  { nom: 'Suzuki', modeles: ['Swift', 'Vitara', 'Ignis'] },
  { nom: 'DS', codes: { as24: 'ds-automobiles' }, modeles: [['DS 3', { sv: 'ds3' }], ['DS 7', { sv: 'ds7' }]] },
  { nom: 'BYD', modeles: [['Dolphin', { elec: true }], ['Atto 3', { elec: true }]] },

];

export const slug = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cle = (s: string) => slug(s).replace(/-/g, '');

export const marqueParNom = (nom: string): Marque | null => (nom ? MARQUES.find(m => cle(m.nom) === cle(nom)) ?? null : null);
export const nomsModeles = (marque: string): string[] => (marqueParNom(marque)?.modeles ?? []).map(m => (typeof m === 'string' ? m : m[0]));

/** Modèle du catalogue (comparaison souple : « id3 », « ID.3 », « id 3 » → ID.3). */
export function modeleDuCatalogue(marque: string, modele: string): { nom: string; codes: CodesModele } | null {
  if (!modele) return null;
  const m = marqueParNom(marque)?.modeles.find(x => cle(typeof x === 'string' ? x : x[0]) === cle(modele));
  if (!m) return null;
  return typeof m === 'string' ? { nom: m, codes: {} } : { nom: m[0], codes: m[1] };
}

/** Marque d'un modèle saisi seul (« Clio » → Renault), si un seul constructeur le propose. */
export function marqueDuModele(modele: string): string | null {
  if (!modele.trim()) return null;
  const trouvees = MARQUES.filter(m => modeleDuCatalogue(m.nom, modele));
  return trouvees.length === 1 ? trouvees[0]!.nom : null;
}

/** Adresse du modèle sur AutoScout24 pour un pays (null : absent sous ce nom). */
export function modeleAs24(codes: CodesModele, nom: string, pays: 'DE' | 'FR' | 'BE'): string | null {
  const v = pays === 'DE' ? (codes.as24de !== undefined ? codes.as24de : codes.as24) : (codes.as24fb !== undefined ? codes.as24fb : codes.as24);
  return v === undefined ? slug(nom) : v;
}
export const modeleSv = (codes: CodesModele, nom: string): string | null => (codes.sv === undefined ? slug(nom) : codes.sv);
