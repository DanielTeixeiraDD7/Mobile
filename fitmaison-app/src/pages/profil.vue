<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { BADGES, imc } from '@/core/calculs';
import { NIVEAUX } from '@/core/programmes';
import { aujourdhui, kg } from '@/core/dates';
import type { Reglages } from '@/core/etat';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import Icone from '@/components/Icone.vue';
import Feuille from '@/components/Feuille.vue';
import FormProfil from '@/components/FormProfil.vue';

const fit = useFit();
const router = useRouter();
const p = ref({ ...fit.profil! });
function enregistrer() { fit.majProfil(p.value); toast('Profil mis à jour ✅', { type: 'ok' }); }
const badges = computed(() => BADGES.map(b => ({ ...b, ok: b.test(fit.etat) })));
const r = computed(() => fit.reglages);
const regler = <K extends keyof Reglages>(k: K, v: Reglages[K]) => fit.reglage(k, v);
const initiale = computed(() => (fit.profil?.name?.trim()?.[0] ?? '').toUpperCase());
const OPTIONS_COACH = [
  ['voice', 'volume', 'Annonce vocale', 'Nom de l’exercice, repos, changement de côté.'],
  ['conseilVocal', 'bulle', 'Conseil vocal', 'Un point clé dit au début de chaque exercice.'],
  ['demo', 'film', 'Démo des nouveaux exercices', '15 s pour regarder un exercice jamais fait.'],
  ['sound', 'cloche', 'Bips de décompte', '3, 2, 1 avant chaque changement.'],
  ['vibrate', 'eclair', 'Vibrations', 'À chaque nouvel exercice.'],
] as const;

