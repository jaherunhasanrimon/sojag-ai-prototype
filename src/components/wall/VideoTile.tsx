/**
 * VideoTile — A single camera tile in the surveillance wall.
 * Phase 1: static placeholder (grey card with camera ID).
 * Phase 2: will play actual video clips.
 */

interface VideoTileProps {
  cameraId: string;
  tileIndex: number;
  /** Whether this tile has an active alert highlight */
  isAlerted?: boolean;
}

export function VideoTile({ cameraId, tileIndex, isAlerted = false }: VideoTileProps) {
  return (
    <div
      id={`tile-${tileIndex}`}
      className={`
        relative bg-navy rounded overflow-hidden aspect-video
        border-2 transition-colors duration-300
        ${isAlerted
          ? 'border-magenta shadow-[0_0_20px_rgba(224,69,123,0.4)]'
          : 'border-edge/50 hover:border-edge'
        }
      `}
    >
      {/* Feed area (placeholder in Phase 1) */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy via-panel to-navy flex items-center justify-center">
        <div className="text-text-dim text-xs font-mono">NO SIGNAL</div>
      </div>

      {/* Top overlay: camera ID + recording dot */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-1.5">
          {/* Recording dot */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-magenta"
            style={{ animation: 'blink-dot 2s ease-in-out infinite' }}
          />
          <span className="text-[10px] font-mono text-white/90 font-semibold">{cameraId}</span>
        </div>
      </div>

      {/* Alert tag */}
      {isAlerted && (
        <div
          className="absolute top-1 right-1 bg-magenta text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
          style={{ animation: 'alert-pulse 2s ease-in-out infinite' }}
        >
          ALERT
        </div>
      )}

      {/* Bottom overlay: simulated timestamp */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-[9px] font-mono text-white/60">00:00:00</span>
      </div>
    </div>
  );
}
