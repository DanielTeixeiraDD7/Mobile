<script setup lang="ts">
import { affinite, semaineDe } from '@/domain/classement';
import { bornes, duree } from '@/domain/screentime';
import { TYPE_LABELS, formatNumber, mediaTitle, statusLabel, unitShort } from '@/domain/labels';
import { MEDIA_TYPES, type MediaType } from '@/domain/types';
import { jourLocal, messageSocial, titresDe, type TitrePartage } from '@/lib/social';
import { useSocial } from '@/stores/social';
import { useBiblio } from '@/stores/biblio';
import { confirmer } from '@/composables/useConfirm';
import { toast } from '@/composables/useToast';
import Icone from '@/components/Icone.vue';
import Avatar from '@/components/Avatar.vue';
import Affiche from '@/components/Affiche.vue';
import Anneau from '@/components/graph/Anneau.vue';
import BarresTemps from '@/components/graph/BarresTemps.vue';

const route = useRoute();
const router = useRouter();
const social = useSocial();
const biblio = useBiblio();
onMounted(async () => { if (social.etat !== 'connecte') await social.demarrer(); });
const ami = computed(() => social.reseau.amis.find(a => a.id === route.params.id));

const titres = shallowRef<TitrePartage[]>([]);
const erreur = ref<string | null>(null);
watch(ami, async a => {
  if (!a?.partage_biblio) { titres.value = []; return; }
  try { titres.value = await titresDe(a.id); } catch (e) { erreur.value = messageSocial(e); }
}, { immediate: true });

const lundi = bornes('semaine', new Date()).debut;
const sienne = computed(() => (ami.value ? semaineDe(social.stats, ami.value.id, lundi) : null));
const mienne = computed(() => (social.profil ? semaineDe(social.stats, social.profil.id, lundi) : null));
const total = (s: ReturnType<typeof semaineDe> | null) => (s ? s.jours.reduce((n, j) => n + j.total, 0) : 0);
const tranches = computed(() => (sienne.value?.jours ?? []).map((j, i) => ({ libelle: 'LMMJVSD'[i]!, parType: j.parType, total: j.total, actif: j.jour === jourLocal(Date.now()) })));
const comparaison = computed(() => MEDIA_TYPES.filter(t => t !== 'MANGA').map(t => ({ type: t, lui: sienne.value?.parType[t] ?? 0, moi: mienne.value?.parType[t] ?? 0 })));
const maxComp = computed(() => Math.max(1, ...comparaison.value.flatMap(c => [c.lui, c.moi])));

const aff = computed(() => affinite(biblio.entries, titres.value));
const enCours = computed(() => titres.value.filter(t => t.statut === 'CURRENT' || t.statut === 'REWATCH').slice(0, 12));
// Suggestions : ce qu'il a adoré (≥ 8/10) et que tu n'as pas dans ta bibliothèque.
const aDecouvrir = computed(() => titres.value.filter(t => (t.note ?? 0) >= 8 && !biblio.parId(t.id)).sort((a, b) => (b.note ?? 0) - (a.note ?? 0)).slice(0, 12));
const lienTitre = (id: string) => { const [, type, mid] = id.split(':'); return `/titre/${type}/${mid}`; };
const avancement = (t: TitrePartage) => (t.categorie === 'MOVIE' ? statusLabel('MOVIE', t.statut as never) : `${unitShort(t.categorie as MediaType)} ${formatNumber(Number(t.progression))}${t.total ? ` / ${t.total}` : ''}`);