function exporter() {
  const fichier = new File([JSON.stringify(fit.etat, null, 2)], `fitmaison-${aujourdhui()}.json`, { type: 'application/json' });
  const url = URL.createObjectURL(fichier);
  const a = Object.assign(document.createElement('a'), { href: url, download: fichier.name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
async function copier() {
  try { await navigator.clipboard.writeText(fit.exporterTexte()); toast('Données copiées ✅ Colle-les dans tes notes pour les garder', { type: 'ok' }); }
  catch { toast('Copie impossible sur cet appareil', { type: 'warn' }); }
}
const coller = ref(false);
const texte = ref('');
function importer(t: string) {
  try { fit.importer(t); toast('Données importées ✅', { type: 'ok' }); coller.value = false; texte.value = ''; router.push('/'); }
  catch { toast('Données invalides', { type: 'danger' }); }
}
function fichier(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  f.text().then(importer);
  (e.target as HTMLInputElement).value = '';
}
async function effacer() {
  if (await confirmer('Effacer toutes tes données ? Action irréversible. Pense à exporter avant.', { titre: 'Tout effacer ?', ok: 'Tout effacer', annuler: 'Annuler' })) fit.toutEffacer();
}
</script>

<template>
  <div class="page">
    <!-- Carte joueur -->
    <header class="card pitch joueur">
      <span class="avatar">{{ initiale || '⚽' }}</span>
      <div class="grow">
        <p class="kicker">Niveau {{ fit.profil!.level }} · {{ NIVEAUX[fit.profil!.level].nom }}</p>
        <h1 class="display">{{ fit.profil!.name || 'Mon profil' }}</h1>
        <p class="tiny">{{ fit.profil!.age }} ans · {{ fit.profil!.height }} cm · IMC {{ imc(fit.profil!, fit.poids).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) }}</p>
      </div>
      <div class="chiffres">
        <div><b class="num">{{ fit.etat.sessions.length }}</b><span>séances</span></div>
        <div><b class="num">{{ kg(Math.max(0, fit.profil!.startWeight - fit.poids)) }}</b><span>kg perdus</span></div>
        <div><b class="num">{{ badges.filter(b => b.ok).length }}</b><span>badges</span></div>
      </div>
    </header>

    <div class="cols-desk">
      <div>
        <section id="badges" class="card pad section">
          <div class="row between"><h2 class="card-title">Badges</h2><span class="tag accent">{{ badges.filter(b => b.ok).length }} / {{ badges.length }}</span></div>
          <div class="badges">
            <div v-for="b in badges" :key="b.id" class="badge" :class="{ ok: b.ok }"><b aria-hidden="true">{{ b.ok ? b.icone : '🔒' }}</b><span>{{ b.label }}</span><span class="sr-only">{{ b.ok ? 'obtenu' : 'à débloquer' }}</span></div>
          </div>
        </section>

        <section class="card pad section">
          <h2 class="card-title"><Icone nom="bulle" :taille="18" /> Ton coach pendant les séances</h2>
          <label v-for="[k, ic, l, d] in OPTIONS_COACH" :key="k" class="bascule">
            <span class="b-ic"><Icone :nom="ic" :taille="18" /></span>
            <span class="grow"><b>{{ l }}</b><small>{{ d }}</small></span>
            <input type="checkbox" class="switch" :checked="r[k] !== false" @change="regler(k, ($event.target as HTMLInputElement).checked)">
          </label>
        </section>

        <section class="card pad section">
          <h2 class="card-title"><Icone nom="palette" :taille="18" /> Affichage</h2>
          <div class="seg" role="group" aria-label="Thème">
            <button v-for="t in (['sombre', 'clair', 'auto'] as const)" :key="t" type="button" :class="{ on: (r.theme ?? 'sombre') === t }" :aria-pressed="(r.theme ?? 'sombre') === t" @click="regler('theme', t)">
              <Icone :nom="{ sombre: 'lune', clair: 'soleil', auto: 'ecran' }[t]" :taille="16" class="t-ic" /> {{ { sombre: 'Sombre', clair: 'Clair', auto: 'Auto' }[t] }}
            </button>
          </div>
        </section>
      </div>

      <div>
        <form class="card pad section" @submit.prevent="enregistrer">
          <h2 class="card-title"><Icone nom="profil" :taille="18" /> Mes informations</h2>
          <FormProfil v-model="p" />
          <button class="btn primary full enreg" type="submit">Enregistrer</button>
        </form>

        <section class="card pad section">
          <h2 class="card-title"><Icone nom="donnees" :taille="18" /> Mes données</h2>
          <p class="small muted">Tout est stocké uniquement sur ce téléphone, rien n’est envoyé. Fais une sauvegarde de temps en temps.</p>
          <div class="donnees">
            <button type="button" class="btn" @click="exporter"><Icone nom="telecharger" :taille="18" /> Exporter</button>
            <label class="btn"><Icone nom="envoyer" :taille="18" /> Importer<input type="file" accept="application/json,.json" class="sr-only" @change="fichier"></label>
            <button type="button" class="btn" @click="copier"><Icone nom="copier" :taille="18" /> Copier</button>
            <button type="button" class="btn" @click="coller = true"><Icone nom="note" :taille="18" /> Coller</button>
          </div>
          <button type="button" class="btn ghost danger full" @click="effacer"><Icone nom="poubelle" :taille="18" /> Tout effacer…</button>
        </section>

        <section class="card pad section small">
          <h2 class="card-title"><Icone nom="telecharger" :taille="18" /> Installer l’application</h2>
          <p class="muted"><b>iPhone (Safari)</b> : bouton Partager → « Sur l’écran d’accueil ».<br><b>Android (Chrome)</b> : menu ⋮ → « Installer l’application ».</p>
          <p class="muted">Ancienne version (mêmes données) : <a href="fitmaison-v1/">ouvrir FitMaison v1</a>.</p>
        </section>

        <p class="banner warn section"><Icone nom="medical" :taille="18" /> <span>FitMaison ne remplace pas un avis médical. Consulte ton médecin avant de reprendre le sport. Arrête-toi immédiatement en cas de douleur dans la poitrine, malaise, vertige ou essoufflement anormal.</span></p>
        <p class="tiny dim center">FitMaison 3.0 · données uniquement sur cet appareil</p>
      </div>
    </div>

    <Feuille v-model="coller" titre="Coller des données">
      <p class="small muted">Colle ici une sauvegarde copiée (elle remplace les données actuelles).</p>
      <textarea v-model="texte" class="input" rows="6" placeholder="{&quot;profile&quot;:…}" aria-label="Sauvegarde à importer" />
      <button type="button" class="btn primary full coller" :disabled="!texte.trim()" @click="importer(texte)">Importer</button>
    </Feuille>
  </div>
</template>

<route>
{ "meta": { "titre": "Profil" } }
</route>

<style scoped>
.card-title { display: flex; align-items: center; gap: 8px; margin: 0 0 12px; font-weight: 900; font-stretch: 80%; text-transform: uppercase; letter-spacing: .03em; font-size: 16px; }
.card-title .ic { color: var(--accent); }
.row .card-title { margin: 0; }
.joueur { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 14px 16px; padding: 20px; }
.joueur .avatar { width: 72px; height: 72px; border-radius: 50%; display: grid; place-items: center; font-size: 34px; font-weight: 900; font-stretch: 75%; background: var(--brand-grad); color: var(--on-volt); box-shadow: 0 0 0 4px rgba(255,255,255,.14), 0 10px 24px -8px rgba(0,0,0,.5); }
.joueur h1 { margin: 2px 0 2px; font-size: 38px; color: #fff; }
.joueur .tiny { margin: 0; color: rgba(255,255,255,.82); font-weight: 600; }
.chiffres { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.chiffres div { padding: 10px 8px; border-radius: 14px; background: rgba(0,0,0,.22); text-align: center; }
.chiffres b { display: block; font-size: 24px; font-weight: 900; font-stretch: 78%; color: #fff; line-height: 1.1; }
.chiffres span { font-size: 11px; font-weight: 700; color: rgba(255,255,255,.8); text-transform: uppercase; letter-spacing: .06em; }
.badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 8px; margin-top: 12px; }
.badge { display: grid; justify-items: center; align-content: start; gap: 4px; padding: 12px 6px; border-radius: 16px; background: var(--surface-2); text-align: center; border: 1px solid transparent; }
.badge b { font-size: 26px; filter: grayscale(1); opacity: .5; }
.badge span { font-size: 11.5px; font-weight: 700; line-height: 1.25; color: var(--muted); }
.badge.ok { background: var(--volt-soft); border-color: color-mix(in srgb, var(--volt) 40%, transparent); }
.badge.ok b { filter: none; opacity: 1; }
.badge.ok span { color: var(--text); }
.enreg { margin-top: 16px; }
.bascule { display: flex; align-items: center; gap: 12px; padding: 12px 0; cursor: pointer; }
.bascule + .bascule { border-top: 1px solid var(--border); }
.b-ic { width: 36px; height: 36px; flex: none; border-radius: 12px; display: grid; place-items: center; background: var(--surface-2); color: var(--accent); }
.bascule b { display: block; font-size: 15px; font-weight: 800; }
.bascule small { display: block; color: var(--muted); font-size: 12.5px; line-height: 1.35; }
.seg button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.donnees { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0 8px; }
.donnees .btn { cursor: pointer; }
.coller { margin-top: 10px; }
.banner span { color: var(--text); }
@media (min-width: 992px) {
  .joueur { grid-template-columns: auto 1fr minmax(320px, 380px); padding: 26px 30px; }
  .chiffres { grid-column: auto; }
  .joueur h1 { font-size: 48px; }
}
</style>
