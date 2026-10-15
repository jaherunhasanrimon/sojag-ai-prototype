/**
 * store/store.ts — Main Zustand store for the application.
 * Holds loaded data, active scenario, incident state, and audit log.
 *
 * Phase 3: full incident actions, cue scheduling, lock rule.
 */
import { create } from 'zustand';
import type { DataBundle, Scenario, Incident, IncidentLogEntry } from '../domain/types';
import { loadAllData, type LoadError } from '../services/loader';
import { applyTransition, type TransitionAction } from '../domain/stateMachine';
import { onCueFired, pullNext, resetIncidentCounter } from '../domain/lockRule';
import {
  createSchedulerState,
  onTimeUpdate as schedulerOnTimeUpdate,
  resetScheduler,
  getCuesForClip,
  type SchedulerState,
} from '../domain/cueScheduler';
import { useDemoClock } from '../services/clock';

export interface AppState {
  // ─── Data loading ────────────────────────────────────────────────
  loadingState: 'idle' | 'loading' | 'loaded' | 'error';
  data: DataBundle | null;
  loadErrors: LoadError[];
  loadWarnings: string[];

  // ─── Scenario ────────────────────────────────────────────────────
  activeScenario: Scenario | null;
  demoStarted: boolean;

  // ─── Incidents ───────────────────────────────────────────────────
  incidents: Incident[];
  /** Global audit log (all state changes across all incidents) */
  auditLog: IncidentLogEntry[];

  // ─── Cue scheduling ──────────────────────────────────────────────
  schedulerState: SchedulerState;

  // ─── Settings ────────────────────────────────────────────────────
  lowRes: boolean;
  /** Whether auto-pull is enabled */
  autoPull: boolean;
  /** Alert threshold (cues below this confidence are ignored) */
  alertThreshold: number;

  // ─── Actions ─────────────────────────────────────────────────────
  loadData: () => Promise<void>;
  selectScenario: (scenarioId: string) => void;
  startDemo: () => void;
  resetDemo: () => void;

  // Cue scheduling
  onTileTimeUpdate: (tileIndex: number, currentTime: number) => void;

  // Incident actions
  applyAction: (incidentId: string, action: TransitionAction) => string | null;
  pullNextIncident: () => void;

  // Computed helpers
  getActiveIncident: () => Incident | undefined;
  getQueuedIncidents: () => Incident[];
  getAlertedTileIndices: () => Set<number>;
}

