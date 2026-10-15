/**
 * StartPage — The landing screen with disclaimer, scenario picker, and Start button.
 * design.md section 5.1
 */
import { useNavigate } from 'react-router-dom';
import { Banner } from '../components/layout';

const SCENARIOS = [
  { id: 'S1', name: 'Single incident, full lifecycle', description: 'One crime-like clip fires a HIGH alert. Full workflow to closure.' },
  { id: 'S2', name: 'False alarm', description: 'A non-crime clip fires a LOW/MEDIUM alert. Operator dismisses.' },
  { id: 'S3', name: 'Simultaneous incidents', description: 'Second alert queues while first is under review. Lock rule demo.' },
  { id: 'S4', name: 'Escalation', description: 'Operator requests review; supervisor decides.' },
  { id: 'S5', name: 'Quiet shift', description: 'No alerts, wall just plays. No alert is a valid outcome.' },
  { id: 'S6', name: 'Full pitch run (autoplay)', description: 'Timed hands-free demo for the pitch (~90s).' },
];

export function StartPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-navy flex flex-col">
      <Banner />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-2xl w-full">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-heading font-bold text-white mb-1">
              SOTORKO <span className="text-lime">AI</span>
            </h1>
            <p className="text-sm text-muted">
              Public Safety Intelligent Monitoring — Control Room Prototype
            </p>
          </div>

          {/* Disclaimer */}
          <div className="bg-panel border border-edge rounded-lg p-4 mb-6">
            <h2 className="text-xs font-mono text-amber uppercase tracking-wider mb-2">
              ⚠ Important Disclaimer
            </h2>
            <p className="text-sm text-muted leading-relaxed">
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

          {/* Scenario picker */}
          <div className="bg-panel border border-edge rounded-lg p-4 mb-6">
            <h2 className="text-xs font-mono text-muted uppercase tracking-wider mb-3">
              Select demo scenario
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  id={`scenario-${s.id.toLowerCase()}`}
                  className="text-left bg-navy/50 border border-edge/50 rounded-lg p-3 hover:border-lime/50 hover:bg-navy transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-lime group-hover:text-lime">
                      {s.id}
                    </span>
                    <span className="text-xs text-white font-semibold">{s.name}</span>
                  </div>
                  <p className="text-[10px] text-text-dim leading-relaxed">{s.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              id="btn-start-demo"
              onClick={() => navigate('/room')}
              className="bg-lime text-navy font-bold text-sm px-8 py-3 rounded-lg hover:bg-lime/90 transition-colors shadow-[0_0_30px_rgba(198,244,50,0.2)]"
            >
              ▶ Start Demo
            </button>
            <button
              onClick={() => navigate('/presenter')}
              className="text-xs text-muted hover:text-white border border-edge px-4 py-2 rounded-lg transition-colors"
            >
              Presenter Panel →
            </button>
          </div>

          {/* ILLUSTRATIVE footer */}
          <div className="text-center mt-8">
            <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest">
              ILLUSTRATIVE • SIMULATED • Demo metrics, not performance evidence
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
