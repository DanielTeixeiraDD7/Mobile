export const STORES: string[];
export function open(): Promise<IDBDatabase>;
export function get(store: string, key: string): Promise<any>;
export function getAll(store: string): Promise<any[]>;
export function put(store: string, value: unknown): Promise<unknown>;
export function remove(store: string, key: string): Promise<unknown>;
export function clear(store: string): Promise<unknown>;
