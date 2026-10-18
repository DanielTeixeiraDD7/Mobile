<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import type { Criteres, Pays } from '@/lib/types';
import { DRAPEAU, NOM_PAYS } from '@/lib/types';
import { sitesDuPays } from '@/lib/sites';
import { nomModele } from '@/lib/modeles';
import { euros, kms } from '@/lib/format';
import { CRITERES_DEFAUT, useRecherchesStore } from '@/stores/recherches';
import CriteresForm from '@/shared/components/CriteresForm.vue';
import SiteCard from './components/SiteCard.vue';

const recherches = useRecherchesStore();
const toast = useToast();
const active = computed(() => recherches.active);

// Résumé des critères en pastilles (config déclarative).
const pastilles = computed(() => {
  const c = active.value.criteres;
  const base = [{ icon: 'pi pi-bolt', texte: '100 % électrique' }];
  if (c.prixMax) base.push({ icon: 'pi pi-euro', texte: `≤ ${euros(c.prixMax)}` });
  if (c.anneeMin) base.push({ icon: 'pi pi-calendar', texte: `≥ ${c.anneeMin}` });
  if (c.kmMax) base.push({ icon: 'pi pi-gauge', texte: `≤ ${kms(c.kmMax)}` });
  return base;
});
const ordrePays: Pays[] = ['PT', 'FR', 'DE', 'BE'];
const pays = computed(() => ordrePays.filter(p => active.value.pays.includes(p)));
const nbSites = computed(() => pays.value.reduce((n, p) => n + sitesDuPays(p).length, 0));

// Édition dans un panneau : on travaille sur une copie, appliquée à l'enregistrement.
const edition = ref(false);
const mode = ref<'modifier' | 'creer'>('modifier');
const brouillon = ref<{ nom: string; criteres: Criteres; pays: Pays[] }>({ nom: '', criteres: { ...CRITERES_DEFAUT }, pays: [] });

function ouvrir(m: 'modifier' | 'creer') {
  mode.value = m;
  const r = active.value;
  brouillon.value = m === 'modifier'
    ? { nom: r.nom, criteres: { ...r.criteres }, pays: [...r.pays] }
    : { nom: 'Nouvelle recherche', criteres: { ...CRITERES_DEFAUT }, pays: [...ordrePays] };
  edition.value = true;
}
function enregistrer() {
  const b = brouillon.value;
  if (!b.pays.length) { toast.add({ severity: 'warn', summary: 'Choisis au moins un pays', life: 2500 }); return; }
  const nom = b.nom.trim() || nomModele(b.criteres.modele);
  if (mode.value === 'creer') recherches.creer(nom, b.criteres, b.pays);
  else recherches.modifier(active.value.id, { nom, criteres: { ...b.criteres }, pays: [...b.pays] });
  edition.value = false;
}
</script>

<template>
  <div class="page">
    <section class="hero">
      <div class="hero-top">
        <span class="kicker"><i class="pi pi-search" /> Recherche active</span>
        <div v-if="recherches.liste.length > 1" class="saved">
          <button v-for="r in recherches.liste" :key="r.id" type="button" :class="{ on: r.id === recherches.activeId }" @click="recherches.activeId = r.id">{{ r.nom }}</button>
        </div>
      </div>
      <h1>{{ active.nom }}</h1>
      <p class="model">{{ nomModele(active.criteres.modele) }} · {{ nbSites }} sites dans {{ pays.length }} pays</p>
      <div class="chips">
        <span v-for="p in pastilles" :key="p.texte" class="hchip"><i :class="p.icon" /> {{ p.texte }}</span>
        <span class="hchip">{{ pays.map(p => DRAPEAU[p]).join(' ') }}</span>
      </div>
      <div class="flex gap-2 flex-wrap mt-3">
        <Button label="Modifier" icon="pi pi-sliders-h" class="hero-btn" @click="ouvrir('modifier')" />
        <Button label="Nouvelle recherche" icon="pi pi-plus" text class="hero-btn2" @click="ouvrir('creer')" />
      </div>
      <svg class="radar" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="90" /><circle cx="100" cy="100" r="60" /><circle cx="100" cy="100" r="30" />
        <path class="sweep" d="M100 100 L190 100 A90 90 0 0 0 163.6 36.4 Z" />
        <circle class="blip" cx="140" cy="70" r="4" /><circle class="blip b2" cx="60" cy="130" r="3" />
      </svg>
    </section>

    <div class="callout info mt-3">
      <i class="pi pi-bell" />
      <p>Chaque bouton ouvre la page de résultats <b>du site officiel</b>, déjà filtrée. Pour être prévenu des nouvelles annonces, active l'<b>alerte e-mail</b> du site depuis cette page (gratuit).</p>
    </div>

    <section v-for="p in pays" :key="p">
      <h2 class="section-title"><span class="flag">{{ DRAPEAU[p] }}</span> {{ NOM_PAYS[p] }} <span class="pill">{{ sitesDuPays(p).length }} sites</span></h2>
      <div class="grid-sites">
        <SiteCard v-for="s in sitesDuPays(p)" :key="s.id" :site="s" :criteres="active.criteres" />
      </div>
    </section>

    <Drawer v-model:visible="edition" :header="mode === 'creer' ? 'Nouvelle recherche' : 'Modifier la recherche'" :position="'right'" class="drawer-form">
      <CriteresForm v-model:criteres="brouillon.criteres" v-model:pays="brouillon.pays" v-model:nom="brouillon.nom" />
      <template #footer>
        <div class="flex gap-2 justify-content-between">
          <Button v-if="mode === 'modifier' && recherches.liste.length > 1" label="Supprimer" icon="pi pi-trash" severity="danger" text @click="recherches.supprimer(active.id); edition = false" />
          <span v-else />
          <Button label="Enregistrer" icon="pi pi-check" @click="enregistrer" />
        </div>
      </template>
    </Drawer>
  </div>
