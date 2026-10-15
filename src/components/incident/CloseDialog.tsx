/**
 * CloseDialog — Modal for closing an arrived incident (design.md section 5.6).
 * Prompts operator to select one of the allowed outcomes:
 * - Resolved
 * - Handed over
 * - No further action
 */
import { useState } from 'react';

const CLOSE_OUTCOMES: Array<'Resolved' | 'Handed over' | 'No further action'> = [
  'Resolved',
  'Handed over',
  'No further action',
];

interface CloseDialogProps {
  incidentId: string;
  onClose: (outcome: 'Resolved' | 'Handed over' | 'No further action') => void;
  onCancel: () => void;
}

export function CloseDialog({ incidentId, onClose, onCancel }: CloseDialogProps) {
  const [selected, setSelected] = useState<'Resolved' | 'Handed over' | 'No further action'>('Resolved');

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onCancel}>
      <div
        className="bg-panel border border-edge rounded-lg shadow-2xl w-96 max-w-[90vw] p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold text-sm">
          Close incident {incidentId}
        </h3>
        <p className="text-text-dim text-xs">
          Select the final outcome for this incident. This will be recorded in the audit log.
        </p>

        {/* Outcome radio buttons */}
        <div className="space-y-1.5">
          {CLOSE_OUTCOMES.map((outcome) => (
            <label
              key={outcome}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs
                border transition-colors
                ${selected === outcome
                  ? 'border-lime/50 bg-lime/10 text-white'
                  : 'border-edge/30 bg-navy/50 text-muted hover:border-edge'
                }
              `}
            >
              <input
                type="radio"
                name="close-outcome"
                value={outcome}
                checked={selected === outcome}
                onChange={() => setSelected(outcome)}
                className="accent-lime"
              />
              {outcome}
            </label>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            id="btn-confirm-close"
            onClick={() => onClose(selected)}
            className="flex-1 bg-lime/20 border border-lime/50 text-lime hover:bg-lime/30 text-xs font-semibold py-2 rounded transition-colors"
          >
            ✔ Confirm Close
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-xs font-semibold py-2 rounded bg-edge/20 border border-edge/30 text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-[8px] text-amber/50 text-center font-mono">
          CLOSING FREES OPERATOR LOCK • AUTO-PULLS NEXT QUEUED INCIDENT
        </p>
      </div>
    </div>
  );
}
