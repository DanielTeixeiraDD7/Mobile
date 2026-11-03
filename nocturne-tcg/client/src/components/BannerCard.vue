<script setup lang="ts">
import type { BannerDTO } from '@nocturne/shared';
import { computed } from 'vue';
import { countdown } from '@/lib/format';
import { useNow } from '@/lib/now';
import { themeOf } from '@/lib/themes';
import { useSession } from '@/stores/session';
import CardArt from './CardArt.vue';

const props = defineProps<{ banner: BannerDTO }>();
const s = useSession();
const now = useNow(30_000);
const theme = computed(() => themeOf(props.banner.theme));
const featured = computed(() => props.banner.featured.map(id => s.card(id)).filter(c => !!c));
const hero = computed(() => featured.value[0] ?? s.cards.find(c => c.rarity === 'LEGENDARY'));
</script>

<template>
  <RouterLink :to="`/boosters/${banner.id}`" class="banner" :style="{ '--from': theme.from, '--to': theme.to, '--glow': theme.glow }">
    <div class="text">
      <span class="kind">{{ banner.endsAt ? 'Bannière temporaire' : 'Permanent' }}</span>
      <h2>{{ banner.name }}</h2>
      <p>{{ banner.description }}</p>
      <span v-if="banner.endsAt" class="ends">Fin dans {{ countdown(banner.endsAt, now) }}</span>
    </div>
    <div class="art">
      <div v-for="(c, i) in featured.length ? featured.slice(0, 2) : hero ? [hero] : []" :key="c.id" class="mini" :class="`m${i}`"><CardArt :card="c" /></div>
    </div>
  </RouterLink>
</template>

<style scoped>
.banner {
  position: relative; display: grid; grid-template-columns: 1fr 42%; min-height: 168px; overflow: hidden; border-radius: 18px; text-decoration: none; color: var(--text);
  background: radial-gradient(circle at 85% 30%, color-mix(in srgb, var(--glow) 40%, transparent), transparent 55%), linear-gradient(135deg, var(--from), var(--to));
  border: 1px solid color-mix(in srgb, var(--glow) 40%, transparent); box-shadow: 0 10px 40px #0008, inset 0 0 40px #0006;
}
.text { padding: 16px; display: flex; flex-direction: column; gap: 4px; z-index: 1; }
.kind { font-size: .7rem; text-transform: uppercase; letter-spacing: .12em; color: var(--glow); font-weight: 700; }
h2 { margin: 0; font-size: 1.3rem; }
p { margin: 0; font-size: .85rem; color: #e7dcef; }
.ends { margin-top: auto; font-size: .78rem; color: #ffd9a0; }
.art { position: relative; }
.mini { position: absolute; width: 74%; aspect-ratio: 5/6; border-radius: 10px; overflow: hidden; border: 2px solid color-mix(in srgb, var(--glow) 70%, #fff); box-shadow: 0 6px 24px #000c, 0 0 20px color-mix(in srgb, var(--glow) 50%, transparent); }
.m0 { right: 10%; top: 14px; transform: rotate(6deg); z-index: 2; }
.m1 { right: 34%; top: 26px; transform: rotate(-8deg); opacity: .9; }
</style>
