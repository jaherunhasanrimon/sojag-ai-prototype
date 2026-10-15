/**
 * Unit tests for domain types / Zod schemas.
 * Verifies the schemas accept valid data and reject invalid data.
 */
import { describe, it, expect } from 'vitest';
import {
  ClipSchema,
  CameraSchema,
  CueSchema,
  ScenarioSchema,
  PrioritySchema,
  GroundTruthSchema,
} from '../../src/domain/types';

describe('PrioritySchema', () => {
  it('accepts HIGH, MEDIUM, LOW', () => {
    expect(PrioritySchema.parse('HIGH')).toBe('HIGH');
    expect(PrioritySchema.parse('MEDIUM')).toBe('MEDIUM');
    expect(PrioritySchema.parse('LOW')).toBe('LOW');
  });

  it('rejects invalid priority', () => {
    expect(() => PrioritySchema.parse('CRITICAL')).toThrow();
  });
});

describe('GroundTruthSchema', () => {
  it('accepts crime_like and non_crime', () => {
    expect(GroundTruthSchema.parse('crime_like')).toBe('crime_like');
    expect(GroundTruthSchema.parse('non_crime')).toBe('non_crime');
  });
});

describe('ClipSchema', () => {
  const validClip = {
    id: 'clip_test',
    file: 'videos/test.mp4',
    durationSec: 30,
    label: 'non_crime',
    category: 'plain_traffic',
    source: 'staged by team',
    consent: true,
  };

  it('accepts a valid clip', () => {
    const result = ClipSchema.parse(validClip);
    expect(result.id).toBe('clip_test');
  });

  it('accepts consent: false', () => {
    const result = ClipSchema.parse({ ...validClip, consent: false });
    expect(result.consent).toBe(false);
  });

  it('accepts consent: "n/a"', () => {
    const result = ClipSchema.parse({ ...validClip, consent: 'n/a' });
    expect(result.consent).toBe('n/a');
  });

  it('rejects empty source', () => {
    expect(() => ClipSchema.parse({ ...validClip, source: '' })).toThrow();
  });

  it('rejects missing id', () => {
    expect(() => ClipSchema.parse({ ...validClip, id: '' })).toThrow();
  });
});

describe('CameraSchema', () => {
  it('accepts a valid camera', () => {
    const result = CameraSchema.parse({
      id: 'CAM-01',
      label: 'Example intersection A, Dhaka',
      mapX: 150,
      mapY: 120,
    });
    expect(result.id).toBe('CAM-01');
  });
});

describe('CueSchema', () => {
  const validCue = {
    cueId: 'cue_test',
    clipId: 'clip_test',
    atSec: 12,
    clipWindow: [7, 17],
    event: {
      type: 'physical_altercation',
      title: 'Possible physical altercation',
      confidence: 0.92,
      priority: 'HIGH',
    },
    truth: 'crime_like',
  };

  it('accepts a valid cue', () => {
    const result = CueSchema.parse(validCue);
    expect(result.cueId).toBe('cue_test');
    expect(result.event.confidence).toBe(0.92);
  });

  it('rejects confidence > 1', () => {
    expect(() => CueSchema.parse({
      ...validCue,
      event: { ...validCue.event, confidence: 1.5 },
    })).toThrow();
  });

  it('rejects confidence < 0', () => {
    expect(() => CueSchema.parse({
      ...validCue,
      event: { ...validCue.event, confidence: -0.1 },
    })).toThrow();
  });
});

describe('ScenarioSchema', () => {
  it('accepts a minimal valid scenario', () => {
    const result = ScenarioSchema.parse({
      id: 'S5',
      name: 'Quiet shift',
      tiles: [{ tileIndex: 0, cameraId: 'CAM-01', clipId: 'clip_test' }],
      armedCueIds: [],
    });
    expect(result.id).toBe('S5');
    expect(result.cues).toEqual([]);
  });

  it('rejects invalid scenario ID', () => {
    expect(() => ScenarioSchema.parse({
      id: 'S9',
      name: 'Invalid',
      tiles: [],
      armedCueIds: [],
    })).toThrow();
  });
});
