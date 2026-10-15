/**
 * alarm.ts — WebAudio alarm patterns for the control room.
 * Plays an alert tone that repeats every 3s until acknowledged.
 * Start page click unlocks AudioContext.
 *
 * IMPORTANT: This is a scripted notification tone, not a real alarm system.
 */

let audioCtx: AudioContext | null = null;
let alarmInterval: ReturnType<typeof setInterval> | null = null;
let isMuted = false;
let isAlarmActive = false;

/**
 * Unlock AudioContext (must be called from a user gesture like button click).
 */
export function unlockAudio(): void {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/**
 * Play a single alarm beep (two short tones).
 */
function playBeep(): void {
  if (!audioCtx || isMuted) return;

  const now = audioCtx.currentTime;

  // First tone — urgent high pitch
  const osc1 = audioCtx.createOscillator();
  const gain1 = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 880; // A5
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc1.connect(gain1).connect(audioCtx.destination);
  osc1.start(now);
  osc1.stop(now + 0.15);

  // Second tone — slightly lower
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 740; // F#5
  gain2.gain.setValueAtTime(0.15, now + 0.2);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc2.connect(gain2).connect(audioCtx.destination);
  osc2.start(now + 0.2);
  osc2.stop(now + 0.35);
}

/**
 * Play a short notification tone (for queued alerts, not the full alarm).
 */
export function playNotificationTone(): void {
  if (!audioCtx || isMuted) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 600;
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

/**
 * Start the repeating alarm (plays every 3 seconds).
 */
export function startAlarm(): void {
  if (isAlarmActive) return;
  isAlarmActive = true;
  playBeep();
  alarmInterval = setInterval(playBeep, 3000);
}

/**
 * Stop the alarm (on first interaction or mute).
 */
export function stopAlarm(): void {
  isAlarmActive = false;
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

/**
 * Acknowledge the alarm (stops it on first interaction).
 */
export function acknowledgeAlarm(): void {
  stopAlarm();
}

/**
 * Toggle mute state.
 */
export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (isMuted) stopAlarm();
  return isMuted;
}

/**
 * Get current mute state.
 */
export function getIsMuted(): boolean {
  return isMuted;
}

/**
 * Set mute state explicitly.
 */
export function setMuted(muted: boolean): void {
  isMuted = muted;
  if (muted) stopAlarm();
}

/**
 * Check if alarm is currently active.
 */
export function isAlarmPlaying(): boolean {
  return isAlarmActive;
}
