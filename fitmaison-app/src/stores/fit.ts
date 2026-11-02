import { defineStore } from 'pinia';
import { CLE, charger, enregistrer, etatVide, lireSauvegarde, type BilanPlan, type Etat, type Jour, type PhaseId, type PlanEtat, type Profil, type Reglages, type SeanceFaite } from '@/core/etat';
import { aujourdhui } from '@/core/dates';
import { PALIERS, SEANCES, type Niveau } from '@/core/programmes';
import { creerPodometre } from '@/core/podometre';
import * as calc from '@/core/calculs';
import { toast } from '@/composables/useToast';
import { lancerSeance, useSeanceEnCours } from '@/composables/useSeance';
import { nouveauPlan, reprendre } from '@/core/plan';

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
  /** Pauses actives du jour (même logique que l'eau : retoucher la même valeur l'enlève). */
  function pause(n: number) {
    const j = jour(); const avant = j.pauses ?? 0;
    j.pauses = Math.max(0, j.pauses === n ? n - 1 : n);
    if (j.pauses > avant) dernierePause = Date.now();
  }
  /** Douleur genoux / dos du jour (0–10), pour la règle de la douleur du plan. */
  function douleur(n: number) { jour().douleur = Math.max(0, Math.min(10, Math.round(n))); }
  function pas(n: number) { jour().steps = Math.max(0, Math.min(100_000, Math.round(n))); }
  function habitude(id: string, v: boolean) { jour().habits[id] = v; }
  function ajouterRepas(label: string, kcal: number) { jour().food.push({ label: label.trim() || 'Repas', kcal: Math.round(kcal) }); }
  function retirerRepas(i: number) { jour().food.splice(i, 1); }
  function reglage<K extends keyof Reglages>(k: K, v: Reglages[K]) { etat.value.settings[k] = v; }

  function enregistrerSeance(s: SeanceFaite) {
    etat.value.sessions.push(s);
    if (s.type === 'bureau') { const j = jour(s.date); j.pauses = (j.pauses ?? 0) + 1; dernierePause = Date.now(); }
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

  // ----- Plan « Objectif Foot » -----
  const plan = computed(() => etat.value.plan);
  function demarrerPlan(debut = aujourdhui(), pasDepart?: number) { etat.value.plan = nouveauPlan(etat.value, debut, pasDepart); }
  function majPlan(p: Partial<PlanEtat>) { if (etat.value.plan) etat.value.plan = { ...etat.value.plan, ...p }; }
  function arreterPlan() { delete etat.value.plan; }
  /** Bilan du jour (remplace un bilan existant à la même date) ; met aussi la pesée à jour. */
  function ajouterBilan(b: BilanPlan) {
    const p = etat.value.plan;
    if (!p) return;
    p.bilans = [...p.bilans.filter(x => x.date !== b.date), b].sort((a, c) => a.date.localeCompare(c.date));
    if (b.poids && b.poids >= 30 && b.poids <= 350) ajouterPesee(b.poids, b.date);
  }
  function supprimerBilan(d: string) { const p = etat.value.plan; if (p) p.bilans = p.bilans.filter(x => x.date !== d); }
  function reprendrePlan(semaines: number) { if (etat.value.plan) etat.value.plan = reprendre(etat.value.plan, date.value, semaines); }
  function forcerPhase(phase: PhaseId | null) { majPlan({ phaseForcee: phase ? { phase, depuis: date.value } : undefined }); }
  function repondreSante(oui: string[], avisMedical?: boolean) { majPlan({ sante: { date: aujourdhui(), oui, avisMedical } }); }

  // Rappel de pause active : seulement quand l'app est ouverte (aucun serveur, aucune donnée envoyée).
  let dernierePause = Date.now();
  const seanceEnCours = useSeanceEnCours();
  function verifierRappel(maintenant = new Date()) {
    const r = etat.value.plan?.rappel;
    if (!r?.actif || seanceEnCours.value) return;
    const h = maintenant.getHours(), j = maintenant.getDay();
    if (j === 0 || j === 6 || h < (r.debut ?? 9) || h >= (r.fin ?? 18)) { dernierePause = maintenant.getTime(); return; }
    if (maintenant.getTime() - dernierePause < r.minutes * 60_000) return;
    dernierePause = maintenant.getTime();
    const texte = `Ça fait ${r.minutes} min : lève-toi, 4 min de pause active !`;
    if (document.visibilityState === 'visible') {
      toast(`⏰ ${texte}`, { action: 'Go', duree: 20_000, onAction: () => lancerSeance('bureau') });
    } else if (r.notification && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        const n = new Notification('FitMaison · pause active', { body: texte, tag: 'fitmaison-pause', icon: 'icons/icon-192.png' });
        n.onclick = () => { window.focus(); lancerSeance('bureau'); n.close(); };
      } catch { /* notifications indisponibles (iOS hors PWA…) */ }
    }
  }
  setInterval(verifierRappel, 30_000);
  /** Active / règle le rappel. Les notifications ne sont demandées que si l'utilisateur les active explicitement. */
  async function reglerRappel(o: Partial<NonNullable<PlanEtat['rappel']>>): Promise<boolean> {
    const p = etat.value.plan;
    if (!p) return false;
    const r = { actif: false, minutes: 60, debut: 9, fin: 18, ...(p.rappel ?? {}), ...o };
    if (o.notification) {
      try {
        const ok = typeof Notification !== 'undefined' && (Notification.permission === 'granted' || (await Notification.requestPermission()) === 'granted');
        if (!ok) { r.notification = false; toast('Notifications refusées ou indisponibles : le rappel s’affichera dans l’app.', { type: 'warn' }); }
      } catch { r.notification = false; }
    }
    if (o.actif) dernierePause = Date.now();
    p.rappel = r;
    return !!r.notification;
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
    plan, demarrerPlan, majPlan, arreterPlan, ajouterBilan, supprimerBilan, reprendrePlan, forcerPhase, repondreSante, reglerRappel, verifierRappel,
    creerProfil, majProfil, niveau, ajouterPesee, supprimerPesee, eau, pause, douleur, pas, habitude, ajouterRepas, retirerRepas, reglage,
    enregistrerSeance, noter, remplacer, annulerRemplacement, favori, importer, exporterTexte, toutEffacer,
    podoActif, podoSession, demarrerPodometre, arreterPodometre, sauverMaintenant,
  };
});
