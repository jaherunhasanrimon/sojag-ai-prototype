/**
 * services/loader.ts — Fetch and validate all data files from public/data/.
 * Uses Zod schemas to fail fast on bad data.
 * No external network calls — only same-origin fetches to static assets.
 */
import {
  ClipsFileSchema,
  CamerasFileSchema,
  MapFileSchema,
  ScenarioSchema,
  type Clip,
  type Camera,
  type Scenario,
  type DataBundle,
  type MapFile,
} from '../domain/types';

/** All scenario IDs to load */
const SCENARIO_IDS = ['s1', 's2', 's3', 's4', 's5', 's6'] as const;

export interface LoadError {
  file: string;
  message: string;
  details?: string;
}

export interface LoadResult {
  data: DataBundle | null;
  errors: LoadError[];
  warnings: string[];
}

/**
 * Loads and validates all data files. Returns errors if any file fails.
 * Never throws — all errors are collected in the result.
 */
export async function loadAllData(): Promise<LoadResult> {
  const errors: LoadError[] = [];
  const warnings: string[] = [];

  // Load clips
  const clips = new Map<string, Clip>();
  try {
    const raw = await fetchJson('/data/clips.json');
    const parsed = ClipsFileSchema.parse(raw);
    for (const clip of parsed.clips) {
      if (clips.has(clip.id)) {
        warnings.push(`Duplicate clip ID: ${clip.id}`);
      }
      // Check for TODO/incomplete fields (CLAUDE.md rule 6)
      if (clip.source.startsWith('TODO')) {
        warnings.push(`Clip ${clip.id}: source is still TODO — clip cannot be used in scenarios until filled`);
      }
      if (typeof clip.consent === 'string' && clip.consent !== 'n/a') {
        warnings.push(`Clip ${clip.id}: consent field is invalid`);
      }
      clips.set(clip.id, clip);
    }
  } catch (e) {
    errors.push({ file: 'clips.json', message: 'Failed to load or parse', details: String(e) });
  }

  // Load cameras
  const cameras = new Map<string, Camera>();
  try {
    const raw = await fetchJson('/data/cameras.json');
    const parsed = CamerasFileSchema.parse(raw);
    for (const cam of parsed.cameras) {
      cameras.set(cam.id, cam);
    }
  } catch (e) {
    errors.push({ file: 'cameras.json', message: 'Failed to load or parse', details: String(e) });
  }

  // Load map
  let map: MapFile | null = null;
  try {
    const raw = await fetchJson('/data/map.json');
    map = MapFileSchema.parse(raw);
  } catch (e) {
    errors.push({ file: 'map.json', message: 'Failed to load or parse', details: String(e) });
  }

  // Load scenarios
  const scenarios = new Map<string, Scenario>();
  for (const sid of SCENARIO_IDS) {
    try {
      const raw = await fetchJson(`/data/scenarios/${sid}.json`);
      const parsed = ScenarioSchema.parse(raw);
      scenarios.set(parsed.id, parsed);

      // Cross-validate: check clip and camera references
      for (const tile of parsed.tiles) {
        if (!clips.has(tile.clipId)) {
          warnings.push(`Scenario ${parsed.id}: tile references unknown clip ${tile.clipId}`);
        }
        if (!cameras.has(tile.cameraId)) {
          warnings.push(`Scenario ${parsed.id}: tile references unknown camera ${tile.cameraId}`);
        }
      }

      for (const cue of parsed.cues) {
        const clip = clips.get(cue.clipId);
        if (!clip) {
          warnings.push(`Scenario ${parsed.id}: cue ${cue.cueId} references unknown clip ${cue.clipId}`);
        } else {
          // Check cue timing is within clip duration
          if (cue.atSec > clip.durationSec) {
            warnings.push(
              `Scenario ${parsed.id}: cue ${cue.cueId} fires at ${cue.atSec}s but clip ${clip.id} is only ${clip.durationSec}s`,
            );
          }
          if (cue.clipWindow[1] > clip.durationSec) {
            warnings.push(
              `Scenario ${parsed.id}: cue ${cue.cueId} clipWindow ends at ${cue.clipWindow[1]}s but clip is only ${clip.durationSec}s`,
            );
          }
        }
      }
    } catch (e) {
      errors.push({
        file: `scenarios/${sid}.json`,
        message: 'Failed to load or parse',
        details: String(e),
      });
    }
  }

  if (errors.length > 0 || !map) {
    return { data: null, errors, warnings };
  }

  return {
    data: { clips, cameras, map, scenarios },
    errors: [],
    warnings,
  };
}

/**
 * Fetch JSON from same-origin only. Never fetches external URLs.
 */
async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${path}`);
  }
  return res.json();
}
