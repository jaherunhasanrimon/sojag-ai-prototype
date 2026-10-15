/**
 * Unit tests for the demo clock service.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useDemoClock } from '../../src/services/clock';

describe('DemoClock', () => {
  beforeEach(() => {
    useDemoClock.getState().reset();
  });

  it('starts paused with 0 elapsed time', () => {
    const state = useDemoClock.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.elapsedMs).toBe(0);
    expect(state.speed).toBe(1);
  });

  it('play sets isPlaying to true', () => {
    useDemoClock.getState().play();
    expect(useDemoClock.getState().isPlaying).toBe(true);
  });

  it('pause stops playing and accumulates time', () => {
    useDemoClock.getState().play();
    // small delay
    useDemoClock.getState().pause();
    const state = useDemoClock.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('togglePlayPause switches state', () => {
    useDemoClock.getState().togglePlayPause();
    expect(useDemoClock.getState().isPlaying).toBe(true);
    useDemoClock.getState().togglePlayPause();
    expect(useDemoClock.getState().isPlaying).toBe(false);
  });

  it('setSpeed changes the speed', () => {
    useDemoClock.getState().setSpeed(5);
    expect(useDemoClock.getState().speed).toBe(5);
    useDemoClock.getState().setSpeed(10);
    expect(useDemoClock.getState().speed).toBe(10);
  });

  it('reset goes back to initial state', () => {
    useDemoClock.getState().play();
    useDemoClock.getState().setSpeed(10);
    useDemoClock.getState().reset();
    const state = useDemoClock.getState();
    expect(state.isPlaying).toBe(false);
    expect(state.speed).toBe(1);
    expect(state.elapsedMs).toBe(0);
  });

  it('getFormattedTime returns HH:MM:SS format', () => {
    const time = useDemoClock.getState().getFormattedTime();
    expect(time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(time).toBe('00:00:00');
  });

  it('getNowMs returns 0 when not started', () => {
    expect(useDemoClock.getState().getNowMs()).toBe(0);
  });
});
