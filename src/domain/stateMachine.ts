/**
 * domain/stateMachine.ts — Incident state transitions and guards.
 * Implements invariants I1–I7 from architecture.md section 5.
 *
 * IMPORTANT: This is pure logic with no side effects.
 * All transitions append to the incident's log.
 */
import type { Incident, IncidentStatus, IncidentLogEntry } from './types';

// ─── Transition types ──────────────────────────────────────────────

export type TransitionAction =
  | { type: 'PULL' }
  | { type: 'CONFIRM' }
  | { type: 'DISMISS'; reason: string }
  | { type: 'REQUEST_REVIEW' }
  | { type: 'SUPERVISOR_CONFIRM' }
  | { type: 'SUPERVISOR_DISMISS'; reason: string }
  | { type: 'SEND_DISPATCH' }
  | { type: 'SIM_ACK' }
  | { type: 'SIM_ARRIVE' }
  | { type: 'CLOSE'; outcome: 'Resolved' | 'Handed over' | 'No further action' }
  | { type: 'SWAP_OUT' };

export interface TransitionResult {
  /** The updated incident, or null if the transition was illegal */
  incident: Incident | null;
  /** Error message if the transition was rejected */
  error?: string;
}

// ─── Legal transitions map ─────────────────────────────────────────

const LEGAL_TRANSITIONS: Record<string, IncidentStatus[]> = {
  // action type → allowed source statuses
  PULL: ['QUEUED', 'PAUSED'],
  CONFIRM: ['ACTIVE'],
  DISMISS: ['ACTIVE'],
  REQUEST_REVIEW: ['ACTIVE'],
  SUPERVISOR_CONFIRM: ['REVIEW_REQUESTED'],
  SUPERVISOR_DISMISS: ['REVIEW_REQUESTED'],
  SEND_DISPATCH: ['CONFIRMED'],
  SIM_ACK: ['DISPATCHED'],
  SIM_ARRIVE: ['ACKNOWLEDGED'],
  CLOSE: ['ARRIVED'],
  SWAP_OUT: ['ACTIVE'],
};

// ─── Apply transition ──────────────────────────────────────────────

/**
 * Apply a state transition to an incident.
 * Returns the updated incident or null with an error if the transition is illegal.
 * Enforces invariants I2–I4, I7.
 */
export function applyTransition(
  incident: Incident,
  action: TransitionAction,
  demoMs: number,
): TransitionResult {
  const allowed = LEGAL_TRANSITIONS[action.type];
  if (!allowed || !allowed.includes(incident.status)) {
    return {
      incident: null,
      error: `Illegal transition: ${action.type} from ${incident.status} (incident ${incident.id})`,
    };
  }

  // I3: DISMISS requires a reason string
  if (action.type === 'DISMISS' && !action.reason.trim()) {
    return {
      incident: null,
      error: `DISMISS requires a reason (incident ${incident.id})`,
    };
  }

  if (action.type === 'SUPERVISOR_DISMISS' && !action.reason.trim()) {
    return {
      incident: null,
      error: `SUPERVISOR_DISMISS requires a reason (incident ${incident.id})`,
    };
  }

  let newStatus: IncidentStatus;
  const logEntry: IncidentLogEntry = {
    atMs: demoMs,
    actor: 'system',
    action: action.type,
  };

  switch (action.type) {
    case 'PULL':
      newStatus = 'ACTIVE';
      logEntry.actor = 'system';
      logEntry.detail = 'Pulled to active review';
      break;

    case 'CONFIRM':
      newStatus = 'CONFIRMED';
      logEntry.actor = 'operator';
      logEntry.detail = 'Operator confirmed incident';
      break;

    case 'DISMISS':
      newStatus = 'DISMISSED';
      logEntry.actor = 'operator';
      logEntry.detail = `Dismissed: ${action.reason}`;
      break;

    case 'REQUEST_REVIEW':
      newStatus = 'REVIEW_REQUESTED';
      logEntry.actor = 'operator';
      logEntry.detail = 'Escalated to supervisor';
      break;

    case 'SUPERVISOR_CONFIRM':
      newStatus = 'CONFIRMED';
      logEntry.actor = 'supervisor';
      logEntry.detail = 'Supervisor confirmed';
      break;

    case 'SUPERVISOR_DISMISS':
      newStatus = 'DISMISSED';
      logEntry.actor = 'supervisor';
      logEntry.detail = `Supervisor dismissed: ${action.reason}`;
      break;

    case 'SEND_DISPATCH':
      newStatus = 'DISPATCHED';
      logEntry.actor = 'operator';
      logEntry.detail = 'Dispatch sent to Police Control Room (SIMULATED)';
      break;

    case 'SIM_ACK':
      newStatus = 'ACKNOWLEDGED';
      logEntry.actor = 'system';
      logEntry.detail = 'Unit acknowledged (SIMULATED)';
      break;

    case 'SIM_ARRIVE':
      newStatus = 'ARRIVED';
      logEntry.actor = 'system';
      logEntry.detail = 'Unit arrived (SIMULATED)';
      break;

    case 'CLOSE':
      newStatus = 'CLOSED';
      logEntry.actor = 'operator';
      logEntry.detail = `Closed: ${action.outcome}`;
      break;

    case 'SWAP_OUT':
      newStatus = 'PAUSED';
      logEntry.actor = 'operator';
      logEntry.detail = 'Parked — operator chose another incident';
      break;
  }

  const updated: Incident = {
    ...incident,
    status: newStatus,
    log: [...incident.log, logEntry],
    ...(action.type === 'DISMISS' ? { dismissReason: action.reason } : {}),
    ...(action.type === 'SUPERVISOR_DISMISS' ? { dismissReason: action.reason } : {}),
    ...(action.type === 'CLOSE' ? { outcome: action.outcome } : {}),
    ...(action.type === 'PULL' ? { operator: 'Op. A' } : {}),
    ...(action.type === 'SEND_DISPATCH'
      ? {
          dispatch: {
            channel: 'Police Control Room (SIMULATED)',
            unit: undefined,
            steps: [{ status: 'DISPATCHED', atDemoMs: demoMs }],
          },
        }
      : {}),
  };

  // Append dispatch steps for sim events
  if ((action.type === 'SIM_ACK' || action.type === 'SIM_ARRIVE') && updated.dispatch) {
    updated.dispatch = {
      ...updated.dispatch,
      ...(action.type === 'SIM_ACK' ? { unit: 'Unit P-12 (fictional)' } : {}),
      steps: [
        ...updated.dispatch.steps,
        { status: newStatus, atDemoMs: demoMs },
      ],
    };
  }

  return { incident: updated };
}

/**
 * Check if there is currently an active incident (invariant I1).
 */
export function hasActiveIncident(incidents: Incident[]): boolean {
  return incidents.some((i) => i.status === 'ACTIVE');
}

/**
 * Get the currently active incident, if any.
 */
export function getActiveIncident(incidents: Incident[]): Incident | undefined {
  return incidents.find((i) => i.status === 'ACTIVE');
}
