/**
 * Unit tests for the incident state machine.
 * Covers invariants I1–I7 from architecture.md section 5.
 */
import { describe, it, expect } from 'vitest';
import { applyTransition, hasActiveIncident, getActiveIncident } from '../../src/domain/stateMachine';
import type { Incident } from '../../src/domain/types';

/** Helper to create a test incident */
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

describe('State Machine Transitions', () => {
  // ─── I2: CONFIRM, DISMISS, REQUEST_REVIEW only from ACTIVE ──────

  describe('I2: CONFIRM/DISMISS/REQUEST_REVIEW only from ACTIVE', () => {
    it('allows CONFIRM from ACTIVE', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'CONFIRM' }, 2000);
      expect(result.incident).not.toBeNull();
      expect(result.incident!.status).toBe('CONFIRMED');
    });

    it('rejects CONFIRM from QUEUED', () => {
      const inc = makeIncident({ status: 'QUEUED' });
      const result = applyTransition(inc, { type: 'CONFIRM' }, 2000);
      expect(result.incident).toBeNull();
      expect(result.error).toContain('Illegal transition');
    });

    it('rejects CONFIRM from DISMISSED', () => {
      const inc = makeIncident({ status: 'DISMISSED' });
      const result = applyTransition(inc, { type: 'CONFIRM' }, 2000);
      expect(result.incident).toBeNull();
    });

    it('allows DISMISS from ACTIVE', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'DISMISS', reason: 'Normal activity' }, 2000);
      expect(result.incident).not.toBeNull();
      expect(result.incident!.status).toBe('DISMISSED');
    });

    it('rejects DISMISS from CONFIRMED', () => {
      const inc = makeIncident({ status: 'CONFIRMED' });
      const result = applyTransition(inc, { type: 'DISMISS', reason: 'test' }, 2000);
      expect(result.incident).toBeNull();
    });

    it('allows REQUEST_REVIEW from ACTIVE', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'REQUEST_REVIEW' }, 2000);
      expect(result.incident).not.toBeNull();
      expect(result.incident!.status).toBe('REVIEW_REQUESTED');
    });

    it('rejects REQUEST_REVIEW from QUEUED', () => {
      const inc = makeIncident({ status: 'QUEUED' });
      const result = applyTransition(inc, { type: 'REQUEST_REVIEW' }, 2000);
      expect(result.incident).toBeNull();
    });
  });

  // ─── I3: DISMISS requires a reason ───────────────────────────────

  describe('I3: DISMISS requires a reason', () => {
    it('rejects DISMISS with empty reason', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'DISMISS', reason: '' }, 2000);
      expect(result.incident).toBeNull();
      expect(result.error).toContain('requires a reason');
    });

    it('rejects DISMISS with whitespace-only reason', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'DISMISS', reason: '   ' }, 2000);
      expect(result.incident).toBeNull();
    });

    it('accepts DISMISS with a valid reason', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'DISMISS', reason: 'Play or sport' }, 2000);
      expect(result.incident).not.toBeNull();
      expect(result.incident!.dismissReason).toBe('Play or sport');
    });
  });

  // ─── I4: SEND_DISPATCH requires CONFIRMED ────────────────────────

  describe('I4: SEND_DISPATCH requires CONFIRMED', () => {
    it('allows SEND_DISPATCH from CONFIRMED', () => {
      const inc = makeIncident({ status: 'CONFIRMED' });
      const result = applyTransition(inc, { type: 'SEND_DISPATCH' }, 3000);
      expect(result.incident).not.toBeNull();
      expect(result.incident!.status).toBe('DISPATCHED');
      expect(result.incident!.dispatch).toBeDefined();
      expect(result.incident!.dispatch!.channel).toBe('Police Control Room (SIMULATED)');
    });

    it('rejects SEND_DISPATCH from ACTIVE', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'SEND_DISPATCH' }, 3000);
      expect(result.incident).toBeNull();
    });
  });

  // ─── I5: REVIEW_REQUESTED allows supervisor decisions ────────────

  describe('I5: Supervisor decisions from REVIEW_REQUESTED', () => {
    it('allows SUPERVISOR_CONFIRM from REVIEW_REQUESTED', () => {
      const inc = makeIncident({ status: 'REVIEW_REQUESTED' });
      const result = applyTransition(inc, { type: 'SUPERVISOR_CONFIRM' }, 4000);
      expect(result.incident).not.toBeNull();
      expect(result.incident!.status).toBe('CONFIRMED');
    });

    it('allows SUPERVISOR_DISMISS from REVIEW_REQUESTED', () => {
      const inc = makeIncident({ status: 'REVIEW_REQUESTED' });
      const result = applyTransition(inc, { type: 'SUPERVISOR_DISMISS', reason: 'Not an incident' }, 4000);
      expect(result.incident).not.toBeNull();
      expect(result.incident!.status).toBe('DISMISSED');
    });

    it('rejects SUPERVISOR_CONFIRM from ACTIVE', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'SUPERVISOR_CONFIRM' }, 4000);
      expect(result.incident).toBeNull();
    });
  });

  // ─── I7: All transitions append to incident.log ──────────────────

  describe('I7: All transitions append to log', () => {
    it('CONFIRM appends to log', () => {
      const inc = makeIncident({ status: 'ACTIVE', log: [] });
      const result = applyTransition(inc, { type: 'CONFIRM' }, 5000);
      expect(result.incident!.log).toHaveLength(1);
      expect(result.incident!.log[0].action).toBe('CONFIRM');
      expect(result.incident!.log[0].atMs).toBe(5000);
      expect(result.incident!.log[0].actor).toBe('operator');
    });

    it('DISMISS appends to log with detail', () => {
      const inc = makeIncident({ status: 'ACTIVE', log: [] });
      const result = applyTransition(inc, { type: 'DISMISS', reason: 'Camera artefact' }, 6000);
      expect(result.incident!.log).toHaveLength(1);
      expect(result.incident!.log[0].detail).toContain('Camera artefact');
    });

    it('SIM_ACK appends to log and dispatch steps', () => {
      const inc = makeIncident({
        status: 'DISPATCHED',
        dispatch: { channel: 'Test', steps: [{ status: 'DISPATCHED', atDemoMs: 3000 }] },
      });
      const result = applyTransition(inc, { type: 'SIM_ACK' }, 7000);
      expect(result.incident!.status).toBe('ACKNOWLEDGED');
      expect(result.incident!.dispatch!.steps).toHaveLength(2);
      expect(result.incident!.dispatch!.unit).toBe('Unit P-12 (fictional)');
    });

    it('multiple transitions accumulate log entries', () => {
      let inc = makeIncident({ status: 'ACTIVE', log: [] });
      const r1 = applyTransition(inc, { type: 'CONFIRM' }, 1000);
      inc = r1.incident!;
      const r2 = applyTransition(inc, { type: 'SEND_DISPATCH' }, 2000);
      inc = r2.incident!;
      const r3 = applyTransition(inc, { type: 'SIM_ACK' }, 3000);
      inc = r3.incident!;
      expect(inc.log).toHaveLength(3);
      expect(inc.log.map((l) => l.action)).toEqual(['CONFIRM', 'SEND_DISPATCH', 'SIM_ACK']);
    });
  });

  // ─── Dispatch lifecycle ──────────────────────────────────────────

  describe('Dispatch lifecycle', () => {
    it('full lifecycle: ACTIVE → CONFIRMED → DISPATCHED → ACK → ARRIVED → CLOSED', () => {
      let inc = makeIncident({ status: 'ACTIVE' });

      let r = applyTransition(inc, { type: 'CONFIRM' }, 1000);
      expect(r.incident!.status).toBe('CONFIRMED');
      inc = r.incident!;

      r = applyTransition(inc, { type: 'SEND_DISPATCH' }, 2000);
      expect(r.incident!.status).toBe('DISPATCHED');
      inc = r.incident!;

      r = applyTransition(inc, { type: 'SIM_ACK' }, 3000);
      expect(r.incident!.status).toBe('ACKNOWLEDGED');
      inc = r.incident!;

      r = applyTransition(inc, { type: 'SIM_ARRIVE' }, 4000);
      expect(r.incident!.status).toBe('ARRIVED');
      inc = r.incident!;

      r = applyTransition(inc, { type: 'CLOSE', outcome: 'Resolved' }, 5000);
      expect(r.incident!.status).toBe('CLOSED');
      expect(r.incident!.outcome).toBe('Resolved');
    });
  });

  // ─── SWAP_OUT ────────────────────────────────────────────────────

  describe('SWAP_OUT', () => {
    it('pauses an active incident', () => {
      const inc = makeIncident({ status: 'ACTIVE' });
      const result = applyTransition(inc, { type: 'SWAP_OUT' }, 2000);
      expect(result.incident!.status).toBe('PAUSED');
    });

    it('only works from ACTIVE', () => {
      const inc = makeIncident({ status: 'QUEUED' });
      const result = applyTransition(inc, { type: 'SWAP_OUT' }, 2000);
      expect(result.incident).toBeNull();
    });
  });
});

describe('hasActiveIncident', () => {
  it('returns false for empty array', () => {
    expect(hasActiveIncident([])).toBe(false);
  });

  it('returns true when one incident is ACTIVE', () => {
    expect(hasActiveIncident([makeIncident({ status: 'ACTIVE' })])).toBe(true);
  });

  it('returns false when all are QUEUED', () => {
    expect(hasActiveIncident([makeIncident({ status: 'QUEUED' })])).toBe(false);
  });
});

describe('getActiveIncident', () => {
  it('returns the ACTIVE incident', () => {
    const incidents = [
      makeIncident({ id: 'STK-001', status: 'QUEUED' }),
      makeIncident({ id: 'STK-002', status: 'ACTIVE' }),
    ];
    const active = getActiveIncident(incidents);
    expect(active?.id).toBe('STK-002');
  });
});
