// jsdom : APIs absentes utilisées par PrimeVue.
if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false })) as typeof window.matchMedia;
}
if (!globalThis.structuredClone) globalThis.structuredClone = (v: unknown) => JSON.parse(JSON.stringify(v));
import 'fake-indexeddb/auto';
