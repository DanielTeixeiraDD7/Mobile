<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { JOURS, NIVEAUX, PLANNING, SEANCES, TYPES, type Niveau } from '@/core/programmes';
import { construire, duree } from '@/core/seance';
import { kcalSeance } from '@/core/calculs';
import { dateCourte, iso, lireDate, lundi, minutes } from '@/core/dates';
import { toast } from '@/composables/useToast';
import Icone from '@/components/Icone.vue';

const fit = useFit();
const niveau = computed(() => fit.profil!.level);
const ordre = [1, 2, 3, 4, 5, 6, 0];
const datesFaites = computed(() => new Set(fit.etat.sessions.map(s => s.date)));
const semaine = computed(() => ordre.map(j => {
  const d = lireDate(lundi()); d.setDate(d.getDate() + ((j + 6) % 7));
  const t = PLANNING[j] ?? null;
  return { j, t, fait: datesFaites.value.has(iso(d)), aujourdhui: j === new Date().getDay() };
}));
const COULEURS: Record<string, string> = { full: 'var(--flamme)', cardio: 'var(--cardio)', renfo: 'var(--force)', marche: 'var(--accent)', mobilite: 'var(--calme)' };
const cartes = computed(() => TYPES.map(t => {
  const e = construire(t, niveau.value);
  return { t, dur: duree(e), kcal: kcalSeance(e, fit.poids) };
}));
const historique = computed(() => [...fit.etat.sessions].reverse().slice(0, 15));
const totalMin = computed(() => Math.round(fit.etat.sessions.reduce((t, s) => t + s.duration, 0) / 60));
const totalKcal = computed(() => fit.etat.sessions.reduce((t, s) => t + s.kcal, 0));
function choisirNiveau(n: Niveau) { fit.niveau(n); toast(`Niveau ${n} : ${NIVEAUX[n].nom}`); }
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div class="grow">
        <p class="kicker">Entraînement</p>
        <h1 class="page-title">Séances</h1>
      </div>
      <router-link to="/exercices" class="btn small soft"><Icone nom="livre" :taille="16" /> Exercices</router-link>
    </header>

    <!-- Semaine -->
    <section class="card pad">
      <div class="row between"><h2 class="card-title">Ta semaine</h2><span class="tag">{{ semaine.filter(d => d.fait).length }} faite{{ semaine.filter(d => d.fait).length > 1 ? 's' : '' }}</span></div>
      <div class="semaine">
        <router-link v-for="d in semaine" :key="d.j" :to="d.t ? `/seance/${d.t}` : '/seance/marche'" class="jour" :class="{ auj: d.aujourdhui, fait: d.fait }" :aria-label="`${JOURS[d.j]} : ${d.t ? SEANCES[d.t].nom : 'repos'}${d.fait ? ', faite' : ''}`">
          <span class="j">{{ JOURS[d.j] }}</span>
          <b><Icone v-if="d.fait" nom="check" :taille="18" :epaisseur="3" /><template v-else>{{ d.t ? SEANCES[d.t].icone : '😌' }}</template></b>
          <small>{{ d.t ? SEANCES[d.t].nom.split(' ')[0] : 'Repos' }}</small>
        </router-link>
      </div>
    </section>

    <!-- Lancer -->
    <div class="section-head section"><h2>Lancer une séance</h2><span class="tiny muted">niveau {{ niveau }}</span></div>
    <div class="cartes">
      <router-link v-for="c in cartes" :key="c.t" :to="`/seance/${c.t}`" class="card seance" :style="{ '--c': COULEURS[c.t] ?? 'var(--accent)' }">
        <span class="emoji" aria-hidden="true">{{ SEANCES[c.t].icone }}</span>
        <span class="grow">
          <b>{{ SEANCES[c.t].nom }}</b>
          <small class="clamp2">{{ SEANCES[c.t].desc }}</small>
          <span class="meta"><span><Icone nom="horloge" :taille="13" /> {{ minutes(c.dur) }}</span><span><Icone nom="feu" :taille="13" /> ~{{ c.kcal }} kcal</span></span>
        </span>
        <span class="go"><Icone nom="play" :taille="16" /></span>
      </router-link>
    </div>

    <!-- Niveau -->
    <section class="card pad section">
      <h2 class="card-title">Ton niveau</h2>
      <div class="seg niveaux" role="group" aria-label="Niveau">
        <button v-for="n in ([1, 2, 3] as const)" :key="n" type="button" :class="{ on: n === niveau }" :aria-pressed="n === niveau" @click="choisirNiveau(n)"><b>{{ n }}</b><small>{{ NIVEAUX[n].nom }}</small></button>
      </div>
      <p class="small muted expl"><b class="num">{{ NIVEAUX[niveau].work }} s</b> d’effort / <b class="num">{{ NIVEAUX[niveau].rest }} s</b> de repos · <b class="num">{{ NIVEAUX[niveau].rounds }}</b> tours. Passe au niveau suivant quand les séances te semblent faciles (c’est aussi automatique après 3 séances « faciles »).</p>
    </section>

    <!-- Historique -->
    <div class="section-head section"><h2>Historique</h2><span v-if="fit.etat.sessions.length" class="tiny muted num">{{ fit.etat.sessions.length }} séances · {{ totalMin }} min · {{ totalKcal.toLocaleString('fr-FR') }} kcal</span></div>
    <section class="card pad histo-c">
      <ul v-if="historique.length" class="rows">
        <li v-for="(s, k) in historique" :key="k">
          <span class="ico" aria-hidden="true">{{ SEANCES[s.type]?.icone }}</span>
          <span class="grow"><b>{{ SEANCES[s.type]?.nom }} <span class="tag">niv. {{ s.level }}</span></b><small class="num">{{ dateCourte(s.date) }} · {{ minutes(s.duration) }} · {{ s.kcal }} kcal</small></span>
          <span class="ressenti" :title="['', 'Facile', 'Correct', 'Difficile'][s.feel]">{{ ['', '😎', '🙂', '🥵'][s.feel] }}</span>
        </li>
      </ul>
      <div v-else class="vide">
        <span class="vide-ic"><Icone nom="haltere" :taille="28" /></span>
        <b>Aucune séance pour l’instant</b>
        <p>La première est la plus importante. 20 minutes suffisent.</p>
      </div>
    </section>
  </div>
