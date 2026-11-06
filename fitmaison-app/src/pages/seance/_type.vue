<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { NIVEAUX, SEANCES, TYPES, type TypeSeance } from '@/core/programmes';
import { EXERCICES, MATERIEL } from '@/core/exercices';
import { construire, duree, exercicesSeance, materielSeance } from '@/core/seance';
import { kcalSeance } from '@/core/calculs';
import { minutes } from '@/core/dates';
import { lancerSeance, ouvrirFiche } from '@/composables/useSeance';
import Icone from '@/components/Icone.vue';
import Figurine from '@/components/Figurine.vue';
import { SIGNAUX_ARRET, consigneIntensite, jourPlan } from '@/core/plan';
import type { Niveau } from '@/core/programmes';

/** Avant de commencer : matériel à préparer, exercices de la séance (avec démo), durée. */
const route = useRoute();
const router = useRouter();
const fit = useFit();
const type = computed(() => (TYPES.includes(route.params.type as TypeSeance) ? (route.params.type as TypeSeance) : 'full'));
/** Niveau prescrit par le plan si cette séance est celle du jour, sinon le niveau du profil. */
const prescrit = computed(() => {
  const s = fit.etat.plan ? jourPlan(fit.etat, fit.date)?.seance : null;
  return s && s.type === type.value ? s : null;
});
const niveau = computed<Niveau>(() => prescrit.value?.niveau ?? fit.profil!.level);
const etapes = computed(() => construire(type.value, niveau.value, { vus: fit.etat.vus, demo: fit.reglages.demo !== false, remplacements: fit.etat.remplacements }));
const exos = computed(() => exercicesSeance(etapes.value).map(id => EXERCICES[id]!));
const materiel = computed(() => materielSeance(etapes.value).map(m => ({ id: m, ...MATERIEL[m] })));
const nouveaux = computed(() => exos.value.filter(e => !(fit.etat.vus ?? []).includes(e.id)).length);
const phases = computed(() => {
  const e = etapes.value;
  return { echauffement: e.filter(s => s.phase === 'warmup').length, circuit: new Set(e.filter(s => s.phase === 'work').map(s => s.cle)).size, tours: e.find(s => s.rounds)?.rounds ?? 1 };
});
const demo = computed({ get: () => fit.reglages.demo !== false, set: v => fit.reglage('demo', v) });
const vu = (id: string) => (fit.etat.vus ?? []).includes(id);
function retour() { if (history.length > 1) router.back(); else router.push('/seances'); }
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button type="button" class="icon-btn" aria-label="Retour" @click="retour"><Icone nom="retour" /></button>
    </div>

    <header class="card pitch hero">
      <div class="h-txt">
        <p class="kicker">Séance · niveau {{ niveau }} {{ NIVEAUX[niveau].nom }}{{ prescrit ? ' · prévue par ton plan' : '' }}</p>
        <h1 class="display">{{ SEANCES[type].nom }}</h1>
        <p class="desc">{{ SEANCES[type].desc }}</p>
      </div>
      <span class="emoji" aria-hidden="true">{{ SEANCES[type].icone }}</span>
      <div class="chiffres">
        <div><b class="num">{{ minutes(duree(etapes)) }}</b><span>durée</span></div>
        <div><b class="num">~{{ kcalSeance(etapes, fit.poids) }}</b><span>kcal</span></div>
        <div><b class="num">{{ exos.length }}</b><span>exercices</span></div>
      </div>
    </header>

    <section v-if="materiel.length" class="card pad section">
      <h2 class="card-title"><Icone nom="boite" :taille="18" /> À préparer avant de commencer</h2>
      <ul class="rows">
        <li v-for="m in materiel" :key="m.id"><span class="ico" aria-hidden="true">{{ m.icone }}</span><span class="grow"><b>{{ m.nom }}</b><small>{{ m.aide }}</small></span></li>
      </ul>
    </section>
    <p v-else class="banner info section"><Icone nom="check" :taille="18" /> Aucun matériel : juste de la place pour bouger.</p>

    <section class="section">
      <div class="section-head"><h2>Les exercices</h2><span class="tiny muted">touche pour voir comment faire</span></div>
      <ol v-if="type !== 'marche' && type !== 'mobilite'" class="deroule" aria-label="Déroulé">
        <li><b>Échauffement</b><small>{{ phases.echauffement }} exercices</small></li>
        <li class="fort"><b>Circuit</b><small>{{ phases.circuit }} exos × {{ phases.tours }} tours</small></li>
        <li><b>Retour au calme</b><small>étirements</small></li>
      </ol>
      <ul class="exos">
        <li v-for="(e, k) in exos" :key="e.id">
          <button type="button" class="card exo" @click="ouvrirFiche(e.id)">
            <span class="vign"><Figurine :anim="e.anim" :taille="76" /></span>
            <span class="grow">
              <small class="n">{{ String(k + 1).padStart(2, '0') }} · {{ e.cat }}</small>
              <b>{{ e.nom }}</b>
              <small class="clamp2">{{ e.resume }}</small>
              <span v-if="!vu(e.id)" class="tag volt nouveau">Nouveau{{ demo ? ' · démo 15 s avant' : '' }}</span>
            </span>
            <Icone nom="question" :taille="20" class="dim" />
          </button>
        </li>
      </ul>
    </section>

    <label v-if="nouveaux" class="bascule card pad section">
      <span class="grow"><b>Démonstration des nouveaux exercices</b><small>{{ nouveaux }} exercice{{ nouveaux > 1 ? 's' : '' }} jamais fait{{ nouveaux > 1 ? 's' : '' }} : 15 s pour regarder avant de commencer.</small></span>
      <input v-model="demo" type="checkbox" class="switch">
    </label>

    <div class="cta">
      <button type="button" class="btn primary lg full" @click="lancerSeance(type, prescrit ? { niveau: prescrit.niveau, plan: true } : {})"><Icone nom="play" :taille="22" /> Commencer la séance</button>
    </div>
    <p class="banner info section intensite"><Icone nom="info" :taille="18" /> {{ consigneIntensite(type) }}</p>
    <details class="card pad section arret">
      <summary><b>Arrête-toi tout de suite si…</b></summary>
      <ul><li v-for="x in SIGNAUX_ARRET" :key="x">{{ x }}</li></ul>
      <small class="muted">En cas de douleur dans la poitrine qui ne passe pas au repos : appelle le 112 (urgences).</small>
    </details>
    <p class="tiny muted center note">L’écran reste allumé. La voix annonce chaque exercice et le changement de côté.</p>
  </div>
