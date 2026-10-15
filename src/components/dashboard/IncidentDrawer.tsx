/**
 * IncidentDrawer — Side drawer opening when a queue row is clicked (design.md 5.5).
 * Shows incident details, timeline, full audit log, and optional swap action.
 */
import type { Incident } from '../../domain/types';

interface IncidentDrawerProps {
  incident: Incident;
  locationLabel?: string;
  hasActiveIncident: boolean;
  onSwapIn?: (incidentId: string) => void;
  onClose: () => void;
}

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: 'bg-lime/20 text-lime border-lime/30',
  QUEUED: 'bg-amber/20 text-amber border-amber/30',
  PAUSED: 'bg-cyan/20 text-cyan border-cyan/30',
  REVIEW_REQUESTED: 'bg-purple/20 text-purple border-purple/30',
  CONFIRMED: 'bg-lime/20 text-lime border-lime/30',
  DISPATCHED: 'bg-cyan/20 text-cyan border-cyan/30',
  ACKNOWLEDGED: 'bg-cyan/20 text-cyan border-cyan/30',
  ARRIVED: 'bg-lime/20 text-lime border-lime/30',
  CLOSED: 'bg-muted/20 text-muted border-muted/30',
  DISMISSED: 'bg-text-dim/20 text-text-dim border-edge',
};

export function IncidentDrawer({
  incident,
  locationLabel,
  hasActiveIncident,
  onSwapIn,
  onClose,
}: IncidentDrawerProps) {
  const canSwap = (incident.status === 'QUEUED' || incident.status === 'PAUSED') && hasActiveIncident;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex justify-end" onClick={onClose}>
      <aside
        className="w-96 max-w-full h-full bg-panel border-l border-edge p-5 flex flex-col gap-4 overflow-y-auto shadow-2xl animate-[slide-in_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
        aria-label="Incident details drawer"
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between border-b border-edge/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-mono font-bold text-base">
                {incident.id}
              </span>
              <span
                className={`text-[9px] border px-2 py-0.5 rounded-full font-mono font-semibold uppercase ${
                  STATUS_BADGES[incident.status] ?? STATUS_BADGES.QUEUED
                }`}
              >
                {incident.status.replace(/_/g, ' ')}
              </span>
            </div>
            <h3 className="text-sm text-white font-semibold mt-1">
              {incident.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-lg font-mono"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Swap action button if eligible */}
        {canSwap && onSwapIn && (
          <div className="bg-amber/10 border border-amber/30 rounded p-2.5 space-y-1.5">
            <div className="text-[10px] text-amber font-mono font-semibold">
              Operator Swap Option (Rule 3)
            </div>
            <p className="text-[10px] text-text-dim leading-relaxed">
              You can pause the currently reviewed incident and pull this one into active review.
            </p>
            <button
              id="btn-swap-review"
              onClick={() => onSwapIn(incident.id)}
              className="w-full bg-amber/20 border border-amber/50 text-amber hover:bg-amber/30 font-semibold text-xs py-1.5 rounded transition-colors"
            >
              🔄 Review this instead
            </button>
          </div>
        )}

        {/* Details List */}
        <div className="bg-navy/50 border border-edge/50 rounded p-3 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-text-dim font-mono text-[9px] uppercase">Camera</span>
            <span className="text-white font-mono">{incident.cameraId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dim font-mono text-[9px] uppercase">Location</span>
            <span className="text-white text-right">{locationLabel ?? 'Dhaka public camera'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dim font-mono text-[9px] uppercase">Priority</span>
            <span className="text-white font-mono">{incident.priority}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dim font-mono text-[9px] uppercase">Scripted Confidence</span>
            <span className="text-purple font-mono">{Math.round(incident.confidence * 100)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-dim font-mono text-[9px] uppercase">Fired at wall time</span>
            <span className="text-muted font-mono">{incident.firedAtWall}</span>
          </div>
          {incident.operator && (
            <div className="flex justify-between">
              <span className="text-text-dim font-mono text-[9px] uppercase">Assigned Operator</span>
              <span className="text-lime font-mono">{incident.operator}</span>
            </div>
          )}
          {incident.dismissReason && (
            <div className="flex justify-between">
              <span className="text-text-dim font-mono text-[9px] uppercase">Dismiss Reason</span>
              <span className="text-amber">{incident.dismissReason}</span>
            </div>
          )}
          {incident.outcome && (
            <div className="flex justify-between">
              <span className="text-text-dim font-mono text-[9px] uppercase">Close Outcome</span>
              <span className="text-lime">{incident.outcome}</span>
            </div>
          )}
        </div>

        {/* Dispatch Timeline if present */}
        {incident.dispatch && (
          <div className="bg-navy/50 border border-edge/50 rounded p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted font-mono uppercase">Dispatch Timeline</span>
              <span className="text-[8px] text-amber/60 font-mono">SIMULATED</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {incident.dispatch.steps.map((st, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan flex-shrink-0" />
                  <span className="text-white font-mono text-[10px]">{st.status}</span>
                  <span className="text-text-dim font-mono text-[9px] ml-auto">
                    {Math.round(st.atDemoMs / 1000)}s demo time
                  </span>
                </div>
              ))}
              {incident.dispatch.unit && (
                <div className="text-[10px] text-cyan font-mono mt-1">
                  Assigned: {incident.dispatch.unit}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audit Log */}
        <div className="flex-1 flex flex-col space-y-2 min-h-0">
          <span className="text-[10px] text-muted font-mono uppercase">Incident Audit Log</span>
          <div className="flex-1 overflow-y-auto space-y-1.5 bg-navy/30 border border-edge/30 rounded p-2">
            {incident.log.map((entry, index) => (
              <div key={index} className="text-[10px] border-b border-edge/20 pb-1">
                <div className="flex items-center justify-between text-[9px] font-mono text-text-dim">
                  <span className="text-cyan">{entry.actor}</span>
                  <span>{Math.round(entry.atMs / 1000)}s</span>
                </div>
                <div className="text-white font-semibold font-mono text-[9px]">{entry.action}</div>
                {entry.detail && (
                  <div className="text-muted text-[9px]">{entry.detail}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
