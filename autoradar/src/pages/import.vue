<script setup lang="ts">
import type { Pays } from '@/lib/types';
import { DRAPEAU, NOM_PAYS } from '@/lib/types';
import { calculer, OFFICIEL, SOURCES } from '@/lib/import';
import { ETAPES_IMPORT, RAPATRIER } from '@/data/guide';
import { euros, eurosPrecis } from '@/lib/format';
import { useHypothesesStore } from '@/stores/hypotheses';
import { useReglagesStore } from '@/stores/reglages';

const hyp = useHypothesesStore();
const reglages = useReglagesStore();

// Comparaison : la même voiture à l'étranger et au Portugal.
const pays = ref<Exclude<Pays, 'PT'>>('DE');
const prixEtranger = ref<number | null>(18000);
const prixPortugal = ref<number | null>(21000);
const annee = ref<number | null>(2022);
const km = ref<number | null>(40000);

const etranger = computed(() => calculer({ pays: pays.value, prix: prixEtranger.value, annee: annee.value, km: km.value }, hyp.valeurs));
const portugal = computed(() => calculer({ pays: 'PT', prix: prixPortugal.value, annee: annee.value, km: km.value }, hyp.valeurs));
const ecart = computed(() => (etranger.value.total != null && portugal.value.total != null ? portugal.value.total - etranger.value.total : null));
// Prix étranger maximum pour que l'import reste rentable.
const seuil = computed(() => {
  if (portugal.value.total == null || prixEtranger.value == null || etranger.value.total == null) return null;
  return portugal.value.total - (etranger.value.total - prixEtranger.value);
});

const optionsPays = (['DE', 'FR', 'BE'] as const).map(p => ({ label: `${DRAPEAU[p]} ${NOM_PAYS[p]}`, value: p }));
const ouiNon = [{ label: 'Oui', value: true }, { label: 'Non', value: false }];
const rapatrier = computed(() => RAPATRIER.find(r => r.pays === pays.value)!);
const fait = computed(() => ETAPES_IMPORT.filter(e => reglages.checklist['etape:' + e.id]).length);
</script>

