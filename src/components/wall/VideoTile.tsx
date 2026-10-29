/**
 * VideoTile — A single camera tile in the surveillance wall.
 * Plays muted, looping video clips with camera ID overlay.
 * Shows "FEED OFFLINE" gracefully if video fails to load (design.md section 10).
 * Respects demo clock play/pause/speed and prefers-reduced-motion.
 *
 * Enhanced with CRT scanline overlay, glowing alert ring, and premium status chips.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useDemoClock } from '../../services/clock';

interface VideoTileProps {
  cameraId: string;
  tileIndex: number;
  /** Path to the video file (e.g. "videos/clip.mp4") */
  videoSrc?: string;
  /** Whether this tile has an active alert highlight */
  isAlerted?: boolean;
  /** Whether to use low-res copies */
  lowRes?: boolean;
  /** Callback reporting currentTime for cue scheduling (Phase 3) */
  onTimeUpdate?: (tileIndex: number, currentTime: number) => void;
}

type FeedStatus = 'loading' | 'playing' | 'offline';

/** Reconnect interval for offline feeds (ms) */
const RECONNECT_INTERVAL = 10_000;

export function VideoTile({
  cameraId,
  tileIndex,
  videoSrc,
  isAlerted = false,
  lowRes = false,
  onTimeUpdate,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>(videoSrc ? 'loading' : 'offline');
  const [currentTime, setCurrentTime] = useState(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPlaying = useDemoClock((s) => s.isPlaying);
  const speed = useDemoClock((s) => s.speed);

  // Compute the actual video src (handle lowres)
  const resolvedSrc = videoSrc
    ? lowRes
      ? videoSrc.replace(/\.mp4$/, '_480.mp4')
      : videoSrc
    : undefined;

  // Handle video load success
  const handleCanPlay = useCallback(() => {
    setFeedStatus('playing');
  }, []);

  // Handle video error → FEED OFFLINE
  const handleError = useCallback(() => {
    setFeedStatus('offline');
    // Schedule reconnect attempts
    if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
    reconnectTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && resolvedSrc) {
        video.src = resolvedSrc;
        video.load();
      }
    }, RECONNECT_INTERVAL);
  }, [resolvedSrc]);

  // Handle time updates for cue scheduling
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(tileIndex, video.currentTime);
    }
  }, [tileIndex, onTimeUpdate]);

  // Sync play/pause with demo clock
  useEffect(() => {
    const video = videoRef.current;
    if (!video || feedStatus !== 'playing') return;

    if (isPlaying) {
      video.play().catch(() => {
        // Autoplay blocked — will retry on user interaction
      });
    } else {
      video.pause();
    }
  }, [isPlaying, feedStatus]);

  // Sync playback rate with demo clock speed
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
  }, [speed]);

  // Fallback timer mode when feed is offline (architecture.md section 6)
  useEffect(() => {
    if (feedStatus !== 'offline' || !isPlaying) return;

    const tick = () => {
      const nowSec = useDemoClock.getState().getNowMs() / 1000;
      setCurrentTime(nowSec);
      onTimeUpdate?.(tileIndex, nowSec);
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [feedStatus, isPlaying, tileIndex, onTimeUpdate]);

  // Cleanup reconnect timer
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearInterval(reconnectTimerRef.current);
    };
  }, []);

  return (
    <div
      id={`tile-${tileIndex}`}
      className="relative overflow-hidden"
      style={{
        aspectRatio: '16/9',
        borderRadius: '8px',
        border: isAlerted
          ? '1.5px solid rgba(224,69,123,0.7)'
          : '1px solid rgba(28,42,82,0.8)',
        background: '#040B1C',
        boxShadow: isAlerted
          ? '0 0 0 1px rgba(224,69,123,0.15), 0 0 20px rgba(224,69,123,0.25), inset 0 0 30px rgba(224,69,123,0.04)'
          : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
      }}
    >
      {/* Video element (hidden when offline) */}
      {resolvedSrc && feedStatus !== 'offline' && (
        <video
          ref={videoRef}
          src={resolvedSrc}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={handleCanPlay}
          onError={handleError}
          onTimeUpdate={handleTimeUpdate}
        />
      )}

      {/* CRT scanline overlay — subtle realism */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
          zIndex: 2,
        }}
      />

      {/* Loading state */}
      {feedStatus === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #040B1C, #0D1730)' }}>
          <div className="flex flex-col items-center gap-1.5">
            {/* Custom spinner ring */}
            <div
              className="w-5 h-5 rounded-full"
              style={{
                border: '1.5px solid rgba(28,42,82,0.8)',
                borderTopColor: '#22D3EE',
                animation: 'rotate-ring 0.8s linear infinite',
              }}
            />
            <span className="text-[8px] font-mono" style={{ color: 'rgba(34,211,238,0.6)', letterSpacing: '0.1em' }}>CONNECTING</span>
          </div>
        </div>
      )}

      {/* FEED OFFLINE state — graceful degradation (design.md section 10) */}
      {feedStatus === 'offline' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #040B1C 0%, #070E24 50%, #040B1C 100%)' }}>
          {/* Grid pattern for offline */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(rgba(28,42,82,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(28,42,82,0.2) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />
          <div className="relative flex flex-col items-center gap-1.5 text-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(28,42,82,0.6)',
                border: '1px solid rgba(28,42,82,0.9)',
              }}
            >
              <span className="text-sm" style={{ filter: 'grayscale(1) opacity(0.5)' }}>📷</span>
            </div>
            <span className="text-[9px] font-mono font-bold" style={{ color: 'rgba(143,163,199,0.6)', letterSpacing: '0.08em' }}>FEED OFFLINE</span>
            <span
              className="text-[7px] font-mono"
              style={{ color: 'rgba(74,94,128,0.7)' }}
            >Reconnecting...</span>
          </div>
        </div>
      )}

      {/* Top overlay: camera ID + recording dot */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-1.5 py-1"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
          zIndex: 3,
        }}
      >
        <div className="flex items-center gap-1">
          {/* Recording dot */}
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{
              background: feedStatus === 'playing' ? '#E0457B' : 'rgba(143,163,199,0.4)',
              boxShadow: feedStatus === 'playing' ? '0 0 4px rgba(224,69,123,0.8)' : 'none',
              animation: feedStatus === 'playing' ? 'blink-dot 2s ease-in-out infinite' : 'none',
            }}
          />
          <span
            className="text-[9px] font-mono font-bold"
            style={{ color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em' }}
          >
            {cameraId}
          </span>
        </div>

        {feedStatus === 'offline' && (
          <span
            className="text-[7px] font-mono font-bold px-1 py-0.5 rounded"
            style={{
              color: 'rgba(251,191,36,0.9)',
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.2)',
              letterSpacing: '0.08em',
            }}
          >
            OFFLINE
          </span>
        )}
      </div>

      {/* Alert badge */}
      {isAlerted && (
        <div
          className="absolute top-5 right-1"
          style={{ zIndex: 4 }}
        >
          <span
            className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider block"
            style={{
              background: 'rgba(224,69,123,0.9)',
              color: '#fff',
              boxShadow: '0 0 8px rgba(224,69,123,0.6)',
              animation: 'alert-pulse 1.5s ease-in-out infinite',
            }}
          >
            ⚡ ALERT
          </span>
        </div>
      )}

      {/* Bottom overlay: timestamp */}
      <div
        className="absolute bottom-0 left-0 right-0 px-1.5 py-1"
        style={{
          background: 'linear-gradient(0deg, rgba(0,0,0,0.65) 0%, transparent 100%)',
          zIndex: 3,
        }}
      >
        <span
          className="text-[8px] font-mono"
          style={{ color: 'rgba(255,255,255,0.4)', fontVariantNumeric: 'tabular-nums' }}
        >
          {formatTimestamp(currentTime)}
        </span>
      </div>
    </div>
  );
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
