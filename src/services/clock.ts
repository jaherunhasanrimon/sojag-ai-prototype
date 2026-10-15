/**
 * services/clock.ts — Demo clock with pause/play and speed multiplier.
 * Controls video playback rate and keeps dispatch timers in step.
 *
 * The clock is a simple elapsed-time tracker, NOT tied to wall time.
 * Speed multiplier affects both video playbackRate and timer durations.
 */
import { create } from 'zustand';

export interface DemoClockState {
  /** Whether the demo is currently playing */
  isPlaying: boolean;
  /** Speed multiplier: 1x, 5x, or 10x */
  speed: 1 | 5 | 10;
  /** Elapsed demo time in milliseconds (accumulated while playing) */
  elapsedMs: number;
  /** Wall time when the clock last started/resumed (null if paused) */
  startedAt: number | null;

  // Actions
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  setSpeed: (speed: 1 | 5 | 10) => void;
  reset: () => void;
  /** Get current demo time in ms (includes time since last resume) */
  getNowMs: () => number;
  /** Get current demo time formatted as HH:MM:SS */
  getFormattedTime: () => string;
}

export const useDemoClock = create<DemoClockState>((set, get) => ({
  isPlaying: false,
  speed: 1,
  elapsedMs: 0,
  startedAt: null,

  play: () => {
    const state = get();
    if (state.isPlaying) return;
    set({ isPlaying: true, startedAt: Date.now() });
  },

  pause: () => {
    const state = get();
    if (!state.isPlaying) return;
    // Accumulate elapsed time
    const elapsed = state.startedAt
      ? state.elapsedMs + (Date.now() - state.startedAt) * state.speed
      : state.elapsedMs;
    set({ isPlaying: false, elapsedMs: elapsed, startedAt: null });
  },

  togglePlayPause: () => {
    const state = get();
    if (state.isPlaying) {
      state.pause();
    } else {
      state.play();
    }
  },

  setSpeed: (speed) => {
    const state = get();
    if (state.isPlaying && state.startedAt) {
      // Accumulate time at current speed before changing
      const elapsed = state.elapsedMs + (Date.now() - state.startedAt) * state.speed;
      set({ speed, elapsedMs: elapsed, startedAt: Date.now() });
    } else {
      set({ speed });
    }
  },

  reset: () => {
    set({ isPlaying: false, speed: 1, elapsedMs: 0, startedAt: null });
  },

  getNowMs: () => {
    const state = get();
    if (!state.isPlaying || !state.startedAt) return state.elapsedMs;
    return state.elapsedMs + (Date.now() - state.startedAt) * state.speed;
  },

  getFormattedTime: () => {
    const ms = get().getNowMs();
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  },
}));
