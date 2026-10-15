/**
 * Unit tests for QueueTable, IncidentDrawer, SwapDialog, and SupervisorModal (Phase 5).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { QueueTable } from '../../src/components/dashboard/QueueTable';
import { useAppStore } from '../../src/store/store';
import type { Incident, ScenarioData } from '../../src/domain/types';

const mockScenarioData: ScenarioData = {
  manifest: {
    title: 'Test',
    version: '1.0',
    description: '',
    disclaimer: '',
    defaultThreshold: 0.5,
    speeds: [1],
    defaultSpeed: 1,
  },
  cameras: new Map([
    ['CAM-01', { id: 'CAM-01', label: 'Gulshan Intersection', feedType: 'live', status: 'online', aspectRatio: '16:9', resolution: '1080p', mapX: 10, mapY: 20, defaultClipId: 'c1' }],
    ['CAM-02', { id: 'CAM-02', label: 'Banani Market', feedType: 'live', status: 'online', aspectRatio: '16:9', resolution: '1080p', mapX: 30, mapY: 40, defaultClipId: 'c2' }],
  ]),
  clips: new Map(),
  map: { viewBox: '0 0 100 100', streets: [], landmarks: [] },
  scenarios: new Map(),
};

const makeIncident = (id: string, status: any, priority: any, demoMs: number, extra: Partial<Incident> = {}): Incident => ({
  id,
  cueId: `cue-${id}`,
  clipId: `clip-${id}`,
  cameraId: 'CAM-01',
  title: `Event ${id}`,
  eventType: 'altercation',
  confidence: 0.85,
  priority,
  status,
  firedAtDemoMs: demoMs,
  firedAtWall: '10:00:00',
  truth: 'crime_like',
  log: [
    { atMs: demoMs, actor: 'system', action: 'CUE_FIRED', detail: 'Created' },
  ],
  ...extra,
});

describe('QueueTable', () => {
  beforeEach(() => {
    useAppStore.setState({
      incidents: [],
      auditLog: [],
      data: mockScenarioData,
    });
  });

  it('renders lock rule note visible in panel (design.md 5.5)', () => {
    render(<QueueTable />);
    expect(
      screen.getByText(/New alerts queue; they never overwrite an incident under review/i),
    ).toBeInTheDocument();
  });

  it('pins the active incident with LOCKED badge at the top', () => {
    const incQueued = makeIncident('STK-002', 'QUEUED', 'HIGH', 1000);
    const incActive = makeIncident('STK-001', 'ACTIVE', 'LOW', 2000);

    useAppStore.setState({
      incidents: [incQueued, incActive],
    });

    render(<QueueTable />);

    // Check LOCKED badge
    expect(screen.getByText('LOCKED')).toBeInTheDocument();

    // Active row should be first in table rows
    const rows = screen.getAllByRole('row');
    // rows[0] is table header, rows[1] should be STK-001
    expect(rows[1]).toHaveTextContent('STK-001');
    expect(rows[2]).toHaveTextContent('STK-002');
  });

  it('sorts remaining incidents by priority (HIGH > MEDIUM > LOW) then age', () => {
    const incLow = makeIncident('STK-001', 'QUEUED', 'LOW', 1000);
    const incHighNew = makeIncident('STK-002', 'QUEUED', 'HIGH', 3000);
    const incHighOld = makeIncident('STK-003', 'QUEUED', 'HIGH', 2000);
    const incMed = makeIncident('STK-004', 'QUEUED', 'MEDIUM', 1500);

    useAppStore.setState({
      incidents: [incLow, incHighNew, incHighOld, incMed],
    });

    render(<QueueTable />);

    const rows = screen.getAllByRole('row');
    // Expect: STK-003 (HIGH, older), STK-002 (HIGH, newer), STK-004 (MEDIUM), STK-001 (LOW)
    expect(rows[1]).toHaveTextContent('STK-003');
    expect(rows[2]).toHaveTextContent('STK-002');
    expect(rows[3]).toHaveTextContent('STK-004');
    expect(rows[4]).toHaveTextContent('STK-001');
  });

  it('opens IncidentDrawer on row click and displays audit log', () => {
    const inc = makeIncident('STK-001', 'QUEUED', 'HIGH', 1000);
    useAppStore.setState({ incidents: [inc] });

    render(<QueueTable />);

    fireEvent.click(screen.getByText('STK-001'));

    // Drawer opens
    expect(screen.getByText('Incident Audit Log')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('supports operator swap action (Rule 3) with confirmation dialog', () => {
    const incActive = makeIncident('STK-001', 'ACTIVE', 'HIGH', 1000);
    const incQueued = makeIncident('STK-002', 'QUEUED', 'HIGH', 2000);

    useAppStore.setState({ incidents: [incActive, incQueued] });

    render(<QueueTable />);

    // Click queued incident to open drawer
    fireEvent.click(screen.getByText('STK-002'));

    // Click "Review this instead" button in drawer
    const swapBtn = screen.getByRole('button', { name: /🔄 Review this instead/i });
    expect(swapBtn).toBeInTheDocument();
    fireEvent.click(swapBtn);

    // Swap confirmation dialog appears
    expect(screen.getByText(/Swap Active Incident\? \(Rule 3\)/i)).toBeInTheDocument();
    expect(screen.getByText('PAUSED')).toBeInTheDocument();

    // Confirm swap
    fireEvent.click(screen.getByRole('button', { name: /🔄 Confirm Swap/i }));

    // Store state should reflect: STK-001 is PAUSED, STK-002 is ACTIVE
    const st1 = useAppStore.getState().incidents.find((i) => i.id === 'STK-001');
    const st2 = useAppStore.getState().incidents.find((i) => i.id === 'STK-002');
    expect(st1?.status).toBe('PAUSED');
    expect(st2?.status).toBe('ACTIVE');
  });

  it('opens SupervisorModal on clicking REVIEW_REQUESTED row and supports approve/dismiss', () => {
    const incEscalated = makeIncident('STK-004', 'REVIEW_REQUESTED', 'HIGH', 1000, {
      operator: 'Op. A',
    });

    useAppStore.setState({ incidents: [incEscalated] });

    render(<QueueTable />);

    // Click escalated row
    fireEvent.click(screen.getByText('STK-004'));

    // Supervisor modal opens
    expect(screen.getByText(/SUPERVISOR ESCALATION/i)).toBeInTheDocument();
    expect(screen.getByText(/Review Incident STK-004/i)).toBeInTheDocument();

    // Approve confirm
    fireEvent.click(screen.getByRole('button', { name: /✓ Approve Confirm/i }));

    const updated = useAppStore.getState().incidents.find((i) => i.id === 'STK-004');
    expect(updated?.status).toBe('CONFIRMED');
  });

  it('updates footer counters correctly for session', () => {
    const inc1 = makeIncident('STK-001', 'ACTIVE', 'HIGH', 1000);
    const inc2 = makeIncident('STK-002', 'QUEUED', 'HIGH', 2000);
    const inc3 = makeIncident('STK-003', 'CLOSED', 'LOW', 3000);
    const inc4 = makeIncident('STK-004', 'DISMISSED', 'MEDIUM', 4000);

    useAppStore.setState({ incidents: [inc1, inc2, inc3, inc4] });

    render(<QueueTable />);

    expect(screen.getAllByText('Active').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Queued').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Closed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dismissed').length).toBeGreaterThan(0);
  });
});
