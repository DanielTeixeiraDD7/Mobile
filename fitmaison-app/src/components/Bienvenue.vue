<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { EXERCICES } from '@/core/exercices';
import FormProfil from './FormProfil.vue';
import Figurine from './Figurine.vue';
import Icone from './Icone.vue';

/** Premier lancement : présentation en 4 étapes, avertissement santé, création du profil. */
const fit = useFit();
const p = ref({ name: '', sex: 'h' as 'h' | 'f', age: 30, height: 178, goalWeight: 99, startWeight: 125, activity: 1.2 });
const etape = ref(0);
const ETAPES = ['Bienvenue', 'Toi', 'Ton corps', 'Ta santé'];
const compris = ref(false);
const identiteOk = computed(() => p.value.age >= 14 && p.value.age <= 99);
const corpsOk = computed(() => p.value.height >= 120 && p.value.goalWeight >= 40 && p.value.startWeight >= 40 && p.value.goalWeight < p.value.startWeight);
const valide = computed(() => identiteOk.value && corpsOk.value && compris.value);
const imcDepart = computed(() => p.value.startWeight / (p.value.height / 100) ** 2);
const anim = computed(() => (EXERCICES.conduite_balle ?? EXERCICES.marche_genoux ?? EXERCICES.squat_chaise)!.anim);
const corps = useTemplateRef<HTMLElement>('corps');

function suivant() {
  if (etape.value === 1 && !identiteOk.value) return;
  if (etape.value === 2 && !corpsOk.value) return;
  if (etape.value < 3) { etape.value++; nextTick(() => corps.value?.focus()); }
  else creer();
}
function precedent() { if (etape.value > 0) etape.value--; }
function creer() { if (valide.value) fit.creerProfil(p.value); }
</script>

<template>
  <main class="bienvenue" :class="{ intro: etape === 0 }">
    <!-- Étape 0 : accueil -->
    <section v-if="etape === 0" class="ecran-intro">
      <div class="pelouse" aria-hidden="true"><i class="rond" /><i class="ligne" /></div>
      <div class="intro-haut">
        <span class="logo"><img :src="'icons/icon.svg'" alt="" width="44" height="44"><b>FitMaison</b></span>
      </div>
      <div class="coach"><Figurine :anim="anim" :taille="230" /></div>
      <div class="intro-txt">
        <p class="kicker">Ton coach à la maison</p>
        <h1 class="display">Objectif :<br><span>retour sur le terrain</span></h1>
        <p class="sous">Perdre du poids et retrouver du souffle avec des séances au poids du corps, à la maison ou au jardin. On commence doucement, on progresse chaque semaine.</p>
        <ul class="atouts">
          <li><Icone nom="bouclier" :taille="18" /> Sans saut au début : genoux et dos protégés</li>
          <li><Icone nom="film" :taille="18" /> Chaque exercice montré et expliqué</li>
          <li><Icone nom="cadenas" :taille="18" /> Tes données restent sur ton téléphone</li>
        </ul>
        <button type="button" class="btn primary lg full" @click="suivant">Commencer <Icone nom="droite" :taille="20" /></button>
      </div>
    </section>

    <!-- Étapes 1–3 -->
    <section v-else class="ecran">
      <header class="haut">
        <button type="button" class="icon-btn" aria-label="Étape précédente" @click="precedent"><Icone nom="retour" /></button>
        <ol class="progres" :aria-label="`Étape ${etape} sur 3`">
          <li v-for="k in 3" :key="k" :class="{ fait: k <= etape }" />
        </ol>
        <span class="compteur tiny muted num">{{ etape }}/3</span>
      </header>

      <form ref="corps" class="contenu" tabindex="-1" @submit.prevent="suivant">
        <transition name="fade" mode="out-in">
          <div v-if="etape === 1" key="1" class="pas">
            <p class="kicker">{{ ETAPES[1] }}</p>
            <h2 class="display">Faisons connaissance</h2>
            <p class="muted">Pour te parler comme il faut et calculer tes repères.</p>
            <FormProfil v-model="p" partie="identite" />
          </div>
          <div v-else-if="etape === 2" key="2" class="pas">
            <p class="kicker">{{ ETAPES[2] }}</p>
            <h2 class="display">Ton point de départ</h2>
            <p class="muted">Pas de jugement : c’est juste la ligne de départ. On calcule tes calories et ton plan à partir de là.</p>
            <FormProfil v-model="p" partie="corps" />
            <p v-if="p.goalWeight >= p.startWeight" class="banner warn"><Icone nom="alerte" :taille="18" /> L’objectif doit être inférieur au poids de départ.</p>
            <p v-else class="tiny muted">IMC de départ : <b class="num">{{ imcDepart.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }}</b> · objectif : <b class="num">−{{ (p.startWeight - p.goalWeight).toLocaleString('fr-FR') }} kg</b>. Tu pourras tout modifier dans ton profil.</p>
          </div>
          <div v-else key="3" class="pas">
            <p class="kicker">{{ ETAPES[3] }}</p>
            <h2 class="display">Avant de commencer</h2>
            <div class="sante">
              <span class="s-ic"><Icone nom="medical" :taille="24" /></span>
              <p><b>FitMaison ne remplace pas un avis médical.</b> Consulte ton médecin avant de reprendre le sport, surtout si tu as un problème de cœur, de tension, de diabète ou de douleurs articulaires.</p>
            </div>
            <div class="stop">
              <p class="label">Arrête-toi immédiatement si tu ressens</p>
              <ul>
                <li>une douleur ou une gêne dans la poitrine</li>
                <li>un malaise, des vertiges</li>
                <li>un essoufflement anormal qui ne passe pas au repos</li>
                <li>une douleur vive dans une articulation</li>
              </ul>
            </div>
            <label class="accord">
              <input v-model="compris" type="checkbox" class="coche">
              <span>J’ai compris : je consulte mon médecin avant de reprendre et je m’arrête au moindre signal d’alerte.</span>
            </label>
          </div>
        </transition>
        <div class="actions">
          <button class="btn primary lg full" type="submit" :disabled="(etape === 1 && !identiteOk) || (etape === 2 && !corpsOk) || (etape === 3 && !valide)">
            <template v-if="etape < 3">Continuer <Icone nom="droite" :taille="20" /></template>
            <template v-else>C’est parti <Icone nom="ballon" :taille="20" /></template>
          </button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.bienvenue { min-height: 100dvh; }
