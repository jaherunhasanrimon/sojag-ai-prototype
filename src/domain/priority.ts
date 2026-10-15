/**
 * domain/priority.ts — Priority ordering for the incident queue.
 * Sorted HIGH → MEDIUM → LOW, then oldest first (lowest firedAtDemoMs).
 */
import type { Incident, Priority } from './types';

const PRIORITY_RANK: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

/**
 * Compare two incidents for queue ordering.
 * Returns negative if a should come first.
 */
export function compareByPriorityThenAge(a: Incident, b: Incident): number {
  const rankDiff = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
  if (rankDiff !== 0) return rankDiff;
  return a.firedAtDemoMs - b.firedAtDemoMs; // oldest first
}

/**
 * Get the next incident to pull from the queue.
 * Returns the highest-priority, then oldest QUEUED or PAUSED incident.
 */
export function nextQueued(incidents: Incident[]): Incident | undefined {
  const candidates = incidents.filter(
    (i) => i.status === 'QUEUED' || i.status === 'PAUSED',
  );
  if (candidates.length === 0) return undefined;
  candidates.sort(compareByPriorityThenAge);
  return candidates[0];
}
