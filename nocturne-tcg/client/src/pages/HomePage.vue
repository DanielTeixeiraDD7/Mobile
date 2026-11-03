<script setup lang="ts">
import type { MissionDTO } from '@nocturne/shared';
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import BannerCard from '@/components/BannerCard.vue';
import CardView from '@/components/CardView.vue';
import Icon from '@/components/Icon.vue';
import { useBanners } from '@/composables';
import { countdown } from '@/lib/format';
import { useNow } from '@/lib/now';
import { useSession } from '@/stores/session';

const s = useSession();
const now = useNow();
const { banners } = useBanners();
const missions = ref<MissionDTO[]>([]);

onMounted(async () => {
  if (s.me) missions.value = await api.missions().catch(() => []);
});

const claimable = computed(() => missions.value.filter(m => m.progress >= m.target && !m.claimed).length);
const owned = computed(() => Object.keys(s.collection).length);
const progress = computed(() => (s.cards.length ? Math.round((owned.value / s.cards.length) * 100) : 0));
const showcase = computed(() => ['NE1-012', 'NE1-055', 'NE1-026'].map(id => s.card(id)).filter(c => !!c));
const free = computed(() => s.wallet?.freePacks);
const nextIn = computed(() => (free.value?.nextAt ? countdown(free.value.nextAt, now.value) : null));
const firstBanner = computed(() => banners.value.find(b => b.endsAt) ?? banners.value[0]);
</script>

<template>
  <div class="page">
    <template v-if="!s.me">
      <section class="landing">
        <h1 class="title">Nocturne</h1>
        <p class="tag">Dracula, la Dame Blanche, le Mothman, Cthulhu… Collectionne les monstres et légendes de la nuit, ouvre des boosters, échange et affronte d’autres collectionneurs.</p>
        <div class="fan">
          <div v-for="(c, i) in showcase" :key="c.id" class="fan-card" :class="`f${i}`"><CardView :card="c" /></div>
        </div>
        <div class="stack cta">
          <RouterLink to="/inscription" class="btn primary block">Commencer : 2 boosters offerts</RouterLink>
          <RouterLink to="/connexion" class="btn block">J’ai déjà un compte</RouterLink>
          <RouterLink to="/boosters" class="btn ghost block">Voir les boosters et les taux</RouterLink>
        </div>
      </section>
    </template>

    <template v-else>
      <div class="greet">
        <h1>Bonsoir, {{ s.me.displayName }}</h1>
        <span v-if="s.me.pass.active" class="badge pass">Pass Nocturne</span>
      </div>

      <RouterLink v-if="!s.me.emailVerified" to="/verifier" class="panel verify">
        <Icon name="info" /> Confirme ton adresse email pour débloquer les échanges et les achats.
      </RouterLink>

      <section class="panel free">
        <div>
          <h2>Boosters gratuits</h2>
          <p class="muted" v-if="free">{{ free.available }} / {{ free.max }} disponible{{ free.available > 1 ? 's' : '' }}<span v-if="nextIn"> · prochain dans {{ nextIn }}</span></p>
        </div>
        <div class="pips"><i v-for="n in free?.max ?? 2" :key="n" :class="{ on: n <= (free?.available ?? 0) }" /></div>
        <RouterLink v-if="firstBanner" :to="`/boosters/${firstBanner.id}`" class="btn primary" :class="{ dim: !free?.available }">Ouvrir</RouterLink>
      </section>

      <section class="stack">
        <BannerCard v-for="b in banners" :key="b.id" :banner="b" />
      </section>

      <section class="quick">
        <RouterLink to="/missions" class="panel q">
          <Icon name="scroll" />
          <b>Missions</b>
          <small>{{ claimable ? `${claimable} récompense${claimable > 1 ? 's' : ''} à récupérer` : 'Quotidiennes et hebdo' }}</small>
          <span v-if="claimable" class="dot" />
        </RouterLink>
        <RouterLink to="/collection" class="panel q">
          <Icon name="cards" />
          <b>Collection</b>
          <small>{{ owned }} / {{ s.cards.length }} cartes · {{ progress }} %</small>
          <div class="bar gold"><i :style="{ width: `${progress}%` }" /></div>
        </RouterLink>
        <RouterLink to="/echanges" class="panel q"><Icon name="trade" /><b>Échanges</b><small>Carte contre carte</small></RouterLink>
        <RouterLink to="/boutique" class="panel q"><Icon name="shop" /><b>Boutique</b><small>Pass, cosmétiques</small></RouterLink>
      </section>
    </template>
  </div>
</template>

<style scoped>
.landing { text-align: center; padding-top: 12px; }
.title { font-family: 'Cinzel Decorative', 'Cinzel', serif; font-size: clamp(2.4rem, 11vw, 3.6rem); margin: 8px 0 6px; background: linear-gradient(180deg, #fff, #e0315a); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 0 20px #e0315a66); }
.tag { color: #d9cbe4; max-width: 520px; margin: 0 auto 8px; }
.fan { position: relative; height: min(84vw, 360px); max-width: 420px; margin: 0 auto; }
.fan-card { position: absolute; width: 46%; left: 27%; top: 8%; transition: transform .3s; }
.f0 { transform: rotate(-14deg) translateX(-52%); }
.f1 { z-index: 2; transform: translateY(-4%); }
.f2 { transform: rotate(14deg) translateX(52%); }
.cta { max-width: 360px; margin: 0 auto; }
.greet { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
.greet h1 { margin: 0; }
.pass { background: linear-gradient(90deg, #f0b43c, #a45cf0); color: #120a00; border: 0; }
.verify { display: flex; gap: 10px; align-items: center; color: #ffe2a6; text-decoration: none; margin-bottom: 12px; border-color: #f0b43c55; }
.free { display: grid; grid-template-columns: 1fr auto; gap: 8px 12px; align-items: center; margin-bottom: 14px; }
.free h2 { margin: 0; }
.free p { margin: 2px 0 0; font-size: .9rem; }
.free .btn { grid-column: 2; grid-row: 1 / span 2; }
.free .btn.dim { opacity: .6; }
.pips { display: flex; gap: 6px; }
.pips i { width: 26px; height: 8px; border-radius: 4px; background: #2a1f38; }
.pips i.on { background: linear-gradient(90deg, #ef4a72, #f0b43c); box-shadow: 0 0 10px #e0315a88; }
.quick { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
.q { position: relative; display: flex; flex-direction: column; gap: 4px; text-decoration: none; color: var(--text); margin: 0 !important; }
.q .icon { color: var(--gold); }
.q small { line-height: 1.3; }
.dot { position: absolute; top: 12px; right: 12px; width: 10px; height: 10px; border-radius: 50%; background: var(--blood); box-shadow: 0 0 10px var(--blood); }
</style>
