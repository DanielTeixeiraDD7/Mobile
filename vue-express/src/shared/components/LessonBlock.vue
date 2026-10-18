<script setup lang="ts">
import type { Block } from '@/content/types';
import { inline } from '@/lib/highlight';
import CodeBlock from './CodeBlock.vue';
defineProps<{ block: Block }>();
</script>

<template>
  <p v-if="block.t === 'p'" v-html="inline(block.text)" />
  <CodeBlock v-else-if="block.t === 'code'" :code="block.code" :lang="block.lang" :title="block.title" />
  <ul v-else-if="block.t === 'list'"><li v-for="(it, i) in block.items" :key="i" v-html="inline(it)" /></ul>
  <div v-else-if="block.t === 'tip'" class="callout tip"><i class="pi pi-lightbulb" /><p v-html="inline(block.text)" /></div>
  <div v-else-if="block.t === 'warn'" class="callout warn"><i class="pi pi-exclamation-triangle" /><p v-html="inline(block.text)" /></div>
  <div v-else-if="block.t === 'sql'" class="sqlbridge">
    <div class="sb-head"><i class="pi pi-database" /> Pont PL/SQL</div>
    <div class="sb-body">
      <p class="m-0" v-html="inline(block.text)" />
      <CodeBlock v-if="block.code" :code="block.code" lang="sql" title="PL/SQL" />
    </div>
  </div>
</template>
