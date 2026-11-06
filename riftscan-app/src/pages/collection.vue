<script setup lang="ts">
import CarteImg from '@/components/CarteImg.vue';
import Icone from '@/components/Icone.vue';
import { useRift } from '@/stores/rift';
import { formatEuros, FINITIONS } from '@/core/prix';

/** Collection : cartes ajoutées, quantités et valeur totale (stockée uniquement sur cet appareil). */
const rift = useRift();
const lignes = computed(() => [...rift.lignesCollection].sort((a, b) => (b.valeur ?? 0) * b.q - (a.valeur ?? 0) * a.q));
const copie = ref(false);
async function copier() {
  const texte = lignes.value.map(l => `${l.q} × ${l.carte!.n} (${l.carte!.s} ${l.carte!.no}, ${FINITIONS[l.f]}) — ${formatEuros(l.valeur)}`).join('\n') + `\nTotal : ${formatEuros(rift.totalCollection)}`;
  try { await navigator.clipboard.writeText(texte); copie.value = true; setTimeout(() => (copie.value = false), 1800); } catch { /* presse-papiers refusé */ }
}
</script>

<template>
  <div class="page">
    <p class="kicker">Ma collection</p>
    <h1 class="titre">Valeur <span class="or">totale</span></h1>
    <section class="carte-ui total section">
      <p class="montant num">{{ formatEuros(rift.totalCollection) }}</p>
      <p class="small muted">{{ rift.nbCollection }} carte{{ rift.nbCollection > 1 ? 's' : '' }} · prix du marché TCGplayer convertis en euros</p>
      <button v-if="lignes.length" type="button" class="btn petit section" @click="copier"><Icone :nom="copie ? 'check' : 'collection'" :taille="18" /> {{ copie ? 'Liste copiée' : 'Copier la liste' }}</button>
    </section>

    <div v-if="!lignes.length" class="vide carte-ui section">
      <span class="gros">🃏</span>
      <p>Ta collection est vide.<br>Scanne une carte puis touche « Ma collection ».</p>
      <router-link to="/" class="btn or"><Icone nom="scan" /> Scanner</router-link>
    </div>
    <ul v-else class="liste section">
      <li v-for="l in lignes" :key="`${l.id}:${l.f}`" class="ligne-carte">
        <router-link :to="`/carte/${l.id}`" class="lien"><CarteImg :src="l.carte!.img" :nom="l.carte!.n" decor class="vignette" /></router-link>
        <router-link :to="`/carte/${l.id}`" class="grow lien">
          <b>{{ l.carte!.n }}</b>
          <small>{{ l.carte!.s }} · {{ l.carte!.no }} · <span :class="{ 'tag foil': l.f === 'F' }">{{ FINITIONS[l.f] }}</span></small>
          <small class="num">{{ formatEuros(l.valeur) }} / unité</small>
        </router-link>
        <div class="qte">
          <button type="button" class="mini" :aria-label="`Ajouter ${l.carte!.n}`" @click="rift.ajouter(l.id, l.f)"><Icone nom="plus" :taille="16" /></button>
          <b class="num">{{ l.q }}</b>
          <button type="button" class="mini" :aria-label="`Retirer ${l.carte!.n}`" @click="rift.ajouter(l.id, l.f, -1)"><Icone nom="moins" :taille="16" /></button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.total { padding: 22px 18px; text-align: center; background: radial-gradient(100% 120% at 50% 0%, rgba(200, 170, 110, 0.18), transparent 70%), var(--surface); }
.montant { margin: 0; font-size: 48px; font-weight: 900; background: var(--or-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
.lien { text-decoration: none; color: inherit; }
.qte { display: grid; justify-items: center; gap: 2px; }
.mini { width: 32px; height: 28px; display: grid; place-items: center; border-radius: 9px; border: 1px solid var(--border); background: var(--surface-2); cursor: pointer; }
.vide p { margin: 8px 0 16px; }
</style>
