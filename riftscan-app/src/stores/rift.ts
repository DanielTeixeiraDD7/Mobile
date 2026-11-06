import { defineStore } from 'pinia';
import { chargerDonnees, type Donnees } from '@/core/donnees';
import { enEuros, finitionsDispo, valeurUsd } from '@/core/prix';
import type { Carte, Finition } from '@/core/types';

const CLE = 'riftscan:v1';
interface Sauvegarde {
  /** Collection : « id:finition » → quantité. */
  collection: Record<string, number>;
  /** Derniers scans (le plus récent d'abord). */
  scans: { id: string; date: string }[];
}
function charger(): Sauvegarde {
  try {
    const d = JSON.parse(localStorage.getItem(CLE) ?? '{}');
    return { collection: d.collection ?? {}, scans: Array.isArray(d.scans) ? d.scans : [] };
  } catch {
    return { collection: {}, scans: [] };
  }
}

/** Données (cartes, prix, empreintes) et collection de l'utilisateur (stockée sur l'appareil). */
export const useRift = defineStore('rift', () => {
  const donnees = shallowRef<Donnees | null>(null);
  const erreur = ref<string | null>(null);
  const chargement = ref(false);
  const etat = ref<Sauvegarde>(charger());
  watch(etat, v => { try { localStorage.setItem(CLE, JSON.stringify(v)); } catch { /* stockage plein ou bloqué */ } }, { deep: true });

  async function demarrer() {
    if (donnees.value || chargement.value) return;
    chargement.value = true; erreur.value = null;
    try { donnees.value = await chargerDonnees(); } catch (e) {
      erreur.value = navigator.onLine === false ? 'Pas de connexion : les données n’ont jamais été téléchargées sur cet appareil.' : `Données indisponibles (${(e as Error).message}).`;
    } finally { chargement.value = false; }
  }

  const parId = computed(() => new Map((donnees.value?.cartes ?? []).map(c => [c.id, c])));
  const carte = (id: string): Carte | undefined => parId.value.get(id);
  /** Valeur en euros (prix du marché, sinon le plus bas). */
  function valeur(id: string, f: Finition): number | null {
    const d = donnees.value;
    const usd = d ? valeurUsd(d.prix, id, f) : null;
    return usd == null || !d ? null : enEuros(usd, d.prix);
  }
  /** Finition « par défaut » : normale si elle a un prix, sinon foil. */
  const finitionDefaut = (id: string): Finition => (donnees.value && finitionsDispo(donnees.value.prix, id)[0]) || 'N';
  /** Valeur la plus haute des deux finitions (tri, aperçus). */
  const valeurMax = (id: string) => Math.max(valeur(id, 'N') ?? -1, valeur(id, 'F') ?? -1);
  /** Autres versions de la même carte (même nom sans la mention de variante). */
  const nomBase = (n: string) => n.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase();
  const variantes = (c: Carte) => (donnees.value?.cartes ?? []).filter(x => x.id !== c.id && nomBase(x.n) === nomBase(c.n));

  // ----- Collection -----
  const qte = (id: string, f: Finition) => etat.value.collection[`${id}:${f}`] ?? 0;
  function ajouter(id: string, f: Finition, n = 1) {
    const k = `${id}:${f}`;
    const v = Math.max(0, (etat.value.collection[k] ?? 0) + n);
    if (v) etat.value.collection[k] = v; else delete etat.value.collection[k];
  }
  const lignesCollection = computed(() => Object.entries(etat.value.collection)
    .map(([k, q]) => { const [id, f] = k.split(':') as [string, Finition]; return { id, f, q, carte: carte(id), valeur: valeur(id, f) }; })
    .filter(l => l.carte));
  const totalCollection = computed(() => lignesCollection.value.reduce((t, l) => t + (l.valeur ?? 0) * l.q, 0));
  const nbCollection = computed(() => lignesCollection.value.reduce((t, l) => t + l.q, 0));

  function noterScan(id: string) {
    etat.value.scans = [{ id, date: new Date().toISOString() }, ...etat.value.scans.filter(s => s.id !== id)].slice(0, 30);
  }

  return { donnees, erreur, chargement, etat, demarrer, carte, valeur, finitionDefaut, valeurMax, variantes, qte, ajouter, lignesCollection, totalCollection, nbCollection, noterScan };
});
