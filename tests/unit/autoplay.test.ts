/**
 * tests/unit/autoplay.test.ts — Unit tests for autoplay script engine (Phase 6).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tickAutoplay, resetAutoplay } from '../../src/services/autoplay';
import { useAppStore } from '../../src/store/store';
import type { Incident, Scenario } from '../../src/domain/types';

const mockScenario: Scenario = {
  id: 'S6',
  name: 'Full pitch run',
  description: 'Autoplay test',
  durationSec: 90,
  wallLayout: '3x2',
  tiles: [
    { tileIndex: 0, clipId: 'clip-1', cameraId: 'CAM-01', startOffsetSec: 0, loop: true },
  ],
  cues: [
    {
      cueId: 'cue-01',
      clipId: 'clip-1',
      atSec: 5,
      event: { title: 'Shoplifting', type: 'theft', confidence: 0.9, priority: 'HIGH' },
    },
  ],
  autoplay: {
    enabled: true,
    steps: [
      { atSec: 5, action: 'fireCue', arg: 'cue-01' },
      { atSec: 10, action: 'operatorConfirm' },
      { atSec: 20, action: 'closeIncident', arg: 'STK-001' },
    ],
  },
};

const makeMockIncident = (status: any = 'ACTIVE'): Incident => ({
  id: 'STK-001',
  cueId: 'cue-01',
  clipId: 'clip-1',
  cameraId: 'CAM-01',
  title: 'Shoplifting',
  eventType: 'theft',
  confidence: 0.9,
  priority: 'HIGH',
  status,
  firedAtDemoMs: 5000,
  firedAtWall: '10:00:05',
  truth: 'crime_like',
  log: [],
});

describe('Autoplay Script Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetAutoplay();
    useAppStore.setState({
      activeScenario: mockScenario,
      incidents: [],
    });
  });

  it('triggers fireCue when demo time reaches atSec', () => {
    const onTileSpy = vi.spyOn(useAppStore.getState(), 'onTileTimeUpdate');

    // Before step time
    tickAutoplay(4000); // 4s
    expect(onTileSpy).not.toHaveBeenCalled();

    // At step time (5s)
    tickAutoplay(5000);
    expect(onTileSpy).toHaveBeenCalledWith(0, 5);

    // Call again, should not fire twice
    tickAutoplay(6000);
    expect(onTileSpy).toHaveBeenCalledTimes(1);
  });

  it('executes operatorConfirm and dispatches active incident', () => {
    const inc = makeMockIncident('ACTIVE');
    useAppStore.setState({ incidents: [inc] });

    const applyActionSpy = vi.spyOn(useAppStore.getState(), 'applyAction');

    // Tick to 10s
    tickAutoplay(10000);

    expect(applyActionSpy).toHaveBeenCalledWith('STK-001', { type: 'CONFIRM' });
    expect(applyActionSpy).toHaveBeenCalledWith('STK-001', { type: 'SEND_DISPATCH' });
  });

  it('executes operatorDismiss when specified', () => {
    const dismissScenario: Scenario = {
      ...mockScenario,
      autoplay: {
        enabled: true,
        steps: [{ atSec: 8, action: 'operatorDismiss', arg: 'False alarm' }],
      },
    };
    useAppStore.setState({ activeScenario: dismissScenario, incidents: [makeMockIncident('ACTIVE')] });

    const applyActionSpy = vi.spyOn(useAppStore.getState(), 'applyAction');

    tickAutoplay(8000);
    expect(applyActionSpy).toHaveBeenCalledWith('STK-001', {
      type: 'DISMISS',
      reason: 'False alarm',
    });
  });

  it('executes closeIncident on arrived or target incident', () => {
    const inc = makeMockIncident('ARRIVED');
    useAppStore.setState({ incidents: [inc] });

    const applyActionSpy = vi.spyOn(useAppStore.getState(), 'applyAction');

    tickAutoplay(20000);
    expect(applyActionSpy).toHaveBeenCalledWith('STK-001', {
      type: 'CLOSE',
      outcome: 'Resolved',
    });
  });

  it('resets executed step state on resetAutoplay()', () => {
    const onTileSpy = vi.spyOn(useAppStore.getState(), 'onTileTimeUpdate');

    tickAutoplay(5000);
    expect(onTileSpy).toHaveBeenCalledTimes(1);

    resetAutoplay();

    tickAutoplay(5000);
    expect(onTileSpy).toHaveBeenCalledTimes(2);
  });
});
