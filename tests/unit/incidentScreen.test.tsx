/**
 * Unit tests for IncidentScreen component (Phase 4).
 * Verifies all requirements from design.md section 5.4.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IncidentScreen } from '../../src/components/incident/IncidentScreen';
import { useAppStore } from '../../src/store/store';
import type { Incident, ScenarioData } from '../../src/domain/types';

vi.mock('../../src/services/alarm', () => ({
  startAlarm: vi.fn(),
  stopAlarm: vi.fn(),
  acknowledgeAlarm: vi.fn(),
  toggleMute: vi.fn().mockReturnValue(true),
  getIsMuted: vi.fn().mockReturnValue(false),
}));

const mockIncident: Incident = {
  id: 'STK-001',
  cueId: 'cue-01',
  clipId: 'clip-01',
  cameraId: 'CAM-01',
  eventType: 'physical_altercation',
  title: 'Possible physical altercation',
  confidence: 0.92,
  priority: 'HIGH',
  status: 'ACTIVE',
  firedAtWall: '14:23:05',
  firedAtDemoMs: 12000,
  truth: 'crime_like',
  log: [
    {
      atMs: 12000,
      actor: 'system',
      action: 'CUE_FIRED',
      detail: 'Auto-promoted',
    },
  ],
};

const mockScenarioData: ScenarioData = {
  manifest: {
    title: 'Prototype',
    version: '1.0',
    description: 'Test',
    disclaimer: 'Illustrative',
    defaultThreshold: 0.5,
    speeds: [1],
    defaultSpeed: 1,
  },
  cameras: new Map([
    [
      'CAM-01',
      {
        id: 'CAM-01',
        label: 'Gulshan-2 Circle North',
        feedType: 'live',
        status: 'online',
        aspectRatio: '16:9',
        resolution: '1080p',
        mapX: 120,
        mapY: 85,
        defaultClipId: 'clip-01',
      },
    ],
  ]),
  clips: new Map([
    [
      'clip-01',
      {
        id: 'clip-01',
        file: '/videos/clip-01.mp4',
        durationSeconds: 30,
        license: 'CC-BY',
        sourceUrl: '',
        staged: true,
        groundTruth: 'crime_like',
      },
    ],
  ]),
  map: {
    viewBox: '0 0 400 280',
    streets: [],
    landmarks: [],
  },
  scenarios: new Map(),
};

describe('IncidentScreen', () => {
  beforeEach(() => {
    useAppStore.setState({
      incidents: [],
      data: mockScenarioData,
      activeScenario: {
        id: 'S1',
        name: 'Single incident',
        description: 'Demo',
        tiles: [
          {
            index: 0,
            cameraId: 'CAM-01',
            clipId: 'clip-01',
            label: 'Gulshan-2 Circle North',
          },
        ],
        cues: [
          {
            cueId: 'cue-01',
            clipId: 'clip-01',
            cameraId: 'CAM-01',
            triggerSeconds: 12,
            eventType: 'physical_altercation',
            title: 'Possible physical altercation',
            confidence: 0.92,
            priority: 'HIGH',
            box: [{ x: 20, y: 30, w: 40, h: 50 }],
            clipWindow: [7, 17],
          },
        ],
      },
    });
  });

  it('renders empty state when no active incident', () => {
    render(<IncidentScreen />);
    expect(
      screen.getByText('No active incident. Standing by.'),
    ).toBeInTheDocument();
  });

  it('renders all active incident fields from design.md 5.4', () => {
    useAppStore.setState({
      incidents: [mockIncident],
    });

    render(<IncidentScreen />);

    // 1. Alarm banner
    expect(screen.getByText(/AUDIBLE ALARM ON/i)).toBeInTheDocument();
    expect(screen.getByText(/NEW HIGH-PRIORITY INCIDENT/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mute alarm/i })).toBeInTheDocument();

    // 2. Enlarged live feed overlay & camera
    expect(screen.getAllByText('CAM-01').length).toBeGreaterThan(0);

    // 3. Location & mini map
    expect(screen.getAllByText(/Gulshan-2 Circle North/i).length).toBeGreaterThan(0);

    // 4. Fields
    expect(screen.getByText('STK-001')).toBeInTheDocument();
    expect(screen.getByText('Possible physical altercation')).toBeInTheDocument();

    // 5. Chips
    expect(screen.getByText(/Priority: HIGH/i)).toBeInTheDocument();
    expect(screen.getByText(/Detection confidence \(scripted\) 92%/i)).toBeInTheDocument();

    // 6. Status line
    expect(screen.getByText(/Awaiting verification \| operator review required/i)).toBeInTheDocument();

    // 7. Recent event clip strip
    expect(screen.getByText(/Recent event clip/i)).toBeInTheDocument();

    // 8. Buttons
    expect(screen.getByRole('button', { name: /✓ Confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /✕ Dismiss/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /↗ Request review/i })).toBeInTheDocument();
  });

  it('shows dismiss dialog and enforces reason required', () => {
    useAppStore.setState({
      incidents: [mockIncident],
    });

    render(<IncidentScreen />);

    // Click Dismiss
    fireEvent.click(screen.getByRole('button', { name: /✕ Dismiss/i }));

    // Dismiss dialog opens
    expect(screen.getByText(/A reason is required to dismiss this incident/i)).toBeInTheDocument();

    // The submit button in dialog should be disabled without a selection
    const dismissSubmitBtn = screen.getAllByRole('button', { name: /✕ Dismiss/i })[1];
    expect(dismissSubmitBtn).toBeDisabled();

    // Select "Play or sport"
    fireEvent.click(screen.getByLabelText(/Play or sport/i));
    expect(dismissSubmitBtn).not.toBeDisabled();

    // Submitting applies action
    fireEvent.click(dismissSubmitBtn);
    const incident = useAppStore.getState().incidents.find((i) => i.id === 'STK-001');
    expect(incident?.status).toBe('DISMISSED');
    expect(incident?.dismissReason).toBe('Play or sport');
  });

  it('shows dispatch sheet on confirm and allows sending dispatch', () => {
    useAppStore.setState({
      incidents: [mockIncident],
    });

    render(<IncidentScreen />);

    // Click Confirm
    fireEvent.click(screen.getByRole('button', { name: /✓ Confirm/i }));

    // DispatchSheet modal appears
    expect(screen.getByText(/Police Control Room \(SIMULATED\)/i)).toBeInTheDocument();
    expect(screen.getByText(/AUTO-ATTACHED/i)).toBeInTheDocument();

    // Send dispatch
    fireEvent.click(screen.getByRole('button', { name: /📡 Send dispatch/i }));

    const incident = useAppStore.getState().incidents.find((i) => i.id === 'STK-001');
    expect(incident?.status).toBe('DISPATCHED');
  });

  it('renders queue banner when other alerts are queued', () => {
    const queuedIncident: Incident = {
      ...mockIncident,
      id: 'STK-002',
      status: 'QUEUED',
      priority: 'HIGH',
    };

    useAppStore.setState({
      incidents: [mockIncident, queuedIncident],
    });

    render(<IncidentScreen />);

    expect(screen.getByText(/1 more alert queued/i)).toBeInTheDocument();
    expect(screen.getByText(/Highest: HIGH \(STK-002\)/i)).toBeInTheDocument();
  });
});
