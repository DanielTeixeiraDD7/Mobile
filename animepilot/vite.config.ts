import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Génère sw.js après le build : liste des fichiers à mettre en cache + version
// dérivée de leur contenu (chaque build différent = nouveau cache).
function serviceWorker(): Plugin {
  return {
    name: 'animepilot-sw',
    apply: 'build',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(f => !f.endsWith('.map'));
      const hash = createHash('sha256');
      for (const f of files.sort()) {
        const item = bundle[f]!;
        hash.update(f).update(item.type === 'chunk' ? item.code : String(item.source));
      }
      const assets = ['./', ...files, 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
      const source = readFileSync('src/sw/sw.js', 'utf8')
        .replace('__VERSION__', 'animepilot-' + hash.digest('hex').slice(0, 10))
        .replace('__ASSETS__', JSON.stringify([...new Set(assets)]));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), serviceWorker()],
  build: { outDir: '../anime', emptyOutDir: true, target: 'es2022', sourcemap: false },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
