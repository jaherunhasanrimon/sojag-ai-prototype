/**
 * tests/unit/summary.test.tsx — Unit tests for Session Summary page (Phase 6).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SummaryPage } from '../../src/pages/Summary';
import { useAppStore } from '../../src/store/store';
import * as evidenceModule from '../../src/domain/evidence';
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
    ['CAM-01', { id: 'CAM-01', label: 'Gulshan 2 Circle', feedType: 'live', status: 'online', aspectRatio: '16:9', resolution: '1080p', mapX: 10, mapY: 20, defaultClipId: 'c1' }],
  ]),
  clips: new Map(),
  map: { viewBox: '0 0 100 100', streets: [], landmarks: [] },
  scenarios: new Map(),
};

const makeMockIncident = (id: string, status: any = 'CONFIRMED'): Incident => ({
  id,
  cueId: `cue-${id}`,
  clipId: `clip-${id}`,
  cameraId: 'CAM-01',
  title: 'Perimeter Breach',
  eventType: 'trespass',
  confidence: 0.92,
  priority: 'HIGH',
  status,
  firedAtDemoMs: 10000,
  firedAtWall: '10:00:10',
  truth: 'crime_like',
  log: [
    { atMs: 10000, actor: 'system', action: 'CUE_FIRED' },
    { atMs: 14000, actor: 'operator', action: 'CONFIRM' },
  ],
});

describe('SummaryPage', () => {
  beforeEach(() => {
    useAppStore.setState({
      incidents: [],
      auditLog: [],
      data: mockScenarioData,
      activeScenario: {
        id: 'S1',
        name: 'Single incident',
        description: '',
        durationSec: 60,
        wallLayout: '3x2',
        tiles: [],
        cues: [],
      },
    });
  });

  it('renders heading and non-negotiable performance disclaimer tag', () => {
    render(
      <MemoryRouter>
        <SummaryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Session Performance & Alert Summary')).toBeInTheDocument();
    expect(
      screen.getByText(/Demo metrics, not performance evidence\./i),
    ).toBeInTheDocument();
  });

  it('displays empty state message when no alerts are recorded', () => {
    render(
      <MemoryRouter>
        <SummaryPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/No alerts recorded during this session/i),
    ).toBeInTheDocument();
  });

  it('renders table columns and rows for recorded alerts', () => {
    const inc = makeMockIncident('STK-001', 'CONFIRMED');
    useAppStore.setState({ incidents: [inc] });

    render(
      <MemoryRouter>
        <SummaryPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('10:00:10')).toBeInTheDocument();
    expect(screen.getByText('CAM-01')).toBeInTheDocument();
    expect(screen.getByText('Gulshan 2 Circle')).toBeInTheDocument();
    expect(screen.getByText('Perimeter Breach')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('crime_like')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText('4s')).toBeInTheDocument(); // 14000 - 10000 = 4s
  });

  it('triggers downloadJsonFile when clicking Export Audit Log', () => {
    const downloadSpy = vi.spyOn(evidenceModule, 'downloadJsonFile').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <SummaryPage />
      </MemoryRouter>,
    );

    const btn = screen.getByRole('button', { name: /Export Audit Log/i });
    fireEvent.click(btn);

    expect(downloadSpy).toHaveBeenCalledWith(
      'sotorko-audit-log.json',
      expect.objectContaining({
        disclaimer: 'ILLUSTRATIVE — Demo metrics, not performance evidence',
      }),
    );
  });

  it('triggers downloadJsonFile when clicking Export Evidence Package', () => {
    const downloadSpy = vi.spyOn(evidenceModule, 'downloadJsonFile').mockImplementation(() => {});
    const inc = makeMockIncident('STK-001');
    useAppStore.setState({ incidents: [inc] });

    render(
      <MemoryRouter>
        <SummaryPage />
      </MemoryRouter>,
    );

    const btn = screen.getByRole('button', { name: /Export Evidence Package/i });
    fireEvent.click(btn);

    expect(downloadSpy).toHaveBeenCalledWith(
      'sotorko-evidence-stk-001.json',
      expect.objectContaining({
        incidentId: 'STK-001',
        label: 'SIMULATED, scripted detection on pre-labelled clip',
      }),
    );
  });
});
