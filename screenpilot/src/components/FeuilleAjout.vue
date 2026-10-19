<script setup lang="ts">
import { useAjout } from '@/composables/useAjout';
import { mediaTitle, statusLabel, TYPE_LABELS } from '@/domain/labels';
import type { EntryStatus } from '@/domain/types';
import { ajouter, filmVu } from '@/lib/actions';
import { useBiblio } from '@/stores/biblio';
import Feuille from './Feuille.vue';
import Affiche from './Affiche.vue';
import Icone from './Icone.vue';

const media = useAjout();
const biblio = useBiblio();
const ouvert = computed({ get: () => !!media.value, set: v => { if (!v) media.value = null; } });
const titre = computed(() => (media.value ? mediaTitle(media.value, biblio.settings.titleLanguage) : ''));

/** Choix proposés : un film se « voit », le reste se suit épisode par épisode. */
const choix = computed<{ id: string; libelle: string; aide: string; icone: string; principal?: boolean }[]>(() => {
  const t = media.value?.type;
  if (!t) return [];
  if (t === 'MOVIE') return [
    { id: 'VU', libelle: 'Vu aujourd’hui', aide: 'Compte dans ton temps d’écran du jour', icone: 'oeil', principal: true },
    { id: 'PLANNING', libelle: statusLabel(t, 'PLANNING'), aide: 'À ta liste', icone: 'plus' },
    { id: 'COMPLETED', libelle: 'Déjà vu avant', aide: 'Sans compter de temps d’écran', icone: 'check' },
  ];
  return [
    { id: 'CURRENT', libelle: statusLabel(t, 'CURRENT'), aide: t === 'MANGA' ? 'Tu le lis en ce moment' : 'Tu le regardes en ce moment', icone: 'play', principal: true },
    { id: 'PLANNING', libelle: statusLabel(t, 'PLANNING'), aide: 'À ta liste', icone: 'plus' },
    { id: 'COMPLETED', libelle: statusLabel(t, 'COMPLETED'), aide: 'Déjà fini (sans compter de temps d’écran)', icone: 'check' },
    { id: 'PAUSED', libelle: statusLabel(t, 'PAUSED'), aide: 'Commencé puis mis de côté', icone: 'horloge' },
  ];
});

async function choisir(id: string) {
  const m = media.value;
  if (!m) return;
  media.value = null;
  if (id === 'VU') await filmVu(m);
  else await ajouter(m, id as EntryStatus);
}
</script>

<template>
  <Feuille v-model="ouvert" titre="Ajouter">
    <div v-if="media" class="tete">
      <Affiche :src="media.cover" :couleur="media.coverColor" :titre="titre" :largeur="58" :rayon="10" />
      <div class="grow">
        <b class="clamp2">{{ titre }}</b>
        <span class="small muted">{{ TYPE_LABELS[media.type].un }}<template v-if="media.startYear"> · {{ media.startYear }}</template></span>
      </div>
    </div>
    <div class="choix">
      <button v-for="c in choix" :key="c.id" type="button" class="opt" :class="{ principal: c.principal }" @click="choisir(c.id)">
        <span class="ic"><Icone :nom="c.icone" :taille="20" /></span>
        <span class="grow"><b>{{ c.libelle }}</b><small>{{ c.aide }}</small></span>
      </button>
    </div>
  </Feuille>
</template>

<style scoped>
.tete { display: flex; gap: 14px; align-items: center; margin-bottom: 14px; }
.tete b { display: block; font-size: 17px; line-height: 1.25; }
.choix { display: grid; gap: 8px; }
.opt { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; border: 1px solid var(--border); background: var(--surface-2); text-align: left; transition: transform .1s; }
.opt:active { transform: scale(.98); }
.opt b { display: block; font-size: 15.5px; }
.opt small { display: block; color: var(--muted); font-size: 13px; }
.ic { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; background: var(--surface); color: var(--muted); }
.opt.principal { background: var(--brand-soft); border-color: transparent; }
.opt.principal .ic { background: var(--brand-grad); color: #fff; }
</style>