/* — Intro — */
.ecran-intro { position: relative; min-height: 100dvh; display: flex; flex-direction: column; padding: calc(var(--safe-t) + 18px) 20px calc(var(--safe-b) + 22px); overflow: hidden; isolation: isolate; color: #fff;
  background: repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 44px, transparent 44px 88px), var(--pitch-grad); }
.pelouse { position: absolute; inset: 0; z-index: -1; pointer-events: none; }
.pelouse .rond { position: absolute; left: 50%; top: 26%; width: 300px; height: 300px; transform: translate(-50%, -50%); border: 2px solid var(--pitch-line); border-radius: 50%; }
.pelouse .ligne { position: absolute; left: 0; right: 0; top: 26%; height: 2px; background: var(--pitch-line); }
.intro-haut { display: flex; justify-content: center; }
.logo { display: flex; align-items: center; gap: 10px; }
.logo img { border-radius: 12px; box-shadow: 0 8px 20px -8px rgba(0,0,0,.6); }
.logo b { font-size: 24px; font-weight: 900; font-stretch: 72%; text-transform: uppercase; letter-spacing: .01em; }
.coach { display: grid; place-items: center; margin: 8px 0 0; --corps: #f4fbf5; --corps-fond: #9fc3a9; --decor: rgba(255,255,255,.45); --sol: rgba(255,255,255,.25); --zone: #c5f23b; }
.intro-txt { margin-top: auto; display: grid; gap: 12px; max-width: 520px; width: 100%; align-self: center; }
.intro-txt .kicker { color: var(--volt); }
.intro-txt h1 { margin: 0; font-size: 48px; color: #fff; }
.intro-txt h1 span { color: var(--volt); }
.sous { margin: 0; color: rgba(255,255,255,.88); font-size: 16px; }
.atouts { list-style: none; margin: 4px 0 8px; padding: 0; display: grid; gap: 8px; }
.atouts li { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14.5px; }
.atouts .ic { color: var(--volt); }

/* — Étapes — */
.ecran { max-width: 520px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; padding: calc(var(--safe-t) + 14px) 18px calc(var(--safe-b) + 20px); }
.haut { display: flex; align-items: center; gap: 14px; }
.progres { flex: 1; list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.progres li { height: 6px; border-radius: 3px; background: var(--surface-3); transition: background .3s; }
.progres li.fait { background: var(--brand-grad); }
.contenu { flex: 1; display: flex; flex-direction: column; outline: none; padding-top: 24px; }
.pas { display: grid; gap: 10px; }
.pas h2 { margin: 0; font-size: 40px; }
.pas > .muted { margin: 0 0 10px; }
.actions { margin-top: auto; padding-top: 22px; }
.sante { display: flex; gap: 12px; padding: 16px; border-radius: 18px; background: color-mix(in srgb, var(--danger) 9%, var(--surface)); border: 1px solid color-mix(in srgb, var(--danger) 26%, transparent); }
.sante p { margin: 0; font-size: 15px; }
.s-ic { width: 44px; height: 44px; flex: none; border-radius: 14px; display: grid; place-items: center; background: #dc2626; color: #fff; }
.stop { padding: 14px 16px; border-radius: 18px; background: var(--surface); border: 1px solid var(--border); }
.stop ul { margin: 8px 0 0; padding-left: 20px; display: grid; gap: 4px; font-size: 15px; font-weight: 600; }
.stop li::marker { color: var(--danger); }
.accord { display: flex; gap: 12px; align-items: flex-start; padding: 14px 16px; border-radius: 18px; background: var(--surface-2); cursor: pointer; font-weight: 700; font-size: 14.5px; }
@media (min-width: 992px) {
  .ecran-intro { align-items: center; justify-content: center; }
  .intro-txt { margin-top: 10px; }
  .intro-txt h1 { font-size: 64px; }
}
</style>
