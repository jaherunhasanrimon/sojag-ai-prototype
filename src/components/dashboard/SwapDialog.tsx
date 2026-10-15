/**
 * SwapDialog — Confirmation modal for Rule 3 swap action.
 * Confirms parking the currently reviewed incident as PAUSED
 * and pulling the selected queued incident to ACTIVE.
 */
interface SwapDialogProps {
  currentActiveId: string;
  targetIncidentId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SwapDialog({
  currentActiveId,
  targetIncidentId,
  onConfirm,
  onCancel,
}: SwapDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-panel border border-amber/60 rounded-lg shadow-2xl w-96 max-w-full p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-sm">
          Swap Active Incident? (Rule 3)
        </h3>
        <p className="text-text-dim text-xs leading-relaxed">
          Incident <strong className="text-white">{currentActiveId}</strong> will be parked back into the queue with status <span className="text-cyan font-mono font-bold">PAUSED</span>.
        </p>
        <p className="text-text-dim text-xs leading-relaxed">
          Incident <strong className="text-white">{targetIncidentId}</strong> will be pulled into active review on Display B.
        </p>

        <div className="flex gap-2 pt-2">
          <button
            id="btn-confirm-swap"
            onClick={onConfirm}
            className="flex-1 bg-amber/20 border border-amber/50 text-amber hover:bg-amber/30 text-xs font-bold py-2 rounded transition-colors cursor-pointer"
          >
            🔄 Confirm Swap
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-edge/30 border border-edge/50 text-muted hover:text-white text-xs font-semibold py-2 rounded transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-[8px] text-muted text-center font-mono">
          OPERATOR SWAP IS FULLY AUDITED
        </p>
      </div>
    </div>
  );
}
