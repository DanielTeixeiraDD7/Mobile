import { defineStore } from 'pinia';
import { CLE, charger, enregistrer, etatVide, lireSauvegarde, type Etat, type Jour, type Profil, type Reglages, type SeanceFaite } from '@/core/etat';
import { aujourdhui } from '@/core/dates';
import { PALIERS, SEANCES, type Niveau } from '@/core/programmes';
import { creerPodometre } from '@/core/podometre';
import * as calc from '@/core/calculs';
import { toast } from '@/composables/useToast';

/** État de l'app (localStorage « fitmaison_v1 », compatible v1) et actions. */
export const useFit = defineStore('fit', () => {
  const etat = ref<Etat>(charger());
  /** Date du jour (rafraîchie au retour dans l'app : minuit a pu passer). */
  const date = ref(aujourdhui());

  // Sauvegarde groupée (le podomètre peut modifier l'état plusieurs fois par seconde).
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  const sauver = () => { clearTimeout(minuterie); minuterie = setTimeout(() => { if (!enregistrer(etat.value)) toast('Sauvegarde impossible (stockage plein ou bloqué).', { type: 'danger' }); }, 300); };
  watch(etat, sauver, { deep: true });
  const sauverMaintenant = () => { clearTimeout(minuterie); enregistrer(etat.value); };
  window.addEventListener('pagehide', sauverMaintenant);
  // Autre onglet (ex. archive v1 ouverte en parallèle) : on relit.
  window.addEventListener('storage', e => { if (e.key === CLE) etat.value = charger(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') date.value = aujourdhui(); else sauverMaintenant(); });

  const profil = computed(() => etat.value.profile);
  const reglages = computed(() => etat.value.settings);
  function jour(d = date.value): Jour {
    etat.value.days[d] ??= { water: 0, steps: 0, habits: {}, food: [] };
    return etat.value.days[d]!;
  }
  /** Lecture seule (n'ajoute pas de jour vide). */
  const jourLu = (d = date.value): Jour => etat.value.days[d] ?? { water: 0, steps: 0, habits: {}, food: [] };

  const poids = computed(() => calc.poidsActuel(etat.value));
  const nutrition = computed(() => (etat.value.profile ? calc.nutrition(etat.value) : null));
  const tendance = computed(() => calc.tendance(etat.value));
  const serie = computed(() => calc.serie(etat.value));
  const bruleAujourdhui = computed(() => calc.brule(etat.value, date.value));

  function creerProfil(p: Omit<Profil, 'level' | 'createdAt'>) {
    etat.value.profile = { ...p, level: 1, createdAt: aujourdhui() };
    etat.value.weights = [{ date: aujourdhui(), kg: p.startWeight }];
  }
  function majProfil(p: Partial<Profil>) { if (etat.value.profile) etat.value.profile = { ...etat.value.profile, ...p }; }
  function niveau(n: Niveau) { majProfil({ level: n }); }

  /** Renvoie le palier franchi (pour la célébration), sinon null. */
  function ajouterPesee(kg: number, d = aujourdhui()): number | null {
    if (!(kg >= 30 && kg <= 350)) throw new Error('Poids invalide');
    const avant = Math.min(...etat.value.weights.map(w => w.kg), Infinity);
    etat.value.weights = [...etat.value.weights.filter(w => w.date !== d), { date: d, kg: Math.round(kg * 10) / 10 }];
    const passes = [...PALIERS, etat.value.profile?.goalWeight ?? 0].filter(m => kg <= m && avant > m);
    return passes.length ? Math.min(...passes) : null;
  }
  function supprimerPesee(d: string) { etat.value.weights = etat.value.weights.filter(w => w.date !== d); }

  function eau(verres: number) { const j = jour(); j.water = j.water === verres ? verres - 1 : verres; }
  function pas(n: number) { jour().steps = Math.max(0, Math.min(100_000, Math.round(n))); }
  function habitude(id: string, v: boolean) { jour().habits[id] = v; }
  function ajouterRepas(label: string, kcal: number) { jour().food.push({ label: label.trim() || 'Repas', kcal: Math.round(kcal) }); }
  function retirerRepas(i: number) { jour().food.splice(i, 1); }
  function reglage<K extends keyof Reglages>(k: K, v: Reglages[K]) { etat.value.settings[k] = v; }

  function enregistrerSeance(s: SeanceFaite) {
    etat.value.sessions.push(s);
    const vus = new Set(etat.value.vus ?? []);
    s.exos?.forEach(x => vus.add(x));
    etat.value.vus = [...vus];
  }
  /** Ressenti de la dernière séance ; ajuste le niveau après 3 séances identiques (règle v1). */
  function noter(ressenti: 1 | 2 | 3): string {
    const s = etat.value.sessions[etat.value.sessions.length - 1];
    const p = etat.value.profile;
    if (!s || !p) return '';
    s.feel = ressenti;
    const recentes = etat.value.sessions.filter(x => x.level === p.level && SEANCES[x.type]?.circuit).slice(-3);
    if (ressenti === 1 && p.level < 3 && recentes.length === 3 && recentes.every(x => x.feel === 1)) {
      p.level = (p.level + 1) as Niveau;
      return `🚀 Trop facile ! Tu passes au niveau ${p.level}`;
    }
    if (ressenti === 3 && p.level > 1 && recentes.length === 3 && recentes.every(x => x.feel === 3)) {
      p.level = (p.level - 1) as Niveau;
      return `On ralentit un peu : niveau ${p.level}. Aucune honte, c’est la régularité qui compte !`;
    }
    return 'Séance enregistrée 💪';
  }
  function remplacer(de: string, par: string) { etat.value.remplacements = { ...(etat.value.remplacements ?? {}), [de]: par }; }
  function annulerRemplacement(de: string) { const r = { ...(etat.value.remplacements ?? {}) }; delete r[de]; etat.value.remplacements = r; }
  function favori(id: string) {
    const f = new Set(etat.value.favoris ?? []);
    if (f.has(id)) f.delete(id); else f.add(id);
    etat.value.favoris = [...f];
  }

  function importer(texte: string) { etat.value = lireSauvegarde(texte); sauverMaintenant(); }
  function exporterTexte() { return JSON.stringify(etat.value); }
  function toutEffacer() { podometre.arreter(); etat.value = etatVide(); sauverMaintenant(); }

  // Podomètre
  const podoActif = ref(false);
  const podoSession = ref(0);
  const podometre = creerPodometre(() => { jour().steps = (jour().steps || 0) + 1; podoSession.value = podometre.session; }, m => { podoActif.value = false; toast(m, { type: 'warn' }); });
  async function demarrerPodometre() {
    const err = await podometre.demarrer();
    if (err) { toast(err, { type: 'warn' }); return false; }
    podoActif.value = true; podoSession.value = 0;
    return true;
  }
  function arreterPodometre() { podometre.arreter(); podoActif.value = false; sauverMaintenant(); return podoSession.value; }

  return {
    etat, date, profil, reglages, jour, jourLu, poids, nutrition, tendance, serie, bruleAujourdhui,
    creerProfil, majProfil, niveau, ajouterPesee, supprimerPesee, eau, pas, habitude, ajouterRepas, retirerRepas, reglage,
    enregistrerSeance, noter, remplacer, annulerRemplacement, favori, importer, exporterTexte, toutEffacer,
    podoActif, podoSession, demarrerPodometre, arreterPodometre, sauverMaintenant,
  };
});
