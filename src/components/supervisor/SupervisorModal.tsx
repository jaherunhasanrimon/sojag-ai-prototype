/**
 * SupervisorModal — Escalation modal for supervisor review (design.md section 5.8).
 * Handles Scenario S4: operator requested review, supervisor decides.
 *
 * One-click actions:
 * - Approve confirm (transitions REVIEW_REQUESTED → CONFIRMED)
 * - Dismiss with reason (transitions REVIEW_REQUESTED → DISMISSED)
 */
import { useState } from 'react';
import type { Incident } from '../../domain/types';

interface SupervisorModalProps {
  incident: Incident;
  locationLabel?: string;
  onApprove: () => void;
  onDismiss: (reason: string) => void;
  onClose: () => void;
}

const SUPERVISOR_DISMISS_REASONS = [
  'False alarm — normal activity',
  'Camera artefact / reflection',
  'Insufficient evidence to escalate',
  'Other',
];

export function SupervisorModal({
  incident,
  locationLabel,
  onApprove,
  onDismiss,
  onClose,
}: SupervisorModalProps) {
  const [showDismissReason, setShowDismissReason] = useState(false);
  const [selectedReason, setSelectedReason] = useState(SUPERVISOR_DISMISS_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;
  const canSubmitDismiss = finalReason.length > 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-panel border-2 border-purple/60 rounded-lg shadow-2xl w-[480px] max-w-full p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-purple/30 text-purple border border-purple/50 px-2 py-0.5 rounded font-mono font-bold uppercase">
                SUPERVISOR ESCALATION
              </span>
              <span className="text-[10px] text-amber/80 font-mono">(SIMULATED)</span>
            </div>
            <h3 className="text-white font-bold text-base mt-1">
              Review Incident {incident.id}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-lg font-mono"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Incident Summary */}
        <div className="bg-navy/70 border border-edge/60 rounded p-3 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-text-dim uppercase font-mono text-[9px]">Event</span>
            <span className="text-white font-semibold">{incident.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-dim uppercase font-mono text-[9px]">Camera & Location</span>
            <span className="text-white font-mono">{incident.cameraId} • {locationLabel ?? 'Dhaka public surveillance'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-dim uppercase font-mono text-[9px]">Confidence & Priority</span>
            <span className="text-amber font-mono">
              {Math.round(incident.confidence * 100)}% (scripted) • {incident.priority}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-dim uppercase font-mono text-[9px]">Escalated By</span>
            <span className="text-purple font-mono">{incident.operator ?? 'Operator'}</span>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-[11px] text-muted">
          Operator requested supervisor review for verification before taking dispatch action.
        </div>

        {/* Dismiss reasons if selected */}
        {showDismissReason ? (
          <div className="space-y-2 bg-navy/40 border border-edge/40 rounded p-3">
            <span className="text-[10px] font-mono text-amber block uppercase font-semibold">
              Select Dismissal Reason (Required)
            </span>
            <div className="space-y-1">
              {SUPERVISOR_DISMISS_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-xs text-white/90 cursor-pointer">
                  <input
                    type="radio"
                    name="sup-dismiss-reason"
                    value={r}
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="accent-amber"
                  />
                  {r}
                </label>
              ))}
            </div>
            {selectedReason === 'Other' && (
              <input
                type="text"
                placeholder="Specify reason..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full bg-navy border border-edge rounded px-2 py-1 text-xs text-white font-mono mt-1"
              />
            )}
            <div className="flex gap-2 pt-2">
              <button
                id="btn-confirm-supervisor-dismiss"
                disabled={!canSubmitDismiss}
                onClick={() => onDismiss(finalReason)}
                className={`flex-1 text-xs font-semibold py-1.5 rounded transition-colors ${
                  canSubmitDismiss
                    ? 'bg-amber/20 border border-amber/50 text-amber hover:bg-amber/30 cursor-pointer'
                    : 'bg-edge/20 border border-edge/30 text-muted cursor-not-allowed'
                }`}
              >
                Confirm Dismissal
              </button>
              <button
                onClick={() => setShowDismissReason(false)}
                className="px-3 text-xs text-muted hover:text-white"
              >
                Back
              </button>
            </div>
          </div>
        ) : (
          /* One-click action buttons */
          <div className="flex items-center gap-3 pt-2">
            <button
              id="btn-supervisor-approve"
              onClick={onApprove}
              className="flex-1 bg-lime/20 border border-lime/50 text-lime hover:bg-lime/30 font-bold text-xs py-2.5 rounded transition-colors cursor-pointer"
            >
              ✓ Approve Confirm
            </button>
            <button
              id="btn-supervisor-dismiss"
              onClick={() => setShowDismissReason(true)}
              className="flex-1 bg-amber/20 border border-amber/50 text-amber hover:bg-amber/30 font-bold text-xs py-2.5 rounded transition-colors cursor-pointer"
            >
              ✕ Dismiss Incident
            </button>
          </div>
        )}

        <div className="text-[8px] font-mono text-center text-text-dim uppercase tracking-wider">
          SUPERVISOR ACTIONS ARE FULLY LOGGED IN THE AUDIT TRAIL
        </div>
      </div>
    </div>
  );
}
