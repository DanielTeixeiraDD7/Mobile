import type { Category } from './types';
export function t(key: string, params?: Record<string, string | number>): string;
export function allTranslations(key: string): string[];
export function categoryName(cat: Pick<Category, 'name' | 'key'>): string;
export function extend(extra: Record<string, Record<string, string>>): void;
