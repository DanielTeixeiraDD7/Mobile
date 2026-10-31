<script setup lang="ts">
import { FACTION_LABEL, RARITY_LABEL, rarityRank, type CardDTO, type Faction, type Rarity } from '@nocturne/shared';
import { computed, ref } from 'vue';
import CardArt from './CardArt.vue';

const props = withDefaults(defineProps<{ card: CardDTO; detail?: boolean; qty?: number | null; isNew?: boolean; tilt?: boolean; frame?: string | null; hq?: boolean }>(), {
  detail: false, qty: null, isNew: false, tilt: false, frame: null, hq: false,
});

/** Métal du cadre par rareté : [reflet, teinte, ombre]. */
const METAL: Record<Rarity, [string, string, string]> = {
  COMMON: ['#e2e4ea', '#7d818b', '#34363d'],
  UNCOMMON: ['#c4f0d6', '#3f9a70', '#163d2b'],
  RARE: ['#d6e8ff', '#4a8fe0', '#16305c'],
  EPIC: ['#efdcff', '#a45cf0', '#3e1670'],
  LEGENDARY: ['#fff4c4', '#f0b43c', '#6e4206'],
  SECRET: ['#ffd2dc', '#e0315a', '#4e0718'],
};
const FRAME_METAL: Record<string, [string, string, string]> = {
  FRAME_SILVER: ['#ffffff', '#a9adba', '#4a4d58'],
  FRAME_THORNS: ['#b04a5e', '#4a0a18', '#120206'],
};
const EMBLEM: Record<Faction, string> = {
  SANG: 'M12 2.5C8 9 6 12 6 15.5a6 6 0 0 0 12 0C18 12 16 9 12 2.5z',
  CROC: 'M4 3q3 11 8 19q5-8 8-19q-4 5-8 5T4 3z',
  ABIME: 'M1.5 12Q12 2.5 22.5 12Q12 21.5 1.5 12zM12 8.5a3.5 3.5 0 1 0 .01 0z',
  SPECTRE: 'M5.5 21.5V11a6.5 6.5 0 0 1 13 0v10.5l-2.2-2-2.1 2-2.2-2-2.2 2-2.1-2z',
  ALCHIMIE: 'M8.5 2.5h7v2h-1v5l5.3 9.6a2 2 0 0 1-1.8 2.9H6a2 2 0 0 1-1.8-2.9L9.5 9.5v-5h-1z',
  CRYPTIDE: 'M12.5 22c-3.4 0-4.6-3-3.6-6s3-4.5 4.4-4.5 3.4 2 3.4 5.2-1.2 5.3-4.2 5.3zM7.5 7a1.8 1.8 0 1 0 .01 0zM11 4.5a1.8 1.8 0 1 0 .01 0zM15 4.8a1.8 1.8 0 1 0 .01 0zM18 8a1.7 1.7 0 1 0 .01 0z',
  MYTHE: 'M4 3h16v2.4H4zM6 6.5h2.6v12H6zM10.7 6.5h2.6v12h-2.6zM15.4 6.5H18v12h-2.6zM3 19.6h18V22H3z',
};

const CORNERS = ['scale(.62)', 'matrix(-1 0 0 1 250 0) scale(.62)', 'matrix(1 0 0 -1 0 350) scale(.62)', 'matrix(-1 0 0 -1 250 350) scale(.62)'];

const rank = computed(() => rarityRank(props.card.rarity));
const metal = computed(() => FRAME_METAL[props.frame ?? ''] ?? METAL[props.card.rarity]);
const full = computed(() => !!props.card.imageUrl);
const shiny = computed(() => props.card.variant !== 'NORMAL' || rank.value >= 4);
const locked = computed(() => props.qty === 0);
const style = ref<Record<string, string>>({});
const vars = computed(() => ({ '--hi': metal.value[0], '--mid': metal.value[1], '--lo': metal.value[2], '--rc': METAL[props.card.rarity][1], ...style.value }));