</template>

<route>
{ "meta": { "titre": "Séances" } }
</route>

<style scoped>
.card-title { margin: 0 0 12px; font-weight: 900; font-stretch: 80%; text-transform: uppercase; letter-spacing: .03em; font-size: 16px; }
.row .card-title { margin: 0; }
.semaine { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; margin-top: 12px; }
.jour { display: grid; justify-items: center; gap: 4px; padding: 10px 2px; border-radius: 14px; font-size: 12px; color: var(--muted); text-decoration: none; background: var(--surface-2); border: 1.5px solid transparent; transition: transform .14s var(--ease); }
.jour:active { transform: scale(.94); }
.jour .j { font-weight: 800; text-transform: uppercase; font-size: 10.5px; letter-spacing: .06em; }
.jour b { height: 26px; display: grid; place-items: center; font-size: 20px; }
.jour small { font-size: 10px; font-weight: 700; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
.jour.auj { border-color: var(--accent); color: var(--text); }
.jour.fait { background: var(--volt); color: var(--on-volt); }
.cartes { display: grid; gap: 10px; }
.seance { display: flex; align-items: center; gap: 14px; padding: 14px 14px 14px 12px; overflow: hidden; }
.seance::before { content: ''; position: absolute; left: 0; top: 14px; bottom: 14px; width: 4px; border-radius: 0 4px 4px 0; background: var(--c); }
.emoji { width: 54px; height: 54px; flex: none; border-radius: 17px; display: grid; place-items: center; font-size: 28px; background: color-mix(in srgb, var(--c) 15%, var(--surface-2)); }
.seance b { display: block; font-size: 16.5px; font-weight: 900; }
.seance small { display: block; color: var(--muted); font-size: 13px; line-height: 1.35; }
.meta { display: flex; gap: 12px; margin-top: 5px; font-size: 12.5px; font-weight: 800; color: var(--text); }
.meta span { display: inline-flex; align-items: center; gap: 4px; }
.meta .ic { color: var(--c); }
.go { width: 38px; height: 38px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--surface-2); color: var(--text); padding-left: 2px; transition: background .2s, color .2s; }
.seance:hover .go { background: var(--volt); color: var(--on-volt); }
.niveaux button { display: grid; gap: 0; padding: 8px 4px; min-height: 58px; }
.niveaux b { font-size: 22px; font-weight: 900; font-stretch: 78%; line-height: 1; }
.niveaux small { font-size: 11.5px; font-weight: 700; }
.expl { margin: 12px 0 0; }
.expl b { color: var(--text); }
.histo-c { padding-top: 4px; padding-bottom: 4px; }
.rows b { display: flex; align-items: center; gap: 6px; }
.ressenti { font-size: 22px; }
@media (min-width: 992px) { .cartes { grid-template-columns: 1fr 1fr; } }
</style>
