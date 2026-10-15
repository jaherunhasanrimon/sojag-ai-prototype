/**
 * Unit tests for the lock rule (I1) and priority ordering.
 * Invariant I1: At most one incident per operator has status ACTIVE.
 * CUE_FIRED while an incident is ACTIVE can only produce QUEUED.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { onCueFired, pullNext, resetIncidentCounter } from '../../src/domain/lockRule';
import { nextQueued, compareByPriorityThenAge } from '../../src/domain/priority';
import type { Incident, Cue } from '../../src/domain/types';

/** Helper cue */
function makeCue(overrides: Partial<Cue> = {}): Cue {
  return {
    cueId: 'cue_test',
    clipId: 'clip_test',
    atSec: 10,
    clipWindow: [5, 15],
    event: {
      type: 'test_event',
      title: 'Possible test event',
      confidence: 0.9,
      priority: 'HIGH',
    },
    truth: 'crime_like',
    ...overrides,
  };
}

/** Helper incident */
function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: 'STK-001',
    cueId: 'cue_test',
    clipId: 'clip_test',
    cameraId: 'CAM-01',
    title: 'Possible event',
    eventType: 'test_event',
    confidence: 0.9,
    priority: 'HIGH',
    firedAtDemoMs: 1000,
    firedAtWall: '14:00:01',
    status: 'ACTIVE',
    truth: 'crime_like',
    log: [],
    ...overrides,
  };
}

describe('Lock Rule (I1)', () => {
  beforeEach(() => {
    resetIncidentCounter();
  });

  it('creates a QUEUED incident when no active incident exists and autoPull=false', () => {
    const cue = makeCue({ cueId: 'cue_1' });
    const result = onCueFired([], cue, 'CAM-01', 1000, false);
    expect(result.newIncident.status).toBe('QUEUED');
    expect(result.autoPulled).toBe(false);
  });

  it('auto-pulls the new incident to ACTIVE when no active incident exists and autoPull=true', () => {
    const cue = makeCue({ cueId: 'cue_1' });
    const result = onCueFired([], cue, 'CAM-01', 1000, true);
    expect(result.newIncident.status).toBe('ACTIVE');
    expect(result.autoPulled).toBe(true);
  });

  it('I1: second cue while one is ACTIVE produces QUEUED, not ACTIVE', () => {
    const cue1 = makeCue({ cueId: 'cue_1' });
    const result1 = onCueFired([], cue1, 'CAM-01', 1000, true);
    expect(result1.newIncident.status).toBe('ACTIVE');

    const cue2 = makeCue({ cueId: 'cue_2', clipId: 'clip_2' });
    const result2 = onCueFired(result1.incidents, cue2, 'CAM-02', 2000, true);
    expect(result2.newIncident.status).toBe('QUEUED');
    expect(result2.autoPulled).toBe(false);

    // Only one ACTIVE
    const activeCount = result2.incidents.filter((i) => i.status === 'ACTIVE').length;
    expect(activeCount).toBe(1);
  });

  it('I1: the active incident is unchanged when a second cue fires', () => {
    const cue1 = makeCue({ cueId: 'cue_1' });
    const result1 = onCueFired([], cue1, 'CAM-01', 1000, true);
    const activeId = result1.newIncident.id;

    const cue2 = makeCue({ cueId: 'cue_2', clipId: 'clip_2' });
    const result2 = onCueFired(result1.incidents, cue2, 'CAM-02', 2000, true);

    // The originally active incident should still be active with the same ID
    const stillActive = result2.incidents.find((i) => i.status === 'ACTIVE');
    expect(stillActive?.id).toBe(activeId);
  });

  it('assigns sequential IDs', () => {
    const cue1 = makeCue({ cueId: 'cue_1' });
    const r1 = onCueFired([], cue1, 'CAM-01', 1000, true);
    expect(r1.newIncident.id).toBe('STK-001');

    const cue2 = makeCue({ cueId: 'cue_2' });
    const r2 = onCueFired(r1.incidents, cue2, 'CAM-02', 2000, true);
    expect(r2.newIncident.id).toBe('STK-002');
  });
});

