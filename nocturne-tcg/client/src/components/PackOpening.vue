<script setup lang="ts">
import { RARITY_COLOR, RARITY_LABEL, VARIANT_LABEL, rarityRank, type PullDTO } from '@nocturne/shared';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useSession } from '@/stores/session';
import CardBack from './CardBack.vue';
import CardView from './CardView.vue';
import PackArt from './PackArt.vue';

const props = defineProps<{ pull: PullDTO; theme: string; packName: string; canAgain: boolean }>();
const emit = defineEmits<{ close: []; again: [] }>();
const s = useSession();

type Stage = 'pack' | 'tear' | 'reveal' | 'summary';
const stage = ref<Stage>('pack');
const index = ref(0);
const flipped = ref(false);
const leaving = ref(false);

const cards = computed(() => props.pull.cards.map(c => ({ ...c, card: s.card(c.cardId)! })).filter(c => c.card));
const cur = computed(() => cards.value[index.value]);
const rank = computed(() => (cur.value ? rarityRank(cur.value.rarity) : 0));
const best = computed(() => Math.max(...cards.value.map(c => rarityRank(c.rarity))));
const effect = computed(() => (flipped.value && rank.value >= 2 ? ['', '', 'rare', 'epic', 'legendary', 'secret'][rank.value] : ''));
const hint = computed(() => (!flipped.value && rank.value >= 3 ? RARITY_COLOR[cur.value!.rarity] : null));

function tap() {
  if (stage.value === 'pack') {
    stage.value = 'tear';
    if (best.value >= 4) navigator.vibrate?.([30, 40, 60]);
    setTimeout(() => { stage.value = 'reveal'; }, 900);
    return;
  }
  if (stage.value !== 'reveal' || leaving.value) return;
  if (!flipped.value) {
    flipped.value = true;
    if (rank.value >= 4) navigator.vibrate?.([60, 50, 120]);
    return;
  }
  if (index.value >= cards.value.length - 1) {
    stage.value = 'summary';
    return;
  }
  leaving.value = true;
  setTimeout(() => {
    index.value++;
    flipped.value = false;
    leaving.value = false;
  }, 260);
}

