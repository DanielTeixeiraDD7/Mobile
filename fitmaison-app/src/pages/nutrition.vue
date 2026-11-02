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
  toast(`+${Math.round(Number(kcal.value))} kcal`);
  libelle.value = ''; kcal.value = '';
}
function type(i: number) { const f = REPAS_TYPES[i]!; fit.ajouterRepas(f.label, f.kcal); toast(`+${f.kcal} kcal · ${f.label}`); }
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div class="grow">
        <p class="kicker">Carburant</p>
        <h1 class="page-title">Nutrition</h1>
      </div>
    </header>

    <div class="cols-desk">
      <div>
        <section class="card bilan">
          <Anneau :ratio="ratio" :taille="148" :epaisseur="14" :couleur="reste >= 0 ? 'var(--flamme-vif)' : 'var(--bad)'" :couleur2="reste >= 0 ? '#ffc04a' : undefined">
            <b class="num reste">{{ Math.abs(reste).toLocaleString('fr-FR') }}</b><small>{{ reste >= 0 ? 'kcal restantes' : 'kcal en trop' }}</small>
          </Anneau>
          <ul class="kv grow">
            <li><span><i class="pt o" />Repère</span><b class="num">{{ n.cible.toLocaleString('fr-FR') }}</b></li>
            <li><span><i class="pt m" />Mangé</span><b class="num">{{ mange.toLocaleString('fr-FR') }}</b></li>
            <li><span><i class="pt s" />Séances</span><b class="num good">+{{ seances }}</b></li>
          </ul>
        </section>

        <section class="card pad section">
          <h2 class="card-title">Ajouter un repas</h2>
          <form class="row ajout" @submit.prevent="ajouter">
            <input v-model="libelle" class="input" placeholder="Ex : poulet riz" maxlength="40" aria-label="Repas">
            <input v-model.number="kcal" class="input kcal num" type="number" inputmode="numeric" min="1" max="5000" placeholder="kcal" aria-label="Calories">
            <button class="btn primary" type="submit" aria-label="Ajouter le repas"><Icone nom="plus" /></button>
          </form>
          <p class="label rapide">Ajout rapide</p>
          <div class="chips wrap types">
            <button v-for="(f, i) in REPAS_TYPES" :key="f.label" type="button" class="chip" @click="type(i)">{{ f.label }} <small class="num">{{ f.kcal }}</small></button>
          </div>
          <ul v-if="jour.food.length" class="rows repas">
            <li v-for="(f, i) in jour.food" :key="i">
              <span class="ico" aria-hidden="true">🍽️</span>
              <span class="grow"><b>{{ f.label }}</b></span>
              <span class="kc num">{{ f.kcal }} <small>kcal</small></span>
              <button type="button" class="icon-btn petit" :aria-label="`Supprimer ${f.label}`" @click="fit.retirerRepas(i)"><Icone nom="fermer" :taille="14" /></button>
            </li>
          </ul>
          <p v-else class="tiny muted vide-r">Rien de noté aujourd’hui. Une estimation suffit, pas besoin d’être précis au gramme.</p>
        </section>
      </div>

      <div>
        <section class="card pad section reperes">
          <h2 class="card-title">Tes repères quotidiens</h2>
          <div class="tuiles">
            <div class="tuile" style="--c: var(--flamme)"><span>🎯</span><b class="num">{{ n.cible.toLocaleString('fr-FR') }}</b><small>kcal pour maigrir</small></div>
            <div class="tuile" style="--c: var(--cardio)"><span>🍗</span><b class="num">{{ n.proteines }} g</b><small>protéines</small></div>
            <div class="tuile" style="--c: var(--eau)"><span>💧</span><b class="num">{{ n.eau.toLocaleString('fr-FR') }} L</b><small>eau</small></div>
            <div class="tuile" style="--c: var(--calme)"><span>📉</span><b class="num">~{{ kg(Math.max(0, n.perteHebdo)) }}</b><small>kg / semaine attendus</small></div>
          </div>
          <p class="small muted dep">Dépense estimée sans sport : <b class="num">{{ n.tdee.toLocaleString('fr-FR') }} kcal</b></p>
          <p class="tiny muted">Calcul Mifflin-St Jeor, déficit modéré (~650 kcal) pour une perte durable sans fonte musculaire. Recalculé automatiquement quand ton poids baisse.</p>
        </section>

        <section class="card pad section">
          <h2 class="card-title">Assiette type</h2>
          <div class="assiette" role="img" aria-label="Moitié légumes, un quart protéines, un quart féculents">
            <div class="leg"><b>½</b>Légumes</div><div class="prot"><b>¼</b>Protéines</div><div class="fec"><b>¼</b>Féculents</div>
          </div>
          <ul class="conseils"><li v-for="c in CONSEILS.slice(0, 6)" :key="c">{{ c }}</li></ul>
        </section>
      </div>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Nutrition" } }
