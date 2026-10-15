/**
 * pages/Summary.tsx — Session summary view `/summary` (design.md section 5.9).
 *
 * Requirements:
 * - Table of alerts: time, camera, event, scripted confidence, ground-truth label,
 *   operator decision, time to decision.
 * - Tag: "Demo metrics, not performance evidence."
 * - Buttons:
 *   - Export audit log (JSON)
 *   - Export evidence package (JSON) for an incident
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Banner, Footer } from '../components/layout';
import { useAppStore } from '../store/store';
import { buildEvidencePackage, downloadJsonFile } from '../domain/evidence';

export function SummaryPage() {
  const incidents = useAppStore((s) => s.incidents);
  const auditLog = useAppStore((s) => s.auditLog);
  const data = useAppStore((s) => s.data);
  const activeScenario = useAppStore((s) => s.activeScenario);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.id ?? '',
  );

  const handleExportAuditLog = () => {
    downloadJsonFile('sotorko-audit-log.json', {
      scenario: activeScenario?.id ?? 'None',
      exportedAt: new Date().toISOString(),
      disclaimer: 'ILLUSTRATIVE — Demo metrics, not performance evidence',
      log: auditLog,
    });
  };

  const handleExportEvidence = () => {
    const inc = incidents.find((i) => i.id === selectedIncidentId) ?? incidents[0];
    if (!inc) return;
    const pkg = buildEvidencePackage(inc, data);
    downloadJsonFile(`sotorko-evidence-${inc.id.toLowerCase()}.json`, pkg);
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col text-white">
      {/* Honesty banner */}
      <Banner />

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Title & Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge/60 pb-4">
          <div>
            <h1 className="text-2xl font-bold font-heading">
              Session Performance & Alert Summary
            </h1>
            <p className="text-xs text-muted font-mono mt-0.5">
              Review operator decisions and ground-truth validation across demo alerts.
            </p>
          </div>

          {/* Non-negotiable performance disclaimer tag */}
          <div className="bg-amber/10 border border-amber/40 rounded px-3 py-1.5 self-start">
            <span className="text-xs font-mono text-amber font-semibold">
              Demo metrics, not performance evidence.
            </span>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-navy/60 border border-edge/50 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <button
              id="btn-export-audit-log"
              onClick={handleExportAuditLog}
              className="bg-cyan/20 border border-cyan/50 text-cyan hover:bg-cyan/30 text-xs font-mono font-semibold px-3 py-2 rounded transition-colors cursor-pointer"
            >
              📥 Export Audit Log (JSON)
            </button>

            {incidents.length > 0 && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedIncidentId}
                  onChange={(e) => setSelectedIncidentId(e.target.value)}
                  className="bg-navy border border-edge rounded px-2 py-1.5 text-xs font-mono text-white outline-none"
                  aria-label="Select incident for evidence export"
                >
                  {incidents.map((inc) => (
                    <option key={inc.id} value={inc.id}>
                      {inc.id}: {inc.title}
                    </option>
                  ))}
                </select>
                <button
                  id="btn-export-evidence-package"
                  onClick={handleExportEvidence}
                  className="bg-lime/20 border border-lime/50 text-lime hover:bg-lime/30 text-xs font-mono font-semibold px-3 py-2 rounded transition-colors cursor-pointer"
                >
                  📥 Export Evidence Package (JSON)
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <Link to="/room" className="text-cyan hover:underline">
              ← Return to Control Room (/room)
            </Link>
            <Link to="/presenter" className="text-muted hover:text-white">
              Presenter Panel (/presenter)
            </Link>
          </div>
        </div>

        {/* Alerts Summary Table */}
        <div className="bg-panel border border-edge rounded-lg overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Session summary table">
              <thead>
                <tr className="bg-navy/80 border-b border-edge text-[10px] font-mono text-text-dim uppercase text-left">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Camera</th>
                  <th className="py-2.5 px-3">Scripted Event</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3">Ground Truth</th>
                  <th className="py-2.5 px-3">Operator Decision</th>
                  <th className="py-2.5 px-3">Time to Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge/30 font-mono">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted text-xs">
                      No alerts recorded during this session. Run a scenario in /room to populate metrics.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => {
                    const camera = data?.cameras.get(inc.cameraId);
                    const decisionLog = inc.log.find(
                      (l) =>
                        l.action === 'CONFIRM' ||
                        l.action === 'DISMISS' ||
                        l.action === 'REQUEST_REVIEW' ||
                        l.action === 'SUPERVISOR_CONFIRM' ||
                        l.action === 'SUPERVISOR_DISMISS' ||
                        l.action === 'CLOSE',
                    );

                    const timeToDecisionSec = decisionLog
                      ? Math.max(0, Math.round((decisionLog.atMs - inc.firedAtDemoMs) / 1000))
                      : null;

                    return (
                      <tr key={inc.id} className="hover:bg-edge/10 transition-colors">
                        <td className="py-2.5 px-3 text-white font-bold">{inc.firedAtWall}</td>
                        <td className="py-2.5 px-3 text-muted">
                          {inc.cameraId}
                          {camera && <span className="block text-[10px] text-text-dim">{camera.label}</span>}
                        </td>
                        <td className="py-2.5 px-3 text-white/90 font-sans font-medium">{inc.title}</td>
                        <td className="py-2.5 px-3 text-purple">{Math.round(inc.confidence * 100)}%</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              inc.truth === 'crime_like'
                                ? 'bg-magenta/20 text-magenta border border-magenta/30'
                                : 'bg-cyan/20 text-cyan border border-cyan/30'
                            }`}
                          >
                            {inc.truth}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-semibold ${
                              inc.status === 'CONFIRMED' || inc.status === 'CLOSED'
                                ? 'text-lime'
                                : inc.status === 'DISMISSED'
                                ? 'text-amber'
                                : 'text-cyan'
                            }`}
                          >
                            {inc.status}
                            {inc.dismissReason && (
                              <span className="block text-[9px] text-text-dim font-normal">
                                Reason: {inc.dismissReason}
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-muted">
                          {timeToDecisionSec !== null ? `${timeToDecisionSec}s` : 'Pending'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
