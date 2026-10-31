<script setup lang="ts">
import { RARITY_COLOR, rarityRank, type PullDTO } from '@nocturne/shared';
import { onMounted, ref } from 'vue';
import { api } from '@/api';
import { dateTime } from '@/lib/format';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const pulls = ref<PullDTO[] | null>(null);
const SRC = { FREE: 'Gratuit', EMBERS: 'Braises', SHARDS: 'Éclats' };
onMounted(async () => { try { pulls.value = await api.pulls(); } catch (e) { useToast().error(e); } });
</script>

<template>
  <div class="page">
    <h1>Historique des tirages</h1>
    <div v-if="pulls && !pulls.length" class="empty">Aucun booster ouvert pour l’instant.</div>
    <div class="stack">
      <div v-for="p in pulls ?? []" :key="p.id" class="panel pull">
        <div class="spread"><b>{{ p.bannerName }}</b><small>{{ dateTime(p.createdAt) }} · {{ SRC[p.source] }}</small></div>
        <ul>
          <li v-for="c in p.cards" :key="c.slot">
            <RouterLink :to="`/carte/${c.cardId}`" :style="{ color: RARITY_COLOR[c.rarity], fontWeight: rarityRank(c.rarity) >= 3 ? 700 : 400 }">{{ s.card(c.cardId)?.name ?? c.cardId }}</RouterLink>
            <span v-if="c.reverse" class="badge rev">Reverse</span>
            <span v-if="c.isNew" class="badge">Nouveau</span>
          </li>
        </ul>
        <small v-if="p.pity" class="pity">Pitié déclenchée ({{ p.pity === 'LEGENDARY' ? 'Légendaire' : 'Épique' }})</small>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pull { margin: 0 !important; }
ul { list-style: none; padding: 0; margin: 8px 0 0; display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .9rem; }
li a { text-decoration: none; }
li .badge { margin-left: 4px; color: var(--gold); font-size: .65rem; }
li .badge.rev { color: #9ee9ff; }
.pity { color: var(--gold); }
</style>
