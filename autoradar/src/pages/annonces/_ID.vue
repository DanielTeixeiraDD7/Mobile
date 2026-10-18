<script setup lang="ts">
import { useConfirm } from 'primevue/useconfirm';
import type { ChampsAnnonce } from '@/lib/types';
import { DRAPEAU, NOM_PAYS, STATUTS } from '@/lib/types';
import { SITES } from '@/lib/sites';
import { calculer } from '@/lib/import';
import { VERIFS_ANNONCE } from '@/data/guide';
import { euros, eurosPrecis, kms, dateCourte } from '@/lib/format';
import { useAnnoncesStore } from '@/stores/annonces';
import { useHypothesesStore } from '@/stores/hypotheses';
import { useReglagesStore } from '@/stores/reglages';
import AnnonceForm from './components/AnnonceForm.vue';

defineProps<{ ID?: string }>(); // passé par le routeur (props: true) ; on lit useRoute()
const route = useRoute();
const router = useRouter();
const confirm = useConfirm();
const annonces = useAnnoncesStore();
const hypotheses = useHypothesesStore();
const reglages = useReglagesStore();

const id = computed(() => String(route.params.ID));
const annonce = computed(() => annonces.parId(id.value));
const site = computed(() => SITES.find(s => s.id === annonce.value?.site) ?? null);
const cout = computed(() => (annonce.value ? calculer(annonce.value, hypotheses.valeurs) : null));

// Édition directe : chaque modification est enregistrée.
const champs = ref<ChampsAnnonce | null>(null);
watch(annonce, a => {
  if (!a) return;
  const { id: _i, ajouteLe: _a, majLe: _m, site: _s, ...reste } = a;
  if (JSON.stringify(reste) !== JSON.stringify(champs.value)) champs.value = { ...reste };
}, { immediate: true });
watch(champs, c => { if (c && annonce.value) annonces.modifier(annonce.value.id, { ...c }); }, { deep: true });

// Points à vérifier : communs + spécifiques au pays de l'annonce.
const verifs = computed(() => VERIFS_ANNONCE.filter(v => !v.pays || v.pays.includes(annonce.value!.pays)));
const cleVerif = (v: string) => `annonce:${id.value}:${v}`;
const nbVerifs = computed(() => verifs.value.filter(v => reglages.checklist[cleVerif(v.id)]).length);

