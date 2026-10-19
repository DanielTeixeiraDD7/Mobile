<script setup lang="ts">
import { useToast } from 'primevue/usetoast';
import type { Annonce, ChampsAnnonce, Statut } from '@/lib/types';
import { DRAPEAU, STATUTS, annonceVide, statut } from '@/lib/types';
import { SITES } from '@/lib/sites';
import { calculer } from '@/lib/import';
import { useHypothesesStore } from '@/stores/hypotheses';
import { euros, kms } from '@/lib/format';
import { useAnnoncesStore } from '@/stores/annonces';
import { libelleCriteres, useRecherchesStore } from '@/stores/recherches';
import AnnonceForm from './components/AnnonceForm.vue';

const annonces = useAnnoncesStore();
const router = useRouter();
const toast = useToast();
const hypotheses = useHypothesesStore();

// Filtres et tri de la liste.
const filtre = ref<Statut | 'actives'>('actives');
const tri = ref<'total' | 'prix' | 'km' | 'recent'>('total');
const filtres = computed(() => [
  { label: `Actives (${annonces.actives.length})`, value: 'actives' as const },
  ...STATUTS.map(s => ({ label: s.label, value: s.value })),
]);
const tris = [
  { label: 'Coût total au Portugal', value: 'total' },
  { label: 'Prix affiché', value: 'prix' },
  { label: 'Kilométrage', value: 'km' },
  { label: 'Ajout récent', value: 'recent' },
];

const total = (a: Annonce) => calculer(a, hypotheses.valeurs).total;
const liste = computed(() => {
  const base = filtre.value === 'actives' ? annonces.actives : annonces.liste.filter(a => a.statut === filtre.value);
  const cle: Record<typeof tri.value, (a: Annonce) => number> = {
    total: a => total(a) ?? Infinity,
    prix: a => a.prix ?? Infinity,
    km: a => a.km ?? Infinity,
    recent: a => -a.ajouteLe,
  };
  return [...base].sort((x, y) => cle[tri.value](x) - cle[tri.value](y));
});
// Meilleur coût total parmi les annonces actives : repère « meilleure affaire ».
const meilleur = computed(() => {
  const t = annonces.actives.map(total).filter((n): n is number => n != null);
  return t.length > 1 ? Math.min(...t) : null;
});
const nomSite = (id: string | null) => SITES.find(s => s.id === id)?.nom ?? 'Autre site';

