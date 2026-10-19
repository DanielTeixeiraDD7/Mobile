<script setup lang="ts">
import Icone from '@/components/Icone.vue';
import ToastHost from '@/components/ToastHost.vue';
import ConfirmHost from '@/components/ConfirmHost.vue';
import FeuilleAjout from '@/components/FeuilleAjout.vue';
import Bienvenue from '@/components/Bienvenue.vue';
import { useBiblio } from '@/stores/biblio';
import { useTheme } from '@/composables/useTheme';
import { useEcran } from '@/composables/useEcran';

const biblio = useBiblio();
const route = useRoute();
const { estMobile } = useEcran();
useTheme();

// Onglets ; la recherche est au centre (bouton principal).
const onglets = [
  { to: '/', label: 'Accueil', icone: 'accueil' },
  { to: '/bibliotheque', label: 'Biblio', long: 'Bibliothèque', icone: 'biblio' },
  { to: '/temps', label: 'Temps', long: 'Temps d’écran', icone: 'sablier' },
  { to: '/profil', label: 'Profil', icone: 'profil' },
];
const secondaires = [
  { to: '/calendrier', label: 'Calendrier', icone: 'calendrier' },
  { to: '/donnees', label: 'Données', icone: 'donnees' },
  { to: '/reglages', label: 'Réglages', icone: 'reglages' },
];
const actif = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to));
const accueilVisible = computed(() => biblio.pret && !biblio.settings.onboarded);
</script>

<template>
  <div v-if="biblio.erreur" class="fatal">
    <Icone nom="alerte" :taille="40" />
    <p>{{ biblio.erreur }}</p>
  </div>

  <Bienvenue v-else-if="accueilVisible" />

  <div v-else class="shell">
    <aside v-if="!estMobile" class="side">
      <router-link to="/" class="brand">
        <img :src="'icons/icon.svg'" alt="" width="40" height="40">
        <span><b>ScreenPilot</b><small>Films · séries · anime · manga</small></span>
      </router-link>
      <router-link to="/recherche" class="add-side"><Icone nom="recherche" :epaisseur="2.4" /> Rechercher</router-link>
      <router-link v-for="o in onglets" :key="o.to" :to="o.to" class="nav" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /> {{ o.long ?? o.label }}</router-link>
      <hr>
      <router-link v-for="o in secondaires" :key="o.to" :to="o.to" class="nav" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /> {{ o.label }}</router-link>
      <p class="side-pied">Données : TMDB et AniList.<br>Tout reste sur cet appareil.</p>
    </aside>

    <main class="main">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="r.path" />
        </transition>
      </router-view>
    </main>

    <nav v-if="estMobile" class="tabbar" aria-label="Navigation principale">
      <router-link v-for="o in onglets.slice(0, 2)" :key="o.to" :to="o.to" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /><span>{{ o.label }}</span></router-link>
      <router-link to="/recherche" class="fab" :class="{ on: actif('/recherche') }" aria-label="Rechercher et ajouter"><Icone nom="recherche" :taille="26" :epaisseur="2.6" /></router-link>
      <router-link v-for="o in onglets.slice(2)" :key="o.to" :to="o.to" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /><span>{{ o.label }}</span></router-link>
    </nav>
  </div>

  <FeuilleAjout />
  <ToastHost />
  <ConfirmHost />
</template>

<style scoped>
.fatal { min-height: 100dvh; display: grid; place-content: center; justify-items: center; gap: 10px; padding: 24px; text-align: center; color: var(--muted); }
.shell { min-height: 100dvh; display: flex; }
.main { flex: 1; min-width: 0; padding: calc(var(--safe-t) + 14px) 16px calc(var(--tab-h) + var(--safe-b) + 28px); }
.side { position: sticky; top: 0; height: 100dvh; width: 250px; flex: none; padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; background: var(--surface); border-right: 1px solid var(--border); overflow-y: auto; }
.side hr { width: 100%; border: 0; border-top: 1px solid var(--border); margin: 10px 0; }
.brand { display: flex; align-items: center; gap: 12px; padding: 4px 8px 18px; color: var(--text); text-decoration: none; }
.brand img { border-radius: 12px; box-shadow: 0 8px 20px -10px var(--brand); }
.brand b { display: block; font-size: 18px; letter-spacing: -.02em; }
.brand small { color: var(--muted); font-size: 12px; }
.add-side { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 0 0 14px; min-height: 48px; border-radius: 15px; background: var(--brand-grad); color: #fff; font-weight: 800; font-size: 15.5px; text-decoration: none; box-shadow: 0 12px 26px -12px var(--brand); }
.nav { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 13px; color: var(--muted); text-decoration: none; font-weight: 700; transition: background .15s, color .15s; }
.nav:hover { background: var(--surface-2); color: var(--text); }
.nav.on { background: var(--brand-soft); color: var(--brand); }
.side-pied { margin-top: auto; padding: 12px; font-size: 12px; color: var(--dim); }

.tabbar {
  position: fixed; z-index: 50; left: 10px; right: 10px; bottom: calc(8px + var(--safe-b)); height: var(--tab-h);
  display: grid; grid-template-columns: 1fr 1fr 76px 1fr 1fr; align-items: center; padding: 0 6px; border-radius: 24px;
  background: color-mix(in srgb, var(--surface) 84%, transparent); backdrop-filter: saturate(1.8) blur(20px); -webkit-backdrop-filter: saturate(1.8) blur(20px);
  border: 1px solid var(--border); box-shadow: 0 16px 40px -18px rgba(0, 0, 0, .5);
}
.tabbar a { display: grid; justify-items: center; gap: 3px; padding: 8px 0; color: var(--dim); text-decoration: none; font-size: 11px; font-weight: 700; transition: color .15s; }
.tabbar a.on { color: var(--brand); }
.tabbar .fab { justify-self: center; width: 60px; height: 60px; margin-top: -26px; padding: 0; border-radius: 22px; display: grid; place-items: center; color: #fff; background: var(--brand-grad); box-shadow: 0 14px 28px -10px var(--brand), inset 0 1px 0 rgba(255,255,255,.35); transition: transform .15s var(--ease); }
.tabbar .fab.on { color: #fff; }
.tabbar .fab:active { transform: scale(.92); }
@media (min-width: 992px) {
  .main { padding: 28px 36px 48px; }
}
</style>
