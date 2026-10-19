import type { Category, Kind, Settlement, Transaction } from './types';
export type Level = 'none' | 'ok' | 'warn' | 'over';
export const WARN: number;
export function txOfMonth(ym: string): Transaction[];
export function totals(ym: string): { expense: number; income: number; balance: number };
export function byCategory(ym: string, type?: Kind): Map<string, number>;
export function level(spent: number, cap: number | null | undefined): Level;
export function budgetStatus(ym: string): {
  global: { spent: number; cap: number | null; level: Level };
  categories: { cat: Category; spent: number; cap: number | null; level: Level }[];
};
export function lastMonths(ym: string, count: number): { ym: string; expense: number; income: number; balance: number }[];
export function change(now: number, before: number): number | null;
interface Balance { amount: number; creditor: string; debtor: string }
export function split(ym: string, ids: string[]): {
  total: number; paid: Record<string, number>; personal: Record<string, number>; income: Record<string, number>;
  month: Balance; due: Balance; settlements: Settlement[];
};
