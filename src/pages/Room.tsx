/**
 * RoomPage — Combined control room view `/room` (primary demo view).
 * design.md section 5.2: Three panels at 1920x1080.
 *   A (wall, ~38%) | B (incident, ~37%) | C (queue, ~25%)
 * Banner at top, Footer at bottom.
 */
import { Banner, Footer, PanelShell } from '../components/layout';
import { VideoWall } from '../components/wall';
import { IncidentScreen } from '../components/incident';
import { QueueTable } from '../components/dashboard';

export function RoomPage() {
  return (
    <div className="h-screen flex flex-col bg-navy overflow-hidden">
      {/* Honesty banner — always visible */}
      <Banner />

      {/* Three-panel control room */}
      <div className="flex-1 flex gap-1.5 p-1.5 min-h-0">
        {/* Panel A: Surveillance Wall (~38%) */}
        <PanelShell
          id="panel-wall"
          title="Surveillance Wall"
          label="Display A"
          className="basis-[38%] flex-shrink-0"
        >
          <VideoWall alertedTileIndex={4} />
        </PanelShell>

        {/* Panel B: Incident Screen (~37%) */}
        <PanelShell
          id="panel-incident"
          title="Incident Screen"
          label="Display B"
          className="basis-[37%] flex-shrink-0"
        >
          <IncidentScreen />
        </PanelShell>

        {/* Panel C: Queue Dashboard (~25%) */}
        <PanelShell
          id="panel-queue"
          title="Incident Queue"
          label="Display C"
          className="basis-[25%] flex-shrink-0"
        >
          <QueueTable />
        </PanelShell>
      </div>

      {/* ILLUSTRATIVE / SIMULATED footer — always visible */}
      <Footer />
    </div>
  );
}
