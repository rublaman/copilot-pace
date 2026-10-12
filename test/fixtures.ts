import type { Clock } from '../src/domain';

// Fixed time belongs to deterministic tests, never to the interactive demo.
export const demoClock: Clock = { now: () => new Date('2026-10-16T00:00:00Z') };
