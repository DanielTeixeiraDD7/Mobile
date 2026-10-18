<script setup lang="ts">
import { runProject, CompileError, FakeServer, type Files, type Running } from '@/lib/runtime';
import { PRIMEVUE_CONFIG } from '@/lib/theme';

/** Aperçu en direct : compile et monte le projet de l'exercice dans un faux navigateur. */
const props = defineProps<{ files: Files; messages?: Record<string, string> }>();

const ecran = useTemplateRef<HTMLDivElement>('ecran');
const erreurCompil = ref<{ file: string; message: string; line: number | null } | null>(null);
const erreurs = ref<string[]>([]);
const chemin = ref<string | null>(null);
const enCours = ref(false);
let courant: Running | null = null;
let courantEl: HTMLElement | null = null;
let arretRoute: (() => void) | null = null;
let generation = 0;

function arreter() {
  arretRoute?.(); arretRoute = null;
  courant?.unmount(); courant = null;
  courantEl?.remove(); courantEl = null;
}

async function executer() {
  if (!ecran.value) return;
  const g = ++generation;
  enCours.value = true;
  // Nouvelle version montée en coulisse, puis échangée : pas d'écran blanc pendant la frappe.
  const cible = document.createElement('div');
  cible.className = 'coulisse';
  ecran.value.append(cible);
  try {
    // Délai réseau réaliste pour voir les états de chargement.
    const r = await runProject(props.files, cible, { api: new FakeServer({ delay: 400 }), messages: props.messages, primevue: PRIMEVUE_CONFIG });
    if (g !== generation) { r.unmount(); cible.remove(); return; }
    arreter();
    cible.className = '';
    courant = r; courantEl = cible;
    erreurCompil.value = null;
    // Les erreurs arrivent après le montage (clics, appels serveur) : on les relaie.
    const push = r.errors.push.bind(r.errors);
    r.errors.push = (...e: string[]) => { const n = push(...e); erreurs.value = [...r.errors]; return n; };
    erreurs.value = [...r.errors];
    chemin.value = r.router ? r.router.currentRoute.value.fullPath : null;
    arretRoute = r.router ? r.router.afterEach(to => { chemin.value = to.fullPath; }) : null;
  } catch (e) {
    cible.remove();
    if (g !== generation) return;
    // L'ancienne version reste dessous, voilée par le message d'erreur.
    erreurCompil.value = e instanceof CompileError
      ? { file: e.file, message: e.message, line: e.line }
      : { file: '', message: (e as Error)?.message ?? String(e), line: null };
  } finally {
    if (g === generation) enCours.value = false;
  }
}

// L'exercice voit la largeur de l'aperçu comme largeur d'écran (utile pour le responsive).
let observateur: ResizeObserver | null = null;
onMounted(() => {
  if (!ecran.value || typeof ResizeObserver === 'undefined') return;
  // Panneau masqué (onglet mobile) : largeur 0, on l'ignore.
  observateur = new ResizeObserver(() => { const w = ecran.value?.clientWidth ?? 0; if (courant && w > 0) courant.resize(w); });
  observateur.observe(ecran.value);
});

function retour() { courant?.router?.back(); }
const pret = computed(() => !!chemin.value);

onBeforeUnmount(() => { observateur?.disconnect(); generation++; arreter(); });
defineExpose({ executer, arreter });
</script>

<template>
  <div class="preview">
    <div class="chrome">
      <span class="dots"><i /><i /><i /></span>
      <button class="nav" type="button" :disabled="!pret" aria-label="Page précédente" @click="retour"><i class="pi pi-arrow-left" /></button>
      <span class="url"><i class="pi pi-lock" /> app.local<b>{{ chemin ?? '/' }}</b></span>
      <button class="nav" type="button" aria-label="Relancer l'aperçu" @click="executer"><i class="pi pi-refresh" :class="{ 'pi-spin': enCours }" /></button>
    </div>
    <div class="viewport">
      <div ref="ecran" class="ecran" />
      <transition name="fade">
        <div v-if="erreurCompil" class="overlay">
          <div class="err-card">
            <div class="err-title"><i class="pi pi-times-circle" /> Erreur de compilation</div>
            <div v-if="erreurCompil.file" class="err-file">{{ erreurCompil.file }}<span v-if="erreurCompil.line"> · ligne {{ erreurCompil.line }}</span></div>
            <pre>{{ erreurCompil.message }}</pre>
          </div>
        </div>
      </transition>
    </div>
    <div v-if="erreurs.length" class="runtime">
      <i class="pi pi-exclamation-triangle" />
      <span><b>Erreur à l'exécution</b> {{ erreurs[erreurs.length - 1] }}</span>
    </div>
  </div>
