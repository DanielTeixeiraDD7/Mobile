<script setup lang="ts">
import { ABILITY_LABEL, CRAFT_COST, FACTION_LABEL, RARITY_COLOR, RARITY_LABEL, VARIANT_LABEL, dustFor } from '@nocturne/shared';
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import CardView from '@/components/CardView.vue';
import Currency from '@/components/Currency.vue';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const props = defineProps<{ id: string }>();
const s = useSession();
const toast = useToast();
const router = useRouter();
const card = computed(() => s.card(props.id));
const qty = computed(() => s.collection[props.id] ?? 0);
const pair = computed(() => (card.value?.pairCode ? s.cards.find(c => c.pairCode === card.value!.pairCode && c.id !== card.value!.id) : undefined));
const cost = computed(() => (card.value ? CRAFT_COST[card.value.rarity] : 0));
const dust = computed(() => s.wallet?.balances.DUST ?? 0);

async function craft() {
  if (!card.value || !confirm(`Invoquer ${card.value.name} pour ${cost.value} Poussière ?`)) return;
  try {
    await api.craft(card.value.id);
    toast.push(`${card.value.name} rejoint ta collection !`, 'success');
    await Promise.all([s.refreshCollection(), s.refreshWallet()]);
  } catch (e) { toast.error(e); }
}

async function recycle() {
  if (!card.value) return;
  try {
    const r = await api.recycle(card.value.id);
    toast.push(`+${r.dust} Poussière`, 'reward');
    await Promise.all([s.refreshCollection(), s.refreshWallet()]);
  } catch (e) { toast.error(e); }
}
</script>

<template>
  <div v-if="card" class="page">
    <button class="btn sm ghost" @click="router.back()">← Retour</button>
    <div class="layout">
      <div class="big"><CardView :card="card" detail tilt :qty="s.me ? qty : null" :frame="s.me?.frame" /></div>
      <div class="info stack">
        <div>
          <h1>{{ card.name }}</h1>
          <div class="row tags">
            <span class="badge" :style="{ color: RARITY_COLOR[card.rarity], borderColor: RARITY_COLOR[card.rarity] }">{{ RARITY_LABEL[card.rarity] }}</span>
            <span class="badge">{{ FACTION_LABEL[card.faction] }}</span>
            <span class="badge">{{ VARIANT_LABEL[card.variant] }}</span>
            <span v-if="card.form" class="badge">{{ card.form === 'HUMAN' ? 'Forme humaine' : 'Forme monstre' }}</span>
          </div>
        </div>
        <p class="lore">« {{ card.lore }} »</p>
        <div class="panel stats">
          <div><small>PV</small><b>{{ card.hp }}</b></div>
          <div><small>ATQ</small><b>{{ card.attack }}</b></div>
          <div class="ab"><small>{{ ABILITY_LABEL[card.abilityKey] }}</small><b>{{ card.abilityName }}</b><span>{{ card.abilityText }}</span></div>
        </div>
        <RouterLink v-if="pair" :to="`/carte/${pair.id}`" class="panel pair">
          <span>{{ pair.form === 'MONSTER' ? 'Forme monstre' : 'Forme humaine' }} :</span> <b>{{ pair.name }}</b> <small>({{ RARITY_LABEL[pair.rarity] }})</small>
        </RouterLink>
        <div v-if="s.me" class="panel stack">
          <div class="spread"><span>Possédée</span><b>× {{ qty }}</b></div>
          <button v-if="card.craftable" class="btn gold block" :disabled="dust < cost" @click="craft">
            Invoquer · <Currency kind="DUST" :value="cost" />
          </button>
          <small v-else>Cette carte ne s’obtient que dans les boosters.</small>
          <button v-if="qty > 1" class="btn block" @click="recycle">Recycler {{ qty - 1 }} doublon{{ qty > 2 ? 's' : '' }} · +{{ (qty - 1) * dustFor(card.rarity, s.me.pass.active) }} Poussière</button>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="page empty">Carte introuvable.</div>
</template>

<style scoped>
.layout { display: grid; gap: 20px; margin-top: 10px; }
@media (min-width: 720px) { .layout { grid-template-columns: 340px 1fr; align-items: start; } }
.big { width: min(78vw, 340px); margin: 0 auto; }
.tags { gap: 6px; }
.lore { font-style: italic; color: #d9cbe4; border-left: 3px solid var(--blood); padding-left: 12px; margin: 0; }
.stats { display: grid; grid-template-columns: auto auto 1fr; gap: 16px; align-items: start; margin: 0 !important; }
.stats div { display: flex; flex-direction: column; }
.stats b { font-size: 1.3rem; font-family: 'Cinzel', serif; }
.ab b { font-size: 1rem !important; color: var(--gold); }
.ab span { font-size: .88rem; color: var(--muted); }
.pair { text-decoration: none; color: var(--text); margin: 0 !important; }
.panel + .panel { margin-top: 0; }
</style>
