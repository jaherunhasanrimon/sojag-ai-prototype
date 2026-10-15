/**
 * RoomPage — Combined control room view `/room` (primary demo view).
 * design.md section 5.2: Three panels at 1920x1080.
 *   A (wall, ~38%) | B (incident, ~37%) | C (queue, ~25%)
 * Banner at top, Footer at bottom.
 *
 * Phase 2: data-driven wall with demo clock controls.
 */
import { useEffect } from 'react';
import { Banner, Footer, PanelShell } from '../components/layout';
import { VideoWall } from '../components/wall';
import { IncidentScreen } from '../components/incident';
import { QueueTable } from '../components/dashboard';
import { useAppStore } from '../store/store';
import { useDemoClock } from '../services/clock';
import { DebugPanel } from '../components/presenter/DebugPanel';

export function RoomPage() {
  const loadData = useAppStore((s) => s.loadData);
  const loadingState = useAppStore((s) => s.loadingState);
  const activeScenario = useAppStore((s) => s.activeScenario);
  const demoStarted = useAppStore((s) => s.demoStarted);

  const clockPlay = useDemoClock((s) => s.play);
  const clockPause = useDemoClock((s) => s.pause);
  const isPlaying = useDemoClock((s) => s.isPlaying);
  const speed = useDemoClock((s) => s.speed);
  const setSpeed = useDemoClock((s) => s.setSpeed);
  const getFormattedTime = useDemoClock((s) => s.getFormattedTime);

  // Ensure data is loaded (for direct-navigating to /room)
  useEffect(() => {
    if (loadingState === 'idle') {
      loadData();
    }
  }, [loadData, loadingState]);

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
            onClick={() => isPlaying ? clockPause() : clockPlay()}
            className="text-[10px] font-mono text-cyan border border-edge px-2 py-0.5 rounded hover:bg-edge/30 transition-colors"
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
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

        <div className="flex items-center gap-2">
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

      {/* Debug panel (dev only) */}
      {import.meta.env.DEV && <DebugPanel />}
    </div>
  );
}
