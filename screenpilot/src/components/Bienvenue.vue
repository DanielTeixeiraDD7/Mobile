<script setup lang="ts">
import * as store from '@/data/store';
import { TYPE_LABELS } from '@/domain/labels';
import { MEDIA_TYPES } from '@/domain/types';
import Icone from './Icone.vue';

/** Présentation au premier lancement (bibliothèque vide). */
const router = useRouter();
const ETAPES = [
  { icone: 'ecran', titre: 'Tout ce que tu regardes, au même endroit', texte: 'Films, séries, anime et manga. Un appui sur + à chaque épisode ou chapitre, et tout s’annule.' },
  { icone: 'sablier', titre: 'Ton temps d’écran', texte: 'ScreenPilot estime le temps passé devant ce que tu regardes : par jour, semaine et mois, par catégorie.' },
  { icone: 'cadenas', titre: 'Privé, gratuit, hors-ligne', texte: 'Pas de compte, pas de pub. Tes données restent sur ce téléphone ; Internet sert seulement à chercher des titres.' },
];
const etape = ref(0);
const fin = computed(() => etape.value === ETAPES.length - 1);
async function terminer(vers: string) {
  await store.updateSettings({ onboarded: true });
  router.replace(vers);
}
</script>

<template>
  <main class="bienvenue">
    <div class="halo" aria-hidden="true" />
    <div class="cats" aria-hidden="true">
      <span v-for="t in MEDIA_TYPES" :key="t" :style="{ color: TYPE_LABELS[t].couleur, background: `color-mix(in srgb, ${TYPE_LABELS[t].couleur} 16%, transparent)` }">
        <Icone :nom="TYPE_LABELS[t].icone" :taille="26" />
      </span>
    </div>
    <transition name="fade" mode="out-in">
      <section :key="etape" class="etape" aria-live="polite">
        <span class="ic"><Icone :nom="ETAPES[etape]!.icone" :taille="30" /></span>
        <h1>{{ ETAPES[etape]!.titre }}</h1>
        <p>{{ ETAPES[etape]!.texte }}</p>
      </section>
    </transition>
    <div class="points" aria-hidden="true"><i v-for="(_, i) in ETAPES" :key="i" :class="{ on: i === etape }" /></div>
    <div class="actions">
      <template v-if="!fin">
        <button type="button" class="btn primary full" @click="etape++">Continuer</button>
        <button type="button" class="btn ghost full" @click="etape = ETAPES.length - 1">Passer</button>
      </template>
      <template v-else>
        <button type="button" class="btn primary full" @click="terminer('/recherche')"><Icone nom="recherche" :taille="18" /> Ajouter mon premier titre</button>
        <button type="button" class="btn full" @click="terminer('/donnees')">Importer une sauvegarde</button>
        <button type="button" class="btn ghost full" @click="terminer('/')">Plus tard</button>
      </template>
    </div>
  </main>
</template>

<style scoped>
.bienvenue { position: relative; min-height: 100dvh; max-width: 480px; margin: 0 auto; padding: calc(var(--safe-t) + 48px) 24px calc(var(--safe-b) + 24px); display: flex; flex-direction: column; overflow: hidden; }
.halo { position: absolute; top: -160px; left: 50%; width: 520px; height: 420px; transform: translateX(-50%); background: radial-gradient(closest-side, color-mix(in srgb, var(--brand) 40%, transparent), transparent); filter: blur(30px); pointer-events: none; }
.cats { position: relative; display: flex; justify-content: center; gap: 12px; margin-bottom: 40px; }
.cats span { width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center; }
.cats span:nth-child(even) { transform: translateY(14px); }
.etape { position: relative; flex: 1; }
.ic { width: 62px; height: 62px; border-radius: 20px; display: grid; place-items: center; color: #fff; background: var(--brand-grad); box-shadow: 0 16px 34px -14px var(--brand); }
h1 { font-size: 30px; line-height: 1.12; letter-spacing: -.035em; margin: 22px 0 12px; }
p { font-size: 17px; color: var(--muted); margin: 0; }
.points { display: flex; gap: 6px; justify-content: center; margin: 24px 0; }
.points i { width: 7px; height: 7px; border-radius: 4px; background: var(--surface-3); transition: width .3s var(--ease), background .3s; }
.points i.on { width: 22px; background: var(--brand); }
.actions { display: grid; gap: 8px; }
</style>
