<script setup lang="ts">
import CarteImg from '@/components/CarteImg.vue';
import Icone from './Icone.vue';
import BlocPrix from './BlocPrix.vue';
import ChoixFinition from './ChoixFinition.vue';
import { useRift } from '@/stores/rift';
import type { Candidat } from '@/core/empreinte';
import type { Finition } from '@/core/types';

/** Résultat d'un scan : la carte reconnue, sa valeur, et les autres possibilités si ce n'est pas la bonne. */
const props = defineProps<{ candidats: Candidat[] }>();
const emit = defineEmits<{ fermer: [] }>();
const rift = useRift();
const choisi = ref(props.candidats[0]!.id);
const carte = computed(() => rift.carte(choisi.value)!);
const finition = ref<Finition>(rift.finitionDefaut(choisi.value));
watch(choisi, id => { finition.value = rift.finitionDefaut(id); });
// Autres possibilités : les autres candidats, puis les autres versions de la même carte.
const autres = computed(() => {
  const ids = new Set([...props.candidats.map(c => c.id), ...rift.variantes(rift.carte(props.candidats[0]!.id)!).map(c => c.id)]);
  ids.delete(choisi.value);
  return [...ids].map(id => rift.carte(id)).filter(c => !!c).slice(0, 8);
});
const ajoute = ref(false);
function ajouter() { rift.ajouter(choisi.value, finition.value); ajoute.value = true; navigator.vibrate?.(15); setTimeout(() => (ajoute.value = false), 1600); }
</script>

<template>
  <div class="res">
    <div class="poignee" aria-hidden="true" />
    <div class="haut">
      <CarteImg :src="carte.img" :nom="carte.n" taille="400w" class="img" />
      <div class="grow">
        <p class="kicker">{{ carte.sn }} · {{ carte.no }}</p>
        <h2 class="nom">{{ carte.n }}</h2>
        <p class="tiny muted">{{ carte.r }}<span v-if="carte.t"> · {{ carte.t }}</span></p>
        <div class="section"><ChoixFinition :id="carte.id" v-model="finition" /></div>
      </div>
    </div>
    <BlocPrix :id="carte.id" :finition="finition" class="section" />
    <div class="boutons section">
      <button type="button" class="btn or" @click="ajouter"><Icone :nom="ajoute ? 'check' : 'plus'" /> {{ ajoute ? 'Ajoutée' : 'Ma collection' }}<span v-if="rift.qte(carte.id, finition)" class="num"> ({{ rift.qte(carte.id, finition) }})</span></button>
      <router-link :to="`/carte/${carte.id}`" class="btn">Fiche détaillée</router-link>
    </div>
    <section v-if="autres.length" class="section">
      <p class="kicker">Ce n’est pas la bonne carte ?</p>
      <div class="autres">
        <button v-for="a in autres" :key="a.id" type="button" class="autre" @click="choisi = a.id">
          <CarteImg :src="a.img" :nom="a.n" class="mini" />
          <small>{{ a.s }} {{ a.no.split('/')[0] }}</small>
        </button>
      </div>
    </section>
    <button type="button" class="btn cyan plein section" @click="emit('fermer')"><Icone nom="scan" /> Scanner une autre carte</button>
  </div>
</template>

<style scoped>
.poignee { width: 44px; height: 5px; border-radius: 3px; background: var(--surface-3); margin: -6px auto 14px; }
.haut { display: flex; gap: 16px; align-items: flex-start; }
.img { width: 132px; height: auto; border-radius: 8px; flex: none; box-shadow: 0 16px 34px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px var(--border-2); }
.nom { margin: 4px 0 2px; font-size: 22px; line-height: 1.15; font-weight: 900; }
.boutons { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.autres { display: flex; gap: 10px; overflow-x: auto; padding: 8px 0 4px; }
.autre { flex: none; display: grid; gap: 4px; justify-items: center; padding: 0; border: 0; background: none; cursor: pointer; }
.autre .mini { width: 70px; height: auto; border-radius: 5px; box-shadow: 0 0 0 1px var(--border); }
.autre small { font-size: 11px; color: var(--muted); font-weight: 700; }
</style>
