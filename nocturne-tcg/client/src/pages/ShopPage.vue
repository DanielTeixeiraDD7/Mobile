<script setup lang="ts">
import type { ComplianceDTO, CosmeticDTO, ShopProductDTO } from '@nocturne/shared';
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import CardBack from '@/components/CardBack.vue';
import Currency from '@/components/Currency.vue';
import { euros } from '@/lib/format';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const products = ref<ShopProductDTO[]>([]);
const cosmetics = ref<CosmeticDTO[]>([]);
const comp = ref<ComplianceDTO | null>(null);
const KIND = { CARD_BACK: 'Dos de carte', FRAME: 'Cadre', AVATAR: 'Avatar', TITLE: 'Titre' };

onMounted(async () => {
  try {
    [products.value, cosmetics.value, comp.value] = await Promise.all([api.products(), api.cosmetics(), api.compliance()]);
  } catch (e) { toast.error(e); }
});

const shards = computed(() => products.value.filter(p => p.kind === 'SHARDS'));
const pass = computed(() => products.value.find(p => p.kind === 'PASS'));

async function buy(c: CosmeticDTO) {
  if (!confirm(`Acheter « ${c.name} » pour ${c.priceEmbers} Braises ?`)) return;
  try {
    cosmetics.value = await api.buyCosmetic(c.code);
    toast.push('Cosmétique débloqué !', 'success');
    await s.refreshWallet();
  } catch (e) { toast.error(e); }
}
async function equip(c: CosmeticDTO) {
  try {
    cosmetics.value = await api.equipCosmetic(c.code);
    await s.refreshMe();
  } catch (e) { toast.error(e); }
}
async function demoPass() {
  await api.demo?.setPass(!s.me?.pass.active);
  await Promise.all([s.refreshMe(), s.refreshWallet()]);
  cosmetics.value = await api.cosmetics();
  toast.push(s.me?.pass.active ? 'Pass Nocturne activé (démo)' : 'Pass désactivé', 'success');
}
</script>

<template>
  <div class="page">
    <h1>Boutique</h1>

    <section class="panel pass">
      <div>
        <span class="kind">Abonnement mensuel</span>
        <h2>Pass Nocturne</h2>
        <ul>
          <li>+1 booster gratuit par jour (3 au lieu de 2)</li>
          <li>+25 % de Poussière au recyclage</li>
          <li>Dos de carte, cadre, avatar et titre exclusifs</li>
        </ul>
        <p v-if="s.me?.pass.active" class="active">Actif jusqu’au {{ new Date(s.me.pass.until!).toLocaleDateString('fr-FR') }}</p>
      </div>
      <div class="pass-cta">
        <b v-if="pass">{{ euros(pass.priceCents) }} / mois</b>
        <button class="btn gold" :disabled="!pass?.available">S’abonner</button>
        <small v-if="pass?.reason">{{ pass.reason }}</small>
        <button v-if="api.demo" class="btn sm ghost" @click="demoPass">{{ s.me?.pass.active ? 'Désactiver' : 'Essayer' }} le Pass (démo)</button>
      </div>
    </section>

    <section class="panel">
      <h2>Éclats</h2>
      <p class="muted">Monnaie premium pour ouvrir des boosters ({{ 60 }} Éclats l’unité). Avant tout achat, les taux de drop sont consultables sur chaque bannière.</p>
      <p v-if="comp && !comp.canPurchase && comp.reason" class="warn">{{ comp.reason }}</p>
      <p v-if="comp?.capCents != null" class="muted">Plafond mensuel : {{ euros(comp.capCents) }} · dépensé ce mois-ci : {{ euros(comp.spentThisMonthCents) }}</p>
      <div class="shards">
        <div v-for="p in shards" :key="p.code" class="shard">
          <Currency kind="SHARDS" :value="p.shards" />
          <small>{{ p.name }}</small>
          <button class="btn sm primary" :disabled="!p.available">{{ euros(p.priceCents) }}</button>
        </div>
      </div>
      <small class="muted">{{ shards[0]?.reason }}</small>
    </section>

    <section class="panel">
      <h2>Cosmétiques</h2>
      <div class="cos">
        <div v-for="c in cosmetics" :key="c.code" class="item" :class="{ owned: c.owned }">
          <div class="preview">
            <CardBack v-if="c.kind === 'CARD_BACK'" :back="c.code" />
            <span v-else class="glyph">{{ c.kind === 'FRAME' ? '▣' : c.kind === 'AVATAR' ? '☾' : '❦' }}</span>
          </div>
          <small>{{ KIND[c.kind] }}</small>
          <b>{{ c.name }}</b>
          <button v-if="c.owned" class="btn sm" :disabled="c.equipped" @click="equip(c)">{{ c.equipped ? 'Équipé' : 'Équiper' }}</button>
          <span v-else-if="c.passExclusive" class="badge">Pass Nocturne</span>
          <button v-else class="btn sm" @click="buy(c)"><Currency kind="EMBERS" :value="c.priceEmbers ?? 0" /></button>
        </div>
      </div>
    </section>
    <p class="muted legal">Contenu numérique livré immédiatement. Achats soumis aux <RouterLink to="/legal/cgv">CGV</RouterLink>. Aucune revente de cartes ou de monnaie contre de l’argent réel.</p>
  </div>
</template>

<style scoped>
.pass { display: grid; gap: 12px; background: radial-gradient(circle at 90% 0%, #a45cf044, transparent 60%), linear-gradient(135deg, #2c1a52, #120b18); border-color: #a45cf066; }
@media (min-width: 640px) { .pass { grid-template-columns: 1fr auto; align-items: center; } }
.kind { font-size: .7rem; text-transform: uppercase; letter-spacing: .12em; color: var(--gold); font-weight: 700; }
.pass h2 { margin: 4px 0 8px; }
.pass ul { margin: 0; padding-left: 18px; color: #e7dcef; font-size: .92rem; }
.active { color: var(--ok); margin: 8px 0 0; }
.pass-cta { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
.warn { color: #ffcf8a; }
.shards { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin: 10px 0; }
.shard { display: flex; flex-direction: column; gap: 6px; align-items: center; padding: 12px; border-radius: 12px; background: #0e0914; border: 1px solid var(--line); text-align: center; font-size: 1.1rem; }
.shard small { font-size: .8rem; }
.cos { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.item { display: flex; flex-direction: column; gap: 4px; padding: 10px; border-radius: 12px; background: #0e0914; border: 1px solid var(--line); }
.item.owned { border-color: #4fae7a66; }
.item b { font-size: .88rem; }
.item .btn, .item .badge { margin-top: auto; align-self: flex-start; }
.preview { height: 110px; display: flex; align-items: center; justify-content: center; }
.preview :deep(.back) { width: 74px; height: 104px; }
.glyph { font-size: 2.6rem; color: var(--gold); }
.legal { font-size: .8rem; margin-top: 12px; }
</style>
