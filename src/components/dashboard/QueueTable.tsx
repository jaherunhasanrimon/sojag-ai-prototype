/**
 * QueueTable — Display C: incident queue dashboard.
 * Phase 1: static hard-coded rows. Phase 5: wired to live incident store.
 *
 * Shows rows sorted HIGH→LOW then oldest first.
 * Active incident pinned at top with LOCKED/UNDER REVIEW badge.
 */

type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
type Status = 'Under review' | 'Queued' | 'Confirmed' | 'Dispatched' | 'Dismissed';

interface QueueRow {
  id: string;
  priority: Priority;
  event: string;
  location: string;
  camera: string;
  age: string;
  status: Status;
  operator: string;
  isActive?: boolean;
  isNew?: boolean;
}

/** Hard-coded example rows for Phase 1 */
const EXAMPLE_ROWS: QueueRow[] = [
  {
    id: 'STK-001',
    priority: 'HIGH',
    event: 'Possible physical altercation',
    location: 'Example intersection A',
    camera: 'CAM-05',
    age: '0:42',
    status: 'Under review',
    operator: 'Op. A',
    isActive: true,
  },
  {
    id: 'STK-006',
    priority: 'HIGH',
    event: 'Possible snatching-like grab',
    location: 'Example market B',
    camera: 'CAM-02',
    age: '0:08',
    status: 'Queued',
    operator: '—',
    isNew: true,
  },
  {
    id: 'STK-005',
    priority: 'MEDIUM',
    event: 'Possible restricted zone entry',
    location: 'Example park C',
    camera: 'CAM-03',
    age: '1:15',
    status: 'Confirmed',
    operator: 'Op. A',
  },
  {
    id: 'STK-004',
    priority: 'LOW',
    event: 'Possible altercation',
    location: 'Example bus stop D',
    camera: 'CAM-04',
    age: '3:20',
    status: 'Dispatched',
    operator: 'Op. A',
  },
  {
    id: 'STK-003',
    priority: 'LOW',
    event: 'Possible crowd disturbance',
    location: 'Example lane E',
    camera: 'CAM-08',
    age: '5:44',
    status: 'Dismissed',
    operator: 'Op. A',
  },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  HIGH: 'bg-magenta/20 text-magenta border-magenta/30',
  MEDIUM: 'bg-amber/20 text-amber border-amber/30',
  LOW: 'bg-cyan/20 text-cyan border-cyan/30',
};

const STATUS_STYLES: Record<Status, string> = {
  'Under review': 'bg-lime/20 text-lime border-lime/30',
  'Queued': 'bg-amber/20 text-amber border-amber/30',
  'Confirmed': 'bg-purple/20 text-purple border-purple/30',
  'Dispatched': 'bg-cyan/20 text-cyan border-cyan/30',
  'Dismissed': 'bg-muted/20 text-muted border-muted/30',
};

export function QueueTable() {
  return (
    <div className="flex flex-col h-full">
      {/* Lock rule note */}
      <div className="bg-navy/80 border border-edge/50 rounded px-2 py-1.5 mb-2">
        <span className="text-[9px] text-muted font-mono">
          🔒 New alerts queue; they never overwrite an incident under review.
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-text-dim font-mono uppercase text-[8px] border-b border-edge">
              <th className="text-left py-1 px-1">ID</th>
              <th className="text-left py-1 px-1">PRI</th>
              <th className="text-left py-1 px-1">Event</th>
              <th className="text-left py-1 px-1">Cam</th>
              <th className="text-left py-1 px-1">Age</th>
              <th className="text-left py-1 px-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {EXAMPLE_ROWS.map((row) => (
              <tr
                key={row.id}
                className={`
                  border-b border-edge/30 hover:bg-edge/20 transition-colors cursor-pointer
                  ${row.isActive ? 'bg-lime/5' : ''}
                  ${row.isNew ? 'animate-[slide-in_0.3s_ease-out]' : ''}
                `}
                style={row.isNew ? { animation: 'flash-new 2s ease-out' } : undefined}
              >
                <td className="py-1 px-1 font-mono text-white">
                  {row.id}
                  {row.isActive && (
                    <span className="ml-1 text-[7px] bg-lime/20 text-lime border border-lime/30 px-1 py-0.5 rounded uppercase font-bold">
                      LOCKED
                    </span>
                  )}
                </td>
                <td className="py-1 px-1">
                  <span className={`text-[8px] border px-1 py-0.5 rounded-full font-semibold ${PRIORITY_STYLES[row.priority]}`}>
                    {row.priority}
                  </span>
                </td>
                <td className="py-1 px-1 text-white/90 truncate max-w-[100px]">{row.event}</td>
                <td className="py-1 px-1 font-mono text-muted">{row.camera}</td>
                <td className="py-1 px-1 font-mono text-muted">{row.age}</td>
                <td className="py-1 px-1">
                  <span className={`text-[8px] border px-1 py-0.5 rounded font-medium ${STATUS_STYLES[row.status]}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer counters */}
      <div className="flex items-center gap-4 border-t border-edge pt-2 mt-2">
        <Counter label="Active" value={1} color="text-lime" />
        <Counter label="Queued" value={1} color="text-amber" />
        <Counter label="Closed" value={0} color="text-muted" />
        <Counter label="Dismissed" value={1} color="text-text-dim" />
      </div>

      {/* ILLUSTRATIVE tag */}
      <div className="text-center mt-1">
        <span className="text-[8px] font-mono text-text-dim uppercase">All IDs, times, and statuses are ILLUSTRATIVE</span>
      </div>
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