export const useAppStore = create<AppState>((set, get) => ({
  loadingState: 'idle',
  data: null,
  loadErrors: [],
  loadWarnings: [],
  activeScenario: null,
  demoStarted: false,
  incidents: [],
  auditLog: [],
  schedulerState: createSchedulerState(),
  lowRes: new URLSearchParams(window.location.search).get('lowres') === '1',
  autoPull: true,
  alertThreshold: 0.5,

  loadData: async () => {
    set({ loadingState: 'loading' });
    const result = await loadAllData();

    if (result.warnings.length > 0) {
      console.warn('[SOTORKO] Data load warnings:', result.warnings);
    }

    if (result.data) {
      set({
        loadingState: 'loaded',
        data: result.data,
        loadErrors: [],
        loadWarnings: result.warnings,
      });
    } else {
      set({
        loadingState: 'error',
        loadErrors: result.errors,
        loadWarnings: result.warnings,
      });
    }
  },

  selectScenario: (scenarioId: string) => {
    const { data } = get();
    if (!data) return;
    const scenario = data.scenarios.get(scenarioId);
    if (scenario) {
      const threshold = scenario.settings?.alertThreshold ?? 0.5;
      const autoPull = scenario.settings?.autoPull ?? true;
      set({
        activeScenario: scenario,
        incidents: [],
        auditLog: [],
        alertThreshold: threshold,
        autoPull,
      });
      // Reset scheduler and incident counter
      resetScheduler(get().schedulerState);
      resetIncidentCounter();
    }
  },

  startDemo: () => {
    set({ demoStarted: true });
  },

  resetDemo: () => {
    const { schedulerState } = get();
    resetScheduler(schedulerState);
    resetIncidentCounter();
    useDemoClock.getState().reset();
    set({
      demoStarted: false,
      incidents: [],
      auditLog: [],
      activeScenario: null,
    });
  },

  // ─── Cue scheduling ─────────────────────────────────────────────
  onTileTimeUpdate: (tileIndex: number, currentTime: number) => {
    const { activeScenario, schedulerState, incidents, autoPull, alertThreshold, data } = get();
    if (!activeScenario || !data) return;

    // Find the clip assigned to this tile
    const tileConfig = activeScenario.tiles.find((t) => t.tileIndex === tileIndex);
    if (!tileConfig) return;

    // Get cues for this clip
    const cuesForClip = getCuesForClip(activeScenario.cues, tileConfig.clipId);
    if (cuesForClip.length === 0) return;

    // Check for cue fires
    const fired = schedulerOnTimeUpdate(
      schedulerState,
      tileIndex,
      currentTime,
      cuesForClip,
      alertThreshold,
    );

    if (fired.length === 0) return;

    // Process each fired cue
    let currentIncidents = [...incidents];
    const newAuditEntries: IncidentLogEntry[] = [];
    const demoMs = useDemoClock.getState().getNowMs();

    for (const { cue } of fired) {
      const result = onCueFired(
        currentIncidents,
        cue,
        tileConfig.cameraId,
        demoMs,
        autoPull,
      );
      currentIncidents = result.incidents;

      // Collect audit log entries from the new incident
      newAuditEntries.push(...result.newIncident.log);

      console.log(
        `[SOTORKO] Cue fired: ${cue.cueId} → ${result.newIncident.id} (${result.autoPulled ? 'ACTIVE' : 'QUEUED'})`,
      );
    }

    set({
      incidents: currentIncidents,
      auditLog: [...get().auditLog, ...newAuditEntries],
    });
  },

  // ─── Incident actions ────────────────────────────────────────────
  applyAction: (incidentId: string, action: TransitionAction): string | null => {
    const { incidents, auditLog } = get();
    const incident = incidents.find((i) => i.id === incidentId);
    if (!incident) return `Incident ${incidentId} not found`;

    const demoMs = useDemoClock.getState().getNowMs();
    const result = applyTransition(incident, action, demoMs);

    if (!result.incident) {
      console.warn(`[SOTORKO] ${result.error}`);
      return result.error ?? 'Unknown error';
    }

    const updatedIncidents = incidents.map((i) =>
      i.id === incidentId ? result.incident! : i,
    );

    // Collect new log entries
    const newLogEntries = result.incident.log.slice(incident.log.length);

    set({
      incidents: updatedIncidents,
      auditLog: [...auditLog, ...newLogEntries],
    });

    // Auto-pull after dismiss or close (with a small delay handled by UI)
    if (action.type === 'DISMISS' || action.type === 'CLOSE') {
      // Schedule auto-pull (the UI layer handles the 2s delay)
    }

    return null;
  },

  pullNextIncident: () => {
    const { incidents, auditLog } = get();
    const demoMs = useDemoClock.getState().getNowMs();
    const updated = pullNext(incidents, demoMs);
    if (!updated) return;

    // Find new log entries
    const newEntries: IncidentLogEntry[] = [];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].log.length > incidents[i].log.length) {
        newEntries.push(...updated[i].log.slice(incidents[i].log.length));
      }
    }

    set({
      incidents: updated,
      auditLog: [...auditLog, ...newEntries],
    });
  },

  // ─── Computed helpers ────────────────────────────────────────────
  getActiveIncident: () => {
    return get().incidents.find((i) => i.status === 'ACTIVE');
  },

  getQueuedIncidents: () => {
    return get().incidents.filter(
      (i) => i.status === 'QUEUED' || i.status === 'PAUSED',
    );
  },

  getAlertedTileIndices: () => {
    const { incidents, activeScenario } = get();
    if (!activeScenario) return new Set<number>();

    const alertedIndices = new Set<number>();
    for (const incident of incidents) {
      if (incident.status === 'CLOSED' || incident.status === 'DISMISSED') continue;
      // Find the tile index for this incident's clip
      const tile = activeScenario.tiles.find(
        (t) => t.clipId === incident.clipId && t.cameraId === incident.cameraId,
      );
      if (tile) {
        alertedIndices.add(tile.tileIndex);
      }
    }
    return alertedIndices;
  },
}));
