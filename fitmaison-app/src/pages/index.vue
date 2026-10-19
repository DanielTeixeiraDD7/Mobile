<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { CONSEILS, HABITUDES, JOURS, PLANNING, SEANCES } from '@/core/programmes';
import { EXERCICES } from '@/core/exercices';
import { construire, duree } from '@/core/seance';
import { bruleSemaine, seancesSemaine } from '@/core/calculs';
import { dateLongue, iso, kg, minutes } from '@/core/dates';
import { celebrer } from '@/composables/useCelebration';
import { toast } from '@/composables/useToast';
import Icone from '@/components/Icone.vue';
import Figurine from '@/components/Figurine.vue';

const fit = useFit();
const router = useRouter();
const p = computed(() => fit.profil!);
const perdu = computed(() => p.value.startWeight - fit.poids);
const pct = computed(() => { const t = p.value.startWeight - p.value.goalWeight; return Math.max(0, Math.min(100, t > 0 ? (perdu.value / t) * 100 : 0)); });
const jour = computed(() => fit.jourLu());
const typeDuJour = computed(() => PLANNING[new Date().getDay()] ?? null);
const faiteAujourdhui = computed(() => fit.etat.sessions.some(s => s.date === fit.date));
const pesePas = computed(() => !fit.etat.weights.some(w => w.date === fit.date));
const verres = computed(() => Math.round((fit.nutrition?.eau ?? 2) / 0.25));
const conseil = CONSEILS[new Date().getDate() % CONSEILS.length];
const heure = new Date().getHours();
const salut = heure < 5 ? 'Bonne nuit' : heure < 18 ? 'Salut' : 'Bonsoir';
const semaine = computed(() => ({ n: seancesSemaine(fit.etat).length, kcal: bruleSemaine(fit.etat) }));
const dureeDuJour = computed(() => (typeDuJour.value ? duree(construire(typeDuJour.value, p.value.level)) : 0));
// Aperçu du 1er exercice du circuit du jour (animation).
const apercu = computed(() => { const c = typeDuJour.value ? SEANCES[typeDuJour.value].circuit?.[p.value.level]?.[0] : null; return c ? EXERCICES[c] : EXERCICES.marche_rapide; });

const pasSemaine = computed(() => Array.from({ length: 7 }, (_, k) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - k));
  const v = fit.etat.days[iso(d)]?.steps ?? 0;
  return { j: JOURS[d.getDay()]![0], v };
}));
const maxPas = computed(() => Math.max(8000, ...pasSemaine.value.map(x => x.v)));

function verre(n: number) {
  fit.eau(n);
  if (fit.jourLu().water === verres.value) celebrer('💧 Objectif hydratation atteint !');
}
function habitude(id: string, v: boolean) {
  fit.habitude(id, v);
  if (HABITUDES.every(h => fit.jourLu().habits[h.id])) celebrer('✅ Journée parfaite !');
}
const pesee = ref('');
function peser() {
  const v = Number(pesee.value.replace(',', '.'));
  try {
    const palier = fit.ajouterPesee(v);
    pesee.value = '';
    if (palier) celebrer(`🏅 Palier atteint : sous les ${palier} kg !`); else toast('Pesée enregistrée ✅', { type: 'ok' });
  } catch { toast('Poids invalide', { type: 'danger' }); }
}
async function podometre() {
  if (fit.podoActif) toast(`${fit.arreterPodometre().toLocaleString('fr-FR')} pas comptés ✅`, { type: 'ok' });
  else if (await fit.demarrerPodometre()) toast('Comptage lancé 👟');
}
const saisiePas = ref('');
function enregistrerPas() {
  if (saisiePas.value === '') return toast('Entre ton nombre de pas');
  const v = Number(saisiePas.value) || 0;
  fit.pas(v); saisiePas.value = '';
  if (v >= 8000) celebrer('👟 Objectif de pas atteint !'); else toast('Pas enregistrés');
}
</script>

