/**
 * domain/cueScheduler.ts — Cue scheduling from video playback time.
 * Fires cues deterministically and exactly once (architecture.md section 6).
 *
 * Key rules:
 * - A cue fires when lastTime < cue.atSec <= currentTime
 * - firedCueIds prevents re-firing across loops
 * - Handles seeks, pauses, and ticks that skip
 * - Threshold filtering: cues below alertThreshold are ignored
 */
import type { Cue } from './types';

export interface SchedulerState {
  /** Set of cue IDs that have already fired this scenario run */
  firedCueIds: Set<string>;
  /** Last reported currentTime per tile index */
  lastTimePerTile: Map<number, number>;
}

export function createSchedulerState(): SchedulerState {
  return {
    firedCueIds: new Set(),
    lastTimePerTile: new Map(),
  };
}

export interface CueFiredEvent {
  cue: Cue;
  tileIndex: number;
}

/**
 * Check whether any cues should fire given a time update on a tile.
 *
 * @param state - Current scheduler state (mutated: firedCueIds and lastTimePerTile)
 * @param tileIndex - The tile that reported the time update
 * @param currentTime - The current playback time in seconds
 * @param cues - All armed cues for this tile's clip
 * @param alertThreshold - Minimum confidence to fire (design.md section 6, rule 4)
 * @returns Array of cues that should fire (usually 0 or 1)
 */
export function onTimeUpdate(
  state: SchedulerState,
  tileIndex: number,
  currentTime: number,
  cues: Cue[],
  alertThreshold: number,
): CueFiredEvent[] {
  const lastTime = state.lastTimePerTile.get(tileIndex) ?? 0;
  const fired: CueFiredEvent[] = [];

  for (const cue of cues) {
    // I6: each cue fires at most once per scenario run
    if (state.firedCueIds.has(cue.cueId)) continue;

    // Threshold filtering (rule 4)
    if (cue.event.confidence < alertThreshold) continue;

    // Fire when lastTime < atSec <= currentTime
    // This handles normal ticks, skipped ticks, and loops
    if (lastTime < cue.atSec && cue.atSec <= currentTime) {
      state.firedCueIds.add(cue.cueId);
      fired.push({ cue, tileIndex });
    }
  }

  // Update last time (handle seeks: if currentTime < lastTime, it's a loop/seek)
  state.lastTimePerTile.set(tileIndex, currentTime);

  return fired;
}

/**
 * Reset the scheduler (re-arm all cues for a new scenario run).
 */
export function resetScheduler(state: SchedulerState): void {
  state.firedCueIds.clear();
  state.lastTimePerTile.clear();
}

/**
 * Get cues for a specific clip from the scenario's cue list.
 */
export function getCuesForClip(allCues: Cue[], clipId: string): Cue[] {
  return allCues.filter((c) => c.clipId === clipId);
}
