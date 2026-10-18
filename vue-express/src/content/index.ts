import type { Lesson, Module } from './types';
import { m1 } from './m1-reactivite';
import { m2 } from './m2-composants';
import { m3 } from './m3-routage';
import { m4 } from './m4-serveur';
import { m5 } from './m5-declaratif';
import { m6 } from './m6-pinia';
import { m7 } from './m7-cycle';
import { m8 } from './m8-responsive';

export const MODULES: Module[] = [m1, m2, m3, m4, m5, m6, m7, m8];

export const LESSONS: Lesson[] = MODULES.flatMap(m => m.lessons);
export const lessonById = (id: string) => LESSONS.find(l => l.id === id) ?? null;
export const moduleOf = (lessonId: string) => MODULES.find(m => m.lessons.some(l => l.id === lessonId)) ?? null;
export const nextLesson = (id: string) => LESSONS[LESSONS.findIndex(l => l.id === id) + 1] ?? null;
export const ALL_CARDS = LESSONS.flatMap(l => l.cards.map(c => ({ ...c, lessonId: l.id })));
