/**
 * tests/unit/evidence.test.ts — Unit tests for simulated evidence package builder (Phase 6).
 */
import { describe, it, expect, vi } from 'vitest';
import { buildEvidencePackage, downloadJsonFile } from '../../src/domain/evidence';
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
  ]),
  clips: new Map([
    ['clip-1', { id: 'clip-1', file: 'videos/clip-1.mp4', durationSec: 30, fps: 30, resolution: '1080p', truth: 'crime_like', tags: ['fight'] }],
  ]),
  map: { viewBox: '0 0 100 100', streets: [], landmarks: [] },
  scenarios: new Map(),
};

const makeMockIncident = (extra: Partial<Incident> = {}): Incident => ({
  id: 'STK-001',
  cueId: 'cue-01',
  clipId: 'clip-1',
  cameraId: 'CAM-01',
  title: 'Street Altercation',
  eventType: 'altercation',
  confidence: 0.88,
  priority: 'HIGH',
  status: 'CONFIRMED',
  firedAtDemoMs: 5000,
  firedAtWall: '10:00:05',
  truth: 'crime_like',
  log: [
    { atMs: 5000, actor: 'system', action: 'CUE_FIRED', detail: 'Scripted cue fired' },
    { atMs: 8000, actor: 'operator', action: 'CONFIRM' },
  ],
  dispatch: {
    channel: 'Police Sector 4',
    unit: 'Patrol 12',
    steps: [
      { status: 'SENT', atDemoMs: 8500 },
      { status: 'ACKNOWLEDGED', atDemoMs: 12000 },
    ],
  },
  ...extra,
});

describe('Evidence Package Builder', () => {
  it('builds a complete evidence package with non-negotiable honesty label', () => {
    const inc = makeMockIncident();
    const pkg = buildEvidencePackage(inc, mockScenarioData);

    expect(pkg.incidentId).toBe('STK-001');
    expect(pkg.label).toBe('SIMULATED, scripted detection on pre-labelled clip');
    expect(pkg.camera).toBe('CAM-01');
    expect(pkg.location).toBe('Gulshan Intersection');
    expect(pkg.clip.file).toBe('videos/clip-1.mp4');
    expect(pkg.event.title).toBe('Street Altercation');
    expect(pkg.event.scriptedConfidence).toBe(0.88);
    expect(pkg.event.priority).toBe('HIGH');
    expect(pkg.decision).toEqual({
      actor: 'operator',
      action: 'CONFIRM',
      atDemoMs: 8000,
      reason: undefined,
      outcome: undefined,
    });
    expect(pkg.dispatch?.channel).toBe('Police Sector 4');
    expect(pkg.log).toHaveLength(2);
    expect(pkg.exportedAt).toBeDefined();
  });

  it('includes dismiss reason and outcome when present', () => {
    const inc = makeMockIncident({
      status: 'DISMISSED',
      dismissReason: 'Normal activity / false detection',
      log: [
        { atMs: 5000, actor: 'system', action: 'CUE_FIRED' },
        { atMs: 9000, actor: 'operator', action: 'DISMISS' },
      ],
    });

    const pkg = buildEvidencePackage(inc, mockScenarioData);
    expect(pkg.decision?.action).toBe('DISMISS');
    expect(pkg.decision?.reason).toBe('Normal activity / false detection');
  });

  it('falls back gracefully when scenario data or clip is missing', () => {
    const inc = makeMockIncident({ clipId: 'unknown-clip', cameraId: 'UNKNOWN-CAM', log: [] });
    const pkg = buildEvidencePackage(inc, null);

    expect(pkg.clip.file).toBe('videos/unknown-clip.mp4');
    expect(pkg.location).toBeUndefined();
    expect(pkg.decision).toBeUndefined();
  });

  it('triggers browser file download with JSON content', () => {
    const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/test-blob');
    const revokeObjectURLMock = vi.fn();
    globalThis.URL.createObjectURL = createObjectURLMock;
    globalThis.URL.revokeObjectURL = revokeObjectURLMock;

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadJsonFile('test-pkg.json', { test: true });

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/test-blob');

    clickSpy.mockRestore();
  });
});
