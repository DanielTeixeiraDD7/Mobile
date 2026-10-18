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
    name: 'autoradar-sw',
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
        .replace('__VERSION__', 'autoradar-' + hash.digest('hex').slice(0, 10))
        .replace('__ASSETS__', JSON.stringify([...new Set(assets)]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    // Routage par fichiers (pages/annonces/_ID.vue → /annonces/:ID).
    Pages({ dirs: 'src/pages', routeStyle: 'nuxt', exclude: ['**/components/**'] }),
    AutoImport({ imports: ['vue', 'vue-router', 'pinia'], dts: 'src/auto-imports.d.ts', vueTemplate: true }),
    serviceWorker(),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir: '../auto', emptyOutDir: true, target: 'es2022',
    // GitHub Pages (Jekyll) ignore les fichiers commençant par « _ ».
    rollupOptions: {
      output: {
        chunkFileNames: c => `assets/${c.name.replace(/^_+/, '')}-[hash].js`,
        assetFileNames: a => `assets/${(a.names?.[0] ?? 'asset').replace(/^_+/, '').replace(/\.[^.]+$/, '')}-[hash][extname]`,
      },
    },
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'], setupFiles: ['tests/setup.ts'] },
});
