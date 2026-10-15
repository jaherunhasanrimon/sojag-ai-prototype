/**
 * DebugPanel — Dev-only panel listing incidents and their status.
 * Shows the state machine in action during development.
 * Only rendered in development mode.
 */
import { useAppStore } from '../../store/store';
import { useDemoClock } from '../../services/clock';
import { useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  QUEUED: 'text-amber',
  ACTIVE: 'text-lime',
  PAUSED: 'text-purple',
  REVIEW_REQUESTED: 'text-cyan',
  CONFIRMED: 'text-cyan',
  DISPATCHED: 'text-cyan',
  ACKNOWLEDGED: 'text-cyan',
  ARRIVED: 'text-lime',
  CLOSED: 'text-muted',
  DISMISSED: 'text-text-dim',
};

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const incidents = useAppStore((s) => s.incidents);
  const auditLog = useAppStore((s) => s.auditLog);
  const schedulerState = useAppStore((s) => s.schedulerState);
  const activeScenario = useAppStore((s) => s.activeScenario);
  const applyAction = useAppStore((s) => s.applyAction);
  const pullNextIncident = useAppStore((s) => s.pullNextIncident);

  const clockState = useDemoClock();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-12 right-2 bg-purple/20 border border-purple/40 text-purple text-[10px] font-mono px-2 py-1 rounded z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-12 right-2 w-80 max-h-[60vh] bg-navy/95 border border-purple/40 rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-purple/30 bg-purple/10">
        <span className="text-[10px] font-mono text-purple font-bold uppercase">🐛 Debug Panel (Dev)</span>
        <button onClick={() => setIsOpen(false)} className="text-muted text-xs hover:text-white">✕</button>
      </div>

      <div className="overflow-auto p-2 space-y-2 text-[10px] font-mono">
        {/* Clock */}
        <Section title="Clock">
          <Row label="Playing" value={clockState.isPlaying ? '▶ YES' : '⏸ NO'} />
          <Row label="Speed" value={`${clockState.speed}x`} />
          <Row label="Elapsed" value={clockState.getFormattedTime()} />
        </Section>

        {/* Scenario */}
        <Section title="Scenario">
          <Row label="Active" value={activeScenario?.id ?? 'None'} />
          <Row label="Cues armed" value={String(activeScenario?.armedCueIds.length ?? 0)} />
          <Row label="Cues fired" value={String(schedulerState.firedCueIds.size)} />
        </Section>

        {/* Incidents */}
        <Section title={`Incidents (${incidents.length})`}>
          {incidents.length === 0 && <span className="text-text-dim">No incidents yet</span>}
          {incidents.map((inc) => (
            <div key={inc.id} className="border border-edge/30 rounded p-1.5 mb-1">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{inc.id}</span>
                <span className={STATUS_COLORS[inc.status] ?? 'text-muted'}>
                  {inc.status}
                </span>
              </div>
              <div className="text-text-dim mt-0.5">{inc.title}</div>
              <div className="text-text-dim">{inc.cameraId} • {inc.priority} • conf={inc.confidence}</div>
              <div className="text-text-dim">Log: {inc.log.length} entries</div>

              {/* Quick actions for testing */}
              {inc.status === 'ACTIVE' && (
                <div className="flex gap-1 mt-1">
                  <DebugButton label="Confirm" onClick={() => applyAction(inc.id, { type: 'CONFIRM' })} />
                  <DebugButton label="Dismiss" onClick={() => applyAction(inc.id, { type: 'DISMISS', reason: 'Debug dismiss' })} />
                  <DebugButton label="Escalate" onClick={() => applyAction(inc.id, { type: 'REQUEST_REVIEW' })} />
                </div>
              )}
              {inc.status === 'CONFIRMED' && (
                <DebugButton label="Dispatch" onClick={() => applyAction(inc.id, { type: 'SEND_DISPATCH' })} />
              )}
              {inc.status === 'REVIEW_REQUESTED' && (
                <div className="flex gap-1 mt-1">
                  <DebugButton label="Sup. Confirm" onClick={() => applyAction(inc.id, { type: 'SUPERVISOR_CONFIRM' })} />
                  <DebugButton label="Sup. Dismiss" onClick={() => applyAction(inc.id, { type: 'SUPERVISOR_DISMISS', reason: 'Debug' })} />
                </div>
              )}
            </div>
          ))}

          <DebugButton label="Pull Next" onClick={() => pullNextIncident()} />
        </Section>

        {/* Audit log */}
        <Section title={`Audit Log (${auditLog.length})`}>
          <div className="max-h-32 overflow-auto">
            {auditLog.slice(-10).reverse().map((entry, i) => (
              <div key={i} className="text-text-dim border-b border-edge/20 py-0.5">
                <span className="text-muted">{entry.actor}</span>
                {' → '}
                <span className="text-white">{entry.action}</span>
                {entry.detail && <span className="text-text-dim"> — {entry.detail}</span>}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-purple/80 uppercase text-[8px] tracking-wider mb-0.5">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-text-dim">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function DebugButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-[8px] bg-edge/30 border border-edge text-muted px-1.5 py-0.5 rounded hover:bg-edge/50 hover:text-white transition-colors"
    >
      {label}
    </button>
  );
}