function supprimer() {
  confirm.require({
    header: 'Supprimer cette annonce ?',
    message: 'Elle disparaîtra de ta liste (l’annonce reste en ligne sur le site).',
    icon: 'pi pi-trash',
    rejectProps: { label: 'Annuler', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Supprimer', severity: 'danger' },
    accept: () => { annonces.supprimer(id.value); router.replace('/annonces'); },
  });
}
</script>

<template>
  <div v-if="annonce && champs && cout" class="page detail">
    <nav class="crumbs"><router-link to="/annonces"><i class="pi pi-arrow-left" /> Annonces</router-link></nav>

    <header class="dhead card">
      <span class="flag">{{ DRAPEAU[annonce.pays] }}</span>
      <div class="grow">
        <h1>{{ annonce.titre }}</h1>
        <p class="muted m-0">{{ site?.nom ?? 'Autre site' }} · {{ NOM_PAYS[annonce.pays] }} · {{ annonce.annee ?? '—' }} · {{ kms(annonce.km) }} · ajoutée le {{ dateCourte(annonce.ajouteLe) }}</p>
      </div>
      <a :href="annonce.url" target="_blank" rel="noopener noreferrer" class="p-button p-component open"><i class="pi pi-external-link" /> <span>Ouvrir l'annonce</span></a>
    </header>

    <div class="statuts">
      <button v-for="s in STATUTS" :key="s.value" type="button" :class="[{ on: champs.statut === s.value }, s.classe]" @click="champs.statut = s.value">
        <i :class="s.icon" /> {{ s.label }}
      </button>
    </div>

    <div class="cols">
      <section class="card pad">
        <h2 class="h2"><i class="pi pi-calculator" /> Coût total au Portugal</h2>
        <div v-if="cout.total == null" class="muted">Indique le prix pour calculer.</div>
        <template v-else>
          <div class="big-total">{{ euros(cout.total) }}</div>
          <ul class="lignes">
            <li v-for="l in cout.lignes" :key="l.libelle">
              <span class="grow">{{ l.libelle }}<small v-if="l.note" class="dim block">{{ l.note }}</small></span>
              <b :class="{ est: l.estimation }">{{ eurosPrecis(l.montant) }}</b>
            </li>
          </ul>
          <div v-for="al in cout.alertes" :key="al" class="callout warn mt-2"><i class="pi pi-exclamation-triangle" /><p>{{ al }}</p></div>
          <p class="src mt-3 mb-0">Montants en italique : estimations modifiables dans <router-link to="/import">Import</router-link>.</p>
        </template>
      </section>

      <section class="card pad">
        <h2 class="h2"><i class="pi pi-list-check" /> À vérifier <span class="pill" :class="nbVerifs === verifs.length ? 'good' : ''">{{ nbVerifs }}/{{ verifs.length }}</span></h2>
        <label v-for="v in verifs" :key="v.id" class="check">
          <input type="checkbox" :checked="!!reglages.checklist[cleVerif(v.id)]" @change="reglages.basculer(cleVerif(v.id))">
          <span><b>{{ v.titre }}</b><small class="muted block">{{ v.detail }}</small></span>
        </label>
      </section>
    </div>

    <section class="card pad mt-3">
      <h2 class="h2"><i class="pi pi-pencil" /> Détails de l'annonce</h2>
      <AnnonceForm v-model="champs" />
      <div class="flex justify-content-end mt-3">
        <Button label="Supprimer" icon="pi pi-trash" severity="danger" text @click="supprimer" />
      </div>
    </section>
  </div>

  <div v-else class="page card pad text-center">
    <h2>Annonce introuvable</h2>
    <Button label="Retour aux annonces" @click="router.push('/annonces')" />
  </div>
</template>

<route>
{ "meta": { "titre": "Annonce" } }
</route>

<style scoped>
.detail { max-width: 980px; }
.crumbs { margin-bottom: 12px; font-weight: 700; font-size: 14px; }
.crumbs a { text-decoration: none; color: var(--ar-muted); }
.dhead { display: flex; align-items: center; gap: 16px; padding: 18px 20px; }
.dhead h1 { margin: 0 0 2px; font-size: 24px; letter-spacing: -.02em; }
.flag { font-size: 34px; }
.open { text-decoration: none; gap: 8px; color: #fff !important; }
.statuts { display: flex; gap: 6px; margin: 14px 0; overflow-x: auto; scrollbar-width: none; }
.statuts button { display: flex; align-items: center; gap: 6px; border: 1px solid var(--ar-border); background: var(--ar-surface); color: var(--ar-muted); padding: 8px 12px; border-radius: 12px; font: 700 13px Inter, sans-serif; cursor: pointer; white-space: nowrap; }
.statuts button.on { background: var(--ar-blue); border-color: var(--ar-blue); color: #fff; }
.statuts button.on.good { background: var(--ar-good); border-color: var(--ar-good); }
.statuts button.on.warn { background: #f59e0b; border-color: #f59e0b; }
.statuts button.on.bad { background: var(--ar-bad); border-color: var(--ar-bad); }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.h2 { font-size: 16px; margin: 0 0 12px; display: flex; align-items: center; gap: 8px; }
.h2 i { color: var(--ar-blue); }
.big-total { font-size: 32px; font-weight: 900; letter-spacing: -.03em; margin-bottom: 8px; }
.lignes { list-style: none; margin: 0; padding: 0; }
.lignes li { display: flex; gap: 12px; padding: 9px 0; border-top: 1px solid var(--ar-border); font-size: 14px; }
.lignes b.est { font-style: italic; color: var(--ar-muted); }
.block { display: block; }
.check { display: flex; gap: 12px; padding: 10px 0; border-top: 1px solid var(--ar-border); cursor: pointer; font-size: 14px; }
.check input { width: 20px; height: 20px; margin-top: 2px; accent-color: var(--ar-blue); flex: none; }
@media (max-width: 860px) {
  .cols { grid-template-columns: 1fr; }
  .dhead { flex-wrap: wrap; }
  .open { width: 100%; justify-content: center; }
}
</style>
