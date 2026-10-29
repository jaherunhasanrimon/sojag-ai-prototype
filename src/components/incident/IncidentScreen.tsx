/**
 * IncidentScreen — Display B: the incident detail panel (design.md 5.4).
 * Phase 4: fully interactive, wired to live store data.
 *
 * Shows every field from design.md section 5.4:
 * 1. Alarm banner
 * 2. Enlarged live feed with overlay box
 * 3. Mini map with pin
 * 4. Fields: ID, title, location, camera, timestamp, type
 * 5. Chips: confidence (scripted), priority
 * 6. Status line
 * 7. Recent event clip strip (10s window)
 * 8. Action buttons: Confirm, Dismiss, Request review
 * 9. Queue banner
 */
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store/store';
import { FeedView } from './FeedView';
import { MiniMap } from './MiniMap';
import { ClipStrip } from './ClipStrip';
import { DismissDialog } from './DismissDialog';
import { DispatchSheet } from './DispatchSheet';
import { CloseDialog } from './CloseDialog';
import { startAlarm, stopAlarm, acknowledgeAlarm, toggleMute, getIsMuted } from '../../services/alarm';

const STATUS_LABELS: Record<string, string> = {
  QUEUED: 'Queued — awaiting review',
  ACTIVE: 'Awaiting verification | operator review required',
  PAUSED: 'Paused — parked by operator',
  REVIEW_REQUESTED: 'Escalated — awaiting supervisor review',
  CONFIRMED: 'Confirmed — ready for dispatch',
  DISPATCHED: 'Dispatched — awaiting acknowledgement',
  ACKNOWLEDGED: 'Acknowledged — unit en route',
  ARRIVED: 'Unit arrived — awaiting closure',
  CLOSED: 'Closed',
  DISMISSED: 'Dismissed (false alarm)',
};

const STATUS_ICONS: Record<string, string> = {
  ACTIVE: '⏳',
  CONFIRMED: '✓',
  DISPATCHED: '📡',
  ACKNOWLEDGED: '🚔',
  ARRIVED: '📍',
  CLOSED: '✔',
  DISMISSED: '✕',
  REVIEW_REQUESTED: '↗',
};

