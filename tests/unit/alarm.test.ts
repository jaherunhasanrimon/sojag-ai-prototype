/**
 * Unit tests for alarm.ts
 * Tests WebAudio alarm patterns, repeating beep, mute toggle, acknowledge.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startAlarm,
  stopAlarm,
  acknowledgeAlarm,
  toggleMute,
  getIsMuted,
  setMuted,
  isAlarmPlaying,
  playNotificationTone,
  unlockAudio,
} from '../../src/services/alarm';

describe('alarm service', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setMuted(false);
    stopAlarm();

    // Mock AudioContext
    class MockAudioContext {
      currentTime = 0;
      state = 'suspended';
      createOscillator() {
        return {
          type: 'sine',
          frequency: { value: 0 },
          connect: vi.fn().mockReturnThis(),
          start: vi.fn(),
          stop: vi.fn(),
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn().mockReturnThis(),
        };
      }
      resume() {
        this.state = 'running';
        return Promise.resolve();
      }
      get destination() {
        return {};
      }
    }

    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  afterEach(() => {
    stopAlarm();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts alarm and marks playing', () => {
    expect(isAlarmPlaying()).toBe(false);
    startAlarm();
    expect(isAlarmPlaying()).toBe(true);
  });

  it('stops alarm when stopAlarm is called', () => {
    startAlarm();
    expect(isAlarmPlaying()).toBe(true);
    stopAlarm();
    expect(isAlarmPlaying()).toBe(false);
  });

  it('acknowledges alarm by stopping it', () => {
    startAlarm();
    expect(isAlarmPlaying()).toBe(true);
    acknowledgeAlarm();
    expect(isAlarmPlaying()).toBe(false);
  });

  it('toggles mute on and off', () => {
    expect(getIsMuted()).toBe(false);
    const muted = toggleMute();
    expect(muted).toBe(true);
    expect(getIsMuted()).toBe(true);

    const unmuted = toggleMute();
    expect(unmuted).toBe(false);
    expect(getIsMuted()).toBe(false);
  });

  it('muting automatically stops an active alarm', () => {
    startAlarm();
    expect(isAlarmPlaying()).toBe(true);
    toggleMute();
    expect(isAlarmPlaying()).toBe(false);
    expect(getIsMuted()).toBe(true);
  });

  it('unlockAudio creates or resumes AudioContext', () => {
    expect(() => unlockAudio()).not.toThrow();
  });

  it('playNotificationTone does not throw', () => {
    unlockAudio();
    expect(() => playNotificationTone()).not.toThrow();
  });
});
