<script setup lang="ts">
import Icone from '@/components/Icone.vue';
import ToastHost from '@/components/ToastHost.vue';
import ConfirmHost from '@/components/ConfirmHost.vue';
import Bienvenue from '@/components/Bienvenue.vue';
import Lecteur from '@/components/Lecteur.vue';
import Feuille from '@/components/Feuille.vue';
import GuideExercice from '@/components/GuideExercice.vue';
import { EXERCICES } from '@/core/exercices';
import { SEANCES, TYPES } from '@/core/programmes';
import { kg } from '@/core/dates';
import { useFit } from '@/stores/fit';
import { useTheme } from '@/composables/useTheme';
import { useEcran } from '@/composables/useEcran';
import { useFicheOuverte, useSeanceEnCours } from '@/composables/useSeance';

const fit = useFit();
const route = useRoute();
const router = useRouter();
const { estMobile } = useEcran();
useTheme();

/** Barre d'onglets (mobile) : 2 onglets, bouton central « Démarrer », 2 onglets. */
const onglets = [
  { to: '/', label: 'Accueil', icone: 'accueil' },
  { to: '/plan', label: 'Plan', icone: 'plan' },
  { to: '/seances', label: 'Séances', icone: 'haltere' },
  { to: '/poids', label: 'Progrès', icone: 'progres' },
];
/** Barre latérale (ordinateur) : tout. */
const navigation = [
  { to: '/', label: 'Accueil', icone: 'accueil' },
  { to: '/plan', label: 'Mon plan', icone: 'plan' },
  { to: '/seances', label: 'Séances', icone: 'haltere' },
  { to: '/exercices', label: 'Exercices', icone: 'livre' },
  { to: '/poids', label: 'Progrès', icone: 'progres' },
  { to: '/nutrition', label: 'Nutrition', icone: 'repas' },
  { to: '/profil', label: 'Profil & réglages', icone: 'reglages' },
];
const actif = (to: string) => (to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(to + '/'));
/** Pages de premier niveau : barre du haut (logo, nutrition, profil). Les pages de détail ont leur bouton retour. */
const premierNiveau = computed(() => ['/', '/plan', '/seances', '/poids', '/nutrition', '/profil', '/exercices'].includes(route.path));
const initiale = computed(() => (fit.profil?.name?.trim()?.[0] ?? '').toUpperCase());
const progression = computed(() => {
  const p = fit.profil;
  if (!p) return 0;
  const t = p.startWeight - p.goalWeight;
  return Math.max(0, Math.min(1, t > 0 ? (p.startWeight - fit.poids) / t : 0));
});

const seance = useSeanceEnCours();
const fiche = useFicheOuverte();
const ficheOuverte = computed({ get: () => !!fiche.value, set: v => { if (!v) fiche.value = null; } });
const exFiche = computed(() => (fiche.value ? EXERCICES[fiche.value] : undefined));

/** Feuille « Démarrer » (bouton central). */
const demarrer = ref(false);
function aller(to: string) { demarrer.value = false; router.push(to); }
</script>

