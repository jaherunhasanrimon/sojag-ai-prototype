/**
 * VideoTile — A single camera tile in the surveillance wall.
 * Plays muted, looping video clips with camera ID overlay.
 * Shows "FEED OFFLINE" gracefully if video fails to load (design.md section 10).
 * Respects demo clock play/pause/speed and prefers-reduced-motion.
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
      className={`
        relative bg-navy rounded overflow-hidden aspect-video
        border-2 transition-colors duration-300
        ${isAlerted
          ? 'border-magenta shadow-[0_0_20px_rgba(224,69,123,0.4)]'
          : 'border-edge/50 hover:border-edge'
        }
      `}
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

      {/* Loading state */}
      {feedStatus === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-panel to-navy flex items-center justify-center">
          <div className="flex flex-col items-center gap-1">
            <div className="w-4 h-4 border-2 border-edge border-t-cyan rounded-full animate-spin" />
            <span className="text-text-dim text-[9px] font-mono">CONNECTING...</span>
          </div>
        </div>
      )}

      {/* FEED OFFLINE state — graceful degradation (design.md section 10) */}
      {feedStatus === 'offline' && (
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-panel to-navy flex items-center justify-center">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className="w-8 h-8 rounded-full bg-edge/50 flex items-center justify-center">
              <span className="text-muted text-sm">📷</span>
            </div>
            <span className="text-muted text-[10px] font-mono font-semibold">FEED OFFLINE</span>
            <span className="text-text-dim text-[8px] font-mono">Reconnecting...</span>
          </div>
        </div>
      )}

      {/* Top overlay: camera ID + recording dot */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-1 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-1.5">
          {/* Recording dot — only blinks when playing */}
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              feedStatus === 'playing' ? 'bg-magenta' : 'bg-muted'
            }`}
            style={feedStatus === 'playing' ? { animation: 'blink-dot 2s ease-in-out infinite' } : undefined}
          />
          <span className="text-[10px] font-mono text-white/90 font-semibold">{cameraId}</span>
        </div>
        {feedStatus === 'offline' && (
          <span className="text-[8px] font-mono text-amber uppercase">OFFLINE</span>
        )}
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

      {/* Bottom overlay: timestamp */}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-black/60 to-transparent">
        <span className="text-[9px] font-mono text-white/60">
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
