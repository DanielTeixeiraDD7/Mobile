<script setup lang="ts">
import { ENTRY_STATUSES, MEDIA_TYPES, type EntryStatus, type MediaType } from '@/domain/types';
import { TYPE_LABELS, mediaTitle, statusLabel } from '@/domain/labels';
import { useBiblio } from '@/stores/biblio';
import Icone from '@/components/Icone.vue';
import LigneTitre from '@/components/LigneTitre.vue';

const biblio = useBiblio();
const route = useRoute();
const router = useRouter();
const lire = <T extends string>(v: unknown, ok: readonly T[]) => (ok.includes(v as T) ? (v as T) : null);
const type = ref<MediaType | null>(lire(route.query.type, MEDIA_TYPES));
const statut = ref<EntryStatus | null>(lire(route.query.statut, ENTRY_STATUSES));
const recherche = ref('');
const tri = ref<'recent' | 'titre' | 'note' | 'ajout'>('recent');
watch([type, statut], () => router.replace({ query: { ...(type.value ? { type: type.value } : {}), ...(statut.value ? { statut: statut.value } : {}) } }));

// Libellés de statut génériques quand toutes les catégories sont mélangées.
const GENERIQUE: Record<EntryStatus, string> = { CURRENT: 'En cours', PLANNING: 'À voir / lire', COMPLETED: 'Terminés', PAUSED: 'En pause', DROPPED: 'Abandonnés', REWATCH: 'À revoir' };
const libStatut = (s: EntryStatus) => (type.value ? statusLabel(type.value, s) : GENERIQUE[s]);

const norm = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const duType = computed(() => biblio.entries.filter(e => !type.value || e.type === type.value));
const compteType = (t: MediaType | null) => biblio.entries.filter(e => !t || e.type === t).length;
const compteStatut = (s: EntryStatus) => duType.value.filter(e => e.status === s).length;
const liste = computed(() => {
  const q = norm(recherche.value.trim());
  const lang = biblio.settings.titleLanguage;
  const l = duType.value
    .filter(e => !statut.value || e.status === statut.value)
    .filter(e => !q || norm([e.media.title.romaji, e.media.title.english, e.media.title.native, e.notes].filter(Boolean).join(' ')).includes(q));
  const titre = (e: typeof l[number]) => mediaTitle(e.media, lang);
  return [...l].sort((a, b) =>
    tri.value === 'titre' ? titre(a).localeCompare(titre(b), 'fr')
      : tri.value === 'note' ? (b.score ?? -1) - (a.score ?? -1) || b.updatedAt - a.updatedAt
        : tri.value === 'ajout' ? b.addedAt - a.addedAt
          : b.updatedAt - a.updatedAt);
});
</script>

<template>
  <div class="page">
    <div class="topbar">
      <h1 class="page-title grow">Bibliothèque</h1>
      <span class="muted small num">{{ biblio.entries.length }} titres</span>
    </div>

    <label class="recherche">
      <Icone nom="recherche" :taille="18" />
      <input v-model="recherche" type="search" placeholder="Filtrer ma bibliothèque" enterkeyhint="search">
      <button v-if="recherche" type="button" aria-label="Effacer" @click="recherche = ''"><Icone nom="fermer" :taille="16" /></button>
    </label>

    <div class="chips types">
      <button type="button" class="chip" :class="{ on: !type }" @click="type = null">Tout <small>{{ compteType(null) }}</small></button>
      <button v-for="t in MEDIA_TYPES" :key="t" type="button" class="chip" :class="{ on: type === t }" @click="type = type === t ? null : t">
        <i class="pt" :style="{ background: TYPE_LABELS[t].couleur }" />{{ TYPE_LABELS[t].plusieurs }} <small>{{ compteType(t) }}</small>
      </button>
    </div>
    <div class="chips">
      <button type="button" class="chip" :class="{ on: !statut }" @click="statut = null">Tous</button>
      <button v-for="s in ENTRY_STATUSES.filter(x => compteStatut(x) || statut === x)" :key="s" type="button" class="chip" :class="{ on: statut === s }" @click="statut = statut === s ? null : s">
        {{ libStatut(s) }} <small>{{ compteStatut(s) }}</small>
      </button>
    </div>

    <div class="row between barre-tri">
      <span class="small muted">{{ liste.length }} résultat{{ liste.length > 1 ? 's' : '' }}</span>
      <select v-model="tri" class="tri" aria-label="Trier">
        <option value="recent">Activité récente</option>
        <option value="ajout">Ajout récent</option>
        <option value="titre">Titre (A → Z)</option>
        <option value="note">Ma note</option>
      </select>
    </div>

    <transition-group v-if="liste.length" tag="ul" name="list" class="card lignes">
      <LigneTitre v-for="e in liste" :key="e.id" :entry="e" :plus="e.status === 'CURRENT' || e.status === 'REWATCH'" statut />
    </transition-group>
    <div v-else class="vide">
      <Icone nom="biblio" :taille="34" />
      <p>{{ biblio.entries.length ? 'Aucun titre ne correspond.' : 'Ta bibliothèque est vide.' }}</p>
      <router-link v-if="!biblio.entries.length" to="/recherche" class="btn primary small">Ajouter un titre</router-link>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Bibliothèque" } }
</route>

<style scoped>
.types { margin-top: 12px; }
.chip small { color: var(--dim); font-weight: 700; }
.chip.on small { color: inherit; opacity: .7; }
.barre-tri { margin: 8px 4px 8px; }
.tri { border: 0; background: none; color: var(--muted); font-weight: 700; font-size: 13.5px; text-align: right; }
.lignes { position: relative; list-style: none; margin: 0; padding: 4px; }
</style>
