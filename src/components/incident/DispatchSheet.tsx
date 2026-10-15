/**
 * DispatchSheet — Modal shown after Confirm (design.md 5.6).
 * Channel: Police Control Room (SIMULATED).
 * Optional free-text note. Evidence package auto-attached.
 */
import { useState } from 'react';

interface DispatchSheetProps {
  incidentId: string;
  eventTitle: string;
  onSend: (note: string) => void;
  onCancel: () => void;
}

export function DispatchSheet({ incidentId, eventTitle, onSend, onCancel }: DispatchSheetProps) {
  const [note, setNote] = useState('');

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={onCancel}>
      <div
        className="bg-panel border border-edge rounded-lg shadow-2xl w-96 max-w-[90vw] p-4 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold text-sm">
          Dispatch — {incidentId}
        </h3>

        {/* Channel */}
        <div className="bg-navy/50 border border-edge/50 rounded p-2 space-y-1">
          <div className="flex justify-between">
            <span className="text-[9px] text-text-dim font-mono uppercase">Channel</span>
            <span className="text-[8px] text-amber/60 font-mono">SIMULATED</span>
          </div>
          <span className="text-xs text-white">Police Control Room (SIMULATED)</span>
        </div>

        {/* Incident summary */}
        <div className="bg-navy/50 border border-edge/50 rounded p-2 space-y-1">
          <span className="text-[9px] text-text-dim font-mono uppercase">Event</span>
          <span className="text-xs text-white block">{eventTitle}</span>
        </div>

        {/* Evidence package */}
        <div className="bg-navy/50 border border-edge/50 rounded p-2">
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-text-dim font-mono uppercase">Evidence package</span>
            <span className="text-[8px] text-lime font-mono">✓ AUTO-ATTACHED</span>
          </div>
          <span className="text-[10px] text-muted mt-0.5 block">
            10s clip, incident log, metadata
          </span>
        </div>

        {/* Optional note */}
        <div>
          <span className="text-[9px] text-text-dim font-mono uppercase block mb-1">
            Note (optional)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add context for the responding unit..."
            className="w-full bg-navy border border-edge rounded px-2 py-1.5 text-white text-xs font-mono resize-none h-14 focus:border-cyan/50 outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onSend(note)}
            className="flex-1 bg-cyan/20 border border-cyan/50 text-cyan font-semibold text-xs py-2 rounded hover:bg-cyan/30 transition-colors"
          >
            📡 Send dispatch
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-xs font-semibold py-2 rounded bg-edge/20 border border-edge/30 text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <p className="text-[8px] text-amber/50 text-center font-mono">
          ALL DISPATCH COMMUNICATIONS ARE SIMULATED
        </p>
      </div>
    </div>
  );
}