async function retirerAmi() {
  if (!ami.value) return;
  const nom = ami.value.pseudo;
  if (!(await confirmer(`${nom} ne verra plus tes partages et tu ne verras plus les siens.`, { titre: `Retirer ${nom} ?`, ok: 'Retirer', annuler: 'Garder' }))) return;
  try { await social.retirer(ami.value.id); toast(`${nom} retiré de tes amis.`); router.replace('/amis'); } catch (e) { toast(messageSocial(e), { type: 'danger' }); }
}
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button type="button" class="icon-btn" aria-label="Retour" @click="router.back()"><Icone nom="retour" /></button>
      <span class="grow" />
    </div>

    <p v-if="social.etat !== 'connecte'" class="muted center">Chargement…</p>
    <div v-else-if="!ami" class="vide"><Icone nom="personnes" :taille="32" /><p>Cette personne n’est pas (ou plus) dans tes amis.</p><router-link to="/amis" class="btn small">Mes amis</router-link></div>

    <template v-else>
      <header class="tete">
        <Avatar :pseudo="ami.pseudo" :couleur="ami.couleur" :taille="72" />
        <h1>{{ ami.pseudo }}</h1>
        <p v-if="aff.compatibilite !== null" class="small muted">Compatibilité {{ aff.compatibilite }} %</p>
      </header>

      <p v-if="erreur" class="banner warn">{{ erreur }}</p>

      <section class="card pad">
        <template v-if="ami.partage_temps">
          <div class="row between"><span class="label">Cette semaine</span><b class="num">≈ {{ duree(total(sienne)) }}</b></div>
          <BarresTemps :tranches="tranches" :format="duree" :hauteur="110" class="graph" />
          <p v-if="sienne?.chapitres" class="small muted">+ {{ formatNumber(sienne.chapitres) }} chapitres de manga lus</p>
          <p class="label vs">{{ ami.pseudo }} vs toi</p>
          <div v-for="c in comparaison" :key="c.type" class="comp">
            <span class="cat"><Icone :nom="TYPE_LABELS[c.type].icone" :taille="16" :style="{ color: TYPE_LABELS[c.type].couleur }" /> {{ TYPE_LABELS[c.type].plusieurs }}</span>
            <span class="barres">
              <span class="b"><i :style="{ width: (c.lui / maxComp) * 100 + '%', background: TYPE_LABELS[c.type].couleur }" /><small>{{ duree(c.lui) }}</small></span>
              <span class="b moi"><i :style="{ width: (c.moi / maxComp) * 100 + '%' }" /><small>toi {{ duree(c.moi) }}</small></span>
            </span>
          </div>
        </template>
        <p v-else class="muted small">{{ ami.pseudo }} ne partage pas son temps d’écran.</p>
      </section>

      <template v-if="ami.partage_biblio">
        <section v-if="aff.compatibilite !== null" class="card pad compat">
          <Anneau :ratio="aff.compatibilite / 100" :taille="76" :epaisseur="9" couleur="var(--brand)" fond="var(--surface-3)"><b class="num">{{ aff.compatibilite }} %</b></Anneau>
          <p class="small muted">{{ aff.methode === 'notes' ? `D’après vos notes sur ${aff.notesCommunes} titres vus tous les deux.` : `Part des titres de ${ami.pseudo} que tu as aussi. Notez vos titres pour une mesure plus fine.` }}</p>
        </section>

        <section v-if="enCours.length" class="section">
          <div class="section-head"><h2>En ce moment</h2></div>
          <ul class="hscroll">
            <li v-for="t in enCours" :key="t.id">
              <router-link :to="lienTitre(t.id)" class="mini">
                <Affiche :src="t.affiche" :titre="t.titre" :largeur="999" :rayon="12" />
                <span class="nom clamp2">{{ t.titre }}</span>
                <small>{{ avancement(t) }}</small>
              </router-link>
            </li>
          </ul>
        </section>

        <section v-if="aff.communs.length" class="section">
          <div class="section-head"><h2>En commun</h2><span class="small muted">{{ aff.communs.length }}</span></div>
          <ul class="card communs">
            <li v-for="c in aff.communs.slice(0, 30)" :key="c.titre.id">
              <router-link :to="lienTitre(c.titre.id)">
                <Affiche :src="c.mien.media.cover" :couleur="c.mien.media.coverColor" :titre="c.titre.titre" :largeur="36" :rayon="7" />
                <span class="grow ellipsis">{{ mediaTitle(c.mien.media, biblio.settings.titleLanguage) }}</span>
                <span class="notes num"><span :title="`Note de ${ami.pseudo}`">{{ c.titre.note ?? '–' }}</span><span class="dim">/</span><span class="moi-note" title="Ta note">{{ c.mien.score ?? '–' }}</span></span>
              </router-link>
            </li>
          </ul>
          <p class="tiny dim legende-notes">Notes : {{ ami.pseudo }} / toi.</p>
        </section>

        <section v-if="aDecouvrir.length" class="section">
          <div class="section-head"><h2>Adorés par {{ ami.pseudo }}</h2></div>
          <ul class="hscroll">
            <li v-for="t in aDecouvrir" :key="t.id">
              <router-link :to="lienTitre(t.id)" class="mini">
                <Affiche :src="t.affiche" :titre="t.titre" :largeur="999" :rayon="12" />
                <span class="nom clamp2">{{ t.titre }}</span>
                <small><Icone nom="etoile" :taille="11" class="etoile" /> {{ formatNumber(Number(t.note)) }}/10</small>
              </router-link>
            </li>
          </ul>
        </section>
      </template>
      <p v-else class="card pad small muted">{{ ami.pseudo }} ne partage pas sa bibliothèque : pas de titres en commun ni de compatibilité.</p>

      <button type="button" class="btn ghost danger full retirer" @click="retirerAmi">Retirer {{ ami.pseudo }} de mes amis</button>
    </template>
  </div>
</template>

<route>
{ "meta": { "titre": "Ami" } }
</route>

<style scoped>
.tete { display: grid; justify-items: center; gap: 4px; margin: 0 0 16px; text-align: center; }
.tete h1 { margin: 8px 0 0; font-size: 28px; letter-spacing: -.03em; }
.tete p { margin: 0; }
.graph { margin: 14px 0 8px; }
.vs { margin: 16px 0 8px; }
.comp { display: grid; grid-template-columns: 96px 1fr; gap: 10px; align-items: center; padding: 6px 0; }
.cat { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; }
.barres { display: grid; gap: 4px; }
.b { display: flex; align-items: center; gap: 8px; }
.b i { display: block; height: 8px; min-width: 3px; border-radius: 4px; transition: width .6s var(--ease); }
.b.moi i { background: var(--surface-3); }
.b small { font-size: 11.5px; font-weight: 700; color: var(--muted); white-space: nowrap; }
.compat { display: flex; align-items: center; gap: 16px; margin-top: 12px; }
.compat p { margin: 0; }
.mini { display: grid; gap: 6px; color: inherit; text-decoration: none; }
.mini :deep(.affiche) { width: 100% !important; }
.mini .nom { font-size: 13.5px; font-weight: 700; line-height: 1.25; }
.mini small { font-size: 12px; color: var(--muted); margin-top: -3px; display: inline-flex; align-items: center; gap: 3px; }
.etoile { color: var(--movie); }
.communs { list-style: none; margin: 0; padding: 4px 8px; }
.communs a { display: flex; align-items: center; gap: 12px; padding: 7px 4px; color: inherit; text-decoration: none; font-weight: 600; font-size: 14.5px; }
.communs li + li { border-top: 1px solid var(--border); }
.notes { display: inline-flex; gap: 4px; font-weight: 800; }
.moi-note { color: var(--brand); }
.legende-notes { margin: 6px 6px 0; }
.retirer { margin-top: 22px; }
</style>
