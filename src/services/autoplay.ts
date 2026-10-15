/**
 * services/autoplay.ts — Autoplay script engine for hands-free demos (e.g. Scenario S6).
 * architecture.md section 6:
 * Replays operator actions by dispatching the same intents a human click would.
 */
import { useAppStore } from '../store/store';
import { useDemoClock } from './clock';

let executedStepIndices = new Set<number>();

export function resetAutoplay(): void {
  executedStepIndices.clear();
}

/**
 * Step autoplay execution forward based on current demo time.
 */
export function tickAutoplay(demoMs: number): void {
  const store = useAppStore.getState();
  const { activeScenario, applyAction, onTileTimeUpdate, incidents } = store;

  if (!activeScenario?.autoplay?.steps) return;

  const currentSec = demoMs / 1000;

  activeScenario.autoplay.steps.forEach((step, index) => {
    if (executedStepIndices.has(index)) return;

    if (currentSec >= step.atSec) {
      executedStepIndices.add(index);
      console.log(`[SOTORKO Autoplay] Executing step ${index}: ${step.action} at ${step.atSec}s`);

      switch (step.action) {
        case 'fireCue': {
          const cueId = step.arg;
          const cue = activeScenario.cues.find((c) => c.cueId === cueId) ?? activeScenario.cues[0];
          if (cue) {
            const tile = activeScenario.tiles.find((t) => t.clipId === cue.clipId) ?? activeScenario.tiles[0];
            if (tile) {
              onTileTimeUpdate(tile.tileIndex, cue.atSec);
            }
          }
          break;
        }

        case 'operatorConfirm': {
          const active = incidents.find((i) => i.status === 'ACTIVE');
          if (active) {
            applyAction(active.id, { type: 'CONFIRM' });
            applyAction(active.id, { type: 'SEND_DISPATCH' });
          }
          break;
        }

        case 'operatorDismiss': {
          const active = incidents.find((i) => i.status === 'ACTIVE');
          if (active) {
            applyAction(active.id, { type: 'DISMISS', reason: step.arg ?? 'Normal activity' });
          }
          break;
        }

        case 'closeIncident': {
          // Find an arrived or confirmed incident
          const toClose =
            incidents.find((i) => i.status === 'ARRIVED') ??
            incidents.find((i) => i.id === step.arg) ??
            incidents.find((i) => i.status === 'DISPATCHED' || i.status === 'CONFIRMED');
          if (toClose) {
            applyAction(toClose.id, { type: 'CLOSE', outcome: 'Resolved' });
          }
          break;
        }
      }
    }
  });
}

/**
 * Run autoplay loop while demo is playing.
 */
export function startAutoplayLoop(): () => void {
  const interval = setInterval(() => {
    const clock = useDemoClock.getState();
    if (clock.isPlaying) {
      tickAutoplay(clock.getNowMs());
    }
  }, 250);

  return () => clearInterval(interval);
}
