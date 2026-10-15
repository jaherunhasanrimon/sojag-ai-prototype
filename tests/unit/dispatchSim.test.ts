/**
 * Unit tests for dispatchSim.ts (Phase 5).
 * Tests simulated dispatch timeline timers (ACK ~8s, ARRIVE ~45s) and 2s auto-pull.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  tickDispatchSim,
  scheduleAutoPull,
  resetAutoPull,
  DISPATCH_DELAYS,
} from '../../src/services/dispatchSim';
import { useAppStore } from '../../src/store/store';
import type { Incident } from '../../src/domain/types';

const createMockIncident = (id: string, status: any, extra: Partial<Incident> = {}): Incident => ({
  id,
  cueId: `cue-${id}`,
  clipId: `clip-${id}`,
  cameraId: 'CAM-01',
  title: `Test incident ${id}`,
  eventType: 'altercation',
  confidence: 0.9,
  priority: 'HIGH',
  status,
  firedAtDemoMs: 0,
  firedAtWall: '12:00:00',
  truth: 'crime_like',
  log: [],
  ...extra,
});

describe('dispatchSim', () => {
  beforeEach(() => {
    resetAutoPull();
    useAppStore.setState({
      incidents: [],
      auditLog: [],
      autoPull: true,
    });
  });

  it('progresses DISPATCHED to ACKNOWLEDGED after 8s in demo time', () => {
    const incident = createMockIncident('STK-001', 'DISPATCHED', {
      dispatch: {
        channel: 'Police Control Room (SIMULATED)',
        steps: [{ status: 'DISPATCHED', atDemoMs: 10_000 }],
      },
    });

    useAppStore.setState({ incidents: [incident] });

    // Tick at 5s after dispatch (15_000ms total) — should NOT ack yet
    tickDispatchSim(15_000);
    let current = useAppStore.getState().incidents.find((i) => i.id === 'STK-001');
    expect(current?.status).toBe('DISPATCHED');

    // Tick at 8s after dispatch (18_000ms total) — should become ACKNOWLEDGED
    tickDispatchSim(10_000 + DISPATCH_DELAYS.ACK_MS);
    current = useAppStore.getState().incidents.find((i) => i.id === 'STK-001');
    expect(current?.status).toBe('ACKNOWLEDGED');
    expect(current?.dispatch?.unit).toBe('Unit P-12 (fictional)');
  });

  it('progresses ACKNOWLEDGED to ARRIVED after 45s in demo time', () => {
    const incident = createMockIncident('STK-001', 'ACKNOWLEDGED', {
      dispatch: {
        channel: 'Police Control Room (SIMULATED)',
        unit: 'Unit P-12 (fictional)',
        steps: [
          { status: 'DISPATCHED', atDemoMs: 10_000 },
          { status: 'ACKNOWLEDGED', atDemoMs: 18_000 },
        ],
      },
    });

    useAppStore.setState({ incidents: [incident] });

    // Tick before 45s from dispatch (e.g. 50_000ms total, elapsed 40s) — not arrived
    tickDispatchSim(50_000);
    let current = useAppStore.getState().incidents.find((i) => i.id === 'STK-001');
    expect(current?.status).toBe('ACKNOWLEDGED');

    // Tick at 45s from dispatch (10_000 + 45_000 = 55_000ms) — should arrive
    tickDispatchSim(10_000 + DISPATCH_DELAYS.ARRIVE_MS);
    current = useAppStore.getState().incidents.find((i) => i.id === 'STK-001');
    expect(current?.status).toBe('ARRIVED');
  });

  it('auto-pulls next queued incident after 2s pause', () => {
    const queuedIncident = createMockIncident('STK-002', 'QUEUED');

    useAppStore.setState({
      incidents: [queuedIncident],
      autoPull: true,
    });

    // Schedule auto-pull at demo time 5_000ms
    scheduleAutoPull(5_000);

    // Before 2s elapsed (e.g. at 6_500ms) — should still be QUEUED
    tickDispatchSim(6_500);
    let current = useAppStore.getState().incidents.find((i) => i.id === 'STK-002');
    expect(current?.status).toBe('QUEUED');

    // At 2s elapsed (7_000ms) — should be auto-pulled to ACTIVE
    tickDispatchSim(7_000);
    current = useAppStore.getState().incidents.find((i) => i.id === 'STK-002');
    expect(current?.status).toBe('ACTIVE');
  });

  it('does not auto-pull if autoPull is disabled in settings', () => {
    const queuedIncident = createMockIncident('STK-002', 'QUEUED');

    useAppStore.setState({
      incidents: [queuedIncident],
      autoPull: false,
    });

    scheduleAutoPull(5_000);
    tickDispatchSim(7_000);

    const current = useAppStore.getState().incidents.find((i) => i.id === 'STK-002');
    expect(current?.status).toBe('QUEUED');
  });
});