<template>
  <div class="page">
    <header class="tete">
      <div class="grow">
        <p class="date">{{ dateLongue(new Date()) }}</p>
        <h1>{{ salut }}{{ p.name ? ' ' + p.name : '' }} 👋</h1>
      </div>
      <span class="serie" title="Jours consécutifs avec une séance"><Icone nom="feu" :taille="16" /> {{ fit.serie }}</span>
      <router-link to="/profil" class="icon-btn" aria-label="Profil et réglages"><Icone nom="profil" /></router-link>
    </header>

    <!-- Séance du jour -->
    <section class="card du-jour">
      <div class="grow">
        <p class="label">Séance du jour</p>
        <template v-if="faiteAujourdhui">
          <h2>✅ Séance faite, bravo !</h2>
          <p class="small muted">Pense à marcher et à bien t’hydrater. Une mobilité de 10 min en bonus ?</p>
          <router-link to="/seance/mobilite" class="btn full">🧘 Mobilité bonus</router-link>
        </template>
        <template v-else-if="typeDuJour">
          <h2>{{ SEANCES[typeDuJour].icone }} {{ SEANCES[typeDuJour].nom }}</h2>
          <p class="small muted">{{ minutes(dureeDuJour) }} · niveau {{ p.level }} · {{ SEANCES[typeDuJour].desc }}</p>
          <button type="button" class="btn primary full" @click="router.push(`/seance/${typeDuJour}`)"><Icone nom="play" :taille="18" /> Commencer</button>
        </template>
        <template v-else>
          <h2>😌 Jour de repos</h2>
          <p class="small muted">Récupère ! Une petite marche reste une excellente idée.</p>
          <router-link to="/seance/marche" class="btn full">🌳 Marche active quand même</router-link>
        </template>
      </div>
      <Figurine v-if="apercu" class="apercu" :anim="apercu.anim" :taille="120" />
    </section>

    <!-- Poids -->
    <section class="card pad section">
      <div class="row between">
        <div><p class="label">Poids actuel</p><p class="bignum num">{{ kg(fit.poids) }} <small>kg</small></p></div>
        <div class="droite"><p class="label">Objectif</p><p class="num moyen">{{ kg(p.goalWeight) }} kg</p></div>
      </div>
      <div class="progress grosse"><i :style="{ width: pct + '%' }" /></div>
      <div class="row between small muted">
        <span>{{ perdu >= 0 ? '−' : '+' }}{{ kg(Math.abs(perdu)) }} kg depuis le début</span>
        <span>encore {{ kg(Math.max(0, fit.poids - p.goalWeight)) }} kg</span>
      </div>
      <p v-if="fit.tendance" class="small muted tendance">Tendance : <b :class="fit.tendance.parSemaine <= 0 ? 'good' : 'bad'">{{ fit.tendance.parSemaine <= 0 ? '' : '+' }}{{ kg(fit.tendance.parSemaine) }} kg/sem</b><template v-if="fit.tendance.objectif"> · objectif estimé vers <b>{{ fit.tendance.objectif.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) }}</b></template></p>
      <form v-if="pesePas" class="row pesee" @submit.prevent="peser">
        <input v-model="pesee" class="input" type="number" inputmode="decimal" step="0.1" :placeholder="`Ton poids ce matin (${kg(fit.poids)})`" aria-label="Poids ce matin">
        <button class="btn primary" type="submit" :disabled="!pesee">Peser</button>
      </form>
    </section>

    <section class="stats3 section">
      <div class="stat"><b class="num">{{ semaine.n }}</b><span>séances cette semaine</span></div>
      <div class="stat"><b class="num">{{ semaine.kcal }}</b><span>kcal brûlées cette semaine</span></div>
      <div class="stat"><b class="num">{{ fit.etat.sessions.length }}</b><span>séances au total</span></div>
    </section>

    <!-- Calories brûlées -->
    <section class="card pad section">
      <div class="row between"><div><p class="label">Brûlé aujourd’hui</p><p class="bignum num">{{ fit.bruleAujourdhui.total }} <small>kcal</small></p></div><span class="flamme">🔥</span></div>
      <ul class="kv">
        <li><span>🏋️ Séances</span><b>{{ fit.bruleAujourdhui.seances }} kcal</b></li>
        <li><span>👟 Marche (pas)</span><b>{{ fit.bruleAujourdhui.marche }} kcal</b></li>
      </ul>
      <p class="tiny muted">En plus de ta dépense de base (~{{ fit.nutrition?.tdee }} kcal/jour). Estimation selon ton poids.</p>
    </section>

    <!-- Eau -->
    <section class="card pad section">
      <div class="row between"><h3><Icone nom="goutte" :taille="18" class="eau" /> Eau</h3><span class="small muted">{{ (jour.water * 0.25).toLocaleString('fr-FR') }} / {{ fit.nutrition?.eau.toLocaleString('fr-FR') }} L</span></div>
      <div class="verres">
        <button v-for="n in verres" :key="n" type="button" class="verre" :class="{ plein: n <= jour.water }" :aria-label="`${n} verre(s)`" @click="verre(n)" />
      </div>
    </section>

    <!-- Pas -->
    <section class="card pad section">
      <div class="row between"><h3><Icone nom="chaussure" :taille="18" /> Pas du jour</h3><span class="small muted">objectif 8 000</span></div>
      <p class="bignum num">{{ jour.steps.toLocaleString('fr-FR') }} <small>pas</small></p>
      <div class="progress"><i :style="{ width: Math.min(100, (jour.steps / 8000) * 100) + '%' }" /></div>
      <div class="semaine-pas">
        <div v-for="(d, k) in pasSemaine" :key="k" :class="{ ok: d.v >= 8000 }" :title="`${d.v} pas`"><i :style="{ height: (d.v / maxPas) * 100 + '%' }" /><small>{{ d.j }}</small></div>
      </div>
      <button type="button" class="btn full" :class="{ primary: !fit.podoActif }" @click="podometre">{{ fit.podoActif ? '⏹ Arrêter le comptage' : '▶ Compter mes pas' }}</button>
      <p v-if="fit.podoActif" class="small podo">● Comptage en cours : garde l’app ouverte, téléphone en poche ou en main.</p>
      <details class="small">
        <summary class="muted">Saisir le total de l’app Santé</summary>
        <form class="row saisie" @submit.prevent="enregistrerPas">
          <input v-model="saisiePas" class="input" type="number" inputmode="numeric" min="0" placeholder="Ex : 7 500">
          <button class="btn" type="submit">OK</button>
        </form>
        <p class="tiny muted">iPhone : app Santé → Activité → Pas. Le total saisi remplace celui du jour.</p>
      </details>
    </section>

    <!-- Habitudes -->
    <section class="card pad section">
      <h3>✅ Habitudes du jour</h3>
      <ul class="habitudes">
        <li v-for="h in HABITUDES" :key="h.id">
          <label><input type="checkbox" :checked="!!jour.habits[h.id]" @change="habitude(h.id, ($event.target as HTMLInputElement).checked)"><span>{{ h.icone }} {{ h.label }}</span></label>
        </li>
      </ul>
    </section>

    <section class="card pad section conseil"><p>💡 {{ conseil }}</p></section>
  </div>
