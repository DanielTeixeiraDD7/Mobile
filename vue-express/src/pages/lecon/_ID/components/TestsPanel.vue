<script setup lang="ts">
import type { RunReport } from '@/lib/testing';
import type { TestCase } from '@/lib/testing';

const props = defineProps<{ tests: TestCase[]; rapport: RunReport | null; enCours: boolean }>();
defineEmits<{ lancer: [] }>();

const reussis = computed(() => props.rapport?.results.filter(r => r.ok).length ?? 0);
// Avant la première exécution, on liste les tests à faire passer.
const lignes = computed(() => props.rapport?.results.length
  ? props.rapport.results
  : props.tests.map(t => ({ name: t.name, ok: null as boolean | null, message: null as string | null })));
</script>

<template>
  <div class="tests">
    <div class="t-head" :class="{ ok: rapport?.passed, ko: rapport && !rapport.passed }">
      <span class="t-icon">
        <ProgressSpinner v-if="enCours" style="width:22px;height:22px" stroke-width="6" />
        <i v-else-if="rapport?.passed" class="pi pi-check" />
        <i v-else-if="rapport" class="pi pi-times" />
        <i v-else class="pi pi-list-check" />
      </span>
      <span class="grow">
        <b v-if="enCours">{{ $t('exercice.enCours') }}</b>
        <b v-else-if="rapport?.compileError">Le code ne compile pas</b>
        <b v-else-if="rapport">{{ reussis }} / {{ rapport.results.length }} tests réussis</b>
        <b v-else>{{ tests.length }} tests à faire passer</b>
        <small class="muted">{{ rapport?.passed ? 'Tout est vert : exercice validé.' : 'Chaque test monte ton app à neuf et simule un utilisateur.' }}</small>
      </span>
      <Button :label="$t('exercice.executer')" icon="pi pi-play" size="small" :loading="enCours" @click="$emit('lancer')" />
    </div>

    <div v-if="rapport?.compileError" class="compile">
      <b>{{ rapport.compileError.file }}<span v-if="rapport.compileError.line"> · ligne {{ rapport.compileError.line }}</span></b>
      <pre>{{ rapport.compileError.message }}</pre>
    </div>

    <ul v-else class="list">
      <li v-for="(r, i) in lignes" :key="i" :class="r.ok === null ? 'idle' : r.ok ? 'ok' : 'ko'" :style="{ animationDelay: i * 60 + 'ms' }">
        <i :class="r.ok === null ? 'pi pi-circle' : r.ok ? 'pi pi-check-circle' : 'pi pi-times-circle'" />
        <span>
          <span class="name">{{ r.name }}</span>
          <span v-if="r.message" class="msg">{{ r.message }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tests { display: flex; flex-direction: column; height: 100%; min-height: 0; border-radius: 16px; border: 1px solid var(--ve-border); background: var(--ve-surface); overflow: hidden; }
.t-head { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--ve-border); }
.t-head.ok { background: color-mix(in srgb, #22c55e 10%, var(--ve-surface)); }
.t-head.ko { background: color-mix(in srgb, #ef4444 7%, var(--ve-surface)); }
.t-icon { width: 38px; height: 38px; flex: none; border-radius: 12px; display: grid; place-items: center; background: var(--ve-surface-2); color: var(--ve-muted); font-size: 16px; }
.ok .t-icon { background: #22c55e; color: #fff; } .ko .t-icon { background: #ef4444; color: #fff; }
.grow { flex: 1; min-width: 0; display: grid; }
.grow small { font-size: 12.5px; }
.list { list-style: none; margin: 0; padding: 8px; overflow: auto; flex: 1; }
.list li { display: flex; gap: 10px; padding: 10px; border-radius: 12px; animation: pop .25s both; }
.list li + li { margin-top: 2px; }
.list li i { margin-top: 3px; }
.list li.idle i { color: var(--ve-dim); }
.list li.ok i { color: #16a34a; }
.list li.ko { background: color-mix(in srgb, #ef4444 6%, transparent); }
.list li.ko i { color: #dc2626; }
.name { display: block; font-weight: 600; font-size: 14px; }
.msg { display: block; margin-top: 4px; font-size: 13px; color: var(--ve-muted); }
.compile { padding: 14px 16px; }
.compile b { font: 700 13px "JetBrains Mono", monospace; color: #dc2626; }
.compile pre { white-space: pre-wrap; font: 13px/1.5 "JetBrains Mono", monospace; margin: 8px 0 0; }
@media (max-width: 991px) { .t-head :deep(.p-button) { display: none; } }
@keyframes pop { from { opacity: 0; transform: translateY(4px); } }
</style>
