<script setup lang="ts">
import { EXERCICES } from '@/core/exercices';
import { SEANCES, TYPES } from '@/core/programmes';
import { useFit } from '@/stores/fit';
import Icone from '@/components/Icone.vue';
import GuideExercice from '@/components/GuideExercice.vue';

const route = useRoute();
const router = useRouter();
const fit = useFit();
const ex = computed(() => EXERCICES[String(route.params.id)]);
const favori = computed(() => !!ex.value && (fit.etat.favoris ?? []).includes(ex.value.id));
// Séances qui contiennent cet exercice (et à quel niveau).
const dans = computed(() => {
  const id = ex.value?.id;
  if (!id) return [];
  return TYPES.flatMap(t => {
    const c = SEANCES[t].circuit;
    if (!c) return [];
    const niv = ([1, 2, 3] as const).filter(n => c[n].includes(id));
    return niv.length ? [{ t, niv }] : [];
  });
});
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button type="button" class="icon-btn" aria-label="Retour" @click="router.back()"><Icone nom="retour" /></button>
      <span class="grow" />
      <button v-if="ex" type="button" class="icon-btn" :aria-pressed="favori" :aria-label="favori ? 'Retirer des favoris' : 'Ajouter aux favoris'" :class="{ fav: favori }" @click="fit.favori(ex.id)"><Icone nom="etoile" /></button>
    </div>
    <template v-if="ex">
      <h1 class="page-title">{{ ex.icone }} {{ ex.nom }}</h1>
      <p class="muted resume">{{ ex.resume }}</p>
      <GuideExercice :ex="ex" @ouvrir="id => router.push(`/exercices/${id}`)" />
      <section v-if="dans.length" class="section">
        <h3>Dans tes séances</h3>
        <div class="chips wrap">
          <router-link v-for="d in dans" :key="d.t" :to="`/seance/${d.t}`" class="chip">{{ SEANCES[d.t].icone }} {{ SEANCES[d.t].nom }} <small class="dim">niv. {{ d.niv.join(', ') }}</small></router-link>
        </div>
      </section>
    </template>
    <p v-else class="vide">Exercice introuvable.</p>
  </div>
</template>

<route>
{ "meta": { "titre": "Exercice" } }
</route>

<style scoped>
.page-title { margin-bottom: 4px; }
.resume { margin: 0 4px 14px; }
.fav { color: var(--brand-3); }
.fav :deep(path) { fill: currentColor; }
h3 { margin: 0 0 8px; }
</style>
