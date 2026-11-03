import { randomInt } from 'node:crypto';
import type { Rng } from '@nocturne/shared';

export const cryptoRng: Rng = { int: max => randomInt(max) };
