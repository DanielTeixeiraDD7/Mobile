import * as Vue from 'vue';
import * as VueRouter from 'vue-router';
import * as Pinia from 'pinia';
import { createI18n } from 'vue-i18n';
import * as VueI18n from 'vue-i18n';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Toast from 'primevue/toast';
import Drawer from 'primevue/drawer';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import Tag from 'primevue/tag';
import Select from 'primevue/select';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { compileFile, CompileError, type CompiledFile } from './compile';
import { FakeServer } from './fakeApi';
import { scopeCss } from './scopeCss';

export type Files = Record<string, string>;

export interface RunOptions {
  entry?: string;
  api?: FakeServer;
  /** Traductions disponibles via $t() / useI18n(). */
  messages?: Record<string, string>;
  initialRoute?: string;
  /** Configuration PrimeVue (thème) : l'aperçu reprend celle de l'application. */
  primevue?: Record<string, unknown>;
}

export interface Running {
  app: Vue.App;
  root: HTMLElement;
  router: VueRouter.Router | null;
  pinia: Pinia.Pinia;
  api: FakeServer;
  errors: string[];
  warnings: string[];
  /** Largeur d'écran simulée (window.innerWidth vu par l'exercice) + événement resize. */
  resize(width: number): void;
  /** Nœuds ajoutés dans <body> par l'exercice (toasts, dialogues, panneaux téléportés). */
  portals(): HTMLElement[];
  unmount(): void;
}

const BUILTINS: Record<string, unknown> = {
  vue: Vue,
  'vue-router': VueRouter,
  pinia: Pinia,
  'vue-i18n': VueI18n,
  'primevue/usetoast': { useToast },
  'primevue/useconfirm': { useConfirm },
};

/** Résolution d'un import relatif / « @/ » vers un fichier de l'exercice. */
export function resolvePath(spec: string, from: string, files: Files): string | null {
  let base: string;
  if (spec.startsWith('@/')) base = spec.slice(2);
  else if (spec.startsWith('.')) {
    const parts = from.split('/').slice(0, -1);
    for (const seg of spec.split('/')) {
      if (seg === '..') parts.pop();
      else if (seg !== '.') parts.push(seg);
    }
    base = parts.join('/');
  } else return null;
  for (const c of [base, `${base}.js`, `${base}.vue`, `${base}/index.js`, `${base}/index.vue`]) if (c in files) return c;
  return null;
}

/** Routes générées depuis pages/ (convention : index.vue → /, _ID.vue → /:ID). */
export function pagesToRoutes(files: string[]): { path: string; file: string }[] {
  return files
    .filter(f => f.startsWith('pages/') && f.endsWith('.vue') && !f.includes('/components/'))
    .map(f => {
      const segs = f.slice('pages/'.length, -'.vue'.length).split('/');
      if (segs[segs.length - 1] === 'index') segs.pop();
      const path = '/' + segs.map(s => (s.startsWith('_') ? ':' + s.slice(1) : s)).join('/');
      return { path, file: f };
    })
    // Les chemins statiques passent avant les paramètres.
    .sort((a, b) => a.path.split('/').filter(s => s.startsWith(':')).length - b.path.split('/').filter(s => s.startsWith(':')).length);
}

export function buildModules(files: Files) {
  const compiled = new Map<string, CompiledFile>();
  for (const [name, src] of Object.entries(files)) {
    if (name.endsWith('.vue') || name.endsWith('.js')) compiled.set(name, compileFile(name, src));
  }
  return compiled;
}

/**
 * Compile et monte un mini-projet Vue dans `container`.
 * Chaque exécution est isolée : nouvelle app, nouveau Pinia, nouveau routeur, nouveau serveur fictif.
 */