</template>

<route>
{ "meta": { "titre": "Préparer la séance" } }
</route>

<style scoped>
.hero { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; padding: 20px; }
.hero h1 { margin: 6px 0 6px; font-size: 40px; color: #fff; }
.desc { margin: 0; color: rgba(255,255,255,.88); font-size: 15px; max-width: 34ch; }
.emoji { font-size: 52px; line-height: 1; align-self: start; filter: drop-shadow(0 6px 14px rgba(0,0,0,.35)); }
.chiffres { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 14px; }
.chiffres div { padding: 10px 8px; border-radius: 14px; background: rgba(0,0,0,.22); text-align: center; }
.chiffres b { display: block; font-size: 24px; font-weight: 900; font-stretch: 78%; color: #fff; line-height: 1.1; }
.chiffres span { font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,.8); text-transform: uppercase; letter-spacing: .06em; }
.card-title { font-weight: 800; }
.deroule { list-style: none; margin: 0 0 12px; padding: 0; display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 6px; counter-reset: d; }
.deroule li { padding: 10px 10px; border-radius: 14px; background: var(--surface-2); border: 1px solid var(--border); }
.deroule li.fort { background: var(--volt-soft); border-color: transparent; }
.deroule b { display: block; font-size: 13px; font-weight: 900; }
.deroule small { display: block; font-size: 11.5px; color: var(--muted); font-weight: 600; }
.exos { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.exo { width: 100%; display: flex; align-items: center; gap: 12px; padding: 8px 14px 8px 8px; text-align: left; color: inherit; border-radius: 20px; }
.vign { flex: none; width: 84px; height: 84px; border-radius: 16px; display: grid; place-items: center; background: var(--surface-2); overflow: hidden; }
.exo .n { display: block; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.exo b { display: block; font-size: 15.5px; font-weight: 800; margin: 1px 0 2px; }
.exo small:not(.n) { display: block; color: var(--muted); font-size: 13px; line-height: 1.35; }
.nouveau { margin-top: 6px; }
.bascule { display: flex; align-items: center; gap: 14px; cursor: pointer; }
.bascule b { display: block; font-size: 15px; }
.bascule small { color: var(--muted); font-size: 13px; }
.cta { position: sticky; bottom: calc(var(--tab-h) + var(--safe-b) + 22px); margin-top: 20px; z-index: 5; }
.note { margin: 10px 8px 0; }
.arret summary { cursor: pointer; color: var(--bad); }
.arret ul { margin: 10px 0 6px; padding-left: 20px; display: grid; gap: 4px; font-size: 14px; }
@media (min-width: 992px) {
  .hero { padding: 28px 30px; }
  .hero h1 { font-size: 56px; }
  .exos { grid-template-columns: 1fr 1fr; }
  .cta { bottom: 20px; }
}
</style>
