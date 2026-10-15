/**
 * tests/unit/scenarioS3.test.tsx — End-to-end scenario test for Scenario S3 (Acceptance Criterion 9).
 * Verifies lock rule under simultaneous alerts:
 * 1. Alert 1 fires and becomes ACTIVE on Display B.
 * 2. Alert 2 fires while Alert 1 is under review: Alert 2 queues, Alert 1 remains ACTIVE.
 * 3. Display B shows queue alert banner; Display C shows queued row.
 * 4. Operator confirms Alert 1, dispatches unit.
 * 5. Pull next alert promotes Alert 2 to ACTIVE.
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomPage } from '../../src/pages/Room';
import { useAppStore } from '../../src/store/store';
import { useDemoClock } from '../../src/services/clock';
import { createSchedulerState } from '../../src/domain/cueScheduler';
import type { Scenario, ScenarioData } from '../../src/domain/types';

vi.mock('../../src/services/alarm', () => ({
  startAlarm: vi.fn(),
  stopAlarm: vi.fn(),
  acknowledgeAlarm: vi.fn(),
  toggleMute: vi.fn().mockReturnValue(true),
  getIsMuted: vi.fn().mockReturnValue(false),
}));

const mockScenarioS3: Scenario = {
  id: 'S3',
  name: 'Simultaneous incidents',
  description: 'Second alert queues while first is under review. Lock rule demo.',
  durationSec: 60,
  wallLayout: '3x2',
  tiles: [
    { tileIndex: 0, clipId: 'clip-01', cameraId: 'CAM-01', startOffsetSec: 0, loop: true },
    { tileIndex: 1, clipId: 'clip-02', cameraId: 'CAM-02', startOffsetSec: 0, loop: true },
  ],
  cues: [
    {
      cueId: 'cue-s3-1',
      clipId: 'clip-01',
      atSec: 5,
      event: {
        title: 'Street Altercation In Progress',
        type: 'altercation',
        confidence: 0.94,
        priority: 'HIGH',
      },
    },
    {
      cueId: 'cue-s3-2',
      clipId: 'clip-02',
      atSec: 10,
      event: {
        title: 'Crowd Surge Near Gate',
        type: 'crowd_surge',
        confidence: 0.88,
        priority: 'HIGH',
      },
    },
  ],
};

const mockData: ScenarioData = {
  manifest: {
    title: 'Prototype',
    version: '1.0',
    description: '',
    disclaimer: '',
    defaultThreshold: 0.5,
    speeds: [1],
    defaultSpeed: 1,
  },
  cameras: new Map([
    ['CAM-01', { id: 'CAM-01', label: 'Gulshan 2 North', feedType: 'live', status: 'online', aspectRatio: '16:9', resolution: '1080p', mapX: 10, mapY: 20, defaultClipId: 'clip-01' }],
    ['CAM-02', { id: 'CAM-02', label: 'Banani Market Gate', feedType: 'live', status: 'online', aspectRatio: '16:9', resolution: '1080p', mapX: 30, mapY: 40, defaultClipId: 'clip-02' }],
  ]),
  clips: new Map([
    ['clip-01', { id: 'clip-01', file: 'videos/clip-01.mp4', durationSec: 30, fps: 30, resolution: '1080p', truth: 'crime_like', tags: ['fight'] }],
    ['clip-02', { id: 'clip-02', file: 'videos/clip-02.mp4', durationSec: 30, fps: 30, resolution: '1080p', truth: 'crime_like', tags: ['crowd'] }],
  ]),
  map: { viewBox: '0 0 100 100', streets: [], landmarks: [] },
  scenarios: new Map([['S3', mockScenarioS3]]),
};

describe('E2E Scenario S3: Simultaneous Incidents & Lock Rule', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAppStore.setState({
      loadingState: 'loaded',
      data: mockData,
      activeScenario: mockScenarioS3,
      demoStarted: true,
      incidents: [],
      auditLog: [],
      schedulerState: createSchedulerState(),
    });
    useDemoClock.getState().reset();
  });

  it('runs S3 end-to-end: lock rule prevents override, queues second alert, and facilitates workflow', () => {
    render(
      <MemoryRouter>
        <RoomPage />
      </MemoryRouter>,
    );

    // Initial state: No active incident on Display B
    expect(screen.getByText(/No active incident\. Standing by\./i)).toBeInTheDocument();

    // 1. Advance playback: Tile 0 reaches 5s -> fires Cue 1
    act(() => {
      useAppStore.getState().onTileTimeUpdate(0, 5);
    });

    // Alert 1 (STK-001) should now be ACTIVE on Display B
    expect(screen.getAllByText('Street Altercation In Progress').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/STK-001/i).length).toBeGreaterThan(0);
    // Display C should show STK-001 with LOCKED badge
    expect(screen.getByText('LOCKED')).toBeInTheDocument();

    // 2. Advance playback: Tile 1 reaches 10s while Alert 1 is under review -> fires Cue 2
    act(() => {
      useAppStore.getState().onTileTimeUpdate(1, 10);
    });

    // LOCK RULE VERIFICATION (Invariant I2):
    // Display B must NOT be overwritten; Alert 1 must remain active on screen!
    expect(screen.getAllByText('Street Altercation In Progress').length).toBeGreaterThan(0);

    // Display B must show the queue alert notification banner
    expect(screen.getByText(/more alert.*queued/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Crowd Surge Near Gate/i).length).toBeGreaterThan(0);

    // Display C must have both incidents: STK-001 (ACTIVE/LOCKED) and STK-002 (QUEUED)
    const tableRows = screen.getAllByRole('row');
    expect(tableRows.length).toBeGreaterThanOrEqual(3); // Header + 2 rows
    expect(screen.getAllByText('STK-002').length).toBeGreaterThan(0);

    // 3. Operator confirms Alert 1 on Display B
    const confirmBtn = screen.getByRole('button', { name: /✓ Confirm$/i });
    fireEvent.click(confirmBtn);

    // Dispatch Sheet opens
    expect(screen.getByText(/Dispatch — STK-001/i)).toBeInTheDocument();
    const sendDispatchBtn = screen.getByRole('button', { name: /Send dispatch/i });
    fireEvent.click(sendDispatchBtn);

    // Incident 1 is now dispatched
    const st1 = useAppStore.getState().incidents.find((i) => i.id === 'STK-001');
    expect(st1?.status).toBe('DISPATCHED');

    // 4. Operator pulls next queued incident (STK-002)
    act(() => {
      useAppStore.getState().pullNextIncident();
    });

    // Alert 2 (STK-002) is now ACTIVE on Display B
    const st2 = useAppStore.getState().incidents.find((i) => i.id === 'STK-002');
    expect(st2?.status).toBe('ACTIVE');

    // 5. Verify audit log integrity across the session
    const audit = useAppStore.getState().auditLog;
    expect(audit.some((l) => l.action === 'CUE_FIRED' && l.detail?.includes('cue-s3-1'))).toBe(true);
    expect(audit.some((l) => l.action === 'CUE_FIRED' && l.detail?.includes('cue-s3-2'))).toBe(true);
    expect(audit.some((l) => l.action === 'CONFIRM')).toBe(true);
    expect(audit.some((l) => l.action === 'SEND_DISPATCH')).toBe(true);
  });
});
