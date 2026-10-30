<script setup lang="ts">
import { ABILITY_LABEL, DECK_SIZE, MAX_COPIES, POINTS_TO_WIN, RARITY_COLOR, legalActions, type BattleAction, type BattleDTO, type BattleEvent, type CardLookup, type DeckDTO, type Unit } from '@nocturne/shared';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '@/api';
import CardArt from '@/components/CardArt.vue';
import CardView from '@/components/CardView.vue';
import Currency from '@/components/Currency.vue';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const route = useRoute();
const router = useRouter();
const decks = ref<DeckDTO[]>([]);
const battle = ref<BattleDTO | null>(null);
const editing = ref<{ id: string | null; name: string; cards: string[] } | null>(null);
const busy = ref(false);
const log = ref<BattleEvent[]>([]);
const floats = ref<Record<string, { text: string; kind: string; k: number }>>({});
let fk = 0;

const lookup = computed<CardLookup>(() => Object.fromEntries(s.cards.map(c => [c.id, { id: c.id, name: c.name, rarity: c.rarity, hp: c.hp, attack: c.attack, abilityKey: c.abilityKey, abilityValue: c.abilityValue }])));
const state = computed(() => battle.value?.state);
const me = computed(() => state.value?.sides.player);
const foe = computed(() => state.value?.sides.enemy);
const acts = computed(() => (state.value && state.value.current === 'player' ? legalActions(state.value, lookup.value) : []));
const can = (t: BattleAction['type']) => acts.value.some(a => a.type === t);
const canDeploy = (i: number) => acts.value.some(a => a.type === 'deploy' && a.handIndex === i);
const canRetreat = (i: number) => acts.value.some(a => a.type === 'retreat' && a.benchIndex === i);

onMounted(async () => {
  try {
    [decks.value, battle.value] = await Promise.all([api.decks(), api.activeBattle()]);
    if (battle.value) log.value = battle.value.state.events.slice(-6);
  } catch (e) { toast.error(e); }
});

watch(() => battle.value?.status, st => {
  const live = st === 'ACTIVE' ? '1' : undefined;
  if (route.query.live !== live) router.replace({ query: live ? { live } : {} });
}, { immediate: true });

