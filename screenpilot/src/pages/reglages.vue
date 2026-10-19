<script setup lang="ts">
import * as store from '@/data/store';
import { duree } from '@/domain/screentime';
import { PAYS, type Pays, type Settings, type TitleLanguage } from '@/domain/types';
import { NOM_PAYS, paysDe } from '@/lib/catalogue';
import { useBiblio } from '@/stores/biblio';
import Icone from '@/components/Icone.vue';
import Avatar from '@/components/Avatar.vue';
import { useSocial } from '@/stores/social';
import { messageSocial } from '@/lib/social';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';

const biblio = useBiblio();
const router = useRouter();
const maj = (p: Partial<Settings>) => store.updateSettings(p);
const VERSION = '2.3.0';
const val = (e: Event) => (e.target as HTMLSelectElement).value;

// Compte et partage
const social = useSocial();
onMounted(() => { if (social.etat === 'inactif') void social.demarrer(); });
const COULEURS = ['#ff4d6d', '#ff8a3d', '#f5a524', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
const nouveauPseudo = ref('');
watch(() => social.profil?.pseudo, p => { nouveauPseudo.value = p ?? ''; }, { immediate: true });
async function majCompte(p: Parameters<typeof social.majProfil>[0], message?: string) {
  try { await social.majProfil(p); if (message) toast(message, { type: 'ok' }); } catch (e) { toast(messageSocial(e), { type: 'danger' }); }
}
async function deconnexion() {
  if (await confirmer('Tes données restent sur ce téléphone. Tes amis voient encore ce qui a déjà été partagé.', { titre: 'Se déconnecter ?', ok: 'Se déconnecter', annuler: 'Rester', danger: false })) await social.deconnecter();
}
async function suppression() {
  if (!(await confirmer('Ton compte, tes amitiés et tout ce que tu as partagé seront effacés du serveur. Ta bibliothèque reste sur ce téléphone.', { titre: 'Supprimer mon compte ?', ok: 'Supprimer définitivement', annuler: 'Annuler' }))) return;
  try { await social.supprimerCompte(); toast('Compte supprimé.'); } catch (e) { toast(messageSocial(e), { type: 'danger' }); }
}
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button type="button" class="icon-btn" aria-label="Retour" @click="router.back()"><Icone nom="retour" /></button>
      <h1 class="page-title grow">Réglages</h1>
    </div>

    <div class="card pad stack">
      <div class="field" role="group" aria-label="Thème">
        <span>Thème</span>
        <div class="seg">
          <button v-for="t in (['sombre', 'clair', 'auto'] as const)" :key="t" type="button" :class="{ on: biblio.settings.theme === t }" @click="maj({ theme: t })">
            {{ { sombre: 'Sombre', clair: 'Clair', auto: 'Auto' }[t] }}
          </button>
        </div>
      </div>
      <label class="field">
        <span>Pays (films au cinéma, streaming, cinéma local)</span>
        <select class="input" :value="paysDe(biblio.settings)" @change="maj({ pays: val($event) as Pays })">
          <option v-for="p in PAYS" :key="p" :value="p">{{ NOM_PAYS[p].nom }}</option>
        </select>
      </label>
      <label class="field">
        <span>Titres des anime et manga</span>
        <select class="input" :value="biblio.settings.titleLanguage" @change="maj({ titleLanguage: val($event) as TitleLanguage })">
          <option value="romaji">Romaji (Shingeki no Kyojin)</option>
          <option value="english">Anglais (Attack on Titan)</option>
          <option value="native">Original (進撃の巨人)</option>
        </select>
        <small class="muted">Films et séries : titre français, ou titre original avec « Original ».</small>
      </label>
    </div>

    <div class="section-head section"><h2>Temps d’écran</h2></div>
    <div class="card pad stack">
      <label class="bascule">
        <span class="grow"><b>Compter la lecture de manga</b><small>Sinon, le manga se compte en chapitres lus, à part du temps d’écran.</small></span>
        <input type="checkbox" :checked="!!biblio.settings.mangaDansTemps" @change="maj({ mangaDansTemps: ($event.target as HTMLInputElement).checked })">
      </label>
      <label v-if="biblio.settings.mangaDansTemps" class="field">
        <span>Temps de lecture d’un chapitre de manga</span>
        <select class="input" :value="biblio.settings.minutesPerChapter" @change="maj({ minutesPerChapter: Number(val($event)) })">
          <option v-for="m in [2, 3, 4, 5, 6, 8, 10, 15]" :key="m" :value="m">{{ m }} min</option>
        </select>
      </label>
      <label class="field">
        <span>Objectif hebdomadaire (maximum)</span>
        <select class="input" :value="biblio.settings.weeklyGoal ?? ''" @change="maj({ weeklyGoal: val($event) ? Number(val($event)) : null })">
          <option value="">Aucun</option>
          <option v-for="h in [5, 7, 10, 14, 20, 30]" :key="h" :value="h * 60">{{ duree(h * 60) }}</option>
        </select>
      </label>
      <p class="small muted">Durées des épisodes et films : celles de TMDB et AniList. Sans info : 24 min (anime), 40 min (série), 1 h 50 (film).</p>
    </div>

    <div class="section-head section"><h2>Rappels</h2></div>
    <div class="card pad stack">
      <label class="field">
        <span>Prévenir avant une diffusion</span>
        <select class="input" :value="biblio.settings.reminderMinutes" @change="maj({ reminderMinutes: Number(val($event)) })">
          <option v-for="m in [0, 5, 15, 30, 60, 120]" :key="m" :value="m">{{ m === 0 ? 'À l’heure exacte' : `${m} min avant` }}</option>
        </select>
      </label>
      <router-link to="/calendrier" class="btn full">Calendrier et notifications</router-link>
    </div>

    <div id="compte" class="section-head section"><h2>Compte et partage</h2></div>
    <div v-if="social.etat === 'connecte' && social.profil" class="card pad stack">
      <div class="row">
        <Avatar :pseudo="social.profil.pseudo" :couleur="social.profil.couleur" :taille="46" />
        <form class="row grow" @submit.prevent="nouveauPseudo.trim().length >= 2 && majCompte({ pseudo: nouveauPseudo.trim() }, 'Pseudo modifié.')">
          <input v-model="nouveauPseudo" class="input grow" maxlength="24" aria-label="Pseudo">
          <button v-if="nouveauPseudo.trim() !== social.profil.pseudo" type="submit" class="btn small primary" :disabled="nouveauPseudo.trim().length < 2">OK</button>
        </form>
      </div>
      <div class="couleurs" role="radiogroup" aria-label="Couleur de l’avatar">
        <button v-for="c in COULEURS" :key="c" type="button" role="radio" :aria-checked="social.profil.couleur === c" :aria-label="c" :class="{ on: social.profil.couleur === c }" :style="{ background: c }" @click="majCompte({ couleur: c })" />
      </div>
      <label class="bascule">
        <span class="grow"><b>Partager mon temps d’écran</b><small>Total par jour et par catégorie, pour le classement.</small></span>
        <input type="checkbox" :checked="social.profil.partage_temps" @change="majCompte({ partage_temps: ($event.target as HTMLInputElement).checked })">
      </label>
      <label class="bascule">
        <span class="grow"><b>Partager ma bibliothèque</b><small>Titres, statut, progression et note /10 (jamais tes notes perso). Permet titres en commun et compatibilité.</small></span>
        <input type="checkbox" :checked="social.profil.partage_biblio" @change="majCompte({ partage_biblio: ($event.target as HTMLInputElement).checked })">
      </label>
      <p class="small muted">Visible uniquement par les amis que tu as acceptés.<template v-if="social.derniereSynchro"> Dernier envoi : {{ new Date(social.derniereSynchro).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}.</template><template v-if="social.synchro === 'erreur'"> Envoi en échec : nouvel essai automatique.</template></p>
      <div class="row">
        <button type="button" class="btn grow" @click="deconnexion">Se déconnecter</button>
        <button type="button" class="btn ghost danger grow" @click="suppression">Supprimer mon compte</button>
      </div>
    </div>
    <router-link v-else to="/amis" class="card pad row compte-lien">
      <Icone nom="personnes" />
      <span class="grow"><b>Créer un compte (facultatif)</b><br><small class="muted">Pour te comparer à tes amis. Sans compte, rien ne quitte ton téléphone.</small></span>
      <Icone nom="droite" :taille="18" />
    </router-link>

    <div class="section-head section"><h2>À propos</h2></div>
    <div class="card pad apropos small">
      <p><b>ScreenPilot {{ VERSION }}</b> · application personnelle, gratuite, sans compte ni publicité (anciennement AnimePilot).</p>
      <p><b>Tes données</b> restent sur cet appareil (IndexedDB). Seules les recherches de titres sont envoyées à TMDB et AniList. Aucun suivi, aucune statistique d’usage.</p>
      <div class="tmdb">
        <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" class="logo-tmdb" aria-label="The Movie Database (TMDB)">TMDB</a>
        <p>Films et séries : <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer">The Movie Database (TMDB)</a>. Ce produit utilise l’API TMDB mais n’est ni approuvé ni certifié par TMDB.</p>
      </div>
      <p>Anime et manga : <a href="https://anilist.co" target="_blank" rel="noopener noreferrer">AniList</a> (API publique). ScreenPilot n’est affilié ni à TMDB ni à AniList. Contenu adulte exclu.</p>
      <p><b>Assistant et recommandations</b> : calculés sur l’appareil, par des règles, sans IA en ligne.</p>
      <button type="button" class="btn full" @click="maj({ onboarded: false })">Revoir la présentation</button>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Réglages" } }
</route>

<style scoped>
.couleurs { display: flex; flex-wrap: wrap; gap: 10px; }
.couleurs button { width: 30px; height: 30px; border-radius: 50%; border: 0; box-shadow: inset 0 0 0 2px rgba(255,255,255,.15); transition: transform .15s; }
.couleurs button.on { box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--text); transform: scale(1.05); }
.compte-lien { color: inherit; text-decoration: none; }
.compte-lien b { font-size: 15px; }
.bascule { display: flex; align-items: center; gap: 12px; }
.bascule b { display: block; font-size: 15px; }
.bascule small { display: block; color: var(--muted); font-size: 13px; }
.bascule input { width: 46px; height: 28px; accent-color: var(--brand); flex: none; }
.apropos p { margin: 0 0 10px; color: var(--muted); }
.apropos b { color: var(--text); }
.tmdb { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
.logo-tmdb { flex: none; padding: 6px 10px; border-radius: 8px; font-weight: 900; letter-spacing: .04em; text-decoration: none; color: #0d253f; background: linear-gradient(90deg, #90cea1, #01b4e4); }
</style>
