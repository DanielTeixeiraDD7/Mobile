<script setup lang="ts">
import type { Module } from '@/content/types';
import { useProgressionStore } from '@/stores/progression';

const props = defineProps<{ module: Module; open?: boolean }>();
const progression = useProgressionStore();
const p = computed(() => progression.moduleProgress(props.module.id));
</script>

<template>
  <router-link :to="'/lecon/' + (module.lessons.find(l => !progression.state(l.id).done) ?? module.lessons[0])!.id" class="mod card" :style="{ '--c': module.color }">
    <span class="mod-icon"><i :class="module.icon" /></span>
    <span class="mod-body">
      <small>Module {{ module.id }} · {{ $t('commun.lecons', module.lessons.length) }}</small>
      <b>{{ module.title }}</b>
      <span class="mod-sum">{{ module.summary }}</span>
      <span class="mod-bar"><span class="bar"><i :style="{ width: p.percent + '%', background: module.color }" /></span><em>{{ p.done }}/{{ p.total }}</em></span>
    </span>
    <i v-if="p.done === p.total" class="pi pi-verified done" />
  </router-link>
</template>

<style scoped>
.mod { position: relative; display: flex; gap: 14px; padding: 16px; text-decoration: none; color: var(--ve-text); transition: transform .15s, border-color .15s; }
.mod:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--c) 45%, var(--ve-border)); }
.mod-icon { width: 46px; height: 46px; flex: none; border-radius: 14px; display: grid; place-items: center; background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c); font-size: 20px; }
.mod-body { display: grid; gap: 3px; min-width: 0; flex: 1; }
.mod-body small { color: var(--ve-dim); font-weight: 600; font-size: 12px; }
.mod-body b { font-size: 16.5px; letter-spacing: -.01em; }
.mod-sum { color: var(--ve-muted); font-size: 13.5px; }
.mod-bar { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
.mod-bar .bar { flex: 1; height: 6px; }
.mod-bar em { font-style: normal; font-size: 12px; font-weight: 700; color: var(--ve-muted); }
.done { position: absolute; top: 14px; right: 14px; color: var(--c); font-size: 18px; }
</style>
