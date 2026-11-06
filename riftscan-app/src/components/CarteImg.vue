<script setup lang="ts">
/** Image d'une carte (TCGplayer) ; si elle est absente, une carte de remplacement avec le nom. */
const props = withDefaults(defineProps<{ src: string; nom: string; taille?: '200w' | '400w' | 'in_1000x1000'; decor?: boolean }>(), { taille: '200w', decor: false });
const erreur = ref(false);
const url = computed(() => props.src.replace('_200w', `_${props.taille}`));
watch(() => props.src, () => { erreur.value = false; });
</script>

<template>
  <img v-if="!erreur" :src="url" :alt="decor ? '' : nom" loading="lazy" decoding="async" @error="erreur = true">
  <span v-else class="sans-image" role="img" :aria-label="decor ? undefined : nom"><span>{{ nom.replace(/\s*\(.*?\)/g, '') }}</span></span>
</template>

<style scoped>
.sans-image {
  display: grid; place-items: center; aspect-ratio: 63 / 88; padding: 6px; text-align: center; overflow: hidden;
  background: linear-gradient(160deg, #1d2a47, #0b1222); border: 1px solid var(--border-2); color: var(--or); font-weight: 800; font-size: 11px; line-height: 1.2;
}
</style>
