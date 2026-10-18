<script setup lang="ts">
import { lessonById, moduleOf, nextLesson, LESSONS } from '@/content';
import { inline } from '@/lib/highlight';
import LessonBlock from '@/shared/components/LessonBlock.vue';
import QuizCard from '@/shared/components/QuizCard.vue';
import { useProgressionStore } from '@/stores/progression';

defineProps<{ ID?: string }>(); // passé par le routeur (props: true) ; on lit useRoute()
const route = useRoute();
const router = useRouter();
const progression = useProgressionStore();

const id = computed(() => String(route.params.ID));
const lecon = computed(() => lessonById(id.value));
const module = computed(() => moduleOf(id.value));
const index = computed(() => LESSONS.findIndex(l => l.id === id.value));
const precedente = computed(() => LESSONS[index.value - 1] ?? null);
const suivante = computed(() => nextLesson(id.value));
const etat = computed(() => progression.state(id.value));

// Lecture = cartes débloquées. Le paramètre change sans recréer la page : on surveille.
watch(id, v => { if (lessonById(v)) progression.markRead(v); }, { immediate: true });

// Mini-quiz : la première carte de la leçon, pour vérifier la compréhension avant l'exercice.
const quizOk = ref<boolean | null>(null);
watch(id, () => { quizOk.value = null; });
</script>

<template>
  <div v-if="lecon && module" class="page lesson" :style="{ '--c': module.color }">
    <nav class="crumbs">
      <router-link to="/parcours"><i class="pi pi-map" /> Parcours</router-link>
      <i class="pi pi-angle-right" />
      <span>Module {{ module.id }} · {{ module.title }}</span>
    </nav>

    <header class="lhead">
      <span class="lnum">{{ lecon.id }}</span>
      <div>
        <h1 class="h-title">{{ lecon.title }}</h1>
        <p class="goal inline-code"><i class="pi pi-flag" /> <span v-html="inline(lecon.goal)" /></p>
        <div class="flex gap-2 flex-wrap">
          <span class="pill"><i class="pi pi-clock" /> {{ $t('commun.minutes', { n: lecon.minutes }) }}</span>
          <span class="pill" :class="lecon.exercise.kind === 'bug' ? 'bug' : 'green'">
            <i :class="lecon.exercise.kind === 'bug' ? 'pi pi-wrench' : 'pi pi-code'" />
            {{ lecon.exercise.kind === 'bug' ? 'Chasse au bug' : 'Exercice' }}
          </span>
          <span v-if="etat.done" class="pill green"><i class="pi pi-check-circle" /> Validée</span>
        </div>
      </div>
    </header>

    <article class="prose card pad">
      <LessonBlock v-for="(b, i) in lecon.blocks" :key="lecon.id + i" :block="b" />
    </article>

    <h2 class="section-title"><i class="pi pi-question-circle" style="color: var(--c)" /> Vérifie que c'est clair</h2>
    <QuizCard :card="lecon.cards[0]!" @answered="ok => (quizOk = ok)" @next="router.push('/lecon/' + lecon.id + '/exercice')" />

    <section class="cta card">
      <div class="grow">
        <b>{{ lecon.exercise.kind === 'bug' ? 'Trouve et corrige le bug' : 'À toi de coder' }}</b>
        <span class="muted small inline-code" v-html="inline(lecon.exercise.task.split('\n')[0]!)" />
      </div>
      <Button :label="etat.done ? 'Refaire l’exercice' : 'Faire l’exercice'" icon="pi pi-code" @click="router.push('/lecon/' + lecon.id + '/exercice')" />
    </section>

    <nav class="pager">
      <router-link v-if="precedente" :to="'/lecon/' + precedente.id" class="pg card">
        <i class="pi pi-arrow-left" /><span><small>Précédente</small><b>{{ precedente.title }}</b></span>
      </router-link>
      <span v-else />
      <router-link v-if="suivante" :to="'/lecon/' + suivante.id" class="pg card next">
        <span><small>Suivante</small><b>{{ suivante.title }}</b></span><i class="pi pi-arrow-right" />
      </router-link>
    </nav>
  </div>

  <div v-else class="page empty card pad">
    <i class="pi pi-compass" />
    <h2>Leçon introuvable</h2>
    <Button label="Voir le parcours" @click="router.push('/parcours')" />
  </div>
</template>

<route>
{ "meta": { "titre": "Leçon" } }
</route>

<style scoped>
.lesson { max-width: 820px; }
.crumbs { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ve-dim); margin-bottom: 14px; font-weight: 600; }
.crumbs a { color: var(--ve-muted); text-decoration: none; }
.lhead { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 20px; }
.lnum { flex: none; width: 56px; height: 56px; border-radius: 18px; display: grid; place-items: center; font-weight: 900; font-size: 17px; color: #fff; background: linear-gradient(140deg, var(--c), color-mix(in srgb, var(--c) 55%, #35495e)); box-shadow: 0 10px 24px -10px var(--c); }
.goal { color: var(--ve-muted); margin: 0 0 12px; }
.goal i { color: var(--c); }
.pill.bug { background: color-mix(in srgb, #f59e0b 15%, transparent); color: #b45309; }
.app-dark .pill.bug { color: #fbbf24; }
.prose { font-size: 16px; }
.prose :deep(p:last-child) { margin-bottom: 0; }
.cta { display: flex; align-items: center; gap: 16px; padding: 18px 20px; margin-top: 18px; border-color: color-mix(in srgb, var(--c) 40%, var(--ve-border)); background: color-mix(in srgb, var(--c) 6%, var(--ve-surface)); }
.cta .grow { flex: 1; display: grid; gap: 2px; min-width: 0; }
.pager { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 22px; }
.pg { display: flex; align-items: center; gap: 12px; padding: 14px 16px; text-decoration: none; color: var(--ve-text); min-width: 0; }
.pg.next { justify-content: flex-end; text-align: right; }
.pg span { display: grid; min-width: 0; }
.pg small { color: var(--ve-dim); font-weight: 700; font-size: 12px; }
.pg b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.empty { text-align: center; display: grid; justify-items: center; gap: 8px; max-width: 420px; }
.empty > i { font-size: 36px; color: var(--ve-dim); }
@media (max-width: 991px) {
  .lhead { gap: 12px; }
  .lnum { width: 46px; height: 46px; border-radius: 14px; font-size: 15px; }
  .h-title { font-size: 24px; }
  .cta { flex-direction: column; align-items: stretch; }
  .pager { grid-template-columns: 1fr; }
  .pager > span { display: none; }
}
</style>
