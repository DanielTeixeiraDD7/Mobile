<script setup lang="ts">
import { EXERCICES, MATERIEL, type Exercice } from '@/core/exercices';
import CoachVideo from './CoachVideo.vue';
import Icone from './Icone.vue';

/** Tout pour comprendre un exercice : vidéo du coach (ralenti, voix, sous-titres), consignes, points clés, erreurs, sensations. */
const props = withDefaults(defineProps<{ ex: Exercice; compact?: boolean }>(), { compact: false });
const emit = defineEmits<{ ouvrir: [id: string] }>();

const facile = computed(() => (props.ex.versionFacile ? EXERCICES[props.ex.versionFacile] : undefined));
</script>

<template>
  <article class="guide">
    <CoachVideo :ex="ex" class="video" />

    <div class="tags">
      <span class="tag">{{ ex.cat }}</span>
      <span class="tag">{{ ex.muscles }}</span>
      <span v-if="ex.tenue" class="tag">Position tenue</span>
      <span v-if="ex.unilateral" class="tag">Change de côté à mi-temps</span>
    </div>

    <section v-if="ex.materiel.length" class="bloc materiel">
      <h3><Icone nom="boite" :taille="18" /> Il te faut</h3>
      <ul>
        <li v-for="m in ex.materiel" :key="m"><span class="emoji">{{ MATERIEL[m].icone }}</span><span><b>{{ MATERIEL[m].nom }}</b><small>{{ MATERIEL[m].aide }}</small></span></li>
      </ul>
    </section>

    <section class="bloc">
      <h3><span class="num">1</span> Position de départ</h3>
      <p>{{ ex.depart }}</p>
    </section>

    <section class="bloc">
      <h3><span class="num">2</span> Le mouvement</h3>
      <ol class="etapes">
        <li v-for="(e, i) in ex.etapes" :key="i">{{ e }}</li>
      </ol>
      <p v-if="ex.tempo" class="tempo"><Icone nom="horloge" :taille="16" /> {{ ex.tempo }}</p>
    </section>

    <section class="bloc">
      <h3><span class="num">3</span> Respiration</h3>
      <p>{{ ex.respiration }}</p>
    </section>

    <section class="bloc cles">
      <h3><Icone nom="check" :taille="18" /> Points clés</h3>
      <ul><li v-for="c in ex.cles" :key="c">{{ c }}</li></ul>
    </section>

    <section class="bloc erreurs">
      <h3><Icone nom="fermer" :taille="18" /> Erreurs fréquentes</h3>
      <ul><li v-for="c in ex.erreurs" :key="c">{{ c }}</li></ul>
    </section>

    <section class="bloc sensation">
      <h3><Icone nom="cible" :taille="18" /> Tu dois sentir</h3>
      <p>{{ ex.sensation }}</p>
    </section>

    <section v-if="ex.facile || ex.difficile" class="bloc niveaux">
      <div v-if="ex.facile">
        <h3><Icone nom="baisse" :taille="18" /> Trop dur ?</h3>
        <p>{{ ex.facile }}</p>
        <button v-if="facile" type="button" class="lien small" @click="emit('ouvrir', facile.id)">Voir « {{ facile.nom }} » →</button>
      </div>
      <div v-if="ex.difficile">
        <h3><Icone nom="tendanceHaut" :taille="18" /> Trop facile ?</h3>
        <p>{{ ex.difficile }}</p>
      </div>
    </section>

    <section v-if="ex.securite" class="bloc securite">
      <h3><Icone nom="alerte" :taille="18" /> Sécurité</h3>
      <p>{{ ex.securite }}</p>
    </section>
    <p class="tiny dim avis">En cas de douleur (pas de simple fatigue), arrête l’exercice. Ces conseils ne remplacent pas l’avis d’un médecin ou d’un kiné.</p>
  </article>
</template>

<style scoped>
.tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 14px 0 4px; }
.bloc { margin-top: 16px; }
.bloc h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font-size: 16px; letter-spacing: -.01em; }
.bloc p { margin: 0; color: var(--muted); line-height: 1.55; }
.num { width: 24px; height: 24px; border-radius: 50%; display: inline-grid; place-items: center; background: var(--brand-grad); color: var(--on-volt); font-size: 13px; font-weight: 850; }
.etapes { margin: 0; padding-left: 22px; display: grid; gap: 6px; color: var(--text); line-height: 1.5; }
.etapes li::marker { color: var(--brand); font-weight: 800; }
.tempo { display: flex; align-items: center; gap: 6px; margin-top: 8px !important; font-weight: 700; color: var(--brand) !important; font-size: 14px; }
.bloc ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.cles li, .erreurs li { position: relative; padding-left: 26px; line-height: 1.45; }
.cles li::before, .erreurs li::before { position: absolute; left: 0; top: 0; font-weight: 900; }
.cles li::before { content: '✓'; color: var(--good); }
.erreurs li::before { content: '✗'; color: var(--bad); }
.cles h3 :deep(.ic) { color: var(--good); }
.erreurs h3 :deep(.ic) { color: var(--bad); }
.sensation { padding: 12px 14px; border-radius: 16px; background: var(--brand-soft); }
.sensation p { color: var(--text); }
.sensation h3 :deep(.ic) { color: var(--brand); }
.niveaux { display: grid; gap: 12px; }
.securite { padding: 12px 14px; border-radius: 16px; background: color-mix(in srgb, var(--warn) 14%, transparent); }
.securite h3 :deep(.ic) { color: var(--warn); }
.materiel li { display: flex; gap: 10px; align-items: flex-start; }
.materiel .emoji { font-size: 22px; line-height: 1; }
.materiel b { display: block; font-size: 14.5px; }
.materiel small { display: block; color: var(--muted); font-size: 13px; }
.avis { margin-top: 18px; }
</style>
