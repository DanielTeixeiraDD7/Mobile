<script setup lang="ts">
import type { Card } from '@/content/types';
import { inline } from '@/lib/highlight';
import CodeBlock from './CodeBlock.vue';

const props = defineProps<{ card: Card; index?: number; total?: number }>();
const emit = defineEmits<{ answered: [ok: boolean]; next: [] }>();

const choisi = ref<number | null>(null);
watch(() => props.card.id, () => { choisi.value = null; });
const repondu = computed(() => choisi.value !== null);
const juste = computed(() => choisi.value === props.card.answer);

function choisir(i: number) {
  if (repondu.value) return;
  choisi.value = i;
  emit('answered', i === props.card.answer);
}
</script>

<template>
  <div class="quiz card pad">
    <div v-if="total" class="flex align-items-center justify-content-between mb-3">
      <span class="pill">Question {{ (index ?? 0) + 1 }} / {{ total }}</span>
      <slot name="meta" />
    </div>
    <h3 class="q" v-html="inline(card.q)" />
    <CodeBlock v-if="card.code" :code="card.code" lang="js" />
    <div class="choices" role="radiogroup">
      <button v-for="(c, i) in card.choices" :key="i" type="button" role="radio" :aria-checked="choisi === i"
        class="choice inline-code" :class="{ ok: repondu && i === card.answer, ko: repondu && i === choisi && !juste, off: repondu && i !== card.answer && i !== choisi }"
        :disabled="repondu" @click="choisir(i)">
        <span class="letter">{{ 'ABCD'[i] }}</span><span v-html="inline(c)" />
        <i v-if="repondu && i === card.answer" class="pi pi-check-circle ml-auto" />
        <i v-else-if="repondu && i === choisi" class="pi pi-times-circle ml-auto" />
      </button>
    </div>
    <transition name="fade">
      <div v-if="repondu" class="explain" :class="juste ? 'good' : 'bad'">
        <b>{{ juste ? 'Bonne réponse !' : 'Pas tout à fait.' }}</b>
        <span class="inline-code" v-html="inline(card.explain)" />
        <div class="mt-3"><Button :label="'Continuer'" icon="pi pi-arrow-right" icon-pos="right" size="small" @click="emit('next')" /></div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.q { font-size: 19px; line-height: 1.35; margin: 0 0 16px; letter-spacing: -.01em; }
.choices { display: grid; gap: 10px; }
.choice { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; padding: 12px 14px; border-radius: 14px; border: 1.5px solid var(--ve-border); background: var(--ve-surface); color: var(--ve-text); font: inherit; cursor: pointer; transition: border-color .15s, background .15s, transform .1s; }
.choice:hover:not(:disabled) { border-color: var(--ve-green); background: color-mix(in srgb, var(--ve-green) 5%, var(--ve-surface)); }
.choice:active:not(:disabled) { transform: scale(.99); }
.choice:disabled { cursor: default; }
.letter { width: 28px; height: 28px; flex: none; display: grid; place-items: center; border-radius: 9px; background: var(--ve-surface-2); font-weight: 800; font-size: 13px; color: var(--ve-muted); }
.choice.ok { border-color: #22c55e; background: color-mix(in srgb, #22c55e 10%, var(--ve-surface)); }
.choice.ok .letter { background: #22c55e; color: #fff; } .choice.ok i { color: #16a34a; }
.choice.ko { border-color: #ef4444; background: color-mix(in srgb, #ef4444 9%, var(--ve-surface)); }
.choice.ko .letter { background: #ef4444; color: #fff; } .choice.ko i { color: #dc2626; }
.choice.off { opacity: .55; }
.explain { margin-top: 16px; padding: 14px 16px; border-radius: 14px; display: grid; gap: 4px; }
.explain.good { background: color-mix(in srgb, #22c55e 10%, var(--ve-surface)); }
.explain.bad { background: color-mix(in srgb, #f59e0b 11%, var(--ve-surface)); }
</style>
