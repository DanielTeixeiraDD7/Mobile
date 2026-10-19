import type { Member } from './types';
export const sync: {
  householdId: string | null; lastPull: string | null; lastSync: string | null; members: Member[];
  status: 'off' | 'idle' | 'syncing' | 'offline' | 'error'; pending: number; error?: string;
};
export function onSyncChange(fn: () => void): void;
export function initSync(): Promise<void>;
export function syncNow(): Promise<void>;
export function resumeHousehold(): Promise<boolean>;
export function createHousehold(displayName: string): Promise<void>;
export function joinHousehold(code: string, displayName: string): Promise<void>;
export function createInvitation(): Promise<string>;
export function disconnect(): Promise<void>;
export function memberName(userId: string | undefined | null): string | undefined;
export function isCouple(): boolean;
export function coupleIds(): string[];