export function IncidentScreen() {
  const incidents = useAppStore((s) => s.incidents);
  const activeIncident = incidents.find(
    (i) =>
      i.status === 'ACTIVE' ||
      i.status === 'CONFIRMED' ||
      i.status === 'DISPATCHED' ||
      i.status === 'ACKNOWLEDGED' ||
      i.status === 'ARRIVED',
  );
  const queuedIncidents = incidents.filter(
    (i) => i.status === 'QUEUED' || i.status === 'PAUSED',
  );
  const applyAction = useAppStore((s) => s.applyAction);
  const data = useAppStore((s) => s.data);
  const activeScenario = useAppStore((s) => s.activeScenario);
  const lowRes = useAppStore((s) => s.lowRes);

  const [showDismissDialog, setShowDismissDialog] = useState(false);
  const [showDispatchSheet, setShowDispatchSheet] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isMuted, setIsMuted] = useState(getIsMuted());
  const [alarmAcknowledged, setAlarmAcknowledged] = useState(false);

  // Start alarm when a new incident becomes active
  useEffect(() => {
    if (activeIncident && !alarmAcknowledged) {
      startAlarm();
    }
    return () => {
      stopAlarm();
    };
  }, [activeIncident?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset alarm acknowledgement when active incident changes
  useEffect(() => {
    setAlarmAcknowledged(false);
  }, [activeIncident?.id]);

  // Acknowledge alarm on first interaction
  const handleAnyInteraction = useCallback(() => {
    if (!alarmAcknowledged) {
      acknowledgeAlarm();
      setAlarmAcknowledged(true);
    }
  }, [alarmAcknowledged]);

  const handleMuteToggle = useCallback(() => {
    const newMuted = toggleMute();
    setIsMuted(newMuted);
  }, []);

  const handleConfirm = useCallback(() => {
    handleAnyInteraction();
    if (activeIncident) {
      const err = applyAction(activeIncident.id, { type: 'CONFIRM' });
      if (!err) {
        setShowDispatchSheet(true);
      }
    }
  }, [activeIncident, applyAction, handleAnyInteraction]);

  const handleDismissClick = useCallback(() => {
    handleAnyInteraction();
    setShowDismissDialog(true);
  }, [handleAnyInteraction]);

  const handleDismissConfirm = useCallback((reason: string) => {
    if (activeIncident) {
      applyAction(activeIncident.id, { type: 'DISMISS', reason });
    }
    setShowDismissDialog(false);
  }, [activeIncident, applyAction]);

  const handleRequestReview = useCallback(() => {
    handleAnyInteraction();
    if (activeIncident) {
      applyAction(activeIncident.id, { type: 'REQUEST_REVIEW' });
    }
  }, [activeIncident, applyAction, handleAnyInteraction]);

  const handleDispatchSend = useCallback((note: string) => {
    if (activeIncident) {
      applyAction(activeIncident.id, { type: 'SEND_DISPATCH' });
      if (note) {
        // Note is logged but not stored separately in this prototype
        console.log(`[SOTORKO] Dispatch note for ${activeIncident.id}: ${note}`);
      }
    }
    setShowDispatchSheet(false);
  }, [activeIncident, applyAction]);

  const handleCloseConfirm = useCallback((outcome: 'Resolved' | 'Handed over' | 'No further action') => {
    if (activeIncident) {
      applyAction(activeIncident.id, { type: 'CLOSE', outcome });
    }
    setShowCloseDialog(false);
  }, [activeIncident, applyAction]);

  // ─── Empty state ─────────────────────────────────────────────────
  if (!activeIncident) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center relative"
          style={{
            background: 'radial-gradient(circle, rgba(28,42,82,0.5) 0%, rgba(7,14,36,0.3) 70%)',
            border: '1px solid rgba(28,42,82,0.8)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)',
            animation: 'float 4s ease-in-out infinite',
          }}
        >
          <span className="text-3xl" style={{ filter: 'opacity(0.4)' }}>👁</span>
        </div>
        <div className="text-center">
          <span className="block text-sm font-semibold" style={{ color: 'rgba(143,163,199,0.7)', fontFamily: 'var(--font-mono)' }}>No active incident</span>
          <span className="block text-[10px] font-mono mt-1" style={{ color: 'rgba(74,94,128,0.7)' }}>Standing by. Alerts appear when a scripted cue fires.</span>
        </div>

        {queuedIncidents.length > 0 && (
          <div
            className="px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(251,191,36,0.06)',
              border: '1px solid rgba(251,191,36,0.2)',
            }}
          >
            <span className="text-[10px] text-amber font-mono">
              {queuedIncidents.length} alert{queuedIncidents.length > 1 ? 's' : ''} queued
            </span>
          </div>
        )}
      </div>
    );
  }

  // ─── Active state ────────────────────────────────────────────────

  // Find the clip and cue data for this incident
  const clip = data?.clips.get(activeIncident.clipId);
  const cue = activeScenario?.cues.find((c) => c.cueId === activeIncident.cueId);
  const camera = data?.cameras.get(activeIncident.cameraId);
  const location = camera?.label ?? 'Example location, Dhaka';

  // Highest priority in queue
  const highestQueued = queuedIncidents.length > 0
    ? queuedIncidents.reduce((best, inc) =>
        inc.priority === 'HIGH' ? inc : best.priority === 'HIGH' ? best : inc,
      queuedIncidents[0])
    : null;

  const isActionable = activeIncident.status === 'ACTIVE';

  return (
    <div className="flex flex-col h-full gap-1.5 overflow-y-auto" onClick={handleAnyInteraction}>
      {/* 1. Alarm banner */}
      {!alarmAcknowledged && activeIncident.status === 'ACTIVE' && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between flex-shrink-0 relative overflow-hidden"
          style={{
            background: 'rgba(224,69,123,0.08)',
            border: '1px solid rgba(224,69,123,0.35)',
            boxShadow: '0 0 24px rgba(224,69,123,0.1)',
            animation: 'alert-pulse 2s ease-in-out infinite',
          }}
        >
          {/* Glowing left edge */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: 'rgba(224,69,123,0.8)' }} />
          <div className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: '#E0457B', boxShadow: '0 0 8px rgba(224,69,123,0.8)', animation: 'alert-pulse 1s ease-in-out infinite' }}
            />
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#E0457B' }}>
              Audible Alarm Active
            </span>
            <span className="text-white/50 text-xs">·</span>
            <span className="text-white text-xs font-semibold">
              NEW {activeIncident.priority}-PRIORITY INCIDENT
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }}
            className="text-[10px] font-mono transition-all"
            style={{
              color: 'rgba(143,163,199,0.8)',
              border: '1px solid rgba(28,42,82,0.8)',
              background: 'rgba(13,23,48,0.6)',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
            aria-label="Mute alarm"
          >
            {isMuted ? '🔇 Unmute' : '🔇 Mute'}
          </button>
        </div>
      )}

      {/* Status banner for non-ACTIVE states */}
      {activeIncident.status !== 'ACTIVE' && (
        <div
          className="rounded-xl px-3 py-2 flex-shrink-0"
          style={{
            background: 'rgba(34,211,238,0.06)',
            border: '1px solid rgba(34,211,238,0.2)',
          }}
        >
          <span className="text-cyan text-[11px] font-mono">
            {STATUS_ICONS[activeIncident.status] ?? '●'} {STATUS_LABELS[activeIncident.status]}
          </span>
        </div>
      )}

      {/* 2. Enlarged feed */}
      <div className="flex-shrink-0">
        <FeedView
          cameraId={activeIncident.cameraId}
          videoSrc={clip?.file}
          lowRes={lowRes}
          box={cue?.box}
          eventLabel={`possible ${activeIncident.eventType.replace(/_/g, ' ')}`}
        />
      </div>

      {/* 3. Mini map + location */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="w-28 flex-shrink-0">
          <MiniMap cameraId={activeIncident.cameraId} />
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.5">
          <span className="text-[10px] text-muted font-mono">📍 LOCATION (SIMULATED)</span>
          <span className="text-xs text-white">{location}</span>
        </div>
      </div>

      {/* 4. Fields */}
      <div
        className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl p-3 border flex-shrink-0"
        style={{
          background: 'rgba(7,14,36,0.6)',
          border: '1px solid rgba(28,42,82,0.8)',
        }}
      >
        <Field label="Incident ID" value={activeIncident.id} tag="ILLUSTRATIVE" />
        <Field label="Event" value={activeIncident.title} />
        <Field label="Location" value={location} tag="SIMULATED" />
        <Field label="Camera" value={activeIncident.cameraId} />
        <Field label="Timestamp" value={activeIncident.firedAtWall} tag="ILLUSTRATIVE" />
        <Field label="Type" value={activeIncident.eventType.replace(/_/g, ' ')} />
      </div>

      {/* 5. Chips */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <PriorityChip priority={activeIncident.priority} />
        <span className="text-[10px] bg-purple/20 text-purple border border-purple/30 px-2 py-0.5 rounded-full font-mono">
          Detection confidence (scripted) {Math.round(activeIncident.confidence * 100)}%
        </span>
      </div>

      {/* 6. Status line */}
      <div className="text-xs text-amber font-mono px-2 flex-shrink-0">
        {STATUS_ICONS[activeIncident.status] ?? '●'} {STATUS_LABELS[activeIncident.status]}
      </div>

      {/* 7. Recent event clip strip */}
      <div className="flex-shrink-0">
        <ClipStrip
          videoSrc={clip?.file}
          clipWindow={cue?.clipWindow}
          lowRes={lowRes}
        />
      </div>

      {/* 8. Action buttons */}
      {isActionable && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            id="btn-confirm"
            onClick={handleConfirm}
            className="flex-1 font-bold text-xs py-2.5 rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(198,244,50,0.15), rgba(198,244,50,0.08))',
              border: '1px solid rgba(198,244,50,0.4)',
              color: '#C6F432',
              boxShadow: '0 0 12px rgba(198,244,50,0.08)',
            }}
          >
            ✓ Confirm
          </button>
          <button
            id="btn-dismiss"
            onClick={handleDismissClick}
            className="flex-1 font-bold text-xs py-2.5 rounded-xl transition-all"
            style={{
              background: 'rgba(28,42,82,0.3)',
              border: '1px solid rgba(28,42,82,0.8)',
              color: 'rgba(143,163,199,0.8)',
            }}
          >
            ✕ Dismiss
          </button>
          <button
            id="btn-request-review"
            onClick={handleRequestReview}
            className="flex-1 font-bold text-xs py-2.5 rounded-xl transition-all"
            style={{
              background: 'rgba(168,85,247,0.1)',
              border: '1px solid rgba(168,85,247,0.35)',
              color: '#A855F7',
            }}
          >
            ↗ Request review
          </button>
        </div>
      )}

      {/* Dispatch timeline for non-ACTIVE confirmed/dispatched states */}
      {activeIncident.dispatch && (
        <DispatchTimeline incident={activeIncident} />
      )}

      {/* 8b. Close incident button when unit has arrived */}
      {activeIncident.status === 'ARRIVED' && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            id="btn-close-incident"
            onClick={() => setShowCloseDialog(true)}
            className="flex-1 bg-lime/20 border border-lime/50 text-lime font-bold text-xs py-2 rounded hover:bg-lime/30 transition-colors cursor-pointer"
          >
            ✔ Close incident
          </button>
        </div>
      )}

      {/* 9. Queue banner */}
      {queuedIncidents.length > 0 && (
        <div
          className="rounded-xl px-3 py-2 text-center flex-shrink-0"
          style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.2)',
          }}
        >
          <span className="text-[10px] text-amber font-mono">
            {queuedIncidents.length} more alert{queuedIncidents.length > 1 ? 's' : ''} queued.
            {highestQueued && ` Highest: ${highestQueued.priority} (${highestQueued.id})`}
          </span>
        </div>
      )}

      {/* Modals */}
      {showDismissDialog && activeIncident && (
        <DismissDialog
          incidentId={activeIncident.id}
          onDismiss={handleDismissConfirm}
          onCancel={() => setShowDismissDialog(false)}
        />
      )}

      {showDispatchSheet && activeIncident && (
        <DispatchSheet
          incidentId={activeIncident.id}
          eventTitle={activeIncident.title}
          onSend={handleDispatchSend}
          onCancel={() => setShowDispatchSheet(false)}
        />
      )}

      {showCloseDialog && activeIncident && (
        <CloseDialog
          incidentId={activeIncident.id}
          onClose={handleCloseConfirm}
          onCancel={() => setShowCloseDialog(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────

function Field({ label, value, tag }: { label: string; value: string; tag?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[8px] font-mono font-bold uppercase tracking-widest" style={{ color: 'rgba(74,94,128,0.9)' }}>
        {label}
        {tag && <span className="ml-1" style={{ color: 'rgba(251,191,36,0.5)' }}>({tag})</span>}
      </span>
      <span className="text-[11px] text-white font-medium">{value}</span>
    </div>
  );
}

function PriorityChip({ priority }: { priority: string }) {
  const configs: Record<string, { color: string; bg: string; border: string; shadow: string }> = {
    HIGH:   { color: '#E0457B', bg: 'rgba(224,69,123,0.1)',  border: 'rgba(224,69,123,0.35)', shadow: 'rgba(224,69,123,0.15)' },
    MEDIUM: { color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)',  shadow: 'rgba(251,191,36,0.12)' },
    LOW:    { color: '#22D3EE', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.3)',  shadow: 'rgba(34,211,238,0.12)' },
  };
  const cfg = configs[priority] ?? configs.LOW;
  return (
    <span
      className="text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest"
      style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 0 8px ${cfg.shadow}`,
      }}
    >
      Priority: {priority}
    </span>
  );
}

function DispatchTimeline({ incident }: { incident: { dispatch?: { channel: string; unit?: string; steps: Array<{ status: string; atDemoMs: number }> } } }) {
  if (!incident.dispatch) return null;
  const { dispatch } = incident;

  return (
    <div className="bg-navy/50 border border-edge/50 rounded p-2 flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted font-mono uppercase">Dispatch timeline</span>
        <span className="text-[8px] text-amber/60 font-mono">SIMULATED</span>
      </div>
      <div className="space-y-1">
        {dispatch.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan flex-shrink-0" />
            <span className="text-[10px] text-white font-mono">{step.status}</span>
            <span className="text-[8px] text-text-dim font-mono ml-auto">
              {Math.round(step.atDemoMs / 1000)}s
            </span>
          </div>
        ))}
        {dispatch.unit && (
          <div className="text-[9px] text-muted font-mono mt-1">
            Unit: {dispatch.unit} (SIMULATED)
          </div>
        )}
      </div>
    </div>
  );
}
