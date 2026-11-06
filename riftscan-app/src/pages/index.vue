<script setup lang="ts">
import Icone from '@/components/Icone.vue';
import CarteResultat from '@/components/CarteResultat.vue';
import { useRift } from '@/stores/rift';
import { reconnaitre, reconnaitrePhoto, SEUIL_POSSIBLE, SEUIL_SUR } from '@/core/scan';
import type { Candidat } from '@/core/empreinte';

/** Scanner : la caméra arrière filme, on cherche en continu la carte placée dans le cadre. */
const rift = useRift();
const video = useTemplateRef<HTMLVideoElement>('video');
const scene = useTemplateRef<HTMLDivElement>('scene');
const cadreEl = useTemplateRef<HTMLDivElement>('cadreEl');
const etat = ref<'attente' | 'demarrage' | 'actif' | 'refus' | 'indispo'>('attente');
const resultats = ref<Candidat[] | null>(null);
const indice = ref<string>('Place une carte dans le cadre');
const torche = ref(false);
const torcheDispo = ref(false);
let flux: MediaStream | null = null;
let minuterie = 0;
let precedent: string | null = null;
const toile = document.createElement('canvas');
const ctx = toile.getContext('2d', { willReadFrequently: true })!;

const CLE_AUTO = 'riftscan:camera';
async function demarrer() {
  if (!navigator.mediaDevices?.getUserMedia) { etat.value = 'indispo'; return; }
  etat.value = 'demarrage';
  try {
    flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    const v = video.value!;
    v.srcObject = flux;
    await v.play();
    etat.value = 'actif';
    try { localStorage.setItem(CLE_AUTO, '1'); } catch { /* rien */ }
    const piste = flux.getVideoTracks()[0];
    torcheDispo.value = !!(piste?.getCapabilities?.() as { torch?: boolean } | undefined)?.torch;
    boucle();
  } catch (e) {
    etat.value = (e as Error).name === 'NotAllowedError' ? 'refus' : 'indispo';
  }
}
function arreter() {
  clearTimeout(minuterie);
  flux?.getTracks().forEach(t => t.stop());
  flux = null;
}
async function basculerTorche() {
  const piste = flux?.getVideoTracks()[0];
  if (!piste) return;
  torche.value = !torche.value;
  await piste.applyConstraints({ advanced: [{ torch: torche.value } as MediaTrackConstraintSet] }).catch(() => { torche.value = false; });
}

/** Zone du cadre de visée dans les pixels de la vidéo (la vidéo est affichée en « cover »). */
function zoneVideo() {
  const v = video.value!, sc = scene.value!.getBoundingClientRect(), cd = cadreEl.value!.getBoundingClientRect();
  const echelle = Math.max(sc.width / v.videoWidth, sc.height / v.videoHeight);
  const ox = (sc.width - v.videoWidth * echelle) / 2, oy = (sc.height - v.videoHeight * echelle) / 2;
  return { x: (cd.left - sc.left - ox) / echelle, y: (cd.top - sc.top - oy) / echelle, l: cd.width / echelle, h: cd.height / echelle };
}

function analyser(): Candidat[] | null {
  const v = video.value;
  const index = rift.donnees?.index;
  if (!v || !index || !v.videoWidth) return null;
  const z = zoneVideo();
  // On capture le cadre + une marge (pour les recadrages de tolérance), réduit à ~240 px de large.
  const marge = 0.12;
  const sx = z.x - z.l * marge, sy = z.y - z.h * marge, sl = z.l * (1 + 2 * marge), sh = z.h * (1 + 2 * marge);
  const k = 240 / z.l;
  toile.width = Math.round(sl * k); toile.height = Math.round(sh * k);
  ctx.drawImage(v, sx, sy, sl, sh, 0, 0, toile.width, toile.height);
  const px = ctx.getImageData(0, 0, toile.width, toile.height);
  return reconnaitre(index, px, { x: z.l * marge * k, y: z.h * marge * k, l: z.l * k, h: z.h * k });
}

function boucle() {
  clearTimeout(minuterie);
  if (etat.value !== 'actif' || resultats.value) return;
  const res = analyser();
  const top = res?.[0];
  if (top && top.score >= SEUIL_SUR) {
    // Deux images de suite d'accord (même carte ou même nom) : c'est la bonne.
    const nom = rift.carte(top.id)?.n.replace(/\s*\(.*?\)/g, '');
    if (precedent === nom) { trouver(res!); return; }
    precedent = nom ?? null;
    indice.value = 'Ne bouge plus…';
  } else {
    precedent = null;
    indice.value = top && top.score >= SEUIL_POSSIBLE ? 'Rapproche la carte pour qu’elle remplisse le cadre' : 'Place une carte dans le cadre';
  }
  minuterie = window.setTimeout(boucle, 280);
}