</template>

<route>
{ "meta": { "titre": "Accueil" } }
</route>

<style scoped>
.tete { display: flex; align-items: center; gap: 10px; margin: 4px 4px 16px; }
.tete h1 { margin: 0; font-size: 28px; letter-spacing: -.035em; }
.date { margin: 0; font-size: 13px; font-weight: 700; color: var(--muted); text-transform: capitalize; }
.serie { display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; border-radius: 99px; background: var(--brand-soft); color: var(--brand); font-weight: 850; }
.du-jour { display: flex; align-items: center; gap: 10px; padding: 16px; background: radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 60%), var(--surface); }
.du-jour h2 { margin: 4px 0; font-size: 21px; letter-spacing: -.02em; }
.du-jour p { margin: 0 0 12px; }
.apercu { flex: none; margin: -10px -6px; }
.droite { text-align: right; }
.moyen { margin: 0; font-size: 19px; font-weight: 800; }
.grosse { height: 10px; margin: 12px 0 8px; }
.tendance { margin: 10px 0 0; }
.pesee { margin-top: 12px; }
.card.pad > p, .card.pad h3 { margin-top: 0; }
h3 { display: flex; align-items: center; gap: 6px; margin: 0 0 10px; font-size: 16px; }
.flamme { font-size: 34px; }
.kv { margin: 10px 0 8px; }
.eau { color: var(--eau); }
.verres { display: flex; flex-wrap: wrap; gap: 8px; }
.verre { width: 34px; height: 44px; border-radius: 4px 4px 10px 10px; border: 2px solid color-mix(in srgb, var(--eau) 60%, transparent); background: transparent; transition: background .2s; }
.verre.plein { background: linear-gradient(to top, var(--eau), color-mix(in srgb, var(--eau) 60%, transparent)); }
.semaine-pas { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; height: 70px; margin: 14px 0 12px; }
.semaine-pas div { display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 4px; }
.semaine-pas i { display: block; width: 100%; max-width: 26px; min-height: 3px; border-radius: 6px 6px 3px 3px; background: var(--surface-3); }
.semaine-pas .ok i { background: var(--good); }
.semaine-pas small { font-size: 11px; color: var(--dim); font-weight: 700; }
.podo { color: var(--good); margin: 8px 0 0; }
details { margin-top: 10px; }
.saisie { margin-top: 8px; }
.habitudes { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.habitudes label { display: flex; align-items: center; gap: 10px; padding: 8px 4px; font-size: 15px; }
.habitudes input { width: 20px; height: 20px; accent-color: var(--brand); }
.conseil p { margin: 0; }
</style>