async function play(action: BattleAction) {
  if (!battle.value || busy.value) return;
  busy.value = true;
  try {
    const next = await api.battleAction(battle.value.id, action);
    await animate(next.state.events);
    battle.value = next;
    if (next.status !== 'ACTIVE') {
      await s.refreshWallet();
      if (next.reward) toast.push(`${next.status === 'WON' ? 'Victoire' : 'Défaite'} : +${next.reward.embers} Braises${next.reward.dust ? `, +${next.reward.dust} Poussière` : ''}`, 'reward');
    }
  } catch (e) { toast.error(e); } finally { busy.value = false; }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function animate(events: BattleEvent[]) {
  for (const e of events) {
    log.value = [...log.value, e].slice(-6);
    if (e.target && e.amount && ['attack', 'poison', 'ability', 'regen'].includes(e.kind)) {
      const heal = e.kind === 'regen' || (e.kind === 'ability' && /draine|régénère/.test(e.text));
      floats.value = { ...floats.value, [e.target]: { text: `${heal ? '+' : '−'}${e.amount}`, kind: heal ? 'heal' : 'dmg', k: ++fk } };
    }
    if (e.side === 'enemy' || ['attack', 'ko', 'end'].includes(e.kind)) await sleep(e.kind === 'turn' ? 150 : 380);
  }
  setTimeout(() => { floats.value = {}; }, 900);
}

async function start(deck: DeckDTO) {
  try {
    battle.value = await api.startBattle(deck.id);
    log.value = battle.value.state.events;
  } catch (e) { toast.error(e); }
}

async function abandon() {
  if (!battle.value || !confirm('Abandonner ce combat ?')) return;
  await api.abandonBattle(battle.value.id);
  battle.value = null;
}

const owned = computed(() => s.cards.filter(c => (s.collection[c.id] ?? 0) > 0));
const countIn = (id: string) => editing.value?.cards.filter(x => x === id).length ?? 0;
function add(id: string) {
  const e = editing.value!;
  if (e.cards.length >= DECK_SIZE || countIn(id) >= Math.min(MAX_COPIES, s.collection[id] ?? 0)) return;
  e.cards.push(id);
}
function remove(id: string) {
  const e = editing.value!;
  const i = e.cards.lastIndexOf(id);
  if (i >= 0) e.cards.splice(i, 1);
}
function autoDeck() {
  const e = editing.value!;
  const sorted = [...owned.value].sort((a, b) => b.hp + b.attack * 2 - (a.hp + a.attack * 2));
  e.cards = [];
  for (const c of sorted) for (let k = 0; k < Math.min(MAX_COPIES, s.collection[c.id] ?? 0) && e.cards.length < DECK_SIZE; k++) e.cards.push(c.id);
}
async function save() {
  const e = editing.value!;
  try {
    const d = await api.saveDeck(e.id, e.name, e.cards);
    decks.value = [d, ...decks.value.filter(x => x.id !== d.id)];
    editing.value = null;
    toast.push('Deck enregistré.', 'success');
  } catch (err) { toast.error(err); }
}
async function delDeck(d: DeckDTO) {
  if (!confirm(`Supprimer « ${d.name} » ?`)) return;
  await api.deleteDeck(d.id);
  decks.value = decks.value.filter(x => x.id !== d.id);
}
const hpPct = (u: Unit) => `${(u.hp / u.maxHp) * 100}%`;
</script>

<template>
  <div class="page battle-page" :class="{ live: battle?.status === 'ACTIVE' }">
    <!-- Combat en cours -->
    <template v-if="battle && state && me && foe">
      <div class="arena">
        <div class="side enemy">
          <div class="hud">
            <span class="pts"><i v-for="n in POINTS_TO_WIN" :key="n" :class="{ on: n <= foe.points }" /></span>
            <small>Main {{ foe.hand.length }} · Pioche {{ foe.deck.length }}</small>
          </div>
          <div class="bench">
            <div v-for="u in foe.bench" :key="u.uid" class="unit mini">
              <div class="art"><CardArt :card="s.card(u.cardId)!" /></div>
              <div class="hp"><i :style="{ width: hpPct(u) }" /></div>
              <span v-if="floats[u.uid]" :key="floats[u.uid]!.k" class="float" :class="floats[u.uid]!.kind">{{ floats[u.uid]!.text }}</span>
            </div>
          </div>
          <div v-if="foe.active" class="unit active" :style="{ '--rc': RARITY_COLOR[foe.active.rarity] }">
            <div class="art"><CardArt :card="s.card(foe.active.cardId)!" /></div>
            <div class="stats"><b>{{ foe.active.name }}</b><span>{{ foe.active.hp }}/{{ foe.active.maxHp }} PV · {{ foe.active.atk }} ATQ</span><small>{{ ABILITY_LABEL[foe.active.key] }}</small></div>
            <div class="hp"><i :style="{ width: hpPct(foe.active) }" /></div>
            <span class="status"><b v-if="foe.active.poison">☠</b><b v-if="foe.active.stunned">✦</b></span>
            <span v-if="floats[foe.active.uid]" :key="floats[foe.active.uid]!.k" class="float" :class="floats[foe.active.uid]!.kind">{{ floats[foe.active.uid]!.text }}</span>
          </div>
          <div v-else class="unit active empty-slot">—</div>
        </div>

        <div class="log">
          <TransitionGroup name="log"><p v-for="(e, i) in log" :key="`${i}-${e.text}`" :class="e.side">{{ e.text }}</p></TransitionGroup>
        </div>

        <div class="side player">
          <div v-if="me.active" class="unit active" :style="{ '--rc': RARITY_COLOR[me.active.rarity] }">
            <div class="art"><CardArt :card="s.card(me.active.cardId)!" /></div>
            <div class="stats"><b>{{ me.active.name }}</b><span>{{ me.active.hp }}/{{ me.active.maxHp }} PV · {{ me.active.atk }} ATQ</span><small>{{ ABILITY_LABEL[me.active.key] }} : {{ s.card(me.active.cardId)?.abilityText }}</small></div>
            <div class="hp"><i :style="{ width: hpPct(me.active) }" /></div>
            <span class="status"><b v-if="me.active.poison">☠</b><b v-if="me.active.stunned">✦</b></span>
            <span v-if="floats[me.active.uid]" :key="floats[me.active.uid]!.k" class="float" :class="floats[me.active.uid]!.kind">{{ floats[me.active.uid]!.text }}</span>
          </div>
          <div v-else class="unit active empty-slot">Invoque une carte de ta main</div>
          <div class="bench">
            <button v-for="(u, i) in me.bench" :key="u.uid" class="unit mini" :class="{ can: canRetreat(i) }" :disabled="!canRetreat(i) || busy" @click="play({ type: 'retreat', benchIndex: i })">
              <div class="art"><CardArt :card="s.card(u.cardId)!" /></div>
              <div class="hp"><i :style="{ width: hpPct(u) }" /></div>
              <small v-if="canRetreat(i)">Repli</small>
              <span v-if="floats[u.uid]" :key="floats[u.uid]!.k" class="float" :class="floats[u.uid]!.kind">{{ floats[u.uid]!.text }}</span>
            </button>
          </div>
          <div class="hud">
            <span class="pts"><i v-for="n in POINTS_TO_WIN" :key="n" :class="{ on: n <= me.points }" /></span>
            <small>Pioche {{ me.deck.length }}</small>
          </div>
          <div class="hand">
            <button v-for="(id, i) in me.hand" :key="`${i}-${id}`" class="hcard" :disabled="!canDeploy(i) || busy" @click="play({ type: 'deploy', handIndex: i })">
              <CardView :card="s.card(id)!" />
            </button>
          </div>
        </div>
      </div>

      <div class="controls" :class="{ docked: battle.status === 'ACTIVE' }">
        <template v-if="battle.status === 'ACTIVE'">
          <button class="btn primary" :disabled="!can('attack') || busy" @click="play({ type: 'attack' })">Attaquer</button>
          <button class="btn" :disabled="!can('end') || busy" @click="play({ type: 'end' })">Fin du tour</button>
          <button class="btn ghost sm" @click="abandon">Abandonner</button>
        </template>
        <template v-else>
          <div class="result" :class="battle.status.toLowerCase()">
            <h2>{{ battle.status === 'WON' ? 'Victoire' : battle.status === 'LOST' ? 'Défaite' : 'Combat abandonné' }}</h2>
            <p v-if="battle.reward"><Currency kind="EMBERS" :value="battle.reward.embers" /> <Currency v-if="battle.reward.dust" kind="DUST" :value="battle.reward.dust" /></p>
            <p v-else class="muted">Plus de récompense aujourd’hui (5 combats récompensés par jour).</p>
          </div>
          <button class="btn primary" @click="battle = null">Retour aux decks</button>
        </template>
      </div>
    </template>

    <!-- Éditeur de deck -->
    <template v-else-if="editing">
      <div class="page-title"><h1>Deck</h1><span>{{ editing.cards.length }} / {{ DECK_SIZE }}</span></div>
      <div class="panel stack">
        <input v-model="editing.name" class="input" maxlength="30" placeholder="Nom du deck" />
        <div class="chosen">
          <button v-for="(id, i) in editing.cards" :key="i" class="chip" @click="remove(id)">{{ s.card(id)?.name }} ✕</button>
          <small v-if="!editing.cards.length" class="muted">Touche une carte ci-dessous pour l’ajouter (2 exemplaires max).</small>
        </div>
        <div class="row">
          <button class="btn primary" :disabled="editing.cards.length !== DECK_SIZE || !editing.name.trim()" @click="save">Enregistrer</button>
          <button class="btn" @click="autoDeck">Deck automatique</button>
          <button class="btn ghost" @click="editing = null">Annuler</button>
        </div>
      </div>
      <div v-if="!owned.length" class="empty">Ouvre des boosters pour obtenir des cartes.</div>
      <div class="grid-cards" style="margin-top: 12px">
        <button v-for="c in owned" :key="c.id" class="pick" :class="{ sel: countIn(c.id) }" @click="add(c.id)">
          <CardView :card="c" :qty="s.collection[c.id]" />
          <span v-if="countIn(c.id)" class="n">{{ countIn(c.id) }}</span>
        </button>
      </div>
    </template>

    <!-- Liste des decks -->
    <template v-else>
      <h1>Combat</h1>
      <div class="panel rules">
        <h3>Règles</h3>
        <ul>
          <li>Deck de 10 cartes, 2 exemplaires maximum par carte. Tu commences avec 3 cartes en main et en pioches une par tour.</li>
          <li>À chaque tour : 1 invocation (première ligne ou banc de 2 places), 1 repli, puis une attaque qui termine le tour.</li>
          <li>Vaincre une carte rapporte 1 point (2 pour une Légendaire ou Secrète). Le premier à 3 points gagne.</li>
          <li>Chaque carte a une capacité : drain, poison, effroi, bouclier, onde…</li>
        </ul>
      </div>
      <div class="spread" style="margin: 16px 0 10px"><h2 style="margin: 0">Mes decks</h2><button class="btn sm primary" @click="editing = { id: null, name: `Deck ${decks.length + 1}`, cards: [] }">Nouveau deck</button></div>
      <div v-if="!decks.length" class="empty">Aucun deck. Crée ton premier deck de 10 cartes.</div>
      <div class="stack">
        <div v-for="d in decks" :key="d.id" class="panel deck">
          <div class="spread"><b>{{ d.name }}</b><small>{{ d.cards.length }} / {{ DECK_SIZE }}</small></div>
          <div class="thumbs"><div v-for="(id, i) in d.cards" :key="i" class="thumb"><CardArt :card="s.card(id)!" /></div></div>
          <div class="row">
            <button class="btn primary" :disabled="d.cards.length !== DECK_SIZE" @click="start(d)">Combattre</button>
            <button class="btn sm" @click="editing = { id: d.id, name: d.name, cards: [...d.cards] }">Modifier</button>
            <button class="btn sm ghost" @click="delDeck(d)">Supprimer</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.battle-page.live { padding-top: calc(10px + env(safe-area-inset-top)); padding-bottom: calc(110px + env(safe-area-inset-bottom)); max-width: 560px; }
.arena { display: flex; flex-direction: column; gap: 8px; }
.side { display: flex; flex-direction: column; gap: 8px; }
.hud { display: flex; justify-content: space-between; align-items: center; }
.pts { display: flex; gap: 6px; }
.pts i { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--line); background: #0e0914; }
.pts i.on { background: radial-gradient(circle at 35% 35%, #fff2c8, var(--gold)); box-shadow: 0 0 10px var(--gold); }
.bench { display: flex; gap: 8px; justify-content: center; min-height: 64px; }
.unit { position: relative; border-radius: 12px; background: #120b18; border: 1px solid var(--line); overflow: visible; }
.unit.active { display: grid; grid-template-columns: 84px 1fr; gap: 10px; padding: 8px; border-color: color-mix(in srgb, var(--rc) 60%, var(--line)); box-shadow: 0 0 20px color-mix(in srgb, var(--rc) 25%, transparent); }
.unit.active .art { width: 84px; aspect-ratio: 5/6; border-radius: 8px; overflow: hidden; grid-row: span 2; }
.stats { display: flex; flex-direction: column; font-size: .85rem; min-width: 0; }
.stats b { font-family: 'Cinzel', serif; }
.stats small { color: var(--muted); font-size: .75rem; }
.hp { height: 6px; border-radius: 3px; background: #2a1f38; overflow: hidden; align-self: end; }
.hp i { display: block; height: 100%; background: linear-gradient(90deg, #4fae7a, #b6ff5a); transition: width .4s; }
.unit.mini { width: 64px; padding: 4px; display: flex; flex-direction: column; gap: 4px; font: inherit; color: inherit; }
.unit.mini .art { aspect-ratio: 1; border-radius: 6px; overflow: hidden; }
.unit.mini small { font-size: .65rem; text-align: center; color: var(--gold); }
button.unit.can { border-color: var(--gold); cursor: pointer; }
.empty-slot { min-height: 70px; display: flex !important; align-items: center; justify-content: center; color: var(--muted); font-size: .85rem; }
.status { position: absolute; top: 6px; right: 8px; display: flex; gap: 4px; color: #b6ff5a; }
.float { position: absolute; left: 50%; top: 20%; transform: translateX(-50%); font-family: 'Cinzel', serif; font-weight: 700; font-size: 1.5rem; pointer-events: none; animation: rise .9s ease-out forwards; text-shadow: 0 2px 8px #000; z-index: 3; }
.float.dmg { color: #ff5a7a; }
.float.heal { color: #8dffb0; }
@keyframes rise { from { opacity: 1; transform: translate(-50%, 0) scale(1.2); } to { opacity: 0; transform: translate(-50%, -36px) scale(1); } }
.log { min-height: 92px; max-height: 120px; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; padding: 6px 10px; border-radius: 10px; background: #0e0914cc; border: 1px solid var(--line); font-size: .78rem; }
.log p { margin: 0; color: #d9cbe4; }
.log p.enemy { color: #ffb0c0; }
.log-enter-active { transition: all .25s; }
.log-enter-from { opacity: 0; transform: translateY(6px); }
.hand { display: flex; gap: 8px; overflow-x: auto; padding: 6px 2px 4px; }
.hcard { flex: 0 0 76px; padding: 0; border: 0; background: none; cursor: pointer; transition: transform .15s; }
.hcard:not(:disabled):hover { transform: translateY(-6px); }
.hcard:disabled { opacity: .5; cursor: default; }
.controls { margin-top: 16px; display: flex; gap: 10px; justify-content: center; align-items: center; flex-wrap: wrap; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: #0b0710f0; border-top: 1px solid var(--line); }
.controls.docked { position: fixed; left: 0; right: 0; bottom: 0; z-index: 25; margin: 0; }
.live .controls .btn.primary { min-width: 130px; }
.result { text-align: center; width: 100%; }
.result h2 { margin: 0; font-size: 1.6rem; }
.result.won h2 { color: var(--gold); text-shadow: 0 0 20px #f0b43c88; }
.result.lost h2 { color: #ff8aa4; }
.result p { margin: 4px 0 0; display: flex; gap: 12px; justify-content: center; }
.rules ul { margin: 0; padding-left: 18px; font-size: .9rem; color: #ddd0e8; }
.deck { margin: 0 !important; display: flex; flex-direction: column; gap: 10px; }
.thumbs { display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; }
.thumb { aspect-ratio: 1; border-radius: 4px; overflow: hidden; }
.chosen { display: flex; flex-wrap: wrap; gap: 6px; }
.pick { position: relative; padding: 0; border: 0; background: none; cursor: pointer; }
.pick.sel { outline: 3px solid var(--gold); outline-offset: 2px; border-radius: 8px; }
.n { position: absolute; left: 50%; bottom: -6px; transform: translateX(-50%); background: var(--gold); color: #000; font-weight: 800; border-radius: 99px; padding: 0 8px; font-size: .8rem; }
</style>
