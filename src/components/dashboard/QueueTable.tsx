/**
 * QueueTable — Display C: incident queue dashboard (design.md 5.5).
 * Phase 5: fully interactive, wired to live incident store.
 *
 * Requirements:
 * - Rows: ID, priority chip, event, location, camera, age, status, operator.
 * - Sorting: Active incident is pinned at top with LOCKED / UNDER REVIEW badge.
 *   Then sorted HIGH to LOW priority, then oldest first.
 * - New row slides in with a brief flash.
 * - Status chips with appropriate colors.
 * - Row click opens IncidentDrawer with timeline and audit log.
 * - Optional swap: "Review this instead" parks active as PAUSED and pulls selected to ACTIVE.
 * - Supervisor escalation view for REVIEW_REQUESTED (Scenario S4).
 * - Footer counters: Active, Queued, Closed, Dismissed.
 * - Lock-rule note visible: "New alerts queue; they never overwrite an incident under review."
 */
import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../../store/store';
import { useDemoClock } from '../../services/clock';
import type { Incident, Priority, IncidentStatus } from '../../domain/types';
import { IncidentDrawer } from './IncidentDrawer';
import { SwapDialog } from './SwapDialog';
import { SupervisorModal } from '../supervisor/SupervisorModal';

const PRIORITY_ORDER: Record<Priority, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH: 'bg-magenta/20 text-magenta border-magenta/30',
  MEDIUM: 'bg-amber/20 text-amber border-amber/30',
  LOW: 'bg-cyan/20 text-cyan border-cyan/30',
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  QUEUED: 'Queued',
  ACTIVE: 'Under review',
  PAUSED: 'Paused',
  REVIEW_REQUESTED: 'Review requested',
  CONFIRMED: 'Confirmed',
  DISPATCHED: 'Dispatched',
  ACKNOWLEDGED: 'Acknowledged',
  ARRIVED: 'Arrived',
  CLOSED: 'Closed',
  DISMISSED: 'Dismissed',
};

const STATUS_STYLES: Record<IncidentStatus, string> = {
  ACTIVE: 'bg-lime/20 text-lime border-lime/30',
  QUEUED: 'bg-amber/20 text-amber border-amber/30',
  PAUSED: 'bg-cyan/20 text-cyan border-cyan/30',
  REVIEW_REQUESTED: 'bg-purple/20 text-purple border-purple/30',
  CONFIRMED: 'bg-purple/20 text-purple border-purple/30',
  DISPATCHED: 'bg-cyan/20 text-cyan border-cyan/30',
  ACKNOWLEDGED: 'bg-cyan/20 text-cyan border-cyan/30',
  ARRIVED: 'bg-lime/20 text-lime border-lime/30',
  CLOSED: 'bg-muted/20 text-muted border-muted/30',
  DISMISSED: 'bg-text-dim/20 text-text-dim border-edge/30',
};