function trouver(res: Candidat[]) {
  const garde = res.filter(r => r.score >= SEUIL_POSSIBLE);
  resultats.value = garde;
  rift.noterScan(garde[0]!.id);
  navigator.vibrate?.(30);
}
function encore() { resultats.value = null; precedent = null; boucle(); }

// Photo importée (ou appareil sans caméra accessible)
const fichier = useTemplateRef<HTMLInputElement>('fichier');
const analysePhoto = ref(false);
async function photo(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f || !rift.donnees) return;
  analysePhoto.value = true;
  try {
    const img = await createImageBitmap(f);
    const k = Math.min(1, 520 / Math.max(img.width, img.height));
    toile.width = Math.round(img.width * k); toile.height = Math.round(img.height * k);
    ctx.drawImage(img, 0, 0, toile.width, toile.height);
    await new Promise(r => setTimeout(r, 30));
    const res = reconnaitrePhoto(rift.donnees.index, ctx.getImageData(0, 0, toile.width, toile.height));
    if (res[0] && res[0].score >= SEUIL_POSSIBLE) trouver(res);
    else indice.value = 'Carte non reconnue sur la photo : cadre-la de plus près, à plat et bien éclairée.';
  } finally {
    analysePhoto.value = false;
    if (fichier.value) fichier.value.value = '';
  }
}

onMounted(() => { try { if (localStorage.getItem(CLE_AUTO)) demarrer(); } catch { /* rien */ } });
onBeforeUnmount(arreter);
document.addEventListener('visibilitychange', visibilite);
onBeforeUnmount(() => document.removeEventListener('visibilitychange', visibilite));
function visibilite() {
  if (document.visibilityState === 'hidden' && flux) { arreter(); etat.value = 'attente'; }
}
</script>

<template>
  <div class="scanner">
    <div ref="scene" class="scene">
      <video ref="video" class="video" playsinline muted :class="{ visible: etat === 'actif' }" />

      <div v-if="etat !== 'actif'" class="accueil">
        <div class="logo" aria-hidden="true"><Icone nom="scan" :taille="34" /></div>
        <p class="kicker">Riftbound · League of Legends</p>
        <h1 class="titre">Scanne une carte,<br><span class="or">découvre sa valeur</span></h1>
        <p class="muted small">Prix du marché TCGplayer mis à jour chaque jour, convertis en euros.</p>
        <p v-if="etat === 'refus'" class="alerte small">Accès à la caméra refusé. Autorise-le dans les réglages du navigateur, ou importe une photo.</p>
        <p v-if="etat === 'indispo'" class="alerte small">Caméra indisponible sur cet appareil. Tu peux importer une photo de la carte.</p>
        <p v-if="rift.erreur" class="alerte small">{{ rift.erreur }}</p>
        <div class="actions">
          <button type="button" class="btn or plein" :disabled="etat === 'demarrage' || !rift.donnees" @click="demarrer">
            <Icone nom="camera" /> {{ !rift.donnees ? 'Chargement des cartes…' : etat === 'demarrage' ? 'Ouverture…' : 'Activer la caméra' }}
          </button>
          <button type="button" class="btn plein" :disabled="!rift.donnees || analysePhoto" @click="fichier?.click()"><Icone nom="photo" /> {{ analysePhoto ? 'Analyse…' : 'Importer une photo' }}</button>
        </div>
      </div>

      <div class="viseur" :class="{ cache: etat !== 'actif' }" aria-hidden="true">
        <div ref="cadreEl" class="cadre" :class="{ ok: indice === 'Ne bouge plus…' }"><i /><i /><i /><i /></div>
      </div>
      <template v-if="etat === 'actif'">
        <p class="indice" role="status">{{ indice }}</p>
        <div class="outils">
          <button v-if="torcheDispo" type="button" class="icone-btn" :class="{ allume: torche }" :aria-pressed="torche" aria-label="Lampe" @click="basculerTorche"><Icone nom="flash" /></button>
          <button type="button" class="icone-btn" aria-label="Importer une photo" @click="fichier?.click()"><Icone nom="photo" /></button>
        </div>
      </template>
    </div>
    <input ref="fichier" type="file" accept="image/*" class="sr-only" tabindex="-1" @change="photo">

    <transition name="monte">
      <div v-if="resultats" class="feuille" role="dialog" aria-modal="true" aria-label="Carte reconnue">
        <CarteResultat :candidats="resultats" @fermer="encore" />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.scanner { position: fixed; inset: 0; overflow: hidden; }
