<script setup lang="ts">
import { CATEGORIES, EXERCICES, type Categorie } from '@/core/exercices';
import { useFit } from '@/stores/fit';
import Icone from '@/components/Icone.vue';
import Figurine from '@/components/Figurine.vue';

/** Bibliothèque : tous les exercices, avec démonstration animée. */
const fit = useFit();
const route = useRoute();
const router = useRouter();
const q = ref('');
type Filtre = Categorie | 'favoris' | null;
const lireCat = (): Filtre => (typeof route.query.cat === 'string' ? (route.query.cat as Categorie) : null);
const cat = ref<Filtre>(lireCat());
watch(() => route.query.cat, () => { cat.value = lireCat(); });
function choisir(c: Filtre) {
  cat.value = c;
  router.replace({ query: c && c !== 'favoris' ? { cat: c } : {} });
}

/** Couleur et pictogramme par catégorie (les catégories inconnues gardent la couleur par défaut). */
const STYLE_CAT: Record<string, { c: string; e: string }> = {
  'Échauffement': { c: 'var(--flamme)', e: '🔥' }, Cardio: { c: 'var(--cardio)', e: '❤️' }, Jambes: { c: 'var(--accent)', e: '🦵' },
  Fessiers: { c: 'var(--force)', e: '🍑' }, 'Haut du corps': { c: 'var(--eau)', e: '💪' }, Dos: { c: 'var(--calme)', e: '🧍' },
  Gainage: { c: 'var(--pause)', e: '🧱' }, 'Étirement': { c: 'var(--calme)', e: '🧘' }, Bureau: { c: 'var(--pause)', e: '🪑' }, Football: { c: 'var(--accent)', e: '⚽' },
};
const styleCat = (c: string) => STYLE_CAT[c] ?? { c: 'var(--accent)', e: '•' };

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const favoris = computed(() => new Set(fit.etat.favoris ?? []));
const liste = computed(() => {
  const t = norm(q.value.trim());
  return Object.values(EXERCICES)
    .filter(e => !cat.value || (cat.value === 'favoris' ? favoris.value.has(e.id) : e.cat === cat.value))
    .filter(e => !t || norm(`${e.nom} ${e.muscles} ${e.cat} ${e.resume}`).includes(t));
});
const compte = (c: Categorie) => Object.values(EXERCICES).filter(e => e.cat === c).length;
const vus = computed(() => new Set(fit.etat.vus ?? []));
const remplacements = computed(() => Object.entries(fit.etat.remplacements ?? {}));
</script>

<template>
  <div class="page large">
    <header class="page-head">
      <div class="grow">
        <p class="kicker">Bibliothèque · {{ Object.keys(EXERCICES).length }} exercices</p>
        <h1 class="page-title">Exercices</h1>
        <p class="page-sub">Touche un exercice : démo animée, étapes, erreurs à éviter et ce que tu dois sentir.</p>
      </div>
    </header>

    <div class="outils">
      <label class="recherche">
        <Icone nom="recherche" :taille="20" />
        <span class="sr-only">Rechercher un exercice</span>
        <input v-model="q" type="search" placeholder="Squat, dos, ballon, nuque…" enterkeyhint="search">
        <button v-if="q" type="button" aria-label="Effacer la recherche" @click="q = ''"><Icone nom="fermer" :taille="16" /></button>
      </label>
      <div class="chips filtres" role="group" aria-label="Filtrer par catégorie">
        <button type="button" class="chip" :class="{ on: !cat }" :aria-pressed="!cat" @click="choisir(null)">Tous</button>
        <button type="button" class="chip" :class="{ on: cat === 'favoris' }" :aria-pressed="cat === 'favoris'" @click="choisir('favoris')"><Icone nom="etoile" :taille="14" /> Favoris <small v-if="favoris.size">{{ favoris.size }}</small></button>
        <button v-for="c in CATEGORIES" :key="c" type="button" class="chip" :class="{ on: cat === c }" :aria-pressed="cat === c" @click="choisir(c)">
          <span aria-hidden="true">{{ styleCat(c).e }}</span> {{ c }} <small>{{ compte(c) }}</small>
        </button>
      </div>
    </div>

    <div v-if="remplacements.length" class="banner info remplacements">
      <Icone nom="echange" :taille="18" />
      <div>
        Dans tes séances, tu fais la version plus facile de :
        <span v-for="[de, par] in remplacements" :key="de" class="rempl">{{ EXERCICES[de]?.nom }} → {{ EXERCICES[par]?.nom }} <button type="button" class="lien small" @click="fit.annulerRemplacement(de)">revenir</button></span>
      </div>
    </div>

    <ul class="grille">
      <li v-for="e in liste" :key="e.id">
        <router-link :to="`/exercices/${e.id}`" class="card ex" :style="{ '--cat': styleCat(e.cat).c }">
          <span class="scene"><Figurine :anim="e.anim" :taille="132" /></span>
          <span class="infos">
            <span class="cat">{{ e.cat }}</span>
            <b>{{ e.nom }}</b>
            <small class="clamp2">{{ e.muscles }}</small>
          </span>
          <span v-if="favoris.has(e.id)" class="fav" aria-label="Favori"><Icone nom="etoile" :taille="13" /></span>
          <span v-if="vus.has(e.id)" class="fait" title="Déjà fait en séance" aria-label="Déjà fait"><Icone nom="check" :taille="12" :epaisseur="3" /></span>
        </router-link>
      </li>
    </ul>
    <div v-if="!liste.length" class="vide">
      <span class="vide-ic"><Icone :nom="cat === 'favoris' ? 'etoile' : 'recherche'" :taille="28" /></span>
      <b>{{ cat === 'favoris' ? 'Aucun favori' : 'Rien trouvé' }}</b>
      <p>{{ cat === 'favoris' ? 'Touche l’étoile sur un exercice pour le retrouver ici.' : 'Essaie un autre mot ou une autre catégorie.' }}</p>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Exercices" } }
</route>

<style scoped>
.outils { display: grid; gap: 12px; }
.filtres { margin-top: 0; }
.remplacements { margin-top: 12px; }
.remplacements > div { display: grid; gap: 4px; }
.rempl { font-weight: 800; color: var(--text); }
.grille { list-style: none; margin: 14px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(164px, 1fr)); gap: 12px; }
.ex { position: relative; display: flex; flex-direction: column; height: 100%; overflow: hidden; border-radius: 22px; }
.ex:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.scene {
  display: grid; place-items: center; padding: 6px 0 0; height: 140px;
  background: radial-gradient(80% 80% at 50% 85%, color-mix(in srgb, var(--cat) 22%, transparent), transparent 70%), var(--surface-2);
  border-bottom: 1px solid var(--border);
}
.infos { display: grid; gap: 2px; padding: 10px 12px 14px; }
.cat { font-size: 10.5px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; color: var(--cat); }
.ex b { font-size: 15px; line-height: 1.2; font-weight: 800; }
.ex small { font-size: 12.5px; color: var(--muted); line-height: 1.3; }
.fait, .fav { position: absolute; top: 10px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; }
.fait { right: 10px; background: var(--volt); color: var(--on-volt); }
.fav { left: 10px; background: var(--surface); color: var(--brand-3); box-shadow: var(--shadow-sm); }
.fav :deep(path) { fill: currentColor; }
@media (min-width: 992px) {
  .grille { grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; }
  .scene { height: 160px; }
  .filtres { flex-wrap: wrap; overflow: visible; }
}
</style>
