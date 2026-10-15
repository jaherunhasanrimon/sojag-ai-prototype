/**
 * store/store.ts — Main Zustand store for the application.
 * Holds loaded data, active scenario, and incident state.
 *
 * Phase 2: data loading and scenario selection.
 * Phase 3+: incident state machine actions will be added here.
 */
import { create } from 'zustand';
import type { DataBundle, Scenario, Incident } from '../domain/types';
import { loadAllData, type LoadError } from '../services/loader';

export interface AppState {
  // ─── Data loading ────────────────────────────────────────────────
  /** Loading state */
  loadingState: 'idle' | 'loading' | 'loaded' | 'error';
  /** Loaded data bundle (null until loaded) */
  data: DataBundle | null;
  /** Load errors */
  loadErrors: LoadError[];
  /** Load warnings */
  loadWarnings: string[];

  // ─── Scenario ────────────────────────────────────────────────────
  /** Currently active scenario (null if none selected) */
  activeScenario: Scenario | null;
  /** Whether the demo has been started (Start click unlocks audio) */
  demoStarted: boolean;

  // ─── Incidents (Phase 3+, placeholder) ───────────────────────────
  incidents: Incident[];

  // ─── Settings ────────────────────────────────────────────────────
  /** Use low-res video copies (?lowres=1) */
  lowRes: boolean;

  // ─── Actions ─────────────────────────────────────────────────────
  loadData: () => Promise<void>;
  selectScenario: (scenarioId: string) => void;
  startDemo: () => void;
  resetDemo: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  loadingState: 'idle',
  data: null,
  loadErrors: [],
  loadWarnings: [],
  activeScenario: null,
  demoStarted: false,
  incidents: [],
  lowRes: new URLSearchParams(window.location.search).get('lowres') === '1',

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
      set({ activeScenario: scenario, incidents: [] });
    }
  },

  startDemo: () => {
    set({ demoStarted: true });
  },

  resetDemo: () => {
    set({ demoStarted: false, incidents: [], activeScenario: null });
  },
}));
