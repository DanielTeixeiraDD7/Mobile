<script setup lang="ts">
import { useToasts, fermerToast } from '@/composables/useToast';
import Icone from './Icone.vue';
const toasts = useToasts();
function agir(id: number, f?: () => void) { fermerToast(id); f?.(); }
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <transition-group name="toast">
      <div v-for="t in toasts" :key="t.id" class="toast" :class="t.type">
        <Icone v-if="t.type === 'warn' || t.type === 'danger'" nom="alerte" :taille="18" />
        <Icone v-else-if="t.type === 'ok'" nom="check" :taille="18" />
        <span class="grow">{{ t.texte }}</span>
        <button v-if="t.action" type="button" @click="agir(t.id, t.onAction)">{{ t.action }}</button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toasts { position: fixed; z-index: 90; left: 50%; transform: translateX(-50%); bottom: calc(var(--tab-h) + var(--safe-b) + 18px); width: min(440px, calc(100vw - 28px)); display: grid; gap: 8px; pointer-events: none; }
.toast { pointer-events: auto; display: flex; align-items: center; gap: 10px; padding: 13px 14px 13px 16px; border-radius: 18px; background: #0f1a14; color: #f2f7f3; border: 1px solid rgba(255,255,255,.08); box-shadow: 0 18px 44px -12px rgba(0,0,0,.55); font-size: 15px; font-weight: 700; }
.dark .toast { background: #1d2a23; }
.toast.ok { box-shadow: inset 4px 0 0 #c5f23b, 0 18px 44px -12px rgba(0,0,0,.55); }
.toast.warn :deep(.ic) { color: #fbbf24; } .toast.danger :deep(.ic) { color: #ff7b80; } .toast.ok :deep(.ic) { color: #c5f23b; }
.toast button { border: 0; background: rgba(255,255,255,.12); color: #c5f23b; font-weight: 800; padding: 7px 12px; border-radius: 10px; }
.toast-enter-active, .toast-leave-active { transition: all .3s var(--ease); }
.toast-enter-active { transition: all .38s var(--ease-spring); }
.toast-enter-from { opacity: 0; transform: translateY(18px) scale(.94); }
.toast-leave-to { opacity: 0; transform: translateY(8px); }
@media (min-width: 992px) { .toasts { bottom: 28px; } }
</style>
