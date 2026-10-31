<script setup lang="ts">
import { RARITIES, RARITY_COLOR, RARITY_LABEL, type BannerDTO, type RatesDTO } from '@nocturne/shared';
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import { pct } from '@/lib/format';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const props = defineProps<{ id: string }>();
const s = useSession();
const rates = ref<RatesDTO | null>(null);
const banner = ref<BannerDTO | null>(null);

onMounted(async () => {
  try {
    const [r, list] = await Promise.all([api.rates(props.id), api.banners()]);
    rates.value = r;
    banner.value = list.find(b => b.id === props.id) ?? null;
  } catch (e) { useToast().error(e); }
});

const byRarity = computed(() => RARITIES.map(r => ({ r, cards: (rates.value?.cards ?? []).filter(c => c.rarity === r).sort((a, b) => b.perPackPercent - a.perPackPercent) })).filter(g => g.cards.length));
</script>

<template>
  <div class="page">
    <RouterLink :to="`/boosters/${id}`" class="btn sm ghost">← Retour</RouterLink>
    <h1 style="margin-top: 10px">Taux de drop · {{ banner?.name }}</h1>
    <p class="muted">Tirage effectué sur le serveur avec un générateur aléatoire cryptographique. Les taux ci-dessous sont exacts et s’appliquent à chaque booster de 5 cartes.</p>
    <template v-if="rates">
      <section class="panel">
        <h3>Par emplacement</h3>
        <div class="scroll-x">
          <table class="table">
            <thead><tr><th>Rareté</th><th v-for="sl in rates.slots" :key="sl.slot">Carte {{ sl.slot + 1 }}</th></tr></thead>
            <tbody>
              <tr v-for="r in RARITIES" :key="r">
                <td :style="{ color: RARITY_COLOR[r] }">{{ RARITY_LABEL[r] }}</td>
                <td v-for="sl in rates.slots" :key="sl.slot">{{ sl.rates.find(x => x.rarity === r) ? pct(sl.rates.find(x => x.rarity === r)!.percent) : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel">
        <h3>Garantie de pitié</h3>
        <p>Si aucun des {{ rates.pity.epicEvery - 1 }} boosters précédents ne contenait d’Épique ou mieux, le {{ rates.pity.epicEvery }}<sup>e</sup> en contient au moins un. Si aucun des {{ rates.pity.legendaryAt - 1 }} boosters précédents ne contenait de Légendaire ou mieux, le {{ rates.pity.legendaryAt }}<sup>e</sup> en contient au moins un. La carte garantie remplace la 5<sup>e</sup> carte, selon les poids de cet emplacement limités aux raretés éligibles. Les compteurs sont propres à chaque bannière et se remettent à zéro dès qu’une carte éligible est obtenue.</p>
        <p>Reverse holo : {{ pct(rates.reversePercent) }} des boosters contiennent une carte reverse holo (même carte, finition holographique). Elle remplace la finition d’une carte Commune, Peu commune ou Rare classique déjà tirée et ne change pas les taux ci-dessus.</p>
        <p>Versions : les Full Art et les éditions Couronne sont des cartes à part entière, listées avec leur rareté et leur probabilité ci-dessous.</p>
        <p v-if="banner?.featuredShare">Bannière à taux augmenté : quand une rareté est tirée, {{ pct(banner.featuredShare / 1000) }} des tirages de cette rareté tombent sur les cartes mises en avant de cette rareté.</p>
      </section>
      <section class="panel">
        <h3>Probabilité d’obtenir chaque carte (par booster)</h3>
        <div v-for="g in byRarity" :key="g.r" class="group">
          <h4 :style="{ color: RARITY_COLOR[g.r] }">{{ RARITY_LABEL[g.r] }} · {{ g.cards.length }} carte{{ g.cards.length > 1 ? 's' : '' }}</h4>
          <ul>
            <li v-for="c in g.cards" :key="c.id"><span>{{ s.card(c.id)?.name ?? c.id }}<b v-if="c.featured" class="badge">Mise en avant</b></span><span>{{ pct(c.perPackPercent) }}</span></li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.group h4 { margin: 14px 0 6px; font-family: 'Cinzel', serif; }
ul { list-style: none; padding: 0; margin: 0; }
li { display: flex; justify-content: space-between; gap: 10px; padding: 6px 0; border-bottom: 1px solid #ffffff0c; font-size: .9rem; }
li .badge { margin-left: 6px; color: var(--gold); }
</style>
