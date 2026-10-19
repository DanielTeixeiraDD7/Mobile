<script setup lang="ts">
import type { MediaSnapshot } from '@/domain/types';
import { entryId } from '@/domain/types';
import { mediaTitle } from '@/domain/labels';
import { useBiblio } from '@/stores/biblio';
import Affiche from './Affiche.vue';
import BadgeType from './BadgeType.vue';
import Icone from './Icone.vue';

/** Affiche cliquable (recherche, tendances, recommandations) avec ajout rapide. */
const props = withDefaults(defineProps<{ media: MediaSnapshot; sousTitre?: string; badge?: boolean }>(), { sousTitre: '', badge: true });
const emit = defineEmits<{ ajouter: [MediaSnapshot] }>();
const biblio = useBiblio();
const titre = computed(() => mediaTitle(props.media, biblio.settings.titleLanguage));
const suivi = computed(() => biblio.parId(entryId(props.media.type, props.media.id)));
</script>

<template>
  <div class="carte">
    <router-link :to="`/titre/${media.type}/${media.id}`" class="lien-carte">
      <Affiche :src="media.cover" :couleur="media.coverColor" :titre="titre" :largeur="999" :rayon="14">
        <span v-if="suivi" class="suivi" aria-label="Dans ta bibliothèque"><Icone nom="check" :taille="14" :epaisseur="3" /></span>
      </Affiche>
      <span class="nom clamp2">{{ titre }}</span>
      <span class="sous">
        <BadgeType v-if="badge" :type="media.type" court />
        <span class="ellipsis">{{ sousTitre || media.startYear || '' }}</span>
      </span>
    </router-link>
    <button v-if="!suivi" type="button" class="ajout" :aria-label="`Ajouter ${titre}`" @click="emit('ajouter', media)"><Icone nom="plus" :taille="18" :epaisseur="2.8" /></button>
  </div>
</template>

<style scoped>
.carte { position: relative; }
.lien-carte { display: grid; gap: 6px; color: inherit; text-decoration: none; }
.lien-carte :deep(.affiche) { width: 100% !important; }
.nom { font-size: 13.5px; font-weight: 700; line-height: 1.25; }
.sous { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--dim); margin-top: -2px; min-width: 0; }
.suivi { position: absolute; top: 6px; left: 6px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; background: var(--ok); color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.4); }
.ajout { position: absolute; top: 6px; right: 6px; width: 34px; height: 34px; border-radius: 12px; border: 0; display: grid; place-items: center; color: #fff; background: rgba(10, 11, 16, .62); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); transition: transform .12s, background .15s; }
.ajout:active { transform: scale(.9); background: var(--brand); }
</style>
