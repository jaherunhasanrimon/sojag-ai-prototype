/**
 * FeedView — Enlarged live feed for the incident screen (design.md 5.4 item 2).
 * Synced to the wall tile's playback position.
 * Shows a lime box overlay from the cue's box coordinates (scripted, not detection).
 */
import { useEffect, useRef, useCallback } from 'react';
import { useDemoClock } from '../../services/clock';
import type { CueBox } from '../../domain/types';

interface FeedViewProps {
  cameraId: string;
  videoSrc?: string;
  lowRes?: boolean;
  /** Box coordinates (percentage-based) from the cue file */
  box?: CueBox[];
  /** Event label for the overlay */
  eventLabel?: string;
}

export function FeedView({ cameraId, videoSrc, lowRes = false, box, eventLabel }: FeedViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isPlaying = useDemoClock((s) => s.isPlaying);
  const speed = useDemoClock((s) => s.speed);

  const resolvedSrc = videoSrc
    ? lowRes
      ? videoSrc.replace(/\.mp4$/, '_480.mp4')
      : videoSrc
    : undefined;

  // Sync play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return;
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying, resolvedSrc]);

  // Sync playback rate
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
  }, [speed]);

  const handleError = useCallback(() => {
    // Feed offline — graceful degradation
  }, []);

  // Use the first box if available
  const overlayBox = box?.[0];

  return (
    <div className="relative bg-navy rounded aspect-video border border-edge overflow-hidden">
      {resolvedSrc ? (
        <video
          ref={videoRef}
          src={resolvedSrc}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          preload="auto"
          onError={handleError}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-navy via-panel to-navy flex items-center justify-center">
          <span className="text-text-dim text-sm font-mono">LIVE FEED — {cameraId}</span>
        </div>
      )}

      {/* Lime detection box overlay (scripted, not real detection) */}
      {overlayBox && (
        <div
          className="absolute border-2 border-lime rounded pointer-events-none"
          style={{
            left: `${overlayBox.x}%`,
            top: `${overlayBox.y}%`,
            width: `${overlayBox.w}%`,
            height: `${overlayBox.h}%`,
          }}
        >
          <span className="absolute -top-5 left-0 text-[9px] font-mono text-lime bg-black/70 px-1 rounded whitespace-nowrap">
            {eventLabel ?? 'possible event'}
          </span>
        </div>
      )}

      {/* Camera ID overlay */}
      <div className="absolute top-0 left-0 right-0 flex items-center px-2 py-1 bg-gradient-to-b from-black/60 to-transparent">
        <span className="w-1.5 h-1.5 rounded-full bg-magenta mr-1.5" style={{ animation: 'blink-dot 2s ease-in-out infinite' }} />
        <span className="text-[10px] font-mono text-white/90 font-semibold">{cameraId}</span>
        <span className="ml-auto text-[8px] font-mono text-lime uppercase">LIVE</span>
      </div>
    </div>
  );
}