</route>

<style scoped>
.card-title { margin: 0 0 12px; font-weight: 900; font-stretch: 80%; text-transform: uppercase; letter-spacing: .03em; font-size: 16px; }
.bilan { display: flex; align-items: center; gap: 20px; padding: 20px; }
.reste { display: block; font-size: 34px; font-weight: 900; font-stretch: 75%; line-height: 1; }
.bilan small { font-size: 11.5px; color: var(--muted); font-weight: 700; }
.bilan .kv li { font-size: 14.5px; }
.bilan .kv span { display: inline-flex; align-items: center; gap: 8px; }
.pt { width: 9px; height: 9px; border-radius: 50%; }
.pt.o { background: var(--surface-3); } .pt.m { background: var(--flamme-vif); } .pt.s { background: var(--good); }
.ajout .kcal { max-width: 100px; flex: none; }
.ajout .btn { width: 52px; padding: 0; flex: none; }
.rapide { margin: 16px 0 8px; }
.repas { margin-top: 12px; border-top: 1px solid var(--border); }
.kc { font-weight: 900; white-space: nowrap; }
.kc small { display: inline !important; color: var(--dim) !important; font-weight: 700; font-size: 12px !important; }
.repas .ico { width: 34px; height: 34px; font-size: 16px; border-radius: 11px; }
.icon-btn.petit { width: 32px; height: 32px; border-radius: 10px; color: var(--muted); box-shadow: none; }
.vide-r { margin: 14px 0 0; }
.tuiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tuile { display: grid; gap: 1px; padding: 12px 14px; border-radius: 16px; background: color-mix(in srgb, var(--c) 9%, var(--surface-2)); border: 1px solid color-mix(in srgb, var(--c) 18%, transparent); }
.tuile span { font-size: 18px; }
.tuile b { font-size: 24px; font-weight: 900; font-stretch: 78%; line-height: 1.1; }
.tuile small { font-size: 12px; color: var(--muted); font-weight: 700; }
.dep { margin: 12px 0 4px; }
.dep b { color: var(--text); }
.assiette { display: grid; grid-template-columns: 2fr 1fr 1fr; height: 96px; border-radius: 48px; overflow: hidden; text-align: center; font-weight: 800; font-size: 12.5px; color: #fff; box-shadow: inset 0 0 0 4px rgba(255,255,255,.12); }
.assiette > div { display: grid; place-content: center; line-height: 1.1; }
.assiette b { display: block; font-size: 24px; font-weight: 900; font-stretch: 78%; }
.leg { background: linear-gradient(160deg, #22a06b, #157a50); } .prot { background: linear-gradient(160deg, #e8541f, #b93c10); } .fec { background: linear-gradient(160deg, #c99410, #9c7208); }
.conseils { margin: 14px 0 0; padding-left: 18px; display: grid; gap: 8px; color: var(--muted); font-size: 14px; }
.conseils li::marker { color: var(--accent); }
</style>
