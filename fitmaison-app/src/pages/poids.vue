<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { imc, libelleImc, peseesTriees, poidsMin } from '@/core/calculs';
import { PALIERS } from '@/core/programmes';
import { aujourdhui, dateCourte, ecartJours, kg } from '@/core/dates';
import { celebrer } from '@/composables/useCelebration';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import Icone from '@/components/Icone.vue';
import GraphPoids from '@/components/GraphPoids.vue';
import Anneau from '@/components/graph/Anneau.vue';

const fit = useFit();
const p = computed(() => fit.profil!);
const pesees = computed(() => peseesTriees(fit.etat));
const b = computed(() => imc(p.value, fit.poids));
const min = computed(() => poidsMin(fit.etat));
const perdu = computed(() => p.value.startWeight - fit.poids);
const ratio = computed(() => { const t = p.value.startWeight - p.value.goalWeight; return t > 0 ? Math.max(0, perdu.value / t) : 0; });

/** Période du graphique. */
const periode = ref<'1m' | '3m' | 'tout'>('tout');
const visibles = computed(() => {
  const w = pesees.value;
  if (periode.value === 'tout' || !w.length) return w;
  const jours = periode.value === '1m' ? 31 : 92;
  const fin = w[w.length - 1]!.date;
  return w.filter(x => ecartJours(x.date, fin) <= jours);
});

/** Chemin vers le terrain : paliers entre le départ et l'objectif. */
const paliers = computed(() => [...new Set([...PALIERS.filter(m => m < p.value.startWeight && m > p.value.goalWeight), p.value.goalWeight])].sort((a, c) => c - a));
const prochain = computed(() => paliers.value.find(m => min.value > m));

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
const tousHisto = ref(false);
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div class="grow">
        <p class="kicker">Poids · objectif foot</p>
        <h1 class="page-title">Progrès</h1>
      </div>
    </header>

    <!-- Synthèse -->
    <section class="card synthese">
      <Anneau :ratio="ratio" :taille="132" :epaisseur="12" couleur="var(--volt)" couleur2="var(--volt-2)">
        <b class="num pct">{{ Math.round(Math.min(1, ratio) * 100) }}<small>%</small></b>
        <span class="tiny muted">du chemin</span>
      </Anneau>
      <div class="grow">
        <p class="label">Poids actuel</p>
        <p class="bignum num">{{ kg(fit.poids) }}<small>kg</small></p>
        <p class="small delta" :class="perdu >= 0 ? 'good' : 'bad'"><Icone :nom="perdu >= 0 ? 'tendanceBas' : 'tendanceHaut'" :taille="16" /> {{ perdu >= 0 ? '−' : '+' }}{{ kg(Math.abs(perdu)) }} kg</p>
        <p class="tiny muted">Départ {{ kg(p.startWeight) }} · objectif {{ kg(p.goalWeight) }} kg</p>
      </div>
    </section>

    <div class="stats3 section">
      <div class="stat"><b class="num">{{ kg(Math.max(0, fit.poids - p.goalWeight)) }}</b><span>kg restants</span></div>
      <div class="stat"><b class="num">{{ b.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }}</b><span>IMC · {{ libelleImc(b) }}</span></div>
      <div class="stat"><b class="num" :class="fit.tendance ? (fit.tendance.parSemaine <= 0 ? 'good' : 'bad') : ''">{{ fit.tendance ? (fit.tendance.parSemaine > 0 ? '+' : '') + kg(fit.tendance.parSemaine) : '–' }}</b><span>kg / semaine</span></div>
    </div>
    <p v-if="fit.tendance?.objectif" class="banner info"><Icone nom="calendrier" :taille="18" /> <span>À ce rythme, objectif estimé vers <b>{{ fit.tendance.objectif.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }}</b>. Une perte régulière et modérée est la plus durable.</span></p>

    <!-- Courbe -->
    <section class="card pad section">
      <div class="row between tete-g">
        <h2 class="card-title">Évolution</h2>
        <div class="seg petit" role="group" aria-label="Période">
          <button v-for="[k, l] in ([['1m', '1 mois'], ['3m', '3 mois'], ['tout', 'Tout']] as const)" :key="k" type="button" :class="{ on: periode === k }" :aria-pressed="periode === k" @click="periode = k">{{ l }}</button>
        </div>
      </div>
      <GraphPoids :pesees="visibles" :objectif="p.goalWeight" :montrer-objectif="periode === 'tout'" />
      <p class="tiny muted legende"><i class="a" /> moyenne 7 jours <i class="b" /> pesées <template v-if="periode === 'tout'"><i class="c" /> objectif</template></p>
    </section>

    <!-- Nouvelle pesée -->
    <form class="card pad section" @submit.prevent="ajouter">
      <h2 class="card-title">Nouvelle pesée</h2>
      <div class="pesee">
        <label class="champ-kg"><input v-model="valeur" class="input big num" type="number" inputmode="decimal" step="0.1" min="40" max="300" :placeholder="kg(fit.poids)" required aria-label="Poids (kg)"><span aria-hidden="true">kg</span></label>
        <input v-model="date" class="input" type="date" :max="aujourdhui()" required aria-label="Date de la pesée">
        <button class="btn primary" type="submit"><Icone nom="plus" :taille="20" /> Ajouter</button>
      </div>
      <p class="tiny muted">Pèse-toi le matin à jeun, 1 à 2 fois par semaine suffit. Regarde la tendance, pas le chiffre du jour.</p>
    </form>

    <!-- Chemin vers le terrain -->
    <section class="card pad section">
      <div class="row between"><h2 class="card-title">Le chemin vers le terrain</h2><span class="tag accent">{{ paliers.filter(m => min <= m).length }} / {{ paliers.length }}</span></div>
      <ol class="chemin">
        <li class="depart"><span class="pt"><Icone nom="drapeau" :taille="14" /></span><span class="grow"><b>Départ</b><small>{{ kg(p.startWeight) }} kg</small></span></li>
        <li v-for="m in paliers" :key="m" :class="{ gagne: min <= m, suivant: m === prochain, but: m === p.goalWeight }">
          <span class="pt"><Icone v-if="min <= m" nom="check" :taille="14" :epaisseur="3" /><Icone v-else-if="m === p.goalWeight" nom="ballon" :taille="16" /></span>
          <span class="grow">
            <b>{{ m === p.goalWeight ? 'Objectif : retour au foot' : `Sous les ${m} kg` }}</b>
            <small v-if="min <= m">Atteint 🏅</small>
            <small v-else-if="m === prochain">Prochain palier · encore {{ kg(fit.poids - m) }} kg</small>
            <small v-else>{{ m }} kg</small>
          </span>
        </li>
      </ol>
    </section>

    <!-- Historique -->
    <section class="card pad section">
      <h2 class="card-title">Historique</h2>
      <ul class="rows">
        <li v-for="(x, k) in (tousHisto ? historique : historique.slice(0, 8))" :key="x.date">
          <span class="grow"><b class="num">{{ kg(x.kg) }} kg</b><small>{{ dateCourte(x.date) }}</small></span>
          <small v-if="historique[k + 1]" class="ecart num" :class="x.kg - historique[k + 1]!.kg <= 0 ? 'good' : 'bad'">{{ x.kg - historique[k + 1]!.kg <= 0 ? '' : '+' }}{{ kg(x.kg - historique[k + 1]!.kg) }}</small>
          <button type="button" class="icon-btn petit" :aria-label="`Supprimer la pesée du ${dateCourte(x.date)}`" @click="supprimer(x.date)"><Icone nom="poubelle" :taille="15" /></button>
        </li>
      </ul>
      <button v-if="historique.length > 8" type="button" class="btn ghost full small" @click="tousHisto = !tousHisto">{{ tousHisto ? 'Voir moins' : `Voir les ${historique.length} pesées` }}</button>
    </section>
  </div>
