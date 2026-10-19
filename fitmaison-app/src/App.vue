<script setup lang="ts">
import Icone from '@/components/Icone.vue';
import ToastHost from '@/components/ToastHost.vue';
import ConfirmHost from '@/components/ConfirmHost.vue';
import Bienvenue from '@/components/Bienvenue.vue';
import Lecteur from '@/components/Lecteur.vue';
import Feuille from '@/components/Feuille.vue';
import GuideExercice from '@/components/GuideExercice.vue';
import { EXERCICES } from '@/core/exercices';
import { useFit } from '@/stores/fit';
import { useTheme } from '@/composables/useTheme';
import { useEcran } from '@/composables/useEcran';
import { useFicheOuverte, useSeanceEnCours } from '@/composables/useSeance';

const fit = useFit();
const route = useRoute();
const { estMobile } = useEcran();
useTheme();

const onglets = [
  { to: '/', label: 'Accueil', icone: 'accueil' },
  { to: '/seances', label: 'Séances', icone: 'haltere' },
  { to: '/poids', label: 'Poids', icone: 'balance' },
  { to: '/nutrition', label: 'Nutrition', icone: 'assiette' },
];
const actif = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to));
const seance = useSeanceEnCours();
const fiche = useFicheOuverte();
const ficheOuverte = computed({ get: () => !!fiche.value, set: v => { if (!v) fiche.value = null; } });
const exFiche = computed(() => (fiche.value ? EXERCICES[fiche.value] : undefined));
</script>

<template>
  <Bienvenue v-if="!fit.profil" />
  <div v-else class="shell">
    <aside v-if="!estMobile" class="side">
      <router-link to="/" class="brand"><img :src="'icons/icon.svg'" alt="" width="40" height="40"><span><b>FitMaison</b><small>Perte de poids à la maison</small></span></router-link>
      <router-link v-for="o in onglets" :key="o.to" :to="o.to" class="nav" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /> {{ o.label }}</router-link>
      <router-link to="/exercices" class="nav" :class="{ on: actif('/exercices') }"><Icone nom="livre" /> Exercices</router-link>
      <router-link to="/profil" class="nav" :class="{ on: actif('/profil') }"><Icone nom="profil" /> Profil</router-link>
    </aside>
    <main class="main">
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in"><component :is="Component" :key="r.path" /></transition>
      </router-view>
    </main>
    <nav v-if="estMobile" class="tabbar" aria-label="Navigation principale">
      <router-link v-for="o in onglets.slice(0, 2)" :key="o.to" :to="o.to" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /><span>{{ o.label }}</span></router-link>
      <router-link to="/exercices" class="fab" :class="{ on: actif('/exercices') }" aria-label="Exercices expliqués"><Icone nom="livre" :taille="26" :epaisseur="2.4" /></router-link>
      <router-link v-for="o in onglets.slice(2)" :key="o.to" :to="o.to" :class="{ on: actif(o.to) }"><Icone :nom="o.icone" /><span>{{ o.label }}</span></router-link>
    </nav>
  </div>

  <Lecteur v-if="seance" :type="seance" @fermer="seance = null" />
  <Feuille v-model="ficheOuverte" :titre="exFiche?.nom">
    <GuideExercice v-if="exFiche" :ex="exFiche" compact @ouvrir="id => (fiche = id)" />
  </Feuille>
  <ToastHost />
  <ConfirmHost />
</template>

<style scoped>
.shell { min-height: 100dvh; display: flex; }
.main { flex: 1; min-width: 0; padding: calc(var(--safe-t) + 14px) 16px calc(var(--tab-h) + var(--safe-b) + 28px); }
.side { position: sticky; top: 0; height: 100dvh; width: 240px; flex: none; padding: 22px 14px; display: flex; flex-direction: column; gap: 4px; background: var(--surface); border-right: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 12px; padding: 4px 8px 18px; color: var(--text); text-decoration: none; }
.brand img { border-radius: 12px; }
.brand b { display: block; font-size: 18px; }
.brand small { color: var(--muted); font-size: 12px; }
.nav { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 13px; color: var(--muted); text-decoration: none; font-weight: 700; }
.nav:hover { background: var(--surface-2); color: var(--text); }
.nav.on { background: var(--brand-soft); color: var(--brand); }
.tabbar {
  position: fixed; z-index: 50; left: 10px; right: 10px; bottom: calc(8px + var(--safe-b)); height: var(--tab-h);
  display: grid; grid-template-columns: 1fr 1fr 76px 1fr 1fr; align-items: center; padding: 0 6px; border-radius: 24px;
  background: color-mix(in srgb, var(--surface) 86%, transparent); backdrop-filter: saturate(1.8) blur(20px); -webkit-backdrop-filter: saturate(1.8) blur(20px);
  border: 1px solid var(--border); box-shadow: 0 16px 40px -18px rgba(0, 0, 0, .5);
}
.tabbar a { display: grid; justify-items: center; gap: 3px; padding: 8px 0; color: var(--dim); text-decoration: none; font-size: 11px; font-weight: 700; }
.tabbar a.on { color: var(--brand); }
.tabbar .fab { justify-self: center; width: 60px; height: 60px; margin-top: -26px; padding: 0; border-radius: 22px; display: grid; place-items: center; color: #fff; background: var(--brand-grad); box-shadow: 0 14px 28px -10px var(--brand); }
.tabbar .fab.on { color: #fff; }
@media (min-width: 992px) { .main { padding: 28px 36px 48px; } }
</style>
