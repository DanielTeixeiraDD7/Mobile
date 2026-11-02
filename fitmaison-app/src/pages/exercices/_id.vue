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
const vu = computed(() => !!ex.value && (fit.etat.vus ?? []).includes(ex.value.id));
/** Intensité lisible à partir du MET (repère du Compendium des activités physiques). */
const intensite = computed(() => {
  const m = ex.value?.met ?? 0;
  return m < 3 ? { l: 'Doux', n: 1 } : m < 6 ? { l: 'Modéré', n: 2 } : { l: 'Soutenu', n: 3 };
});
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
function retour() { if (history.length > 1) router.back(); else router.push('/exercices'); }
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button type="button" class="icon-btn" aria-label="Retour" @click="retour"><Icone nom="retour" /></button>
      <span class="grow" />
      <button v-if="ex" type="button" class="icon-btn" :aria-pressed="favori" :aria-label="favori ? 'Retirer des favoris' : 'Ajouter aux favoris'" :class="{ fav: favori }" @click="fit.favori(ex.id)"><Icone nom="etoile" /></button>
    </div>
    <template v-if="ex">
      <header class="tete">
        <p class="kicker">{{ ex.cat }}<template v-if="vu"> · déjà fait ✓</template></p>
        <h1 class="page-title">{{ ex.nom }}</h1>
        <p class="resume">{{ ex.resume }}</p>
        <div class="tags">
          <span class="tag" title="Intensité"><i v-for="k in 3" :key="k" class="barre" :class="{ on: k <= intensite.n }" />{{ intensite.l }}</span>
          <span v-if="ex.unilateral" class="tag">Un côté puis l’autre</span>
          <span v-if="ex.tenue" class="tag">Position tenue</span>
          <span v-if="!ex.materiel.length" class="tag">Sans matériel</span>
        </div>
      </header>
      <GuideExercice :ex="ex" @ouvrir="id => router.push(`/exercices/${id}`)" />
      <section v-if="dans.length" class="section">
        <div class="section-head"><h2>Dans tes séances</h2></div>
        <div class="chips wrap">
          <router-link v-for="d in dans" :key="d.t" :to="`/seance/${d.t}`" class="chip">{{ SEANCES[d.t].icone }} {{ SEANCES[d.t].nom }} <small>niv. {{ d.niv.join(', ') }}</small></router-link>
        </div>
      </section>
    </template>
    <div v-else class="vide">
      <span class="vide-ic"><Icone nom="recherche" :taille="28" /></span>
      <b>Exercice introuvable</b>
      <router-link to="/exercices" class="btn">Voir tous les exercices</router-link>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Exercice" } }
</route>

<style scoped>
.tete { margin: 0 2px 16px; }
.tete .page-title { margin: 4px 0 8px; }
.resume { margin: 0 0 12px; color: var(--muted); font-size: 16px; max-width: 60ch; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tags .tag { padding: 5px 10px; }
.barre { display: inline-block; width: 4px; height: 10px; border-radius: 2px; background: var(--border-2); margin-right: 1px; }
.barre:nth-of-type(2) { height: 12px; } .barre:nth-of-type(3) { height: 14px; margin-right: 5px; }
.barre.on { background: var(--accent); }
.fav { color: var(--brand-3); }
.fav :deep(path) { fill: currentColor; }
</style>
