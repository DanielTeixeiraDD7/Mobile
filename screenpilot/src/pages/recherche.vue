<script setup lang="ts">
import { MEDIA_TYPES, type MediaSnapshot, type MediaType } from '@/domain/types';
import { TYPE_LABELS } from '@/domain/labels';
import { rechercher, rechercherTout, messageErreur } from '@/lib/sources';
import { ApiError } from '@/api/anilist';
import { ouvrirAjout } from '@/composables/useAjout';
import Icone from '@/components/Icone.vue';
import CarteMedia from '@/components/CarteMedia.vue';
import Catalogue from '@/components/Catalogue.vue';

const route = useRoute();
const router = useRouter();
const q = ref(typeof route.query.q === 'string' ? route.query.q : '');
const type = ref<MediaType | null>(MEDIA_TYPES.includes(route.query.type as MediaType) ? (route.query.type as MediaType) : null);
const champ = useTemplateRef<HTMLInputElement>('champ');
onMounted(() => { if (!q.value) champ.value?.focus(); });

const etat = ref<{ items: MediaSnapshot[]; chargement: boolean; erreurs: string[]; ancien: boolean }>({ items: [], chargement: false, erreurs: [], ancien: false });
let ac: AbortController | null = null;
let minuterie: ReturnType<typeof setTimeout> | undefined;

async function lancer() {
  ac?.abort();
  ac = new AbortController();
  const signal = ac.signal;
  const texte = q.value.trim();
  router.replace({ query: { ...(texte ? { q: texte } : {}), ...(type.value ? { type: type.value } : {}) } });
  etat.value = { ...etat.value, chargement: true, erreurs: [] };
  try {
    if (texte.length < 2) {
      // Sans recherche : rangées « À découvrir » (composant Catalogue).
      etat.value = { items: [], chargement: false, erreurs: [], ancien: false };
    } else if (type.value) {
      const r = await rechercher(type.value, texte, signal);
      etat.value = { items: r.items, chargement: false, erreurs: [], ancien: r.stale };
    } else {
      const r = await rechercherTout(texte, signal);
      etat.value = { items: classer(r.items, texte), chargement: false, erreurs: r.erreurs, ancien: false };
    }
  } catch (e) {
    if (e instanceof ApiError && e.kind === 'aborted') return;
    if (!signal.aborted) etat.value = { items: [], chargement: false, erreurs: [messageErreur(e)], ancien: false };
  }
}
// Mélange des sources : titre exact d'abord, puis la popularité implicite de chaque source (ordre d'origine).
function classer(items: MediaSnapshot[], texte: string) {
  const n = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const t = n(texte);
  const score = (m: MediaSnapshot, i: number) => {
    const titres = [m.title.romaji, m.title.english, m.title.native].filter(Boolean).map(x => n(x!));
    return (titres.some(x => x === t) ? 100 : titres.some(x => x.startsWith(t)) ? 40 : 0) + (m.averageScore ?? 50) / 10 - i * 1.5;
  };
  const rang = new Map<MediaType, number>();
  return items.map(m => { const i = rang.get(m.type) ?? 0; rang.set(m.type, i + 1); return { m, s: score(m, i) }; })
    .sort((a, b) => b.s - a.s).map(x => x.m);
}
watch(q, () => { clearTimeout(minuterie); minuterie = setTimeout(lancer, 350); });
// Lien vers la recherche depuis la recherche (même page) : on reprend le texte et la catégorie de l'adresse.
watch(() => route.query, nq => {
  if (typeof nq.q === 'string' && nq.q !== q.value.trim()) q.value = nq.q;
  const t = MEDIA_TYPES.includes(nq.type as MediaType) ? (nq.type as MediaType) : null;
  if (t !== type.value && (t || !nq.q)) type.value = t;
});
watch(type, lancer);
onMounted(lancer);
onBeforeUnmount(() => { ac?.abort(); clearTimeout(minuterie); });
const sansTexte = computed(() => q.value.trim().length < 2);
</script>

<template>
  <div class="page large">
    <h1 class="page-title">Rechercher</h1>
    <form class="recherche" role="search" @submit.prevent="lancer">
      <Icone nom="recherche" :taille="18" />
      <input ref="champ" v-model="q" type="search" placeholder="Film, série, anime, manga…" enterkeyhint="search" autocomplete="off" aria-label="Titre à rechercher">
      <button v-if="q" type="button" aria-label="Effacer" @click="q = ''"><Icone nom="fermer" :taille="16" /></button>
    </form>
    <div class="chips filtres">
      <button type="button" class="chip" :class="{ on: !type }" @click="type = null">Tout</button>
      <button v-for="t in MEDIA_TYPES" :key="t" type="button" class="chip" :class="{ on: type === t }" @click="type = t">
        <i class="pt" :style="{ background: TYPE_LABELS[t].couleur }" />{{ TYPE_LABELS[t].plusieurs }}
      </button>
    </div>

    <template v-if="sansTexte">
      <p class="label titre-liste">À découvrir · {{ TYPE_LABELS[type ?? 'MOVIE'].plusieurs }}</p>
      <Catalogue :type="type ?? 'MOVIE'" pour-toi />
    </template>
    <template v-else>
      <p class="label titre-liste">Résultats</p>
      <p v-for="e in etat.erreurs" :key="e" class="banner warn">{{ e }}</p>
      <p v-if="etat.ancien" class="banner">Résultats enregistrés (hors-ligne).</p>
      <ul class="grille" :class="{ charge: etat.chargement }" aria-live="polite">
        <li v-for="m in etat.items" :key="m.type + m.id"><CarteMedia :media="m" @ajouter="ouvrirAjout" /></li>
        <template v-if="etat.chargement && !etat.items.length"><li v-for="i in 9" :key="'f' + i" class="fantome" /></template>
      </ul>
      <div v-if="!etat.chargement && !etat.items.length && !etat.erreurs.length" class="vide">
        <Icone nom="recherche" :taille="32" />
        <p>Aucun résultat{{ type ? ` dans ${TYPE_LABELS[type].plusieurs.toLowerCase()}` : '' }}.</p>
      </div>
    </template>

    <p class="credits dim tiny">Films et séries : TMDB. Anime et manga : AniList. ScreenPilot utilise l’API TMDB mais n’est ni approuvé ni certifié par TMDB.</p>
  </div>
</template>

<route>
{ "meta": { "titre": "Recherche" } }
</route>

<style scoped>
.filtres { margin-top: 12px; }
.titre-liste { margin: 14px 4px 10px; }
.grille { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 16px 12px; transition: opacity .2s; }
.charge { opacity: .55; }
.fantome { aspect-ratio: 2 / 3.4; border-radius: 14px; background: var(--surface-2); animation: pulse 1.2s infinite; }
@keyframes pulse { 50% { opacity: .5; } }
.credits { margin-top: 28px; text-align: center; }
@media (min-width: 720px) { .grille { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 22px 16px; } }
</style>
