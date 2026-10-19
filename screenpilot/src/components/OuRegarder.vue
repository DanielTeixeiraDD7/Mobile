<script setup lang="ts">
import { ApiError } from '@/api/anilist';
import type { Plateforme } from '@/api/tmdb';
import { PAYS, type MediaSnapshot, type Pays } from '@/domain/types';
import { NOM_PAYS, paysDe } from '@/lib/catalogue';
import { liensOfficiels, ouRegarder, type OuRegarder } from '@/lib/streaming';
import { useBiblio } from '@/stores/biblio';

/** « Où regarder » selon le pays (le tien par défaut ; les autres pour comparer avec un ami). */
const props = defineProps<{ media: MediaSnapshot; liens?: { site: string; url: string; langue: string | null; couleur: string | null }[] }>();
const biblio = useBiblio();
const pays = ref<Pays>(paysDe(biblio.settings));
const donnees = shallowRef<OuRegarder | null>(null);
const chargement = ref(false);
const erreur = ref(false);
let ac: AbortController | null = null;

async function charger() {
  ac?.abort();
  ac = new AbortController();
  donnees.value = null; erreur.value = false;
  if (props.media.type === 'MANGA') return;
  chargement.value = true;
  try { donnees.value = await ouRegarder(props.media, ac.signal); }
  catch (e) { if (!(e instanceof ApiError && e.kind === 'aborted')) erreur.value = true; }
  finally { chargement.value = false; }
}
watch(() => `${props.media.type}:${props.media.id}`, charger, { immediate: true });
onBeforeUnmount(() => ac?.abort());

const dispo = computed(() => donnees.value?.parPays[pays.value] ?? null);
const groupes = computed(() => {
  const d = dispo.value;
  if (!d) return [];
  return ([['Abonnement', d.abonnement], ['Gratuit', d.gratuit], ['Location', d.location], ['Achat', d.achat]] as [string, Plateforme[]][])
    .map(([g, l]) => [g, sansVariantes(l)] as [string, Plateforme[]])
    .filter(([, l]) => l.length)
    // La location et l'achat proposent souvent les mêmes boutiques : on n'affiche l'achat que s'il apporte du neuf.
    .filter(([g, l], _, tous) => g !== 'Achat' || l.some(p => !tous.find(([x]) => x === 'Location')?.[1].some(q => q.id === p.id)));
});
/** Variantes d'une même plateforme (offre avec pub, chaîne via Amazon / Apple) : gardées seulement si seules. */
const VARIANTE = /( Standard)? with Ads$| (Amazon|Apple TV|Roku Premium) Channel$/i;
function sansVariantes(l: Plateforme[]) {
  const principales = l.filter(p => !VARIANTE.test(p.nom));
  return principales.length ? principales : l;
}
const echecs = ref(new Set<number>());
// Anime : les sites AniList (souvent américains) ne servent que si aucune plateforme n'est connue pour le pays.
const officiels = computed(() => (props.media.type === 'ANIME' && groupes.value.length ? [] : liensOfficiels(props.liens ?? [], pays.value)));
const titre = computed(() => (props.media.type === 'MANGA' ? 'Où lire' : 'Où regarder'));
</script>

<template>
  <section class="section ou">
    <div class="section-head"><h2>{{ titre }}</h2></div>
    <div class="card pad">
      <div v-if="media.type !== 'MANGA'" class="chips pays" role="tablist" aria-label="Pays">
        <button v-for="p in PAYS" :key="p" type="button" role="tab" class="chip" :aria-selected="pays === p" :class="{ on: pays === p }" @click="pays = p">{{ NOM_PAYS[p].nom }}</button>
      </div>

      <p v-if="chargement" class="small muted">Recherche des plateformes…</p>
      <template v-else>
        <div v-for="[nom, liste] in groupes" :key="nom" class="groupe">
          <span class="label">{{ nom }}</span>
          <div class="plateformes">
            <a v-for="p in liste.slice(0, 10)" :key="p.id" :href="dispo!.lien ?? undefined" target="_blank" rel="noopener noreferrer" class="plateforme" :title="p.nom">
              <img v-if="p.logo && !echecs.has(p.id)" :src="p.logo" :alt="''" loading="lazy" width="40" height="40" @error="echecs = new Set([...echecs, p.id])">
              <i v-else class="sans-logo">{{ p.nom[0] }}</i>
              <span>{{ p.nom }}</span>
            </a>
          </div>
        </div>
        <p v-if="media.type !== 'MANGA' && !groupes.length && !erreur" class="small muted">
          Pas disponible en streaming {{ NOM_PAYS[pays].en }} pour le moment<template v-if="media.type === 'ANIME' && !donnees"> (titre introuvable dans le catalogue des plateformes)</template>.
        </p>
        <p v-if="erreur" class="small muted">Plateformes indisponibles pour le moment (hors-ligne ?).</p>
        <p v-if="donnees?.correspondance && groupes.length" class="tiny dim correspondance">D’après la série « {{ donnees.correspondance }} » (toutes saisons).</p>

        <div v-if="officiels.length" class="groupe">
          <span class="label">{{ media.type === 'MANGA' ? 'Lecture officielle' : 'Sites officiels' }}</span>
          <div class="liens">
            <a v-for="l in officiels" :key="l.url" :href="l.url" target="_blank" rel="noopener noreferrer" class="chip">
              <i class="pt" :style="{ background: l.couleur ?? 'var(--dim)' }" />{{ l.site }}<small v-if="l.langue" class="dim">{{ l.langue === 'French' ? 'FR' : l.langue === 'Portuguese' ? 'PT' : l.langue === 'English' ? 'EN' : l.langue }}</small>
            </a>
          </div>
        </div>
        <p v-if="media.type === 'MANGA' && !officiels.length" class="small muted">Aucun site de lecture officiel connu pour ce manga.</p>
      </template>

      <p class="tiny dim source">{{ media.type === 'MANGA' ? 'Liens : AniList.' : 'Disponibilités : JustWatch (via TMDB), peuvent varier.' }}<template v-if="media.type === 'ANIME' && officiels.length"> Sites officiels : AniList, sans garantie pour ton pays.</template></p>
    </div>
  </section>
</template>

<style scoped>
.pays { margin: -4px -18px 10px; padding-left: 18px; padding-right: 18px; }
.groupe + .groupe { margin-top: 14px; }
.groupe .label { display: block; margin-bottom: 8px; }
.plateformes { display: flex; flex-wrap: wrap; gap: 10px; }
.plateforme { display: grid; justify-items: center; gap: 4px; width: 66px; color: var(--muted); text-decoration: none; font-size: 11px; font-weight: 700; text-align: center; line-height: 1.2; }
.plateforme img { width: 46px; height: 46px; border-radius: 12px; box-shadow: 0 4px 12px -6px rgba(0, 0, 0, .6); }
.plateforme span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sans-logo { width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: var(--surface-3); color: var(--text); font-style: normal; font-size: 18px; font-weight: 850; }
.correspondance { margin-top: 10px; }
.liens { display: flex; flex-wrap: wrap; gap: 6px; }
.liens small { font-size: 11px; font-weight: 800; }
.source { margin: 14px 0 0; }
p { margin: 0; }
</style>
