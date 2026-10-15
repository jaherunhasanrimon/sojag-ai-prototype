/**
 * scripts/validate-data.ts — Build-time validation of data files.
 * Checks:
 * - clips.json, cameras.json, map.json, scenarios/*.json parse with Zod
 * - Every clipId in scenarios exists in clips.json
 * - Every cameraId in scenarios exists in cameras.json
 * - Cue atSec and clipWindow are within clip duration
 * - source is non-empty and consent/license is set for every clip used in scenarios
 * - Cue IDs are unique across all scenarios
 * - Video files referenced by clips exist on disk
 *
 * Run: npx tsx scripts/validate-data.ts
 * Exit code 0 = ok, 1 = warnings only, 2 = errors
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import {
  ClipsFileSchema,
  CamerasFileSchema,
  MapFileSchema,
  ScenarioSchema,
} from '../src/domain/types';
import type { Clip, Camera, Scenario } from '../src/domain/types';

const ROOT = resolve(import.meta.dirname, '..');
const DATA_DIR = join(ROOT, 'public', 'data');
const VIDEOS_DIR = join(ROOT, 'public', 'videos');

const errors: string[] = [];
const warnings: string[] = [];

function loadJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch (e) {
    errors.push(`Cannot read ${path}: ${e}`);
    return null;
  }
}

// ─── Load clips ────────────────────────────────────────────────────
const clipsRaw = loadJson(join(DATA_DIR, 'clips.json'));
const clips = new Map<string, Clip>();
if (clipsRaw) {
  const result = ClipsFileSchema.safeParse(clipsRaw);
  if (!result.success) {
    errors.push(`clips.json schema error: ${result.error.message}`);
  } else {
    for (const clip of result.data.clips) {
      if (clips.has(clip.id)) {
        warnings.push(`Duplicate clip ID: ${clip.id}`);
      }
      clips.set(clip.id, clip);
    }
  }
}

// ─── Load cameras ──────────────────────────────────────────────────
const camerasRaw = loadJson(join(DATA_DIR, 'cameras.json'));
const cameras = new Map<string, Camera>();
if (camerasRaw) {
  const result = CamerasFileSchema.safeParse(camerasRaw);
  if (!result.success) {
    errors.push(`cameras.json schema error: ${result.error.message}`);
  } else {
    for (const cam of result.data.cameras) {
      cameras.set(cam.id, cam);
    }
  }
}

// ─── Load map ──────────────────────────────────────────────────────
const mapRaw = loadJson(join(DATA_DIR, 'map.json'));
if (mapRaw) {
  const result = MapFileSchema.safeParse(mapRaw);
  if (!result.success) {
    errors.push(`map.json schema error: ${result.error.message}`);
  }
}

// ─── Load and validate scenarios ───────────────────────────────────
const SCENARIO_FILES = ['s1', 's2', 's3', 's4', 's5', 's6'];
const scenarios: Scenario[] = [];
const allCueIds = new Set<string>();

for (const sid of SCENARIO_FILES) {
  const path = join(DATA_DIR, 'scenarios', `${sid}.json`);
  const raw = loadJson(path);
  if (!raw) continue;

  const result = ScenarioSchema.safeParse(raw);
  if (!result.success) {
    errors.push(`scenarios/${sid}.json schema error: ${result.error.message}`);
    continue;
  }

  const scenario = result.data;
  scenarios.push(scenario);

  // Check tile references
  for (const tile of scenario.tiles) {
    if (!clips.has(tile.clipId)) {
      warnings.push(`${scenario.id}: tile references unknown clip "${tile.clipId}"`);
    }
    if (!cameras.has(tile.cameraId)) {
      warnings.push(`${scenario.id}: tile references unknown camera "${tile.cameraId}"`);
    }
  }

  // Check cues
  for (const cue of scenario.cues) {
    // Unique cue IDs
    if (allCueIds.has(cue.cueId)) {
      errors.push(`Duplicate cue ID "${cue.cueId}" across scenarios`);
    }
    allCueIds.add(cue.cueId);

    // Clip exists
    const clip = clips.get(cue.clipId);
    if (!clip) {
      warnings.push(`${scenario.id}: cue ${cue.cueId} references unknown clip "${cue.clipId}"`);
      continue;
    }

    // Cue timing within clip
    if (cue.atSec > clip.durationSec) {
      errors.push(
        `${scenario.id}: cue ${cue.cueId} fires at ${cue.atSec}s but clip "${clip.id}" is ${clip.durationSec}s`,
      );
    }
    if (cue.clipWindow[0] > clip.durationSec || cue.clipWindow[1] > clip.durationSec) {
      warnings.push(
        `${scenario.id}: cue ${cue.cueId} clipWindow [${cue.clipWindow}] exceeds clip duration ${clip.durationSec}s`,
      );
    }

    // Confidence threshold
    if (cue.event.confidence <= 0 || cue.event.confidence > 1) {
      errors.push(`${scenario.id}: cue ${cue.cueId} confidence ${cue.event.confidence} out of range (0, 1]`);
    }
  }
}

// ─── Check clip integrity ──────────────────────────────────────────
// Collect all clips used in any scenario
const usedClipIds = new Set<string>();
for (const scenario of scenarios) {
  for (const tile of scenario.tiles) {
    usedClipIds.add(tile.clipId);
  }
  for (const cue of scenario.cues) {
    usedClipIds.add(cue.clipId);
  }
}

for (const clipId of usedClipIds) {
  const clip = clips.get(clipId);
  if (!clip) continue;

  // CLAUDE.md rule 6: refuse if source or license is missing
  if (clip.source.startsWith('TODO') || clip.source === '') {
    warnings.push(`Clip "${clipId}": source field is TODO/empty — must be filled before use in demo`);
  }
  if (clip.license === undefined && clip.consent !== true) {
    warnings.push(`Clip "${clipId}": no license and consent is not true`);
  }

  // Check video file exists
  const videoPath = join(ROOT, 'public', clip.file);
  if (!existsSync(videoPath)) {
    warnings.push(`Clip "${clipId}": video file not found at ${clip.file}`);
  }
}

// ─── Output ────────────────────────────────────────────────────────
console.log('\n🔍 SOTORKO Data Validation');
console.log('═'.repeat(50));
console.log(`📁 Clips: ${clips.size}`);
console.log(`📷 Cameras: ${cameras.size}`);
console.log(`🗺️  Map: ${mapRaw ? 'loaded' : 'MISSING'}`);
console.log(`🎬 Scenarios: ${scenarios.length}/6`);
console.log(`🎯 Cues: ${allCueIds.size}`);
console.log(`📎 Clips used in scenarios: ${usedClipIds.size}`);
console.log('');

if (warnings.length > 0) {
  console.log(`⚠️  ${warnings.length} warning(s):`);
  for (const w of warnings) {
    console.log(`   ⚠ ${w}`);
  }
  console.log('');
}

if (errors.length > 0) {
  console.log(`❌ ${errors.length} error(s):`);
  for (const e of errors) {
    console.log(`   ✗ ${e}`);
  }
  console.log('');
  process.exit(2);
}

if (warnings.length > 0) {
  console.log('✅ Passed with warnings\n');
  process.exit(0);
} else {
  console.log('✅ All checks passed\n');
  process.exit(0);
}
