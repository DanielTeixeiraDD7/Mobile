<script setup lang="ts">
import { RARITIES, RARITY_COLOR, RARITY_LABEL, type CollectionDTO, type Rarity } from '@nocturne/shared';
import { computed, ref } from 'vue';
import { useSession } from '@/stores/session';
import CardView from './CardView.vue';

const props = defineProps<{ pool: CollectionDTO; max?: number }>();
const model = defineModel<Record<string, number>>({ required: true });
const s = useSession();
const rarity = ref<Rarity | null>(null);
const cards = computed(() => s.cards.filter(c => (props.pool[c.id] ?? 0) > 0 && (!rarity.value || c.rarity === rarity.value)));
const total = computed(() => Object.values(model.value).reduce((a, b) => a + b, 0));

function toggle(id: string) {
  const cur = model.value[id] ?? 0;
  const next = { ...model.value };
  if (cur < (props.pool[id] ?? 0) && total.value < (props.max ?? 5)) next[id] = cur + 1;
  else delete next[id];
  model.value = next;
}
</script>

<template>
  <div class="picker">
    <div class="chips">
      <button type="button" class="chip" :class="{ on: !rarity }" @click="rarity = null">Toutes</button>
      <button v-for="r in RARITIES" :key="r" type="button" class="chip" :class="{ on: rarity === r }" :style="{ color: RARITY_COLOR[r] }" @click="rarity = r">{{ RARITY_LABEL[r] }}</button>
    </div>
    <div v-if="!cards.length" class="empty">Aucune carte.</div>
    <div class="grid">
      <button v-for="c in cards" :key="c.id" type="button" class="pick" :class="{ sel: model[c.id] }" @click="toggle(c.id)">
        <CardView :card="c" :qty="pool[c.id]" />
        <span v-if="model[c.id]" class="n">{{ model[c.id] }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 10px; max-height: 360px; overflow-y: auto; padding: 8px 4px; }
.pick { position: relative; padding: 0; border: 0; background: none; cursor: pointer; border-radius: 8px; transition: transform .1s; }
.pick.sel { outline: 3px solid var(--gold); outline-offset: 2px; transform: scale(.96); }
.n { position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%); background: var(--gold); color: #000; font-weight: 800; border-radius: 99px; padding: 0 8px; font-size: .8rem; }
</style>