<template>
  <Bienvenue v-if="!fit.profil" />
  <div v-else class="shell">
    <aside v-if="!estMobile" class="side" aria-label="Navigation principale">
      <router-link to="/" class="brand" aria-label="FitMaison, accueil">
        <img :src="'icons/icon.svg'" alt="" width="42" height="42">
        <span><b>FitMaison</b><small>Objectif foot</small></span>
      </router-link>
      <button type="button" class="btn primary full go" @click="demarrer = true"><Icone nom="play" :taille="18" /> Démarrer</button>
      <nav class="liens">
        <router-link v-for="o in navigation" :key="o.to" :to="o.to" class="nav" :class="{ on: actif(o.to) }" :aria-current="actif(o.to) ? 'page' : undefined">
          <Icone :nom="o.icone" :taille="20" /> {{ o.label }}
        </router-link>
      </nav>
      <router-link to="/poids" class="moi">
        <span class="avatar">{{ initiale || '•' }}</span>
        <span class="grow">
          <b class="ellipsis">{{ fit.profil.name || 'Mon profil' }}</b>
          <small class="num">{{ kg(fit.poids) }} → {{ kg(fit.profil.goalWeight) }} kg</small>
          <span class="progress fin"><i :style="{ width: progression * 100 + '%' }" /></span>
        </span>
      </router-link>
    </aside>

    <main class="main" :class="{ mobile: estMobile }">
      <header v-if="estMobile && premierNiveau" class="appbar">
        <router-link to="/" class="marque" aria-label="FitMaison, accueil"><img :src="'icons/icon.svg'" alt="" width="30" height="30"><b>FitMaison</b></router-link>
        <span class="grow" />
        <span v-if="fit.serie" class="pill flamme serie" :title="`${fit.serie} jour(s) d’affilée avec une séance`"><Icone nom="feu" :taille="15" /> {{ fit.serie }}</span>
        <router-link to="/nutrition" class="icon-btn" :class="{ on: actif('/nutrition') }" aria-label="Nutrition"><Icone nom="repas" :taille="20" /></router-link>
        <router-link to="/profil" class="avatar-btn" :class="{ on: actif('/profil') }" aria-label="Profil et réglages">
          <span class="avatar">{{ initiale }}<Icone v-if="!initiale" nom="profil" :taille="18" /></span>
        </router-link>
      </header>
      <router-view v-slot="{ Component, route: r }">
        <transition name="fade" mode="out-in"><component :is="Component" :key="r.path" /></transition>
      </router-view>
    </main>

    <nav v-if="estMobile" class="tabbar" aria-label="Navigation principale">
      <router-link v-for="o in onglets.slice(0, 2)" :key="o.to" :to="o.to" :class="{ on: actif(o.to) }" :aria-current="actif(o.to) ? 'page' : undefined"><Icone :nom="o.icone" :epaisseur="actif(o.to) ? 2.4 : 2" /><span>{{ o.label }}</span></router-link>
      <button type="button" class="fab" aria-label="Démarrer une séance" aria-haspopup="dialog" @click="demarrer = true"><Icone nom="play" :taille="26" /></button>
      <router-link v-for="o in onglets.slice(2)" :key="o.to" :to="o.to" :class="{ on: actif(o.to) }" :aria-current="actif(o.to) ? 'page' : undefined"><Icone :nom="o.icone" :epaisseur="actif(o.to) ? 2.4 : 2" /><span>{{ o.label }}</span></router-link>
    </nav>
  </div>

  <Feuille v-model="demarrer" titre="Démarrer">
    <div class="demarrer">
      <button type="button" class="card pitch plan-jour" @click="aller('/plan')">
        <span class="grow">
          <span class="kicker">Objectif foot</span>
          <b>Mon plan du jour</b>
          <small>La séance prévue aujourd’hui, adaptée à ton niveau.</small>
        </span>
        <span class="rond"><Icone nom="play" :taille="22" /></span>
      </button>
      <p class="label">Séance rapide</p>
      <div class="rapides">
        <button v-for="t in TYPES" :key="t" type="button" class="card rapide" @click="aller(`/seance/${t}`)">
          <span class="emoji" aria-hidden="true">{{ SEANCES[t].icone }}</span>
          <b>{{ SEANCES[t].nom }}</b>
        </button>
      </div>
      <p class="label">Exercices expliqués</p>
      <div class="liens-ex">
        <button type="button" class="card ligne-lien" @click="aller('/exercices?cat=Bureau')"><span class="pastille-ic"><Icone nom="bureau" /></span><span class="grow"><b>Pause bureau</b><small>Déraidir dos, hanches et nuque</small></span><Icone nom="droite" :taille="18" class="dim" /></button>
        <button type="button" class="card ligne-lien" @click="aller('/exercices?cat=Football')"><span class="pastille-ic"><Icone nom="ballon" /></span><span class="grow"><b>Ballon</b><small>Toucher, conduite, passes contre le mur</small></span><Icone nom="droite" :taille="18" class="dim" /></button>
        <button type="button" class="card ligne-lien" @click="aller('/exercices')"><span class="pastille-ic"><Icone nom="livre" /></span><span class="grow"><b>Tous les exercices</b><small>Démo animée, étapes, erreurs à éviter</small></span><Icone nom="droite" :taille="18" class="dim" /></button>
      </div>
    </div>
  </Feuille>

  <Lecteur v-if="seance" :type="seance" @fermer="seance = null" />
  <Feuille v-model="ficheOuverte" :titre="exFiche?.nom">
    <GuideExercice v-if="exFiche" :ex="exFiche" compact @ouvrir="id => (fiche = id)" />
  </Feuille>
  <ToastHost />
  <ConfirmHost />
</template>

<style scoped>
.shell { min-height: 100dvh; display: flex; }
.main { flex: 1; min-width: 0; padding: calc(var(--safe-t) + 14px) 16px calc(var(--tab-h) + var(--safe-b) + 34px); }
.main.mobile { padding-top: calc(var(--safe-t) + 8px); }

/* Barre du haut (mobile) */
.appbar { display: flex; align-items: center; gap: 8px; height: 52px; margin: 0 0 6px; }
.marque { display: flex; align-items: center; gap: 8px; color: var(--text); text-decoration: none; }
.marque img { border-radius: 9px; }
.marque b { font-weight: 900; font-stretch: 75%; text-transform: uppercase; font-size: 20px; letter-spacing: .01em; }
.appbar .icon-btn { width: 40px; height: 40px; border-radius: 50%; }
.appbar .icon-btn.on { color: var(--accent); border-color: var(--accent); }
.serie { padding: 6px 10px; }
.avatar-btn { border-radius: 50%; text-decoration: none; display: block; padding: 2px; background: var(--brand-grad); }
.avatar-btn.on { box-shadow: 0 0 0 2px var(--bg), 0 0 0 4px var(--accent); }
.avatar { width: 38px; height: 38px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--surface); color: var(--text); font-weight: 900; font-size: 17px; font-stretch: 85%; border: 2px solid var(--bg); }
.avatar-btn .avatar { width: 36px; height: 36px; }