export function QueueTable() {
  const incidents = useAppStore((s) => s.incidents);
  const data = useAppStore((s) => s.data);
  const applyAction = useAppStore((s) => s.applyAction);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [swapTargetId, setSwapTargetId] = useState<string | null>(null);
  const [supervisorIncidentId, setSupervisorIncidentId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);

  // Periodically refresh age timestamps from demo clock
  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(useDemoClock.getState().getNowMs());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const activeIncident = incidents.find((i) => i.status === 'ACTIVE');

  // Sort incidents: Active pinned, then REVIEW_REQUESTED, then HIGH→LOW, then oldest first
  const sortedIncidents = useMemo(() => {
    const list = [...incidents];
    return list.sort((a, b) => {
      // 1. ACTIVE incident pinned at the very top
      if (a.status === 'ACTIVE') return -1;
      if (b.status === 'ACTIVE') return 1;

      // 2. REVIEW_REQUESTED pinned right below active
      if (a.status === 'REVIEW_REQUESTED' && b.status !== 'REVIEW_REQUESTED') return -1;
      if (b.status === 'REVIEW_REQUESTED' && a.status !== 'REVIEW_REQUESTED') return 1;

      // 3. Priority sort (HIGH -> MEDIUM -> LOW)
      const pDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (pDiff !== 0) return pDiff;

      // 4. Age sort (oldest first: lower firedAtDemoMs first)
      return a.firedAtDemoMs - b.firedAtDemoMs;
    });
  }, [incidents]);

  // Selected incident for drawer
  const drawerIncident = incidents.find((i) => i.id === selectedIncidentId);
  const supervisorIncident = incidents.find((i) => i.id === supervisorIncidentId);

  // Counters
  const activeCount = incidents.filter(
    (i) =>
      i.status === 'ACTIVE' ||
      i.status === 'CONFIRMED' ||
      i.status === 'DISPATCHED' ||
      i.status === 'ACKNOWLEDGED' ||
      i.status === 'ARRIVED',
  ).length;
  const queuedCount = incidents.filter((i) => i.status === 'QUEUED' || i.status === 'PAUSED').length;
  const closedCount = incidents.filter((i) => i.status === 'CLOSED').length;
  const dismissedCount = incidents.filter((i) => i.status === 'DISMISSED').length;

  const handleRowClick = (incident: Incident) => {
    if (incident.status === 'REVIEW_REQUESTED') {
      setSupervisorIncidentId(incident.id);
    } else {
      setSelectedIncidentId(incident.id);
    }
  };

  const handleSwapConfirm = () => {
    if (activeIncident && swapTargetId) {
      // Park current active incident
      applyAction(activeIncident.id, { type: 'SWAP_OUT' });
      // Pull target incident to active
      applyAction(swapTargetId, { type: 'PULL' });
    }
    setSwapTargetId(null);
    setSelectedIncidentId(null);
  };

  const handleSupervisorApprove = () => {
    if (supervisorIncident) {
      applyAction(supervisorIncident.id, { type: 'SUPERVISOR_CONFIRM' });
    }
    setSupervisorIncidentId(null);
  };

  const handleSupervisorDismiss = (reason: string) => {
    if (supervisorIncident) {
      applyAction(supervisorIncident.id, { type: 'SUPERVISOR_DISMISS', reason });
    }
    setSupervisorIncidentId(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Lock rule note (design.md 5.5) */}
      <div className="bg-navy/80 border border-edge/50 rounded px-2 py-1.5 mb-2 flex items-center justify-between">
        <span className="text-[9px] text-muted font-mono">
          🔒 New alerts queue; they never overwrite an incident under review.
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[10px]" aria-label="Incident queue table">
          <thead>
            <tr className="text-text-dim font-mono uppercase text-[8px] border-b border-edge">
              <th className="text-left py-1 px-1">ID</th>
              <th className="text-left py-1 px-1">PRI</th>
              <th className="text-left py-1 px-1">Event</th>
              <th className="text-left py-1 px-1">Cam</th>
              <th className="text-left py-1 px-1">Age</th>
              <th className="text-left py-1 px-1">Status</th>
              <th className="text-left py-1 px-1">Op</th>
            </tr>
          </thead>
          <tbody>
            {sortedIncidents.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted font-mono text-[11px]">
                  No incidents in queue. Standing by.
                </td>
              </tr>
            ) : (
              sortedIncidents.map((row) => {
                const isActive = row.status === 'ACTIVE';
                const isReviewRequested = row.status === 'REVIEW_REQUESTED';
                const ageSec = Math.max(0, Math.floor((nowMs - row.firedAtDemoMs) / 1000));
                const ageFormatted = `${Math.floor(ageSec / 60)}:${String(ageSec % 60).padStart(2, '0')}`;
                const cam = data?.cameras.get(row.cameraId);

                return (
                  <tr
                    key={row.id}
                    id={`queue-row-${row.id.toLowerCase()}`}
                    onClick={() => handleRowClick(row)}
                    className={`
                      border-b border-edge/30 hover:bg-edge/20 transition-colors cursor-pointer
                      ${isActive ? 'bg-lime/10' : isReviewRequested ? 'bg-purple/10' : ''}
                    `}
                  >
                    <td className="py-1 px-1 font-mono text-white whitespace-nowrap">
                      {row.id}
                      {isActive && (
                        <span className="ml-1 text-[7px] bg-lime/20 text-lime border border-lime/30 px-1 py-0.5 rounded uppercase font-bold">
                          LOCKED
                        </span>
                      )}
                      {isReviewRequested && (
                        <span className="ml-1 text-[7px] bg-purple/20 text-purple border border-purple/30 px-1 py-0.5 rounded uppercase font-bold">
                          REVIEW
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-1">
                      <span className={`text-[8px] border px-1 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[row.priority]}`}>
                        {row.priority}
                      </span>
                    </td>
                    <td className="py-1 px-1 text-white/90 truncate max-w-[100px]" title={row.title}>
                      {row.title}
                    </td>
                    <td className="py-1 px-1 font-mono text-muted" title={cam?.label ?? row.cameraId}>
                      {row.cameraId}
                    </td>
                    <td className="py-1 px-1 font-mono text-muted">{ageFormatted}</td>
                    <td className="py-1 px-1 whitespace-nowrap">
                      <span className={`text-[8px] border px-1 py-0.5 rounded font-medium ${STATUS_STYLES[row.status]}`}>
                        {STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="py-1 px-1 font-mono text-muted text-[9px]">
                      {row.operator ?? '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer counters */}
      <div className="flex items-center gap-4 border-t border-edge pt-2 mt-2">
        <Counter label="Active" value={activeCount} color="text-lime" />
        <Counter label="Queued" value={queuedCount} color="text-amber" />
        <Counter label="Closed" value={closedCount} color="text-muted" />
        <Counter label="Dismissed" value={dismissedCount} color="text-text-dim" />
      </div>

      {/* ILLUSTRATIVE tag */}
      <div className="text-center mt-1">
        <span className="text-[8px] font-mono text-text-dim uppercase">
          All IDs, times, and statuses are ILLUSTRATIVE
        </span>
      </div>

      {/* Drawer */}
      {drawerIncident && (
        <IncidentDrawer
          incident={drawerIncident}
          locationLabel={data?.cameras.get(drawerIncident.cameraId)?.label}
          hasActiveIncident={!!activeIncident && activeIncident.id !== drawerIncident.id}
          onSwapIn={(id) => setSwapTargetId(id)}
          onClose={() => setSelectedIncidentId(null)}
        />
      )}

      {/* Swap Confirmation Modal */}
      {swapTargetId && activeIncident && (
        <SwapDialog
          currentActiveId={activeIncident.id}
          targetIncidentId={swapTargetId}
          onConfirm={handleSwapConfirm}
          onCancel={() => setSwapTargetId(null)}
        />
      )}

      {/* Supervisor Modal for Escalation */}
      {supervisorIncident && (
        <SupervisorModal
          incident={supervisorIncident}
          locationLabel={data?.cameras.get(supervisorIncident.cameraId)?.label}
          onApprove={handleSupervisorApprove}
          onDismiss={handleSupervisorDismiss}
          onClose={() => setSupervisorIncidentId(null)}
        />
      )}
    </div>
  );
}

function Counter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <span className="text-[9px] text-text-dim font-mono uppercase">{label}</span>
    </div>
  );
}
