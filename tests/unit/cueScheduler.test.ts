/**
 * Unit tests for the cue scheduler.
 * Tests: deterministic firing, de-duplication (I6), threshold, seek/loop handling.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createSchedulerState,
  onTimeUpdate,
  resetScheduler,
  getCuesForClip,
  type SchedulerState,
} from '../../src/domain/cueScheduler';
import type { Cue } from '../../src/domain/types';

function makeCue(overrides: Partial<Cue> = {}): Cue {
  return {
    cueId: 'cue_1',
    clipId: 'clip_test',
    atSec: 10,
    clipWindow: [5, 15],
    event: {
      type: 'test',
      title: 'Test event',
      confidence: 0.9,
      priority: 'HIGH',
    },
    truth: 'crime_like',
    ...overrides,
  };
}

describe('Cue Scheduler', () => {
  let state: SchedulerState;

  beforeEach(() => {
    state = createSchedulerState();
  });

  it('fires a cue when time crosses atSec', () => {
    const cues = [makeCue({ atSec: 10 })];

    // Time before cue
    const r1 = onTimeUpdate(state, 0, 5, cues, 0.5);
    expect(r1).toHaveLength(0);

    // Time crosses cue
    const r2 = onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(r2).toHaveLength(1);
    expect(r2[0].cue.cueId).toBe('cue_1');
  });

  it('fires exactly at the boundary (lastTime < atSec <= currentTime)', () => {
    const cues = [makeCue({ atSec: 10 })];
    state.lastTimePerTile.set(0, 9.9);
    const result = onTimeUpdate(state, 0, 10, cues, 0.5);
    expect(result).toHaveLength(1);
  });

  it('does not fire when time is before cue', () => {
    const cues = [makeCue({ atSec: 10 })];
    const result = onTimeUpdate(state, 0, 9, cues, 0.5);
    expect(result).toHaveLength(0);
  });

  // ─── I6: each cue fires at most once ─────────────────────────────

  it('I6: cue fires only once, even across multiple ticks', () => {
    const cues = [makeCue({ atSec: 10 })];

    const r1 = onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(r1).toHaveLength(1);

    // Second tick past the same point
    const r2 = onTimeUpdate(state, 0, 15, cues, 0.5);
    expect(r2).toHaveLength(0);
  });

  it('I6: cue does not re-fire on video loop', () => {
    const cues = [makeCue({ atSec: 10 })];

    // First pass: fires
    onTimeUpdate(state, 0, 12, cues, 0.5);

    // Video loops back to 0
    onTimeUpdate(state, 0, 2, cues, 0.5);

    // Second pass through cue point: does NOT fire
    const r = onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(r).toHaveLength(0);
    expect(state.firedCueIds.has('cue_1')).toBe(true);
  });

  // ─── Threshold filtering ─────────────────────────────────────────

  it('ignores cues below threshold', () => {
    const cues = [makeCue({ atSec: 10, event: { ...makeCue().event, confidence: 0.3 } })];
    const result = onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(result).toHaveLength(0);
  });

  it('fires cues at threshold', () => {
    const cues = [makeCue({ atSec: 10, event: { ...makeCue().event, confidence: 0.5 } })];
    const result = onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(result).toHaveLength(1);
  });

  it('fires cues above threshold', () => {
    const cues = [makeCue({ atSec: 10, event: { ...makeCue().event, confidence: 0.95 } })];
    const result = onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(result).toHaveLength(1);
  });

  // ─── Skipped ticks ───────────────────────────────────────────────

  it('fires cue on skipped ticks (large time jump)', () => {
    const cues = [makeCue({ atSec: 10 })];
    // Jump from 0 directly to 30
    const result = onTimeUpdate(state, 0, 30, cues, 0.5);
    expect(result).toHaveLength(1);
  });

  it('fires multiple cues in a single tick if they all fall within range', () => {
    const cues = [
      makeCue({ cueId: 'cue_1', atSec: 5 }),
      makeCue({ cueId: 'cue_2', atSec: 10 }),
      makeCue({ cueId: 'cue_3', atSec: 15 }),
    ];
    // Jump from 0 to 20 — all three should fire
    const result = onTimeUpdate(state, 0, 20, cues, 0.5);
    expect(result).toHaveLength(3);
  });

  // ─── Multiple tiles ──────────────────────────────────────────────

  it('tracks time independently per tile', () => {
    const cues = [makeCue({ atSec: 10 })];

    // Tile 0 fires
    const r0 = onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(r0).toHaveLength(1);

    // Cue is now in firedCueIds, so tile 1 won't fire the same cue
    const r1 = onTimeUpdate(state, 1, 12, cues, 0.5);
    expect(r1).toHaveLength(0);
  });

  // ─── Reset ───────────────────────────────────────────────────────

  it('reset re-arms all cues', () => {
    const cues = [makeCue({ atSec: 10 })];

    onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(state.firedCueIds.size).toBe(1);

    resetScheduler(state);
    expect(state.firedCueIds.size).toBe(0);
    expect(state.lastTimePerTile.size).toBe(0);

    // Cue can fire again after reset
    const result = onTimeUpdate(state, 0, 12, cues, 0.5);
    expect(result).toHaveLength(1);
  });

  // ─── getCuesForClip ──────────────────────────────────────────────

  it('getCuesForClip filters by clipId', () => {
    const allCues = [
      makeCue({ cueId: 'a', clipId: 'clip_1' }),
      makeCue({ cueId: 'b', clipId: 'clip_2' }),
      makeCue({ cueId: 'c', clipId: 'clip_1' }),
    ];
    expect(getCuesForClip(allCues, 'clip_1')).toHaveLength(2);
    expect(getCuesForClip(allCues, 'clip_2')).toHaveLength(1);
    expect(getCuesForClip(allCues, 'clip_3')).toHaveLength(0);
  });
});
