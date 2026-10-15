/**
 * IncidentScreen — Display B: the incident detail panel.
 * Phase 1: static hard-coded STK-001 example.
 * Phase 4: fully interactive with live data.
 *
 * Shows every field from design.md section 5.4.
 */

/** Hard-coded example incident for Phase 1 layout */
const EXAMPLE_INCIDENT = {
  id: 'STK-001',
  title: 'Possible physical altercation',
  eventType: 'physical_altercation',
  cameraId: 'CAM-05',
  location: 'Example public intersection A, Dhaka',
  timestamp: '14:32:07',
  confidence: 0.92,
  priority: 'HIGH' as const,
  status: 'Awaiting verification',
};

export function IncidentScreen() {
  const inc = EXAMPLE_INCIDENT;

  return (
    <div className="flex flex-col h-full gap-2">
      {/* 1. Alarm banner */}
      <div className="bg-magenta/15 border border-magenta/40 rounded px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-magenta" style={{ animation: 'alert-pulse 1s ease-in-out infinite' }} />
          <span className="text-magenta text-xs font-bold uppercase tracking-wider">
            Audible alarm on
          </span>
          <span className="text-white/70 text-xs">|</span>
          <span className="text-white text-xs font-semibold">
            NEW HIGH-PRIORITY INCIDENT
          </span>
        </div>
        <button
          className="text-[10px] text-muted hover:text-white border border-edge px-2 py-0.5 rounded transition-colors"
          aria-label="Mute alarm"
        >
          🔇 Mute
        </button>
      </div>

      {/* 2. Enlarged feed placeholder with overlay box */}
      <div className="relative bg-navy rounded aspect-video border border-edge overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-panel to-navy flex items-center justify-center">
          <span className="text-text-dim text-sm font-mono">LIVE FEED — {inc.cameraId}</span>
        </div>
        {/* Lime detection box overlay (scripted, not real detection) */}
        <div
          className="absolute border-2 border-lime rounded"
          style={{ left: '30%', top: '25%', width: '40%', height: '50%' }}
        >
          <span className="absolute -top-5 left-0 text-[9px] font-mono text-lime bg-black/70 px-1 rounded">
            possible event
          </span>
        </div>
      </div>

      {/* 3. Mini map placeholder + location */}
      <div className="flex gap-2">
        <div className="w-24 h-16 bg-navy border border-edge rounded flex items-center justify-center flex-shrink-0">
          <span className="text-[8px] font-mono text-text-dim">ILLUSTRATIVE MAP</span>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <span className="text-[10px] text-muted font-mono">📍 LOCATION (SIMULATED)</span>
          <span className="text-xs text-white">{inc.location}</span>
        </div>
      </div>

      {/* 4. Fields */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 bg-navy/50 rounded p-2 border border-edge/50">
        <Field label="Incident ID" value={inc.id} tag="ILLUSTRATIVE" />
        <Field label="Event" value={inc.title} />
        <Field label="Location" value={inc.location} tag="SIMULATED" />
        <Field label="Camera" value={inc.cameraId} />
        <Field label="Timestamp" value={inc.timestamp} tag="ILLUSTRATIVE" />
        <Field label="Type" value={inc.eventType} />
      </div>

      {/* 5. Chips */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] bg-magenta/20 text-magenta border border-magenta/30 px-2 py-0.5 rounded-full font-semibold uppercase">
          Priority: {inc.priority}
        </span>
        <span className="text-[10px] bg-purple/20 text-purple border border-purple/30 px-2 py-0.5 rounded-full font-mono">
          Detection confidence (scripted) {Math.round(inc.confidence * 100)}%
        </span>
      </div>

      {/* 6. Status line */}
      <div className="text-xs text-amber font-mono px-2">
        ⏳ {inc.status} | operator review required
      </div>

      {/* 7. Recent event clip strip placeholder */}
      <div className="bg-navy rounded border border-edge/50 p-2">
        <span className="text-[10px] text-muted font-mono uppercase mb-1 block">Recent event clip</span>
        <div className="h-12 bg-navy border border-edge rounded flex items-center justify-center">
          <span className="text-[9px] text-text-dim font-mono">10s clip replay — Phase 4</span>
        </div>
      </div>

      {/* 8. Action buttons */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          id="btn-confirm"
          className="flex-1 bg-lime/20 border border-lime/50 text-lime font-semibold text-xs py-2 rounded hover:bg-lime/30 transition-colors"
        >
          ✓ Confirm
        </button>
        <button
          id="btn-dismiss"
          className="flex-1 bg-muted/10 border border-muted/30 text-muted font-semibold text-xs py-2 rounded hover:bg-muted/20 transition-colors"
        >
          ✕ Dismiss
        </button>
        <button
          id="btn-request-review"
          className="flex-1 bg-purple/20 border border-purple/50 text-purple font-semibold text-xs py-2 rounded hover:bg-purple/30 transition-colors"
        >
          ↗ Request review
        </button>
      </div>

      {/* 9. Queue banner */}
      <div className="bg-amber/10 border border-amber/30 rounded px-2 py-1.5 text-center">
        <span className="text-[10px] text-amber font-mono">
          2 more alerts queued. Highest: HIGH (STK-006)
        </span>
      </div>
    </div>
  );
}

/** Small labelled field for the incident detail */
function Field({ label, value, tag }: { label: string; value: string; tag?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] text-text-dim font-mono uppercase">
        {label}
        {tag && <span className="ml-1 text-amber/60">({tag})</span>}
      </span>
      <span className="text-xs text-white">{value}</span>
    </div>
  );
}
