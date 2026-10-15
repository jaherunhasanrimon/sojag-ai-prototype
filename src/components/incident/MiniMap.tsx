/**
 * MiniMap — Offline SVG map with camera pin (design.md 5.4).
 * Reads map data from the store and highlights the camera location.
 * All locations are ILLUSTRATIVE (fictional).
 */
import { useAppStore } from '../../store/store';

interface MiniMapProps {
  cameraId?: string;
}

export function MiniMap({ cameraId }: MiniMapProps) {
  const data = useAppStore((s) => s.data);
  const camera = cameraId && data ? data.cameras.get(cameraId) : undefined;
  const mapData = data?.map;

  return (
    <div className="relative w-full bg-navy border border-edge rounded overflow-hidden">
      <svg
        viewBox={mapData?.viewBox ?? '0 0 400 280'}
        className="w-full h-full"
        style={{ minHeight: '80px' }}
        aria-label="Illustrative map"
      >
        {/* Background */}
        <rect width="100%" height="100%" fill="#0B1633" />

        {/* Streets */}
        {mapData?.streets.map((street) => (
          <path
            key={street.id}
            d={street.path}
            stroke="#24345F"
            strokeWidth="3"
            fill="none"
            opacity={0.7}
          />
        ))}

        {/* Landmarks */}
        {mapData?.landmarks.map((lm) => (
          <g key={lm.id}>
            <rect
              x={lm.rect.x}
              y={lm.rect.y}
              width={lm.rect.w}
              height={lm.rect.h}
              fill={lm.fill}
              opacity={0.15}
              rx={2}
            />
            <text
              x={lm.rect.x + lm.rect.w / 2}
              y={lm.rect.y + lm.rect.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#8FA3C7"
              fontSize="7"
              fontFamily="monospace"
            >
              {lm.label}
            </text>
          </g>
        ))}

        {/* Camera pins (all cameras as dim markers) */}
        {data?.cameras &&
          Array.from(data.cameras.values()).map((cam) => (
            <g key={cam.id}>
              <circle
                cx={cam.mapX}
                cy={cam.mapY}
                r={cam.id === cameraId ? 6 : 3}
                fill={cam.id === cameraId ? '#E0457B' : '#24345F'}
                stroke={cam.id === cameraId ? '#E0457B' : 'none'}
                strokeWidth={cam.id === cameraId ? 2 : 0}
                opacity={cam.id === cameraId ? 1 : 0.5}
              />
              {cam.id === cameraId && (
                <>
                  {/* Pulse ring */}
                  <circle
                    cx={cam.mapX}
                    cy={cam.mapY}
                    r={10}
                    fill="none"
                    stroke="#E0457B"
                    strokeWidth={1.5}
                    opacity={0.5}
                  >
                    <animate
                      attributeName="r"
                      values="6;14"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0"
                      dur="1.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Camera label */}
                  <text
                    x={cam.mapX}
                    y={cam.mapY - 10}
                    textAnchor="middle"
                    fill="#E0457B"
                    fontSize="8"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {cam.id}
                  </text>
                </>
              )}
            </g>
          ))}

        {/* ILLUSTRATIVE tag */}
        <text
          x="4"
          y="12"
          fill="#FBBF24"
          fontSize="7"
          fontFamily="monospace"
          opacity={0.5}
        >
          ILLUSTRATIVE MAP
        </text>
      </svg>

      {/* Location label */}
      {camera && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
          <span className="text-[9px] text-muted font-mono">📍 </span>
          <span className="text-[10px] text-white font-mono">{camera.label}</span>
          <span className="text-[8px] text-amber/60 ml-1">(SIMULATED)</span>
        </div>
      )}
    </div>
  );
}
