<script setup lang="ts">
import { useFit } from '@/stores/fit';
import { BADGES } from '@/core/calculs';
import { aujourdhui } from '@/core/dates';
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
    <h1 class="page-title">Profil</h1>

    <section class="card pad">
      <h3>Badges</h3>
      <div class="badges">
        <div v-for="b in badges" :key="b.id" class="badge" :class="{ ok: b.ok }"><b>{{ b.ok ? b.icone : '🔒' }}</b><span>{{ b.label }}</span></div>
      </div>
    </section>

    <form class="card pad section" @submit.prevent="enregistrer">
      <h3>Mes informations</h3>
      <FormProfil v-model="p" />
      <button class="btn primary full enreg" type="submit">Enregistrer</button>
    </form>

    <section class="card pad section">
      <h3>Pendant les séances</h3>
      <label v-for="[k, l, d] in ([['voice', '🗣️ Annonce vocale', 'Nom de l’exercice, repos, changement de côté.'], ['conseilVocal', '💡 Conseil vocal', 'Un point clé dit au début de chaque exercice.'], ['demo', '🎬 Démo des nouveaux exercices', '15 s pour regarder un exercice jamais fait.'], ['sound', '🔔 Bips de décompte', '3, 2, 1 avant chaque changement.'], ['vibrate', '📳 Vibrations', 'À chaque nouvel exercice.']] as const)" :key="k" class="bascule">
        <span class="grow"><b>{{ l }}</b><small>{{ d }}</small></span>
        <input type="checkbox" :checked="r[k] !== false" @change="regler(k, ($event.target as HTMLInputElement).checked)">
      </label>
    </section>

    <section class="card pad section">
      <h3>Affichage</h3>
      <div class="seg">
        <button v-for="t in (['sombre', 'clair', 'auto'] as const)" :key="t" type="button" :class="{ on: (r.theme ?? 'sombre') === t }" @click="regler('theme', t)">{{ { sombre: 'Sombre', clair: 'Clair', auto: 'Auto' }[t] }}</button>
      </div>
    </section>

    <section class="card pad section">
      <h3>Mes données</h3>
      <p class="small muted">Tout est stocké uniquement sur ce téléphone. Fais une sauvegarde de temps en temps.</p>
      <div class="donnees">
        <button type="button" class="btn" @click="exporter"><Icone nom="telecharger" :taille="18" /> Exporter</button>
        <label class="btn"><Icone nom="envoyer" :taille="18" /> Importer<input type="file" accept="application/json,.json" class="sr-only" @change="fichier"></label>
        <button type="button" class="btn" @click="copier"><Icone nom="copier" :taille="18" /> Copier</button>
        <button type="button" class="btn" @click="coller = true"><Icone nom="note" :taille="18" /> Coller</button>
      </div>
      <button type="button" class="btn ghost danger full" @click="effacer">Tout effacer…</button>
    </section>

    <section class="card pad section small">
      <h3>Installer l’application</h3>
      <p class="muted"><b>iPhone (Safari)</b> : bouton Partager → « Sur l’écran d’accueil ».<br><b>Android (Chrome)</b> : menu ⋮ → « Installer l’application ».</p>
      <p class="muted">Ancienne version (mêmes données) : <a href="fitmaison-v1/">ouvrir FitMaison v1</a>.</p>
    </section>
    <p class="tiny dim center">FitMaison 2.0 · ne remplace pas un avis médical</p>

    <Feuille v-model="coller" titre="Coller des données">
      <p class="small muted">Colle ici une sauvegarde copiée (elle remplace les données actuelles).</p>
      <textarea v-model="texte" class="input" rows="6" placeholder="{&quot;profile&quot;:…}" />
      <button type="button" class="btn primary full coller" :disabled="!texte.trim()" @click="importer(texte)">Importer</button>
    </Feuille>
  </div>
</template>

<route>
{ "meta": { "titre": "Profil" } }
</route>

<style scoped>
h3 { margin: 0 0 10px; font-size: 16px; }
.badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); gap: 8px; }
.badge { display: grid; justify-items: center; gap: 2px; padding: 10px 4px; border-radius: 14px; background: var(--surface-2); text-align: center; opacity: .55; }
.badge.ok { opacity: 1; background: var(--brand-soft); }
.badge b { font-size: 24px; }
.badge span { font-size: 11.5px; font-weight: 700; line-height: 1.25; }
.enreg { margin-top: 14px; }
.bascule { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.bascule + .bascule { border-top: 1px solid var(--border); }
.bascule b { display: block; font-size: 15px; }
.bascule small { color: var(--muted); font-size: 12.5px; }
.bascule input { width: 22px; height: 22px; accent-color: var(--brand); }
.donnees { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
.coller { margin-top: 10px; }
.center { margin-top: 14px; }
</style>
