<script setup lang="ts">
import { FACTION_LABEL, RARITY_COLOR, RARITY_LABEL, rarityRank, type CardDTO } from '@nocturne/shared';
import { computed, ref } from 'vue';
import CardArt from './CardArt.vue';

const props = withDefaults(defineProps<{ card: CardDTO; detail?: boolean; qty?: number | null; isNew?: boolean; tilt?: boolean; frame?: string | null }>(), {
  detail: false, qty: null, isNew: false, tilt: false, frame: null,
});

const rank = computed(() => rarityRank(props.card.rarity));
const shiny = computed(() => props.card.variant !== 'NORMAL' || rank.value >= 4);
const locked = computed(() => props.qty === 0);
const style = ref<Record<string, string>>({});

function move(e: PointerEvent) {
  if (!props.tilt) return;
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  style.value = { transform: `perspective(700px) rotateY(${(x - 0.5) * 16}deg) rotateX(${(0.5 - y) * 16}deg)`, '--mx': `${x * 100}%`, '--my': `${y * 100}%` };
}
const leave = () => { style.value = {}; };
</script>

<template>
  <div
    class="card" :class="[card.rarity.toLowerCase(), card.variant.toLowerCase(), { locked, detail, shiny, 'frame-silver': frame === 'FRAME_SILVER', 'frame-thorns': frame === 'FRAME_THORNS' }]"
    :style="{ '--rc': RARITY_COLOR[card.rarity], ...style }" @pointermove="move" @pointerleave="leave"
  >
    <div class="inner">
      <header>
        <span class="name">{{ card.name }}</span>
        <span class="hp"><b>{{ card.hp }}</b> PV</span>
      </header>
      <div class="art">
        <CardArt :card="card" />
        <span v-if="card.form" class="form">{{ card.form === 'HUMAN' ? 'Forme humaine' : 'Forme monstre' }}</span>
        <span v-if="card.variant !== 'NORMAL'" class="variant">{{ card.variant === 'HOLO' ? 'Holo' : 'Alternative' }}</span>
      </div>
      <div class="meta">
        <span class="faction">{{ FACTION_LABEL[card.faction] }}</span>
        <span class="gems" :title="RARITY_LABEL[card.rarity]"><i v-for="n in rank + 1" :key="n" /></span>
      </div>
      <div v-if="detail" class="ability">
        <b>{{ card.abilityName }}</b>
        <span>{{ card.abilityText }}</span>
      </div>
      <footer>
        <span class="atk"><b>{{ card.attack }}</b> ATQ</span>
        <span class="num">{{ card.set }} · {{ String(card.number).padStart(3, '0') }}</span>
      </footer>
    </div>
    <div v-if="shiny && !locked" class="sheen" />
    <span v-if="qty && qty > 1" class="qty">×{{ qty }}</span>
    <span v-if="isNew" class="new">Nouveau</span>
  </div>
</template>

<style scoped>
.card {
  container-type: inline-size;
  position: relative; aspect-ratio: 5 / 7; width: 100%; border-radius: 4.5cqw;
  padding: 2.2cqw; background: linear-gradient(150deg, color-mix(in srgb, var(--rc) 85%, #fff 15%), color-mix(in srgb, var(--rc) 50%, #000) 55%, color-mix(in srgb, var(--rc) 80%, #000));
  box-shadow: 0 0 0 1px #000a, 0 1.5cqw 5cqw #000a; transition: transform .2s ease, box-shadow .2s; user-select: none; -webkit-user-select: none;
}
.card.epic, .card.legendary, .card.secret { box-shadow: 0 0 0 1px #000a, 0 0 6cqw color-mix(in srgb, var(--rc) 55%, transparent), 0 1.5cqw 5cqw #000a; }
.card.frame-silver { background: linear-gradient(150deg, #f2f2f6, #8d90a0 45%, #e2e4ee 60%, #6b6e7c); }
.card.frame-thorns { background: radial-gradient(circle at 20% 10%, #5a0b1c, #120206 70%); outline: 1.2cqw solid #2a0610; }
.inner { position: relative; height: 100%; border-radius: 3cqw; background: #0d0912; display: flex; flex-direction: column; overflow: hidden; }
header { display: flex; align-items: center; justify-content: space-between; gap: 2cqw; padding: 2.4cqw 3.2cqw 1.6cqw; background: linear-gradient(#1c1325, #120c19); }
.name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 6.4cqw; line-height: 1.1; color: #f3e9f6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hp { font-size: 4.4cqw; color: #f6c0c8; white-space: nowrap; }
.hp b { font-size: 6.4cqw; color: #fff; }
.art { position: relative; flex: 1; min-height: 0; margin: 0 2.4cqw; border-radius: 2cqw; overflow: hidden; box-shadow: inset 0 0 0 .6cqw color-mix(in srgb, var(--rc) 70%, #000); }
.detail .art { flex: 0 0 58%; }
.form, .variant { position: absolute; top: 2cqw; padding: .8cqw 2.4cqw; border-radius: 3cqw; font-size: 3.6cqw; font-weight: 600; background: #000a; color: #fff; backdrop-filter: blur(2px); }
.form { left: 2cqw; }
.variant { right: 2cqw; color: var(--rc); }
.meta { display: flex; justify-content: space-between; align-items: center; padding: 1.6cqw 3.2cqw .4cqw; }
.faction { font-size: 4cqw; letter-spacing: .08em; text-transform: uppercase; color: #cbbad9; }
.gems { display: flex; gap: .9cqw; }
.gems i { width: 2.6cqw; height: 2.6cqw; transform: rotate(45deg); background: var(--rc); box-shadow: 0 0 1.5cqw var(--rc); }
.ability { padding: 1cqw 3.2cqw; font-size: 4.2cqw; line-height: 1.3; color: #dcd0e6; flex: 1; overflow: hidden; }
.ability b { display: block; font-family: 'Cinzel', serif; color: var(--rc); font-size: 4.6cqw; }
footer { display: flex; justify-content: space-between; align-items: center; padding: 1.2cqw 3.2cqw 2.6cqw; margin-top: auto; }
.atk { font-size: 4.4cqw; color: #ffd1a1; }
.atk b { font-size: 6.4cqw; color: #fff; }
.num { font-size: 3.4cqw; color: #8d7f9c; }
.sheen {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; mix-blend-mode: color-dodge; opacity: .5;
  background: linear-gradient(115deg, transparent 20%, #ff6ad540 30%, #6affea40 42%, #fff7a040 54%, transparent 66%) var(--mx, 50%) var(--my, 50%) / 250% 250%;
  animation: sheen 5s linear infinite;
}
.secret .sheen, .alternate .sheen { opacity: .7; }
@keyframes sheen { 0% { background-position: 0% 0%; } 100% { background-position: 250% 250%; } }
.locked { filter: grayscale(1) brightness(.35); }
.qty { position: absolute; right: -1.5cqw; top: -1.5cqw; min-width: 11cqw; padding: 1cqw 2.2cqw; border-radius: 6cqw; background: #e0315a; color: #fff; font-size: 5cqw; font-weight: 700; text-align: center; box-shadow: 0 1cqw 3cqw #000a; }
.new { position: absolute; left: 50%; bottom: -2cqw; transform: translateX(-50%); padding: 1cqw 3cqw; border-radius: 6cqw; background: #f0b43c; color: #1a0f00; font-size: 4.4cqw; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; box-shadow: 0 0 4cqw #f0b43c88; }
@media (prefers-reduced-motion: reduce) { .sheen { animation: none; } .card { transition: none; } }
</style>
