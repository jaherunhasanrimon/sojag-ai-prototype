/**
 * pages/Wall.tsx — Satellite full-screen Display A view `/wall`.
 * architecture.md section 7: Multi-display sync follower.
 */
import { useEffect } from 'react';
import { Banner, Footer, PanelShell } from '../components/layout';
import { VideoWall } from '../components/wall';
import { useAppStore } from '../store/store';
import { initSync } from '../services/sync';

export function WallPage() {
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
          id="panel-wall-standalone"
          title="Surveillance Wall"
          label="Display A — Satellite Window"
          className="h-full"
        >
          <VideoWall />
        </PanelShell>
      </div>
      <Footer />
    </div>
  );
}
