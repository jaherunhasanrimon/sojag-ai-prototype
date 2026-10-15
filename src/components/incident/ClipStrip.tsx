/**
 * ClipStrip — 10-second event clip replay (design.md 5.4 item 7).
 * Replays the clip window around the cue timestamp.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { useDemoClock } from '../../services/clock';

interface ClipStripProps {
  videoSrc?: string;
  /** Start and end seconds of the 10s window */
  clipWindow?: [number, number];
  lowRes?: boolean;
}

export function ClipStrip({ videoSrc, clipWindow, lowRes = false }: ClipStripProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const speed = useDemoClock((s) => s.speed);

  const resolvedSrc = videoSrc
    ? lowRes
      ? videoSrc.replace(/\.mp4$/, '_480.mp4')
      : videoSrc
    : undefined;

  const windowStart = clipWindow?.[0] ?? 0;
  const windowEnd = clipWindow?.[1] ?? 10;
  const windowDuration = windowEnd - windowStart;

  // Set initial time and loop within the window
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return;

    video.currentTime = windowStart;

    const handleTimeUpdate = () => {
      if (video.currentTime >= windowEnd) {
        video.currentTime = windowStart;
      }
      const elapsed = video.currentTime - windowStart;
      setProgress(Math.min(elapsed / windowDuration, 1));
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [resolvedSrc, windowStart, windowEnd, windowDuration]);

  // Sync speed
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = speed;
  }, [speed]);

  const handlePlay = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = windowStart;
      video.play().catch(() => {});
    }
  }, [windowStart]);

  return (
    <div className="bg-navy rounded border border-edge/50 p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted font-mono uppercase">Recent event clip</span>
        <span className="text-[8px] text-text-dim font-mono">
          {windowStart.toFixed(1)}s — {windowEnd.toFixed(1)}s
        </span>
      </div>

      <div className="relative h-16 bg-navy border border-edge rounded overflow-hidden cursor-pointer" onClick={handlePlay}>
        {resolvedSrc ? (
          <video
            ref={videoRef}
            src={resolvedSrc}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-[9px] text-text-dim font-mono">10s clip replay</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-edge">
          <div
            className="h-full bg-lime transition-all duration-100"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/30">
          <span className="text-white text-xl">▶</span>
        </div>
      </div>
    </div>
  );
}
