<script setup lang="ts">
import { highlight } from '@/lib/highlight';
const props = defineProps<{ code: string; lang?: 'vue' | 'js' | 'sql'; title?: string }>();
const html = computed(() => highlight(props.code, props.lang ?? 'vue'));
const copie = ref(false);
async function copier() {
  try { await navigator.clipboard.writeText(props.code); copie.value = true; setTimeout(() => (copie.value = false), 1500); } catch { /* presse-papiers indisponible */ }
}
</script>

<template>
  <div class="codeblock">
    <div class="cb-head">
      <span class="dots"><i /><i /><i /></span>
      <span>{{ title ?? (lang === 'sql' ? 'PL/SQL' : lang === 'js' ? 'JavaScript' : 'Vue') }}</span>
      <button class="copy" type="button" @click="copier" :aria-label="copie ? 'Copié' : 'Copier le code'"><i :class="copie ? 'pi pi-check' : 'pi pi-copy'" /></button>
    </div>
    <pre><code v-html="html" /></pre>
  </div>
</template>