const skip = () => { stage.value = 'summary'; };
const onKey = (e: KeyboardEvent) => {
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tap(); }
  if (e.key === 'Escape') stage.value === 'summary' ? emit('close') : skip();
};
onMounted(() => window.addEventListener('keydown', onKey));
onUnmounted(() => window.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="overlay" :class="[effect, `best-${best}`]" role="dialog" aria-modal="true" aria-label="Ouverture du booster">
    <div class="rays" />
    <div class="flash" />

    <div v-if="stage === 'pack' || stage === 'tear'" class="pack-zone" @click="tap">
      <div class="pack" :class="{ tear: stage === 'tear' }">
        <div class="top"><PackArt :theme="theme" :name="packName" /></div>
        <div class="bottom"><PackArt :theme="theme" :name="packName" /></div>
      </div>
      <p class="hint">{{ stage === 'pack' ? 'Touche le booster pour l’ouvrir' : '' }}</p>
    </div>

    <div v-else-if="stage === 'reveal' && cur" class="reveal" @click="tap">
      <div class="counter">{{ index + 1 }} / {{ cards.length }}</div>
      <div class="slot" :class="{ leaving }">
        <div class="flip" :class="{ on: flipped }">
          <div class="face back"><CardBack :back="s.me?.cardBack" :glow="hint" /></div>
          <div class="face front"><CardView :card="cur.card" :is-new="cur.isNew" :reverse="cur.reverse" detail hq :frame="s.me?.frame" /></div>
        </div>
      </div>
      <div class="label" :style="{ color: RARITY_COLOR[cur.rarity], opacity: flipped ? 1 : 0 }">
        {{ RARITY_LABEL[cur.rarity] }}<span v-if="cur.card.variant !== 'NORMAL'"> · {{ VARIANT_LABEL[cur.card.variant] }}</span><span v-if="cur.reverse"> · Reverse holo</span><span v-if="pull.pity && index === cards.length - 1"> · Garantie de pitié</span>
      </div>
      <p class="hint">{{ flipped ? 'Touche pour continuer' : 'Touche pour révéler' }}</p>
      <button class="btn ghost sm skip" @click.stop="skip">Tout révéler</button>
    </div>

    <div v-else class="summary">
      <h2>Ton tirage</h2>
      <p v-if="pull.pity" class="pity">Garantie de pitié déclenchée : {{ pull.pity === 'LEGENDARY' ? 'Légendaire' : 'Épique' }} ou mieux.</p>
      <div class="sum-grid">
        <RouterLink v-for="c in cards" :key="c.slot" :to="`/carte/${c.cardId}`" class="sum-card" @click="emit('close')">
          <CardView :card="c.card" :is-new="c.isNew" :reverse="c.reverse" />
        </RouterLink>
      </div>
      <div class="row actions">
        <button v-if="canAgain" class="btn primary" @click="emit('again')">Ouvrir encore</button>
        <RouterLink class="btn" to="/collection" @click="emit('close')">Collection</RouterLink>
        <button class="btn ghost" @click="emit('close')">Fermer</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; overflow: hidden;
  background: radial-gradient(ellipse at 50% 40%, #2a1438f0, #07040bfa 70%); --fx: transparent;
  padding: env(safe-area-inset-top) 16px env(safe-area-inset-bottom);
}
.overlay.rare { --fx: #4a8fe0; }
.overlay.epic { --fx: #a45cf0; }
.overlay.legendary { --fx: #f0b43c; }
.overlay.secret { --fx: #e0315a; }
.rays {
  position: absolute; inset: -50%; pointer-events: none; opacity: 0; transition: opacity .4s;
  background: repeating-conic-gradient(from 0deg, color-mix(in srgb, var(--fx) 35%, transparent) 0deg 8deg, transparent 8deg 22deg);
  mask: radial-gradient(circle, #000 0%, transparent 60%); animation: spin 18s linear infinite;
}
.rare .rays, .epic .rays { opacity: .5; }
.legendary .rays, .secret .rays { opacity: 1; }
.secret .rays { background: repeating-conic-gradient(from 0deg, #ff3b6b55 0deg 6deg, #7fd6ff44 6deg 12deg, #f0b43c44 12deg 18deg, transparent 18deg 26deg); }
.flash { position: absolute; inset: 0; pointer-events: none; background: var(--fx); opacity: 0; }
.legendary .flash, .secret .flash { animation: flash .7s ease-out; }
.secret .reveal { animation: shake .5s; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes flash { 0% { opacity: .7; } 100% { opacity: 0; } }
@keyframes shake { 0%, 100% { transform: none; } 20% { transform: translate(-6px, 2px); } 40% { transform: translate(5px, -3px); } 60% { transform: translate(-4px, 3px); } 80% { transform: translate(3px, -1px); } }

.pack-zone, .reveal { position: relative; display: flex; flex-direction: column; align-items: center; gap: 14px; cursor: pointer; width: 100%; }
.pack { position: relative; width: min(62vw, 260px); aspect-ratio: 2/3; animation: float 3s ease-in-out infinite; }
.best-4 .pack, .best-5 .pack { filter: drop-shadow(0 0 30px #f0b43c88); }
.pack .top, .pack .bottom { position: absolute; inset: 0; }
.pack .top { clip-path: inset(0 0 82% 0); }
.pack .bottom { clip-path: inset(18% 0 0 0); }
.pack.tear { animation: none; }
.pack.tear .top { animation: tearTop .7s ease-in forwards; }
.pack.tear .bottom { animation: dropDown .8s .25s ease-in forwards; }
@keyframes float { 50% { transform: translateY(-10px) rotate(-1deg); } }
@keyframes tearTop { to { transform: translate(60px, -140px) rotate(28deg); opacity: 0; } }
@keyframes dropDown { 0% { transform: none; } 30% { transform: translateY(-8px); filter: brightness(1.6); } 100% { transform: translateY(120%); opacity: 0; } }

.counter { font-family: 'Cinzel', serif; color: var(--muted); }
.slot { width: min(72vw, 300px); perspective: 1200px; transition: transform .26s ease-in, opacity .26s; }
.slot.leaving { transform: translateX(-120%) rotate(-12deg); opacity: 0; }
.flip { position: relative; aspect-ratio: 5/7; transform-style: preserve-3d; transition: transform .6s cubic-bezier(.2, .8, .2, 1); }
.flip.on { transform: rotateY(180deg); }
.face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.front { transform: rotateY(180deg); }
.back :deep(.back) { animation: pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 50% { filter: brightness(1.25); } }
.label { font-family: 'Cinzel', serif; font-size: 1.3rem; font-weight: 700; text-shadow: 0 0 18px currentColor; transition: opacity .3s .3s; min-height: 1.6em; text-align: center; }
.hint { color: var(--muted); font-size: .85rem; margin: 0; }
.skip { position: fixed; top: calc(env(safe-area-inset-top) + 12px); right: 12px; }

.summary { position: relative; width: min(100%, 720px); max-height: 100%; overflow-y: auto; padding: 24px 0; text-align: center; }
.pity { color: var(--gold); }
.sum-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0 20px; }
@media (min-width: 560px) { .sum-grid { grid-template-columns: repeat(5, 1fr); } }
.sum-card { animation: pop .35s backwards; }
.sum-card:nth-child(2) { animation-delay: .05s; } .sum-card:nth-child(3) { animation-delay: .1s; } .sum-card:nth-child(4) { animation-delay: .15s; } .sum-card:nth-child(5) { animation-delay: .2s; }
@keyframes pop { from { transform: scale(.8); opacity: 0; } }
.actions { justify-content: center; }
</style>
