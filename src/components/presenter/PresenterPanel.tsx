/**
 * PresenterPanel — Control panel for the presenter (design.md section 5.7).
 * Can be rendered on `/presenter` or as an overlay on `/room` when pressing 'P'.
 *
 * Features:
 * - Scenario picker (S1 to S6)
 * - Play/Pause, Speed (1x, 5x, 10x), Reset
 * - Fire next scripted alert
 * - Cue list with live status (ARMED / FIRED)
 * - Mute alarm toggle
 * - Timer mode indicator
 * - Keyboard shortcuts cheat sheet
 */
import { useAppStore } from '../../store/store';
import { useDemoClock } from '../../services/clock';
import { toggleMute, getIsMuted } from '../../services/alarm';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const SCENARIOS = [
  { id: 'S1', name: 'S1: Single incident lifecycle' },
  { id: 'S2', name: 'S2: False alarm dismiss' },
  { id: 'S3', name: 'S3: Simultaneous / lock rule' },
  { id: 'S4', name: 'S4: Escalation' },
  { id: 'S5', name: 'S5: Quiet shift' },
  { id: 'S6', name: 'S6: Full pitch autoplay' },
];

interface PresenterPanelProps {
  onClose?: () => void;
  isOverlay?: boolean;
}

export function PresenterPanel({ onClose, isOverlay = false }: PresenterPanelProps) {
  const activeScenario = useAppStore((s) => s.activeScenario);
  const selectScenario = useAppStore((s) => s.selectScenario);
  const resetDemo = useAppStore((s) => s.resetDemo);
  const fireNextAlert = useAppStore((s) => s.fireNextAlert);
  const schedulerState = useAppStore((s) => s.schedulerState);

  const clock = useDemoClock();
  const [isMuted, setIsMuted] = useState(getIsMuted());

  const handleMute = () => {
    const next = toggleMute();
    setIsMuted(next);
  };

  return (
    <div
      className={`
        bg-panel border border-edge rounded-lg shadow-2xl p-5 space-y-4 text-white
        ${isOverlay ? 'w-[640px] max-w-[95vw] max-h-[85vh] overflow-y-auto' : 'max-w-4xl mx-auto my-6'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm bg-lime/20 text-lime border border-lime/40 px-2.5 py-0.5 rounded font-mono font-bold uppercase">
            PRESENTER CONTROL
          </span>
          <span className="text-[10px] text-amber font-mono">(SIMULATED / DEMO TOOL)</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-lg font-mono px-2"
            aria-label="Close panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Scenario Picker */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-text-dim font-mono uppercase">Scenario Select (Shortcuts 1–6)</span>
        <div className="grid grid-cols-3 gap-2">
          {SCENARIOS.map((sc) => {
            const isSelected = activeScenario?.id === sc.id;
            return (
              <button
                key={sc.id}
                id={`presenter-scenario-${sc.id.toLowerCase()}`}
                onClick={() => selectScenario(sc.id)}
                className={`
                  text-left px-3 py-2 rounded border text-xs font-mono transition-colors
                  ${isSelected
                    ? 'border-lime text-lime bg-lime/10 font-bold'
                    : 'border-edge/50 bg-navy/60 text-muted hover:text-white hover:border-edge'
                  }
                `}
              >
                {sc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Playback & Demo Controls */}
      <div className="grid grid-cols-2 gap-4 bg-navy/50 border border-edge/40 rounded p-3">
        {/* Clock controls */}
        <div className="space-y-2">
          <span className="text-[10px] text-text-dim font-mono uppercase block">Demo Clock & Speed</span>
          <div className="flex items-center gap-2">
            <button
              id="presenter-btn-play"
              onClick={() => clock.togglePlayPause()}
              className="bg-cyan/20 border border-cyan/50 text-cyan text-xs font-mono font-semibold px-3 py-1.5 rounded hover:bg-cyan/30"
            >
              {clock.isPlaying ? '⏸ Pause [Space]' : '▶ Play [Space]'}
            </button>
            <div className="flex gap-1">
              {([1, 5, 10] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => clock.setSpeed(spd)}
                  className={`text-xs font-mono px-2 py-1.5 rounded border ${
                    clock.speed === spd
                      ? 'border-lime text-lime bg-lime/10 font-bold'
                      : 'border-edge text-muted hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-muted">
            Elapsed: <span className="text-white">{clock.getFormattedTime()}</span>
          </div>
        </div>

        {/* Quick action triggers */}
        <div className="space-y-2">
          <span className="text-[10px] text-text-dim font-mono uppercase block">Scripted Triggers</span>
          <div className="flex flex-wrap gap-2">
            <button
              id="presenter-btn-fire-next"
              onClick={fireNextAlert}
              className="bg-magenta/20 border border-magenta/50 text-magenta hover:bg-magenta/30 text-xs font-mono font-semibold px-3 py-1.5 rounded"
            >
              ⚡ Fire next alert [N]
            </button>
            <button
              id="presenter-btn-reset"
              onClick={resetDemo}
              className="bg-edge/40 border border-edge text-muted hover:text-white text-xs font-mono font-semibold px-3 py-1.5 rounded"
            >
              🔄 Reset Demo [R]
            </button>
            <button
              id="presenter-btn-mute"
              onClick={handleMute}
              className="bg-edge/40 border border-edge text-muted hover:text-white text-xs font-mono px-3 py-1.5 rounded"
            >
              {isMuted ? '🔊 Unmute [M]' : '🔇 Mute [M]'}
            </button>
          </div>
        </div>
      </div>

      {/* Cue List Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-dim font-mono uppercase">
            Active Scenario Cues ({activeScenario?.cues.length ?? 0})
          </span>
          <span className="text-[9px] font-mono text-lime">TIMER MODE SUPPORTED</span>
        </div>
        <div className="bg-navy/40 border border-edge/40 rounded p-2 max-h-36 overflow-y-auto space-y-1.5">
          {(!activeScenario || activeScenario.cues.length === 0) ? (
            <div className="text-[10px] text-text-dim font-mono py-2 text-center">
              No cues in current scenario
            </div>
          ) : (
            activeScenario.cues.map((cue) => {
              const isFired = schedulerState.firedCueIds.has(cue.cueId);
              return (
                <div
                  key={cue.cueId}
                  className="flex items-center justify-between text-[11px] font-mono border-b border-edge/20 pb-1"
                >
                  <div className="flex items-center gap-2">
                    <span className={isFired ? 'text-muted line-through' : 'text-white'}>
                      {cue.event.title}
                    </span>
                    <span className="text-[9px] text-text-dim">({cue.atSec}s • {cue.event.priority})</span>
                  </div>
                  <span
                    className={`text-[8px] border px-1.5 py-0.5 rounded uppercase font-semibold ${
                      isFired
                        ? 'border-edge bg-edge/20 text-muted'
                        : 'border-lime/40 bg-lime/10 text-lime'
                    }`}
                  >
                    {isFired ? 'FIRED' : 'ARMED'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Cheat Sheet */}
      <div className="bg-navy/30 border border-edge/30 rounded p-3 space-y-1 text-[10px] font-mono text-muted">
        <span className="text-text-dim uppercase font-semibold block mb-1">Keyboard Shortcuts</span>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div><strong className="text-white">1–6:</strong> Switch scenarios S1–S6</div>
          <div><strong className="text-white">Space:</strong> Pause / Play demo clock</div>
          <div><strong className="text-white">N:</strong> Fire next alert</div>
          <div><strong className="text-white">M:</strong> Mute / Unmute alarm</div>
          <div><strong className="text-white">R:</strong> Reset scenario & clock</div>
          <div><strong className="text-white">P:</strong> Toggle presenter overlay</div>
          <div><strong className="text-white">F:</strong> Toggle fullscreen</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex items-center justify-between pt-2 border-t border-edge/40 text-xs font-mono">
        <div className="flex gap-3">
          <Link to="/room" className="text-cyan hover:underline">Combined Room (/room)</Link>
          <Link to="/summary" className="text-lime hover:underline">Summary Table (/summary)</Link>
        </div>
        <div className="flex gap-3 text-muted">
          <Link to="/wall" className="hover:text-white">/wall</Link>
          <Link to="/incident" className="hover:text-white">/incident</Link>
          <Link to="/dashboard" className="hover:text-white">/dashboard</Link>
        </div>
      </div>
    </div>
  );
}
