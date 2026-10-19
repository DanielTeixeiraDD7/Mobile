<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { CONSEILS, REPAS_TYPES } from '@/core/programmes';
import { kg } from '@/core/dates';
import { toast } from '@/composables/useToast';
import Icone from '@/components/Icone.vue';
import Anneau from '@/components/graph/Anneau.vue';

const fit = useFit();
const n = computed(() => fit.nutrition!);
const jour = computed(() => fit.jourLu());
const mange = computed(() => jour.value.food.reduce((t, f) => t + f.kcal, 0));
const seances = computed(() => fit.etat.sessions.filter(s => s.date === fit.date).reduce((t, s) => t + s.kcal, 0));
const reste = computed(() => n.value.cible + seances.value - mange.value);
const ratio = computed(() => Math.min(1, mange.value / (n.value.cible + seances.value)));
const libelle = ref('');
const kcal = ref<number | ''>('');
function ajouter() {
  if (!kcal.value || kcal.value <= 0) return;
  fit.ajouterRepas(libelle.value, Number(kcal.value));
  libelle.value = ''; kcal.value = '';
}
function type(i: number) { const f = REPAS_TYPES[i]!; fit.ajouterRepas(f.label, f.kcal); toast(`+${f.kcal} kcal`); }
</script>

<template>
  <div class="page">
    <h1 class="page-title">Nutrition</h1>
    <section class="card pad bilan">
      <Anneau :ratio="ratio" :taille="128" :epaisseur="12" :couleur="reste >= 0 ? 'var(--brand)' : 'var(--bad)'" fond="var(--surface-3)">
        <b class="num">{{ Math.abs(reste) }}</b><small>{{ reste >= 0 ? 'kcal restantes' : 'kcal en trop' }}</small>
      </Anneau>
      <ul class="kv grow">
        <li><span>Objectif</span><b class="num">{{ n.cible }}</b></li>
        <li><span>Mangé</span><b class="num">{{ mange }}</b></li>
        <li><span>Séances</span><b class="num good">+{{ seances }}</b></li>
      </ul>
    </section>

    <section class="card pad section">
      <h3>Ajouter un repas</h3>
      <form class="row" @submit.prevent="ajouter">
        <input v-model="libelle" class="input" placeholder="Ex : poulet riz" maxlength="40" aria-label="Repas">
        <input v-model.number="kcal" class="input kcal" type="number" inputmode="numeric" min="1" max="5000" placeholder="kcal" aria-label="Calories">
        <button class="btn primary" type="submit" aria-label="Ajouter"><Icone nom="plus" /></button>
      </form>
      <div class="chips wrap types">
        <button v-for="(f, i) in REPAS_TYPES" :key="f.label" type="button" class="chip" @click="type(i)">{{ f.label }} <small class="dim">{{ f.kcal }}</small></button>
      </div>
      <ul v-if="jour.food.length" class="repas">
        <li v-for="(f, i) in jour.food" :key="i"><span>{{ f.label }}</span><span class="row"><b class="num">{{ f.kcal }}</b> kcal <button type="button" class="icon-btn petit" aria-label="Supprimer" @click="fit.retirerRepas(i)"><Icone nom="fermer" :taille="14" /></button></span></li>
      </ul>
    </section>

    <section class="card pad section">
      <h3>Tes repères quotidiens</h3>
      <ul class="kv">
        <li><span>🎯 Calories pour maigrir</span><b>{{ n.cible }} kcal</b></li>
        <li><span>🍗 Protéines</span><b>{{ n.proteines }} g</b></li>
        <li><span>💧 Eau</span><b>{{ n.eau.toLocaleString('fr-FR') }} L</b></li>
        <li><span>🔋 Dépense estimée (sans sport)</span><b>{{ n.tdee }} kcal</b></li>
        <li><span>📉 Perte attendue</span><b>~{{ kg(Math.max(0, n.perteHebdo)) }} kg / sem</b></li>
      </ul>
      <p class="tiny muted">Calcul Mifflin-St Jeor, déficit modéré (~650 kcal) pour une perte durable sans fonte musculaire. Recalculé automatiquement quand ton poids baisse.</p>
    </section>

    <section class="card pad section">
      <h3>Assiette type</h3>
      <div class="assiette"><div class="leg">½<br>Légumes</div><div class="prot">¼<br>Protéines</div><div class="fec">¼<br>Féculents</div></div>
      <ul class="conseils"><li v-for="c in CONSEILS.slice(0, 6)" :key="c">{{ c }}</li></ul>
    </section>
  </div>
</template>

<route>
{ "meta": { "titre": "Nutrition" } }
</route>

<style scoped>
h3 { margin: 0 0 10px; font-size: 16px; }
.bilan { display: flex; align-items: center; gap: 18px; }
.bilan b { font-size: 24px; display: block; }
.bilan small { font-size: 11px; color: var(--muted); font-weight: 700; }
.kcal { max-width: 96px; }
.types { margin-top: 10px; }
.repas { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 4px; }
.repas li { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
.icon-btn.petit { width: 30px; height: 30px; border-radius: 10px; }
.assiette { display: grid; grid-template-columns: 2fr 1fr 1fr; height: 90px; border-radius: 45px; overflow: hidden; text-align: center; font-weight: 800; font-size: 13px; color: #fff; }
.assiette > div { display: grid; place-content: center; }
.leg { background: #22a06b; } .prot { background: #e8541f; } .fec { background: #d4a017; }
.conseils { margin: 12px 0 0; padding-left: 18px; display: grid; gap: 6px; color: var(--muted); font-size: 14px; }
</style>
