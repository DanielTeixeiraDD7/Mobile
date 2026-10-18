<script setup lang="ts">
import { ALL_CARDS } from '@/content';
import { MAX_BOX } from '@/lib/srs';
import QuizCard from '@/shared/components/QuizCard.vue';
import Celebration from '@/shared/components/Celebration.vue';
import { useProgressionStore } from '@/stores/progression';

type CarteSession = (typeof ALL_CARDS)[number];

const progression = useProgressionStore();
const router = useRouter();

const MAX_SESSION = 15;
const melanger = <T,>(a: T[]) => a.map(x => [Math.random(), x] as const).sort((p, q) => p[0] - q[0]).map(p => p[1]);

// La session est figée au départ : les cartes répondues quittent « dues » pendant la partie.
const session = ref<CarteSession[]>([]);
const mode = ref<'revision' | 'entrainement'>('revision');
const index = ref(0);
const bonnes = ref(0);
const finie = ref(false);
const fete = ref(false);

function demarrer(m: 'revision' | 'entrainement') {
  mode.value = m;
  const source = m === 'revision' ? progression.dueCards : ALL_CARDS.filter(c => progression.cards[c.id]);
  session.value = melanger(source).slice(0, m === 'revision' ? MAX_SESSION : 10);
  index.value = 0; bonnes.value = 0; finie.value = false; fete.value = false;
}

const carte = computed(() => session.value[index.value] ?? null);
const enCours = computed(() => session.value.length > 0 && !finie.value);

function repondu(ok: boolean) {
  if (ok) bonnes.value++;
  // L'entraînement libre ne touche pas au calendrier de révision.
  if (mode.value === 'revision') progression.answer(carte.value!.id, ok);
}
function suivante() {
  if (index.value + 1 < session.value.length) { index.value++; return; }
  finie.value = true;
  if (bonnes.value === session.value.length) fete.value = true;
}
function quitter() { session.value = []; finie.value = false; }

// Répartition des cartes débloquées par boîte (0 = nouvelle … 5 = acquise).
const boites = computed(() => {
  const n = Array.from({ length: MAX_BOX + 1 }, () => 0);
  for (const s of Object.values(progression.cards)) n[s.box]!++;
  return n;
});
const libelles = ['Nouvelles', 'Demain', '3 j', '1 sem.', '2 sem.', '1 mois'];
const maxBoite = computed(() => Math.max(1, ...boites.value));
</script>

<template>
  <div class="page rev">
    <template v-if="!enCours && !finie">
      <h1 class="h-title">Révision</h1>
      <p class="h-sub">Les notions reviennent juste avant que tu les oublies : demain, dans 3 jours, une semaine, un mois…</p>

      <div v-if="!progression.unlockedCards" class="empty card pad">
        <span class="big"><i class="pi pi-book" /></span>
        <h2>Pas encore de cartes</h2>
        <p class="muted">Chaque leçon lue débloque 3 cartes de révision.</p>
        <Button label="Commencer le parcours" icon="pi pi-play" @click="router.push('/parcours')" />
      </div>

      <template v-else>
        <section class="start card" :class="{ none: !progression.dueCards.length }">
          <span class="start-icon"><i class="pi pi-bolt" /></span>
          <div class="grow">
            <b class="n">{{ progression.dueCards.length }}</b>
            <span>{{ progression.dueCards.length > 1 ? 'cartes à réviser' : progression.dueCards.length ? 'carte à réviser' : 'Tout est à jour pour aujourd’hui' }}</span>
          </div>
          <Button v-if="progression.dueCards.length" :label="'Réviser (' + Math.min(MAX_SESSION, progression.dueCards.length) + ')'" icon="pi pi-play" @click="demarrer('revision')" />
          <Button v-else label="S'entraîner quand même" icon="pi pi-refresh" severity="secondary" outlined @click="demarrer('entrainement')" />
        </section>

        <h2 class="section-title">Tes cartes</h2>
        <div class="card pad">
          <div class="boxes">
            <div v-for="(n, i) in boites" :key="i" class="box">
              <span class="col"><i :style="{ height: (n / maxBoite) * 100 + '%', opacity: 0.35 + i * 0.13 }" /></span>
              <b>{{ n }}</b>
              <small>{{ libelles[i] }}</small>
            </div>
          </div>
          <p class="muted small mb-0 mt-3">
            {{ progression.unlockedCards }} cartes débloquées sur {{ ALL_CARDS.length }} · <b class="text-color">{{ progression.mastered }}</b> maîtrisées (révisées avec succès à 1, 3 puis 7 jours).
          </p>
        </div>
      </template>
    </template>

    <template v-else-if="enCours && carte">
      <div class="run-head">
        <button class="x" type="button" aria-label="Quitter la session" @click="quitter"><i class="pi pi-times" /></button>
        <span class="bar grow"><i :style="{ width: (index / session.length) * 100 + '%' }" /></span>
        <span class="pill">{{ mode === 'revision' ? 'Révision' : 'Entraînement' }}</span>
      </div>
      <QuizCard :card="carte" :index="index" :total="session.length" @answered="repondu" @next="suivante">
        <template #meta>
          <router-link :to="'/lecon/' + carte.lessonId" class="small dim">Leçon {{ carte.lessonId }}</router-link>
        </template>
      </QuizCard>
    </template>

    <div v-else class="done card pad">
      <span class="big" :class="{ gold: bonnes === session.length }"><i :class="bonnes === session.length ? 'pi pi-trophy' : 'pi pi-check'" /></span>
      <h2>{{ bonnes === session.length ? 'Sans faute !' : 'Session terminée' }}</h2>
      <p class="score"><b>{{ bonnes }}</b> / {{ session.length }} bonnes réponses</p>
      <p class="muted small">{{ mode === 'revision' ? 'Les cartes ratées reviendront demain, les autres plus tard.' : 'Entraînement libre : ton calendrier de révision n’a pas bougé.' }}</p>
      <div class="flex gap-2 justify-content-center flex-wrap">
        <Button label="Retour" severity="secondary" outlined @click="quitter" />
        <Button label="Tableau de bord" icon="pi pi-home" @click="router.push('/')" />
      </div>
    </div>
    <Celebration :active="fete" />
  </div>
