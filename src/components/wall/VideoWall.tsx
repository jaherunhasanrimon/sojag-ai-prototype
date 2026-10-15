/**
 * VideoWall — 3x3 grid of camera tiles (Display A).
 * Reads tile assignments from the active scenario and maps clips to tiles.
 * Falls back to static grey tiles if no scenario is loaded.
 */
import { VideoTile } from './VideoTile';
import { useAppStore } from '../../store/store';
import { useCallback } from 'react';

/** Default cameras when no scenario is loaded */
const DEFAULT_CAMERAS = [
  'CAM-01', 'CAM-02', 'CAM-03',
  'CAM-04', 'CAM-05', 'CAM-06',
  'CAM-07', 'CAM-08', 'CAM-09',
];

interface VideoWallProps {
  /** Index of the tile that currently has an alert */
  alertedTileIndex?: number;
  /** Callback for time updates from tiles (for cue scheduling, Phase 3) */
  onTileTimeUpdate?: (tileIndex: number, currentTime: number) => void;
}

export function VideoWall({ alertedTileIndex, onTileTimeUpdate }: VideoWallProps) {
  const activeScenario = useAppStore((s) => s.activeScenario);
  const data = useAppStore((s) => s.data);
  const lowRes = useAppStore((s) => s.lowRes);

  const handleTimeUpdate = useCallback((tileIndex: number, currentTime: number) => {
    onTileTimeUpdate?.(tileIndex, currentTime);
  }, [onTileTimeUpdate]);

  // Build tile configurations from scenario or defaults
  const tiles = buildTileConfigs(activeScenario, data, DEFAULT_CAMERAS);

  return (
    <div className="grid grid-cols-3 gap-1.5 h-full auto-rows-fr">
      {tiles.map((tile, index) => (
        <VideoTile
          key={tile.cameraId}
          cameraId={tile.cameraId}
          tileIndex={index}
          videoSrc={tile.videoSrc}
          isAlerted={index === alertedTileIndex}
          lowRes={lowRes}
          onTimeUpdate={handleTimeUpdate}
        />
      ))}
    </div>
  );
}

interface TileConfig {
  cameraId: string;
  videoSrc?: string;
}

function buildTileConfigs(
  scenario: ReturnType<typeof useAppStore.getState>['activeScenario'],
  data: ReturnType<typeof useAppStore.getState>['data'],
  defaultCameras: string[],
): TileConfig[] {
  if (!scenario || !data) {
    // No scenario loaded — show static tiles with no video
    return defaultCameras.map((cameraId) => ({ cameraId }));
  }

  // Build from scenario tiles
  const configs: TileConfig[] = [];
  for (let i = 0; i < 9; i++) {
    const scenarioTile = scenario.tiles.find((t) => t.tileIndex === i);
    if (scenarioTile) {
      const clip = data.clips.get(scenarioTile.clipId);
      configs.push({
        cameraId: scenarioTile.cameraId,
        videoSrc: clip?.file,
      });
    } else {
      configs.push({
        cameraId: defaultCameras[i] ?? `CAM-${String(i + 1).padStart(2, '0')}`,
      });
    }
  }
  return configs;
}
