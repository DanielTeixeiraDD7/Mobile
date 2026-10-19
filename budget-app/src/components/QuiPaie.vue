<script setup lang="ts">
import type { Kind } from '@/core/types';
import { useBudgetStore } from '@/stores/budget';
import { coupleIds, memberName } from '@/core/sync.js';

/** « Payé par » + « Commun / Perso » : seulement dans un budget à deux. */
const props = defineProps<{ type: Kind }>();
const paidBy = defineModel<string | null | undefined>('paidBy');
const shared = defineModel<boolean | undefined>('shared');
const budget = useBudgetStore();
const ids = computed(() => (budget.tick, budget.couple ? coupleIds() : []));
const payeur = computed(() => paidBy.value || budget.moi?.id);
const nom = (id: string) => (budget.tick, memberName(id) ?? '?');
</script>

<template>
  <div v-if="budget.couple" class="qui">
    <span class="label">{{ $t(props.type === 'income' ? 'who.receivedBy' : 'who.paidBy') }}</span>
    <div class="seg mini">
      <button v-for="(id, i) in ids" :key="id" type="button" :class="['p' + i, { on: id === payeur }]" @click="paidBy = id">
        <i class="pastille" />{{ nom(id) }}
      </button>
    </div>
    <button v-if="props.type === 'expense'" type="button" class="chip partage" :class="{ perso: shared === false }" @click="shared = shared === false">
      {{ $t(shared === false ? 'who.personal' : 'who.shared') }}
    </button>
  </div>
</template>

<style scoped>
.qui { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.qui .label { font-size: 12px; }
.mini { padding: 3px; border-radius: 12px; }
.mini button { min-height: 32px; padding: 0 12px; font-size: 14px; display: flex; align-items: center; gap: 7px; }
.pastille { width: 8px; height: 8px; border-radius: 50%; background: var(--p0); }
.p1 .pastille { background: var(--p1); }
.partage { margin-left: auto; background: var(--brand-soft); border-color: transparent; color: var(--brand-2); }
.dark .partage { color: var(--brand); }
.partage.perso { background: color-mix(in srgb, var(--warn) 16%, transparent); color: #b45309; }
.dark .partage.perso { color: #fbbf24; }
</style>