function move(e: PointerEvent) {
  if (!props.tilt) return;
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  style.value = { transform: `perspective(700px) rotateY(${(x - 0.5) * 16}deg) rotateX(${(0.5 - y) * 16}deg)`, '--mx': `${x * 100}%`, '--my': `${y * 100}%` };
}
const leave = () => { style.value = {}; };
</script>

<template>
  <div class="card" :class="[card.rarity.toLowerCase(), `v-${card.variant.toLowerCase()}`, { locked, detail, shiny, full }]" :style="vars" @pointermove="move" @pointerleave="leave">
   <div class="body">
    <svg class="orn" viewBox="0 0 250 350" preserveAspectRatio="none" aria-hidden="true">
      <g fill="none" stroke="var(--hi)" stroke-width="1.6" stroke-linecap="round" opacity=".9">
        <g v-for="t in CORNERS" :key="t" :transform="t">
          <path d="M5 42 Q5 5 42 5" />
          <path d="M11 34 Q11 11 34 11 M11 34 Q20 28 17 20 Q24 22 30 14 Q25 24 34 28" />
          <path d="M5 60 L5 48 M60 5 L48 5" opacity=".6" />
        </g>
      </g>
      <g fill="var(--hi)">
        <path v-for="t in CORNERS" :key="t" :transform="t" d="M8 8 L13 3 L18 8 L13 13 Z" />
      </g>
    </svg>

    <div class="inner">
      <header class="plate">
        <span class="name">{{ card.name }}</span>
        <span class="hp" :title="`${card.hp} PV`">
          <svg viewBox="0 0 24 24"><path :d="EMBLEM.SANG" /></svg>
          <b>{{ card.hp }}</b>
        </span>
      </header>

      <div class="art">
        <CardArt :card="card" :hq="hq || detail" :full="full" />
        <span v-if="card.form" class="tag form">{{ card.form === 'HUMAN' ? 'Forme humaine' : 'Forme monstre' }}</span>
        <span v-if="card.variant !== 'NORMAL'" class="tag variant">{{ card.variant === 'HOLO' ? 'Holo' : 'Alternative' }}</span>
      </div>
      <div v-if="full" class="fade" />

      <div class="typeline">
        <span class="faction"><svg viewBox="0 0 24 24"><path :d="EMBLEM[card.faction]" fill-rule="evenodd" /></svg>{{ FACTION_LABEL[card.faction] }}</span>
        <span class="gems" :title="RARITY_LABEL[card.rarity]"><i v-for="n in rank + 1" :key="n" /></span>
      </div>

      <div v-if="detail" class="ability">
        <b>{{ card.abilityName }}</b>
        <span>{{ card.abilityText }}</span>
      </div>

      <footer>
        <span class="atk" :title="`${card.attack} ATQ`">
          <svg viewBox="0 0 24 24"><path d="M14.5 3H21v6.5L10 20.5 7.5 18 6 19.5 4.5 18 6 16.5 3.5 14z" /></svg>
          <b>{{ card.attack }}</b>
        </span>
        <span class="num">{{ card.set }} · {{ String(card.number).padStart(3, '0') }}</span>
      </footer>
    </div>

    <div v-if="shiny && !locked" class="sheen" />
    <span v-if="qty && qty > 1" class="qty">×{{ qty }}</span>
    <span v-if="isNew" class="new">Nouveau</span>
   </div>
  </div>
</template>

