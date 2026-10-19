<script setup lang="ts">
/** Feuille du bas (mobile) / fenêtre centrée (bureau). Glisser la poignée vers le bas pour fermer. */
const ouvert = defineModel<boolean>({ required: true });
defineProps<{ titre?: string }>();

const panneau = useTemplateRef<HTMLElement>('panneau');
const decalage = ref(0);
let depart: number | null = null;

function debut(e: PointerEvent) { depart = e.clientY; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }
function bouge(e: PointerEvent) { if (depart != null) decalage.value = Math.max(0, e.clientY - depart); }
function fin() {
  if (depart == null) return;
  if (decalage.value > 110) ouvert.value = false;
  decalage.value = 0;
  depart = null;
}
function touche(e: KeyboardEvent) { if (e.key === 'Escape') ouvert.value = false; }
watch(ouvert, v => {
  document.documentElement.classList.toggle('feuille-ouverte', v);
  if (v) { window.addEventListener('keydown', touche); nextTick(() => panneau.value?.focus()); }
  else window.removeEventListener('keydown', touche);
});
onBeforeUnmount(() => { window.removeEventListener('keydown', touche); document.documentElement.classList.remove('feuille-ouverte'); });
</script>

<template>
  <Teleport to="body">
    <transition name="feuille">
      <div v-if="ouvert" class="voile" @click.self="ouvert = false">
        <section ref="panneau" class="panneau" role="dialog" aria-modal="true" :aria-label="titre" tabindex="-1"
          :style="decalage ? { transform: `translateY(${decalage}px)`, transition: 'none' } : undefined">
          <header class="tete" @pointerdown="debut" @pointermove="bouge" @pointerup="fin" @pointercancel="fin">
            <i class="poignee" />
            <h2 v-if="titre">{{ titre }}</h2>
          </header>
          <div class="corps"><slot /></div>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.voile { position: fixed; inset: 0; z-index: 80; background: rgba(5, 10, 8, .45); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); display: flex; align-items: flex-end; justify-content: center; }
.panneau { width: 100%; max-width: 560px; max-height: 92dvh; display: flex; flex-direction: column; background: var(--surface); border-radius: 26px 26px 0 0; box-shadow: var(--shadow-lg); outline: none; transition: transform .3s var(--ease); }
.tete { padding: 8px 20px 2px; touch-action: none; cursor: grab; }
.poignee { display: block; width: 42px; height: 5px; border-radius: 3px; background: var(--surface-3); margin: 0 auto 10px; }
.tete h2 { margin: 2px 0 6px; font-size: 21px; letter-spacing: -.02em; }
.corps { overflow-y: auto; padding: 4px 18px calc(16px + var(--safe-b)); overscroll-behavior: contain; }
.feuille-enter-active, .feuille-leave-active { transition: opacity .25s ease; }
.feuille-enter-active .panneau, .feuille-leave-active .panneau { transition: transform .32s var(--ease); }
.feuille-enter-from, .feuille-leave-to { opacity: 0; }
.feuille-enter-from .panneau, .feuille-leave-to .panneau { transform: translateY(100%); }
@media (min-width: 992px) {
  .voile { align-items: center; }
  .panneau { border-radius: 26px; max-height: 86dvh; }
  .feuille-enter-from .panneau, .feuille-leave-to .panneau { transform: translateY(30px) scale(.97); }
}
</style>
