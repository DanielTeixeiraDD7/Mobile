import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import Pages from 'vite-plugin-pages';
import AutoImport from 'unplugin-auto-import/vite';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, URL } from 'node:url';

// Service worker généré au build : liste exacte des fichiers + version dérivée du contenu.
function serviceWorker(): Plugin {
  return {
    name: 'vue-express-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(f => !f.endsWith('.map'));
      // Polices d'icônes : seul le woff2 sert aux navigateurs actuels.
      const precache = files.filter(f => !/primeicons-.*\.(eot|ttf|woff|svg)$/.test(f));
      const hash = createHash('sha256');
      for (const f of files.sort()) {
        const it = bundle[f]!;
        hash.update(f).update(it.type === 'chunk' ? it.code : String(it.source));
      }
      const assets = ['./', ...precache, 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
      const source = readFileSync('src/sw/sw.js', 'utf8')
        .replace('__VERSION__', 'vue-express-' + hash.digest('hex').slice(0, 10))
        .replace('__ASSETS__', JSON.stringify([...new Set(assets)]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

const isTest = !!process.env.VITEST;

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    // Routage par fichiers, convention « _ID.vue » → /:ID (comme au travail).
    Pages({ dirs: 'src/pages', routeStyle: 'nuxt', exclude: ['**/components/**'] }),
    // ref, computed, watch… disponibles sans import (comme au travail).
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', { 'vue-i18n': ['useI18n'] }],
      dts: 'src/auto-imports.d.ts',
      vueTemplate: true,
    }),
    serviceWorker(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Compilateur de composants .vue dans le navigateur (build ESM navigateur).
      ...(isTest ? {} : { '@vue/compiler-sfc': fileURLToPath(new URL('./node_modules/@vue/compiler-sfc/dist/compiler-sfc.esm-browser.js', import.meta.url)) }),
    },
  },
  build: { outDir: '../vue', emptyOutDir: true, target: 'es2022', chunkSizeWarningLimit: 2500 },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 20_000,
  },
});