<style scoped>
.card { container-type: inline-size; position: relative; aspect-ratio: 5 / 7; width: 100%; transition: transform .2s ease; user-select: none; -webkit-user-select: none; }
.body {
  position: absolute; inset: 0; border-radius: 5cqw; padding: 3.4cqw;
  background:
    linear-gradient(135deg, var(--hi) 0%, var(--mid) 22%, var(--lo) 46%, var(--mid) 64%, var(--hi) 82%, var(--mid) 100%);
  box-shadow: inset 0 0 0 .5cqw #ffffff40, inset 0 0 0 1.1cqw #0006, 0 1.6cqw 5cqw #000b;
}
.epic .body, .legendary .body, .secret .body { box-shadow: inset 0 0 0 .5cqw #ffffff50, inset 0 0 0 1.1cqw #0006, 0 0 7cqw color-mix(in srgb, var(--rc) 55%, transparent), 0 1.6cqw 5cqw #000b; }
.secret .body { background: linear-gradient(135deg, #ffd2dc, #e0315a 20%, #4e0718 42%, #f0b43c 58%, #7fd6ff 74%, #e0315a 88%, #ffd2dc); }
.orn { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2; filter: drop-shadow(0 0 .4cqw #0009); }

.inner {
  position: relative; height: 100%; border-radius: 3cqw; display: flex; flex-direction: column; overflow: hidden;
  background: radial-gradient(ellipse at 50% 0%, #2a1d36, #0c0811 70%);
  box-shadow: 0 0 0 .7cqw var(--lo), 0 0 0 1cqw color-mix(in srgb, var(--hi) 60%, transparent);
}
.plate {
  display: flex; align-items: center; justify-content: space-between; gap: 2cqw; margin: 2cqw 2cqw 1.4cqw; padding: 1.4cqw 2.6cqw;
  border-radius: 2cqw; background: linear-gradient(180deg, #2c2036, #140d1b);
  box-shadow: inset 0 .4cqw 0 #ffffff14, 0 0 0 .5cqw var(--mid), 0 0 0 .8cqw #000a;
}
.name { font-family: 'Cinzel', serif; font-weight: 700; font-size: 6.2cqw; line-height: 1.1; color: #f6ecf8; text-shadow: 0 .3cqw .8cqw #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hp { position: relative; flex: none; width: 11cqw; height: 13cqw; display: grid; place-items: center; }
.hp svg { position: absolute; inset: 0; width: 100%; height: 100%; fill: #b0142e; filter: drop-shadow(0 0 1.2cqw #e0315a88); }
.hp b { position: relative; top: 1.6cqw; font-size: 4.6cqw; color: #fff; text-shadow: 0 .3cqw .6cqw #000; }

.art {
  position: relative; flex: 1; min-height: 0; margin: 0 2.6cqw; border-radius: 1.6cqw; overflow: hidden;
  box-shadow: 0 0 0 .6cqw var(--lo), 0 0 0 1cqw var(--hi), inset 0 0 4cqw #000c;
}
.detail .art { flex: 0 0 49%; }
.tag { position: absolute; top: 2cqw; padding: .8cqw 2.4cqw; border-radius: 3cqw; font-size: 3.4cqw; font-weight: 700; background: #000b; backdrop-filter: blur(2px); border: .3cqw solid color-mix(in srgb, var(--hi) 50%, transparent); }
.form { left: 2cqw; color: #fff; }
.variant { right: 2cqw; color: var(--hi); }

.typeline {
  display: flex; justify-content: space-between; align-items: center; margin: 2cqw 2.6cqw 0; padding: 1cqw 2.4cqw;
  border-radius: 1.6cqw; background: linear-gradient(90deg, color-mix(in srgb, var(--mid) 28%, #0c0811), #0c0811 70%);
  border: .3cqw solid color-mix(in srgb, var(--mid) 45%, transparent);
}
.faction { display: inline-flex; align-items: center; gap: 1.4cqw; font-size: 3.8cqw; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #e6daf0; }
.faction svg { width: 4.8cqw; height: 4.8cqw; fill: var(--hi); }
.gems { display: flex; gap: 1cqw; }
.gems i { width: 2.6cqw; height: 2.6cqw; transform: rotate(45deg); background: linear-gradient(135deg, var(--hi), var(--rc)); box-shadow: 0 0 1.4cqw var(--rc); }

.ability {
  position: relative; margin: 1.8cqw 2.6cqw 0; padding: 1.6cqw 2.6cqw; flex: 1; overflow: hidden; border-radius: 1.6cqw;
  font-size: 3.8cqw; line-height: 1.28; color: #e4d8ec; background: linear-gradient(180deg, #1c1424, #120c18); border: .3cqw solid #ffffff12;
}
.ability b { display: block; font-family: 'Cinzel', serif; color: var(--hi); font-size: 4.6cqw; margin-bottom: .6cqw; }
.ability b::before, .ability b::after { content: '✦'; font-size: .7em; margin: 0 1.2cqw; color: var(--mid); }
.ability b::before { margin-left: 0; }

footer { display: flex; justify-content: space-between; align-items: center; padding: 1.4cqw 4cqw 2.4cqw; margin-top: auto; }
.atk { display: inline-flex; align-items: center; gap: 1cqw; padding: .6cqw 2.4cqw .6cqw 1.4cqw; border-radius: 4cqw; background: linear-gradient(180deg, #3a2a12, #1c1206); box-shadow: 0 0 0 .4cqw var(--mid); }
.atk svg { width: 5cqw; height: 5cqw; fill: #ffd1a1; }
.atk b { font-size: 5.2cqw; color: #fff; }
.num { font-size: 3.2cqw; color: #9d8fae; letter-spacing: .04em; }

.sheen {
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none; mix-blend-mode: color-dodge; opacity: .5; z-index: 3;
  background: linear-gradient(115deg, transparent 20%, #ff6ad540 30%, #6affea40 42%, #fff7a040 54%, transparent 66%) var(--mx, 50%) var(--my, 50%) / 250% 250%;
  animation: sheen 5s linear infinite;
}
.secret .sheen, .v-alternate .sheen { opacity: .7; }
@keyframes sheen { 0% { background-position: 0% 0%; } 100% { background-position: 250% 250%; } }
.locked .body { filter: grayscale(1) brightness(.35); }
.qty { position: absolute; z-index: 4; right: -1.5cqw; top: -1.5cqw; min-width: 11cqw; padding: 1cqw 2.2cqw; border-radius: 6cqw; background: #e0315a; color: #fff; font-size: 5cqw; font-weight: 700; text-align: center; box-shadow: 0 1cqw 3cqw #000a; }
.new { position: absolute; z-index: 4; left: 50%; bottom: -2cqw; transform: translateX(-50%); padding: 1cqw 3cqw; border-radius: 6cqw; background: #f0b43c; color: #1a0f00; font-size: 4.4cqw; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; box-shadow: 0 0 4cqw #f0b43c88; }
/* Full art : illustration bord à bord, liseré fin, texte posé sur l'image. */
.full .body { padding: 1.3cqw; }
.full .orn { display: none; }
.full .inner { border-radius: 4cqw; box-shadow: 0 0 0 .4cqw #0008; }
.full .art { position: absolute; inset: 0; margin: 0; border-radius: inherit; box-shadow: none; flex: none; }
.full .fade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, #000b 0%, transparent 16%, transparent 50%, #000c 76%, #000 100%); }
.full .tag { top: 15cqw; }
.full .plate { position: relative; z-index: 1; margin: 2.4cqw 3cqw 0; padding: 1.2cqw 1cqw; background: none; box-shadow: none; }
.full .name { font-size: 6.8cqw; text-shadow: 0 .4cqw 1.4cqw #000, 0 0 .4cqw #000; }
.full .typeline { position: relative; z-index: 1; margin-top: auto; background: none; border: 0; padding: 0 3cqw; }
.full .faction { text-shadow: 0 .3cqw .8cqw #000; }
.full .ability { position: relative; z-index: 1; flex: none; margin-top: 1cqw; background: none; border: 0; padding: 0 3cqw; text-shadow: 0 .3cqw .8cqw #000; }
.full footer { position: relative; z-index: 1; margin-top: 0; }
.full .num { color: #e2d8ee; text-shadow: 0 .3cqw .6cqw #000; }
@media (prefers-reduced-motion: reduce) { .sheen { animation: none; } .card { transition: none; } }
</style>
