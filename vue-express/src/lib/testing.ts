import { nextTick } from 'vue';
import { CompileError, runProject, type Files, type RunOptions, type Running } from './runtime';
import { FakeServer } from './fakeApi';

import { CheckFailed } from './expect';

export { CheckFailed, expect } from './expect';

/** Accès au rendu, façon Testing Library (on teste ce que voit l'utilisateur). */
export class Wrapper {
  constructor(public run: Running) {}
  get root() { return this.run.root; }
  get api() { return this.run.api; }
  get router() { return this.run.router; }
  get errors() { return this.run.errors; }
  get warnings() { return this.run.warnings; }

  find(sel: string): HTMLElement | null {
    const local = this.root.querySelector<HTMLElement>(sel);
    if (local) return local;
    for (const p of this.run.portals()) { const el = p.matches(sel) ? p : p.querySelector<HTMLElement>(sel); if (el) return el; }
    return null;
  }
  findAll(sel: string): HTMLElement[] { return [...this.root.querySelectorAll<HTMLElement>(sel)]; }
  exists(sel: string) { return !!this.find(sel); }
  get(sel: string): HTMLElement {
    const el = this.find(sel);
    if (!el) throw new CheckFailed(`Élément introuvable : ${sel}. Vérifie le data-test / la balise.`);
    return el;
  }
  text(sel?: string) { return (sel ? this.get(sel) : this.root).textContent?.replace(/\s+/g, ' ').trim() ?? ''; }
  /** Texte rendu par l'exercice, toasts et panneaux téléportés compris. */
  bodyText() { return [this.root, ...this.run.portals()].map(n => n.textContent ?? '').join(' ').replace(/\s+/g, ' ').trim(); }
  async click(sel: string) { this.get(sel).click(); await this.flush(); }
  async input(sel: string, value: string) {
    const el = this.get(sel) as HTMLInputElement;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await this.flush();
  }
  async check(sel: string, on = true) {
    const el = this.get(sel) as HTMLInputElement;
    if (el.checked !== on) el.click();
    await this.flush();
  }
  async select(sel: string, value: string) {
    const el = this.get(sel) as HTMLSelectElement;
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    await this.flush();
  }
  async flush() { for (let i = 0; i < 3; i++) { await nextTick(); await new Promise(r => setTimeout(r, 0)); } }
  async wait(ms: number) { await new Promise(r => setTimeout(r, ms)); await this.flush(); }
  /** Attend qu'une condition devienne vraie (chargements asynchrones). */
  async until(cond: () => boolean, what: string, timeout = 1500) {
    const t0 = Date.now();
    while (!cond()) {
      if (Date.now() - t0 > timeout) throw new CheckFailed(`Délai dépassé : ${what}.`);
      await this.wait(20);
    }
  }
  /** Simule un écran de `width` px (window.innerWidth + événement resize). */
  async resize(width: number) { this.run.resize(width); await this.flush(); }
  async go(path: string) {
    if (!this.router) throw new CheckFailed("Pas de routeur : il faut des fichiers dans pages/.");
    await this.router.push(path);
    await this.flush();
  }
}

export interface TestCase {
  name: string;
  run: (w: Wrapper) => Promise<void> | void;
}

export interface TestResult { name: string; ok: boolean; message: string | null }
export interface RunReport { compileError: { file: string; message: string; line: number | null } | null; results: TestResult[]; passed: boolean; runtimeErrors: string[] }

/** Exécute chaque test sur un montage neuf (aucune fuite d'état entre tests). */
export async function runTests(files: Files, tests: TestCase[], o: RunOptions & { apiDelay?: number; timeoutMs?: number } = {}): Promise<RunReport> {
  const results: TestResult[] = [];
  const runtimeErrors: string[] = [];
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-10000px;top:0;width:800px;';
  document.body.append(host);
  try {
    for (const t of tests) {
      let running: Running | null = null;
      try {
        running = await runProject(files, host, { ...o, api: new FakeServer({ delay: o.apiDelay ?? 5 }) });
        const w = new Wrapper(running);
        await w.flush();
        await Promise.race([
          Promise.resolve(t.run(w)),
          new Promise((_, rej) => setTimeout(() => rej(new CheckFailed('Le test a pris trop de temps (boucle infinie ? promesse jamais résolue ?).')), o.timeoutMs ?? 4000)),
        ]);
        if (running.errors.length) throw new CheckFailed(`Erreur pendant l'exécution : ${running.errors[0]}`);
        results.push({ name: t.name, ok: true, message: null });
      } catch (e) {
        if (e instanceof CompileError) {
          return { compileError: { file: e.file, message: e.message, line: e.line }, results: [], passed: false, runtimeErrors };
        }
        const msg = e instanceof CheckFailed ? e.message : `Erreur JavaScript : ${(e as Error)?.message ?? String(e)}`;
        results.push({ name: t.name, ok: false, message: msg });
        if (running?.errors.length) runtimeErrors.push(...running.errors);
      } finally {
        running?.unmount();
      }
    }
  } finally {
    host.remove();
  }
  return { compileError: null, results, passed: results.length > 0 && results.every(r => r.ok), runtimeErrors: [...new Set(runtimeErrors)] };
}
