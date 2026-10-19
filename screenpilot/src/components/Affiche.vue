<script setup lang="ts">
/** Affiche (2:3) avec repli : couleur dominante + initiales si l'image manque ou ne charge pas. */
const props = withDefaults(defineProps<{ src: string | null; titre: string; couleur?: string | null; largeur?: number; rayon?: number }>(), { couleur: null, largeur: 64, rayon: 12 });
const echec = ref(false);
watch(() => props.src, () => { echec.value = false; });
const initiales = computed(() => props.titre.split(/\s+/).filter(Boolean).slice(0, 2).map(m => m[0]).join('').toUpperCase());
</script>

<template>
  <div class="affiche" :style="{ width: largeur + 'px', borderRadius: rayon + 'px', background: couleur ?? undefined }">
    <img v-if="src && !echec" :src="src" :alt="''" loading="lazy" decoding="async" referrerpolicy="no-referrer" @error="echec = true">
    <span v-else class="ini" :style="{ fontSize: Math.max(12, largeur / 4) + 'px' }">{{ initiales }}</span>
    <slot />
  </div>
</template>

<style scoped>
.affiche { position: relative; flex: none; aspect-ratio: 2 / 3; overflow: hidden; background: linear-gradient(160deg, var(--surface-3), var(--surface-2)); box-shadow: 0 6px 18px -10px rgba(0, 0, 0, .6); }
img { width: 100%; height: 100%; object-fit: cover; }
.ini { position: absolute; inset: 0; display: grid; place-items: center; font-weight: 800; color: rgba(255, 255, 255, .85); letter-spacing: .02em; text-shadow: 0 1px 6px rgba(0, 0, 0, .35); }
</style>