</template>

<style scoped>
.preview { display: flex; flex-direction: column; height: 100%; min-height: 0; border-radius: 16px; overflow: hidden; border: 1px solid var(--ve-border); background: var(--ve-surface); }
.chrome { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--ve-surface-2); border-bottom: 1px solid var(--ve-border); }
.dots { display: flex; gap: 5px; margin-right: 4px; }
.dots i { width: 10px; height: 10px; border-radius: 50%; background: #ff5f57; } .dots i:nth-child(2) { background: #febc2e; } .dots i:nth-child(3) { background: #28c840; }
.nav { border: 0; background: none; color: var(--ve-muted); width: 28px; height: 28px; border-radius: 8px; cursor: pointer; display: grid; place-items: center; }
.nav:hover:not(:disabled) { background: var(--ve-border); }
.nav:disabled { opacity: .35; cursor: default; }
.url { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 9px; background: var(--ve-surface); color: var(--ve-dim); font: 12.5px/1.4 "JetBrains Mono", ui-monospace, monospace; white-space: nowrap; overflow: hidden; }
.url i { font-size: 10px; } .url b { color: var(--ve-text); font-weight: 600; }
.viewport { position: relative; flex: 1; min-height: 0; overflow: auto; }
.ecran { position: relative; padding: 16px; min-height: 100%; }
.ecran > :deep(.coulisse) { position: absolute; inset: 16px 16px auto; visibility: hidden; pointer-events: none; }
/* Styles par défaut du « navigateur » : sobres, comme une page nue. */
.ecran :deep(.ex-root) { font-size: 15px; }
.ecran :deep(button:not(.p-button)) { font: inherit; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--ve-border); background: var(--ve-surface-2); color: var(--ve-text); cursor: pointer; margin: 2px; }
.ecran :deep(input:not(.p-inputtext)), .ecran :deep(select), .ecran :deep(textarea) { font: inherit; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--ve-border); background: var(--ve-surface); color: var(--ve-text); margin: 2px; }
.ecran :deep(table) { border-collapse: collapse; width: 100%; }
.ecran :deep(th), .ecran :deep(td) { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--ve-border); }
.ecran :deep(h1) { font-size: 22px; margin: 0 0 12px; } .ecran :deep(h2) { font-size: 18px; }
.overlay { position: absolute; inset: 0; padding: 16px; background: color-mix(in srgb, var(--ve-surface) 88%, transparent); backdrop-filter: blur(3px); display: grid; align-content: start; }
.err-card { border-radius: 14px; border: 1px solid color-mix(in srgb, #ef4444 40%, transparent); background: color-mix(in srgb, #ef4444 7%, var(--ve-surface)); padding: 14px 16px; }
.err-title { color: #dc2626; font-weight: 800; display: flex; gap: 8px; align-items: center; }
.err-file { font: 600 12.5px "JetBrains Mono", monospace; color: var(--ve-muted); margin-top: 4px; }
.err-card pre { margin: 10px 0 0; white-space: pre-wrap; font: 13px/1.5 "JetBrains Mono", monospace; color: var(--ve-text); }
.runtime { display: flex; gap: 10px; align-items: flex-start; padding: 10px 14px; font-size: 13px; background: color-mix(in srgb, #f59e0b 12%, var(--ve-surface)); border-top: 1px solid color-mix(in srgb, #f59e0b 30%, transparent); }
.runtime i { color: #d97706; margin-top: 2px; }
.runtime b { margin-right: 6px; }
</style>
