/**
 * services/sync.ts — Multi-window sync over BroadcastChannel (architecture.md section 7).
 * Implements leader/follower election, snapshot broadcasting, and intent forwarding.
 *
 * Rules:
 * - Channel: 'sotorko-sync-v1'
 * - Leader sends heartbeats every 1s.
 * - Followers take over if heartbeats stop for 3s.
 * - Followers render from snapshots and send intents back to leader.
 */
import { useAppStore } from '../store/store';
import { useDemoClock } from './clock';
import type { Incident, IncidentLogEntry } from '../domain/types';

export const SYNC_CHANNEL_NAME = 'sotorko-sync-v1';
const HEARTBEAT_INTERVAL_MS = 1_000;
const LEADER_TIMEOUT_MS = 3_000;

export interface StateSnapshot {
  incidents: Incident[];
  auditLog: IncidentLogEntry[];
  activeScenarioId: string | null;
  demoStarted: boolean;
  clock: {
    isPlaying: boolean;
    speed: 1 | 5 | 10;
    elapsedMs: number;
    nowMs: number;
  };
}

export type SyncMessage =
  | { type: 'HEARTBEAT'; senderId: string; timestamp: number }
  | { type: 'CLAIM_LEADER'; senderId: string; timestamp: number }
  | { type: 'SNAPSHOT'; senderId: string; snapshot: StateSnapshot }
  | { type: 'INTENT'; senderId: string; intent: { type: string; payload?: any } };

let channel: BroadcastChannel | null = null;
let windowId = Math.random().toString(36).substring(2, 9);
let isCurrentLeader = false;
let lastLeaderHeartbeat = 0;
let leaderCheckTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export function getWindowId(): string {
  return windowId;
}

export function isLeader(): boolean {
  return isCurrentLeader;
}

export function setLeaderState(leader: boolean): void {
  isCurrentLeader = leader;
}

/**
 * Initialize sync service for this window.
 * @param preferredRole 'leader' | 'follower' | 'auto'
 */
export function initSync(preferredRole: 'leader' | 'follower' | 'auto' = 'auto'): () => void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => {};
  }

  if (!channel) {
    channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }

  lastLeaderHeartbeat = Date.now();

  if (preferredRole === 'leader') {
    becomeLeader();
  } else if (preferredRole === 'follower') {
    isCurrentLeader = false;
  } else {
    // Auto: try to see if a leader is alive
    isCurrentLeader = true; // assume leader until told otherwise
  }

  // Handle incoming messages
  channel.onmessage = (event: MessageEvent<SyncMessage>) => {
    const msg = event.data;
    if (!msg || msg.senderId === windowId) return;

    switch (msg.type) {
      case 'HEARTBEAT':
      case 'CLAIM_LEADER':
        lastLeaderHeartbeat = Date.now();
        if (isCurrentLeader && msg.type === 'CLAIM_LEADER') {
          // Break tie with senderId comparison
          if (msg.senderId < windowId) {
            stepDown();
          }
        } else if (isCurrentLeader && msg.type === 'HEARTBEAT') {
          // Another leader exists, yield if their ID is lower
          if (msg.senderId < windowId) {
            stepDown();
          }
        }
        break;

      case 'SNAPSHOT':
        lastLeaderHeartbeat = Date.now();
        if (!isCurrentLeader) {
          applySnapshot(msg.snapshot);
        }
        break;

      case 'INTENT':
        if (isCurrentLeader) {
          handleFollowerIntent(msg.intent);
        }
        break;
    }
  };

  // Check leader heartbeat every 500ms
  leaderCheckTimer = setInterval(() => {
    if (!isCurrentLeader) {
      if (Date.now() - lastLeaderHeartbeat > LEADER_TIMEOUT_MS) {
        console.log('[SOTORKO Sync] Leader heartbeat timed out. Taking over leadership.');
        becomeLeader();
      }
    }
  }, 500);

  // If leader, broadcast heartbeat and snapshots
  if (isCurrentLeader) {
    startLeaderLoop();
  }

  return () => {
    cleanupSync();
  };
}