<template>
  <div class="page imp">
    <h1 class="h-title">Importer ou acheter au Portugal ?</h1>
    <p class="h-sub">Pour une voiture <b>100 % électrique</b> : pas d'ISV, pas d'IUC, pas d'IVA portugaise sur une occasion. Il reste le transport et environ <b>200 €</b> de frais officiels.</p>

    <div class="cols">
      <section class="card pad">
        <h2 class="h2"><i class="pi pi-sliders-h" /> La voiture</h2>
        <div class="grid-form">
          <div class="field full">
            <label>Pays d'achat</label>
            <SelectButton v-model="pays" :options="optionsPays" option-label="label" option-value="value" :allow-empty="false" class="sb" />
          </div>
          <div class="field">
            <label for="i-pe">Prix à l'étranger</label>
            <InputNumber input-id="i-pe" v-model="prixEtranger" mode="currency" currency="EUR" locale="fr-FR" :max-fraction-digits="0" :min="0" :step="500" />
          </div>
          <div class="field">
            <label for="i-pp">Prix équivalent au Portugal</label>
            <InputNumber input-id="i-pp" v-model="prixPortugal" mode="currency" currency="EUR" locale="fr-FR" :max-fraction-digits="0" :min="0" :step="500" />
          </div>
          <div class="field">
            <label for="i-an">Année</label>
            <InputNumber input-id="i-an" v-model="annee" :use-grouping="false" :min="2019" :max="2030" />
          </div>
          <div class="field">
            <label for="i-km">Kilométrage</label>
            <InputNumber input-id="i-km" v-model="km" suffix=" km" locale="fr-FR" :min="0" :step="5000" />
          </div>
        </div>

        <h3 class="h3">Hypothèses</h3>
        <div class="grid-form">
          <div class="field">
            <label for="i-tr">Transport {{ DRAPEAU[pays] }} → 🇵🇹</label>
            <InputNumber input-id="i-tr" v-model="hyp.valeurs.transport[pays]" mode="currency" currency="EUR" locale="fr-FR" :max-fraction-digits="0" :min="0" :step="50" />
          </div>
          <div class="field">
            <label for="i-pl">Plaques</label>
            <InputNumber input-id="i-pl" v-model="hyp.valeurs.plaques" mode="currency" currency="EUR" locale="fr-FR" :max-fraction-digits="0" :min="0" />
          </div>
          <div class="field">
            <label>CoC fourni</label>
            <SelectButton v-model="hyp.valeurs.coc" :options="ouiNon" option-label="label" option-value="value" :allow-empty="false" class="sb" />
          </div>
          <div class="field">
            <label>Démarches IRN en ligne</label>
            <SelectButton v-model="hyp.valeurs.enLigne" :options="ouiNon" option-label="label" option-value="value" :allow-empty="false" class="sb" />
          </div>
        </div>
        <p class="src mb-0 mt-3">Transport : estimation (camion ouvert, TVA comprise) d'après <a :href="SOURCES.transport.url" target="_blank" rel="noopener">{{ SOURCES.transport.nom }}</a>. Ramener la voiture soi-même peut coûter moins cher (voir plus bas).</p>
      </section>

      <section class="card pad result">
        <div class="verdict" :class="ecart == null ? '' : ecart > 0 ? 'good' : 'bad'">
          <template v-if="ecart != null">
            <small>{{ ecart > 0 ? 'Importer te fait économiser' : 'Acheter au Portugal est moins cher de' }}</small>
            <b>{{ euros(Math.abs(ecart)) }}</b>
            <span v-if="seuil != null">L'import reste rentable tant que le prix {{ DRAPEAU[pays] }} est sous <b>{{ euros(seuil) }}</b>.</span>
          </template>
          <template v-else><small>Indique les deux prix</small></template>
        </div>
        <div class="duo">
          <div>
            <h3 class="h3">{{ DRAPEAU[pays] }} Import</h3>
            <ul class="lignes">
              <li v-for="l in etranger.lignes" :key="l.libelle">
                <span class="grow">{{ l.libelle }}<a v-if="l.source" :href="l.source.url" target="_blank" rel="noopener" class="srcicon" :aria-label="'Source : ' + l.source.nom" v-tooltip.top="l.source.nom"><i class="pi pi-info-circle" /></a></span>
                <b :class="{ est: l.estimation }">{{ eurosPrecis(l.montant) }}</b>
              </li>
              <li class="tot"><span class="grow">Total</span><b>{{ eurosPrecis(etranger.total) }}</b></li>
            </ul>
          </div>
          <div>
            <h3 class="h3">🇵🇹 Au Portugal</h3>
            <ul class="lignes">
              <li v-for="l in portugal.lignes" :key="l.libelle">
                <span class="grow">{{ l.libelle }}<a v-if="l.source" :href="l.source.url" target="_blank" rel="noopener" class="srcicon" :aria-label="'Source : ' + l.source.nom" v-tooltip.top="l.source.nom"><i class="pi pi-info-circle" /></a></span>
                <b>{{ eurosPrecis(l.montant) }}</b>
              </li>
              <li class="tot"><span class="grow">Total</span><b>{{ eurosPrecis(portugal.total) }}</b></li>
            </ul>
          </div>
        </div>
        <div v-for="a in etranger.alertes" :key="a" class="callout warn mt-2"><i class="pi pi-exclamation-triangle" /><p>{{ a }}</p></div>
      </section>
    </div>

    <h2 class="section-title"><i class="pi pi-list-check" style="color: var(--ar-blue)" /> Les démarches au Portugal <span class="pill" :class="fait === ETAPES_IMPORT.length ? 'good' : ''">{{ fait }}/{{ ETAPES_IMPORT.length }}</span></h2>
    <ol class="etapes card">
      <li v-for="(e, i) in ETAPES_IMPORT" :key="e.id" :class="{ ok: reglages.checklist['etape:' + e.id] }">
        <button type="button" class="num" :aria-pressed="!!reglages.checklist['etape:' + e.id]" :aria-label="'Étape ' + (i + 1) + ' faite'" @click="reglages.basculer('etape:' + e.id)">
          <i v-if="reglages.checklist['etape:' + e.id]" class="pi pi-check" /><span v-else>{{ i + 1 }}</span>
        </button>
        <div class="grow">
          <b>{{ e.titre }}</b>
          <p class="muted small m-0">{{ e.detail }} <a v-if="e.source" :href="e.source.url" target="_blank" rel="noopener" class="src">Source</a></p>
        </div>
      </li>
    </ol>

    <h2 class="section-title"><i class="pi pi-truck" style="color: var(--ar-blue)" /> Ramener la voiture par la route · {{ DRAPEAU[pays] }} {{ NOM_PAYS[pays] }}</h2>
    <div class="card pad">
      <b>{{ rapatrier.titre }}</b>
      <ul class="pts"><li v-for="p in rapatrier.points" :key="p">{{ p }}</li></ul>
      <a :href="rapatrier.source.url" target="_blank" rel="noopener" class="src">{{ rapatrier.source.nom }}</a>
    </div>

    <p class="src mt-4">Montants officiels relevés le 18/10/2026 : inspection {{ eurosPrecis(OFFICIEL.inspectionB) }}, matrícula IMT {{ OFFICIEL.imtMatriculaAvecCoc }} € (avec CoC), registo IRN {{ OFFICIEL.irnRegistoInicial }} € (−15 % en ligne). Vérifie avant d'acheter : les tarifs changent chaque année.</p>
  </div>
