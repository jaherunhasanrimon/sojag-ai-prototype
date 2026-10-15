/**
 * pages/Incident.tsx — Satellite full-screen Display B view `/incident`.
 * architecture.md section 7: Multi-display sync follower.
 */
import { useEffect } from 'react';
import { Banner, Footer, PanelShell } from '../components/layout';
import { IncidentScreen } from '../components/incident';
import { useAppStore } from '../store/store';
import { initSync } from '../services/sync';

export function IncidentPage() {
  const loadData = useAppStore((s) => s.loadData);
  const loadingState = useAppStore((s) => s.loadingState);

  useEffect(() => {
    if (loadingState === 'idle') loadData();
    const cleanup = initSync('follower');
    return cleanup;
  }, [loadData, loadingState]);

  return (
    <div className="h-screen flex flex-col bg-navy overflow-hidden">
      <Banner />
      <div className="flex-1 p-2 min-h-0">
        <PanelShell
          id="panel-incident-standalone"
          title="Incident Screen"
          label="Display B — Satellite Window"
          className="h-full"
        >
          <IncidentScreen />
        </PanelShell>
      </div>
      <Footer />
    </div>
  );
}
