<script setup lang="ts">
import CarteImg from '@/components/CarteImg.vue';
import Icone from '@/components/Icone.vue';
import { useRift } from '@/stores/rift';
import { rechercher } from '@/core/recherche';
import { formatEuros } from '@/core/prix';

/** Toutes les cartes : recherche par nom ou numéro, filtre par extension, tri par valeur. */
const rift = useRift();
const route = useRoute();
const q = ref(String(route.query.q ?? ''));
const ext = ref<string>('');
const tri = ref<'valeur' | 'numero'>('valeur');
const extensions = computed(() => {
  const m = new Map<string, string>();
  for (const c of rift.donnees?.cartes ?? []) m.set(c.s, c.sn);
  return [...m].map(([s, sn]) => ({ s, sn, nb: rift.donnees!.cartes.filter(c => c.s === s).length })).filter(e => e.nb > 20).sort((a, b) => b.nb - a.nb);
});
const resultats = computed(() => {
  const toutes = rift.donnees?.cartes ?? [];
  let l = q.value.trim() ? rechercher(toutes, q.value) : toutes;
  if (ext.value) l = l.filter(c => c.s === ext.value);
  const v = (id: string) => rift.valeurMax(id);
  return [...l].sort((a, b) => (tri.value === 'valeur' ? v(b.id) - v(a.id) : a.s.localeCompare(b.s) || a.no.localeCompare(b.no)));
});
const affiches = ref(60);
watch([q, ext, tri], () => { affiches.value = 60; });
const recents = computed(() => rift.etat.scans.map(s => rift.carte(s.id)).filter(c => !!c).slice(0, 10));
</script>

<template>
  <div class="page">
    <p class="kicker">{{ rift.donnees?.cartes.length.toLocaleString('fr-FR') ?? '…' }} cartes</p>
    <h1 class="titre">Les <span class="or">cartes</span></h1>
    <label class="champ">
      <Icone nom="recherche" />
      <input v-model="q" class="input" type="search" placeholder="Nom ou numéro (ex. Jinx, 010, OGN 10)" aria-label="Rechercher une carte" autocomplete="off">
    </label>
    <div class="chips section">
      <button type="button" class="chip" :class="{ on: !ext }" @click="ext = ''">Toutes</button>
      <button v-for="e in extensions" :key="e.s" type="button" class="chip" :class="{ on: ext === e.s }" @click="ext = e.s">{{ e.sn }}</button>
    </div>
    <div class="row between section">
      <p class="small muted">{{ resultats.length.toLocaleString('fr-FR') }} résultat{{ resultats.length > 1 ? 's' : '' }}</p>
      <div class="seg-tri" role="radiogroup" aria-label="Tri">
        <button type="button" role="radio" :aria-checked="tri === 'valeur'" :class="{ on: tri === 'valeur' }" @click="tri = 'valeur'">Les plus chères</button>
        <button type="button" role="radio" :aria-checked="tri === 'numero'" :class="{ on: tri === 'numero' }" @click="tri = 'numero'">Par numéro</button>
      </div>
    </div>

    <section v-if="!q && !ext && recents.length" class="section">
      <p class="kicker">Derniers scans</p>
      <div class="recents">
        <router-link v-for="c in recents" :key="c.id" :to="`/carte/${c.id}`" class="recent"><CarteImg :src="c.img" :nom="c.n" class="mini" /><small class="num">{{ formatEuros(rift.valeurMax(c.id) >= 0 ? rift.valeurMax(c.id) : null) }}</small></router-link>
      </div>
    </section>

    <p v-if="!rift.donnees" class="muted section">{{ rift.erreur ?? 'Chargement des cartes…' }}</p>
    <ul v-else class="liste section">
      <li v-for="(c, k) in resultats.slice(0, affiches)" :key="c.id">
        <router-link :to="`/carte/${c.id}`" class="ligne-carte">
          <span v-if="tri === 'valeur' && !q && k < 3" class="rang num">{{ k + 1 }}</span>
          <CarteImg :src="c.img" :nom="c.n" decor class="vignette" />
          <span class="grow"><b>{{ c.n }}</b><small>{{ c.sn }} · {{ c.no }} · {{ c.r }}</small></span>
          <span class="prix-ligne num">{{ formatEuros(rift.valeurMax(c.id) >= 0 ? rift.valeurMax(c.id) : null) }}</span>
        </router-link>
      </li>
    </ul>
    <button v-if="resultats.length > affiches" type="button" class="btn plein section" @click="affiches += 60">Afficher plus</button>
    <p v-if="rift.donnees && !resultats.length" class="vide"><span class="gros">🔍</span><br>Aucune carte trouvée.</p>
  </div>
</template>

<style scoped>
.champ { position: relative; display: block; margin-top: 14px; }
.champ svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--dim); }
.champ .input { padding-left: 46px; }
.seg-tri { display: inline-grid; grid-auto-flow: column; gap: 2px; padding: 3px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); }
.seg-tri button { border: 0; background: none; padding: 6px 10px; border-radius: 9px; font-size: 12.5px; font-weight: 800; color: var(--muted); cursor: pointer; }
.seg-tri button.on { background: var(--surface-3); color: var(--text); }
.recents { display: flex; gap: 10px; overflow-x: auto; padding: 8px 0 4px; }
.recent { flex: none; display: grid; gap: 4px; justify-items: center; text-decoration: none; }
.recent .mini { width: 72px; border-radius: 6px; box-shadow: 0 0 0 1px var(--border); }
.recent small { font-weight: 800; color: var(--or-vif); font-size: 12px; }
.rang { width: 26px; height: 26px; flex: none; border-radius: 50%; display: grid; place-items: center; font-weight: 900; font-size: 13px; background: var(--or-grad); color: #1b1407; }
</style>
