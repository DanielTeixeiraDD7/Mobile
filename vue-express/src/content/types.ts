import type { TestCase } from '@/lib/testing';

/** Bloc de leçon. Texte : `code` en ligne et **gras** acceptés. */
export type Block =
  | { t: 'p'; text: string }
  | { t: 'code'; code: string; lang?: 'vue' | 'js' | 'sql'; title?: string }
  | { t: 'sql'; text: string; code?: string } // pont avec PL/SQL
  | { t: 'tip'; text: string }
  | { t: 'warn'; text: string }
  | { t: 'list'; items: string[] };

export interface Exercise {
  kind: 'build' | 'bug';
  /** Consigne. */
  task: string;
  /** Fichiers de départ (chemin → contenu). */
  files: Record<string, string>;
  /** Fichier ouvert en premier. */
  open: string;
  /** Fichiers fournis, non modifiables. */
  readonly?: string[];
  /** Fichiers modifiés par la solution. */
  solution: Record<string, string>;
  tests: TestCase[];
  hints: string[];
  messages?: Record<string, string>;
}

export interface Card {
  id: string;
  q: string;
  code?: string;
  choices: string[];
  answer: number;
  explain: string;
}

export interface Lesson {
  id: string; // ex. "1-2"
  title: string;
  minutes: number;
  goal: string;
  blocks: Block[];
  exercise: Exercise;
  cards: Card[];
}

export interface Module {
  id: number;
  title: string;
  icon: string; // classe primeicons
  color: string;
  summary: string;
  lessons: Lesson[];
}
