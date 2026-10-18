import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

// Thème Aura aux couleurs de Vue (partagé par l'app et l'aperçu des exercices).
export const VueVert = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eefbf5', 100: '#d5f5e6', 200: '#aeead1', 300: '#79d9b5', 400: '#56c79b',
      500: '#42b883', 600: '#2f9a6c', 700: '#287b58', 800: '#246248', 900: '#1f513d', 950: '#0f2e22',
    },
  },
});

export const PRIMEVUE_CONFIG = { theme: { preset: VueVert, options: { darkModeSelector: '.app-dark', cssLayer: false } }, ripple: true };
