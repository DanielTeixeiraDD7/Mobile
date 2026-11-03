<script setup lang="ts">
import Icon from '@/components/Icon.vue';
import { useSession } from '@/stores/session';

const s = useSession();
const links = [
  { to: '/missions', icon: 'scroll', label: 'Missions', auth: true },
  { to: '/echanges', icon: 'trade', label: 'Échanges', auth: true },
  { to: '/boutique', icon: 'shop', label: 'Boutique', auth: true },
  { to: '/historique', icon: 'history', label: 'Historique des tirages', auth: true },
  { to: '/profil', icon: 'user', label: 'Profil et données', auth: true },
  { to: '/boosters', icon: 'info', label: 'Taux de drop', auth: false },
  { to: '/legal/cgu', icon: 'shield', label: 'CGU', auth: false },
  { to: '/legal/cgv', icon: 'shield', label: 'CGV', auth: false },
  { to: '/legal/confidentialite', icon: 'shield', label: 'Confidentialité (RGPD)', auth: false },
] as const;
</script>

<template>
  <div class="page">
    <h1>Plus</h1>
    <nav class="list">
      <RouterLink v-for="l in links.filter(x => !x.auth || s.me)" :key="l.to" :to="l.to" class="item"><Icon :name="l.icon" /> {{ l.label }}</RouterLink>
      <RouterLink v-if="s.isAdmin" to="/admin" class="item admin"><Icon name="lock" /> Administration</RouterLink>
      <RouterLink v-if="!s.me" to="/connexion" class="item"><Icon name="user" /> Connexion</RouterLink>
    </nav>
    <p class="muted foot">Nocturne · personnages issus du domaine public, designs originaux. Achats réservés aux majeurs ou avec accord parental. Joue de façon responsable.</p>
  </div>
</template>

<style scoped>
.list { display: flex; flex-direction: column; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
.item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; color: var(--text); text-decoration: none; background: var(--panel); border-bottom: 1px solid var(--line); }
.item:last-child { border-bottom: 0; }
.item .icon { color: var(--gold); }
.admin .icon { color: var(--blood); }
.foot { font-size: .8rem; margin-top: 16px; }
</style>