describe('pullNext', () => {
  beforeEach(() => {
    resetIncidentCounter();
  });

  it('returns null if an incident is already ACTIVE', () => {
    const incidents = [makeIncident({ status: 'ACTIVE' })];
    expect(pullNext(incidents, 3000)).toBeNull();
  });

  it('returns null if no QUEUED or PAUSED incidents', () => {
    const incidents = [makeIncident({ status: 'CLOSED' })];
    expect(pullNext(incidents, 3000)).toBeNull();
  });

  it('pulls the highest-priority queued incident', () => {
    const incidents = [
      makeIncident({ id: 'STK-001', status: 'QUEUED', priority: 'LOW', firedAtDemoMs: 1000 }),
      makeIncident({ id: 'STK-002', status: 'QUEUED', priority: 'HIGH', firedAtDemoMs: 2000 }),
    ];
    const result = pullNext(incidents, 3000);
    expect(result).not.toBeNull();
    const active = result!.find((i) => i.status === 'ACTIVE');
    expect(active?.id).toBe('STK-002');
  });

  it('pulls the oldest among same-priority', () => {
    const incidents = [
      makeIncident({ id: 'STK-002', status: 'QUEUED', priority: 'HIGH', firedAtDemoMs: 2000 }),
      makeIncident({ id: 'STK-001', status: 'QUEUED', priority: 'HIGH', firedAtDemoMs: 1000 }),
    ];
    const result = pullNext(incidents, 3000);
    const active = result!.find((i) => i.status === 'ACTIVE');
    expect(active?.id).toBe('STK-001'); // oldest
  });

  it('can pull a PAUSED incident', () => {
    const incidents = [
      makeIncident({ id: 'STK-001', status: 'PAUSED', priority: 'HIGH', firedAtDemoMs: 1000 }),
    ];
    const result = pullNext(incidents, 3000);
    const active = result!.find((i) => i.status === 'ACTIVE');
    expect(active?.id).toBe('STK-001');
  });
});

describe('Priority ordering', () => {
  it('sorts HIGH before MEDIUM before LOW', () => {
    const incidents: Incident[] = [
      makeIncident({ id: 'low', priority: 'LOW', firedAtDemoMs: 1000 }),
      makeIncident({ id: 'high', priority: 'HIGH', firedAtDemoMs: 3000 }),
      makeIncident({ id: 'med', priority: 'MEDIUM', firedAtDemoMs: 2000 }),
    ];
    incidents.sort(compareByPriorityThenAge);
    expect(incidents.map((i) => i.id)).toEqual(['high', 'med', 'low']);
  });

  it('sorts oldest first within same priority', () => {
    const incidents: Incident[] = [
      makeIncident({ id: 'newer', priority: 'HIGH', firedAtDemoMs: 3000 }),
      makeIncident({ id: 'older', priority: 'HIGH', firedAtDemoMs: 1000 }),
    ];
    incidents.sort(compareByPriorityThenAge);
    expect(incidents.map((i) => i.id)).toEqual(['older', 'newer']);
  });

  it('nextQueued returns highest-priority oldest QUEUED', () => {
    const incidents: Incident[] = [
      makeIncident({ id: 'a', status: 'QUEUED', priority: 'LOW', firedAtDemoMs: 1000 }),
      makeIncident({ id: 'b', status: 'QUEUED', priority: 'HIGH', firedAtDemoMs: 2000 }),
      makeIncident({ id: 'c', status: 'ACTIVE', priority: 'HIGH', firedAtDemoMs: 500 }),
    ];
    const next = nextQueued(incidents);
    expect(next?.id).toBe('b');
  });

  it('nextQueued returns undefined for empty queue', () => {
    expect(nextQueued([])).toBeUndefined();
  });
});
