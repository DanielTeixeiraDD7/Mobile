import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** Service worker généré au build : liste exacte des fichiers, version dérivée du contenu. */
function serviceWorker(): Plugin {
  return {
    name: 'nocturne-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(f => !f.endsWith('.map') && !/\.(ttf|woff)$/.test(f));
      const hash = createHash('sha256');
      for (const f of [...files].sort()) {
        const it = bundle[f]!;
        hash.update(f).update(it.type === 'chunk' ? it.code : String(it.source));
      }
      const assets = ['./', ...files, 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
      const source = readFileSync('src/sw/sw.js', 'utf8')
        .replace('__VERSION__', 'nocturne-' + hash.digest('hex').slice(0, 10))
        .replace('__ASSETS__', JSON.stringify([...new Set(assets)]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [vue(), serviceWorker()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { proxy: { '/api': 'http://localhost:3000' } },
  build: {
    outDir: mode === 'demo' ? '../../nocturne' : 'dist',
    emptyOutDir: true,
    target: 'es2022',
    // GitHub Pages (Jekyll) ignore les fichiers commençant par « _ ».
    rollupOptions: {
      output: {
        chunkFileNames: c => `assets/${c.name.replace(/^_+/, '')}-[hash].js`,
        assetFileNames: a => `assets/${(a.names?.[0] ?? 'asset').replace(/^_+/, '').replace(/\.[^.]+$/, '')}-[hash][extname]`,
      },
    },
  },
  test: { environment: 'jsdom', include: ['tests/**/*.test.ts'], setupFiles: ['tests/setup.ts'] },
}));
