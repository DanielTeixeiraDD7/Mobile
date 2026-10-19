export class ApiError extends Error { status: number; code?: string; constructor(message: string, status: number, code?: string) }
export function signUp(email: string, password: string): Promise<boolean>;
export function signIn(email: string, password: string): Promise<{ id: string; email: string }>;
export function currentUser(): { id: string; email: string } | null;
export function signOut(): Promise<void>;
export function loadSession(): Promise<unknown>;
