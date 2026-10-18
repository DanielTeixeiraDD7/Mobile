<script setup lang="ts">
import { MODULES } from '@/content';
import { useProgressionStore } from '@/stores/progression';

const progression = useProgressionStore();

// Une leçon est « en cours » si lue mais pas validée.
function statut(id: string) {
  const s = progression.state(id);
  return s.done ? 'done' : s.read ? 'reading' : 'todo';
}
const prochaineId = computed(() => progression.nextLesson?.id ?? null);
</script>

<template>
  <div class="page">
    <h1 class="h-title">Le parcours</h1>
    <p class="h-sub">8 modules, dans l'ordre où tu en as besoin au travail. Chaque leçon : 5 min de lecture, un exercice vérifié automatiquement, 3 cartes de révision.</p>

    <section v-for="m in MODULES" :key="m.id" class="mod card" :style="{ '--c': m.color }">
      <header class="mod-head">
        <span class="mod-icon"><i :class="m.icon" /></span>
        <span class="grow">
          <small>Module {{ m.id }}</small>
          <h2>{{ m.title }}</h2>
          <span class="muted small">{{ m.summary }}</span>
        </span>
        <span class="mod-count">{{ progression.moduleProgress(m.id).done }}/{{ m.lessons.length }}</span>
      </header>
      <ol class="steps">
        <li v-for="l in m.lessons" :key="l.id" :class="[statut(l.id), { next: l.id === prochaineId }]">
          <router-link :to="'/lecon/' + l.id" class="step">
            <span class="dot">
              <i v-if="statut(l.id) === 'done'" class="pi pi-check" />
              <span v-else>{{ l.id.split('-')[1] }}</span>
            </span>
            <span class="grow">
              <b>{{ l.title }}</b>
              <small class="muted">{{ l.goal }}</small>
            </span>
            <span class="meta">
              <span v-if="l.exercise.kind === 'bug'" class="pill bug"><i class="pi pi-wrench" /> Bug</span>
              <span class="dim tiny">{{ $t('commun.minutes', { n: l.minutes }) }}</span>
            </span>
          </router-link>
        </li>
      </ol>
    </section>
  </div>
</template>

<route>
{ "meta": { "titre": "Parcours" } }
</route>

<style scoped>
.mod { padding: 18px 18px 8px; margin-bottom: 16px; }
.mod-head { display: flex; gap: 14px; align-items: flex-start; padding-bottom: 8px; }
.mod-icon { width: 46px; height: 46px; flex: none; border-radius: 14px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c); font-size: 20px; }
.mod-head small { color: var(--ve-dim); font-weight: 700; font-size: 12px; }
.mod-head h2 { margin: 0 0 2px; font-size: 19px; letter-spacing: -.01em; }
.mod-count { font-weight: 800; color: var(--c); font-size: 14px; padding-top: 4px; }
.grow { flex: 1; min-width: 0; display: grid; }
.steps { list-style: none; margin: 0; padding: 0; position: relative; }
.steps li { position: relative; }
.steps li + li::before { content: ""; position: absolute; left: 31px; top: -10px; height: 20px; width: 2px; background: var(--ve-border); }
.steps li.done + li::before { background: var(--c); }
.step { display: flex; align-items: center; gap: 14px; padding: 10px 12px; margin: 0 -2px; border-radius: 14px; text-decoration: none; color: var(--ve-text); transition: background .15s; }
.step:hover { background: var(--ve-surface-2); }
.step b { font-size: 15px; }
.step small { display: block; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dot { position: relative; z-index: 1; width: 36px; height: 36px; flex: none; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: 14px; background: var(--ve-surface-2); color: var(--ve-muted); border: 2px solid var(--ve-border); }
.done .dot { background: var(--c); border-color: var(--c); color: #fff; }
.reading .dot { border-color: var(--c); color: var(--c); background: var(--ve-surface); }
.next .dot { box-shadow: 0 0 0 5px color-mix(in srgb, var(--c) 20%, transparent); border-color: var(--c); color: var(--c); }
.meta { display: flex; align-items: center; gap: 8px; flex: none; }
.pill.bug { background: color-mix(in srgb, #f59e0b 15%, transparent); color: #b45309; }
.app-dark .pill.bug { color: #fbbf24; }
@media (max-width: 991px) {
  .step small { white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
  .meta .tiny { display: none; }
}
</style>