export async function runProject(files: Files, container: HTMLElement, o: RunOptions = {}): Promise<Running> {
  const compiled = buildModules(files); // lève CompileError
  const api = o.api ?? new FakeServer();
  const apiModule = api.module();
  const cache = new Map<string, Record<string, unknown>>();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Bac à sable : écouteurs window et minuteurs créés par l'exercice, nettoyés à la fin de l'exécution
  // (les fuites restent visibles PENDANT l'exécution, mais ne polluent ni l'app ni l'exécution suivante).
  // Écran virtuel : l'exercice voit la largeur de l'aperçu, pas celle de l'application,
  // et ses écouteurs « resize » ne reçoivent que les redimensionnements simulés.
  let largeurEcran = container.clientWidth || window.innerWidth;
  const ecoutesResize = new Set<EventListenerOrEventListenerObject>();
  const listeners: [string, EventListenerOrEventListenerObject, boolean | AddEventListenerOptions | undefined, EventListenerOrEventListenerObject][] = [];
  // Clavier : les frappes dans l'éditeur de l'app ne doivent pas piloter l'aperçu.
  const clavier = (f: EventListenerOrEventListenerObject): EventListener => (e: Event) => {
    const t = e.target;
    if (t instanceof Node && t !== document.body && t !== document.documentElement && !container.contains(t)) return;
    if (typeof f === 'function') f.call(sandboxWindow, e); else f.handleEvent(e);
  };
  const timers = new Set<number>();
  const sandboxWindow = new Proxy(window, {
    get(target, prop) {
      if (prop === 'innerWidth') return largeurEcran;
      if (prop === 'addEventListener') return (t: string, f: EventListenerOrEventListenerObject, o?: boolean | AddEventListenerOptions) => {
        if (t === 'resize') { ecoutesResize.add(f); return; }
        const reel = t.startsWith('key') ? clavier(f) : f;
        listeners.push([t, f, o, reel]);
        target.addEventListener(t, reel, o);
      };
      if (prop === 'removeEventListener') return (t: string, f: EventListenerOrEventListenerObject, o?: boolean | EventListenerOptions) => {
        if (t === 'resize') { ecoutesResize.delete(f); return; }
        const i = listeners.findIndex(l => l[0] === t && l[1] === f);
        const reel = i >= 0 ? listeners[i]![3] : f;
        if (i >= 0) listeners.splice(i, 1);
        target.removeEventListener(t, reel, o);
      };
      const v = Reflect.get(target, prop);
      return typeof v === 'function' && !/^[A-Z]/.test(String(prop)) ? v.bind(target) : v;
    },
    set(target, prop, value) { return Reflect.set(target, prop, value); },
  });
  const sbSetTimeout = (f: () => void, ms?: number, ...a: unknown[]) => { const id = window.setTimeout(() => { timers.delete(id); (f as (...x: unknown[]) => void)(...a); }, ms); timers.add(id); return id; };
  const sbSetInterval = (f: () => void, ms?: number, ...a: unknown[]) => { const id = window.setInterval(f, ms, ...a); timers.add(id); return id; };
  const sbClear = (id: number | undefined | null) => { if (id != null) { window.clearTimeout(id); window.clearInterval(id); timers.delete(id); } };

  const load = (file: string): Record<string, unknown> => {
    const hit = cache.get(file);
    if (hit) return hit;
    const mod: Record<string, unknown> = {};
    cache.set(file, mod);
    const c = compiled.get(file)!;
    const req = (spec: string) => {
      if (spec in BUILTINS) return BUILTINS[spec];
      const p = resolvePath(spec, file, files);
      if (p) return load(p);
      if (spec === '@/lib/api' || spec.endsWith('/lib/api') || spec.endsWith('/lib/api.js')) return apiModule;
      throw new CompileError(file, `Import introuvable : « ${spec} ».`);
    };
    try {
      new Function('__req', '__exports', 'window', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', c.code)
        (req, mod, sandboxWindow, sbSetTimeout, sbSetInterval, sbClear, sbClear);
    } catch (e) {
      if (e instanceof CompileError) throw e;
      throw new CompileError(file, `Erreur à l'exécution du module : ${(e as Error).message}`);
    }
    return mod;
  };

  const entry = o.entry ?? 'App.vue';
  if (!(entry in files)) throw new CompileError(entry, 'Fichier principal introuvable.');
  const App = load(entry).default as Vue.Component;

  const app = Vue.createApp(App);
  app.config.errorHandler = (err, _inst, info) => { errors.push(`${(err as Error)?.message ?? String(err)} (${info})`); };
  app.config.warnHandler = (msg) => { warnings.push(msg); };

  const pinia = Pinia.createPinia();
  app.use(pinia);
  const routes = pagesToRoutes(Object.keys(files));
  let router: VueRouter.Router | null = null;
  if (routes.length) {
    router = VueRouter.createRouter({
      history: VueRouter.createMemoryHistory(),
      routes: routes.map(r => ({ path: r.path, component: load(r.file).default as Vue.Component, meta: compiled.get(r.file)?.route?.meta as Record<string, unknown> ?? {} })),
    });
    app.use(router);
  }
  app.use(createI18n({ legacy: false, locale: 'fr', messages: { fr: o.messages ?? {} }, missingWarn: false, fallbackWarn: false }));
  app.use(PrimeVue, o.primevue ?? { unstyled: false });
  app.use(ToastService);
  app.use(ConfirmationService);
  for (const [n, c] of Object.entries({ Button, InputText, Toast, Drawer, ProgressSpinner, ConfirmDialog, Tag, Select })) app.component(n, c);

  const style = document.createElement('style');
  style.textContent = scopeCss([...compiled.values()].map(c => c.css).join('\n'), '.ex-root');
  container.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'ex-root';
  container.append(style, root);
  // Un <a href> classique quitterait la page de l'app : dans l'aperçu, il ne fait rien
  // (router-link, lui, gère déjà le clic et appelle preventDefault).
  root.addEventListener('click', e => {
    if (!e.defaultPrevented && (e.target as Element | null)?.closest?.('a[href]')) e.preventDefault();
  });
  if (router) { await router.push(o.initialRoute ?? '/'); await router.isReady(); }
  const avant = new Set(document.body.children);
  const portals = () => [...document.body.children].filter((n): n is HTMLElement => !avant.has(n) && n instanceof HTMLElement && n.tagName !== 'SCRIPT');
  app.mount(root);
  await Vue.nextTick();

  return {
    app, root, router, pinia, api, errors, warnings, portals,
    resize(width: number) {
      largeurEcran = width;
      const ev = new Event('resize');
      for (const f of [...ecoutesResize]) typeof f === 'function' ? f.call(sandboxWindow, ev) : f.handleEvent(ev);
    },
    unmount() {
      try { app.unmount(); } catch { /* déjà démonté */ }
      // Restes de transitions PrimeVue (masques, toasts) créés par l'exercice.
      for (const n of portals()) if (/\bp-(toast|dialog-mask|drawer-mask|overlay-mask|confirmdialog)\b/.test(n.className)) n.remove();
      for (const [t, , o, reel] of listeners.splice(0)) window.removeEventListener(t, reel, o);
      ecoutesResize.clear();
      for (const id of timers) { window.clearTimeout(id); window.clearInterval(id); }
      timers.clear();
      container.innerHTML = '';
    },
  };
}

export { CompileError, FakeServer };
