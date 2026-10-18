<script setup lang="ts">
import { DRAPEAU } from '@/lib/types';
import { VERSIONS, POINTS_CLES, RAPPELS, CHECKLIST_E2008, REPERES_PRIX, SOURCES_E2008 } from '@/data/e2008';
import { ARNAQUES, HISTORIQUE } from '@/data/guide';
import { useReglagesStore } from '@/stores/reglages';

const reglages = useReglagesStore();
const cle = (id: string) => 'guide:' + id;
const faits = computed(() => CHECKLIST_E2008.filter(c => reglages.checklist[cle(c.id)]).length);

// Sommaire déclaratif : chaque section a son ancre.
const sections = [
  { id: 'versions', label: 'Versions' },
  { id: 'essentiel', label: 'L’essentiel' },
  { id: 'checklist', label: 'À vérifier' },
  { id: 'rappels', label: 'Rappels' },
  { id: 'prix', label: 'Prix' },
  { id: 'securite', label: 'Arnaques' },
  { id: 'historique', label: 'Historique' },
];
const aller = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
</script>

<template>
  <div class="page guide">
    <h1 class="h-title">Guide e-2008 d'occasion</h1>
    <p class="h-sub">Ce qu'il faut savoir avant d'acheter, sources à l'appui (relevées le {{ REPERES_PRIX.date }}).</p>

    <nav class="toc">
      <button v-for="s in sections" :key="s.id" type="button" @click="aller(s.id)">{{ s.label }}</button>
    </nav>

    <h2 id="versions" class="section-title">Les versions</h2>
    <div class="versions">
      <article v-for="v in VERSIONS" :key="v.nom" class="card ver">
        <small class="dim">{{ v.periode }}</small>
        <b>{{ v.nom }}</b>
        <div class="specs">
          <span><i class="pi pi-bolt" /> {{ v.batterie }}</span>
          <span><i class="pi pi-gauge" /> {{ v.puissance }}</span>
          <span><i class="pi pi-map-marker" /> {{ v.wltp }} WLTP</span>
        </div>
        <p class="muted small m-0">{{ v.reperer }}</p>
        <a :href="v.source.url" target="_blank" rel="noopener" class="src">{{ v.source.nom }}</a>
      </article>
    </div>

    <h2 id="essentiel" class="section-title">L'essentiel</h2>
    <div class="points">
      <div v-for="p in POINTS_CLES" :key="p.titre" class="card pt">
        <span class="ic"><i :class="p.icon" /></span>
        <div>
          <b>{{ p.titre }}</b>
          <p class="muted small m-0">{{ p.texte }}</p>
          <a v-if="p.source" :href="p.source.url" target="_blank" rel="noopener" class="src">Source</a>
        </div>
      </div>
    </div>

    <h2 id="checklist" class="section-title">À vérifier sur la voiture <span class="pill" :class="faits === CHECKLIST_E2008.length ? 'good' : ''">{{ faits }}/{{ CHECKLIST_E2008.length }}</span></h2>
    <div class="card list">
      <label v-for="c in CHECKLIST_E2008" :key="c.id" class="check">
        <input type="checkbox" :checked="!!reglages.checklist[cle(c.id)]" @change="reglages.basculer(cle(c.id))">
        <span><b>{{ c.titre }}</b><small class="muted block">{{ c.detail }} <a v-if="c.source" :href="c.source.url" target="_blank" rel="noopener" class="src">Source</a></small></span>
      </label>
    </div>
    <p class="src">Chaque annonce suivie a aussi sa propre liste, dans sa fiche.</p>

    <h2 id="rappels" class="section-title">Rappels de la version électrique</h2>
    <div class="card list">
      <div v-for="r in RAPPELS" :key="r.ref" class="rap">
        <span class="pill warn">{{ r.production }}</span>
        <span class="grow"><b>{{ r.probleme }}</b><small class="dim block">{{ r.ref }}</small></span>
        <a :href="r.url" target="_blank" rel="noopener" aria-label="Voir la fiche du rappel"><i class="pi pi-external-link" /></a>
      </div>
    </div>
    <div class="callout info mt-3"><i class="pi pi-info-circle" /><p>Une voiture construite dans ces périodes n'est pas forcément concernée : demande au concessionnaire d'imprimer les campagnes ouvertes pour le VIN. Recherches libres : <a :href="SOURCES_E2008.rappels.url" target="_blank" rel="noopener">RappelConso</a>, <a :href="SOURCES_E2008.safetygate.url" target="_blank" rel="noopener">Safety Gate</a>.</p></div>

    <h2 id="prix" class="section-title">Repères de prix demandés</h2>
    <div class="card table-wrap">
      <table>
        <thead><tr><th>Pays</th><th>Avant restylage (2021–2023)</th><th>Récentes 54 kWh</th></tr></thead>
        <tbody>
          <tr v-for="l in REPERES_PRIX.lignes" :key="l.pays"><td>{{ DRAPEAU[l.pays] }}</td><td>{{ l.avant }}<small class="dim block">{{ l.echantillon }}</small></td><td>{{ l.apres }}</td></tr>
        </tbody>
      </table>
    </div>
    <p class="src">Prix affichés dans les annonces le {{ REPERES_PRIX.date }}, pas des prix de vente. À âge égal, le Portugal est au niveau de l'Allemagne ou un peu plus cher, avec plus de kilomètres.</p>

    <h2 id="securite" class="section-title"><i class="pi pi-shield" style="color: var(--ar-bad)" /> Les arnaques courantes</h2>
    <div class="points">
      <div v-for="a in ARNAQUES" :key="a.titre" class="card pt bad">
        <span class="ic"><i class="pi pi-exclamation-triangle" /></span>
        <div><b>{{ a.titre }}</b><p class="muted small m-0">{{ a.texte }}</p></div>
      </div>
    </div>

    <h2 id="historique" class="section-title">L'historique du véhicule, par pays</h2>
    <div class="points">
      <div v-for="h in HISTORIQUE" :key="h.pays" class="card pt">
        <span class="flag">{{ DRAPEAU[h.pays] }}</span>
        <div>
          <b>{{ h.nom }}</b>
          <p class="muted small m-0">{{ h.texte }}</p>
          <a :href="h.source.url" target="_blank" rel="noopener" class="src">{{ h.source.nom }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Guide" } }
</route>

<style scoped>
.guide { max-width: 980px; }
.toc { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; position: sticky; top: 0; z-index: 5; padding: 8px 0; background: var(--ar-bg); }
.toc button { border: 1px solid var(--ar-border); background: var(--ar-surface); color: var(--ar-muted); border-radius: 999px; padding: 6px 13px; font: 700 13px Inter, sans-serif; cursor: pointer; white-space: nowrap; }
.toc button:hover { color: var(--ar-text); border-color: var(--ar-blue); }
.section-title { scroll-margin-top: 70px; }
@media (max-width: 991px) { .section-title { scroll-margin-top: calc(var(--safe-t) + 120px); } }
.versions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.ver { padding: 16px; display: grid; gap: 6px; align-content: start; }
.ver b { font-size: 16px; }
.specs { display: grid; gap: 3px; font-size: 13.5px; font-weight: 600; }
.specs i { color: var(--ar-blue); font-size: 12px; width: 16px; }
.points { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.pt { display: flex; gap: 14px; padding: 16px; }
.ic { width: 40px; height: 40px; flex: none; border-radius: 12px; display: grid; place-items: center; background: color-mix(in srgb, var(--ar-blue) 13%, transparent); color: var(--ar-blue); }
.pt.bad .ic { background: color-mix(in srgb, var(--ar-bad) 12%, transparent); color: var(--ar-bad); }
.flag { font-size: 28px; }
.list { padding: 4px 18px; }
.check { display: flex; gap: 12px; padding: 12px 0; cursor: pointer; font-size: 14px; }
.check + .check, .rap + .rap { border-top: 1px solid var(--ar-border); }
.check input { width: 20px; height: 20px; margin-top: 2px; accent-color: var(--ar-blue); flex: none; }
.block { display: block; }
.rap { display: flex; align-items: center; gap: 12px; padding: 12px 0; font-size: 14px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--ar-border); vertical-align: top; }
th { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--ar-muted); }
tr:last-child td { border-bottom: 0; }
@media (max-width: 991px) {
  .toc { top: calc(var(--safe-t) + 58px); }
  .versions { grid-template-columns: repeat(2, 1fr); }
  .points { grid-template-columns: 1fr; }
}
@media (max-width: 520px) { .versions { grid-template-columns: 1fr; } .rap { flex-wrap: wrap; } }
</style>
