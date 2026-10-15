/**
 * domain/lockRule.ts — Lock rule and queue management.
 * Implements architecture.md section 5, invariant I1:
 *   "At most one incident per operator has status ACTIVE.
 *    CUE_FIRED while an incident is ACTIVE can only produce QUEUED."
 *
 * Also implements auto-pull (architecture.md section 6).
 */
import type { Incident, Cue, IncidentLogEntry } from './types';
import { hasActiveIncident } from './stateMachine';
import { nextQueued } from './priority';

let incidentCounter = 0;

/**
 * Reset the incident counter (for scenario reset).
 */
export function resetIncidentCounter(): void {
  incidentCounter = 0;
}

/**
 * Create a new incident from a fired cue.
 * The incident starts as QUEUED — it must be pulled to become ACTIVE.
 */
export function createIncident(cue: Cue, cameraId: string, demoMs: number): Incident {
  incidentCounter++;
  const id = `STK-${String(incidentCounter).padStart(3, '0')}`;
  const now = new Date();
  const wallTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const logEntry: IncidentLogEntry = {
    atMs: demoMs,
    actor: 'system',
    action: 'CUE_FIRED',
    detail: `Cue ${cue.cueId} fired at ${cue.atSec}s on clip ${cue.clipId}`,
  };

  return {
    id,
    cueId: cue.cueId,
    clipId: cue.clipId,
    cameraId,
    title: cue.event.title,
    eventType: cue.event.type,
    confidence: cue.event.confidence,
    priority: cue.event.priority,
    firedAtDemoMs: demoMs,
    firedAtWall: wallTime,
    status: 'QUEUED',
    truth: cue.truth,
    log: [logEntry],
  };
}

export interface OnCueFiredResult {
  /** Updated incidents array */
  incidents: Incident[];
  /** The new incident that was created */
  newIncident: Incident;
  /** Whether the new incident was auto-pulled to ACTIVE */
  autoPulled: boolean;
}

/**
 * Handle a cue firing: create incident, check lock rule, optionally auto-pull.
 *
 * Lock rule (I1): if an incident is already ACTIVE, the new one stays QUEUED.
 * Auto-pull: if no incident is ACTIVE and autoPull is enabled, pull immediately.
 */
export function onCueFired(
  incidents: Incident[],
  cue: Cue,
  cameraId: string,
  demoMs: number,
  autoPull: boolean,
): OnCueFiredResult {
  const newInc = createIncident(cue, cameraId, demoMs);
  let updatedIncidents = [...incidents, newInc];
  let autoPulled = false;

  // I1: only pull if no active incident
  if (!hasActiveIncident(incidents) && autoPull) {
    // Pull the best queued incident (might be the new one, might be an older one)
    const toPull = nextQueued(updatedIncidents);
    if (toPull) {
      updatedIncidents = updatedIncidents.map((inc) => {
        if (inc.id === toPull.id) {
          const pullLog: IncidentLogEntry = {
            atMs: demoMs,
            actor: 'system',
            action: 'AUTO_PULL',
            detail: 'Auto-pulled to active review',
          };
          return { ...inc, status: 'ACTIVE' as const, operator: 'Op. A', log: [...inc.log, pullLog] };
        }
        return inc;
      });
      autoPulled = toPull.id === newInc.id;
    }
  }

  return {
    incidents: updatedIncidents,
    newIncident: updatedIncidents.find((i) => i.id === newInc.id)!,
    autoPulled,
  };
}

/**
 * Pull the next queued incident to ACTIVE after a delay.
 * Returns the updated incidents array, or null if nothing to pull.
 */
export function pullNext(incidents: Incident[], demoMs: number): Incident[] | null {
  if (hasActiveIncident(incidents)) return null;

  const toPull = nextQueued(incidents);
  if (!toPull) return null;

  const pullLog: IncidentLogEntry = {
    atMs: demoMs,
    actor: 'system',
    action: 'AUTO_PULL',
    detail: 'Next queued incident pulled to active review',
  };

  return incidents.map((inc) => {
    if (inc.id === toPull.id) {
      return { ...inc, status: 'ACTIVE' as const, operator: 'Op. A', log: [...inc.log, pullLog] };
    }
    return inc;
  });
}
