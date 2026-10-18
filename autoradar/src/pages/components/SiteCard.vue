<script setup lang="ts">
import type { Site, Filtre } from '@/lib/sites';
import type { Criteres } from '@/lib/types';

const props = defineProps<{ site: Site; criteres: Criteres }>();
const lien = computed(() => props.site.lien(props.criteres));

const LIBELLES: Record<Filtre, string> = { modele: 'modèle', electrique: 'électrique', prix: 'prix', annee: 'année', km: 'km', tri: 'tri' };
// Filtres demandés mais que ce site ne sait pas recevoir par le lien.
const manquants = computed(() => {
  const voulus: Filtre[] = ['modele'];
  if (props.criteres.prixMax) voulus.push('prix');
  if (props.criteres.anneeMin) voulus.push('annee');
  if (props.criteres.kmMax) voulus.push('km');
  return voulus.filter(f => !props.site.filtres.includes(f));
});
const initiale = computed(() => props.site.nom.replace(/[^A-Za-z0-9]/g, '').slice(0, 2));
</script>

<template>
  <article class="site card" :style="{ '--c': site.couleur }">
    <header class="flex align-items-center gap-3">
      <span class="logo">{{ initiale }}</span>
      <span class="grow">
        <b>{{ site.nom }}</b>
        <small class="muted block">{{ site.domaines[0] }}</small>
      </span>
      <span class="pill" :class="site.vendeurs === 'pros' ? 'good' : ''">{{ site.vendeurs === 'pros' ? 'Pros' : 'Pros + particuliers' }}</span>
    </header>
    <p class="note">{{ site.note }}</p>
    <div class="filtres">
      <span v-for="f in site.filtres" :key="f" class="chip ok"><i class="pi pi-check" /> {{ LIBELLES[f] }}</span>
      <span v-for="f in manquants" :key="'m' + f" class="chip ko" v-tooltip.top="'À régler sur le site'"><i class="pi pi-minus" /> {{ LIBELLES[f] }}</span>
    </div>
    <a class="go" :href="lien" target="_blank" rel="noopener noreferrer">
      Voir les résultats <i class="pi pi-external-link" />
    </a>
    <small v-if="!site.verifie" class="dim"><i class="pi pi-info-circle" /> Lien construit d'après le format public du site.</small>
  </article>
</template>

<style scoped>
.site { padding: 16px; display: flex; flex-direction: column; gap: 10px; transition: transform .15s, border-color .15s; }
.site:hover { transform: translateY(-2px); border-color: color-mix(in srgb, var(--c) 45%, var(--ar-border)); }
.logo { width: 42px; height: 42px; flex: none; border-radius: 12px; display: grid; place-items: center; font-weight: 900; font-size: 15px; color: #fff; background: var(--c); letter-spacing: -.02em; }
.block { display: block; }
.note { margin: 0; font-size: 13.5px; color: var(--ar-muted); flex: 1; }
.filtres { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700; padding: 2px 8px; border-radius: 8px; }
.chip i { font-size: 10px; }
.chip.ok { background: color-mix(in srgb, var(--ar-good) 12%, transparent); color: var(--ar-good); }
.chip.ko { background: var(--ar-surface-2); color: var(--ar-dim); }
.go { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px; border-radius: 12px; font-weight: 800; text-decoration: none; color: #fff !important; background: var(--c); transition: filter .15s; }
.go:hover { filter: brightness(1.08); }
.go i { font-size: 12px; }
</style>
