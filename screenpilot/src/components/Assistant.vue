<script setup lang="ts">
import { answer, HELP, type Answer } from '@/domain/assistant';
import { mediaTitle } from '@/domain/labels';
import { useBiblio } from '@/stores/biblio';
import Icone from './Icone.vue';

/** Assistant local à règles : répond à partir de la bibliothèque, sans réseau ni IA en ligne. */
const biblio = useBiblio();
const q = ref('');
const tours = ref<{ q: string; a: Answer }[]>([]);
function demander(texte: string) {
  if (!texte.trim()) return;
  const a = answer(texte, { entries: biblio.entries, history: biblio.history, lang: biblio.settings.titleLanguage, now: Date.now() });
  tours.value = [{ q: texte, a }, ...tours.value].slice(0, 5);
  q.value = '';
}
</script>

<template>
  <div class="card assistant">
    <div class="row tete"><span class="ic"><Icone nom="bulle" :taille="18" /></span><b class="grow">Assistant</b><small class="dim">local · hors-ligne</small></div>
    <form class="row" @submit.prevent="demander(q)">
      <input v-model="q" class="input grow" placeholder="Que regarder ce soir ?" aria-label="Question à l’assistant" enterkeyhint="send">
      <button type="submit" class="btn primary" :disabled="!q.trim()">Demander</button>
    </form>
    <div v-if="!tours.length" class="chips">
      <button v-for="h in HELP.slice(0, 6)" :key="h" type="button" class="chip" @click="demander(h)">{{ h }}</button>
    </div>
    <div v-for="(t, i) in tours" :key="tours.length - i" class="tour">
      <p class="q">{{ t.q }}</p>
      <p class="a" :aria-live="i === 0 ? 'polite' : undefined">{{ t.a.text }}</p>
      <div v-if="t.a.entries?.length" class="chips wrap">
        <router-link v-for="e in t.a.entries" :key="e.id" :to="`/titre/${e.type}/${e.mediaId}`" class="chip">{{ mediaTitle(e.media, biblio.settings.titleLanguage) }}</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.assistant { padding: 14px 16px; display: grid; gap: 10px; }
.tete { gap: 10px; }
.ic { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; color: #fff; background: var(--brand-grad); }
.chips { margin: 0 -16px; }
.tour { border-top: 1px solid var(--border); padding-top: 10px; }
.q { margin: 0; font-weight: 700; font-size: 14px; color: var(--muted); }
.a { margin: 4px 0 8px; }
</style>
