<script setup lang="ts">
import BannerCard from '@/components/BannerCard.vue';
import { useBanners } from '@/composables';

const { banners, loading } = useBanners();
</script>

<template>
  <div class="page">
    <div class="page-title"><h1>Boosters</h1><RouterLink to="/historique" class="btn sm ghost">Historique</RouterLink></div>
    <p class="muted">Chaque booster contient 5 cartes. Les taux exacts et la garantie de pitié sont affichés sur chaque bannière avant l’ouverture.</p>
    <div v-if="loading" class="empty">Chargement…</div>
    <div class="stack"><BannerCard v-for="b in banners" :key="b.id" :banner="b" /></div>
  </div>
</template>
