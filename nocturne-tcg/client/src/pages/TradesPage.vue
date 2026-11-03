<script setup lang="ts">
import type { PlayerSearchDTO, TradeDTO } from '@nocturne/shared';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { api } from '@/api';
import type { TradeAction } from '@/api/types';
import CardPicker from '@/components/CardPicker.vue';
import { dateTime } from '@/lib/format';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const tab = ref<'in' | 'out' | 'new'>('in');
const trades = ref<TradeDTO[]>([]);
const target = ref('');
const other = ref<PlayerSearchDTO | null>(null);
const give = ref<Record<string, number>>({});
const get = ref<Record<string, number>>({});
const message = ref('');
const STATUS = { PENDING: 'En attente', ACCEPTED: 'Accepté, à confirmer', COMPLETED: 'Terminé', DECLINED: 'Refusé', CANCELLED: 'Annulé' };

const load = async () => { trades.value = await api.trades(); };
let timer: ReturnType<typeof setInterval>;
onMounted(() => {
  load().catch(e => toast.error(e));
  timer = setInterval(() => load().catch(() => {}), 4000);
});
onUnmounted(() => clearInterval(timer));

const incoming = computed(() => trades.value.filter(t => t.receiver.id === s.me?.id));
const outgoing = computed(() => trades.value.filter(t => t.proposer.id === s.me?.id));
const pendingIn = computed(() => incoming.value.filter(t => t.status === 'PENDING').length);
const toConfirm = computed(() => outgoing.value.filter(t => t.status === 'ACCEPTED').length);
const items = (r: Record<string, number>) => Object.entries(r).map(([cardId, quantity]) => ({ cardId, quantity }));

async function find() {
  try { other.value = await api.player(target.value.trim()); get.value = {}; } catch (e) { other.value = null; toast.error(e); }
}

async function send() {
  if (!other.value) return;
  try {
    await api.createTrade({ receiverName: other.value.displayName, give: items(give.value), get: items(get.value), message: message.value || undefined });
    toast.push('Proposition envoyée.', 'success');
    give.value = {}; get.value = {}; message.value = ''; other.value = null; target.value = '';
    tab.value = 'out';
    await load();
  } catch (e) { toast.error(e); }
}

async function act(t: TradeDTO, a: TradeAction) {
  try {
    await api.tradeAction(t.id, a);
    if (a === 'confirm') toast.push('Échange conclu !', 'success');
    await Promise.all([load(), s.refreshCollection()]);
  } catch (e) { toast.error(e); }
}
</script>

<template>
  <div class="page">
    <h1>Échanges</h1>
    <p class="muted">Carte contre carte uniquement. Un échange se fait en deux temps : l’autre joueur accepte, puis tu confirmes. Aucune monnaie, jamais.</p>
    <div v-if="!s.me?.emailVerified" class="panel warn">Confirme ton adresse email pour échanger. <RouterLink to="/verifier">Vérifier</RouterLink></div>

    <div class="chips tabs">
      <button class="chip" :class="{ on: tab === 'in' }" @click="tab = 'in'">Reçus <b v-if="pendingIn" class="badge">{{ pendingIn }}</b></button>
      <button class="chip" :class="{ on: tab === 'out' }" @click="tab = 'out'">Envoyés <b v-if="toConfirm" class="badge">{{ toConfirm }}</b></button>
      <button class="chip" :class="{ on: tab === 'new' }" @click="tab = 'new'">Nouvel échange</button>
    </div>

    <template v-if="tab !== 'new'">
      <div v-if="!(tab === 'in' ? incoming : outgoing).length" class="empty">Aucun échange.</div>
      <div class="stack">
        <div v-for="t in tab === 'in' ? incoming : outgoing" :key="t.id" class="panel trade">
          <div class="spread">
            <b>{{ tab === 'in' ? `De ${t.proposer.displayName}` : `À ${t.receiver.displayName}` }}</b>
            <span class="badge" :class="t.status.toLowerCase()">{{ STATUS[t.status] }}</span>
          </div>
          <p v-if="t.message" class="msg">« {{ t.message }} »</p>
          <div class="sides">
            <div><small>{{ tab === 'in' ? 'Tu reçois' : 'Tu donnes' }}</small><ul><li v-for="i in t.give" :key="i.cardId">{{ i.quantity }}× <RouterLink :to="`/carte/${i.cardId}`">{{ s.card(i.cardId)?.name }}</RouterLink></li></ul></div>
            <div><small>{{ tab === 'in' ? 'Tu donnes' : 'Tu reçois' }}</small><ul><li v-for="i in t.get" :key="i.cardId">{{ i.quantity }}× <RouterLink :to="`/carte/${i.cardId}`">{{ s.card(i.cardId)?.name }}</RouterLink></li></ul></div>
          </div>
          <div class="row">
            <small class="muted">{{ dateTime(t.updatedAt) }}</small>
            <template v-if="tab === 'in' && t.status === 'PENDING'">
              <button class="btn sm primary" @click="act(t, 'accept')">Accepter</button>
              <button class="btn sm" @click="act(t, 'decline')">Refuser</button>
            </template>
            <button v-if="tab === 'in' && t.status === 'ACCEPTED'" class="btn sm" @click="act(t, 'decline')">Annuler mon accord</button>
            <template v-if="tab === 'out' && ['PENDING', 'ACCEPTED'].includes(t.status)">
              <button v-if="t.status === 'ACCEPTED'" class="btn sm gold" @click="act(t, 'confirm')">Confirmer l’échange</button>
              <button class="btn sm" @click="act(t, 'cancel')">Annuler</button>
            </template>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <form class="panel stack" @submit.prevent="find">
        <label class="field"><span>Pseudo du joueur</span>
          <div class="row"><input v-model="target" class="input grow" placeholder="ex. Morgane" required /><button class="btn">Chercher</button></div>
        </label>
        <small v-if="api.mode === 'demo'" class="muted">Démo : essaie avec Morgane, Corvus ou Lilas_Noir (joueurs simulés).</small>
      </form>
      <template v-if="other">
        <section class="panel">
          <h3>Ce que tu demandes à {{ other.displayName }}</h3>
          <CardPicker v-model="get" :pool="other.cards" />
        </section>
        <section class="panel">
          <h3>Ce que tu donnes</h3>
          <CardPicker v-model="give" :pool="s.collection" />
        </section>
        <section class="panel stack">
          <input v-model="message" class="input" maxlength="140" placeholder="Message (optionnel)" />
          <button class="btn primary block" :disabled="!items(give).length || !items(get).length" @click="send">Proposer l’échange</button>
        </section>
      </template>
    </template>
  </div>
</template>

<style scoped>
.warn { border-color: #f0b43c66; color: #ffe2a6; margin-bottom: 12px; }
.tabs { margin: 12px 0; }
.tabs .badge { background: var(--blood); border: 0; margin-left: 4px; }
.trade { margin: 0 !important; display: flex; flex-direction: column; gap: 8px; }
.msg { margin: 0; font-style: italic; color: var(--muted); }
.sides { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sides ul { margin: 4px 0 0; padding-left: 16px; font-size: .9rem; }
.badge.completed { color: var(--ok); }
.badge.accepted { color: var(--gold); }
.badge.declined, .badge.cancelled { color: var(--muted); }
.grow { flex: 1; min-width: 0; }
.row .input { width: auto; }
</style>
