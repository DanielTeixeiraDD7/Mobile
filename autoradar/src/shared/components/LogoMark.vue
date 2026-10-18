<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 40 });
</script>

<template>
  <span class="logo" :style="{ width: size + 'px', height: size + 'px' }" aria-hidden="true">
    <svg viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="15" stroke="#fff" stroke-opacity=".35" stroke-width="2" />
      <circle cx="24" cy="24" r="8" stroke="#fff" stroke-opacity=".55" stroke-width="2" />
      <path d="M24 24 L37 15 A15 15 0 0 1 39 24 Z" fill="#a3e635" fill-opacity=".9" />
      <circle cx="24" cy="24" r="2.6" fill="#fff" />
      <circle cx="33" cy="30" r="2.2" fill="#22d3ee" />
    </svg>
  </span>
</template>

<style scoped>
.logo { display: grid; place-items: center; flex: none; border-radius: 30%; background: linear-gradient(140deg, #5e8bff 0%, #2450f5 50%, #0b1736 100%); box-shadow: 0 6px 18px rgba(36, 80, 245, .35); }
.logo svg { width: 78%; height: 78%; }
</style>
