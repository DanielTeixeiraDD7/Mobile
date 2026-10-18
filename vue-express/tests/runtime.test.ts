import { describe, expect as vexpect, it } from 'vitest';
import { expect, runTests } from '../src/lib/testing';
import { pagesToRoutes, resolvePath } from '../src/lib/runtime';
import { toModuleBody, withAutoImports } from '../src/lib/compile';

describe('compilation', () => {
  it('auto-imports : seulement ce qui est utilisé et pas déjà importé', () => {
    const out = withAutoImports("import { ref } from 'vue'\nconst a = ref(0); const b = computed(() => 1); const r = useRoute(); // watch(x)");
    vexpect(out).toContain("import { computed } from 'vue';");
    vexpect(out).toContain("import { useRoute } from 'vue-router';");
    vexpect(out).not.toContain('watch,');
  });
  it('ESM → module', () => {
    const m = toModuleBody("import A, { b as c } from './x'\nimport * as N from 'vue'\nexport const k = 1\nexport default { a: 1 }\nexport function f() {}");
    vexpect(m).toContain('const A = __req("./x").default;');
    vexpect(m).toMatch(/const \{\s*b: c\s*\} = __req\("\.\/x"\);/);
    vexpect(m).toContain('const N = __req("vue");');
    vexpect(m).toContain('__exports.k = k;');
    vexpect(m).toContain('__exports.f = f;');
  });
  it('routes par fichiers', () => {
    vexpect(pagesToRoutes(['pages/index.vue', 'pages/salaries/_ID.vue', 'pages/salaries/index.vue', 'pages/salaries/_ID/detail.vue', 'pages/salaries/components/Ligne.vue']))
      .toEqual([{ path: '/', file: 'pages/index.vue' }, { path: '/salaries', file: 'pages/salaries/index.vue' }, { path: '/salaries/:ID', file: 'pages/salaries/_ID.vue' }, { path: '/salaries/:ID/detail', file: 'pages/salaries/_ID/detail.vue' }]);
    vexpect(resolvePath('../components/Carte', 'pages/x/index.vue', { 'pages/components/Carte.vue': '' })).toBe('pages/components/Carte.vue');
    vexpect(resolvePath('@/stores/session', 'App.vue', { 'stores/session.js': '' })).toBe('stores/session.js');
  });
});

describe('exécution', () => {
  it('compteur réactif sans import (auto-import)', async () => {
    const r = await runTests({ 'App.vue': `<script setup>\nconst n = ref(0)\nconst double = computed(() => n.value * 2)\n</script>\n<template><button data-test="b" @click="n++">{{ n }}</button><p data-test="d">{{ double }}</p></template>` }, [
      { name: 'clic', run: async w => { await w.click('[data-test=b]'); await w.click('[data-test=b]'); expect(w.text('[data-test=b]')).toBe('2'); expect(w.text('[data-test=d]')).toBe('4'); } },
    ]);
    vexpect(r.compileError).toBeNull();
    vexpect(r.results).toEqual([{ name: 'clic', ok: true, message: null }]);
  });
  it('composant enfant, props, emit, slot', async () => {
    const r = await runTests({
      'App.vue': `<script setup>\nimport Carte from './components/Carte.vue'\nconst total = ref(0)\n</script>\n<template><Carte titre="Léa" @plus="total++"><template #pied="{ n }">pied {{ n }}</template></Carte><span data-test="t">{{ total }}</span></template>`,
      'components/Carte.vue': `<script setup>\ndefineProps({ titre: String })\nconst emit = defineEmits(['plus'])\n</script>\n<template><h2 data-test="h">{{ titre }}</h2><button data-test="p" @click="emit('plus')">+</button><slot name="pied" :n="7" /></template>`,
    }, [{ name: 'ok', run: async w => { expect(w.text('[data-test=h]')).toBe('Léa'); await w.click('[data-test=p]'); expect(w.text('[data-test=t]')).toBe('1'); expect(w.text()).toContain('pied 7'); } }]);
    vexpect(r.results[0]).toEqual({ name: 'ok', ok: true, message: null });
  });
  it('routage _ID, <route> meta, store Pinia, API fictive', async () => {
    const r = await runTests({
      'App.vue': `<template><router-view /></template>`,
      'pages/index.vue': `<template><p data-test="home">Accueil</p></template>`,
      'pages/salaries/_ID.vue': `<script setup>\nimport { fetchSalarie } from '@/lib/api'\nimport { useSession } from '@/stores/session'\nconst route = useRoute()\nconst s = ref(null)\nconst session = useSession()\nonMounted(async () => { s.value = await fetchSalarie(route.params.ID) })\n</script>\n<template><p data-test="nom" v-if="s">{{ s.prenom }} {{ session.user }} {{ $route.meta.titre }}</p></template>\n<route>{ "meta": { "titre": "Fiche" } }</route>`,
      'stores/session.js': `export const useSession = defineStore('session', () => { const user = ref('moi'); return { user } })`,
    }, [{ name: 'fiche', run: async w => { expect(w.text('[data-test=home]')).toBe('Accueil'); await w.go('/salaries/2'); await w.until(() => w.exists('[data-test=nom]'), 'chargement'); expect(w.text('[data-test=nom]')).toBe('Hugo moi Fiche'); } }]);
    vexpect(r.results[0]).toEqual({ name: 'fiche', ok: true, message: null });
  });
  it('erreur de compilation localisée', async () => {
    const r = await runTests({ 'App.vue': `<template><div>{{ a. }}</div></template>` }, [{ name: 'x', run: () => {} }]);
    vexpect(r.compileError?.file).toBe('App.vue');
  });
  it('échec lisible', async () => {
    const r = await runTests({ 'App.vue': `<template><p data-test="x">1</p></template>` }, [{ name: 'x', run: w => expect(w.text('[data-test=x]'), 'Le compteur').toBe('2') }]);
    vexpect(r.results[0]!.message).toBe('Le compteur : attendu « 2 », obtenu « 1 ».');
  });
  it('composants PrimeVue disponibles', async () => {
    const r = await runTests({ 'App.vue': `<template><Button data-test="b" label="Valider" /></template>` }, [{ name: 'pv', run: w => expect(w.text('[data-test=b]')).toBe('Valider') }]);
    vexpect(r.results[0]?.ok, r.results[0]?.message ?? '').toBe(true);
  });
});