</template>

<route>
{ "meta": { "titre": "Progrès" } }
</route>

<style scoped>
.card-title { margin: 0 0 12px; font-weight: 900; font-stretch: 80%; text-transform: uppercase; letter-spacing: .03em; font-size: 16px; }
.row .card-title { margin: 0; }
.synthese { display: flex; align-items: center; gap: 20px; padding: 20px; background: linear-gradient(150deg, color-mix(in srgb, var(--volt) 12%, var(--surface)), var(--surface) 65%); }
.pct { font-size: 34px; font-weight: 900; font-stretch: 75%; line-height: 1; }
.pct small { font-size: 16px; }
.synthese .bignum { font-size: 46px; margin: 4px 0 6px; }
.delta { display: inline-flex; align-items: center; gap: 4px; margin: 0; font-weight: 800; }
.synthese .tiny { margin: 4px 0 0; }
.banner b { color: var(--text); }
.tete-g { margin-bottom: 12px; flex-wrap: wrap; }
.seg.petit { padding: 3px; }
.seg.petit button { flex: none; min-height: 32px; padding: 0 12px; font-size: 12.5px; white-space: nowrap; }
.legende { display: flex; align-items: center; gap: 6px; margin: 8px 0 0; flex-wrap: wrap; }
.legende i { width: 14px; height: 4px; border-radius: 2px; margin-left: 6px; }
.legende i:first-child { margin-left: 0; }
.legende .a { background: var(--accent); } .legende .b { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); } .legende .c { background: repeating-linear-gradient(90deg, var(--accent) 0 3px, transparent 3px 6px); }
.pesee { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.champ-kg { position: relative; grid-column: 1 / -1; }
.champ-kg span { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); font-weight: 800; color: var(--muted); pointer-events: none; }
.pesee input[type=date] { min-width: 0; }
@media (min-width: 600px) { .pesee { grid-template-columns: 1.3fr 1fr auto; } .champ-kg { grid-column: auto; } }
.pesee + p { margin: 10px 0 0; }
.chemin { list-style: none; margin: 14px 0 0; padding: 0; position: relative; }
.chemin::before { content: ''; position: absolute; left: 15px; top: 16px; bottom: 16px; width: 2px; background: var(--border-2); }
.chemin li { position: relative; display: flex; align-items: center; gap: 14px; padding: 7px 0; }
.chemin .pt { width: 32px; height: 32px; flex: none; z-index: 1; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); border: 2px solid var(--border-2); color: var(--muted); }
.chemin b { display: block; font-size: 15px; font-weight: 800; }
.chemin small { display: block; font-size: 12.5px; color: var(--muted); font-weight: 600; }
.chemin .depart .pt, .chemin .gagne .pt { background: var(--volt); border-color: var(--volt); color: var(--on-volt); }
.chemin .suivant .pt { border-color: var(--accent); box-shadow: 0 0 0 4px var(--brand-soft); }
.chemin .suivant small { color: var(--accent); font-weight: 800; }
.chemin .but .pt { width: 40px; height: 40px; margin-left: -4px; margin-right: -4px; background: var(--pitch-grad); border: 0; color: #fff; }
.chemin .but b { font-size: 16.5px; }
.chemin li:not(.gagne):not(.depart):not(.suivant):not(.but) b { color: var(--muted); }
.ecart { font-weight: 800; }
.icon-btn.petit { width: 34px; height: 34px; border-radius: 11px; color: var(--muted); box-shadow: none; }
@media (min-width: 992px) { .synthese { padding: 26px 30px; } }
</style>
