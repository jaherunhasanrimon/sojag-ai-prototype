/**
 * DismissDialog — Modal requiring a reason to dismiss an incident (design.md 5.4 item 8).
 * Invariant I3: DISMISS requires a reason string.
 */
import { useState } from 'react';

const DISMISS_REASONS = [
  'Normal activity',
  'Play or sport',
  'Camera artefact',
  'Weather / environmental',
  'Other',
];

interface DismissDialogProps {
  incidentId: string;
  onDismiss: (reason: string) => void;
  onCancel: () => void;
}

export function DismissDialog({ incidentId, onDismiss, onCancel }: DismissDialogProps) {
  const [selected, setSelected] = useState('');
  const [freeText, setFreeText] = useState('');

  const finalReason = selected === 'Other'
    ? freeText.trim()
    : selected;

  const canSubmit = finalReason.length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onCancel}>
      <div
        className="bg-panel border border-edge rounded-lg shadow-2xl w-96 max-w-[90vw] p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold text-sm">
          Dismiss incident {incidentId}
        </h3>
        <p className="text-text-dim text-xs">
          A reason is required to dismiss this incident. This will be recorded in the audit log.
        </p>

        {/* Reason radio buttons */}
        <div className="space-y-1.5">
          {DISMISS_REASONS.map((reason) => (
            <label
              key={reason}
              className={`
                flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-xs
                border transition-colors
                ${selected === reason
                  ? 'border-amber/50 bg-amber/10 text-white'
                  : 'border-edge/30 bg-navy/50 text-muted hover:border-edge'
                }
              `}
            >
              <input
                type="radio"
                name="dismiss-reason"
                value={reason}
                checked={selected === reason}
                onChange={() => setSelected(reason)}
                className="accent-amber"
              />
              {reason}
            </label>
          ))}
        </div>

        {/* Free text for "Other" */}
        {selected === 'Other' && (
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Describe reason..."
            className="w-full bg-navy border border-edge rounded px-2 py-1.5 text-white text-xs font-mono resize-none h-16 focus:border-amber/50 outline-none"
            autoFocus
          />
        )}

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => canSubmit && onDismiss(finalReason)}
            disabled={!canSubmit}
            className={`
              flex-1 text-xs font-semibold py-2 rounded transition-colors
              ${canSubmit
                ? 'bg-amber/20 border border-amber/50 text-amber hover:bg-amber/30'
                : 'bg-edge/20 border border-edge/30 text-muted cursor-not-allowed'
              }
            `}
          >
            ✕ Dismiss
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-xs font-semibold py-2 rounded bg-edge/20 border border-edge/30 text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
