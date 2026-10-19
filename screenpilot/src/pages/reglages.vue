<script setup lang="ts">
import * as store from '@/data/store';
import { duree } from '@/domain/screentime';
import { PAYS, type Pays, type Settings, type TitleLanguage } from '@/domain/types';
import { NOM_PAYS, paysDe } from '@/lib/catalogue';
import { useBiblio } from '@/stores/biblio';
import Icone from '@/components/Icone.vue';

const biblio = useBiblio();
const router = useRouter();
const maj = (p: Partial<Settings>) => store.updateSettings(p);
const VERSION = '2.1.0';
const val = (e: Event) => (e.target as HTMLSelectElement).value;
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
      <label class="field">
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
.apropos p { margin: 0 0 10px; color: var(--muted); }
.apropos b { color: var(--text); }
.tmdb { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
.logo-tmdb { flex: none; padding: 6px 10px; border-radius: 8px; font-weight: 900; letter-spacing: .04em; text-decoration: none; color: #0d253f; background: linear-gradient(90deg, #90cea1, #01b4e4); }
</style>
