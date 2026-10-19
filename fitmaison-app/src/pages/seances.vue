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
const cartes = computed(() => TYPES.map(t => {
  const e = construire(t, niveau.value);
  return { t, dur: duree(e), kcal: kcalSeance(e, fit.poids) };
}));
const historique = computed(() => [...fit.etat.sessions].reverse().slice(0, 15));
function choisirNiveau(n: Niveau) { fit.niveau(n); toast(`Niveau ${n} : ${NIVEAUX[n].nom}`); }
</script>

<template>
  <div class="page">
    <h1 class="page-title">Séances</h1>

    <router-link to="/exercices" class="card biblio">
      <span class="ic"><Icone nom="livre" :taille="24" /></span>
      <span class="grow"><b>Les exercices expliqués</b><small>Démonstration animée, étapes, erreurs à éviter, ce que tu dois sentir.</small></span>
      <Icone nom="droite" :taille="18" class="dim" />
    </router-link>

    <section class="card pad section">
      <h3>Ton niveau</h3>
      <div class="seg niveaux">
        <button v-for="n in ([1, 2, 3] as const)" :key="n" type="button" :class="{ on: n === niveau }" @click="choisirNiveau(n)"><b>{{ n }}</b><small>{{ NIVEAUX[n].nom }}</small></button>
      </div>
      <p class="small muted">{{ NIVEAUX[niveau].work }} s d’effort / {{ NIVEAUX[niveau].rest }} s de repos · {{ NIVEAUX[niveau].rounds }} tours. Passe au niveau suivant quand les séances te semblent faciles (c’est aussi automatique après 3 séances « faciles »).</p>
    </section>

    <section class="card pad section">
      <h3>Planning de la semaine</h3>
      <div class="semaine">
        <div v-for="d in semaine" :key="d.j" class="jour" :class="{ auj: d.aujourdhui, fait: d.fait }">
          <span>{{ JOURS[d.j] }}</span><b>{{ d.fait ? '✅' : d.t ? SEANCES[d.t].icone : '😌' }}</b><small>{{ d.t ? SEANCES[d.t].nom.split(' ')[0] : 'Repos' }}</small>
        </div>
      </div>
    </section>

    <div class="section-head section"><h2>Lancer une séance</h2></div>
    <router-link v-for="c in cartes" :key="c.t" :to="`/seance/${c.t}`" class="card seance">
      <span class="emoji">{{ SEANCES[c.t].icone }}</span>
      <span class="grow"><b>{{ SEANCES[c.t].nom }}</b><small>{{ SEANCES[c.t].desc }}</small></span>
      <span class="dur num">{{ minutes(c.dur) }}<small>~{{ c.kcal }} kcal</small></span>
    </router-link>

    <div class="section-head section"><h2>Historique</h2></div>
    <section class="card pad">
      <ul v-if="historique.length" class="histo">
        <li v-for="(s, k) in historique" :key="k">
          <span>{{ SEANCES[s.type]?.icone }} {{ SEANCES[s.type]?.nom }} <small class="muted">niv. {{ s.level }}</small></span>
          <span class="small muted">{{ dateCourte(s.date) }} · {{ minutes(s.duration) }} · {{ s.kcal }} kcal {{ ['', '😎', '🙂', '🥵'][s.feel] }}</span>
        </li>
      </ul>
      <p v-else class="muted">Aucune séance pour l’instant. La première est la plus importante !</p>
    </section>
  </div>
</template>

<route>
{ "meta": { "titre": "Séances" } }
</route>

<style scoped>
.biblio { display: flex; align-items: center; gap: 14px; padding: 14px 16px; color: inherit; text-decoration: none; background: linear-gradient(135deg, color-mix(in srgb, var(--force) 18%, var(--surface)), var(--surface)); }
.biblio .ic { width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; background: color-mix(in srgb, var(--force) 25%, transparent); color: var(--force); flex: none; }
.biblio b, .seance b { display: block; font-size: 15.5px; }
.biblio small, .seance small { display: block; color: var(--muted); font-size: 13px; }
h3 { margin: 0 0 10px; font-size: 16px; }
.niveaux button { display: grid; gap: 0; padding: 8px 4px; min-height: 54px; }
.niveaux b { font-size: 18px; }
.niveaux small { font-size: 11.5px; font-weight: 700; }
.niveaux + p { margin: 10px 0 0; }
.semaine { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
.jour { display: grid; justify-items: center; gap: 2px; padding: 8px 2px; border-radius: 12px; font-size: 12px; color: var(--muted); }
.jour b { font-size: 20px; }
.jour small { font-size: 10px; }
.jour.auj { background: var(--brand-soft); color: var(--brand); font-weight: 800; }
.seance { display: flex; align-items: center; gap: 14px; padding: 14px 16px; margin-bottom: 8px; color: inherit; text-decoration: none; }
.emoji { font-size: 28px; }
.dur { text-align: right; font-weight: 800; white-space: nowrap; }
.histo { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.histo li { display: grid; gap: 2px; }
</style>