/* Barre latérale (ordinateur) */
.side { position: sticky; top: 0; height: 100dvh; width: 260px; flex: none; padding: 22px 16px 18px; display: flex; flex-direction: column; gap: 6px; background: color-mix(in srgb, var(--surface) 70%, transparent); border-right: 1px solid var(--border); backdrop-filter: blur(16px); }
.brand { display: flex; align-items: center; gap: 12px; padding: 2px 6px 16px; color: var(--text); text-decoration: none; }
.brand img { border-radius: 13px; box-shadow: var(--shadow); }
.brand b { display: block; font-size: 22px; font-weight: 900; font-stretch: 75%; text-transform: uppercase; line-height: 1; }
.brand small { color: var(--accent); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .14em; }
.go { margin-bottom: 12px; }
.liens { display: grid; gap: 2px; }
.nav { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 14px; color: var(--muted); text-decoration: none; font-weight: 700; transition: background .15s, color .15s; position: relative; }
.nav:hover { background: var(--surface-2); color: var(--text); }
.nav.on { background: var(--brand-soft); color: var(--text); font-weight: 800; }
.nav.on .ic { color: var(--accent); }
.nav.on::before { content: ''; position: absolute; left: -16px; top: 10px; bottom: 10px; width: 4px; border-radius: 0 4px 4px 0; background: var(--accent); }
.moi { margin-top: auto; display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 18px; background: var(--surface-2); border: 1px solid var(--border); color: inherit; text-decoration: none; }
.moi b { display: block; font-size: 15px; }
.moi small { display: block; color: var(--muted); font-size: 12.5px; font-weight: 700; margin-bottom: 6px; }
.moi .avatar { background: var(--brand-grad); color: var(--on-volt); border: 0; }

/* Barre d'onglets (mobile) */
.tabbar {
  position: fixed; z-index: 50; left: 12px; right: 12px; bottom: calc(10px + var(--safe-b)); height: var(--tab-h);
  display: grid; grid-template-columns: 1fr 1fr 78px 1fr 1fr; align-items: center; padding: 0 6px; border-radius: 26px;
  background: color-mix(in srgb, var(--surface) 82%, transparent); backdrop-filter: saturate(1.6) blur(22px); -webkit-backdrop-filter: saturate(1.6) blur(22px);
  border: 1px solid var(--border-2); box-shadow: 0 18px 44px -18px rgba(0, 0, 0, .55);
}
.tabbar a { position: relative; display: grid; justify-items: center; gap: 3px; padding: 9px 0 7px; color: var(--dim); text-decoration: none; font-size: 11px; font-weight: 800; letter-spacing: .01em; transition: color .2s; }
.tabbar a.on { color: var(--text); }
.tabbar a.on .ic { color: var(--accent); }
.tabbar a.on::after { content: ''; position: absolute; bottom: 1px; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); }
.tabbar .fab {
  justify-self: center; width: 62px; height: 62px; margin-top: -30px; padding: 0 0 0 3px; border: 0; border-radius: 50%; display: grid; place-items: center;
  color: var(--on-volt); background: var(--brand-grad); box-shadow: 0 0 0 5px var(--bg), var(--shadow-volt); transition: transform .16s var(--ease-spring);
}
.tabbar .fab:active { transform: scale(.9); }

/* Feuille « Démarrer » */
.demarrer { display: grid; gap: 12px; padding-bottom: 6px; }
.demarrer .label { margin-top: 6px; }
.plan-jour { display: flex; align-items: center; gap: 14px; padding: 18px; width: 100%; border: 0; text-align: left; }
.plan-jour b { display: block; font-size: 22px; font-weight: 900; font-stretch: 75%; text-transform: uppercase; line-height: 1.05; margin: 2px 0; }
.plan-jour small { display: block; color: rgba(255,255,255,.8); font-size: 13.5px; }
.rond { width: 52px; height: 52px; flex: none; border-radius: 50%; display: grid; place-items: center; background: var(--volt); color: var(--on-volt); padding-left: 3px; box-shadow: 0 8px 20px -8px rgba(0,0,0,.6); }
.rapides { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; }
.rapide { display: grid; justify-items: center; gap: 4px; padding: 14px 6px 12px; text-align: center; border-radius: 18px; }
.rapide .emoji { font-size: 26px; line-height: 1; }
.rapide b { font-size: 12.5px; line-height: 1.2; font-weight: 800; }
.liens-ex { display: grid; gap: 8px; }
.liens-ex .ligne-lien { width: 100%; text-align: left; border-radius: 18px; }

@media (min-width: 992px) { .main { padding: 32px 40px 56px; } }
</style>
