/**
 * RoomPage — Combined control room view `/room` (primary demo view).
 * design.md section 5.2: Three panels at 1920x1080.
 *   A (wall, ~38%) | B (incident, ~37%) | C (queue, ~25%)
 * Banner at top, Footer at bottom.
 *
 * Phase 2: data-driven wall with demo clock controls.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Banner, Footer, PanelShell } from '../components/layout';
import { VideoWall } from '../components/wall';
import { IncidentScreen } from '../components/incident';
import { QueueTable } from '../components/dashboard';
import { PresenterPanel } from '../components/presenter/PresenterPanel';
import { useAppStore } from '../store/store';
import { useDemoClock } from '../services/clock';
import { startDispatchSimulator } from '../services/dispatchSim';
import { initSync } from '../services/sync';
import { startAutoplayLoop } from '../services/autoplay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { DebugPanel } from '../components/presenter/DebugPanel';

export function RoomPage() {
  const loadData = useAppStore((s) => s.loadData);
  const loadingState = useAppStore((s) => s.loadingState);
  const activeScenario = useAppStore((s) => s.activeScenario);
  const demoStarted = useAppStore((s) => s.demoStarted);

  const [showPresenter, setShowPresenter] = useState(false);

  const clockPlay = useDemoClock((s) => s.play);
  const clockPause = useDemoClock((s) => s.pause);
  const isPlaying = useDemoClock((s) => s.isPlaying);
  const speed = useDemoClock((s) => s.speed);
  const setSpeed = useDemoClock((s) => s.setSpeed);
  const getFormattedTime = useDemoClock((s) => s.getFormattedTime);

  // Mount global presenter keyboard shortcuts
  useKeyboardShortcuts({
    onTogglePresenter: () => setShowPresenter((prev) => !prev),
  });

  // Ensure data is loaded (for direct-navigating to /room)
  useEffect(() => {
    if (loadingState === 'idle') {
      loadData();
    }
  }, [loadData, loadingState]);

  // Start simulated dispatch progression loop
  useEffect(() => {
    const stopSimulator = startDispatchSimulator();
    return () => stopSimulator();
  }, []);

  // Initialize multi-window sync leader loop
  useEffect(() => {
    const cleanup = initSync('leader');
    return cleanup;
  }, []);

  // Initialize autoplay loop (hands-free script runner for S6 etc.)
  useEffect(() => {
    const cleanup = startAutoplayLoop();
    return cleanup;
  }, []);

  // Auto-start the clock when demo starts
  useEffect(() => {
    if (demoStarted && !isPlaying) {
      clockPlay();
    }
  }, [demoStarted, isPlaying, clockPlay]);

  return (
    <div className="h-screen flex flex-col bg-navy overflow-hidden">
      {/* Honesty banner — always visible */}
      <Banner />

      {/* Clock controls bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-navy border-b border-edge/50">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            id="btn-play-pause"
            onClick={() => (isPlaying ? clockPause() : clockPlay())}
            className="text-[10px] font-mono text-cyan border border-edge px-2 py-0.5 rounded hover:bg-edge/30 transition-colors"
          >
            {isPlaying ? '⏸ Pause [Space]' : '▶ Play [Space]'}
          </button>

          {/* Speed */}
          <div className="flex items-center gap-1">
            {([1, 5, 10] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                  speed === s
                    ? 'border-lime text-lime bg-lime/10'
                    : 'border-edge text-muted hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Demo clock */}
          <span className="text-[10px] font-mono text-muted">
            🕐 <span className="text-white">{getFormattedTime()}</span>
            <span className="text-text-dim ml-1">(SIMULATED)</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {activeScenario && (
            <span className="text-[10px] font-mono text-lime">
              {activeScenario.id}: {activeScenario.name}
            </span>
          )}
          {!activeScenario && (
            <span className="text-[10px] font-mono text-amber">
              No scenario selected — select one from Start page
            </span>
          )}

          <button
            id="btn-presenter-modal"
            onClick={() => setShowPresenter(true)}
            className="text-[10px] font-mono text-lime border border-lime/40 px-2 py-0.5 rounded hover:bg-lime/20 transition-colors"
            title="Open Presenter Control Panel (Hotkey: P)"
          >
            Presenter [P]
          </button>

          <Link
            to="/summary"
            id="link-summary-page"
            className="text-[10px] font-mono text-cyan hover:underline"
          >
            Summary Table ↗
          </Link>
        </div>
      </div>

      {/* Three-panel control room */}
      <div className="flex-1 flex gap-1.5 p-1.5 min-h-0">
        {/* Panel A: Surveillance Wall (~38%) */}
        <PanelShell
          id="panel-wall"
          title="Surveillance Wall"
          label="Display A"
          className="basis-[38%] flex-shrink-0"
        >
          <VideoWall />
        </PanelShell>

        {/* Panel B: Incident Screen (~37%) */}
        <PanelShell
          id="panel-incident"
          title="Incident Screen"
          label="Display B"
          className="basis-[37%] flex-shrink-0"
        >
          <IncidentScreen />
        </PanelShell>

        {/* Panel C: Queue Dashboard (~25%) */}
        <PanelShell
          id="panel-queue"
          title="Incident Queue"
          label="Display C"
          className="basis-[25%] flex-shrink-0"
        >
          <QueueTable />
        </PanelShell>
      </div>

      {/* ILLUSTRATIVE / SIMULATED footer — always visible */}
      <Footer />

      {/* Presenter Panel Overlay Modal */}
      {showPresenter && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Presenter control overlay"
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPresenter(false);
          }}
        >
          <PresenterPanel isOverlay onClose={() => setShowPresenter(false)} />
        </div>
      )}

      {/* Debug panel (dev only) */}
      {import.meta.env.DEV && <DebugPanel />}
    </div>
  );
}

