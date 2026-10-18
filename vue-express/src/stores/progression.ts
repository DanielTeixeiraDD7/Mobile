import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { ALL_CARDS, LESSONS, MODULES } from '@/content';
import { isDue, isMastered, newCard, review, type CardState } from '@/lib/srs';

export interface LessonState {
  read: boolean;
  done: boolean;
  doneAt: number | null;
  attempts: number;
  hints: number;
  solution: boolean;
}

interface Saved {
  version: 1;
  lessons: Record<string, LessonState>;
  cards: Record<string, CardState>;
  xp: number;
  days: string[];
  last: string | null;
}

export const STORAGE_KEY = 'vue-express:progression';
export const XP = { lesson: 50, lessonNoSolution: 30, card: 5 };

const today = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-JJ local

function load(): Saved {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (s && s.version === 1) return s;
  } catch { /* stockage indisponible ou illisible */ }
  return { version: 1, lessons: {}, cards: {}, xp: 0, days: [], last: null };
}

export const useProgressionStore = defineStore('progression', () => {
  const saved = load();
  const lessons = ref<Record<string, LessonState>>(saved.lessons);
  const cards = ref<Record<string, CardState>>(saved.cards);
  const xp = ref(saved.xp);
  const days = ref<string[]>(saved.days);
  const last = ref<string | null>(saved.last);

  watch([lessons, cards, xp, days, last], () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, lessons: lessons.value, cards: cards.value, xp: xp.value, days: days.value, last: last.value } satisfies Saved));
    } catch { /* quota / navigation privée : on continue en mémoire */ }
  }, { deep: true });

  const state = (id: string): LessonState => lessons.value[id] ?? { read: false, done: false, doneAt: null, attempts: 0, hints: 0, solution: false };
  const patch = (id: string, p: Partial<LessonState>) => { lessons.value[id] = { ...state(id), ...p }; };

  function markActive() {
    const d = today();
    if (!days.value.includes(d)) days.value.push(d);
  }

  /** Lecture d'une leçon : débloque ses cartes de révision. */
  function markRead(id: string) {
    last.value = id;
    markActive();
    if (!state(id).read) patch(id, { read: true });
    const lesson = LESSONS.find(l => l.id === id);
    for (const c of lesson?.cards ?? []) if (!cards.value[c.id]) cards.value[c.id] = newCard();
  }

  function recordAttempt(id: string) { patch(id, { attempts: state(id).attempts + 1 }); markActive(); }
  function recordHint(id: string) { patch(id, { hints: state(id).hints + 1 }); }
  function recordSolution(id: string) { patch(id, { solution: true }); }

  /** Exercice réussi. Renvoie l'XP gagnée (0 si déjà validée). */
  function complete(id: string): number {
    const s = state(id);
    if (s.done) return 0;
    const gain = XP.lesson + (s.solution ? 0 : XP.lessonNoSolution);
    patch(id, { done: true, doneAt: Date.now() });
    xp.value += gain;
    markActive();
    return gain;
  }

  function answer(cardId: string, ok: boolean) {
    cards.value[cardId] = review(cards.value[cardId] ?? newCard(), ok);
    if (ok) xp.value += XP.card;
    markActive();
  }

  const doneCount = computed(() => LESSONS.filter(l => state(l.id).done).length);
  const percent = computed(() => Math.round((doneCount.value / LESSONS.length) * 100));
  const dueCards = computed(() => ALL_CARDS.filter(c => cards.value[c.id] && isDue(cards.value[c.id]!)));
  const mastered = computed(() => Object.values(cards.value).filter(isMastered).length);
  const unlockedCards = computed(() => Object.keys(cards.value).length);

  /** Série : jours consécutifs d'activité jusqu'à aujourd'hui (ou hier). */
  const streak = computed(() => {
    const set = new Set(days.value);
    const d = new Date();
    if (!set.has(d.toLocaleDateString('sv-SE'))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (set.has(d.toLocaleDateString('sv-SE'))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  });

  const nextLesson = computed(() => LESSONS.find(l => !state(l.id).done) ?? null);
  const moduleProgress = (moduleId: number) => {
    const m = MODULES.find(x => x.id === moduleId)!;
    const done = m.lessons.filter(l => state(l.id).done).length;
    return { done, total: m.lessons.length, percent: Math.round((done / m.lessons.length) * 100) };
  };

  function exportData(): string {
    return JSON.stringify({ app: 'vue-express', exportedAt: new Date().toISOString(), version: 1, lessons: lessons.value, cards: cards.value, xp: xp.value, days: days.value, last: last.value }, null, 1);
  }

  function importData(text: string): { ok: boolean; message: string } {
    try {
      const d = JSON.parse(text);
      if (d?.app !== 'vue-express' || d.version !== 1 || typeof d.lessons !== 'object') return { ok: false, message: "Ce fichier n'est pas une sauvegarde Vue Express." };
      lessons.value = d.lessons; cards.value = d.cards ?? {}; xp.value = Number(d.xp) || 0; days.value = Array.isArray(d.days) ? d.days : []; last.value = d.last ?? null;
      return { ok: true, message: 'Progression restaurée.' };
    } catch {
      return { ok: false, message: 'Fichier illisible (JSON invalide).' };
    }
  }

  function reset() {
    lessons.value = {}; cards.value = {}; xp.value = 0; days.value = []; last.value = null;
  }

  return { lessons, cards, xp, days, last, state, markRead, recordAttempt, recordHint, recordSolution, complete, answer,
    doneCount, percent, dueCards, mastered, unlockedCards, streak, nextLesson, moduleProgress, exportData, importData, reset };
});
