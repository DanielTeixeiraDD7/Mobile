<script setup lang="ts">
import { CATEGORIES, EXERCICES, type Categorie } from '@/core/exercices';
import { useFit } from '@/stores/fit';
import Icone from '@/components/Icone.vue';
import Figurine from '@/components/Figurine.vue';

/** Bibliothèque : tous les exercices, avec démonstration animée. */
const fit = useFit();
const route = useRoute();
const q = ref('');
const cat = ref<Categorie | 'favoris' | null>((route.query.cat as Categorie) ?? null);
const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const liste = computed(() => {
  const t = norm(q.value.trim());
  const favoris = new Set(fit.etat.favoris ?? []);
  return Object.values(EXERCICES)
    .filter(e => !cat.value || (cat.value === 'favoris' ? favoris.has(e.id) : e.cat === cat.value))
    .filter(e => !t || norm(`${e.nom} ${e.muscles} ${e.cat} ${e.resume}`).includes(t));
});
const vus = computed(() => new Set(fit.etat.vus ?? []));
const remplacements = computed(() => Object.entries(fit.etat.remplacements ?? {}));
</script>

<template>
  <div class="page large">
    <h1 class="page-title">Exercices</h1>
    <p class="intro muted">Touche un exercice pour voir la démonstration, les étapes, les erreurs à éviter et ce que tu dois sentir.</p>

    <label class="recherche">
      <Icone nom="recherche" :taille="18" />
      <input v-model="q" type="search" placeholder="Squat, dos, gainage…" enterkeyhint="search">
      <button v-if="q" type="button" aria-label="Effacer" @click="q = ''"><Icone nom="fermer" :taille="16" /></button>
    </label>
    <div class="chips filtres">
      <button type="button" class="chip" :class="{ on: !cat }" @click="cat = null">Tous</button>
      <button type="button" class="chip" :class="{ on: cat === 'favoris' }" @click="cat = 'favoris'"><Icone nom="etoile" :taille="14" /> Favoris</button>
      <button v-for="c in CATEGORIES" :key="c" type="button" class="chip" :class="{ on: cat === c }" @click="cat = c">{{ c }}</button>
    </div>

    <div v-if="remplacements.length" class="banner remplacements">
      Dans tes séances, tu fais la version plus facile de :
      <span v-for="[de, par] in remplacements" :key="de" class="rempl">{{ EXERCICES[de]?.nom }} → {{ EXERCICES[par]?.nom }} <button type="button" class="lien small" @click="fit.annulerRemplacement(de)">revenir</button></span>
    </div>

    <ul class="grille">
      <li v-for="e in liste" :key="e.id">
        <router-link :to="`/exercices/${e.id}`" class="card ex">
          <span class="scene"><Figurine :anim="e.anim" :taille="128" /></span>
          <b>{{ e.nom }}</b>
          <small>{{ e.muscles }}</small>
          <span v-if="vus.has(e.id)" class="fait" title="Déjà fait en séance"><Icone nom="check" :taille="12" :epaisseur="3" /></span>
        </router-link>
      </li>
    </ul>
    <p v-if="!liste.length" class="vide">{{ cat === 'favoris' ? 'Aucun favori : touche l’étoile sur un exercice.' : 'Aucun exercice ne correspond.' }}</p>
  </div>
</template>

<route>
{ "meta": { "titre": "Exercices" } }
</route>

<style scoped>
.intro { margin: -8px 4px 12px; }
.filtres { margin-top: 10px; }
.remplacements { display: grid; gap: 4px; }
.rempl { font-weight: 700; color: var(--text); }
.grille { list-style: none; margin: 12px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.ex { position: relative; display: grid; justify-items: center; gap: 2px; padding: 8px 8px 12px; text-align: center; color: inherit; text-decoration: none; height: 100%; }
.scene { margin: -4px 0 -2px; }
.ex b { font-size: 14px; line-height: 1.25; }
.ex small { font-size: 11.5px; color: var(--muted); line-height: 1.3; }
.fait { position: absolute; top: 8px; right: 8px; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; background: var(--good); color: #fff; }
</style>
