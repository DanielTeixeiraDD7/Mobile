<script setup lang="ts">
/** Pastille ronde avec l'initiale du pseudo, dans la couleur choisie par la personne. */
const props = withDefaults(defineProps<{ pseudo: string; couleur?: string; taille?: number }>(), { couleur: '#ff4d6d', taille: 40 });
const initiale = computed(() => (props.pseudo.trim()[0] ?? '?').toUpperCase());
const sure = computed(() => (/^#[0-9a-fA-F]{6}$/.test(props.couleur) ? props.couleur : '#ff4d6d'));
</script>

<template>
  <span class="avatar" :style="{ width: taille + 'px', height: taille + 'px', fontSize: taille * 0.44 + 'px', background: `linear-gradient(140deg, ${sure}, color-mix(in srgb, ${sure} 55%, #000))` }" aria-hidden="true">{{ initiale }}</span>
</template>

<style scoped>
.avatar { flex: none; display: grid; place-items: center; border-radius: 50%; color: #fff; font-weight: 850; letter-spacing: -.02em; box-shadow: inset 0 1px 0 rgba(255,255,255,.25); }
</style>