</template>

<route>
{ "meta": { "titre": "Import" } }
</route>

<style scoped>
.cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 14px; align-items: start; }
.h2 { font-size: 16px; margin: 0 0 14px; display: flex; align-items: center; gap: 8px; }
.h2 i { color: var(--ar-blue); }
.h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--ar-muted); margin: 20px 0 10px; }
.grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.full { grid-column: 1 / -1; }
.sb { display: flex; } .sb :deep(.p-togglebutton) { flex: 1; }
.verdict { border-radius: 16px; padding: 16px 18px; display: grid; gap: 2px; background: var(--ar-surface-2); }
.verdict small { font-weight: 700; color: var(--ar-muted); }
.verdict > b { font-size: 34px; letter-spacing: -.03em; line-height: 1.1; }
.verdict span { font-size: 13.5px; color: var(--ar-muted); }
.verdict.good { background: linear-gradient(120deg, color-mix(in srgb, var(--ar-good) 16%, var(--ar-surface)), var(--ar-surface)); }
.verdict.good > b { color: var(--ar-good); }
.verdict.bad { background: linear-gradient(120deg, color-mix(in srgb, var(--ar-warn) 16%, var(--ar-surface)), var(--ar-surface)); }
.verdict.bad > b { color: #b45309; }
.duo { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.lignes { list-style: none; margin: 0; padding: 0; font-size: 13.5px; }
.lignes li { display: flex; gap: 8px; padding: 7px 0; border-top: 1px solid var(--ar-border); }
.lignes li.tot { font-size: 15px; border-top: 2px solid var(--ar-text); }
.lignes b.est { font-style: italic; color: var(--ar-muted); }
.srcicon { margin-left: 5px; color: var(--ar-dim); font-size: 11px; }
.etapes { list-style: none; margin: 0; padding: 6px 18px; }
.etapes li { display: flex; gap: 14px; padding: 12px 0; }
.etapes li + li { border-top: 1px solid var(--ar-border); }
.num { width: 32px; height: 32px; flex: none; border-radius: 50%; border: 2px solid var(--ar-border); background: var(--ar-surface); color: var(--ar-muted); font-weight: 800; cursor: pointer; display: grid; place-items: center; }
.etapes li.ok .num { background: var(--ar-good); border-color: var(--ar-good); color: #fff; }
.etapes li.ok b { text-decoration: line-through; opacity: .6; }
.pts { margin: 8px 0 10px; padding-left: 20px; font-size: 14px; }
.pts li { margin: 5px 0; }
@media (max-width: 991px) {
  .cols, .duo { grid-template-columns: 1fr; }
}
@media (max-width: 520px) { .grid-form { grid-template-columns: 1fr; } }
</style>
