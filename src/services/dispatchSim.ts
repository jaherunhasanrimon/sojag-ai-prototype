/**
 * services/dispatchSim.ts — Simulated dispatch timeline and auto-pull progression.
 * Implements design.md section 5.6 and section 6, rule 2.
 *
 * Timers run on the demo clock (respects 1x/5x/10x speed multiplier and pause):
 * - DISPATCHED → ACKNOWLEDGED (~8s demo time)
 * - ACKNOWLEDGED → ARRIVED (~45s demo time)
 * - Auto-pull next queued incident after 2s demo time when active leaves review
 */
import { useAppStore } from '../store/store';
import { useDemoClock } from './clock';

export const DISPATCH_DELAYS = {
  ACK_MS: 8_000, // ~8s
  ARRIVE_MS: 45_000, // ~45s from initial dispatch
  AUTOPULL_MS: 2_000, // 2s pause before auto-pulling next incident
};

let pendingAutoPullAtDemoMs: number | null = null;

/**
 * Schedule an auto-pull check after the 2s pause.
 */
export function scheduleAutoPull(currentDemoMs: number): void {
  pendingAutoPullAtDemoMs = currentDemoMs + DISPATCH_DELAYS.AUTOPULL_MS;
}

/**
 * Reset pending auto-pull timer.
 */
export function resetAutoPull(): void {
  pendingAutoPullAtDemoMs = null;
}

/**
 * Step the dispatch simulation forward.
 * Checks for:
 * 1. Dispatched incidents that reached ACK time (~8s)
 * 2. Acknowledged incidents that reached ARRIVE time (~45s)
 * 3. Scheduled auto-pull timers (2s after incident left review)
 */
export function tickDispatchSim(demoMs: number): void {
  const store = useAppStore.getState();
  const { incidents, applyAction, autoPull, pullNextIncident } = store;

  // 1. Process simulated dispatch steps for incidents with active dispatch
  for (const incident of incidents) {
    if (!incident.dispatch) continue;

    // Find the timestamp when SEND_DISPATCH occurred
    const dispatchStep = incident.dispatch.steps.find((s) => s.status === 'DISPATCHED');
    if (!dispatchStep) continue;

    const elapsedSinceDispatch = demoMs - dispatchStep.atDemoMs;

    if (incident.status === 'DISPATCHED' && elapsedSinceDispatch >= DISPATCH_DELAYS.ACK_MS) {
      applyAction(incident.id, { type: 'SIM_ACK' });
    } else if (incident.status === 'ACKNOWLEDGED' && elapsedSinceDispatch >= DISPATCH_DELAYS.ARRIVE_MS) {
      applyAction(incident.id, { type: 'SIM_ARRIVE' });
    }
  }

  // 2. Process auto-pull if scheduled and ready
  if (pendingAutoPullAtDemoMs !== null && demoMs >= pendingAutoPullAtDemoMs) {
    pendingAutoPullAtDemoMs = null;
    if (autoPull) {
      pullNextIncident();
    }
  }
}

/**
 * Start dispatch simulator loop.
 * Runs on a 250ms interval while demo is playing.
 */
export function startDispatchSimulator(): () => void {
  const interval = setInterval(() => {
    const clock = useDemoClock.getState();
    if (clock.isPlaying) {
      const demoMs = clock.getNowMs();
      tickDispatchSim(demoMs);
    }
  }, 250);

  return () => clearInterval(interval);
}
