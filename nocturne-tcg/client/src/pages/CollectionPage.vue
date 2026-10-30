<script setup lang="ts">
import { FACTIONS, FACTION_LABEL, RARITIES, RARITY_COLOR, RARITY_LABEL, dustFor, type Faction, type Rarity } from '@nocturne/shared';
import { computed, ref } from 'vue';
import { api } from '@/api';
import CardView from '@/components/CardView.vue';
import { num } from '@/lib/format';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const rarity = ref<Rarity | null>(null);
const faction = ref<Faction | null>(null);
const owned = ref<'all' | 'owned' | 'missing'>('all');
const q = ref('');
const setCode = ref('NE1');

const sets = computed(() => [...new Set(s.cards.map(c => c.set))]);
const inSet = computed(() => s.cards.filter(c => c.set === setCode.value));
const have = computed(() => inSet.value.filter(c => (s.collection[c.id] ?? 0) > 0).length);
const percent = computed(() => (inSet.value.length ? (have.value / inSet.value.length) * 100 : 0));
const list = computed(() => inSet.value.filter(c => {
  const n = s.collection[c.id] ?? 0;
  return (!rarity.value || c.rarity === rarity.value) && (!faction.value || c.faction === faction.value)
    && (owned.value === 'all' || (owned.value === 'owned' ? n > 0 : n === 0))
    && (!q.value || c.name.toLowerCase().includes(q.value.toLowerCase()));
}));
const dupDust = computed(() => s.cards.reduce((sum, c) => sum + Math.max(0, (s.collection[c.id] ?? 0) - 1) * dustFor(c.rarity, !!s.me?.pass.active), 0));
const byRarity = computed(() => RARITIES.map(r => ({ r, total: inSet.value.filter(c => c.rarity === r).length, have: inSet.value.filter(c => c.rarity === r && (s.collection[c.id] ?? 0) > 0).length })));

async function recycleAll() {
  if (!confirm(`Recycler tous les doublons contre ${num(dupDust.value)} Poussière ? Tu gardes 1 exemplaire de chaque carte.`)) return;
  try {
    const r = await api.recycle();
    toast.push(`${r.count} doublon(s) recyclé(s) : +${r.dust} Poussière`, 'reward');
    await Promise.all([s.refreshCollection(), s.refreshWallet()]);
  } catch (e) { toast.error(e); }
}
</script>

<template>
  <div class="page">
    <div class="page-title"><h1>Collection</h1><select v-if="sets.length > 1" v-model="setCode" class="input sm">
      <option v-for="c in sets" :key="c" :value="c">{{ c }}</option></select></div>

    <section class="panel prog">
      <div class="spread"><b>Set {{ setCode }} · Nuit Éternelle</b><span>{{ have }} / {{ inSet.length }} · {{ percent.toFixed(0) }} %</span></div>
      <div class="bar gold"><i :style="{ width: `${percent}%` }" /></div>
      <div class="rar">
        <span v-for="x in byRarity" :key="x.r" :style="{ color: RARITY_COLOR[x.r] }">{{ RARITY_LABEL[x.r] }} {{ x.have }}/{{ x.total }}</span>
      </div>
      <button v-if="dupDust > 0" class="btn sm" @click="recycleAll">Recycler les doublons · +{{ num(dupDust) }} Poussière</button>
    </section>

    <div class="filters">
      <input v-model="q" class="input" placeholder="Rechercher une carte…" type="search" />
      <div class="chips">
        <button class="chip" :class="{ on: owned === 'all' }" @click="owned = 'all'">Toutes</button>
        <button class="chip" :class="{ on: owned === 'owned' }" @click="owned = 'owned'">Possédées</button>
        <button class="chip" :class="{ on: owned === 'missing' }" @click="owned = 'missing'">Manquantes</button>
      </div>
      <div class="chips">
        <button class="chip" :class="{ on: !rarity }" @click="rarity = null">Toutes raretés</button>
        <button v-for="r in RARITIES" :key="r" class="chip" :class="{ on: rarity === r }" :style="{ color: RARITY_COLOR[r] }" @click="rarity = rarity === r ? null : r">{{ RARITY_LABEL[r] }}</button>
      </div>
      <div class="chips">
        <button class="chip" :class="{ on: !faction }" @click="faction = null">Toutes factions</button>
        <button v-for="f in FACTIONS" :key="f" class="chip" :class="{ on: faction === f }" @click="faction = faction === f ? null : f">{{ FACTION_LABEL[f] }}</button>
      </div>
    </div>

    <div v-if="!list.length" class="empty">Aucune carte ne correspond à ces filtres.</div>
    <div class="grid-cards">
      <RouterLink v-for="c in list" :key="c.id" :to="`/carte/${c.id}`" class="cell">
        <CardView :card="c" :qty="s.collection[c.id] ?? 0" :frame="s.me?.frame" />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.prog { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.prog .btn { align-self: flex-start; }
.rar { display: flex; flex-wrap: wrap; gap: 4px 12px; font-size: .8rem; }
.filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.input.sm { width: auto; min-height: 34px; }
.cell { display: block; }
</style>
