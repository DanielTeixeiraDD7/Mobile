<script setup lang="ts">
import { energieEffective, type Site, type Filtre } from '@/lib/sites';
import type { Criteres } from '@/lib/types';

const props = defineProps<{ site: Site; criteres: Criteres }>();
const lien = computed(() => props.site.recherche(props.criteres));

const LIBELLES: Record<Filtre, string> = { marque: 'marque', modele: 'modèle', energie: 'énergie', prix: 'prix', annee: 'année', km: 'km', tri: 'tri' };
// Filtres demandés : appliqués par le lien (✓) ou à régler sur le site (–).
const filtres = computed(() => {
  const c = props.criteres;
  const voulus: Filtre[] = [];
  if (c.marque.trim()) voulus.push('marque');
  if (c.modele.trim()) voulus.push('modele');
  if (energieEffective(c) !== 'tous') voulus.push('energie');
  if (c.prixMax) voulus.push('prix');
  if (c.anneeMin) voulus.push('annee');
  if (c.kmMax) voulus.push('km');
  voulus.push('tri');
  return voulus.map(f => ({ f, ok: lien.value.ok.includes(f) }));
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
      <template v-for="x in filtres" :key="x.f">
        <span v-if="x.ok" class="chip ok"><i class="pi pi-check" /> {{ LIBELLES[x.f] }}</span>
        <span v-else class="chip ko" v-tooltip.top="'À régler sur le site'"><i class="pi pi-minus" /> {{ LIBELLES[x.f] }}</span>
      </template>
    </div>
    <a class="go" :href="lien.url" target="_blank" rel="noopener noreferrer">
      Voir les résultats <i class="pi pi-external-link" />
    </a>
    <small v-if="!lien.verifie" class="dim"><i class="pi pi-info-circle" /> Lien construit d'après le format public du site.</small>
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
