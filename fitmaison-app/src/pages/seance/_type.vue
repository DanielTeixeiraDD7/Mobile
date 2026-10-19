<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { SEANCES, TYPES, type TypeSeance } from '@/core/programmes';
import { EXERCICES, MATERIEL } from '@/core/exercices';
import { construire, duree, exercicesSeance, materielSeance } from '@/core/seance';
import { kcalSeance } from '@/core/calculs';
import { minutes } from '@/core/dates';
import { lancerSeance, ouvrirFiche } from '@/composables/useSeance';
import Icone from '@/components/Icone.vue';
import Figurine from '@/components/Figurine.vue';

/** Avant de commencer : matériel à préparer, exercices de la séance (avec démo), durée. */
const route = useRoute();
const router = useRouter();
const fit = useFit();
const type = computed(() => (TYPES.includes(route.params.type as TypeSeance) ? (route.params.type as TypeSeance) : 'full'));
const etapes = computed(() => construire(type.value, fit.profil!.level, { vus: fit.etat.vus, demo: fit.reglages.demo !== false, remplacements: fit.etat.remplacements }));
const exos = computed(() => exercicesSeance(etapes.value).map(id => EXERCICES[id]!));
const materiel = computed(() => materielSeance(etapes.value).map(m => ({ id: m, ...MATERIEL[m] })));
const nouveaux = computed(() => exos.value.filter(e => !(fit.etat.vus ?? []).includes(e.id)).length);
const phases = computed(() => {
  const e = etapes.value;
  return { echauffement: e.filter(s => s.phase === 'warmup').length, circuit: new Set(e.filter(s => s.phase === 'work').map(s => s.cle)).size, tours: e.find(s => s.rounds)?.rounds ?? 1 };
});
const demo = computed({ get: () => fit.reglages.demo !== false, set: v => fit.reglage('demo', v) });
const vu = (id: string) => (fit.etat.vus ?? []).includes(id);
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button type="button" class="icon-btn" aria-label="Retour" @click="router.back()"><Icone nom="retour" /></button>
    </div>
    <header class="hero">
      <span class="emoji">{{ SEANCES[type].icone }}</span>
      <h1>{{ SEANCES[type].nom }}</h1>
      <p class="muted">{{ SEANCES[type].desc }}</p>
      <div class="stats3">
        <div class="stat"><b class="num">{{ minutes(duree(etapes)) }}</b><span>durée</span></div>
        <div class="stat"><b class="num">~{{ kcalSeance(etapes, fit.poids) }}</b><span>kcal</span></div>
        <div class="stat"><b class="num">{{ fit.profil!.level }}</b><span>niveau</span></div>
      </div>
    </header>

    <section v-if="materiel.length" class="card pad section">
      <h3><Icone nom="boite" :taille="18" /> À préparer avant de commencer</h3>
      <ul class="materiel">
        <li v-for="m in materiel" :key="m.id"><span class="emoji-s">{{ m.icone }}</span><span><b>{{ m.nom }}</b><small>{{ m.aide }}</small></span></li>
      </ul>
    </section>
    <p v-else class="banner section">Aucun matériel : juste de la place pour bouger.</p>

    <section class="section">
      <div class="section-head"><h2>Les exercices</h2><span class="small muted">touche pour voir comment faire</span></div>
      <p v-if="type !== 'marche' && type !== 'mobilite'" class="small muted deroule">Échauffement ({{ phases.echauffement }} exercices) → circuit de {{ phases.circuit }} exercices × {{ phases.tours }} tours → étirements.</p>
      <ul class="exos">
        <li v-for="e in exos" :key="e.id">
          <button type="button" class="card exo" @click="ouvrirFiche(e.id)">
            <Figurine :anim="e.anim" :taille="74" />
            <span class="grow">
              <b>{{ e.nom }}</b>
              <small>{{ e.resume }}</small>
              <span v-if="!vu(e.id)" class="nouveau">Nouveau{{ demo ? ' · démo de 15 s avant' : '' }}</span>
            </span>
            <Icone nom="question" :taille="20" class="dim" />
          </button>
        </li>
      </ul>
    </section>

    <label v-if="nouveaux" class="bascule card pad section">
      <span class="grow"><b>Démonstration des nouveaux exercices</b><small>{{ nouveaux }} exercice{{ nouveaux > 1 ? 's' : '' }} jamais fait{{ nouveaux > 1 ? 's' : '' }} : 15 s pour regarder avant de commencer.</small></span>
      <input v-model="demo" type="checkbox">
    </label>

    <button type="button" class="btn primary full go" @click="lancerSeance(type)"><Icone nom="play" :taille="20" /> Commencer la séance</button>
    <p class="tiny dim center">L’écran reste allumé. La voix annonce chaque exercice et le changement de côté quand il le faut.</p>
  </div>
</template>

<route>
{ "meta": { "titre": "Préparer la séance" } }
</route>

<style scoped>
.hero { display: grid; justify-items: center; text-align: center; gap: 4px; }
.hero .emoji { font-size: 44px; }
.hero h1 { margin: 0; font-size: 28px; letter-spacing: -.03em; }
.hero p { margin: 0 0 10px; }
.hero .stats3 { width: 100%; }
h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; font-size: 16px; }
.materiel { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.materiel li { display: flex; gap: 12px; align-items: flex-start; }
.emoji-s { font-size: 24px; line-height: 1; }
.materiel b { display: block; }
.materiel small { color: var(--muted); font-size: 13px; }
.deroule { margin: -4px 4px 10px; }
.exos { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.exo { width: 100%; display: flex; align-items: center; gap: 12px; padding: 8px 14px 8px 8px; text-align: left; color: inherit; }
.exo b { display: block; font-size: 15px; }
.exo small { display: block; color: var(--muted); font-size: 12.5px; line-height: 1.35; }
.nouveau { display: inline-block; margin-top: 4px; padding: 2px 8px; border-radius: 99px; background: color-mix(in srgb, var(--force) 20%, transparent); color: var(--force); font-size: 11.5px; font-weight: 800; }
.bascule { display: flex; align-items: center; gap: 12px; }
.bascule b { display: block; font-size: 15px; }
.bascule small { color: var(--muted); font-size: 13px; }
.bascule input { width: 24px; height: 24px; accent-color: var(--brand); }
.go { margin-top: 18px; min-height: 56px; font-size: 17px; }
.center { margin-top: 8px; }
</style>
