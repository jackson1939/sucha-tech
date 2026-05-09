import type { ParsedIntent, SimulationResult } from '@/types';

interface Entry { intent: ParsedIntent; quote: SimulationResult; requiresDoubleConfirmation: boolean; userId: string; expiresAt: number; }
declare global { var __simCache: Map<string, Entry> | undefined; }

const cache: Map<string, Entry> = global.__simCache ??= new Map();
const TTL = 10 * 60 * 1000;

export function setSimulation(id: string, data: Omit<Entry, 'expiresAt'>): void {
  cache.set(id, { ...data, expiresAt: Date.now() + TTL });
}
export function getSimulation(id: string): Entry | null {
  const e = cache.get(id);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { cache.delete(id); return null; }
  return e;
}
export function deleteSimulation(id: string): void { cache.delete(id); }
