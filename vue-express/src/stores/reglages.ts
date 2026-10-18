import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type Theme = 'auto' | 'clair' | 'sombre';
const KEY = 'vue-express:reglages';

export const useReglagesStore = defineStore('reglages', () => {
  let lu: { theme?: Theme; taillePolice?: number } = {};
  try { lu = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* défaut */ }
  const theme = ref<Theme>(lu.theme ?? 'auto');
  const taillePolice = ref(lu.taillePolice ?? 14);
  watch([theme, taillePolice], () => {
    try { localStorage.setItem(KEY, JSON.stringify({ theme: theme.value, taillePolice: taillePolice.value })); } catch { /* ignoré */ }
  });
  return { theme, taillePolice };
});