const ajout = ref(false);
const nouvelle = ref<ChampsAnnonce>(annonceVide());
function ouvrirAjout() { nouvelle.value = annonceVide(); ajout.value = true; }
function enregistrer() {
  const n = nouvelle.value;
  if (!/^https?:\/\//.test(n.url)) { toast.add({ severity: 'warn', summary: 'Colle le lien de l’annonce', detail: 'Il commence par https://', life: 3000 }); return; }
  if (annonces.existe(n.url)) { toast.add({ severity: 'info', summary: 'Déjà dans ta liste', life: 2500 }); return; }
  // Sans titre : celui de la recherche en cours (« Peugeot 208 »…).
  const recherche = libelleCriteres(useRecherchesStore().active.criteres);
  const a = annonces.ajouter({ ...n, titre: n.titre.trim() || (recherche === 'Toutes les voitures' ? 'Annonce' : recherche) });
  ajout.value = false;
  toast.add({ severity: 'success', summary: 'Annonce ajoutée', life: 2000 });
  router.push('/annonces/' + a.id);
}

// Lien partagé vers l'app (bouton « Partager » d'un site → AutoRadar) : ?url=…
const route = useRoute();
onMounted(() => {
  const u = route.query.url;
  if (typeof u === 'string' && u) { ouvrirAjout(); nouvelle.value.url = u; }
});
</script>

<template>
  <div class="page">
    <div class="head">
      <div>
        <h1 class="h-title">Annonces suivies</h1>
        <p class="h-sub">Colle le lien d'une annonce qui te plaît, note ce qu'elle annonce : AutoRadar compare le <b>coût total</b>, import compris.</p>
      </div>
      <Button label="Ajouter" icon="pi pi-plus" @click="ouvrirAjout" />
    </div>

    <div v-if="!annonces.liste.length" class="empty card pad">
      <span class="big"><i class="pi pi-car" /></span>
      <h2>Aucune annonce pour l'instant</h2>
      <p class="muted">Lance une recherche, ouvre une annonce sur le site, copie son lien et ajoute-la ici.</p>
      <div class="flex gap-2 justify-content-center flex-wrap">
        <Button label="Rechercher" icon="pi pi-search" severity="secondary" outlined @click="router.push('/')" />
        <Button label="Ajouter une annonce" icon="pi pi-plus" @click="ouvrirAjout" />
      </div>
    </div>

    <template v-else>
      <div class="toolbar">
        <div class="filters">
          <button v-for="f in filtres" :key="f.value" type="button" :class="{ on: filtre === f.value }" @click="filtre = f.value">{{ f.label }}</button>
        </div>
        <Select v-model="tri" :options="tris" option-label="label" option-value="value" class="tri" aria-label="Trier" />
      </div>

      <transition-group name="fade" tag="div" class="list">
        <router-link v-for="a in liste" :key="a.id" :to="'/annonces/' + a.id" class="row card" :class="{ off: a.statut === 'ecartee' }">
          <span class="flag">{{ DRAPEAU[a.pays] }}</span>
          <span class="grow">
            <span class="flex align-items-center gap-2 flex-wrap">
              <b class="titre">{{ a.titre }}</b>
              <span class="pill" :class="statut(a.statut).classe"><i :class="statut(a.statut).icon" /> {{ statut(a.statut).label }}</span>
              <span v-if="meilleur != null && total(a) === meilleur && a.statut !== 'ecartee'" class="pill good"><i class="pi pi-trophy" /> Meilleur coût</span>
            </span>
            <small class="muted">{{ nomSite(a.site) }} · {{ a.annee ?? '—' }} · {{ kms(a.km) }}<template v-if="a.soh"> · SoH {{ a.soh }} %</template><template v-if="a.vendeur !== 'inconnu'"> · {{ a.vendeur === 'pro' ? 'Pro' : 'Particulier' }}</template></small>
          </span>
          <span class="prix">
            <b>{{ euros(total(a)) }}</b>
            <small class="dim">{{ a.pays === 'PT' ? 'prix + frais' : 'import compris' }}</small>
          </span>
          <i class="pi pi-chevron-right dim" />
        </router-link>
      </transition-group>
      <p v-if="!liste.length" class="muted text-center mt-4">Aucune annonce dans ce filtre.</p>
    </template>

    <Drawer v-model:visible="ajout" header="Nouvelle annonce" position="right" class="drawer-form">
      <AnnonceForm v-model="nouvelle" />
      <template #footer>
        <div class="flex justify-content-end"><Button label="Ajouter" icon="pi pi-check" @click="enregistrer" /></div>
      </template>
    </Drawer>
  </div>
</template>

<route>
{ "meta": { "titre": "Annonces" } }
</route>

<style scoped>
.head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.filters { display: flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--ar-surface-2); overflow-x: auto; max-width: 100%; scrollbar-width: none; }
.filters button { border: 0; background: none; padding: 7px 12px; border-radius: 9px; font: 700 13px Inter, sans-serif; color: var(--ar-muted); cursor: pointer; white-space: nowrap; }
.filters button.on { background: var(--ar-surface); color: var(--ar-text); box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.tri { min-width: 220px; }
.list { display: grid; gap: 10px; }
.row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-decoration: none; color: var(--ar-text); transition: transform .15s, border-color .15s; }
.row:hover { transform: translateY(-1px); border-color: color-mix(in srgb, var(--ar-blue) 35%, var(--ar-border)); }
.row.off { opacity: .55; }
.flag { font-size: 26px; }
.titre { font-size: 15.5px; }
.row small { display: block; margin-top: 2px; }
.prix { text-align: right; display: grid; }
.prix b { font-size: 18px; letter-spacing: -.02em; }
.empty { text-align: center; display: grid; justify-items: center; gap: 4px; }
.empty h2 { margin: 10px 0 0; }
.big { width: 70px; height: 70px; border-radius: 22px; display: grid; place-items: center; font-size: 30px; background: color-mix(in srgb, var(--ar-blue) 13%, transparent); color: var(--ar-blue); }
@media (max-width: 640px) {
  .head { flex-direction: column; }
  .head :deep(.p-button) { width: 100%; }
  .tri { width: 100%; }
  .row { flex-wrap: wrap; gap: 10px; }
  .prix { text-align: left; }
}
</style>