function becomeLeader(): void {
  isCurrentLeader = true;
  lastLeaderHeartbeat = Date.now();
  broadcast({ type: 'CLAIM_LEADER', senderId: windowId, timestamp: Date.now() });
  startLeaderLoop();
  broadcastSnapshot();
}

function stepDown(): void {
  isCurrentLeader = false;
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startLeaderLoop(): void {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (isCurrentLeader) {
      broadcast({ type: 'HEARTBEAT', senderId: windowId, timestamp: Date.now() });
      broadcastSnapshot();
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function broadcast(msg: SyncMessage): void {
  if (channel) {
    try {
      channel.postMessage(msg);
    } catch {
      // Ignore serialization or channel errors
    }
  }
}

/**
 * Broadcast full store snapshot from leader to all follower windows.
 */
export function broadcastSnapshot(): void {
  if (!isCurrentLeader || !channel) return;

  const store = useAppStore.getState();
  const clock = useDemoClock.getState();

  const snapshot: StateSnapshot = {
    incidents: store.incidents,
    auditLog: store.auditLog,
    activeScenarioId: store.activeScenario?.id ?? null,
    demoStarted: store.demoStarted,
    clock: {
      isPlaying: clock.isPlaying,
      speed: clock.speed,
      elapsedMs: clock.elapsedMs,
      nowMs: clock.getNowMs(),
    },
  };

  broadcast({ type: 'SNAPSHOT', senderId: windowId, snapshot });
}

/**
 * Apply snapshot received from leader into local follower state.
 */
function applySnapshot(snapshot: StateSnapshot): void {
  const store = useAppStore.getState();
  const clock = useDemoClock.getState();

  // Sync scenario if different
  if (snapshot.activeScenarioId && (!store.activeScenario || store.activeScenario.id !== snapshot.activeScenarioId)) {
    store.selectScenario(snapshot.activeScenarioId);
  }

  // Sync incidents and audit log
  useAppStore.setState({
    incidents: snapshot.incidents,
    auditLog: snapshot.auditLog,
    demoStarted: snapshot.demoStarted,
  });

  // Sync clock state (drift correction)
  if (clock.isPlaying !== snapshot.clock.isPlaying) {
    if (snapshot.clock.isPlaying) clock.play();
    else clock.pause();
  }
  if (clock.speed !== snapshot.clock.speed) {
    clock.setSpeed(snapshot.clock.speed);
  }
}

/**
 * Send an intent from follower window to leader.
 */
export function sendIntent(intent: { type: string; payload?: any }): void {
  if (isCurrentLeader) {
    // If we are leader, handle it locally
    handleFollowerIntent(intent);
  } else {
    broadcast({ type: 'INTENT', senderId: windowId, intent });
  }
}

/**
 * Leader processes incoming follower intent.
 */
function handleFollowerIntent(intent: { type: string; payload?: any }): void {
  const store = useAppStore.getState();
  const clock = useDemoClock.getState();

  switch (intent.type) {
    case 'APPLY_ACTION':
      store.applyAction(intent.payload.incidentId, intent.payload.action);
      break;

    case 'PULL_NEXT':
      store.pullNextIncident();
      break;

    case 'SELECT_SCENARIO':
      store.selectScenario(intent.payload.scenarioId);
      break;

    case 'START_DEMO':
      store.startDemo();
      break;

    case 'RESET_DEMO':
      store.resetDemo();
      break;

    case 'CLOCK_PLAY':
      clock.play();
      break;

    case 'CLOCK_PAUSE':
      clock.pause();
      break;

    case 'CLOCK_TOGGLE':
      clock.togglePlayPause();
      break;

    case 'CLOCK_SET_SPEED':
      clock.setSpeed(intent.payload.speed);
      break;
  }

  // Broadcast immediate snapshot after processing intent
  broadcastSnapshot();
}

export function cleanupSync(): void {
  if (leaderCheckTimer) {
    clearInterval(leaderCheckTimer);
    leaderCheckTimer = null;
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (channel) {
    channel.close();
    channel = null;
  }
}
