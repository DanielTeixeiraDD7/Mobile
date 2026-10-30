<script setup lang="ts">
import type { MissionDTO } from '@nocturne/shared';
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api';
import Currency from '@/components/Currency.vue';
import { countdown } from '@/lib/format';
import { useNow } from '@/lib/now';
import { useSession } from '@/stores/session';
import { useToast } from '@/stores/toast';

const s = useSession();
const toast = useToast();
const now = useNow(30_000);
const missions = ref<MissionDTO[]>([]);
onMounted(async () => { try { missions.value = await api.missions(); } catch (e) { toast.error(e); } });

const groups = computed(() => [
  { title: 'Quotidiennes', list: missions.value.filter(m => m.period === 'DAILY') },
  { title: 'Hebdomadaires', list: missions.value.filter(m => m.period === 'WEEKLY') },
]);

async function claim(m: MissionDTO) {
  try {
    missions.value = await api.claimMission(m.id);
    toast.push(`Récompense : +${m.rewardEmbers} Braises${m.rewardDust ? `, +${m.rewardDust} Poussière` : ''}`, 'reward');
    await s.refreshWallet();
  } catch (e) { toast.error(e); }
}
</script>

<template>
  <div class="page">
    <h1>Missions</h1>
    <p class="muted">Les Braises gagnées ici servent à ouvrir des boosters et à acheter des cosmétiques. Connexion quotidienne : +20 Braises, bonus de 100 tous les 7 jours d’affilée.</p>
    <section v-for="g in groups" :key="g.title" class="stack group">
      <div class="spread"><h2>{{ g.title }}</h2><small v-if="g.list[0]">Renouvellement dans {{ countdown(g.list[0].resetsAt, now) }}</small></div>
      <div v-for="m in g.list" :key="m.id" class="panel mission" :class="{ done: m.claimed }">
        <div class="body">
          <b>{{ m.title }}</b>
          <div class="bar"><i :style="{ width: `${(m.progress / m.target) * 100}%` }" /></div>
          <small>{{ m.progress }} / {{ m.target }}</small>
        </div>
        <div class="rew">
          <Currency v-if="m.rewardEmbers" kind="EMBERS" :value="m.rewardEmbers" />
          <Currency v-if="m.rewardDust" kind="DUST" :value="m.rewardDust" />
          <button class="btn sm" :class="{ gold: m.progress >= m.target && !m.claimed }" :disabled="m.claimed || m.progress < m.target" @click="claim(m)">{{ m.claimed ? 'Reçu' : 'Récupérer' }}</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.group { margin-top: 18px; }
.group h2 { margin: 0; }
.mission { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center; margin: 0 !important; }
.mission.done { opacity: .55; }
.body { display: flex; flex-direction: column; gap: 6px; }
.rew { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; font-size: .9rem; }
</style>
