/**
 * domain/types.ts — Shared interfaces and Zod schemas.
 * Mirrors architecture.md section 4 exactly.
 *
 * IMPORTANT: "Detections" are scripted cues attached to timestamps.
 * There is NO machine learning. Confidence is a scripted number.
 */
import { z } from 'zod';

// ─── Enums / Literals ─────────────────────────────────────────────

export const PrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);
export type Priority = z.infer<typeof PrioritySchema>;

export const GroundTruthSchema = z.enum(['crime_like', 'non_crime']);
export type GroundTruth = z.infer<typeof GroundTruthSchema>;

export const IncidentStatusSchema = z.enum([
  'QUEUED', 'ACTIVE', 'PAUSED', 'REVIEW_REQUESTED',
  'CONFIRMED', 'DISPATCHED', 'ACKNOWLEDGED', 'ARRIVED',
  'CLOSED', 'DISMISSED',
]);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

// ─── Clip ──────────────────────────────────────────────────────────

export const ClipSchema = z.object({
  id: z.string().min(1),
  file: z.string().min(1),
  durationSec: z.number().positive(),
  label: GroundTruthSchema,
  category: z.string().min(1),
  source: z.string().min(1),
  consent: z.union([z.boolean(), z.literal('n/a')]),
  license: z.string().optional(),
  notes: z.string().optional(),
});
export type Clip = z.infer<typeof ClipSchema>;

export const ClipsFileSchema = z.object({
  _comment: z.string().optional(),
  _schema: z.string().optional(),
  clips: z.array(ClipSchema),
});
export type ClipsFile = z.infer<typeof ClipsFileSchema>;

// ─── Camera ────────────────────────────────────────────────────────

export const CameraSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  mapX: z.number(),
  mapY: z.number(),
});
export type Camera = z.infer<typeof CameraSchema>;

export const CamerasFileSchema = z.object({
  _comment: z.string().optional(),
  _schema: z.string().optional(),
  cameras: z.array(CameraSchema),
});
export type CamerasFile = z.infer<typeof CamerasFileSchema>;

// ─── Map ───────────────────────────────────────────────────────────

export const MapStreetSchema = z.object({
  id: z.string(),
  label: z.string(),
  path: z.string(),
  style: z.string(),
});

export const MapLandmarkSchema = z.object({
  id: z.string(),
  label: z.string(),
  rect: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  fill: z.string(),
});

export const MapFileSchema = z.object({
  _comment: z.string().optional(),
  _tag: z.string().optional(),
  viewBox: z.string(),
  streets: z.array(MapStreetSchema),
  landmarks: z.array(MapLandmarkSchema),
});
export type MapFile = z.infer<typeof MapFileSchema>;

// ─── Cue (scripted detection, NOT ML) ──────────────────────────────

export const CueBoxSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  w: z.number().min(0).max(100),
  h: z.number().min(0).max(100),
});
export type CueBox = z.infer<typeof CueBoxSchema>;

export const CueEventSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  confidence: z.number().min(0).max(1),
  priority: PrioritySchema,
});

export const CueSchema = z.object({
  cueId: z.string().min(1),
  clipId: z.string().min(1),
  atSec: z.number().nonnegative(),
  clipWindow: z.tuple([z.number().nonnegative(), z.number().nonnegative()]),
  event: CueEventSchema,
  box: z.array(CueBoxSchema).optional(),
  truth: GroundTruthSchema,
  _note: z.string().optional(),
});
export type Cue = z.infer<typeof CueSchema>;

// ─── Scenario ──────────────────────────────────────────────────────

export const ScenarioTileSchema = z.object({
  tileIndex: z.number().int().nonnegative(),
  cameraId: z.string().min(1),
  clipId: z.string().min(1),
  startOffsetSec: z.number().nonnegative().optional(),
  _note: z.string().optional(),
});
export type ScenarioTile = z.infer<typeof ScenarioTileSchema>;

export const AutoplayStepSchema = z.object({
  atSec: z.number().nonnegative(),
  action: z.enum(['fireCue', 'operatorConfirm', 'operatorDismiss', 'closeIncident']),
  arg: z.string().optional(),
  _note: z.string().optional(),
});

export const ScenarioSchema = z.object({
  _comment: z.string().optional(),
  id: z.enum(['S1', 'S2', 'S3', 'S4', 'S5', 'S6']),
  name: z.string().min(1),
  description: z.string().optional(),
  teaches: z.string().optional(),
  tiles: z.array(ScenarioTileSchema),
  armedCueIds: z.array(z.string()),
  cues: z.array(CueSchema).default([]),
  autoplay: z.object({
    steps: z.array(AutoplayStepSchema),
  }).optional(),
  settings: z.object({
    alertThreshold: z.number().min(0).max(1).default(0.5),
    dispatchSpeed: z.union([z.literal(1), z.literal(5), z.literal(10)]).default(1),
    autoPull: z.boolean().default(true),
  }).optional(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

// ─── Incident (runtime, not persisted in JSON files) ───────────────

export interface IncidentLogEntry {
  atMs: number;
  actor: 'system' | 'operator' | 'supervisor';
  action: string;
  detail?: string;
}

export interface DispatchInfo {
  channel: string;
  unit?: string;
  steps: Array<{ status: string; atDemoMs: number }>;
}

export interface Incident {
  id: string;
  cueId: string;
  clipId: string;
  cameraId: string;
  title: string;
  eventType: string;
  confidence: number;
  priority: Priority;
  firedAtDemoMs: number;
  firedAtWall: string;
  status: IncidentStatus;
  operator?: string;
  dismissReason?: string;
  dispatch?: DispatchInfo;
  outcome?: 'Resolved' | 'Handed over' | 'No further action';
  truth: GroundTruth;
  log: IncidentLogEntry[];
}

// ─── Loaded data bundle ────────────────────────────────────────────

export interface DataBundle {
  manifest?: Record<string, any>;
  clips: Map<string, Clip>;
  cameras: Map<string, Camera>;
  map: MapFile;
  scenarios: Map<string, Scenario>;
}

export type ScenarioData = DataBundle;