.scene { position: absolute; inset: 0; background: #000; }
.video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s; }
.video.visible { opacity: 1; }
.accueil {
  position: absolute; inset: 0; z-index: 2; display: grid; align-content: center; justify-items: center; gap: 4px; text-align: center;
  padding: calc(24px + var(--safe-t)) 24px calc(var(--tab-h) + var(--safe-b) + 30px);
  background:
    radial-gradient(70% 45% at 50% 30%, rgba(10, 200, 185, 0.22), transparent 70%),
    radial-gradient(60% 40% at 50% 80%, rgba(200, 170, 110, 0.14), transparent 70%), var(--bg);
}
.logo {
  width: 86px; height: 86px; display: grid; place-items: center; border-radius: 26px; margin-bottom: 14px; color: #1b1407;
  background: var(--or-grad); box-shadow: 0 0 0 6px rgba(200, 170, 110, 0.12), 0 20px 50px -10px rgba(240, 212, 138, 0.55);
}
.accueil .titre { font-size: 32px; }
.actions { width: min(360px, 100%); display: grid; gap: 10px; margin-top: 22px; }
.alerte { margin: 10px 0 0; padding: 10px 14px; border-radius: 12px; background: rgba(255, 107, 107, 0.12); color: #ffc2c2; max-width: 380px; }
.viseur { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; padding-bottom: calc(var(--tab-h) + var(--safe-b) + 40px); }
.viseur.cache { visibility: hidden; }
.cadre {
  position: relative; width: min(70vw, calc((100dvh - 260px) * 63 / 88), 380px); aspect-ratio: 63 / 88; border-radius: 4.5% / 3.2%;
  box-shadow: 0 0 0 200vmax rgba(3, 6, 14, 0.55); transition: box-shadow 0.3s;
}
.cadre i { position: absolute; width: 34px; height: 34px; border: 4px solid var(--or-vif); filter: drop-shadow(0 0 8px rgba(240, 212, 138, 0.6)); transition: border-color 0.25s; }
.cadre i:nth-child(1) { top: -3px; left: -3px; border-right: 0; border-bottom: 0; border-top-left-radius: 16px; }
.cadre i:nth-child(2) { top: -3px; right: -3px; border-left: 0; border-bottom: 0; border-top-right-radius: 16px; }
.cadre i:nth-child(3) { bottom: -3px; left: -3px; border-right: 0; border-top: 0; border-bottom-left-radius: 16px; }
.cadre i:nth-child(4) { bottom: -3px; right: -3px; border-left: 0; border-top: 0; border-bottom-right-radius: 16px; }
.cadre.ok i { border-color: var(--cyan-vif); filter: drop-shadow(0 0 12px rgba(95, 240, 227, 0.8)); }
.indice {
  position: absolute; left: 50%; transform: translateX(-50%); top: calc(18px + var(--safe-t)); margin: 0; z-index: 3;
  padding: 10px 16px; border-radius: 999px; background: rgba(6, 10, 20, 0.78); backdrop-filter: blur(10px);
  border: 1px solid var(--border); font-weight: 800; font-size: 14px; white-space: nowrap; max-width: calc(100% - 32px); overflow: hidden; text-overflow: ellipsis;
}
.outils { position: absolute; right: 16px; bottom: calc(var(--tab-h) + var(--safe-b) + 26px); z-index: 3; display: grid; gap: 10px; }
.icone-btn.allume { background: var(--or-grad); color: #1b1407; }
.feuille {
  position: absolute; left: 0; right: 0; bottom: 0; z-index: 60; max-height: 88dvh; overflow-y: auto;
  padding: 18px 16px calc(18px + var(--safe-b)); border-radius: 26px 26px 0 0;
  background: linear-gradient(180deg, #152038, var(--bg-2) 30%); border-top: 1px solid var(--border-2); box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.6);
}
.monte-enter-active, .monte-leave-active { transition: transform 0.28s cubic-bezier(.2, .9, .3, 1.1), opacity 0.2s; }
.monte-enter-from, .monte-leave-to { transform: translateY(100%); opacity: 0.4; }
</style>
