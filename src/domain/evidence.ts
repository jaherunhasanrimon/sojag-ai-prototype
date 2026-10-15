/**
 * domain/evidence.ts — Simulated evidence package builder (architecture.md section 10).
 * Builds a JSON export bundle containing clip reference, event details, decision, and audit trail.
 *
 * NOTE: No real video files or confidential data are exported. All contents are ILLUSTRATIVE.
 */
import type { Incident, ScenarioData } from './types';

export interface EvidencePackage {
  incidentId: string;
  label: string;
  camera: string;
  location?: string;
  clip: {
    file: string;
    window: [number, number];
  };
  event: {
    title: string;
    type: string;
    scriptedConfidence: number;
    priority: string;
  };
  decision?: {
    actor: string;
    action: string;
    atDemoMs: number;
    reason?: string;
    outcome?: string;
  };
  dispatch?: {
    channel: string;
    unit?: string;
    steps: Array<{ status: string; atDemoMs: number }>;
  };
  log: Array<{
    atMs: number;
    actor: string;
    action: string;
    detail?: string;
  }>;
  exportedAt: string;
}

export function buildEvidencePackage(
  incident: Incident,
  data: ScenarioData | null,
): EvidencePackage {
  const clip = data?.clips.get(incident.clipId);
  const camera = data?.cameras.get(incident.cameraId);

  // Find the primary operator decision from incident log
  const decisionEntry = incident.log.find(
    (l) =>
      l.action === 'CONFIRM' ||
      l.action === 'DISMISS' ||
      l.action === 'REQUEST_REVIEW' ||
      l.action === 'SUPERVISOR_CONFIRM' ||
      l.action === 'SUPERVISOR_DISMISS' ||
      l.action === 'CLOSE',
  );

  return {
    incidentId: incident.id,
    label: 'SIMULATED, scripted detection on pre-labelled clip',
    camera: incident.cameraId,
    location: camera?.label,
    clip: {
      file: clip?.file ?? `videos/${incident.clipId}.mp4`,
      window: [0, 10], // default 10s window if not specified
    },
    event: {
      title: incident.title,
      type: incident.eventType,
      scriptedConfidence: incident.confidence,
      priority: incident.priority,
    },
    decision: decisionEntry
      ? {
          actor: decisionEntry.actor,
          action: decisionEntry.action,
          atDemoMs: decisionEntry.atMs,
          reason: incident.dismissReason,
          outcome: incident.outcome,
        }
      : undefined,
    dispatch: incident.dispatch,
    log: incident.log,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Trigger browser file download of a JSON object.
 */
export function downloadJsonFile(filename: string, data: unknown): void {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
