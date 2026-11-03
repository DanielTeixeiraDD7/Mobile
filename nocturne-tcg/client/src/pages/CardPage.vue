<script setup lang="ts">
import { ABILITY_LABEL, CRAFT_COST, FACTION_LABEL, RARITY_COLOR, RARITY_LABEL, REVERSE_RARITIES, VARIANT_LABEL, dustFor, reverseKey } from '@nocturne/shared';
import { computed, ref } from 'vue';
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
const pair = computed(() => (card.value?.pairCode ? s.cards.find(c => c.pairCode === card.value!.pairCode && c.form !== card.value!.form && c.variant === 'NORMAL') : undefined));
const baseId = computed(() => card.value?.baseCode ?? card.value?.id);
const versions = computed(() => s.cards.filter(c => c.id === baseId.value || c.baseCode === baseId.value));
const revQty = computed(() => s.collection[reverseKey(props.id)] ?? 0);
const canReverse = computed(() => card.value?.variant === 'NORMAL' && REVERSE_RARITIES.includes(card.value.rarity));
const showReverse = ref(false);
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
      <div class="big">
        <CardView :card="card" detail tilt :reverse="showReverse" :qty="s.me ? (showReverse ? revQty : qty) : null" :frame="s.me?.frame" />
        <div v-if="canReverse" class="row center"><button class="btn sm" :class="{ gold: showReverse }" @click="showReverse = !showReverse">{{ showReverse ? 'Voir la classique' : 'Voir la reverse holo' }}</button></div>
      </div>
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
        <div v-if="versions.length > 1" class="panel">
          <h3>Versions</h3>
          <div class="versions">
            <RouterLink v-for="v in versions" :key="v.id" :to="`/carte/${v.id}`" class="ver" :class="{ on: v.id === card.id }">
              <CardView :card="v" :qty="s.me ? s.collection[v.id] ?? 0 : null" />
              <small>{{ VARIANT_LABEL[v.variant] }} · {{ RARITY_LABEL[v.rarity] }}</small>
            </RouterLink>
          </div>
        </div>
        <RouterLink v-if="pair" :to="`/carte/${pair.id}`" class="panel pair">
          <span>{{ pair.form === 'MONSTER' ? 'Forme monstre' : 'Forme humaine' }} :</span> <b>{{ pair.name }}</b> <small>({{ RARITY_LABEL[pair.rarity] }})</small>
        </RouterLink>
        <div v-if="s.me" class="panel stack">
          <div class="spread"><span>Possédée</span><b>× {{ qty }}<template v-if="revQty"> (dont {{ revQty }} reverse)</template></b></div>
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
.center { justify-content: center; margin-top: 10px; }
.versions { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 10px; }
.ver { text-decoration: none; color: var(--muted); text-align: center; display: flex; flex-direction: column; gap: 4px; font-size: .75rem; opacity: .75; }
.ver.on { opacity: 1; color: var(--gold); }
.lore { font-style: italic; color: #d9cbe4; border-left: 3px solid var(--blood); padding-left: 12px; margin: 0; }
.stats { display: grid; grid-template-columns: auto auto 1fr; gap: 16px; align-items: start; margin: 0 !important; }
.stats div { display: flex; flex-direction: column; }
.stats b { font-size: 1.3rem; font-family: 'Cinzel', serif; }
.ab b { font-size: 1rem !important; color: var(--gold); }
.ab span { font-size: .88rem; color: var(--muted); }
.pair { text-decoration: none; color: var(--text); margin: 0 !important; }
.panel + .panel { margin-top: 0; }
</style>
