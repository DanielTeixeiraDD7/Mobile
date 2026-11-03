<script setup lang="ts">
import { RARITY_COLOR, RARITY_LABEL, type BannerDTO, type PullDTO, type PullSource, type RatesDTO } from '@nocturne/shared';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api';
import BannerCard from '@/components/BannerCard.vue';
import CardView from '@/components/CardView.vue';
import Currency from '@/components/Currency.vue';
import PackOpening from '@/components/PackOpening.vue';
import { countdown, pct } from '@/lib/format';
import { useNow } from '@/lib/now';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const props = defineProps<{ id: string }>();
const s = useSession();
const toast = useToast();
const router = useRouter();
const now = useNow();
const banner = ref<BannerDTO | null>(null);
const rates = ref<RatesDTO | null>(null);
const pull = ref<PullDTO | null>(null);
const lastSource = ref<PullSource>('FREE');
const busy = ref(false);

async function load() {
  const [list, r] = await Promise.all([api.banners(), api.rates(props.id)]);
  banner.value = list.find(b => b.id === props.id) ?? null;
  rates.value = r;
}
onMounted(() => load().catch(e => toast.error(e)));

const free = computed(() => s.wallet?.freePacks);
const bal = computed(() => s.wallet?.balances);
const pity = computed(() => banner.value?.pity);
const epicLeft = computed(() => (pity.value ? pity.value.epicEvery - pity.value.sinceEpic : 0));
const legLeft = computed(() => (pity.value ? pity.value.legendaryAt - pity.value.sinceLegendary : 0));
const featured = computed(() => (banner.value?.featured ?? []).map(id => s.card(id)).filter(c => !!c));
const featuredRates = computed(() => rates.value?.cards.filter(c => c.featured) ?? []);
const canPay = (src: PullSource) => {
  const b = banner.value;
  if (!b || !bal.value) return false;
  if (src === 'FREE') return (free.value?.available ?? 0) > 0;
  if (src === 'EMBERS') return b.priceEmbers != null && bal.value.EMBERS >= b.priceEmbers;
  return b.paidPacksAllowed && b.priceShards != null && bal.value.SHARDS >= b.priceShards;
};

async function open(source: PullSource) {
  if (!s.me) return router.push({ path: '/connexion', query: { next: `/boosters/${props.id}` } });
  busy.value = true;
  try {
    const r = await api.open(props.id, source);
    lastSource.value = source;
    s.wallet = r.wallet;
    if (banner.value) banner.value.pity = r.pity;
    pull.value = r.pull;
    s.refreshCollection();
  } catch (e) {
    toast.error(e);
  } finally {
    busy.value = false;
  }
}

function again() {
  pull.value = null;
  const src = canPay(lastSource.value) ? lastSource.value : (['FREE', 'EMBERS', 'SHARDS'] as PullSource[]).find(canPay);
  if (src) open(src);
}
const canAgain = computed(() => (['FREE', 'EMBERS', 'SHARDS'] as PullSource[]).some(canPay));
</script>

<template>
  <div class="page" v-if="banner">
    <RouterLink to="/boosters" class="btn sm ghost back">← Boosters</RouterLink>
    <BannerCard :banner="banner" />

    <section v-if="s.me && pity" class="panel pity">
      <h3>Garantie de pitié</h3>
      <div class="pity-row">
        <span>Épique ou mieux garanti dans <b>{{ epicLeft }}</b> booster{{ epicLeft > 1 ? 's' : '' }}</span>
        <div class="bar"><i :style="{ width: `${(pity.sinceEpic / pity.epicEvery) * 100}%` }" /></div>
      </div>
      <div class="pity-row">
        <span>Légendaire garanti dans <b>{{ legLeft }}</b> booster{{ legLeft > 1 ? 's' : '' }}</span>
        <div class="bar gold"><i :style="{ width: `${(pity.sinceLegendary / pity.legendaryAt) * 100}%` }" /></div>
      </div>
      <small>Compteur propre à cette bannière · {{ pity.totalPacks }} booster{{ pity.totalPacks > 1 ? 's' : '' }} ouvert{{ pity.totalPacks > 1 ? 's' : '' }} ici.</small>
    </section>

    <section class="panel open">
      <button class="btn primary block" :disabled="busy || (!!s.me && !canPay('FREE'))" @click="open('FREE')">
        Ouvrir gratuitement
        <small v-if="free">({{ free.available }}/{{ free.max }}<template v-if="!free.available && free.nextAt"> · {{ countdown(free.nextAt, now) }}</template>)</small>
      </button>
      <div class="two">
        <button v-if="banner.priceEmbers" class="btn block" :disabled="busy || (!!s.me && !canPay('EMBERS'))" @click="open('EMBERS')">
          Ouvrir · <Currency kind="EMBERS" :value="banner.priceEmbers" />
        </button>
        <button v-if="banner.priceShards" class="btn block" :disabled="busy || !banner.paidPacksAllowed || (!!s.me && !canPay('SHARDS'))" @click="open('SHARDS')">
          Ouvrir · <Currency kind="SHARDS" :value="banner.priceShards" />
        </button>
      </div>
      <p v-if="!banner.paidPacksAllowed" class="note">Les boosters payés en Éclats ne sont pas disponibles dans ton pays.</p>
      <RouterLink :to="`/taux/${banner.id}`" class="rates-link">Taux de drop exacts et détail par carte →</RouterLink>
    </section>

    <section v-if="rates" class="panel">
      <h3>Taux par emplacement</h3>
      <div class="slots">
        <div v-for="sl in rates.slots" :key="sl.slot" class="slot">
          <b>Carte {{ sl.slot + 1 }}</b>
          <span v-for="r in sl.rates" :key="r.rarity" :style="{ color: RARITY_COLOR[r.rarity] }">{{ RARITY_LABEL[r.rarity] }} {{ pct(r.percent) }}</span>
        </div>
      </div>
    </section>

    <section v-if="featured.length" class="panel">
      <h3>Cartes mises en avant</h3>
      <div class="grid-cards">
        <RouterLink v-for="c in featured" :key="c.id" :to="`/carte/${c.id}`" class="feat">
          <CardView :card="c" />
          <small>{{ pct(featuredRates.find(f => f.id === c.id)?.perPackPercent ?? 0) }} par booster</small>
        </RouterLink>
      </div>
    </section>

    <PackOpening v-if="pull" :pull="pull" :theme="banner.theme" :pack-name="banner.name" :can-again="canAgain" @close="pull = null; load()" @again="again" />
  </div>
</template>

<style scoped>
.back { margin-bottom: 10px; }
.pity { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
.pity h3 { margin: 0; }
.pity-row { display: flex; flex-direction: column; gap: 6px; font-size: .92rem; }
.open { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.open .btn small { font-weight: 400; opacity: .85; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.note { margin: 0; font-size: .85rem; color: #ffcf8a; }
.rates-link { font-size: .9rem; }
.slots { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
.slot { display: flex; flex-direction: column; gap: 2px; font-size: .85rem; padding: 10px; border-radius: 10px; background: #0e0914; border: 1px solid var(--line); }
.feat { text-decoration: none; text-align: center; color: var(--muted); display: flex; flex-direction: column; gap: 6px; }
</style>
