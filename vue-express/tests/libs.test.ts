import { describe, expect, it } from 'vitest';
import { highlight, inline } from '../src/lib/highlight';
import { scopeCss } from '../src/lib/scopeCss';
import { isDue, isMastered, newCard, review, INTERVALS_DAYS } from '../src/lib/srs';

describe('coloration', () => {
  it('échappe le HTML et colore les éléments', () => {
    const h = highlight(`<button @click="n++">{{ n }}</button>\nconst x = ref(0) // ok`, 'vue');
    expect(h).toContain('<span class="hl-t">&lt;button</span>');
    expect(h).toContain('<span class="hl-a">@click</span>');
    expect(h).toContain('<span class="hl-k">const</span>');
    expect(h).toContain('<span class="hl-f">ref</span>');
    expect(h).toContain('<span class="hl-c">// ok</span>');
    expect(h).not.toContain('<button');
  });
  it('SQL', () => {
    const h = highlight("SELECT nom FROM t WHERE id = 1 -- commentaire", 'sql');
    expect(h).toContain('<span class="hl-k">SELECT</span>');
    expect(h).toContain('<span class="hl-c">-- commentaire</span>');
  });
  it('texte en ligne sûr', () => {
    expect(inline('Utilise `ref()` et **jamais** <script>')).toBe('Utilise <code>ref()</code> et <strong>jamais</strong> &lt;script&gt;');
  });
});

describe('révision espacée', () => {
  it('monte de boîte en cas de succès, retombe en boîte 1 en cas d’erreur', () => {
    const now = new Date(2026, 9, 18, 15).getTime();
    let c = newCard(now);
    expect(isDue(c, now)).toBe(true);
    c = review(c, true, now);
    expect(c.box).toBe(1);
    expect(isDue(c, now)).toBe(false);
    expect(isDue(c, now + 86_400_000)).toBe(true);
    for (let i = 0; i < 3; i++) c = review(c, true, now);
    expect(c.box).toBe(4);
    expect(isMastered(c)).toBe(true);
    c = review(c, false, now);
    expect(c).toMatchObject({ box: 1, seen: 5, correct: 4 });
    expect(INTERVALS_DAYS[1]).toBe(1);
  });
});

describe('scopeCss', () => {
  it('préfixe les sélecteurs, y compris dans @media, et laisse @keyframes intact', () => {
    const out = scopeCss('/* c */ .a, button { color: red }\nbody { margin: 0 }\n@media (max-width: 600px) { .b { x: 1 } }\n@keyframes k { from { opacity: 0 } }', '.ex-root');
    expect(out).toContain('.ex-root .a, .ex-root button {');
    expect(out).toContain('.ex-root { margin: 0 }');
    expect(out).toContain('@media (max-width: 600px) {.ex-root .b {');
    expect(out).toContain('@keyframes k { from { opacity: 0 } }');
  });
});
