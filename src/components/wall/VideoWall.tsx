/**
 * VideoWall — 3x3 grid of camera tiles (Display A).
 * Reads tile assignments from the active scenario and maps clips to tiles.
 * Connects time ticks to the cue scheduler and highlights alerted tiles.
 */
import { useCallback, useMemo } from 'react';
import { VideoTile } from './VideoTile';
import { useAppStore } from '../../store/store';

/** Default cameras when no scenario is loaded */
const DEFAULT_CAMERAS = [
  'CAM-01', 'CAM-02', 'CAM-03',
  'CAM-04', 'CAM-05', 'CAM-06',
  'CAM-07', 'CAM-08', 'CAM-09',
];

export function VideoWall() {
  const activeScenario = useAppStore((s) => s.activeScenario);
  const incidents = useAppStore((s) => s.incidents);
  const data = useAppStore((s) => s.data);
  const lowRes = useAppStore((s) => s.lowRes);
  const onTileTimeUpdate = useAppStore((s) => s.onTileTimeUpdate);

  const alertedTileIndices = useMemo(() => {
    if (!activeScenario) return new Set<number>();
    const alerted = new Set<number>();
    for (const incident of incidents) {
      if (incident.status === 'CLOSED' || incident.status === 'DISMISSED') continue;
      const tile = activeScenario.tiles.find(
        (t) => t.clipId === incident.clipId && t.cameraId === incident.cameraId,
      );
      if (tile) {
        alerted.add(tile.tileIndex);
      }
    }
    return alerted;
  }, [incidents, activeScenario]);

  const handleTimeUpdate = useCallback((tileIndex: number, currentTime: number) => {
    onTileTimeUpdate(tileIndex, currentTime);
  }, [onTileTimeUpdate]);

  // Build tile configurations from scenario or defaults
  const tiles = useMemo(() => {
    if (!activeScenario || !data) {
      return DEFAULT_CAMERAS.map((cameraId) => ({ cameraId, videoSrc: undefined }));
    }

    const configs: Array<{ cameraId: string; videoSrc?: string }> = [];
    for (let i = 0; i < 9; i++) {
      const scenarioTile = activeScenario.tiles.find((t) => t.tileIndex === i);
      if (scenarioTile) {
        const clip = data.clips.get(scenarioTile.clipId);
        configs.push({
          cameraId: scenarioTile.cameraId,
          videoSrc: clip?.file,
        });
      } else {
        configs.push({
          cameraId: DEFAULT_CAMERAS[i] ?? `CAM-${String(i + 1).padStart(2, '0')}`,
        });
      }
    }
    return configs;
  }, [activeScenario, data]);

  return (
    <div className="grid grid-cols-3 gap-1.5 h-full auto-rows-fr">
      {tiles.map((tile, index) => (
        <VideoTile
          key={tile.cameraId}
          cameraId={tile.cameraId}
          tileIndex={index}
          videoSrc={tile.videoSrc}
          isAlerted={alertedTileIndices.has(index)}
          lowRes={lowRes}
          onTimeUpdate={handleTimeUpdate}
        />
      ))}
    </div>
  );
}