</template>

<route>
{ "meta": { "titre": "Rechercher" } }
</route>

<style scoped>
.hero {
  position: relative; overflow: hidden; padding: 28px 30px; border-radius: 26px; color: #fff;
  background: radial-gradient(120% 140% at 0% 0%, #5e8bff 0%, #2450f5 35%, #142a7a 70%, #0b1226 100%);
  box-shadow: 0 18px 40px -16px rgba(36, 80, 245, .55);
}
.hero > *:not(.radar) { position: relative; z-index: 1; }
.hero-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.kicker { font-weight: 700; opacity: .85; font-size: 13.5px; display: flex; gap: 8px; align-items: center; }
.saved { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: rgba(255,255,255,.12); overflow-x: auto; max-width: 100%; }
.saved button { border: 0; background: none; color: #fff; opacity: .75; font: 700 12.5px Inter, sans-serif; padding: 6px 10px; border-radius: 9px; cursor: pointer; white-space: nowrap; }
.saved button.on { background: #fff; color: #142a7a; opacity: 1; }
.hero h1 { font-size: 32px; letter-spacing: -.03em; margin: 10px 0 2px; line-height: 1.1; }
.model { margin: 0 0 14px; opacity: .85; font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; max-width: 70%; }
.hchip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; background: rgba(255,255,255,.14); font-size: 13px; font-weight: 700; backdrop-filter: blur(6px); }
.hchip i { font-size: 12px; color: #a3e635; }
:deep(.hero-btn) { background: #fff !important; color: #142a7a !important; border: 0 !important; border-radius: 12px; }
:deep(.hero-btn2) { color: #fff !important; }
.radar { position: absolute; right: -30px; top: 50%; width: 270px; height: 270px; transform: translateY(-50%); opacity: .9; }
.radar circle { fill: none; stroke: rgba(255,255,255,.18); stroke-width: 1.5; }
.radar .sweep { fill: rgba(163, 230, 53, .22); transform-origin: 100px 100px; animation: sweep 4s linear infinite; }
.radar .blip { fill: #22d3ee; stroke: none; animation: blip 4s ease-in-out infinite; }
.radar .b2 { fill: #a3e635; animation-delay: 1.6s; }
@keyframes sweep { to { transform: rotate(-360deg); } }
@keyframes blip { 0%, 100% { opacity: .2; } 30% { opacity: 1; } }
.flag { font-size: 22px; }
.grid-sites { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
:global(.drawer-form) { width: min(480px, 100vw) !important; }
@media (max-width: 1200px) { .grid-sites { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 991px) {
  .hero { padding: 22px 20px; border-radius: 22px; }
  .hero h1 { font-size: 26px; }
  .chips { max-width: none; }
  .radar { width: 180px; height: 180px; right: -50px; top: 90px; opacity: .5; }
}
@media (max-width: 640px) { .grid-sites { grid-template-columns: 1fr; } }
</style>