</template>

<route>
{ "meta": { "titre": "Révision" } }
</route>

<style scoped>
.rev { max-width: 760px; }
.grow { flex: 1; min-width: 0; }
.start { display: flex; align-items: center; gap: 16px; padding: 20px; background: linear-gradient(120deg, color-mix(in srgb, #f5b301 14%, var(--ve-surface)), var(--ve-surface) 70%); }
.start.none { background: var(--ve-surface); }
.start-icon { width: 54px; height: 54px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(135deg, #f5b301, #f59e0b); color: #fff; font-size: 24px; flex: none; box-shadow: 0 10px 22px -10px #f59e0b; }
.start.none .start-icon { background: var(--ve-surface-2); color: var(--ve-dim); box-shadow: none; }
.start .grow { display: grid; }
.start .n { font-size: 28px; line-height: 1; letter-spacing: -.02em; }
.boxes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; }
.box { display: grid; justify-items: center; gap: 4px; }
.col { width: 100%; max-width: 54px; height: 90px; border-radius: 10px; background: var(--ve-surface-2); display: flex; align-items: flex-end; overflow: hidden; }
.col i { display: block; width: 100%; background: var(--ve-green); border-radius: 10px 10px 0 0; transition: height .6s cubic-bezier(.2,.8,.2,1); min-height: 0; }
.box b { font-size: 16px; } .box small { font-size: 11.5px; color: var(--ve-dim); font-weight: 600; text-align: center; }
.empty, .done { text-align: center; display: grid; justify-items: center; gap: 4px; }
.empty h2, .done h2 { margin: 10px 0 0; }
.big { width: 70px; height: 70px; border-radius: 22px; display: grid; place-items: center; font-size: 30px; background: color-mix(in srgb, var(--ve-green) 15%, transparent); color: var(--ve-green); }
.big.gold { background: linear-gradient(135deg, #f5b301, #f59e0b); color: #fff; box-shadow: 0 14px 30px -12px #f59e0b; }
.score { font-size: 18px; margin: 4px 0; } .score b { font-size: 26px; color: var(--ve-green); }
.run-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.run-head .bar { height: 10px; }
.x { width: 36px; height: 36px; border-radius: 11px; border: 1px solid var(--ve-border); background: var(--ve-surface); color: var(--ve-muted); cursor: pointer; display: grid; place-items: center; }
@media (max-width: 600px) {
  .start { flex-wrap: wrap; }
  .start :deep(.p-button) { width: 100%; }
  .boxes { gap: 6px; }
}
</style>
