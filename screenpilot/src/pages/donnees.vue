<script setup lang="ts">
import { clearCache } from '@/api/cache';
import * as store from '@/data/store';
import { backupFileName, BackupError, createBackup, parseBackup, previewImport, resolveImport, type ImportPreview, type ParsedBackup, type Strategy } from '@/domain/backup';
import { mediaTitle } from '@/domain/labels';
import { useBiblio } from '@/stores/biblio';
import { toast } from '@/composables/useToast';
import { confirmer } from '@/composables/useConfirm';
import Icone from '@/components/Icone.vue';

const biblio = useBiblio();
const router = useRouter();

async function exporter() {
  const { entries, history, settings } = store.getState();
  const fichier = new File([JSON.stringify(createBackup(entries, history, settings), null, 1)], backupFileName(), { type: 'application/json' });
  if (navigator.canShare?.({ files: [fichier] })) {
    try { await navigator.share({ files: [fichier], title: 'Sauvegarde ScreenPilot' }); return; }
    catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(fichier);
  const a = Object.assign(document.createElement('a'), { href: url, download: fichier.name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  toast(`Sauvegarde exportée (${entries.length} titres).`, { type: 'ok' });
}

const lu = shallowRef<ParsedBackup | null>(null);
const apercu = shallowRef<ImportPreview | null>(null);
const strategie = ref<Strategy | 'replace'>('advanced');
const erreur = ref<string | null>(null);
const champ = useTemplateRef<HTMLInputElement>('champ');

async function choisirFichier(f: File | undefined) {
  erreur.value = null; lu.value = null; apercu.value = null;
  if (!f) return;
  if (f.size > 20_000_000) { erreur.value = 'Fichier trop volumineux (20 Mo max).'; return; }
  try {
    const p = parseBackup(await f.text());
    lu.value = p;
    apercu.value = previewImport(store.getState().entries, p.entries);
  } catch (e) {
    erreur.value = e instanceof BackupError ? e.message : 'Lecture du fichier impossible.';
  } finally {
    if (champ.value) champ.value.value = '';
  }
}

async function importer() {
  if (!lu.value || !apercu.value) return;
  if (strategie.value === 'replace') {
    if (!(await confirmer('Tout ce qui n’est pas dans le fichier sera effacé de ce téléphone.', { titre: 'Tout remplacer ?', ok: 'Remplacer' }))) return;
    await store.replaceLibrary(lu.value.entries, lu.value.history);
    toast(`Bibliothèque remplacée : ${lu.value.entries.length} titres.`, { type: 'ok' });
  } else {
    const liste = resolveImport(apercu.value, strategie.value);
    await store.importEntries(liste, lu.value.history);
    toast(`${liste.length} titre(s) importé(s) ou mis à jour.`, { type: 'ok' });
  }
  if (Object.keys(lu.value.settings).length) await store.updateSettings({ ...lu.value.settings, onboarded: true });
  lu.value = null; apercu.value = null;
}

async function viderCache() {
  await clearCache(store.getDb());
  toast('Cache vidé.');
}
async function toutEffacer() {
  if (!(await confirmer('Bibliothèque et historique seront supprimés de ce téléphone. Exporte d’abord une sauvegarde si tu veux pouvoir revenir en arrière.', { titre: 'Tout effacer ?', ok: 'Effacer définitivement' }))) return;
  await store.replaceLibrary([], []);
  toast('Données effacées.');
  router.replace('/');
}
const titre = (m: Parameters<typeof mediaTitle>[0]) => mediaTitle(m, biblio.settings.titleLanguage);
const STRATEGIES = [
  ['advanced', 'Garder la progression la plus avancée'],
  ['theirs', 'Prendre la version du fichier'],
  ['mine', 'Garder ma version'],
  ['replace', 'Tout remplacer par le fichier (efface le reste)'],
] as const;
</script>

<template>
  <div class="page">
    <div class="topbar">
      <button type="button" class="icon-btn" aria-label="Retour" @click="router.back()"><Icone nom="retour" /></button>
      <h1 class="page-title grow">Données</h1>
    </div>

    <div class="card pad stack">
      <div class="row"><Icone nom="telecharger" /><b>Exporter une sauvegarde</b></div>
      <p class="small muted">Fichier JSON : bibliothèque, historique (base du temps d’écran), préférences. À garder dans Fichiers / iCloud Drive : c’est ta seule copie en dehors du téléphone.</p>
      <button type="button" class="btn primary full" :disabled="!biblio.entries.length" @click="exporter">Exporter ({{ biblio.entries.length }} titres)</button>
    </div>

    <div class="card pad stack section">
      <div class="row"><Icone nom="envoyer" /><b>Importer</b></div>
      <p class="small muted">Sauvegardes ScreenPilot et AnimePilot acceptées. Un aperçu s’affiche avant toute modification.</p>
      <input id="fichier" ref="champ" type="file" accept="application/json,.json" class="sr-only" @change="choisirFichier(($event.target as HTMLInputElement).files?.[0])">
      <label for="fichier" class="btn full">Choisir un fichier…</label>
      <p v-if="erreur" class="banner error" role="alert">{{ erreur }}</p>
    </div>

    <div v-if="lu && apercu" class="card pad stack section" aria-live="polite">
      <b>Aperçu<span v-if="lu.exportedAt" class="muted small"> · sauvegarde du {{ new Date(lu.exportedAt).toLocaleString('fr-FR') }}</span></b>
      <ul class="small apercu">
        <li><b>{{ apercu.added.length }}</b> nouveau(x) titre(s)</li>
        <li><b>{{ apercu.identical.length }}</b> identique(s) (ignorés)</li>
        <li><b>{{ apercu.conflicts.length }}</b> différent(s) de ta version</li>
        <li v-if="lu.duplicatesInFile">{{ lu.duplicatesInFile }} doublon(s) dans le fichier (version la plus récente gardée)</li>
        <li v-if="lu.invalid" class="attention">{{ lu.invalid }} entrée(s) invalide(s) ignorée(s)</li>
      </ul>
      <div v-if="apercu.similar.length" class="banner warn">
        Doublons probables (même titre, autre fiche) :
        <ul class="small"><li v-for="s in apercu.similar.slice(0, 5)" :key="s.theirs.id">{{ titre(s.theirs.media) }} ↔ {{ titre(s.mine.media) }}</li></ul>
      </div>
      <ul v-if="apercu.conflicts.length" class="small muted">
        <li v-for="c in apercu.conflicts.slice(0, 8)" :key="c.mine.id">{{ titre(c.mine.media) }} : toi {{ c.mine.progress }}, fichier {{ c.theirs.progress }}</li>
        <li v-if="apercu.conflicts.length > 8">… et {{ apercu.conflicts.length - 8 }} autre(s)</li>
      </ul>
      <fieldset class="radios">
        <legend class="label">En cas de différence</legend>
        <label v-for="[v, l] in STRATEGIES" :key="v"><input v-model="strategie" type="radio" name="strategie" :value="v"> {{ l }}</label>
      </fieldset>
      <div class="row">
        <button type="button" class="btn grow" @click="lu = null; apercu = null">Annuler</button>
        <button type="button" class="btn grow" :class="strategie === 'replace' ? 'danger solid' : 'primary'" @click="importer">Importer</button>
      </div>
    </div>

    <div class="card pad stack section">
      <div class="row"><Icone nom="nuage" /><b>Cache hors-ligne</b></div>
      <p class="small muted">Recherches et fiches TMDB / AniList enregistrées pour le hors-ligne. Ta bibliothèque n’est pas touchée.</p>
      <button type="button" class="btn full" @click="viderCache">Vider le cache</button>
    </div>

    <button type="button" class="btn ghost danger full section" @click="toutEffacer">Tout effacer…</button>
  </div>
</template>

<route>
{ "meta": { "titre": "Données" } }
</route>

<style scoped>
.stack p { margin: 0; }
.apercu { margin: 0; padding-left: 18px; }
.attention { color: var(--warn); }
.radios { border: 0; padding: 0; margin: 0; display: grid; gap: 8px; }
.radios label { display: flex; gap: 8px; align-items: center; font-size: 14.5px; }
.radios legend { margin-bottom: 6px; }
</style>
