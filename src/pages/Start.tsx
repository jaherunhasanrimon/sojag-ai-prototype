/**
 * StartPage — The landing screen with disclaimer, scenario picker, and Start button.
 * design.md section 5.1
 * Phase 2: loads data on mount, wires scenario picker.
 *
 * Enhanced with animated hero layout, glowing grid background, and premium card design.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '../components/layout';
import { useAppStore } from '../store/store';
import { unlockAudio } from '../services/alarm';

const SCENARIOS = [
  { id: 'S1', name: 'Single incident, full lifecycle', description: 'One crime-like clip fires a HIGH alert. Full workflow to closure.', icon: '🔴' },
  { id: 'S2', name: 'False alarm', description: 'A non-crime clip fires a LOW/MEDIUM alert. Operator dismisses.', icon: '🟡' },
  { id: 'S3', name: 'Simultaneous incidents', description: 'Second alert queues while first is under review. Lock rule demo.', icon: '🟠' },
  { id: 'S4', name: 'Escalation', description: 'Operator requests review; supervisor decides.', icon: '🔵' },
  { id: 'S5', name: 'Quiet shift', description: 'No alerts, wall just plays. No alert is a valid outcome.', icon: '🟢' },
  { id: 'S6', name: 'Full pitch run (autoplay)', description: 'Timed hands-free demo for the pitch (~90s).', icon: '⚡' },
];

export function StartPage() {
  const navigate = useNavigate();
  const loadData = useAppStore((s) => s.loadData);
  const loadingState = useAppStore((s) => s.loadingState);
  const loadErrors = useAppStore((s) => s.loadErrors);
  const loadWarnings = useAppStore((s) => s.loadWarnings);
  const activeScenario = useAppStore((s) => s.activeScenario);
  const selectScenario = useAppStore((s) => s.selectScenario);
  const startDemo = useAppStore((s) => s.startDemo);

  // Load data on mount
  useEffect(() => {
    if (loadingState === 'idle') {
      loadData();
    }
  }, [loadData, loadingState]);

  const handleStart = () => {
    unlockAudio();
    startDemo();
    navigate('/room');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#070E24' }}>
      <Banner />

      {/* Animated grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(28,42,82,0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(28,42,82,0.35) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'grid-scan 10s linear infinite',
          zIndex: 0,
        }}
      />

      {/* Radial glow from center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(198,244,50,0.05) 0%, transparent 70%)',
          zIndex: 0,
        }}
      />

      <main className="relative flex-1 flex items-center justify-center px-4 py-8" style={{ zIndex: 1 }}>
        <div className="max-w-2xl w-full" style={{ animation: 'fade-up 0.6s ease both' }}>

          {/* ── Hero Header ── */}
          <div className="text-center mb-10">
            {/* Glowing ring icon */}
            <div className="flex justify-center mb-5">
              <div
                className="relative w-20 h-20 flex items-center justify-center rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(198,244,50,0.1) 0%, rgba(198,244,50,0.02) 70%)',
                  border: '1px solid rgba(198,244,50,0.25)',
                  boxShadow: '0 0 30px rgba(198,244,50,0.12), inset 0 0 20px rgba(198,244,50,0.04)',
                  animation: 'float 4s ease-in-out infinite',
                }}
              >
                {/* Rotating ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '1px solid transparent',
                    borderTopColor: 'rgba(198,244,50,0.6)',
                    borderRightColor: 'rgba(198,244,50,0.15)',
                    animation: 'rotate-ring 3s linear infinite',
                  }}
                />
                <span className="text-3xl">🛡</span>
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight mb-2" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>
              <span className="text-white">SOTORKO</span>{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, #C6F432, #86EFAC, #C6F432)',
                  backgroundSize: '200% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'shimmer 4s linear infinite',
                }}
              >
                AI
              </span>
            </h1>
            <p className="text-sm font-mono" style={{ color: 'rgba(143,163,199,0.8)', letterSpacing: '0.12em' }}>
              PUBLIC SAFETY INTELLIGENT MONITORING — CONTROL ROOM PROTOTYPE
            </p>
          </div>

          {/* ── Data loading errors ── */}
          {loadingState === 'error' && (
            <div
              className="rounded-xl p-4 mb-5"
              style={{
                background: 'rgba(224,69,123,0.06)',
                border: '1px solid rgba(224,69,123,0.3)',
                animation: 'fade-up 0.3s ease both',
              }}
            >
              <h2 className="text-[10px] font-mono font-bold text-magenta uppercase tracking-wider mb-2">
                ❌ Data Loading Errors
              </h2>
              {loadErrors.map((err, i) => (
                <div key={i} className="text-sm text-white mb-1">
                  <strong className="text-magenta">{err.file}:</strong> {err.message}
                  {err.details && (
                    <pre className="text-[10px] text-muted mt-1 overflow-auto max-h-20">{err.details}</pre>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Data loading warnings ── */}
          {loadWarnings.length > 0 && (
            <div
              className="rounded-xl p-4 mb-5"
              style={{
                background: 'rgba(251,191,36,0.05)',
                border: '1px solid rgba(251,191,36,0.25)',
                animation: 'fade-up 0.3s ease both',
              }}
            >
              <h2 className="text-[10px] font-mono font-bold text-amber uppercase tracking-wider mb-2">
                ⚠ Data Warnings ({loadWarnings.length})
              </h2>
              <div className="max-h-32 overflow-auto">
                {loadWarnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-muted font-mono mb-0.5">• {w}</p>
                ))}
              </div>
            </div>
          )}

          {/* ── Disclaimer ── */}
          <div
            className="rounded-xl p-5 mb-5"
            style={{
              background: 'rgba(13,23,48,0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(28,42,82,0.9)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <span className="text-amber text-xs">⚠</span>
              </div>
              <h2 className="text-[10px] font-mono font-bold text-amber uppercase tracking-widest">
                Important Disclaimer
              </h2>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(143,163,199,0.9)' }}>
              This is a <strong className="text-white">clickable offline mock-up</strong> for the
              Futuremaker GP competition. It replays pre-selected, pre-labelled video clips and
              demonstrates the <em>operator workflow</em> of a surveillance control room.{' '}
              <strong className="text-amber">
                There is no AI model, no computer vision, and no machine learning running.
              </strong>{' '}
              All "detections" are scripted cues attached to specific timestamps. Confidence values
              are scripted numbers, not probabilities. All locations, IDs, and metrics are
              illustrative.
            </p>
          </div>

          {/* ── Scenario picker ── */}
          <div
            className="rounded-xl p-5 mb-5"
            style={{
              background: 'rgba(13,23,48,0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(28,42,82,0.9)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest" style={{ color: 'rgba(143,163,199,0.8)' }}>
                Select Demo Scenario
              </h2>
              {loadingState === 'loading' && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border border-t-cyan rounded-full animate-spin" style={{ borderColor: 'rgba(28,42,82,0.6)', borderTopColor: '#22D3EE' }} />
                  <span className="text-[9px] font-mono text-cyan">Loading data...</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {SCENARIOS.map((s, idx) => {
                const isSelected = activeScenario?.id === s.id;
                const isDisabled = loadingState !== 'loaded';
                return (
                  <button
                    key={s.id}
                    id={`scenario-${s.id.toLowerCase()}`}
                    disabled={isDisabled}
                    onClick={() => selectScenario(s.id)}
                    className="text-left rounded-xl p-3 transition-all group relative overflow-hidden"
                    style={{
                      background: isSelected
                        ? 'rgba(198,244,50,0.08)'
                        : isDisabled
                        ? 'rgba(13,23,48,0.4)'
                        : 'rgba(13,23,48,0.6)',
                      border: isSelected
                        ? '1px solid rgba(198,244,50,0.4)'
                        : isDisabled
                        ? '1px solid rgba(28,42,82,0.4)'
                        : '1px solid rgba(28,42,82,0.7)',
                      boxShadow: isSelected ? '0 0 20px rgba(198,244,50,0.08)' : 'none',
                      opacity: isDisabled ? 0.45 : 1,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      animation: `fade-up ${0.4 + idx * 0.05}s ease both`,
                      transform: 'translateY(0)',
                      transitionProperty: 'transform, box-shadow, border-color, background',
                      transitionDuration: '0.18s',
                    }}
                    onMouseEnter={e => {
                      if (!isDisabled && !isSelected) {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(198,244,50,0.3)';
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isDisabled && !isSelected) {
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(28,42,82,0.7)';
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                      }
                    }}
                  >
                    {/* Selected glow overlay */}
                    {isSelected && (
                      <div
                        className="absolute inset-0 pointer-events-none rounded-xl"
                        style={{ background: 'radial-gradient(circle at top right, rgba(198,244,50,0.06), transparent 60%)' }}
                      />
                    )}
                    <div className="flex items-center gap-2 mb-1.5 relative">
                      <span className="text-sm leading-none">{s.icon}</span>
                      <span
                        className="text-[9px] font-mono font-bold"
                        style={{ color: isSelected ? '#C6F432' : 'rgba(143,163,199,0.6)' }}
                      >
                        {s.id}
                      </span>
                      <span className="text-[11px] text-white font-semibold flex-1 leading-tight">{s.name}</span>
                      {isSelected && (
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                          style={{ color: '#C6F432', background: 'rgba(198,244,50,0.12)', border: '1px solid rgba(198,244,50,0.3)' }}
                        >
                          ✓ SELECTED
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] leading-relaxed relative" style={{ color: 'rgba(74,94,128,0.9)' }}>
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center justify-between">
            <button
              id="btn-start-demo"
              onClick={handleStart}
              disabled={!activeScenario}
              className="font-bold text-sm px-8 py-3 rounded-xl transition-all relative overflow-hidden"
              style={
                activeScenario
                  ? {
                      background: 'linear-gradient(135deg, #C6F432, #A3D420)',
                      color: '#070E24',
                      boxShadow: '0 0 30px rgba(198,244,50,0.25), 0 4px 16px rgba(0,0,0,0.3)',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.02em',
                    }
                  : {
                      background: 'rgba(28,42,82,0.5)',
                      color: 'rgba(143,163,199,0.5)',
                      border: '1px solid rgba(28,42,82,0.6)',
                      cursor: 'not-allowed',
                    }
              }
              onMouseEnter={e => {
                if (activeScenario) {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 50px rgba(198,244,50,0.4), 0 6px 20px rgba(0,0,0,0.35)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={e => {
                if (activeScenario) {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 30px rgba(198,244,50,0.25), 0 4px 16px rgba(0,0,0,0.3)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }
              }}
            >
              {activeScenario ? `▶  Start ${activeScenario.id}: ${activeScenario.name}` : '▶  Select a scenario first'}
            </button>

            <button
              onClick={() => navigate('/presenter')}
              className="text-xs font-mono px-4 py-2 rounded-xl transition-all"
              style={{
                color: 'rgba(143,163,199,0.7)',
                border: '1px solid rgba(28,42,82,0.7)',
                background: 'rgba(13,23,48,0.4)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.9)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(28,42,82,1)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'rgba(143,163,199,0.7)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(28,42,82,0.7)';
              }}
            >
              Presenter Panel →
            </button>
          </div>

          {/* ILLUSTRATIVE footer */}
          <div className="text-center mt-8">
            <span
              className="text-[9px] font-mono uppercase tracking-widest"
              style={{ color: 'rgba(74,94,128,0.7)' }}
            >
              ILLUSTRATIVE • SIMULATED • Demo metrics, not performance evidence
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
