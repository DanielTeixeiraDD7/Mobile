import { defineStore } from 'pinia';
import * as social from '@/lib/social';
import type { Profil, Reseau, StatJour } from '@/lib/social';
import { bornes } from '@/domain/screentime';
import { useBiblio } from './biblio';

type Etat = 'inactif' | 'chargement' | 'deconnecte' | 'sans-profil' | 'connecte';

/** Compte, amis et classement. Rien ne se charge tant que l'utilisateur n'a pas de session. */
export const useSocial = defineStore('social', () => {
  const biblio = useBiblio();
  const etat = ref<Etat>('inactif');
  const profil = shallowRef<Profil | null>(null);
  const reseau = shallowRef<Reseau>({ amis: [], recues: [], envoyees: [] });
  /** Stats visibles (moi + amis qui partagent) depuis le lundi de la semaine dernière. */
  const stats = shallowRef<StatJour[]>([]);
  const erreur = ref<string | null>(null);
  const synchro = ref<'ok' | 'envoi' | 'erreur' | null>(null);
  const derniereSynchro = ref<number | null>(null);

  async function demarrer() {
    if (!social.sessionLocale()) { etat.value = 'deconnecte'; return; }
    await charger();
  }

  async function charger() {
    etat.value = 'chargement';
    erreur.value = null;
    try {
      const id = await social.utilisateurId();
      if (!id) { etat.value = 'deconnecte'; return; }
      profil.value = await social.monProfil();
      if (!profil.value) { etat.value = 'sans-profil'; return; }
      etat.value = 'connecte';
      await Promise.all([rafraichir(), synchroniser()]);
    } catch (e) {
      erreur.value = social.messageSocial(e);
      // Hors-ligne : on reste « connecté » avec les dernières données affichées.
      etat.value = profil.value ? 'connecte' : 'deconnecte';
    }
  }

  async function rafraichir() {
    if (!profil.value) return;
    const lundiDernier = bornes('semaine', new Date(), -1).debut.getTime();
    const [r, s] = await Promise.all([social.reseau(profil.value.id), social.statsDepuis(social.jourLocal(lundiDernier))]);
    reseau.value = r;
    stats.value = s;
  }

  let enCours: Promise<void> | null = null;
  async function synchroniser() {
    if (etat.value !== 'connecte' || !profil.value) return;
    if (enCours) return enCours;
    const p = profil.value;
    synchro.value = 'envoi';
    enCours = (async () => {
      try {
        await social.pousserStats(p.id, biblio.sessionsVues);
        await social.pousserTitres(p.id, biblio.entries, p.partage_biblio, biblio.settings.titleLanguage);
        synchro.value = 'ok';
        derniereSynchro.value = Date.now();
        stats.value = await social.statsDepuis(social.jourLocal(bornes('semaine', new Date(), -1).debut.getTime()));
      } catch (e) {
        synchro.value = 'erreur';
        erreur.value = social.messageSocial(e);
      } finally {
        enCours = null;
      }
    })();
    return enCours;
  }

  // Envoi automatique quelques secondes après un changement de la bibliothèque.
  let minuterie: ReturnType<typeof setTimeout> | undefined;
  watch(() => [biblio.history.length, biblio.entries], () => {
    if (etat.value !== 'connecte') return;
    clearTimeout(minuterie);
    minuterie = setTimeout(() => void synchroniser(), 4000);
  });

  async function inscrire(email: string, mdp: string, pseudo: string) {
    profil.value = await social.inscrire(email, mdp, pseudo);
    etat.value = 'connecte';
    await Promise.all([rafraichir(), synchroniser()]);
  }
  async function connecter(email: string, mdp: string) {
    profil.value = await social.connecter(email, mdp);
    etat.value = profil.value ? 'connecte' : 'sans-profil';
    if (profil.value) await Promise.all([rafraichir(), synchroniser()]);
  }
  async function creerProfil(pseudo: string) {
    profil.value = await social.creerProfil(pseudo);
    etat.value = 'connecte';
    await Promise.all([rafraichir(), synchroniser()]);
  }
  async function majProfil(p: Parameters<typeof social.majProfil>[1]) {
    if (!profil.value) return;
    const avant = profil.value.partage_biblio;
    profil.value = await social.majProfil(profil.value.id, p);
    if (p.partage_biblio !== undefined && p.partage_biblio !== avant) await synchroniser();
  }
  async function deconnecter() {
    await social.deconnecter();
    profil.value = null; reseau.value = { amis: [], recues: [], envoyees: [] }; stats.value = [];
    etat.value = 'deconnecte';
  }
  async function supprimerCompte() {
    await social.supprimerCompte();
    profil.value = null; reseau.value = { amis: [], recues: [], envoyees: [] }; stats.value = [];
    etat.value = 'deconnecte';
  }
  async function ajouterAmi(code: string) {
    const r = await social.demanderAmi(code);
    await rafraichir();
    return r;
  }
  async function accepter(autre: string) { await social.accepter(profil.value!.id, autre); await rafraichir(); }
  async function retirer(autre: string) { await social.retirer(profil.value!.id, autre); await rafraichir(); }

  return { etat, profil, reseau, stats, erreur, synchro, derniereSynchro, demarrer, charger, rafraichir, synchroniser, inscrire, connecter, creerProfil, majProfil, deconnecter, supprimerCompte, ajouterAmi, accepter, retirer };
});
