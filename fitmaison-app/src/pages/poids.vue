<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { imc, libelleImc, peseesTriees, poidsMin } from '@/core/calculs';
import { PALIERS } from '@/core/programmes';
import { aujourdhui, dateCourte, kg } from '@/core/dates';
import { celebrer } from '@/composables/useCelebration';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import Icone from '@/components/Icone.vue';
import GraphPoids from '@/components/GraphPoids.vue';

const fit = useFit();
const p = computed(() => fit.profil!);
const pesees = computed(() => peseesTriees(fit.etat));
const b = computed(() => imc(p.value, fit.poids));
const min = computed(() => poidsMin(fit.etat));
const paliers = computed(() => [...new Set([...PALIERS.filter(m => m < p.value.startWeight && m > p.value.goalWeight), p.value.goalWeight])].sort((a, c) => c - a));
const valeur = ref('');
const date = ref(aujourdhui());
function ajouter() {
  try {
    const palier = fit.ajouterPesee(Number(valeur.value.replace(',', '.')), date.value);
    valeur.value = '';
    if (palier) celebrer(`🏅 Palier atteint : sous les ${palier} kg !`); else toast('Pesée enregistrée ✅', { type: 'ok' });
  } catch { toast('Poids invalide', { type: 'danger' }); }
}
async function supprimer(d: string) {
  if (fit.etat.weights.length <= 1) return toast('Garde au moins une pesée');
  if (await confirmer(`Supprimer la pesée du ${dateCourte(d)} ?`, { ok: 'Supprimer', annuler: 'Annuler' })) fit.supprimerPesee(d);
}
const historique = computed(() => [...pesees.value].reverse());
</script>

<template>
  <div class="page">
    <h1 class="page-title">Poids</h1>
    <form class="card pad" @submit.prevent="ajouter">
      <h3>Nouvelle pesée</h3>
      <div class="row">
        <input v-model="valeur" class="input" type="number" inputmode="decimal" step="0.1" min="40" max="300" :placeholder="kg(fit.poids)" required aria-label="Poids (kg)">
        <input v-model="date" class="input" type="date" :max="aujourdhui()" required aria-label="Date">
        <button class="btn primary" type="submit" aria-label="Ajouter"><Icone nom="plus" /></button>
      </div>
      <p class="tiny muted">Pèse-toi le matin à jeun, 1 à 2 fois par semaine suffit.</p>
    </form>

    <section class="card pad section">
      <div class="row between"><h3>Évolution</h3><span class="tiny muted legende"><i class="a" />poids <i class="b" />moyenne 7 j <i class="c" />objectif</span></div>
      <GraphPoids :pesees="pesees" :objectif="p.goalWeight" />
    </section>

    <section class="stats3 section">
      <div class="stat"><b class="num">{{ kg(p.startWeight - fit.poids) }}</b><span>kg perdus</span></div>
      <div class="stat"><b class="num">{{ b.toFixed(1) }}</b><span>IMC · {{ libelleImc(b) }}</span></div>
      <div class="stat"><b class="num">{{ fit.tendance ? kg(fit.tendance.parSemaine) : '–' }}</b><span>kg / semaine (4 sem.)</span></div>
    </section>

    <section class="card pad section">
      <h3>🏆 Paliers</h3>
      <div class="paliers">
        <div v-for="m in paliers" :key="m" class="palier" :class="{ gagne: min <= m }"><b>{{ min <= m ? '🏅' : '🔒' }}</b><span>{{ m === p.goalWeight ? 'Objectif ' : 'Sous ' }}{{ m }}</span></div>
      </div>
    </section>

    <section class="card pad section">
      <h3>Historique</h3>
      <ul class="histo">
        <li v-for="(x, k) in historique" :key="x.date">
          <span>{{ dateCourte(x.date) }}</span>
          <span class="row">
            <b class="num">{{ kg(x.kg) }} kg</b>
            <small v-if="historique[k + 1]" :class="x.kg - historique[k + 1]!.kg <= 0 ? 'good' : 'bad'">{{ x.kg - historique[k + 1]!.kg <= 0 ? '' : '+' }}{{ kg(x.kg - historique[k + 1]!.kg) }}</small>
            <button type="button" class="icon-btn petit" aria-label="Supprimer" @click="supprimer(x.date)"><Icone nom="fermer" :taille="14" /></button>
          </span>
        </li>
      </ul>
    </section>
  </div>
</template>

<route>
{ "meta": { "titre": "Poids" } }
</route>

<style scoped>
h3 { margin: 0 0 10px; font-size: 16px; }
.legende { display: flex; align-items: center; gap: 4px; }
.legende i { width: 10px; height: 3px; border-radius: 2px; margin-left: 6px; }
.legende .a { background: var(--brand); } .legende .b { background: var(--brand-3); } .legende .c { background: var(--good); }
.paliers { display: flex; flex-wrap: wrap; gap: 8px; }
.palier { display: grid; justify-items: center; padding: 8px 12px; border-radius: 14px; background: var(--surface-2); font-size: 12.5px; font-weight: 700; color: var(--muted); opacity: .7; }
.palier.gagne { opacity: 1; background: var(--brand-soft); color: var(--text); }
.palier b { font-size: 20px; }
.histo { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.histo li { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); }
.histo li:last-child { border-bottom: 0; }
.icon-btn.petit { width: 30px; height: 30px; border-radius: 10px; }
</style>
