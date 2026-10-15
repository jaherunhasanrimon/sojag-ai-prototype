/**
 * VideoWall — 3x3 grid of camera tiles (Display A).
 * Phase 1: renders static grey tiles. Phase 2: wired to real clips.
 */
import { VideoTile } from './VideoTile';

/** Static camera list for Phase 1 */
const CAMERAS = [
  'CAM-01', 'CAM-02', 'CAM-03',
  'CAM-04', 'CAM-05', 'CAM-06',
  'CAM-07', 'CAM-08', 'CAM-09',
];

interface VideoWallProps {
  /** Index of the tile that currently has an alert (for demo) */
  alertedTileIndex?: number;
}

export function VideoWall({ alertedTileIndex }: VideoWallProps) {
  return (
    <div className="grid grid-cols-3 gap-1.5 h-full auto-rows-fr">
      {CAMERAS.map((cameraId, index) => (
        <VideoTile
          key={cameraId}
          cameraId={cameraId}
          tileIndex={index}
          isAlerted={index === alertedTileIndex}
        />
      ))}
    </div>
  );
}
