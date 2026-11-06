<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { SEANCES } from '@/core/programmes';
import { construire, duree } from '@/core/seance';
import { DUREE_MIN_SEMAINES, jourPlan, PHASES } from '@/core/plan';
import { lancerSeance } from '@/composables/useSeance';
import { toast } from '@/composables/useToast';
import { lireDate } from '@/core/dates';
import Icone from './Icone.vue';

/** Carte compacte « plan du jour » pour l'accueil (sans props, lit le store). */
const fit = useFit();
const router = useRouter();
const j = computed(() => (fit.etat.plan ? jourPlan(fit.etat, fit.date) : null));
const jour = computed(() => fit.jourLu());
const faite = computed(() => !!j.value?.seance && fit.etat.sessions.some(s => s.date === fit.date && s.type === j.value!.seance!.type));
const dureeMin = computed(() => (j.value?.seance ? Math.round(duree(construire(j.value.seance.type, j.value.seance.niveau)) / 60) : 0));
const pauses = computed(() => jour.value.pauses ?? 0);
const pctPas = computed(() => (j.value ? Math.min(100, (jour.value.steps / j.value.pas) * 100) : 0));
const debutTexte = computed(() => (fit.etat.plan ? lireDate(fit.etat.plan.debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''));
const numPhase = computed(() => (j.value ? PHASES.findIndex(p => p.id === j.value!.phase.id) + 1 : 0));

function demarrer() {
  const s = j.value?.seance;
  if (s) lancerSeance(s.type, { niveau: s.niveau, plan: true });
}
function pause() {
  const n = pauses.value + 1;
  fit.pause(n);
  toast(j.value?.pauses ? `Pause ${n} / ${j.value.pauses} ✅` : 'Pause notée ✅', { type: 'ok' });
}
</script>

<template>
  <!-- Pas encore de plan : invitation -->
  <router-link v-if="!j && !fit.etat.plan" to="/plan" class="card pitch carte-plan invite">
    <p class="kicker">Nouveau · Objectif foot</p>
    <h2 class="display titre">Ton plan pour reprendre le foot</h2>
    <p class="muted small">{{ DUREE_MIN_SEMAINES }} semaines minimum, 4 phases, des bilans simples pour avancer à ton rythme. Marche, renfo doux, ballon : tout à la maison.</p>
    <span class="btn primary">Découvrir mon plan <Icone nom="droite" :taille="18" /></span>
  </router-link>

  <router-link v-else-if="!j" to="/plan" class="card pad carte-plan">
    <p class="kicker">Plan · Objectif foot</p>
    <h2 class="display titre">Départ {{ debutTexte }}</h2>
    <p class="small muted">D’ici là : fais ton bilan de départ (10 min, dans le plan) et une marche tranquille chaque jour. Lève-toi aussi de ta chaise toutes les heures.</p>
    <span class="btn primary">Faire mon bilan de départ <Icone nom="droite" :taille="18" /></span>
  </router-link>

  <section v-else class="card pitch carte-plan" aria-label="Plan du jour">
    <div class="row between haut">
      <p class="kicker">Phase {{ numPhase }} · {{ j.phase.nom }} · sem. {{ j.semaineDansPhase + 1 }}</p>
      <router-link to="/plan" class="voir small">Mon plan <Icone nom="droite" :taille="14" /></router-link>
    </div>

    <template v-if="j.seance">
      <h2 class="display titre"><span aria-hidden="true">{{ SEANCES[j.seance.type].icone }}</span> {{ SEANCES[j.seance.type].nom }}</h2>
      <p class="small muted">{{ dureeMin }} min · niveau {{ j.seance.niveau }}<template v-if="j.reprise"> · semaine de reprise</template></p>
    </template>
    <template v-else>
      <h2 class="display titre">😌 Repos actif</h2>
      <p class="small muted">Pas de séance : vise tes pas en marchant tranquillement.</p>
    </template>
    <p v-if="j.allege" class="note small"><Icone nom="alerte" :taille="15" /> {{ j.allege }}</p>
    <p v-if="j.bilan" class="note small"><Icone nom="drapeau" :taille="15" /> {{ j.bilan === 'depart' ? 'Fais ton bilan de départ (10 min).' : 'Bilan aujourd’hui : il décide de la suite.' }}</p>

    <div class="mini">
      <div>
        <div class="row between tiny"><span><Icone nom="chaussure" :taille="14" /> Pas</span><b class="num">{{ jour.steps.toLocaleString('fr-FR') }} / {{ j.pas.toLocaleString('fr-FR') }}</b></div>
        <div class="progress fin"><i :style="{ width: pctPas + '%' }" /></div>
      </div>
      <button v-if="j.pauses" type="button" class="pauses" :aria-label="`Noter une pause active (${pauses} sur ${j.pauses})`" @click="pause">
        <span class="tiny"><Icone nom="bureau" :taille="14" /> Pauses</span>
        <span class="points" aria-hidden="true"><i v-for="n in j.pauses" :key="n" :class="{ on: n <= pauses }" /></span>
      </button>
    </div>

    <div class="actions">
      <button v-if="j.seance && !faite" type="button" class="btn primary grow" @click="demarrer"><Icone nom="play" :taille="18" /> Démarrer</button>
      <span v-else-if="faite" class="btn on-pitch grow fait"><Icone nom="check" :taille="18" /> Séance faite</span>
      <button v-else-if="j.bilan" type="button" class="btn primary grow" @click="router.push('/plan#bilan')"><Icone nom="drapeau" :taille="18" /> Faire le bilan</button>
      <button v-else type="button" class="btn on-pitch grow" @click="lancerSeance('mobilite')">🧘 Mobilité 10 min</button>
      <button type="button" class="btn on-pitch" aria-label="Pause active bureau, 4 minutes" @click="lancerSeance('bureau')"><Icone nom="bureau" :taille="18" /> 4 min</button>
    </div>
  </section>
</template>

<style scoped>
.carte-plan { display: grid; gap: 6px; padding: 18px; }
.carte-plan.pitch { color: var(--pitch-ink); }
.invite { text-decoration: none; }
.invite .btn { justify-self: start; margin-top: 6px; }
.haut { gap: 8px; }
.voir { display: inline-flex; align-items: center; gap: 2px; color: inherit; font-weight: 800; text-decoration: none; opacity: .9; }
.titre { margin: 2px 0 0; font-size: var(--fs-2xl); }
.carte-plan p { margin: 0; }
.note { display: flex; gap: 6px; align-items: flex-start; padding: 8px 10px; border-radius: var(--r-xs); background: rgba(255, 255, 255, .12); font-weight: 700; }
.note :deep(.ic) { flex: none; margin-top: 2px; color: var(--volt); }
.mini { display: grid; grid-template-columns: 1fr auto; gap: 14px; align-items: end; margin-top: 8px; }
.mini .row { margin-bottom: 5px; }
.mini span, .pauses > span { display: inline-flex; align-items: center; gap: 5px; }
.pauses { display: grid; gap: 6px; justify-items: end; padding: 0; border: 0; background: none; color: inherit; }
.points { display: flex; gap: 4px; }
.points i { width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, .2); transition: background .2s; }
.points i.on { background: var(--volt); }
.actions { display: flex; gap: 8px; margin-top: 10px; }
.fait { pointer-events: none; }
</style>
