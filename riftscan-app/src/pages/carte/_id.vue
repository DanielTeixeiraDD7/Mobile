<script setup lang="ts">
import CarteImg from '@/components/CarteImg.vue';
import Icone from '@/components/Icone.vue';
import BlocPrix from '@/components/BlocPrix.vue';
import ChoixFinition from '@/components/ChoixFinition.vue';
import Courbe from '@/components/Courbe.vue';
import { useRift } from '@/stores/rift';
import { formatEuros, lienCardmarket } from '@/core/prix';
import type { Finition } from '@/core/types';

const route = useRoute();
const router = useRouter();
const rift = useRift();
const id = computed(() => String(route.params.id));
const carte = computed(() => rift.carte(id.value));
const finition = ref<Finition>('N');
watchEffect(() => { if (rift.donnees) finition.value = rift.finitionDefaut(id.value); });
const histo = computed(() => rift.donnees?.histo.p[id.value]?.[finition.value] ?? []);
const variantes = computed(() => (carte.value ? rift.variantes(carte.value) : []));
function retour() { if (history.length > 1) router.back(); else router.push('/recherche'); }
</script>

<template>
  <div class="page">
    <div class="row between">
      <button type="button" class="icone-btn" aria-label="Retour" @click="retour"><Icone nom="retour" /></button>
    </div>
    <p v-if="!rift.donnees" class="muted section">Chargement…</p>
    <p v-else-if="!carte" class="vide">Carte introuvable.</p>
    <template v-else>
      <div class="hero section">
        <CarteImg :src="carte.img" :nom="carte.n" taille="in_1000x1000" class="grande" />
        <div class="infos">
          <p class="kicker">{{ carte.sn }} · {{ carte.no }}</p>
          <h1 class="titre nom">{{ carte.n }}</h1>
          <div class="tags">
            <span class="tag">{{ carte.r }}</span>
            <span v-if="carte.t" class="tag">{{ carte.t }}</span>
            <span v-for="dm in carte.d" :key="dm" class="tag">{{ dm }}</span>
          </div>
          <div class="section"><ChoixFinition :id="carte.id" v-model="finition" /></div>
        </div>
      </div>

      <section class="carte-ui pad section">
        <BlocPrix :id="carte.id" :finition="finition" />
        <div class="section"><p class="tiny muted titre-c">Prix du marché sur {{ rift.donnees.histo.jours.length }} jour{{ rift.donnees.histo.jours.length > 1 ? 's' : '' }}</p><Courbe :valeurs="histo" /></div>
      </section>

      <section class="carte-ui pad section">
        <div class="row between">
          <div><p class="kicker">Ma collection</p><p class="small muted">{{ rift.qte(carte.id, finition) }} exemplaire{{ rift.qte(carte.id, finition) > 1 ? 's' : '' }} en {{ finition === 'F' ? 'foil' : 'normale' }}</p></div>
          <div class="row">
            <button type="button" class="icone-btn" aria-label="Retirer un exemplaire" :disabled="!rift.qte(carte.id, finition)" @click="rift.ajouter(carte.id, finition, -1)"><Icone nom="moins" /></button>
            <b class="qte num">{{ rift.qte(carte.id, finition) }}</b>
            <button type="button" class="icone-btn plus" aria-label="Ajouter un exemplaire" @click="rift.ajouter(carte.id, finition)"><Icone nom="plus" /></button>
          </div>
        </div>
      </section>

      <div class="liens section">
        <a :href="carte.url" target="_blank" rel="noopener" class="btn"><Icone nom="externe" :taille="18" /> Voir sur TCGplayer</a>
        <a :href="lienCardmarket(carte.n)" target="_blank" rel="noopener" class="btn"><Icone nom="externe" :taille="18" /> Chercher sur Cardmarket</a>
      </div>

      <section v-if="variantes.length" class="section">
        <p class="kicker">Autres versions</p>
        <ul class="liste section">
          <li v-for="v in variantes" :key="v.id">
            <router-link :to="`/carte/${v.id}`" class="ligne-carte">
              <CarteImg :src="v.img" :nom="v.n" decor class="vignette" />
              <span class="grow"><b>{{ v.n }}</b><small>{{ v.sn }} · {{ v.no }} · {{ v.r }}</small></span>
              <span class="prix-ligne num">{{ formatEuros(rift.valeurMax(v.id) >= 0 ? rift.valeurMax(v.id) : null) }}</span>
            </router-link>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.hero { display: grid; grid-template-columns: minmax(0, 46%) 1fr; gap: 18px; align-items: start; }
.grande { width: 100%; border-radius: 12px; box-shadow: 0 24px 50px -16px rgba(0, 0, 0, 0.9), 0 0 0 1px var(--border-2), 0 0 60px -20px rgba(10, 200, 185, 0.5); }
.nom { font-size: 26px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.titre-c { margin: 0 0 6px; }
.qte { min-width: 28px; text-align: center; font-size: 20px; }
.icone-btn.plus { background: var(--or-grad); color: #1b1407; border-color: transparent; }
.icone-btn:disabled { opacity: 0.4; }
.liens { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.liens .btn { font-size: 14px; padding: 0 10px; }
@media (max-width: 420px) { .hero { grid-template-columns: 1fr; } .grande { width: 70%; justify-self: center; } }
</style>
