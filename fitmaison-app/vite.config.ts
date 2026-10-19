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
    name: 'fitmaison-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(f => !f.endsWith('.map'));
      const hash = createHash('sha256');
      for (const f of files.sort()) {
        const it = bundle[f]!;
        hash.update(f).update(it.type === 'chunk' ? it.code : String(it.source));
      }
      const assets = ['./', ...files, 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
      const source = readFileSync('src/sw/sw.js', 'utf8')
        .replace('__VERSION__', 'fitmaison-' + hash.digest('hex').slice(0, 10))
        .replace('__ASSETS__', JSON.stringify([...new Set(assets)]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    Pages({ dirs: 'src/pages', routeStyle: 'nuxt', exclude: ['**/components/**'] }),
    AutoImport({ imports: ['vue', 'vue-router', 'pinia'], dts: 'src/auto-imports.d.ts', vueTemplate: true }),
    serviceWorker(),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    // Racine du dépôt (voir scripts/nettoyer.mjs) : surtout ne pas vider le dossier.
    outDir: '..', emptyOutDir: false, target: 'es2022',
    rollupOptions: {
      output: {
        chunkFileNames: c => `assets/${c.name.replace(/^_+/, '')}-[hash].js`,
        assetFileNames: a => `assets/${(a.names?.[0] ?? 'asset').replace(/^_+/, '').replace(/\.[^.]+$/, '')}-[hash][extname]`,
      },
    },
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'] },
});
