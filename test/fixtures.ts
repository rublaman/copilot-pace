import type { Clock } from '../src/domain';

// Tests use a fixed clock; interactive demos use the current UTC date.
export const demoClock: Clock = { now: () => new Date('2026-10-16T00:00:00Z') };
