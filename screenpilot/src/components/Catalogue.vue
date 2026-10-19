<script setup lang="ts">
import { ApiError } from '@/api/anilist';
import type { MediaSnapshot, MediaType } from '@/domain/types';
import { rangees, paysDe } from '@/lib/catalogue';
import { messageErreur } from '@/lib/sources';
import { chargerRecos } from '@/lib/recos';
import { ouvrirAjout } from '@/composables/useAjout';
import { useBiblio } from '@/stores/biblio';
import CarteMedia from './CarteMedia.vue';

/** Rangées « À découvrir » d'une catégorie, adaptées au pays réglé. */
const props = withDefaults(defineProps<{ type: MediaType; max?: number; pourToi?: boolean }>(), { max: 10, pourToi: false });
const biblio = useBiblio();
interface Etat { id: string; titre: string; items: MediaSnapshot[]; chargement: boolean; erreur: string | null }
const lignes = shallowRef<Etat[]>([]);
let ac: AbortController | null = null;

function charger() {
  ac?.abort();
  ac = new AbortController();
  const signal = ac.signal;
  const defs = rangees(props.type, paysDe(biblio.settings)).slice(0, props.max);
  // « Pour toi » : dès qu'un titre de la catégorie est dans la bibliothèque (vu, en cours ou à voir).
  if (props.pourToi && biblio.entries.some(e => e.type === props.type)) {
    defs.unshift({ id: 'pour-toi', titre: 'Pour toi', charger: async s => {
      const r = await chargerRecos(props.type, s);
      if (r.erreur) throw new Error(r.erreur);
      return { data: r.items.map(x => x.media), stale: false };
    } });
  }
  lignes.value = defs.map(d => ({ id: d.id, titre: d.titre, items: [], chargement: true, erreur: null }));
  defs.forEach((d, i) => d.charger(signal)
    .then(r => maj(i, { items: r.data.slice(0, 20), chargement: false }))
    .catch(e => { if (!(e instanceof ApiError && e.kind === 'aborted')) maj(i, { chargement: false, erreur: messageErreur(e) }); }));
}
function maj(i: number, p: Partial<Etat>) { lignes.value = lignes.value.map((l, j) => (j === i ? { ...l, ...p } : l)); }
watch(() => [props.type, paysDe(biblio.settings)], charger, { immediate: true });
onBeforeUnmount(() => ac?.abort());
// Une rangée vide (aucune sortie référencée) est masquée ; une erreur ne s'affiche qu'une fois.
const visibles = computed(() => lignes.value.filter(l => l.chargement || l.items.length));
const erreur = computed(() => (lignes.value.length && lignes.value.every(l => !l.chargement && !l.items.length) ? lignes.value.find(l => l.erreur)?.erreur ?? null : null));
</script>

<template>
  <div class="catalogue">
    <p v-if="erreur" class="banner warn">{{ erreur }}</p>
    <section v-for="l in visibles" :key="type + l.id" class="rangee">
      <h3>{{ l.titre }}</h3>
      <ul class="hscroll">
        <template v-if="l.chargement"><li v-for="i in 6" :key="i" class="fantome" /></template>
        <li v-for="m in l.items" :key="m.type + m.id"><CarteMedia :media="m" :badge="false" @ajouter="ouvrirAjout" /></li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.rangee + .rangee { margin-top: 18px; }
h3 { margin: 0 4px 10px; font-size: 16px; letter-spacing: -.01em; }
.fantome { height: 210px; border-radius: 14px; background: var(--surface-2); animation: pulse 1.2s infinite; }
@keyframes pulse { 50% { opacity: .5; } }
</style>
