import type { Api } from './types';
import { httpApi } from './http';

export const isDemo = import.meta.env.VITE_API === 'demo';

let impl: Api = httpApi;
if (isDemo) impl = (await import('./demo')).demoApi;

export const api = impl;
export { ApiError } from './types';
export type { Api } from './types';
