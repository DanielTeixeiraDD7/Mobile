import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

// Aura recoloré : bleu « électrique ».
export const Electrique = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eef4ff', 100: '#dbe6ff', 200: '#bed2ff', 300: '#91b4ff', 400: '#5e8bff',
      500: '#3b6bff', 600: '#2450f5', 700: '#1c3fe0', 800: '#1d35b5', 900: '#1e338f', 950: '#161f57',
    },
  },
});

export const PRIMEVUE_CONFIG = { theme: { preset: Electrique, options: { darkModeSelector: '.app-dark', cssLayer: false } }, ripple: true };
