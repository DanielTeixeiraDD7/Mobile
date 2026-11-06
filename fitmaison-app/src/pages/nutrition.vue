<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { REPAS_TYPES } from '@/core/programmes';
import { EXCLUSIONS, FRUITS, MOMENTS, conseilsPour, journeeType, repasPour, type Exclusion, type Fruit, type Moment, type RepasCalcule } from '@/core/aliments';
import { kg } from '@/core/dates';
import { toast } from '@/composables/useToast';
import Icone from '@/components/Icone.vue';
import Anneau from '@/components/graph/Anneau.vue';

const fit = useFit();
const n = computed(() => fit.nutrition!);
const jour = computed(() => fit.jourLu());
const mange = computed(() => jour.value.food.reduce((t, f) => t + f.kcal, 0));
const seances = computed(() => fit.etat.sessions.filter(s => s.date === fit.date).reduce((t, s) => t + s.kcal, 0));
const reste = computed(() => n.value.cible + seances.value - mange.value);
const ratio = computed(() => Math.min(1, mange.value / (n.value.cible + seances.value)));
const libelle = ref('');
const kcal = ref<number | ''>('');
function ajouter() {
  if (!kcal.value || kcal.value <= 0) return;
  fit.ajouterRepas(libelle.value, Number(kcal.value));
  toast(`+${Math.round(Number(kcal.value))} kcal`);
  libelle.value = ''; kcal.value = '';
}
// ----- Goûts et repas -----
const g = computed(() => fit.gouts);
const configure = computed(() => !!fit.etat.gouts);
const sansLegumes = computed(() => g.value.exclus.includes('legumes'));
function basculerExclu(x: Exclusion) {
  const ex = new Set(g.value.exclus);
  if (ex.has(x)) ex.delete(x); else ex.add(x);
  fit.majGouts({ ...g.value, exclus: [...ex] });
}
function basculerFruit(x: Fruit) {
  const fr = new Set(g.value.fruits);
  if (fr.has(x)) fr.delete(x); else fr.add(x);
  fit.majGouts({ ...g.value, fruits: [...fr] });
}
const moment = ref<Moment>('dejeuner');
const options = computed(() => repasPour(moment.value, g.value, n.value.cible));
const ouvert = ref<string | null>(null);
const numJour = Math.floor(Date.now() / 86_400_000);
const decalage = ref(0);
const journee = computed(() => journeeType(g.value, n.value.cible, numJour + decalage.value));
const conseils = computed(() => conseilsPour(g.value));
function allerGouts() { document.getElementById('t-gouts')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function manger(r: RepasCalcule) { fit.ajouterRepas(r.repas.nom, r.kcal); toast(`+${r.kcal} kcal · ${r.repas.nom}`); }

function type(i: number) { const f = REPAS_TYPES[i]!; fit.ajouterRepas(f.label, f.kcal); toast(`+${f.kcal} kcal · ${f.label}`); }
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div class="grow">
        <p class="kicker">Carburant</p>
        <h1 class="page-title">Nutrition</h1>
      </div>
    </header>

    <div class="cols-desk">
      <div>
        <section class="card bilan">
          <Anneau :ratio="ratio" :taille="148" :epaisseur="14" :couleur="reste >= 0 ? 'var(--flamme-vif)' : 'var(--bad)'" :couleur2="reste >= 0 ? '#ffc04a' : undefined">
            <b class="num reste">{{ Math.abs(reste).toLocaleString('fr-FR') }}</b><small>{{ reste >= 0 ? 'kcal restantes' : 'kcal en trop' }}</small>
          </Anneau>
          <ul class="kv grow">
            <li><span><i class="pt o" />Repère</span><b class="num">{{ n.cible.toLocaleString('fr-FR') }}</b></li>
            <li><span><i class="pt m" />Mangé</span><b class="num">{{ mange.toLocaleString('fr-FR') }}</b></li>
            <li><span><i class="pt s" />Séances</span><b class="num good">+{{ seances }}</b></li>
          </ul>
        </section>

        <section class="card pad section">
          <h2 class="card-title">Ajouter un repas</h2>
          <form class="row ajout" @submit.prevent="ajouter">
            <input v-model="libelle" class="input" placeholder="Ex : poulet riz" maxlength="40" aria-label="Repas">
            <input v-model.number="kcal" class="input kcal num" type="number" inputmode="numeric" min="1" max="5000" placeholder="kcal" aria-label="Calories">
            <button class="btn primary" type="submit" aria-label="Ajouter le repas"><Icone nom="plus" /></button>
          </form>
          <p class="label rapide">Ajout rapide</p>
          <div class="chips wrap types">
            <button v-for="(f, i) in REPAS_TYPES" :key="f.label" type="button" class="chip" @click="type(i)">{{ f.label }} <small class="num">{{ f.kcal }}</small></button>
          </div>
          <ul v-if="jour.food.length" class="rows repas">
            <li v-for="(f, i) in jour.food" :key="i">
              <span class="ico" aria-hidden="true">🍽️</span>
              <span class="grow"><b>{{ f.label }}</b></span>
              <span class="kc num">{{ f.kcal }} <small>kcal</small></span>
              <button type="button" class="icon-btn petit" :aria-label="`Supprimer ${f.label}`" @click="fit.retirerRepas(i)"><Icone nom="fermer" :taille="14" /></button>
            </li>
          </ul>
          <p v-else class="tiny muted vide-r">Rien de noté aujourd’hui. Une estimation suffit, pas besoin d’être précis au gramme.</p>
        </section>

        <section class="card pad section" aria-labelledby="t-repas">
          <h2 id="t-repas" class="card-title">Mes repas</h2>
          <p class="small muted intro-r">Selon tes goûts, avec les portions calculées pour ton objectif de <b class="num">{{ n.cible.toLocaleString('fr-FR') }} kcal</b>. Touche un repas pour voir les quantités. <a href="#t-gouts" class="lien-g" @click.prevent="allerGouts">{{ configure ? 'Modifier mes goûts' : 'Règle d’abord tes goûts' }} →</a></p>
          <div class="seg moments" role="tablist" aria-label="Moment du repas">
            <button v-for="m in MOMENTS" :key="m.id" type="button" role="tab" :aria-selected="moment === m.id" :class="{ on: moment === m.id }" @click="moment = m.id; ouvert = null">{{ m.icone }} {{ m.nom.replace('Petit-déjeuner', 'Matin') }}</button>
          </div>
          <ul v-if="options.length" class="options">
            <li v-for="o in options" :key="o.repas.id" class="opt-r" :class="{ open: ouvert === o.repas.id }">
              <button type="button" class="opt-h" :aria-expanded="ouvert === o.repas.id" @click="ouvert = ouvert === o.repas.id ? null : o.repas.id">
                <span class="opt-ic" aria-hidden="true">{{ o.repas.icone }}</span>
                <span class="grow"><b>{{ o.repas.nom }}</b><small class="num">{{ o.kcal }} kcal · {{ o.prot }} g de protéines</small></span>
                <Icone nom="bas" :class="{ tourne: ouvert === o.repas.id }" :taille="18" class="dim" />
              </button>
              <div v-if="ouvert === o.repas.id" class="opt-d">
                <ul class="qte">
                  <li v-for="l in o.lignes" :key="l.a"><span>{{ l.nom }}</span><b class="num">{{ l.quantite }}</b></li>
                </ul>
                <p v-if="o.repas.astuce" class="tiny muted astuce">💡 {{ o.repas.astuce }}</p>
                <button type="button" class="btn soft full" @click="manger(o)"><Icone nom="plus" :taille="18" /> J’ai mangé ça ({{ o.kcal }} kcal)</button>
              </div>
            </li>
          </ul>
          <p v-else class="banner info">Aucun repas ne correspond à tes goûts pour ce moment : retire une exclusion dans « Mes goûts ».</p>
        </section>

        <section class="card pad section" aria-labelledby="t-jour">
          <div class="row between"><h2 id="t-jour" class="card-title">Exemple de journée</h2><button type="button" class="btn soft petit-b" @click="decalage++"><Icone nom="synchro" :taille="16" /> Autre idée</button></div>
          <ul class="rows journee">
            <li v-for="r in journee.repas" :key="r.moment.id">
              <span class="ico" aria-hidden="true">{{ r.choix?.repas.icone ?? r.moment.icone }}</span>
              <span class="grow"><small class="mom">{{ r.moment.nom }}</small><b>{{ r.choix?.repas.nom ?? '—' }}</b><small v-if="r.choix" class="muted">{{ r.choix.lignes.map(l => `${l.nom.toLowerCase()} ${l.quantite}`).join(' · ') }}</small></span>
              <span v-if="r.choix" class="kc num">{{ r.choix.kcal }}</span>
            </li>
          </ul>
          <p class="small total-j">Total ≈ <b class="num">{{ journee.kcal.toLocaleString('fr-FR') }} kcal</b> · <b class="num">{{ journee.prot }} g</b> de protéines <span class="muted">(repère : {{ n.cible.toLocaleString('fr-FR') }} kcal, {{ n.proteines }} g)</span></p>
          <p class="tiny muted">Valeurs moyennes arrondies (ordres de grandeur de la table Ciqual de l’Anses et d’étiquettes courantes) : elles varient selon les marques. Pèse 2 ou 3 fois au début, ensuite l’œil suffit.</p>
        </section>
      </div>

      <div>
        <section class="card pad section reperes">
          <h2 class="card-title">Tes repères quotidiens</h2>
          <div class="tuiles">
            <div class="tuile" style="--c: var(--flamme)"><span>🎯</span><b class="num">{{ n.cible.toLocaleString('fr-FR') }}</b><small>kcal pour maigrir</small></div>
            <div class="tuile" style="--c: var(--cardio)"><span>🍗</span><b class="num">{{ n.proteines }} g</b><small>protéines</small></div>
            <div class="tuile" style="--c: var(--eau)"><span>💧</span><b class="num">{{ n.eau.toLocaleString('fr-FR') }} L</b><small>eau</small></div>
            <div class="tuile" style="--c: var(--calme)"><span>📉</span><b class="num">~{{ kg(Math.max(0, n.perteHebdo)) }}</b><small>kg / semaine attendus</small></div>
          </div>
          <p class="small muted dep">Dépense estimée sans sport : <b class="num">{{ n.tdee.toLocaleString('fr-FR') }} kcal</b></p>
          <p class="tiny muted">Calcul Mifflin-St Jeor, déficit modéré (~650 kcal) pour une perte durable sans fonte musculaire. Recalculé automatiquement quand ton poids baisse.</p>
        </section>

        <section class="card pad section gouts" :class="{ alerte: !configure }" aria-labelledby="t-gouts">
          <h2 id="t-gouts" class="card-title">Mes goûts</h2>
          <p v-if="!configure" class="small">Dis-moi ce que tu ne manges pas : les idées de repas, les habitudes et les conseils s’adaptent.</p>
          <p class="label">Je ne mange pas</p>
          <div class="chips wrap">
            <button v-for="x in EXCLUSIONS" :key="x.id" type="button" class="chip" :class="{ non: g.exclus.includes(x.id) }" :aria-pressed="g.exclus.includes(x.id)" @click="basculerExclu(x.id)">{{ x.icone }} {{ x.label }}</button>
          </div>
          <p class="label">Fruits que j’aime</p>
          <div class="chips wrap">
            <button v-for="f in FRUITS" :key="f.id" type="button" class="chip" :class="{ on: g.fruits.includes(f.id) }" :aria-pressed="g.fruits.includes(f.id)" @click="basculerFruit(f.id)">{{ f.icone }} {{ f.label }}</button>
          </div>
        </section>

        <section v-if="sansLegumes" class="card pad section" aria-labelledby="t-sans">
          <h2 id="t-sans" class="card-title">Sans légumes : comment compenser</h2>
          <p class="small muted">Les légumes apportent surtout des fibres (qui calent et aident le transit) et des vitamines. Sans eux, on compense comme on peut :</p>
          <ul class="conseils">
            <li><b>Version complète</b> du riz, des pâtes et du pain quand tu peux : plus de fibres, tu tiens plus longtemps.</li>
            <li><b>Flocons d’avoine</b> le matin : riches en fibres.</li>
            <li><b>Un fruit par jour</b> parmi ceux que tu aimes, ou une compote sans sucre ajouté.</li>
            <li><b>Beaucoup d’eau</b>, surtout avec plus de fibres.</li>
            <li><b>Si un jour tu veux essayer</b> (sans obligation) : sauce tomate sur les pâtes, soupe mixée bien lisse, maïs, haricots verts fins. Une seule chose à la fois, en petite quantité.</li>
            <li>Parles-en à ton médecin lors du bilan : il pourra vérifier si une prise de sang ou un complément est utile.</li>
          </ul>
        </section>

        <section class="card pad section" aria-labelledby="t-assiette">
          <h2 id="t-assiette" class="card-title">Ton assiette</h2>
          <div v-if="!sansLegumes" class="assiette" role="img" aria-label="Moitié légumes, un quart protéines, un quart féculents">
            <div class="leg"><b>½</b>Légumes</div><div class="prot"><b>¼</b>Protéines</div><div class="fec"><b>¼</b>Féculents</div>
          </div>
          <div v-else class="assiette deux" role="img" aria-label="Moitié protéines, moitié féculents pesés, plus un fruit ou un laitage">
            <div class="prot"><b>150 g</b>Poulet / dinde</div><div class="fec"><b>pesé</b>Riz / pâtes</div><div class="fru"><b>+1</b>Fruit / laitage</div>
          </div>
          <ul class="conseils"><li v-for="c in conseils.slice(0, 6)" :key="c">{{ c }}</li></ul>
          <p class="small frites"><b>🍟 Les frites :</b> pas interdites ! Au four ou à l’air fryer, environ 150 g, 1 à 2 fois par semaine, et sans autre féculent dans le même repas.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<route>
{ "meta": { "titre": "Nutrition" } }
</route>

<style scoped>
.card-title { margin: 0 0 12px; font-weight: 900; font-stretch: 80%; text-transform: uppercase; letter-spacing: .03em; font-size: 16px; }
.bilan { display: flex; align-items: center; gap: 20px; padding: 20px; }
.reste { display: block; font-size: 34px; font-weight: 900; font-stretch: 75%; line-height: 1; }
.bilan small { font-size: 11.5px; color: var(--muted); font-weight: 700; }
.bilan .kv li { font-size: 14.5px; }
.bilan .kv span { display: inline-flex; align-items: center; gap: 8px; }
.pt { width: 9px; height: 9px; border-radius: 50%; }
.pt.o { background: var(--surface-3); } .pt.m { background: var(--flamme-vif); } .pt.s { background: var(--good); }
.ajout .kcal { max-width: 100px; flex: none; }
.ajout .btn { width: 52px; padding: 0; flex: none; }
.rapide { margin: 16px 0 8px; }
.repas { margin-top: 12px; border-top: 1px solid var(--border); }
.kc { font-weight: 900; white-space: nowrap; }
.kc small { display: inline !important; color: var(--dim) !important; font-weight: 700; font-size: 12px !important; }
.repas .ico { width: 34px; height: 34px; font-size: 16px; border-radius: 11px; }
.icon-btn.petit { width: 32px; height: 32px; border-radius: 10px; color: var(--muted); box-shadow: none; }
.vide-r { margin: 14px 0 0; }
.tuiles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.tuile { display: grid; gap: 1px; padding: 12px 14px; border-radius: 16px; background: color-mix(in srgb, var(--c) 9%, var(--surface-2)); border: 1px solid color-mix(in srgb, var(--c) 18%, transparent); }
.tuile span { font-size: 18px; }
.tuile b { font-size: 24px; font-weight: 900; font-stretch: 78%; line-height: 1.1; }
.tuile small { font-size: 12px; color: var(--muted); font-weight: 700; }
.dep { margin: 12px 0 4px; }
.dep b { color: var(--text); }
.assiette { display: grid; grid-template-columns: 2fr 1fr 1fr; height: 96px; border-radius: 48px; overflow: hidden; text-align: center; font-weight: 800; font-size: 12.5px; color: #fff; box-shadow: inset 0 0 0 4px rgba(255,255,255,.12); }
.assiette > div { display: grid; place-content: center; line-height: 1.1; }
.assiette b { display: block; font-size: 24px; font-weight: 900; font-stretch: 78%; }
.leg { background: linear-gradient(160deg, #22a06b, #157a50); } .prot { background: linear-gradient(160deg, #e8541f, #b93c10); } .fec { background: linear-gradient(160deg, #c99410, #9c7208); }
.conseils { margin: 14px 0 0; padding-left: 18px; display: grid; gap: 8px; color: var(--muted); font-size: 14px; }
.conseils li::marker { color: var(--accent); }
.intro-r { margin: -4px 0 12px; }
.lien-g { color: var(--accent); font-weight: 800; white-space: nowrap; }
.moments { display: grid; grid-template-columns: repeat(4, 1fr); margin-bottom: 12px; }
.moments button { font-size: 12.5px; padding-inline: 4px; white-space: nowrap; }
.options { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.opt-r { border-radius: 16px; background: var(--surface-2); border: 1px solid var(--border); overflow: hidden; }
.opt-r.open { border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); }
.opt-h { width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: none; border: 0; color: inherit; text-align: left; cursor: pointer; font: inherit; }
.opt-ic { width: 42px; height: 42px; flex: none; display: grid; place-items: center; font-size: 22px; border-radius: 13px; background: var(--surface-3); }
.opt-h b { display: block; font-size: 15px; font-weight: 800; }
.opt-h small { color: var(--muted); font-size: 12.5px; font-weight: 700; }
.opt-d { padding: 0 12px 12px; display: grid; gap: 10px; }
.qte { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.qte li { display: flex; justify-content: space-between; gap: 10px; font-size: 14px; padding: 6px 0; border-bottom: 1px dashed var(--border); }
.qte span { color: var(--muted); }
.qte b { text-align: right; }
.astuce { margin: 0; }
.tourne { transform: rotate(180deg); transition: transform .2s; }
.petit-b { min-height: 36px; padding: 0 12px; font-size: 13px; }
.journee .mom { display: block; font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; color: var(--accent); }
.journee b { display: block; }
.journee small.muted { display: block; font-size: 12.5px; line-height: 1.35; }
.total-j { margin: 12px 0 6px; }
.gouts .label { margin: 12px 0 8px; }
.gouts.alerte { border-color: color-mix(in srgb, var(--accent) 50%, var(--border)); }
.chip.non { background: color-mix(in srgb, var(--bad) 16%, var(--surface-2)); border-color: color-mix(in srgb, var(--bad) 45%, transparent); text-decoration: line-through; text-decoration-color: var(--bad); }
.assiette.deux { grid-template-columns: 1fr 1fr .8fr; }
.fru { background: linear-gradient(160deg, #e8a21f, #c27a0a); }
.frites { margin: 14px 0 0; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); }
</style>
